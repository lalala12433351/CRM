import React, { useState } from 'react';
import { 
  Users, 
  PhoneCall, 
  Clock, 
  IndianRupee, 
  Sparkles, 
  Flame, 
  ArrowUpRight, 
  Calendar, 
  RefreshCw,
  Search,
  UserCheck,
  Check,
  Trash2,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { Lead, Agent, PipelineStage, HourlyMetric } from '../types';

interface DashboardViewProps {
  leads: Lead[];
  agents: Agent[];
  stages: PipelineStage[];
  hourlyMetrics: HourlyMetric[];
  activeAgent?: Agent;
  onOpenLeadDetail: (lead: Lead) => void;
  onOpenPowerDialerForLead?: (lead: Lead) => void;
  onNavigateToTab: (tab: string) => void;
  onDeleteLead?: (leadId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  agents,
  stages,
  hourlyMetrics,
  activeAgent,
  onOpenLeadDetail,
  onOpenPowerDialerForLead,
  onNavigateToTab,
  onDeleteLead,
}) => {
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tableSourceFilter, setTableSourceFilter] = useState('ALL');
  const [tableStatusFilter, setTableStatusFilter] = useState('ALL');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('ALL');
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(agents[0]?.id || null);
  const [selectedDashboardLeadIds, setSelectedDashboardLeadIds] = useState<string[]>([]);

  // Helper to enforce assignee calling authority
  const handleCallLead = (lead: Lead) => {
    if (lead.ownerAgentId && activeAgent && lead.ownerAgentId !== activeAgent.id) {
      alert(`Call Authority Restricted: Lead "${lead.name}" is assigned to ${lead.ownerAgentName}. Only ${lead.ownerAgentName} has authority to place calls to this lead.`);
      return;
    }
    window.location.href = `tel:${lead.phone}`;
    if (onOpenPowerDialerForLead) {
      onOpenPowerDialerForLead(lead);
    }
  };

  // Compute stats
  const totalLeads = leads.length;
  const hotLeadsCount = leads.filter((l) => l.aiRating === 'Hot').length;
  const convertedLeads = leads.filter((l) => l.status === 'Converted');
  const totalRevenue = convertedLeads.reduce((acc, curr) => acc + (curr.dealValue || 0), 0);
  const totalCallsToday = agents.reduce((acc, a) => acc + a.totalCallsToday, 0);
  const totalTalkTimeMin = agents.reduce((acc, a) => acc + a.talkTimeMinutes, 0);

  // Follow ups due today
  const pendingFollowUps = leads.filter((l) => l.followUpAt && l.status !== 'Converted' && l.status !== 'Lost');

  // Filtered leads for the Master Dashboard Directory Table
  const filteredDashboardLeads = leads.filter((lead) => {
    const matchesSearch = 
      (lead.name || '').toLowerCase().includes(tableSearch.toLowerCase()) ||
      (lead.company || '').toLowerCase().includes(tableSearch.toLowerCase()) ||
      (lead.phone || '').includes(tableSearch) ||
      (lead.ownerAgentName && lead.ownerAgentName.toLowerCase().includes(tableSearch.toLowerCase()));
    
    const matchesSource = tableSourceFilter === 'ALL' || lead.source === tableSourceFilter;
    const matchesStatus = tableStatusFilter === 'ALL' || lead.status === tableStatusFilter;
    const matchesAssignee = 
      selectedAssigneeId === 'ALL' ? true :
      selectedAssigneeId === 'UNASSIGNED' ? (!lead.ownerAgentId) :
      lead.ownerAgentId === selectedAssigneeId;

    return matchesSearch && matchesSource && matchesStatus && matchesAssignee;
  });

  const handleToggleLeadSelect = (id: string) => {
    setSelectedDashboardLeadIds((prev) => 
      prev.includes(id) ? prev.filter(lId => lId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDashboardLeadIds.length === filteredDashboardLeads.length) {
      setSelectedDashboardLeadIds([]);
    } else {
      setSelectedDashboardLeadIds(filteredDashboardLeads.map(l => l.id));
    }
  };

  // Fetch AI Insights from server endpoint
  const handleFetchAiInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch('/api/ai/business-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalLeads,
          hotLeadsCount,
          totalRevenue,
          totalCallsToday,
          totalTalkTimeMin
        })
      });
      const data = await res.json();
      if (data && data.insights) {
        setAiInsights(data.insights);
      }
    } catch (e) {
      console.error("Failed to load insights:", e);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 space-y-3 max-w-7xl mx-auto text-slate-800 font-sans pb-20 md:pb-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
        {activeAgent ? (
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            <div>
              <span className="text-sm font-bold text-slate-900">{activeAgent.name}</span>
              <span className="text-xs text-slate-400 ml-2 font-normal hidden sm:inline">Active Telecaller Workspace</span>
            </div>
          </div>
        ) : (
          <h1 className="text-base font-bold text-slate-900">CRM Executive Dashboard</h1>
        )}

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateToTab('add_lead')}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>

          <button
            onClick={() => onNavigateToTab('leads')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium border border-slate-200 transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>All Leads ({totalLeads})</span>
          </button>
        </div>
      </div>

      {/* Minimal KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {/* Total Calls */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Calls Today</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">{totalCallsToday}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <PhoneCall className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Total Talk Time */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Talk Time</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">{Math.floor(totalTalkTimeMin / 60)}h {totalTalkTimeMin % 60}m</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Converted Revenue */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Revenue</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">₹{(totalRevenue / 100000).toFixed(2)}L</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <IndianRupee className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* AI Hot Leads */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Hot Leads</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">{hotLeadsCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Main Section: Directory & Assignees' Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Directory (Full width expanded) */}
        <div className="lg:col-span-12 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3.5">
          {/* Header & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
                  Lead Directory
                </h2>
              </div>
            </div>

            {selectedAssigneeId !== 'ALL' && (
              <button
                onClick={() => setSelectedAssigneeId('ALL')}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-all cursor-pointer flex items-center space-x-1 self-start sm:self-auto"
              >
                <span>Clear Filter</span>
              </button>
            )}
          </div>

          {/* Quick Assignee Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] text-slate-500 font-semibold shrink-0 mr-1">Assignee:</span>
            <button
              onClick={() => setSelectedAssigneeId('ALL')}
              className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer shrink-0 border font-medium ${
                selectedAssigneeId === 'ALL'
                  ? 'bg-indigo-600 text-white font-semibold border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              All ({leads.length})
            </button>
            {agents.map((ag) => {
              const count = leads.filter((l) => l.ownerAgentId === ag.id).length;
              const isCurrentActive = activeAgent?.id === ag.id;
              return (
                <button
                  key={ag.id}
                  onClick={() => setSelectedAssigneeId(ag.id)}
                  className={`px-3 py-1 rounded-lg text-xs flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 border font-medium ${
                    selectedAssigneeId === ag.id
                      ? 'bg-indigo-600 text-white font-semibold border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span>{ag.name}</span>
                  {isCurrentActive && <span className="text-[10px] text-indigo-200 font-normal">(You)</span>}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedAssigneeId === ag.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => setSelectedAssigneeId('UNASSIGNED')}
              className={`px-3 py-1 rounded-lg text-xs flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 border font-medium ${
                selectedAssigneeId === 'UNASSIGNED'
                  ? 'bg-indigo-600 text-white font-semibold border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <span>Unassigned</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedAssigneeId === 'UNASSIGNED' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {leads.filter((l) => !l.ownerAgentId).length}
              </span>
            </button>
          </div>

          {/* Select Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={tableSourceFilter}
              onChange={(e) => setTableSourceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Sources</option>
              <option value="Facebook Ads">Facebook Ads</option>
              <option value="Google Ads">Google Ads</option>
              <option value="IndiaMart">IndiaMart</option>
              <option value="JustDial">JustDial</option>
              <option value="99acres">99acres</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Website Inbound">Website Inbound</option>
            </select>

            <select
              value={tableStatusFilter}
              onChange={(e) => setTableStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Stages</option>
              <option value="New Lead">New Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* MOBILE DIRECTORY CARDS (Small Screen TeleCRM View) */}
          <div className="block md:hidden space-y-2.5">
            {filteredDashboardLeads.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No matching leads found in directory.
              </div>
            ) : (
              filteredDashboardLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2" onClick={() => onOpenLeadDetail(lead)}>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-xs truncate">{lead.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{lead.company || lead.city || 'Lead'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-900">₹{(lead.dealValue || 0).toLocaleString()}</p>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                        {lead.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>{lead.source}</span>
                    <span className="text-slate-700 font-medium">{lead.phone}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 pt-1">
                    <button
                      onClick={() => handleCallLead(lead)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Call</span>
                    </button>
                    <button
                      onClick={() => onOpenLeadDetail(lead)}
                      className="py-1.5 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP MASTER TABLE (Medium+ Screens) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 max-h-[500px]">
            <table className="w-full text-left text-xs text-slate-600 font-normal">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-3.5 py-2.5 w-10 text-center">
                    <button onClick={handleSelectAll} className="cursor-pointer inline-flex items-center justify-center">
                      {selectedDashboardLeadIds.length > 0 && selectedDashboardLeadIds.length === filteredDashboardLeads.length ? (
                        <div className="w-4 h-4 rounded-[4px] bg-[#5034a8] flex items-center justify-center border border-[#5034a8]">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-[4px] border border-slate-300 bg-white hover:border-[#5034a8] transition-colors"></div>
                      )}
                    </button>
                  </th>
                  <th className="px-3.5 py-2.5 font-medium">Lead & Company</th>
                  <th className="px-3.5 py-2.5 font-medium">Source</th>
                  <th className="px-3.5 py-2.5 font-medium">Stage</th>
                  <th className="px-3.5 py-2.5 font-medium">Deal</th>
                  <th className="px-3.5 py-2.5 font-medium">Contact</th>
                  <th className="px-3.5 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDashboardLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-xs">
                      No matching leads found in directory.
                    </td>
                  </tr>
                ) : (
                  filteredDashboardLeads.map((lead) => {
                    const isSelected = selectedDashboardLeadIds.includes(lead.id);
                    return (
                      <tr key={lead.id} className={`hover:bg-slate-50/70 transition-all group ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                        {/* Checkbox */}
                        <td className="px-3.5 py-2.5 text-center">
                          <button onClick={() => handleToggleLeadSelect(lead.id)} className="cursor-pointer inline-flex items-center justify-center">
                            {isSelected ? (
                              <div className="w-4 h-4 rounded-[4px] bg-[#5034a8] flex items-center justify-center border border-[#5034a8]">
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-[4px] border border-slate-300 bg-white hover:border-[#5034a8] transition-colors"></div>
                            )}
                          </button>
                        </td>

                        {/* Lead Name */}
                        <td className="px-3.5 py-2.5 cursor-pointer" onClick={() => onOpenLeadDetail(lead)}>
                          <div className="font-semibold text-slate-900 flex items-center space-x-1.5 text-xs">
                            <span className="truncate max-w-[170px] hover:text-indigo-600 hover:underline">{lead.name}</span>
                            {lead.tags?.includes('High Value') && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-[170px] mt-0.5">{lead.company}</p>
                        </td>

                        {/* Source */}
                        <td className="px-3.5 py-2.5">
                          <span className="text-slate-700 text-xs font-medium">
                            {lead.source}
                          </span>
                        </td>

                        {/* Stage */}
                        <td className="px-3.5 py-2.5">
                          {(() => {
                            const stageConfig = stages.find(s => s.name.toLowerCase() === (lead.status || '').toLowerCase());
                            const color = stageConfig?.color || '#6366F1';
                            return (
                              <span 
                                style={{ backgroundColor: `${color}15`, color: color, borderColor: `${color}40` }}
                                className="border px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                              >
                                {lead.status}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Value */}
                        <td className="px-3.5 py-2.5">
                          <span className="font-semibold text-slate-900 text-xs">
                            ₹{(lead.dealValue || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="px-3.5 py-2.5 text-xs">
                          <p className="text-slate-700 font-medium">{lead.phone}</p>
                        </td>

                        {/* Actions */}
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleCallLead(lead)}
                              title="1-Click Dial"
                              className="p-1.5 rounded-lg border transition-all cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete lead "${lead.name}"?`)) {
                                  if (onDeleteLead) onDeleteLead(lead.id);
                                }
                              }}
                              title="Delete Lead"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assignees' Leads Panel */}
        <div className="lg:col-span-12 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
                Assignees' Leads
              </h2>
            </div>
          </div>

          {/* Assignees Accordion / List */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {agents.map((agent) => {
              const assignedLeads = leads.filter((l) => l.ownerAgentId === agent.id);
              const isExpanded = expandedAgentId === agent.id;
              const isLoggedAgent = activeAgent?.id === agent.id;

              return (
                <div key={agent.id} className={`rounded-lg bg-slate-50 border overflow-hidden ${
                  isLoggedAgent ? 'border-indigo-300' : 'border-slate-200'
                }`}>
                  {/* Agent Card Header */}
                  <div
                    onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full object-cover border border-slate-300 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-bold text-slate-900 truncate">{agent.name}</p>
                          {isLoggedAgent && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[9px] font-mono font-bold border border-indigo-200">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{agent.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Assigned Leads List */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-white p-2.5 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1 pb-1">
                        <span>Assigned Leads ({assignedLeads.length})</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssigneeId(agent.id);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 cursor-pointer font-bold underline"
                        >
                          Show in Directory
                        </button>
                      </div>

                      {assignedLeads.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-3 font-mono">No leads assigned to {agent.name}</p>
                      ) : (
                        assignedLeads.map((lead) => {
                          const isAssignedToOther = lead.ownerAgentId && activeAgent && lead.ownerAgentId !== activeAgent.id;

                          return (
                            <div key={lead.id} className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-all">
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center space-x-1.5">
                                  <span onClick={() => onOpenLeadDetail(lead)} className="text-xs font-bold text-slate-900 truncate cursor-pointer hover:text-indigo-600 hover:underline">{lead.name}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-slate-200 text-slate-700">
                                    {lead.status}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono">{lead.phone} • {lead.company}</p>
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleCallLead(lead)}
                                  title="Dial Lead"
                                  className="p-1 rounded cursor-pointer transition-all border bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                >
                                  <PhoneCall className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned Leads Card */}
            {(() => {
              const unassignedLeads = leads.filter((l) => !l.ownerAgentId);
              const isUnassignedExpanded = expandedAgentId === 'UNASSIGNED';

              return (
                <div className="rounded-lg bg-slate-50 border border-slate-200 overflow-hidden">
                  <div
                    onClick={() => setExpandedAgentId(isUnassignedExpanded ? null : 'UNASSIGNED')}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        ?
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">Unassigned Queue</p>
                        <p className="text-[10px] text-slate-500 font-mono">Needs Allocation</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-mono font-bold shadow-2xs">
                        {unassignedLeads.length} Unassigned
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isUnassignedExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {isUnassignedExpanded && (
                    <div className="border-t border-slate-200 bg-white p-2.5 space-y-2">
                      {unassignedLeads.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-3 font-mono">All leads are assigned!</p>
                      ) : (
                        unassignedLeads.map((lead) => (
                          <div key={lead.id} className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-all">
                            <div className="min-w-0 flex-1 pr-2">
                              <p onClick={() => onOpenLeadDetail(lead)} className="text-xs font-bold text-slate-900 truncate cursor-pointer hover:text-indigo-600 hover:underline">{lead.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{lead.phone} • {lead.source}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleCallLead(lead)}
                                title="Dial Lead"
                                className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                              >
                                <PhoneCall className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Secondary Bottom Row: Due Follow-ups Queue */}
      <div className="grid grid-cols-1 gap-4">

        {/* Due Follow-up Reminders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 flex items-center space-x-2 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Due Follow-Up Queue</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {pendingFollowUps.length} DUE
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {pendingFollowUps.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 font-mono">All scheduled follow-ups completed!</p>
            ) : (
              pendingFollowUps.map((lead) => (
                <div key={lead.id} className="p-2 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-all">
                  <div className="min-w-0 flex-1 pr-2">
                    <p onClick={() => onOpenLeadDetail(lead)} className="text-xs font-bold text-slate-900 truncate cursor-pointer hover:text-indigo-600 hover:underline">{lead.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{lead.company} • {lead.source}</p>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleCallLead(lead)}
                      title="1-Click Dial"
                      className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-all"
                    >
                      <PhoneCall className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onOpenLeadDetail(lead)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
