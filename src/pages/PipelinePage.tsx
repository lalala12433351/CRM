import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Kanban, 
  Pencil, 
  Trash2, 
  Plus, 
  GripVertical, 
  HelpCircle, 
  PhoneCall, 
  Check, 
  X, 
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Info,
  Sparkles,
  ArrowLeftRight,
  CalendarPlus,
  Clock,
  Calendar,
  UserCheck,
  FileText,
  User,
  Users,
  Layers,
  Search
} from 'lucide-react';
import { Lead, PipelineStage, LeadStatus, CustomFieldDef, Agent, formatDealValue, formatDealValueCompact } from '../types';
import { LeadSummaryModal } from '../components/LeadSummaryModal';
import { toast } from '../context/ToastContext';

interface PipelineViewProps {
  leads: Lead[];
  agents?: Agent[];
  stages: PipelineStage[];
  customFields?: CustomFieldDef[];
  currency?: string;
  onOpenLeadDetail: (lead: Lead) => void;
  onOpenPowerDialerForLead?: (lead: Lead) => void;
  onUpdateLeadStage: (leadId: string, newStageStatus: LeadStatus) => void;
  onUpdateStages?: (stages: PipelineStage[]) => void;
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void;
}

export interface LostReasonItem {
  id: string;
  reason: string;
}

export const STAGE_COLOR_PALETTE = [
  { label: 'Pink', bg: 'bg-pink-100/90 border-pink-200', text: 'text-slate-800', hex: '#fce7f3' },
  { label: 'Emerald', bg: 'bg-emerald-100/70 border-emerald-200', text: 'text-slate-800', hex: '#d1fae5' },
  { label: 'Green', bg: 'bg-green-100/90 border-green-200', text: 'text-slate-800', hex: '#dcfce7' },
  { label: 'Purple', bg: 'bg-purple-100/80 border-purple-200', text: 'text-slate-800', hex: '#f3e8ff' },
  { label: 'Blue', bg: 'bg-blue-100/80 border-blue-200', text: 'text-slate-800', hex: '#dbeafe' },
  { label: 'Indigo', bg: 'bg-indigo-100/80 border-indigo-200', text: 'text-slate-800', hex: '#e0e7ff' },
  { label: 'Cyan', bg: 'bg-cyan-100/80 border-cyan-200', text: 'text-slate-800', hex: '#cffafe' },
  { label: 'Teal', bg: 'bg-teal-100/70 border-teal-200', text: 'text-slate-800', hex: '#ccfbf1' },
  { label: 'Amber', bg: 'bg-amber-100/80 border-amber-200', text: 'text-slate-800', hex: '#fef3c7' },
  { label: 'Rose', bg: 'bg-rose-100/80 border-rose-200', text: 'text-slate-800', hex: '#ffe4e6' },
  { label: 'Slate', bg: 'bg-slate-200/80 border-slate-300', text: 'text-slate-800', hex: '#e2e8f0' },
];

