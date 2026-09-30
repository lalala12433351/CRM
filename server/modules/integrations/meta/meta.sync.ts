import axios from 'axios';
import { metaConfig } from '../../../config/meta';
import { metaWorker, getImportCutoff } from './meta.worker';
import { multiTenantDb } from '../../../services/multiTenantDb';
import { logger } from '../../../utils/logger';

// Safety cap on Graph pages walked per form per run (100 leads per page)
const MAX_LEAD_PAGES_PER_FORM = 50;
const RATE_LIMIT_BACKOFF_MS = 15 * 60 * 1000;
// Meta throttling codes: 4 app, 17 user, 32 page, 613 custom, 80005 leadgen per-page
const RATE_LIMIT_CODES = new Set([4, 17, 32, 613, 80005]);

export function isMetaRateLimitError(err: any): boolean {
  const code = Number(err?.response?.data?.error?.code ?? err?.code);
  return RATE_LIMIT_CODES.has(code) || /too many (leadgen )?(api )?calls|rate limit/i.test(String(err?.response?.data?.error?.message || err?.message || ''));
}

class MetaSyncEngine {
  private syncInterval: NodeJS.Timeout | null = null;
  private syncingTenants = new Set<string>();
  // Forms whose history up to their cutoff has been fully walked since this process started
  private backfilledForms = new Set<string>();
  private pageBackoffUntil = new Map<string, number>();

