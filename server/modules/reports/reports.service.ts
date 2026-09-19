import { multiTenantDb, TenantAgent, TenantCall, TenantLead } from '../../services/multiTenantDb';
import { AccessScope, classifyRole, resolveRequestedAgentIds, teamIdsForManager } from '../../utils/accessScope';

export type ReportCallRecord = {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  agentId: string;
  agentName: string;
  assigneeName?: string;
  type: string;
  durationSeconds: number;
  callStartTime?: string;
  callEndTime?: string;
  recordingUrl?: string;
  disposition: string;
  notes?: string;
  callNotes?: string;
  assigneeRemarks?: string;
  timestamp: string;
};

export type ReportFilters = {
  userId?: string;
  managerId?: string;
  from?: string;
  to?: string;
  search?: string;
  disposition?: string;
  type?: string;
  sort?: 'newest' | 'oldest' | 'duration_desc' | 'duration_asc';
};

function parseItemDate(dateStr?: string): Date {
  if (!dateStr || dateStr === 'Just Now') return new Date();
  if (dateStr.includes('ago')) {
    const d = new Date();
    const match = dateStr.match(/(\d+)\s*(d|day|days|h|hour|hours|m|min|minute|minutes)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      if (unit.startsWith('d')) d.setDate(d.getDate() - val);
      else if (unit.startsWith('h')) d.setHours(d.getHours() - val);
    }
    return d;
  }
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function isDateInRange(timestampStr: string | undefined, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  if (!timestampStr) return true;
  try {
    const itemDate = parseItemDate(timestampStr).toISOString().slice(0, 10);
    if (from && itemDate < from) return false;
    if (to && itemDate > to) return false;
    return true;
  } catch {
    return true;
  }
}

function callMatchesAgents(call: TenantCall, agents: TenantAgent[], agentIds: string[] | null): boolean {
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

export function mapCallRecord(call: TenantCall): ReportCallRecord {
  return {
    id: call.id,
    leadId: call.leadId || '',
    leadName: call.leadName || 'Contact',
    leadPhone: call.leadPhone || '',
    agentId: call.agentId || '',
    agentName: call.agentName || call.assigneeName || '',
    assigneeName: call.assigneeName,
    type: call.callType || 'outgoing',
    durationSeconds: Number(call.durationSeconds) || 0,
    callStartTime: call.callStart,
    callEndTime: call.callEnd,
    recordingUrl: call.recordingUrl,
    disposition: call.disposition || 'Connected',
    notes: call.callNotes || '',
    callNotes: call.callNotes,
    assigneeRemarks: call.assigneeRemarks,
    timestamp: call.callStart || call.createdAt
  };
}

function publicAgent(agent: TenantAgent) {
  const role = classifyRole(agent);
  return {
    id: agent.id,
    name: agent.name,
    email: agent.email,
    phone: agent.phone,
    role: agent.role,
    crmRole: role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : 'Telecaller',
    managerId: agent.managerId,
    avatar: agent.avatar || '',
    status: agent.status
  };
}

function formatHourLabel(slot: number): string {
  if (slot === 0) return '12 AM';
  if (slot === 12) return '12 PM';
  if (slot > 12) return `${slot - 12} PM`;
  return `${slot} AM`;
}

export async function buildCallLogsReport(tenantId: string, scope: AccessScope, filters: ReportFilters) {
  const [allAgents, allCalls, allLeads] = await Promise.all([
    multiTenantDb.getAgents(tenantId),
    multiTenantDb.getCalls(tenantId),
    multiTenantDb.getLeads(tenantId, [], true)
  ]);

  const visibleAgents = scope.isAdmin
    ? allAgents
    : allAgents.filter((agent) => scope.agentIds.includes(agent.id));

  const scopedIds = resolveRequestedAgentIds(allAgents, scope, filters.userId, filters.managerId);
  const users = filters.managerId && filters.managerId !== 'ALL'
    ? visibleAgents.filter((agent) => teamIdsForManager(visibleAgents, filters.managerId!).includes(agent.id))
    : visibleAgents;
  const managers = visibleAgents.filter((agent) => classifyRole(agent) === 'manager');

  const scopedCalls = allCalls.filter((call) => {
    if (!callMatchesAgents(call, allAgents, scopedIds)) return false;
    const stamp = call.callStart || call.createdAt;
    return isDateInRange(stamp, filters.from, filters.to);
  });

  const search = (filters.search || '').trim().toLowerCase();
  const disposition = filters.disposition && filters.disposition !== 'ALL' ? filters.disposition : undefined;
  const type = filters.type && filters.type !== 'ALL' ? filters.type : undefined;

  const listedCalls = scopedCalls.filter((call) => {
    if (disposition && call.disposition !== disposition) return false;
    const callType = call.callType || 'outgoing';
    if (type && callType !== type) return false;
    if (search) {
      const hay = [call.leadName, call.leadPhone, call.agentName, call.assigneeName, call.callNotes, call.assigneeRemarks]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  const sort = filters.sort || 'newest';
  listedCalls.sort((a, b) => {
    const aTime = new Date(a.callStart || a.createdAt).getTime();
    const bTime = new Date(b.callStart || b.createdAt).getTime();
    if (sort === 'oldest') return aTime - bTime;
    if (sort === 'duration_desc') return (b.durationSeconds || 0) - (a.durationSeconds || 0);
    if (sort === 'duration_asc') return (a.durationSeconds || 0) - (b.durationSeconds || 0);
    return bTime - aTime;
  });

  const talkTimeSeconds = scopedCalls.reduce((sum, call) => sum + (Number(call.durationSeconds) || 0), 0);
  const ownerIds = new Set(scopedIds || users.map((agent) => agent.id));
  const scopedLeads = (allLeads as TenantLead[]).filter((lead) => {
    if (!isDateInRange(lead.createdAt || lead.updatedAt, filters.from, filters.to)) return false;
    if (!scopedIds) return true;
    return Boolean(lead.ownerAgentId && ownerIds.has(lead.ownerAgentId));
  });
  const sales = scopedLeads
    .filter((lead) => {
      const status = (lead.status || '').toLowerCase();
      return status === 'converted' || status === 'won';
    })
    .reduce((sum, lead) => sum + (Number(lead.dealValue) || 0), 0);

  const hourlySlots = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  const hourly = hourlySlots.map((slot) => {
    const calls = scopedCalls.filter((call) => {
      const hour = new Date(call.callStart || call.createdAt).getHours();
      return hour >= slot && hour < slot + 2;
    }).length;
    return { hour: formatHourLabel(slot), slot, calls };
  });
  const peak = hourly.reduce((best, row) => (row.calls > best.calls ? row : best), hourly[0]);

  const rankedAgents = users.map((agent) => {
    const agentCalls = scopedCalls.filter((call) => callMatchesAgents(call, [agent], [agent.id]));
    const agentLeads = scopedLeads.filter(
      (lead) =>
        lead.ownerAgentId === agent.id ||
        (lead.ownerAgentName && lead.ownerAgentName.toLowerCase() === (agent.name || '').toLowerCase())
    );
    const converted = agentLeads.filter((lead) => {
      const status = (lead.status || '').toLowerCase();
      return status === 'converted' || status === 'won';
    });
    const talkSecs = agentCalls.reduce((sum, call) => sum + (Number(call.durationSeconds) || 0), 0);
    const revenue = converted.reduce((sum, lead) => sum + (Number(lead.dealValue) || 0), 0);
    const totalCalls = agentCalls.length;
    return {
      ...publicAgent(agent),
      calculatedCalls: totalCalls,
      calculatedConverted: converted.length,
      calculatedTalkTimeSecs: talkSecs,
      calculatedRevenue: revenue,
      winRate: totalCalls > 0 ? Math.round((converted.length / totalCalls) * 100) : converted.length > 0 ? 100 : 0
    };
  }).sort((a, b) => b.calculatedConverted - a.calculatedConverted || b.calculatedRevenue - a.calculatedRevenue || b.calculatedCalls - a.calculatedCalls);

  return {
    users: users.map(publicAgent),
    managers: managers.map(publicAgent),
    calls: listedCalls.map(mapCallRecord),
    metrics: {
      totalCalls: scopedCalls.length,
      connectedCalls: scopedCalls.filter((call) => (call.durationSeconds || 0) > 0).length,
      talkTimeSeconds,
      sales,
      listedCount: listedCalls.length
    },
    hourly,
    peakHour: peak && peak.calls > 0 ? `${peak.hour}` : null,
    rankedAgents
  };
}

export function filterCallsForScope(calls: TenantCall[], agents: TenantAgent[], scope: AccessScope): TenantCall[] {
  if (scope.isAdmin) return calls;
  return calls.filter((call) => callMatchesAgents(call, agents, scope.agentIds));
}
