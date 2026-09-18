import { Agent, isAgentAdmin } from '../types';

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

/** Views only Admin may open (Managers blocked too). */
export const MANAGER_BLOCKED_VIEWS = [
  ...ADMIN_ONLY_VIEWS,
  'team',
  'tasks',
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
  'tasks',
] as const;

export function canAccessView(agent: Agent | null | undefined, view: string): boolean {
  const role = getCrmRole(agent);
  if (role === 'Admin') {
    // Admin does not use Tasks
    return view !== 'tasks';
  }
  if (role === 'Manager') {
    return !(MANAGER_BLOCKED_VIEWS as readonly string[]).includes(view);
  }
  return !(TELECALLER_BLOCKED_VIEWS as readonly string[]).includes(view);
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
