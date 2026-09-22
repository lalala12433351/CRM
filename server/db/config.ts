import { logger } from '../utils/logger';

export type DbConnConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean | { rejectUnauthorized: boolean };
};

/** Prefer AWS_RDS_* when host is set; otherwise local DB_* (Docker Compose). */
export function resolveDbConfig(databaseOverride?: string): DbConnConfig {
  const useRds = Boolean(process.env.AWS_RDS_HOST && String(process.env.AWS_RDS_HOST).trim());
  const host = useRds
    ? String(process.env.AWS_RDS_HOST).trim()
    : (process.env.DB_HOST || '127.0.0.1').trim();
  const port = Number(
    useRds ? process.env.AWS_RDS_PORT || 5432 : process.env.DB_PORT || 5432
  );
  const user = useRds
    ? (process.env.AWS_RDS_USER || process.env.DB_USER || 'postgres')
    : (process.env.DB_USER || 'postgres');
  const password = useRds
    ? (process.env.AWS_RDS_PASSWORD || process.env.DB_PASSWORD || 'postgres')
    : (process.env.DB_PASSWORD || 'postgres');
  const database =
    databaseOverride ||
    (useRds
      ? process.env.AWS_RDS_DATABASE || process.env.DB_NAME || 'postgres'
      : process.env.DB_NAME || 'postgres');
  const sslRaw = useRds
    ? (process.env.AWS_RDS_SSL || 'true')
    : (process.env.DB_SSL || 'false');
  const sslEnabled = String(sslRaw).toLowerCase() === 'true' || sslRaw === '1';

  return {
    host,
    port,
    user,
    password,
    database,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false
  };
}

export function isPostgresStoreEnabled(): boolean {
  const mode = (process.env.PIXBE_STORE || '').trim().toLowerCase();
  if (mode === 'json') return false;
  if (mode === 'postgres' || mode === 'sql') return true;
  // Default: use Postgres when a DB host is configured (Docker / Aurora path).
  return Boolean(
    (process.env.DB_HOST && process.env.DB_HOST.trim()) ||
      (process.env.AWS_RDS_HOST && process.env.AWS_RDS_HOST.trim())
  );
}

export const CONTROL_DB_NAME = (process.env.CONTROL_DB_NAME || 'pixbe_control').trim();
export const ADMIN_DB_NAME = (process.env.ADMIN_DB_NAME || process.env.DB_NAME || 'postgres').trim();

export function workspaceDbName(tenantId: string): string {
  const raw = String(tenantId || '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  const base = raw || 'tenant';
  const name = `pixbe_${base}`;
  if (name.length > 63) return name.slice(0, 63);
  return name;
}

export function logDbTarget(cfg: DbConnConfig, label: string) {
  logger.info(
    `[DB] ${label} -> ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database} ssl=${Boolean(cfg.ssl)}`
  );
}
