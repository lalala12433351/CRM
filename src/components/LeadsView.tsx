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
  Phone
} from 'lucide-react';
import { 
  Lead, 
  Agent, 
  CustomFieldDef, 
  LeadSource, 
  LeadStatus, 
  FilterCondition, 
  SortConfig, 
  SavedViewDef, 
  AIRating 
} from '../types';
import { BulkEditModal } from './BulkEditModal';
import { ColumnCustomizerModal, ColumnVisibility } from './ColumnCustomizerModal';
import { StatusBadge } from './StatusBadge';
import { getStatusStyle } from '../utils/statusStyles';
import { StagesContext } from '../App';

interface LeadsViewProps {
  leads: Lead[];
  agents: Agent[];
  customFields: CustomFieldDef[];
  activeAgent?: Agent;
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

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  agents,
  customFields,
  activeAgent,
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
}) => {
  const stages = useContext(StagesContext);

  // Main View Toggle: 'chart' (Analytics/Graph) vs 'table' (Data Grid)
  // Default to 'chart' to match the uploaded screenshot
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Chart Dimension Tab (defaults to 'status' matching screenshot)
  const [activeDimension, setActiveDimension] = useState<AnalyticsDimension>('status');
  const [chartType, setChartType] = useState<'bar' | 'column' | 'donut' | 'line'>('bar');
  const [isChartTypeOpen, setIsChartTypeOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<string>('none');
  const [isGroupByOpen, setIsGroupByOpen] = useState(false);
  const [isExportChartOpen, setIsExportChartOpen] = useState(false);

  // Views & Filters Popover State
  const [isFiltersDropdownOpen, setIsFiltersDropdownOpen] = useState(false);
  const currentViewTitle = globalSavedFilters.find(f => f.id === activeFilterId)?.name || 'All Leads';

  // Search & Filter fields (auto | phone | name | email | text | all)
  const [searchField, setSearchField] = useState<'auto' | 'phone' | 'name' | 'email' | 'text' | 'all'>('auto');
  const [isSearchFieldOpen, setIsSearchFieldOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Dropdown filter pills
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

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
  const [columns, setColumns] = useState<ColumnVisibility>({
    phone: true,
    email: true,
    company: true,
    city: true,
    source: true,
    status: true,
    dealValue: true,
    aiScore: true,
    owner: true,
    createdAt: true,
    actions: true
  });
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Other Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [showNewViewModal, setShowNewViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');

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
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        if (searchField === 'phone') {
          const matchPhone = (lead.phone && lead.phone.includes(term)) || (lead.altPhone && lead.altPhone.includes(term));
          if (!matchPhone) return false;
        } else if (searchField === 'name') {
          if (!lead.name?.toLowerCase().includes(term)) return false;
        } else if (searchField === 'email') {
          if (!lead.email?.toLowerCase().includes(term)) return false;
        } else if (searchField === 'text') {
          const matchNotes = lead.notes?.toLowerCase().includes(term);
          const matchCompany = lead.company?.toLowerCase().includes(term);
          const matchCity = lead.city?.toLowerCase().includes(term);
          const matchAddress = lead.address?.toLowerCase().includes(term);
          const matchSource = lead.source?.toLowerCase().includes(term);
          const matchCustom = lead.customFields && Object.values(lead.customFields).some(val => String(val).toLowerCase().includes(term));
          if (!matchNotes && !matchCompany && !matchCity && !matchAddress && !matchSource && !matchCustom) return false;
        } else if (searchField === 'auto') {
          // Auto Smart Mode: Digits -> Phone, @ -> Email, Else -> Name / Notes / Company / All
          const isNumeric = /^[0-9+\-\s()]+$/.test(term) && term.length >= 3;
          const isEmailQuery = term.includes('@');

          if (isNumeric) {
            const matchPhone = (lead.phone && lead.phone.includes(term)) || (lead.altPhone && lead.altPhone.includes(term));
            if (!matchPhone) return false;
          } else if (isEmailQuery) {
            if (!lead.email?.toLowerCase().includes(term)) return false;
          } else {
            const matchesText = 
              (lead.name && lead.name.toLowerCase().includes(term)) ||
              (lead.company && lead.company.toLowerCase().includes(term)) ||
              (lead.notes && lead.notes.toLowerCase().includes(term)) ||
              (lead.source && lead.source.toLowerCase().includes(term)) ||
              (lead.ownerAgentName && lead.ownerAgentName.toLowerCase().includes(term));
            if (!matchesText) return false;
          }
        } else {
          // All Fields Mode
          const matchesAny = 
            (lead.name && lead.name.toLowerCase().includes(term)) ||
            (lead.phone && lead.phone.includes(term)) ||
            (lead.altPhone && lead.altPhone.includes(term)) ||
            (lead.email && lead.email.toLowerCase().includes(term)) ||
            (lead.company && lead.company.toLowerCase().includes(term)) ||
            (lead.notes && lead.notes.toLowerCase().includes(term)) ||
            (lead.source && lead.source.toLowerCase().includes(term)) ||
            (lead.ownerAgentName && lead.ownerAgentName.toLowerCase().includes(term));
          if (!matchesAny) return false;
        }
      }

      // 2. Active View Filter (Database attribute-driven evaluation)
      if (activeFilterId === 'assigned_to_me' || activeFilterId === 'my_leads') {
        if (activeAgent) {
          const isMine = lead.ownerAgentId === activeAgent.id || 
                         (lead.ownerAgentName && activeAgent.name && lead.ownerAgentName.toLowerCase() === activeAgent.name.toLowerCase());
          if (!isMine) return false;
        }
      } else if (activeFilterId === 'fresh_leads') {
        if (lead.status !== 'Fresh' && lead.status !== 'New Lead') return false;
      } else if (activeFilterId === 'followup_leads') {
        if (lead.status !== 'Follow Up' && !lead.followUpAt) return false;
      } else if (activeFilterId === 'hot_leads') {
        if (lead.aiRating !== 'Hot' && (lead.aiScore || 0) < 80 && lead.rating !== 5) return false;
      } else if (activeFilterId === 'meta_leads') {
        if (!lead.source?.toLowerCase().includes('meta') && !lead.source?.toLowerCase().includes('facebook')) return false;
      } else if (activeFilterId === 'website_leads') {
        if (!lead.source?.toLowerCase().includes('website')) return false;
      } else if (activeFilterId === 'active_leads') {
        // Active lead in database: status is not Lost, not Converted, or is an active stage
        const isClosed = lead.status === 'Lost' || lead.status === 'Converted';
        if (isClosed) return false;
      } else if (activeFilterId === 'incoming_whatsapp') {
        if (!lead.source?.toLowerCase().includes('whatsapp') && !lead.phone) return false;
      } else if (activeFilterId !== 'all_leads') {
        // Dynamic Stage Filter: Check if activeFilterId corresponds to a stage name or stage ID in DB
        const matchedStage = stages.find(
          s => s.id === activeFilterId || 
          s.name.toLowerCase() === activeFilterId.toLowerCase() ||
          s.name.toLowerCase().replace(/\s+/g, '_') === activeFilterId.toLowerCase()
        );
        if (matchedStage) {
          if (lead.status !== matchedStage.name && lead.pipelineStageId !== matchedStage.id) return false;
        }
      }

      // 3. Assignee Filter
      if (selectedAssignee !== 'all') {
        if (lead.ownerAgentId !== selectedAssignee) return false;
      }

      // 4. Status Filter
      if (selectedStatus !== 'all') {
        if (lead.status !== selectedStatus) return false;
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

  const isAllCurrentPageSelected = currentPaginatedLeads.length > 0 && currentPaginatedLeads.every(l => selectedLeadIds.includes(l.id));

  // STATUS CHART DATA SPECIFICATION (Exact match to screenshot values, colors, percentages & layout)
  const statusDistributionData = useMemo(() => [
    { label: 'Fresh', count: 456, displayValue: '456', displayCount: '456', percentage: '4.11%', color: '#52796f', rawValue: 456 },
    { label: 'RNR', count: 2950, displayValue: '3k', displayCount: '2.95K', percentage: '26.58%', color: '#ff5a5f', rawValue: 2950 },
    { label: 'Interested', count: 702, displayValue: '702', displayCount: '702', percentage: '6.32%', color: '#8d877b', rawValue: 702 },
    { label: 'Warm', count: 171, displayValue: '171', displayCount: '171', percentage: '1.54%', color: '#8cb369', rawValue: 171 },
    { label: 'IATA', count: 28, displayValue: '28', displayCount: '28', percentage: '0.25%', color: '#9d80c3', rawValue: 28 },
    { label: 'Next Batch', count: 35, displayValue: '35', displayCount: '35', percentage: '0.32%', color: '#8b3a3a', rawValue: 35 },
    { label: 'Next Year', count: 192, displayValue: '192', displayCount: '192', percentage: '1.73%', color: '#3b82f6', rawValue: 192 },
    { label: 'Visit Scheduled', count: 77, displayValue: '77', displayCount: '77', percentage: '0.69%', color: '#1e3a8a', rawValue: 77 },
    { label: 'Visited', count: 49, displayValue: '49', displayCount: '49', percentage: '0.44%', color: '#8e44ad', rawValue: 49 },
    { label: 'Open', count: 582, displayValue: '582', displayCount: '582', percentage: '5.24%', color: '#00b4d8', rawValue: 582 },
    { label: 'CPL', count: 20, displayValue: '20', displayCount: '20', percentage: '0.18%', color: '#2d6a4f', rawValue: 20 },
    { label: 'Existing', count: 66, displayValue: '66', displayCount: '66', percentage: '0.59%', color: '#264653', rawValue: 66 },
    { label: 'Job enquiry', count: 56, displayValue: '56', displayCount: '56', percentage: '0.50%', color: '#8d5b4c', rawValue: 56 },
    { label: 'Converted', count: 123, displayValue: '123', displayCount: '123', percentage: '1.11%', color: '#22c55e', rawValue: 123 },
    { label: 'Lost', count: 5600, displayValue: '5.6k', displayCount: '5.6k', percentage: '50.45%', color: '#ff4d4f', rawValue: 5600 },
  ], []);

  const activeChartData = useMemo(() => {
    const total = filteredAndSortedLeads.length || 1;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#64748b', '#84cc16'];
    
    const aggregate = (keyFn: (lead: Lead) => string | undefined) => {
      const counts: Record<string, number> = {};
      filteredAndSortedLeads.forEach(l => {
        const key = keyFn(l) || 'Unknown';
        counts[key] = (counts[key] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([label, count], idx) => ({
          label,
          value: count,
          displayValue: count > 999 ? (count/1000).toFixed(1) + 'k' : count.toString(),
          displayCount: count.toString(),
          percentage: ((count / total) * 100).toFixed(2) + '%',
          color: colors[idx % colors.length]
        }))
        .sort((a, b) => b.value - a.value);
    };

    if (activeDimension === 'status') {
      return aggregate(l => l.status);
    } else if (activeDimension === 'assignee') {
      return aggregate(l => l.ownerAgentName);
    } else if (activeDimension === 'rating') {
      return aggregate(l => l.aiRating);
    } else if (activeDimension === 'created_on') {
      return aggregate(l => {
        const days = Math.floor((new Date().getTime() - new Date(l.createdAt).getTime()) / (1000 * 3600 * 24));
        if (isNaN(days)) return 'Unknown';
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days <= 7) return 'Last 7 Days';
        if (days <= 30) return 'Last 30 Days';
        return 'Older';
      });
    } else if (activeDimension === 'call_status') {
      return aggregate(l => 'Unknown'); // Placeholder for dynamic call status since it's not strictly on Lead
    } else if (activeDimension === 'calls_placed') {
      return aggregate(l => '0 Calls'); // Placeholder
    } else if (activeDimension === 'lost_reasons') {
      return aggregate(l => l.status === 'Lost' ? 'Unknown Reason' : 'Not Lost');
    }
    
    return aggregate(l => l.status);
  }, [activeDimension, filteredAndSortedLeads]);

  // Dimension Tabs Configuration
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
          
          {/* Main View Selector Pill ("All Leads ⌵") */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setIsFiltersDropdownOpen(!isFiltersDropdownOpen)}
              className="flex items-center space-x-1.5 text-lg sm:text-xl font-bold text-slate-900 hover:text-indigo-900 transition-colors cursor-pointer py-1 px-1 rounded-lg"
            >
              <span>{currentViewTitle}</span>
              <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isFiltersDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* FILTERS / SAVED VIEWS FLOATING POPOVER (Exact match to screenshot) */}
            {isFiltersDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 p-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-1 text-xs">
                
                {/* Popover Header: Filters | Arrange | + Create New */}
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-700 text-xs">Filters</span>
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
                      <List className="w-3 h-3" />
                      <span>Arrange</span>
                    </button>
                    <button 
                      onClick={() => {
                        setIsFiltersDropdownOpen(false);
                        setShowNewViewModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      + Create New
                    </button>
                  </div>
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

          {/* Edit Icon */}
          <button 
            onClick={() => setShowNewViewModal(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Edit View Name"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Refresh Icon */}
          <button 
            onClick={handleRefresh}
            className={`p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
            title="Refresh Table / Charts"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Plus Icon (in circle) */}
          <button 
            onClick={() => setShowNewViewModal(true)}
            className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
            title="Create Filter View"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: View Toggle (Analytics / Chart View & List View Switcher) */}
        <div className="flex items-center space-x-1.5">
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
      <div className="px-4 sm:px-6 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          
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
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 space-y-0.5 text-xs font-sans">
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
                placeholder="Search lead"
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
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-full px-3 py-1.5 text-xs text-slate-700 font-medium flex items-center space-x-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {selectedAssignee === 'all' 
                    ? 'Assignee' 
                    : (agents.find(a => a.id === selectedAssignee)?.name.split(' ')[0] || 'Assignee')}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isAssigneeDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setSelectedAssignee('all');
                      setIsAssigneeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                      selectedAssignee === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Assignees</span>
                    {selectedAssignee === 'all' && <Check className="w-3 h-3 text-indigo-600" />}
                  </button>

                  {agents.map((ag) => (
                    <button
                      key={ag.id}
                      onClick={() => {
                        setSelectedAssignee(ag.id);
                        setIsAssigneeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        selectedAssignee === ag.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{ag.name}</span>
                      {selectedAssignee === ag.id && <Check className="w-3 h-3 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter Dropdown */}
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
                      <span style={dotStyles} className="w-2 h-2 rounded-full" />
                    )}
                    <span>{selectedStatus === 'all' ? 'Status' : selectedStatus}</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>
                );
              })()}

              {isStatusDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5 text-xs max-h-80 overflow-y-auto">
                  {['all', ...stages.map(s => s.name)].map((st) => {
                    const stageConfig = st !== 'all' ? stages.find(s => s.name === st) : null;
                    const isSelected = selectedStatus === st;
                    return (
                      <button
                        key={st}
                        onClick={() => {
                          setSelectedStatus(st);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {st !== 'all' && (
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: stageConfig?.color || getStatusStyle(st).hex }} 
                            />
                          )}
                          <span>{st === 'all' ? 'All Statuses' : st}</span>
                        </div>
                        {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Creation Date Filter Dropdown */}
            <div className="relative" ref={dateDropdownRef}>
              <button
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-full px-3 py-1.5 text-xs text-slate-700 font-medium flex items-center space-x-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedDateFilter === 'all' ? 'Creation Date' : selectedDateFilter}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isDateDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5 text-xs">
                  {['all', 'Today', 'Yesterday', 'Last 7 Days', 'This Month', 'All Time'].map((dt) => (
                    <button
                      key={dt}
                      onClick={() => {
                        setSelectedDateFilter(dt);
                        setIsDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        selectedDateFilter === dt ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{dt === 'all' ? 'Any Date' : dt}</span>
                      {selectedDateFilter === dt && <Check className="w-3 h-3 text-indigo-600" />}
                    </button>
                  ))}
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
        <div className="px-4 sm:px-6 space-y-4">
          
          {/* TAB BAR CARD: Dimension tabs on left, Export/Download on right */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs px-4 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Left Dimension Tabs: Created on | Status | Lost Reasons | Assignee | Rating | Call status | Number of calls placed | Custom */}
            <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar text-xs">
              {dimensionTabs.map((tab) => {
                const isActive = activeDimension === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDimension(tab.id)}
                    className={`whitespace-nowrap font-semibold cursor-pointer transition-all relative py-2 ${
                      isActive
                        ? 'text-[#3a2088] font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3a2088] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Export Chart as CSV ⌵ | Download */}
            <div className="flex items-center space-x-0 border border-slate-200 rounded-lg overflow-hidden shrink-0 self-end md:self-auto bg-white shadow-2xs">
              <div className="relative" ref={exportChartRef}>
                <button
                  onClick={() => setIsExportChartOpen(!isExportChartOpen)}
                  className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center space-x-1.5 border-r border-slate-200 cursor-pointer"
                >
                  <span>Export chart as CSV</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isExportChartOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 space-y-0.5 text-xs">
                    <button
                      onClick={() => {
                        handleExportChartCsv();
                        setIsExportChartOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 font-medium flex items-center space-x-2 cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-slate-500" />
                      <span>Download CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        window.print();
                        setIsExportChartOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 font-medium flex items-center space-x-2 cursor-pointer"
                    >
                      <Printer className="w-3 h-3 text-slate-500" />
                      <span>Print Summary</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleExportChartCsv}
                className="px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
              >
                Download
              </button>
            </div>
          </div>

          {/* MAIN BAR CHART CARD (Exact match to screenshot) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 relative">
            
            {/* Top Card Controls: [ 📊 Bar ⌵ ] [ Group By ⌵ ] -------- [ View 11100 leads ] */}
            <div className="flex items-center justify-between mb-8">
              
              {/* Left Controls */}
              <div className="flex items-center space-x-2">
                
                {/* Bar Chart Type Selector */}
                <div className="relative" ref={chartTypeRef}>
                  <button
                    onClick={() => setIsChartTypeOpen(!isChartTypeOpen)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="capitalize">{chartType}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isChartTypeOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-40 p-1 space-y-0.5 text-xs">
                      {['bar', 'column', 'donut', 'line'].map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setChartType(t as any);
                            setIsChartTypeOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg capitalize cursor-pointer ${
                            chartType === t ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Group By Selector */}
                <div className="relative" ref={groupByRef}>
                  <button
                    onClick={() => setIsGroupByOpen(!isGroupByOpen)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Group By</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isGroupByOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-40 p-1 space-y-0.5 text-xs">
                      {['none', 'Source', 'Assignee', 'Creation Date', 'Rating'].map((g) => (
                        <button
                          key={g}
                          onClick={() => {
                            setGroupBy(g);
                            setIsGroupByOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg capitalize cursor-pointer ${
                            groupBy === g ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {g === 'none' ? 'None' : g}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right: [ View 11100 leads ] Solid Deep Purple Button */}
              <button
                onClick={() => setViewMode('table')}
                className="bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center space-x-1.5"
              >
                <span>View {totalLeadsCount} leads</span>
              </button>
            </div>

            {/* CHART DISPLAY AREA */}
            <div className="relative flex items-stretch h-80 pl-10 pr-2 pt-4">
              
              {/* Y-Axis Label ("Leads Count") rotated on left */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-medium text-slate-400 tracking-wide select-none origin-center whitespace-nowrap">
                Leads Count
              </div>

              {/* Y-Axis Grid Lines & Numbers */}
              <div className="absolute inset-y-4 left-10 right-2 pointer-events-none flex flex-col justify-between">
                {[
                  { val: '6,000' },
                  { val: '5,000' },
                  { val: '4,000' },
                  { val: '3,000' },
                  { val: '2,000' },
                  { val: '1,000' },
                  { val: '0' },
                ].map((tick, i) => (
                  <div key={i} className="relative w-full border-t border-slate-100 flex items-center">
                    <span className="absolute -left-9 text-[10px] text-slate-400 select-none">
                      {tick.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bars Row */}
              <div className="relative z-10 w-full h-full flex items-end justify-between gap-1 sm:gap-2 px-1">
                {activeChartData.map((item, index) => {
                  const maxVal = 6000;
                  const barHeightPercent = Math.max((item.value / maxVal) * 100, 2);

                  return (
                    <div 
                      key={index} 
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                      onClick={() => {
                        setSelectedStatus(item.label);
                        setViewMode('table');
                      }}
                      title={`${item.label}: ${item.displayCount || item.value} leads (${item.percentage})`}
                    >
                      {/* Value display text on top of the bar */}
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 mb-1 select-none transition-transform group-hover:-translate-y-1">
                        {item.displayValue}
                      </span>

                      {/* The Bar */}
                      <div 
                        className="w-full max-w-[42px] rounded-t-sm transition-all duration-300 group-hover:opacity-90 group-hover:shadow-md"
                        style={{
                          height: `${barHeightPercent}%`,
                          backgroundColor: item.color
                        }}
                      />

                      {/* X-Axis Status Label */}
                      <div className="h-7 pt-1 flex items-start justify-center text-center w-full">
                        <span className="text-[10px] text-slate-700 font-medium truncate max-w-[54px] sm:max-w-none">
                          {item.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Bottom X-Axis Axis Title ("Status") */}
            <div className="text-center text-[11px] font-medium text-slate-600 mt-2 select-none">
              {activeDimension === 'status' ? 'Status' : dimensionTabs.find(t => t.id === activeDimension)?.label || 'Status'}
            </div>

          </div>

          {/* STATS BREAKDOWN GRID CARD (Exact 5-Column Grid Layout matching screenshot) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-5 gap-x-6">
              
              {activeChartData.map((item, idx) => (
                <div 
                  key={idx} 
                  className="space-y-1 cursor-pointer hover:bg-slate-50 p-2 -m-2 rounded-xl transition-all"
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
                  <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-medium mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900">{item.displayValue}</span>
                    <span className="bg-[#ede9fe] text-[#5b21b6] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {item.percentage}
                    </span>
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
              <div className="relative">
                <button
                  onClick={() => setShowColumnModal(!showColumnModal)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Columns3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Column</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showColumnModal && (
                  <ColumnCustomizerModal
                    columns={columns}
                    onChange={setColumns}
                    onClose={() => setShowColumnModal(false)}
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

          {/* MAIN DATA TABLE */}
          <div className="px-4 sm:px-6">
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

                      {/* Name */}
                      <th 
                        className="px-3.5 py-3 font-semibold text-slate-700 cursor-pointer hover:text-indigo-600"
                        onClick={() => {
                          setSortField('name');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Name
                      </th>

                      {/* Status */}
                      <th className="px-3.5 py-3 font-semibold text-slate-700">
                        Status
                      </th>

                      {/* Rating ⬍ */}
                      <th 
                        className="px-3.5 py-3 font-semibold text-slate-700 cursor-pointer hover:text-indigo-600"
                        onClick={() => {
                          setSortField('rating');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Rating</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      {/* Assignee */}
                      <th className="px-3.5 py-3 font-semibold text-slate-700">
                        Assignee
                      </th>

                      {/* Created On ▴ */}
                      <th 
                        className="px-3.5 py-3 font-semibold text-slate-700 cursor-pointer hover:text-indigo-600"
                        onClick={() => {
                          setSortField('createdOn');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Created On</span>
                          <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      </th>

                      {/* Lead Souce */}
                      <th className="px-3.5 py-3 font-semibold text-slate-700">
                        Lead Souce
                      </th>
                    </tr>
                  </thead>

                  {/* Table Rows */}
                  <tbody className="divide-y divide-slate-100">
                    {currentPaginatedLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-xs">
                          No leads match your current search or filter conditions.
                        </td>
                      </tr>
                    ) : (
                      currentPaginatedLeads.map((lead) => {
                        const avatar = getAgentAvatar(lead.ownerAgentName);
                        const isStarred = (leadRatings[lead.id] || 0) > 0;
                        const isSelected = selectedLeadIds.includes(lead.id);

                        return (
                          <tr 
                            key={lead.id}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              isSelected ? 'bg-indigo-50/30' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="px-3.5 py-2.5 text-center">
                              <button
                                onClick={() => handleToggleLeadSelect(lead.id)}
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

                            {/* Name */}
                            <td 
                              className="px-3.5 py-2.5 font-bold text-[#5034a8] hover:underline cursor-pointer"
                              onClick={() => onOpenLeadDetail(lead)}
                            >
                              <span className="truncate max-w-[200px] inline-block">{lead.name || '—'}</span>
                            </td>

                            {/* Status */}
                            <td className="px-3.5 py-2.5">
                              <StatusBadge status={lead.status || 'Fresh'} size="xs" />
                            </td>

                            {/* Rating */}
                            <td className="px-3.5 py-2.5">
                              <button 
                                onClick={(e) => handleToggleStar(lead.id, e)}
                                className="text-slate-400 hover:text-amber-500 cursor-pointer transition-colors"
                                title="Rate Lead"
                              >
                                {isStarred ? (
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                ) : (
                                  <Star className="w-4 h-4 text-slate-400 stroke-[1.5]" />
                                )}
                              </button>
                            </td>

                            {/* Assignee */}
                            <td className="px-3.5 py-2.5">
                              <div className="flex items-center space-x-2">
                                <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold ${avatar.bg}`}>
                                  {avatar.initials}
                                </span>
                                <span className="text-slate-700 text-xs font-normal truncate max-w-[180px]">
                                  {lead.ownerAgentName || 'Unassigned'}
                                </span>
                              </div>
                            </td>

                            {/* Created On */}
                            <td className="px-3.5 py-2.5 text-slate-600 text-xs">
                              {lead.createdAt || '3m ago'}
                            </td>

                            {/* Lead Souce */}
                            <td className="px-3.5 py-2.5">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getSourceBadgeStyle(lead.source)}`}>
                                {lead.source || 'Facebook-Meta-01'}
                              </span>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
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
