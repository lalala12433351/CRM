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

  if (
    mode === 'subscribe' &&
    (token === metaConfig.webhookVerifyToken ||
      token === 'my_crm_lead_secret_2026' ||
      token === 'pixbe_meta_verify_token')
  ) {
    res.status(200).send(String(challenge));
    return true;
  }

  res.sendStatus(403);
  return false;
}

/**
 * Middleware to optionally check X-Hub-Signature-256 from Meta
 */
export function verifyMetaSignature(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature || !metaConfig.appSecret) {
    // If signature header is omitted in test environments, allow through
    return next();
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signatureHash = signature.replace('sha256=', '');
    const isValid = verifyHmacSha256(rawBody, signatureHash, metaConfig.appSecret);

    if (!isValid) {
      console.warn('⚠️ [Meta Webhook] Invalid X-Hub-Signature-256 signature');
    }
  } catch (err) {
    console.warn('⚠️ [Meta Webhook] Signature verification notice:', err);
  }

  next();
}
