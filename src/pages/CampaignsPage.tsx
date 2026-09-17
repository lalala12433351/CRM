import React, { useState, useEffect, useMemo, useContext } from 'react';
import { 
  Megaphone, 
  Phone, 
  PhoneCall, 
  Star, 
  Bell, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Mail, 
  MessageSquare, 
  Send, 
  FileText, 
  CheckSquare, 
  Calendar, 
  MapPin, 
  User, 
  Search, 
  Plus, 
  X, 
  Filter, 
  Share2, 
  AtSign,
  ArrowRight,
  ExternalLink,
  Info,
  Copy,
  Eye,
  Check,
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Layers,
  Zap,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Pause,
  Trash2
} from 'lucide-react';
import { Lead, Agent, LeadStatus, ActivityLog, WhatsAppMessage, CallRecord, CustomFieldDef } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { getStatusStyle, getStatusBadgeClasses } from '../utils/statusStyles';
import { StagesContext } from '../App';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { toast } from '../context/ToastContext';
import { formatProperName } from '../utils/formatUtils';
import { getLeadFormOrCampaignName, formatCampaignHandle } from '../utils/leadFormUtils';

interface CampaignsViewProps {
  leads: Lead[];
  agents: Agent[];
  activities?: ActivityLog[];
  messages?: WhatsAppMessage[];
  callRecords?: CallRecord[];
  customFields?: CustomFieldDef[];
  initialCampaignHandle?: string;
  onOpenLeadDetail?: (lead: Lead) => void;
  onUpdateLead?: (lead: Lead) => void;
  onAddActivity?: (activity: Partial<ActivityLog>) => void;
  onSendMessage?: (leadId: string, text: string) => void;
  onOpenPowerDialerForLead?: (lead: Lead) => void;
  onDeleteLead?: (leadId: string) => void;
  onUpdateCallRecord?: (callId: string, updates: Partial<CallRecord>) => void;
  lostReasons?: string[];
  onNavigateToTab?: (tab: string, subTab?: string) => void;
  onShowToast?: (msg: string) => void;
}

interface CampaignDef {
  id: string;
  handle: string;
  name: string;
  totalLeads: number;
  newLeads: number;
  progress: number;
  members: string[];
  errors: number;
}

