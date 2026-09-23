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
    const useRds = Boolean(process.env.AWS_RDS_HOST && String(process.env.AWS_RDS_HOST).trim());
    if (useRds && /ECONNREFUSED|ETIMEDOUT|timeout|ENOTFOUND/i.test(message)) {
      logger.error(
        '[DB] AWS RDS is unreachable from this machine. In AWS Console → RDS → your instance → ' +
          'Connectivity: ensure Public access is Yes (if connecting from local Docker), then open the ' +
          'VPC security group inbound rule for TCP 5432 from your current public IP (/32).'
      );
    }
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
