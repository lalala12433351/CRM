import { metaService } from './meta.service';
import { logger } from '../../../utils/logger';
import { multiTenantDb } from '../../../services/multiTenantDb';
import { workflowEngine } from '../../../services/workflowEngine';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Earliest lead created_time accepted for a connected form, based on the import option chosen in the wizard.
 * future_only is anchored to when the form was first connected, so editing the mapping later does not move it.
 */
export function getImportCutoff(mapping: any): number {
  const connectedAt = new Date(mapping?.connectedAt || mapping?.updatedAt || 0).getTime() || 0;
  switch (mapping?.importOption) {
    case 'all':
      return 0;
    case 'last_30_days':
      return (connectedAt || Date.now()) - THIRTY_DAYS_MS;
    case 'future_only':
    default:
      return connectedAt;
  }
}

const UNMAPPED_FIELD = '[ Select Telecrm Field To Map ]';

type ReplaceRule = 'Replace if empty' | 'Always replace' | 'Never replace';

/** CRM field-setting names that live on the lead itself rather than in customFields. */
const CORE_LEAD_PROPS: Record<string, string> = {
  name: 'name',
  fullname: 'name',
  phone: 'phone',
  number: 'phone',
  phonenumber: 'phone',
  mobile: 'phone',
  altphone: 'altPhone',
  alternatephone: 'altPhone',
  email: 'email',
  city: 'city',
  state: 'state',
  company: 'company',
  address: 'address',
  dealvalue: 'dealValue'
};

const normalizeKey = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const isEmpty = (v: any) => v === undefined || v === null || String(v).trim() === '' || v === 0;
const normalizePhone = (p?: string) => String(p || '').replace(/\D/g, '').slice(-10);

export class MetaWorker {
  // Next round-robin slot per tenant+form; seeded from the most recent lead's owner so restarts continue the rotation.
  private roundRobinCursor = new Map<string, number>();

