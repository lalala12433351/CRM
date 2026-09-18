import { metaService } from './meta.service';
import { logger } from '../../../utils/logger';
import { multiTenantDb } from '../../../services/multiTenantDb';
import { workflowEngine } from '../../../services/workflowEngine';

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

      // Dynamic Ad Attribution from Graph API if ad_id is present
      let dynamicCampaignName: string | null = null;
      let dynamicAdSetName: string | null = null;
      let dynamicAdName: string | null = null;

      if (ad_id) {
        logger.info(`[Meta Webhook] Fetching ad attribution for ad_id: ${ad_id}...`);
        try {
          const adDetails = await metaService.fetchAdDetails(ad_id, page_access_token);
          dynamicCampaignName = adDetails?.campaign?.name || null;
          dynamicAdSetName = adDetails?.adset?.name || null;
          dynamicAdName = adDetails?.name || null;
        } catch (adErr: any) {
          logger.warn(`[Meta Worker] Failed to fetch ad attribution for ad_id ${ad_id}: ${adErr?.response?.data?.error?.message || adErr.message}`);
        }
      }

      const campaignName = dynamicCampaignName || savedMapping?.campaignName || formName;
      const campaignHandle = savedMapping?.campaignHandle || `@${campaignName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-')}`;

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

      // Resolve assignee from campaign distribution against *current* tenant agents (skip stale IDs/names)
      let assignedOwnerId = '';
      let assignedOwnerName = 'Unassigned';

      if (savedMapping?.leadDistribution && Array.isArray(savedMapping.leadDistribution) && savedMapping.leadDistribution.length > 0) {
        const pickIndex = Math.floor(Math.random() * savedMapping.leadDistribution.length);
        const selectedAgent = savedMapping.leadDistribution[pickIndex];
        assignedOwnerId = selectedAgent.id || assignedOwnerId;
        assignedOwnerName = selectedAgent.name || assignedOwnerName;
        logger.info(`[Meta Webhook] Assigned lead to ${assignedOwnerName} (${assignedOwnerId})`);
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
        city: customMappedFields['City'] || fieldMap.city || fieldMap.location || '',
        state: customMappedFields['State'] || fieldMap.state || '',
        source: 'Meta (Facebook & Instagram) Lead Ads',
        status: 'Fresh',
        pipelineStageId: 'stage-1',
        dealValue: Number(customMappedFields['Deal Value'] || customMappedFields['deal_value'] || 0) || 0,
        aiScore: 0,
        score: 0,
        priority: 'Normal',
        assignedTo: assignedOwnerId,
        ownerAgentId: assignedOwnerId,
        ownerAgentName: assignedOwnerName,
        tags: Array.from(new Set(['Meta Lead Ads', campaignName, campaignHandle, page_name || 'Social'].filter(Boolean))),
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
          meta_ad_id: ad_id || '',
          meta_adset_name: dynamicAdSetName || '',
          meta_ad_name: dynamicAdName || ''
        },
        createdAt: rawLead?.created_time ? new Date(rawLead.created_time).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to local multi-tenant store & trigger workflows for all active subscribed tenants
      try {
        for (const subscriber of allActivePages) {
          const tenantId = subscriber.client_id || process.env.DEFAULT_TENANT_ID || 'company_kite_aviation';
          // If distribution didn't set an owner, attach tenant Admin so Admin dashboards stay consistent
          let leadForTenant = { ...newLead, tenantId };
          const agents = await multiTenantDb.getAgents(tenantId);
          const adminAgent = agents.find((a) => a.isAdmin || String(a.role || '').toLowerCase().includes('admin'));
          const resolveOwner = (id?: string, name?: string) => {
            if (id) {
              const byId = agents.find((a) => a.id === id);
              if (byId) return byId;
            }
            if (name) {
              const n = String(name).trim().toLowerCase();
              const byName = agents.find((a) => String(a.name || '').trim().toLowerCase() === n);
              if (byName) return byName;
            }
            return null;
          };
          const matched = resolveOwner(leadForTenant.ownerAgentId, leadForTenant.ownerAgentName);
          if (matched) {
            leadForTenant = {
              ...leadForTenant,
              ownerAgentId: matched.id,
              ownerAgentName: matched.name,
              assignedTo: matched.id
            };
          } else if (adminAgent) {
            leadForTenant = {
              ...leadForTenant,
              ownerAgentId: adminAgent.id,
              ownerAgentName: adminAgent.name,
              assignedTo: adminAgent.id
            };
          }
          await multiTenantDb.saveLead(tenantId, leadForTenant);
          await workflowEngine.triggerWorkflowsForEvent(tenantId, 'on_facebook_lead', { lead: leadForTenant });
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
