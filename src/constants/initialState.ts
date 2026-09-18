/**
 * Frontend bootstrap constants.
 * Keep these EMPTY — live CRM data must come from `/api/*` → `.data/multi_tenant_store.json`.
 * Structural defaults (stages/fields) are provisioned server-side when a tenant is created.
 */
import {
  Lead,
  Agent,
  PipelineStage,
  CallRecord,
  ActivityLog,
  WhatsAppMessage,
  WhatsAppTemplate,
  WhatsAppCampaign,
  WorkflowRule,
  CustomFieldDef,
  HourlyMetric,
  PermissionTemplate
} from '../types';

export const INITIAL_AGENTS: Agent[] = [];
export const INITIAL_STAGES: PipelineStage[] = [];
export const INITIAL_CUSTOM_FIELDS: CustomFieldDef[] = [];
export const INITIAL_LEADS: Lead[] = [];
export const INITIAL_CALL_RECORDS: CallRecord[] = [];
export const INITIAL_ACTIVITIES: ActivityLog[] = [];
export const INITIAL_MESSAGES: WhatsAppMessage[] = [];
export const INITIAL_TEMPLATES: WhatsAppTemplate[] = [];
export const INITIAL_CAMPAIGNS: WhatsAppCampaign[] = [];
export const INITIAL_WORKFLOWS: WorkflowRule[] = [];
export const HOURLY_METRICS: HourlyMetric[] = [];
export const INITIAL_PERMISSION_TEMPLATES: PermissionTemplate[] = [];
