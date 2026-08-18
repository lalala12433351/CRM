import React, { useState } from 'react';
import { 
  PhoneCall, 
  Trophy, 
  UserCheck, 
  Search, 
  Download, 
  PhoneOutgoing, 
  PhoneIncoming, 
  PhoneMissed,
  Save,
  Check,
  Calendar,
  Filter,
  User,
  ArrowUpRight,
  Sparkles,
  Clock,
  ArrowUpDown,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { CallRecord, Agent, Lead, ActivityLog } from '../types';
import { CallRecordingPlayer } from './CallRecordingPlayer';

export type ReportsSubTab = 'call_logs' | 'leaderboard' | 'user_report';

interface ReportsViewProps {
  initialSubTab?: ReportsSubTab;
  callRecords: CallRecord[];
  agents: Agent[];
  leads: Lead[];
  activities: ActivityLog[];
  onOpenLeadDetail?: (lead: Lead) => void;
  onOpenPowerDialerForLead?: (lead: Lead) => void;
  onUpdateCallRecord?: (callId: string, updates: Partial<CallRecord>) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  initialSubTab = 'call_logs',
  callRecords,
  agents,
  leads,
  activities,
  onOpenLeadDetail,
  onOpenPowerDialerForLead,
  onUpdateCallRecord
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ReportsSubTab>(initialSubTab);

  // Global / Shared Date Range Filter State across all components
  type DatePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'LAST_30' | 'CUSTOM';
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Call Logs Filter & Time Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState<string>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');
  const [callTypeFilter, setCallTypeFilter] = useState<string>('ALL');
  const [callSortOption, setCallSortOption] = useState<'newest' | 'oldest' | 'duration_desc' | 'duration_asc'>('newest');

  // Leaderboard Sorting State
  type LeaderboardSortOption = 'deals_desc' | 'revenue_desc' | 'calls_desc' | 'talk_time_desc' | 'win_rate_desc';
  const [leaderboardSortBy, setLeaderboardSortBy] = useState<LeaderboardSortOption>('deals_desc');

  // Individual Telecaller Report State
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || 'agent-1');
  const [userReportCallSort, setUserReportCallSort] = useState<'newest' | 'oldest' | 'duration_desc' | 'duration_asc'>('newest');

  // Inline Call Remarks Edit State
  const [callRemarksState, setCallRemarksState] = useState<Record<string, string>>({});
  const [savedRemarksCallId, setSavedRemarksCallId] = useState<string | null>(null);

  // Helper function to handle preset selections
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const todayStr = new Date().toISOString().slice(0, 10);

    if (preset === 'ALL') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'TODAY') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const d = new Date(todayStr);
      d.setDate(d.getDate() - 1);
      const yestStr = d.toISOString().slice(0, 10);
      setFromDate(yestStr);
      setToDate(yestStr);
    } else if (preset === 'LAST_7') {
      const d = new Date(todayStr);
      d.setDate(d.getDate() - 7);
      setFromDate(d.toISOString().slice(0, 10));
      setToDate(todayStr);
    } else if (preset === 'LAST_30') {
      const d = new Date(todayStr);
      d.setDate(d.getDate() - 30);
      setFromDate(d.toISOString().slice(0, 10));
      setToDate(todayStr);
    }
  };

  const handleSaveRemarks = (callId: string) => {
    const remark = callRemarksState[callId];
    if (remark !== undefined && onUpdateCallRecord) {
      onUpdateCallRecord(callId, { assigneeRemarks: remark, assigneeUpdatedAt: new Date().toISOString() });
      setSavedRemarksCallId(callId);
      setTimeout(() => setSavedRemarksCallId(null), 2000);
    }
  };

  // Helper function to check if a ISO/date string falls within fromDate & toDate
  const isDateInRange = (timestampStr: string) => {
    if (!fromDate && !toDate) return true;
    try {
      const itemDate = new Date(timestampStr).toISOString().slice(0, 10);
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      return true;
    } catch {
      return true;
    }
  };

  // 1. Date Filtered Call Records
  const dateFilteredCalls = callRecords.filter(c => isDateInRange(c.timestamp));

  // 2. Date Filtered Leads
  const dateFilteredLeads = leads.filter(l => isDateInRange(l.createdAt || l.updatedAt || ''));

  // Filter & Sort Call Records for Call Logs Subtab
  const filteredAndSortedCallRecords = dateFilteredCalls
    .filter((call) => {
      const matchesSearch = 
        call.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.leadPhone.includes(searchTerm) ||
        call.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.notes.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDisposition = dispositionFilter === 'ALL' || call.disposition === dispositionFilter;
      const matchesAgent = agentFilter === 'ALL' || call.agentId === agentFilter;
      const matchesType = callTypeFilter === 'ALL' || call.type === callTypeFilter;

      return matchesSearch && matchesDisposition && matchesAgent && matchesType;
    })
    .sort((a, b) => {
      if (callSortOption === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (callSortOption === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (callSortOption === 'duration_desc') {
        return (b.durationSeconds || 0) - (a.durationSeconds || 0);
      }
      if (callSortOption === 'duration_asc') {
        return (a.durationSeconds || 0) - (b.durationSeconds || 0);
      }
      return 0;
    });

  // Calculate Metrics based on Date-Filtered Calls
  const totalCalls = dateFilteredCalls.length;
  const connectedCalls = dateFilteredCalls.filter(c => c.durationSeconds > 0).length;
  const totalTalkTimeSecs = dateFilteredCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  const totalSales = dateFilteredCalls
    .filter(c => c.disposition === 'Converted')
    .reduce((acc, c) => {
      const foundLead = leads.find(l => l.id === c.leadId);
      return acc + (foundLead?.dealValue || 15000);
    }, 0);

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}:${remM.toString().padStart(2, '0')}h`;
    }
    return `${m}:${s.toString().padStart(2, '0')}m`;
  };

  // Helper for Disposition Color Badges
  const getDispositionBadge = (disp: string) => {
    switch (disp) {
      case 'Interested':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Follow Up':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Converted':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'RNR':
      case 'Not Reachable':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'Call Back Later':
        return 'bg-sky-50 text-sky-700 border border-sky-200';
      case 'Open':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  // Calculations for Leaderboard
  const rankedAgents = [...agents].map((agent) => {
    const agentCalls = dateFilteredCalls.filter(c => c.agentId === agent.id);
    const agentLeads = dateFilteredLeads.filter(l => l.ownerAgentId === agent.id);
    
    const hasActiveDateFilter = Boolean(fromDate || toDate);

    const totalCallsCount = hasActiveDateFilter
      ? agentCalls.length
      : (agentCalls.length || agent.totalCallsToday || 0);

    const convertedCount = hasActiveDateFilter
      ? agentLeads.filter(l => l.status === 'Converted').length
      : (agent.convertedLeadsCount || agentLeads.filter(l => l.status === 'Converted').length);

    const totalTalkSecs = agentCalls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0) || (hasActiveDateFilter ? 0 : agent.talkTimeMinutes * 60);
    const revenue = agentLeads.filter(l => l.status === 'Converted').reduce((sum, l) => sum + l.dealValue, 0) || (hasActiveDateFilter ? 0 : agent.revenueGenerated || 0);
    const winRate = totalCallsCount > 0 ? Math.round((convertedCount / totalCallsCount) * 100) : 0;

    return {
      ...agent,
      calculatedCalls: totalCallsCount,
      calculatedConverted: convertedCount,
      calculatedTalkTimeSecs: totalTalkSecs,
      calculatedRevenue: revenue,
      winRate
    };
  }).sort((a, b) => {
    if (leaderboardSortBy === 'deals_desc') {
      return b.calculatedConverted - a.calculatedConverted || b.calculatedRevenue - a.calculatedRevenue;
    }
    if (leaderboardSortBy === 'revenue_desc') {
      return b.calculatedRevenue - a.calculatedRevenue || b.calculatedConverted - a.calculatedConverted;
    }
    if (leaderboardSortBy === 'calls_desc') {
      return b.calculatedCalls - a.calculatedCalls;
    }
    if (leaderboardSortBy === 'talk_time_desc') {
      return b.calculatedTalkTimeSecs - a.calculatedTalkTimeSecs;
    }
    if (leaderboardSortBy === 'win_rate_desc') {
      return b.winRate - a.winRate;
    }
    return 0;
  });

  // Individual Agent Selection & Calls
  const currentAgentReport = rankedAgents.find(a => a.id === selectedAgentId) || rankedAgents[0];
  const selectedAgentCalls = dateFilteredCalls
    .filter(c => c.agentId === currentAgentReport?.id)
    .sort((a, b) => {
      if (userReportCallSort === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (userReportCallSort === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (userReportCallSort === 'duration_desc') return (b.durationSeconds || 0) - (a.durationSeconds || 0);
      if (userReportCallSort === 'duration_asc') return (a.durationSeconds || 0) - (b.durationSeconds || 0);
      return 0;
    });

  const handleExportCsv = () => {
    const csvRows = [];
    if (activeSubTab === 'call_logs') {
      csvRows.push(['Lead Name', 'Phone', 'Agent', 'Disposition', 'Duration (s)', 'Timestamp', 'Assignee Remarks'].join(','));
      filteredAndSortedCallRecords.forEach(c => {
        csvRows.push([`"${c.leadName}"`, `"${c.leadPhone}"`, `"${c.agentName}"`, `"${c.disposition}"`, c.durationSeconds, `"${c.timestamp}"`, `"${c.assigneeRemarks || ''}"`].join(','));
      });
    } else if (activeSubTab === 'leaderboard') {
      csvRows.push(['Rank', 'Telecaller', 'Calls', 'Talk Time (s)', 'Deals Converted', 'Revenue Won', 'Win Rate %'].join(','));
      rankedAgents.forEach((a, i) => {
        csvRows.push([i + 1, `"${a.name}"`, a.calculatedCalls, a.calculatedTalkTimeSecs, a.calculatedConverted, a.calculatedRevenue, `${a.winRate}%`].join(','));
      });
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${activeSubTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Sample hourly chart data for Call Log Report
  const hourlyData = [
    { hour: '12 AM', calls: 0 },
    { hour: '02 AM', calls: 0 },
    { hour: '04 AM', calls: 0 },
    { hour: '06 AM', calls: 0 },
    { hour: '08 AM', calls: 3 },
    { hour: '10 AM', calls: 32 },
    { hour: '12 PM', calls: 72 },
    { hour: '02 PM', calls: 69 },
    { hour: '04 PM', calls: 22 },
    { hour: '06 PM', calls: 1 },
    { hour: '08 PM', calls: 0 },
    { hour: '10 PM', calls: 0 },
  ];
  const maxBarVal = Math.max(...hourlyData.map(d => d.calls), 1);

  // Common Reusable Date Range Control Bar Component
  const renderDateRangeControlBar = () => (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Preset Selector Buttons */}
        <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200 flex-wrap gap-1">
          <span className="text-[10px] text-slate-500 uppercase px-2 font-bold flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-indigo-600" />
            <span>Date Range:</span>
          </span>
          {([
            { id: 'ALL', label: 'All Time' },
            { id: 'TODAY', label: 'Today' },
            { id: 'YESTERDAY', label: 'Yesterday' },
            { id: 'LAST_7', label: 'Last 7 Days' },
            { id: 'LAST_30', label: 'Last 30 Days' },
            { id: 'CUSTOM', label: 'Custom' },
          ] as const).map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetChange(p.id)}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer text-xs font-bold ${
                datePreset === p.id 
                  ? 'bg-indigo-600 text-white shadow-2xs' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div className="flex flex-wrap items-center space-x-2 text-xs font-mono">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              className="bg-transparent text-slate-900 focus:outline-none cursor-pointer text-xs font-bold"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              className="bg-transparent text-slate-900 focus:outline-none cursor-pointer text-xs font-bold"
            />
          </div>

          {(fromDate || toDate || datePreset !== 'ALL') && (
            <button
              onClick={() => handlePresetChange('ALL')}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer border border-slate-200 transition-all"
              title="Reset Date Range Filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {activeSubTab === 'call_logs' && 'Calls & Activity Report'}
            {activeSubTab === 'leaderboard' && 'Telecaller Leaderboard'}
            {activeSubTab === 'user_report' && 'Individual Telecaller Report'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeSubTab === 'call_logs' && 'Analyze call volume, connect duration, dispositions, and audio recordings.'}
            {activeSubTab === 'leaderboard' && 'Performance rankings based on call volume, conversions, and revenue generated.'}
            {activeSubTab === 'user_report' && `Detailed performance breakdown for ${currentAgentReport?.name || 'Telecaller'}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* SubTab Navigation Controls */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSubTab('call_logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'call_logs'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
              <span>Call Logs</span>
            </button>

            <button
              onClick={() => setActiveSubTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'leaderboard'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-slate-600" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveSubTab('user_report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'user_report'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>User Report</span>
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center space-x-1.5 border border-slate-200 cursor-pointer transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CALL LOG REPORT VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'call_logs' && (
        <div className="space-y-6">
          
          {/* COMMON DATE RANGE FILTER BAR */}
          {renderDateRangeControlBar()}

          {/* TWO-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT PANEL: 3 Stat Cards + Hourly Calls Bar Chart */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* 3 Metric Cards side by side */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block tracking-wider">CALLS</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{totalCalls}</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block tracking-wider">TIME</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{formatSecs(totalTalkTimeSecs)}</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block tracking-wider">SALES</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalSales.toLocaleString()}</p>
                </div>
              </div>

              {/* Clean Hourly Bar Chart */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-600 font-bold">
                  <span>Call Volume by Hour</span>
                  <span className="text-[10px] text-slate-500">Peak: 12 PM - 02 PM</span>
                </div>

                <div className="h-44 flex items-end justify-between gap-1.5 pt-4 pb-2 border-b border-slate-100">
                  {hourlyData.map((d) => {
                    const heightPct = (d.calls / maxBarVal) * 100;
                    return (
                      <div key={d.hour} className="flex-1 flex flex-col items-center gap-1 group">
                        {d.calls > 0 && (
                          <span className="text-[9px] font-mono text-slate-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.calls}
                          </span>
                        )}
                        <div className="w-full bg-slate-100 rounded-t h-full flex items-end">
                          <div
                            className={`w-full rounded-t transition-all ${
                              d.calls > 40 ? 'bg-indigo-600' : d.calls > 0 ? 'bg-indigo-400' : 'bg-transparent'
                            }`}
                            style={{ height: `${Math.max(heightPct, 3)}%` }}
                          />
                        </div>
                        <span className="text-[8px] font-mono text-slate-500 rotate-45 origin-left mt-1 whitespace-nowrap">
                          {d.hour}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-center text-xs font-mono text-slate-500 pt-2 font-medium">
                  Calls Report ({filteredAndSortedCallRecords.length} Filtered Logged Calls)
                </p>
              </div>
            </div>

            {/* RIGHT PANEL: Filters, Time Sort Options + Call Log Cards */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Filter & Sort Controls Bar */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[160px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search leads, phone, agent..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Disposition Filter */}
                  <select
                    value={dispositionFilter}
                    onChange={(e) => setDispositionFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none font-bold"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Interested">Interested</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Converted">Converted</option>
                    <option value="RNR">RNR / Unreachable</option>
                    <option value="Open">Open</option>
                  </select>

                  {/* Agent Filter */}
                  <select
                    value={agentFilter}
                    onChange={(e) => setAgentFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none font-bold"
                  >
                    <option value="ALL">All Agents</option>
                    {agents.map(ag => (
                      <option key={ag.id} value={ag.id}>{ag.name}</option>
                    ))}
                  </select>
                </div>

                {/* TIME SORTING OPTIONS */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-600 font-bold flex items-center space-x-1 text-[11px]">
                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sort Call Logs By:</span>
                  </span>

                  <select
                    value={callSortOption}
                    onChange={(e) => setCallSortOption(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 cursor-pointer focus:outline-none font-bold text-xs"
                  >
                    <option value="newest">Time: Newest First</option>
                    <option value="oldest">Time: Oldest First</option>
                    <option value="duration_desc">Duration: Longest First</option>
                    <option value="duration_asc">Duration: Shortest First</option>
                  </select>
                </div>
              </div>

              {/* Call Records List */}
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredAndSortedCallRecords.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs space-y-1 shadow-2xs">
                    <p className="font-bold text-slate-700">No matching call records found.</p>
                    <p className="text-[11px]">Try adjusting your date range or search query filters above.</p>
                  </div>
                ) : (
                  filteredAndSortedCallRecords.map((call) => {
                    const foundLead = leads.find(l => l.id === call.leadId);
                    const currentRemark = callRemarksState[call.id] !== undefined
                      ? callRemarksState[call.id]
                      : (call.assigneeRemarks || call.notes || '');

                    const initials = call.agentName.split(' ').map(n => n[0]).join('').slice(0, 2);

                    return (
                      <div
                        key={call.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 hover:border-slate-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <button
                              onClick={() => foundLead && onOpenLeadDetail && onOpenLeadDetail(foundLead)}
                              className="font-bold text-sm text-slate-900 hover:text-indigo-600 text-left cursor-pointer"
                            >
                              {call.leadName}
                            </button>
                            <p className="text-xs text-slate-500 font-mono">{call.leadPhone}</p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${getDispositionBadge(call.disposition)}`}>
                              {call.disposition}
                            </span>

                            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                              {initials}
                            </div>
                          </div>
                        </div>

                        {/* Call Metadata & Player */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs text-slate-500 font-mono">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center space-x-1 font-bold">
                              {call.type === 'outgoing' && <PhoneOutgoing className="w-3 h-3 text-indigo-600" />}
                              {call.type === 'incoming' && <PhoneIncoming className="w-3 h-3 text-emerald-600" />}
                              {call.type === 'missed' && <PhoneMissed className="w-3 h-3 text-rose-600" />}
                              <span className="capitalize">{call.type} ({formatSecs(call.durationSeconds)})</span>
                            </span>
                            <span>• {call.agentName}</span>
                          </div>

                          <span className="text-[10px] text-slate-500 flex items-center space-x-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(call.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </span>
                        </div>

                        {/* Audio Recording */}
                        {call.durationSeconds > 0 && (
                          <div className="pt-1">
                            <CallRecordingPlayer
                              recordingUrl={call.recordingUrl}
                              durationSeconds={call.durationSeconds}
                              callId={call.id}
                            />
                          </div>
                        )}

                        {/* Remarks Input */}
                        <div className="flex items-center space-x-2 pt-1 font-mono text-xs">
                          <input
                            type="text"
                            value={currentRemark}
                            onChange={(e) => setCallRemarksState({ ...callRemarksState, [call.id]: e.target.value })}
                            placeholder="Add remark..."
                            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 flex-1 text-xs"
                          />
                          <button
                            onClick={() => handleSaveRemarks(call.id)}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-2xs"
                          >
                            {savedRemarksCallId === call.id ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LEADERBOARD VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'leaderboard' && (
        <div className="space-y-6">
          
          {/* COMMON DATE RANGE FILTER BAR */}
          {renderDateRangeControlBar()}

          {/* LEADERBOARD SORTING OPTIONS BAR */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-900 text-sm">Leaderboard Performance Ranking</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-600 font-bold flex items-center space-x-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                <span>Rank Telecallers By:</span>
              </span>
              <select
                value={leaderboardSortBy}
                onChange={(e) => setLeaderboardSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none font-bold cursor-pointer"
              >
                <option value="deals_desc">Converted Deals (High to Low)</option>
                <option value="revenue_desc">Revenue Won (High to Low)</option>
                <option value="calls_desc">Total Call Volume (High to Low)</option>
                <option value="talk_time_desc">Talk Time Duration (High to Low)</option>
                <option value="win_rate_desc">Win Rate % (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Active Telecallers</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{rankedAgents.length}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Period Calls Made</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{totalCalls}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Period Talk Time</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{formatSecs(totalTalkTimeSecs)}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Period Deals Won</span>
              <p className="text-xl font-bold text-purple-700 mt-0.5">
                {rankedAgents.reduce((sum, a) => sum + a.calculatedConverted, 0)}
              </p>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono text-slate-800">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200 font-bold">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Telecaller</th>
                    <th className="px-4 py-3">Total Calls</th>
                    <th className="px-4 py-3">Talk Time</th>
                    <th className="px-4 py-3">Deals Won</th>
                    <th className="px-4 py-3">Revenue Won</th>
                    <th className="px-4 py-3">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedAgents.map((ag, index) => (
                    <tr key={ag.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold">
                        <span className={`w-6 h-6 rounded inline-flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-amber-100 text-amber-900' : index === 1 ? 'bg-slate-200 text-slate-900' : index === 2 ? 'bg-amber-700/20 text-amber-900' : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{index + 1}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2.5">
                          <img src={ag.avatar} alt={ag.name} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                          <div>
                            <p className="font-bold text-slate-900">{ag.name}</p>
                            <p className="text-[10px] text-slate-500">{ag.role}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900">
                        {ag.calculatedCalls}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {formatSecs(ag.calculatedTalkTimeSecs)}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {ag.calculatedConverted} Deals
                        </span>
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900">
                        ₹{ag.calculatedRevenue.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-slate-900 font-bold">
                        {ag.winRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. USER PERFORMANCE REPORT VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'user_report' && currentAgentReport && (
        <div className="space-y-6">
          
          {/* COMMON DATE RANGE FILTER BAR */}
          {renderDateRangeControlBar()}

          {/* Telecaller Selector Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-3">
              <img src={currentAgentReport.avatar} alt={currentAgentReport.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">{currentAgentReport.name}</h3>
                <p className="text-[10px] text-slate-500">{currentAgentReport.role} • {currentAgentReport.phone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-slate-600 font-bold">Select Telecaller:</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none font-bold cursor-pointer"
              >
                {rankedAgents.map(ag => (
                  <option key={ag.id} value={ag.id}>{ag.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Calls Logged</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{currentAgentReport.calculatedCalls}</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Talk Time</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatSecs(currentAgentReport.calculatedTalkTimeSecs)}</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Deals Converted</span>
              <p className="text-xl font-bold text-purple-700 mt-1">{currentAgentReport.calculatedConverted}</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Revenue Generated</span>
              <p className="text-xl font-bold text-slate-900 mt-1">₹{currentAgentReport.calculatedRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Agent Call History & Time Sort */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono">
              <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center space-x-2">
                <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                <span>Call Logs for {currentAgentReport.name} ({selectedAgentCalls.length})</span>
              </h4>

              {/* Time Sort Selector for Individual Telecaller Calls */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-600 font-bold flex items-center space-x-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sort Time:</span>
                </span>
                <select
                  value={userReportCallSort}
                  onChange={(e) => setUserReportCallSort(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer font-bold"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="duration_desc">Duration: Longest First</option>
                  <option value="duration_asc">Duration: Shortest First</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 text-xs font-mono">
              {selectedAgentCalls.length === 0 ? (
                <p className="text-slate-500 py-6 text-center">No calls logged for this agent in the selected date range.</p>
              ) : (
                selectedAgentCalls.map(c => (
                  <div key={c.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900">{c.leadName}</p>
                      <p className="text-[10px] text-slate-500">
                        {c.leadPhone} • {formatSecs(c.durationSeconds)} • <span className="text-slate-500">{new Date(c.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${getDispositionBadge(c.disposition)}`}>
                      {c.disposition}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
