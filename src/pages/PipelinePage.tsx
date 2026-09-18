import React, { useState, useEffect } from 'react';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  GripVertical, 
  Check, 
  SlidersHorizontal,
  Kanban,
  Phone,
  MessageSquare,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  User,
  Sparkles,
  Calendar,
  CalendarPlus,
  Clock,
  UserCheck
} from 'lucide-react';
import { PipelineStage, Lead, Agent, formatDealValue } from '../types';

import { toast } from '../context/ToastContext';
import { ScheduleFollowUpModal } from '../components/ScheduleFollowUpModal';
import { CustomDropdown, DropdownOption } from '../components/CustomDropdown';

interface PipelineViewProps {
  leads?: Lead[];
  agents?: Agent[];
  stages?: PipelineStage[];
  customFields?: any[];
  currency?: string;
  lostReasons?: string[];
  activeAgent?: Agent;
  activeTenantId?: string;
  onOpenLeadDetail?: (lead: Lead) => void;
  onUpdateLeadStage?: (leadId: string, newStageStatus: string) => void;
  onUpdateStages?: (stages: PipelineStage[]) => void;
  onUpdateLostReasons?: (reasons: string[]) => void;
  onUpdateLead?: (lead: Lead) => void;
  onShowToast?: (msg: string) => void;
  [key: string]: any;
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
  leads = [],
  agents = [],
  stages: propStages,
  customFields = [],
  currency = 'INR',
  lostReasons: propLostReasons,
  activeAgent,
  activeTenantId = 'company_kite_aviation',
  onOpenLeadDetail,
  onUpdateLeadStage,
  onUpdateStages,
  onUpdateLostReasons,
  onUpdateLead,
  onShowToast
}) => {
  // Current Tab: Kanban Deal Flow or Stage Configuration
  const [viewMode, setViewMode] = useState<'kanban' | 'settings'>('kanban');

  // Master Synchronized Pipeline Stages
  const [localStages, setLocalStages] = useState<PipelineStage[]>(
    propStages && propStages.length > 0 ? propStages : []
  );

  useEffect(() => {
    if (propStages && propStages.length > 0) {
      setLocalStages(propStages);
    }
  }, [propStages]);

  // Master Synchronized Lost Reasons
  const defaultLostReasons = [
    'No Need',
    'Unable to Connect',
    'Budget Issues',
    'Product does not fit need',
    'Lost to competitor',
    'Unknown Reason',
    'Not eligible',
    'Junk'
  ];

  const [lostReasonsList, setLostReasonsList] = useState<string[]>(
    propLostReasons && propLostReasons.length > 0 ? propLostReasons : defaultLostReasons
  );

  useEffect(() => {
    if (propLostReasons && propLostReasons.length > 0) {
      setLostReasonsList(propLostReasons);
    }
  }, [propLostReasons]);

  // Kanban Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('all');

  // Modal & Inline Stage Editing States
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editStageName, setEditStageName] = useState<string>('');
  const [editStageBg, setEditStageBg] = useState<string>('bg-pink-100/90 border-pink-200');
  
  const [showAddStageModal, setShowAddStageModal] = useState<boolean>(false);
  const [newStageName, setNewStageName] = useState<string>('');
  const [newStageBg, setNewStageBg] = useState<string>(STAGE_COLOR_PALETTE[0].bg);

  const [editingReasonIndex, setEditingReasonIndex] = useState<number | null>(null);
  const [editReasonText, setEditReasonText] = useState<string>('');

  const [showAddReasonModal, setShowAddReasonModal] = useState<boolean>(false);
  const [newReasonText, setNewReasonText] = useState<string>('');

  // Initial stage default name
  const freshStage = localStages.find(s => s.name === 'Fresh' || s.order === 0) || { id: 'st-fresh', name: 'Fresh', color: '#3B82F6', order: 0 };
  const [editingInitial, setEditingInitial] = useState(false);
  const [initialStageName, setInitialStageName] = useState(freshStage.name);

  // Won stage default name
  const wonStage = localStages.find(s => s.name === 'Converted') || { id: 'st-won', name: 'Converted', color: '#10B981', order: 99 };
  const [editingWon, setEditingWon] = useState(false);
  const [wonStageName, setWonStageName] = useState(wonStage.name);

  // Lost stage default name
  const lostStage = localStages.find(s => s.name === 'Lost') || { id: 'st-lost', name: 'Lost', color: '#EF4444', order: 100 };
  const [editingLost, setEditingLost] = useState(false);
  const [lostStageName, setLostStageName] = useState(lostStage.name);

  // Database Save Helper for Stages (persists via App onUpdateStages → /api/pipelines)
  const persistStagesToDb = (updatedStages: PipelineStage[]) => {
    setLocalStages(updatedStages);
    if (onUpdateStages) {
      onUpdateStages(updatedStages);
    }
  };

  // Database Save Helper for Lost Reasons (persists via App onUpdateLostReasons → API)
  const persistLostReasonsToDb = (updatedReasons: string[]) => {
    setLostReasonsList(updatedReasons);
    if (onUpdateLostReasons) {
      onUpdateLostReasons(updatedReasons);
    }
  };

  // Active Stages (excluding Initial, Won, Lost)
  const activeStagesList = localStages.filter(s => s.name !== 'Fresh' && s.name !== 'Converted' && s.name !== 'Lost');

  // Stage CRUD Operations
  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const newStage: PipelineStage = {
      id: `st-${Date.now()}`,
      name: newStageName.trim(),
      color: newStageBg.includes('#') ? newStageBg : '#6366F1',
      order: localStages.length,
      category: 'active'
    };
    const updated = [...localStages, newStage];
    persistStagesToDb(updated);
    setNewStageName('');
    setShowAddStageModal(false);
    toast.success(`Added pipeline stage "${newStage.name}"`);
  };

  const handleSaveStageEdit = (id: string) => {
    if (!editStageName.trim()) return;
    const updated = localStages.map(st => st.id === id ? { ...st, name: editStageName.trim() } : st);
    persistStagesToDb(updated);
    setEditingStageId(null);
    toast.success('Stage name updated');
  };

  const handleChangeStageColor = (id: string, newHexOrClass: string) => {
    const updated = localStages.map(st => st.id === id ? { ...st, color: newHexOrClass } : st);
    persistStagesToDb(updated);
  };

  const handleDeleteStage = (id: string) => {
    const target = localStages.find(s => s.id === id);
    if (localStages.length <= 3) {
      toast.warning('A pipeline requires at least 3 stages.');
      return;
    }
    const updated = localStages.filter(st => st.id !== id);
    persistStagesToDb(updated);
    toast.success(`Deleted stage "${target?.name || ''}"`);
  };

  // Lost Reason CRUD
  const handleAddLostReason = () => {
    if (!newReasonText.trim()) return;
    const updated = [...lostReasonsList, newReasonText.trim()];
    persistLostReasonsToDb(updated);
    setNewReasonText('');
    setShowAddReasonModal(false);
    toast.success('Added lost reason');
  };

  const handleSaveReasonEdit = (index: number) => {
    if (!editReasonText.trim()) return;
    const updated = [...lostReasonsList];
    updated[index] = editReasonText.trim();
    persistLostReasonsToDb(updated);
    setEditingReasonIndex(null);
    toast.success('Reason updated');
  };

  const handleDeleteReason = (index: number) => {
    const updated = lostReasonsList.filter((_, i) => i !== index);
    persistLostReasonsToDb(updated);
    toast.success('Reason removed');
  };

  // Drag and drop state for Kanban cards
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStageName, setDragOverStageName] = useState<string | null>(null);

  // Follow-up scheduling modal state
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [followUpTargetStage, setFollowUpTargetStage] = useState<string>('Follow Up');

  const isFollowUpStage = (stageName: string) => {
    const normalized = stageName.trim().toLowerCase().replace(/[-_\s]+/g, '');
    return normalized.includes('followup') || normalized.includes('follow');
  };

  const openFollowUpModal = (lead: Lead, targetStageName: string = 'Follow Up') => {
    setFollowUpLead(lead);
    setFollowUpTargetStage(targetStageName);
  };

  const executeLeadStageChange = (
    targetLead: Lead,
    targetStageName: string
  ) => {
    const updates: Partial<Lead> = {
      status: targetStageName as any,
      pipelineStageId: targetStageName,
      updatedAt: new Date().toISOString()
    };

    // 1. Trigger parent / global CRM state update
    if (onUpdateLeadStage) {
      onUpdateLeadStage(targetLead.id, targetStageName);
    }
    if (onUpdateLead) {
      onUpdateLead({ ...targetLead, ...updates } as Lead);
    }

    // 2. Direct database persistence
    const token = typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('pixbe_auth_token') || '') : '';
    fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': activeTenantId || activeAgent?.tenantId || 'company_kite_aviation'
      },
      body: JSON.stringify({
        id: targetLead.id,
        ...updates
      })
    })
      .then((res) => {
        if (!res.ok) {
          res.json().then(data => {
            if (data?.error) toast.error(data.error, 'Database Validation');
          }).catch(() => {});
        }
      })
      .catch((err) => console.warn('Direct database lead update error:', err));

    toast.success(`Moved "${targetLead.name}" to ${targetStageName}`);
  };

  const handleDropLeadOnStage = (leadId: string, targetStageName: string) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;
    if ((targetLead.status || 'Fresh').toLowerCase() === targetStageName.toLowerCase()) return;

    if (isFollowUpStage(targetStageName)) {
      openFollowUpModal(targetLead, targetStageName);
      return;
    }

    // Normal stage progression directly
    executeLeadStageChange(targetLead, targetStageName);
  };

  // Filtered Leads for Kanban
  const filteredLeads = leads.filter(ld => {
    if (selectedAgentFilter !== 'all') {
      if (selectedAgentFilter === 'unassigned') {
        const hasOwner = ld.ownerAgentId || (ld.ownerAgentName && ld.ownerAgentName !== 'Unassigned');
        if (hasOwner) return false;
      } else {
        const agentObj = agents.find(a => a.id === selectedAgentFilter);
        const matchesId = ld.ownerAgentId === selectedAgentFilter || (ld as any).assignedAgentId === selectedAgentFilter || ld.assignedTo === selectedAgentFilter;
        const matchesName = (ld.ownerAgentName && ld.ownerAgentName.toLowerCase() === selectedAgentFilter.toLowerCase()) || 
                            ((ld as any).agentName && (ld as any).agentName.toLowerCase() === selectedAgentFilter.toLowerCase()) ||
                            (agentObj && (
                              (ld.ownerAgentName && ld.ownerAgentName.toLowerCase() === agentObj.name.toLowerCase()) ||
                              ((ld as any).agentName && (ld as any).agentName.toLowerCase() === agentObj.name.toLowerCase()) ||
                              (ld.assignedTo && ld.assignedTo.toLowerCase() === agentObj.name.toLowerCase())
                            ));
        if (!matchesId && !matchesName) return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ld.name?.toLowerCase().includes(q);
      const matchPhone = ld.phone?.toLowerCase().includes(q);
      const matchEmail = ld.email?.toLowerCase().includes(q);
      const matchCompany = ld.company?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchCompany) return false;
    }
    return true;
  });



  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-3 md:p-6 space-y-4">
      
      {/* Top Header Bar with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#5034a8]/10 text-[#5034a8] border border-[#5034a8]/20">
            {viewMode === 'kanban' ? <Kanban className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
              {viewMode === 'kanban' ? 'Deals & Pipeline Kanban' : 'Lead Stages Configuration'}
            </h1>
          </div>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white text-[#5034a8] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Deals Board</span>
          </button>
          <button
            onClick={() => setViewMode('settings')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'settings'
                ? 'bg-white text-[#5034a8] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Configure Stages</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: KANBAN DEALS PIPELINE BOARD */}
      {viewMode === 'kanban' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center space-x-2 flex-1 min-w-[240px] max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search deals by lead name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#5034a8] font-sans"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-600">Assignee:</label>
              <select
                value={selectedAgentFilter}
                onChange={(e) => setSelectedAgentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Telecallers & Agents</option>
                <option value="unassigned">Unassigned</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>{ag.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kanban Columns Grid */}
          <div className="flex items-start space-x-3 overflow-x-auto pb-4 ios-scroll min-h-[calc(100vh-280px)]">
            {localStages.map((stage) => {
              const stageLeads = filteredLeads.filter(
                (l) => (l.status || 'Fresh').toLowerCase() === stage.name.toLowerCase()
              );
              const stageValue = stageLeads.reduce((sum, l) => sum + (l.dealValue || l.value || 0), 0);
              const isDropTarget = dragOverStageName === stage.name;

              return (
                <div 
                  key={stage.id} 
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverStageName !== stage.name) {
                      setDragOverStageName(stage.name);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverStageName === stage.name) {
                      setDragOverStageName(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedLeadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
                    if (droppedLeadId) {
                      handleDropLeadOnStage(droppedLeadId, stage.name);
                    }
                    setDragOverStageName(null);
                    setDraggedLeadId(null);
                  }}
                  className={`w-72 shrink-0 rounded-2xl flex flex-col max-h-[calc(100vh-280px)] transition-all duration-150 ${
                    isDropTarget
                      ? 'bg-purple-50/90 border-2 border-dashed border-[#5034a8] scale-[1.01] shadow-lg ring-2 ring-[#5034a8]/30'
                      : 'bg-slate-100/70 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-3 bg-white border-b border-slate-200 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: stage.color?.startsWith('#') ? stage.color : '#5034a8' }} 
                      />
                      <span className="font-bold text-xs text-slate-900 truncate tracking-tight">{stage.name}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                        {stageLeads.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 font-mono">
                      {formatDealValue(stageValue, currency)}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="p-2 space-y-2 overflow-y-auto flex-1">
                    {stageLeads.length === 0 ? (
                      <div className={`py-8 text-center text-xs border border-dashed rounded-xl transition-colors ${
                        isDropTarget ? 'border-[#5034a8] text-[#5034a8] bg-white font-semibold' : 'border-slate-200 text-slate-400 bg-white/50'
                      }`}>
                        {isDropTarget ? 'Drop here to change stage' : `No deals in ${stage.name}`}
                      </div>
                    ) : (
                      stageLeads.map((lead) => {
                        const isBeingDragged = draggedLeadId === lead.id;
                        return (
                          <div
                            key={lead.id}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', lead.id);
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedLeadId(lead.id);
                            }}
                            onDragEnd={() => {
                              setDraggedLeadId(null);
                              setDragOverStageName(null);
                            }}
                            onClick={() => onOpenLeadDetail && onOpenLeadDetail(lead)}
                            className={`p-3 bg-white rounded-xl border transition-all cursor-grab active:cursor-grabbing space-y-2 group select-none ${
                              isBeingDragged
                                ? 'opacity-40 scale-95 border-[#5034a8] ring-2 ring-[#5034a8] shadow-lg'
                                : 'border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#5034a8]/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1.5 min-w-0">
                                <GripVertical className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0" />
                                <span className="font-bold text-xs text-slate-900 group-hover:text-[#5034a8] transition-colors truncate">
                                  {lead.name}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-emerald-600 font-mono shrink-0 ml-1">
                                {formatDealValue(lead.dealValue || lead.value || 0, currency)}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center justify-between">
                              <span>{lead.phone}</span>
                              <span 
                                className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 truncate max-w-[90px]"
                                title={lead.ownerAgentName || (lead as any).agentName || agents.find(a => a.id === lead.ownerAgentId)?.name || 'Unassigned'}
                              >
                                {lead.ownerAgentName || (lead as any).agentName || agents.find(a => a.id === lead.ownerAgentId)?.name || 'Unassigned'}
                              </span>
                            </div>

                            {lead.notes && (
                              <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                                "{lead.notes}"
                              </p>
                            )}

                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                              {/* Quick Stage Mover Pill Dropdown */}
                              {(() => {
                                const currentStatus = lead.status || 'Fresh';
                                const stageConfig = localStages.find(s => s.name.toLowerCase() === currentStatus.toLowerCase());
                                const rawColor = stageConfig?.color;
                                const color = (rawColor && rawColor.startsWith('#')) ? rawColor : '#6366F1';
                                const stageOptions: DropdownOption<string>[] = localStages.map(s => ({
                                  value: s.name,
                                  label: s.name
                                }));
                                return (
                                  <CustomDropdown<string>
                                    value={currentStatus}
                                    onChange={(newStatus) => {
                                      handleDropLeadOnStage(lead.id, newStatus);
                                    }}
                                    options={stageOptions}
                                    align="left"
                                    wrapperClassName="inline-block max-w-[140px]"
                                    className="font-semibold py-0.5 px-2.5 rounded-full text-[11px] tracking-tight border transition-all shadow-none"
                                    style={{
                                      backgroundColor: `${color}1A`,
                                      color: color,
                                      borderColor: `${color}40`
                                    }}
                                  />
                                );
                              })()}

                              <div className="flex items-center space-x-1">
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="p-1 rounded-md text-slate-500 hover:text-[#5034a8] hover:bg-slate-100 transition-colors"
                                  title={`Call ${lead.name}`}
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                                <a
                                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: STAGE CONFIGURATION ARCHITECTURE */}
      {viewMode === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          
          {/* COLUMN 1: Initial stage */}
          <div className="space-y-2">
            <div className="relative">
              <div className="bg-[#E5E7EB] text-slate-700 font-semibold text-center text-sm py-2 px-4 rounded-t-xl shadow-xs border border-slate-300 border-b-0 flex items-center justify-center">
                <span>Initial stage</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-b-xl p-4 shadow-sm min-h-[300px] space-y-3">
              {editingInitial ? (
                <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-lg border border-slate-300">
                  <input
                    type="text"
                    value={initialStageName}
                    onChange={(e) => setInitialStageName(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      const updated = localStages.map(s => (s.name === 'Fresh' || s.order === 0) ? { ...s, name: initialStageName } : s);
                      persistStagesToDb(updated);
                      setEditingInitial(false);
                      toast.success('Initial stage updated');
                    }} 
                    className="p-1 rounded bg-[#5034a8] text-white cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="bg-[#E5E7EB]/80 border border-slate-300 rounded-lg p-2.5 flex items-center justify-between hover:border-slate-400 transition-all">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-800">{initialStageName}</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">Default</span>
                  </div>
                  <button
                    onClick={() => setEditingInitial(true)}
                    className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                    title="Edit initial stage name"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs leading-relaxed space-y-1">
                <p className="font-semibold text-slate-700">Initial Stage Behavior:</p>
                <p className="text-[11px]">
                  New incoming leads from Facebook Ads, Google Ads, IndiaMart, Webhooks, or API imports are automatically placed in this default stage in the database.
                </p>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Active stage */}
          <div className="space-y-2">
            <div className="relative">
              <div className="bg-[#D1FAE5] text-emerald-800 font-semibold text-center text-sm py-2 px-4 rounded-t-xl shadow-xs border border-emerald-300 border-b-0 flex items-center justify-center">
                <span>Active stage ({activeStagesList.length})</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-b-xl p-4 shadow-sm min-h-[300px] space-y-2">
              <button
                onClick={() => setShowAddStageModal(true)}
                className="w-full py-2 border border-dashed border-slate-300 hover:border-emerald-500 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Active Stage</span>
              </button>

              <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                {activeStagesList.map((stage) => (
                  <div key={stage.id} className="relative">
                    {editingStageId === stage.id ? (
                      <div className="bg-white p-2.5 rounded-lg border-2 border-[#5034a8] shadow-md space-y-2">
                        <input
                          type="text"
                          value={editStageName}
                          onChange={(e) => setEditStageName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                        />
                        <div className="flex justify-end space-x-1.5 pt-1">
                          <button
                            onClick={() => setEditingStageId(null)}
                            className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveStageEdit(stage.id)}
                            className="px-2.5 py-0.5 text-xs bg-[#5034a8] text-white font-medium rounded hover:bg-[#432993] cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between shadow-2xs group hover:bg-slate-100 transition-all">
                        <div className="flex items-center space-x-2">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 cursor-grab" />
                          <span 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: stage.color?.startsWith('#') ? stage.color : '#6366F1' }} 
                          />
                          <span className="text-xs font-semibold text-slate-800">{stage.name}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingStageId(stage.id);
                              setEditStageName(stage.name);
                              setEditStageBg(stage.color);
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
          <div className="space-y-3">
            <div className="relative">
              <div className="bg-[#D1FAE5] text-emerald-800 font-semibold text-center text-sm py-2 px-4 rounded-t-xl shadow-xs border border-emerald-300 border-b-0 flex items-center justify-center">
                <span>Closed stage</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-b-xl p-4 shadow-sm min-h-[300px] space-y-4">
              
              {/* WON Section */}
              <div className="border border-emerald-300 rounded-xl p-3 space-y-2 bg-emerald-50/20">
                <span className="text-[11px] font-bold text-emerald-700 tracking-wider">WON</span>
                
                {editingWon ? (
                  <div className="flex items-center space-x-2 bg-emerald-100/50 p-2 rounded-lg border border-emerald-300">
                    <input
                      type="text"
                      value={wonStageName}
                      onChange={(e) => setWonStageName(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        const updated = localStages.map(s => s.name === 'Converted' ? { ...s, name: wonStageName } : s);
                        persistStagesToDb(updated);
                        setEditingWon(false);
                      }} 
                      className="p-1 rounded bg-emerald-600 text-white cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-100/70 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">{wonStageName}</span>
                    <button
                      onClick={() => setEditingWon(true)}
                      className="p-1 text-slate-500 hover:text-emerald-800 cursor-pointer transition-colors"
                      title="Edit won stage name"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* LOST Section */}
              <div className="border border-rose-300 rounded-xl p-3 space-y-2 bg-rose-50/20">
                <span className="text-[11px] font-bold text-rose-600 tracking-wider">LOST</span>
                
                {editingLost ? (
                  <div className="flex items-center space-x-2 bg-pink-100/50 p-2 rounded-lg border border-pink-300">
                    <input
                      type="text"
                      value={lostStageName}
                      onChange={(e) => setLostStageName(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        const updated = localStages.map(s => s.name === 'Lost' ? { ...s, name: lostStageName } : s);
                        persistStagesToDb(updated);
                        setEditingLost(false);
                      }} 
                      className="p-1 rounded bg-rose-600 text-white cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-pink-100/90 border border-pink-200 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">{lostStageName}</span>
                    <button
                      onClick={() => setEditingLost(true)}
                      className="p-1 text-slate-500 hover:text-rose-800 cursor-pointer transition-colors"
                      title="Edit lost stage name"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Reasons for Lost Leads Sub-Header with + Add */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Reason for Lost leads ({lostReasonsList.length} / 25)
                    </span>
                    <button
                      onClick={() => setShowAddReasonModal(true)}
                      className="text-xs font-bold text-[#5034a8] hover:text-[#432993] flex items-center space-x-0.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* List of Lost Reasons */}
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    {lostReasonsList.map((reason, idx) => (
                      <div key={idx}>
                        {editingReasonIndex === idx ? (
                          <div className="bg-white p-2 rounded-lg border-2 border-[#5034a8] shadow-md space-y-1.5">
                            <input
                              type="text"
                              value={editReasonText}
                              onChange={(e) => setEditReasonText(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                            />
                            <div className="flex justify-end space-x-1.5">
                              <button onClick={() => setEditingReasonIndex(null)} className="px-2 py-0.5 text-xs text-slate-500 cursor-pointer">Cancel</button>
                              <button onClick={() => handleSaveReasonEdit(idx)} className="px-2.5 py-0.5 text-xs bg-[#5034a8] text-white font-medium rounded cursor-pointer">Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-100/90 border border-slate-200/80 rounded-lg p-2 flex items-center justify-between group hover:bg-slate-200/60 transition-all">
                            <div className="flex items-center space-x-2">
                              <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 cursor-grab" />
                              <span className="text-xs font-medium text-slate-800">{reason}</span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  setEditingReasonIndex(idx);
                                  setEditReasonText(reason);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                title="Edit Reason"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteReason(idx)}
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
      )}

      {/* Modal: Add New Active Stage */}
      {showAddStageModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add New Active Pipeline Stage</h3>
              <button onClick={() => setShowAddStageModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stage Name</label>
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="e.g. Visit Scheduled, Proposal Sent, Negotiation"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#5034a8]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowAddStageModal(false)} className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={handleAddStage} disabled={!newStageName.trim()} className="px-3.5 py-1.5 rounded-xl bg-[#5034a8] hover:bg-[#432993] text-white font-semibold disabled:opacity-50 cursor-pointer shadow-xs">Add Stage</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Reason for Lost Leads */}
      {showAddReasonModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add Reason for Lost Leads</h3>
              <button onClick={() => setShowAddReasonModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reason Description</label>
              <input
                type="text"
                value={newReasonText}
                onChange={(e) => setNewReasonText(e.target.value)}
                placeholder="e.g. Price too high, Went to competitor, Not interested"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddReasonModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLostReason}
                disabled={!newReasonText.trim()}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Add Reason
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable MODAL: Schedule Lead as Follow-Up */}
      <ScheduleFollowUpModal
        isOpen={Boolean(followUpLead)}
        onClose={() => setFollowUpLead(null)}
        lead={followUpLead}
        targetStage={followUpTargetStage}
        onConfirm={({ lead: confirmedLead, targetStage, combinedDate, remarks }) => {
          const updates: Partial<Lead> = {
            status: targetStage as any,
            pipelineStageId: targetStage,
            followUpAt: combinedDate,
            notes: remarks
              ? `${confirmedLead.notes ? confirmedLead.notes + '\n' : ''}[Follow-up Remark]: ${remarks}`
              : confirmedLead.notes,
            updatedAt: new Date().toISOString()
          };

          // 1. Trigger parent / global CRM state update
          if (onUpdateLeadStage) {
            onUpdateLeadStage(confirmedLead.id, targetStage);
          }
          if (onUpdateLead) {
            onUpdateLead({ ...confirmedLead, ...updates } as Lead);
          }

          // 2. Direct database persistence
          const token = typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('pixbe_auth_token') || '') : '';
          fetch('/api/leads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'x-tenant-id': activeTenantId || activeAgent?.tenantId || 'company_kite_aviation'
            },
            body: JSON.stringify({
              id: confirmedLead.id,
              ...updates
            })
          })
            .then((res) => {
              if (!res.ok) {
                res.json().then(data => {
                  if (data?.error) toast.error(data.error, 'Database Validation');
                }).catch(() => {});
              }
            })
            .catch((err) => console.warn('Direct database lead update error:', err));

          const formattedDisplay = new Date(combinedDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
          toast.success(`Moved "${confirmedLead.name}" to ${targetStage} & scheduled follow-up (${formattedDisplay})`);
          setFollowUpLead(null);
        }}
      />
    </div>
  );
};

export const PipelineView = PipelinePage;
export default PipelinePage;
