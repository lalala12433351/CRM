import { Agent, isAgentAdmin, PermissionRights } from '../types';

export type CrmRole = 'Admin' | 'Manager' | 'Telecaller';

/** Normalize legacy role names (Caller, Counselor, etc.) into the 3 CRM roles. */
export function getCrmRole(agent?: Agent | null): CrmRole {
  if (!agent) return 'Telecaller';
  const role = (agent.role || '').toLowerCase();
  const permission = (agent.permission || '').toLowerCase();
  // Normalize legacy labels
  if (
    role === 'super admin' ||
    role === 'master admin' ||
    role === 'root' ||
    role.includes('super admin') ||
    role.includes('master admin')
  ) {
    return 'Admin';
  }
  if (isAgentAdmin(agent)) return 'Admin';
  if (role === 'manager' || permission === 'manager') return 'Manager';
  if (role.includes('admin') || role.includes('owner') || permission === 'admin') return 'Admin';
  return 'Telecaller';
}

export function isManagerRole(agent?: Agent | null): boolean {
  return getCrmRole(agent) === 'Manager';
}

export function isTelecallerRole(agent?: Agent | null): boolean {
  return getCrmRole(agent) === 'Telecaller';
}

export function isTelecallerLikeRoleName(role?: string): boolean {
  const r = (role || '').toLowerCase();
  return r.includes('caller') || r === 'telecaller' || r === 'counselor' || r === 'employee';
}

/** Views blocked for non-admins (settings flyout + AI automations + integrations). */
export const ADMIN_ONLY_VIEWS = [
  'settings',
  'workflows',
  'workflow_builder',
  'integrations',
  'fields',
  'call_feedback',
  'permissions',
  'conversions',
  'conversion_tracking',
] as const;

/** Views the Admin does not use (Tasks plus the per-agent call history). */
export const ADMIN_BLOCKED_VIEWS = [
  'tasks',
  'calls',
  'calling_logs',
] as const;

/** Views only Admin may open (Managers blocked too). */
export const MANAGER_BLOCKED_VIEWS = [
  ...ADMIN_ONLY_VIEWS,
  'team',
] as const;

/** Extra views telecallers cannot open (managers may still use these). */
export const TELECALLER_BLOCKED_VIEWS = [
  ...ADMIN_ONLY_VIEWS,
  'campaigns',
  'team',
  'reports',
  'analytics',
  'pipeline',
  'marketing',
] as const;

function viewAllowedByRole(agent: Agent | null | undefined, view: string): boolean {
  const role = getCrmRole(agent);
  if (role === 'Admin') {
    return !(ADMIN_BLOCKED_VIEWS as readonly string[]).includes(view);
  }
  if (role === 'Manager') {
    return !(MANAGER_BLOCKED_VIEWS as readonly string[]).includes(view);
  }
  return !(TELECALLER_BLOCKED_VIEWS as readonly string[]).includes(view);
}

/** Allow or deny a view from the assignee's saved rights. */
export function viewAllowedByRights(rights: PermissionRights, view: string, agent?: Agent | null): boolean {
  switch (view) {
    case 'dashboard':
      return rights.dashboardView;
    case 'leads':
      return rights.leads && rights.leadsTableView;
    case 'followups':
    case 'inbox':
    case 'add_lead':
      return rights.leads;
    case 'salesform':
      return rights.salesform;
    case 'pipeline':
    case 'campaigns':
      return rights.leads && rights.reports;
    case 'reports':
    case 'analytics':
      return rights.reports;
    case 'tasks':
      return rights.tasks;
    case 'calls':
    case 'calling_logs':
      if (getCrmRole(agent) === 'Admin') return false;
      return rights.calling;
    case 'whatsapp':
      return rights.whatsappTemplates;
    case 'team':
      return rights.team;
    case 'workflows':
    case 'workflow_builder':
      return rights.automations;
    case 'integrations':
    case 'marketing':
      return rights.integrations;
    case 'settings':
      return rights.permissions || rights.billings;
    case 'fields':
    case 'call_feedback':
    case 'permissions':
    case 'conversions':
    case 'conversion_tracking':
      return rights.permissions;
    case 'docs_sign':
      return rights.embeddedApps;
    case 'device_permissions':
      return true;
    default:
      return true;
  }
}

export function canAccessView(
  agent: Agent | null | undefined,
  view: string,
  rights?: PermissionRights | null
): boolean {
  if (rights) return viewAllowedByRights(rights, view, agent);
  if (agent?.permissionRights && typeof agent.permissionRights.leads === 'boolean') {
    return viewAllowedByRights(agent.permissionRights, view, agent);
  }
  return viewAllowedByRole(agent, view);
}

export function getDefaultViewForRole(agent?: Agent | null): string {
  const role = getCrmRole(agent);
  if (role === 'Telecaller') return 'dashboard';
  if (role === 'Manager') return 'dashboard';
  return 'dashboard';
}

export function formatRoleBadge(agent?: Agent | null): string {
  return getCrmRole(agent);
}
