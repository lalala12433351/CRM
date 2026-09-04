import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
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
  PhoneOutgoing,
  CalendarPlus,
  RotateCw,
  UserPlus,
  User,
  Eye
} from 'lucide-react';
import { Lead, Agent, ActivityLog, LeadStatus, LeadSource, WhatsAppMessage, CallRecord, PipelineStage, CustomFieldDef, LeadTask } from '../types';
import { CustomDropdown, DropdownOption } from './CustomDropdown';
import { calculateLeadQualityScore } from '../utils/conversionEngine';
import { CallRecordingPlayer } from './CallRecordingPlayer';
import { StatusBadge } from './StatusBadge';
import { getStatusStyle } from '../utils/statusStyles';
import { StagesContext } from '../App';
import { toast } from '../context/ToastContext';
import { getFieldTypeIcon } from './ColumnCustomizerModal';
import { fetchWithTenantAuth } from '../lib/auth';
import { validateField, validatePhone, validateCurrencyOrNumber, validateText, validateEmail } from '../lib/validation';

interface LeadDetailModalProps {
  lead: Lead | null;
  allLeads?: Lead[];
  agents: Agent[];
  activities: ActivityLog[];
  messages: WhatsAppMessage[];
  callRecords: CallRecord[];
  customFields?: CustomFieldDef[];
  onClose: () => void;
  onSelectLead?: (lead: Lead) => void;
  onOpenPowerDialerForLead?: (lead: Lead) => void;
  onUpdateLead: (updated: Lead) => void;
  onAddActivity: (activity: Partial<ActivityLog>) => void;
  onSendMessage: (leadId: string, text: string) => void;
  onDeleteLead?: (leadId: string) => void;
  onUpdateCallRecord?: (callId: string, updates: Partial<CallRecord>) => void;
  lostReasons?: string[];
  isEmbedded?: boolean;
  campaignHandle?: string;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead: initialLead,
  allLeads = [],
  agents,
  activities,
  messages,
  callRecords,
  customFields = [],
  onClose,
  onSelectLead,
  onOpenPowerDialerForLead,
  onUpdateLead,
  onAddActivity,
  onSendMessage,
  onDeleteLead,
  onUpdateCallRecord,
  lostReasons,
  isEmbedded = false,
  campaignHandle,
}) => {
  const [currentLead, setCurrentLead] = useState<Lead | null>(initialLead);

  useEffect(() => {
    setCurrentLead(initialLead);
  }, [initialLead]);

  const stages = useContext(StagesContext);

  // Dynamic Fields from Settings & Inline Editing State
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [fieldValidationError, setFieldValidationError] = useState<string | null>(null);
  const [saveSuccessFieldKey, setSaveSuccessFieldKey] = useState<string | null>(null);

  const lead = currentLead;
  if (!lead) return null;

  // Active user-configured fields in Settings (excluding top header fields name & status)
  const detailFields = useMemo(() => {
    return (customFields || []).filter(
      (f) => !f.isHidden && f.name !== 'name' && f.name !== 'status' && f.id !== '__fresh_lead_timer__'
    );
  }, [customFields]);

  const getLeadFieldDisplayValue = (field: CustomFieldDef): string => {
    if (!lead) return '';
    const key = field.name || field.id || '';
    const idKey = field.id || '';
    const labelKey = field.label ? field.label.toLowerCase().replace(/\s+/g, '_') : '';
    const labelLower = (field.label || '').toLowerCase();

    if (key === 'phone' || idKey === 'f-phone' || field.type === 'phone') return lead.phone || '';
    if (key === 'email' || idKey === 'f-email' || field.type === 'email') return lead.email || '';
    if (key === 'alternate_phone' || key === 'alternatePhone' || idKey === 'f-alt-phone') return lead.alternatePhone || lead.altPhone || '';
    if (key === 'company' || idKey === 'f-company') return lead.company || '';
    if (key === 'city' || idKey === 'f-city') return lead.city || '';
    if (key === 'state' || idKey === 'f-state') return lead.state || '';
    if (key === 'pincode' || idKey === 'f-pincode') return lead.pincode || '';
    if (key === 'address' || idKey === 'f-addr') return lead.address || '';
    if (key === 'source' || idKey === 'f-source' || labelLower.includes('source')) return lead.source || '';
    if (key === 'deal_value' || key === 'dealValue' || idKey === 'f-deal-val' || labelLower.includes('deal value')) {
      if (lead.dealValue !== undefined && lead.dealValue !== null && lead.dealValue !== 0) return String(lead.dealValue);
      if ((lead as any).deal_value !== undefined && (lead as any).deal_value !== null && (lead as any).deal_value !== 0) return String((lead as any).deal_value);
      if (lead.customFields?.deal_value !== undefined && lead.customFields?.deal_value !== null && lead.customFields?.deal_value !== 0) return String(lead.customFields.deal_value);
      if (lead.customFields?.dealValue !== undefined && lead.customFields?.dealValue !== null && lead.customFields?.dealValue !== 0) return String(lead.customFields.dealValue);
      return '';
    }
    if (key === 'notes' || key === 'special_remarks' || idKey === 'f-notes') return lead.notes || '';
    
    // Check all possible keys in customFields
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
    return '';
  };

  const handleStartEditField = (field: CustomFieldDef) => {
    setEditingFieldKey(field.name || field.id || field.label);
    setEditingValue(getLeadFieldDisplayValue(field));
    setFieldValidationError(null);
  };

  const handleSaveFieldEdit = (field: CustomFieldDef, rawValue: string) => {
    if (!lead) return;
    const trimmed = rawValue.trim();

    // Strict Validation Check against limits and formatting
    const validation = validateField(field, trimmed);
    if (!validation.isValid) {
      setFieldValidationError(validation.error || 'Validation error');
      return;
    }
    setFieldValidationError(null);

    const key = field.name || field.id || field.label.toLowerCase().replace(/\s+/g, '_');
    const idKey = field.id || '';
    const labelLower = (field.label || '').toLowerCase();
    const labelKey = field.label ? field.label.toLowerCase().replace(/\s+/g, '_') : '';

    const updatedLead: Lead = {
      ...lead,
      updatedAt: new Date().toISOString()
    };

    if (key === 'phone' || idKey === 'f-phone' || field.type === 'phone') {
      const rawDigits = trimmed.replace(/\D/g, '');
      const last10 = (rawDigits.startsWith('91') && rawDigits.length > 10 ? rawDigits.slice(2) : rawDigits).slice(0, 10);
      const cleaned = last10 ? `+91 ${last10}` : '';
      updatedLead.phone = cleaned;
    } else if (key === 'email' || idKey === 'f-email' || field.type === 'email') {
      updatedLead.email = trimmed;
    } else if (key === 'alternate_phone' || key === 'alternatePhone' || idKey === 'f-alt-phone') {
      const rawDigits = trimmed.replace(/\D/g, '');
      const last10 = (rawDigits.startsWith('91') && rawDigits.length > 10 ? rawDigits.slice(2) : rawDigits).slice(0, 10);
      const cleaned = last10 ? `+91 ${last10}` : '';
      updatedLead.alternatePhone = cleaned;
      updatedLead.altPhone = cleaned;
    } else if (key === 'company' || idKey === 'f-company') {
      updatedLead.company = trimmed;
    } else if (key === 'city' || idKey === 'f-city') {
      updatedLead.city = trimmed;
    } else if (key === 'state' || idKey === 'f-state') {
      updatedLead.state = trimmed;
    } else if (key === 'pincode' || idKey === 'f-pincode') {
      updatedLead.pincode = trimmed.replace(/\D/g, '').slice(0, 6);
    } else if (key === 'address' || idKey === 'f-addr') {
      updatedLead.address = trimmed;
    } else if (key === 'source' || idKey === 'f-source' || labelLower.includes('source')) {
      updatedLead.source = (trimmed as any) || lead.source;
    } else if (key === 'deal_value' || key === 'dealValue' || idKey === 'f-deal-val' || labelLower.includes('deal value')) {
      const numericVal = trimmed === '' ? 0 : Number(trimmed.replace(/[^\d.]/g, '')) || 0;
      updatedLead.dealValue = numericVal;
      (updatedLead as any).deal_value = numericVal;
      (updatedLead as any).dealValue = numericVal;
      updatedLead.customFields = {
        ...(updatedLead.customFields || {}),
        deal_value: numericVal,
        dealValue: numericVal,
        'f-deal-val': numericVal,
        [key]: numericVal,
        ...(field.label ? { [field.label]: numericVal } : {})
      };
    } else if (key === 'notes' || key === 'special_remarks' || idKey === 'f-notes') {
      updatedLead.notes = trimmed;
    } else {
      updatedLead.customFields = {
        ...(updatedLead.customFields || {}),
        [key]: trimmed,
        ...(idKey ? { [idKey]: trimmed } : {}),
        ...(field.name ? { [field.name]: trimmed } : {}),
        ...(field.label ? { [field.label]: trimmed } : {}),
        ...(labelKey ? { [labelKey]: trimmed } : {}),
        ...(labelLower ? { [labelLower]: trimmed } : {})
      };
      (updatedLead as any)[key] = trimmed;
      if (labelKey) (updatedLead as any)[labelKey] = trimmed;
      if (field.label) (updatedLead as any)[field.label] = trimmed;
      if (field.name) (updatedLead as any)[field.name] = trimmed;
      if (field.id) (updatedLead as any)[field.id] = trimmed;
    }

    setCurrentLead(updatedLead);
    onUpdateLead(updatedLead);
    setEditingFieldKey(null);
    setSaveSuccessFieldKey(field.name || field.id || field.label);
    setTimeout(() => setSaveSuccessFieldKey(null), 2500);

    // Direct database persistence sync
    fetchWithTenantAuth('/api/leads', {
      method: 'POST',
      body: JSON.stringify(updatedLead)
    }).catch((err) => console.warn('Field edit database sync notice:', err));

    onAddActivity({
      id: `act-${Date.now()}`,
      leadId: lead.id,
      agentId: lead.ownerAgentId || 'system',
      agentName: lead.ownerAgentName || 'User',
      type: 'edit',
      title: `Updated ${field.label}`,
      description: `Changed to "${trimmed || 'Empty'}"`,
      timestamp: new Date().toISOString()
    });
  };

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
  
  // Activity History Filter & Tab States matching screenshot
  const [historyTab, setHistoryTab] = useState<'activity' | 'task'>('activity');
  const [actionFilter, setActionFilter] = useState<'all' | 'creation' | 'stage_change' | 'edit' | 'task' | 'call' | 'whatsapp' | 'note' | 'api'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

  const [showAddActionMenu, setShowAddActionMenu] = useState(false);
  const [actionMenuSearch, setActionMenuSearch] = useState('');
  const [activeActionType, setActiveActionType] = useState<'email' | 'file' | 'note' | 'call' | 'payment' | 'sms' | 'task' | 'whatsapp' | 'followup' | null>(null);

  // Follow-Up Scheduling Modal State
  const [showFollowUpScheduler, setShowFollowUpScheduler] = useState(false);
  const [schedulerDueDay, setSchedulerDueDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [schedulerHour, setSchedulerHour] = useState('10');
  const [schedulerMinute, setSchedulerMinute] = useState('00');
  const [schedulerAmPm, setSchedulerAmPm] = useState<'AM' | 'PM'>('AM');
  const [schedulerRemarks, setSchedulerRemarks] = useState('');
  const [pendingTargetStatus, setPendingTargetStatus] = useState<string>('Follow Up');

  // Unified dynamic activity list with date segregation and assignee segregation
  const unifiedActivities = useMemo(() => {
    if (!lead) return [];

    const leadSpecific = Array.isArray(lead.activities) ? lead.activities : [];
    const globalMatching = (activities || []).filter((a) => a.leadId === lead.id);

    const seen = new Set<string>();
    const all = [...leadSpecific, ...globalMatching].filter((act) => {
      if (!act || !act.id) return false;
      if (seen.has(act.id)) return false;
      seen.add(act.id);
      return true;
    });

    const filteredByAction = all.filter((act) => {
      if (actionFilter === 'all') return true;
      if (actionFilter === 'creation') return act.type === 'creation' || act.type === 'facebook_form';
      if (actionFilter === 'stage_change') return act.type === 'stage_change';
      if (actionFilter === 'edit') return act.type === 'edit';
      if (actionFilter === 'task') return act.type === 'task';
      if (actionFilter === 'call') return act.type === 'call';
      if (actionFilter === 'whatsapp') return act.type === 'whatsapp';
      if (actionFilter === 'note') return act.type === 'note';
      if (actionFilter === 'api') return act.type === 'api' || act.type === 'capi' || act.type === 'webhook';
      return true;
    });

    const now = Date.now();
    const filteredByTime = filteredByAction.filter((act) => {
      if (timeFilter === 'all') return true;
      const actTime = new Date(act.timestamp).getTime();
      if (isNaN(actTime)) return true;
      const diffHours = (now - actTime) / 3600000;

      if (timeFilter === 'today') return diffHours <= 24;
      if (timeFilter === 'yesterday') return diffHours > 24 && diffHours <= 48;
      if (timeFilter === '7days') return diffHours <= 7 * 24;
      if (timeFilter === '30days') return diffHours <= 30 * 24;
      return true;
    });

    const filteredByTeam = filteredByTime.filter((act) => {
      if (teamFilter === 'all') return true;
      if (teamFilter === 'bot' || teamFilter === 'system') {
        return !act.agentId || act.agentId === 'bot' || act.agentId === 'system';
      }
      return act.agentId === teamFilter;
    });

    return filteredByTeam.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      return timeB - timeA;
    });
  }, [lead, activities, actionFilter, timeFilter, teamFilter]);

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
  const [taskAssigneeId, setTaskAssigneeId] = useState(() => lead?.ownerAgentId || '');
  const [followupNote, setFollowupNote] = useState('');
  const [followupAssigneeId, setFollowupAssigneeId] = useState(() => lead?.ownerAgentId || lead?.assignedTo || '');
  const [followupDateTime, setFollowupDateTime] = useState('');
  const [followupDueDay, setFollowupDueDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [followupHour, setFollowupHour] = useState('09');
  const [followupMinute, setFollowupMinute] = useState('00');
  const [followupAmPm, setFollowupAmPm] = useState<'AM' | 'PM'>('AM');

  // Dedicated Lead Tasks Tab State (Separate from global CRM tasks)
  const [isAddingInlineTask, setIsAddingInlineTask] = useState(false);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [inlineTaskDueDate, setInlineTaskDueDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [inlineTaskAssigneeId, setInlineTaskAssigneeId] = useState(() => lead?.ownerAgentId || '');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskAssigneeId, setEditTaskAssigneeId] = useState('');

  React.useEffect(() => {
    if (lead) {
      setFollowupAssigneeId(lead.ownerAgentId || lead.assignedTo || '');
    }
  }, [lead?.id]);

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
    if (!taskTitle.trim() || !lead) return;
    const assignedAgent = agents.find((a) => a.id === taskAssigneeId) || agents.find((a) => a.id === lead.ownerAgentId);
    const newTask: LeadTask = {
      id: `task-${Date.now()}`,
      leadId: lead.id,
      title: taskTitle.trim(),
      dueDate: taskDueDate || new Date().toISOString().slice(0, 16),
      assigneeId: assignedAgent?.id || lead.ownerAgentId || 'agent-admin',
      assigneeName: assignedAgent?.name || lead.ownerAgentName || 'Admin',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const updatedLead: Lead = {
      ...lead,
      tasks: [newTask, ...(lead.tasks || [])],
      followUpAt: taskDueDate || lead.followUpAt,
      status: 'Follow Up',
      updatedAt: new Date().toISOString()
    };

    onUpdateLead(updatedLead);
    fetchWithTenantAuth('/api/leads', {
      method: 'POST',
      body: JSON.stringify(updatedLead)
    }).catch(console.warn);

    onAddActivity({
      id: `act-${Date.now()}`,
      leadId: lead.id,
      agentId: assignedAgent?.id || lead.ownerAgentId,
      agentName: assignedAgent?.name || lead.ownerAgentName,
      type: 'task',
      title: `Task Created: ${newTask.title}`,
      description: `Due Date: ${newTask.dueDate}. Assigned to ${newTask.assigneeName}.`,
      timestamp: new Date().toISOString()
    });

    setTaskTitle('');
    setTaskDueDate('');
    setActiveActionType(null);
  };

  // Lead Tasks Management Handlers (Strictly Scoped to this Lead)
  const handleCreateLeadTask = () => {
    if (!inlineTaskTitle.trim() || !lead) return;
    const assignedAgent = agents.find((a) => a.id === inlineTaskAssigneeId) || agents.find((a) => a.id === lead.ownerAgentId);
    const newTask: LeadTask = {
      id: `task-${Date.now()}`,
      leadId: lead.id,
      title: inlineTaskTitle.trim(),
      dueDate: inlineTaskDueDate || new Date().toISOString().slice(0, 16),
      assigneeId: assignedAgent?.id || lead.ownerAgentId || 'agent-admin',
      assigneeName: assignedAgent?.name || lead.ownerAgentName || 'Admin',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const updatedLead: Lead = {
      ...lead,
      tasks: [newTask, ...(lead.tasks || [])],
      updatedAt: new Date().toISOString()
    };

    onUpdateLead(updatedLead);
    fetchWithTenantAuth('/api/leads', {
      method: 'POST',
      body: JSON.stringify(updatedLead)
    }).catch(console.warn);

    onAddActivity({
      id: `act-${Date.now()}`,
      leadId: lead.id,
      agentId: assignedAgent?.id || lead.ownerAgentId,
      agentName: assignedAgent?.name || lead.ownerAgentName,
      type: 'task',
      title: `Task Created: ${newTask.title}`,
      description: `Due Date: ${newTask.dueDate}. Assigned to ${newTask.assigneeName}.`,
      timestamp: new Date().toISOString()
    });

    setInlineTaskTitle('');
    setIsAddingInlineTask(false);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    if (!lead || !lead.tasks) return;
    const task = lead.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus: 'Pending' | 'Completed' = task.status === 'Completed' ? 'Pending' : 'Completed';
    const updatedTasks = lead.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t));

    const updatedLead: Lead = {
      ...lead,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString()
    };

    onUpdateLead(updatedLead);
    fetchWithTenantAuth('/api/leads', {
      method: 'POST',
      body: JSON.stringify(updatedLead)
    }).catch(console.warn);

    onAddActivity({
      id: `act-${Date.now()}`,
      leadId: lead.id,
      agentId: lead.ownerAgentId,
      agentName: lead.ownerAgentName,
      type: 'task',
      title: `Task ${newStatus === 'Completed' ? 'Completed' : 'Reopened'}`,
      description: `Task "${task.title}" marked as ${newStatus}.`,
      timestamp: new Date().toISOString()
    });
  };

  const handleStartEditTask = (task: LeadTask) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDueDate(task.dueDate || '');
    setEditTaskAssigneeId(task.assigneeId || lead?.ownerAgentId || '');
  };

  const handleSaveEditedTask = (taskId: string) => {
    if (!lead || !lead.tasks || !editTaskTitle.trim()) return;
    const assignedAgent = agents.find((a) => a.id === editTaskAssigneeId);

    const updatedTasks = lead.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          title: editTaskTitle.trim(),
          dueDate: editTaskDueDate || t.dueDate,
          assigneeId: assignedAgent ? assignedAgent.id : t.assigneeId,
          assigneeName: assignedAgent ? assignedAgent.name : t.assigneeName,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });

    const updatedLead: Lead = {
      ...lead,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString()
    };

    onUpdateLead(updatedLead);
    fetchWithTenantAuth('/api/leads', {
      method: 'POST',
      body: JSON.stringify(updatedLead)
    }).catch(console.warn);

    onAddActivity({
      id: `act-${Date.now()}`,
      leadId: lead.id,
      agentId: lead.ownerAgentId,
      agentName: lead.ownerAgentName,
      type: 'task',
      title: `Task Updated`,
      description: `Updated task details for "${editTaskTitle.trim()}"`,
      timestamp: new Date().toISOString()
    });

    setEditingTaskId(null);
  };

  const handleDeleteLeadTask = (taskId: string) => {
    if (!lead || !lead.tasks) return;
    const targetTask = lead.tasks.find((t) => t.id === taskId);
    const updatedTasks = lead.tasks.filter((t) => t.id !== taskId);

    const updatedLead: Lead = {
      ...lead,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString()
    };

    onUpdateLead(updatedLead);
    fetchWithTenantAuth('/api/leads', {
      method: 'POST',
      body: JSON.stringify(updatedLead)
    }).catch(console.warn);

    onAddActivity({
      id: `act-${Date.now()}`,
      leadId: lead.id,
      agentId: lead.ownerAgentId,
      agentName: lead.ownerAgentName,
      type: 'task',
      title: `Task Deleted`,
      description: `Removed task "${targetTask?.title || 'Task'}"`,
      timestamp: new Date().toISOString()
    });
  };

  const handleStageSelect = (newStatus: string) => {
    const isFollowUp = newStatus.toLowerCase().replace(/[\s-_]/g, '').includes('follow');
    if (isFollowUp) {
      setPendingTargetStatus(newStatus);
      if (lead.followUpAt) {
        const d = new Date(lead.followUpAt);
        if (!isNaN(d.getTime())) {
          setSchedulerDueDay(lead.followUpAt.slice(0, 10));
          let h = d.getHours();
          const isPm = h >= 12;
          if (h > 12) h -= 12;
          if (h === 0) h = 12;
          setSchedulerHour(String(h).padStart(2, '0'));
          setSchedulerMinute(String(d.getMinutes()).padStart(2, '0'));
          setSchedulerAmPm(isPm ? 'PM' : 'AM');
        }
      } else {
        setSchedulerDueDay(new Date().toISOString().slice(0, 10));
        setSchedulerHour('10');
        setSchedulerMinute('00');
        setSchedulerAmPm('AM');
      }
      setShowFollowUpScheduler(true);
    } else {
      const updatedLead: Lead = {
        ...lead,
        status: newStatus as LeadStatus,
        updatedAt: new Date().toISOString()
      };
      onUpdateLead(updatedLead);
      fetchWithTenantAuth('/api/leads', {
        method: 'POST',
        body: JSON.stringify(updatedLead)
      }).catch(console.warn);

      onAddActivity({
        id: `act-${Date.now()}`,
        leadId: lead.id,
        agentId: lead.ownerAgentId,
        agentName: lead.ownerAgentName,
        type: 'stage_change',
        title: 'Stage Changed',
        description: `Lead stage changed to ${newStatus}`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleConfirmFollowUpSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    let h = parseInt(schedulerHour, 10);
    if (schedulerAmPm === 'PM' && h !== 12) h += 12;
    if (schedulerAmPm === 'AM' && h === 12) h = 0;
    const combinedDate = `${schedulerDueDay}T${String(h).padStart(2, '0')}:${schedulerMinute}:00`;

    const selectedDateTime = new Date(combinedDate);
    if (selectedDateTime < new Date()) {
      toast.warning('Please select a future date and time for the follow-up.', 'Invalid Schedule Time');
      return;
    }

    const updatedLead: Lead = {
      ...lead,
      status: pendingTargetStatus as LeadStatus,
      followUpAt: combinedDate,
      notes: schedulerRemarks ? `${lead.notes ? lead.notes + '\n' : ''}[Follow-up Remark]: ${schedulerRemarks}` : lead.notes,
      updatedAt: new Date().toISOString()
    };

    onUpdateLead(updatedLead);
    fetchWithTenantAuth('/api/leads', {
      method: 'POST',
      body: JSON.stringify(updatedLead)
    }).catch(console.warn);

    const formattedDisplay = new Date(combinedDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    onAddActivity({
      id: `act-${Date.now()}`,
      leadId: lead.id,
      agentId: lead.ownerAgentId,
      agentName: lead.ownerAgentName,
      type: 'task',
      title: 'Follow-Up Scheduled',
      description: `Follow-up set for ${formattedDisplay}.${schedulerRemarks ? ` Remark: "${schedulerRemarks}"` : ''}`,
      timestamp: new Date().toISOString()
    });

    setShowFollowUpScheduler(false);
    setSchedulerRemarks('');
  };

  const handleDeleteActivity = (activityId: string) => {
    if (!lead) return;
    const targetAct = (lead.activities || []).find((a) => a.id === activityId);
    const updatedActivities = (lead.activities || []).filter((a) => a.id !== activityId);
    
    // If the activity was a task creation or follow-up, also clear corresponding lead task/follow-up if needed
    let updatedTasks = lead.tasks;
    if (targetAct?.type === 'task' && Array.isArray(lead.tasks)) {
      updatedTasks = lead.tasks.filter((t) => !targetAct.description?.includes(t.title) && !targetAct.title?.includes(t.title));
    }

    const updatedLead: Lead = {
      ...lead,
      activities: updatedActivities,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString()
    };

    onUpdateLead(updatedLead);

    // Direct database persistence
    fetchWithTenantAuth('/api/leads', {
      method: 'POST',
      body: JSON.stringify(updatedLead)
    }).catch(console.warn);

    // Call DELETE endpoint
    fetchWithTenantAuth(`/api/activities/${activityId}`, {
      method: 'DELETE'
    }).catch(console.warn);
  };

  const handleCreateFollowUp = () => {
    let h = parseInt(followupHour, 10);
    if (followupAmPm === 'PM' && h !== 12) h += 12;
    if (followupAmPm === 'AM' && h === 12) h = 0;
    const combinedDate = `${followupDueDay}T${String(h).padStart(2, '0')}:${followupMinute}:00`;

    const selectedDateTime = new Date(combinedDate);
    if (selectedDateTime < new Date()) {
      toast.warning('Cannot schedule a follow-up in the past. Please select a future date and time.', 'Invalid Schedule Time');
      return;
    }

    const selectedAgent = agents.find((a) => a.id === followupAssigneeId);
    const finalAssigneeId = followupAssigneeId || lead.ownerAgentId || lead.assignedTo;
    const finalAssigneeName = selectedAgent ? selectedAgent.name : (lead.ownerAgentName || 'Unassigned');

    const activityText = followupNote.trim() || 'Follow-up scheduled.';
    onAddActivity({
      leadId: lead.id,
      type: 'note',
      title: `Follow-Up${combinedDate ? ': ' + new Date(combinedDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}`,
      description: `${activityText} (Assigned to: ${finalAssigneeName})`,
    });
    if (combinedDate) {
      onUpdateLead({
        ...lead,
        followUpAt: combinedDate,
        status: 'Follow Up',
        ownerAgentId: finalAssigneeId,
        ownerAgentName: finalAssigneeName,
        assignedTo: finalAssigneeId,
        updatedAt: new Date().toISOString()
      });
    }
    setFollowupNote('');
    setFollowupDueDay(new Date().toISOString().slice(0, 10));
    setFollowupHour('09');
    setFollowupMinute('00');
    setFollowupAmPm('AM');
    setActiveActionType(null);
  };

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showCampaignMenu, setShowCampaignMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [isLostReasonMenuOpen, setIsLostReasonMenuOpen] = useState(false);
  const lostReasonDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (lostReasonDropdownRef.current && !lostReasonDropdownRef.current.contains(e.target as Node)) {
        setIsLostReasonMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (followUpDate) {
      const selected = new Date(followUpDate);
      if (selected < new Date()) {
        toast.warning('Cannot schedule a follow-up in the past. Please select a future date and time.', 'Invalid Schedule Time');
        return;
      }
    }
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

  const renderDrawerContent = () => (
    <div className={`flex-1 w-full h-full bg-[#fafafa] flex flex-col overflow-hidden relative ${isEmbedded ? 'rounded-xl border border-slate-200/90 shadow-2xs' : 'shadow-2xl border-l border-slate-200'}`}>
      
      {/* Top Navigation Bar */}
      {isEmbedded ? (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-slate-200 z-10 shrink-0">
          {campaignHandle ? (
            <span className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-bold truncate max-w-[200px]">
              {campaignHandle}
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">{lead.name}</span>
          )}

          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600">
            <button onClick={handlePrevLead} className="px-2 py-1 hover:text-slate-900 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-1 cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="px-1.5 text-[11px] text-slate-700 font-mono">
              {currentIndex + 1} of {totalLeadsCount}
            </span>
            <button onClick={handleNextLead} className="px-2.5 py-1 bg-[#3a2088] hover:bg-[#2c186b] text-white rounded-lg flex items-center space-x-1 cursor-pointer shadow-2xs active:scale-95 transition-all">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Next</span>
            </button>
            {onClose && (
              <button 
                onClick={onClose} 
                className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer ml-1" 
                title="Expand full lead record"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Top Close Header with Prev/Next Navigation */}
          <div className="md:hidden flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200 z-20 shrink-0">
            <button 
              onClick={onClose}
              className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
            <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{lead.name}</span>
            <div className="flex items-center space-x-1 text-xs font-semibold text-slate-600">
              <button onClick={handlePrevLead} className="p-1 hover:text-slate-900 rounded-md bg-slate-50 border border-slate-200 cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[11px] text-slate-700">{currentIndex + 1}/{totalLeadsCount}</span>
              <button onClick={handleNextLead} className="p-1 hover:text-slate-900 rounded-md bg-slate-50 border border-slate-200 cursor-pointer">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Desktop Top Floating Navigation */}
          <div className="hidden md:flex absolute top-4 right-6 z-10 items-center bg-white border border-slate-200 rounded-full px-1 py-1 shadow-sm text-xs font-semibold text-slate-600">
           <button onClick={handlePrevLead} className="px-3 py-1 hover:text-slate-900 transition-colors flex items-center space-x-1 cursor-pointer rounded-full hover:bg-slate-50">
             <ChevronLeft className="w-3.5 h-3.5"/> <span>Prev</span>
           </button>
           <span className="px-3 text-slate-800 border-x border-slate-200">{currentIndex + 1} <span className="text-slate-400 font-normal">of</span> {totalLeadsCount}</span>
           <button onClick={handleNextLead} className="px-3 py-1 hover:text-slate-900 transition-colors flex items-center space-x-1 cursor-pointer rounded-full hover:bg-slate-50">
             <span>Next</span> <ChevronRight className="w-3.5 h-3.5"/>
           </button>
          </div>
        </>
      )}

      {/* Scrollable Feed Container */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        <div className={`max-w-4xl mx-auto px-3 sm:px-6 pb-12 ${isEmbedded ? 'pt-4' : 'pt-12 sm:pt-16'}`}>
            
            {/* Detailed Header */}
            <div className="mb-6 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden mt-2 sm:mt-6">
               {/* Top Title Row */}
               <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-3.5 sm:p-5 gap-3 border-b border-slate-100">
                 <div className="w-full sm:w-auto">
                   <h1 className="text-lg sm:text-[22px] font-bold text-slate-800 tracking-tight font-serif break-words">{lead.name}</h1>
                   
                   <div className="flex flex-wrap items-center gap-2 mt-2">
                     {/* Status Dropdown */}
                      {(() => {
                        const stageConfig = stages.find(s => s.name.toLowerCase() === (lead.status || '').toLowerCase());
                        const color = stageConfig?.color || '#10B981';
                        const stageOptions: DropdownOption<string>[] = stages.map(s => ({
                          value: s.name,
                          label: s.name
                        }));
                        return (
                          <CustomDropdown<string>
                            value={lead.status}
                            onChange={(newStatus) => handleStageSelect(newStatus)}
                            options={stageOptions}
                            align="left"
                            className="font-semibold py-1 px-2.5 rounded-lg text-xs"
                            style={{ backgroundColor: `${color}1A`, color: color, borderColor: `${color}50` }}
                          />
                        );
                      })()}

                      {/* Scheduled Follow-Up Date/Time Pill (Only for Follow Up stage) */}
                      {lead.followUpAt && (lead.status === 'Follow Up' || lead.status === 'Follow-Up' || (lead.status || '').toLowerCase().includes('follow')) && (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingTargetStatus(lead.status || 'Follow Up');
                            const d = new Date(lead.followUpAt!);
                            if (!isNaN(d.getTime())) {
                              setSchedulerDueDay(lead.followUpAt!.slice(0, 10));
                              let h = d.getHours();
                              const isPm = h >= 12;
                              if (h > 12) h -= 12;
                              if (h === 0) h = 12;
                              setSchedulerHour(String(h).padStart(2, '0'));
                              setSchedulerMinute(String(d.getMinutes()).padStart(2, '0'));
                              setSchedulerAmPm(isPm ? 'PM' : 'AM');
                            }
                            setShowFollowUpScheduler(true);
                          }}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          title="Click to reschedule follow-up date and time"
                        >
                          <Calendar className="w-3.5 h-3.5 text-amber-700" />
                          <span>
                            {new Date(lead.followUpAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(lead.followUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </button>
                      )}

                      {/* Dynamic Custom Lost Reason Selector if status is Lost */}
                      {(lead.status === 'Lost' || lead.status?.toLowerCase() === 'lost') && (
                        <div className="relative" ref={lostReasonDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsLostReasonMenuOpen(!isLostReasonMenuOpen)}
                            className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/90 px-2.5 py-1 rounded-md text-xs font-semibold text-rose-900 transition-all cursor-pointer shadow-2xs group"
                            title="Select Reason for Lost Lead"
                          >
                            <span className="text-[11px] font-bold text-rose-700">Reason:</span>
                            <span className="font-semibold text-rose-900 max-w-[130px] truncate">
                              {lead.lostReason || 'Select Reason...'}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-rose-600 transition-transform ${isLostReasonMenuOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isLostReasonMenuOpen && (
                            <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200/90 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5 text-xs animate-in fade-in zoom-in-95 font-sans">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                                Reason for Lost Lead
                              </p>
                              {(lostReasons || ['No Need', 'Unable to Connect', 'Budget Issues', 'Product does not fit need', 'Lost to competitor', 'Unknown Reason', 'Not eligible', 'Junk']).map((r) => {
                                const isSelected = lead.lostReason === r;
                                return (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => {
                                      onUpdateLead({ ...lead, lostReason: r });
                                      setIsLostReasonMenuOpen(false);
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-rose-50 text-rose-900 font-bold'
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2 truncate">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                      <span className="truncate">{r}</span>
                                    </div>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                     
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
                            <button onClick={(e) => { e.stopPropagation(); setShowMoreOptions(false); navigator.clipboard.writeText(`${window.location.origin}/lead/${lead.id}`); toast.success('Lead link copied to clipboard!', 'Link Copied'); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700">Copy Log Link</button>
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

                {/* Dynamic 2-Column Grid of Settings Fields with Inline Editing */}
                <div className="p-5">
                  {(() => {
                    const mainFields = detailFields.slice(0, 8);
                    const moreFields = detailFields.slice(8);

                    const renderFieldItem = (field: CustomFieldDef) => {
                      const fieldKey = field.name || field.id || field.label;
                      const isEditing = editingFieldKey === fieldKey;
                      const displayVal = getLeadFieldDisplayValue(field);
                      const isRecentlySaved = saveSuccessFieldKey === fieldKey;

                      return (
                        <div key={field.id || field.name || field.label} className="group relative">
                          {/* Field Header */}
                          <div className="flex items-center text-slate-400 mb-1 justify-between">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <span className="shrink-0 flex items-center justify-center">
                                {getFieldTypeIcon(field.type, field.name)}
                              </span>
                              <span className="truncate text-xs font-medium text-slate-500">
                                {field.label}
                              </span>
                              {field.name === 'phone' && (
                                <div className="ml-1.5 w-4 h-4 bg-indigo-100 rounded flex items-center justify-center text-[9px] font-bold text-indigo-700 shrink-0">
                                  D
                                </div>
                              )}
                            </div>

                            {isRecentlySaved && (
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center animate-in fade-in">
                                <Check className="w-3 h-3 mr-0.5 stroke-[3]" /> Saved
                              </span>
                            )}
                          </div>

                          {/* Field Body (Inline Editor vs Display) */}
                          {isEditing ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleSaveFieldEdit(field, editingValue);
                              }}
                              className="flex items-center space-x-1 mt-1"
                              onClick={(e) => e.stopPropagation()}
                            >                              <div className="w-full space-y-1">
                                <div className="flex items-center space-x-1">
                                  {field.type === 'dropdown' && field.options && field.options.length > 0 ? (
                                    <select
                                      autoFocus
                                      value={editingValue}
                                      onChange={(e) => {
                                        const newVal = e.target.value;
                                        setEditingValue(newVal);
                                        handleSaveFieldEdit(field, newVal);
                                      }}
                                      onBlur={() => handleSaveFieldEdit(field, editingValue)}
                                      className="w-full text-xs bg-white border border-indigo-500 rounded-md px-2 py-1 focus:outline-none shadow-xs cursor-pointer"
                                    >
                                      <option value="">Select option...</option>
                                      {field.options.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : field.type === 'phone' ? (
                                    <div className={`flex items-center w-full bg-white border ${fieldValidationError ? 'border-rose-500 ring-1 ring-rose-200' : 'border-indigo-500'} rounded-md px-2 py-0.5 shadow-xs`}>
                                      <span className="mr-1 text-sm">🇮🇳</span>
                                      <span className="text-xs text-slate-500 font-semibold mr-1">91</span>
                                      <input
                                        autoFocus
                                        type="tel"
                                        maxLength={10}
                                        value={editingValue.replace(/^\+?91\s*/, '')}
                                        onChange={(e) => {
                                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                                          setEditingValue(digitsOnly);
                                          const validation = validatePhone(digitsOnly, field.required);
                                          if (!validation.isValid && digitsOnly.length > 0) {
                                            setFieldValidationError(validation.error || 'Invalid phone number');
                                          } else {
                                            setFieldValidationError(null);
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSaveFieldEdit(field, editingValue);
                                          } else if (e.key === 'Escape') {
                                            setEditingFieldKey(null);
                                            setFieldValidationError(null);
                                          }
                                        }}
                                        onBlur={() => handleSaveFieldEdit(field, editingValue)}
                                        className="w-full text-xs focus:outline-none"
                                        placeholder="10-digit number"
                                      />
                                    </div>
                                  ) : field.type === 'date' ? (
                                    <input
                                      autoFocus
                                      type="date"
                                      value={editingValue}
                                      onChange={(e) => {
                                        const newVal = e.target.value;
                                        setEditingValue(newVal);
                                        handleSaveFieldEdit(field, newVal);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleSaveFieldEdit(field, editingValue);
                                        } else if (e.key === 'Escape') {
                                          setEditingFieldKey(null);
                                          setFieldValidationError(null);
                                        }
                                      }}
                                      onBlur={() => handleSaveFieldEdit(field, editingValue)}
                                      className="w-full text-xs bg-white border border-indigo-500 rounded-md px-2 py-1 focus:outline-none shadow-xs"
                                    />
                                  ) : field.type === 'number' || field.type === 'currency' ? (
                                    <input
                                      autoFocus
                                      type="number"
                                      min={field.minValue ?? 0}
                                      max={field.maxValue ?? 1000000000}
                                      value={editingValue}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditingValue(val);
                                        const res = validateCurrencyOrNumber(val, field, field.required);
                                        if (!res.isValid && val.trim() !== '') {
                                          setFieldValidationError(res.error || 'Invalid amount');
                                        } else {
                                          setFieldValidationError(null);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleSaveFieldEdit(field, editingValue);
                                        } else if (e.key === 'Escape') {
                                          setEditingFieldKey(null);
                                          setFieldValidationError(null);
                                        }
                                      }}
                                      onBlur={() => handleSaveFieldEdit(field, editingValue)}
                                      className={`w-full text-xs bg-white border ${fieldValidationError ? 'border-rose-500 ring-1 ring-rose-200' : 'border-indigo-500'} rounded-md px-2 py-1 focus:outline-none shadow-xs`}
                                      placeholder={field.placeholder || "0"}
                                    />
                                  ) : (
                                    <input
                                      autoFocus
                                      type={field.type === 'email' ? 'email' : 'text'}
                                      maxLength={field.maxLength}
                                      value={editingValue}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditingValue(val);
                                        const res = validateField(field, val);
                                        if (!res.isValid && val.trim() !== '') {
                                          setFieldValidationError(res.error || 'Invalid text');
                                        } else {
                                          setFieldValidationError(null);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleSaveFieldEdit(field, editingValue);
                                        } else if (e.key === 'Escape') {
                                          setEditingFieldKey(null);
                                          setFieldValidationError(null);
                                        }
                                      }}
                                      onBlur={() => handleSaveFieldEdit(field, editingValue)}
                                      className={`w-full text-xs bg-white border ${fieldValidationError ? 'border-rose-500 ring-1 ring-rose-200' : 'border-indigo-500'} rounded-md px-2 py-1 focus:outline-none shadow-xs`}
                                      placeholder={`Enter ${field.label}...`}
                                    />
                                  )}

                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSaveFieldEdit(field, editingValue)}
                                    className="p-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shrink-0 shadow-2xs"
                                    title="Save to database"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      setEditingFieldKey(null);
                                      setFieldValidationError(null);
                                    }}
                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer shrink-0"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {fieldValidationError && (
                                  <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 animate-in fade-in">
                                    <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                                    <span>{fieldValidationError}</span>
                                  </p>
                                )}
                              </div>
                            </form>
                          ) : (
                            <div
                              onClick={() => handleStartEditField(field)}
                              className="cursor-pointer flex items-center justify-between group/val rounded-md px-1 -mx-1 py-0.5 hover:bg-indigo-50/40 transition-colors"
                              title="Click to edit and update database"
                            >
                              <div className="font-medium text-slate-800 truncate text-[13px]">
                                {displayVal ? (
                                  field.type === 'phone' ? (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-base">🇮🇳</span>
                                      <span>91 {displayVal.replace(/^\+?91\s*/, '')}</span>
                                    </div>
                                  ) : (
                                    <span>{displayVal}</span>
                                  )
                                ) : (
                                  <span className="text-slate-300 font-normal">Empty</span>
                                )}
                              </div>
                              <Edit3 className="w-3 h-3 text-slate-300 opacity-0 group-hover/val:opacity-100 group-hover/val:text-indigo-600 transition-all shrink-0 ml-1" />
                            </div>
                          )}
                        </div>
                      );
                    };

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-[13px]">
                          {mainFields.map(renderFieldItem)}
                        </div>

                        {/* Show more / Show less divider for extra custom fields */}
                        {moreFields.length > 0 && (
                          <>
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

                            {showMoreFields && (
                              <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-[13px] pb-4">
                                {moreFields.map(renderFieldItem)}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

               {/* Action Bar */}
               <div className="bg-[#fcfcfc] border-t border-slate-100 p-1.5 sm:p-2 flex justify-between items-center text-[10px] font-medium text-slate-500 overflow-x-auto ios-scroll no-scrollbar shrink-0">
                 <button onClick={handleCallLead} className="min-w-[54px] flex-1 flex flex-col items-center justify-center space-y-1 hover:text-slate-800 transition-colors py-2 sm:py-3 cursor-pointer">
                   <Phone className="w-4 sm:w-5 h-4 sm:h-5 mb-0.5 sm:mb-1" strokeWidth={1.5} />
                   <span>CALL</span>
                 </button>
                 <button 
                   onClick={() => setActiveActionType(activeActionType === 'task' ? null : 'task')} 
                   className={`min-w-[54px] flex-1 flex flex-col items-center justify-center space-y-1 transition-colors py-2 sm:py-3 relative cursor-pointer ${
                     activeActionType === 'task' ? 'text-indigo-600 font-bold bg-indigo-50/60 rounded-xl' : 'hover:text-slate-800'
                   }`}
                 >
                   <CheckSquare className="w-4 sm:w-5 h-4 sm:h-5 mb-0.5 sm:mb-1" strokeWidth={1.5} />
                   <div className="flex items-center">
                     <span>TASK</span>
                     <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${activeActionType === 'task' ? 'rotate-180' : ''}`} />
                   </div>
                 </button>
                 <button onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`, '_blank')} className="min-w-[54px] flex-1 flex flex-col items-center justify-center space-y-1 hover:text-slate-800 transition-colors py-2 sm:py-3 cursor-pointer">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-4 sm:w-5 h-4 sm:h-5 mb-0.5 sm:mb-1 opacity-70 grayscale hover:grayscale-0 transition-all"/>
                   <span>WHATSAPP</span>
                 </button>
                 <button onClick={() => { window.location.href = `sms:${lead.phone}`; }} className="min-w-[54px] flex-1 flex flex-col items-center justify-center space-y-1 hover:text-slate-800 transition-colors py-2 sm:py-3 cursor-pointer">
                   <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5 mb-0.5 sm:mb-1" strokeWidth={1.5} />
                   <span>SMS</span>
                 </button>
                 <button 
                   onClick={() => setActiveActionType(activeActionType === 'note' ? null : 'note')} 
                   className={`min-w-[54px] flex-1 flex flex-col items-center justify-center space-y-1 transition-colors py-2 sm:py-3 cursor-pointer ${
                     activeActionType === 'note' ? 'text-indigo-600 font-bold bg-indigo-50/60 rounded-xl' : 'hover:text-slate-800'
                   }`}
                 >
                   <Clipboard className="w-4 sm:w-5 h-4 sm:h-5 mb-0.5 sm:mb-1" strokeWidth={1.5} />
                   <span>NOTE</span>
                 </button>
                 <button 
                   onClick={() => setActiveActionType(activeActionType === 'followup' ? null : 'followup')} 
                   className={`min-w-[58px] flex-1 flex flex-col items-center justify-center space-y-1 transition-colors py-2 sm:py-3 cursor-pointer ${
                     activeActionType === 'followup' ? 'text-indigo-600 font-bold bg-indigo-50/60 rounded-xl' : 'hover:text-indigo-700'
                   }`}
                 >
                    <CalendarPlus className="w-4 sm:w-5 h-4 sm:h-5 mb-0.5 sm:mb-1" strokeWidth={1.5} />
                    <span>FOLLOW UP</span>
                 </button>
                 <button className="min-w-[54px] flex-1 flex flex-col items-center justify-center space-y-1 hover:text-slate-800 transition-colors py-2 sm:py-3 cursor-pointer">
                   <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 mb-0.5 sm:mb-1" strokeWidth={1.5} />
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
                    <CustomDropdown<string>
                      value={callDisposition}
                      onChange={(val) => setCallDisposition(val)}
                      options={[
                        { value: 'Connected', label: 'Connected / Answered' },
                        { value: 'RNR / No Answer', label: 'RNR / No Answer' },
                        { value: 'Busy', label: 'Busy Signal' },
                        { value: 'Call Back Requested', label: 'Call Back Requested' },
                      ]}
                      align="left"
                      wrapperClassName="w-full"
                      className="w-full bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">Duration</label>
                    <CustomDropdown<string>
                      value={callDuration}
                      onChange={(val) => setCallDuration(val)}
                      options={[
                        { value: '1 min', label: '1 min' },
                        { value: '2 min', label: '2 min' },
                        { value: '5 min', label: '5 min' },
                        { value: '10 min', label: '10 min' },
                      ]}
                      align="left"
                      wrapperClassName="w-full"
                      className="w-full bg-white"
                    />
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
                    <CheckSquare className="w-4 h-4 text-[#5034a8]" />
                    <span>Create Task / Reminder for {lead.name}</span>
                  </h4>
                  <button onClick={() => setActiveActionType(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Task Title */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">
                    Task Title / Description <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Call back regarding pricing proposal, send brochure..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs font-sans"
                    autoFocus
                  />
                </div>

                {/* Due Date & Quick Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">
                      Due Date & Time
                    </label>
                    <input 
                      type="datetime-local" 
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">
                      Quick Shortcuts
                    </label>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[
                        { label: 'In 2 Hours', hours: 2 },
                        { label: 'Tomorrow 10 AM', tomorrow: true },
                        { label: 'In 3 Days', days: 3 },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            if (preset.hours) {
                              now.setHours(now.getHours() + preset.hours);
                            } else if (preset.tomorrow) {
                              now.setDate(now.getDate() + 1);
                              now.setHours(10, 0, 0, 0);
                            } else if (preset.days) {
                              now.setDate(now.getDate() + preset.days);
                              now.setHours(10, 0, 0, 0);
                            }
                            setTaskDueDate(now.toISOString().slice(0, 16));
                          }}
                          className="px-2 py-1 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setActiveActionType(null)} 
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleScheduleTaskAction}
                    className="px-4 py-1.5 bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 mr-1" />
                    <span>Create Task</span>
                  </button>
                </div>
              </div>
            )}

            {activeActionType === 'followup' && (
              <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm mb-4 space-y-3 font-sans animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <CalendarPlus className="w-4 h-4 text-[#5034a8]" />
                    <span>Create Follow-Up</span>
                  </h4>
                  <button onClick={() => setActiveActionType(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">Note</label>
                  <textarea
                    rows={3}
                    value={followupNote}
                    onChange={(e) => setFollowupNote(e.target.value)}
                    placeholder="What should be discussed in this follow-up?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 resize-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider font-mono">Assignee</label>
                  <div className="relative">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <select
                      value={followupAssigneeId}
                      onChange={(e) => setFollowupAssigneeId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 cursor-pointer"
                    >
                      <option value="">Select Assignee</option>
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Directly assigned to this lead's owner ({lead.ownerAgentName || 'Unassigned'}).
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider font-mono">Date & Time</label>
                  <div className="space-y-2">
                    {/* Date picker */}
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="date"
                        required
                        value={followupDueDay}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setFollowupDueDay(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    {/* Time selector */}
                    <div className="flex items-center space-x-2">
                      {/* Hour */}
                      <div className="flex-1">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:border-indigo-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400 ml-2.5 shrink-0" />
                          <select
                            value={followupHour}
                            onChange={(e) => setFollowupHour(e.target.value)}
                            className="flex-1 bg-transparent px-2 py-1.5 text-xs text-slate-900 focus:outline-none cursor-pointer"
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
                          value={followupMinute}
                          onChange={(e) => setFollowupMinute(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 cursor-pointer"
                        >
                          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      {/* AM/PM switcher */}
                      <div className="flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
                        {(['AM', 'PM'] as const).map((period) => (
                          <button
                            key={period}
                            type="button"
                            onClick={() => setFollowupAmPm(period)}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                              followupAmPm === period
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-1">
                  <button onClick={() => setActiveActionType(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                  <button onClick={handleCreateFollowUp} className="px-4 py-1.5 bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer">Save Follow-Up</button>
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
                <button 
                  className="text-[#5034a8] font-bold text-[13px] border-b-2 border-[#5034a8] pb-3 px-1 cursor-default"
                >
                  Activity History
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

                {/* Action Floating Dropdown Box */}
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
                        { id: 'note', name: 'Note', icon: FileText },
                        { id: 'call', name: 'Outgoing Call', icon: PhoneOutgoing },
                        { id: 'whatsapp', name: 'Whatsapp', icon: MessageCircle },
                        { id: 'email', name: 'Email', icon: Mail },
                        { id: 'file', name: 'File', icon: Paperclip },
                        { id: 'payment', name: 'Payment', icon: IndianRupee },
                        { id: 'sms', name: 'Sms', icon: MessageSquare },
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

            {/* Interactive Filter Bar: Filter icon, All Actions, Time, Team */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4 px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl shadow-2xs text-xs font-medium text-slate-700 select-none">
              <div className="flex items-center text-slate-400 pl-0.5">
                <Filter className="w-4 h-4" />
              </div>

              {/* 1. All Actions Filter Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsActionDropdownOpen(!isActionDropdownOpen);
                    setIsTimeDropdownOpen(false);
                    setIsTeamDropdownOpen(false);
                  }}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    actionFilter !== 'all'
                      ? 'bg-purple-50 border-purple-300 text-purple-900'
                      : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="capitalize">
                    {actionFilter === 'all'
                      ? 'All Actions'
                      : actionFilter === 'creation'
                      ? 'Lead Creation'
                      : actionFilter === 'stage_change'
                      ? 'Status Changes'
                      : actionFilter === 'edit'
                      ? 'Field Updates'
                      : actionFilter === 'call'
                      ? 'Calls'
                      : actionFilter === 'whatsapp'
                      ? 'WhatsApp'
                      : actionFilter === 'note'
                      ? 'Notes'
                      : 'API / Webhooks'}
                  </span>
                  {actionFilter !== 'all' ? (
                    <X
                      className="w-3.5 h-3.5 text-purple-600 hover:text-purple-900 ml-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionFilter('all');
                      }}
                    />
                  ) : (
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isActionDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {isActionDropdownOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-[calc(100%+4px)] w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 text-xs font-sans"
                  >
                    {[
                      { id: 'all', label: 'All Actions' },
                      { id: 'creation', label: 'Lead Creation' },
                      { id: 'stage_change', label: 'Status Changes' },
                      { id: 'edit', label: 'Field Updates' },
                      { id: 'call', label: 'Calls' },
                      { id: 'whatsapp', label: 'WhatsApp' },
                      { id: 'note', label: 'Notes' },
                      { id: 'api', label: 'API & CAPI Events' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setActionFilter(opt.id as any);
                          setIsActionDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          actionFilter === opt.id
                            ? 'bg-purple-50 text-[#5034a8] font-bold'
                            : 'text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {actionFilter === opt.id && <Check className="w-3.5 h-3.5 text-[#5034a8]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Time Filter Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsTimeDropdownOpen(!isTimeDropdownOpen);
                    setIsActionDropdownOpen(false);
                    setIsTeamDropdownOpen(false);
                  }}
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    timeFilter !== 'all'
                      ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
                  <span>
                    {timeFilter === 'all'
                      ? 'Time'
                      : timeFilter === 'today'
                      ? 'Today'
                      : timeFilter === 'yesterday'
                      ? 'Yesterday'
                      : timeFilter === '7days'
                      ? 'Last 7 Days'
                      : 'Last 30 Days'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTimeDropdownOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-[calc(100%+4px)] w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 text-xs font-sans"
                  >
                    {[
                      { id: 'all', label: 'All Time' },
                      { id: 'today', label: 'Today (Past 24h)' },
                      { id: 'yesterday', label: 'Yesterday' },
                      { id: '7days', label: 'Last 7 Days' },
                      { id: '30days', label: 'Last 30 Days' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTimeFilter(opt.id as any);
                          setIsTimeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          timeFilter === opt.id
                            ? 'bg-purple-50 text-[#5034a8] font-bold'
                            : 'text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {timeFilter === opt.id && <Check className="w-3.5 h-3.5 text-[#5034a8]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Team Filter Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsTeamDropdownOpen(!isTeamDropdownOpen);
                    setIsActionDropdownOpen(false);
                    setIsTimeDropdownOpen(false);
                  }}
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    teamFilter !== 'all'
                      ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
                  <span>
                    {teamFilter === 'all'
                      ? 'Team'
                      : teamFilter === 'bot'
                      ? 'System / Bot'
                      : agents.find((a) => a.id === teamFilter)?.name || 'Team Member'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isTeamDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTeamDropdownOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-[calc(100%+4px)] w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 text-xs font-sans"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setTeamFilter('all');
                        setIsTeamDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        teamFilter === 'all'
                          ? 'bg-purple-50 text-[#5034a8] font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span>All Team</span>
                      {teamFilter === 'all' && <Check className="w-3.5 h-3.5 text-[#5034a8]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTeamFilter('bot');
                        setIsTeamDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        teamFilter === 'bot'
                          ? 'bg-purple-50 text-[#5034a8] font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span>System & Integrations</span>
                      {teamFilter === 'bot' && <Check className="w-3.5 h-3.5 text-[#5034a8]" />}
                    </button>

                    <div className="my-1 border-t border-slate-100" />
                    <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Users / Telecallers
                    </div>

                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => {
                          setTeamFilter(agent.id);
                          setIsTeamDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          teamFilter === agent.id
                            ? 'bg-purple-50 text-[#5034a8] font-bold'
                            : 'text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[8px] font-bold">
                            {getAgentInitials(agent.name)}
                          </span>
                          <span className="truncate">{agent.name}</span>
                        </div>
                        {teamFilter === agent.id && <Check className="w-3.5 h-3.5 text-[#5034a8]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Unified Activity Timeline matching screenshot */}
            <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden mb-8">
              <div className="divide-y divide-slate-100">
                {unifiedActivities.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No activity found matching the selected filters.
                  </div>
                ) : (
                  unifiedActivities.map((act) => {
                    const isFacebook = act.type === 'facebook_form' || (act.title || '').toLowerCase().includes('facebook');
                    const isCapi = act.type === 'capi' || (act.title || '').toLowerCase().includes('capi');
                    const isEdit = act.type === 'edit';
                    const isTask = act.type === 'task';
                    const isStage = act.type === 'stage_change';
                    const isCall = act.type === 'call';
                    const isWhatsapp = act.type === 'whatsapp';
                    const isNote = act.type === 'note';

                    const avatarInitials = act.agentName ? getAgentInitials(act.agentName) : 'KA';

                    return (
                      <div 
                        key={act.id} 
                        className="flex items-center px-4 py-3.5 hover:bg-slate-50/70 transition-colors group select-none text-[13px]"
                      >
                        {/* Pin Icon */}
                        <div className="flex-shrink-0 w-8 flex items-center justify-center text-slate-300 group-hover:text-slate-400">
                          <Pin className="w-4 h-4 rotate-45" />
                        </div>

                        {/* Type Icon */}
                        <div className="flex-shrink-0 w-8 flex items-center justify-center">
                          {isFacebook ? (
                            <Facebook className="w-4 h-4 text-blue-600" />
                          ) : isCapi ? (
                            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-indigo-600">API</span>
                            </div>
                          ) : isEdit ? (
                            <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                              <Edit3 className="w-3 h-3" />
                            </div>
                          ) : isTask ? (
                            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                              <Clock className="w-3 h-3" />
                            </div>
                          ) : isStage ? (
                            <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                              <RotateCw className="w-3 h-3" />
                            </div>
                          ) : isCall ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <Phone className="w-3 h-3" />
                            </div>
                          ) : isWhatsapp ? (
                            <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                              <MessageCircle className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                              <FileText className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        {/* Activity Description */}
                        <div className="flex-1 min-w-0 flex items-center pl-2 text-slate-700">
                          {isFacebook ? (
                            <span className="truncate">
                              Lead Capture from <span className="font-semibold text-slate-900">Inbound Lead Form</span> & <span className="font-semibold text-slate-900">Connected Social Page</span>
                            </span>
                          ) : isCapi ? (
                            <span className="truncate">
                              <span className="font-bold text-indigo-600 mr-2">CAPI</span> <span className="font-mono text-slate-800">200</span>
                            </span>
                          ) : isEdit ? (
                            <span className="truncate">
                              <span className="font-bold text-slate-900">{act.title}</span> {act.description && <span className="text-slate-600 font-normal"> - {act.description}</span>}
                            </span>
                          ) : isStage ? (
                            <span className="truncate">
                              <span className="font-bold text-slate-900">{act.title}:</span> <span className="text-slate-600">{act.description}</span>
                            </span>
                          ) : isTask ? (
                            <span className="truncate">
                              <span className="font-medium text-slate-800">{act.description || act.title}</span>
                            </span>
                          ) : (
                            <span className="truncate">
                              <span className="font-bold text-slate-900 mr-1.5">{act.title}</span>
                              {act.description && <span className="text-slate-600 font-normal">{act.description}</span>}
                            </span>
                          )}
                        </div>

                        {/* Relative Time, Delete Action & Agent Initials Badge */}
                        <div className="flex-shrink-0 ml-4 flex items-center space-x-2.5">
                          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                            {getRelativeTime(act.timestamp)}
                          </span>

                          {/* Delete Activity / Task Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete this activity / task record?`)) {
                                handleDeleteActivity(act.id);
                              }
                            }}
                            className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete this activity log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {isFacebook || isCapi || act.agentId === 'bot' ? (
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                              <Bot className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-200 text-[9px] font-bold text-indigo-700 tracking-wider">
                              {avatarInitials}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form Modal (Unchanged structurally, just ensuring it still renders) */}
        {isEditingLead && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 animate-in fade-in duration-200">
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
                    <select value={editForm.status || (stages[0]?.name || 'Fresh')} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm">
                      {(stages && stages.length > 0 ? stages : [{ name: 'Fresh' }, { name: 'Contacted' }, { name: 'Follow Up' }, { name: 'Demo Scheduled' }, { name: 'Proposal Sent' }, { name: 'Converted' }, { name: 'Lost' }]).map((stg) => (
                        <option key={stg.name} value={stg.name}>{stg.name}</option>
                      ))}
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

        {/* Modal: Schedule Follow-Up Date & Time */}
        {showFollowUpScheduler && (
          <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Schedule Follow-Up</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowFollowUpScheduler(false)} 
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmFollowUpSchedule} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Follow-Up Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={schedulerDueDay}
                    onChange={(e) => setSchedulerDueDay(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Follow-Up Time *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={schedulerHour}
                      onChange={(e) => setSchedulerHour(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>

                    <select
                      value={schedulerMinute}
                      onChange={(e) => setSchedulerMinute(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    <select
                      value={schedulerAmPm}
                      onChange={(e) => setSchedulerAmPm(e.target.value as 'AM' | 'PM')}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Follow-Up Remarks / Purpose</label>
                  <textarea
                    rows={2}
                    value={schedulerRemarks}
                    onChange={(e) => setSchedulerRemarks(e.target.value)}
                    placeholder="e.g. Call client regarding quote discussion and demo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowFollowUpScheduler(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md shadow-indigo-100"
                  >
                    Set Follow-Up
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );

  if (isEmbedded) {
    return (
      <div className="w-full h-full min-h-[720px] flex flex-col font-sans">
        {renderDrawerContent()}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Subtle Gray Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/20 transition-opacity z-40 cursor-pointer"
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

        {renderDrawerContent()}
      </div>
    </div>
  );
};
