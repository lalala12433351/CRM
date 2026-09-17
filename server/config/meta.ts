export const metaConfig = {
  appId: process.env.META_APP_ID || '1785911265462186',
  appSecret: process.env.META_APP_SECRET || '2499233acf77fa2ce858d5a56a90c04a',
  webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'my_crm_lead_secret_2026',
  graphVersion: 'v22.0',
  defaultRedirectUri: process.env.META_REDIRECT_URI || 'https://d3pcv3wpcxqhl2.cloudfront.net/api/integrations/facebook/callback',

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
  }
};

