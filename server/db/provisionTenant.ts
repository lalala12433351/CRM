import { getControlPool, getTenantPool, workspaceDbName } from './tenantPool';
import { logger } from '../utils/logger';

export type ProvisionTenantInput = {
  tenantId: string;
  companyName: string;
  ownerEmail: string;
  ownerPhone?: string;
  adminName: string;
  adminAgentId: string;
  role?: string;
  cognitoSub?: string;
  tenantPayload: Record<string, any>;
  agentPayload: Record<string, any>;
};

export type ControlMembership = {
  id: string;
  tenantId: string;
  email: string;
  agentId: string;
  role: string;
  isAdmin: boolean;
  cognitoSub?: string | null;
  payload: any;
};

export async function provisionTenant(input: ProvisionTenantInput): Promise<{ dbName: string }> {
  const dbName = workspaceDbName(input.tenantId);
  const control = await getControlPool();
  const now = new Date().toISOString();

  await control.query(
    `INSERT INTO tenants (tenant_id, company_name, owner_email, db_name, status, payload, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::timestamptz, $8::timestamptz)
     ON CONFLICT (tenant_id) DO UPDATE SET
       company_name = EXCLUDED.company_name,
       owner_email = EXCLUDED.owner_email,
       db_name = EXCLUDED.db_name,
       status = EXCLUDED.status,
       payload = EXCLUDED.payload,
       updated_at = EXCLUDED.updated_at`,
    [
      input.tenantId,
      input.companyName,
      input.ownerEmail,
      dbName,
      input.tenantPayload.status || 'ACTIVE',
      JSON.stringify(input.tenantPayload),
      input.tenantPayload.createdAt || now,
      now
    ]
  );

  await control.query(
    `INSERT INTO tenant_routing (tenant_id, db_name, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (tenant_id) DO UPDATE SET db_name = EXCLUDED.db_name, updated_at = NOW()`,
    [input.tenantId, dbName]
  );

  const membershipId = `mem_${input.tenantId}_${input.adminAgentId}`;
  const role = input.role || 'Admin';
  await control.query(
    `INSERT INTO memberships (id, tenant_id, email, agent_id, role, is_admin, cognito_sub, payload, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       agent_id = EXCLUDED.agent_id,
       role = EXCLUDED.role,
       is_admin = EXCLUDED.is_admin,
       cognito_sub = COALESCE(EXCLUDED.cognito_sub, memberships.cognito_sub),
       payload = EXCLUDED.payload`,
    [
      membershipId,
      input.tenantId,
      String(input.ownerEmail || '').toLowerCase().trim(),
      input.adminAgentId,
      role,
      true,
      input.cognitoSub || null,
      JSON.stringify({ name: input.adminName, phone: input.ownerPhone || '' })
    ]
  );

  // Ensure workspace DB + schema exist
  await getTenantPool(input.tenantId, dbName);

  logger.info(
    `[DB] Provisioned tenant ${input.tenantId} -> ${dbName} (membership ${input.ownerEmail} / ${role})`
  );
  return { dbName };
}

export async function upsertMembership(opts: {
  tenantId: string;
  email: string;
  agentId: string;
  role: string;
  isAdmin: boolean;
  cognitoSub?: string;
  payload?: Record<string, any>;
}): Promise<void> {
  const control = await getControlPool();
  const email = String(opts.email || '').toLowerCase().trim();
  if (!email) return;
  const id = `mem_${opts.tenantId}_${opts.agentId}`;
  await control.query(
    `INSERT INTO memberships (id, tenant_id, email, agent_id, role, is_admin, cognito_sub, payload, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       agent_id = EXCLUDED.agent_id,
       role = EXCLUDED.role,
       is_admin = EXCLUDED.is_admin,
       cognito_sub = COALESCE(EXCLUDED.cognito_sub, memberships.cognito_sub),
       payload = EXCLUDED.payload`,
    [
      id,
      opts.tenantId,
      email,
      opts.agentId,
      opts.role,
      opts.isAdmin,
      opts.cognitoSub || null,
      JSON.stringify(opts.payload || {})
    ]
  );
}

