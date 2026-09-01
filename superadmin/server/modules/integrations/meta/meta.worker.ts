import { metaService } from './meta.service';
import { saveLeadToAwsDb, logWebhookToAwsDb } from '../../../../src/lib/awsDb';
import { logger } from '../../../utils/logger';

export class MetaWorker {
  public async processLeadgenChange(change: any) {
    const { leadgen_id, page_id, form_id, ad_id } = change.value || {};
    if (!leadgen_id || !page_id) return;

    try {
      const pageInfo = await metaService.getPageToken(page_id);
      if (!pageInfo) {
        logger.warn(`[Meta Webhook] No active token for page ${page_id}`);
        return;
      }

      const { client_id, page_access_token, page_name } = pageInfo;
      const rawLead = await metaService.fetchLeadDetails(leadgen_id, page_access_token);

      const fieldMap: Record<string, any> = {};
      for (const field of rawLead.field_data || []) {
        fieldMap[field.name] = field.values?.[0] || null;
      }

      const fullName =
        fieldMap.full_name ||
        `${fieldMap.first_name || ''} ${fieldMap.last_name || ''}`.trim() ||
        'Meta Lead';
      const email = fieldMap.email || '';
      const phone = fieldMap.phone_number || fieldMap.phone || '';

      const leadId = `meta-lead-${leadgen_id || Date.now()}`;
      const newLead = {
        id: leadId,
        name: fullName,
        phone: phone || '+91 98765 00000',
        email,
        company: page_name || 'Meta Lead Ads',
        city: fieldMap.city || 'Hyderabad',
        state: 'Telangana',
        source: 'Meta (Facebook & Instagram) Lead Ads',
        status: 'Fresh',
        pipelineStageId: 'stage-1',
        dealValue: 250000,
        aiScore: 96,
        score: 96,
        priority: 'High',
        assignedTo: 'Rahul Varma (Auto)',
        tags: ['Meta Ads', 'Instant Form', page_name || 'Social'],
        notes: `Captured via Facebook Lead Ads (Form ID: ${form_id || 'N/A'}, Ad ID: ${ad_id || 'N/A'})`,
        customFields: {
          ...fieldMap,
          meta_leadgen_id: leadgen_id,
          meta_page_id: page_id,
          meta_page_name: page_name,
          meta_form_id: form_id
        },
        createdAt: new Date().toISOString()
      };

      await saveLeadToAwsDb(newLead);
      await logWebhookToAwsDb({
        id: `wh-meta-${Date.now()}`,
        name: 'Meta Lead Ads Webhook',
        sourcePlatform: 'Meta Lead Ads'
      });

      logger.info(`[Meta Worker] ✅ Lead ingested live: ${newLead.name} (${newLead.phone})`);
    } catch (err: any) {
      logger.error(`[Meta Worker] Failed to process leadgen ${leadgen_id}:`, err?.response?.data || err.message);
    }
  }
}

export const metaWorker = new MetaWorker();