export const PipelinePage: React.FC<PipelineViewProps> = ({
  leads,
  agents = [],
  stages,
  customFields = [],
  currency = 'INR',
  onOpenLeadDetail,
  onOpenPowerDialerForLead,
  onUpdateLeadStage,
  onUpdateStages,
  onUpdateLead
}) => {
  // Mode toggle: 'config' (exact screenshot layout) vs 'kanban'
  const [viewMode, setViewMode] = useState<'config' | 'kanban'>('config');

  // Follow-Up Scheduling Modal State
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [followUpAssigneeId, setFollowUpAssigneeId] = useState('');
  const [summaryLead, setSummaryLead] = useState<Lead | null>(null);
  const [followUpDate, setFollowUpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [followUpHour, setFollowUpHour] = useState('09');
  const [followUpMinute, setFollowUpMinute] = useState('00');
  const [followUpAmPm, setFollowUpAmPm] = useState<'AM' | 'PM'>('AM');
  const [followUpRemarks, setFollowUpRemarks] = useState('');

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
    setFollowUpAssigneeId(lead.ownerAgentId || lead.assignedTo || '');
  };

  const handleSaveFollowUp = () => {
    if (!followUpLead) return;
    let h = parseInt(followUpHour, 10);
    if (followUpAmPm === 'PM' && h !== 12) h += 12;
    if (followUpAmPm === 'AM' && h === 12) h = 0;
    const combinedDate = `${followUpDate}T${String(h).padStart(2, '0')}:${followUpMinute}:00`;

    const selectedDateTime = new Date(combinedDate);
    if (selectedDateTime < new Date()) {
      toast.warning('Cannot schedule a follow-up in the past. Please select a future date and time.', 'Follow-up Time');
      return;
    }

    const selectedAgent = (agents || []).find((a) => a.id === followUpAssigneeId);
    const finalAssigneeId = followUpAssigneeId || followUpLead.ownerAgentId || followUpLead.assignedTo;
    const finalAssigneeName = selectedAgent ? selectedAgent.name : (followUpLead.ownerAgentName || 'Unassigned');

    if (onUpdateLead) {
      onUpdateLead(followUpLead.id, {
        status: 'Follow Up',
        followUpAt: combinedDate,
        ownerAgentId: finalAssigneeId,
        ownerAgentName: finalAssigneeName,
        assignedTo: finalAssigneeId,
        notes: followUpRemarks
          ? `${followUpLead.notes ? followUpLead.notes + '\n' : ''}[Follow-up Remark]: ${followUpRemarks}`
          : followUpLead.notes,
        updatedAt: new Date().toISOString()
      });
    } else {
      onUpdateLeadStage(followUpLead.id, 'Follow Up');
    }
    setFollowUpLead(null);
    setFollowUpAssigneeId('');
  };

  // Active stage list state matching screenshot default pastel palette
  const [activeStagesList, setActiveStagesList] = useState<{ id: string; name: string; bg: string; text: string }[]>([
    { id: 'st-rnr', name: 'RNR', bg: 'bg-pink-100/90 border-pink-200', text: 'text-slate-800' },
    { id: 'st-interested', name: 'Interested', bg: 'bg-emerald-100/70 border-emerald-200', text: 'text-slate-800' },
    { id: 'st-warm', name: 'Warm', bg: 'bg-green-100/90 border-green-200', text: 'text-slate-800' },
    { id: 'st-iata', name: 'IATA', bg: 'bg-purple-100/80 border-purple-200', text: 'text-slate-800' },
    { id: 'st-next-batch', name: 'Next Batch', bg: 'bg-stone-200/70 border-stone-300', text: 'text-slate-800' },
    { id: 'st-next-year', name: 'Next Year', bg: 'bg-blue-100/80 border-blue-200', text: 'text-slate-800' },
    { id: 'st-visit-sched', name: 'Visit Scheduled', bg: 'bg-indigo-100/80 border-indigo-200', text: 'text-slate-800' },
    { id: 'st-visited', name: 'Visited', bg: 'bg-purple-100/80 border-purple-200', text: 'text-slate-800' },
    { id: 'st-open', name: 'Open', bg: 'bg-cyan-100/80 border-cyan-200', text: 'text-slate-800' },
    { id: 'st-cpl', name: 'CPL', bg: 'bg-[#E5E7EB] border-slate-300', text: 'text-slate-800' },
    { id: 'st-any-course', name: 'Any other Course', bg: 'bg-teal-100/70 border-teal-200', text: 'text-slate-800' },
    { id: 'st-existing', name: 'Existing', bg: 'bg-emerald-100/60 border-emerald-200', text: 'text-slate-800' },
    { id: 'st-job-enquiry', name: 'Job enquiry', bg: 'bg-stone-200/80 border-stone-300', text: 'text-slate-800' },
  ]);

  // Lost reasons state matching screenshot
  const [lostReasons, setLostReasons] = useState<LostReasonItem[]>([
    { id: 'lr-1', reason: 'No Need' },
    { id: 'lr-2', reason: 'Unable to Connect' },
    { id: 'lr-3', reason: 'Budget Issues' },
    { id: 'lr-4', reason: 'Product does not fit need' },
    { id: 'lr-5', reason: 'Lost to competitor' },
    { id: 'lr-6', reason: 'Unknown Reason' },
    { id: 'lr-7', reason: 'Not eligible' },
    { id: 'lr-8', reason: 'Junk' },
  ]);

  // Modal / Inline Edit States
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editStageName, setEditStageName] = useState<string>('');
  const [editStageBg, setEditStageBg] = useState<string>('bg-pink-100/90 border-pink-200');
  
  const [showAddStageModal, setShowAddStageModal] = useState<boolean>(false);
  const [newStageName, setNewStageName] = useState<string>('');
  const [newStageBg, setNewStageBg] = useState<string>(STAGE_COLOR_PALETTE[0].bg);

  const [editingReasonId, setEditingReasonId] = useState<string | null>(null);
  const [editReasonText, setEditReasonText] = useState<string>('');

  const [showAddReasonModal, setShowAddReasonModal] = useState<boolean>(false);
  const [newReasonText, setNewReasonText] = useState<string>('');

  // Initial stage default name
  const [initialStageName, setInitialStageName] = useState('Fresh');
  const [editingInitial, setEditingInitial] = useState(false);

  // Won stage default name
  const [wonStageName, setWonStageName] = useState('Converted');
  const [editingWon, setEditingWon] = useState(false);

  // Lost stage default name
  const [lostStageName, setLostStageName] = useState('Lost');
  const [editingLost, setEditingLost] = useState(false);

  // Stage CRUD operations
  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const newStage = {
      id: `st-${Date.now()}`,
      name: newStageName.trim(),
      bg: newStageBg || STAGE_COLOR_PALETTE[0].bg,
      text: 'text-slate-800'
    };
    setActiveStagesList([...activeStagesList, newStage]);
    setNewStageName('');
    setShowAddStageModal(false);
  };

  const handleSaveStageEdit = (id: string) => {
    if (!editStageName.trim()) return;
    setActiveStagesList(activeStagesList.map(st => st.id === id ? { ...st, name: editStageName.trim(), bg: editStageBg } : st));
    setEditingStageId(null);
  };

  const handleChangeStageColor = (id: string, newBg: string) => {
    setActiveStagesList(activeStagesList.map(st => st.id === id ? { ...st, bg: newBg } : st));
  };

  const handleDeleteStage = (id: string) => {
    setActiveStagesList(activeStagesList.filter(st => st.id !== id));
  };

  // Lost Reason CRUD
  const handleAddLostReason = () => {
    if (!newReasonText.trim()) return;
    setLostReasons([...lostReasons, { id: `lr-${Date.now()}`, reason: newReasonText.trim() }]);
    setNewReasonText('');
    setShowAddReasonModal(false);
  };

  const handleSaveReasonEdit = (id: string) => {
    if (!editReasonText.trim()) return;
    setLostReasons(lostReasons.map(r => r.id === id ? { ...r, reason: editReasonText.trim() } : r));
    setEditingReasonId(null);
  };

  const handleDeleteReason = (id: string) => {
    setLostReasons(lostReasons.filter(r => r.id !== id));
  };

  // Assignee and Stage Filter States for Pipeline & Kanban
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isStageDropdownOpen, setIsStageDropdownOpen] = useState(false);

  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const stageDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
      }
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target as Node)) {
        setIsStageDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Leads according to search, assignee, and stage
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (lead.name || '').toLowerCase().includes(q);
        const phoneMatch = (lead.phone || '').includes(q);
        const emailMatch = (lead.email || '').toLowerCase().includes(q);
        const companyMatch = (lead.company || '').toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !emailMatch && !companyMatch) return false;
      }

      // 2. Assignee filter
      if (selectedAssignee !== 'all') {
        if (selectedAssignee === 'unassigned') {
          const hasOwner = lead.ownerAgentId || (lead.ownerAgentName && lead.ownerAgentName !== 'Unassigned');
          if (hasOwner) return false;
        } else {
          const selectedAgent = (agents || []).find(a => a.id === selectedAssignee);
          const isMatch = 
            lead.ownerAgentId === selectedAssignee || 
            (selectedAgent && lead.ownerAgentName && lead.ownerAgentName.toLowerCase() === selectedAgent.name.toLowerCase());
          if (!isMatch) return false;
        }
      }

      // 3. Stage filter
      if (selectedStageFilter !== 'all') {
        const leadStatusLow = (lead.status || '').toLowerCase().trim();
        const filterLow = selectedStageFilter.toLowerCase().trim();
        if (leadStatusLow !== filterLow) return false;
      }

      return true;
    });
  }, [leads, searchQuery, selectedAssignee, selectedStageFilter, agents]);

  const totalPipelineValue = filteredLeads.reduce((acc, l) => acc + (l.dealValue || 0), 0);

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-900 font-sans p-3 md:p-6 space-y-4">
      {/* View Switcher Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Lead stages</h1>
              <span className="text-xs text-slate-400 font-medium">|</span>
              <span className="text-xs text-slate-600 font-medium">Configure Your Sales Pipeline</span>
              <button 
                type="button"
                onClick={() => toast.info('Customize stage titles, reorder with up/down controls, set win/loss categories, and manage lost reasons.', 'Pipeline Guide')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1 cursor-pointer"
              >
                <span>How to use</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize initial, active, won and lost pipeline stages & configure standard reasons for lost leads.
            </p>
          </div>
        </div>

        {/* View Mode Toggle Button */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('config')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'config'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Lead Stages Config</span>
          </button>

          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'kanban'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Assignee | Status / Stage | Search) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, number or email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills: Assignee & Stage */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Assignee Filter Dropdown */}
          <div className="relative" ref={assigneeDropdownRef}>
            <button
              onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
              className={`border rounded-full px-3.5 py-1.5 text-xs font-medium flex items-center space-x-1.5 shadow-2xs cursor-pointer transition-colors ${
                selectedAssignee !== 'all'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {selectedAssignee === 'all'
                  ? 'Assignee'
                  : selectedAssignee === 'unassigned'
                  ? 'Unassigned'
                  : ((agents || []).find((a) => a.id === selectedAssignee)?.name.split(' ')[0] || 'Assignee')}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isAssigneeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAssigneeDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] p-1.5 space-y-1 text-xs font-sans animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Filter by Assignee
                </div>

                <button
                  onClick={() => {
                    setSelectedAssignee('all');
                    setIsAssigneeDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    selectedAssignee === 'all' ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>All Assignees ({leads.length})</span>
                  </div>
                  {selectedAssignee === 'all' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>

                <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
                  {(agents || []).map((ag) => {
                    const count = leads.filter(l => l.ownerAgentId === ag.id || (l.ownerAgentName && l.ownerAgentName.toLowerCase() === ag.name.toLowerCase())).length;
                    const isSelected = selectedAssignee === ag.id;
                    return (
                      <button
                        key={ag.id}
                        onClick={() => {
                          setSelectedAssignee(ag.id);
                          setIsAssigneeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0">
                            {ag.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-slate-900 leading-tight truncate">{ag.name}</p>
                            <p className="text-[10px] text-slate-500 leading-tight">{ag.role || 'Caller'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="text-[11px] text-slate-400 font-medium">{count}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setSelectedAssignee('unassigned');
                    setIsAssigneeDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors border-t border-slate-100 ${
                    selectedAssignee === 'unassigned' ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Unassigned</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {leads.filter(l => !l.ownerAgentId || l.ownerAgentName === 'Unassigned').length}
                    </span>
                    {selectedAssignee === 'unassigned' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Stage / Status Filter Dropdown */}
          <div className="relative" ref={stageDropdownRef}>
            <button
              onClick={() => setIsStageDropdownOpen(!isStageDropdownOpen)}
              className={`border rounded-full px-3.5 py-1.5 text-xs font-medium flex items-center space-x-1.5 shadow-2xs cursor-pointer transition-colors ${
                selectedStageFilter !== 'all'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{selectedStageFilter === 'all' ? 'Status' : selectedStageFilter}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isStageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isStageDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] p-2.5 space-y-1 text-xs font-sans max-h-96 overflow-y-auto animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-1 border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    Filter by Stage
                  </span>
                  {selectedStageFilter !== 'all' && (
                    <button
                      onClick={() => {
                        setSelectedStageFilter('all');
                        setIsStageDropdownOpen(false);
                      }}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      Reset to All
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedStageFilter('all');
                    setIsStageDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    selectedStageFilter === 'all' ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>All Stages</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-100">{filteredLeads.length}</span>
                    {selectedStageFilter === 'all' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                </button>

                <div className="space-y-0.5 border-t border-slate-100 pt-1">
                  {stages.map((stg) => {
                    const isSelected = selectedStageFilter.toLowerCase() === stg.name.toLowerCase();
                    const count = leads.filter(l => (l.status || '').toLowerCase() === stg.name.toLowerCase()).length;
                    return (
                      <button
                        key={stg.id}
                        onClick={() => {
                          setSelectedStageFilter(stg.name);
                          setIsStageDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: stg.color }} />
                          <span className="font-medium text-slate-900">{stg.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-100">{count}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RENDER VIEW MODE 1: CONFIGURATION LAYOUT (SAME AS SCREENSHOT) */}
      {viewMode === 'config' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          
          {/* COLUMN 1: Initial stage */}
          <div className="space-y-2">
            {/* Chevron Badge Banner Header */}
            <div className="relative">
              <div className="bg-[#E5E7EB] text-slate-700 font-semibold text-center text-sm py-2 px-4 rounded-t-lg shadow-xs border border-slate-300 border-b-0 flex items-center justify-center">
                <span>Initial stage</span>
              </div>
            </div>

            {/* Container Box */}
            <div className="bg-white border border-slate-200/90 rounded-b-xl rounded-t-none p-3 shadow-sm min-h-[300px] space-y-3">
              {editingInitial ? (
                <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-lg border border-slate-300">
                  <input
                    type="text"
                    value={initialStageName}
                    onChange={(e) => setInitialStageName(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                  />
                  <button onClick={() => setEditingInitial(false)} className="p-1 rounded bg-indigo-600 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="bg-[#E5E7EB]/80 border border-slate-300 rounded-lg p-2.5 flex items-center justify-between hover:border-slate-400 transition-all">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-800">{initialStageName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200 italic font-mono">
                      Default
                    </span>
                  </div>

                  <button
                    onClick={() => setEditingInitial(true)}
                    className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
                    title="Edit stage name"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Initial Stage Behavior:</p>
                <p>New incoming leads from Facebook, IndiaMart, Website forms or API imports are automatically placed in this default stage.</p>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Active stage */}
          <div className="space-y-2">
            {/* Chevron Badge Banner Header */}
            <div className="relative">
              <div className="bg-[#DCFCE7] text-emerald-800 font-semibold text-center text-sm py-2 px-4 rounded-t-lg shadow-xs border border-emerald-300/80 border-b-0 flex items-center justify-center">
                <span>Active stage</span>
              </div>
            </div>

            {/* Container Box */}
            <div className="bg-white border border-slate-200/90 rounded-b-xl rounded-t-none p-3 shadow-sm min-h-[500px] space-y-2">
              {/* + Add Active Stage Button */}
              <button
                onClick={() => setShowAddStageModal(true)}
                className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-indigo-400 rounded-lg bg-slate-50 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-600 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>

              {/* Active Stage Draggable Items List */}
              <div className="space-y-1.5 pt-1">
                {activeStagesList.map((stage) => (
                  <div key={stage.id}>
                    {editingStageId === stage.id ? (
                      <div className="flex flex-col space-y-2 bg-slate-100 p-2.5 rounded-lg border border-slate-300">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editStageName}
                            onChange={(e) => setEditStageName(e.target.value)}
                            className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveStageEdit(stage.id)}
                            className="p-1 rounded bg-indigo-600 text-white cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingStageId(null)}
                            className="p-1 rounded bg-slate-300 text-slate-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Inline Color Palette Picker */}
                        <div className="flex items-center space-x-1.5 pt-1 border-t border-slate-200">
                          <span className="text-[10px] font-semibold text-slate-500">Color:</span>
                          <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
                            {STAGE_COLOR_PALETTE.map((col) => (
                              <button
                                key={col.label}
                                type="button"
                                onClick={() => setEditStageBg(col.bg)}
                                className={`w-4 h-4 rounded-full border cursor-pointer transition-transform shrink-0 ${
                                  editStageBg === col.bg ? 'ring-2 ring-indigo-600 scale-110 border-slate-900' : 'border-slate-300 hover:scale-110'
                                }`}
                                style={{ backgroundColor: col.hex }}
                                title={col.label}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`p-2.5 rounded-lg border ${stage.bg} flex items-center justify-between group hover:shadow-xs transition-all cursor-grab active:cursor-grabbing`}
                      >
                        <div className="flex items-center space-x-2">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                          <span className={`text-xs font-semibold ${stage.text}`}>{stage.name}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {/* Quick Stage Color Palette Hover Swatches */}
                          <div className="relative group/color">
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-slate-400/80 shadow-2xs cursor-pointer hover:scale-110 transition-transform"
                              style={{ backgroundColor: STAGE_COLOR_PALETTE.find(c => c.bg === stage.bg)?.hex || '#e2e8f0' }}
                              title="Click pencil or hover to change color"
                            />
                            <div className="absolute right-0 top-full mt-1 hidden group-hover/color:flex items-center bg-white border border-slate-200 shadow-lg p-1.5 rounded-lg z-30 space-x-1">
                              {STAGE_COLOR_PALETTE.map((col) => (
                                <button
                                  key={col.label}
                                  type="button"
                                  onClick={() => handleChangeStageColor(stage.id, col.bg)}
                                  className="w-3.5 h-3.5 rounded-full border border-slate-300 hover:scale-125 transition-transform cursor-pointer shrink-0"
                                  style={{ backgroundColor: col.hex }}
                                  title={`Set to ${col.label}`}
                                />
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setEditingStageId(stage.id);
                              setEditStageName(stage.name);
                              setEditStageBg(stage.bg);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Edit Stage"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStage(stage.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Stage"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 3: Closed stage */}
          <div className="space-y-2">
            {/* Chevron Badge Banner Header */}
            <div className="relative">
              <div className="bg-[#DCFCE7] text-emerald-800 font-semibold text-center text-sm py-2 px-4 rounded-t-lg shadow-xs border border-emerald-300/80 border-b-0 flex items-center justify-center">
                <span>Closed stage</span>
              </div>
            </div>

            {/* Container Box */}
            <div className="bg-white border border-slate-200/90 rounded-b-xl rounded-t-none p-3 shadow-sm min-h-[500px] space-y-4">
              
              {/* WON SECTION */}
              <div className="bg-[#DCFCE7]/40 border border-emerald-300/80 rounded-xl p-3 space-y-2">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Won</h3>
                
                {editingWon ? (
                  <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-300">
                    <input
                      type="text"
                      value={wonStageName}
                      onChange={(e) => setWonStageName(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                    />
                    <button onClick={() => setEditingWon(false)} className="p-1 rounded bg-emerald-600 text-white">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#DCFCE7] border border-emerald-300 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-950">{wonStageName}</span>
                    <button
                      onClick={() => setEditingWon(true)}
                      className="p-1 text-emerald-700 hover:text-emerald-950 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* LOST SECTION */}
              <div className="bg-rose-50/40 border-2 border-rose-400/80 rounded-xl p-3 space-y-3">
                <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider">Lost</h3>

                {editingLost ? (
                  <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-300">
                    <input
                      type="text"
                      value={lostStageName}
                      onChange={(e) => setLostStageName(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                    />
                    <button onClick={() => setEditingLost(false)} className="p-1 rounded bg-rose-600 text-white">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-pink-100/90 border border-pink-200 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">{lostStageName}</span>
                    <button
                      onClick={() => setEditingLost(true)}
                      className="p-1 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Sub-section: Reason for Lost leads */}
                <div className="pt-2 border-t border-rose-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      Reason for Lost leads ({lostReasons.length} / 25)
                    </span>
                    <button
                      onClick={() => setShowAddReasonModal(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  {/* List of Reasons for Lost leads */}
                  <div className="space-y-1.5">
                    {lostReasons.map((reasonItem) => (
                      <div key={reasonItem.id}>
                        {editingReasonId === reasonItem.id ? (
                          <div className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border border-slate-300">
                            <input
                              type="text"
                              value={editReasonText}
                              onChange={(e) => setEditReasonText(e.target.value)}
                              className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveReasonEdit(reasonItem.id)}
                              className="p-1 rounded bg-indigo-600 text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="bg-slate-100/90 border border-slate-200/80 rounded-lg p-2 flex items-center justify-between group hover:bg-slate-200/60 transition-all">
                            <div className="flex items-center space-x-2">
                              <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 cursor-grab" />
                              <span className="text-xs font-medium text-slate-800">{reasonItem.reason}</span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  setEditingReasonId(reasonItem.id);
                                  setEditReasonText(reasonItem.reason);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                title="Edit Reason"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteReason(reasonItem.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Reason"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* RENDER VIEW MODE 2: KANBAN BOARD */
        <div className="space-y-2">
          {/* Mobile Quick Jump Stage Pill Strip */}
          <div className="block md:hidden overflow-x-auto pb-2 ios-scroll no-scrollbar">
            <div className="flex items-center space-x-2">
              {stages.map((stg) => {
                const count = filteredLeads.filter((l) => (l.status || '').toLowerCase() === stg.name.toLowerCase()).length;
                return (
                  <button
                    key={stg.id}
                    onClick={() => {
                      const el = document.getElementById(`kanban-col-${stg.id}`);
                      el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold shrink-0 shadow-2xs hover:border-indigo-400 active:bg-indigo-50 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stg.color }} />
                    <span className="truncate">{stg.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex space-x-3 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory ios-scroll">
            {stages.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => (l.status || '').toLowerCase() === stage.name.toLowerCase());
              const stageValue = stageLeads.reduce((acc, curr) => acc + (curr.dealValue || 0), 0);

              return (
                <div 
                  id={`kanban-col-${stage.id}`}
                  key={stage.id} 
                  className="w-[84vw] sm:w-68 shrink-0 snap-center bg-white border border-slate-200 rounded-xl p-3 flex flex-col max-h-[78vh] shadow-sm"
                >
                <div className="p-1.5 border-b border-slate-200 space-y-1 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">{stage.name}</h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="capitalize font-semibold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                      {stage.category || (stage.name === 'New Lead' || stage.name === 'Fresh' ? 'initial' : stage.name === 'Converted' || stage.name === 'Lost' ? 'closed' : 'active')}
                    </span>
                    <span className="font-bold text-slate-700 font-mono">{formatDealValueCompact(stageValue, currency)}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {stageLeads.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-[10px] font-mono border border-dashed border-slate-300 rounded">
                      Empty Stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => onOpenLeadDetail(lead)}
                        className={`p-2.5 rounded-lg bg-white border-l-3 ${
                          lead.aiRating === 'Hot' ? 'border-l-indigo-600' : 'border-l-slate-400'
                        } border-r border-t border-b border-slate-200 shadow-xs space-y-2 group cursor-pointer hover:shadow-md transition-all`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-semibold text-slate-700 leading-tight hover:text-slate-900 hover:underline capitalize">
                              {(() => {
                                const h1 = customFields.find((f) => f.primarySlot === 'H1');
                                if (h1 && h1.name !== 'name' && (lead as any)[h1.name]) {
                                  return (lead as any)[h1.name];
                                }
                                return lead.name;
                              })()}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {(() => {
                                const h2 = customFields.find((f) => f.primarySlot === 'H2');
                                if (h2 && (lead as any)[h2.name]) {
                                  return (lead as any)[h2.name];
                                }
                                return lead.company || lead.phone;
                              })()}
                            </p>
                          </div>
                          {lead.aiRating === 'Hot' && (
                            <span title="AI Hot Lead" className="text-amber-500 text-xs">🔥</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-bold text-emerald-600">{formatDealValue(lead.dealValue || 0, currency)}</span>
                          <div className="flex items-center space-x-1">
                            {lead.status === 'Lost' && lead.lostReason && (
                              <span className="text-[9px] text-rose-700 font-bold px-1.5 py-0.2 rounded bg-rose-50 border border-rose-200 truncate max-w-[100px]" title={`Lost Reason: ${lead.lostReason}`}>
                                {lead.lostReason}
                              </span>
                            )}
                            <span className="text-[9px] text-slate-600 px-1 py-0.2 rounded bg-slate-100 border border-slate-200">{lead.source}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.value === 'Follow Up') {
                                openFollowUpModal(lead);
                              } else {
                                onUpdateLeadStage(lead.id, e.target.value as LeadStatus);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-50 text-[9px] font-mono text-slate-700 rounded px-1 py-0.5 focus:outline-none border border-slate-200 cursor-pointer"
                          >
                            {stages.map((stage) => (
                              <option key={stage.id || stage.name} value={stage.name}>
                                Move: {stage.name}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSummaryLead(lead); }}
                              title="Quick Lead Call Brief"
                              className="px-2 py-0.5 rounded bg-transparent border border-indigo-200 text-indigo-700 hover:bg-indigo-50/50 transition-colors cursor-pointer text-[10px] font-semibold"
                            >
                              Brief
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openFollowUpModal(lead); }}
                              title="Schedule Follow-Up"
                              className="px-2 py-0.5 rounded bg-transparent border border-purple-200 text-[#5034a8] hover:bg-purple-50/50 transition-colors cursor-pointer text-[10px] font-semibold"
                            >
                              Follow Up
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `tel:${lead.phone}`;
                                if (onOpenPowerDialerForLead) onOpenPowerDialerForLead(lead);
                              }}
                              title="Direct Call"
                              className="p-1 rounded bg-emerald-100 hover:bg-emerald-600 text-emerald-700 hover:text-white cursor-pointer"
                            >
                              <PhoneCall className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Modal: Add New Active Stage */}
      {showAddStageModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-xl p-4 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add New Active Pipeline Stage</h3>
              <button onClick={() => setShowAddStageModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stage Name</label>
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="e.g. Visit Scheduled, Proposal Sent, Negotiation"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Select Stage Color</label>
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
                {STAGE_COLOR_PALETTE.map((col) => (
                  <button
                    key={col.label}
                    type="button"
                    onClick={() => setNewStageBg(col.bg)}
                    className={`w-6 h-6 rounded-full border cursor-pointer transition-transform ${
                      newStageBg === col.bg ? 'ring-2 ring-indigo-600 scale-110 border-slate-900' : 'border-slate-300 hover:scale-110'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowAddStageModal(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleAddStage} disabled={!newStageName.trim()} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50">Add Stage</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lead Call Brief / Summary */}
      {summaryLead && (
        <LeadSummaryModal
          lead={summaryLead}
          onClose={() => setSummaryLead(null)}
          onCallLead={(l) => { window.location.href = `tel:${l.phone}`; }}
          onScheduleFollowUp={(l) => openFollowUpModal(l)}
        />
      )}

      {/* Modal: Schedule Follow-Up from Pipeline */}
      {followUpLead && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-4 space-y-4 font-sans text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-sans">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 font-sans tracking-tight">
                <CalendarPlus className="w-4 h-4 text-[#5034a8]" />
                <span className="font-sans">Schedule Follow-Up for {followUpLead.name}</span>
              </h3>
              <button onClick={() => setFollowUpLead(null)} className="text-slate-400 hover:text-slate-600 font-sans cursor-pointer text-sm">✕</button>
            </div>

            <div className="space-y-3 font-sans">
              {/* Assignee Selector */}
              <div>
                <label className="block text-[11px] font-sans uppercase text-slate-600 font-bold mb-1 tracking-wider">
                  FOLLOW-UP ASSIGNEE
                </label>
                <div className="relative">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <select
                    value={followUpAssigneeId}
                    onChange={(e) => setFollowUpAssigneeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#5034a8] cursor-pointer font-sans"
                  >
                    <option value="">Select Assignee</option>
                    {(agents || []).map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} ({ag.role})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Directly assigned to the lead's owner ({followUpLead.ownerAgentName || 'Unassigned'}). You can reassign if needed.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-sans uppercase text-slate-600 font-bold mb-2 tracking-wider">SCHEDULED FOLLOW-UP DATE & TIME</label>
                <div className="space-y-2 font-sans text-xs">
                  {/* Date picker */}
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={followUpDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#5034a8]"
                    />
                  </div>

                  {/* Time selector */}
                  <div className="flex items-center space-x-2">
                    {/* Hour */}
                    <div className="flex-1">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#5034a8] focus-within:ring-1 focus-within:ring-[#5034a8]/20">
                        <Clock className="w-3.5 h-3.5 text-slate-400 ml-2.5 shrink-0" />
                        <select
                          value={followUpHour}
                          onChange={(e) => setFollowUpHour(e.target.value)}
                          className="flex-1 bg-transparent px-2 py-2 text-xs text-slate-900 focus:outline-none cursor-pointer"
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const v = String(i + 1).padStart(2, '0');
                            return <option key={v} value={v}>{v}</option>;
                          })}
                        </select>
                      </div>
                    </div>

                    <span className="text-slate-400 font-bold text-sm">:</span>

                    {/* Minute */}
                    <div className="flex-1">
                      <select
                        value={followUpMinute}
                        onChange={(e) => setFollowUpMinute(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#5034a8] cursor-pointer"
                      >
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    {/* AM/PM switcher */}
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden shrink-0">
                      {(['AM', 'PM'] as const).map((period) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setFollowUpAmPm(period)}
                          className={`px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                            followUpAmPm === period
                              ? 'bg-[#5034a8] text-white'
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formatted Date Preview */}
                  {followUpDate && (
                    <div className="mt-1.5 font-sans">
                      <p className="text-[11px] font-semibold text-[#5034a8] bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md inline-flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#5034a8]" />
                        <span>
                          Scheduled: {new Date(`${followUpDate}T${String(
                            followUpAmPm === 'PM'
                              ? (parseInt(followUpHour) === 12 ? 12 : parseInt(followUpHour) + 12)
                              : (parseInt(followUpHour) === 12 ? 0 : parseInt(followUpHour))
                          ).padStart(2, '0')}:${followUpMinute}:00`).toLocaleString('en-IN', {
                            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          })}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  value={followUpRemarks}
                  onChange={(e) => setFollowUpRemarks(e.target.value)}
                  placeholder="Notes or agenda for this follow-up..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-[#5034a8] font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 font-sans">
              <button
                onClick={() => setFollowUpLead(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-sans font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFollowUp}
                className="px-4 py-1.5 rounded-lg bg-[#5034a8] hover:bg-[#432993] text-white font-sans font-bold shadow-2xs cursor-pointer"
              >
                Save & Move to Follow Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Reason for Lost Leads */}
      {showAddReasonModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-xl p-4 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add Reason for Lost Leads</h3>
              <button onClick={() => setShowAddReasonModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reason Description</label>
              <input
                type="text"
                value={newReasonText}
                onChange={(e) => setNewReasonText(e.target.value)}
                placeholder="e.g. Price too high, Went to competitor, Not interested"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddReasonModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLostReason}
                disabled={!newReasonText.trim()}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50"
              >
                Add Reason
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export const PipelineView = PipelinePage;
export default PipelinePage;
