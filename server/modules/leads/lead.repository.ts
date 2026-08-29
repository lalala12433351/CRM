import {
  getAwsClient,
  saveLeadToAwsDb,
  getAwsDbFieldSettings,
  saveAwsDbFieldSetting,
  saveAwsDbAllFieldSettings,
  executeAwsQuery
} from '../../../src/lib/awsDb';
import { logger } from '../../utils/logger';

export class LeadRepository {
  public async getLeads(agentId?: string, isAdmin?: boolean) {
    const pool = await getAwsClient();
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM leads ORDER BY created_at DESC;';
      let params: any[] = [];

      if (!isAdmin && agentId) {
        query = 'SELECT * FROM leads WHERE assignee_id = $1 OR assignee_name ILIKE $2 ORDER BY created_at DESC;';
        params = [String(agentId), `%${String(agentId)}%`];
      }

      const result = await client.query(query, params);
      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        company: row.company,
        city: row.city,
        state: row.state,
        source: row.source,
        status: row.status,
        pipelineStageId: row.pipeline_stage_id,
        dealValue: Number(row.deal_value || 0),
        ownerAgentId: row.assignee_id,
        ownerAgentName: row.assignee_name,
        aiScore: row.ai_score,
        aiRating: row.ai_rating,
        aiReasoning: row.ai_reasoning,
        notes: row.notes,
        customFields: row.custom_fields || {},
        tags: row.tags || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  public async saveLead(leadData: any) {
    return await saveLeadToAwsDb(leadData);
  }

  public async getFieldSettings() {
    return await getAwsDbFieldSettings();
  }

  public async saveFieldSetting(field: any) {
    return await saveAwsDbFieldSetting(field);
  }

  public async saveAllFieldSettings(fields: any[]) {
    return await saveAwsDbAllFieldSettings(fields);
  }
}

export const leadRepository = new LeadRepository();
