import { Request, Response } from 'express';
import { leadService } from './lead.service';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { multiTenantDb } from '../../services/multiTenantDb';

function isFollowUpStatus(status?: string): boolean {
  if (!status) return false;
  const s = status.toLowerCase().replace(/[\s\-_]/g, '');
  return (
    s.includes('followup') ||
    s.includes('callback') ||
    s.includes('calllater') ||
    s.includes('appointmentscheduled') ||
    s.includes('visitscheduled') ||
    s.includes('demoscheduled')
  );
}

export class LeadController {
  private async getAccessScope(req: Request) {
    const authReq = req as AuthenticatedRequest;
    const role = (authReq.user?.role || '').toLowerCase();
    const isAdmin = Boolean(authReq.user?.isAdmin) || role === 'admin' || role === 'root';
    if (isAdmin) return { isAdmin: true, agentIds: [] as string[] };
    if (role === 'manager') {
      const agents = await multiTenantDb.getAgents(authReq.tenantId || 'default_tenant');
      return {
        isAdmin: false,
        agentIds: [authReq.user!.id, ...agents.filter((agent) => agent.managerId === authReq.user!.id).map((agent) => agent.id)]
      };
    }
    // Telecaller / Caller / Counselor — only self
    return { isAdmin: false, agentIds: authReq.user?.id ? [authReq.user.id] : [] };
  }

  public async getLeads(req: Request, res: Response) {
    try {
      const authReq = req as any; // Using any for AuthenticatedRequest fields
      const tenantId = authReq.tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
      
      const scope = await this.getAccessScope(req);
      
      const leads = await leadService.getLeads(
        tenantId,
        scope.agentIds,
        scope.isAdmin
      );
      return res.json({ success: true, tenantId, leads });
    } catch (err: any) {
      logger.warn('Lead fetch notice:', err?.message);
      return res.json({ success: false, error: err?.message || 'Database query error' });
    }
  }

  public async getFieldSettings(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
      const fieldSettings = await leadService.getFieldSettings(tenantId);
      res.json({ success: true, tenantId, fields: fieldSettings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async saveFieldSettings(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
      const payload = req.body;
      const result = await leadService.saveFieldSettings(tenantId, payload);
      res.json({
        success: true,
        tenantId,
        message: Array.isArray(payload)
          ? `Saved ${payload.length} field settings into database!`
          : `Saved field setting into database!`,
        result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async saveLead(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || req.body?.tenantId || process.env.DEFAULT_TENANT_ID || 'default_tenant';
      const authReq = req as AuthenticatedRequest;
      const scope = await this.getAccessScope(req);
      const allLeads = await leadService.getLeads(tenantId, [], true);
      const existing = req.body?.id ? allLeads.find((lead: any) => lead.id === req.body.id) : null;
      if (existing && !scope.isAdmin && !scope.agentIds.includes(existing.ownerAgentId)) {
        return res.status(403).json({ success: false, error: 'Forbidden: This lead is outside your assigned team scope.' });
      }

      const requestedOwnerId = req.body?.ownerAgentId || existing?.ownerAgentId;
      if (!scope.isAdmin && requestedOwnerId && !scope.agentIds.includes(requestedOwnerId)) {
        return res.status(403).json({ success: false, error: 'Forbidden: You cannot assign a lead outside your team scope.' });
      }

      const role = (authReq.user?.role || '').toLowerCase();
      const leadData = {
        ...req.body,
        ...(role !== 'manager' && !scope.isAdmin && !existing ? {
          ownerAgentId: authReq.user!.id,
          ownerAgentName: authReq.user!.name || authReq.user!.email
        } : {}),
        tenantId
      };
      const result = await leadService.saveLead(tenantId, leadData);
      return res.status(201).json({ success: true, tenantId, lead: result });
    } catch (err: any) {
      logger.error('Error saving lead into database:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public async deleteLead(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
      const leadId = req.params.id;
      const scope = await this.getAccessScope(req);
      const allLeads = await leadService.getLeads(tenantId, [], true);
      const existing = allLeads.find((lead: any) => lead.id === leadId);
      if (existing && !scope.isAdmin && !scope.agentIds.includes(existing.ownerAgentId)) {
        return res.status(403).json({ success: false, error: 'Forbidden: This lead is outside your assigned team scope.' });
      }
      const success = await leadService.deleteLead(tenantId, leadId);
      return res.json({ success, message: success ? 'Lead deleted successfully' : 'Lead not found' });
    } catch (err: any) {
      logger.error('Error deleting lead from database:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public async getActivities(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
      const activities = await leadService.getActivities(tenantId);
      return res.json({ success: true, tenantId, activities });
    } catch (err: any) {
      logger.warn('Error fetching activities from database:', err?.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public async logActivity(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
      const activity = await leadService.logActivity(tenantId, req.body);
      return res.status(201).json({ success: true, tenantId, activity });
    } catch (err: any) {
      logger.error('Error logging activity into database:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public async deleteActivity(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
      const activityId = req.params.id;
      const success = await leadService.deleteActivity(tenantId, activityId);
      return res.status(200).json({ success, tenantId });
    } catch (err: any) {
      logger.error('Error deleting activity from database:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const leadController = new LeadController();
