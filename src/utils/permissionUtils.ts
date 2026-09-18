import { Agent, PermissionTemplate, PermissionRights } from '../types';
import { INITIAL_PERMISSION_TEMPLATES } from '../constants/initialState';
import { getCrmRole } from './roleUtils';

const FULL_RIGHTS: PermissionRights = {
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

export function getAgentPermissionRights(
  agent: Agent | undefined,
  _templates: PermissionTemplate[] = INITIAL_PERMISSION_TEMPLATES
): PermissionRights {
  const role = getCrmRole(agent);

  if (role === 'Admin') {
    return {
      ...FULL_RIGHTS,
      tasks: false, // Admin does not use the Tasks module
    };
  }

  if (role === 'Manager') {
    return {
      ...FULL_RIGHTS,
      team: false, // Users & Team is Admin-only
      permissions: false,
      billings: false,
      integrations: false,
      automations: false,
      aiAgents: false,
      tasks: true,
      dashboardView: true,
    };
  }

  // Telecaller: dashboard (without lead-by-stages), assigned leads/follow-ups, calling
  return {
    ...FULL_RIGHTS,
    team: false,
    permissions: false,
    reports: false,
    automations: false,
    billings: false,
    integrations: false,
    aiAgents: false,
    tasks: false,
    dashboardView: true,
    whatsappTemplates: true,
    smsTemplates: false,
    emailTemplates: false,
    embeddedApps: false,
  };
}
