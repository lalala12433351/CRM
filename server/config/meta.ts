/**
 * Meta / Facebook app config — values come only from environment variables.
 * Never hardcode app secrets or verify tokens in source.
 */
function requiredEnv(name: string): string {
  return (process.env[name] || '').trim();
}

export const metaConfig = {
  get appId(): string {
    return requiredEnv('META_APP_ID');
  },
  get appSecret(): string {
    return requiredEnv('META_APP_SECRET');
  },
  get webhookVerifyToken(): string {
    return requiredEnv('META_WEBHOOK_VERIFY_TOKEN') || requiredEnv('META_VERIFY_TOKEN');
  },
  graphVersion: 'v22.0',
  get defaultRedirectUri(): string {
    const explicit = requiredEnv('META_REDIRECT_URI');
    if (explicit) return explicit;
    const appUrl = requiredEnv('APP_URL');
    if (appUrl) {
      return `${appUrl.replace(/\/$/, '')}/api/integrations/facebook/callback`;
    }
    return '';
  },

  /**
   * Resolves the matching redirect URI dynamically to prevent OAuth code mismatch
   */
  resolveRedirectUri(req: any, path: string = '/api/integrations/facebook/callback'): string {
    if (process.env.APP_URL) {
      return `${process.env.APP_URL.replace(/\/$/, '')}${path}`;
    }
    const proto = req.headers?.['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get ? req.get('host') : (req.headers?.host || '');
    if (host) {
      return `${proto}://${host}${path}`;
    }
    return this.defaultRedirectUri;
  },

  assertConfigured(forFeature: string = 'Meta integration'): void {
    if (!this.appId || !this.appSecret) {
      throw new Error(
        `${forFeature} is not configured. Set META_APP_ID and META_APP_SECRET in the server environment.`
      );
    }
  }
};
