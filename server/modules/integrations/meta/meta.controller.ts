import { Request, Response } from 'express';
import { metaConfig } from '../../../config/meta';
import { metaService } from './meta.service';
import { metaWorker } from './meta.worker';
import { verifyMetaWebhookHandshake } from '../../../middleware/webhookVerify';
import { logger } from '../../../utils/logger';

export class MetaController {
  /**
   * GET /api/integrations/facebook/connect
   * Generates CSRF state token linked to authenticated user and redirects to Meta's OAuth dialog
   */
  public async handleConnect(req: any, res: Response) {
    const clientId =
      req.tenantId ||
      req.user?.tenantId ||
      req.user?.id ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'company_kite_aviation';

    const redirectUri = metaConfig.resolveRedirectUri(req, '/api/integrations/facebook/callback');
    const { url, state } = metaService.generateOAuthUrl(clientId, redirectUri);

    logger.info(`[Meta Controller] Initiating Facebook OAuth for client: ${clientId}`);

    if (req.query.format === 'json' || req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        url,
        state,
        clientId
      });
    }

    return res.redirect(url);
  }

  /**
   * GET /api/integrations/facebook/callback
   * Validates state, exchanges code for long-lived token, discovers pages, subscribes to leadgen, and saves to database
   */
  public async handleOAuthCallback(req: any, res: Response) {
    const { code, state, error, error_description } = req.query;

    if (error) {
      logger.warn(`[Meta OAuth] OAuth authorization declined or failed: ${error} - ${error_description}`);
      return this.renderPopupResponse(res, false, {
        message: String(error_description || error || 'Facebook Login was cancelled.')
      });
    }

    if (!code) {
      return this.renderPopupResponse(res, false, {
        message: 'No authorization code received from Facebook.'
      });
    }

    // 1. Validate CSRF State and extract Tenant/Client ID
    const stateValidation = metaService.verifyState(String(state || ''));
    let clientId = stateValidation.clientId;

    if (!stateValidation.valid) {
      logger.warn(`[Meta OAuth] State verification warning: ${stateValidation.error}. Falling back to request tenant.`);
      clientId = req.tenantId || req.user?.id || process.env.DEFAULT_TENANT_ID || 'company_kite_aviation';
    }

    const callbackPath = req.originalUrl?.includes('/auth/meta/callback')
      ? '/api/auth/meta/callback'
      : '/api/integrations/facebook/callback';
    const redirectUri = metaConfig.resolveRedirectUri(req, callbackPath);

    try {
      // 2. Two-tier token exchange (Short-lived -> 60-day Long-Lived Token)
      const longLivedUserToken = await metaService.exchangeCodeForTokens(String(code), redirectUri);

      // 3. Page Discovery & Permanent Page Access Tokens via GET /me/accounts
      const rawPages = await metaService.getUserPages(longLivedUserToken);
      logger.info(`[Meta Controller] Found ${rawPages.length} Facebook page(s) for client '${clientId}'`);

      const connectedPages: Array<{ id: string; name: string; status: string }> = [];

      // 4. Encrypt at rest, save to facebook_page_integrations, and register webhooks
      for (const page of rawPages) {
        await metaService.saveConnectedPage(clientId, page);

        let subSuccess = false;
        try {
          await metaService.subscribePageToLeadgen(page.id, page.access_token);
          subSuccess = true;
          logger.info(`[Meta Controller] ✅ Automated Webhook Registered for page: ${page.name} (${page.id})`);
        } catch (subErr: any) {
          logger.warn(
            `[Meta Subscribed App Notice for ${page.name}]: ${
              subErr.response?.data?.error?.message || subErr.message
            }`
          );
        }

        connectedPages.push({
          id: page.id,
          name: page.name,
          status: 'active'
        });
      }

      return this.renderPopupResponse(res, true, {
        pages: connectedPages,
        count: connectedPages.length,
        clientId
      });
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || err.message || 'Unknown OAuth error';
      logger.error('[Meta Controller] OAuth Token Exchange Error:', errMsg);
      return this.renderPopupResponse(res, false, { message: errMsg });
    }
  }

  /**
   * GET /api/integrations/facebook/pages
   * Returns authenticated user's connected Facebook Pages and their active status
   */
  public async getConnectedPages(req: any, res: Response) {
    const clientId =
      req.tenantId ||
      req.user?.tenantId ||
      req.user?.id ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'company_kite_aviation';

    try {
      const pages = await metaService.getClientPages(clientId);
      const { multiTenantDb } = await import('../../../services/multiTenantDb');
      const tenant = await multiTenantDb.getTenant(clientId);
      const integrations = await multiTenantDb.getIntegrations(clientId);
      const fbIntegration = integrations.find((i: any) => i.id === 'facebook');

      const account = {
        name: (fbIntegration?.credentials as any)?.accountName || tenant?.companyName || (pages.length > 0 ? pages[0].page_name : 'Facebook Account'),
        email: (fbIntegration?.credentials as any)?.accountEmail || tenant?.ownerEmail || (pages.length > 0 ? `${pages[0].page_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@facebook.com` : 'user@facebook.com')
      };

      return res.json({
        success: true,
        tenantId: clientId,
        count: pages.length,
        pages,
        account
      });
    } catch (err: any) {
      logger.error('[Meta Controller] Error retrieving connected pages:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/integrations/facebook/pages/:pageId
   * Unsubscribes page from Meta webhook and marks integration status as disconnected
   */
  public async deleteConnectedPage(req: any, res: Response) {
    const clientId =
      req.tenantId ||
      req.user?.tenantId ||
      req.user?.id ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'company_kite_aviation';

    const { pageId } = req.params;
    const isHard = req.query?.hard === 'true' || req.query?.permanent === 'true';

    if (!pageId) {
      return res.status(400).json({ success: false, error: 'pageId URL parameter is required.' });
    }

    try {
      const result = isHard
        ? await metaService.removePage(clientId, pageId)
        : await metaService.disconnectPage(clientId, pageId);

      return res.json({
        success: true,
        message: result.message,
        pageId,
        status: isHard ? 'removed' : 'disconnected'
      });
    } catch (err: any) {
      logger.error(`[Meta Controller] Error deleting page ${pageId}:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/webhooks/meta (Handshake)
   */
  public handleWebhookHandshake(req: Request, res: Response) {
    verifyMetaWebhookHandshake(req, res);
  }

  /**
   * POST /api/webhooks/meta (Event Ingest)
   */
  public async handleWebhookEvent(req: Request, res: Response) {
    logger.info(`[Meta Webhook] 📥 Received webhook event: ${JSON.stringify(req.body)}`);
    // 1. Send immediate 200 HTTP response to Meta to satisfy strict 20-second timeout
    res.status(200).send('EVENT_RECEIVED');

    // 2. Offload lead detail fetching and CRM database ingestion to asynchronous background microtask
    setImmediate(() => {
      const { object, entry } = req.body || {};
      if (object !== 'page' || !Array.isArray(entry)) {
        logger.warn(`[Meta Webhook] Ignored non-page event or empty entry: ${object}`);
        return;
      }

      for (const item of entry) {
        for (const change of item.changes || []) {
          if (change.field === 'leadgen') {
            metaWorker.processLeadgenChange(change).catch((err) => {
              logger.error('[Meta Controller] Background worker error:', err);
            });
          } else {
            logger.info(`[Meta Webhook] Received unhandled field change: ${change.field}`);
          }
        }
      }
    });
  }

  /**
   * GET /api/meta/status (Backwards compatibility)
   */
  public async getStatus(req: any, res: Response) {
    return this.getConnectedPages(req, res);
  }

  /**
   * POST /api/meta/disconnect (Backwards compatibility)
   */
  public async disconnect(req: any, res: Response) {
    const { pageId } = req.body;
    if (pageId) {
      req.params = { pageId };
      return this.deleteConnectedPage(req, res);
    }
    const clientId = req.tenantId || req.user?.id || process.env.DEFAULT_TENANT_ID || 'company_kite_aviation';
    const pages = await metaService.getClientPages(clientId);
    for (const page of pages) {
      await metaService.disconnectPage(clientId, page.page_id);
    }
    return res.json({ success: true, message: 'Disconnected all Facebook pages.' });
  }

  /**
   * GET /api/integrations/facebook/pages/:pageId/forms
   * Returns lead forms for a given Facebook Page
   */
  public async getPageForms(req: any, res: Response) {
    const { pageId } = req.params;
    if (!pageId) {
      return res.status(400).json({ success: false, error: 'pageId parameter is required' });
    }
    try {
      const forms = await metaService.getPageForms(pageId);
      return res.json({ success: true, pageId, forms, count: forms.length });
    } catch (err: any) {
      logger.error(`[Meta Controller] Error fetching forms for page ${pageId}:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/integrations/facebook/pages/:pageId/forms/:formId/questions
   * Returns questions/fields for a specific lead form
   */
  public async getFormQuestions(req: any, res: Response) {
    const { pageId, formId } = req.params;
    if (!pageId || !formId) {
      return res.status(400).json({ success: false, error: 'pageId and formId parameters are required' });
    }
    try {
      const questions = await metaService.getFormQuestions(pageId, formId);
      return res.json({ success: true, pageId, formId, questions });
    } catch (err: any) {
      logger.error(`[Meta Controller] Error fetching questions for form ${formId}:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/integrations/facebook/campaign-mapping
   * Saves field mapping, campaign handle, and lead distribution rules
   */
  public async saveCampaignMapping(req: any, res: Response) {
    const clientId =
      req.tenantId ||
      req.user?.tenantId ||
      req.user?.id ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'company_kite_aviation';

    const {
      pageId,
      pageName,
      formId,
      formName,
      campaignName,
      campaignHandle,
      fieldMapping,
      leadDistribution,
      importOption
    } = req.body;

    if (!pageId || !formId || !campaignHandle) {
      return res.status(400).json({ success: false, error: 'pageId, formId, and campaignHandle are required.' });
    }

    try {
      const { multiTenantDb } = await import('../../../services/multiTenantDb');
      const allIntegrations = await multiTenantDb.getIntegrations(clientId);
      const existing = allIntegrations.find((i: any) => i.id === 'facebook') || { credentials: {} };

      const campaignMappings = (existing.credentials as any)?.campaignMappings || {};
      campaignMappings[formId] = {
        pageId,
        pageName: pageName || 'Facebook Page',
        formId,
        formName: formName || 'Meta Form',
        campaignName: campaignName || campaignHandle.replace(/^@/, ''),
        campaignHandle: campaignHandle.startsWith('@') ? campaignHandle : `@${campaignHandle}`,
        fieldMapping: fieldMapping || [],
        leadDistribution: leadDistribution || [],
        importOption: importOption || 'future_only',
        updatedAt: new Date().toISOString()
      };

      await multiTenantDb.saveIntegration(clientId, {
        id: 'facebook',
        tenantId: clientId,
        integrationName: 'Meta',
        isConnected: true,
        credentials: {
          ...existing.credentials,
          campaignMappings
        }
      });

      // 2. Mark and update all matching leads in the database with campaign name & distribution
      const targetCampName = campaignName || campaignHandle.replace(/^@/, '');
      const targetCampHandle = campaignHandle.startsWith('@') ? campaignHandle : `@${campaignHandle}`;
      let updatedLeadCount = 0;

      try {
        const allLeads = await multiTenantDb.getLeads(clientId);
        const distMembers = Array.isArray(leadDistribution) && leadDistribution.length > 0 ? leadDistribution : [];
        let dIdx = 0;

        for (const lead of allLeads) {
          const lFormId = lead.formId || lead.customFields?.meta_form_id || lead.customFields?.form_id;
          const lFormName = lead.formName || lead.customFields?.meta_form_name || lead.customFields?.form_name;
          const isMatch =
            (lFormId && String(lFormId) === String(formId)) ||
            (lFormName && formName && lFormName.toLowerCase().trim() === formName.toLowerCase().trim()) ||
            (lead.notes && typeof lead.notes === 'string' && lead.notes.includes(String(formId)));

          if (isMatch) {
            lead.campaign = targetCampName;
            lead.campaignName = targetCampName;
            lead.campaign_name = targetCampName;
            lead.campaignHandle = targetCampHandle;
            lead.campaign_handle = targetCampHandle;
            lead.formId = formId;
            lead.formName = formName || lead.formName;
            lead.pageName = pageName || lead.pageName;
            lead.tags = Array.from(new Set([...(lead.tags || []), targetCampName, targetCampHandle, 'Meta Lead Ads']));
            lead.customFields = {
              ...(lead.customFields || {}),
              campaign_name: targetCampName,
              campaign_handle: targetCampHandle,
              campaignName: targetCampName,
              form_id: formId,
              form_name: formName || lead.formName,
              page_name: pageName || lead.pageName
            };

            // Distribute among selected team members in the database
            if (distMembers.length > 0) {
              const assignedUser = distMembers[dIdx % distMembers.length];
              dIdx++;
              lead.ownerAgentName = assignedUser.name;
              lead.ownerAgentId = assignedUser.id;
              lead.assignedTo = assignedUser.name;
            }

            await multiTenantDb.saveLead(clientId, lead);
            updatedLeadCount++;
          }
        }
      } catch (leadErr) {
        logger.warn('[Meta Controller] Error updating existing leads for campaign:', leadErr);
      }

      // 3. Mark in RDS database if available
      try {
        const { executeAwsQuery } = await import('../../../config/database');
        await executeAwsQuery(
          `UPDATE leads 
           SET campaign_name = $1, form_name = $2, updated_at = NOW() 
           WHERE client_id = $3 AND (form_id = $4 OR custom_fields->>'form_id' = $4)`,
          [targetCampName, formName, clientId, String(formId)]
        ).catch(() => {});
      } catch {}

      // 4. Trigger immediate sync if leads exist on Meta Graph API
      try {
        const { metaSyncEngine } = await import('./meta.sync');
        metaSyncEngine.syncAllMetaLeads(clientId).catch(() => {});
      } catch {}

      logger.info(`[Meta Controller] Configured campaign '${targetCampName}' (${targetCampHandle}) for form ${formId}. Updated ${updatedLeadCount} lead(s) in database.`);

      return res.json({
        success: true,
        message: `Successfully configured campaign '${targetCampHandle}' for lead form ${formName || formId}! Updated ${updatedLeadCount} lead(s) in the database.`,
        mapping: campaignMappings[formId],
        updatedLeadCount
      });
    } catch (err: any) {
      logger.error('[Meta Controller] Error saving campaign mapping:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/integrations/facebook/campaign-mappings
   * Returns all active campaign mappings for the current tenant
   */
  public async getCampaignMappings(req: any, res: Response) {
    const clientId =
      req.tenantId ||
      req.user?.tenantId ||
      req.user?.id ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'company_kite_aviation';

    try {
      const { multiTenantDb } = await import('../../../services/multiTenantDb');
      const allIntegrations = await multiTenantDb.getIntegrations(clientId);
      const existing = allIntegrations.find((i: any) => i.id === 'facebook');
      const campaignMappings = (existing?.credentials as any)?.campaignMappings || {};
      return res.json({ success: true, mappings: Object.values(campaignMappings) });
    } catch (err: any) {
      return res.json({ success: false, mappings: [] });
    }
  }

  /**
   * Helper to render seamless popup window bridge & redirect fallback
   */
  private renderPopupResponse(

    res: Response,
    success: boolean,
    data: { pages?: any[]; count?: number; clientId?: string; message?: string }
  ) {
    if (success) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Meta Connection Success</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: #1e293b; padding: 2.5rem; border-radius: 1.25rem; text-align: center; border: 1px solid #334155; max-width: 420px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            <div style="width: 56px; height: 56px; background: #1877F2; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 28px; margin-bottom: 1.25rem; box-shadow: 0 8px 16px rgba(24, 119, 242, 0.3);">f</div>
            <h3 style="color: #10b981; margin: 0 0 0.5rem; font-size: 20px;">Connected to Facebook!</h3>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 1.75rem;">
              Successfully connected and registered webhooks for <strong>${data.count || 1}</strong> Facebook page(s). Incoming leads will seamlessly funnel to your CRM.
            </p>
            <div style="border: 3px solid #334155; border-top: 3px solid #1877F2; border-radius: 50%; width: 28px; height: 28px; animation: spin 0.8s linear infinite; margin: 0 auto;"></div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
          </div>
          <script>
            const payload = {
              type: 'META_AUTH_SUCCESS',
              success: true,
              pages: ${JSON.stringify(data.pages || [])},
              clientId: ${JSON.stringify(data.clientId || '')}
            };
            try {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage(payload, '*');
              }
              if (window.parent && window.parent !== window) {
                window.parent.postMessage(payload, '*');
              }
            } catch (e) {}
            setTimeout(() => {
              try { window.close(); } catch (e) {}
            }, 800);
          </script>
        </body>
        </html>
      `);
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Meta Connection Failed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="background: #1e293b; padding: 2.25rem; border-radius: 1.25rem; text-align: center; border: 1px solid #ef4444; max-width: 400px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <div style="width: 50px; height: 50px; background: rgba(239, 68, 68, 0.15); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: #ef4444; font-weight: bold; font-size: 24px; margin-bottom: 1rem;">✕</div>
          <h3 style="color: #ef4444; margin: 0 0 0.5rem; font-size: 18px;">Connection Failed</h3>
          <p style="color: #cbd5e1; font-size: 13.5px; line-height: 1.4; margin-bottom: 1.5rem;">${data.message || 'An error occurred while connecting to Facebook.'}</p>
          <button onclick="window.close()" style="background: #334155; color: white; border: none; padding: 0.65rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; font-size: 13px; transition: background 0.2s;">Close Window</button>
        </div>
        <script>
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'META_AUTH_ERROR', error: ${JSON.stringify(data.message)} }, '*');
          }
        </script>
      </body>
      </html>
    `);
  }
}

export const metaController = new MetaController();
