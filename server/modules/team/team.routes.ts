import { Router, Request, Response } from 'express';
import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/agents - Get all agents for current tenant
router.get('/agents', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const agents = await multiTenantDb.getAgents(tenantId);
    res.json({ success: true, tenantId, agents });
  } catch (err: any) {
    logger.error('Error fetching agents:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agents - Create a new agent for current tenant
router.post('/agents', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || req.body?.tenantId || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const agentData = { ...req.body, tenantId };
    const saved = await multiTenantDb.saveAgent(tenantId, agentData);
    res.status(201).json({ success: true, tenantId, agent: saved });
  } catch (err: any) {
    logger.error('Error creating agent:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/agents/:id - Update an existing agent for current tenant
router.put('/agents/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const agentData = { ...req.body, id: req.params.id, tenantId };
    const saved = await multiTenantDb.saveAgent(tenantId, agentData);
    res.json({ success: true, tenantId, agent: saved });
  } catch (err: any) {
    logger.error('Error updating agent:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/agents/:id - Remove an agent from current tenant
router.delete('/agents/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const success = await multiTenantDb.deleteAgent(tenantId, req.params.id);
    res.json({ success, message: success ? 'Agent removed' : 'Agent not found' });
  } catch (err: any) {
    logger.error('Error deleting agent:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
