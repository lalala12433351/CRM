import React, { useState, useContext } from 'react';
import { 
  X, 
  PhoneCall, 
  MessageSquare, 
  Mail, 
  Calendar, 
  Sparkles, 
  Clock, 
  Send, 
  Bot, 
  CheckCircle2, 
  Edit3, 
  UserCheck, 
  RefreshCw, 
  Trash2, 
  Save, 
  Check, 
  BellRing,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Star,
  Copy,
  Plus,
  Filter,
  MoreVertical,
  Bell,
  MapPin,
  Building,
  Tag,
  Zap,
  Phone,
  FileText,
  Target,
  ShieldAlert,
  ShieldCheck,
  Share2,
  ExternalLink,
  Layers,
  Globe,
  Radio,
  AlertTriangle,
  ArrowUpRight,
  Facebook,
  Pin,
  Clipboard,
  Type,
  Users,
  AtSign,
  CheckSquare,
  MessageCircle,
  Search,
  Paperclip,
  IndianRupee,
  PhoneOutgoing
} from 'lucide-react';
import { Lead, ActivityLog, WhatsAppMessage, CallRecord, Agent, LeadStatus } from '../types';
import { calculateLeadQualityScore } from '../utils/conversionEngine';
import { CallRecordingPlayer } from './CallRecordingPlayer';
import { StatusBadge } from './StatusBadge';
import { getStatusStyle } from '../utils/statusStyles';
import { StagesContext } from '../App';