  /**
   * Pull leads for the forms the tenant explicitly connected in the Integrations wizard.
   * Forms without a saved campaign mapping are never polled.
   */
  public async syncAllMetaLeads(tenantId = 'company_kite_aviation'): Promise<{ syncedCount: number; formsSynced: number; errors: any[] }> {
    if (this.syncingTenants.has(tenantId)) return { syncedCount: 0, formsSynced: 0, errors: [] };
    this.syncingTenants.add(tenantId);

    let syncedCount = 0;
    let formsSynced = 0;
    const errors: any[] = [];

    try {
      const { metaService } = await import('./meta.service');
      const activePages = await metaService.getActiveConnectedPages(tenantId);

      if (activePages.length === 0) {
        return {
          syncedCount: 0,
          formsSynced: 0,
          errors: ['No active connected Facebook Pages found for tenant. Connect a Page under Integrations → Meta first.']
        };
      }

      const integrations = await multiTenantDb.getIntegrations(tenantId);
      const fbIntegration = integrations.find((i: any) => i.id === 'facebook');
      const campaignMappings: Record<string, any> = (fbIntegration?.credentials as any)?.campaignMappings || {};
      const connectedForms = Object.values(campaignMappings).filter((m: any) => m && m.formId && m.pageId);

      if (connectedForms.length === 0) {
        return { syncedCount: 0, formsSynced: 0, errors: [] };
      }

      const pagesById = new Map<string, any>();
      for (const page of activePages) {
        if (page.page_id && page.page_access_token && !String(page.page_id).startsWith('test_page_')) {
          pagesById.set(String(page.page_id), page);
        }
      }

      const existingLeads = await multiTenantDb.getLeads(tenantId, undefined, true);
      const existingLeadIds = new Set(
        existingLeads.map((l) => l.customFields?.meta_leadgen_id || l.id.replace('meta-lead-', ''))
      );

      for (const mapping of connectedForms as any[]) {
        const page = pagesById.get(String(mapping.pageId));
        if (!page) continue;
        if ((this.pageBackoffUntil.get(String(mapping.pageId)) || 0) > Date.now()) continue;
        formsSynced++;

        const cutoff = getImportCutoff(mapping);
        const backfillKey = `${tenantId}:${mapping.formId}:${mapping.connectedAt || mapping.updatedAt || ''}:${mapping.importOption || ''}`;
        const isBackfilled = this.backfilledForms.has(backfillKey);

        try {
          let url: string | null = `https://graph.facebook.com/${metaConfig.graphVersion}/${mapping.formId}/leads`;
          let params: Record<string, any> | undefined = {
            access_token: page.page_access_token,
            fields: 'id,created_time',
            limit: 100
          };

          for (let pageNo = 0; url && pageNo < MAX_LEAD_PAGES_PER_FORM; pageNo++) {
            const leadsRes: any = await axios.get(url, { params, timeout: 15000 });
            const leads: any[] = leadsRes.data?.data || [];
            let reachedCutoff = false;
            let reachedKnown = false;

            for (const rawLead of leads) {
              const createdMs = rawLead.created_time ? new Date(rawLead.created_time).getTime() : Date.now();
              if (cutoff > 0 && createdMs < cutoff) {
                reachedCutoff = true;
                continue;
              }
              if (existingLeadIds.has(rawLead.id)) {
                reachedKnown = true;
                continue;
              }

              await metaWorker.processLeadgenChange(
                {
                  value: {
                    leadgen_id: rawLead.id,
                    page_id: page.page_id,
                    form_id: mapping.formId,
                    form_name: mapping.formName || mapping.formId,
                    page_name: page.page_name
                  }
                },
                { tenantId }
              );

              existingLeadIds.add(rawLead.id);
              syncedCount++;
            }

            // Graph returns newest first, so anything after the cutoff (or after known leads once backfilled) is older.
            url = leadsRes.data?.paging?.next || null;
            params = undefined;
            if (reachedCutoff || !url) {
              this.backfilledForms.add(backfillKey);
              break;
            }
            if (reachedKnown && isBackfilled) break;
          }
        } catch (formErr: any) {
          if (isMetaRateLimitError(formErr)) {
            this.pageBackoffUntil.set(String(mapping.pageId), Date.now() + RATE_LIMIT_BACKOFF_MS);
            logger.warn(`[Meta Sync Engine] Page ${mapping.pageId} is rate limited by Meta; pausing polling for 15 minutes.`);
          }
          await metaService.handleAuthError(String(mapping.pageId), formErr).catch(() => {});
          errors.push({ form: mapping.formName || mapping.formId, page: page.page_name, error: formErr?.response?.data || formErr.message });
        }
      }

      if (syncedCount > 0) {
        logger.info(`[Meta Sync Engine] Synced ${syncedCount} lead(s) from ${formsSynced} connected form(s) for ${tenantId}.`);
      }
    } catch (err: any) {
      logger.warn('[Meta Sync Engine Notice]:', err?.response?.data?.error?.message || err?.message);
      errors.push(err?.message);
    } finally {
      this.syncingTenants.delete(tenantId);
    }

    return { syncedCount, formsSynced, errors };
  }

  public async syncAllConnectedTenants(): Promise<void> {
    try {
      const storeTenants = Object.keys((multiTenantDb as any).store?.facebookPages || {});
      const targets = storeTenants.length > 0
        ? storeTenants
        : [process.env.DEFAULT_TENANT_ID || 'company_kite_aviation'];
      for (const tenantId of targets) {
        await this.syncAllMetaLeads(tenantId).catch((e) =>
          logger.warn(`[Meta Sync ${tenantId}]:`, e?.message || e)
        );
      }
    } catch (e: any) {
      logger.warn('[Meta Sync All Tenants Notice]:', e?.message || e);
    }
  }

  public startPeriodicSync(intervalMs = 20000) {
    if (this.syncInterval) clearInterval(this.syncInterval);

    setTimeout(() => {
      this.syncAllConnectedTenants().catch((e) => logger.warn('[Meta Initial Sync Notice]:', e?.message));
    }, 5000);

    this.syncInterval = setInterval(() => {
      this.syncAllConnectedTenants().catch((e) => logger.warn('[Meta Periodic Sync Notice]:', e?.message));
    }, intervalMs);

    logger.info(`[Meta Sync Engine] Background lead poller started (every ${intervalMs / 1000}s)`);
  }

  public stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const metaSyncEngine = new MetaSyncEngine();
