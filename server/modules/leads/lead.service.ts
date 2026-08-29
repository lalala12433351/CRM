import { leadRepository } from './lead.repository';

export class LeadService {
  public async getLeads(agentId?: string, isAdmin?: boolean) {
    return await leadRepository.getLeads(agentId, isAdmin);
  }

  public async saveLead(leadData: any) {
    return await leadRepository.saveLead(leadData);
  }

  public async getFieldSettings() {
    return await leadRepository.getFieldSettings();
  }

  public async saveFieldSettings(payload: any) {
    if (Array.isArray(payload)) {
      return await leadRepository.saveAllFieldSettings(payload);
    } else if (payload && payload.id) {
      return await leadRepository.saveFieldSetting(payload);
    }
    throw new Error('Invalid field setting payload');
  }
}

export const leadService = new LeadService();