function mapMembershipRow(r: any): ControlMembership {
  return {
    id: r.id as string,
    tenantId: r.tenant_id as string,
    email: r.email as string,
    agentId: r.agent_id as string,
    role: r.role as string,
    isAdmin: Boolean(r.is_admin),
    cognitoSub: r.cognito_sub || null,
    payload: r.payload
  };
}

export async function findMembershipsByCognitoSub(sub: string): Promise<ControlMembership[]> {
  const clean = String(sub || '').trim();
  if (!clean) return [];
  const control = await getControlPool();
  const res = await control.query(
    `SELECT id, tenant_id, email, agent_id, role, is_admin, cognito_sub, payload
     FROM memberships WHERE cognito_sub = $1 ORDER BY created_at ASC`,
    [clean]
  );
  return res.rows.map(mapMembershipRow);
}

export async function findMembershipsByEmail(email: string): Promise<ControlMembership[]> {
  const clean = String(email || '').toLowerCase().trim();
  if (!clean) return [];
  const control = await getControlPool();
  const res = await control.query(
    `SELECT id, tenant_id, email, agent_id, role, is_admin, cognito_sub, payload
     FROM memberships WHERE lower(email) = $1 ORDER BY created_at ASC`,
    [clean]
  );
  return res.rows.map(mapMembershipRow);
}

export async function findClusterIdentityConflict(
  email: string,
  phone?: string
): Promise<{ field: 'email' | 'phone'; tenantId: string } | null> {
  const cleanEmail = String(email || '').toLowerCase().trim();
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
  if (!cleanEmail && cleanPhone.length !== 10) return null;

  const control = await getControlPool();
  const res = await control.query(
    `SELECT tenant_id,
            CASE WHEN lower(email) = $1 THEN 'email' ELSE 'phone' END AS conflict_field
       FROM memberships
      WHERE ($1 <> '' AND lower(email) = $1)
         OR (
           length($2) = 10
           AND right(regexp_replace(COALESCE(payload->>'phone', ''), '[^0-9]', '', 'g'), 10) = $2
         )
      ORDER BY CASE WHEN lower(email) = $1 THEN 0 ELSE 1 END, created_at ASC
      LIMIT 1`,
    [cleanEmail, cleanPhone]
  );

  if (!res.rows.length) return null;
  return {
    field: res.rows[0].conflict_field === 'email' ? 'email' : 'phone',
    tenantId: String(res.rows[0].tenant_id)
  };
}

export async function bindCognitoSubToMembership(opts: {
  tenantId: string;
  email: string;
  cognitoSub: string;
}): Promise<void> {
  const control = await getControlPool();
  await control.query(
    `UPDATE memberships SET cognito_sub = $1
     WHERE tenant_id = $2 AND lower(email) = $3`,
    [opts.cognitoSub, opts.tenantId, opts.email.toLowerCase().trim()]
  );
}

export async function deleteMembership(tenantId: string, agentId: string): Promise<void> {
  const control = await getControlPool();
  await control.query(`DELETE FROM memberships WHERE tenant_id = $1 AND agent_id = $2`, [
    tenantId,
    agentId
  ]);
}

export async function upsertFacebookPageIndex(pageId: string, tenantId: string): Promise<void> {
  if (!pageId || !tenantId) return;
  const control = await getControlPool();
  await control.query(
    `INSERT INTO facebook_page_index (page_id, tenant_id, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (page_id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, updated_at = NOW()`,
    [pageId, tenantId]
  );
}

export async function deleteFacebookPageIndex(pageId: string): Promise<void> {
  if (!pageId) return;
  const control = await getControlPool();
  await control.query(`DELETE FROM facebook_page_index WHERE page_id = $1`, [pageId]);
}

export async function listControlTenants(): Promise<
  Array<{ tenantId: string; dbName: string; payload: any }>
> {
  const control = await getControlPool();
  const res = await control.query(
    `SELECT tenant_id, db_name, payload FROM tenants ORDER BY created_at ASC`
  );
  return res.rows.map((r) => ({
    tenantId: r.tenant_id as string,
    dbName: r.db_name as string,
    payload: r.payload
  }));
}
