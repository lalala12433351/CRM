import type { Agent } from '../types';

type AgentLike = Pick<Agent, 'id' | 'name'> & { avatar?: string };

/**
 * Always prefer the live agent profile name over denormalized snapshots
 * (ownerAgentName / assigneeAgentName / agentName) so renames stay consistent.
 */
export function resolveAgentName(
  agents: AgentLike[] | undefined,
  opts: { id?: string | null; name?: string | null; fallback?: string } = {}
): string {
  const list = agents || [];
  const id = (opts.id || '').trim();
  if (id) {
    const byId = list.find((a) => a.id === id);
    if (byId?.name) return byId.name;
  }
  const name = (opts.name || '').trim();
  if (name) {
    const byName = list.find((a) => a.name === name);
    if (byName?.name) return byName.name;
    // Stale label that matches no current user — still show it only if no id; otherwise Unassigned
    if (!id) return name;
  }
  return opts.fallback || (name || 'Unassigned');
}

export function resolveAgentAvatar(
  agents: AgentLike[] | undefined,
  opts: { id?: string | null; name?: string | null; fallbackAvatar?: string } = {}
): string | undefined {
  const list = agents || [];
  const id = (opts.id || '').trim();
  if (id) {
    const byId = list.find((a) => a.id === id);
    if (byId?.avatar) return byId.avatar;
  }
  const name = (opts.name || '').trim();
  if (name) {
    const byName = list.find((a) => a.name === name);
    if (byName?.avatar) return byName.avatar;
  }
  return opts.fallbackAvatar;
}

/** True if a lead/call/task belongs to the given agent (id first, then live name). */
export function matchesAgent(
  agents: AgentLike[] | undefined,
  agent: AgentLike | null | undefined,
  opts: { id?: string | null; name?: string | null }
): boolean {
  if (!agent) return false;
  const id = (opts.id || '').trim();
  if (id && id === agent.id) return true;
  const live = resolveAgentName(agents, opts);
  return Boolean(agent.name && live.toLowerCase() === agent.name.toLowerCase());
}

export function isUnassignedOwner(opts: { id?: string | null; name?: string | null } = {}): boolean {
  const id = (opts.id || '').trim();
  if (id) return false;
  const name = (opts.name || '').trim().toLowerCase();
  return !name || name === 'unassigned';
}

type LeadLike = { id: string; name?: string; phone?: string };

/** Join a call/task snapshot to the live lead record so renamed contacts stay current. */
export function resolveLeadContact(
  leads: LeadLike[] | undefined,
  opts: { id?: string | null; name?: string | null; phone?: string | null } = {}
): { name: string; phone: string } {
  const list = leads || [];
  const id = (opts.id || '').trim();
  if (id) {
    const byId = list.find((l) => l.id === id);
    if (byId) {
      return {
        name: byId.name || opts.name || 'Contact',
        phone: byId.phone || opts.phone || ''
      };
    }
  }
  return {
    name: (opts.name || '').trim() || 'Contact',
    phone: opts.phone || ''
  };
}
