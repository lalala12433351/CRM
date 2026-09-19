import { Router } from 'express';
import { metaController } from './meta.controller';
import { authMiddleware } from '../../../middleware/auth';
import { tenantContextMiddleware } from '../../../middleware/tenantContext';
import { verifyMetaSignature } from '../../../middleware/webhookVerify';

const router = Router();

// =========================================================================
// 1. SELF-SERVE FACEBOOK OAUTH INTEGRATION ENDPOINTS
// =========================================================================

// GET /api/integrations/facebook/connect - Generates CSRF state & redirects to Meta OAuth dialog
router.get(
  ['/integrations/facebook/connect', '/auth/meta/connect', '/facebook/connect'],
  tenantContextMiddleware,
  (req, res) => metaController.handleConnect(req, res)
);

// GET /api/integrations/facebook/callback - Public Meta OAuth Redirect Handler
router.get(
  ['/integrations/facebook/callback', '/auth/meta/callback', '/facebook/callback'],
  tenantContextMiddleware,
  (req, res) => metaController.handleOAuthCallback(req, res)
);

// GET /api/integrations/facebook/pages - List user's connected Facebook Pages & active status
router.get(
  ['/integrations/facebook/pages', '/facebook/pages', '/meta/pages', '/meta/status'],
  authMiddleware,
  tenantContextMiddleware,
  (req, res) => metaController.getConnectedPages(req, res)
);

// DELETE /api/integrations/facebook/pages/:pageId - Unsubscribe from Meta & mark disconnected
router.delete(
  ['/integrations/facebook/pages/:pageId', '/facebook/pages/:pageId'],
  tenantContextMiddleware,
  (req, res) => metaController.deleteConnectedPage(req, res)
);

// GET /api/integrations/facebook/pages/:pageId/forms - Fetch forms for page
router.get(
  ['/integrations/facebook/pages/:pageId/forms', '/facebook/pages/:pageId/forms'],
  tenantContextMiddleware,
  (req, res) => metaController.getPageForms(req, res)
);

// GET /api/integrations/facebook/pages/:pageId/forms/:formId/questions - Fetch questions for form
router.get(
  ['/integrations/facebook/pages/:pageId/forms/:formId/questions', '/facebook/pages/:pageId/forms/:formId/questions'],
  tenantContextMiddleware,
  (req, res) => metaController.getFormQuestions(req, res)
);

// POST /api/integrations/facebook/campaign-mapping - Save field map, campaign handle, & lead distribution
router.post(
  ['/integrations/facebook/campaign-mapping', '/facebook/campaign-mapping'],
  tenantContextMiddleware,
  (req, res) => metaController.saveCampaignMapping(req, res)
);

// GET /api/integrations/facebook/campaign-mappings - Fetch all saved campaign mappings
router.get(
  ['/integrations/facebook/campaign-mappings', '/facebook/campaign-mappings'],
  tenantContextMiddleware,
  (req, res) => metaController.getCampaignMappings(req, res)
);

// DELETE /api/integrations/facebook/campaign-mappings/:formId - Unlink form + purge data
router.delete(
  ['/integrations/facebook/campaign-mappings/:formId', '/facebook/campaign-mappings/:formId'],
  tenantContextMiddleware,
  (req, res) => metaController.deleteCampaignMapping(req, res)
);

// Legacy Disconnect route
router.post(
  ['/meta/disconnect', '/integrations/facebook/disconnect'],
  authMiddleware,
  tenantContextMiddleware,
  (req, res) => metaController.disconnect(req, res)
);

// =========================================================================
// 2. META LEAD ADS WEBHOOK ENDPOINTS
// =========================================================================

// Meta Webhook Handshake (GET)
router.get(
  ['/webhooks/meta', '/webhooks/facebook'],
  (req, res) => metaController.handleWebhookHandshake(req, res)
);

// Meta Real-Time Lead Event Receiver (POST with HMAC signature validation)
router.post(
  ['/webhooks/meta', '/webhooks/facebook'],
  verifyMetaSignature,
  (req, res) => metaController.handleWebhookEvent(req, res)
);

// =========================================================================
// 3. ON-DEMAND MANUAL LEAD SYNC
// =========================================================================
async function runMetaLeadSync(req: any, res: any) {
  try {
    const { metaSyncEngine } = await import('./meta.sync');
    const tenantId = String(
      req.tenantId ||
      req.user?.tenantId ||
      req.headers['x-tenant-id'] ||
      req.body?.tenantId ||
      process.env.DEFAULT_TENANT_ID ||
      'company_kite_aviation'
    );
    const result = await metaSyncEngine.syncAllMetaLeads(tenantId);
    res.json({
      success: true,
      tenantId,
      message: `Synced ${result.syncedCount} Facebook lead(s) into the CRM database.`,
      syncedCount: result.syncedCount,
      newLeadsSaved: result.syncedCount,
      formsSynced: result.formsSynced || 0,
      errors: result.errors || []
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Meta sync failed' });
  }
}

router.post(['/meta/sync', '/facebook/sync-leads', '/integrations/facebook/sync-leads'], authMiddleware, tenantContextMiddleware, runMetaLeadSync);

export default router;
