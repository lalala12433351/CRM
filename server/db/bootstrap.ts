import { isPostgresStoreEnabled, CONTROL_DB_NAME } from './config';
import { getAdminPool, migrateControlPlane, closeAllPools } from './tenantPool';
import { listControlTenants } from './provisionTenant';
import { logger } from '../utils/logger';

export type BootstrapResult = {
  enabled: boolean;
  controlDb: string;
  tenantCount: number;
  ok: boolean;
  error?: string;
};

export async function bootstrapPostgres(): Promise<BootstrapResult> {
  if (!isPostgresStoreEnabled()) {
    return { enabled: false, controlDb: CONTROL_DB_NAME, tenantCount: 0, ok: true };
  }

  try {
    const admin = getAdminPool();
    const ping = await admin.query('SELECT version() AS version');
    logger.info(`[DB] Connected: ${String(ping.rows[0]?.version || '').slice(0, 80)}`);
    await migrateControlPlane();
    const tenants = await listControlTenants();
    logger.info(`[DB] Bootstrap OK — ${CONTROL_DB_NAME} with ${tenants.length} tenant(s)`);
    return {
      enabled: true,
      controlDb: CONTROL_DB_NAME,
      tenantCount: tenants.length,
      ok: true
    };
  } catch (err: any) {
    const message = err?.message || String(err);
    logger.error('[DB] Bootstrap failed:', message);
    return {
      enabled: true,
      controlDb: CONTROL_DB_NAME,
      tenantCount: 0,
      ok: false,
      error: message
    };
  }
}

export { closeAllPools };
