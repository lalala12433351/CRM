/**
 * Import multi_tenant_store.json into pixbe_control + per-workspace Postgres DBs.
 *
 * Usage:
 *   npx tsx scripts/import_json_to_postgres.ts
 *   npx tsx scripts/import_json_to_postgres.ts --store path/to/multi_tenant_store.json
 *
 * Requires local Postgres (docker compose up db) with DB_* env vars.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { bootstrapPostgres, closeAllPools } from '../server/db/bootstrap';
import { provisionTenant, upsertMembership, upsertFacebookPageIndex } from '../server/db/provisionTenant';
import { persistWorkspaceSlice } from '../server/db/workspaceStore';
import { workspaceDbName } from '../server/db/config';

function resolveStorePath(argv: string[]): string {
  const idx = argv.indexOf('--store');
  if (idx >= 0 && argv[idx + 1]) return path.resolve(argv[idx + 1]);
  const candidates = [
    process.env.PIXBE_DATA_DIR
      ? path.join(process.env.PIXBE_DATA_DIR, 'multi_tenant_store.json')
      : '',
    path.join(process.cwd(), '.data', 'multi_tenant_store.json'),
    path.join(process.env.LOCALAPPDATA || '', 'PixbeCrm', 'data', 'multi_tenant_store.json'),
    path.join(process.cwd(), 'data-seed', 'multi_tenant_store.json'),
    path.join(process.cwd(), 'dist', '.data', 'multi_tenant_store.json')
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    'No multi_tenant_store.json found. Pass --store <path> or set PIXBE_DATA_DIR.'
  );
}

async function main() {
  process.env.PIXBE_STORE = process.env.PIXBE_STORE || 'postgres';
  if (!process.env.DB_HOST) process.env.DB_HOST = '127.0.0.1';

  const storePath = resolveStorePath(process.argv.slice(2));
  console.log(`[import] Reading ${storePath}`);
  const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const boot = await bootstrapPostgres();
  if (!boot.ok) {
    throw new Error(`Postgres bootstrap failed: ${boot.error}`);
  }

  const tenants: Record<string, any> = parsed.tenants || {};
  const tenantIds = Object.keys(tenants);
  if (!tenantIds.length) {
    console.log('[import] No tenants in JSON store — nothing to import.');
    return;
  }

  for (const tenantId of tenantIds) {
    const tenant = tenants[tenantId];
    const agents: any[] = parsed.agents?.[tenantId] || [];
    const admin =
      agents.find((a) => a.isAdmin || String(a.role || '').toLowerCase().includes('admin')) ||
      agents[0];
    const adminAgentId = admin?.id || `agent_${tenantId}_admin`;
    const ownerEmail = tenant.ownerEmail || admin?.email || `owner@${tenantId}.local`;

    console.log(`[import] Provisioning ${tenantId} -> ${workspaceDbName(tenantId)}`);
    await provisionTenant({
      tenantId,
      companyName: tenant.companyName || tenantId,
      ownerEmail,
      ownerPhone: tenant.ownerPhone || admin?.phone || '',
      adminName: admin?.name || 'Admin',
      adminAgentId,
      role: admin?.role || 'Admin',
      tenantPayload: tenant,
      agentPayload: admin || {}
    });

    for (const agent of agents) {
      if (!agent?.email || !agent?.id) continue;
      // Skip re-upserting the same admin row provisionTenant already wrote under a different email.
      await upsertMembership({
        tenantId,
        email: agent.email,
        agentId: agent.id,
        role: agent.role || 'Telecaller',
        isAdmin: Boolean(agent.isAdmin),
        payload: { name: agent.name, phone: agent.phone }
      });
    }

    const pages: any[] = parsed.facebookPages?.[tenantId] || [];
    for (const page of pages) {
      if (page?.pageId) await upsertFacebookPageIndex(String(page.pageId), tenantId);
    }

    await persistWorkspaceSlice(tenantId, {
      agents,
      leads: parsed.leads?.[tenantId] || [],
      stages: parsed.stages?.[tenantId] || [],
      fields: parsed.fields?.[tenantId] || [],
      tasks: parsed.tasks?.[tenantId] || [],
      calls: parsed.calls?.[tenantId] || [],
      integrations: parsed.integrations?.[tenantId] || [],
      facebookPages: pages,
      activities: parsed.activities?.[tenantId] || [],
      lostReasons: parsed.lostReasons?.[tenantId] || [],
      workflows: parsed.workflows?.[tenantId] || [],
      templates: parsed.templates?.[tenantId] || [],
      actions: parsed.actions?.[tenantId] || [],
      campaigns: parsed.campaigns?.[tenantId] || [],
      messages: parsed.messages?.[tenantId] || [],
      whatsappTemplates: parsed.whatsappTemplates?.[tenantId] || [],
      whatsappCampaigns: parsed.whatsappCampaigns?.[tenantId] || []
    });

    console.log(
      `[import] OK ${tenantId}: agents=${agents.length} leads=${(parsed.leads?.[tenantId] || []).length}`
    );
  }

  console.log(`[import] Done — ${tenantIds.length} workspace DB(s) imported.`);
}

main()
  .catch((err) => {
    console.error('[import] Failed:', err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeAllPools();
  });
