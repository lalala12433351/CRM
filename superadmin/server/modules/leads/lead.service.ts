import { leadRepository } from './lead.repository';

export class LeadService {
  public async getLeads(tenantId: string, agentId?: string, isAdmin?: boolean) {
    return await leadRepository.getLeads(tenantId, agentId, isAdmin);
  }

  public async saveLead(tenantId: string, leadData: any) {
    return await leadRepository.saveLead(tenantId, leadData);
  }

  public async deleteLead(tenantId: string, leadId: string) {
    return await leadRepository.deleteLead(tenantId, leadId);
  }

  public async getFieldSettings(tenantId: string) {
    return await leadRepository.getFieldSettings(tenantId);
  }

  public async saveFieldSettings(tenantId: string, payload: any) {
    const fields = Array.isArray(payload) ? payload : [payload];
    return await leadRepository.saveFieldSettings(tenantId, fields);
  }
}

export const leadService = new LeadService();
