import { Router, Request, Response } from 'express';
import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/tasks - Get all tasks for current tenant
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const tasks = await multiTenantDb.getTasks(tenantId);
    res.json({ success: true, tenantId, tasks });
  } catch (err: any) {
    logger.error('Error fetching tasks:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tasks - Create task for current tenant
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || req.body?.tenantId || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const taskData = { ...req.body, tenantId };
    const saved = await multiTenantDb.saveTask(tenantId, taskData);
    res.status(201).json({ success: true, tenantId, task: saved });
  } catch (err: any) {
    logger.error('Error creating task:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/tasks/:id - Update task for current tenant
router.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const taskData = { ...req.body, id: req.params.id, tenantId };
    const saved = await multiTenantDb.saveTask(tenantId, taskData);
    res.json({ success: true, tenantId, task: saved });
  } catch (err: any) {
    logger.error('Error updating task:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tasks/:id - Delete task for current tenant
router.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const success = await multiTenantDb.deleteTask(tenantId, req.params.id);
    res.json({ success, message: success ? 'Task deleted' : 'Task not found' });
  } catch (err: any) {
    logger.error('Error deleting task:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
