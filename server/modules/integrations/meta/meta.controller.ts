import { Request, Response } from 'express';
import { metaConfig } from '../../../config/meta';
import { metaService } from './meta.service';
import { metaWorker } from './meta.worker';
import { verifyMetaWebhookHandshake } from '../../../middleware/webhookVerify';
import { executeAwsQuery } from '../../../config/database';
import { logger } from '../../../utils/logger';

export class MetaController {
  /**
   * GET /api/auth/meta/callback
   */
  public async handleOAuthCallback(req: any, res: Response) {
    const { code } = req.query;
    const clientId = req.tenantId || req.user?.id || 'default_admin';
    const redirectUri = metaConfig.resolveRedirectUri(req);

    try {
      // 1. Exchange temporary code for User Access Token
      const userAccessToken = await metaService.exchangeCodeForToken(String(code), redirectUri);

      // 2. Get client's Facebook Pages
      const pages = await metaService.getUserPages(userAccessToken);

      // 3. Save pages and subscribe to leadgen
      for (const page of pages) {
        await metaService.saveConnectedPage(clientId, page);
        try {
          await metaService.subscribePageToLeadgen(page.id, page.access_token);
          logger.info(`[Meta Controller] Subscribed page: ${page.name} (${page.id})`);
        } catch (subErr: any) {
          logger.warn(`[Meta Subscribed App Notice]: ${subErr.response?.data?.error?.message || subErr.message}`);
        }
      }

      // Render popup bridge script
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Meta Connected</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: #1e293b; padding: 2.5rem; border-radius: 1.25rem; text-align: center; border: 1px solid #334155; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <div style="width: 50px; height: 50px; background: #1877F2; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 26px; margin-bottom: 1rem;">f</div>
            <h3 style="color: #10b981; margin: 0 0 0.5rem;">Connected to Meta!</h3>
            <p style="color: #94a3b8; font-size: 13px; margin-bottom: 1.5rem;">Successfully connected and subscribed <strong>${pages.length}</strong> Facebook page(s). Returning to CRM...</p>
            <div style="border: 3px solid #334155; border-top: 3px solid #1877F2; border-radius: 50%; width: 24px; height: 24px; animation: spin 0.8s linear infinite; margin: 0 auto;"></div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'META_AUTH_SUCCESS', pages: ${JSON.stringify(pages)} }, '*');
              setTimeout(() => window.close(), 1200);
            } else {
              window.location.href = '/?meta=connected';
            }
          </script>
        </body>
        </html>
      `);
    } catch (error: any) {
      logger.error('Meta OAuth Error:', error.response?.data || error.message);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: #1e293b; padding: 2rem; border-radius: 1rem; text-align: center; border: 1px solid #ef4444; max-width: 380px;">
            <h3 style="color: #ef4444; margin-top: 0;">Meta Connection Failed</h3>
            <p style="color: #cbd5e1; font-size: 13px;">${error.response?.data?.error?.message || error.message}</p>
            <button onclick="window.close()" style="background: #1877F2; color: white; border: none; padding: 0.6rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; margin-top: 1rem;">Close Window</button>
          </div>
        </body>
        </html>
      `);
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
    res.status(200).send('EVENT_RECEIVED');

    const { object, entry } = req.body || {};
    if (object !== 'page' || !Array.isArray(entry)) return;

    for (const item of entry) {
      for (const change of item.changes || []) {
        if (change.field === 'leadgen') {
          metaWorker.processLeadgenChange(change).catch((err) => {
            logger.error('[Meta Controller] Background worker error:', err);
          });
        }
      }
    }
  }

  /**
   * GET /api/meta/status
   */
  public async getStatus(req: any, res: Response) {
    const clientId = req.tenantId || req.user?.id || 'default_admin';
    try {
      const pagesRes = await executeAwsQuery(
        `SELECT page_id, page_name, is_active, updated_at FROM meta_connected_pages WHERE client_id = $1 AND is_active = true`,
        [clientId]
      );
      res.json({
        connected: pagesRes.rows.length > 0,
        pages: pagesRes.rows
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/meta/disconnect
   */
  public async disconnect(req: any, res: Response) {
    const clientId = req.tenantId || req.user?.id || 'default_admin';
    const { pageId } = req.body;
    try {
      if (pageId) {
        await executeAwsQuery(
          `UPDATE meta_connected_pages SET is_active = false WHERE client_id = $1 AND page_id = $2`,
          [clientId, pageId]
        );
      } else {
        await executeAwsQuery(
          `UPDATE meta_connected_pages SET is_active = false WHERE client_id = $1`,
          [clientId]
        );
      }
      res.json({ success: true, message: 'Disconnected from Meta' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const metaController = new MetaController();
