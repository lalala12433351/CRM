import { AuthenticatedRequest } from '../middleware/auth';
import { multiTenantDb, TenantAgent } from '../services/multiTenantDb';

export type AccessRole = 'admin' | 'manager' | 'telecaller';

export type AccessScope = {
  role: AccessRole;
  isAdmin: boolean;
  viewerId?: string;
  /** Empty with isAdmin means the full tenant. Otherwise the allowed agent ids. */
  agentIds: string[];
};

export function classifyRole(user?: { role?: string; isAdmin?: boolean }): AccessRole {
  if (!user) return 'telecaller';
  const role = (user.role || '').toLowerCase();
  if (user.isAdmin || role === 'admin' || role.includes('admin') || role.includes('owner') || role.includes('root')) {
    return 'admin';
  }
  if (role === 'manager' || role.includes('manager')) return 'manager';
  return 'telecaller';
}

export function teamIdsForManager(agents: TenantAgent[], managerId: string): string[] {
  const ids = new Set<string>([managerId]);
  for (const agent of agents) {
    if (agent.id === managerId || agent.managerId === managerId) ids.add(agent.id);
  }
  return [...ids];
}

export async function getAccessScope(req: AuthenticatedRequest): Promise<AccessScope> {
  const user = req.user;
  const tenantId = req.tenantId || 'default_tenant';
  const role = classifyRole(user);

  if (role === 'admin') {
    return { role, isAdmin: true, viewerId: user?.id, agentIds: [] };
  }
  if (!user?.id) {
    return { role: 'telecaller', isAdmin: false, agentIds: [] };
  }
  if (role === 'manager') {
    const agents = await multiTenantDb.getAgents(tenantId);
    return {
      role,
      isAdmin: false,
      viewerId: user.id,
      agentIds: teamIdsForManager(agents, user.id)
    };
  }
  return { role: 'telecaller', isAdmin: false, viewerId: user.id, agentIds: [user.id] };
}

export function resolveRequestedAgentIds(
  agents: TenantAgent[],
  scope: AccessScope,
  userId?: string,
  managerId?: string
): string[] | null {
  const requestedUser = userId && userId !== 'ALL' ? userId : undefined;
  const requestedManager = managerId && managerId !== 'ALL' ? managerId : undefined;

  let allowed = scope.isAdmin ? agents.map((agent) => agent.id) : [...scope.agentIds];

  if (requestedManager) {
    const team = teamIdsForManager(agents, requestedManager);
    allowed = allowed.filter((id) => team.includes(id));
  }

  if (requestedUser) {
    allowed = allowed.includes(requestedUser) ? [requestedUser] : [];
  }

  if (scope.isAdmin && !requestedUser && !requestedManager) return null;
  return allowed;
}
