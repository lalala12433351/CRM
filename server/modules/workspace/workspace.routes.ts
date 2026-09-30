import { Router, Request, Response } from 'express';
import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';
import { requireAdmin, requireAuthenticated } from '../../middleware/rbac';

const router = Router();

function tenantIdOf(req: Request): string {
  return (
    (req as any).tenantId ||
    (req.headers['x-tenant-id'] as string) ||
    (req.body?.tenantId as string) ||
    process.env.DEFAULT_TENANT_ID ||
    'default_tenant'
  );
}

// GET /api/workspace/webhook-secrets — per-workspace inbound keys (created on first read)
router.get('/workspace/webhook-secrets', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const leadSecret = await multiTenantDb.ensureLeadWebhookSecret(tenantId);
    const googleAdsKey = await multiTenantDb.ensureGoogleAdsWebhookKey(tenantId);
    res.json({
      success: true,
      tenantId,
      leadSecret,
      leadWebhookPath: `/api/webhooks/lead/${leadSecret}`,
      googleAdsKey,
      googleAdsWebhookPath: '/api/webhooks/google-ads',
      headerName: 'X-Webhook-Secret'
    });
  } catch (err: any) {
    const missing = String(err?.message || '').toLowerCase().includes('not found');
    logger.error('Error loading webhook secrets:', err);
    res.status(missing ? 404 : 500).json({ success: false, error: err.message });
  }
});

// GET /api/workspace/settings
router.get('/workspace/settings', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const settings = await multiTenantDb.getWorkspaceSettings(tenantId);
    res.json({ success: true, tenantId, settings });
  } catch (err: any) {
    logger.error('Error fetching workspace settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/workspace/settings — merge partial settings into tenant store
router.put('/workspace/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const saved = await multiTenantDb.saveWorkspaceSettings(tenantId, req.body || {});
    res.json({ success: true, tenantId, settings: saved });
  } catch (err: any) {
    logger.error('Error saving workspace settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
