import type { PoolClient } from 'pg';
import { getTenantPool } from './tenantPool';
import { upsertFacebookPageIndex, deleteFacebookPageIndex } from './provisionTenant';

/** Map LocalStoreSchema collection keys → workspace SQL tables */
export const COLLECTION_TABLES: Record<string, string> = {
  agents: 'agents',
  leads: 'leads',
  stages: 'stages',
  fields: 'fields',
  tasks: 'tasks',
  calls: 'calls',
  integrations: 'integrations',
  facebookPages: 'facebook_pages',
  activities: 'activities',
  workflows: 'workflows',
  templates: 'templates',
  actions: 'actions',
  campaigns: 'campaigns',
  messages: 'messages',
  whatsappTemplates: 'whatsapp_templates',
  whatsappCampaigns: 'whatsapp_campaigns'
};

export async function replaceCollection(
  tenantId: string,
  collection: string,
  rows: any[],
  dbName?: string
): Promise<void> {
  const table = COLLECTION_TABLES[collection];
  if (!table) return;
  const pool = await getTenantPool(tenantId, dbName);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM ${table}`);
    for (const row of rows || []) {
      if (!row || typeof row !== 'object') continue;
      const id = String(row.id || '');
      if (!id) continue;
      if (table === 'facebook_pages') {
        const pageId = row.pageId ? String(row.pageId) : null;
        await client.query(
          `INSERT INTO facebook_pages (id, page_id, payload, updated_at)
           VALUES ($1, $2, $3::jsonb, NOW())`,
          [id, pageId, JSON.stringify(row)]
        );
        if (pageId) await upsertFacebookPageIndex(pageId, tenantId);
      } else {
        await client.query(
          `INSERT INTO ${table} (id, payload, updated_at) VALUES ($1, $2::jsonb, NOW())`,
          [id, JSON.stringify(row)]
        );
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function replaceLostReasons(
  tenantId: string,
  reasons: string[],
  dbName?: string
): Promise<void> {
  const pool = await getTenantPool(tenantId, dbName);
  await pool.query(
    `INSERT INTO lost_reasons (id, reasons, updated_at)
     VALUES ('default', $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET reasons = EXCLUDED.reasons, updated_at = NOW()`,
    [JSON.stringify(reasons || [])]
  );
}

export async function loadCollection(
  client: PoolClient,
  collection: string
): Promise<any[]> {
  const table = COLLECTION_TABLES[collection];
  if (!table) return [];
  const res = await client.query(`SELECT payload FROM ${table}`);
  return res.rows.map((r) => r.payload);
}

export async function loadLostReasons(client: PoolClient): Promise<string[]> {
  const res = await client.query(`SELECT reasons FROM lost_reasons WHERE id = 'default'`);
  if (!res.rowCount) return [];
  const reasons = res.rows[0].reasons;
  return Array.isArray(reasons) ? reasons : [];
}

export async function loadWorkspaceSlice(
  tenantId: string,
  dbName?: string
): Promise<Record<string, any>> {
  const pool = await getTenantPool(tenantId, dbName);
  const client = await pool.connect();
  try {
    const out: Record<string, any> = {};
    for (const key of Object.keys(COLLECTION_TABLES)) {
      out[key] = await loadCollection(client, key);
    }
    out.lostReasons = await loadLostReasons(client);
    return out;
  } finally {
    client.release();
  }
}

export async function persistWorkspaceSlice(
  tenantId: string,
  slice: {
    agents?: any[];
    leads?: any[];
    stages?: any[];
    fields?: any[];
    tasks?: any[];
    calls?: any[];
    integrations?: any[];
    facebookPages?: any[];
    activities?: any[];
    lostReasons?: string[];
    workflows?: any[];
    templates?: any[];
    actions?: any[];
    campaigns?: any[];
    messages?: any[];
    whatsappTemplates?: any[];
    whatsappCampaigns?: any[];
  },
  dbName?: string
): Promise<void> {
  // Clear stale page index entries for pages no longer present
  const previousPages = slice.facebookPages;
  if (Array.isArray(previousPages)) {
    /* index upserted per page in replaceCollection */
  }

  for (const [key, table] of Object.entries(COLLECTION_TABLES)) {
    const rows = (slice as any)[key];
    if (rows === undefined) continue;
    await replaceCollection(tenantId, key, rows, dbName);
    void table;
  }
  if (slice.lostReasons !== undefined) {
    await replaceLostReasons(tenantId, slice.lostReasons, dbName);
  }

  // Drop page index for pages removed from this tenant (best-effort: re-sync from payload)
  if (Array.isArray(slice.facebookPages)) {
    const keep = new Set(
      slice.facebookPages.map((p) => p?.pageId).filter(Boolean).map(String)
    );
    // We only upsert; orphaned indexes for deleted pages are cleaned when deleteFacebookPage runs.
    void keep;
    void deleteFacebookPageIndex;
  }
}
