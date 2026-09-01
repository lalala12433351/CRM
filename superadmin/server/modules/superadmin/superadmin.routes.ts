import { Router, Request, Response } from 'express';
import { superAdminService } from './superadmin.service';
import { testAwsDbConnection, getAwsDbTablesSummary, initializeAwsDbTables, getAwsClient } from '../../../src/lib/awsDb';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/superadmin/overview - Platform KPIs and Telemetry
router.get('/superadmin/overview', async (req: Request, res: Response) => {
  try {
    const stats = await superAdminService.getOverviewStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    logger.error('SuperAdmin overview error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/superadmin/tenants - Get All Tenants
router.get('/superadmin/tenants', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const plan = req.query.plan as string;

    const tenants = await superAdminService.getTenants({ search, status, plan });
    res.json({ success: true, count: tenants.length, tenants });
  } catch (err: any) {
    logger.error('SuperAdmin fetch tenants error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/superadmin/tenants - Provision a New Tenant
router.post('/superadmin/tenants', async (req: Request, res: Response) => {
  try {
    const { companyName, ownerName, ownerEmail, ownerPhone, businessType, planTier, currency } = req.body;
    if (!companyName || !ownerName || !ownerEmail) {
      return res.status(400).json({ success: false, error: 'Company name, owner name, and owner email are required.' });
    }

    const tenant = await superAdminService.provisionTenant({
      companyName,
      ownerName,
      ownerEmail,
      ownerPhone,
      businessType,
      planTier,
      currency
    });

    res.status(201).json({ success: true, tenant });
  } catch (err: any) {
    logger.error('SuperAdmin provision tenant error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/superadmin/tenants/:id - Update Tenant Status or Plan
router.put('/superadmin/tenants/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.id;
    const { status, planTier, companyName } = req.body;

    const updated = await superAdminService.updateTenant(tenantId, { status, planTier, companyName });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    res.json({ success: true, message: 'Tenant updated successfully' });
  } catch (err: any) {
    logger.error('SuperAdmin update tenant error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/superadmin/tenants/:id/impersonate - 1-Click Login As Tenant
router.post('/superadmin/tenants/:id/impersonate', async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.id;
    const session = await superAdminService.impersonateTenant(tenantId);
    res.json({ success: true, ...session });
  } catch (err: any) {
    logger.error('SuperAdmin impersonation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/superadmin/subscriptions - Plan Tiers & Subscriptions Ledger
router.get('/superadmin/subscriptions', async (req: Request, res: Response) => {
  try {
    const subscriptions = await superAdminService.getSubscriptions();
    res.json({ success: true, count: subscriptions.length, subscriptions });
  } catch (err: any) {
    logger.error('SuperAdmin fetch subscriptions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/superadmin/users - Cross-Tenant Users & Telecallers
router.get('/superadmin/users', async (req: Request, res: Response) => {
  try {
    const users = await superAdminService.getAllUsers();
    res.json({ success: true, count: users.length, users });
  } catch (err: any) {
    logger.error('SuperAdmin fetch users error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/superadmin/database - Aurora RDS Telemetry & Table Summaries
router.get('/superadmin/database', async (req: Request, res: Response) => {
  try {
    const dbTest = await testAwsDbConnection();
    const tablesSummary = await getAwsDbTablesSummary();
    res.json({ success: true, connection: dbTest, tables: tablesSummary });
  } catch (err: any) {
    logger.error('SuperAdmin database inspection error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/superadmin/database/migrate - Trigger Database Schema Validation
router.post('/superadmin/database/migrate', async (req: Request, res: Response) => {
  try {
    await initializeAwsDbTables();
    superAdminService.recordAuditLog({
      action: 'DATABASE_MIGRATION',
      details: { trigger: 'SuperAdmin UI Manual Migrate' }
    });
    res.json({ success: true, message: 'AWS Aurora RDS database tables verified and migrated successfully.' });
  } catch (err: any) {
    logger.error('SuperAdmin database migrate error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/superadmin/ai-quotas - AI Token & Minutes Usage
router.get('/superadmin/ai-quotas', async (req: Request, res: Response) => {
  try {
    const quotas = await superAdminService.getAiQuotas();
    res.json({ success: true, count: quotas.length, quotas });
  } catch (err: any) {
    logger.error('SuperAdmin fetch AI quotas error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/superadmin/audit-logs - System Security & Audit Stream
router.get('/superadmin/audit-logs', (req: Request, res: Response) => {
  try {
    const logs = superAdminService.getAuditLogs();
    res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    logger.error('SuperAdmin fetch audit logs error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/superadmin/meta-pages - Cross-Tenant Meta Pages
router.get('/superadmin/meta-pages', async (req: Request, res: Response) => {
  try {
    let pages: any[] = [];
    const pool = await getAwsClient();
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM meta_connected_pages ORDER BY created_at DESC LIMIT 50');
    pages = result.rows;
    client.release();
    await pool.end();
    res.json({ success: true, count: pages.length, pages });
  } catch (err: any) {
    // Non-blocking fallback
    res.json({ success: true, count: 0, pages: [] });
  }
});

export default router;
