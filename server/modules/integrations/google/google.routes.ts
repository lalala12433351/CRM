import { Router, Request, Response } from 'express';
import { saveLeadToAwsDb, logWebhookToAwsDb } from '../../../../src/lib/awsDb';
import { logger } from '../../../utils/logger';

const router = Router();

/**
 * POST /api/webhooks/google-ads
 */
router.post('/webhooks/google-ads', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    logger.info('[Google Ads Webhook] Payload received:', JSON.stringify(payload));

    const expectedKey = process.env.GOOGLE_ADS_WEBHOOK_KEY || 'pixbe_google_ads_key';
    if (payload.google_key && payload.google_key !== expectedKey) {
      return res.status(403).json({ status: 'error', message: 'Invalid Google Ads Webhook Key' });
    }

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
      customFields: { gclid: payload.gclid || 'gclid-demo-123', campaign_id: payload.campaign_id || 'g-camp-101' },
      tags: ['Google Ads', 'Search Lead Form'],
      notes: `Google Campaign ID: ${payload.campaign_id || 'N/A'}, Form ID: ${payload.form_id || 'N/A'}`,
      gclid: payload.gclid || 'gclid-demo-123'
    };

    await saveLeadToAwsDb(newLead);
    await logWebhookToAwsDb({ id: 'wh-gads', name: 'Google Ads Webhook', sourcePlatform: 'Google Ads' });

    logger.info(`✅ [Google Ads] Lead Saved to Aurora RDS: ${newLead.name} (${newLead.phone})`);
    res.status(200).json({ status: 'success', message: 'Google Ads Lead captured into AWS Aurora RDS', leadId });
  } catch (error: any) {
    logger.error('❌ [Google Ads Webhook Error]:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

/**
 * POST /api/webhooks/lead (Generic & Zapier)
 */
router.post('/webhooks/lead', async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const leadId = `lead-webhook-${Date.now()}`;

    const leadName =
      payload.name ||
      payload.full_name ||
      (payload.first_name ? `${payload.first_name} ${payload.last_name || ''}`.trim() : 'Meta Facebook Lead');
    const leadPhone = payload.phone || payload.phone_number || payload.mobile || payload.contact || '+91 0000000000';
    const leadEmail = payload.email || payload.email_address || '';
    const leadCity = payload.city || payload.location || payload.branch || 'Kerala';
    const leadCompany = payload.company || payload.company_name || 'Individual';
    const leadSource = payload.source || payload.lead_source || 'Meta Facebook Lead Ads';

    const newLead = {
      id: leadId,
      name: leadName,
      phone: leadPhone,
      email: leadEmail,
      company: leadCompany,
      city: leadCity,
      state: payload.state || 'Kerala',
      source: leadSource,
      status: 'Fresh',
      pipelineStageId: payload.pipelineStageId || 'stage-1',
      dealValue: payload.dealValue || 0,
      aiScore: Math.floor(Math.random() * 20) + 80,
      aiRating: 'Hot',
      aiReasoning: 'Live Meta Lead captured via Zapier Webhook integration.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerAgentId: payload.ownerAgentId || 'agent-admin',
      ownerAgentName: payload.ownerAgentName || 'Unassigned',
      customFields: payload.customFields || { form_name: payload.form_name || 'Facebook Lead Form' },
      tags: ['Meta Ads', 'Zapier Live'],
      notes: payload.notes || payload.ad_name || 'Live inbound lead from Meta Facebook Ads via Zapier.',
      gclid: payload.gclid || null,
      fbclid: payload.fbclid || null
    };

    await saveLeadToAwsDb(newLead);
    await logWebhookToAwsDb({ id: 'wh-generic', name: 'Zapier Meta Webhook', sourcePlatform: leadSource });

    logger.info(`[Zapier Webhook] ✅ Live lead captured: ${newLead.name} (${newLead.phone})`);
    res.status(201).json({ status: 'success', message: 'Lead captured live into CRM', leadId, lead: newLead });
  } catch (error: any) {
    logger.error('[Webhook Error]:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

export default router;
