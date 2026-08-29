import { Request, Response } from 'express';
import { leadService } from './lead.service';
import { logger } from '../../utils/logger';

export class LeadController {
  public async getLeads(req: Request, res: Response) {
    try {
      const { agentId, isAdmin } = req.query;
      const leads = await leadService.getLeads(
        agentId ? String(agentId) : undefined,
        isAdmin === 'true'
      );
      return res.json({ success: true, leads });
    } catch (err: any) {
      logger.warn('AWS RDS Lead fetch fallback:', err?.message);
      return res.json({ success: false, error: err?.message || 'AWS DB query error' });
    }
  }

  public async getFieldSettings(req: Request, res: Response) {
    try {
      const fieldSettings = await leadService.getFieldSettings();
      res.json({ success: true, fields: fieldSettings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async saveFieldSettings(req: Request, res: Response) {
    try {
      const payload = req.body;
      const result = await leadService.saveFieldSettings(payload);
      res.json({
        success: true,
        message: Array.isArray(payload)
          ? `Saved ${payload.length} field settings into database!`
          : `Saved field setting into database!`,
        result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const leadController = new LeadController();
