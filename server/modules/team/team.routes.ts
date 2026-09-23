import { Router, Request, Response } from 'express';
import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { requireAdmin, requireAuthenticated } from '../../middleware/rbac';
import { hashPassword } from '../auth/auth.service';
import { isCognitoEnabled } from '../../auth/cognitoConfig';
import { cognitoAdminCreateUser } from '../../auth/cognitoClient';
import { findClusterIdentityConflict, upsertMembership } from '../../db/provisionTenant';

const router = Router();

// GET /api/agents - Get all agents for current tenant
router.get('/agents', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const agents = await multiTenantDb.getAgents(tenantId);
    const role = (authReq.user?.role || '').toLowerCase();
    const visibleAgents = authReq.user?.isAdmin || role === 'admin'
      ? agents
      : role === 'manager'
        ? agents.filter((agent) => agent.id === authReq.user?.id || agent.managerId === authReq.user?.id)
        : agents.filter((agent) => agent.id === authReq.user?.id);
    const safeAgents = visibleAgents.map(({ passwordHash, ...agent }) => agent);
    res.json({ success: true, tenantId, agents: safeAgents });
  } catch (err: any) {
    logger.error('Error fetching agents:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agents - Create a new agent for current tenant (+ Cognito login when enabled)
router.post('/agents', requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || req.body?.tenantId || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const { password, ...body } = req.body || {};
    if (!password || String(password).length < 8) {
      return res.status(400).json({ success: false, error: 'A temporary password of at least 8 characters is required.' });
    }
    if (String(body.role || '').toLowerCase().includes('caller') || String(body.role || '').toLowerCase() === 'telecaller') {
      const managers = await multiTenantDb.getAgents(tenantId);
      let manager = managers.find((agent) => agent.id === body.managerId && (agent.role || '').toLowerCase() === 'manager');
      if (!manager) {
        manager = managers.find((agent) => agent.isAdmin || String(agent.role || '').toLowerCase().includes('admin') || String(agent.role || '').toLowerCase() === 'manager');
      }
      if (!manager) return res.status(400).json({ success: false, error: 'Select a valid reporting manager for this telecaller.' });
      body.managerId = manager.id;
    }

    const email = String(body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const identityConflict = await findClusterIdentityConflict(email, body.phone);
    if (identityConflict) {
      const field = identityConflict.field;
      const error =
        field === 'email'
          ? 'This email address is already registered to a user in the CRM.'
          : 'This phone number is already registered to a user in the CRM.';
      return res.status(409).json({ success: false, field, error });
    }

    let cognitoSub: string | undefined;
    if (isCognitoEnabled()) {
      const created = await cognitoAdminCreateUser({
        email,
        password: String(password),
        name: String(body.name || email),
        phone: body.phone
      });
      cognitoSub = created.userSub;
    }

    const agentData = {
      ...body,
      email,
      passwordHash: hashPassword(String(password)),
      tenantId
    };
    const saved = await multiTenantDb.saveAgent(tenantId, agentData);

    try {
      await upsertMembership({
        tenantId,
        email,
        agentId: saved.id,
        role: String(saved.role || 'Telecaller'),
        isAdmin: Boolean(saved.isAdmin),
        cognitoSub,
        payload: { name: saved.name, phone: saved.phone }
      });
    } catch (memErr: any) {
      // Membership table may be unavailable in file-store / non-postgres mode
      logger.warn('[team] upsertMembership skipped or failed:', memErr?.message || memErr);
    }

    const { passwordHash, ...safeAgent } = saved;
    res.status(201).json({ success: true, tenantId, agent: safeAgent });
  } catch (err: any) {
    logger.error('Error creating agent:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/agents/:id - Update an existing agent for current tenant
router.put('/agents/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const { password, ...body } = req.body || {};
    const roleName = String(body.role || '').toLowerCase();
    const isTelecaller = roleName.includes('caller') || roleName === 'telecaller';
    if (isTelecaller) {
      const managers = await multiTenantDb.getAgents(tenantId);
      let manager = managers.find((agent) => agent.id === body.managerId && (agent.role || '').toLowerCase() === 'manager');
      if (!manager) {
        manager = managers.find((agent) => agent.isAdmin || String(agent.role || '').toLowerCase().includes('admin') || String(agent.role || '').toLowerCase() === 'manager');
      }
      if (!manager) return res.status(400).json({ success: false, error: 'Select a valid reporting manager for this telecaller.' });
      body.managerId = manager.id;
    }
    const agentData = {
      ...body,
      ...(password ? { passwordHash: hashPassword(String(password)) } : {}),
      id: req.params.id,
      tenantId,
      ...(isTelecaller ? {} : { managerId: undefined })
    };
    const saved = await multiTenantDb.saveAgent(tenantId, agentData);

    if (password && isCognitoEnabled() && saved.email) {
      try {
        await cognitoAdminCreateUser({
          email: saved.email,
          password: String(password),
          name: saved.name,
          phone: saved.phone
        });
      } catch (cogErr: any) {
        logger.warn('[team] Cognito password update on agent edit:', cogErr?.message || cogErr);
      }
    }

    try {
      await upsertMembership({
        tenantId,
        email: String(saved.email || '').toLowerCase(),
        agentId: saved.id,
        role: String(saved.role || 'Telecaller'),
        isAdmin: Boolean(saved.isAdmin),
        payload: { name: saved.name, phone: saved.phone }
      });
    } catch (memErr: any) {
      logger.warn('[team] upsertMembership on update skipped or failed:', memErr?.message || memErr);
    }

    const { passwordHash, ...safeAgent } = saved;
    res.json({ success: true, tenantId, agent: safeAgent });
  } catch (err: any) {
    logger.error('Error updating agent:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/agents/:id - Remove an agent from current tenant
router.delete('/agents/:id', requireAdmin, async (req: Request, res: Response) => {
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
