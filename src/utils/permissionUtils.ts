import { Agent, PermissionTemplate, PermissionRights } from '../types';
import { getCrmRole, type CrmRole } from './roleUtils';

export const PERMISSION_RIGHT_KEYS: (keyof PermissionRights)[] = [
  'leads',
  'salesform',
  'team',
  'permissions',
  'calling',
  'reports',
  'automations',
  'tasks',
  'billings',
  'integrations',
  'aiAgents',
  'leadView',
  'dashboardView',
  'leadsTableView',
  'whatsappTemplates',
  'smsTemplates',
  'emailTemplates',
  'embeddedApps',
];

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

export const DEFAULT_TEMPLATE_IDS = {
  Admin: 'perm-default-admin',
  Manager: 'perm-default-manager',
  Telecaller: 'perm-default-telecaller',
} as const;

export type PermissionRoleKey = keyof typeof DEFAULT_TEMPLATE_IDS;

export function isCompleteRights(value: unknown): value is PermissionRights {
  if (!value || typeof value !== 'object') return false;
  return PERMISSION_RIGHT_KEYS.every((key) => typeof (value as PermissionRights)[key] === 'boolean');
}

export function normalizeRights(value: Partial<PermissionRights> | undefined, fallback: PermissionRights): PermissionRights {
  const source = value || {};
  const next = { ...fallback };
  for (const key of PERMISSION_RIGHT_KEYS) {
    if (typeof source[key] === 'boolean') next[key] = source[key] as boolean;
  }
  return next;
}

export function permissionRoleKey(permissionOrRole?: string | null): PermissionRoleKey {
  const value = String(permissionOrRole || '').toLowerCase();
  if (value.includes('admin') || value.includes('owner') || value.includes('root')) return 'Admin';
  if (value.includes('manager')) return 'Manager';
  return 'Telecaller';
}

export function rightsForRole(role: CrmRole | PermissionRoleKey): PermissionRights {
  if (role === 'Admin') {
    return { ...FULL_RIGHTS, tasks: false };
  }
  if (role === 'Manager') {
    return {
      ...FULL_RIGHTS,
      team: false,
      permissions: false,
      billings: false,
      integrations: false,
      automations: false,
      aiAgents: false,
      tasks: true,
      dashboardView: true,
    };
  }
  return {
    ...FULL_RIGHTS,
    team: false,
    permissions: false,
    reports: false,
    automations: false,
    billings: false,
    integrations: false,
    aiAgents: false,
    tasks: true,
    dashboardView: true,
    whatsappTemplates: true,
    smsTemplates: false,
    emailTemplates: false,
    embeddedApps: false,
  };
}

export function buildDefaultTemplates(): PermissionTemplate[] {
  const stamp = 'System';
  return (['Admin', 'Manager', 'Telecaller'] as PermissionRoleKey[]).map((role) => ({
    id: DEFAULT_TEMPLATE_IDS[role],
    name: `Default ${role} Permissions`,
    description: `System default access for ${role} assignees`,
    isDefault: true,
    isRoot: true,
    assignedCount: 0,
    assignedAgents: [],
    lastModifiedOn: stamp,
    createdOn: stamp,
    rights: rightsForRole(role),
  }));
}

export function mergeDefaultTemplates(existing: PermissionTemplate[] = []): { templates: PermissionTemplate[]; added: boolean } {
  const next = [...existing];
  let added = false;
  for (const template of buildDefaultTemplates()) {
    const found = next.some((item) => item.id === template.id || (item.isDefault && item.name === template.name));
    if (!found) {
      next.push(template);
      added = true;
    }
  }
  return { templates: next, added };
}

export function defaultTemplateForRole(role: PermissionRoleKey, templates: PermissionTemplate[] = []): PermissionTemplate {
  const id = DEFAULT_TEMPLATE_IDS[role];
  return templates.find((template) => template.id === id)
    || templates.find((template) => template.isDefault && template.name === `Default ${role} Permissions`)
    || buildDefaultTemplates().find((template) => template.id === id)!;
}

export function accessForPermission(permission: string, templates: PermissionTemplate[] = []): { permissionTemplateId: string; permissionRights: PermissionRights } {
  const role = permissionRoleKey(permission);
  const template = defaultTemplateForRole(role, templates);
  return {
    permissionTemplateId: template.id,
    permissionRights: normalizeRights(template.rights, rightsForRole(role)),
  };
}

export function seedAssigneeAccess(agent: Agent, templates: PermissionTemplate[] = []): { permissionTemplateId: string; permissionRights: PermissionRights } {
  if (agent.permissionTemplateId) {
    const linked = templates.find((template) => template.id === agent.permissionTemplateId);
    if (linked) {
      const role = permissionRoleKey(agent.permission || agent.role);
      return {
        permissionTemplateId: linked.id,
        permissionRights: normalizeRights(linked.rights, rightsForRole(role)),
      };
    }
  }
  return accessForPermission(agent.permission || agent.role || getCrmRole(agent), templates);
}

export function templateNameForAgent(agent: Agent, templates: PermissionTemplate[] = []): string {
  const linked = agent.permissionTemplateId
    ? templates.find((template) => template.id === agent.permissionTemplateId)
    : undefined;
  if (linked?.name) return linked.name;
  const role = permissionRoleKey(agent.permission || agent.role);
  return defaultTemplateForRole(role, templates).name;
}

export function getAgentPermissionRights(
  agent: Agent | undefined,
  templates: PermissionTemplate[] = []
): PermissionRights {
  const role = permissionRoleKey(agent?.permission || agent?.role || getCrmRole(agent));
  const fallback = rightsForRole(role);
  if (isCompleteRights(agent?.permissionRights)) return agent.permissionRights;
  if (agent?.permissionTemplateId) {
    const linked = templates.find((template) => template.id === agent.permissionTemplateId);
    if (linked) return normalizeRights(linked.rights, fallback);
  }
  return fallback;
}
