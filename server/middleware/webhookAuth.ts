import { Request, Response, NextFunction } from 'express';
import { multiTenantDb } from '../services/multiTenantDb';

function headerValue(req: Request, name: string): string {
  const raw = req.headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return String(value || '').trim();
}

/**
 * Google Ads lead forms must present a per-workspace key.
 * The workspace is resolved from that key, never from x-tenant-id.
 */
export function requireGoogleAdsWebhookKey(req: Request, res: Response, next: NextFunction) {
  const payload = req.body && typeof req.body === 'object' ? req.body : {};
  const key = String(payload.google_key || '').trim() || headerValue(req, 'x-google-ads-key') || headerValue(req, 'x-webhook-secret');
  if (!key) {
    return res.status(401).json({ status: 'error', message: 'Google Ads webhook key required' });
  }

  const tenantId = multiTenantDb.findTenantByWebhookSecret(key, 'google-ads');
  if (!tenantId) {
    return res.status(403).json({ status: 'error', message: 'Invalid Google Ads webhook key' });
  }

  (req as Request & { tenantId?: string }).tenantId = tenantId;
  next();
}

/**
 * Generic lead ingest. Secret may be the URL segment (/api/webhooks/lead/:tenantKey)
 * or the X-Webhook-Secret header. The workspace is resolved from that secret.
 */
export function requireLeadWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const fromParam = String((req.params as { tenantKey?: string }).tenantKey || '').trim();
  const secret = fromParam || headerValue(req, 'x-webhook-secret');
  if (!secret) {
    return res.status(401).json({ status: 'error', message: 'Webhook secret required' });
  }

  const tenantId = multiTenantDb.findTenantByWebhookSecret(secret, 'lead');
  if (!tenantId) {
    return res.status(403).json({ status: 'error', message: 'Invalid webhook secret' });
  }

  (req as Request & { tenantId?: string }).tenantId = tenantId;
  next();
}
