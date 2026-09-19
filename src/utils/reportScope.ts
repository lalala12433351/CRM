import { Agent, CallRecord } from '../types';
import { getCrmRole } from './roleUtils';

export function teamIdsForManager(agents: Agent[], managerId: string): string[] {
  const ids = new Set<string>([managerId]);
  for (const agent of agents) {
    if (agent.id === managerId || agent.managerId === managerId) ids.add(agent.id);
  }
  return [...ids];
}

export function listManagers(agents: Agent[]): Agent[] {
  return agents.filter((agent) => getCrmRole(agent) === 'Manager');
}

export function usersForManagerFilter(agents: Agent[], managerId?: string): Agent[] {
  if (!managerId || managerId === 'ALL') return agents;
  const team = new Set(teamIdsForManager(agents, managerId));
  return agents.filter((agent) => team.has(agent.id));
}

/** null = every visible user. */
export function resolveReportAgentIds(
  agents: Agent[],
  userId?: string,
  managerId?: string
): string[] | null {
  const specificUser = userId && userId !== 'ALL' ? userId : undefined;
  const specificManager = managerId && managerId !== 'ALL' ? managerId : undefined;
  if (!specificUser && !specificManager) return null;

  let allowed = agents.map((agent) => agent.id);
  if (specificManager) {
    const team = teamIdsForManager(agents, specificManager);
    allowed = allowed.filter((id) => team.includes(id));
  }
  if (specificUser) {
    return allowed.includes(specificUser) ? [specificUser] : [];
  }
  return allowed;
}

export function callBelongsToAgents(
  call: CallRecord,
  agents: Agent[],
  agentIds: string[] | null
): boolean {
  if (!agentIds) return true;
  if (call.agentId && agentIds.includes(call.agentId)) return true;
  const names = new Set(
    agents
      .filter((agent) => agentIds.includes(agent.id))
      .map((agent) => (agent.name || '').trim().toLowerCase())
      .filter(Boolean)
  );
  const callName = (call.agentName || call.assigneeName || '').trim().toLowerCase();
  return Boolean(callName && names.has(callName));
}

export function roleLabel(agent: Agent): string {
  return getCrmRole(agent);
}
