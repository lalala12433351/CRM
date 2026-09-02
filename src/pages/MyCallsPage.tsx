import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  X, 
  Plus, 
  Play, 
  Pause, 
  FileSpreadsheet, 
  Trash2, 
  RefreshCw,
  MessageCircle,
  ExternalLink,
  Users
} from 'lucide-react';
import { CallRecord, Agent, Lead } from '../types';
import { CustomDropdown } from '../components/CustomDropdown';

interface MyCallsViewProps {
  callRecords: CallRecord[];
  agents: Agent[];
  activeAgent: Agent;
  leads?: Lead[];
  onOpenLeadDetail?: (lead: Lead) => void;
  onUpdateCallRecord?: (callId: string, updates: Partial<CallRecord>) => void;
  onAddCallRecord?: (newCall: CallRecord) => void;
  onDeleteCallRecord?: (callId: string) => void;
  onShowToast?: (message: string) => void;
}

export const MyCallsPage: React.FC<MyCallsViewProps> = ({
  callRecords = [],
  agents = [],
  activeAgent,
  leads = [],
  onOpenLeadDetail,
  onUpdateCallRecord,
  onAddCallRecord,
  onDeleteCallRecord,
  onShowToast
}) => {
  const isAdmin = activeAgent?.role === 'Master Admin' || activeAgent?.role === 'Admin' || activeAgent?.role === 'Sales Manager' || activeAgent?.isAdmin;

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>(isAdmin ? 'all' : (activeAgent?.id || 'all'));
  const [selectedCallType, setSelectedCallType] = useState<string>('all');
  const [selectedDisposition, setSelectedDisposition] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const customDateRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Multi-Selection
  const [selectedCallIds, setSelectedCallIds] = useState<string[]>([]);

  // Audio Playback State
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);

  // Log Call Modal State
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);
  const [logLeadName, setLogLeadName] = useState('');
  const [logLeadPhone, setLogLeadPhone] = useState('');
  const [logCallType, setLogCallType] = useState<'outgoing' | 'incoming' | 'missed'>('outgoing');
  const [logDurationMinutes, setLogDurationMinutes] = useState('2');
  const [logDurationSeconds, setLogDurationSeconds] = useState('30');
  const [logAssigneeId, setLogAssigneeId] = useState(() => activeAgent?.id || agents[0]?.id || '');
  const [logDisposition, setLogDisposition] = useState('Connected');
  const [logNotes, setLogNotes] = useState('');

  // Mobile View Style Toggle: Cards vs Table
  const [mobileViewStyle, setMobileViewStyle] = useState<'cards' | 'table'>('table');

  // Click outside for custom date popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customDateRef.current && !customDateRef.current.contains(e.target as Node)) {
        setIsCustomDateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format Duration Helper
  const formatDuration = (seconds: number = 0): string => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  // Format Date Helper
  const formatDateTime = (dateStr?: string): { formatted: string; timeOnly: string } => {
    if (!dateStr) return { formatted: '—', timeOnly: '—' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { formatted: dateStr, timeOnly: '' };
    
    return {
      formatted: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeOnly: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  // Compute End Time Helper
  const getCallEndTime = (call: CallRecord): string => {
    if (call.callEndTime) return call.callEndTime;
    const start = call.callStartTime || call.timestamp;
    if (!start) return '—';
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return '—';
    const duration = call.durationSeconds || 0;
    const endDate = new Date(startDate.getTime() + duration * 1000);
    return endDate.toISOString();
  };

  // Avatar Initials Helper
  const getAgentAvatar = (name?: string) => {
    if (!name) return { initials: 'UN', bg: 'bg-slate-200 text-slate-700' };
    const parts = name.trim().split(' ');
    let initials = '';
    if (parts.length >= 2) {
      initials = `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0][0].toUpperCase();
    }
    return { initials, bg: 'bg-[#ede9fe] text-[#5b21b6]' };
  };

  // Filtered Calls Calculation
  const filteredCalls = useMemo(() => {
    return callRecords.filter((call) => {
      // 1. Assignee Scoping
      if (!isAdmin && activeAgent) {
        const isMyCall = call.agentId === activeAgent.id || 
                         (call.agentName && activeAgent.name && call.agentName.toLowerCase() === activeAgent.name.toLowerCase()) ||
                         (call.assigneeName && activeAgent.name && call.assigneeName.toLowerCase() === activeAgent.name.toLowerCase());
        if (!isMyCall) return false;
      } else if (selectedAssignee !== 'all') {
        const selectedAg = agents.find((a) => a.id === selectedAssignee);
        const match = call.agentId === selectedAssignee || 
                      (selectedAg && call.agentName && call.agentName.toLowerCase() === selectedAg.name.toLowerCase()) ||
                      (selectedAg && call.assigneeName && call.assigneeName.toLowerCase() === selectedAg.name.toLowerCase());
        if (!match) return false;
      }

      // 2. Search Filter (Lead Name, Phone, Assignee Name, Notes, Disposition)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const digits = term.replace(/\D/g, '');
        const phone = (call.leadPhone || '').replace(/\D/g, '');
        
        const matchName = (call.leadName || '').toLowerCase().includes(term);
        const matchPhone = (call.leadPhone || '').toLowerCase().includes(term) || (digits.length >= 2 && phone.includes(digits));
        const matchAgent = (call.assigneeName || call.agentName || '').toLowerCase().includes(term);
        const matchDisp = (call.disposition || '').toLowerCase().includes(term);
        const matchNotes = (call.callNotes || call.notes || call.assigneeRemarks || '').toLowerCase().includes(term);

        if (!matchName && !matchPhone && !matchAgent && !matchDisp && !matchNotes) {
          return false;
        }
      }

      // 3. Call Type Filter
      if (selectedCallType !== 'all') {
        const type = (call.type || 'outgoing').toLowerCase();
        if (selectedCallType === 'incoming' && type !== 'incoming') return false;
        if (selectedCallType === 'outgoing' && (type !== 'outgoing' && type !== 'outbound')) return false;
        if (selectedCallType === 'missed' && type !== 'missed') return false;
      }

      // 4. Disposition Filter
      if (selectedDisposition !== 'all') {
        const disp = (call.disposition || '').toLowerCase();
        if (!disp.includes(selectedDisposition.toLowerCase())) return false;
      }

      // 5. Date Range Filter
      if (selectedDateRange !== 'all') {
        const callTime = new Date(call.callStartTime || call.timestamp).getTime();
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        if (selectedDateRange === 'today') {
          if (callTime < startOfToday) return false;
        } else if (selectedDateRange === 'yesterday') {
          const startOfYesterday = startOfToday - 86400000;
          if (callTime < startOfYesterday || callTime >= startOfToday) return false;
        } else if (selectedDateRange === '7days') {
          const sevenDaysAgo = startOfToday - 7 * 86400000;
          if (callTime < sevenDaysAgo) return false;
        } else if (selectedDateRange === '30days') {
          const thirtyDaysAgo = startOfToday - 30 * 86400000;
          if (callTime < thirtyDaysAgo) return false;
        } else if (selectedDateRange === 'custom') {
          if (customStartDate) {
            const startMs = new Date(customStartDate + 'T00:00:00').getTime();
            if (callTime < startMs) return false;
          }
          if (customEndDate) {
            const endMs = new Date(customEndDate + 'T23:59:59').getTime();
            if (callTime > endMs) return false;
          }
        }
      }

      return true;
    });
  }, [callRecords, selectedAssignee, selectedCallType, selectedDisposition, selectedDateRange, customStartDate, customEndDate, searchTerm, isAdmin, activeAgent, agents]);

  // Paginated List
  const totalCallsCount = filteredCalls.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCallsCount);
  const currentPaginatedCalls = filteredCalls.slice(startIndex, endIndex);

  // Metrics Summary Cards Data
  const metrics = useMemo(() => {
    const total = filteredCalls.length;
    const connected = filteredCalls.filter((c) => {
      const d = (c.disposition || '').toLowerCase();
      const t = (c.type || '').toLowerCase();
      return (c.durationSeconds && c.durationSeconds > 0) || d.includes('connect') || d.includes('interest');
    }).length;

    const totalSeconds = filteredCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
    const avgDurationSeconds = total > 0 ? Math.round(totalSeconds / (connected || total)) : 0;
    const missed = filteredCalls.filter((c) => (c.type || '').toLowerCase() === 'missed' || c.durationSeconds === 0).length;

    return {
      total,
      connected,
      connectedPercent: total > 0 ? `${Math.round((connected / total) * 100)}%` : '0%',
      totalTalktime: formatDuration(totalSeconds),
      avgDuration: formatDuration(avgDurationSeconds),
      missed
    };
  }, [filteredCalls]);

  // Multi-Selection Handlers
  const isAllCurrentPageSelected = currentPaginatedCalls.length > 0 && currentPaginatedCalls.every((c) => selectedCallIds.includes(c.id));

  const handleSelectAllCurrentPage = () => {
    const pageIds = currentPaginatedCalls.map((c) => c.id);
    if (isAllCurrentPageSelected) {
      setSelectedCallIds(selectedCallIds.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedCallIds(Array.from(new Set([...selectedCallIds, ...pageIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedCallIds.includes(id)) {
      setSelectedCallIds(selectedCallIds.filter((i) => i !== id));
    } else {
      setSelectedCallIds([...selectedCallIds, id]);
    }
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    const headers = ['Name', 'Number', 'Call Start', 'Call End', 'Duration (Seconds)', 'Formatted Duration', 'Assignee Name', 'Call Type', 'Disposition', 'Remarks'];
    const rows = filteredCalls.map((c) => {
      const start = c.callStartTime || c.timestamp;
      const end = getCallEndTime(c);
      const assignee = c.assigneeName || c.agentName || 'Agent';
      return [
        `"${c.leadName || 'Contact'}"`,
        `"${c.leadPhone || ''}"`,
        `"${start}"`,
        `"${end}"`,
        c.durationSeconds || 0,
        `"${formatDuration(c.durationSeconds)}"`,
        `"${assignee}"`,
        `"${c.type || 'outgoing'}"`,
        `"${c.disposition || 'Connected'}"`,
        `"${(c.callNotes || c.notes || c.assigneeRemarks || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `calls_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) onShowToast(`Exported ${filteredCalls.length} call records to CSV`);
  };

  // Handle Save New Call
  const handleSaveLoggedCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logLeadName.trim() || !logLeadPhone.trim()) {
      alert('Please provide both lead name and phone number.');
      return;
    }

    const assignedAgent = agents.find((a) => a.id === logAssigneeId) || activeAgent;
    const duration = (parseInt(logDurationMinutes, 10) || 0) * 60 + (parseInt(logDurationSeconds, 10) || 0);
    const now = new Date();
    const startTime = new Date(now.getTime() - duration * 1000).toISOString();
    const endTime = now.toISOString();

    const newCall: CallRecord = {
      id: `call-${Date.now()}`,
      leadId: `lead-manual-${Date.now()}`,
      leadName: logLeadName.trim(),
      leadPhone: logLeadPhone.trim(),
      callStartTime: startTime,
      callEndTime: endTime,
      durationSeconds: duration,
      agentId: assignedAgent?.id || activeAgent?.id || 'admin',
      agentName: assignedAgent?.name || activeAgent?.name || 'Agent',
      assigneeName: assignedAgent?.name || activeAgent?.name || 'Agent',
      type: logCallType,
      disposition: logDisposition,
      callNotes: logNotes.trim(),
      notes: logNotes.trim(),
      timestamp: startTime,
    };

    if (onAddCallRecord) {
      onAddCallRecord(newCall);
    }

    // Reset Form
    setLogLeadName('');
    setLogLeadPhone('');
    setLogNotes('');
    setLogDurationMinutes('2');
    setLogDurationSeconds('30');
    setIsLogCallModalOpen(false);
    if (onShowToast) onShowToast('Call record logged successfully!');
  };

  // Disposition Badge Style Helper
  const getDispositionBadge = (disp?: string) => {
    const d = (disp || 'Connected').toLowerCase();
    if (d.includes('connect') || d.includes('interested') || d.includes('converted')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (d.includes('follow') || d.includes('callback') || d.includes('later')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (d.includes('busy') || d.includes('no answer') || d.includes('rnr') || d.includes('missed')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (d.includes('wrong') || d.includes('junk') || d.includes('lost') || d.includes('invalid')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#fafafa] overflow-y-auto font-sans pb-12">
      
      {/* 1. TOP HEADER & METRICS BAR */}
      <div className="px-4 sm:px-6 py-4 space-y-4 max-w-full">
        
        {/* Main Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>{isAdmin ? 'All Calls' : 'My Calls'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive telecaller call histories, start/end timestamps, talk-times, and recording dispositions.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setIsLogCallModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm shadow-indigo-900/15"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Call</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs"
              title="Export filtered call records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards (Matching LeadsView Stats Theme) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Calls</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">{metrics.total}</span>
              <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
                <PhoneCall className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Connected</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono">{metrics.connected}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {metrics.connectedPercent}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Talktime</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">{metrics.totalTalktime}</span>
              <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Avg Duration</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">{metrics.avgDuration}</span>
              <span className="p-1 rounded-lg bg-purple-50 text-purple-600">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Missed / Unanswered</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-amber-600 font-mono">{metrics.missed}</span>
              <span className="p-1 rounded-lg bg-amber-50 text-amber-600">
                <PhoneMissed className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 2. SEARCH & FILTER TOOLBAR */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Name, Number, Assignee, Disposition..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Assignee Filter (if Admin) */}
              {isAdmin && (
                <div className="w-40">
                  <CustomDropdown<string>
                    value={selectedAssignee}
                    onChange={(val) => {
                      setSelectedAssignee(val);
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: 'all', label: 'All Assignees' },
                      ...agents.map((a) => ({ value: a.id, label: a.name })),
                    ]}
                    align="left"
                    wrapperClassName="w-full"
                    className="w-full bg-slate-50 border-slate-200 text-xs py-1.5"
                  />
                </div>
              )}

              {/* Call Direction Filter */}
              <div className="w-36">
                <CustomDropdown<string>
                  value={selectedCallType}
                  onChange={(val) => {
                    setSelectedCallType(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'outgoing', label: 'Outgoing' },
                    { value: 'incoming', label: 'Incoming' },
                    { value: 'missed', label: 'Missed' },
                  ]}
                  align="left"
                  wrapperClassName="w-full"
                  className="w-full bg-slate-50 border-slate-200 text-xs py-1.5"
                />
              </div>

              {/* Disposition Filter */}
              <div className="w-40">
                <CustomDropdown<string>
                  value={selectedDisposition}
                  onChange={(val) => {
                    setSelectedDisposition(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'All Dispositions' },
                    { value: 'Connected', label: 'Connected' },
                    { value: 'Follow Up', label: 'Follow Up' },
                    { value: 'Interested', label: 'Interested' },
                    { value: 'Callback', label: 'Callback Requested' },
                    { value: 'No Answer', label: 'Busy / No Answer' },
                    { value: 'Wrong Number', label: 'Wrong Number' },
                  ]}
                  align="left"
                  wrapperClassName="w-full"
                  className="w-full bg-slate-50 border-slate-200 text-xs py-1.5"
                />
              </div>

              {/* Date Filter */}
              <div className="relative" ref={customDateRef}>
                <button
                  type="button"
                  onClick={() => setIsCustomDateOpen(!isCustomDateOpen)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    selectedDateRange !== 'all'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {selectedDateRange === 'all' && 'All Time'}
                    {selectedDateRange === 'today' && 'Today'}
                    {selectedDateRange === 'yesterday' && 'Yesterday'}
                    {selectedDateRange === '7days' && 'Past 7 Days'}
                    {selectedDateRange === '30days' && 'Past 30 Days'}
                    {selectedDateRange === 'custom' && 'Custom Window'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isCustomDateOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 space-y-2.5 text-xs animate-in fade-in zoom-in-95">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presets</p>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { id: 'all', label: 'All Time' },
                          { id: 'today', label: 'Today' },
                          { id: 'yesterday', label: 'Yesterday' },
                          { id: '7days', label: 'Past 7 Days' },
                          { id: '30days', label: 'Past 30 Days' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedDateRange(p.id);
                              setIsCustomDateOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`px-2 py-1.5 rounded-lg text-left text-xs font-medium cursor-pointer ${
                              selectedDateRange === p.id
                                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Window</p>
                      <div className="space-y-1.5">
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs"
                        />
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (customStartDate && customEndDate) {
                            setSelectedDateRange('custom');
                            setIsCustomDateOpen(false);
                            setCurrentPage(1);
                          }
                        }}
                        className="w-full py-1.5 bg-[#5034a8] text-white text-xs font-bold rounded-lg shadow-2xs"
                      >
                        Apply Window
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Filters button */}
              {(searchTerm || selectedCallType !== 'all' || selectedDisposition !== 'all' || selectedDateRange !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCallType('all');
                    setSelectedDisposition('all');
                    setSelectedDateRange('all');
                    setSelectedAssignee(isAdmin ? 'all' : (activeAgent?.id || 'all'));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 3. PAGINATION & MULTI-ACTIONS SUB-BAR */}
      <div className="px-4 sm:px-6 mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-3 text-xs text-slate-600">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-6 h-6 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="font-normal text-slate-600 text-xs px-1">
            {totalCallsCount === 0 ? 0 : startIndex + 1}-{endIndex} of {totalCallsCount}
          </span>

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={endIndex >= totalCallsCount}
            className="w-6 h-6 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {selectedCallIds.length > 0 && (
          <div className="flex items-center bg-[#f8fafc] border border-slate-200 rounded-md overflow-visible shadow-xs h-7 text-xs">
            <div className="px-3 text-slate-500 font-medium whitespace-nowrap bg-slate-50 border-r border-slate-200 h-full flex items-center">
              {selectedCallIds.length} Selected
            </div>
            <button
              onClick={() => setSelectedCallIds([])}
              className="px-3 text-rose-500 hover:text-rose-600 font-medium whitespace-nowrap border-r border-slate-200 h-full flex items-center transition-colors cursor-pointer hover:bg-slate-50"
            >
              Deselect
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete ${selectedCallIds.length} selected call record(s)?`)) {
                  selectedCallIds.forEach((id) => onDeleteCallRecord && onDeleteCallRecord(id));
                  setSelectedCallIds([]);
                }
              }}
              className="px-3 text-rose-600 hover:text-rose-700 font-medium flex items-center space-x-1.5 whitespace-nowrap h-full transition-colors cursor-pointer hover:bg-slate-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. MAIN DATA TABLE (Matching Exact Theme of All Leads Table) */}
      <div className="px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              
              {/* Table Header */}
              <thead className="bg-[#f1f5f9]/70 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  {/* Select All Checkbox */}
                  <th className="px-3.5 py-3 w-10 text-center">
                    <button
                      onClick={handleSelectAllCurrentPage}
                      title="Select all on this page"
                      className="cursor-pointer inline-flex items-center justify-center"
                    >
                      {isAllCurrentPageSelected ? (
                        <div className="w-4 h-4 rounded-[4px] bg-[#5034a8] flex items-center justify-center border border-[#5034a8]">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-[4px] border border-slate-300 bg-white hover:border-[#5034a8] transition-colors"></div>
                      )}
                    </button>
                  </th>

                  {/* 1. Name */}
                  <th className="px-3.5 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Name
                  </th>

                  {/* 2. Number */}
                  <th className="px-3.5 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Number
                  </th>

                  {/* 3. Call Start */}
                  <th className="px-3.5 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Call Start
                  </th>

                  {/* 4. Call End */}
                  <th className="px-3.5 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Call End
                  </th>

                  {/* 5. Call Duration */}
                  <th className="px-3.5 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Call Duration
                  </th>

                  {/* 6. Assignee Name */}
                  <th className="px-3.5 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Assignee Name
                  </th>

                  {/* 7. Disposition */}
                  <th className="px-3.5 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Disposition
                  </th>

                  {/* 8. Remarks & Recording */}
                  <th className="px-3.5 py-3 font-semibold text-slate-700 whitespace-nowrap text-right">
                    Remarks / Audio
                  </th>
                </tr>
              </thead>

              {/* Table Rows */}
              <tbody className="divide-y divide-slate-100">
                {currentPaginatedCalls.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-xs">
                      No call records found matching your current filter conditions.
                    </td>
                  </tr>
                ) : (
                  currentPaginatedCalls.map((call) => {
                    const isSelected = selectedCallIds.includes(call.id);
                    const assigneeName = call.assigneeName || call.agentName || 'Agent';
                    const avatar = getAgentAvatar(assigneeName);
                    const startFormatted = formatDateTime(call.callStartTime || call.timestamp);
                    const endFormatted = formatDateTime(getCallEndTime(call));
                    const isPlaying = playingCallId === call.id;

                    // Match Lead record if available
                    const matchedLead = leads.find((l) => l.id === call.leadId || l.phone === call.leadPhone);

                    return (
                      <tr
                        key={call.id}
                        className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="px-3.5 py-2.5 text-center">
                          <button
                            onClick={() => handleToggleSelect(call.id)}
                            className="cursor-pointer inline-flex items-center justify-center"
                          >
                            {isSelected ? (
                              <div className="w-4 h-4 rounded-[4px] bg-[#5034a8] flex items-center justify-center border border-[#5034a8]">
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-[4px] border border-slate-300 bg-white hover:border-[#5034a8] transition-colors"></div>
                            )}
                          </button>
                        </td>

                        {/* 1. Name */}
                        <td className="px-3.5 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span
                              onClick={() => matchedLead && onOpenLeadDetail && onOpenLeadDetail(matchedLead)}
                              className={`truncate max-w-[180px] font-bold ${
                                matchedLead ? 'text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer' : 'text-slate-800'
                              }`}
                            >
                              {call.leadName || 'Contact'}
                            </span>
                            {matchedLead && (
                              <ExternalLink
                                onClick={() => onOpenLeadDetail && onOpenLeadDetail(matchedLead)}
                                className="w-3 h-3 text-slate-400 hover:text-indigo-600 cursor-pointer shrink-0"
                              />
                            )}
                          </div>
                        </td>

                        {/* 2. Number */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <a
                              href={`tel:${call.leadPhone}`}
                              className="font-mono text-slate-800 font-semibold hover:text-indigo-600 flex items-center space-x-1"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{call.leadPhone}</span>
                            </a>
                            <button
                              onClick={() => window.open(`https://wa.me/${call.leadPhone.replace(/[^0-9]/g, '')}`, '_blank')}
                              title="Chat on WhatsApp"
                              className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* 3. Call Start */}
                        <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap font-mono text-[11px]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{startFormatted.formatted}</span>
                            <span className="text-[10px] text-slate-400">{startFormatted.timeOnly}</span>
                          </div>
                        </td>

                        {/* 4. Call End */}
                        <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap font-mono text-[11px]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{endFormatted.formatted}</span>
                            <span className="text-[10px] text-slate-400">{endFormatted.timeOnly}</span>
                          </div>
                        </td>

                        {/* 5. Call Duration */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono inline-flex items-center space-x-1 ${
                            call.durationSeconds > 0
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            <Clock className="w-3 h-3 text-slate-400 mr-0.5" />
                            <span>{formatDuration(call.durationSeconds)}</span>
                          </span>
                        </td>

                        {/* 6. Assignee Name */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${avatar.bg}`}>
                              {avatar.initials}
                            </span>
                            <span className="text-slate-700 text-xs font-medium truncate max-w-[160px]">
                              {assigneeName}
                            </span>
                          </div>
                        </td>

                        {/* 7. Disposition */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getDispositionBadge(call.disposition)}`}>
                            {call.disposition || 'Connected'}
                          </span>
                        </td>

                        {/* 8. Remarks & Recording */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Audio Player Button */}
                            <button
                              onClick={() => {
                                if (isPlaying) {
                                  setPlayingCallId(null);
                                } else {
                                  setPlayingCallId(call.id);
                                  setTimeout(() => setPlayingCallId(null), 3000);
                                  if (onShowToast) onShowToast(`Playing recording for ${call.leadName}...`);
                                }
                              }}
                              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1 ${
                                isPlaying
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                              title={isPlaying ? 'Pause Audio' : 'Play Call Recording'}
                            >
                              {isPlaying ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-indigo-600" />}
                              <span className="text-[10px] font-mono">{isPlaying ? 'Playing' : 'Audio'}</span>
                            </button>

                            {/* Remarks Tooltip / Text */}
                            {call.callNotes || call.notes || call.assigneeRemarks ? (
                              <span
                                className="text-slate-500 hover:text-slate-800 text-[11px] truncate max-w-[140px] inline-block cursor-help font-normal"
                                title={call.callNotes || call.notes || call.assigneeRemarks}
                              >
                                {call.callNotes || call.notes || call.assigneeRemarks}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[11px]">—</span>
                            )}
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

      {/* 5. LOG CALL MODAL */}
      {isLogCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 font-sans animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Log Call Record</h3>
                  <p className="text-[11px] text-slate-500">Add call history and assignee notes</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogCallModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLoggedCall} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Contact / Lead Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={logLeadName}
                  onChange={(e) => setLogLeadName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={logLeadPhone}
                  onChange={(e) => setLogLeadPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Call Direction</label>
                  <select
                    value={logCallType}
                    onChange={(e) => setLogCallType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="outgoing">Outgoing Call</option>
                    <option value="incoming">Incoming Call</option>
                    <option value="missed">Missed Call</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Duration (Min / Sec)</label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min="0"
                      value={logDurationMinutes}
                      onChange={(e) => setLogDurationMinutes(e.target.value)}
                      placeholder="M"
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 text-center"
                    />
                    <span className="text-slate-400">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={logDurationSeconds}
                      onChange={(e) => setLogDurationSeconds(e.target.value)}
                      placeholder="S"
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assignee Name</label>
                  <select
                    value={logAssigneeId}
                    onChange={(e) => setLogAssigneeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} ({ag.role || 'Telecaller'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Disposition</label>
                  <select
                    value={logDisposition}
                    onChange={(e) => setLogDisposition(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Connected">Connected</option>
                    <option value="Follow Up">Follow Up Required</option>
                    <option value="Interested">Interested / Qualified</option>
                    <option value="Callback">Callback Requested</option>
                    <option value="Busy / No Answer">Busy / No Answer</option>
                    <option value="Wrong Number">Wrong Number</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Call Remarks / Notes</label>
                <textarea
                  rows={3}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Discussion details, next steps, fee quotation..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogCallModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Call Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};


export const MyCallsView = MyCallsPage;
export default MyCallsPage;
