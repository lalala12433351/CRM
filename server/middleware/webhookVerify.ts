import { Request, Response, NextFunction } from 'express';
import { metaConfig } from '../config/meta';
import { verifyHmacSha256 } from '../utils/crypto';

/**
 * Validates Meta GET handshake: hub.mode, hub.verify_token, hub.challenge
 */
export function verifyMetaWebhookHandshake(req: Request, res: Response): boolean {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const expected = metaConfig.webhookVerifyToken;
  if (mode === 'subscribe' && expected && token === expected) {
    res.status(200).send(String(challenge));
    return true;
  }

  res.sendStatus(403);
  return false;
}

/**
 * Middleware to check X-Hub-Signature-256 from Meta using the exact raw request buffer
 */
export function verifyMetaSignature(req: Request, res: Response, next: NextFunction) {
  const signature = (req.headers['x-hub-signature-256'] as string)?.trim();
  const isProd = process.env.NODE_ENV === 'production';

  if (!signature) {
    if (isProd && metaConfig.appSecret) {
      console.warn('⚠️ [Meta Webhook] Missing X-Hub-Signature-256 in production — rejected');
      return res.status(403).json({ error: 'Missing webhook signature' });
    }
    // Dev/test without signature header
    return next();
  }

  if (!metaConfig.appSecret) {
    if (isProd) {
      return res.status(503).json({ error: 'META_APP_SECRET is not configured' });
    }
    return next();
  }

  try {
    const rawPayload = (req as any).rawBody;
    
    if (!rawPayload) {
      console.warn('⚠️ [Meta Webhook] req.rawBody is missing. Please ensure express.json() with verify is configured.');
      return res.status(500).json({ error: 'Server misconfiguration: raw payload required' });
    }
    const signatureHash = signature.startsWith('sha256=') ? signature.replace('sha256=', '') : signature;
    const isValid = verifyHmacSha256(rawPayload, signatureHash, metaConfig.appSecret);

    if (!isValid) {
      console.warn('⚠️ [Meta Webhook] Invalid X-Hub-Signature-256 signature against app secret');
      return res.status(403).json({ error: 'Invalid webhook signature' });
    } else {
      console.log('✅ [Meta Webhook] Signature verified successfully');
    }
  } catch (err: any) {
    console.warn('⚠️ [Meta Webhook] Signature verification notice:', err.message);
    if (isProd) {
      return res.status(403).json({ error: 'Webhook signature verification failed' });
    }
  }

  next();
}