  public async processLeadgenChange(change: any, opts: { tenantId?: string } = {}) {
    const { leadgen_id, page_id, form_id, ad_id } = change.value || {};
    if (!leadgen_id || !page_id) {
      logger.warn(`[Meta Worker] Received change without leadgen_id or page_id: ${JSON.stringify(change)}`);
      return;
    }

    try {
      let pageCtx: { client_id: string; page_id: string; page_name: string; page_access_token: string } | null = null;
      if (opts.tenantId) {
        const tenantPages = await metaService.getActiveConnectedPages(opts.tenantId);
        pageCtx = tenantPages.find((p) => String(p.page_id) === String(page_id)) || null;
      }
      if (!pageCtx) pageCtx = await metaService.getPageToken(page_id);
      if (!pageCtx?.page_access_token) {
        logger.warn(`[Meta Worker] No active token found for page ${page_id}`);
        return;
      }

      const tenantId = opts.tenantId || pageCtx.client_id || process.env.DEFAULT_TENANT_ID || 'company_kite_aviation';
      const { page_access_token, page_name } = pageCtx;

      const integrations = await multiTenantDb.getIntegrations(tenantId);
      const fbIntegration = integrations.find((i: any) => i.id === 'facebook');
      const savedMapping: any = form_id ? (fbIntegration?.credentials as any)?.campaignMappings?.[form_id] : null;

      // Leads are only accepted from forms the tenant explicitly connected in the Integrations wizard.
      if (!savedMapping) {
        logger.info(`[Meta Worker] Skipping leadgen ${leadgen_id}: form ${form_id || 'unknown'} is not connected for ${tenantId}`);
        return;
      }

      let rawLead: any = null;
      const fieldMap: Record<string, any> = {};
      try {
        rawLead = await metaService.fetchLeadDetails(leadgen_id, page_access_token);
        for (const field of rawLead?.field_data || []) {
          fieldMap[field.name] = field.values?.[0] ?? null;
        }
      } catch (fetchErr: any) {
        await metaService.handleAuthError(page_id, fetchErr);
        logger.warn(
          `[Meta Worker] Graph API lead fetch failed — skipping ingest: ${fetchErr?.response?.data?.error?.message || fetchErr.message}`
        );
        return;
      }

      const createdMs = rawLead?.created_time ? new Date(rawLead.created_time).getTime() : Date.now();
      const cutoff = getImportCutoff(savedMapping);
      if (cutoff > 0 && createdMs < cutoff) {
        logger.info(`[Meta Worker] Skipping leadgen ${leadgen_id}: created before the import window for form ${form_id}`);
        return;
      }

      const formName = savedMapping.formName || change.value?.form_name || `Meta Form (${form_id})`;

      let dynamicCampaignName: string | null = null;
      let dynamicAdSetName: string | null = null;
      let dynamicAdName: string | null = null;
      if (ad_id) {
        try {
          const adDetails = await metaService.fetchAdDetails(ad_id, page_access_token);
          dynamicCampaignName = adDetails?.campaign?.name || null;
          dynamicAdSetName = adDetails?.adset?.name || null;
          dynamicAdName = adDetails?.name || null;
        } catch (adErr: any) {
          logger.warn(`[Meta Worker] Failed to fetch ad attribution for ad_id ${ad_id}: ${adErr?.response?.data?.error?.message || adErr.message}`);
        }
      }

      const campaignName = savedMapping.campaignName || dynamicCampaignName || formName;
      const campaignHandle = savedMapping.campaignHandle || `@${campaignName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-')}`;

      // Resolve the wizard's field mapping into lead props / customFields
      const fieldSettings = await multiTenantDb.getFieldSettings(tenantId);
      const mappedCore: Record<string, { value: any; rule: ReplaceRule }> = {};
      const mappedCustom: Record<string, { value: any; rule: ReplaceRule }> = {};
      const answerByNormKey = new Map<string, any>();
      for (const [k, v] of Object.entries(fieldMap)) answerByNormKey.set(normalizeKey(k), v);

      for (const m of Array.isArray(savedMapping.fieldMapping) ? savedMapping.fieldMapping : []) {
        const target = String(m?.crmField || m?.telecrmField || '').trim();
        if (!target || target === UNMAPPED_FIELD) continue;
        const answer =
          (m.fbKey && fieldMap[m.fbKey] !== undefined ? fieldMap[m.fbKey] : undefined) ??
          (m.fbQuestion && fieldMap[m.fbQuestion] !== undefined ? fieldMap[m.fbQuestion] : undefined) ??
          answerByNormKey.get(normalizeKey(m.fbKey || m.fbQuestion));
        if (isEmpty(answer)) continue;

        const setting = fieldSettings.find(
          (f: any) => normalizeKey(f.label) === normalizeKey(target) || normalizeKey(f.name) === normalizeKey(target)
        );
        const settingName = setting?.name || target;
        const rule: ReplaceRule = (m.replaceRule as ReplaceRule) || 'Replace if empty';
        const coreProp = CORE_LEAD_PROPS[normalizeKey(settingName)] || CORE_LEAD_PROPS[normalizeKey(setting?.label)];
        if (coreProp) mappedCore[coreProp] = { value: answer, rule };
        else mappedCustom[settingName] = { value: answer, rule };
      }

      // Identity fields always fall back to Meta's standard keys so leads stay reachable and dedupable
      const fallbackName =
        fieldMap.full_name || `${fieldMap.first_name || ''} ${fieldMap.last_name || ''}`.trim() || 'Unknown Lead';
      const fallbackPhone = fieldMap.phone_number || fieldMap.phone || '';
      const fallbackEmail = fieldMap.email || '';
      const coreValue = (prop: string, fallback: any = '') => (mappedCore[prop] ? mappedCore[prop].value : fallback);

      const incoming = {
        name: String(coreValue('name', fallbackName)),
        phone: String(coreValue('phone', fallbackPhone)),
        email: String(coreValue('email', fallbackEmail))
      };

      const tenantLeads = await multiTenantDb.getLeads(tenantId, undefined, true);
      const existing = this.findExistingLead(tenantLeads, leadgen_id, incoming.phone, incoming.email);

      const agents = await multiTenantDb.getAgents(tenantId);
      let owner: { id: string; name: string } | null = null;
      if (existing?.ownerAgentId) {
        owner = { id: existing.ownerAgentId, name: existing.ownerAgentName || '' };
      } else {
        owner = this.pickRoundRobinOwner(tenantId, form_id, savedMapping, agents, tenantLeads);
      }
      if (!owner) {
        const adminAgent = agents.find((a: any) => a.isAdmin || String(a.role || '').toLowerCase().includes('admin'));
        if (adminAgent) owner = { id: adminAgent.id, name: adminAgent.name };
      }

      const applyRule = (existingVal: any, next: { value: any; rule: ReplaceRule } | undefined, fallback: any) => {
        if (!next) return existing ? existingVal ?? fallback : fallback;
        if (!existing) return next.value;
        if (next.rule === 'Always replace') return next.value;
        if (next.rule === 'Never replace') return existingVal ?? fallback;
        return isEmpty(existingVal) ? next.value : existingVal;
      };

      const existingCf = existing?.customFields || {};
      const customValues: Record<string, any> = {};
      for (const [key, entry] of Object.entries(mappedCustom)) {
        customValues[key] = applyRule(existingCf[key], entry, entry.value);
      }

      const leadId = existing?.id || `meta-lead-${leadgen_id}`;
      const leadForTenant: any = {
        id: leadId,
        tenantId,
        name: applyRule(existing?.name, mappedCore.name, incoming.name),
        phone: applyRule(existing?.phone, mappedCore.phone, incoming.phone),
        email: applyRule(existing?.email, mappedCore.email, incoming.email),
        altPhone: applyRule(existing?.altPhone, mappedCore.altPhone, existing?.altPhone || ''),
        company: applyRule(existing?.company, mappedCore.company, existing?.company || page_name || 'Meta Lead Ads'),
        city: applyRule(existing?.city, mappedCore.city, existing?.city || ''),
        state: applyRule(existing?.state, mappedCore.state, existing?.state || ''),
        address: applyRule(existing?.address, mappedCore.address, existing?.address || ''),
        dealValue: Number(applyRule(existing?.dealValue, mappedCore.dealValue, existing?.dealValue || 0)) || 0,
        formName,
        formId: form_id,
        campaignName,
        source: existing?.source || 'Meta (Facebook & Instagram) Lead Ads',
        status: existing?.status || 'Fresh',
        pipelineStageId: existing?.pipelineStageId || 'stage-1',
        priority: existing?.priority || 'Normal',
        assignedTo: owner?.id || '',
        ownerAgentId: owner?.id || '',
        ownerAgentName: owner?.name || 'Unassigned',
        tags: Array.from(new Set(['Meta Lead Ads', campaignName, campaignHandle, page_name || 'Social'].filter(Boolean))),
        notes: existing?.notes || `Captured via Facebook Lead Ads (Campaign: ${campaignName} [${campaignHandle}], Form: ${formName}, Form ID: ${form_id}, Leadgen ID: ${leadgen_id})`,
        customFields: {
          ...customValues,
          meta_answers: fieldMap,
          form_name: formName,
          form_id: form_id,
          campaign_name: campaignName,
          campaign_handle: campaignHandle,
          meta_leadgen_id: leadgen_id,
          meta_page_id: page_id,
          meta_page_name: page_name,
          meta_form_id: form_id,
          meta_form_name: formName,
          meta_ad_id: ad_id || '',
          meta_adset_name: dynamicAdSetName || '',
          meta_ad_name: dynamicAdName || ''
        },
        createdAt: new Date(createdMs).toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (!existing) {
        leadForTenant.aiScore = 0;
        leadForTenant.score = 0;
      }

      try {
        await multiTenantDb.saveLead(tenantId, leadForTenant, {
          actor: { id: 'bot', name: 'Facebook Lead Ads' },
          ...(existing ? { event: 'meta_resubmission' as const } : {})
        });
        await workflowEngine.triggerWorkflowsForEvent(tenantId, 'on_facebook_lead', { lead: leadForTenant });
      } catch (storeErr: any) {
        logger.error('[Meta Worker] Store/Workflow error:', storeErr);
        return;
      }

      logger.info(
        `[Meta Worker] ${existing ? 'Merged re-submission into' : 'Ingested'} lead ${leadForTenant.name} [${leadId}] for ${tenantId}, owner ${leadForTenant.ownerAgentName}`
      );
    } catch (err: any) {
      logger.error(`[Meta Worker] Failed to process leadgen ${leadgen_id}:`, err?.response?.data || err.message);
    }
  }

  private findExistingLead(leads: any[], leadgenId: string, phone: string, email: string): any | null {
    const byLeadgen = leads.find(
      (l) => l.customFields?.meta_leadgen_id === leadgenId || l.id === `meta-lead-${leadgenId}`
    );
    if (byLeadgen) return byLeadgen;
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length >= 10 && cleanPhone !== '0000000000') {
      const byPhone = leads.find((l) => normalizePhone(l.phone) === cleanPhone);
      if (byPhone) return byPhone;
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (cleanEmail.includes('@') && !cleanEmail.includes('example.com') && !cleanEmail.includes('@meta.com')) {
      const byEmail = leads.find((l) => String(l.email || '').trim().toLowerCase() === cleanEmail);
      if (byEmail) return byEmail;
    }
    return null;
  }

  private pickRoundRobinOwner(
    tenantId: string,
    formId: string,
    mapping: any,
    agents: any[],
    tenantLeads: any[]
  ): { id: string; name: string } | null {
    const selected: any[] = Array.isArray(mapping?.leadDistribution) ? mapping.leadDistribution : [];
    const resolved = selected
      .map((s) =>
        agents.find((a) => a.id === s.id) ||
        (s.email ? agents.find((a) => String(a.email || '').toLowerCase() === String(s.email).toLowerCase()) : null) ||
        (s.name ? agents.find((a) => String(a.name || '').trim().toLowerCase() === String(s.name).trim().toLowerCase()) : null)
      )
      .filter(Boolean)
      .filter((a, i, arr) => arr.findIndex((b) => b.id === a.id) === i);
    if (resolved.length === 0) return null;

    let pool = resolved;
    if (mapping?.distributeActiveOnly) {
      const active = resolved.filter((a) => String(a.status || '').toLowerCase() !== 'offline');
      if (active.length > 0) pool = active;
    }

    const key = `${tenantId}:${formId}`;
    let cursor = this.roundRobinCursor.get(key);
    if (cursor === undefined) {
      const lastForForm = tenantLeads
        .filter((l) => (l.formId || l.customFields?.meta_form_id) === formId && l.ownerAgentId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const lastIdx = lastForForm ? pool.findIndex((a) => a.id === lastForForm.ownerAgentId) : -1;
      cursor = lastIdx + 1;
    }
    const agent = pool[cursor % pool.length];
    this.roundRobinCursor.set(key, (cursor + 1) % pool.length);
    return { id: agent.id, name: agent.name };
  }
}

export const metaWorker = new MetaWorker();
