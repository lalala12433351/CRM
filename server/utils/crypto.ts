import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.APP_SECRET_KEY
  ? crypto.createHash('sha256').update(process.env.APP_SECRET_KEY).digest()
  : crypto.createHash('sha256').update('pixbe_crm_fallback_secret_salt_2026').digest();

const GCM_IV_LENGTH = 12; // 12-byte (96-bit) standard IV for AES-GCM
const CBC_IV_LENGTH = 16;

/**
 * Encrypt sensitive strings using authenticated AES-256-GCM.
 * Output format: iv:authTag:ciphertext (hex encoded)
 */
export function encryptText(text: string): string {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(GCM_IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('AES-256-GCM Encryption error:', err);
    return text;
  }
}

/**
 * Decrypt encrypted strings.
 * Automatically supports authenticated AES-256-GCM (3-part: iv:authTag:ciphertext)
 * and falls back to legacy AES-256-CBC (2-part: iv:ciphertext) for existing records.
 */
export function decryptText(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

  const parts = encryptedText.split(':');

  // Format 1: AES-256-GCM (iv:authTag:ciphertext)
  if (parts.length === 3) {
    try {
      const [ivHex, authTagHex, dataHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(dataHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (gcmErr) {
      console.error('AES-256-GCM Decryption error (tag verification failed):', gcmErr);
      return encryptedText;
    }
  }

  // Format 2: Legacy AES-256-CBC (iv:ciphertext)
  if (parts.length === 2) {
    try {
      const [ivHex, dataHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
      let decrypted = decipher.update(dataHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (cbcErr) {
      console.error('Legacy AES-256-CBC Decryption error:', cbcErr);
      return encryptedText;
    }
  }

  return encryptedText;
}

/**
 * Verify HMAC SHA-256 signature (used by Meta Webhooks and Razorpay)
 * Uses constant-time comparison (crypto.timingSafeEqual) safely across Buffers.
 */
export function verifyHmacSha256(
  payload: Buffer | string,
  signature: string,
  secret: string
): boolean {
  if (!payload || !signature || !secret) return false;
  try {
    const hmac = crypto.createHmac('sha256', secret);
    if (Buffer.isBuffer(payload)) {
      hmac.update(payload);
    } else {
      hmac.update(payload, 'utf8');
    }
    const expectedSignature = hmac.digest('hex');

    const signatureBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuf, expectedBuf);
  } catch (err) {
    return false;
  }
}

/**
 * Generate HMAC SHA-256 hex string
 */
export function generateHmacSha256(payload: Buffer | string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  if (Buffer.isBuffer(payload)) {
    hmac.update(payload);
  } else {
    hmac.update(payload, 'utf8');
  }
  return hmac.digest('hex');
}
