import { Agent, PermissionTemplate, PermissionRights } from '../types';
import { INITIAL_PERMISSION_TEMPLATES } from '../data/mockData';

export function getAgentPermissionRights(
  agent: Agent | undefined, 
  templates: PermissionTemplate[] = INITIAL_PERMISSION_TEMPLATES
): PermissionRights {
  const defaultRights: PermissionRights = {
    leads: true,
    salesform: true,
    team: true,
    permissions: true,
    calling: true,
    reports: true,
    automations: true,
    tasks: true,
    billings: true,
    integrations: true,
    aiAgents: true,
    leadView: true,
    dashboardView: true,
    leadsTableView: true,
    whatsappTemplates: true,
    smsTemplates: true,
    emailTemplates: true,
    embeddedApps: true,
  };

  // Grant full unrestricted access across all CRM features, integrations, and settings
  return defaultRights;
}
