import axios from 'axios';
import crypto from 'crypto';
import { metaConfig } from '../../../config/meta';
import {
  executeAwsQuery,
  saveFacebookPageIntegration,
  getFacebookPageIntegrationByPageId,
  getFacebookPageIntegrationsByClientId,
  updateFacebookPageStatus,
  deleteFacebookPageIntegration
} from '../../../config/database';
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

    // 1. Save to primary facebook_page_integrations RDS table
    try {
      await saveFacebookPageIntegration({
        id: integrationId,
        clientId,
        pageId: page.id,
        pageName: page.name,
        accessToken: encryptedToken,
        status: 'active'
      });
    } catch (rdsErr: any) {
      logger.warn(`[Meta Service] RDS save notice: ${rdsErr.message}`);
    }

    // 2. Save to legacy meta_connected_pages for backwards compatibility
    try {
      await executeAwsQuery(
        `INSERT INTO meta_connected_pages (client_id, page_id, page_name, page_access_token, is_active, tenant_id)
         VALUES ($1, $2, $3, $4, true, $1)
         ON CONFLICT (page_id) DO UPDATE SET
           client_id = EXCLUDED.client_id,
           page_name = EXCLUDED.page_name,
           page_access_token = EXCLUDED.page_access_token,
           is_active = true,
           updated_at = NOW()`,
        [clientId, page.id, page.name, encryptedToken]
      );
    } catch (legacyErr: any) {
      logger.warn(`[Meta Service] Legacy table sync notice: ${legacyErr.message}`);
    }

    // 3. Save to MultiTenant JSON fallback store
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
      logger.error('[Meta Service] MultiTenant fallback store error:', storeErr);
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
        if (p.status === 'active' && p.accessToken) {
          const decrypted = decryptText(p.accessToken);
          results.push({
            client_id: p.clientId || targetTenant,
            page_id: p.pageId,
            page_name: p.pageName,
            page_access_token: decrypted
          });
        }
      }
    } catch {}

    // 2. Check Primary RDS Table
    try {
      const pageRows = await executeAwsQuery(
        `SELECT client_id, page_id, page_name, access_token
         FROM facebook_page_integrations
         WHERE status = 'active' ${clientId ? 'AND client_id = $1' : ''}`,
        clientId ? [clientId] : []
      );
      if (pageRows?.rows) {
        for (const row of pageRows.rows) {
          const decrypted = decryptText(row.access_token);
          results.push({
            client_id: row.client_id,
            page_id: row.page_id,
            page_name: row.page_name,
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

    // 2. Secondary RDS table query
    try {
      const pageRows = await executeAwsQuery(
        `SELECT client_id, page_id, page_name, access_token, status
         FROM facebook_page_integrations
         WHERE page_id = $1 AND status = 'active'
         ORDER BY updated_at DESC`,
        [pageId]
      );
      if (pageRows?.rows && pageRows.rows.length > 0) {
        for (const row of pageRows.rows) {
          const decrypted = decryptText(row.access_token);
          results.push({
            client_id: row.client_id,
            page_id: row.page_id,
            page_name: row.page_name,
            page_access_token: decrypted,
            status: row.status || 'active'
          });
        }
        if (results.length > 0) return results;
      }
    } catch (rdsErr: any) {
      logger.warn(`[Meta Service] Primary table lookup notice: ${rdsErr.message}`);
    }

    // 3. Fallback: Legacy meta_connected_pages lookup
    try {
      const legacyRow = await executeAwsQuery(
        `SELECT client_id, page_access_token, page_name FROM meta_connected_pages WHERE page_id = $1 AND is_active = true LIMIT 1`,
        [pageId]
      );
      if (legacyRow?.rows?.[0]) {
        const row = legacyRow.rows[0];
        const decryptedToken = decryptText(row.page_access_token);
        results.push({
          client_id: row.client_id || process.env.DEFAULT_TENANT_ID || 'company_kite_aviation',
          page_id: pageId,
          page_name: row.page_name || 'Facebook Page',
          page_access_token: decryptedToken,
          status: 'active'
        });
        return results;
      }
    } catch (legacyErr: any) {
      logger.warn(`[Meta Service] Legacy lookup notice: ${legacyErr.message}`);
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
    try {
      const rows = await getFacebookPageIntegrationsByClientId(clientId);
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          page_id: r.page_id,
          page_name: r.page_name,
          status: r.status || 'active',
          created_at: r.created_at,
          updated_at: r.updated_at
        }));
      }
    } catch (rdsErr: any) {
      logger.warn(`[Meta Service] RDS getClientPages notice: ${rdsErr.message}`);
    }

    // Multi-tenant fallback
    const localPages = await multiTenantDb.getFacebookPages(clientId);
    return localPages.map((p) => ({
      id: p.id,
      page_id: p.pageId,
      page_name: p.pageName,
      status: p.status || 'active',
      created_at: p.createdAt,
      updated_at: p.updatedAt
    }));
  }

  /**
   * Disconnects a Facebook Page for a specific client.
   * Only calls DELETE /{page-id}/subscribed_apps if no other client in the CRM is actively connected to that page.
   */
  public async disconnectPage(clientId: string, pageId: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Mark disconnected for this specific client in database and local store
      await updateFacebookPageStatus(pageId, 'disconnected', clientId);
      await multiTenantDb.deleteFacebookPage(clientId, pageId);

      try {
        await executeAwsQuery(
          `UPDATE meta_connected_pages SET is_active = false, updated_at = NOW() WHERE client_id = $1 AND page_id = $2`,
          [clientId, pageId]
        );
      } catch {}

      // 2. Multi-tenant Collision Safety Check:
      // Check if any other client still actively listens to this page_id
      const remainingActive = await this.getAllPageTokens(pageId);
      const otherActiveSubscribers = remainingActive.filter((p) => p.client_id !== clientId && p.status === 'active');

      if (otherActiveSubscribers.length === 0) {
        // Safe to unregister Meta webhook subscription since no other tenant is using it
        const pageInfo = await this.getPageToken(pageId);
        const tokenToUse = pageInfo?.page_access_token;
        if (tokenToUse) {
          try {
            await this.unsubscribePage(pageId, tokenToUse);
            logger.info(`[Meta Service] Unsubscribed page ${pageId} from Meta webhook (0 remaining active tenants).`);
          } catch (unsubErr: any) {
            logger.warn(`[Meta Service] Notice during page unsubscription: ${unsubErr.message}`);
          }
        }
      } else {
        logger.info(
          `[Meta Service] Page ${pageId} disconnected for ${clientId}. Kept subscribed on Meta for ${otherActiveSubscribers.length} other active tenant(s).`
        );
      }

      return { success: true, message: `Successfully disconnected Facebook Page ${pageId}` };
    } catch (err: any) {
      logger.error(`[Meta Service] Error disconnecting page ${pageId}:`, err);
      throw err;
    }
  }

  /**
   * Permanently removes a Facebook Page record from the database for this client.
   */
  public async removePage(clientId: string, pageId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.disconnectPage(clientId, pageId);
      try {
        await executeAwsQuery(
          `DELETE FROM facebook_page_integrations WHERE client_id = $1 AND page_id = $2`,
          [clientId, pageId]
        );
        await executeAwsQuery(
          `DELETE FROM meta_connected_pages WHERE client_id = $1 AND page_id = $2`,
          [clientId, pageId]
        );
      } catch {}
      await multiTenantDb.deleteFacebookPage(clientId, pageId, true);
      return { success: true, message: `Successfully removed Facebook Page ${pageId}` };
    } catch (err: any) {
      logger.error(`[Meta Service] Error removing page ${pageId}:`, err);
      throw err;
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
        await updateFacebookPageStatus(pageId, 'revoked');
        await multiTenantDb.updateFacebookPageStatus(pageId, 'revoked');
        await executeAwsQuery(
          `UPDATE meta_connected_pages SET is_active = false, updated_at = NOW() WHERE page_id = $1`,
          [pageId]
        );
      } catch (dbErr) {
        logger.error('[Meta Service] Error updating revoked status:', dbErr);
      }
      return true;
    }
    return false;
  }

  /**
   * Fetch raw lead payload from Graph API given leadgen_id
   */
  public async fetchLeadDetails(leadgenId: string, pageAccessToken: string) {
    const res = await axios.get(`https://graph.facebook.com/${metaConfig.graphVersion}/${leadgenId}`, {
      params: { access_token: pageAccessToken }
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
   * Fetch lead forms published under a Facebook Page from Graph API
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
      if (forms.length > 0) {
        return forms.map((f: any) => ({
          id: f.id,
          name: f.name || `Form ${f.id}`,
          status: f.status || 'ACTIVE',
          questions: f.questions || []
        }));
      }
    } catch (err: any) {
      logger.warn(`[Meta Service] Graph API getPageForms notice for ${pageId}: ${err?.response?.data?.error?.message || err.message}`);
    }

    // Fallback standard lead form for testing or offline dev
    return [
      {
        id: `form_${pageId}_101`,
        name: `${pageObj.page_name} Standard Lead Form`,
        status: 'ACTIVE',
        questions: [
          { label: 'Full name', key: 'full_name', type: 'FULL_NAME' },
          { label: 'Email', key: 'email', type: 'EMAIL' },
          { label: 'Phone number', key: 'phone_number', type: 'PHONE' },
          { label: 'Date of birth', key: 'date_of_birth', type: 'DATE_OF_BIRTH' },
          { label: 'City', key: 'city', type: 'CITY' }
        ]
      },
      {
        id: `form_${pageId}_102`,
        name: `${pageObj.page_name} Instant Admission Form`,
        status: 'ACTIVE',
        questions: [
          { label: 'Full name', key: 'full_name', type: 'FULL_NAME' },
          { label: 'Email', key: 'email', type: 'EMAIL' },
          { label: 'Phone number', key: 'phone_number', type: 'PHONE' },
          { label: 'Course Preference', key: 'course_preference', type: 'CUSTOM' }
        ]
      }
    ];
  }

  /**
   * Fetch detailed questions/fields of a specific form
   */
  public async getFormQuestions(pageId: string, formId: string): Promise<Array<{ label: string; key: string; type?: string }>> {
    const pageObj = await this.getPageToken(pageId);
    if (pageObj && pageObj.page_access_token) {
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
      } catch (err: any) {
        logger.warn(`[Meta Service] Graph API getFormQuestions notice for ${formId}: ${err?.response?.data?.error?.message || err.message}`);
      }
    }

    // Standard question fallback
    return [
      { label: 'Full name', key: 'full_name', type: 'FULL_NAME' },
      { label: 'Email', key: 'email', type: 'EMAIL' },
      { label: 'Phone number', key: 'phone_number', type: 'PHONE' },
      { label: 'Date of birth', key: 'date_of_birth', type: 'DATE_OF_BIRTH' },
      { label: 'City', key: 'city', type: 'CITY' }
    ];
  }
}

export const metaService = new MetaService();

