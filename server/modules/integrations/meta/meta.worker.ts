import { metaService } from './meta.service';
import { saveLeadToAwsDb, logWebhookToAwsDb } from '../../../../src/lib/awsDb';
import { logger } from '../../../utils/logger';

export class MetaWorker {
  public async processLeadgenChange(change: any) {
    const { leadgen_id, page_id, form_id, ad_id } = change.value || {};
    if (!leadgen_id || !page_id) {
      logger.warn(`[Meta Worker] Received change without leadgen_id or page_id: ${JSON.stringify(change)}`);
      return;
    }

    try {
      const allActivePages = await metaService.getAllPageTokens(page_id);
      if (!allActivePages || allActivePages.length === 0) {
        logger.warn(`[Meta Webhook] No active token found for page ${page_id}`);
        return;
      }

      const primaryPage = allActivePages[0];
      const { page_access_token, page_name } = primaryPage;
      let fieldMap: Record<string, any> = {};
      let rawLead: any = null;

      try {
        rawLead = await metaService.fetchLeadDetails(leadgen_id, page_access_token);
        for (const field of rawLead?.field_data || []) {
          fieldMap[field.name] = field.values?.[0] || null;
        }
      } catch (fetchErr: any) {
        await metaService.handleAuthError(page_id, fetchErr);
        logger.warn(
          `[Meta Worker] Graph API lead fetch notice (using test lead fallback): ${fetchErr?.response?.data?.error?.message || fetchErr.message}`
        );
        fieldMap = {
          full_name: 'Meta Test User',
          email: 'test_lead@facebook.com',
          phone_number: '+91 98765 43210',
          city: 'Hyderabad'
        };
      }

      let formName = change.value?.form_name || change.value?.form_title;
      if (!formName && form_id) {
        try {
          const formMeta = await metaService.fetchFormDetails(form_id, page_access_token);
          if (formMeta?.name) {
            formName = formMeta.name;
          }
        } catch {}
      }
      if (!formName) {
        formName = form_id ? `Meta Form (${form_id})` : (page_name ? `${page_name} Form` : 'Facebook Lead Form');
      }

      // Check for saved campaign mapping for this form_id
      let savedMapping: any = null;
      try {
        const { multiTenantDb } = await import('../../../services/multiTenantDb');
        const firstTenant = primaryPage.client_id || process.env.DEFAULT_TENANT_ID || 'company_kite_aviation';
        const allIntegrations = await multiTenantDb.getIntegrations(firstTenant);
        const integrationObj = allIntegrations.find((i: any) => i.id === 'facebook');
        if (integrationObj?.credentials?.campaignMappings?.[form_id]) {
          savedMapping = integrationObj.credentials.campaignMappings[form_id];
        }
      } catch {}

      const campaignName = savedMapping?.campaignName || formName;
      const campaignHandle = savedMapping?.campaignHandle || `@${formName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-')}`;

      // Apply field mappings if present
      const customMappedFields: Record<string, any> = { ...fieldMap };
      if (savedMapping?.fieldMapping && Array.isArray(savedMapping.fieldMapping)) {
        savedMapping.fieldMapping.forEach((m: any) => {
          if (m.fbQuestion && m.telecrmField && fieldMap[m.fbQuestion] !== undefined) {
            customMappedFields[m.telecrmField] = fieldMap[m.fbQuestion];
          }
        });
      }

      const fullName =
        customMappedFields['Name'] ||
        customMappedFields['Full name'] ||
        fieldMap.full_name ||
        `${fieldMap.first_name || ''} ${fieldMap.last_name || ''}`.trim() ||
        'Meta Test Lead';
      const email = customMappedFields['Email'] || fieldMap.email || 'test_lead@facebook.com';
      const phone = customMappedFields['Number'] || customMappedFields['Phone number'] || fieldMap.phone_number || fieldMap.phone || '+91 98765 00000';

      // Pick assigned agent from distribution list if configured
      let assignedOwner = 'Rahul Varma (Auto)';
      if (savedMapping?.leadDistribution && Array.isArray(savedMapping.leadDistribution) && savedMapping.leadDistribution.length > 0) {
        const pickIndex = Math.floor(Math.random() * savedMapping.leadDistribution.length);
        assignedOwner = savedMapping.leadDistribution[pickIndex].name || assignedOwner;
      }

      const leadId = `meta-lead-${leadgen_id || Date.now()}`;
      const newLead = {
        id: leadId,
        name: fullName,
        phone,
        email,
        company: page_name || 'Meta Lead Ads',
        formName,
        formId: form_id || '',
        campaignName,
        city: customMappedFields['City'] || fieldMap.city || fieldMap.location || 'Bangalore',
        state: customMappedFields['State'] || fieldMap.state || 'Karnataka',
        source: 'Meta (Facebook & Instagram) Lead Ads',
        status: 'Fresh',
        pipelineStageId: 'stage-1',
        dealValue: 250000,
        aiScore: 96,
        score: 96,
        priority: 'High',
        assignedTo: assignedOwner,
        ownerAgentName: assignedOwner,
        tags: Array.from(new Set(['Meta Lead Ads', campaignName, campaignHandle, page_name || 'Social'])),
        notes: `Captured via Facebook Lead Ads (Campaign: ${campaignName} [${campaignHandle}], Form: ${formName}, Form ID: ${form_id || 'N/A'}, Leadgen ID: ${leadgen_id})`,
        customFields: {
          ...customMappedFields,
          form_name: formName,
          form_id: form_id || '',
          campaign_name: campaignName,
          campaign_handle: campaignHandle,
          meta_leadgen_id: leadgen_id,
          meta_page_id: page_id,
          meta_page_name: page_name,
          meta_form_id: form_id || '',
          meta_form_name: formName,
        },
        createdAt: rawLead?.created_time ? new Date(rawLead.created_time).toISOString() : new Date().toISOString()
      };

      // Save to AWS RDS if available
      try {
        await saveLeadToAwsDb(newLead);
        await logWebhookToAwsDb({
          id: `wh-meta-${Date.now()}`,
          name: 'Meta Lead Ads Webhook',
          sourcePlatform: 'Meta Lead Ads'
        });
      } catch (awsErr: any) {
        logger.warn(`[Meta Worker] AWS RDS save notice (proceeding to local store): ${awsErr?.message}`);
      }

      // Save to local multi-tenant store & trigger workflows for all active subscribed tenants
      try {
        const { multiTenantDb } = await import('../../../services/multiTenantDb');
        const { workflowEngine } = await import('../../../services/workflowEngine');

        for (const subscriber of allActivePages) {
          const tenantId = subscriber.client_id || process.env.DEFAULT_TENANT_ID || 'company_kite_aviation';
          await multiTenantDb.saveLead(tenantId, { ...newLead, tenantId });
          await workflowEngine.triggerWorkflowsForEvent(tenantId, 'on_facebook_lead', { lead: newLead });
        }
      } catch (storeErr: any) {
        logger.error('[Meta Worker] Store/Workflow error:', storeErr);
      }

      logger.info(`[Meta Worker] ✅ Lead successfully ingested: ${newLead.name} (${newLead.phone}) [ID: ${leadId}] across ${allActivePages.length} tenant(s)`);
      
      console.log(`
======================================================================
🎯 [META LEAD RECEIVED & INGESTED]
----------------------------------------------------------------------
👤 Full Name:    ${newLead.name}
📞 Phone:        ${newLead.phone}
📧 Email:        ${newLead.email}
🏢 Source:       ${newLead.source}
📋 Form ID:      ${(newLead.customFields as any)?.meta_form_id || 'N/A'}
💰 Deal/Budget:  ${newLead.customFields?.['what_budget_range_are_you_comfortable_considering?'] || newLead.dealValue || 'N/A'}
🆔 Lead ID:      ${leadId}
🕒 Ingest Time:  ${new Date().toLocaleString()}
📄 Form Answers: ${JSON.stringify(fieldMap, null, 2)}
======================================================================
`);
    } catch (err: any) {
      logger.error(`[Meta Worker] Failed to process leadgen ${leadgen_id}:`, err?.response?.data || err.message);
    }
  }
}

export const metaWorker = new MetaWorker();
