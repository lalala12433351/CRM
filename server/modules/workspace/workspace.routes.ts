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
