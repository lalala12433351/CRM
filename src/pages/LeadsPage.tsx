import React, { useState, useMemo, useRef, useEffect, useContext } from 'react';
import { 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Merge, 
  Sliders, 
  PhoneCall, 
  MessageSquare, 
  Edit3, 
  RotateCw, 
  Trash2, 
  AlertCircle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Columns3, 
  CheckSquare, 
  Square, 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Users,
  Calendar, 
  ArrowUpDown, 
  TrendingUp, 
  BarChart2, 
  List, 
  FileSpreadsheet, 
  Check, 
  Star, 
  Layers, 
  ArrowUpRight, 
  Filter,
  Sparkles,
  AtSign,
  Mail,
  FileText,
  Phone,
  CalendarPlus,
  Clock,
  UserCheck,
  LayoutGrid,
  Timer
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// FRESH LEAD RESPONSE TIMER BADGE
// Shows a live countdown pill on new leads within the configured window.
// Self-contained: ticks every 60 s, vanishes at 0 without any external state.
// ─────────────────────────────────────────────────────────────────────────────
const TIMER_SENTINEL_ID = '__fresh_lead_timer__';

function parseleadCreatedMs(createdAt: string): number {
  if (!createdAt || createdAt === 'Just Now' || createdAt === 'Just now') return Date.now();
  const parsed = new Date(createdAt).getTime();
  if (!isNaN(parsed)) return parsed;
  // Handle relative strings like "2h ago", "30m ago"
  const match = createdAt.match(/(\d+)\s*(m|min|h|hour|d|day)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const now = Date.now();
    if (unit.startsWith('m')) return now - val * 60_000;
    if (unit.startsWith('h')) return now - val * 3_600_000;
    if (unit.startsWith('d')) return now - val * 86_400_000;
  }
  return Date.now();
}

const FreshLeadTimerBadge: React.FC<{ lead: { createdAt: string }; timerMinutes: number }> = ({ lead, timerMinutes }) => {
  const getMinutesLeft = () => {
    const elapsedMs = Date.now() - parseleadCreatedMs(lead.createdAt);
    return Math.ceil(timerMinutes - elapsedMs / 60_000);
  };

  const [minutesLeft, setMinutesLeft] = React.useState(getMinutesLeft);

  React.useEffect(() => {
    if (minutesLeft <= 0) return;
    const id = setInterval(() => {
      const left = getMinutesLeft();
      setMinutesLeft(left);
      if (left <= 0) clearInterval(id);
    }, 30_000); // refresh every 30 s for accuracy
    return () => clearInterval(id);
  }, [timerMinutes, lead.createdAt]);

  if (minutesLeft <= 0) return null;

  const isUrgent = minutesLeft <= 5;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ml-1.5 ${
        isUrgent
          ? 'bg-red-500 text-white animate-pulse shadow-red-300/50'
          : 'bg-orange-500 text-white shadow-orange-300/40'
      }`}
      title={`Call within ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''} — fresh lead!`}
    >
      <Timer className="w-2.5 h-2.5" />
      {minutesLeft}m
    </span>
  );
};
import { 
  Lead, 
  Agent, 
  CustomFieldDef, 
  LeadSource, 
  LeadStatus, 
  FilterCondition, 
  SortConfig, 
  SavedViewDef, 
  AIRating,
  isAgentAdmin,
  formatDealValue 
} from '../types';
import { BulkEditModal } from '../components/BulkEditModal';
import { ColumnCustomizerModal } from '../components/ColumnCustomizerModal';
import { StatusBadge } from '../components/StatusBadge';
import { getStatusStyle } from '../utils/statusStyles';
import { LeadSummaryModal } from '../components/LeadSummaryModal';
import { StagesContext } from '../App';

interface LeadsViewProps {
  leads: Lead[];
  agents: Agent[];
  customFields: CustomFieldDef[];
  activeAgent?: Agent;
  currency?: string;
  onOpenLeadDetail: (lead: Lead) => void;
  onOpenPowerDialerForLead?: (lead: Lead) => void;
  onAddNewLead: () => void;
  onImportCsv: (importedLeads: Partial<Lead>[]) => void;
  onMergeLeads: (primaryLeadId: string, duplicateLeadId: string) => void;
  onAddCustomField: (field: CustomFieldDef) => void;
  onPushTestLead: () => void;
  onDeleteLead?: (leadId: string) => void;
  onClearAllLeads?: () => void;
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void;
  onOpenGoogleSheets?: () => void;
  globalSavedFilters?: { id: string; name: string; iconType: string }[];
  activeFilterId?: string;
  setActiveFilterId?: (id: string) => void;
  lostReasons?: string[];
  onUpdateLostReasons?: (reasons: string[]) => void;
}

type AnalyticsDimension = 
  | 'created_on' 
  | 'status' 
  | 'lost_reasons' 
  | 'assignee' 
  | 'rating' 
  | 'call_status' 
  | 'calls_placed' 
  | 'custom';

export const LeadsPage: React.FC<LeadsViewProps> = ({
  leads,
  agents,
  customFields,
  activeAgent,
  currency = 'INR',
  onOpenLeadDetail,
  onOpenPowerDialerForLead,
  onAddNewLead,
  onImportCsv,
  onMergeLeads,
  onAddCustomField,
  onPushTestLead,
  onDeleteLead,
  onClearAllLeads,
  onUpdateLead,
  onOpenGoogleSheets,
  globalSavedFilters = [],
  activeFilterId = 'all_leads',
  setActiveFilterId,
  lostReasons = [
    'No Need',
    'Unable to Connect',
    'Budget Issues',
    'Product does not fit need',
    'Lost to competitor',
    'Unknown Reason',
    'Not eligible',
    'Junk'
  ],
  onUpdateLostReasons,
}) => {
  const stages = useContext(StagesContext);

  // Main View Toggle: 'chart' (Analytics/Graph) vs 'table' (Data Grid)
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [activeDimension, setActiveDimension] = useState<AnalyticsDimension>('created_on');
  const [chartType, setChartType] = useState<'bar' | 'column' | 'donut'>('column');
  const [isChartTypeOpen, setIsChartTypeOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<string>('none');
  const [isGroupByOpen, setIsGroupByOpen] = useState(false);
  const [isExportChartOpen, setIsExportChartOpen] = useState(false);

  // Views & Filters Popover State
  const [isFiltersDropdownOpen, setIsFiltersDropdownOpen] = useState(false);
  const isAdmin = isAgentAdmin(activeAgent);
  const currentViewTitle = !isAdmin ? 'My Leads' : (globalSavedFilters.find(f => f.id === activeFilterId)?.name || 'All Leads');

  // Search & Filter fields (auto | phone | name | email | text | all)
  const [searchField, setSearchField] = useState<'auto' | 'phone' | 'name' | 'email' | 'text' | 'all'>('auto');
  const [isSearchFieldOpen, setIsSearchFieldOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Dropdown filter pills
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLostReason, setSelectedLostReason] = useState<string>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [statusSearchQuery, setStatusSearchQuery] = useState('');

  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [createdOnDaysRange, setCreatedOnDaysRange] = useState<number>(5); // Default past 5 days
  const [createdOnRangeType, setCreatedOnRangeType] = useState<'days' | 'custom'>('days');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isDateRangePickerOpen, setIsDateRangePickerOpen] = useState(false);
  const dateRangePickerRef = useRef<HTMLDivElement>(null);

  // Dynamically compute all unique lead statuses present in database + pipeline stages
  const availableStatuses = useMemo(() => {
    const stageNames = stages ? stages.map((s) => s.name) : [];
    const leadStatuses = leads ? leads.map((l) => l.status).filter(Boolean) : [];
    const combined = Array.from(new Set([...stageNames, ...leadStatuses]));
    return combined;
  }, [stages, leads]);

  // Sorting
  const [sortField, setSortField] = useState<'createdOn' | 'rating' | 'name'>('createdOn');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Interactive Ratings state (leadId -> rating 0-5)
  const [leadRatings, setLeadRatings] = useState<Record<string, number>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Multi-Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  // Column Visibility Config
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const columnCustomizerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnCustomizerRef.current && !columnCustomizerRef.current.contains(event.target as Node)) {
        setShowColumnModal(false);
      }
    };
    if (showColumnModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnModal]);

  // User custom column ordering (persisted in localStorage)
  const [fieldOrderKeys, setFieldOrderKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('crm_column_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Only the actual fields configured in Settings by the user (customFields), ordered by drag preferences
  const allAvailableFields = useMemo(() => {
    const raw = (customFields || []).filter((f) => !f.isHidden && f.id !== TIMER_SENTINEL_ID);
    if (!fieldOrderKeys || fieldOrderKeys.length === 0) return raw;

    const ordered: CustomFieldDef[] = [];
    const remaining = [...raw];

    fieldOrderKeys.forEach((key) => {
      const idx = remaining.findIndex((f) => (f.name || f.id) === key);
      if (idx !== -1) {
        ordered.push(remaining[idx]);
        remaining.splice(idx, 1);
      }
    });

    return [...ordered, ...remaining];
  }, [customFields, fieldOrderKeys]);

  // Selected column keys state (persisted in localStorage)
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('crm_selected_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return (customFields || [])
      .filter((f) => !f.isHidden && f.id !== TIMER_SENTINEL_ID)
      .slice(0, 6)
      .map((f) => f.name || f.id);
  });

  useEffect(() => {
    try {
      localStorage.setItem('crm_selected_columns', JSON.stringify(selectedColumnKeys));
    } catch (e) {}
  }, [selectedColumnKeys]);

  const handleToggleColumnField = (fieldKey: string) => {
    setSelectedColumnKeys((prev) => {
      if (prev.includes(fieldKey)) {
        if (fieldKey === 'name') return prev; // Name is locked
        return prev.filter((k) => k !== fieldKey);
      } else {
        if (prev.length >= 12) return prev;
        return [...prev, fieldKey];
      }
    });
  };

  const handleReorderFields = (reorderedList: CustomFieldDef[]) => {
    const newOrderKeys = reorderedList.map((f) => f.name || f.id);
    setFieldOrderKeys(newOrderKeys);
    try {
      localStorage.setItem('crm_column_order', JSON.stringify(newOrderKeys));
    } catch (e) {}

    // Synchronize selectedColumnKeys to match the new visual order
    setSelectedColumnKeys((prev) => {
      const selectedSet = new Set(prev);
      return newOrderKeys.filter((k) => selectedSet.has(k));
    });
  };

  // Compute active visible columns in table based on ordered selections
  const visibleFields = useMemo(() => {
    return selectedColumnKeys
      .map((key) => allAvailableFields.find((f) => f.name === key || f.id === key))
      .filter(Boolean) as CustomFieldDef[];
  }, [selectedColumnKeys, allAvailableFields]);

  // Other Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [showNewViewModal, setShowNewViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const getLeadFieldValue = (lead: Lead, field: CustomFieldDef): string => {
    if (!lead || !field) return '—';
    const key = field.name || field.id || '';
    const idKey = field.id || '';
    const labelKey = field.label ? field.label.toLowerCase().replace(/\s+/g, '_') : '';
    const labelLower = (field.label || '').toLowerCase();

    if (key === 'name' || idKey === 'f-name' || labelLower === 'name') return lead.name || '—';
    if (key === 'phone' || idKey === 'f-phone' || field.type === 'phone' || labelLower.includes('phone') || labelLower.includes('number')) return lead.phone || '—';
    if (key === 'email' || idKey === 'f-email' || field.type === 'email' || labelLower.includes('email')) return lead.email || '—';
    if (key === 'company' || idKey === 'f-company' || labelLower.includes('company')) return lead.company || '—';
    if (key === 'city' || idKey === 'f-city' || labelLower.includes('city')) return lead.city || '—';
    if (key === 'state' || idKey === 'f-state' || labelLower.includes('state')) return lead.state || '—';
    if (key === 'pincode' || idKey === 'f-pincode' || labelLower.includes('pincode') || labelLower.includes('zip')) return lead.pincode || '—';
    if (key === 'address' || idKey === 'f-addr' || labelLower.includes('address')) return lead.address || '—';
    if (key === 'source' || idKey === 'f-source' || labelLower.includes('source')) return lead.source || '—';
    if (key === 'status' || idKey === 'f-status' || labelLower.includes('status')) return lead.status || '—';
    if (key === 'rating' || idKey === 'f-rating' || labelLower.includes('rating')) return String(leadRatings[lead.id] ?? lead.rating ?? 0);
    if (key === 'assignee' || key === 'owner' || idKey === 'f-assignee' || labelLower.includes('assignee') || labelLower.includes('owner')) {
      return lead.ownerAgentName || activeAgent?.name || 'System Administrator';
    }
    if (key === 'createdOn' || key === 'createdAt' || key === 'created_on' || idKey === 'f-created-on' || labelLower.includes('created')) {
      return formatCreatedDate(lead.createdAt);
    }
    if (key === 'deal_value' || key === 'dealValue' || idKey === 'f-deal-val' || labelLower.includes('deal value')) {
      const dv = lead.dealValue ?? (lead as any).deal_value ?? lead.customFields?.deal_value ?? lead.customFields?.dealValue;
      return (dv !== undefined && dv !== null && dv !== 0) ? formatDealValue(Number(dv) || 0, currency) : '—';
    }
    if (key === 'lead_score' || key === 'aiScore' || labelLower.includes('score')) {
      return String(lead.aiScore || 85);
    }

    const candidateKeys = [key, idKey, labelKey, field.label, field.name, field.id, labelLower].filter(Boolean) as string[];
    if (lead.customFields) {
      for (const k of candidateKeys) {
        if (lead.customFields[k] !== undefined && lead.customFields[k] !== null && String(lead.customFields[k]).trim() !== '') {
          return String(lead.customFields[k]);
        }
      }
    }
    for (const k of candidateKeys) {
      if ((lead as any)[k] !== undefined && (lead as any)[k] !== null && String((lead as any)[k]).trim() !== '') {
        return String((lead as any)[k]);
      }
    }
    return '—';
  };

  // Mobile View Style: Cards (default on phone) vs Horizontal Table
  const [mobileViewStyle, setMobileViewStyle] = useState<'cards' | 'table'>('cards');

  // Follow-Up Scheduling Modal State
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [followUpAssigneeId, setFollowUpAssigneeId] = useState('');
  const [summaryLead, setSummaryLead] = useState<Lead | null>(null);
  const [followUpDate, setFollowUpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [followUpHour, setFollowUpHour] = useState('09');
  const [followUpMinute, setFollowUpMinute] = useState('00');
  const [followUpAmPm, setFollowUpAmPm] = useState<'AM' | 'PM'>('AM');
  const [followUpRemarks, setFollowUpRemarks] = useState('');

  // Change Lead Access & Reassign State
  const [reassignModalLead, setReassignModalLead] = useState<Lead | null>(null);
  const [selectedNewAssigneeId, setSelectedNewAssigneeId] = useState<string>('');
  const [isConfirmingReassign, setIsConfirmingReassign] = useState<boolean>(false);

  const handleOpenReassignModal = (lead: Lead) => {
    setReassignModalLead(lead);
    setSelectedNewAssigneeId(lead.ownerAgentId || (agents[0]?.id || ''));
    setIsConfirmingReassign(false);
  };

  const handleConfirmReassign = () => {
    if (!reassignModalLead || !selectedNewAssigneeId) return;
    const newAgent = agents.find((a) => a.id === selectedNewAssigneeId);
    if (newAgent && onUpdateLead) {
      onUpdateLead(reassignModalLead.id, {
        ownerAgentId: newAgent.id,
        ownerAgentName: newAgent.name,
        updatedAt: new Date().toISOString()
      });
    }
    setReassignModalLead(null);
    setIsConfirmingReassign(false);
  };

  const formatCreatedDate = (createdAt?: string): string => {
    if (!createdAt || createdAt === 'Just Now' || createdAt.includes('ago')) {
      return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const parsedDate = new Date(createdAt);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

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
    if (!followUpLead || !onUpdateLead) return;
    let h = parseInt(followUpHour, 10);
    if (followUpAmPm === 'PM' && h !== 12) h += 12;
    if (followUpAmPm === 'AM' && h === 12) h = 0;
    const combinedDate = `${followUpDate}T${String(h).padStart(2, '0')}:${followUpMinute}:00`;

    const selectedAgent = agents.find((a) => a.id === followUpAssigneeId);
    const finalAssigneeId = followUpAssigneeId || followUpLead.ownerAgentId || followUpLead.assignedTo;
    const finalAssigneeName = selectedAgent ? selectedAgent.name : (followUpLead.ownerAgentName || 'Unassigned');

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
    setFollowUpLead(null);
    setFollowUpAssigneeId('');
  };

  // Custom Field Form State
  const [csvText, setCsvText] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs for outside click dismissal
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const chartTypeRef = useRef<HTMLDivElement>(null);
  const groupByRef = useRef<HTMLDivElement>(null);
  const exportChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFiltersDropdownOpen(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setIsSearchFieldOpen(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      if (chartTypeRef.current && !chartTypeRef.current.contains(event.target as Node)) {
        setIsChartTypeOpen(false);
      }
      if (groupByRef.current && !groupByRef.current.contains(event.target as Node)) {
        setIsGroupByOpen(false);
      }
      if (exportChartRef.current && !exportChartRef.current.contains(event.target as Node)) {
        setIsExportChartOpen(false);
      }
      if (dateRangePickerRef.current && !dateRangePickerRef.current.contains(event.target as Node)) {
        setIsDateRangePickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to extract avatar initials and background
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

  // Helper for source badge styling
  const getSourceBadgeStyle = (source?: string) => {
    if (!source) return 'bg-slate-100 text-slate-700';
    if (source.toLowerCase().includes('facebook') || source.toLowerCase().includes('meta')) {
      return 'bg-[#e6f2ff] text-[#0066cc] border-transparent';
    }
    if (source.toLowerCase().includes('website')) {
      return 'bg-[#e6f9f0] text-[#00875a] border-transparent';
    }
    if (source.toLowerCase().includes('google')) {
      return 'bg-[#fff8e6] text-[#b36b00] border-transparent';
    }
    return 'bg-slate-100 text-slate-700 border-transparent';
  };

  // Filtered & Sorted Leads
  const filteredAndSortedLeads = useMemo(() => {
    let result = leads.filter((lead) => {
      // 1. Text Search Filter based on selected searchField (auto | phone | name | email | text | all)
      const rawTerm = searchTerm.toLowerCase().trim();
      if (rawTerm) {
        const digitsTerm = rawTerm.replace(/\D/g, '');
        const cleanPhone = (lead.phone || '').replace(/\D/g, '');
        const cleanAltPhone = (lead.altPhone || '').replace(/\D/g, '');

        const matchPhone = 
          (lead.phone && lead.phone.toLowerCase().includes(rawTerm)) ||
          (lead.altPhone && lead.altPhone.toLowerCase().includes(rawTerm)) ||
          (digitsTerm.length >= 2 && (cleanPhone.includes(digitsTerm) || cleanAltPhone.includes(digitsTerm)));

        const matchName = lead.name && lead.name.toLowerCase().includes(rawTerm);
        const matchEmail = lead.email && lead.email.toLowerCase().includes(rawTerm);

        if (searchField === 'phone') {
          if (!matchPhone) return false;
        } else if (searchField === 'name') {
          if (!matchName) return false;
        } else if (searchField === 'email') {
          if (!matchEmail) return false;
        } else if (searchField === 'text') {
          const matchNotes = lead.notes?.toLowerCase().includes(rawTerm);
          const matchCompany = lead.company?.toLowerCase().includes(rawTerm);
          const matchCity = lead.city?.toLowerCase().includes(rawTerm);
          const matchAddress = lead.address?.toLowerCase().includes(rawTerm);
          const matchSource = lead.source?.toLowerCase().includes(rawTerm);
          const matchCustom = lead.customFields && Object.values(lead.customFields).some(val => String(val).toLowerCase().includes(rawTerm));
          if (!matchNotes && !matchCompany && !matchCity && !matchAddress && !matchSource && !matchCustom) return false;
        } else {
          // Auto (Smart) & All Fields Mode: Comprehensive matching across Name, Number/Phone, Email, Company, Notes, Custom Fields
          const matchCompany = lead.company && lead.company.toLowerCase().includes(rawTerm);
          const matchNotes = lead.notes && lead.notes.toLowerCase().includes(rawTerm);
          const matchSource = lead.source && lead.source.toLowerCase().includes(rawTerm);
          const matchOwner = lead.ownerAgentName && lead.ownerAgentName.toLowerCase().includes(rawTerm);
          const matchCustom = lead.customFields && Object.values(lead.customFields).some(val => String(val).toLowerCase().includes(rawTerm));

          const matchesAny = matchName || matchPhone || matchEmail || matchCompany || matchNotes || matchSource || matchOwner || matchCustom;
          if (!matchesAny) return false;
        }
      }

      // 2. Role-based Scoping: Non-Admin Employees can ONLY view My Leads
      if (!isAdmin && activeAgent) {
        const isMine = lead.ownerAgentId === activeAgent.id || 
                       (lead.ownerAgentName && activeAgent.name && lead.ownerAgentName.toLowerCase() === activeAgent.name.toLowerCase());
        if (!isMine) return false;
      }

      // 3. Active View Filter (All Leads = all stages, All Active Leads = all stages except closed, Followup Leads = follow ups)
      if (activeFilterId === 'all_leads') {
        // Show leads at ALL stages (no stage filtering)
      } else if (activeFilterId === 'active_leads') {
        // Show all leads other than closed stages
        const matchedStage = stages.find(s => 
          s.id === lead.pipelineStageId || 
          s.name.toLowerCase() === (lead.status || '').toLowerCase()
        );
        if (matchedStage && matchedStage.category === 'closed') {
          return false;
        }
        const cleanStatus = (lead.status || '').toLowerCase().trim();
        if (cleanStatus === 'lost' || cleanStatus === 'converted' || cleanStatus === 'closed' || cleanStatus.startsWith('lost') || cleanStatus.startsWith('converted')) {
          return false;
        }
      } else if (activeFilterId === 'followup_leads') {
        const isFollowUp = (lead.status || '').toLowerCase().includes('follow') || !!lead.followUpAt;
        if (!isFollowUp) return false;
      }

      // 3. Assignee Filter
      if (selectedAssignee !== 'all') {
        if (selectedAssignee === 'unassigned') {
          const hasOwner = lead.ownerAgentId || (lead.ownerAgentName && lead.ownerAgentName !== 'Unassigned');
          if (hasOwner) return false;
        } else {
          const selectedAgent = agents.find(a => a.id === selectedAssignee);
          const isMatch = 
            lead.ownerAgentId === selectedAssignee || 
            (selectedAgent && lead.ownerAgentName && lead.ownerAgentName.toLowerCase() === selectedAgent.name.toLowerCase());
          if (!isMatch) return false;
        }
      }

      // 4. Status Filter & Lost Reason Filter
      if (selectedStatus !== 'all') {
        const leadStatusLow = (lead.status || '').toLowerCase().trim();
        const filterStatusLow = selectedStatus.toLowerCase().trim();
        if (leadStatusLow !== filterStatusLow) return false;
        if (selectedStatus.toLowerCase() === 'lost' && selectedLostReason !== 'all') {
          if (lead.lostReason !== selectedLostReason) return false;
        }
      }

      // 5. Date Filter (Creation Date Pill)
      if (selectedDateFilter !== 'all') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        let leadDateMs = 0;
        if (!lead.createdAt || lead.createdAt === 'Just Now') {
          leadDateMs = Date.now();
        } else if (lead.createdAt.includes('ago')) {
          const match = lead.createdAt.match(/(\d+)\s*(d|day|days|h|hour|hours|m|min|minute|minutes)/i);
          if (match) {
            const val = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();
            const d = new Date();
            if (unit.startsWith('d')) d.setDate(d.getDate() - val);
            else if (unit.startsWith('h')) d.setHours(d.getHours() - val);
            leadDateMs = d.getTime();
          } else {
            leadDateMs = Date.now();
          }
        } else {
          const parsed = new Date(lead.createdAt).getTime();
          leadDateMs = isNaN(parsed) ? Date.now() : parsed;
        }

        if (selectedDateFilter === 'Today') {
          if (leadDateMs < startOfToday) return false;
        } else if (selectedDateFilter === 'Yesterday') {
          const startOfYesterday = startOfToday - 86400000;
          if (leadDateMs < startOfYesterday || leadDateMs >= startOfToday) return false;
        } else if (selectedDateFilter === 'Last 7 Days') {
          const sevenDaysAgo = startOfToday - 6 * 86400000;
          if (leadDateMs < sevenDaysAgo) return false;
        } else if (selectedDateFilter === 'This Month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          if (leadDateMs < startOfMonth) return false;
        }
      }

      return true;
    });

    // Sort Logic
    result.sort((a, b) => {
      if (sortField === 'createdOn') {
        return sortOrder === 'desc' ? -1 : 1;
      }
      if (sortField === 'rating') {
        const ratingA = leadRatings[a.id] || (a.aiRating === 'Hot' ? 5 : a.aiRating === 'Warm' ? 3 : 1);
        const ratingB = leadRatings[b.id] || (b.aiRating === 'Hot' ? 5 : b.aiRating === 'Warm' ? 3 : 1);
        return sortOrder === 'desc' ? ratingB - ratingA : ratingA - ratingB;
      }
      if (sortField === 'name') {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return 0;
    });

    return result;
  }, [leads, activeFilterId, selectedAssignee, selectedStatus, selectedDateFilter, searchTerm, searchField, sortField, sortOrder, leadRatings]);

  // Paginated leads
  const actualFilteredCount = filteredAndSortedLeads.length;
  const totalLeadsCount = actualFilteredCount;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, actualFilteredCount);
  const currentPaginatedLeads = filteredAndSortedLeads.slice(startIndex, endIndex);

  // Selection handlers
  const handleSelectAllCurrentPage = () => {
    const pageIds = currentPaginatedLeads.map(l => l.id);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedLeadIds.includes(id));
    if (allSelected) {
      setSelectedLeadIds(selectedLeadIds.filter(id => !pageIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedLeadIds, ...pageIds]));
      setSelectedLeadIds(merged);
    }
  };

  const handleToggleLeadSelect = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter(item => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleToggleStar = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLeadRatings(prev => ({
      ...prev,
      [leadId]: prev[leadId] ? 0 : 1
    }));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  // Bulk edit execution
  const handleApplyBulkUpdates = (updates: {
    status?: LeadStatus;
    ownerAgentId?: string;
    ownerAgentName?: string;
    addTag?: string;
    source?: LeadSource;
  }) => {
    if (!onUpdateLead) return;
    selectedLeadIds.forEach(id => {
      const lead = leads.find(l => l.id === id);
      if (lead) {
        const leadUpdates: Partial<Lead> = {
          updatedAt: new Date().toISOString()
        };
        if (updates.status) leadUpdates.status = updates.status;
        if (updates.ownerAgentId) {
          leadUpdates.ownerAgentId = updates.ownerAgentId;
          leadUpdates.ownerAgentName = updates.ownerAgentName;
        }
        if (updates.source) leadUpdates.source = updates.source;
        if (updates.addTag) {
          const currentTags = lead.tags || [];
          if (!currentTags.includes(updates.addTag)) {
            leadUpdates.tags = [...currentTags, updates.addTag];
          }
        }
        onUpdateLead(id, leadUpdates);
      }
    });
    setSelectedLeadIds([]);
  };

  const handleBulkDelete = () => {
    if (!onDeleteLead) return;
    selectedLeadIds.forEach(id => {
      onDeleteLead(id);
    });
    setSelectedLeadIds([]);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Name', 'Phone', 'Email', 'Company', 'City', 'Source', 'Status', 'Deal Value', 'Owner'];
    const rows = filteredAndSortedLeads.map(l => [
      `"${l.name}"`,
      `"${l.phone}"`,
      `"${l.email || ''}"`,
      `"${l.company || ''}"`,
      `"${l.city || ''}"`,
      `"${l.source || ''}"`,
      `"${l.status || ''}"`,
      l.dealValue || 0,
      `"${l.ownerAgentName || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAllCurrentPageSelected = currentPaginatedLeads.length > 0 && currentPaginatedLeads.every(l => selectedLeadIds.includes(l.id));

  // Export Chart Data
  const handleExportChartCsv = () => {
    const headers = ['Category', 'Count', 'Percentage'];
    const rows = activeChartData.map(d => [
      `"${d.label}"`,
      d.value,
      `"${d.percentage}%"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_${activeDimension}_chart_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to extract group value for any lead when grouping
  const getLeadGroupValue = (l: Lead, groupKey: string): string => {
    if (groupKey === 'Source') return l.source || 'Direct';
    if (groupKey === 'Assignee') return l.ownerAgentName || activeAgent?.name || 'Unassigned';
    if (groupKey === 'Status') return l.status || 'Fresh';
    if (groupKey === 'Rating') {
      const score = l.aiScore || (l.rating ? l.rating * 20 : 0);
      if (score >= 90) return '5 Stars';
      if (score >= 70) return '4 Stars';
      if (score >= 50) return '3 Stars';
      if (score >= 30) return '2 Stars';
      if (score > 0) return '1 Star';
      return 'Unrated';
    }
    if (groupKey === 'Creation Date') {
      if (!l.createdAt) return 'Recent';
      const d = new Date(l.createdAt);
      return isNaN(d.getTime()) ? 'Recent' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    }
    return 'Other';
  };

  const getGroupColor = (name: string, idx: number): string => {
    const PRESETS: Record<string, string> = {
      'Facebook Ads': '#1877f2',
      'Meta Ads': '#0081fb',
      'Google Ads': '#ea4335',
      'Website Inbound': '#10b981',
      'Direct': '#6366f1',
      'WhatsApp': '#25d366',
      'Instagram': '#e1306c',
      'Referral': '#f59e0b',
      'JustDial': '#ff7000',
      'IndiaMart': '#3f51b5',
      'Fresh': '#3b82f6',
      'Contacted': '#8b5cf6',
      'Follow Up': '#f59e0b',
      'Demo Scheduled': '#06b6d4',
      'Proposal Sent': '#10b981',
      'Converted': '#059669',
      'Lost': '#ef4444',
      '5 Stars': '#059669',
      '4 Stars': '#10b981',
      '3 Stars': '#f59e0b',
      '2 Stars': '#f97316',
      '1 Star': '#ef4444',
      'Unrated': '#94a3b8'
    };
    if (PRESETS[name]) return PRESETS[name];
    const pal = ['#4f46e5', '#0d9488', '#d97706', '#e11d48', '#7c3aed', '#2563eb', '#059669', '#db2777', '#ca8a04', '#475569', '#628c83', '#8d8b83'];
    return pal[idx % pal.length];
  };

  const computeBreakdown = (bucketLeads: Lead[], gKey: string) => {
    if (gKey === 'none' || bucketLeads.length === 0) return undefined;
    const map: Record<string, number> = {};
    bucketLeads.forEach(l => {
      const val = getLeadGroupValue(l, gKey);
      map[val] = (map[val] || 0) + 1;
    });
    const bTotal = bucketLeads.length || 1;
    return Object.entries(map).map(([gName, cnt], idx) => ({
      groupKey: gName,
      count: cnt,
      color: getGroupColor(gName, idx),
      percentage: ((cnt / bTotal) * 100).toFixed(1) + '%'
    })).sort((a, b) => b.count - a.count);
  };

  // Dynamic Graph Calculation from Actual Database with Full Group-By Support
  const activeChartData = useMemo(() => {
    const total = filteredAndSortedLeads.length || 1;
    const colors = [
      '#628c83', // Sage green (Fresh in screenshot)
      '#8d8b83', // Slate grey/brown
      '#4f46e5', // Indigo
      '#0d9488', // Teal
      '#d97706', // Amber
      '#e11d48', // Rose
      '#7c3aed', // Violet
      '#2563eb', // Blue
      '#059669', // Emerald
      '#db2777', // Pink
      '#ca8a04', // Yellow
      '#475569', // Slate
    ];

    if (activeDimension === 'status') {
      const leadMap: Record<string, Lead[]> = {};
      availableStatuses.forEach((stgName) => {
        leadMap[stgName] = [];
      });

      filteredAndSortedLeads.forEach((l) => {
        const status = l.status || 'Fresh';
        if (!leadMap[status]) leadMap[status] = [];
        leadMap[status].push(l);
      });

      return Object.entries(leadMap)
        .filter(([_, arr]) => arr.length > 0 || availableStatuses.length <= 4)
        .map(([label, arr], idx) => {
          const stageConfig = stages.find(s => s.name.toLowerCase() === label.toLowerCase());
          const count = arr.length;
          return {
            label,
            value: count,
            displayValue: count > 999 ? (count / 1000).toFixed(1) + 'k' : count.toString(),
            displayCount: count.toString(),
            percentage: ((count / total) * 100).toFixed(2) + '%',
            color: stageConfig?.color || colors[idx % colors.length],
            breakdown: computeBreakdown(arr, groupBy)
          };
        })
        .sort((a, b) => b.value - a.value);

    } else if (activeDimension === 'lost_reasons') {
      const leadMap: Record<string, Lead[]> = {};
      lostReasons.forEach((r) => {
        leadMap[r] = [];
      });

      const lostLeads = filteredAndSortedLeads.filter(l => (l.status || '').toLowerCase() === 'lost' || l.lostReason);
      const lostTotal = lostLeads.length || 1;

      lostLeads.forEach((l) => {
        const r = l.lostReason || 'Unknown Reason';
        if (!leadMap[r]) leadMap[r] = [];
        leadMap[r].push(l);
      });

      return Object.entries(leadMap)
        .map(([label, arr], idx) => {
          const count = arr.length;
          return {
            label,
            value: count,
            displayValue: count > 999 ? (count / 1000).toFixed(1) + 'k' : count.toString(),
            displayCount: count.toString(),
            percentage: ((count / lostTotal) * 100).toFixed(2) + '%',
            color: colors[idx % colors.length],
            breakdown: computeBreakdown(arr, groupBy)
          };
        })
        .sort((a, b) => b.value - a.value);

    } else if (activeDimension === 'assignee') {
      const leadMap: Record<string, Lead[]> = {};
      if (agents && agents.length > 0) {
        agents.forEach((ag) => {
          leadMap[ag.name] = [];
        });
      }
      leadMap['Unassigned'] = [];

      filteredAndSortedLeads.forEach((l) => {
        const name = l.ownerAgentName || activeAgent?.name || 'Unassigned';
        if (!leadMap[name]) leadMap[name] = [];
        leadMap[name].push(l);
      });

      return Object.entries(leadMap)
        .filter(([_, arr]) => arr.length > 0 || (agents.length <= 5))
        .map(([label, arr], idx) => {
          const count = arr.length;
          return {
            label,
            value: count,
            displayValue: count > 999 ? (count / 1000).toFixed(1) + 'k' : count.toString(),
            displayCount: count.toString(),
            percentage: ((count / total) * 100).toFixed(2) + '%',
            color: colors[idx % colors.length],
            breakdown: computeBreakdown(arr, groupBy)
          };
        })
        .sort((a, b) => b.value - a.value);

    } else if (activeDimension === 'rating') {
      const leadMap: Record<string, Lead[]> = {
        '5 Stars': [],
        '4 Stars': [],
        '3 Stars': [],
        '2 Stars': [],
        '1 Star': [],
        'Unrated': []
      };

      filteredAndSortedLeads.forEach((l) => {
        const score = l.aiScore || (l.rating ? l.rating * 20 : 0);
        if (score >= 90) leadMap['5 Stars'].push(l);
        else if (score >= 70) leadMap['4 Stars'].push(l);
        else if (score >= 50) leadMap['3 Stars'].push(l);
        else if (score >= 30) leadMap['2 Stars'].push(l);
        else if (score > 0) leadMap['1 Star'].push(l);
        else leadMap['Unrated'].push(l);
      });

      return Object.entries(leadMap).map(([label, arr], idx) => {
        const count = arr.length;
        return {
          label,
          value: count,
          displayValue: count > 999 ? (count / 1000).toFixed(1) + 'k' : count.toString(),
          displayCount: count.toString(),
          percentage: ((count / total) * 100).toFixed(2) + '%',
          color: colors[idx % colors.length],
          breakdown: computeBreakdown(arr, groupBy)
        };
      });

    } else if (activeDimension === 'call_status') {
      const leadMap: Record<string, Lead[]> = {
        'Connected': [],
        'Follow-up Required': [],
        'Busy / No Answer': [],
        'Wrong Number': [],
        'Call Later': [],
        'Not Dialed': []
      };

      filteredAndSortedLeads.forEach((l) => {
        const history = l.callHistory || [];
        if (history.length === 0) {
          leadMap['Not Dialed'].push(l);
        } else {
          const lastCall = history[history.length - 1];
          const outcome = (lastCall.outcome || lastCall.status || '').toLowerCase();
          if (outcome.includes('connect') || outcome.includes('interest')) leadMap['Connected'].push(l);
          else if (outcome.includes('follow')) leadMap['Follow-up Required'].push(l);
          else if (outcome.includes('busy') || outcome.includes('no answer')) leadMap['Busy / No Answer'].push(l);
          else if (outcome.includes('wrong')) leadMap['Wrong Number'].push(l);
          else if (outcome.includes('later')) leadMap['Call Later'].push(l);
          else leadMap['Connected'].push(l);
        }
      });

      return Object.entries(leadMap).map(([label, arr], idx) => {
        const count = arr.length;
        return {
          label,
          value: count,
          displayValue: count > 999 ? (count / 1000).toFixed(1) + 'k' : count.toString(),
          displayCount: count.toString(),
          percentage: ((count / total) * 100).toFixed(2) + '%',
          color: colors[idx % colors.length],
          breakdown: computeBreakdown(arr, groupBy)
        };
      });

    } else if (activeDimension === 'calls_placed') {
      const leadMap: Record<string, Lead[]> = {
        '0 Calls': [],
        '1 Call': [],
        '2-3 Calls': [],
        '4-5 Calls': [],
        '6+ Calls': []
      };

      filteredAndSortedLeads.forEach((l) => {
        const numCalls = (l.callHistory || []).length;
        if (numCalls === 0) leadMap['0 Calls'].push(l);
        else if (numCalls === 1) leadMap['1 Call'].push(l);
        else if (numCalls <= 3) leadMap['2-3 Calls'].push(l);
        else if (numCalls <= 5) leadMap['4-5 Calls'].push(l);
        else leadMap['6+ Calls'].push(l);
      });

      return Object.entries(leadMap).map(([label, arr], idx) => {
        const count = arr.length;
        return {
          label,
          value: count,
          displayValue: count > 999 ? (count / 1000).toFixed(1) + 'k' : count.toString(),
          displayCount: count.toString(),
          percentage: ((count / total) * 100).toFixed(2) + '%',
          color: colors[idx % colors.length],
          breakdown: computeBreakdown(arr, groupBy)
        };
      });

    } else if (activeDimension === 'custom') {
      const leadMap: Record<string, Lead[]> = {};

      filteredAndSortedLeads.forEach((l) => {
        const src = l.source || 'Direct';
        if (!leadMap[src]) leadMap[src] = [];
        leadMap[src].push(l);
      });

      return Object.entries(leadMap).map(([label, arr], idx) => {
        const count = arr.length;
        return {
          label,
          value: count,
          displayValue: count > 999 ? (count / 1000).toFixed(1) + 'k' : count.toString(),
          displayCount: count.toString(),
          percentage: ((count / total) * 100).toFixed(2) + '%',
          color: colors[idx % colors.length],
          breakdown: computeBreakdown(arr, groupBy)
        };
      }).sort((a, b) => b.value - a.value);

    } else if (activeDimension === 'created_on') {
      const pastDaysList: { label: string; isoDate: string; leads: Lead[] }[] = [];
      
      if (createdOnRangeType === 'custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate + 'T00:00:00');
        const end = new Date(customEndDate + 'T23:59:59');
        const current = new Date(start);
        
        let countDays = 0;
        while (current <= end && countDays < 60) {
          const isoDate = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
          const label = current.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short'
          });
          pastDaysList.push({ label, isoDate, leads: [] });
          current.setDate(current.getDate() + 1);
          countDays++;
        }
      } else {
        const numDays = Math.min(Math.max(createdOnDaysRange || 5, 1), 30);
        const now = new Date();
        
        for (let i = numDays - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const label = d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short'
          });
          pastDaysList.push({ label, isoDate, leads: [] });
        }
      }

      filteredAndSortedLeads.forEach((l) => {
        let d: Date;
        if (!l.createdAt || l.createdAt === 'Just Now') {
          d = new Date();
        } else if (l.createdAt.includes('ago')) {
          d = new Date();
          const match = l.createdAt.match(/(\d+)\s*(d|day|days|h|hour|hours|m|min|minute|minutes)/i);
          if (match) {
            const val = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();
            if (unit.startsWith('d')) {
              d.setDate(d.getDate() - val);
            } else if (unit.startsWith('h')) {
              d.setHours(d.getHours() - val);
            }
          }
        } else {
          const parsed = new Date(l.createdAt);
          d = isNaN(parsed.getTime()) ? new Date() : parsed;
        }
        const leadIsoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const match = pastDaysList.find((item) => item.isoDate === leadIsoDate);
        if (match) {
          match.leads.push(l);
        }
      });

      const daysTotal = pastDaysList.reduce((acc, p) => acc + p.leads.length, 0) || total;

      return pastDaysList.map((item, idx) => {
        const count = item.leads.length;
        return {
          label: item.label,
          value: count,
          displayValue: count > 999 ? (count / 1000).toFixed(1) + 'k' : count.toString(),
          displayCount: count.toString(),
          percentage: ((count / daysTotal) * 100).toFixed(2) + '%',
          color: colors[idx % colors.length],
          breakdown: computeBreakdown(item.leads, groupBy)
        };
      });
    }

    return [];
  }, [activeDimension, groupBy, filteredAndSortedLeads, agents, stages, createdOnDaysRange, createdOnRangeType, customStartDate, customEndDate, availableStatuses, lostReasons]);

  // Overall active groups across the dataset for Legend display
  const allActiveGroups = useMemo(() => {
    if (groupBy === 'none') return [];
    const map: Record<string, number> = {};
    filteredAndSortedLeads.forEach((l) => {
      const val = getLeadGroupValue(l, groupBy);
      map[val] = (map[val] || 0) + 1;
    });
    return Object.entries(map).map(([gName, cnt], idx) => ({
      key: gName,
      count: cnt,
      color: getGroupColor(gName, idx)
    })).sort((a, b) => b.count - a.count);
  }, [filteredAndSortedLeads, groupBy]);

  // Dimension Tabs Configuration (Exact order from user's screenshot: Created on | Status | Lost Reasons | Assignee | Rating | Call status | Number of calls placed | Custom)
  const dimensionTabs: { id: AnalyticsDimension; label: string }[] = [
    { id: 'created_on', label: 'Created on' },
    { id: 'status', label: 'Status' },
    { id: 'lost_reasons', label: 'Lost Reasons' },
    { id: 'assignee', label: 'Assignee' },
    { id: 'rating', label: 'Rating' },
    { id: 'call_status', label: 'Call status' },
    { id: 'calls_placed', label: 'Number of calls placed' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-16">
      
      {/* 1. TOP VIEW HEADER ROW */}
      <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between">
        {/* Left: View title dropdown button + Edit + Refresh + Add */}
        <div className="flex items-center space-x-2 relative">
          
          {/* Main View Selector Pill */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => {
                if (isAdmin) setIsFiltersDropdownOpen(!isFiltersDropdownOpen);
              }}
              className={`flex items-center space-x-1.5 text-lg sm:text-xl font-bold text-slate-900 transition-colors py-1 px-1 rounded-lg ${
                isAdmin ? 'hover:text-indigo-900 cursor-pointer' : 'cursor-default'
              }`}
            >
              <span>{currentViewTitle}</span>
              {isAdmin && (
                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isFiltersDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* FILTERS / SAVED VIEWS FLOATING POPOVER */}
            {isAdmin && isFiltersDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 p-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-1 text-xs">
                
                {/* Popover Header */}
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-700 text-xs">Admin Filters</span>
                </div>

                {/* Popover List Items */}
                <div className="max-h-80 overflow-y-auto space-y-0.5 pt-1">
                  {globalSavedFilters.map((item) => {
                    const isSelected = activeFilterId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (setActiveFilterId) setActiveFilterId(item.id);
                          setIsFiltersDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#ede9fe] text-[#5b21b6] font-bold'
                            : 'text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          {item.iconType === 'arrow' ? (
                            <span className={`w-4 h-4 shrink-0 rounded flex items-center justify-center text-xs font-bold ${isSelected ? 'text-[#5b21b6]' : 'text-indigo-600'}`}>
                              ↖
                            </span>
                          ) : (
                            <Filter className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#5b21b6]' : 'text-indigo-500'}`} />
                          )}
                          <span className="truncate">{item.name}</span>
                        </div>

                        <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#5b21b6]' : 'text-indigo-400'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: View Toggle (Analytics / Chart View & List View Switcher) */}
        <div className="flex items-center space-x-1.5">
          {/* Mobile Card / Table Toggle */}
          <div className="flex md:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-1">
            <button
              onClick={() => setMobileViewStyle('cards')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all ${
                mobileViewStyle === 'cards' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500'
              }`}
              title="Mobile Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileViewStyle('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all ${
                mobileViewStyle === 'table' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button 
            onClick={() => setViewMode('chart')}
            className={`p-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
              viewMode === 'chart' 
                ? 'bg-[#3a2088] text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Analytics Chart View"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
              viewMode === 'table' 
                ? 'bg-[#3a2088] text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Data Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. FILTER PILLS ROW (Assignee | Status | Creation Date) */}
      <div className="px-4 sm:px-6 mb-3 relative z-50">
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* In Table view, show the full unified search bar. In Chart view, show the clean filter pills as shown in screenshot */}
          {viewMode === 'table' && (
            <div className="flex-1 min-w-[280px] bg-white border border-slate-200 rounded-full px-3 py-1.5 flex items-center shadow-2xs focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
              
              {/* Search Field Dropdown Selector */}
              <div className="relative shrink-0 pr-2 border-r border-slate-200" ref={searchDropdownRef}>
                <button
                  onClick={() => setIsSearchFieldOpen(!isSearchFieldOpen)}
                  className="flex items-center space-x-1.5 text-xs text-slate-700 font-semibold hover:text-indigo-600 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="capitalize">{searchField === 'auto' ? 'Auto (Smart)' : searchField}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isSearchFieldOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] p-1 space-y-0.5 text-xs font-sans">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Search By Mode
                    </div>
                    {[
                      { id: 'auto', label: 'Auto (Smart Detect)', icon: Sparkles },
                      { id: 'phone', label: 'Phone Number', icon: Phone },
                      { id: 'name', label: 'Lead Name', icon: User },
                      { id: 'email', label: 'Email Address', icon: Mail },
                      { id: 'text', label: 'Text & Notes', icon: FileText },
                      { id: 'all', label: 'All Fields', icon: Layers },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSearchField(opt.id as any);
                            setIsSearchFieldOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            searchField === opt.id ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Icon className={`w-3.5 h-3.5 ${searchField === opt.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span>{opt.label}</span>
                          </div>
                          {searchField === opt.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Search Input Field */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, number or email"
                className="flex-1 bg-transparent px-3 py-0.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
              />

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Quick Filter Buttons: Assignee | Status | Creation Date */}
          <div className="flex items-center space-x-2">
            
            {/* Assignee Filter Dropdown */}
            <div className="relative" ref={assigneeDropdownRef}>
              <button
                onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                className={`border rounded-full px-3 py-1.5 text-xs font-medium flex items-center space-x-1.5 shadow-2xs cursor-pointer transition-colors ${
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
                    : (agents.find(a => a.id === selectedAssignee)?.name.split(' ')[0] || 'Assignee')}
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
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      selectedAssignee === 'all' ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>All Assignees</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.2 rounded bg-slate-100">{leads.length}</span>
                      {selectedAssignee === 'all' && <Check className="w-3 h-3 text-indigo-600" />}
                    </div>
                  </button>

                  <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
                    {agents.map((ag) => {
                      const count = leads.filter(l => l.ownerAgentId === ag.id || (l.ownerAgentName && l.ownerAgentName.toLowerCase() === ag.name.toLowerCase())).length;
                      const isSelected = selectedAssignee === ag.id;
                      return (
                        <button
                          key={ag.id}
                          onClick={() => {
                            setSelectedAssignee(ag.id);
                            setIsAssigneeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-700 shrink-0">
                              {getAgentAvatar(ag.name).initials}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-slate-900 leading-tight truncate text-xs">{ag.name}</p>
                              <p className="text-[9px] text-slate-400 leading-tight">{ag.role || 'Caller'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 shrink-0">
                            <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.2 rounded bg-slate-100">{count}</span>
                            {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
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
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors border-t border-slate-100 ${
                      selectedAssignee === 'unassigned' ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Unassigned</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.2 rounded bg-slate-100">
                        {leads.filter(l => !l.ownerAgentId || l.ownerAgentName === 'Unassigned').length}
                      </span>
                      {selectedAssignee === 'unassigned' && <Check className="w-3 h-3 text-indigo-600" />}
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Status Filter Dropdown (Compact & Flush Right) */}
            <div className="relative" ref={statusDropdownRef}>
              {(() => {
                const stageConfig = selectedStatus !== 'all' ? stages.find(s => s.name.toLowerCase() === selectedStatus.toLowerCase()) : null;
                const color = stageConfig?.color || (selectedStatus !== 'all' ? getStatusStyle(selectedStatus).hex : null);
                const inlineStyles = color ? { color: color, backgroundColor: `${color}1A`, borderColor: `${color}40` } : {};
                const dotStyles = color ? { backgroundColor: color, boxShadow: `0 0 8px ${color}66` } : {};

                return (
                  <button
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    style={selectedStatus !== 'all' ? inlineStyles : undefined}
                    className={`border rounded-full px-3 py-1.5 text-xs font-medium flex items-center space-x-1.5 shadow-2xs cursor-pointer transition-colors ${
                      selectedStatus === 'all'
                        ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        : 'font-bold'
                    }`}
                  >
                    {selectedStatus !== 'all' && (
                      <span style={dotStyles} className="w-2 h-2 rounded-full shrink-0" />
                    )}
                    <span className="truncate max-w-[120px]">
                      {selectedStatus === 'all' 
                        ? 'Status' 
                        : selectedStatus === 'Lost' && selectedLostReason !== 'all'
                        ? `Lost • ${selectedLostReason}`
                        : selectedStatus}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 shrink-0 ${isStatusDropdownOpen ? 'rotate-180' : 'opacity-60'}`} />
                  </button>
                );
              })()}

              {isStatusDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] p-1.5 space-y-1 text-xs font-sans max-h-80 overflow-y-auto animate-in fade-in zoom-in-95">
                  {/* Dropdown Header & Quick Reset */}
                  <div className="flex items-center justify-between px-1.5 pt-0.5 pb-1 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Stage & Status
                    </span>
                    {selectedStatus !== 'all' && (
                      <button
                        onClick={() => {
                          setSelectedStatus('all');
                          setSelectedLostReason('all');
                          setStatusSearchQuery('');
                          setIsStatusDropdownOpen(false);
                        }}
                        className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* "All Stages" Button */}
                  <button
                    onClick={() => {
                      setSelectedStatus('all');
                      setSelectedLostReason('all');
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      selectedStatus === 'all' ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>All Stages</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.2 rounded bg-slate-100">{leads.length}</span>
                      {selectedStatus === 'all' && <Check className="w-3 h-3 text-indigo-600" />}
                    </div>
                  </button>

                  {/* Stage List */}
                  <div className="space-y-0.5 border-t border-slate-100 pt-1">
                    {availableStatuses.map((st) => {
                      const stageConfig = stages.find(s => s.name.toLowerCase() === st.toLowerCase());
                      const isSelected = selectedStatus.toLowerCase() === st.toLowerCase() && (st.toLowerCase() !== 'lost' || selectedLostReason === 'all');
                      const count = leads.filter(l => (l.status || '').toLowerCase() === st.toLowerCase()).length;
                      const colorHex = stageConfig?.color || getStatusStyle(st).hex;

                      return (
                        <div key={st} className="space-y-0.5">
                          <button
                            onClick={() => {
                              setSelectedStatus(st);
                              setSelectedLostReason('all');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <span 
                                className="w-2 h-2 rounded-full shrink-0 shadow-2xs" 
                                style={{ backgroundColor: colorHex }} 
                              />
                              <span className="font-medium text-slate-900 truncate">{st}</span>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0">
                              <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.2 rounded bg-slate-100">{count}</span>
                              {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                            </div>
                          </button>

                          {/* Indented Lost Reasons when viewing Lost status */}
                          {st.toLowerCase() === 'lost' && (
                            <div className="pl-2.5 pr-1 py-1 space-y-0.5 border-l-2 border-rose-300 ml-2.5 my-0.5 bg-rose-50/40 rounded-r-lg">
                              <p className="text-[9px] font-bold uppercase tracking-wider text-rose-700 px-1">Reasons:</p>
                              {lostReasons.map((reason) => {
                                const isReasonSelected = selectedStatus.toLowerCase() === 'lost' && selectedLostReason === reason;
                                const reasonCount = leads.filter(l => (l.status || '').toLowerCase() === 'lost' && l.lostReason === reason).length;
                                return (
                                  <button
                                    key={reason}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedStatus('Lost');
                                      setSelectedLostReason(reason);
                                      setIsStatusDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between cursor-pointer transition-colors ${
                                      isReasonSelected
                                        ? 'bg-rose-100 text-rose-950 font-bold'
                                        : 'text-slate-600 hover:bg-rose-100/60'
                                    }`}
                                  >
                                    <span className="truncate">• {reason}</span>
                                    <div className="flex items-center space-x-1 shrink-0">
                                      <span className="text-[9px] font-medium text-rose-600">({reasonCount})</span>
                                      {isReasonSelected && <Check className="w-2.5 h-2.5 text-rose-700" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: ANALYTICS & CHART VIEW (Exact match to uploaded screenshot)  */}
      {/* ========================================================================= */}
      {viewMode === 'chart' && (
        <div className="px-3 sm:px-6 space-y-4 max-w-full overflow-hidden">
          
          {/* TAB BAR CARD: Dimension tabs on left, Range/Export/Download on right */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs px-3 sm:px-4 pt-3 pb-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 max-w-full relative z-20">
            
            {/* Left Dimension Tabs: Created on | Status | Lost Reasons | Assignee | Rating | Call status | Number of calls placed | Custom */}
            <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar text-xs md:text-sm">
              {dimensionTabs.map((tab) => {
                const isActive = activeDimension === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDimension(tab.id)}
                    className={`pb-3 px-3 whitespace-nowrap text-xs md:text-sm font-medium border-b-2 transition-all cursor-pointer ${
                      isActive
                        ? 'text-[#3a2088] font-bold border-[#3a2088]'
                        : 'text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Date Range (when on Created on) + Export chart as CSV & Download buttons */}
            <div className="flex items-center space-x-2 pb-3 md:pb-2.5 shrink-0 self-end md:self-auto">
              {activeDimension === 'created_on' && (
                <div className="relative" ref={dateRangePickerRef}>
                  <button
                    type="button"
                    onClick={() => setIsDateRangePickerOpen(!isDateRangePickerOpen)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <span className="text-slate-700 font-medium">Range:</span>
                    <span className="text-slate-700 font-medium">
                      {createdOnRangeType === 'custom' && customStartDate && customEndDate
                        ? `${new Date(customStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${new Date(customEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
                        : `Past ${createdOnDaysRange} Days`}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isDateRangePickerOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Custom Calendar & Presets Picker Popover */}
                  {isDateRangePickerOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-3 space-y-3 text-xs font-sans animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                          Select Date Range
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsDateRangePickerOpen(false)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { label: 'Past 5 Days', days: 5 },
                            { label: 'Past 7 Days', days: 7 },
                            { label: 'Past 10 Days', days: 10 },
                            { label: 'Past 30 Days', days: 30 },
                          ].map((p) => {
                            const isSelected = createdOnRangeType === 'days' && createdOnDaysRange === p.days;
                            return (
                              <button
                                key={p.days}
                                type="button"
                                onClick={() => {
                                  setCreatedOnRangeType('days');
                                  setCreatedOnDaysRange(p.days);
                                  setIsDateRangePickerOpen(false);
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200' 
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Calendar Date Selection */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Custom Date Window</p>
                        </div>

                        <div className="space-y-1.5">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">From Date</label>
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">To Date</label>
                            <input
                              type="date"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (customStartDate && customEndDate) {
                              setCreatedOnRangeType('custom');
                              setIsDateRangePickerOpen(false);
                            }
                          }}
                          className="w-full mt-1 bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-semibold py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Apply Custom Range</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="relative" ref={exportChartRef}>
                <button
                  onClick={() => setIsExportChartOpen(!isExportChartOpen)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Export chart as CSV</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isExportChartOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-40 p-1 space-y-0.5 text-xs font-sans">
                    <button
                      onClick={() => {
                        handleExportChartCsv();
                        setIsExportChartOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export Current CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        handleExportCsv();
                        setIsExportChartOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export All Leads CSV</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleExportChartCsv}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer shadow-2xs"
              >
                Download
              </button>
            </div>
          </div>

          {/* MAIN BAR CHART CARD (Exact match to screenshot) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 relative max-w-full overflow-hidden">
            
            {/* Top Card Controls: [ 📊 Bar ⌵ ] [ Group By ⌵ ] -------- [ View 1918 leads ] */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              
              {/* Left Controls */}
              <div className="flex items-center space-x-2">
                
                {/* Bar Chart Type Selector */}
                <div className="relative" ref={chartTypeRef}>
                  <button
                    onClick={() => setIsChartTypeOpen(!isChartTypeOpen)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="capitalize">{chartType === 'column' ? 'Bar' : chartType}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isChartTypeOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-40 p-1 space-y-0.5 text-xs">
                      {[
                        { id: 'column', label: 'Bar (Vertical)' },
                        { id: 'bar', label: 'Horizontal Bar' },
                        { id: 'donut', label: 'Donut' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setChartType(t.id as any);
                            setIsChartTypeOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg cursor-pointer ${
                            chartType === t.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Group By Selector with Active State */}
                <div className="relative" ref={groupByRef}>
                  <button
                    type="button"
                    onClick={() => setIsGroupByOpen(!isGroupByOpen)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-all ${
                      groupBy !== 'none'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{groupBy === 'none' ? 'Group By' : `Group By: ${groupBy}`}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isGroupByOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} />
                  </button>

                  {isGroupByOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 space-y-0.5 text-xs font-sans animate-in fade-in zoom-in-95">
                      {[
                        { id: 'none', label: 'None' },
                        { id: 'Source', label: 'Source' },
                        { id: 'Assignee', label: 'Assignee' },
                        { id: 'Status', label: 'Status' },
                        { id: 'Rating', label: 'Rating' },
                        { id: 'Creation Date', label: 'Creation Date' },
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setGroupBy(g.id);
                            setIsGroupByOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            groupBy === g.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{g.label}</span>
                          {groupBy === g.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right: [ View leads ] Solid Deep Purple Button */}
              <button
                onClick={() => setViewMode('table')}
                className="w-full sm:w-auto justify-center bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center space-x-1.5"
              >
                <span>View {totalLeadsCount} leads</span>
              </button>
            </div>

            {/* CHART DISPLAY AREA */}
            <div className="relative min-h-[300px] sm:min-h-[340px] pt-3 pb-2 w-full max-w-full overflow-hidden">
              
              {chartType === 'donut' ? (
                /* DONUT CHART MODE */
                <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 py-2">
                  <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {(() => {
                        const total = activeChartData.reduce((acc, curr) => acc + curr.value, 0) || 1;
                        let accum = 0;
                        const radius = 38;
                        const circ = 2 * Math.PI * radius;
                        return activeChartData.map((item, idx) => {
                          const strokeDasharray = `${(item.value / total) * circ} ${circ}`;
                          const strokeDashoffset = -accum;
                          accum += (item.value / total) * circ;
                          return (
                            <circle
                              key={idx}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="transparent"
                              stroke={item.color}
                              strokeWidth="14"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                              onClick={() => {
                                if (activeDimension === 'status') setSelectedStatus(item.label);
                                setViewMode('table');
                              }}
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-lg font-black text-slate-900">
                        {activeChartData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Leads</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans max-h-56 overflow-y-auto w-full max-w-md">
                    {activeChartData.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (activeDimension === 'status') setSelectedStatus(item.label);
                          setViewMode('table');
                        }}
                        className="flex items-center space-x-2 p-2 rounded-lg border border-slate-100 bg-slate-50/80 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all cursor-pointer"
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 text-[11px] truncate">{item.label}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{item.displayValue} ({item.percentage})</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : chartType === 'bar' ? (
                /* HORIZONTAL BAR CHART MODE (with Group By Stacked Support) */
                <div className="w-full h-full space-y-2.5 py-2 overflow-y-auto max-h-72">
                  {(() => {
                    const maxVal = Math.max(...activeChartData.map(d => d.value), 1);
                    return activeChartData.map((item, idx) => {
                      const barWidth = Math.max((item.value / maxVal) * 100, 2);
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (activeDimension === 'status') setSelectedStatus(item.label);
                            setViewMode('table');
                          }}
                          className="flex items-center space-x-2 sm:space-x-3 text-xs group cursor-pointer"
                        >
                          <span className="w-20 sm:w-28 text-[10px] sm:text-[11px] font-medium text-slate-700 truncate text-right shrink-0">{item.label}</span>
                          
                          {item.breakdown && item.breakdown.length > 0 ? (
                            <div className="flex-1 bg-slate-100 rounded-full h-3.5 sm:h-4 overflow-hidden flex" style={{ width: `${barWidth}%` }}>
                              {item.breakdown.map((seg, sIdx) => {
                                const segWidthPercent = (seg.count / item.value) * 100;
                                return (
                                  <div
                                    key={sIdx}
                                    style={{
                                      width: `${segWidthPercent}%`,
                                      backgroundColor: seg.color
                                    }}
                                    title={`${item.label} → ${seg.groupKey}: ${seg.count} (${seg.percentage})`}
                                    className="h-full hover:brightness-110 transition-all cursor-pointer"
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex-1 bg-slate-100 rounded-full h-3.5 sm:h-4 overflow-hidden relative">
                              <div
                                className="h-full rounded-full transition-all duration-500 group-hover:opacity-90"
                                style={{ width: `${barWidth}%`, backgroundColor: item.color }}
                              />
                            </div>
                          )}

                          <span className="w-12 sm:w-16 text-[10px] sm:text-[11px] font-bold text-slate-800 font-mono shrink-0">{item.displayValue}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* VERTICAL COLUMN CHART MODE (Exact match to screenshot with Stacked Group-By) */
                <div className="w-full max-w-full flex flex-col justify-between overflow-hidden">
                  <div className="relative h-64 sm:h-72 pl-7 sm:pl-12 pr-1 sm:pr-4 w-full max-w-full">
                    
                    {/* Y-Axis Title ("Leads Count") */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] sm:text-[11px] font-medium text-slate-400 tracking-wide select-none origin-center whitespace-nowrap hidden xs:block">
                      Leads Count
                    </div>

                    {/* Background Grid Lines & Dynamic Ticks */}
                    {(() => {
                      const maxVal = Math.max(...activeChartData.map(d => d.value), 0);

                      const computeNiceScale = (max: number) => {
                        if (max <= 0) return { topCeil: 5, ticks: [5, 4, 3, 2, 1, 0] };
                        if (max <= 5) return { topCeil: 5, ticks: [5, 4, 3, 2, 1, 0] };
                        if (max <= 10) return { topCeil: 10, ticks: [10, 8, 6, 4, 2, 0] };
                        if (max <= 25) return { topCeil: 25, ticks: [25, 20, 15, 10, 5, 0] };
                        if (max <= 50) return { topCeil: 50, ticks: [50, 40, 30, 20, 10, 0] };
                        if (max <= 100) return { topCeil: 100, ticks: [100, 80, 60, 40, 20, 0] };
                        if (max <= 250) return { topCeil: 250, ticks: [250, 200, 150, 100, 50, 0] };
                        if (max <= 500) return { topCeil: 500, ticks: [500, 400, 300, 200, 100, 0] };
                        if (max <= 1000) return { topCeil: 1000, ticks: [1000, 800, 600, 400, 200, 0] };
                        if (max <= 2000) return { topCeil: 2000, ticks: [2000, 1600, 1200, 800, 400, 0] };
                        if (max <= 5000) return { topCeil: 5000, ticks: [5000, 4000, 3000, 2000, 1000, 0] };
                        if (max <= 10000) return { topCeil: 10000, ticks: [10000, 8000, 6000, 4000, 2000, 0] };
                        
                        const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                        const factor = Math.ceil(max / magnitude);
                        const topCeil = factor * magnitude;
                        const step = topCeil / 5;
                        const ticks = [topCeil, Math.round(step * 4), Math.round(step * 3), Math.round(step * 2), Math.round(step * 1), 0];
                        return { topCeil, ticks };
                      };

                      const { topCeil, ticks } = computeNiceScale(maxVal);

                      return (
                        <div className="absolute inset-0 pl-6 sm:pl-10 pr-1 sm:pr-4 flex flex-col justify-between pointer-events-none">
                          {ticks.map((t, idx) => (
                            <div key={idx} className="w-full flex items-center space-x-1.5">
                              <span className="w-5 sm:w-8 text-[8px] sm:text-[10px] text-slate-400 text-right font-mono shrink-0">
                                {t >= 1000 ? (t / 1000).toFixed(t % 1000 === 0 ? 0 : 1) + 'k' : t.toLocaleString()}
                              </span>
                              <div className="flex-1 border-b border-slate-100" />
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Column Bars */}
                    <div className="relative z-10 w-full h-full flex items-end justify-between sm:justify-around gap-1 sm:gap-2 px-0.5 sm:px-1 pb-1">
                      {(() => {
                        const maxVal = Math.max(...activeChartData.map(d => d.value), 0);
                        const computeNiceTop = (max: number) => {
                          if (max <= 0) return 5;
                          if (max <= 5) return 5;
                          if (max <= 10) return 10;
                          if (max <= 25) return 25;
                          if (max <= 50) return 50;
                          if (max <= 100) return 100;
                          if (max <= 250) return 250;
                          if (max <= 500) return 500;
                          if (max <= 1000) return 1000;
                          if (max <= 2000) return 2000;
                          if (max <= 5000) return 5000;
                          if (max <= 10000) return 10000;
                          const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                          return Math.ceil(max / magnitude) * magnitude;
                        };
                        const topCeil = computeNiceTop(maxVal);

                        return activeChartData.map((item, index) => {
                          const barHeightPercent = Math.max((item.value / topCeil) * 100, item.value > 0 ? 3 : 0.5);

                          const tooltipText = item.breakdown && item.breakdown.length > 0
                            ? `${item.label} (${item.value} total):\n` + item.breakdown.map(b => `• ${b.groupKey}: ${b.count} (${b.percentage})`).join('\n')
                            : `${item.label}: ${item.displayCount || item.value} leads (${item.percentage})`;

                          return (
                            <div 
                              key={index} 
                              className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer min-w-0 px-0.5"
                              onClick={() => {
                                if (activeDimension === 'status') {
                                  setSelectedStatus(item.label);
                                } else if (activeDimension === 'assignee') {
                                  const ag = agents.find(a => a.name === item.label);
                                  if (ag) setSelectedAssignee(ag.id);
                                }
                                setViewMode('table');
                              }}
                              title={tooltipText}
                            >
                              {/* Value Above Bar */}
                              <span className="text-[9px] sm:text-[11px] font-bold text-slate-800 mb-0.5 select-none font-mono">
                                {item.displayValue}
                              </span>

                              {/* Stacked Group-By Bar or Solid Bar */}
                              {item.breakdown && item.breakdown.length > 0 ? (
                                <div 
                                  className="w-full max-w-[28px] sm:max-w-[48px] rounded-t-sm overflow-hidden flex flex-col-reverse transition-all duration-300 group-hover:shadow-md border-t border-white/40"
                                  style={{ height: `${barHeightPercent}%` }}
                                >
                                  {item.breakdown.map((seg, sIdx) => {
                                    const segHeightPercent = (seg.count / item.value) * 100;
                                    return (
                                      <div
                                        key={sIdx}
                                        style={{
                                          height: `${segHeightPercent}%`,
                                          backgroundColor: seg.color
                                        }}
                                        title={`${item.label} → ${seg.groupKey}: ${seg.count} (${seg.percentage})`}
                                        className="w-full hover:brightness-110 transition-all border-b border-black/10"
                                      />
                                    );
                                  })}
                                </div>
                              ) : (
                                <div 
                                  className="w-full max-w-[28px] sm:max-w-[48px] rounded-t-sm transition-all duration-300 group-hover:opacity-90 group-hover:shadow-md"
                                  style={{
                                    height: `${barHeightPercent}%`,
                                    backgroundColor: item.color
                                  }}
                                />
                              )}

                              {/* Label Below Bar */}
                              <div className="h-7 pt-1 flex items-start justify-center text-center w-full min-w-0">
                                <span className="text-[9px] sm:text-xs text-slate-700 font-medium truncate max-w-full block text-center" title={item.label}>
                                  {item.label}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Visual Legend when Group-By is Active */}
            {groupBy !== 'none' && allActiveGroups.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center flex-wrap gap-2.5 sm:gap-4 text-xs font-sans animate-in fade-in">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Grouped by {groupBy}:</span>
                {allActiveGroups.map((g) => (
                  <div key={g.key} className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full shadow-2xs hover:bg-slate-100 transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: g.color }} />
                    <span className="font-semibold text-slate-700 text-[11px]">{g.key}</span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">({g.count})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom X-Axis Axis Title ("Status" / "Assignee" / "Rating" etc.) */}
            <div className="text-center text-xs font-medium text-slate-600 mt-2 select-none">
              {dimensionTabs.find(t => t.id === activeDimension)?.label || 'Status'}
            </div>

          </div>

          {/* STATS BREAKDOWN GRID CARD (Exact match to screenshot bottom summary cards) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center gap-8 flex-wrap">
              
              {activeChartData.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-2 -m-2 rounded-xl transition-all"
                  onClick={() => {
                    if (activeDimension === 'status') {
                      setSelectedStatus(item.label);
                    } else if (activeDimension === 'assignee') {
                      const agent = agents.find(a => a.name === item.label);
                      if (agent) setSelectedAssignee(agent.id);
                    }
                    setViewMode('table');
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: item.color }} />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900 font-mono">{item.displayValue}</span>
                      <span className="bg-[#ede9fe] text-[#5b21b6] text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {item.percentage}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: FULL DATA TABLE VIEW                                        */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="space-y-2">
          
          {/* PAGINATION & ACTIONS SUB-BAR */}
          <div className="px-4 sm:px-6 mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            
            {/* Left: Pagination Controls `< 1-20 of 11100 >` and Column Button */}
            <div className="flex items-center space-x-3">
              
              {/* Pagination Navigation: `< 1-20 of 11100 >` */}
              <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-6 h-6 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="font-normal text-slate-600 text-xs px-1">
                  {actualFilteredCount === 0 ? 0 : startIndex + 1}-{endIndex} of {totalLeadsCount}
                </span>

                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="w-6 h-6 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Column Customizer Button */}
              <div className="relative" ref={columnCustomizerRef}>
                <button
                  type="button"
                  onClick={() => setShowColumnModal(!showColumnModal)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors shadow-2xs ${
                    showColumnModal
                      ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Columns3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Column</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showColumnModal ? 'rotate-180' : ''}`} />
                </button>

                {showColumnModal && (
                  <ColumnCustomizerModal
                    allFields={allAvailableFields}
                    selectedFieldKeys={selectedColumnKeys}
                    onToggleField={handleToggleColumnField}
                    onReorderFields={handleReorderFields}
                    onClose={() => setShowColumnModal(false)}
                    maxFields={12}
                  />
                )}
              </div>
            </div>

            {/* Right: Bulk Edit & More Actions */}
            <div className="flex items-center space-x-2 self-end sm:self-auto h-[28px]">
              {selectedLeadIds.length > 0 ? (
                <div className="flex items-center bg-[#f8fafc] border border-slate-200 rounded-md overflow-visible shadow-xs h-full text-xs">
                  <div className="px-3 text-slate-500 font-medium whitespace-nowrap bg-slate-50 border-r border-slate-200 h-full flex items-center">
                    {selectedLeadIds.length} Selected
                  </div>
                  <button onClick={() => setSelectedLeadIds([])} className="px-3 text-rose-500 hover:text-rose-600 font-medium whitespace-nowrap border-r border-slate-200 h-full flex items-center transition-colors cursor-pointer hover:bg-slate-50">
                    Deselect All
                  </button>
                  <button onClick={() => setShowBulkEditModal(true)} className="px-3 text-slate-600 hover:text-slate-900 font-medium flex items-center space-x-1.5 whitespace-nowrap border-r border-slate-200 h-full transition-colors cursor-pointer hover:bg-slate-50">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Bulk Edit</span>
                  </button>
                  <div className="relative h-full" ref={moreMenuRef}>
                    <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="px-3 text-slate-600 hover:text-slate-900 font-medium flex items-center space-x-1 whitespace-nowrap h-full transition-colors cursor-pointer hover:bg-slate-50 rounded-r-md">
                      <span>More</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                    {showMoreMenu && (
                      <div className="absolute right-0 top-[calc(100%+4px)] w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 text-xs">
                        <div className="px-3 pb-1 text-slate-400 font-medium text-[10px] uppercase tracking-wider">Export</div>
                        <button onClick={() => { handleExportCsv(); setShowMoreMenu(false); }} className="w-full px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer">
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Export {selectedLeadIds.length} Leads</span>
                        </button>
                        <button className="w-full px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer">
                          <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Export Activity Report</span>
                        </button>
                        <button className="w-full px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                          <span>Export Sales Form Report</span>
                        </button>

                        <div className="px-3 pt-2 pb-1 text-slate-400 font-medium text-[10px] uppercase tracking-wider mt-1 border-t border-slate-100">Smart Actions</div>
                        <button className="w-full px-3 py-1.5 text-left font-medium text-indigo-700 hover:bg-indigo-50 flex flex-col cursor-pointer group">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>AI Call Summary</span>
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover:text-indigo-400 ml-5">Generate an AI summary from call activity</span>
                        </button>

                        <div className="px-3 pt-2 pb-1 text-slate-400 font-medium text-[10px] uppercase tracking-wider mt-1 border-t border-slate-100">Growth</div>
                        <button className="w-full px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer">
                          <AtSign className="w-3.5 h-3.5 text-slate-500" />
                          <span>Create Campaign</span>
                        </button>

                        <div className="mt-1 pt-1 border-t border-slate-100">
                          <button onClick={() => { handleBulkDelete(); setShowMoreMenu(false); }} className="w-full px-3 py-1.5 text-left font-medium text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Delete {selectedLeadIds.length} Leads</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Default State when no selection */}
                  <button
                    onClick={() => {
                      if (selectedLeadIds.length === 0) {
                        setSelectedLeadIds(currentPaginatedLeads.map(l => l.id));
                      }
                      setShowBulkEditModal(true);
                    }}
                    className="px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs h-full"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Bulk Edit</span>
                  </button>

                  {/* More Actions Dropdown */}
                  <div className="relative h-full" ref={moreMenuRef}>
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs h-full"
                    >
                      <span>More</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showMoreMenu && (
                      <div className="absolute right-0 top-[calc(100%+4px)] w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-40 p-1.5 space-y-0.5 text-xs">
                        <button
                          onClick={() => {
                            handleExportCsv();
                            setShowMoreMenu(false);
                          }}
                          className="w-full px-2.5 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Export to CSV</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowImportModal(true);
                            setShowMoreMenu(false);
                          }}
                          className="w-full px-2.5 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Import CSV Contacts</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMergeModal(true);
                            setShowMoreMenu(false);
                          }}
                          className="w-full px-2.5 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 cursor-pointer"
                        >
                          <Merge className="w-3.5 h-3.5 text-slate-500" />
                          <span>Deduplicate Leads</span>
                        </button>

                        {onOpenGoogleSheets && (
                          <button
                            onClick={() => {
                              onOpenGoogleSheets();
                              setShowMoreMenu(false);
                            }}
                            className="w-full px-2.5 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Google Sheets Sync</span>
                          </button>
                        )}

                        {onClearAllLeads && (
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to clear all mock / sample leads? This will empty your CRM dataset to receive live Meta Leads.")) {
                                onClearAllLeads();
                              }
                              setShowMoreMenu(false);
                            }}
                            className="w-full px-2.5 py-1.5 text-left font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center space-x-2 cursor-pointer border-t border-slate-100 mt-1"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Purge All Mock Leads</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            window.print();
                            setShowMoreMenu(false);
                          }}
                          className="w-full px-2.5 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Print Table</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          </div>

          {/* MOBILE LEADS CARDS LIST (Visible on < md when mobileViewStyle === 'cards') */}
          <div className={`space-y-2.5 px-3 sm:px-4 ${mobileViewStyle === 'table' ? 'hidden' : 'block md:hidden'}`}>
            {currentPaginatedLeads.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-2xs">
                No leads match your current search or filter conditions.
              </div>
            ) : (
              currentPaginatedLeads.map((lead) => {
                const avatar = getAgentAvatar(lead.ownerAgentName);
                const isSelected = selectedLeadIds.includes(lead.id);

                return (
                  <div
                    key={lead.id}
                    className={`bg-white rounded-2xl border ${isSelected ? 'border-indigo-400 ring-2 ring-indigo-50 bg-indigo-50/20' : 'border-slate-200'} p-3.5 shadow-2xs space-y-2.5 transition-all`}
                  >
                    {/* Header Row: Checkbox, Name, Status Badge, Deal Value */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLeadSelect(lead.id);
                          }}
                          className="mt-0.5 cursor-pointer shrink-0"
                        >
                          {isSelected ? (
                            <div className="w-4 h-4 rounded bg-[#5034a8] flex items-center justify-center border border-[#5034a8]">
                              <Check className="w-3 h-3 text-white stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded border border-slate-300 bg-white hover:border-[#5034a8]"></div>
                          )}
                        </button>
                        <div 
                          onClick={() => onOpenLeadDetail(lead)}
                          className="cursor-pointer min-w-0"
                        >
                          <h4 className="font-bold text-slate-900 text-sm truncate tracking-tight hover:text-indigo-600 flex items-center flex-wrap gap-1">
                            <span className="truncate">{lead.name || 'Unnamed Lead'}</span>
                            {(() => {
                              const timerRecord = customFields.find(f => f.id === TIMER_SENTINEL_ID);
                              const freshTimerMins = timerRecord?.freshLeadTimerMinutes ?? 0;
                              return freshTimerMins > 0 ? (
                                <FreshLeadTimerBadge lead={lead} timerMinutes={freshTimerMins} />
                              ) : null;
                            })()}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {lead.company || lead.source || 'Direct Lead'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end">
                        <StatusBadge status={lead.status || 'Fresh'} lostReason={lead.lostReason} size="xs" />
                        {lead.dealValue ? (
                          <span className="text-xs font-bold text-slate-800 font-mono mt-1">
                            {formatDealValue(lead.dealValue, currency)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Metadata Row: Phone & Assignee */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <a 
                        href={`tel:${lead.phone}`} 
                        className="font-mono text-slate-800 font-semibold hover:text-indigo-600 flex items-center space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{lead.phone}</span>
                      </a>
                      
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${avatar.bg}`}>
                          {avatar.initials}
                        </span>
                        <span className="text-[11px] text-slate-600 truncate max-w-[100px]">
                          {lead.ownerAgentName || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar (1-Tap Call, WhatsApp, Follow-up, Brief) */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`tel:${lead.phone}`}
                        className="py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                      <button
                        onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`, '_blank')}
                        className="py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                      <button
                        onClick={() => openFollowUpModal(lead)}
                        className="py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Follow</span>
                      </button>
                      <button
                        onClick={() => setSummaryLead(lead)}
                        className="py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Brief</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* MAIN DATA TABLE */}
          <div className={`px-4 sm:px-6 ${mobileViewStyle === 'cards' ? 'hidden md:block' : 'block'}`}>
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  
                  {/* Table Header */}
                  <thead className="bg-[#f1f5f9]/70 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      {/* Checkbox */}
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

                      {/* Dynamic Headers from Database Fields Settings */}
                      {visibleFields.map((field) => (
                        <th 
                          key={field.id}
                          className="px-3.5 py-3 font-semibold text-slate-700 whitespace-nowrap cursor-pointer hover:text-indigo-600"
                          onClick={() => {
                            if (field.name === 'name') {
                              setSortField('name');
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else if (field.name === 'createdOn' || field.name === 'createdAt' || field.name === 'created_on') {
                              setSortField('createdOn');
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            }
                          }}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{field.label}</span>
                            {(field.name === 'createdOn' || field.name === 'createdAt' || field.name === 'created_on') && (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </div>
                        </th>
                      ))}

                      {/* Actions */}
                      <th className="px-3.5 py-3 font-semibold text-slate-700 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  {/* Table Rows */}
                  <tbody className="divide-y divide-slate-100">
                    {currentPaginatedLeads.length === 0 ? (
                      <tr>
                        <td colSpan={visibleFields.length + 2} className="px-4 py-12 text-center text-slate-400 text-xs">
                          No leads match your current search or filter conditions.
                        </td>
                      </tr>
                    ) : (
                      currentPaginatedLeads.map((lead) => {
                        const avatar = getAgentAvatar(lead.ownerAgentName);
                        const isSelected = selectedLeadIds.includes(lead.id);

                        return (
                          <tr 
                            key={lead.id}
                            onClick={() => onOpenLeadDetail(lead)}
                            className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                              isSelected ? 'bg-indigo-50/30' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="px-3.5 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLeadSelect(lead.id);
                                }}
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

                            {/* Dynamic Row Cells from Database Field Settings */}
                            {visibleFields.map((field) => {
                              const val = getLeadFieldValue(lead, field);
                              const timerRecord = customFields.find(f => f.id === TIMER_SENTINEL_ID);
                              const freshTimerMins = timerRecord?.freshLeadTimerMinutes ?? 0;
                              
                              if (field.primarySlot === 'H1' || field.name === 'name') {
                                return (
                                  <td 
                                    key={field.id}
                                    className="px-3.5 py-2.5 font-semibold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer whitespace-nowrap"
                                  >
                                    <span className="flex items-center">
                                      <span className="truncate max-w-[200px] inline-block capitalize">{val || '—'}</span>
                                      {freshTimerMins > 0 && (
                                        <FreshLeadTimerBadge lead={lead} timerMinutes={freshTimerMins} />
                                      )}
                                    </span>
                                  </td>
                                );
                              }
                              
                              if (field.name === 'status') {
                                return (
                                  <td key={field.id} className="px-3.5 py-2.5 whitespace-nowrap">
                                    <StatusBadge status={lead.status || 'Fresh'} lostReason={lead.lostReason} size="xs" />
                                  </td>
                                );
                              }

                              if (field.name === 'rating') {
                                const currentRating = leadRatings[lead.id] ?? lead.rating ?? 0;
                                return (
                                  <td key={field.id} className="px-3.5 py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center space-x-0.5">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => {
                                            setLeadRatings((prev) => ({ ...prev, [lead.id]: star }));
                                            if (onUpdateLead) onUpdateLead(lead.id, { rating: star });
                                          }}
                                          className="cursor-pointer hover:scale-125 transition-transform"
                                        >
                                          <Star
                                            className={`w-3.5 h-3.5 ${
                                              currentRating >= star
                                                ? 'text-amber-400 fill-amber-400'
                                                : 'text-slate-200 fill-slate-200'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </td>
                                );
                              }
                              
                              if (field.name === 'assignee' || field.name === 'owner') {
                                return (
                                  <td key={field.id} className="px-3.5 py-2.5 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold ${avatar.bg}`}>
                                        {avatar.initials}
                                      </span>
                                      <span className="text-slate-700 text-xs font-normal truncate max-w-[180px]">
                                        {lead.ownerAgentName || activeAgent?.name || 'Unassigned'}
                                      </span>
                                    </div>
                                  </td>
                                );
                              }
                              
                              if (field.name === 'source') {
                                return (
                                  <td key={field.id} className="px-3.5 py-2.5 whitespace-nowrap">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getSourceBadgeStyle(lead.source)}`}>
                                      {lead.source || 'Direct'}
                                    </span>
                                  </td>
                                );
                              }

                              return (
                                <td key={field.id} className="px-3.5 py-2.5 text-slate-700 text-xs font-normal whitespace-nowrap truncate max-w-[180px]">
                                  {val || '—'}
                                </td>
                              );
                            })}

                            {/* Actions */}
                            <td className="px-3.5 py-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSummaryLead(lead); }}
                                  className="inline-flex items-center px-2 py-1 rounded-lg bg-transparent text-indigo-600 border border-indigo-200 hover:bg-indigo-50/50 transition-colors text-[11px] font-semibold cursor-pointer"
                                  title="View Quick Call Brief"
                                >
                                  <span>Brief</span>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openFollowUpModal(lead); }}
                                  className="inline-flex items-center px-2 py-1 rounded-lg bg-transparent text-[#5034a8] border border-purple-200 hover:bg-purple-50/50 transition-colors text-[11px] font-semibold cursor-pointer"
                                  title="Schedule Follow-Up"
                                >
                                  <span>Follow Up</span>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenReassignModal(lead); }}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-700 hover:text-white border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                                  title="Change Lead Access / Direct Lead to Another Assignee"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* MODAL: Lead Call Brief / Summary */}
      {summaryLead && (
        <LeadSummaryModal
          lead={summaryLead}
          onClose={() => setSummaryLead(null)}
          onCallLead={(l) => { window.location.href = `tel:${l.phone}`; }}
          onScheduleFollowUp={(l) => openFollowUpModal(l)}
        />
      )}

      {/* MODAL: Change Lead Access & Reassign */}
      {reassignModalLead && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Change Lead Access & Assignee</h3>
              <button 
                onClick={() => setReassignModalLead(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-sm font-bold text-slate-900">{reassignModalLead.name}</p>
                <p className="text-xs text-slate-600">Current Assignee: <strong className="text-indigo-600">{reassignModalLead.ownerAgentName || activeAgent?.name || 'Unassigned'}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select New Assignee</label>
                <select
                  value={selectedNewAssigneeId}
                  onChange={(e) => setSelectedNewAssigneeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id} className="bg-white text-slate-900 font-medium py-1">
                      {agent.name} {agent.role ? `(${agent.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-amber-500 font-semibold">
                  The access of this lead will change to the new assignee.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReassignModalLead(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Cancel
              </button>

              {!isConfirmingReassign ? (
                <button
                  onClick={() => setIsConfirmingReassign(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  Change Access
                </button>
              ) : (
                <button
                  onClick={handleConfirmReassign}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors shadow-md flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Click to Confirm Change</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Schedule Lead as Follow-Up */}
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
                    <option value="" className="bg-white text-slate-500 font-medium">Select Assignee</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id} className="bg-white text-slate-900 font-medium py-1">
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

      {/* MODAL 1: Bulk Edit Leads */}
      {showBulkEditModal && (
        <BulkEditModal
          selectedLeadIds={selectedLeadIds}
          totalSelectedCount={selectedLeadIds.length || totalLeadsCount}
          agents={agents}
          onApplyBulkUpdates={handleApplyBulkUpdates}
          onBulkDelete={handleBulkDelete}
          onClose={() => setShowBulkEditModal(false)}
        />
      )}

      {/* MODAL 2: CSV Bulk Import */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Bulk CSV Contacts Upload</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Paste comma-separated rows below. Header format: <br />
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">Name, Phone, Email, Company, City, Source, DealValue</code>
            </p>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`Name,Phone,Email,Company,City,Source,DealValue\nRajesh Kumar,+91 98888 11111,rajesh@mumbaibuilders.in,Mumbai Builders,Mumbai,Facebook-Meta-01,150000`}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (csvText.trim()) {
                    const lines = csvText.split('\n').filter(l => l.trim().length > 0);
                    const imported: Partial<Lead>[] = [];
                    for (let i = 1; i < lines.length; i++) {
                      const cols = lines[i].split(',').map(c => c.trim());
                      if (cols[0] && cols[1]) {
                        imported.push({
                          name: cols[0],
                          phone: cols[1],
                          email: cols[2] || '',
                          company: cols[3] || '',
                          city: cols[4] || '',
                          source: (cols[5] as LeadSource) || 'Facebook-Meta-01',
                          dealValue: Number(cols[6]) || 120000,
                          status: 'Fresh'
                        });
                      }
                    }
                    if (imported.length > 0) {
                      onImportCsv(imported);
                      setCsvText('');
                      setShowImportModal(false);
                    }
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Import Contacts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Merge Duplicates */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Merge className="w-4 h-4 text-indigo-600" />
                <span>Duplicate Lead Detection & Merger</span>
              </h3>
              <button onClick={() => setShowMergeModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-emerald-700 font-bold text-center py-8">
              ✓ No duplicate leads detected by phone number across your entire database!
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Create / Save Filter View */}
      {showNewViewModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span>Create Saved Filter View</span>
              </h3>
              <button onClick={() => setShowNewViewModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">View Name</label>
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="e.g., Aviation Pilot Leads, Hyderabad Ground Staff"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowNewViewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newViewName.trim()) {
                    setShowNewViewModal(false);
                    setNewViewName('');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Save View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


export const LeadsView = LeadsPage;
export default LeadsPage;
