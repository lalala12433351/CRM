import { Router, Request, Response } from 'express';
import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { requireAuthenticated } from '../../middleware/rbac';
import { getAccessScope } from '../../utils/accessScope';
import { filterCallsForScope } from '../reports/reports.service';

const router = Router();

function tenantIdOf(req: Request): string {
  return (
    (req as AuthenticatedRequest).tenantId ||
    (req.headers['x-tenant-id'] as string) ||
    (req as any).body?.tenantId ||
    process.env.DEFAULT_TENANT_ID ||
    'default_tenant'
  );
}

// GET /api/calls - Role-scoped call records for the current tenant
router.get('/calls', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = tenantIdOf(req);
    const [calls, agents] = await Promise.all([
      multiTenantDb.getCalls(tenantId),
      multiTenantDb.getAgents(tenantId)
    ]);
    const scope = await getAccessScope(authReq);
    const visible = filterCallsForScope(calls, agents, scope);
    res.json({ success: true, tenantId, calls: visible });
  } catch (err: any) {
    logger.error('Error fetching calls:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calls - Log new call record for current tenant
router.post('/calls', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const callData = { ...req.body, tenantId };
    const saved = await multiTenantDb.saveCall(tenantId, callData);
    
    // Trigger active workflows for Call Log
    try {
      const { workflowEngine } = await import('../../services/workflowEngine');
      const leads = await multiTenantDb.getLeads(tenantId, [], true);
      const matchedLead = leads.find((l) => l.id === callData.leadId || l.phone === callData.phoneNumber || l.name === callData.leadName);
      await workflowEngine.triggerWorkflowsForEvent(tenantId, 'call_logged', { call: saved, lead: matchedLead });
    } catch (wfErr: any) {
      logger.warn('[Calls Route] Workflow trigger notice:', wfErr?.message);
    }

    res.status(201).json({ success: true, tenantId, call: saved });
  } catch (err: any) {
    logger.error('Error creating call:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/calls/:id - Update call record
router.put('/calls/:id', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const callData = { ...req.body, id: req.params.id, tenantId };
    const saved = await multiTenantDb.saveCall(tenantId, callData);
    res.json({ success: true, tenantId, call: saved });
  } catch (err: any) {
    logger.error('Error updating call:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/calls/:id - Delete call record
router.delete('/calls/:id', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const success = await multiTenantDb.deleteCall(tenantId, req.params.id);
    res.json({ success, message: success ? 'Call record deleted' : 'Call record not found' });
  } catch (err: any) {
    logger.error('Error deleting call:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
