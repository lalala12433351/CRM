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
      const pageId = process.env.META_PAGE_ID || '1354212834436427';
      const token = process.env.META_PAGE_ACCESS_TOKEN;

      if (!token) {
        this.isSyncing = false;
        return { syncedCount: 0, errors: ['Missing META_PAGE_ACCESS_TOKEN'] };
      }

      // 1. Fetch all Leadgen Forms on Page
      const formsRes = await axios.get(`https://graph.facebook.com/${metaConfig.graphVersion}/${pageId}/leadgen_forms`, {
        params: { access_token: token }
      });

      const forms = formsRes.data.data || [];
      const existingLeads = await multiTenantDb.getLeads(tenantId, undefined, true);
      const existingLeadIds = new Set(
        existingLeads.map((l) => l.customFields?.meta_leadgen_id || l.id.replace('meta-lead-', ''))
      );

      // 2. Iterate through each form
      for (const form of forms) {
        try {
          const leadsRes = await axios.get(
            `https://graph.facebook.com/${metaConfig.graphVersion}/${form.id}/leads`,
            {
              params: {
                access_token: token,
                limit: 25
              }
            }
          );

          const leads = leadsRes.data.data || [];

          for (const rawLead of leads) {
            if (!existingLeadIds.has(rawLead.id)) {
              // Ingest new lead through worker pipeline
              await metaWorker.processLeadgenChange({
                value: {
                  leadgen_id: rawLead.id,
                  page_id: pageId,
                  form_id: form.id
                }
              });

              existingLeadIds.add(rawLead.id);
              syncedCount++;
            }
          }
        } catch (formErr: any) {
          errors.push({ form: form.name, error: formErr?.response?.data || formErr.message });
        }
      }

      if (syncedCount > 0) {
        logger.info(`[Meta Sync] 🚀 Successfully synced ${syncedCount} new lead(s) from Meta forms.`);
      }
    } catch (err: any) {
      logger.warn('[Meta Sync Notice]:', err?.response?.data?.error?.message || err?.message);
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