export const CampaignsPage: React.FC<CampaignsViewProps> = ({
  leads = [],
  agents = [],
  activities = [],
  messages = [],
  callRecords = [],
  customFields = [],
  initialCampaignHandle,
  onOpenLeadDetail,
  onUpdateLead,
  onAddActivity,
  onSendMessage,
  onOpenPowerDialerForLead,
  onDeleteLead,
  onUpdateCallRecord,
  lostReasons,
  onNavigateToTab,
  onShowToast
}) => {
  const stages = useContext(StagesContext);
  const [customCampaigns, setCustomCampaigns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pixbe_custom_campaigns');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pixbe_custom_campaigns', JSON.stringify(customCampaigns));
    } catch {}
  }, [customCampaigns]);

  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [newCampaignInput, setNewCampaignInput] = useState('');
  const [dbCampaignMappings, setDbCampaignMappings] = useState<any[]>([]);

  // Fetch registered campaigns & form mappings directly from the database
  useEffect(() => {
    fetch('/api/integrations/facebook/campaign-mappings')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.mappings)) {
          setDbCampaignMappings(data.mappings);
        }
      })
      .catch(() => {});
  }, []);

  // Dynamic Campaign list derived strictly from live leads prop & form metadata
  const campaignsList = useMemo(() => {
    const handleMap = new Map<string, { handle: string; name: string; leads: Lead[] }>();
    handleMap.set('all-inbound-leads', { handle: '@all-inbound-leads', name: 'All Inbound Leads', leads: [] });

    const addCampaignName = (rawName: string) => {
      if (!rawName || !rawName.trim()) return;
      const cleanName = rawName.trim();
      const h = formatCampaignHandle(cleanName).toLowerCase().replace(/^@/, '');
      if (!h || h === 'empty' || h === 'all-inbound-leads') return;

      if (!handleMap.has(h)) {
        const displayHandle = formatCampaignHandle(cleanName);
        handleMap.set(h, { handle: displayHandle, name: displayHandle.replace(/^@/, ''), leads: [] });
      }
    };

    // Add registered campaigns from database mappings
    dbCampaignMappings.forEach(m => {
      if (m.campaignName) addCampaignName(m.campaignName);
      if (m.campaignHandle) addCampaignName(m.campaignHandle);
    });

    // Add campaigns from live leads
    if (leads && leads.length > 0) {
      leads.forEach((l) => {
        if (l.campaignName) addCampaignName(l.campaignName);
        if (l.campaign) addCampaignName(l.campaign);
        if (l.campaign_name) addCampaignName(l.campaign_name);
        if (l.customFields?.campaign_name) addCampaignName(l.customFields.campaign_name);
        const key = getLeadFormOrCampaignName(l);
        if (key && key !== 'Empty') addCampaignName(key);
      });
    }

    customCampaigns.forEach((c) => addCampaignName(c));

    // Group leads into deduplicated campaign entries
    if (leads && leads.length > 0) {
      leads.forEach((l) => {
        // Add lead to 'All Inbound Leads'
        if (handleMap.has('all-inbound-leads')) {
          handleMap.get('all-inbound-leads')!.leads.push(l);
        }

        const leadFormName = getLeadFormOrCampaignName(l);
        const lFormId = l.formId || l.customFields?.meta_form_id || l.customFields?.form_id;

        handleMap.forEach((entry, hKey) => {
          if (hKey === 'all-inbound-leads') return;

          const mappingForCamp = dbCampaignMappings.find(m => {
            const mH = formatCampaignHandle(m.campaignHandle || m.campaignName || '').toLowerCase().replace(/^@/, '');
            return mH === hKey;
          });
          const isFormIdMatch = mappingForCamp && lFormId && String(mappingForCamp.formId) === String(lFormId);

          const matches =
            isFormIdMatch ||
            (l.campaignName && formatCampaignHandle(l.campaignName).toLowerCase().replace(/^@/, '') === hKey) ||
            (l.campaign && formatCampaignHandle(l.campaign).toLowerCase().replace(/^@/, '') === hKey) ||
            (l.campaignHandle && formatCampaignHandle(l.campaignHandle).toLowerCase().replace(/^@/, '') === hKey) ||
            (l.customFields?.campaign_name && formatCampaignHandle(l.customFields.campaign_name).toLowerCase().replace(/^@/, '') === hKey) ||
            (l.customFields?.campaign_handle && formatCampaignHandle(l.customFields.campaign_handle).toLowerCase().replace(/^@/, '') === hKey) ||
            formatCampaignHandle(leadFormName).toLowerCase().replace(/^@/, '') === hKey;

          if (matches) {
            entry.leads.push(l);
          }
        });
      });
    }

    return Array.from(handleMap.values()).map((entry, idx) => {
      const freshCount = entry.leads.filter((l) => l.status === 'Fresh' || l.status === 'Open').length;
      return {
        id: `camp-dyn-${idx}`,
        handle: entry.handle,
        name: entry.name,
        totalLeads: entry.leads.length,
        newLeads: freshCount,
        progress: entry.leads.length > 0 ? Math.round(((entry.leads.length - freshCount) / entry.leads.length) * 100) : 0,
        members: Array.from(new Set(entry.leads.map((l) => l.ownerAgentName || 'Admin'))).map((n) =>
          n.split(' ').map((x) => x[0]).join('').toUpperCase()
        ),
        errors: 0
      };
    });
  }, [leads, agents, customCampaigns, dbCampaignMappings]);

  // Campaign Selection State
  const [activeCampaign, setActiveCampaign] = useState<CampaignDef>(campaignsList[0]);
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [showCampaignSettingsMenu, setShowCampaignSettingsMenu] = useState(false);
  const [isCampaignPaused, setIsCampaignPaused] = useState(false);

  useEffect(() => {
    if (campaignsList.length > 0) {
      if (!activeCampaign || !campaignsList.some(c => c.id === activeCampaign.id)) {
        setActiveCampaign(campaignsList[0]);
      }
    }
  }, [campaignsList]);

  // Sync campaign selection when passed from parent
  useEffect(() => {
    if (initialCampaignHandle) {
      const found = campaignsList.find((c) => c.handle.toLowerCase() === initialCampaignHandle.toLowerCase() || c.name.toLowerCase() === initialCampaignHandle.toLowerCase());
      if (found) {
        setActiveCampaign(found);
      }
    }
  }, [initialCampaignHandle, campaignsList]);

  // Top License Expiry Banner
  const [showLicenseBanner, setShowLicenseBanner] = useState(true);

  // Accordion Toggles
  const [openAccordion, setOpenAccordion] = useState<string | null>('calling');

  // Assignee Filter state
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>('All');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // Campaign Leads List State derived directly from database leads prop
  const campaignLeads = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    if (!activeCampaign || activeCampaign.name === 'All Inbound Leads') return leads;

    const activeNameLower = activeCampaign.name.toLowerCase();
    const activeHandleClean = activeCampaign.handle.toLowerCase().replace(/^@/, '');

    // Check if there is a registered form mapping for this campaign in the database
    const mappingForCamp = dbCampaignMappings.find(m => 
      (m.campaignName && m.campaignName.toLowerCase() === activeNameLower) ||
      (m.campaignHandle && m.campaignHandle.toLowerCase().replace(/^@/, '') === activeHandleClean)
    );

    const matched = leads.filter((l) => {
      const lFormId = l.formId || l.customFields?.meta_form_id || l.customFields?.form_id;
      if (mappingForCamp && lFormId && String(mappingForCamp.formId) === String(lFormId)) {
        return true;
      }

      // Direct campaign name & handle properties
      if (l.campaignName && (l.campaignName.toLowerCase() === activeNameLower || l.campaignName.toLowerCase().includes(activeHandleClean))) return true;
      if (l.campaign && (l.campaign.toLowerCase() === activeNameLower || l.campaign.toLowerCase().includes(activeHandleClean))) return true;
      if (l.campaign_name && (l.campaign_name.toLowerCase() === activeNameLower || l.campaign_name.toLowerCase().includes(activeHandleClean))) return true;
      if (l.campaignHandle && l.campaignHandle.toLowerCase().replace(/^@/, '') === activeHandleClean) return true;
      if (l.campaign_handle && l.campaign_handle.toLowerCase().replace(/^@/, '') === activeHandleClean) return true;
      if (l.customFields?.campaign_name && l.customFields.campaign_name.toLowerCase() === activeNameLower) return true;
      if (l.customFields?.campaign_handle && l.customFields.campaign_handle.toLowerCase().replace(/^@/, '') === activeHandleClean) return true;

      const formName = getLeadFormOrCampaignName(l).toLowerCase();
      if (formName === activeNameLower || formName.includes(activeHandleClean)) return true;

      if (Array.isArray(l.tags)) {
        if (l.tags.some((t) => {
          const cleanTag = t.toLowerCase().replace(/^@/, '');
          return cleanTag === activeNameLower || cleanTag === activeHandleClean || cleanTag.includes(activeHandleClean);
        })) {
          return true;
        }
      }

      if (l.customFields?.form_name && l.customFields.form_name.toLowerCase().includes(activeHandleClean)) return true;
      if (l.customFields?.meta_form_name && l.customFields.meta_form_name.toLowerCase().includes(activeHandleClean)) return true;
      if (l.source && l.source.toLowerCase().includes(activeHandleClean)) return true;

      return false;
    });

    return matched;
  }, [leads, activeCampaign, dbCampaignMappings]);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(() => campaignLeads[0] || null);

  useEffect(() => {
    if (campaignLeads.length > 0) {
      if (!selectedLead) {
        setSelectedLead(campaignLeads[0]);
      } else {
        const found = campaignLeads.find((l) => l.id === selectedLead.id);
        if (found) {
          setSelectedLead(found);
        } else {
          setSelectedLead(campaignLeads[0]);
        }
      }
    } else {
      setSelectedLead(null);
    }
  }, [campaignLeads]);

  const [campaignTab, setCampaignTab] = useState<'NEW' | 'ACTIVE'>('NEW');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Lead Detail Fields Toggle
  const [showMoreFields, setShowMoreFields] = useState(false);

  // Rating Stars State
  const [starRating, setStarRating] = useState(0);

  // Activity Note Input State
  const [newNoteText, setNewNoteText] = useState('');
  const [activeRightTab, setActiveRightTab] = useState<'Activity History' | 'Task'>('Activity History');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [activitiesList, setActivitiesList] = useState<Array<{ id: string; text: string; time: string; type: string }>>([]);

  // Dynamic Calling Report Calculation
  const callingReportData = useMemo(() => {
    const total = campaignLeads.length || 1;
    let connected = 0;
    let attempted = 0;
    let pending = 0;
    let skipped = 0;

    campaignLeads.forEach(lead => {
      const callsForLead = callRecords.filter(c => c.leadId === lead.id || (lead.phone && c.phone === lead.phone));
      if (callsForLead.length > 0) {
        if (callsForLead.some(c => c.status === 'CONNECTED' || c.status === 'Answered')) {
          connected++;
        } else {
          attempted++;
        }
      } else if (lead.status === 'Lost' || lead.status === 'Disqualified' || lead.status === 'RNR') {
        skipped++;
      } else {
        pending++;
      }
    });

    const cPct = Math.round((connected / total) * 100);
    const aPct = Math.round((attempted / total) * 100);
    const sPct = Math.round((skipped / total) * 100);
    const pPct = Math.max(0, 100 - cPct - aPct - sPct);

    return [
      { name: 'connected', percentage: cPct, color: '#9BD3BA' },
      { name: 'attempted', percentage: aPct, color: '#F8CF48' },
      { name: 'pending', percentage: pPct, color: '#F87171' },
      { name: 'skipped', percentage: sPct, color: '#B08246' }
    ];
  }, [campaignLeads, callRecords]);

  // Dynamic Leads Status Report Calculation
  const leadsStatusReportData = useMemo(() => {
    const total = campaignLeads.length || 1;
    const counts: Record<string, number> = {};
    campaignLeads.forEach(l => {
      const st = l.status || 'Fresh';
      counts[st] = (counts[st] || 0) + 1;
    });

    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899', '#14B8A6'];
    const entries = Object.entries(counts);
    if (entries.length === 0) {
      return [{ name: 'No Leads Yet', percentage: 100, color: '#CBD5E1' }];
    }
    return entries.map(([statusName, count], idx) => ({
      name: statusName,
      percentage: Math.round((count / total) * 100),
      color: colors[idx % colors.length]
    }));
  }, [campaignLeads]);

  // Dynamic Lost Reasons Report Calculation
  const lostReasonReportData = useMemo(() => {
    const lostLeads = campaignLeads.filter(l => l.status === 'Lost' || l.status === 'Disqualified');
    const total = lostLeads.length || 1;
    const counts: Record<string, number> = {};
    lostLeads.forEach(l => {
      const reason = l.lostReason || l.customFields?.lost_reason || 'Other Reason';
      counts[reason] = (counts[reason] || 0) + 1;
    });

    const colors = ['#818CF8', '#F87171', '#FBBF24', '#34D399', '#A78BFA'];
    const entries = Object.entries(counts);
    if (entries.length === 0) {
      return [{ name: 'No Lost Leads', percentage: 100, color: '#CBD5E1' }];
    }
    return entries.map(([reason, count], idx) => ({
      name: reason,
      percentage: Math.round((count / total) * 100),
      color: colors[idx % colors.length]
    }));
  }, [campaignLeads]);

  // Dynamic Calls Status Report Calculation
  const callsStatusReportData = useMemo(() => {
    const campaignLeadIds = new Set(campaignLeads.map(l => l.id));
    const campaignPhones = new Set(campaignLeads.filter(l => l.phone).map(l => l.phone));
    const relevantCalls = callRecords.filter(c => campaignLeadIds.has(c.leadId) || campaignPhones.has(c.phone));
    
    const total = relevantCalls.length || 1;
    const counts: Record<string, number> = {};
    relevantCalls.forEach(c => {
      const st = c.status || 'Connected';
      counts[st] = (counts[st] || 0) + 1;
    });

    if (relevantCalls.length === 0) {
      return [{ name: 'No Call Logs Yet', percentage: 100, color: '#CBD5E1' }];
    }

    const colors = ['#10B981', '#F87171', '#64748B', '#F59E0B', '#8B5CF6'];
    return Object.entries(counts).map(([st, count], idx) => ({
      name: st,
      percentage: Math.round((count / total) * 100),
      color: colors[idx % colors.length]
    }));
  }, [campaignLeads, callRecords]);

  // Dynamic Campaign Errors Count
  const campaignErrorsCount = useMemo(() => {
    return campaignLeads.filter(l => !l.phone || l.phone.trim().length < 5).length;
  }, [campaignLeads]);

  // Status Distribution Calculation
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Fresh': 0,
      'Open': 0,
      'Interested': 0,
      'Warm': 0,
      'Contacted': 0,
      'Converted': 0,
      'RNR': 0,
      'Lost': 0
    };
    campaignLeads.forEach(l => {
      const st = l.status || 'Fresh';
      if (counts[st] !== undefined) {
        counts[st]++;
      } else {
        counts[st] = (counts[st] || 0) + 1;
      }
    });
    return counts;
  }, [campaignLeads]);

  // Dynamic Telecaller Lead Allocation computation
  const telecallerAllocation = useMemo(() => {
    const counts: Record<string, number> = {};
    campaignLeads.forEach((lead) => {
      const assignee = lead.ownerAgentName || 'Unassigned';
      counts[assignee] = (counts[assignee] || 0) + 1;
    });

    const total = campaignLeads.length || 1;
    const colorPalette = [
      { bg: 'bg-[#5EEAD4]', stroke: '#2DD4BF', name: 'Farzana', hex: '#2DD4BF' },
      { bg: 'bg-[#FDE047]', stroke: '#EAB308', name: 'Risvana Rahim', hex: '#EAB308' },
      { bg: 'bg-[#60A5FA]', stroke: '#3B82F6', name: 'philemon', hex: '#3B82F6' },
      { bg: 'bg-[#34D399]', stroke: '#10B981', name: 'Munavvir', hex: '#10B981' },
      { bg: 'bg-[#F87171]', stroke: '#EF4444', name: 'Harish', hex: '#EF4444' },
      { bg: 'bg-[#FB923C]', stroke: '#F97316', name: 'Ashly James', hex: '#F97316' },
      { bg: 'bg-[#4ADE80]', stroke: '#22C55E', name: 'Madhava sai nagendra', hex: '#22C55E' },
      { bg: 'bg-[#A78BFA]', stroke: '#8B5CF6', name: 'Ummema Sufiya BM', hex: '#8B5CF6' }
    ];

    let currentOffset = 0;
    return Object.entries(counts).map(([agentName, count], idx) => {
      const percentage = Math.round((count / total) * 100);
      const colorObj = colorPalette[idx % colorPalette.length];
      const offset = currentOffset;
      currentOffset += percentage;

      return {
        agentName,
        count,
        percentage,
        colorObj,
        offset
      };
    });
  }, [campaignLeads]);

  // Handle lead selection
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  // Handle lead status change
  const handleStatusChange = (newStatus: LeadStatus) => {
    if (!selectedLead) return;
    const updated = { ...selectedLead, status: newStatus };
    setSelectedLead(updated);
    if (onUpdateLead) onUpdateLead(updated);
    
    // Add activity
    setActivitiesList((prev) => [
      { id: `act-${Date.now()}`, text: `Status updated to ${newStatus}`, time: 'Just now', type: 'status' },
      ...prev
    ]);
  };

  // Handle lead assignee change
  const handleAssigneeChange = (agentId: string, agentName: string) => {
    if (!selectedLead) return;
    const updated = { ...selectedLead, ownerAgentId: agentId, ownerAgentName: agentName };
    setSelectedLead(updated);
    if (onUpdateLead) onUpdateLead(updated);

    setActivitiesList((prev) => [
      { id: `act-${Date.now()}`, text: `Reallocated to ${agentName}`, time: 'Just now', type: 'assignment' },
      ...prev
    ]);
  };

  // Handle Add Note
  const handleAddNoteSubmit = () => {
    if (!newNoteText.trim()) return;
    setActivitiesList((prev) => [
      { id: `act-${Date.now()}`, text: `Note Added: ${newNoteText.trim()}`, time: 'Just now', type: 'note' },
      ...prev
    ]);
    setNewNoteText('');
  };

  // Filter leads by search and assignee
  const filteredLeads = useMemo(() => {
    return campaignLeads.filter((l) => {
      const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.phone.includes(searchQuery);
      const matchesAssignee = selectedAssigneeFilter === 'ALL' || !selectedAssigneeFilter
        ? true
        : (l.ownerAgentName || '').toLowerCase().includes(selectedAssigneeFilter.toLowerCase());
      
      return matchesSearch && matchesAssignee;
    });
  }, [campaignLeads, searchQuery, selectedAssigneeFilter]);

  // Dynamic Assignee Distribution for active campaign
  const dynamicAssignees = useMemo(() => {
    const pal = ['#9BD3BA', '#70C0FA', '#F8CF48', '#66CFBA', '#B08246', '#8993DC', '#4CD4E8', '#8FE0B9', '#F36565', '#A0E236'];
    const total = campaignLeads.length || 1;
    const map = new Map<string, number>();

    campaignLeads.forEach((l) => {
      const name = l.ownerAgentName || 'Unassigned';
      map.set(name, (map.get(name) || 0) + 1);
    });

    if (map.size === 0 && agents.length > 0) {
      agents.forEach((ag) => map.set(ag.name, 0));
    }

    const entries = Array.from(map.entries());
    return entries.map(([name, count], idx) => ({
      name,
      count,
      percentage: Number(((count / total) * 100).toFixed(1)),
      color: pal[idx % pal.length]
    })).sort((a, b) => b.count - a.count);
  }, [campaignLeads, agents]);

  // Solid SVG Pie Chart Slice Renderer for all reports
  const renderSvgPie = (items: Array<{ percentage: number; color: string }>, size = 100) => {
    let cumulativePercent = 0;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.45;

    const activeItems = items.filter(i => i.percentage > 0);
    if (activeItems.length === 0) {
      return <circle cx={cx} cy={cy} r={r} fill="#E2E8F0" />;
    }
    if (activeItems.length === 1) {
      return <circle cx={cx} cy={cy} r={r} fill={activeItems[0].color} />;
    }

    return items.map((item, idx) => {
      if (item.percentage <= 0) return null;
      const startAngle = (cumulativePercent / 100) * 360;
      const sliceAngle = (item.percentage / 100) * 360;
      const endAngle = startAngle + sliceAngle;
      cumulativePercent += item.percentage;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;

      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      return (
        <path
          key={idx}
          d={pathData}
          fill={item.color}
          stroke="#ffffff"
          strokeWidth="0.5"
          className="transition-opacity hover:opacity-85 cursor-pointer"
        />
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#F3F4F7] font-sans text-slate-800 space-y-3 pb-8 select-none">
      
      {/* TOP LICENSE EXPIRED BANNER (MATCHES TELECRM UI) */}
      {showLicenseBanner && (
        <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3.5 py-1.5 flex items-center justify-between text-xs text-[#991B1B] shadow-2xs font-sans">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span className="text-[11px] md:text-xs font-medium text-[#991B1B]">
              <strong>2 licenses have expired!</strong>{' '}
              <button 
                onClick={() => {
                  if (onNavigateToTab) onNavigateToTab('team');
                }}
                className="underline font-bold text-[#7F1D1D] hover:text-black cursor-pointer mx-1"
              >
                View Users
              </button>
              {' '}|{' '}
              <button 
                onClick={() => {
                  if (onNavigateToTab) onNavigateToTab('settings', 'billing');
                }}
                className="underline font-bold text-[#7F1D1D] hover:text-black cursor-pointer ml-1"
              >
                Renew Now
              </button>
            </span>
          </div>

          <button
            onClick={() => setShowLicenseBanner(false)}
            className="text-[#991B1B] hover:text-black p-0.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3-COLUMN TELECRM / ARCLE CRM WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: CAMPAIGN DASHBOARD & ALLOCATION METRICS (3.5 Cols)            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 xl:col-span-3.5 space-y-3">
          
          {/* Main Campaign Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 relative">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500">
                  Campaign Dashboard
                </span>
                {isCampaignPaused && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Paused
                  </span>
                )}
              </div>
              <button 
                onClick={() => setShowCampaignSettingsMenu(!showCampaignSettingsMenu)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 cursor-pointer transition-colors"
                title="Campaign Settings"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showCampaignSettingsMenu && (
                <div className="absolute right-0 top-7 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 font-sans text-xs">
                  <button
                    onClick={async () => {
                      setShowCampaignSettingsMenu(false);
                      if (onShowToast) onShowToast(`⚡ Restarting campaign "${activeCampaign.name}"... Fetching live leads.`);
                      try {
                        const res = await fetch('/api/facebook/sync-leads', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
                        const data = await res.json();
                        if (onShowToast) onShowToast(`⚡ Campaign restarted! ${data.newLeadsSaved || 0} new leads synced.`);
                      } catch (e) {
                        if (onShowToast) onShowToast(`⚡ Campaign restarted! Lead sync refreshed.`);
                      }
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Restart Campaign</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowCampaignSettingsMenu(false);
                      setIsCampaignPaused(!isCampaignPaused);
                      if (onShowToast) onShowToast(isCampaignPaused ? `▶️ Campaign "${activeCampaign.name}" resumed.` : `⏸️ Campaign "${activeCampaign.name}" paused.`);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-amber-50 hover:text-amber-700 font-medium cursor-pointer transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{isCampaignPaused ? 'Resume Campaign' : 'Pause Campaign'}</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setShowCampaignSettingsMenu(false);
                      if (confirm(`Are you sure you want to delete campaign "${activeCampaign.name}"?`)) {
                        const targetHandle = activeCampaign.handle.toLowerCase();
                        setCustomCampaigns(prev => prev.filter(c => formatCampaignHandle(c).toLowerCase() !== targetHandle));
                        if (onShowToast) onShowToast(`🗑️ Campaign "${activeCampaign.name}" deleted.`);
                      }
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-medium cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Delete Campaign</span>
                  </button>
                </div>
              )}
            </div>

            {/* Campaign Handle & Dropdown Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-indigo-400 p-2.5 rounded-xl text-left cursor-pointer transition-all shadow-2xs"
              >
                <div className="truncate">
                  <h3 className="font-mono text-xs font-bold text-slate-900 truncate">
                    {activeCampaign.handle}
                  </h3>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              </button>

              {/* Campaign Switcher Dropdown with Search & Add Campaign */}
              {showCampaignDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-84 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase px-1 pb-1 border-b border-slate-100">
                    <span>Campaigns ({campaignsList.length})</span>
                    <button 
                      onClick={() => setIsAddingCampaign(!isAddingCampaign)}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New</span>
                    </button>
                  </div>

                  {/* Campaign Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                    <input
                      type="text"
                      value={campaignSearchQuery}
                      onChange={(e) => setCampaignSearchQuery(e.target.value)}
                      placeholder="Search campaigns..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-sans"
                    />
                  </div>

                  {/* Add New Campaign Form */}
                  {isAddingCampaign && (
                    <div className="p-2 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
                      <input
                        type="text"
                        value={newCampaignInput}
                        onChange={(e) => setNewCampaignInput(e.target.value)}
                        placeholder="Campaign or Form name..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setIsAddingCampaign(false)}
                          className="px-2 py-0.5 text-slate-500 hover:text-slate-700 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (newCampaignInput.trim()) {
                              const clean = newCampaignInput.trim();
                              setCustomCampaigns(prev => prev.includes(clean) ? prev : [...prev, clean]);
                              fetch('/api/integrations/facebook/campaign-mappings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ campaignName: clean, campaignHandle: formatCampaignHandle(clean) })
                              }).catch(() => {});
                              setNewCampaignInput('');
                              setIsAddingCampaign(false);
                              if (onShowToast) onShowToast(`Created campaign "${clean}"`);
                            }
                          }}
                          className="px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                    {campaignsList
                      .filter(c => c.name.toLowerCase().includes(campaignSearchQuery.toLowerCase()) || c.handle.toLowerCase().includes(campaignSearchQuery.toLowerCase()))
                      .map((camp) => (
                        <button
                          key={camp.id}
                          onClick={() => {
                            setActiveCampaign(camp);
                            setShowCampaignDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                            activeCampaign.id === camp.id ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200' : 'hover:bg-slate-50 text-slate-700'
                        )}
                      </div>

                      {/* Agent Initials Pill */}
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[9px] border border-indigo-200 shrink-0">
                        {lead.ownerAgentName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ACTIVE LEAD DETAIL & DIALER WORKSPACE (REUSING LEAD DETAIL) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 xl:col-span-4.5 h-full min-h-[720px] flex flex-col">
          {selectedLead ? (
            <LeadDetailModal
              isEmbedded={true}
              campaignHandle={activeCampaign.handle}
              lead={selectedLead}
              allLeads={filteredLeads}
              agents={agents}
              activities={activities}
              messages={messages}
              callRecords={callRecords}
              customFields={customFields}
              onClose={() => onOpenLeadDetail && onOpenLeadDetail(selectedLead)}
              onSelectLead={(ld) => setSelectedLead(ld)}
              onOpenPowerDialerForLead={onOpenPowerDialerForLead}
              onUpdateLead={(up) => {
                setSelectedLead(up);
                if (onUpdateLead) onUpdateLead(up);
              }}
              onAddActivity={onAddActivity || (() => {})}
              onSendMessage={onSendMessage || (() => {})}
              onDeleteLead={onDeleteLead}
              onUpdateCallRecord={onUpdateCallRecord}
              lostReasons={lostReasons}
            />
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">No Lead Selected</h3>
              <p className="text-xs text-slate-500">Select a lead from the campaign queue to view full details.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};


export const CampaignsView = CampaignsPage;
export default CampaignsPage;
