import { Router, Request, Response } from 'express';
import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/workflows - Get all workflows for current tenant from multi_tenant_store.json
router.get('/workflows', async (req: Request, res: Response) => {
  try {
    const tenantId =
      (req as any).tenantId ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'default_tenant';
    const workflows = await multiTenantDb.getWorkflows(tenantId);
    res.json({ success: true, tenantId, workflows });
  } catch (err: any) {
    logger.error('Error fetching workflows:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/workflows - Save or update workflow in multi_tenant_store.json
router.post('/workflows', async (req: Request, res: Response) => {
  try {
    const tenantId =
      (req as any).tenantId ||
      (req.headers['x-tenant-id'] as string) ||
      req.body?.tenantId ||
      process.env.DEFAULT_TENANT_ID ||
      'default_tenant';
    const workflowData = { ...req.body, tenantId };
    const saved = await multiTenantDb.saveWorkflow(tenantId, workflowData);
    res.status(201).json({ success: true, tenantId, workflow: saved });
  } catch (err: any) {
    logger.error('Error saving workflow:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/workflows/:id/toggle - Toggle workflow status in multi_tenant_store.json
router.put('/workflows/:id/toggle', async (req: Request, res: Response) => {
  try {
    const tenantId =
      (req as any).tenantId ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'default_tenant';
    const updated = await multiTenantDb.toggleWorkflowStatus(tenantId, req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }
    res.json({ success: true, tenantId, workflow: updated });
  } catch (err: any) {
    logger.error('Error toggling workflow:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/workflows/:id - Delete workflow from multi_tenant_store.json
router.delete('/workflows/:id', async (req: Request, res: Response) => {
  try {
    const tenantId =
      (req as any).tenantId ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'default_tenant';
    const success = await multiTenantDb.deleteWorkflow(tenantId, req.params.id);
    res.json({ success, message: success ? 'Workflow deleted' : 'Workflow not found' });
  } catch (err: any) {
    logger.error('Error deleting workflow:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
