import axios from 'axios';
import crypto from 'crypto';
import { metaConfig } from '../../../config/meta';
import { multiTenantDb } from '../../../services/multiTenantDb';
import { encryptText, decryptText } from '../../../utils/crypto';
import { logger } from '../../../utils/logger';

export class MetaService {
  /**
   * Generates a tamper-proof signed CSRF state token linked to the authenticated tenant/user
   */
  public generateState(clientId: string): string {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(8).toString('hex');
    const rawData = `${clientId}:${timestamp}:${nonce}`;
    const signature = crypto
      .createHmac('sha256', metaConfig.appSecret)
      .update(rawData)
      .digest('hex');
    return Buffer.from(JSON.stringify({ rawData, signature })).toString('base64url');
  }

  /**
   * Validates state integrity, freshness (< 15 mins), and extracts the client/tenant ID
   */
  public verifyState(stateStr: string): { valid: boolean; clientId: string; error?: string } {
    if (!stateStr) {
      return { valid: false, clientId: '', error: 'State parameter missing' };
    }
    try {
      const decoded = JSON.parse(Buffer.from(stateStr, 'base64url').toString('utf8'));
      const { rawData, signature } = decoded;
      const expectedSignature = crypto
        .createHmac('sha256', metaConfig.appSecret)
        .update(rawData)
        .digest('hex');

      const sigBuf = Buffer.from(signature, 'utf8');
      const expectedBuf = Buffer.from(expectedSignature, 'utf8');

      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return { valid: false, clientId: '', error: 'State HMAC signature mismatch' };
      }

      const [clientId, timestampStr] = rawData.split(':');
      const timestamp = parseInt(timestampStr, 10);
      const MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

      if (Date.now() - timestamp > MAX_AGE_MS) {
        return { valid: false, clientId, error: 'State token expired' };
      }

      return { valid: true, clientId };
    } catch (err: any) {
      return { valid: false, clientId: '', error: `Invalid state format: ${err.message}` };
    }
  }

  /**
   * Builds the Meta OAuth Dialog URL with required permission scopes
   */
  public generateOAuthUrl(clientId: string, redirectUri: string): { url: string; state: string } {
    const state = this.generateState(clientId);
    const scopes = 'leads_retrieval,pages_show_list,pages_read_engagement,pages_manage_metadata';
    const url = `https://www.facebook.com/${metaConfig.graphVersion}/dialog/oauth?client_id=${encodeURIComponent(
      metaConfig.appId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(
      scopes
    )}&state=${encodeURIComponent(state)}&response_type=code`;

    return { url, state };
  }

  /**
   * Two-Step Token Exchange:
   * 1. Exchange temporary authorization code for Short-Lived User Access Token
   * 2. Exchange Short-Lived token for 60-day Long-Lived User Access Token via fb_exchange_token
   */
  public async exchangeCodeForTokens(code: string, redirectUri: string): Promise<string> {
    // Step 1: Code -> Short-lived user token
    logger.info('[Meta Service] Exchanging authorization code for short-lived user token...');
    const shortTokenRes = await axios.get(
      `https://graph.facebook.com/${metaConfig.graphVersion}/oauth/access_token`,
      {
        params: {
          client_id: metaConfig.appId,
          client_secret: metaConfig.appSecret,
          redirect_uri: redirectUri,
          code
        }
      }
    );
    const shortLivedToken = shortTokenRes.data.access_token;
    if (!shortLivedToken) {
      throw new Error('Short-lived user access token was not returned by Meta.');
    }

    // Step 2: Short-lived user token -> 60-day Long-Lived User Token
    try {
      logger.info('[Meta Service] Upgrading to 60-day long-lived user access token...');
      const longTokenRes = await axios.get(
        `https://graph.facebook.com/${metaConfig.graphVersion}/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: metaConfig.appId,
            client_secret: metaConfig.appSecret,
            fb_exchange_token: shortLivedToken
          }
        }
      );

      const longLivedToken = longTokenRes.data.access_token;
      if (longLivedToken) {
        logger.info('[Meta Service] ✅ Successfully obtained 60-day long-lived user token');
        return longLivedToken;
      }
    } catch (upgradeErr: any) {
      logger.warn(
        `[Meta Service] Notice upgrading to long-lived token (proceeding with user token): ${
          upgradeErr.response?.data?.error?.message || upgradeErr.message
        }`
      );
    }

    return shortLivedToken;
  }

  /**
   * Fetch user's Facebook Pages and non-expiring Page Access Tokens with automatic cursor pagination
   */
  public async getUserPages(userAccessToken: string): Promise<
    Array<{ id: string; name: string; access_token: string; category?: string; tasks?: string[] }>
  > {
    const allPages: Array<{ id: string; name: string; access_token: string; category?: string; tasks?: string[] }> = [];
    let nextUrl: string | null = `https://graph.facebook.com/${metaConfig.graphVersion}/me/accounts?access_token=${encodeURIComponent(
      userAccessToken
    )}&fields=id,name,access_token,category,tasks&limit=100`;

    let pageIteration = 0;
    const MAX_PAGE_ITERATIONS = 10; // Supports up to 1,000 pages

    while (nextUrl && pageIteration < MAX_PAGE_ITERATIONS) {
      pageIteration++;
      try {
        const pagesRes = await axios.get(nextUrl);
        const data = pagesRes.data?.data || [];
        allPages.push(...data);
        nextUrl = pagesRes.data?.paging?.next || null;
      } catch (err: any) {
        logger.warn(`[Meta Service] Page pagination notice: ${err.message}`);
        break;
      }
    }

    return allPages;
  }

  /**
   * Subscribes a Facebook Page to webhook leadgen events
   * Sends parameters in the request body as application/x-www-form-urlencoded
   */
  public async subscribePageToLeadgen(pageId: string, pageAccessToken: string) {
    const url = `https://graph.facebook.com/${metaConfig.graphVersion}/${pageId}/subscribed_apps`;
    const formParams = new URLSearchParams();
    formParams.append('subscribed_fields', 'leadgen');
    formParams.append('access_token', pageAccessToken);

    return await axios.post(
      url,
      formParams.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
  }

  /**
   * Unsubscribes a Facebook Page from leadgen webhooks
   * DELETE https://graph.facebook.com/v22.0/{page-id}/subscribed_apps
   */
  public async unsubscribePage(pageId: string, pageAccessToken: string) {
    const url = `https://graph.facebook.com/${metaConfig.graphVersion}/${pageId}/subscribed_apps`;
    return await axios.delete(url, {
      params: { access_token: pageAccessToken }
    });
  }

  /**
   * Encrypts and saves connected Facebook Page credentials to facebook_page_integrations
   */
  public async saveConnectedPage(
    clientId: string,
    page: { id: string; name: string; access_token: string }
  ) {
    const encryptedToken = encryptText(page.access_token);
    const integrationId = `fb_page_${clientId}_${page.id}`;

    // Save to MultiTenant store
    try {
      await multiTenantDb.saveFacebookPage(clientId, {
        id: integrationId,
        clientId,
        pageId: page.id,
        pageName: page.name,
        accessToken: encryptedToken,
        status: 'active'
      });
    } catch (storeErr: any) {
      logger.error('[Meta Service] MultiTenant store error:', storeErr);
    }

    logger.info(
      `[Meta Service] 🔒 Stored and encrypted credentials (AES-256-GCM) for page '${page.name}' (${page.id}) under client '${clientId}'`
    );
  }

  /**
   * Retrieves all active connected Facebook Pages across database & local multi-tenant store
   */
  public async getActiveConnectedPages(clientId?: string): Promise<
    Array<{
      client_id: string;
      page_id: string;
      page_name: string;
      page_access_token: string;
    }>
  > {
    const results: Array<{
      client_id: string;
      page_id: string;
      page_name: string;
      page_access_token: string;
    }> = [];

    // 1. Fast Path: Check MultiTenant Local Store (0ms latency)
    try {
      const targetTenant = clientId || process.env.DEFAULT_TENANT_ID || 'company_kite_aviation';
      const localPages = await multiTenantDb.getFacebookPages(targetTenant);
      for (const p of localPages) {
        if (p.status === 'active' && p.accessToken && !String(p.pageId || '').startsWith('test_page_')) {
          const decrypted = decryptText(p.accessToken);
          // Skip tokens that failed decrypt (still iv:tag:cipher) — reconnect required
          const looksEncrypted = String(decrypted).split(':').length === 3 && !String(decrypted).startsWith('EAA');
          if (!decrypted || looksEncrypted) continue;
          results.push({
            client_id: p.clientId || targetTenant,
            page_id: p.pageId,
            page_name: p.pageName,
            page_access_token: decrypted
          });
        }
      }
    } catch {}

    // Deduplicate
    const pageMap = new Map<string, any>();
    results.forEach((p) => {
      const key = `${p.client_id}_${p.page_id}`;
      if (!pageMap.has(key)) pageMap.set(key, p);
    });
    return Array.from(pageMap.values());
  }

  /**
   * Retrieves and decrypts the active Page Access Token for a given Page ID
   */
  public async getPageToken(pageId: string): Promise<{
    client_id: string;
    page_id: string;
    page_name: string;
    page_access_token: string;
    status: string;
  } | null> {
    const all = await this.getAllPageTokens(pageId);
    return all.length > 0 ? all[0] : null;
  }

  /**
   * Retrieves all active tenant credentials associated with a Page ID (Multi-Tenant Routing)
   */
  public async getAllPageTokens(pageId: string): Promise<
    Array<{
      client_id: string;
      page_id: string;
      page_name: string;
      page_access_token: string;
      status: string;
    }>
  > {
    const results: Array<{
      client_id: string;
      page_id: string;
      page_name: string;
      page_access_token: string;
      status: string;
    }> = [];

    // 1. Fast Path: MultiTenant local store lookup (0ms latency)
    try {
      const storedPage = await multiTenantDb.getFacebookPageByPageId(pageId);
      if (storedPage && storedPage.accessToken && storedPage.status === 'active') {
        const decryptedToken = decryptText(storedPage.accessToken);
        results.push({
          client_id: storedPage.clientId,
          page_id: storedPage.pageId,
          page_name: storedPage.pageName,
          page_access_token: decryptedToken,
          status: storedPage.status || 'active'
        });
        return results;
      }
    } catch (storeErr: any) {
      logger.warn(`[Meta Service] Local store lookup notice: ${storeErr.message}`);
    }



    // 4. Fallback: .env configured credentials for development
    if (
      process.env.META_PAGE_ACCESS_TOKEN &&
      (!process.env.META_PAGE_ID || process.env.META_PAGE_ID === pageId)
    ) {
      results.push({
        client_id: process.env.DEFAULT_TENANT_ID || 'company_kite_aviation',
        page_id: process.env.META_PAGE_ID || pageId,
        page_name: process.env.META_PAGE_NAME || 'Pixbee Page',
        page_access_token: process.env.META_PAGE_ACCESS_TOKEN,
        status: 'active'
      });
    }

    return results;
  }

  /**
   * Retrieves connected pages list for a client/tenant (sanitized, token stripped)
   */
  public async getClientPages(clientId: string): Promise<
    Array<{
      id: string;
      page_id: string;
      page_name: string;
      status: string;
      created_at: string;
      updated_at: string;
    }>
  > {


    // Multi-tenant store — only active pages (disconnected/revoked are hard-removed on unlink)
    const localPages = await multiTenantDb.getFacebookPages(clientId);
    return localPages
      .filter((p) => (p.status || 'active') === 'active')
      .map((p) => ({
        id: p.id,
        page_id: p.pageId,
        page_name: p.pageName,
        status: p.status || 'active',
        created_at: p.createdAt,
        updated_at: p.updatedAt
      }));
  }

  /**
   * Reads a tenant's page token before any delete so Meta unsubscribe can still run.
   */
  private async getTenantPageToken(
    clientId: string,
    pageId: string
  ): Promise<{ page_access_token: string; page_name: string } | null> {
    try {
      const pages = await multiTenantDb.getFacebookPages(clientId);
      const page = pages.find((p) => p.pageId === pageId || p.id === pageId);
      if (!page?.accessToken) return null;
      const decrypted = decryptText(page.accessToken);
      if (!decrypted) return null;
      return { page_access_token: decrypted, page_name: page.pageName };
    } catch {
      return null;
    }
  }

  /**
   * Whether any other tenant still has this page active (for shared Meta unsubscribe safety).
   */
  private async otherTenantsUsingPage(clientId: string, pageId: string): Promise<number> {
    const store = (multiTenantDb as any).store?.facebookPages || {};
    let count = 0;
    for (const tenantId of Object.keys(store)) {
      if (tenantId === clientId) continue;
      const pages = store[tenantId] || [];
      if (pages.some((p: any) => (p.pageId === pageId || p.id === pageId) && p.status === 'active')) {
        count++;
      }
    }
    return count;
  }

  /**
   * Purges CRM data tied to a Meta page: leads, form mappings, mirrored campaigns.
   */
  public async purgePageData(clientId: string, pageId: string): Promise<{ leads: number; mappings: number; campaigns: number }> {
    const leads = await multiTenantDb.deleteMetaLeadsByPage(clientId, pageId);
    const { mappings, campaigns } = await multiTenantDb.deleteMetaMappingsByPage(clientId, pageId);
    return { leads, mappings, campaigns };
  }

  /**
   * Purges CRM data tied to a single Meta form mapping.
   */
  public async purgeFormData(clientId: string, formId: string): Promise<{ leads: number; mappings: number; campaigns: number }> {
    const leads = await multiTenantDb.deleteMetaLeadsByForm(clientId, formId);
    const { mappings, campaigns } = await multiTenantDb.deleteMetaMappingByForm(clientId, formId);
    return { leads, mappings, campaigns };
  }

  /**
   * Disconnects a Facebook Page: unsubscribe (if safe) → purge tenant data → hard-remove page record.
   */
  public async disconnectPage(
    clientId: string,
    pageId: string,
    options: { purgeData?: boolean } = { purgeData: true }
  ): Promise<{ success: boolean; message: string; purged?: { leads: number; mappings: number; campaigns: number } }> {
    try {
      // 1. Capture token BEFORE removing the page record
      const tokenInfo = await this.getTenantPageToken(clientId, pageId);
      const otherSubscribers = await this.otherTenantsUsingPage(clientId, pageId);

      // 2. Unsubscribe from Meta only when no other tenant still needs this page
      if (otherSubscribers === 0 && tokenInfo?.page_access_token) {
        try {
          await this.unsubscribePage(pageId, tokenInfo.page_access_token);
          logger.info(`[Meta Service] Unsubscribed page ${pageId} from Meta webhook.`);
        } catch (unsubErr: any) {
          logger.warn(`[Meta Service] Notice during page unsubscription: ${unsubErr.message}`);
        }
      } else if (otherSubscribers > 0) {
        logger.info(
          `[Meta Service] Page ${pageId} disconnected for ${clientId}. Kept subscribed on Meta for ${otherSubscribers} other tenant(s).`
        );
      }

      // 3. Purge related CRM data for this tenant
      let purged = { leads: 0, mappings: 0, campaigns: 0 };
      if (options.purgeData !== false) {
        purged = await this.purgePageData(clientId, pageId);
      }

      // 4. Hard-remove the page credential record
      await multiTenantDb.deleteFacebookPage(clientId, pageId, true);

      return {
        success: true,
        message: `Successfully disconnected Facebook Page ${pageId}`,
        purged
      };
    } catch (err: any) {
      logger.error(`[Meta Service] Error disconnecting page ${pageId}:`, err);
      throw err;
    }
  }

  /**
   * Permanently removes a Facebook Page and all related CRM data for this client.
   */
  public async removePage(clientId: string, pageId: string): Promise<{ success: boolean; message: string; purged?: any }> {
    return this.disconnectPage(clientId, pageId, { purgeData: true });
  }

  /**
   * Disconnects the entire Meta account for a tenant: every page + all Meta CRM data.
   */
  public async disconnectAccount(clientId: string): Promise<{ success: boolean; message: string; pages: number }> {
    const rawPages = await multiTenantDb.getFacebookPages(clientId);
    let count = 0;
    for (const page of rawPages) {
      await this.disconnectPage(clientId, page.pageId, { purgeData: true });
      count++;
    }
    // Wipe any leftover Meta leads that lacked page/form ids
    await multiTenantDb.deleteAllMetaLeads(clientId);
    await multiTenantDb.clearFacebookIntegration(clientId);
    return { success: true, message: `Disconnected Meta account (${count} page(s) removed).`, pages: count };
  }

  /**
   * Unlinks a single form mapping and purges its leads + mirrored campaign.
   */
  public async unlinkForm(clientId: string, formId: string): Promise<{ success: boolean; message: string; purged: any }> {
    const purged = await this.purgeFormData(clientId, formId);
    return {
      success: true,
      message: `Unlinked form ${formId}`,
      purged
    };
  }

  /**
   * Marks the facebook integration row connected (called after successful OAuth).
   */
  public async markFacebookConnected(
    clientId: string,
    account?: { name?: string; email?: string }
  ): Promise<void> {
    const all = await multiTenantDb.getIntegrations(clientId);
    const existing = all.find((i: any) => i.id === 'facebook');
    await multiTenantDb.saveIntegration(clientId, {
      id: 'facebook',
      tenantId: clientId,
      integrationName: 'Meta',
      isConnected: true,
      credentials: {
        ...(existing?.credentials || {}),
        ...(account?.name ? { accountName: account.name } : {}),
        ...(account?.email ? { accountEmail: account.email } : {})
      }
    });
  }

  /**
   * Fetches basic Graph /me profile for account labeling.
   */
  public async getUserProfile(userAccessToken: string): Promise<{ id?: string; name?: string; email?: string } | null> {
    try {
      const res = await axios.get(`https://graph.facebook.com/${metaConfig.graphVersion}/me`, {
        params: { access_token: userAccessToken, fields: 'id,name,email' },
        timeout: 8000
      });
      return res.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Quality & Error Handling:
   * Handles #190 OAuth Invalidation (user revoked permissions, password reset, or token expired)
   */
  public async handleAuthError(pageId: string, error: any): Promise<boolean> {
    const errorCode = error?.response?.data?.error?.code || error?.code;
    const errorMessage = error?.response?.data?.error?.message || error?.message || '';

    // Code 190: Invalid OAuth access token
    if (
      errorCode === 190 ||
      errorCode === '190' ||
      errorMessage.includes('Error validating access token') ||
      errorMessage.includes('Session has expired') ||
      errorMessage.includes('User logged out')
    ) {
      logger.warn(
        `⚠️ [Meta Service] OAuth token for Page ${pageId} has been revoked or invalidated (#190). Marking integration as 'revoked'.`
      );
      try {
        await multiTenantDb.updateFacebookPageStatus(pageId, 'revoked');
      } catch (dbErr) {
        logger.error('[Meta Service] Error updating revoked status:', dbErr);
      }
      return true;
    }
    return false;
  }

  public async fetchLeadDetails(leadgenId: string, pageAccessToken: string) {
    const res = await axios.get(`https://graph.facebook.com/${metaConfig.graphVersion}/${leadgenId}`, {
      params: { access_token: pageAccessToken }
    });
    return res.data;
  }

  /**
   * Fetch ad attribution details (Campaign, AdSet, Ad) given ad_id
   */
  public async fetchAdDetails(adId: string, pageAccessToken: string) {
    const res = await axios.get(`https://graph.facebook.com/${metaConfig.graphVersion}/${adId}`, {
      params: { 
        access_token: pageAccessToken,
        fields: 'campaign{name},adset{name},name'
      }
    });
    return res.data;
  }

  /**
   * Fetch Form details (name, status, etc.) from Graph API given form_id
   */
  public async fetchFormDetails(formId: string, pageAccessToken: string) {
    try {
      const res = await axios.get(`https://graph.facebook.com/${metaConfig.graphVersion}/${formId}`, {
        params: { access_token: pageAccessToken, fields: 'id,name,status,created_time' }
      });
      return res.data;
    } catch (err: any) {
      logger.warn(`[Meta Service] Notice fetching form details for ${formId}: ${err?.message}`);
      return null;
    }
  }
  /**
   * Fetch lead forms published under a Facebook Page from Graph API (live only — no mocks).
   */
  public async getPageForms(pageId: string): Promise<Array<{ id: string; name: string; status: string; questions?: any[] }>> {
    const pageObj = await this.getPageToken(pageId);
    if (!pageObj || !pageObj.page_access_token) {
      throw new Error(`No active access token found for Facebook Page ID ${pageId}`);
    }

    try {
      const res = await axios.get(`https://graph.facebook.com/${metaConfig.graphVersion}/${pageId}/leadgen_forms`, {
        params: {
          access_token: pageObj.page_access_token,
          fields: 'id,name,status,created_time,questions',
          limit: 100
        },
        timeout: 8000
      });
      const forms = res.data?.data || [];
      return forms.map((f: any) => ({
        id: f.id,
        name: f.name || `Form ${f.id}`,
        status: f.status || 'ACTIVE',
        questions: f.questions || []
      }));
    } catch (err: any) {
      await this.handleAuthError(pageId, err);
      const msg = err?.response?.data?.error?.message || err.message;
      logger.warn(`[Meta Service] Graph API getPageForms failed for ${pageId}: ${msg}`);
      throw new Error(msg || `Failed to fetch lead forms for page ${pageId}`);
    }
  }

  /**
   * Fetch detailed questions/fields of a specific form (live Graph only).
   */
  public async getFormQuestions(pageId: string, formId: string): Promise<Array<{ label: string; key: string; type?: string }>> {
    const pageObj = await this.getPageToken(pageId);
    if (!pageObj?.page_access_token) {
      throw new Error(`No active access token found for Facebook Page ID ${pageId}`);
    }

    try {
      const res = await axios.get(`https://graph.facebook.com/${metaConfig.graphVersion}/${formId}`, {
        params: {
          access_token: pageObj.page_access_token,
          fields: 'id,name,status,questions'
        },
        timeout: 8000
      });
      if (res.data?.questions && Array.isArray(res.data.questions)) {
        return res.data.questions.map((q: any) => ({
          label: q.label || q.key || q.type,
          key: q.key || q.label?.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'custom_field',
          type: q.type || 'CUSTOM'
        }));
      }
      return [];
    } catch (err: any) {
      await this.handleAuthError(pageId, err);
      const msg = err?.response?.data?.error?.message || err.message;
      logger.warn(`[Meta Service] Graph API getFormQuestions failed for ${formId}: ${msg}`);
      throw new Error(msg || `Failed to fetch questions for form ${formId}`);
    }
  }
}

export const metaService = new MetaService();

