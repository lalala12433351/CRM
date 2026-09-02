import { Router, Request, Response } from 'express';
import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/calls - Get all logged calls for current tenant
router.get('/calls', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const calls = await multiTenantDb.getCalls(tenantId);
    res.json({ success: true, tenantId, calls });
  } catch (err: any) {
    logger.error('Error fetching calls:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calls - Log new call record for current tenant
router.post('/calls', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || req.body?.tenantId || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const callData = { ...req.body, tenantId };
    const saved = await multiTenantDb.saveCall(tenantId, callData);
    res.status(201).json({ success: true, tenantId, call: saved });
  } catch (err: any) {
    logger.error('Error creating call:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/calls/:id - Update call record
router.put('/calls/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const callData = { ...req.body, id: req.params.id, tenantId };
    const saved = await multiTenantDb.saveCall(tenantId, callData);
    res.json({ success: true, tenantId, call: saved });
  } catch (err: any) {
    logger.error('Error updating call:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/calls/:id - Delete call record
router.delete('/calls/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const success = await multiTenantDb.deleteCall(tenantId, req.params.id);
    res.json({ success, message: success ? 'Call record deleted' : 'Call record not found' });
  } catch (err: any) {
    logger.error('Error deleting call:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
