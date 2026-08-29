import React, { useState, useMemo } from 'react';
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
  UserX,
  Check,
  Trash2,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { Lead, Agent, PipelineStage, HourlyMetric, isAgentAdmin, CustomFieldDef, formatDealValue } from '../types';

interface DashboardViewProps {
  leads: Lead[];
  agents: Agent[];
  stages: PipelineStage[];
  hourlyMetrics: HourlyMetric[];
  activeAgent?: Agent;
  customFields?: CustomFieldDef[];
  currency?: string;
  onOpenLeadDetail: (lead: Lead) => void;
  onOpenPowerDialerForLead?: (lead: Lead) => void;
  onNavigateToTab: (tab: string) => void;
  onDeleteLead?: (leadId: string) => void;
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  agents,
  stages,
  hourlyMetrics,
  activeAgent,
  customFields = [],
  currency = 'INR',
  onOpenLeadDetail,
  onOpenPowerDialerForLead,
  onNavigateToTab,
  onDeleteLead,
  onUpdateLead,
}) => {
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tableSourceFilter, setTableSourceFilter] = useState('ALL');
  const [tableStatusFilter, setTableStatusFilter] = useState('ALL');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('ALL');
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(agents[0]?.id || null);
  const [selectedDashboardLeadIds, setSelectedDashboardLeadIds] = useState<string[]>([]);
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpHour, setFollowUpHour] = useState('10');
  const [followUpMinute, setFollowUpMinute] = useState('00');
  const [followUpAmPm, setFollowUpAmPm] = useState('AM');
  const [followUpRemarks, setFollowUpRemarks] = useState('');

  const isAdmin = isAgentAdmin(activeAgent);

  const openFollowUpModal = (lead: Lead) => {
    const defaultDate = new Date(Date.now() + 3600000);
    setFollowUpDate(defaultDate.toISOString().slice(0, 10));
    let h = defaultDate.getHours();
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    setFollowUpHour(String(h).padStart(2, '0'));
    setFollowUpMinute(String(Math.round(defaultDate.getMinutes() / 5) * 5 % 60).padStart(2, '0'));
    setFollowUpAmPm(period);
    setFollowUpRemarks('');
    setFollowUpLead(lead);
  };

  const handleSaveFollowUp = () => {
    if (!followUpLead || !onUpdateLead) return;
    let h = parseInt(followUpHour, 10);
    if (followUpAmPm === 'PM' && h !== 12) h += 12;
    if (followUpAmPm === 'AM' && h === 12) h = 0;
    const combinedDate = `${followUpDate}T${String(h).padStart(2, '0')}:${followUpMinute}:00`;

    onUpdateLead(followUpLead.id, {
      status: 'Follow Up',
      followUpAt: combinedDate,
      updatedAt: new Date().toISOString()
    });

    setFollowUpLead(null);
  };

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
  const totalEstimatedRevenue = leads.reduce((acc, curr) => acc + (Number(curr.dealValue) || 0), 0);
  const totalCallsToday = agents.reduce((acc, a) => acc + a.totalCallsToday, 0);
  const totalTalkTimeMin = agents.reduce((acc, a) => acc + a.talkTimeMinutes, 0);

  // Follow ups due today
  const pendingFollowUps = leads.filter((l) => l.followUpAt && l.status !== 'Converted' && l.status !== 'Lost');

  // Dynamically extract all available sources and stages from props & leads data
  const availableSources = React.useMemo(() => {
    const defaultSources = [
      "Facebook Ads",
      "Google Ads",
      "Meta Ads",
      "IndiaMart",
      "JustDial",
      "99acres",
      "WhatsApp",
      "Website Inbound",
      "Instagram",
      "Referral",
      "Cold Outbound",
      "Manual Import",
      "Direct"
    ];
    const leadSources = leads.map((l) => l.source).filter(Boolean) as string[];
    const combined = Array.from(new Set([...defaultSources, ...leadSources]));
    return combined.sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const availableStages = React.useMemo(() => {
    const stageNames = (stages && stages.length > 0 ? stages.map((s) => s.name) : []);
    const leadStatuses = leads.map((l) => l.status).filter(Boolean) as string[];
    const extraStatuses = leadStatuses.filter((st) => !stageNames.some((sn) => sn.toLowerCase() === st.toLowerCase()));
    const uniqueExtras = Array.from(new Set(extraStatuses));
    return [...stageNames, ...uniqueExtras];
  }, [stages, leads]);

  const getSourceCount = (src: string) => {
    return leads.filter((l) => l.source && l.source.toLowerCase() === src.toLowerCase()).length;
  };

  const getStageCount = (stg: string) => {
    return leads.filter((l) => l.status && l.status.toLowerCase() === stg.toLowerCase()).length;
  };

  // Filtered leads for the Master Dashboard Directory Table
  const filteredDashboardLeads = leads.filter((lead) => {
    const matchesSearch =
      !tableSearch ||
      (lead.name || '').toLowerCase().includes(tableSearch.toLowerCase()) ||
      (lead.company || '').toLowerCase().includes(tableSearch.toLowerCase()) ||
      (lead.phone || '').includes(tableSearch) ||
      (lead.ownerAgentName && lead.ownerAgentName.toLowerCase().includes(tableSearch.toLowerCase()));

    const matchesSource =
      tableSourceFilter === 'ALL' ||
      (lead.source && lead.source.toLowerCase() === tableSourceFilter.toLowerCase());

    const matchesStatus =
      tableStatusFilter === 'ALL' ||
      (lead.status && lead.status.toLowerCase() === tableStatusFilter.toLowerCase());

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

  const visibleFields = useMemo(() => {
    const active = (customFields || []).filter((f) => !f.isHidden);
    return active.sort((a, b) => {
      if (a.name === 'name') return -1;
      if (b.name === 'name') return 1;
      if (a.name === 'phone' || a.name === 'number') return -1;
      if (b.name === 'phone' || b.name === 'number') return 1;
      return 0;
    });
  }, [customFields]);

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
          totalRevenue: totalEstimatedRevenue,
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
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans px-1 py-0.5">
        {activeAgent ? (
          <div className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-1.5 shadow-2xs inline-flex items-center">
            <span className="text-sm sm:text-base font-bold text-slate-900 font-open-sans tracking-tight" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              {activeAgent.name.replace(/\s*\((Admin|Employee)\)/gi, '')}
            </span>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-1.5 shadow-2xs inline-flex items-center">
            <h1 className="text-sm sm:text-base font-bold text-slate-900">CRM Executive Dashboard</h1>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateToTab('add_lead')}
            className="px-3.5 py-1.5 rounded-lg bg-white/70 hover:bg-white text-slate-800 text-xs font-medium border border-white/80 transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-600" />
            <span>Add Lead</span>
          </button>

          <button
            onClick={() => onNavigateToTab('leads')}
            className="px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white text-slate-800 text-xs font-medium border border-white/80 transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>All Leads</span>
          </button>
        </div>
      </div>

      {/* Minimal KPI Metric Strip (50% Width) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full sm:w-1/2">
        {/* Total Calls */}
        <div className="bg-transparent border-2 border-slate-300 p-3 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Calls Today</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">{totalCallsToday}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100/70 border border-slate-200 flex items-center justify-center text-indigo-600">
            <PhoneCall className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Total Talk Time */}
        <div className="bg-transparent border-2 border-slate-300 p-3 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Talk Time</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">{Math.floor(totalTalkTimeMin / 60)}h {totalTalkTimeMin % 60}m</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100/70 border border-slate-200 flex items-center justify-center text-indigo-600">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Due Follow-up Queue (Glass-card background matching Lead Directory, Transparent item background, Left-aligned Contact column) */}
      <div className="w-full sm:w-[60%]">
        <div className="glass-card p-3.5 sm:p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              Due Follow-Up Queue
            </h2>
          </div>

          {/* Column Headers for Lead, Assignee, Contact (Left-Aligned) */}
          <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 pb-1 border-b border-slate-100">
            <div className="col-span-4">Lead</div>
            <div className="col-span-4">Assignee</div>
            <div className="col-span-4 text-left">Contact</div>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {pendingFollowUps.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-3 font-mono">All scheduled follow-ups completed!</p>
            ) : (
              pendingFollowUps.map((lead) => (
                <div key={lead.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-transparent hover:bg-slate-100/50 transition-all text-xs border-b border-slate-100/60 last:border-0">
                  {/* Lead Column */}
                  <div className="col-span-4 min-w-0">
                    <p onClick={() => onOpenLeadDetail(lead)} className="font-bold text-slate-900 truncate cursor-pointer hover:text-indigo-600 hover:underline capitalize">{lead.name}</p>
                  </div>

                  {/* Assignee Column */}
                  <div className="col-span-4 min-w-0">
                    <p className="text-slate-600 truncate text-[11px]">{lead.ownerAgentName || 'Unassigned'}</p>
                  </div>

                  {/* Contact Column (Left-Aligned with generous gap between phone number and action buttons) */}
                  <div className="col-span-4 flex items-center justify-start gap-6 sm:gap-8 min-w-0">
                    <span className="text-[10px] text-slate-600 font-mono hidden md:inline truncate shrink-0 mr-3 sm:mr-5">{lead.phone}</span>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleCallLead(lead)}
                        title={`Call ${lead.phone || lead.name}`}
                        className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-all shrink-0"
                      >
                        <PhoneCall className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (onUpdateLead) {
                            onUpdateLead(lead.id, { followUpAt: undefined, status: 'Contacted', updatedAt: new Date().toISOString() });
                          }
                        }}
                        title="Mark Follow-Up Complete & Remove from Queue"
                        className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-all shrink-0"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onOpenLeadDetail(lead)}
                        className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] cursor-pointer shrink-0"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Section: Directory & Assignees' Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Directory (Full width expanded) */}
        <div className="lg:col-span-12 glass-card p-3.5 sm:p-4 rounded-xl space-y-3.5">
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



          {/* Selected Assignee Details Box (Pure White Background Box) */}
          {selectedAssigneeId !== 'ALL' && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between flex-wrap gap-3 my-2">
              <div className="flex items-center space-x-3">
                {selectedAssigneeId !== 'UNASSIGNED' ? (() => {
                  const selectedAgent = agents.find(a => a.id === selectedAssigneeId);
                  if (!selectedAgent) return null;
                  return (
                    <>
                      {selectedAgent.avatar ? (
                        <img src={selectedAgent.avatar} alt={selectedAgent.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-200">
                          {selectedAgent.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-slate-900">{selectedAgent.name}'s Assigned Leads</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{selectedAgent.role || 'Telecaller'} • {selectedAgent.email} • {selectedAgent.phone}</p>
                      </div>
                    </>
                  );
                })() : (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Unassigned Leads Directory</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Leads waiting for sales representative allocation</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedAssigneeId('ALL')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200"
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search Bar Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search lead, company, agent..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-6 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#3a2088] focus:ring-1 focus:ring-[#3a2088] shadow-2xs font-sans placeholder:text-slate-400"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* All Sources Dropdown */}
            <select
              value={tableSourceFilter}
              onChange={(e) => setTableSourceFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#3a2088] focus:ring-1 focus:ring-[#3a2088] cursor-pointer shadow-2xs font-sans font-medium"
            >
              <option value="ALL">All Sources</option>
              {availableSources.map((src) => {
                return (
                  <option key={src} value={src}>
                    {src}
                  </option>
                );
              })}
            </select>

            {/* All Stages Dropdown */}
            <select
              value={tableStatusFilter}
              onChange={(e) => setTableStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#3a2088] focus:ring-1 focus:ring-[#3a2088] cursor-pointer shadow-2xs font-sans font-medium"
            >
              <option value="ALL">All Stages</option>
              {availableStages.map((stgName) => {
                return (
                  <option key={stgName} value={stgName}>
                    {stgName}
                  </option>
                );
              })}
            </select>

            {/* Reset Filters Button */}
            {(tableSourceFilter !== 'ALL' || tableStatusFilter !== 'ALL' || tableSearch !== '') && (
              <button
                onClick={() => {
                  setTableSourceFilter('ALL');
                  setTableStatusFilter('ALL');
                  setTableSearch('');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* MOBILE DIRECTORY CARDS (Small Screen TeleCRM View - Pure White Box) */}
          <div className="block md:hidden space-y-2.5">
            {filteredDashboardLeads.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                No matching leads found in directory.
              </div>
            ) : (
              filteredDashboardLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2 shadow-2xs hover:border-slate-400 active:border-slate-400 transition-all"
                >
                  <div className="flex items-start justify-between gap-2" onClick={() => onOpenLeadDetail(lead)}>
                    <div className="bg-slate-50/80 border border-slate-200/60 hover:border-slate-400 active:border-slate-400 px-3 py-1 rounded-xl transition-colors">
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate font-['Poppins',sans-serif] tracking-tight">{lead.name}</h4>
                      {lead.company && <p className="text-[11px] text-slate-500 truncate font-['Poppins',sans-serif]">{lead.company}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-900">{formatDealValue(lead.dealValue || 0, currency)}</p>
                      <span className="text-[10px] font-semibold text-[#3a2088] bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
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
                  {visibleFields.map((field) => (
                    <th key={field.id} className="px-3.5 py-2.5 font-medium whitespace-nowrap">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-3.5 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDashboardLeads.length === 0 ? (
                  <tr>
                    <td colSpan={visibleFields.length + 1} className="px-4 py-6 text-center text-slate-400 text-xs">
                      No matching leads found in directory.
                    </td>
                  </tr>
                ) : (
                  filteredDashboardLeads.map((lead) => {
                    const isSelected = selectedDashboardLeadIds.includes(lead.id);

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/70 transition-all group">
                        {visibleFields.map((field) => {
                          const k = field.name;

                          if (field.primarySlot === 'H1' || k === 'name') {
                            return (
                              <td key={field.id} className="px-3.5 py-2.5 cursor-pointer" onClick={() => onOpenLeadDetail(lead)}>
                                <div className="font-bold text-slate-900 flex items-center space-x-1.5 text-sm font-['Poppins',sans-serif]">
                                  <span className="truncate max-w-[200px] hover:text-[#3a2088] hover:underline capitalize">{lead.name}</span>
                                  {lead.tags?.includes('High Value') && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      VIP
                                    </span>
                                  )}
                                </div>
                                {lead.company && <p className="text-[11px] text-slate-400 truncate max-w-[170px] mt-0.5">{lead.company}</p>}
                              </td>
                            );
                          }

                          if (k === 'status') {
                            const stageConfig = stages.find(s => s.name.toLowerCase() === (lead.status || '').toLowerCase());
                            const color = stageConfig?.color || '#6366F1';
                            return (
                              <td key={field.id} className="px-3.5 py-2.5 whitespace-nowrap">
                                <span
                                  style={{ backgroundColor: `${color}15`, color: color, borderColor: `${color}40` }}
                                  className="border px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                                >
                                  {lead.status || 'Fresh'}
                                </span>
                              </td>
                            );
                          }

                          if (k === 'source') {
                            return (
                              <td key={field.id} className="px-3.5 py-2.5 whitespace-nowrap">
                                <span className="text-slate-700 text-xs font-medium">
                                  {lead.source || 'Direct'}
                                </span>
                              </td>
                            );
                          }

                          if (k === 'deal_value' || k === 'dealValue') {
                            return (
                              <td key={field.id} className="px-3.5 py-2.5 whitespace-nowrap">
                                <span className="font-semibold text-slate-900 text-xs">
                                  {formatDealValue(lead.dealValue || 0, currency)}
                                </span>
                              </td>
                            );
                          }

                          if (k === 'assignee' || k === 'owner') {
                            return (
                              <td key={field.id} className="px-3.5 py-2.5 whitespace-nowrap">
                                <span className="text-slate-700 text-xs font-normal">
                                  {lead.ownerAgentName || 'Unassigned'}
                                </span>
                              </td>
                            );
                          }

                          const displayVal = lead.customFields && lead.customFields[k] !== undefined && lead.customFields[k] !== null
                            ? String(lead.customFields[k])
                            : (lead as any)[k] ? String((lead as any)[k]) : '—';

                          return (
                            <td key={field.id} className="px-3.5 py-2.5 text-slate-700 text-xs font-normal whitespace-nowrap truncate max-w-[170px]">
                              {displayVal}
                            </td>
                          );
                        })}

                        {/* Actions Column */}
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleCallLead(lead)}
                              className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-[11px] cursor-pointer"
                              title="Call Lead"
                            >
                              <span>Call</span>
                            </button>
                            <button
                              onClick={() => openFollowUpModal(lead)}
                              className="inline-flex items-center px-2 py-1 rounded-lg bg-transparent text-[#5034a8] hover:bg-purple-50/50 border border-purple-200 font-semibold text-[11px] cursor-pointer"
                              title="Schedule Follow-Up"
                            >
                              <span>Follow Up</span>
                            </button>
                            <button
                              onClick={() => onOpenLeadDetail(lead)}
                              className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-medium text-[11px] cursor-pointer"
                              title="View Lead Details"
                            >
                              <span>View</span>
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

      </div>

      {/* SCHEDULE FOLLOW-UP MODAL */}
      {followUpLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Schedule Follow-Up</h3>
                <p className="text-xs text-slate-500 mt-0.5">Set a reminder for {followUpLead.name}</p>
              </div>
              <button
                onClick={() => setFollowUpLead(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors text-sm font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Follow-Up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Follow-Up Time</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={followUpHour}
                    onChange={(e) => setFollowUpHour(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                  >
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="font-bold text-slate-400">:</span>
                  <select
                    value={followUpMinute}
                    onChange={(e) => setFollowUpMinute(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                  >
                    {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={followUpAmPm}
                    onChange={(e) => setFollowUpAmPm(e.target.value)}
                    className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Notes / Remarks (Optional)</label>
                <textarea
                  value={followUpRemarks}
                  onChange={(e) => setFollowUpRemarks(e.target.value)}
                  rows={3}
                  placeholder="e.g. Call back regarding course details & discount offer..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-600 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setFollowUpLead(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFollowUp}
                className="px-5 py-2 rounded-xl bg-[#5034a8] hover:bg-[#3d2785] text-white font-bold cursor-pointer text-xs transition-colors shadow-2xs"
              >
                Save Follow-Up
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
