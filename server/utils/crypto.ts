import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.APP_SECRET_KEY 
  ? crypto.createHash('sha256').update(process.env.APP_SECRET_KEY).digest() 
  : crypto.createHash('sha256').update('pixbe_crm_fallback_secret_salt_2026').digest();

const IV_LENGTH = 16;

/**
 * Encrypt sensitive strings (like Meta Page Access Tokens)
 */
export function encryptText(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
}

/**
 * Decrypt encrypted strings
 */
export function decryptText(encryptedText: string): string {
  try {
    if (!encryptedText.includes(':')) return encryptedText;
    const [ivHex, dataHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(dataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    return encryptedText;
  }
}

/**
 * Verify HMAC SHA-256 signature (used by Meta Webhooks and Razorpay)
 */
export function verifyHmacSha256(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (err) {
    return false;
  }
}

/**
 * Generate HMAC SHA-256 hex string
 */
export function generateHmacSha256(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
