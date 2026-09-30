import { Router, Request, Response } from 'express';
import { logger } from '../../../utils/logger';
import { multiTenantDb } from '../../../services/multiTenantDb';
import { requireGoogleAdsWebhookKey, requireLeadWebhookSecret } from '../../../middleware/webhookAuth';

const router = Router();

/**
 * POST /api/webhooks/google-ads
 * Workspace is chosen from the per-workspace key, not from x-tenant-id.
 */
router.post('/webhooks/google-ads', requireGoogleAdsWebhookKey, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const logged = { ...(payload || {}) };
    delete logged.google_key;
    logger.info('[Google Ads Webhook] Payload received:', JSON.stringify(logged));

    let leadName = 'Google Ads Lead';
    let leadPhone = '';
    let leadEmail = '';
    let leadCity = 'Unknown';
    let leadCompany = '';

    if (payload.user_column_data && Array.isArray(payload.user_column_data)) {
      payload.user_column_data.forEach((col: any) => {
        const colName = col.column_name?.toLowerCase() || '';
        const val = col.string_value || col.value || '';
        if (colName.includes('name')) leadName = val;
        if (colName.includes('phone')) leadPhone = val;
        if (colName.includes('email')) leadEmail = val;
        if (colName.includes('city')) leadCity = val;
        if (colName.includes('company')) leadCompany = val;
      });
    } else {
      leadName = payload.full_name || payload.name || 'Google Ads Lead';
      leadPhone = payload.phone_number || payload.phone || '';
      leadEmail = payload.email || '';
      leadCity = payload.city || 'Mumbai';
    }

    const leadId = `g-lead-${Date.now()}`;
    const newLead = {
      id: leadId,
      name: leadName,
      phone: leadPhone || '+91 98450 00000',
      email: leadEmail,
      company: leadCompany,
      ...(payload.form_name || payload.form_title ? { formName: payload.form_name || payload.form_title } : {}),
      ...(payload.campaign_name || payload.campaign_id ? { campaignName: payload.campaign_name || payload.campaign_id } : {}),
      city: leadCity,
      state: payload.state || 'Maharashtra',
      source: 'Google Ads Lead Form',
      status: 'Fresh',
      pipelineStageId: 'stage-1',
      dealValue: payload.deal_value || 300000,
      aiScore: 94,
      aiRating: 'Hot',
      aiReasoning: 'High commercial intent captured via Google Search Lead Form.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerAgentId: 'agent-us',
      ownerAgentName: 'Ummema Sufiya BM',
      customFields: { 
        ...(payload.form_name || payload.form_title ? { form_name: payload.form_name || payload.form_title } : {}),
        ...(payload.gclid ? { gclid: payload.gclid } : {}),
        ...(payload.campaign_id ? { campaign_id: payload.campaign_id } : {}),
      },
      tags: Array.from(new Set(['Google Ads', payload.form_name, payload.form_title].filter(Boolean))),
      notes: `Google Campaign ID: ${payload.campaign_id || 'N/A'}, Form ID: ${payload.form_id || 'N/A'}`,
      gclid: payload.gclid || 'gclid-demo-123'
    };

    const tenantId = (req as Request & { tenantId?: string }).tenantId;
    if (!tenantId) {
      return res.status(403).json({ status: 'error', message: 'Invalid Google Ads webhook key' });
    }
    await multiTenantDb.saveLead(tenantId, newLead as any, { actor: { id: 'bot', name: 'Google Ads' } });

    logger.info(`✅ [Google Ads] Lead Saved to Database: ${newLead.name} (${newLead.phone})`);
    res.status(200).json({ status: 'success', message: 'Google Ads Lead captured into CRM Database', leadId });
  } catch (error: any) {
    logger.error('❌ [Google Ads Webhook Error]:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

/**
 * POST /api/webhooks/lead and /api/webhooks/lead/:tenantKey (Generic & Zapier)
 * :tenantKey is the workspace secret, not the tenant id.
 */
async function ingestLeadWebhook(req: Request, res: Response) {
  try {
    const payload = req.body || {};
    const leadId = `lead-webhook-${Date.now()}`;

    const leadName =
      payload.name ||
      payload.full_name ||
      (payload.first_name ? `${payload.first_name} ${payload.last_name || ''}`.trim() : 'Inbound Lead');
    const leadPhone = payload.phone || payload.phone_number || payload.mobile || payload.contact || '';
    const leadEmail = payload.email || payload.email_address || '';
    const leadCity = payload.city || payload.location || payload.branch || '';
    const leadCompany = payload.company || payload.company_name || '';
    const leadSource = payload.source || payload.lead_source || 'Inbound Webhook';
    const formName = payload.form_name || payload.formName || payload.form || '';
    const campaignName = payload.campaign_name || payload.campaignName || payload.campaign || '';

    const newLead = {
      id: leadId,
      name: leadName,
      phone: leadPhone,
      email: leadEmail,
      company: leadCompany,
      ...(formName ? { formName } : {}),
      ...(campaignName ? { campaignName } : {}),
      city: leadCity,
      state: payload.state || '',
      source: leadSource,
      status: 'Fresh',
      pipelineStageId: payload.pipelineStageId || 'stage-1',
      dealValue: payload.dealValue || 0,
      aiScore: Math.floor(Math.random() * 20) + 80,
      aiRating: 'Hot',
      aiReasoning: 'Live inbound lead captured via Webhook integration.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerAgentId: payload.ownerAgentId || 'agent-admin',
      ownerAgentName: payload.ownerAgentName || 'Unassigned',
      customFields: {
        ...payload.customFields,
        ...(formName ? { form_name: formName } : {}),
        ...(campaignName ? { campaign_name: campaignName } : {}),
      },
      tags: Array.from(new Set([leadSource, formName, campaignName, 'Webhook'].filter(Boolean))),
      notes: payload.notes || payload.ad_name || `Live inbound lead captured via ${leadSource}${formName ? ` (${formName})` : ''}.`,
      gclid: payload.gclid || null,
      fbclid: payload.fbclid || null
    };

    const tenantId = (req as Request & { tenantId?: string }).tenantId;
    if (!tenantId) {
      return res.status(403).json({ status: 'error', message: 'Invalid webhook secret' });
    }
    await multiTenantDb.saveLead(tenantId, newLead as any, { actor: { id: 'bot', name: 'Website / API webhook' } });

    logger.info(`[Zapier Webhook] ✅ Live lead captured: ${newLead.name} (${newLead.phone})`);
    res.status(201).json({ status: 'success', message: 'Lead captured live into CRM', leadId, lead: newLead });
  } catch (error: any) {
    logger.error('[Webhook Error]:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
}

router.post('/webhooks/lead', requireLeadWebhookSecret, ingestLeadWebhook);
router.post('/webhooks/lead/:tenantKey', requireLeadWebhookSecret, ingestLeadWebhook);

export default router;