interface LeadDetailModalProps {
  lead: Lead | null;
  allLeads?: Lead[];
  agents: Agent[];
  activities: ActivityLog[];
  messages: WhatsAppMessage[];
  callRecords: CallRecord[];
  onClose: () => void;
  onSelectLead?: (lead: Lead) => void;
  onOpenPowerDialerForLead?: (lead: Lead) => void;
  onUpdateLead: (updated: Lead) => void;
  onAddActivity: (activity: Partial<ActivityLog>) => void;
  onSendMessage: (leadId: string, text: string) => void;
  onDeleteLead?: (leadId: string) => void;
  onUpdateCallRecord?: (callId: string, updates: Partial<CallRecord>) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  allLeads = [],
  agents,
  activities,
  messages,
  callRecords,
  onClose,
  onSelectLead,
  onOpenPowerDialerForLead,
  onUpdateLead,
  onAddActivity,
  onSendMessage,
  onDeleteLead,
  onUpdateCallRecord,
}) => {
  if (!lead) return null;

  const stages = useContext(StagesContext);
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'whatsapp' | 'calls' | 'notes' | 'attribution'>('timeline');
  const [whatsAppText, setWhatsAppText] = useState('');
  const [noteText, setNoteText] = useState(lead.notes || '');
  const [followUpDate, setFollowUpDate] = useState(lead.followUpAt?.slice(0, 16) || '');
  const [generatingAiResponse, setGeneratingAiResponse] = useState(false);
  const [recalculatingScore, setRecalculatingScore] = useState(false);
  const [callRemarksState, setCallRemarksState] = useState<Record<string, string>>({});
  const [savedRemarksCallId, setSavedRemarksCallId] = useState<string | null>(null);
  
  // Conversion & Attribution Dispatch States
  const [dispatchingConversion, setDispatchingConversion] = useState(false);
  const [conversionSuccessMsg, setConversionSuccessMsg] = useState<string | null>(null);
  const [copiedGclid, setCopiedGclid] = useState(false);
  const [copiedFbclid, setCopiedFbclid] = useState(false);
  
  // Slide-over drawer expand states
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'call' | 'note' | 'whatsapp' | 'stage_change'>('ALL');
  const [showAddActionMenu, setShowAddActionMenu] = useState(false);
  const [actionMenuSearch, setActionMenuSearch] = useState('');
  const [activeActionType, setActiveActionType] = useState<'email' | 'file' | 'note' | 'call' | 'payment' | 'sms' | 'task' | 'whatsapp' | null>(null);

  // Action Composer Form Input States
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [callDisposition, setCallDisposition] = useState('Connected');
  const [callNotes, setCallNotes] = useState('');
  const [callDuration, setCallDuration] = useState('2 min');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [smsText, setSmsText] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Submit Handlers for Actions
  const handleSendEmailAction = () => {
    if (!emailSubject.trim() && !emailBody.trim()) return;
    onAddActivity({
      leadId: lead.id,
      type: 'note',
      title: `Email: ${emailSubject || 'Sent Email'}`,
      description: emailBody || 'Email delivered to recipient inbox.'
    });
    setEmailSubject('');
    setEmailBody('');
    setActiveActionType(null);
  };

  const handleUploadFileAction = () => {
    if (!fileTitle.trim()) return;
    onAddActivity({
      leadId: lead.id,
      type: 'note',
      title: `File Uploaded: ${fileTitle}`,
      description: `Document attached to lead files repository.`
    });
    setFileTitle('');
    setActiveActionType(null);
  };

  const handleSaveNoteAction = () => {
    if (!actionNote.trim()) return;
    onAddActivity({
      leadId: lead.id,
      type: 'note',
      title: `Internal Note`,
      description: actionNote
    });
    setActionNote('');
    setActiveActionType(null);
  };

  const handleLogCallAction = () => {
    onAddActivity({
      leadId: lead.id,
      type: 'call',
      title: `Outgoing Call - ${callDisposition}`,
      description: `Duration: ${callDuration}. Remarks: ${callNotes || 'Call logged'}`
    });
    setCallNotes('');
    setActiveActionType(null);
  };

  const handleSendPaymentAction = () => {
    if (!paymentAmount) return;
    onAddActivity({
      leadId: lead.id,
      type: 'note',
      title: `Payment Link Generated: ₹${paymentAmount}`,
      description: `Description: ${paymentDescription || 'Course Fee / Quote'}. Direct Payment link sent via SMS & WhatsApp.`
    });
    setPaymentAmount('');
    setPaymentDescription('');
    setActiveActionType(null);
  };

  const handleSendSmsAction = () => {
    if (!smsText.trim()) return;
    onAddActivity({
      leadId: lead.id,
      type: 'note',
      title: `SMS Dispatched`,
      description: smsText
    });
    setSmsText('');
    setActiveActionType(null);
  };

  const handleScheduleTaskAction = () => {
    if (!taskTitle.trim()) return;
    onUpdateLead({
      ...lead,
      followUpAt: taskDueDate || undefined,
      status: 'Follow Up',
      updatedAt: new Date().toISOString()
    });
    onAddActivity({
      leadId: lead.id,
      type: 'note',
      title: `Task Scheduled: ${taskTitle}`,
      description: `Due Date: ${taskDueDate || 'Today'}. Assigned to active team representative.`
    });
    setTaskTitle('');
    setTaskDueDate('');
    setActiveActionType(null);
  };

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showCampaignMenu, setShowCampaignMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);

  // Edit Lead State
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  const handleStartEdit = () => {
    setEditForm({
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      company: lead.company || '',
      city: lead.city || '',
      state: lead.state || '',
      source: lead.source || 'Website Form',
      status: lead.status || 'New Lead',
      aiRating: lead.aiRating || 'Warm',
      dealValue: lead.dealValue || 0,
      ownerAgentId: lead.ownerAgentId || '',
      ownerAgentName: lead.ownerAgentName || '',
      batch: lead.batch || lead.customFields?.batch || '',
      altPhone: lead.altPhone || '',
      address: lead.address || '',
      age: lead.age || '',
      dateOfJoining: lead.dateOfJoining || '',
      notes: lead.notes || ''
    });
    setIsEditingLead(true);
  };

  const handleSaveLeadEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedAgent = agents.find(a => a.id === editForm.ownerAgentId);
    const updated: Lead = {
      ...lead,
      name: editForm.name || lead.name,
      phone: editForm.phone || lead.phone,
      email: editForm.email || lead.email,
      company: editForm.company || lead.company,
      city: editForm.city || lead.city,
      state: editForm.state || lead.state,
      source: (editForm.source as any) || lead.source,
      status: (editForm.status as any) || lead.status,
      aiRating: (editForm.aiRating as any) || lead.aiRating,
      dealValue: Number(editForm.dealValue) || 0,
      ownerAgentId: editForm.ownerAgentId || lead.ownerAgentId,
      ownerAgentName: selectedAgent ? selectedAgent.name : (editForm.ownerAgentName || lead.ownerAgentName),
      batch: editForm.batch || lead.batch,
      altPhone: editForm.altPhone || lead.altPhone,
      address: editForm.address || lead.address,
      age: editForm.age || lead.age,
      dateOfJoining: editForm.dateOfJoining || lead.dateOfJoining,
      notes: editForm.notes !== undefined ? editForm.notes : lead.notes,
      updatedAt: new Date().toISOString()
    };

    onUpdateLead(updated);
    onAddActivity({
      leadId: lead.id,
      type: 'note',
      title: 'Lead Information Updated',
      description: `Updated lead details for ${updated.name}`
    });
    setIsEditingLead(false);
  };

  const handleCallLead = () => {
    window.location.href = `tel:${lead.phone}`;
    onAddActivity({
      leadId: lead.id,
      type: 'call',
      title: 'Call Placed',
      description: `Outgoing call placed to ${lead.phone}`
    });
    if (onOpenPowerDialerForLead) {
      onOpenPowerDialerForLead(lead);
    }
  };

  // Pagination index
  const currentIndex = allLeads.findIndex((l) => l.id === lead.id);
  const totalLeadsCount = allLeads.length || 1;

  const handlePrevLead = () => {
    if (!onSelectLead || allLeads.length === 0) return;
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : allLeads.length - 1;
    onSelectLead(allLeads[prevIdx]);
  };

  const handleNextLead = () => {
    if (!onSelectLead || allLeads.length === 0) return;
    const nextIdx = currentIndex < allLeads.length - 1 ? currentIndex + 1 : 0;
    onSelectLead(allLeads[nextIdx]);
  };

  // Filter lead specific activities, messages, calls
  const leadActivities = activities.filter((a) => a.leadId === lead.id);
  const leadMessages = messages.filter((m) => m.leadId === lead.id);
  const leadCalls = callRecords.filter((c) => c.leadId === lead.id);

  // Filtered activities by activityFilter
  const filteredActivities = leadActivities.filter((act) => {
    if (activityFilter === 'ALL') return true;
    return act.type === activityFilter;
  });

  // Handle rating update
  const handleSetRating = (newRating: number) => {
    onUpdateLead({ ...lead, rating: newRating });
    onAddActivity({
      leadId: lead.id,
      type: 'note',
      title: 'Lead Star Rating Updated',
      description: `Rated ${newRating} out of 5 stars`
    });
  };

  // Handle AI Score Recalculation
  const handleRecalculateAiScore = async () => {
    setRecalculatingScore(true);
    try {
      const res = await fetch('/api/ai/score-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead })
      });
      const data = await res.json();
      if (data.aiScore !== undefined) {
        onUpdateLead({
          ...lead,
          aiScore: data.aiScore,
          aiRating: data.aiRating,
          aiReasoning: data.aiReasoning || lead.aiReasoning
        });
      }
    } catch (e) {
      console.error("AI Score error:", e);
    } finally {
      setRecalculatingScore(false);
    }
  };

  // AI WhatsApp draft
  const handleGenerateAiWhatsAppDraft = async () => {
    setGeneratingAiResponse(true);
    try {
      const res = await fetch('/api/ai/generate-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          company: lead.company,
          product: 'ARCLE CRM Automation',
          stage: lead.status,
          intent: 'Follow-up demo & quote'
        })
      });
      const data = await res.json();
      if (data.message) {
        setWhatsAppText(data.message);
      }
    } catch (e) {
      console.error("Failed AI draft:", e);
    } finally {
      setGeneratingAiResponse(false);
    }
  };

  // Send WhatsApp
  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsAppText.trim()) return;
    onSendMessage(lead.id, whatsAppText);
    setWhatsAppText('');
  };

  // Save Notes & Follow Up
  const handleSaveNotes = (markAsFollowUpStage: boolean = true) => {
    onUpdateLead({
      ...lead,
      notes: noteText,
      followUpAt: followUpDate || undefined,
      status: markAsFollowUpStage ? 'Follow Up' : lead.status,
      updatedAt: new Date().toISOString()
    });
    onAddActivity({
      leadId: lead.id,
      type: 'note',
      title: markAsFollowUpStage ? 'Marked into Follow-Up' : 'Notes Saved',
      description: `Follow-up date: ${followUpDate || 'None'}. Note: ${noteText}`
    });
    setNoteText('');
    setFollowUpDate('');
    setActiveTab('timeline');
  };

  // Copy phone helper
  const handleCopyPhone = () => {
    navigator.clipboard.writeText(lead.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Lead Quality calculation
  const leadQuality = calculateLeadQualityScore(lead);

  // Copy click ID helpers
  const handleCopyGclid = () => {
    if (!lead.attribution?.gclid) return;
    navigator.clipboard.writeText(lead.attribution.gclid);
    setCopiedGclid(true);
    setTimeout(() => setCopiedGclid(false), 2000);
  };

  const handleCopyFbclid = () => {
    if (!lead.attribution?.fbclid) return;
    navigator.clipboard.writeText(lead.attribution.fbclid);
    setCopiedFbclid(true);
    setTimeout(() => setCopiedFbclid(false), 2000);
  };

  // Toggle Invalid / Spam status
  const handleToggleInvalidFlag = () => {
    const nextVal = !lead.isInvalid;
    const updated = {
      ...lead,
      isInvalid: nextVal,
      updatedAt: new Date().toISOString()
    };
    onUpdateLead(updated);
    onAddActivity({
      leadId: lead.id,
      type: 'stage_change',
      title: nextVal ? 'Marked as Invalid / Spam Lead' : 'Removed Invalid / Spam Flag',
      description: nextVal ? 'Conversion feedback to Google Ads & Meta suppressed.' : 'Lead restored to normal attribution scoring.'
    });
  };

  // Toggle Duplicate status
  const handleToggleDuplicateFlag = () => {
    const nextVal = !lead.isDuplicate;
    const updated = {
      ...lead,
      isDuplicate: nextVal,
      updatedAt: new Date().toISOString()
    };
    onUpdateLead(updated);
    onAddActivity({
      leadId: lead.id,
      type: 'stage_change',
      title: nextVal ? 'Marked as Duplicate Lead' : 'Removed Duplicate Flag',
      description: nextVal ? 'Excluded from conversion optimization.' : 'Duplicate flag cleared.'
    });
  };

  // Trigger manual conversion signal dispatch
  const handleDispatchConversionSignal = async (targetStage?: LeadStatus) => {
    setDispatchingConversion(true);
    setConversionSuccessMsg(null);
    try {
      const res = await fetch('/api/conversions/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          stage: targetStage || lead.status,
          leadData: lead
        })
      });
      const data = await res.json();
      if (data.success) {
        setConversionSuccessMsg(`Signal dispatched! Processed ${data.dispatchedEvents?.length || 1} conversion event(s) to Google Ads & Meta CAPI.`);
        onAddActivity({
          leadId: lead.id,
          type: 'note',
          title: 'Offline Conversion Signal Dispatched',
          description: `Dispatched conversion for stage "${targetStage || lead.status}" to ad network offline APIs.`
        });
      } else {
        setConversionSuccessMsg(data.message || 'Stage not mapped to an active conversion event.');
      }
    } catch (err: any) {
      setConversionSuccessMsg(`Dispatch error: ${err.message}`);
    } finally {
      setDispatchingConversion(false);
      setTimeout(() => setConversionSuccessMsg(null), 5000);
    }
  };

  // Get agent initials
  const getAgentInitials = (name: string) => {
    if (!name) return 'UN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('ago')) return dateStr.replace(' ago', '');
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffHours = Math.max(0, Math.round((new Date().getTime() - d.getTime()) / 3600000));
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.round(diffHours/24)}d`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Subtle Gray Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] transition-opacity z-40 cursor-pointer"
      />

      {/* Wrapper for Drawer and Buttons */}
      <div className="relative w-full lg:w-[65%] xl:w-[60%] max-w-6xl h-full flex flex-col z-50 font-sans animate-in slide-in-from-right duration-300">
        
        {/* Floating Close Button */}
        <button 
          onClick={onClose} 
          className="absolute -left-14 top-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer hidden md:flex z-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main Drawer Panel */}
        <div className="flex-1 w-full h-full bg-[#fafafa] flex flex-col overflow-hidden shadow-2xl border-l border-slate-200 relative">
          
          {/* Mobile Top Close Header */}
          <div className="md:hidden flex items-center justify-between px-3 py-2.5 bg-white border-b border-slate-200 z-20 shrink-0">
            <button 
              onClick={onClose}
              className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
            <span className="text-xs font-bold text-slate-800 font-serif truncate max-w-[180px]">{lead.name}</span>
          </div>

          {/* Top Floating Navigation (Desktop & Mobile) */}
          <div className="absolute top-2.5 right-3 sm:top-4 sm:right-6 z-10 flex items-center bg-white border border-slate-200 rounded-full px-1 py-0.5 sm:py-1 shadow-sm text-[11px] sm:text-xs font-semibold text-slate-600">
           <button onClick={handlePrevLead} className="px-2 sm:px-3 py-0.5 sm:py-1 hover:text-slate-900 transition-colors flex items-center space-x-0.5 sm:space-x-1 cursor-pointer rounded-full hover:bg-slate-50">
             <ChevronLeft className="w-3.5 h-3.5"/> <span>Prev</span>
           </button>
           <span className="px-2 sm:px-3 text-slate-800 border-x border-slate-200">{currentIndex + 1} <span className="text-slate-400 font-normal">of</span> {totalLeadsCount}</span>
           <button onClick={handleNextLead} className="px-2 sm:px-3 py-0.5 sm:py-1 hover:text-slate-900 transition-colors flex items-center space-x-0.5 sm:space-x-1 cursor-pointer rounded-full hover:bg-slate-50">
             <span>Next</span> <ChevronRight className="w-3.5 h-3.5"/>
           </button>
        </div>

        {/* Scrollable Feed Container */}
        <div className="flex-1 overflow-y-auto ios-scroll">
          
          <div className="max-w-4xl mx-auto pt-12 sm:pt-16 px-3 sm:px-8 pb-12">
            
            {/* Detailed Header */}
            <div className="mb-6 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden mt-2 sm:mt-6">
               {/* Top Title Row */}
               <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-3.5 sm:p-5 gap-3 border-b border-slate-100">
                 <div className="w-full sm:w-auto">
                   <h1 className="text-lg sm:text-[22px] font-bold text-slate-800 tracking-tight font-serif break-words">{lead.name}</h1>
                   
                   <div className="flex flex-wrap items-center gap-2 mt-2">
                     {/* Status Dropdown */}
                     <div className="relative">
                       {(() => {
                         const stageConfig = stages.find(s => s.name.toLowerCase() === (lead.status || '').toLowerCase());
                         const color = stageConfig?.color || '#10B981';
                         return (
                           <select
                             value={lead.status}
                             onChange={(e) => onUpdateLead({ ...lead, status: e.target.value as LeadStatus })}
                             style={{ backgroundColor: `${color}1A`, color: color, borderColor: `${color}40` }}
                             className="appearance-none font-medium py-1 pl-3 pr-7 rounded-md text-xs cursor-pointer focus:outline-none transition-colors border"
                           >
                             {stages.map(s => (
                               <option key={s.name} value={s.name} className="bg-white text-slate-800">{s.name}</option>
                             ))}
                           </select>
                         );
                       })()}
                       <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1.5 text-slate-500 pointer-events-none" />
                     </div>
                     
                     {/* Star Rating */}
                     <div className="flex items-center space-x-0.5">
                       {[1, 2, 3, 4, 5].map((star) => (
                         <button key={star} onClick={() => handleSetRating(star)} className="p-0 cursor-pointer hover:scale-110 transition-transform focus:outline-none">
                           <Star className={`w-4 h-4 ${(lead.rating || 0) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300'}`} />
                         </button>
                       ))}
                     </div>
                   </div>
                 </div>

                 {/* Right Actions & Assignee (Fully Responsive Row on Mobile & Desktop) */}
                 <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:border-transparent gap-2">
                   <div className="flex items-center space-x-2 text-slate-600">
                      {/* Campaign Popover */}
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setShowCampaignMenu(!showCampaignMenu); setShowTagMenu(false); setShowMoreOptions(false); setShowAssigneeMenu(false); setIsAddingCampaign(false); setCampaignSearch(''); }} className="hover:bg-slate-100 p-1 rounded-md transition-colors cursor-pointer" title="Assign Campaign">
                          <AtSign className="w-4 h-4"/>
                        </button>
                        {showCampaignMenu && (
                          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-3 z-30">
                            <p className="text-[11px] text-slate-400 mb-2">Lead Present in campaign</p>
                            
                            {/* Assigned Campaign Pill */}
                            {lead.campaignName && (
                              <div className="flex items-center justify-between bg-slate-100/80 rounded-md px-2.5 py-1.5 mb-2">
                                <span className="text-[12px] font-medium text-slate-700">@{lead.campaignName}</span>
                                <button onClick={() => { if(onUpdateLead) onUpdateLead({...lead, campaignName: undefined}); setIsAddingCampaign(false); }} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {!isAddingCampaign ? (
                              <button 
                                onClick={() => setIsAddingCampaign(true)}
                                className="w-full mt-1 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-lg py-1.5 flex items-center justify-center space-x-1.5 text-slate-600 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium">Add Campaign</span>
                              </button>
                            ) : (
                              <>
                                <div className="relative mb-3 mt-1">
                                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input 
                                    type="text" 
                                    autoFocus
                                    placeholder="Search campaign..." 
                                    value={campaignSearch}
                                    onChange={(e) => setCampaignSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
                                  />
                                </div>
                                
                                {/* Search Results */}
                                <div className="max-h-32 overflow-y-auto space-y-1 pt-1 border-t border-slate-100">
                                  {['meta-1-karnataka', 'google-search-blr', 'fb-retargeting-mar'].filter(c => c.includes(campaignSearch.toLowerCase()) && c !== lead.campaignName).map(camp => (
                                    <div key={camp} className="flex justify-center mt-2">
                                      <button 
                                        onClick={() => { if(onUpdateLead) onUpdateLead({...lead, campaignName: camp}); setShowCampaignMenu(false); setIsAddingCampaign(false); }}
                                        className="bg-slate-100 hover:bg-slate-200 rounded-full px-3 py-1 text-[11px] font-medium text-slate-700 cursor-pointer flex items-center space-x-2 transition-colors shadow-sm"
                                      >
                                        <span>@{camp}</span>
                                        <span className="text-indigo-600 font-semibold">Assign</span>
                                      </button>
                                    </div>
                                  ))}
                                  {/* Add new campaign option if it doesn't exist */}
                                  {campaignSearch.length > 0 && !['meta-1-karnataka', 'google-search-blr', 'fb-retargeting-mar'].some(c => c === campaignSearch.toLowerCase()) && (
                                    <div className="flex justify-center mt-2">
                                      <button 
                                        onClick={() => { if(onUpdateLead) onUpdateLead({...lead, campaignName: campaignSearch}); setShowCampaignMenu(false); setIsAddingCampaign(false); }}
                                        className="bg-indigo-50 hover:bg-indigo-100 rounded-full px-3 py-1 text-[11px] font-medium text-indigo-700 cursor-pointer flex items-center space-x-2 transition-colors border border-indigo-200 shadow-sm"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Add "@{campaignSearch}"</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tag Popover */}
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setShowTagMenu(!showTagMenu); setShowCampaignMenu(false); setShowMoreOptions(false); setShowAssigneeMenu(false); }} className="hover:bg-slate-100 p-1 rounded-md transition-colors cursor-pointer" title="Tag Lead">
                          <Tag className="w-4 h-4"/>
                        </button>
                        {showTagMenu && (
                          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-xl p-3 z-30">
                            <p className="text-[10px] text-slate-500 font-semibold mb-2 uppercase tracking-wide">Assign Tags</p>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {lead.tags && lead.tags.length > 0 ? lead.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                                  {tag}
                                  <button onClick={() => { if(onUpdateLead) onUpdateLead({...lead, tags: lead.tags.filter(t => t !== tag)}); }} className="ml-1 text-slate-400 hover:text-rose-500 cursor-pointer"><Trash2 className="w-2.5 h-2.5"/></button>
                                </span>
                              )) : <p className="text-xs text-slate-400 italic mb-1">No tags assigned.</p>}
                            </div>
                            <div className="border-t border-slate-100 pt-2 mt-2">
                              {['VIP', 'Urgent', 'High Value', 'Follow Up', 'Duplicate'].filter(t => !lead.tags?.includes(t)).map(tag => (
                                <button 
                                  key={tag}
                                  onClick={() => { if(onUpdateLead) onUpdateLead({...lead, tags: [...(lead.tags || []), tag]}); }}
                                  className="block w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded text-xs text-slate-600 cursor-pointer"
                                >
                                  + {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* More Options Popover */}
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setShowMoreOptions(!showMoreOptions); setShowCampaignMenu(false); setShowTagMenu(false); setShowAssigneeMenu(false); }} className="hover:bg-slate-100 p-1 rounded-md transition-colors cursor-pointer relative">
                          <MoreVertical className="w-4 h-4"/>
                          {showMoreOptions && (
                            <div onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-lg py-1.5 z-20 text-sm font-medium">
                            <button onClick={(e) => { e.stopPropagation(); setShowMoreOptions(false); navigator.clipboard.writeText(`${window.location.origin}/lead/${lead.id}`); alert('Log Link copied!'); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700">Copy Log Link</button>
                            <button onClick={(e) => { e.stopPropagation(); setShowMoreOptions(false); handleToggleInvalidFlag(); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700">{lead.isInvalid ? 'Unblock Lead' : 'Block Lead'}</button>
                            <button onClick={(e) => { e.stopPropagation(); setShowMoreOptions(false); if(window.confirm('Are you sure you want to delete this lead?')) { if(onDeleteLead) onDeleteLead(lead.id); onClose(); } }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600">Delete Lead</button>
                          </div>
                        )}
                        </button>
                      </div>
                    </div>
                   
                   <div className="relative flex items-center space-x-2">
                     <button 
                       onClick={(e) => { e.stopPropagation(); setShowAssigneeMenu(!showAssigneeMenu); setShowCampaignMenu(false); setShowTagMenu(false); setShowMoreOptions(false); }}
                       className="flex items-center space-x-2 hover:bg-slate-50 p-1 -m-1 rounded-lg transition-colors cursor-pointer"
                       title="Transfer Lead"
                     >
                       <span className="text-[13px] text-slate-700 font-medium hover:text-indigo-600 transition-colors border-b border-dashed border-slate-300">{lead.ownerAgentName || 'Radhika M R'}</span>
                       <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                         {getAgentInitials(lead.ownerAgentName || 'Radhika M R')}
                       </div>
                     </button>

                     {showAssigneeMenu && (
                       <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-30">
                         <p className="text-[10px] text-slate-500 font-semibold mb-2 px-2 uppercase tracking-wide">Transfer Lead To</p>
                         <div className="max-h-48 overflow-y-auto space-y-0.5">
                           {agents.map(agent => (
                             <button
                               key={agent.id}
                               onClick={() => { 
                                 if(onUpdateLead) onUpdateLead({...lead, ownerAgentId: agent.id, ownerAgentName: agent.name}); 
                                 setShowAssigneeMenu(false); 
                               }}
                               className={`w-full text-left flex items-center space-x-2 px-2 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${lead.ownerAgentId === agent.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                             >
                               <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 shrink-0">
                                 {getAgentInitials(agent.name)}
                               </div>
                               <span className="truncate">{agent.name}</span>
                               {lead.ownerAgentId === agent.id && <Check className="w-3.5 h-3.5 ml-auto text-indigo-600" />}
                             </button>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>

               {/* 2-Column Grid */}
               <div className="p-5">
                 <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-[13px]">
                    {/* Row 1 */}
                    <div>
                      <div className="flex items-center text-slate-400 mb-1">
                         <Phone className="w-3.5 h-3.5 mr-1.5" />
                         <span>Phone</span>
                         <div className="ml-2 w-5 h-5 bg-indigo-100 rounded flex items-center justify-center text-[10px] font-bold text-indigo-700">D</div>
                      </div>
                      <div className="flex items-center text-slate-700 font-medium">
                         <span className="mr-1.5 text-base">🇮🇳</span> 91{lead.phone?.replace('+91', '').replace('91', '') || '9036501419'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center text-slate-400 mb-1">
                         <Mail className="w-3.5 h-3.5 mr-1.5" />
                         <span>Email</span>
                      </div>
                      <div className="text-slate-700 font-medium">
                         {lead.email || 'anu064638@gmail.com'}
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div>
                      <div className="flex items-center text-slate-400 mb-1">
                         <Phone className="w-3.5 h-3.5 mr-1.5" />
                         <span>Alternate Phone</span>
                      </div>
                      <div className="flex items-center text-slate-400 font-medium">
                         <span className="mr-1.5 text-base">🇮🇳</span> 91 <span className="ml-1 text-slate-300 font-normal">Enter Phone Number</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center text-slate-400 mb-1">
                         <Type className="w-3.5 h-3.5 mr-1.5" />
                         <span>Batch</span>
                      </div>
                      <div className="text-slate-300">Empty</div>
                    </div>

                    {/* Row 3 */}
                    <div>
                      <div className="flex items-center text-slate-400 mb-1">
                         <Type className="w-3.5 h-3.5 mr-1.5" />
                         <span>Date of Joining</span>
                      </div>
                      <div className="text-slate-300">Empty</div>
                    </div>
                    <div>
                      <div className="flex items-center text-slate-400 mb-1">
                         <Type className="w-3.5 h-3.5 mr-1.5" />
                         <span>City</span>
                      </div>
                      <div className="text-slate-700 font-medium">{lead.city || 'Bangalore'}</div>
                    </div>
                    
                    {/* Row 4 */}
                    <div>
                      <div className="flex items-center text-slate-400 mb-1">
                         <Type className="w-3.5 h-3.5 mr-1.5" />
                         <span>Address</span>
                      </div>
                      <div className="text-slate-300">Empty</div>
                    </div>
                    <div>
                      <div className="flex items-center text-slate-400 mb-1">
                         <Type className="w-3.5 h-3.5 mr-1.5" />
                         <span>Age</span>
                      </div>
                      <div className="text-slate-300">Empty</div>
                    </div>
                 </div>

                 {/* Show more / less divider */}
                 <div className="relative mt-8 mb-4">
                   <div className="absolute inset-0 flex items-center" aria-hidden="true">
                     <div className="w-full border-t border-dashed border-slate-200"></div>
                   </div>
                   <div className="relative flex justify-center">
                     <button 
                       onClick={() => setShowMoreFields(!showMoreFields)}
                       className="inline-flex items-center space-x-1 rounded-full border border-slate-200 bg-[#fafafa] px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                     >
                       <span>{showMoreFields ? 'Show less' : 'Show more'}</span>
                       <ChevronDown className={`w-3 h-3 transition-transform ${showMoreFields ? 'rotate-180' : ''}`} />
                     </button>
                   </div>
                 </div>

                 {/* Expanded Fields */}
                 {showMoreFields && (
                   <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-[13px] pb-4">
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Date of Birth</span>
                       </div>
                       <div className="text-slate-300">DD/MM/YYYY HH:mm:ss</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>DOB</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>State</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Gender</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Facebook ad</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Facebook Campaign</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Facebook Lead id</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Facebook ad set id</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Facebook Ad set name</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Facebook form</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Facebook page</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Company</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Lead id</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Lead Type</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>Prefix</span>
                       </div>
                       <div className="text-slate-300">Empty</div>
                     </div>
                     <div>
                       <div className="flex items-center text-slate-400 mb-1">
                          <Type className="w-3.5 h-3.5 mr-1.5" />
                          <span>date</span>
                       </div>
                       <div className="text-slate-300">DD/MM/YYYY HH:mm:ss</div>
                     </div>
                   </div>
                 )}
               </div>

               {/* Action Bar */}
               <div className="bg-[#fcfcfc] border-t border-slate-100 p-2 flex justify-between items-center text-[10px] font-medium text-slate-500">
                 <button onClick={handleCallLead} className="flex-1 flex flex-col items-center justify-center space-y-1 hover:text-slate-800 transition-colors py-3 cursor-pointer">
                   <Phone className="w-5 h-5 mb-1" strokeWidth={1.5} />
                   <span>CALL</span>
                 </button>
                 <button onClick={() => { const n = prompt('Add Task:'); if(n) onAddActivity({leadId: lead.id, type: 'note', title: 'Task', description: n}); }} className="flex-1 flex flex-col items-center justify-center space-y-1 hover:text-slate-800 transition-colors py-3 relative cursor-pointer">
                   <CheckSquare className="w-5 h-5 mb-1" strokeWidth={1.5} />
                   <div className="flex items-center">
                     <span>TASK</span>
                     <ChevronDown className="w-3 h-3 ml-0.5" />
                   </div>
                 </button>
                 <button onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`, '_blank')} className="flex-1 flex flex-col items-center justify-center space-y-1 hover:text-slate-800 transition-colors py-3 cursor-pointer">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5 mb-1 opacity-70 grayscale hover:grayscale-0 transition-all"/>
                   <span>WHATSAPP</span>
                 </button>
                 <button onClick={() => { window.location.href = `sms:${lead.phone}`; }} className="flex-1 flex flex-col items-center justify-center space-y-1 hover:text-slate-800 transition-colors py-3 cursor-pointer">
                   <MessageCircle className="w-5 h-5 mb-1" strokeWidth={1.5} />
                   <span>SMS</span>
                 </button>
                 <button onClick={() => { const n = prompt('Add Note:'); if(n) onAddActivity({leadId: lead.id, type: 'note', title: 'Note', description: n}); }} className="flex-1 flex flex-col items-center justify-center space-y-1 hover:text-slate-800 transition-colors py-3 cursor-pointer">
                   <Clipboard className="w-5 h-5 mb-1" strokeWidth={1.5} />
                   <span>ADD NOTE</span>
                 </button>
                 <button className="flex-1 flex flex-col items-center justify-center space-y-1 hover:text-slate-800 transition-colors py-3 cursor-pointer">
                   <Sparkles className="w-5 h-5 mb-1" strokeWidth={1.5} />
                   <span>LEAD-IQ</span>
                 </button>
               </div>
            </div>

            {/* Action Composers Top Box (Triggered by + Action menu) */}
            {activeActionType === 'email' && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4 space-y-3 font-sans animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Mail className="w-4 h-4 text-[#5034a8]" />
                    <span>Email Lead: {lead.name}</span>
                  </h4>
                  <button onClick={() => setActiveActionType(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">Subject</label>
                  <input 
                    type="text" 
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter Email Subject, press / for templates"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs font-sans"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">Body</label>
                  <textarea 
                    rows={4}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Enter your email text"
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs resize-none font-sans"
                  />
                </div>
                <div className="flex items-center justify-end space-x-3 pt-1">
                  <button 
                    onClick={() => setActiveActionType(null)} 
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendEmailAction}
                    className="px-4 py-1.5 bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <span>SEND</span>
                    <Send className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            )}

            {activeActionType === 'file' && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4 space-y-3 font-sans animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Paperclip className="w-4 h-4 text-[#5034a8]" />
                    <span>Attach Document File</span>
                  </h4>
                  <button onClick={() => setActiveActionType(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">Document Label</label>
                  <input 
                    type="text" 
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                    placeholder="Enter document title (e.g. Identity Proof, Proposal PDF)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs font-sans"
                  />
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50">
                  <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 font-medium">Drag and drop file here or click to browse</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, DOCX, PNG, JPG (Max 25MB)</p>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-1">
                  <button onClick={() => setActiveActionType(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                  <button onClick={handleUploadFileAction} className="px-4 py-1.5 bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer">Upload File</button>
                </div>
              </div>
            )}

            {activeActionType === 'note' && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4 space-y-3 font-sans animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-[#5034a8]" />
                    <span>Log Internal Team Note</span>
                  </h4>
                  <button onClick={() => setActiveActionType(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea 
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Enter internal note for team activity history..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs resize-none font-sans"
                />
                <div className="flex items-center justify-end space-x-3 pt-1">
                  <button onClick={() => setActiveActionType(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                  <button onClick={handleSaveNoteAction} className="px-4 py-1.5 bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer">Save Note</button>
                </div>
              </div>
            )}

            {activeActionType === 'call' && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4 space-y-3 font-sans animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <PhoneOutgoing className="w-4 h-4 text-[#5034a8]" />
                    <span>Log Outgoing Call Outcome</span>
                  </h4>
                  <button onClick={() => setActiveActionType(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">Disposition</label>
                    <select value={callDisposition} onChange={(e) => setCallDisposition(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none">
                      <option value="Connected">Connected / Answered</option>
                      <option value="RNR / No Answer">RNR / No Answer</option>
                      <option value="Busy">Busy Signal</option>
                      <option value="Call Back Requested">Call Back Requested</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">Duration</label>
                    <select value={callDuration} onChange={(e) => setCallDuration(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none">
                      <option value="1 min">1 min</option>
                      <option value="2 min">2 min</option>
                      <option value="5 min">5 min</option>
                      <option value="10 min">10 min</option>
                    </select>
                  </div>
                </div>
                <textarea 
                  rows={2}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Call discussion notes & next steps..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs resize-none font-sans"
                />
                <div className="flex items-center justify-end space-x-3 pt-1">
                  <button onClick={() => setActiveActionType(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                  <button onClick={handleLogCallAction} className="px-4 py-1.5 bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer">Log Outgoing Call</button>
                </div>
              </div>
            )}

            {activeActionType === 'payment' && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4 space-y-3 font-sans animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <IndianRupee className="w-4 h-4 text-[#5034a8]" />
                    <span>Generate Payment Link</span>
                  </h4>
                  <button onClick={() => setActiveActionType(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">Amount (₹)</label>
                    <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')} placeholder="5000" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">Item Description</label>
                    <input type="text" value={paymentDescription} onChange={(e) => setPaymentDescription(e.target.value)} placeholder="Admission Fee / Deposit" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none" />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-1">
                  <button onClick={() => setActiveActionType(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                  <button onClick={handleSendPaymentAction} className="px-4 py-1.5 bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer">Send Payment Link</button>
                </div>
              </div>
            )}

            {activeActionType === 'sms' && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4 space-y-3 font-sans animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <MessageSquare className="w-4 h-4 text-[#5034a8]" />
                    <span>Send SMS Message</span>
                  </h4>
                  <button onClick={() => setActiveActionType(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea 
                  rows={3}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="Enter SMS message text..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs resize-none font-sans"
                />
                <div className="flex items-center justify-end space-x-3 pt-1">
                  <button onClick={() => setActiveActionType(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                  <button onClick={handleSendSmsAction} className="px-4 py-1.5 bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer">Send SMS</button>
                </div>
              </div>
            )}

            {activeActionType === 'task' && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4 space-y-3 font-sans animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-[#5034a8]" />
                    <span>Schedule Task / Follow-Up</span>
                  </h4>
                  <button onClick={() => setActiveActionType(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">Task Title</label>
                    <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Follow-up call" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">Due Date & Time</label>
                    <input type="datetime-local" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none" />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-1">
                  <button onClick={() => setActiveActionType(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                  <button onClick={handleScheduleTaskAction} className="px-4 py-1.5 bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer">Schedule Task</button>
                </div>
              </div>
            )}

            {activeActionType === 'whatsapp' && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4 space-y-3 font-sans animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Send WhatsApp Message</span>
                  </h4>
                  <button onClick={() => setActiveActionType(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea 
                  rows={3}
                  value={whatsAppText}
                  onChange={(e) => setWhatsAppText(e.target.value)}
                  placeholder="Type WhatsApp message..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs resize-none font-sans"
                />
                <div className="flex items-center justify-end space-x-3 pt-1">
                  <button onClick={() => setActiveActionType(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                  <button onClick={(e) => { handleSendWhatsApp(e); setActiveActionType(null); }} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer">SEND WHATSAPP</button>
                </div>
              </div>
            )}

            {/* Tabs & Filter Bar Row */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-200">
              <div className="flex space-x-6">
                <button className="text-indigo-700 font-semibold text-[13px] border-b-2 border-indigo-700 pb-3 px-1 cursor-pointer">
                  Activity History
                </button>
                <button className="text-slate-500 font-medium text-[13px] hover:text-slate-700 pb-3 px-1 cursor-pointer">
                  Task
                </button>
              </div>

              {/* Purple + Action Menu Button matching screenshot */}
              <div className="relative mb-2">
                <button 
                  onClick={() => setShowAddActionMenu(!showAddActionMenu)}
                  className="flex items-center space-x-1.5 bg-[#5034a8] hover:bg-[#432993] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Action</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                </button>

                {/* Action Floating Dropdown Box (Screenshot 1:1 match) */}
                {showAddActionMenu && (
                  <div className="absolute right-0 top-9 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 font-sans">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input 
                        type="text"
                        value={actionMenuSearch}
                        onChange={(e) => setActionMenuSearch(e.target.value)}
                        placeholder="Search"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-sans"
                      />
                    </div>

                    <div className="space-y-0.5 max-h-64 overflow-y-auto">
                      {[
                        { id: 'email', name: 'Email', icon: Mail },
                        { id: 'file', name: 'File', icon: Paperclip },
                        { id: 'note', name: 'Note', icon: FileText },
                        { id: 'call', name: 'Outgoing Call', icon: PhoneOutgoing },
                        { id: 'payment', name: 'Payment', icon: IndianRupee },
                        { id: 'sms', name: 'Sms', icon: MessageSquare },
                        { id: 'task', name: 'Task', icon: Clock },
                        { id: 'whatsapp', name: 'Whatsapp', icon: MessageCircle },
                      ]
                        .filter(item => item.name.toLowerCase().includes(actionMenuSearch.toLowerCase()))
                        .map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveActionType(item.id as any);
                              setShowAddActionMenu(false);
                              setActionMenuSearch('');
                            }}
                            className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 transition-all cursor-pointer text-left group"
                          >
                            <item.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                            <span>{item.name}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center space-x-3 mb-4 px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-600">
              <Filter className="w-4 h-4 text-slate-400" />
              <button className="flex items-center space-x-1 hover:bg-slate-50 px-2 py-1.5 rounded-md transition-colors border border-indigo-200 bg-indigo-50">
                <span className="text-indigo-700">All Actions</span>
                <X className="w-3.5 h-3.5 text-indigo-400 hover:text-indigo-600" />
              </button>
              <button className="flex items-center space-x-1 hover:bg-slate-50 px-2 py-1.5 rounded-md transition-colors text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
                <span>Time</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
              </button>
              <button className="flex items-center space-x-1 hover:bg-slate-50 px-2 py-1.5 rounded-md transition-colors text-slate-700">
                <Users className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
                <span>Team</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
              </button>
            </div>

            {/* Unified Activity Timeline (Flat List) */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-8">
              <div className="divide-y divide-slate-100">
                
                {/* 1. Facebook Details Anchor Event */}
                <div className="flex items-center px-4 py-3.5 hover:bg-slate-50 transition-colors group">
                  <div className="flex-shrink-0 w-8 flex items-center justify-center text-slate-300 group-hover:text-slate-400">
                    <Pin className="w-4 h-4 rotate-45" />
                  </div>
                  <div className="flex-shrink-0 w-8 flex items-center justify-center">
                    <Facebook className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center pl-2">
                    <span className="text-[13px] text-slate-600 truncate">
                      Lead Capture from <span className="font-semibold text-slate-800">Form: Master Form IATA Cargo</span> & <span className="font-semibold text-slate-800">Page: Kite Institute of Aviation & Hospitality</span>
                    </span>
                  </div>
                  <div className="flex-shrink-0 ml-4 flex items-center space-x-3">
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">21h</span>
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <Bot className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* 2. CAPI 200 Anchor Event */}
                <div className="flex items-center px-4 py-3.5 hover:bg-slate-50 transition-colors group">
                  <div className="flex-shrink-0 w-8 flex items-center justify-center text-slate-300 group-hover:text-slate-400">
                    <Pin className="w-4 h-4 rotate-45" />
                  </div>
                  <div className="flex-shrink-0 w-8 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-indigo-600">API</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex items-center pl-2">
                    <span className="text-[13px] text-slate-600 truncate">
                      <span className="font-semibold text-indigo-600 mr-2">CAPI</span> <span className="font-mono text-slate-800">200</span>
                    </span>
                  </div>
                  <div className="flex-shrink-0 ml-4 flex items-center space-x-3">
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">1d</span>
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <Bot className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* Standard Activity Logs */}
                {leadActivities.filter(a => a.type !== 'facebook_form').map((act) => (
                  <div key={act.id} className="flex items-start px-4 py-3.5 hover:bg-slate-50 transition-colors group">
                    <div className="flex-shrink-0 w-8 flex items-center justify-center text-slate-300 group-hover:text-slate-400 pt-0.5">
                      <Pin className="w-4 h-4 rotate-45" />
                    </div>
                    <div className="flex-shrink-0 w-8 flex items-center justify-center pt-0.5">
                      {act.type === 'call' && <Phone className="w-4 h-4 text-slate-500" />}
                      {act.type === 'whatsapp' && <MessageSquare className="w-4 h-4 text-slate-700" />}
                      {act.type === 'note' && <Clipboard className="w-4 h-4 text-slate-700" />}
                      {act.type === 'stage_change' && <Type className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0 pr-4 pl-2">
                      <div className="flex items-center text-[13px] text-slate-700">
                        {act.type === 'note' ? (
                          <span className="text-slate-800">{act.description}</span>
                        ) : act.type === 'stage_change' ? (
                          <span className="text-slate-500">Status changed from <span className="font-bold text-slate-700">Previous</span> → <span className="font-bold text-slate-700">{lead.status}</span></span>
                        ) : (
                          <>
                            <span className="truncate mr-2 font-semibold text-slate-800">{act.title}</span>
                            {act.type !== 'whatsapp' && <span className="text-slate-500 hidden md:inline truncate">- {act.description}</span>}
                          </>
                        )}
                      </div>
                      
                      {act.type === 'call' && act.description && (
                        <div className="mt-2 text-[13px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {act.description}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-4 flex items-center space-x-3 pt-0.5">
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                        {getRelativeTime(act.timestamp)}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0">
                        {act.agentId ? (
                           <span className="text-[9px] font-bold text-indigo-700 tracking-wider">{getAgentInitials(act.agentName || '')}</span>
                        ) : (
                           <Bot className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Edit Form Modal (Unchanged structurally, just ensuring it still renders) */}
        {isEditingLead && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">Edit Lead Info</h2>
                </div>
                <button onClick={() => setIsEditingLead(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveLeadEdit} className="p-6 overflow-y-auto space-y-5 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-600 font-semibold block">Full Name *</label>
                    <input type="text" required value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-600 font-semibold block">Phone *</label>
                    <input type="text" required value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-600 font-semibold block">Email</label>
                    <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-600 font-semibold block">Stage</label>
                    <select value={editForm.status || 'New Lead'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm">
                      <option value="New Lead">New Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Follow Up">Follow Up</option>
                      <option value="Demo Scheduled">Demo Scheduled</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsEditingLead(false)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold transition-colors cursor-pointer shadow-sm">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer shadow-sm">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
