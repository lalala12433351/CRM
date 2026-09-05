import { Router, Request, Response } from 'express';
import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/actions - Retrieve all workflow actions for tenant
router.get('/actions', async (req: Request, res: Response) => {
  try {
    const tenantId =
      (req as any).tenantId ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'default_tenant';

    const actionType = req.query.actionType as string | undefined;
    const actions = await multiTenantDb.getActions(tenantId, actionType);
    res.json({ success: true, tenantId, actions });
  } catch (err: any) {
    logger.error('Error fetching actions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/actions - Create or update an action in database table actions
router.post('/actions', async (req: Request, res: Response) => {
  try {
    const tenantId =
      (req as any).tenantId ||
      (req.headers['x-tenant-id'] as string) ||
      req.body?.tenantId ||
      process.env.DEFAULT_TENANT_ID ||
      'default_tenant';

    const actionData = { ...req.body, tenantId };
    const saved = await multiTenantDb.saveAction(tenantId, actionData);
    res.status(201).json({ success: true, tenantId, action: saved });
  } catch (err: any) {
    logger.error('Error saving action:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/actions/:id - Delete action from database
router.delete('/actions/:id', async (req: Request, res: Response) => {
  try {
    const tenantId =
      (req as any).tenantId ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'default_tenant';

    const success = await multiTenantDb.deleteAction(tenantId, req.params.id);
    res.json({ success, message: success ? 'Action deleted successfully' : 'Action not found' });
  } catch (err: any) {
    logger.error('Error deleting action:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
