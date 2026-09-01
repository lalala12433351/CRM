import { multiTenantDb } from '../../services/multiTenantDb';

export class LeadRepository {
  public async getLeads(tenantId: string, agentId?: string, isAdmin?: boolean) {
    return await multiTenantDb.getLeads(tenantId, agentId, isAdmin);
  }

  public async saveLead(tenantId: string, leadData: any) {
    return await multiTenantDb.saveLead(tenantId, leadData);
  }

  public async deleteLead(tenantId: string, leadId: string) {
    return await multiTenantDb.deleteLead(tenantId, leadId);
  }

  public async getFieldSettings(tenantId: string) {
    return await multiTenantDb.getFieldSettings(tenantId);
  }

  public async saveFieldSettings(tenantId: string, fields: any[]) {
    return await multiTenantDb.saveFieldSettings(tenantId, fields);
  }
}

export const leadRepository = new LeadRepository();
