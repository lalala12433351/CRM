import crypto from 'crypto';

/** Former shared default. Never accepted as a real workspace key. */
export const LEGACY_GOOGLE_ADS_WEBHOOK_KEY = 'pixbe_google_ads_key';

export function isUsableGoogleAdsKey(value: unknown): boolean {
  const key = String(value || '').trim();
  return key.length >= 12 && key !== LEGACY_GOOGLE_ADS_WEBHOOK_KEY;
}

export function secretsMatch(stored: string, presented: string): boolean {
  if (!stored || !presented) return false;
  const a = crypto.createHash('sha256').update(stored, 'utf8').digest();
  const b = crypto.createHash('sha256').update(presented, 'utf8').digest();
  return crypto.timingSafeEqual(a, b);
}

export function newLeadWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function newGoogleAdsWebhookKey(): string {
  return crypto.randomBytes(24).toString('hex');
}
