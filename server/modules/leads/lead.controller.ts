import { Request, Response } from 'express';
import { leadService } from './lead.service';
import { logger } from '../../utils/logger';

export class LeadController {
  public async getLeads(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
      const { agentId, isAdmin } = req.query;
      const leads = await leadService.getLeads(
        tenantId,
        agentId ? String(agentId) : undefined,
        isAdmin === 'true'
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
      const leadData = { ...req.body, tenantId };
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
