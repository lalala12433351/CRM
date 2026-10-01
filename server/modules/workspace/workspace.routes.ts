import { Router, Request, Response } from 'express';
import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';
import { requireAdmin, requireAuthenticated } from '../../middleware/rbac';

const router = Router();

function tenantIdOf(req: Request): string {
  return (
    (req as any).tenantId ||
    (req.headers['x-tenant-id'] as string) ||
    (req.body?.tenantId as string) ||
    process.env.DEFAULT_TENANT_ID ||
    'default_tenant'
  );
}

// GET /api/workspace/webhook-secrets — per-workspace inbound keys (created on first read)
router.get('/workspace/webhook-secrets', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const leadSecret = await multiTenantDb.ensureLeadWebhookSecret(tenantId);
    const googleAdsKey = await multiTenantDb.ensureGoogleAdsWebhookKey(tenantId);
    res.json({
      success: true,
      tenantId,
      leadSecret,
      leadWebhookPath: `/api/webhooks/lead/${leadSecret}`,
      googleAdsKey,
      googleAdsWebhookPath: '/api/webhooks/google-ads',
      headerName: 'X-Webhook-Secret'
    });
  } catch (err: any) {
    const missing = String(err?.message || '').toLowerCase().includes('not found');
    logger.error('Error loading webhook secrets:', err);
    res.status(missing ? 404 : 500).json({ success: false, error: err.message });
  }
});

// GET /api/workspace/settings
router.get('/workspace/settings', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const settings = await multiTenantDb.getWorkspaceSettings(tenantId);
    res.json({ success: true, tenantId, settings });
  } catch (err: any) {
    logger.error('Error fetching workspace settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/workspace/settings — merge partial settings into tenant store
router.put('/workspace/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const saved = await multiTenantDb.saveWorkspaceSettings(tenantId, req.body || {});
    res.json({ success: true, tenantId, settings: saved });
  } catch (err: any) {
    logger.error('Error saving workspace settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/workspace/api-tokens - Generate a new API token
router.post('/workspace/api-tokens', requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const payload = req.body;
    if (!payload || !payload.name || !payload.apiType || !payload.recapturePreference) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const user = (req as any).user;
    const createdBy = user ? (user.name || user.email || 'Unknown User') : 'Unknown User';
    
    const token = await multiTenantDb.generateApiToken(tenantId, {
      ...payload,
      createdBy
    });
    res.json({ success: true, token });
  } catch (err: any) {
    logger.error('Error generating API token:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/workspace/api-tokens/:id - Update an API token
router.put('/workspace/api-tokens/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const tokenId = req.params.id;
    const payload = req.body;
    const token = await multiTenantDb.updateApiToken(tenantId, tokenId, payload);
    if (token) {
      res.json({ success: true, token });
    } else {
      res.status(404).json({ success: false, error: 'Token not found' });
    }
  } catch (err: any) {
    logger.error('Error updating API token:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/workspace/api-tokens - List all API tokens for the workspace
router.get('/workspace/api-tokens', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const tokens = await multiTenantDb.getApiTokens(tenantId);
    res.json({ success: true, tokens });
  } catch (err: any) {
    logger.error('Error fetching API tokens:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/workspace/api-tokens/:id - Revoke an API token
router.delete('/workspace/api-tokens/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const tokenId = req.params.id;
    await multiTenantDb.revokeApiToken(tenantId, tokenId);
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Error revoking API token:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
