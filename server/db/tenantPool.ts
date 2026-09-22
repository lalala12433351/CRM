import pg, { Pool, PoolClient } from 'pg';
import {
  ADMIN_DB_NAME,
  CONTROL_DB_NAME,
  logDbTarget,
  resolveDbConfig,
  workspaceDbName
} from './config';
import { CONTROL_PLANE_SQL, WORKSPACE_SQL } from './sql/schemas';
import { logger } from '../utils/logger';

const { Pool: PgPool } = pg;

function makePool(database: string): Pool {
  const cfg = resolveDbConfig(database);
  return new PgPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    ssl: cfg.ssl,
    max: 10,
    idleTimeoutMillis: 30_000
  });
}

let adminPool: Pool | null = null;
let controlPool: Pool | null = null;
const tenantPools = new Map<string, Pool>();

export function getAdminPool(): Pool {
  if (!adminPool) {
    const cfg = resolveDbConfig(ADMIN_DB_NAME);
    logDbTarget(cfg, 'admin');
    adminPool = makePool(ADMIN_DB_NAME);
  }
  return adminPool;
}

export async function ensureDatabaseExists(dbName: string): Promise<void> {
  const pool = getAdminPool();
  const safe = dbName.replace(/[^a-zA-Z0-9_]/g, '');
  if (!safe || safe !== dbName) {
    throw new Error(`Invalid database name: ${dbName}`);
  }
  const exists = await pool.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
  if (exists.rowCount && exists.rowCount > 0) return;
  await pool.query(`CREATE DATABASE ${safe}`);
  logger.info(`[DB] Created database ${safe}`);
}

export async function getControlPool(): Promise<Pool> {
  if (controlPool) return controlPool;
  await ensureDatabaseExists(CONTROL_DB_NAME);
  controlPool = makePool(CONTROL_DB_NAME);
  logDbTarget(resolveDbConfig(CONTROL_DB_NAME), 'control');
  return controlPool;
}

export async function migrateControlPlane(): Promise<void> {
  const pool = await getControlPool();
  await pool.query(CONTROL_PLANE_SQL);
  logger.info('[DB] Control plane migrations applied');
}

export async function migrateWorkspaceDb(dbName: string): Promise<void> {
  const pool = makePool(dbName);
  try {
    await pool.query(WORKSPACE_SQL);
  } finally {
    await pool.end().catch(() => undefined);
  }
}

export async function getTenantPool(tenantId: string, dbName?: string): Promise<Pool> {
  const name = dbName || workspaceDbName(tenantId);
  const existing = tenantPools.get(name);
  if (existing) return existing;
  await ensureDatabaseExists(name);
  await migrateWorkspaceDb(name);
  const pool = makePool(name);
  tenantPools.set(name, pool);
  return pool;
}

export async function withTenantClient<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>,
  dbName?: string
): Promise<T> {
  const pool = await getTenantPool(tenantId, dbName);
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function closeAllPools(): Promise<void> {
  const pools = [adminPool, controlPool, ...tenantPools.values()].filter(Boolean) as Pool[];
  adminPool = null;
  controlPool = null;
  tenantPools.clear();
  await Promise.all(pools.map((p) => p.end().catch(() => undefined)));
}

export { workspaceDbName, CONTROL_DB_NAME };
