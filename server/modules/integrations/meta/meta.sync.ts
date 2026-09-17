import axios from 'axios';
import { metaConfig } from '../../../config/meta';
import { metaWorker } from './meta.worker';
import { multiTenantDb } from '../../../services/multiTenantDb';
import { logger } from '../../../utils/logger';

class MetaSyncEngine {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  /**
   * Sync all recent leads from all connected Meta forms
   */
  public async syncAllMetaLeads(tenantId = 'company_kite_aviation'): Promise<{ syncedCount: number; errors: any[] }> {
    if (this.isSyncing) return { syncedCount: 0, errors: [] };
    this.isSyncing = true;

    let syncedCount = 0;
    const errors: any[] = [];

    try {
      const { metaService } = await import('./meta.service');
      const activePages = await metaService.getActiveConnectedPages(tenantId);

      // Fallback: If no database pages, check env variables
      if (activePages.length === 0 && process.env.META_PAGE_ACCESS_TOKEN) {
        activePages.push({
          client_id: tenantId,
          page_id: process.env.META_PAGE_ID || '1354212834436427',
          page_name: process.env.META_PAGE_NAME || 'Meta Page',
          page_access_token: process.env.META_PAGE_ACCESS_TOKEN
        });
      }

      if (activePages.length === 0) {
        this.isSyncing = false;
        return { syncedCount: 0, errors: ['No active connected Facebook Pages found for tenant.'] };
      }

      const existingLeads = await multiTenantDb.getLeads(tenantId, undefined, true);
      const existingLeadIds = new Set(
        existingLeads.map((l) => l.customFields?.meta_leadgen_id || l.id.replace('meta-lead-', ''))
      );

      for (const page of activePages) {
        try {
          const { page_id, page_access_token, page_name } = page;

          // 1. Fetch all Leadgen Forms on Page via Meta Graph API v22.0
          const formsRes = await axios.get(`https://graph.facebook.com/${metaConfig.graphVersion}/${page_id}/leadgen_forms`, {
            params: { access_token: page_access_token }
          });

          const forms = formsRes.data?.data || [];

          // 2. Iterate through each form on Page
          for (const form of forms) {
            try {
              const leadsRes = await axios.get(
                `https://graph.facebook.com/${metaConfig.graphVersion}/${form.id}/leads`,
                {
                  params: {
                    access_token: page_access_token,
                    limit: 50
                  }
                }
              );

              const leads = leadsRes.data?.data || [];

              for (const rawLead of leads) {
                if (!existingLeadIds.has(rawLead.id)) {
                  // Ingest live lead through worker pipeline
                  await metaWorker.processLeadgenChange({
                    value: {
                      leadgen_id: rawLead.id,
                      page_id: page_id,
                      form_id: form.id,
                      form_name: form.name || form.id,
                      page_name: page_name
                    }
                  });

                  existingLeadIds.add(rawLead.id);
                  syncedCount++;
                }
              }
            } catch (formErr: any) {
              errors.push({ form: form.name || form.id, page: page_name, error: formErr?.response?.data || formErr.message });
            }
          }
        } catch (pageErr: any) {
          errors.push({ page: page.page_name, error: pageErr?.response?.data || pageErr.message });
        }
      }

      if (syncedCount > 0) {
        logger.info(`[Meta Sync Engine] 🚀 Successfully synced ${syncedCount} live lead(s) from Meta Graph API.`);
      }
    } catch (err: any) {
      logger.warn('[Meta Sync Engine Notice]:', err?.response?.data?.error?.message || err?.message);
      errors.push(err?.message);
    } finally {
      this.isSyncing = false;
    }

    return { syncedCount, errors };
  }

  /**
   * Start periodic background sync every N seconds
   */
  public startPeriodicSync(intervalMs = 20000) {
    if (this.syncInterval) clearInterval(this.syncInterval);

    // Run initial sync after 5s
    setTimeout(() => {
      this.syncAllMetaLeads().catch((e) => logger.warn('[Meta Initial Sync Notice]:', e?.message));
    }, 5000);

    // Recurring sync
    this.syncInterval = setInterval(() => {
      this.syncAllMetaLeads().catch((e) => logger.warn('[Meta Periodic Sync Notice]:', e?.message));
    }, intervalMs);

    logger.info(`[Meta Sync Engine] ⚡ Background lead poller started (every ${intervalMs / 1000}s)`);
  }

  public stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const metaSyncEngine = new MetaSyncEngine();
