import { Request, Response } from 'express';
import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';

export class CampaignsController {
  /**
   * GET /api/campaigns
   * Returns all campaigns configured in the workspace database for the current tenant
   */
  public async getCampaigns(req: any, res: Response) {
    console.log('[DEBUG] GET /api/campaigns HIT. tenantId:', req.headers['x-tenant-id']);
    const tenantId =
      req.tenantId ||
      req.user?.tenantId ||
      req.user?.id ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'company_kite_aviation';

    try {
      const campaigns = await multiTenantDb.getCampaigns(tenantId);
      return res.json({
        success: true,
        campaigns,
        total: campaigns.length
      });
    } catch (err: any) {
      logger.error('[CampaignsController] Error fetching campaigns:', err);
      return res.status(500).json({ success: false, error: err.message, campaigns: [] });
    }
  }

  /**
   * POST /api/campaigns
   * Creates or updates a workspace campaign in the database
   */
  public async saveCampaign(req: any, res: Response) {
    const tenantId =
      req.tenantId ||
      req.user?.tenantId ||
      req.user?.id ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'company_kite_aviation';

    const { name, handle, description, source, formId, formName, pageId, pageName, assignedAgentIds, distributionRule } = req.body;

    if (!name && !handle) {
      return res.status(400).json({ success: false, error: 'Campaign name or handle is required.' });
    }

    try {
      const campaignName = name || (handle || '').replace(/^@/, '');
      const saved = await multiTenantDb.saveCampaign(tenantId, {
        name: campaignName,
        handle,
        description,
        source: source || 'Workspace Campaign',
        formId,
        formName,
        pageId,
        pageName,
        assignedAgentIds,
        distributionRule
      });

      return res.json({
        success: true,
        campaign: saved,
        message: `Campaign '${saved.name}' (${saved.handle}) saved successfully.`
      });
    } catch (err: any) {
      logger.error('[CampaignsController] Error saving campaign:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/campaigns/:id
   * Deletes a campaign by ID or handle
   */
  public async deleteCampaign(req: any, res: Response) {
    const tenantId =
      req.tenantId ||
      req.user?.tenantId ||
      req.user?.id ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'company_kite_aviation';

    const { id } = req.params;

    try {
      const deleted = await multiTenantDb.deleteCampaign(tenantId, id);
      return res.json({
        success: deleted,
        message: deleted ? `Campaign deleted successfully.` : 'Campaign not found.'
      });
    } catch (err: any) {
      logger.error('[CampaignsController] Error deleting campaign:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const campaignsController = new CampaignsController();
