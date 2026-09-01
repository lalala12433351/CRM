import axios from 'axios';
import { metaConfig } from '../../../config/meta';
import { executeAwsQuery } from '../../../config/database';
import { logger } from '../../../utils/logger';

export class MetaService {
  /**
   * Exchange temporary authorization code for User Access Token
   */
  public async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
    const tokenRes = await axios.get(`https://graph.facebook.com/${metaConfig.graphVersion}/oauth/access_token`, {
      params: {
        client_id: metaConfig.appId,
        client_secret: metaConfig.appSecret,
        redirect_uri: redirectUri,
        code
      }
    });
    return tokenRes.data.access_token;
  }

  /**
   * Fetch connected client Facebook Pages with their Page Access Tokens
   */
  public async getUserPages(userAccessToken: string) {
    const pagesRes = await axios.get(`https://graph.facebook.com/${metaConfig.graphVersion}/me/accounts`, {
      params: { access_token: userAccessToken }
    });
    return pagesRes.data.data || [];
  }

  /**
   * Subscribe page to Webhooks for real-time lead generation
   */
  public async subscribePageToLeadgen(pageId: string, pageAccessToken: string) {
    return await axios.post(
      `https://graph.facebook.com/${metaConfig.graphVersion}/${pageId}/subscribed_apps`,
      null,
      {
        params: {
          subscribed_fields: 'leadgen',
          access_token: pageAccessToken
        }
      }
    );
  }

  /**
   * Save or update connected Facebook page in Aurora RDS
   */
  public async saveConnectedPage(clientId: string, page: { id: string; name: string; access_token: string }) {
    await executeAwsQuery(
      `INSERT INTO meta_connected_pages (client_id, page_id, page_name, page_access_token, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (page_id) DO UPDATE SET page_access_token = $4, is_active = true`,
      [clientId, page.id, page.name, page.access_token]
    );
  }

  /**
   * Get active page access token by Page ID
   */
  public async getPageToken(pageId: string) {
    const pageRow = await executeAwsQuery(
      `SELECT client_id, page_access_token, page_name FROM meta_connected_pages WHERE page_id = $1 AND is_active = true LIMIT 1`,
      [pageId]
    );
    if (!pageRow || pageRow.rows.length === 0) return null;
    return pageRow.rows[0];
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
}

export const metaService = new MetaService();
