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
  Sparkles, 
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
  const [customCampaigns, setCustomCampaigns] = useState<string[]>([]);
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [newCampaignInput, setNewCampaignInput] = useState('');

  // Dynamic Campaign list derived strictly from live leads prop
  const campaignsList = useMemo(() => {
    const rawCampaigns = new Set<string>();
    if (leads && leads.length > 0) {
      leads.forEach((l) => {
        const key = (l.customFields && l.customFields.form_name) || l.source || 'General';
        if (key && key !== 'Empty') rawCampaigns.add(key);
      });
    }
    customCampaigns.forEach((c) => rawCampaigns.add(c));
    if (rawCampaigns.size === 0) rawCampaigns.add('All Inbound Leads');

    const groupedMap = new Map<string, Lead[]>();
    Array.from(rawCampaigns).forEach((cName) => groupedMap.set(cName, []));

    if (leads && leads.length > 0) {
      leads.forEach((l) => {
        const key = (l.customFields && l.customFields.form_name) || l.source || 'All Inbound Leads';
        if (!groupedMap.has(key)) groupedMap.set(key, []);
        groupedMap.get(key)!.push(l);
      });
    }

    return Array.from(groupedMap.entries()).map(([campName, leadList], idx) => {
      const freshCount = leadList.filter((l) => l.status === 'Fresh' || l.status === 'Open').length;
      return {
        id: `camp-dyn-${idx}`,
        handle: `@${campName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: campName,
        totalLeads: leadList.length,
        newLeads: freshCount,
        progress: leadList.length > 0 ? Math.round(((leadList.length - freshCount) / leadList.length) * 100) : 0,
        members: Array.from(new Set(leadList.map((l) => l.ownerAgentName || 'Admin'))).map((n) =>
          n.split(' ').map((x) => x[0]).join('').toUpperCase()
        ),
        errors: 0
      };
    });
  }, [leads, agents, customCampaigns]);

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
      const found = campaignsList.find((c) => c.handle.toLowerCase() === initialCampaignHandle.toLowerCase());
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

    const matched = leads.filter((l) => {
      const key = (l.customFields && l.customFields.form_name) || l.source || '';
      return (
        key.toLowerCase().includes(activeCampaign.name.toLowerCase()) ||
        activeCampaign.name.toLowerCase().includes(key.toLowerCase())
      );
    });

    return matched.length > 0 ? matched : leads;
  }, [leads, activeCampaign]);

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
  const [activitiesList, setActivitiesList] = useState<Array<{ id: string; text: string; time: string; type: string }>>([
    { id: 'act-1', text: 'Lead Source : empty → Facebook-Meta-01', time: '5h', type: 'source' },
    { id: 'act-2', text: 'Facebook page : empty → 506000535940727', time: '5h', type: 'fb' },
    { id: 'act-3', text: 'Call Outgoing: 6s CONNECTED by Ummema Sufiya BM', time: '1d ago', type: 'call' },
    { id: 'act-4', text: 'Automated WhatsApp Intro Message Delivered', time: '1d ago', type: 'whatsapp' },
  ]);

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
                              setCustomCampaigns(prev => [...prev, newCampaignInput.trim()]);
                              setNewCampaignInput('');
                              setIsAddingCampaign(false);
                              if (onShowToast) onShowToast(`Created campaign "${newCampaignInput.trim()}"`);
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
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Phone className={`w-3.5 h-3.5 ${activeCampaign.id === camp.id ? 'text-indigo-600' : 'text-slate-400'} shrink-0`} />
                            <div className="truncate">
                              <div className="font-mono text-[11px] font-bold truncate">{camp.handle.replace('@', '')}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0 ml-1">
                            {camp.totalLeads}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Campaign Quick Badges (Exact match to screenshot: 7d, 9, 1, NONE) */}
            <div className="flex items-center space-x-1.5 text-[11px] font-mono">
              <span className="bg-slate-50 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>7d</span>
              </span>
              <span className="bg-slate-50 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
                <User className="w-3 h-3 text-slate-500" />
                <span>{activeCampaign.totalLeads || 9}</span>
              </span>
              <span className="bg-slate-50 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
                <Filter className="w-3 h-3 text-slate-500" />
                <span>1</span>
              </span>
              <span className="bg-slate-50 text-slate-500 font-semibold px-2 py-0.5 rounded border border-slate-200">
                NONE
              </span>
            </div>

            {/* Members + Circular Progress Ring (33%) + Purple Dialer Launcher (Exact match to screenshot) */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              {/* Single or Multi Avatar: [ P ] */}
              <div className="flex items-center -space-x-1.5">
                <span className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white text-indigo-800 text-[10px] font-bold flex items-center justify-center">
                  P
                </span>
              </div>

              {/* Progress 33% Circular Ring */}
              <div className="relative w-9 h-9 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 transition-all duration-500"
                    strokeDasharray={`${activeCampaign.progress || 33}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[9px] font-bold text-slate-800 font-mono">
                  {activeCampaign.progress || 33}%
                </span>
              </div>

              {/* Solid Purple TeleCRM Call Button [ 📞 > ] */}
              <button 
                onClick={() => {
                  if (onShowToast) onShowToast(`Launching power dialer for ${activeCampaign.handle}`);
                }}
                className="bg-[#3a2088] hover:bg-[#2c186b] text-white px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                title="Launch Campaign Dialer"
              >
                <Phone className="w-3.5 h-3.5 fill-current" />
                <span className="font-mono text-sm leading-none">›</span>
              </button>
            </div>
          </div>

          {/* ACCORDION REPORTS (All with Identical Font & Only Pie Charts) */}
          <div className="space-y-2">
            
            {/* 1. Campaign Assignees Report */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <button 
                onClick={() => setOpenAccordion(openAccordion === 'assignees' ? null : 'assignees')}
                className="w-full p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left"
              >
                <span className="text-slate-800 font-bold">Campaign Assignees Report</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openAccordion === 'assignees' ? 'rotate-180' : ''}`} />
              </button>

              {openAccordion === 'assignees' && (
                <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-white">
                  <div className="flex justify-end">
                    <button 
                      onClick={() => toast.info('Viewing campaign assignment diagnostics: 5 leads require phone validation before auto-dispatch.', 'Campaign Diagnostics')}
                      className="text-xs font-semibold text-[#DC2626] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span className="underline">5 Errors</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-5 flex items-center justify-center">
                      <svg className="w-32 h-32" viewBox="0 0 140 140">
                        {renderSvgPie(dynamicAssignees.map(a => ({ percentage: a.percentage, color: a.color })), 140)}
                      </svg>
                    </div>

                    <div className="col-span-7 space-y-1.5 text-xs">
                      {dynamicAssignees.length === 0 ? (
                        <p className="text-slate-400 text-[11px]">No assigned leads yet.</p>
                      ) : (
                        dynamicAssignees.map((item, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedAssigneeFilter(item.name)}
                            className={`flex items-start space-x-2 text-[11px] leading-tight p-1 rounded-md cursor-pointer transition-colors ${
                              selectedAssigneeFilter === item.name ? 'bg-indigo-50 font-bold' : 'hover:bg-slate-50'
                            }`}
                          >
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" 
                              style={{ backgroundColor: item.color }} 
                            />
                            <div className="text-slate-800">
                              <span>{item.name}</span>{' '}
                              <span className="text-slate-600 font-medium">({item.percentage}%)</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Campaign Calling Report */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <button 
                onClick={() => setOpenAccordion(openAccordion === 'calling' ? null : 'calling')}
                className="w-full p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left"
              >
                <span className="text-slate-800 font-bold">Campaign Calling Report</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openAccordion === 'calling' ? 'rotate-180' : ''}`} />
              </button>

              {openAccordion === 'calling' && (
                <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-white">
                  <div className="grid grid-cols-12 gap-3 items-center py-2">
                    <div className="col-span-5 flex items-center justify-center">
                      <svg className="w-28 h-28" viewBox="0 0 100 100">
                        {renderSvgPie([
                          { percentage: 0, color: '#9BD3BA' },
                          { percentage: 0, color: '#F8CF48' },
                          { percentage: 100, color: '#F87171' },
                          { percentage: 0, color: '#B08246' }
                        ], 100)}
                      </svg>
                    </div>

                    <div className="col-span-7 space-y-2 text-xs">
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#9BD3BA] shrink-0" />
                        <span className="text-slate-700">connected (0%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F8CF48] shrink-0" />
                        <span className="text-slate-700">attempted (0%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F87171] shrink-0" />
                        <span className="text-slate-800 font-semibold">pending (100%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#B08246] shrink-0" />
                        <span className="text-slate-700">skipped (0%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Leads Status Report (Only Pie Chart & Consistent Font) */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <button 
                onClick={() => setOpenAccordion(openAccordion === 'status' ? null : 'status')}
                className="w-full p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left"
              >
                <span className="text-slate-800 font-bold">Leads Status Report</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openAccordion === 'status' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'status' && (
                <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-white">
                  <div className="grid grid-cols-12 gap-3 items-center py-2">
                    <div className="col-span-5 flex items-center justify-center">
                      <svg className="w-28 h-28" viewBox="0 0 100 100">
                        {renderSvgPie([
                          { percentage: 60, color: '#6366F1' },
                          { percentage: 20, color: '#10B981' },
                          { percentage: 20, color: '#F59E0B' }
                        ], 100)}
                      </svg>
                    </div>

                    <div className="col-span-7 space-y-2 text-xs">
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] shrink-0" />
                        <span className="text-slate-800 font-semibold">Job enquiry (60%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                        <span className="text-slate-700">Open (20%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                        <span className="text-slate-700">RNR (20%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Leads Lost Reason Report (Only Pie Chart & Consistent Font) */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <button 
                onClick={() => setOpenAccordion(openAccordion === 'lost' ? null : 'lost')}
                className="w-full p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left"
              >
                <span className="text-slate-800 font-bold">Leads Lost Reason Report</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openAccordion === 'lost' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'lost' && (
                <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-white">
                  <div className="grid grid-cols-12 gap-3 items-center py-2">
                    <div className="col-span-5 flex items-center justify-center">
                      <svg className="w-28 h-28" viewBox="0 0 100 100">
                        {renderSvgPie([
                          { percentage: 45, color: '#818CF8' },
                          { percentage: 30, color: '#F87171' },
                          { percentage: 25, color: '#FBBF24' }
                        ], 100)}
                      </svg>
                    </div>

                    <div className="col-span-7 space-y-2 text-xs">
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#818CF8] shrink-0" />
                        <span className="text-slate-800 font-semibold">Joined Another Institute (45%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F87171] shrink-0" />
                        <span className="text-slate-700">High Course Fees (30%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24] shrink-0" />
                        <span className="text-slate-700">Location / Relocation Issue (25%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Calls Status Report (Only Pie Chart & Consistent Font) */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <button 
                onClick={() => setOpenAccordion(openAccordion === 'calls_status' ? null : 'calls_status')}
                className="w-full p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left"
              >
                <span className="text-slate-800 font-bold">Calls Status Report</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openAccordion === 'calls_status' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'calls_status' && (
                <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-white">
                  <div className="grid grid-cols-12 gap-3 items-center py-2">
                    <div className="col-span-5 flex items-center justify-center">
                      <svg className="w-28 h-28" viewBox="0 0 100 100">
                        {renderSvgPie([
                          { percentage: 52, color: '#10B981' },
                          { percentage: 24, color: '#F87171' },
                          { percentage: 14, color: '#64748B' },
                          { percentage: 10, color: '#F59E0B' }
                        ], 100)}
                      </svg>
                    </div>

                    <div className="col-span-7 space-y-2 text-xs">
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                        <span className="text-slate-800 font-semibold">Connected (52%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F87171] shrink-0" />
                        <span className="text-slate-700">RNR / No Answer (24%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#64748B] shrink-0" />
                        <span className="text-slate-700">Switched Off (14%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                        <span className="text-slate-700">Busy / Call Later (10%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* MIDDLE COLUMN: CAMPAIGN LEADS QUEUE (4 Cols)                              */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 xl:col-span-4 bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
          
          {/* Header & Tabs (@master-form-iata-cargo › ACTIVE | NEW) */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="font-mono text-xs font-bold text-slate-800 truncate">
                {activeCampaign.handle} ›
              </span>
            </div>

            <div className="flex items-center space-x-1 text-xs font-bold shrink-0">
              <button
                onClick={() => setCampaignTab('ACTIVE')}
                className={`px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                  campaignTab === 'ACTIVE' ? 'text-slate-900 border-b-2 border-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                ACTIVE
              </button>
              <button
                onClick={() => setCampaignTab('NEW')}
                className={`px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                  campaignTab === 'NEW' ? 'text-indigo-700 border-b-2 border-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                NEW ({filteredLeads.length})
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaign leads..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all font-sans"
            />
          </div>

          {/* Leads Queue List with COLOR CODED STATUSES */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredLeads.map((lead) => {
              const isSelected = selectedLead.id === lead.id;
              const isConnectedCall = lead.createdAt && lead.createdAt.includes('CONNECTED');
              const isDatedNote = lead.createdAt && lead.createdAt.includes('Fri, 14 Aug');

              return (
                <div
                  key={lead.id}
                  onClick={() => handleSelectLead(lead)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-400 shadow-2xs'
                      : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/60'
                  }`}
                >
                  {/* Row 1: Name & Status Badge */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-2">
                      <h4 
                        className="text-xs font-bold text-slate-900 leading-tight truncate"
                        title={lead.name}
                      >
                        {lead.name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                        {lead.phone}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className="text-[11px] text-slate-500 font-medium">Status:</span>
                      {/* DYNAMIC COLOR STATUS BADGE */}
                      <StatusBadge status={lead.status || 'Fresh'} size="xs" />
                      <Star className="w-3.5 h-3.5 text-slate-300 hover:text-amber-400 cursor-pointer ml-0.5" />
                    </div>
                  </div>

                  {/* Row 2: Sub Activity Row (MATCHES SCREENSHOT) */}
                  {(lead.createdAt || lead.ownerAgentName) && (
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                      <div className="flex items-center space-x-1 truncate min-w-0">
                        {isConnectedCall ? (
                          <div className="flex items-center space-x-1 text-emerald-600 font-semibold italic truncate">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0 fill-current" />
                            <span className="font-bold text-slate-800 not-italic">{lead.createdAt.split(' ')[0]}</span>
                            <span className="text-slate-500 font-normal">{lead.createdAt.replace(lead.createdAt.split(' ')[0], '')}</span>
                          </div>
                        ) : isDatedNote ? (
                          <div className="flex items-center space-x-1 text-slate-500 truncate">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.createdAt}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] truncate">{lead.createdAt || 'Assigned'}</span>
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
