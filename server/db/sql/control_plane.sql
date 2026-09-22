-- pixbe_control: shared directory / memberships / API keys / routing
-- Run against database pixbe_control

CREATE TABLE IF NOT EXISTS tenants (
  tenant_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  db_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tenants_owner_email_idx
  ON tenants (lower(owner_email));

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Telecaller',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  cognito_sub TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email),
  UNIQUE (tenant_id, agent_id)
);

CREATE INDEX IF NOT EXISTS memberships_email_idx
  ON memberships (lower(email));

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS cognito_sub TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS memberships_cognito_sub_tenant_uidx
  ON memberships (cognito_sub, tenant_id)
  WHERE cognito_sub IS NOT NULL;

CREATE INDEX IF NOT EXISTS memberships_cognito_sub_idx
  ON memberships (cognito_sub);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name TEXT,
  key_prefix TEXT,
  key_hash TEXT NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_keys_tenant_idx ON api_keys (tenant_id);

CREATE TABLE IF NOT EXISTS tenant_routing (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  db_name TEXT NOT NULL,
  region TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cross-tenant Meta page → workspace lookup (webhooks)
CREATE TABLE IF NOT EXISTS facebook_page_index (
  page_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
