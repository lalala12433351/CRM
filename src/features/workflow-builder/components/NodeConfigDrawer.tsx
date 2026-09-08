import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  Plus,
  Code,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Search,
  UserPlus,
  Calendar,
  Phone,
  Check,
  Tag,
  FileText,
  MessageSquare,
  Settings,
  User,
  Flag,
  AlarmClock,
  CheckSquare,
  ArrowLeft,
  Building2,
  MapPin,
  Layers,
  Star,
  Mail
} from 'lucide-react';
import { CustomWorkflowNode, ConditionRule, HeaderKeyValue } from '../types/workflow.types';
import { StoredApiTemplate, getApiTemplates, fetchApiTemplatesFromApi } from '../../../utils/templateStorage';
import { saveWorkflowActionToApi } from '../../../utils/actionStorage';
import { fetchWithTenantAuth } from '../../../lib/auth';
import { INITIAL_AGENTS, INITIAL_CUSTOM_FIELDS, INITIAL_STAGES } from '../../../constants/initialState';
import { CreateApiTemplateModal } from './CreateApiTemplateModal';
import { DynamicIcon } from './DynamicIcon';
import { WorkflowIcon } from './WorkflowIcons';
import { ConditionFilterChipsBar } from '../../../components/ConditionFilterChipsBar';
import { AddConditionModal } from '../../../components/AddConditionModal';
import { DynamicCondition } from '../../../utils/conditionFilterEngine';

interface NodeConfigDrawerProps {
  selectedNode: CustomWorkflowNode | null;
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, updatedData: Partial<CustomWorkflowNode['data']>) => void;
  onDeleteNode: (nodeId: string) => void;
}

interface AgentOption {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

interface LeadFieldOption {
  key: string;
  label: string;
  tag: string;
  type?: string;
  options?: string[];
}

export interface FieldUpdateRow {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType?: string;
  operation: 'replace' | 'empty';
  valueMode: 'variable' | 'custom';
  variableKey?: string;
  variableLabel?: string;
  customValue?: string;
}

const ACTION_VARIABLES = [
  { key: 'action.employee_phone', label: 'Employee Phone Number', icon: Phone },
  { key: 'action.message_text', label: 'Message Text', iconText: 'T' },
  { key: 'action.media_url', label: 'Media URL', icon: FileText },
  { key: 'action.message_type', label: 'Message type', icon: MessageSquare }
];

const CTWA_ACTION_VARIABLES = [
  { key: 'ctwa.ad_id', label: 'Ad ID' },
  { key: 'ctwa.ad_title', label: 'Ad Title' },
  { key: 'ctwa.ad_source', label: 'Ad Source' },
  { key: 'ctwa.campaign_name', label: 'Campaign Name' },
  { key: 'ctwa.referral_url', label: 'Referral URL' }
];

export interface WhatsAppAccountOption {
  id: string;
  name: string;
  phoneNumber?: string;
}

const DEFAULT_WA_ACCOUNTS: WhatsAppAccountOption[] = [
  { id: 'wa_official', name: 'Official WhatsApp Business Account', phoneNumber: '+91 9876543210' },
  { id: 'wa_sales', name: 'Sales Support Account', phoneNumber: '+91 9123456780' },
  { id: 'wa_marketing', name: 'Marketing Broadcast Account', phoneNumber: '+91 9988776655' }
];

export const DEFAULT_LIST_OPTIONS: string[] = [
  'High Intent Buyers List',
  'Cold Outreach Segment',
  'Marketing Campaign Audience',
  'Webinar / Event Attendees',
  'VIP / Enterprise Segment',
  'Website Inbound Leads',
  'Meta Ads Leads',
  'WhatsApp Broadcast List',
  'Warm Prospects'
];

export const IVR_ACTION_TYPES = [
  'Inbound Call',
  'Outbound Call',
  'Missed Call',
  'Call Completed',
  'Call Recording Available',
  'IVR Feedback / DTMF'
];

export interface IvrFieldDef {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  isUserPicker?: boolean;
  defaultVar?: string;
}

export const IVR_MAPPING_FIELDS: IvrFieldDef[] = [
  { key: 'call_id', label: 'Call Id', required: true, defaultVar: '{{event.call_id}}' },
  { key: 'virtual_number', label: 'Virtual Number', required: true, defaultVar: '{{event.virtual_number}}' },
  { key: 'employee_number', label: 'Employee Number', required: true, defaultVar: '{{action.employee_phone}}' },
  { key: 'customer_number', label: 'Customer Number', required: true, defaultVar: '{{lead.phone}}' },
  { key: 'note', label: 'Note', required: false, defaultVar: '{{event.note}}' },
  { key: 'status', label: 'Status', required: false, defaultVar: '{{event.status}}' },
  { key: 'duration', label: 'Duration', required: true, placeholder: 'Empty', defaultVar: '{{event.call_duration_seconds}}' },
  { key: 'source', label: 'Source', required: false, defaultVar: '{{lead.source}}' },
  { key: 'call_recording_url', label: 'Call Recording URL', required: true, defaultVar: '{{event.recording_url}}' },
  { key: 'agent_id', label: 'Agent Id', required: false, defaultVar: '{{agent.id}}' },
  { key: 'creation_timestamp', label: 'Creation Timestamp', required: false, defaultVar: '{{event.timestamp}}' },
  { key: 'employee_id', label: 'Employee Id', required: false, placeholder: 'Select a User', isUserPicker: true }
];

export const IVR_EVENT_VARIABLES = [
  { key: 'event.call_id', label: 'Call Id', tag: '{{event.call_id}}' },
  { key: 'event.virtual_number', label: 'Virtual Number', tag: '{{event.virtual_number}}' },
  { key: 'event.employee_number', label: 'Employee Number', tag: '{{event.employee_number}}' },
  { key: 'event.customer_number', label: 'Customer Number', tag: '{{event.customer_number}}' },
  { key: 'event.note', label: 'Call Note', tag: '{{event.note}}' },
  { key: 'event.status', label: 'Call Status', tag: '{{event.status}}' },
  { key: 'event.call_duration_seconds', label: 'Call Duration (seconds)', tag: '{{event.call_duration_seconds}}' },
  { key: 'event.source', label: 'Call Source', tag: '{{event.source}}' },
  { key: 'event.recording_url', label: 'Call Recording URL', tag: '{{event.recording_url}}' },
  { key: 'agent.id', label: 'Agent Id', tag: '{{agent.id}}' },
  { key: 'event.timestamp', label: 'Creation Timestamp', tag: '{{event.timestamp}}' }
];

export interface StageOption {
  id: string;
  name: string;
  color: string;
  category: string;
}

const DEFAULT_STATUS_GROUPS: { category: string; stages: StageOption[] }[] = [
  {
    category: 'Fresh',
    stages: [
      { id: 'fresh', name: 'Fresh', color: '#4A705E', category: 'Fresh' }
    ]
  },
  {
    category: 'Active',
    stages: [
      { id: 'rnr', name: 'RNR', color: '#EF4444', category: 'Active' },
      { id: 'interested', name: 'Interested', color: '#6B7280', category: 'Active' },
      { id: 'warm', name: 'Warm', color: '#84CC16', category: 'Active' },
      { id: 'iata', name: 'IATA', color: '#8B5CF6', category: 'Active' },
      { id: 'next_batch', name: 'Next Batch', color: '#78350F', category: 'Active' },
      { id: 'contacted', name: 'Contacted', color: '#3B82F6', category: 'Active' },
      { id: 'follow_up', name: 'Follow Up', color: '#F59E0B', category: 'Active' },
      { id: 'demo_scheduled', name: 'Demo Scheduled', color: '#06B6D4', category: 'Active' },
      { id: 'proposal_sent', name: 'Proposal Sent', color: '#10B981', category: 'Active' }
    ]
  },
  {
    category: 'Closed',
    stages: [
      { id: 'converted', name: 'Converted', color: '#059669', category: 'Closed' },
      { id: 'lost', name: 'Lost', color: '#DC2626', category: 'Closed' }
    ]
  }
];

export function buildStatusGroupsFromApi(
  pipelineStages: any[] = [],
  fieldSettings: any[] = []
): { category: string; stages: StageOption[] }[] {
  const stageMap = new Map<string, StageOption>();
  const customGroupsMap = new Map<string, StageOption[]>();
  const freshStages: StageOption[] = [];
  const activeStages: StageOption[] = [];
  const closedStages: StageOption[] = [];

  // 1. Process pipeline stages from /api/pipelines
  if (Array.isArray(pipelineStages) && pipelineStages.length > 0) {
    pipelineStages.forEach((st) => {
      const name = (st.name || st.id || '').trim();
      if (!name) return;
      const cat = (st.category || '').toLowerCase();
      const color = st.color || '#3B82F6';

      let categoryGroup = 'Active';
      if (
        cat === 'initial' ||
        cat === 'fresh' ||
        name.toLowerCase().includes('fresh') ||
        name.toLowerCase().includes('new')
      ) {
        categoryGroup = 'Fresh';
      } else if (
        cat === 'closed' ||
        cat === 'won' ||
        cat === 'lost' ||
        name.toLowerCase().includes('won') ||
        name.toLowerCase().includes('lost') ||
        name.toLowerCase().includes('convert')
      ) {
        categoryGroup = 'Closed';
      } else if (cat && cat !== 'active') {
        categoryGroup = st.category.charAt(0).toUpperCase() + st.category.slice(1);
      }

      const stageObj: StageOption = {
        id: st.id || name.toLowerCase().replace(/\s+/g, '_'),
        name: name,
        color: color,
        category: categoryGroup
      };

      stageMap.set(name.toLowerCase(), stageObj);

      if (categoryGroup === 'Fresh') {
        freshStages.push(stageObj);
      } else if (categoryGroup === 'Closed') {
        closedStages.push(stageObj);
      } else if (categoryGroup === 'Active') {
        activeStages.push(stageObj);
      } else {
        if (!customGroupsMap.has(categoryGroup)) customGroupsMap.set(categoryGroup, []);
        customGroupsMap.get(categoryGroup)!.push(stageObj);
      }
    });
  }

  // 2. Process status field options from /api/field-settings
  if (Array.isArray(fieldSettings)) {
    const statusField = fieldSettings.find(
      (f) => f.name === 'status' || f.key === 'status' || f.id === 'f-status'
    );
    if (statusField && Array.isArray(statusField.options)) {
      statusField.options.forEach((optName: string) => {
        const trimmed = (optName || '').trim();
        if (!trimmed || stageMap.has(trimmed.toLowerCase())) return;

        let categoryGroup = 'Active';
        let color = '#6B7280';

        const lower = trimmed.toLowerCase();
        if (lower.includes('fresh') || lower.includes('new')) {
          categoryGroup = 'Fresh';
          color = '#4A705E';
        } else if (lower.includes('convert') || lower.includes('won')) {
          categoryGroup = 'Closed';
          color = '#059669';
        } else if (lower.includes('lost') || lower.includes('junk') || lower.includes('not')) {
          categoryGroup = 'Closed';
          color = '#EF4444';
        } else if (lower.includes('rnr')) {
          categoryGroup = 'Active';
          color = '#EF4444';
        } else if (lower.includes('interested') || lower.includes('warm')) {
          categoryGroup = 'Active';
          color = lower.includes('warm') ? '#84CC16' : '#6B7280';
        } else if (lower.includes('contacted')) {
          categoryGroup = 'Active';
          color = '#3B82F6';
        } else if (lower.includes('follow')) {
          categoryGroup = 'Active';
          color = '#F59E0B';
        } else if (lower.includes('demo')) {
          categoryGroup = 'Active';
          color = '#06B6D4';
        } else if (lower.includes('proposal')) {
          categoryGroup = 'Active';
          color = '#10B981';
        }

        const stageObj: StageOption = {
          id: trimmed.toLowerCase().replace(/\s+/g, '_'),
          name: trimmed,
          color: color,
          category: categoryGroup
        };

        stageMap.set(trimmed.toLowerCase(), stageObj);

        if (categoryGroup === 'Fresh') {
          freshStages.push(stageObj);
        } else if (categoryGroup === 'Closed') {
          closedStages.push(stageObj);
        } else if (categoryGroup === 'Active') {
          activeStages.push(stageObj);
        } else {
          if (!customGroupsMap.has(categoryGroup)) customGroupsMap.set(categoryGroup, []);
          customGroupsMap.get(categoryGroup)!.push(stageObj);
        }
      });
    }
  }

  // If no dynamic stages found from APIs, return the default status groups
  if (
    freshStages.length === 0 &&
    activeStages.length === 0 &&
    closedStages.length === 0 &&
    customGroupsMap.size === 0
  ) {
    return DEFAULT_STATUS_GROUPS;
  }

  const result: { category: string; stages: StageOption[] }[] = [];
  if (freshStages.length > 0) result.push({ category: 'Fresh', stages: freshStages });
  if (activeStages.length > 0) result.push({ category: 'Active', stages: activeStages });
  customGroupsMap.forEach((stages, category) => {
    result.push({ category, stages });
  });
  if (closedStages.length > 0) result.push({ category: 'Closed', stages: closedStages });

  return result;
}

const CRM_STAGES = [
  'Fresh Lead',
  'Contacted',
  'Interested',
  'Follow-Up Scheduled',
  'Demo Given',
  'Negotiation / Proposal',
  'Won / Customer',
  'Lost / Junk'
];

const DEFAULT_LEAD_FIELD_OPTIONS: LeadFieldOption[] = [
  { key: 'batch', label: 'Batch', tag: '{{lead.batch}}', type: 'text' },
  { key: 'date_of_joining', label: 'Date of Joining', tag: '{{lead.date_of_joining}}', type: 'date' },
  { key: 'city', label: 'City', tag: '{{lead.city}}', type: 'text' },
  { key: 'address', label: 'Address', tag: '{{lead.address}}', type: 'text' },
  { key: 'age', label: 'Age', tag: '{{lead.age}}', type: 'text' },
  { key: 'date_of_birth', label: 'Date of Birth', tag: '{{lead.date_of_birth}}', type: 'date' },
  { key: 'date', label: 'date', tag: '{{lead.date}}', type: 'date' },
  { key: 'visit_schedule_date', label: 'Visit schedule date', tag: '{{lead.visit_schedule_date}}', type: 'date' },
  { key: 'name', label: 'Lead Name', tag: '{{lead.name}}', type: 'text' },
  { key: 'alternate_phone', label: 'Alternate Phone', tag: '{{lead.alternate_phone}}', type: 'phone' },
  { key: 'phone', label: 'Phone', tag: '{{lead.phone}}', type: 'phone' },
  { key: 'email', label: 'Lead Email', tag: '{{lead.email}}', type: 'email' },
  { key: 'status', label: 'Lead Status', tag: '{{lead.status}}', type: 'dropdown', options: CRM_STAGES },
  { key: 'deal_value', label: 'Deal Value', tag: '{{lead.deal_value}}', type: 'currency' },
  { key: 'source', label: 'Lead Source', tag: '{{lead.source}}', type: 'dropdown', options: ['Facebook Ads', 'Google Ads', 'Meta Ads', 'IndiaMart', 'JustDial', 'WhatsApp', 'Website Inbound', 'Instagram', 'Referral', 'Direct'] },
  { key: 'company', label: 'Company', tag: '{{lead.company}}', type: 'text' },
  { key: 'state', label: 'State', tag: '{{lead.state}}', type: 'text' },
  { key: 'notes', label: 'Special Remarks / Notes', tag: '{{lead.notes}}', type: 'textarea' },
  { key: 'lead_link', label: 'Lead Link (URL)', tag: '{{LEAD_LINK}}', type: 'text' }
];

const LEAD_FIELDS = [
  { value: 'status', label: 'Lead Status (Pipeline Stage)' },
  { value: 'phone', label: 'Lead Phone Number' },
  { value: 'email', label: 'Lead Email' },
  { value: 'source', label: 'Lead Source / Campaign' },
  { value: 'tags', label: 'Lead Tags' },
  { value: 'lead_score', label: 'Lead Score / Rating' },
  { value: 'deal_value', label: 'Deal Value (₹ / $)' },
  { value: 'city', label: 'City / Location' }
];

const EVENT_FIELDS = [
  { value: 'call_duration_seconds', label: 'Call Duration (seconds)' },
  { value: 'call_disposition', label: 'Call Disposition' },
  { value: 'whatsapp_message_body', label: 'WhatsApp Inbound Text' },
  { value: 'payment_amount', label: 'Payment Amount' },
  { value: 'webhook_status_code', label: 'HTTP Status Code' }
];

const OPERATORS = [
  { value: 'equals', label: 'equals (==)' },
  { value: 'not_equals', label: 'does not equal (!=)' },
  { value: 'contains', label: 'contains substring' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'greater_than', label: 'is greater than (>)' },
  { value: 'less_than', label: 'is less than (<)' },
  { value: 'is_empty', label: 'is empty / null' },
  { value: 'is_not_empty', label: 'is not empty' }
];

export const NodeConfigDrawer: React.FC<NodeConfigDrawerProps> = ({
  selectedNode,
  onClose,
  onUpdateNodeData,
  onDeleteNode
}) => {
  if (!selectedNode) return null;

  const { id, data } = selectedNode;
  const [label, setLabel] = useState(data.label || '');
  const [description, setDescription] = useState(data.description || '');
  const [config, setConfig] = useState<Record<string, any>>(data.config || {});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showAdvancedApi, setShowAdvancedApi] = useState(false);

  // Dynamic API Templates state
  const [apiTemplatesList, setApiTemplatesList] = useState<StoredApiTemplate[]>(() => getApiTemplates());
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic Agents and Lead Fields state for Team Member notification & variables
  const [agentsList, setAgentsList] = useState<AgentOption[]>(() =>
    INITIAL_AGENTS.map((a) => ({ id: a.id, name: a.name, role: a.role, email: a.email }))
  );
  const [leadFieldsList, setLeadFieldsList] = useState<LeadFieldOption[]>(DEFAULT_LEAD_FIELD_OPTIONS);
  const [isVariablesDropdownOpen, setIsVariablesDropdownOpen] = useState(false);
  const [activeTargetField, setActiveTargetField] = useState<'header' | 'body' | 'url'>('header');
  const variablesDropdownRef = useRef<HTMLDivElement>(null);
  const headerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Lead Distribution Search & Role Filter state
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [isFallbackDropdownOpen, setIsFallbackDropdownOpen] = useState(false);
  const fallbackDropdownRef = useRef<HTMLDivElement>(null);

  // Update Lead Fields multi-field state
  const [openFieldDropdownRowId, setOpenFieldDropdownRowId] = useState<string | null>(null);
  const [openOpDropdownRowId, setOpenOpDropdownRowId] = useState<string | null>(null);
  const [openVarDropdownRowId, setOpenVarDropdownRowId] = useState<string | null>(null);
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [varSearchQuery, setVarSearchQuery] = useState('');
  const [expandedVarCategories, setExpandedVarCategories] = useState<{
    action: boolean;
    ctwa: boolean;
    lead: boolean;
  }>({ action: true, ctwa: false, lead: false });
  const multiFieldContainerRef = useRef<HTMLDivElement>(null);

  // Update Lead Rating states
  const [isRatingOpDropdownOpen, setIsRatingOpDropdownOpen] = useState(false);
  const [isRatingVarDropdownOpen, setIsRatingVarDropdownOpen] = useState(false);
  const [ratingVarSearchQuery, setRatingVarSearchQuery] = useState('');
  const [expandedRatingVarCategories, setExpandedRatingVarCategories] = useState<{
    action: boolean;
    ctwa: boolean;
    lead: boolean;
  }>({ action: true, ctwa: false, lead: false });
  const ratingContainerRef = useRef<HTMLDivElement>(null);

  // Update Lead Status dynamic states
  const [statusGroups, setStatusGroups] = useState<{ category: string; stages: StageOption[] }[]>(DEFAULT_STATUS_GROUPS);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isStatusVarDropdownOpen, setIsStatusVarDropdownOpen] = useState(false);
  const [statusSearchQuery, setStatusSearchQuery] = useState('');
  const [statusVarSearchQuery, setStatusVarSearchQuery] = useState('');
  const [expandedStatusGroups, setExpandedStatusGroups] = useState<Record<string, boolean>>({ Fresh: true, Active: true, Closed: true });
  const [expandedStatusVarCategories, setExpandedStatusVarCategories] = useState<{ action: boolean; ctwa: boolean; lead: boolean }>({ action: true, ctwa: false, lead: false });
  const statusContainerRef = useRef<HTMLDivElement>(null);

  // Set Delay states
  const [isDelayUnitDropdownOpen, setIsDelayUnitDropdownOpen] = useState(false);
  const [isDelayDirectionDropdownOpen, setIsDelayDirectionDropdownOpen] = useState(false);
  const [isDelayRefDropdownOpen, setIsDelayRefDropdownOpen] = useState(false);
  const [delayVarSearchQuery, setDelayVarSearchQuery] = useState('');
  const [isDelayLeadVarsExpanded, setIsDelayLeadVarsExpanded] = useState(true);
  const delayContainerRef = useRef<HTMLDivElement>(null);

  // Send WhatsApp To Lead dynamic states
  const [isWaAccountDropdownOpen, setIsWaAccountDropdownOpen] = useState(false);
  const [isToPhoneDropdownOpen, setIsToPhoneDropdownOpen] = useState(false);
  const [waAccountsList, setWaAccountsList] = useState<WhatsAppAccountOption[]>(DEFAULT_WA_ACCOUNTS);
  const waContainerRef = useRef<HTMLDivElement>(null);

  // Add in List(s) dynamic states
  const [isListDropdownOpen, setIsListDropdownOpen] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [campaignLists, setCampaignLists] = useState<string[]>(DEFAULT_LIST_OPTIONS);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Remove from List(s) dynamic states
  const [isRemoveListDropdownOpen, setIsRemoveListDropdownOpen] = useState(false);
  const [removeListSearchQuery, setRemoveListSearchQuery] = useState('');
  const removeListContainerRef = useRef<HTMLDivElement>(null);

  // Add Task dynamic states
  const [isTaskTypeDropdownOpen, setIsTaskTypeDropdownOpen] = useState(false);
  const [isTaskAssignDropdownOpen, setIsTaskAssignDropdownOpen] = useState(false);
  const [isTaskPriorityDropdownOpen, setIsTaskPriorityDropdownOpen] = useState(false);
  const [isTaskDeadlineUnitDropdownOpen, setIsTaskDeadlineUnitDropdownOpen] = useState(false);
  const [isTaskDeadlineDirDropdownOpen, setIsTaskDeadlineDirDropdownOpen] = useState(false);
  const [isTaskDeadlineRefDropdownOpen, setIsTaskDeadlineRefDropdownOpen] = useState(false);
  const [taskDeadlineSearchQuery, setTaskDeadlineSearchQuery] = useState('');
  const [isTaskDescVarOpen, setIsTaskDescVarOpen] = useState(false);
  const taskContainerRef = useRef<HTMLDivElement>(null);
  const taskDescTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Cancel Tasks dynamic states
  const [isCancelTaskDropdownOpen, setIsCancelTaskDropdownOpen] = useState(false);
  const [cancelTaskSearchQuery, setCancelTaskSearchQuery] = useState('');
  const cancelTaskContainerRef = useRef<HTMLDivElement>(null);

  // Add payment dynamic states
  const [isPaymentCurrencyDropdownOpen, setIsPaymentCurrencyDropdownOpen] = useState(false);
  const [isPaymentStatusDropdownOpen, setIsPaymentStatusDropdownOpen] = useState(false);
  const [isPaymentVarDropdownOpen, setIsPaymentVarDropdownOpen] = useState(false);
  const [isPaymentDescVarOpen, setIsPaymentDescVarOpen] = useState(false);
  const paymentContainerRef = useRef<HTMLDivElement>(null);
  const paymentDescTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Add IVR Action dynamic states
  const [isIvrTypeDropdownOpen, setIsIvrTypeDropdownOpen] = useState(false);
  const [openIvrFieldMappingId, setOpenIvrFieldMappingId] = useState<string | null>(null);
  const [ivrFieldSearchQuery, setIvrFieldSearchQuery] = useState('');
  const ivrContainerRef = useRef<HTMLDivElement>(null);

  // Send List, Non Template, Interactive dynamic states
  const [isListBodyVarOpen, setIsListBodyVarOpen] = useState(false);
  const [isNonTemplateBodyVarOpen, setIsNonTemplateBodyVarOpen] = useState(false);
  const [isInteractiveBodyVarOpen, setIsInteractiveBodyVarOpen] = useState(false);
  const listBodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const nonTemplateBodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const interactiveBodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isAddConditionModalOpen, setIsAddConditionModalOpen] = useState(false);


  // Initial dynamic load of agents, pipeline stages, lead fields & templates
  useEffect(() => {
    Promise.all([
      fetchWithTenantAuth('/api/agents').then((r) => r.json()).catch(() => ({ success: false })),
      fetchWithTenantAuth('/api/pipelines').then((r) => r.json()).catch(() => ({ success: false })),
      fetchWithTenantAuth('/api/field-settings').then((r) => r.json()).catch(() => ({ success: false })),
      fetchWithTenantAuth('/api/integrations/config').then((r) => r.json()).catch(() => ({ success: false })),
      fetchApiTemplatesFromApi().catch(() => null)
    ])
      .then(([agentsRes, pipelinesRes, fieldsRes, integrationsRes, templatesRes]) => {
        // 1. Agents list
        if (agentsRes?.success && Array.isArray(agentsRes.agents) && agentsRes.agents.length > 0) {
          setAgentsList(
            agentsRes.agents.map((a: any) => ({
              id: a.id || a.name,
              name: a.name,
              role: a.role,
              email: a.email
            }))
          );
        }

        const pipelineStages = pipelinesRes?.success && Array.isArray(pipelinesRes.stages) ? pipelinesRes.stages : [];
        const fieldsList = fieldsRes?.success && Array.isArray(fieldsRes.fields) ? fieldsRes.fields : [];

        // 2. Build dynamic status groups from pipelines + field settings
        const dynamicGroups = buildStatusGroupsFromApi(pipelineStages, fieldsList);
        setStatusGroups(dynamicGroups);

        // Expand all returned categories
        const exp: Record<string, boolean> = {};
        dynamicGroups.forEach((g) => {
          exp[g.category] = true;
        });
        setExpandedStatusGroups((prev) => ({ ...exp, ...prev }));

        // Extract all stage names for CRM field options
        const allStageNames = dynamicGroups.flatMap((g) => g.stages.map((s) => s.name));

        // 3. Dynamic Lead Fields
        const dynamicFields: LeadFieldOption[] = fieldsList.map((f: any) => ({
          key: f.name || f.id,
          label: f.label || f.name,
          type: f.type || 'text',
          options: f.name === 'status' && allStageNames.length > 0 ? allStageNames : f.options,
          tag:
            f.name === 'phone'
              ? '{{lead.phone}}'
              : f.name === 'name'
              ? '{{lead.name}}'
              : f.name === 'email'
              ? '{{lead.email}}'
              : f.name === 'status'
              ? '{{lead.status}}'
              : f.name === 'deal_value'
              ? '{{lead.deal_value}}'
              : f.name === 'source'
              ? '{{lead.source}}'
              : `{{lead.${f.name || f.id}}}`
        }));

        const seen = new Set<string>();
        const merged: LeadFieldOption[] = [];
        [...DEFAULT_LEAD_FIELD_OPTIONS, ...dynamicFields].forEach((item) => {
          if (!seen.has(item.key)) {
            seen.add(item.key);
            merged.push(item.key === 'status' && allStageNames.length > 0 ? { ...item, options: allStageNames } : item);
          }
        });
        setLeadFieldsList(merged);

        // 4. WhatsApp Accounts from dynamic integrations
        if (integrationsRes?.success && Array.isArray(integrationsRes.configs)) {
          const waConfigs = integrationsRes.configs.filter((c: any) =>
            (c.id && c.id.toLowerCase().includes('whatsapp')) ||
            (c.integrationName && c.integrationName.toLowerCase().includes('whatsapp'))
          );
          if (waConfigs.length > 0) {
            const dynamicAccounts: WhatsAppAccountOption[] = waConfigs.map((c: any) => ({
              id: c.id,
              name: c.integrationName || c.name || 'Official WhatsApp Account',
              phoneNumber: c.credentials?.phoneNumber || c.credentials?.phone_number || ''
            }));
            const seenIds = new Set(DEFAULT_WA_ACCOUNTS.map((a) => a.id));
            const mergedWa = [...DEFAULT_WA_ACCOUNTS];
            dynamicAccounts.forEach((acc) => {
              if (!seenIds.has(acc.id)) {
                seenIds.add(acc.id);
                mergedWa.push(acc);
              }
            });
            setWaAccountsList(mergedWa);
          }
        }

        // 5. Dynamic Lists from Field Settings (tags/lists)
        if (fieldsRes?.success && Array.isArray(fieldsRes.fields)) {
          const tagFields = fieldsRes.fields.filter((f: any) =>
            f.name === 'tags' || f.name === 'lists' || f.key === 'tags' || f.key === 'lists' || (f.name && f.name.toLowerCase().includes('list'))
          );
          const extraOptions: string[] = [];
          tagFields.forEach((tf: any) => {
            if (Array.isArray(tf.options)) {
              tf.options.forEach((opt: string) => {
                if (opt && typeof opt === 'string' && opt.trim()) extraOptions.push(opt.trim());
              });
            }
          });
          if (extraOptions.length > 0) {
            setCampaignLists((prev) => Array.from(new Set([...prev, ...extraOptions])));
          }
        }

        // 6. API Templates
        if (Array.isArray(templatesRes)) {
          setApiTemplatesList(templatesRes);
        }
      })
      .catch(() => {});
  }, []);

  // Sync node state only when switching selected node
  useEffect(() => {
    setLabel(selectedNode.data.label || '');
    setDescription(selectedNode.data.description || '');
    setConfig(selectedNode.data.config || {});
    setJsonError(null);
    setIsTemplateDropdownOpen(false);
    setIsVariablesDropdownOpen(false);
    setIsFallbackDropdownOpen(false);
    setOpenFieldDropdownRowId(null);
    setOpenOpDropdownRowId(null);
    setOpenVarDropdownRowId(null);
    setIsRatingOpDropdownOpen(false);
    setIsRatingVarDropdownOpen(false);
    setIsStatusDropdownOpen(false);
    setIsStatusVarDropdownOpen(false);
    setIsDelayUnitDropdownOpen(false);
    setIsDelayDirectionDropdownOpen(false);
    setIsDelayRefDropdownOpen(false);
    setIsWaAccountDropdownOpen(false);
    setIsToPhoneDropdownOpen(false);
    setIsListDropdownOpen(false);
    setListSearchQuery('');
    setIsRemoveListDropdownOpen(false);
    setRemoveListSearchQuery('');
    setIsTaskTypeDropdownOpen(false);
    setIsTaskAssignDropdownOpen(false);
    setIsTaskPriorityDropdownOpen(false);
    setIsTaskDeadlineUnitDropdownOpen(false);
    setIsTaskDeadlineDirDropdownOpen(false);
    setIsTaskDeadlineRefDropdownOpen(false);
    setTaskDeadlineSearchQuery('');
    setIsTaskDescVarOpen(false);
    setIsCancelTaskDropdownOpen(false);
    setCancelTaskSearchQuery('');
    setIsPaymentCurrencyDropdownOpen(false);
    setIsPaymentStatusDropdownOpen(false);
    setIsPaymentVarDropdownOpen(false);
    setIsPaymentDescVarOpen(false);
    setIsIvrTypeDropdownOpen(false);
    setOpenIvrFieldMappingId(null);
    setIvrFieldSearchQuery('');
    setIsListBodyVarOpen(false);
    setIsNonTemplateBodyVarOpen(false);
    setIsInteractiveBodyVarOpen(false);
    setDelayVarSearchQuery('');
    setIsDelayLeadVarsExpanded(true);
    setRatingVarSearchQuery('');
    setStatusSearchQuery('');
    setStatusVarSearchQuery('');
    setFieldSearchQuery('');
    setVarSearchQuery('');
    setSearchMemberQuery('');
    setSelectedRoleFilter('All');
    setActiveTargetField('header');
  }, [selectedNode.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsTemplateDropdownOpen(false);
      }
      if (variablesDropdownRef.current && !variablesDropdownRef.current.contains(e.target as Node)) {
        setIsVariablesDropdownOpen(false);
      }
      if (fallbackDropdownRef.current && !fallbackDropdownRef.current.contains(e.target as Node)) {
        setIsFallbackDropdownOpen(false);
      }
      if (multiFieldContainerRef.current && !multiFieldContainerRef.current.contains(e.target as Node)) {
        setOpenFieldDropdownRowId(null);
        setOpenOpDropdownRowId(null);
        setOpenVarDropdownRowId(null);
      }
      if (ratingContainerRef.current && !ratingContainerRef.current.contains(e.target as Node)) {
        setIsRatingOpDropdownOpen(false);
        setIsRatingVarDropdownOpen(false);
      }
      if (statusContainerRef.current && !statusContainerRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
        setIsStatusVarDropdownOpen(false);
      }
      if (delayContainerRef.current && !delayContainerRef.current.contains(e.target as Node)) {
        setIsDelayUnitDropdownOpen(false);
        setIsDelayDirectionDropdownOpen(false);
        setIsDelayRefDropdownOpen(false);
      }
      if (waContainerRef.current && !waContainerRef.current.contains(e.target as Node)) {
        setIsWaAccountDropdownOpen(false);
        setIsToPhoneDropdownOpen(false);
        setIsListBodyVarOpen(false);
        setIsNonTemplateBodyVarOpen(false);
        setIsInteractiveBodyVarOpen(false);
      }
      if (listContainerRef.current && !listContainerRef.current.contains(e.target as Node)) {
        setIsListDropdownOpen(false);
      }
      if (removeListContainerRef.current && !removeListContainerRef.current.contains(e.target as Node)) {
        setIsRemoveListDropdownOpen(false);
      }
      if (taskContainerRef.current && !taskContainerRef.current.contains(e.target as Node)) {
        setIsTaskTypeDropdownOpen(false);
        setIsTaskAssignDropdownOpen(false);
        setIsTaskPriorityDropdownOpen(false);
        setIsTaskDeadlineUnitDropdownOpen(false);
        setIsTaskDeadlineDirDropdownOpen(false);
        setIsTaskDeadlineRefDropdownOpen(false);
        setIsTaskDescVarOpen(false);
      }
      if (cancelTaskContainerRef.current && !cancelTaskContainerRef.current.contains(e.target as Node)) {
        setIsCancelTaskDropdownOpen(false);
      }
      if (paymentContainerRef.current && !paymentContainerRef.current.contains(e.target as Node)) {
        setIsPaymentCurrencyDropdownOpen(false);
        setIsPaymentStatusDropdownOpen(false);
        setIsPaymentVarDropdownOpen(false);
        setIsPaymentDescVarOpen(false);
      }
      if (ivrContainerRef.current && !ivrContainerRef.current.contains(e.target as Node)) {
        setIsIvrTypeDropdownOpen(false);
        setOpenIvrFieldMappingId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSingleOrBatchConfigChange = (updates: Record<string, any>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      onUpdateNodeData(id, {
        ...data,
        label,
        description,
        config: next
      });
      return next;
    });
  };

  const handleConfigChange = (key: string, value: any) => {
    handleSingleOrBatchConfigChange({ [key]: value });
  };

  const handleTemplateSelect = (selectedTpl: StoredApiTemplate | null) => {
    setIsTemplateDropdownOpen(false);
    if (!selectedTpl) {
      handleConfigChange('apiTemplate', '');
      return;
    }

    const updated = {
      ...config,
      apiTemplate: selectedTpl.name,
      templateId: selectedTpl.id,
      method: selectedTpl.method,
      endpointUrl: selectedTpl.endpointUrl,
      headers: [...(selectedTpl.headers || [])],
      bodyPayload: selectedTpl.bodyPayload || '',
      queryParams: [...(selectedTpl.queryParams || [])],
      authConfig: selectedTpl.authConfig ? { ...selectedTpl.authConfig } : { type: 'none' }
    };
    setConfig(updated);
    onUpdateNodeData(id, {
      ...data,
      label: data.catalogId === 'call_api' ? 'Call API' : selectedTpl.name,
      config: updated
    });
  };

  const handleTemplateSaved = (newTemplate: StoredApiTemplate) => {
    setApiTemplatesList((prev) => {
      const filtered = prev.filter((t) => t.id !== newTemplate.id);
      return [newTemplate, ...filtered];
    });
    handleTemplateSelect(newTemplate);
  };

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    onUpdateNodeData(id, {
      ...data,
      label: newLabel,
      config
    });
  };

  const handleDescriptionChange = (newDesc: string) => {
    setDescription(newDesc);
    onUpdateNodeData(id, {
      ...data,
      description: newDesc,
      config
    });
  };

  // Conditions Rules helper
  const rules: ConditionRule[] = config.rules || [];

  const handleAddRule = () => {
    const newRule: ConditionRule = {
      id: 'rule_' + Date.now(),
      field: data.category === 'event_conditions' ? 'call_duration_seconds' : 'status',
      operator: 'equals',
      value: ''
    };
    handleConfigChange('rules', [...rules, newRule]);
  };

  const handleUpdateRule = (ruleId: string, patch: Partial<ConditionRule>) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r));
    handleConfigChange('rules', updated);
  };

  const handleDeleteRule = (ruleId: string) => {
    handleConfigChange('rules', rules.filter((r) => r.id !== ruleId));
  };

  // HTTP Headers helper for Call API
  const headers: HeaderKeyValue[] = config.headers || [];

  const handleAddHeader = () => {
    const updated = [...headers, { key: '', value: '' }];
    handleConfigChange('headers', updated);
  };

  const handleUpdateHeader = (idx: number, key: string, value: string) => {
    const updated = [...headers];
    updated[idx] = { key, value };
    handleConfigChange('headers', updated);
  };

  const handleDeleteHeader = (idx: number) => {
    handleConfigChange('headers', headers.filter((_, i) => i !== idx));
  };

  const handleBodyPayloadChange = (bodyStr: string) => {
    try {
      if (bodyStr.trim()) {
        JSON.parse(bodyStr);
      }
      setJsonError(null);
    } catch (err: any) {
      setJsonError('Warning: Invalid JSON syntax');
    }
    handleConfigChange('bodyPayload', bodyStr);
  };

  const handleInsertVariable = (variableTag: string) => {
    setIsVariablesDropdownOpen(false);
    if (activeTargetField === 'body') {
      const currentVal = config.body !== undefined ? config.body : (config.notificationMessage || '');
      const updated = currentVal ? `${currentVal} ${variableTag}` : variableTag;
      handleSingleOrBatchConfigChange({ body: updated, notificationMessage: updated });
    } else if (activeTargetField === 'url') {
      const currentVal = config.url !== undefined ? config.url : '{{LEAD_LINK}}';
      const updated = currentVal ? `${currentVal}${variableTag}` : variableTag;
      handleConfigChange('url', updated);
    } else {
      // Default: header
      const currentVal = config.header !== undefined ? config.header : (config.notificationTitle || '');
      const updated = currentVal ? `${currentVal} ${variableTag}` : variableTag;
      handleSingleOrBatchConfigChange({ header: updated, notificationTitle: updated });
    }
  };

  // Render specific form sections
  const renderConfigForm = () => {
    switch (data.catalogId) {
      // 1. Meta Conversions API (CAPI)
      case 'capi':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meta Event Name
              </label>
              <select
                value={config.capiEventName || 'Lead'}
                onChange={(e) => handleConfigChange('capiEventName', e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 focus:border-[#3a2088] focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="Lead">Lead (Default)</option>
                <option value="CompleteRegistration">Complete Registration</option>
                <option value="Contact">Contact / Telecall Qualified</option>
                <option value="Schedule">Schedule Appointment</option>
                <option value="Purchase">Purchase / Won Deal</option>
                <option value="Custom">Custom Event Code</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meta Pixel ID / Dataset ID
              </label>
              <input
                type="text"
                value={config.pixelId || ''}
                onChange={(e) => handleConfigChange('pixelId', e.target.value)}
                placeholder="e.g. 849204918239"
                className="w-full text-xs px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 focus:border-[#3a2088] focus:outline-none font-mono shadow-2xs"
              />
            </div>
          </div>
        );

      // 1. Call API
      case 'call_api':
        return (
          <div className="space-y-3.5">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select template
              </label>

              {/* Custom Dropdown Trigger Button matching Screenshot 1 */}
              <button
                type="button"
                onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-md border border-slate-300 bg-white text-slate-900 flex items-center justify-between focus:border-[#3a2088] cursor-pointer shadow-2xs hover:border-slate-400 transition-colors"
              >
                <span className={config.apiTemplate ? 'font-bold text-slate-900' : 'text-slate-500'}>
                  {config.apiTemplate || 'Select template'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {/* Dropdown Menu matching Screenshot 1 */}
              {isTemplateDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-30 divide-y divide-slate-100 overflow-hidden animate-in fade-in duration-100">
                  {/* List of Created Templates from 'templates' table */}
                  <div className="max-h-56 overflow-y-auto">
                    {apiTemplatesList.length > 0 ? (
                      apiTemplatesList.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleTemplateSelect(tpl)}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-medium hover:bg-purple-50 transition-colors cursor-pointer flex items-center justify-between ${
                            config.apiTemplate === tpl.name ? 'bg-purple-50/70 font-bold text-[#3a2088]' : 'text-slate-800'
                          }`}
                        >
                          <span>{tpl.name}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {tpl.method}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3.5 py-3 text-xs text-slate-400 italic text-center">
                        No templates created yet
                      </div>
                    )}
                  </div>

                  {/* + create new template option (matching Screenshot 1) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsTemplateDropdownOpen(false);
                      setIsCreateTemplateModalOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-[#3a2088] hover:bg-purple-50 transition-colors cursor-pointer flex items-center space-x-1.5 bg-slate-50/60"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#3a2088]" />
                    <span>+ create new template</span>
                  </button>
                </div>
              )}
            </div>

            {/* Template Endpoint & Payload Preview / Configuration */}
            {config.apiTemplate && (
              <div className="pt-2 border-t border-slate-100 space-y-3.5">
                <button
                  type="button"
                  onClick={() => setShowAdvancedApi(!showAdvancedApi)}
                  className="flex items-center justify-between w-full text-xs font-bold text-slate-700 hover:text-[#3a2088] py-1 cursor-pointer"
                >
                  <span>Template Endpoint & Payload Details</span>
                  {showAdvancedApi ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showAdvancedApi && (
                  <div className="space-y-3.5 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        HTTP Method & Endpoint URL
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={config.method || 'POST'}
                          onChange={(e) => handleConfigChange('method', e.target.value)}
                          className="w-24 text-xs font-bold px-2 py-1.5 rounded-md border border-slate-300 bg-slate-50 text-slate-900 focus:border-[#3a2088]"
                        >
                          <option value="POST">POST</option>
                          <option value="GET">GET</option>
                          <option value="PUT">PUT</option>
                          <option value="PATCH">PATCH</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                        <input
                          type="text"
                          value={config.endpointUrl || ''}
                          onChange={(e) => handleConfigChange('endpointUrl', e.target.value)}
                          placeholder="https://api.domain.com/v1/webhook"
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-900 focus:border-[#3a2088] font-mono"
                        />
                      </div>
                    </div>

                    {/* HTTP Headers */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-600">
                          Headers ({headers.length})
                        </label>
                        <button
                          type="button"
                          onClick={handleAddHeader}
                          className="text-[11px] text-[#3a2088] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Header
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {headers.map((hdr, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={hdr.key}
                              onChange={(e) => handleUpdateHeader(idx, e.target.value, hdr.value)}
                              placeholder="Header-Name"
                              className="w-1/2 text-xs px-2 py-1 rounded border border-slate-300 bg-white text-slate-900 font-mono"
                            />
                            <input
                              type="text"
                              value={hdr.value}
                              onChange={(e) => handleUpdateHeader(idx, hdr.key, e.target.value)}
                              placeholder="Value"
                              className="flex-1 text-xs px-2 py-1 rounded border border-slate-300 bg-white text-slate-900 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteHeader(idx)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* JSON Body */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-[#3a2088]" />
                          JSON Request Body
                        </label>
                      </div>
                      <textarea
                        rows={5}
                        value={config.bodyPayload || ''}
                        onChange={(e) => handleBodyPayloadChange(e.target.value)}
                        placeholder={'{\n  "lead_id": "{{lead.id}}"\n}'}
                        className="w-full text-xs font-mono p-2.5 rounded-md border border-slate-300 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-[#3a2088]"
                      />
                      {jsonError && (
                        <p className="text-[11px] text-[#DC2626] font-semibold mt-1">{jsonError}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      // 2. Create Custom Action
      case 'create_custom_action':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom Action Name
              </label>
              <input
                type="text"
                value={config.customActionName || ''}
                onChange={(e) => handleConfigChange('customActionName', e.target.value)}
                placeholder="e.g. Sync to External ERP"
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Action Identifier / Key
              </label>
              <input
                type="text"
                value={config.customActionCode || ''}
                onChange={(e) => handleConfigChange('customActionCode', e.target.value)}
                placeholder="ACTION_ERP_SYNC_V1"
                className="w-full text-xs font-mono px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom Action JSON Payload
              </label>
              <textarea
                rows={4}
                value={config.customPayload || ''}
                onChange={(e) => handleConfigChange('customPayload', e.target.value)}
                placeholder={'{\n  "lead_id": "{{lead.id}}",\n  "status": "{{lead.status}}"\n}'}
                className="w-full text-xs font-mono p-2.5 rounded-md border border-slate-300 bg-slate-900 text-emerald-400 focus:outline-none"
              />
            </div>
          </div>
        );

      // 3. Notification To TeamMember (Send Push Notification To TeamMember)
      case 'notification_team_member': {
        const headerVal = config.header !== undefined ? config.header : (config.notificationTitle || '');
        const bodyVal = config.body !== undefined ? config.body : (config.notificationMessage || '');
        const urlVal = config.url !== undefined ? config.url : '{{LEAD_LINK}}';
        const isTemplateEmpty = !headerVal && !bodyVal;

        return (
          <div className="space-y-4">
            {/* Top Warning Alert Banner if no template header/body added */}
            {isTemplateEmpty && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] text-xs font-medium animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                <span>No Template Added</span>
              </div>
            )}

            {/* Team Member Dropdown (Dynamically populated from DB) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Team Member
              </label>
              <div className="relative">
                <select
                  value={config.teamMember || config.targetTeamMember || 'Assignee'}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    handleSingleOrBatchConfigChange({
                      teamMember: selectedVal,
                      targetTeamMember: selectedVal
                    });
                  }}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-md border border-slate-300 bg-white text-slate-900 focus:border-[#3a2088] focus:outline-none cursor-pointer shadow-2xs appearance-none pr-8 hover:border-slate-400 transition-colors"
                >
                  <option value="Assignee">Assignee</option>
                  {agentsList
                    .filter((a) => a.name !== 'Assignee')
                    .map((agent) => (
                      <option key={agent.id || agent.name} value={agent.name}>
                        {agent.name} {agent.role ? `(${agent.role})` : ''}
                      </option>
                    ))}
                  <option value="All Admins">All Admins</option>
                  <option value="All Team Members">All Team Members</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Action Variables: Select Variables Dropdown (No counter badge) */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-xs font-bold text-slate-700">Action Variables:</span>
              <div className="relative" ref={variablesDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsVariablesDropdownOpen(!isVariablesDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>Select Variables</span>
                </button>

                {/* Variables Dropdown (Populated from lead fields DB) */}
                {isVariablesDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-40 p-1.5 animate-in fade-in duration-100 divide-y divide-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                      <span>Lead Fields</span>
                      <span>Click to insert</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar pt-1">
                      {leadFieldsList.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => handleInsertVariable(f.tag)}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-purple-50 hover:text-[#3a2088] rounded flex items-center justify-between text-slate-800 transition-colors cursor-pointer group"
                        >
                          <span className="font-semibold">{f.label}</span>
                          <span className="text-[10px] font-mono text-slate-400 group-hover:text-[#3a2088]">
                            {f.tag}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Header Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Header
              </label>
              <textarea
                ref={headerTextareaRef}
                rows={2}
                value={headerVal}
                onFocus={() => setActiveTargetField('header')}
                onChange={(e) => {
                  const val = e.target.value;
                  handleSingleOrBatchConfigChange({
                    header: val,
                    notificationTitle: val
                  });
                }}
                placeholder="e.g. New Lead Assigned"
                className="w-full text-xs font-normal p-2.5 rounded-md border border-slate-300 bg-white text-slate-900 focus:border-[#3a2088] focus:outline-none shadow-2xs resize-y"
              />
            </div>

            {/* Body Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Body
              </label>
              <textarea
                ref={bodyTextareaRef}
                rows={3}
                value={bodyVal}
                onFocus={() => setActiveTargetField('body')}
                onChange={(e) => {
                  const val = e.target.value;
                  handleSingleOrBatchConfigChange({
                    body: val,
                    notificationMessage: val
                  });
                }}
                placeholder="e.g. Lead {{lead.name}} has been assigned to you."
                className="w-full text-xs font-normal p-2.5 rounded-md border border-slate-300 bg-white text-slate-900 focus:border-[#3a2088] focus:outline-none shadow-2xs resize-y"
              />
            </div>

            {/* Url Text Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Url
              </label>
              <input
                ref={urlInputRef}
                type="text"
                value={urlVal}
                onFocus={() => setActiveTargetField('url')}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                placeholder="{{LEAD_LINK}}"
                className="w-full text-xs font-mono px-3 py-2 rounded-md border border-slate-300 bg-slate-100 text-slate-800 focus:bg-white focus:border-[#3a2088] focus:outline-none shadow-2xs"
              />
            </div>
          </div>
        );
      }

      // 4. Update Lead Assignee (Screenshots 1-4)
      case 'update_lead_assignee': {
        const selectedMembers: string[] = Array.isArray(config.selectedTeamMembers)
          ? config.selectedTeamMembers
          : (config.assigneeAgentName ? [config.assigneeAgentName] : []);
        
        const assignmentPref = config.assignmentPreference || 'Assign Always';
        const taskPref = config.taskPreference || 'No Change';
        const ignoreCurrent = config.ignoreCurrentAssignee || 'No';
        const distributeActiveOnly = config.distributeActiveOnly !== false;
        const fallbackUser = config.fallbackAssignee || '';

        // Dynamic roles from agents
        const baseRoles = ['Root', 'Admin', 'Manager', 'Caller', 'Marketing_user'];
        const dynamicRoles = Array.from(new Set(agentsList.map((a) => a.role).filter(Boolean))) as string[];
        const availableRoles = Array.from(new Set([...baseRoles, ...dynamicRoles]));

        // Filter agents dynamically
        const filteredAgents = agentsList.filter((agent) => {
          const q = searchMemberQuery.trim().toLowerCase();
          const matchesSearch =
            !q ||
            agent.name.toLowerCase().includes(q) ||
            (agent.email && agent.email.toLowerCase().includes(q)) ||
            (agent.role && agent.role.toLowerCase().includes(q));

          if (!matchesSearch) return false;
          if (!selectedRoleFilter || selectedRoleFilter === 'All') return true;

          const filterLower = selectedRoleFilter.toLowerCase();
          const roleLower = (agent.role || '').toLowerCase();
          
          if (roleLower === filterLower) return true;
          if (filterLower === 'admin' && roleLower.includes('admin')) return true;
          if (filterLower === 'root' && (roleLower.includes('root') || roleLower.includes('master'))) return true;
          if (filterLower === 'caller' && (roleLower.includes('caller') || roleLower.includes('agent') || roleLower.includes('telecaller'))) return true;
          if (filterLower === 'manager' && roleLower.includes('manager')) return true;
          if (filterLower === 'marketing_user' && (roleLower.includes('market') || roleLower.includes('marketing'))) return true;

          return false;
        });

        const allVisibleSelected =
          filteredAgents.length > 0 &&
          filteredAgents.every((a) => selectedMembers.includes(a.name) || selectedMembers.includes(a.id));

        const updateMembersWithPercentages = (nextMembers: string[]) => {
          const count = nextMembers.length;
          const perVal = count > 0 ? Number((100 / count).toFixed(count <= 2 || 100 % count === 0 ? 0 : 2)) : 0;
          const percentageMap: Record<string, number> = {};
          nextMembers.forEach((m) => {
            percentageMap[m] = perVal;
          });
          handleSingleOrBatchConfigChange({
            selectedTeamMembers: nextMembers,
            memberPercentages: percentageMap,
            distributionPercentages: percentageMap
          });
        };

        const handleToggleSelectAll = () => {
          if (allVisibleSelected) {
            const visibleKeys = new Set(filteredAgents.flatMap((a) => [a.id, a.name]));
            const next = selectedMembers.filter((m) => !visibleKeys.has(m));
            updateMembersWithPercentages(next);
          } else {
            const nextSet = new Set(selectedMembers);
            filteredAgents.forEach((a) => nextSet.add(a.name));
            updateMembersWithPercentages(Array.from(nextSet));
          }
        };

        const handleToggleMember = (agent: AgentOption) => {
          const isSelected = selectedMembers.includes(agent.name) || selectedMembers.includes(agent.id);
          let next: string[];
          if (isSelected) {
            next = selectedMembers.filter((m) => m !== agent.name && m !== agent.id);
          } else {
            next = [...selectedMembers, agent.name];
          }
          updateMembersWithPercentages(next);
        };

        return (
          <div className="space-y-4">
            {/* Red Alert Banner if No Option Selected (Screenshot 1) */}
            {selectedMembers.length === 0 && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50/90 border border-red-200 text-red-600 rounded-md text-xs font-medium animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>No Option Selected</span>
              </div>
            )}

            {/* Assignment Preference (Screenshot 1 & 2) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Assignment Preference
                </label>
                <div className="relative" ref={variablesDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsVariablesDropdownOpen(!isVariablesDropdownOpen)}
                    className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] underline cursor-pointer"
                  >
                    Map Variable
                  </button>

                  {isVariablesDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1.5 animate-in fade-in duration-100 divide-y divide-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                        Map Lead Variable
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar pt-1">
                        {leadFieldsList.map((f) => (
                          <button
                            key={f.key}
                            type="button"
                            onClick={() => {
                              handleConfigChange('assignmentPreference', f.tag);
                              setIsVariablesDropdownOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-purple-50 hover:text-[#3a2088] rounded flex items-center justify-between text-slate-800 transition-colors cursor-pointer"
                          >
                            <span>{f.label}</span>
                            <span className="text-[10px] font-mono text-[#4F46E5]">{f.tag}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <select
                  value={assignmentPref}
                  onChange={(e) => handleConfigChange('assignmentPreference', e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-lg border border-purple-200 bg-white text-slate-800 appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-400 cursor-pointer shadow-2xs pr-9"
                >
                  <option value="Assign Always">Assign Always</option>
                  <option value="Assign When Unassigned">Assign When Unassigned</option>
                  <option value="No Change">No Change</option>
                  {assignmentPref && !['Assign When Unassigned', 'Assign Always', 'No Change'].includes(assignmentPref) && (
                    <option value={assignmentPref}>{assignmentPref}</option>
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Task Preference (Screenshot 1 & 3) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Task Preference
              </label>
              <div className="relative">
                <select
                  value={taskPref}
                  onChange={(e) => handleConfigChange('taskPreference', e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-lg border border-purple-200 bg-white text-slate-800 appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-400 cursor-pointer shadow-2xs pr-9"
                >
                  <option value="No Change">No Change</option>
                  <option value="Cancel Task Of Previous Assignee">Cancel Task Of Previous Assignee</option>
                  <option value="Transfer Task Of Previous Assignee">Transfer Task Of Previous Assignee</option>
                </select>
                <ChevronDown className="w-4 h-4 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Ignore Current Lead Assignee (Screenshot 1 & 4) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Ignore Current Lead Assignee
              </label>
              <div className="relative">
                <select
                  value={ignoreCurrent}
                  onChange={(e) => handleConfigChange('ignoreCurrentAssignee', e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-lg border border-purple-200 bg-white text-slate-800 appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-400 cursor-pointer shadow-2xs pr-9"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
                <ChevronDown className="w-4 h-4 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Lead Distribution Section (Screenshot 1) */}
            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-bold text-slate-800">
                Lead Distribution
              </label>

              <div className="bg-[#FAF9FF] border border-purple-100 rounded-xl p-3 space-y-3 shadow-2xs">
                {/* Search Bar + Select All Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-purple-300 text-[#7C3AED] focus:ring-purple-400 cursor-pointer"
                    title="Select / Deselect all visible members"
                  />
                  <div className="flex items-center gap-2 bg-[#F5F3FF] border border-purple-200/90 rounded-full px-3 py-1.5 flex-1 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-400">
                    <Search className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <input
                      type="text"
                      value={searchMemberQuery}
                      onChange={(e) => setSearchMemberQuery(e.target.value)}
                      placeholder="Search team member"
                      className="bg-transparent border-none outline-none text-xs text-slate-800 w-full placeholder-purple-400/80"
                    />
                    {searchMemberQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchMemberQuery('')}
                        className="text-purple-400 hover:text-purple-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Role Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {availableRoles.map((role) => {
                    const isSelected = selectedRoleFilter.toLowerCase() === role.toLowerCase();
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRoleFilter(isSelected ? 'All' : role)}
                        className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-purple-100 border-purple-300 text-[#6D28D9] font-bold shadow-2xs'
                            : 'bg-white border-purple-100/90 text-slate-600 hover:bg-purple-50 hover:border-purple-200 font-medium'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>

                {/* Team Members Dynamic List */}
                <div className="max-h-44 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {filteredAgents.length === 0 ? (
                    <div className="text-center py-3 text-xs text-slate-400">
                      No team members found
                    </div>
                  ) : (
                    filteredAgents.map((agent) => {
                      const isSelected = selectedMembers.includes(agent.name) || selectedMembers.includes(agent.id);
                      return (
                        <div
                          key={agent.id}
                          onClick={() => handleToggleMember(agent)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-purple-50/90 border-purple-200 shadow-2xs'
                              : 'bg-white border-slate-100 hover:bg-purple-50/40 hover:border-purple-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded text-[#7C3AED] focus:ring-purple-400 border-purple-300 pointer-events-none"
                            />
                            <div className="w-6 h-6 rounded-full bg-[#EDE9FE] text-[#6D28D9] font-bold text-[10px] flex items-center justify-center shrink-0 border border-purple-200">
                              {agent.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-800 truncate">
                                {agent.name}
                              </div>
                              {agent.email && (
                                <div className="text-[10px] text-slate-400 truncate">
                                  {agent.email}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 capitalize shrink-0 ml-2">
                            {agent.role || 'Caller'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selection Count / Error line (Screenshot 1) */}
                {selectedMembers.length === 0 && (
                  <div className="flex justify-end">
                    <span className="text-xs font-semibold text-red-500">No member selected</span>
                  </div>
                )}

                {/* Distribute active users checkbox */}
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={distributeActiveOnly}
                    onChange={(e) => handleConfigChange('distributeActiveOnly', e.target.checked)}
                    className="w-4 h-4 rounded text-[#7C3AED] focus:ring-purple-400 border-purple-300 cursor-pointer"
                  />
                  <span>Distribute leads among selected active users only</span>
                </label>

                {/* Fallback Assignee Picker */}
                <div className="flex items-center flex-wrap gap-2 text-xs text-slate-700 pt-0.5">
                  <span>If no active user available then assign to</span>
                  <div className="relative" ref={fallbackDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsFallbackDropdownOpen(!isFallbackDropdownOpen)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-[#6D28D9] hover:bg-purple-100 font-semibold border border-purple-200 transition-colors cursor-pointer text-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{fallbackUser || 'Add user'}</span>
                      <ChevronDown className="w-3 h-3 ml-0.5 text-purple-500" />
                    </button>

                    {isFallbackDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1.5 divide-y divide-slate-100 animate-in fade-in duration-100">
                        <div className="max-h-40 overflow-y-auto space-y-0.5 custom-scrollbar">
                          <button
                            type="button"
                            onClick={() => {
                              handleConfigChange('fallbackAssignee', '');
                              setIsFallbackDropdownOpen(false);
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            None (Skip fallback)
                          </button>
                          {agentsList.map((agent) => (
                            <button
                              key={agent.id}
                              type="button"
                              onClick={() => {
                                handleConfigChange('fallbackAssignee', agent.name);
                                setIsFallbackDropdownOpen(false);
                              }}
                              className="w-full text-left px-2 py-1.5 text-xs text-slate-800 hover:bg-purple-50 hover:text-purple-800 rounded font-medium flex items-center justify-between cursor-pointer"
                            >
                              <span>{agent.name}</span>
                              <span className="text-[10px] text-purple-500">{agent.role || 'Caller'}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // 5. Update Lead Fields
      case 'update_lead_fields': {
        const getFieldUpdatesList = (): FieldUpdateRow[] => {
          if (Array.isArray(config.fieldUpdates) && config.fieldUpdates.length > 0) {
            return config.fieldUpdates;
          }
          if (config.fieldName) {
            return [
              {
                id: 'row-1',
                fieldName: config.fieldName,
                fieldLabel: config.fieldLabel || config.fieldName,
                fieldType: config.fieldType || 'text',
                operation: config.fieldUpdateMode === 'clear' ? 'empty' : 'replace',
                valueMode: config.valueMode || (config.variableKey ? 'variable' : 'custom'),
                variableKey: config.variableKey || (config.fieldValue?.startsWith('{{') ? config.fieldValue.replace(/[{}]/g, '') : ''),
                variableLabel: config.variableLabel || config.fieldValue || '',
                customValue: config.customValue || config.fieldValue || ''
              }
            ];
          }
          return [
            {
              id: 'row-1',
              fieldName: 'batch',
              fieldLabel: 'Batch',
              fieldType: 'text',
              operation: 'replace',
              valueMode: 'variable',
              variableKey: '',
              variableLabel: '',
              customValue: ''
            }
          ];
        };

        const fieldUpdates = getFieldUpdatesList();

        const updateRowsState = (updatedRows: FieldUpdateRow[]) => {
          const firstRow = updatedRows[0];
          handleSingleOrBatchConfigChange({
            fieldUpdates: updatedRows,
            fieldName: firstRow?.fieldName || '',
            fieldLabel: firstRow?.fieldLabel || '',
            fieldType: firstRow?.fieldType || 'text',
            fieldUpdateMode: firstRow?.operation === 'empty' ? 'clear' : 'set',
            fieldValue: firstRow?.operation === 'empty' ? '' : (firstRow?.valueMode === 'variable' ? firstRow?.variableKey : firstRow?.customValue),
            variableKey: firstRow?.variableKey || '',
            variableLabel: firstRow?.variableLabel || '',
            customValue: firstRow?.customValue || ''
          });
        };

        const updateRow = (rowId: string, updates: Partial<FieldUpdateRow>) => {
          const current = getFieldUpdatesList();
          const updated = current.map((r) => (r.id === rowId ? { ...r, ...updates } : r));
          updateRowsState(updated);
        };

        const addRow = () => {
          const current = getFieldUpdatesList();
          const newRow: FieldUpdateRow = {
            id: `row-${Date.now()}`,
            fieldName: 'city',
            fieldLabel: 'City',
            fieldType: 'text',
            operation: 'replace',
            valueMode: 'variable',
            variableKey: '',
            variableLabel: '',
            customValue: ''
          };
          updateRowsState([...current, newRow]);
        };

        const removeRow = (rowId: string) => {
          const current = getFieldUpdatesList();
          if (current.length <= 1) return;
          const updated = current.filter((r) => r.id !== rowId);
          updateRowsState(updated);
        };

        const filteredFields = leadFieldsList.filter((f) =>
          (f.label || '').toLowerCase().includes(fieldSearchQuery.toLowerCase()) ||
          (f.key || '').toLowerCase().includes(fieldSearchQuery.toLowerCase())
        );

        const hasAnyUnselected = fieldUpdates.some((r) => !r.fieldName);

        return (
          <div className="space-y-4" ref={multiFieldContainerRef}>
            {/* Red Alert Banner if field is not selected */}
            {hasAnyUnselected && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-2.5 flex items-center gap-2 text-[#EF4444] text-xs font-normal shadow-2xs">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                <span className="font-normal text-xs">Complete Field Selection</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Select Field
              </label>

              <div className="space-y-3">
                {fieldUpdates.map((row) => {
                  return (
                    <div key={row.id} className="flex items-center gap-2 relative">
                      {/* 1. Field Selector Button / Box */}
                      <div className="w-[36%] relative">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenFieldDropdownRowId(openFieldDropdownRowId === row.id ? null : row.id);
                            setOpenOpDropdownRowId(null);
                            setOpenVarDropdownRowId(null);
                            setFieldSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-md border border-slate-300 bg-white text-xs text-slate-800 hover:border-slate-400 focus:outline-none transition-colors shadow-2xs cursor-pointer text-left h-9"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {row.fieldType === 'date' || row.fieldName.includes('date') || row.fieldName.includes('dob') || row.fieldName.includes('doj') ? (
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            ) : (
                              <span className="w-3.5 h-3.5 flex items-center justify-center font-serif text-xs font-semibold text-slate-400 shrink-0 select-none">
                                T
                              </span>
                            )}
                            <span className="truncate font-normal text-slate-800">
                              {row.fieldLabel || 'Select field'}
                            </span>
                          </div>
                        </button>

                        {/* Field Selection Dropdown Popup */}
                        {openFieldDropdownRowId === row.id && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                            <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-white">
                              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <input
                                type="text"
                                value={fieldSearchQuery}
                                onChange={(e) => setFieldSearchQuery(e.target.value)}
                                placeholder="Search Fields"
                                className="w-full text-xs text-slate-800 placeholder-slate-400 outline-none bg-transparent"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                              {filteredFields.map((field) => {
                                const isDate = field.type === 'date' || field.key.includes('date') || field.key.includes('dob') || field.key.includes('doj');
                                return (
                                  <button
                                    key={field.key}
                                    type="button"
                                    onClick={() => {
                                      updateRow(row.id, {
                                        fieldName: field.key,
                                        fieldLabel: field.label,
                                        fieldType: field.type || 'text'
                                      });
                                      setOpenFieldDropdownRowId(null);
                                      setFieldSearchQuery('');
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                                      row.fieldName === field.key
                                        ? 'bg-purple-50/70 text-[#3a2088] font-semibold'
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    {isDate ? (
                                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    ) : (
                                      <span className="w-3.5 h-3.5 flex items-center justify-center font-serif text-xs font-semibold text-slate-400 shrink-0 select-none">
                                        T
                                      </span>
                                    )}
                                    <span className="truncate">{field.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. Operation Dropdown: "Replace with" / "Set as empty" */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenOpDropdownRowId(openOpDropdownRowId === row.id ? null : row.id);
                            setOpenFieldDropdownRowId(null);
                            setOpenVarDropdownRowId(null);
                          }}
                          className={`px-3 py-2 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer h-9 whitespace-nowrap ${
                            openOpDropdownRowId === row.id
                              ? 'bg-[#3a2088] text-white border border-[#3a2088]'
                              : 'border border-[#3a2088] text-[#3a2088] bg-white hover:bg-purple-50'
                          }`}
                        >
                          <span>{row.operation === 'empty' ? 'Set as empty' : 'Replace with'}</span>
                          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        {/* Operation Dropdown Menu */}
                        {openOpDropdownRowId === row.id && (
                          <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                updateRow(row.id, { operation: 'replace' });
                                setOpenOpDropdownRowId(null);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                                row.operation === 'replace' ? 'bg-purple-50 text-[#3a2088] font-medium' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Replace with
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateRow(row.id, { operation: 'empty', variableKey: '', variableLabel: '', customValue: '' });
                                setOpenOpDropdownRowId(null);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                                row.operation === 'empty' ? 'bg-purple-50 text-[#3a2088] font-medium' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Set as empty
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 3. Value / Variable Selector Box */}
                      {row.operation === 'empty' ? (
                        <div className="flex-1 h-9 px-3 rounded-md border border-slate-200 bg-slate-50 text-slate-400 text-xs flex items-center italic">
                          (Set as empty)
                        </div>
                      ) : row.valueMode === 'custom' ? (
                        <div className="flex-1 relative flex items-center">
                          <input
                            type="text"
                            value={row.customValue || ''}
                            onChange={(e) => updateRow(row.id, { customValue: e.target.value })}
                            placeholder="Enter custom value..."
                            className="w-full h-9 px-3 pr-14 rounded-md border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] shadow-2xs"
                          />
                          <div className="absolute right-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateRow(row.id, { valueMode: 'variable', customValue: '' })}
                              className="text-[10px] text-[#3a2088] hover:underline font-medium px-1 cursor-pointer"
                              title="Switch to variable"
                            >
                              Variable
                            </button>
                            {row.customValue && (
                              <button
                                type="button"
                                onClick={() => updateRow(row.id, { customValue: '' })}
                                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 relative">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenVarDropdownRowId(openVarDropdownRowId === row.id ? null : row.id);
                              setOpenFieldDropdownRowId(null);
                              setOpenOpDropdownRowId(null);
                              setVarSearchQuery('');
                            }}
                            className="w-full flex items-center justify-between px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800 hover:border-slate-400 focus:outline-none transition-colors shadow-2xs cursor-pointer text-left h-9"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className={`truncate ${row.variableLabel ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
                                {row.variableLabel || ''}
                              </span>
                            </div>
                            {row.variableKey ? (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateRow(row.id, { variableKey: '', variableLabel: '' });
                                }}
                                className="text-purple-600 hover:text-purple-800 p-0.5 cursor-pointer shrink-0"
                              >
                                <X className="w-3.5 h-3.5 font-bold" />
                              </span>
                            ) : (
                              <span className="text-purple-600 hover:text-purple-800 p-0.5 shrink-0 opacity-80">
                                <X className="w-3.5 h-3.5 font-bold" />
                              </span>
                            )}
                          </button>

                          {/* Variable Picker Popup with top pointer */}
                          {openVarDropdownRowId === row.id && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                              {/* Pointer Triangle */}
                              <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45" />

                              {/* Search Box */}
                              <div className="p-2.5 border-b border-slate-100 flex items-center gap-2 bg-white">
                                <input
                                  type="text"
                                  value={varSearchQuery}
                                  onChange={(e) => setVarSearchQuery(e.target.value)}
                                  placeholder="Select a variable"
                                  className="w-full text-xs text-slate-800 placeholder-slate-400 outline-none bg-transparent"
                                  autoFocus
                                />
                                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </div>

                              {/* Variable Tree Accordion */}
                              <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                                {/* 1. Action Variables */}
                                <div className="rounded-lg overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedVarCategories((prev) => ({
                                        ...prev,
                                        action: !prev.action
                                      }))
                                    }
                                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      {expandedVarCategories.action ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                      )}
                                      <span>Action Variables</span>
                                    </div>
                                  </button>

                                  {expandedVarCategories.action && (
                                    <div className="pl-6 pr-1 py-1 space-y-0.5">
                                      {ACTION_VARIABLES.filter((v) =>
                                        v.label.toLowerCase().includes(varSearchQuery.toLowerCase())
                                      ).map((v) => {
                                        const IconComponent = v.icon;
                                        return (
                                          <button
                                            key={v.key}
                                            type="button"
                                            onClick={() => {
                                              updateRow(row.id, {
                                                variableKey: v.key,
                                                variableLabel: v.label
                                              });
                                              setOpenVarDropdownRowId(null);
                                            }}
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors cursor-pointer text-left ${
                                              row.variableKey === v.key
                                                ? 'bg-purple-50 text-[#3a2088] font-semibold'
                                                : 'text-slate-700 hover:bg-slate-100/70'
                                            }`}
                                          >
                                            {IconComponent ? (
                                              <IconComponent className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                            ) : (
                                              <span className="w-3.5 h-3.5 flex items-center justify-center font-serif text-xs font-bold text-slate-500 shrink-0">
                                                {v.iconText}
                                              </span>
                                            )}
                                            <span className="truncate">{v.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                {/* 2. CTWA Action Variables */}
                                <div className="rounded-lg overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedVarCategories((prev) => ({
                                        ...prev,
                                        ctwa: !prev.ctwa
                                      }))
                                    }
                                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      {expandedVarCategories.ctwa ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                      )}
                                      <span className="text-emerald-600 font-bold">💬</span>
                                      <span>CTWA Action Variables</span>
                                    </div>
                                  </button>

                                  {expandedVarCategories.ctwa && (
                                    <div className="pl-6 pr-1 py-1 space-y-0.5">
                                      {CTWA_ACTION_VARIABLES.filter((v) =>
                                        v.label.toLowerCase().includes(varSearchQuery.toLowerCase())
                                      ).map((v) => (
                                        <button
                                          key={v.key}
                                          type="button"
                                          onClick={() => {
                                            updateRow(row.id, {
                                              variableKey: v.key,
                                              variableLabel: v.label
                                            });
                                            setOpenVarDropdownRowId(null);
                                          }}
                                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors cursor-pointer text-left ${
                                            row.variableKey === v.key
                                              ? 'bg-purple-50 text-[#3a2088] font-semibold'
                                              : 'text-slate-700 hover:bg-slate-100/70'
                                          }`}
                                        >
                                          <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                          <span className="truncate">{v.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* 3. Lead Field Variables */}
                                <div className="rounded-lg overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedVarCategories((prev) => ({
                                        ...prev,
                                        lead: !prev.lead
                                      }))
                                    }
                                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      {expandedVarCategories.lead ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                      )}
                                      <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                      <span>Lead Field Variables</span>
                                    </div>
                                  </button>

                                  {expandedVarCategories.lead && (
                                    <div className="pl-6 pr-1 py-1 space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                                      {leadFieldsList
                                        .filter((v) => v.label.toLowerCase().includes(varSearchQuery.toLowerCase()))
                                        .map((fld) => {
                                          const isDate =
                                            fld.type === 'date' ||
                                            fld.key.includes('date') ||
                                            fld.key.includes('dob') ||
                                            fld.key.includes('doj');
                                          return (
                                            <button
                                              key={fld.key}
                                              type="button"
                                              onClick={() => {
                                                updateRow(row.id, {
                                                  variableKey: `lead.${fld.key}`,
                                                  variableLabel: fld.label
                                                });
                                                setOpenVarDropdownRowId(null);
                                              }}
                                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors cursor-pointer text-left ${
                                                row.variableKey === `lead.${fld.key}`
                                                  ? 'bg-purple-50 text-[#3a2088] font-semibold'
                                                  : 'text-slate-700 hover:bg-slate-100/70'
                                              }`}
                                            >
                                              {isDate ? (
                                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                              ) : (
                                                <span className="w-3.5 h-3.5 flex items-center justify-center font-serif text-xs font-bold text-slate-400 shrink-0">
                                                  T
                                                </span>
                                              )}
                                              <span className="truncate">{fld.label}</span>
                                            </button>
                                          );
                                        })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Bottom Action: Switch to custom value */}
                              <div className="p-2.5 border-t border-slate-100 bg-slate-50/50">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateRow(row.id, { valueMode: 'custom', variableKey: '', variableLabel: '' });
                                    setOpenVarDropdownRowId(null);
                                  }}
                                  className="text-xs font-semibold text-[#3a2088] hover:underline cursor-pointer"
                                >
                                  Switch to custom value
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Row Delete Button (if more than 1 row) */}
                      {fieldUpdates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Delete row"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* + Add / update another field button */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={addRow}
                  className="text-xs font-semibold text-[#3a2088] hover:text-[#2c186b] underline decoration-dotted underline-offset-4 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>+ Add / update another field</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      // 6. Update Lead Rating
      case 'update_lead_rating': {
        const currentOp = config.ratingOperation || 'replace';
        const ratingVal = config.ratingValue !== undefined ? config.ratingValue : '0';
        const isConfigured = config.ratingValue !== undefined && config.ratingValue !== '';

        const opLabels: Record<string, string> = {
          increment: 'Increment Rating',
          decrement: 'Decrement Rating',
          replace: 'Replace Rating'
        };

        const valInputLabels: Record<string, string> = {
          increment: 'Increment By',
          decrement: 'Decrement By',
          replace: 'Replace With'
        };

        return (
          <div className="space-y-4" ref={ratingContainerRef}>
            {/* Red Alert Banner if not selected / empty */}
            {!isConfigured && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-2.5 flex items-center gap-2 text-[#EF4444] text-xs font-normal shadow-2xs">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                <span className="font-normal text-xs">Select Rating</span>
              </div>
            )}

            {/* Choose Operation Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-bold text-slate-800">
                Choose Operation
              </label>
              <button
                type="button"
                onClick={() => setIsRatingOpDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 hover:border-slate-400 focus:outline-none transition-colors shadow-2xs cursor-pointer text-left h-10"
              >
                <span className="font-medium text-slate-900">
                  {opLabels[currentOp] || 'Replace Rating'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" />
              </button>

              {/* Operation Dropdown Popup Menu */}
              {isRatingOpDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
                  {[
                    { value: 'increment', label: 'Increment Rating' },
                    { value: 'decrement', label: 'Decrement Rating' },
                    { value: 'replace', label: 'Replace Rating' }
                  ].map((op) => (
                    <button
                      key={op.value}
                      type="button"
                      onClick={() => {
                        handleConfigChange('ratingOperation', op.value);
                        setIsRatingOpDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs transition-colors cursor-pointer ${
                        currentOp === op.value
                          ? 'bg-purple-50/70 text-[#3a2088] font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Value Section with "Map variable" */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  {valInputLabels[currentOp] || 'Replace With'}
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRatingVarDropdownOpen((prev) => !prev);
                      setRatingVarSearchQuery('');
                    }}
                    className="text-xs font-medium text-[#4338CA] hover:text-[#3730A3] hover:underline cursor-pointer"
                  >
                    Map variable
                  </button>

                  {/* Variable Picker Popup with top pointer */}
                  {isRatingVarDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {/* Pointer Triangle */}
                      <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45" />

                      {/* Search Box */}
                      <div className="p-2.5 border-b border-slate-100 flex items-center gap-2 bg-white">
                        <input
                          type="text"
                          value={ratingVarSearchQuery}
                          onChange={(e) => setRatingVarSearchQuery(e.target.value)}
                          placeholder="Select a variable"
                          className="w-full text-xs text-slate-800 placeholder-slate-400 outline-none bg-transparent"
                          autoFocus
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>

                      {/* Variable Tree Accordion */}
                      <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                        {/* 1. Action Variables */}
                        <div className="rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRatingVarCategories((prev) => ({
                                ...prev,
                                action: !prev.action
                              }))
                            }
                            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              {expandedRatingVarCategories.action ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <span>Action Variables</span>
                            </div>
                          </button>

                          {expandedRatingVarCategories.action && (
                            <div className="pl-6 pr-1 py-1 space-y-0.5">
                              {ACTION_VARIABLES.filter((v) =>
                                v.label.toLowerCase().includes(ratingVarSearchQuery.toLowerCase())
                              ).map((v) => {
                                const IconComponent = v.icon;
                                return (
                                  <button
                                    key={v.key}
                                    type="button"
                                    onClick={() => {
                                      handleConfigChange('ratingValue', `{{${v.key}}}`);
                                      setIsRatingVarDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-700 hover:bg-purple-50 hover:text-[#3a2088] transition-colors cursor-pointer text-left"
                                  >
                                    {IconComponent ? (
                                      <IconComponent className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    ) : (
                                      <span className="w-3.5 h-3.5 flex items-center justify-center font-serif text-xs font-bold text-slate-500 shrink-0">
                                        {v.iconText}
                                      </span>
                                    )}
                                    <span className="truncate">{v.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 2. CTWA Action Variables */}
                        <div className="rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRatingVarCategories((prev) => ({
                                ...prev,
                                ctwa: !prev.ctwa
                              }))
                            }
                            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              {expandedRatingVarCategories.ctwa ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <span className="text-emerald-600 font-bold">💬</span>
                              <span>CTWA Action Variables</span>
                            </div>
                          </button>

                          {expandedRatingVarCategories.ctwa && (
                            <div className="pl-6 pr-1 py-1 space-y-0.5">
                              {CTWA_ACTION_VARIABLES.filter((v) =>
                                v.label.toLowerCase().includes(ratingVarSearchQuery.toLowerCase())
                              ).map((v) => (
                                <button
                                  key={v.key}
                                  type="button"
                                  onClick={() => {
                                    handleConfigChange('ratingValue', `{{${v.key}}}`);
                                    setIsRatingVarDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-700 hover:bg-purple-50 hover:text-[#3a2088] transition-colors cursor-pointer text-left"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="truncate">{v.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 3. Lead Field Variables */}
                        <div className="rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRatingVarCategories((prev) => ({
                                ...prev,
                                lead: !prev.lead
                              }))
                            }
                            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              {expandedRatingVarCategories.lead ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>Lead Field Variables</span>
                            </div>
                          </button>

                          {expandedRatingVarCategories.lead && (
                            <div className="pl-6 pr-1 py-1 space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                              {leadFieldsList
                                .filter((v) => v.label.toLowerCase().includes(ratingVarSearchQuery.toLowerCase()))
                                .map((fld) => (
                                  <button
                                    key={fld.key}
                                    type="button"
                                    onClick={() => {
                                      handleConfigChange('ratingValue', fld.tag);
                                      setIsRatingVarDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-700 hover:bg-purple-50 hover:text-[#3a2088] transition-colors cursor-pointer text-left"
                                  >
                                    <span className="truncate">{fld.label}</span>
                                    <span className="text-[10px] text-slate-400 font-mono ml-auto">{fld.tag}</span>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <input
                type="text"
                value={ratingVal}
                onChange={(e) => handleConfigChange('ratingValue', e.target.value)}
                placeholder="0"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#3a2088] shadow-2xs"
              />
            </div>
          </div>
        );
      }

      // 7. Update Lead Status (Redesigned per screenshots)
      case 'update_lead_status': {
        const statusVal = config.targetStage || config.stageName || config.status || '';
        const isVariable = statusVal.startsWith('{{') && statusVal.endsWith('}}');
        const selectedStage = statusGroups.flatMap((g) => g.stages).find(
          (s) => s.name.toLowerCase() === statusVal.toLowerCase() || s.id.toLowerCase() === statusVal.toLowerCase()
        ) || DEFAULT_STATUS_GROUPS.flatMap((g) => g.stages).find(
          (s) => s.name.toLowerCase() === statusVal.toLowerCase() || s.id.toLowerCase() === statusVal.toLowerCase()
        );

        return (
          <div className="space-y-4">
            {/* Alert Banner: No Status Selected (Shown when empty) */}
            {!statusVal && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-2.5 flex items-center gap-2 text-[#EF4444] text-xs font-normal shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
                <span>No Status Selected</span>
              </div>
            )}

            {/* Choose Lead Status Header Row */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-900">Choose Lead Status</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsStatusVarDropdownOpen(!isStatusVarDropdownOpen);
                      setIsStatusDropdownOpen(false);
                    }}
                    className="text-xs font-semibold text-[#3a2088] hover:underline cursor-pointer transition-colors"
                  >
                    Map variable
                  </button>

                  {/* Map Variable Tree Dropdown */}
                  {isStatusVarDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 p-2.5 space-y-2 text-slate-800 font-sans animate-in fade-in-50 zoom-in-95 duration-150">
                      <div className="relative">
                        <input
                          type="text"
                          value={statusVarSearchQuery}
                          onChange={(e) => setStatusVarSearchQuery(e.target.value)}
                          placeholder="Search variable..."
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] focus:bg-white"
                          autoFocus
                        />
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                        {/* 1. Action Variables */}
                        <div className="rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedStatusVarCategories((prev) => ({
                                ...prev,
                                action: !prev.action
                              }))
                            }
                            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              {expandedStatusVarCategories.action ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <WorkflowIcon id="notification_team_member" size={13} className="text-[#3a2088]" />
                              <span>Action Variables</span>
                            </div>
                          </button>

                          {expandedStatusVarCategories.action && (
                            <div className="pl-6 pr-1 py-1 space-y-0.5">
                              {ACTION_VARIABLES.filter(
                                (v) =>
                                  v.label.toLowerCase().includes(statusVarSearchQuery.toLowerCase()) ||
                                  v.key.toLowerCase().includes(statusVarSearchQuery.toLowerCase())
                              ).map((v) => (
                                <button
                                  key={v.key}
                                  type="button"
                                  onClick={() => {
                                    handleSingleOrBatchConfigChange({
                                      targetStage: `{{${v.key}}}`,
                                      stageName: `{{${v.key}}}`,
                                      stageColor: '#3a2088',
                                      status: `{{${v.key}}}`
                                    });
                                    setIsStatusVarDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-700 hover:bg-purple-50 hover:text-[#3a2088] transition-colors cursor-pointer text-left"
                                >
                                  <span className="truncate">{v.label}</span>
                                  <span className="text-[10px] text-slate-400 font-mono ml-auto">
                                    {`{{${v.key}}}`}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 2. CTWA Action Variables */}
                        <div className="rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedStatusVarCategories((prev) => ({
                                ...prev,
                                ctwa: !prev.ctwa
                              }))
                            }
                            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              {expandedStatusVarCategories.ctwa ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <span className="text-emerald-600 font-bold">💬</span>
                              <span>CTWA Action Variables</span>
                            </div>
                          </button>

                          {expandedStatusVarCategories.ctwa && (
                            <div className="pl-6 pr-1 py-1 space-y-0.5">
                              {CTWA_ACTION_VARIABLES.filter((v) =>
                                v.label.toLowerCase().includes(statusVarSearchQuery.toLowerCase())
                              ).map((v) => (
                                <button
                                  key={v.key}
                                  type="button"
                                  onClick={() => {
                                    handleSingleOrBatchConfigChange({
                                      targetStage: `{{${v.key}}}`,
                                      stageName: `{{${v.key}}}`,
                                      stageColor: '#059669',
                                      status: `{{${v.key}}}`
                                    });
                                    setIsStatusVarDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-700 hover:bg-purple-50 hover:text-[#3a2088] transition-colors cursor-pointer text-left"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="truncate">{v.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 3. Lead Field Variables */}
                        <div className="rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedStatusVarCategories((prev) => ({
                                ...prev,
                                lead: !prev.lead
                              }))
                            }
                            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              {expandedStatusVarCategories.lead ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>Lead Field Variables</span>
                            </div>
                          </button>

                          {expandedStatusVarCategories.lead && (
                            <div className="pl-6 pr-1 py-1 space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                              {leadFieldsList
                                .filter((v) => v.label.toLowerCase().includes(statusVarSearchQuery.toLowerCase()))
                                .map((fld) => (
                                  <button
                                    key={fld.key}
                                    type="button"
                                    onClick={() => {
                                      handleSingleOrBatchConfigChange({
                                        targetStage: fld.tag,
                                        stageName: fld.tag,
                                        stageColor: '#3a2088',
                                        status: fld.tag
                                      });
                                      setIsStatusVarDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-700 hover:bg-purple-50 hover:text-[#3a2088] transition-colors cursor-pointer text-left"
                                  >
                                    <span className="truncate">{fld.label}</span>
                                    <span className="text-[10px] text-slate-400 font-mono ml-auto">{fld.tag}</span>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Trigger Button / Pill & Dropdown */}
              <div className="relative inline-block" ref={statusContainerRef}>
                {!statusVal ? (
                  // Unselected trigger: soft pink/red pill [ ☵ Stage ▾ ]
                  <button
                    type="button"
                    onClick={() => {
                      setIsStatusDropdownOpen(!isStatusDropdownOpen);
                      setIsStatusVarDropdownOpen(false);
                    }}
                    className="bg-[#FDF2F2] border border-[#FECACA] text-[#991B1B] hover:bg-[#FEE2E2] px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                  >
                    <WorkflowIcon id="update_lead_status" size={13} className="text-[#991B1B]" />
                    <span>Stage</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#991B1B]" />
                  </button>
                ) : isVariable ? (
                  // Variable mapped pill
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#EDE9FE] border border-[#DDD6FE] text-[#3a2088] text-xs font-mono shadow-2xs">
                    <span>{statusVal}</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleSingleOrBatchConfigChange({
                          targetStage: '',
                          stageName: '',
                          stageColor: '',
                          status: ''
                        });
                      }}
                      className="text-[#3a2088] hover:text-red-600 cursor-pointer ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  // Selected Status pill [ 🟩 Fresh ▾ ]
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsStatusDropdownOpen(!isStatusDropdownOpen);
                        setIsStatusVarDropdownOpen(false);
                      }}
                      className="bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                    >
                      <span
                        className="w-3 h-3 rounded-xs shrink-0"
                        style={{ backgroundColor: selectedStage?.color || config.stageColor || '#4A705E' }}
                      />
                      <span>{selectedStage?.name || config.stageName || statusVal}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSingleOrBatchConfigChange({
                          targetStage: '',
                          stageName: '',
                          stageColor: '',
                          status: ''
                        });
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer transition-colors"
                      title="Clear status"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Dropdown Menu (Image 2) */}
                {isStatusDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 p-2.5 space-y-2 text-slate-800 font-sans animate-in fade-in-50 zoom-in-95 duration-150">
                    {/* Search Status Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={statusSearchQuery}
                        onChange={(e) => setStatusSearchQuery(e.target.value)}
                        placeholder="Search Status"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] focus:bg-white transition-colors"
                        autoFocus
                      />
                    </div>

                    {/* Categorized Stage Groups */}
                    <div className="max-h-72 overflow-y-auto space-y-2 custom-scrollbar">
                      {statusGroups.map((group) => {
                        const filteredStages = group.stages.filter((st) =>
                          st.name.toLowerCase().includes(statusSearchQuery.toLowerCase())
                        );
                        if (filteredStages.length === 0 && statusSearchQuery) {
                          return null;
                        }

                        const isExpanded = expandedStatusGroups[group.category] !== false;

                        return (
                          <div key={group.category} className="space-y-1">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedStatusGroups((prev) => ({
                                  ...prev,
                                  [group.category]: !isExpanded
                                }))
                              }
                              className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-700 py-1 cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                {group.category}
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform ${
                                    isExpanded ? 'rotate-0' : '-rotate-90'
                                  }`}
                                />
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="space-y-0.5 pl-1">
                                {filteredStages.map((stage) => (
                                  <button
                                    key={stage.id}
                                    type="button"
                                    onClick={() => {
                                      handleSingleOrBatchConfigChange({
                                        targetStage: stage.name,
                                        stageName: stage.name,
                                        stageColor: stage.color,
                                        status: stage.name
                                      });
                                      setIsStatusDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer text-left"
                                  >
                                    <span
                                      className="w-3.5 h-3.5 rounded-xs shrink-0"
                                      style={{ backgroundColor: stage.color }}
                                    />
                                    <span className="truncate">{stage.name}</span>
                                  </button>
                                ))}
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
        );
      }

      // 8. Time Delay (Redesigned per screenshots)
      case 'time_delay': {
        const val = config.delayValue !== undefined ? config.delayValue : 10;
        const unit = config.delayUnit || 'Minute';
        const dir = config.delayDirection || 'After';
        const ref = config.delayReference || 'Previous step';

        // Dynamic Date Fields from leadFieldsList (from database)
        const dynamicDateFields = leadFieldsList.filter(
          (f) =>
            f.type === 'date' ||
            f.type === 'datetime' ||
            f.key.includes('date') ||
            f.key.includes('created') ||
            f.key.includes('dob') ||
            f.key.includes('doj')
        );

        const timeUnits = ['Minute', 'Hour', 'Day', 'Week', 'Month'];
        const directions = ['After', 'Before'];

        return (
          <div className="space-y-4 font-sans" ref={delayContainerRef}>
            {/* Inline Pink Container per Screenshot 1 */}
            <div className="inline-flex items-center gap-2 bg-[#FCDADF] border border-[#FBC4CB] rounded-md px-3 py-2 text-slate-800 shadow-2xs">
              {/* Value Input with Underline */}
              <input
                type="number"
                min={1}
                value={val}
                onChange={(e) => handleConfigChange('delayValue', parseInt(e.target.value) || 0)}
                className="w-12 text-center text-xs font-bold text-slate-900 bg-transparent border-b border-slate-700 focus:outline-none focus:border-[#3a2088]"
                placeholder="10"
              />

              {/* Vertical divider */}
              <span className="h-4 w-[1px] bg-slate-300/80 mx-0.5" />

              {/* Unit Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsDelayUnitDropdownOpen(!isDelayUnitDropdownOpen);
                    setIsDelayDirectionDropdownOpen(false);
                    setIsDelayRefDropdownOpen(false);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
                >
                  <span>{unit}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                </button>

                {isDelayUnitDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-28 bg-white rounded-lg border border-slate-200 shadow-xl z-50 py-1 font-sans animate-in fade-in-50 zoom-in-95 duration-100">
                    {timeUnits.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => {
                          handleConfigChange('delayUnit', u);
                          setIsDelayUnitDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs font-medium cursor-pointer transition-colors ${
                          unit === u ? 'bg-purple-50 text-[#3a2088] font-bold' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vertical divider */}
              <span className="h-4 w-[1px] bg-slate-300/80 mx-0.5" />

              {/* Direction Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsDelayDirectionDropdownOpen(!isDelayDirectionDropdownOpen);
                    setIsDelayUnitDropdownOpen(false);
                    setIsDelayRefDropdownOpen(false);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
                >
                  <span>{dir}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                </button>

                {isDelayDirectionDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-24 bg-white rounded-lg border border-slate-200 shadow-xl z-50 py-1 font-sans animate-in fade-in-50 zoom-in-95 duration-100">
                    {directions.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          handleConfigChange('delayDirection', d);
                          setIsDelayDirectionDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs font-medium cursor-pointer transition-colors ${
                          dir === d ? 'bg-purple-50 text-[#3a2088] font-bold' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reference Anchor Dropdown (Previous step / Dynamic Date Fields per Screenshot) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsDelayRefDropdownOpen(!isDelayRefDropdownOpen);
                    setIsDelayUnitDropdownOpen(false);
                    setIsDelayDirectionDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-white/40 hover:bg-white/70 border border-slate-300/40 rounded px-2.5 py-1 transition-colors cursor-pointer"
                >
                  <span className="truncate max-w-[130px]">{ref}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                </button>

                {isDelayRefDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 p-2.5 space-y-2 font-sans animate-in fade-in-50 zoom-in-95 duration-100">
                    {/* Top Notch Pointer Arrow */}
                    <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-l border-t border-slate-200 rotate-45" />

                    {/* Search Input with Search Icon on Right */}
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={delayVarSearchQuery}
                        onChange={(e) => setDelayVarSearchQuery(e.target.value)}
                        placeholder="Select a delay variable"
                        className="w-full text-xs pr-8 pl-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] transition-colors"
                        autoFocus
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pt-1">
                      {/* 1. Previous step option */}
                      {('previous step'.includes(delayVarSearchQuery.toLowerCase()) || !delayVarSearchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            handleConfigChange('delayReference', 'Previous step');
                            setIsDelayRefDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium cursor-pointer transition-colors ${
                            ref === 'Previous step'
                              ? 'bg-purple-50 text-[#3a2088] font-bold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Previous step
                        </button>
                      )}

                      {/* 2. Collapsible Group: Lead Field Variables */}
                      <div className="rounded-lg overflow-hidden pt-1">
                        <button
                          type="button"
                          onClick={() => setIsDelayLeadVarsExpanded(!isDelayLeadVarsExpanded)}
                          className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            {isDelayLeadVarsExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <Settings className="w-3.5 h-3.5 text-[#3a2088] shrink-0" />
                            <span>Lead Field Variables</span>
                          </div>
                        </button>

                        {isDelayLeadVarsExpanded && (
                          <div className="pl-6 pr-1 py-1 space-y-0.5">
                            {dynamicDateFields
                              .filter((fld) =>
                                fld.label.toLowerCase().includes(delayVarSearchQuery.toLowerCase()) ||
                                fld.key.toLowerCase().includes(delayVarSearchQuery.toLowerCase())
                              )
                              .map((fld) => (
                                <button
                                  key={fld.key}
                                  type="button"
                                  onClick={() => {
                                    handleConfigChange('delayReference', fld.label);
                                    setIsDelayRefDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors cursor-pointer text-left ${
                                    ref === fld.label
                                      ? 'bg-purple-50 text-[#3a2088] font-bold'
                                      : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{fld.label}</span>
                                </button>
                              ))}

                            {dynamicDateFields.filter((fld) =>
                              fld.label.toLowerCase().includes(delayVarSearchQuery.toLowerCase()) ||
                              fld.key.toLowerCase().includes(delayVarSearchQuery.toLowerCase())
                            ).length === 0 && (
                              <div className="px-2 py-1.5 text-xs text-slate-400 italic">
                                No date variables found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // 9. Send WhatsApp To Lead
      case 'send_template': {
        const dynamicPhoneFields = leadFieldsList.filter(
          (f) => f.type === 'phone' || f.key.toLowerCase().includes('phone') || f.label.toLowerCase().includes('phone')
        );
        const defaultPhoneOptions: LeadFieldOption[] = [
          { key: 'alternate_phone', label: 'Alternate Phone', type: 'phone', tag: '{{lead.alternate_phone}}' },
          { key: 'phone', label: 'Phone', type: 'phone', tag: '{{lead.phone}}' }
        ];
        const phoneMap = new Map<string, LeadFieldOption>();
        defaultPhoneOptions.forEach((opt) => phoneMap.set(opt.label.toLowerCase(), opt));
        dynamicPhoneFields.forEach((opt) => phoneMap.set(opt.label.toLowerCase(), opt));
        const phoneOptions = Array.from(phoneMap.values());

        const selectedPhoneLabels: string[] = Array.isArray(config.toPhoneFields) && config.toPhoneFields.length > 0
          ? config.toPhoneFields
          : ['Phone'];

        return (
          <div ref={waContainerRef} className="space-y-4 font-sans">
            {/* Warning Alert Banner (Screenshot 1) */}
            {!config.whatsappAccount && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-2.5 flex items-center gap-2 text-[#EF4444] text-xs font-normal">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                <span>Select Whatsapp Business Account</span>
              </div>
            )}

            {/* 1. Whatsapp Account Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Whatsapp Account
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsWaAccountDropdownOpen(!isWaAccountDropdownOpen);
                    setIsToPhoneDropdownOpen(false);
                  }}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <span className={config.whatsappAccount ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                    {config.whatsappAccount || 'Select Account'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${isWaAccountDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isWaAccountDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                    {waAccountsList.map((acc) => {
                      const isSelected = config.whatsappAccount === acc.name;
                      return (
                        <div
                          key={acc.id}
                          onClick={() => {
                            handleSingleOrBatchConfigChange({
                              whatsappAccount: acc.name,
                              whatsappAccountId: acc.id
                            });
                            setIsWaAccountDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <WorkflowIcon id="send_template" size={14} className={isSelected ? 'text-emerald-600' : 'text-slate-500'} />
                            <span>{acc.name}</span>
                          </div>
                          {acc.phoneNumber && (
                            <span className="text-[10px] text-slate-400 font-mono">{acc.phoneNumber}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2. To Phone Field Checkbox Dropdown (Screenshot 1) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                To Phone Field
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsToPhoneDropdownOpen(!isToPhoneDropdownOpen);
                    setIsWaAccountDropdownOpen(false);
                  }}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span className="font-normal text-slate-800 truncate">
                      {selectedPhoneLabels.join(', ')}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${isToPhoneDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isToPhoneDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1">
                    {phoneOptions.map((opt) => {
                      const isChecked = selectedPhoneLabels.includes(opt.label) || (Array.isArray(config.toPhoneFields) && config.toPhoneFields.includes(opt.key));
                      return (
                        <div
                          key={opt.key}
                          onClick={() => {
                            let updated: string[];
                            if (isChecked) {
                              updated = selectedPhoneLabels.filter((p) => p !== opt.label && p !== opt.key);
                              if (updated.length === 0) updated = [opt.label];
                            } else {
                              updated = [...selectedPhoneLabels, opt.label];
                            }
                            handleSingleOrBatchConfigChange({
                              toPhoneFields: updated,
                              recipientPhoneVariable: `{{lead.${opt.key}}}`
                            });
                          }}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                        >
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                              isChecked
                                ? 'bg-[#7C3AED] border border-[#7C3AED] text-white shadow-2xs'
                                : 'border border-[#7C3AED] bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={`text-xs ${isChecked ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                            {opt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Action: Send List (WhatsApp Interactive List)
      case 'send_list': {
        const dynamicPhoneFields = leadFieldsList.filter(
          (f) => f.type === 'phone' || f.key.toLowerCase().includes('phone') || f.label.toLowerCase().includes('phone')
        );
        const defaultPhoneOptions: LeadFieldOption[] = [
          { key: 'alternate_phone', label: 'Alternate Phone', type: 'phone', tag: '{{lead.alternate_phone}}' },
          { key: 'phone', label: 'Phone', type: 'phone', tag: '{{lead.phone}}' }
        ];
        const phoneMap = new Map<string, LeadFieldOption>();
        defaultPhoneOptions.forEach((opt) => phoneMap.set(opt.label.toLowerCase(), opt));
        dynamicPhoneFields.forEach((opt) => phoneMap.set(opt.label.toLowerCase(), opt));
        const phoneOptions = Array.from(phoneMap.values());

        const selectedPhoneLabels: string[] = Array.isArray(config.toPhoneFields) && config.toPhoneFields.length > 0
          ? config.toPhoneFields
          : ['Phone'];

        const sections = Array.isArray(config.sections) && config.sections.length > 0
          ? config.sections
          : [{ id: 'sec_1', title: 'Options', rows: [{ id: 'opt_1', title: 'Option 1', description: '' }] }];

        const totalRows = sections.reduce((acc: number, s: any) => acc + (s.rows?.length || 0), 0);

        return (
          <div ref={waContainerRef} className="space-y-4 font-sans">
            {/* Warning Alert Banner (Screenshot) */}
            {!config.whatsappAccount && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-2.5 flex items-center gap-2 text-[#DC2626] text-xs font-normal shadow-2xs">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>Select Whatsapp Business Account</span>
              </div>
            )}

            {/* 1. Whatsapp Account Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Whatsapp Account
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsWaAccountDropdownOpen(!isWaAccountDropdownOpen);
                    setIsToPhoneDropdownOpen(false);
                  }}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <span className={config.whatsappAccount ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                    {config.whatsappAccount || 'Select Account'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${isWaAccountDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isWaAccountDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                    {waAccountsList.map((acc) => {
                      const isSelected = config.whatsappAccount === acc.name;
                      return (
                        <div
                          key={acc.id}
                          onClick={() => {
                            handleSingleOrBatchConfigChange({
                              whatsappAccount: acc.name,
                              whatsappAccountId: acc.id
                            });
                            setIsWaAccountDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <WorkflowIcon id="send_list" size={14} className={isSelected ? 'text-emerald-600' : 'text-slate-500'} />
                            <span>{acc.name}</span>
                          </div>
                          {acc.phoneNumber && (
                            <span className="text-[10px] text-slate-400 font-mono">{acc.phoneNumber}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {config.whatsappAccount && (
              <>
                {/* 2. To Phone Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    To Phone Field
                  </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsToPhoneDropdownOpen(!isToPhoneDropdownOpen);
                    setIsWaAccountDropdownOpen(false);
                  }}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span className="font-normal text-slate-800 truncate">
                      {selectedPhoneLabels.join(', ')}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${isToPhoneDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isToPhoneDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1">
                    {phoneOptions.map((opt) => {
                      const isChecked = selectedPhoneLabels.includes(opt.label) || (Array.isArray(config.toPhoneFields) && config.toPhoneFields.includes(opt.key));
                      return (
                        <div
                          key={opt.key}
                          onClick={() => {
                            let updated: string[];
                            if (isChecked) {
                              updated = selectedPhoneLabels.filter((p) => p !== opt.label && p !== opt.key);
                              if (updated.length === 0) updated = [opt.label];
                            } else {
                              updated = [...selectedPhoneLabels, opt.label];
                            }
                            handleSingleOrBatchConfigChange({
                              toPhoneFields: updated,
                              recipientPhoneVariable: `{{lead.${opt.key}}}`
                            });
                          }}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                        >
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                              isChecked
                                ? 'bg-[#7C3AED] border border-[#7C3AED] text-white shadow-2xs'
                                : 'border border-[#7C3AED] bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={`text-xs ${isChecked ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                            {opt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Header Text (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Header Text <span className="text-slate-400 font-normal">(Optional, max 60 chars)</span>
              </label>
              <input
                type="text"
                maxLength={60}
                value={config.headerText || ''}
                onChange={(e) => handleConfigChange('headerText', e.target.value)}
                placeholder="e.g. Our Products & Services"
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#7C3AED] focus:outline-none shadow-2xs"
              />
            </div>

            {/* 4. Body Text with Add Variable */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Body Text <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsListBodyVarOpen(!isListBodyVarOpen)}
                    className="bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7C3AED] text-xs font-medium px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>Add Variable</span>
                  </button>
                  {isListBodyVarOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-60 overflow-y-auto custom-scrollbar">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                        Lead Fields
                      </div>
                      {leadFieldsList.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => {
                            const varTag = f.tag || `{{lead.${f.key}}}`;
                            const currentVal = config.bodyText || '';
                            const textarea = listBodyTextareaRef.current;
                            let nextVal = currentVal + varTag;
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              nextVal = currentVal.substring(0, start) + varTag + currentVal.substring(end);
                            }
                            handleConfigChange('bodyText', nextVal);
                            setIsListBodyVarOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-purple-50 hover:text-[#7C3AED] flex items-center justify-between cursor-pointer"
                        >
                          <span>{f.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {f.tag || `{{lead.${f.key}}}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <textarea
                ref={listBodyTextareaRef}
                rows={3}
                value={config.bodyText !== undefined ? config.bodyText : 'Please choose an option from the menu below:'}
                onChange={(e) => handleConfigChange('bodyText', e.target.value)}
                placeholder="Message body displayed above the list button..."
                className="w-full border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:border-[#7C3AED] focus:outline-none resize-y bg-white shadow-2xs"
              />
            </div>

            {/* 5. Footer Text & Button Label */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Footer Text <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={config.footerText || ''}
                  onChange={(e) => handleConfigChange('footerText', e.target.value)}
                  placeholder="e.g. Pixbe CRM"
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#7C3AED] focus:outline-none shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Menu Button Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={config.buttonText || 'Select Option'}
                  onChange={(e) => handleConfigChange('buttonText', e.target.value)}
                  placeholder="Select Option"
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#7C3AED] focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            {/* 6. List Sections & Rows Builder (Max 10 rows total) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">List Sections & Options</span>
                  <span className="text-[10px] font-semibold bg-purple-50 text-[#7C3AED] px-2 py-0.5 rounded-full border border-purple-200">
                    {totalRows}/10 options
                  </span>
                </div>
                {totalRows < 10 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newSections = [...sections];
                      if (newSections.length === 0) {
                        newSections.push({ id: `sec_${Date.now()}`, title: 'Options', rows: [] });
                      }
                      newSections[0].rows.push({
                        id: `opt_${Date.now()}`,
                        title: `Option ${newSections[0].rows.length + 1}`,
                        description: ''
                      });
                      handleConfigChange('sections', newSections);
                    }}
                    className="text-xs font-semibold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>

              {sections.map((section: any, sIdx: number) => (
                <div key={section.id || sIdx} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={section.title || ''}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[sIdx].title = e.target.value;
                        handleConfigChange('sections', updated);
                      }}
                      placeholder="Section Title (e.g. Categories)"
                      className="text-xs font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#7C3AED] focus:outline-none text-slate-800 px-1 py-0.5"
                    />
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = sections.filter((_: any, idx: number) => idx !== sIdx);
                          handleConfigChange('sections', updated);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 pl-1">
                    {section.rows?.map((row: any, rIdx: number) => (
                      <div key={row.id || rIdx} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-start gap-2 shadow-2xs">
                        <div className="flex-1 space-y-1.5">
                          <input
                            type="text"
                            maxLength={24}
                            value={row.title || ''}
                            onChange={(e) => {
                              const updated = [...sections];
                              updated[sIdx].rows[rIdx].title = e.target.value;
                              handleConfigChange('sections', updated);
                            }}
                            placeholder="Option Title (max 24 chars)"
                            className="w-full text-xs font-semibold px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-800 focus:border-[#7C3AED] focus:outline-none"
                          />
                          <input
                            type="text"
                            maxLength={72}
                            value={row.description || ''}
                            onChange={(e) => {
                              const updated = [...sections];
                              updated[sIdx].rows[rIdx].description = e.target.value;
                              handleConfigChange('sections', updated);
                            }}
                            placeholder="Description (optional, max 72 chars)"
                            className="w-full text-xs px-2.5 py-1 rounded border border-slate-100 bg-slate-50 text-slate-600 focus:border-[#7C3AED] focus:outline-none"
                          />
                        </div>
                        {section.rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...sections];
                              updated[sIdx].rows = updated[sIdx].rows.filter((_: any, idx: number) => idx !== rIdx);
                              handleConfigChange('sections', updated);
                            }}
                            className="text-slate-300 hover:text-red-600 p-1.5 cursor-pointer mt-0.5"
                            title="Remove Option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            </>
            )}
          </div>
        );
      }

      // Action: Send Non Template (WhatsApp Session Message)
      case 'send_non_template': {
        const dynamicPhoneFields = leadFieldsList.filter(
          (f) => f.type === 'phone' || f.key.toLowerCase().includes('phone') || f.label.toLowerCase().includes('phone')
        );
        const defaultPhoneOptions: LeadFieldOption[] = [
          { key: 'alternate_phone', label: 'Alternate Phone', type: 'phone', tag: '{{lead.alternate_phone}}' },
          { key: 'phone', label: 'Phone', type: 'phone', tag: '{{lead.phone}}' }
        ];
        const phoneMap = new Map<string, LeadFieldOption>();
        defaultPhoneOptions.forEach((opt) => phoneMap.set(opt.label.toLowerCase(), opt));
        dynamicPhoneFields.forEach((opt) => phoneMap.set(opt.label.toLowerCase(), opt));
        const phoneOptions = Array.from(phoneMap.values());

        const selectedPhoneLabels: string[] = Array.isArray(config.toPhoneFields) && config.toPhoneFields.length > 0
          ? config.toPhoneFields
          : ['Phone'];

        const msgType = config.messageType || 'text';

        return (
          <div ref={waContainerRef} className="space-y-4 font-sans">
            {/* 1. Whatsapp Account */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Whatsapp Account
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsWaAccountDropdownOpen(!isWaAccountDropdownOpen);
                    setIsToPhoneDropdownOpen(false);
                  }}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <span className={config.whatsappAccount ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                    {config.whatsappAccount || 'Select Account'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${isWaAccountDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isWaAccountDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                    {waAccountsList.map((acc) => {
                      const isSelected = config.whatsappAccount === acc.name;
                      return (
                        <div
                          key={acc.id}
                          onClick={() => {
                            handleSingleOrBatchConfigChange({
                              whatsappAccount: acc.name,
                              whatsappAccountId: acc.id
                            });
                            setIsWaAccountDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <WorkflowIcon id="send_non_template" size={14} className={isSelected ? 'text-emerald-600' : 'text-slate-500'} />
                            <span>{acc.name}</span>
                          </div>
                          {acc.phoneNumber && (
                            <span className="text-[10px] text-slate-400 font-mono">{acc.phoneNumber}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {config.whatsappAccount && (
              <>
                {/* 24-Hour Window Service Alert */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2 text-amber-900 text-xs shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>24-Hour Customer Service Window:</strong> Non-template messages can only be delivered if the lead has messaged your business in the last 24 hours.
                  </div>
                </div>

                {/* 2. To Phone Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    To Phone Field
                  </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsToPhoneDropdownOpen(!isToPhoneDropdownOpen);
                    setIsWaAccountDropdownOpen(false);
                  }}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span className="font-normal text-slate-800 truncate">
                      {selectedPhoneLabels.join(', ')}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${isToPhoneDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isToPhoneDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1">
                    {phoneOptions.map((opt) => {
                      const isChecked = selectedPhoneLabels.includes(opt.label) || (Array.isArray(config.toPhoneFields) && config.toPhoneFields.includes(opt.key));
                      return (
                        <div
                          key={opt.key}
                          onClick={() => {
                            let updated: string[];
                            if (isChecked) {
                              updated = selectedPhoneLabels.filter((p) => p !== opt.label && p !== opt.key);
                              if (updated.length === 0) updated = [opt.label];
                            } else {
                              updated = [...selectedPhoneLabels, opt.label];
                            }
                            handleSingleOrBatchConfigChange({
                              toPhoneFields: updated,
                              recipientPhoneVariable: `{{lead.${opt.key}}}`
                            });
                          }}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                        >
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                              isChecked
                                ? 'bg-[#7C3AED] border border-[#7C3AED] text-white shadow-2xs'
                                : 'border border-[#7C3AED] bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={`text-xs ${isChecked ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                            {opt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Message Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Message Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'text', label: '💬 Text' },
                  { id: 'image', label: '🖼️ Image' },
                  { id: 'document', label: '📄 Document' },
                  { id: 'video', label: '🎥 Video' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleConfigChange('messageType', type.id)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                      msgType === type.id
                        ? 'bg-purple-50 border-[#7C3AED] text-[#7C3AED] shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Media URL & Caption (If not text) */}
            {msgType !== 'text' && (
              <div className="space-y-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Media File URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.mediaUrl || ''}
                    onChange={(e) => handleConfigChange('mediaUrl', e.target.value)}
                    placeholder="https://example.com/file.jpg or {{lead.attachment_url}}"
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#7C3AED] focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Caption / Filename <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={config.mediaCaption || ''}
                    onChange={(e) => handleConfigChange('mediaCaption', e.target.value)}
                    placeholder="e.g. Brochure - Pixbe CRM"
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#7C3AED] focus:outline-none shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* 5. Message Body Text with Add Variable */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  {msgType === 'text' ? 'Message Text' : 'Additional Message'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNonTemplateBodyVarOpen(!isNonTemplateBodyVarOpen)}
                    className="bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7C3AED] text-xs font-medium px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>Add Variable</span>
                  </button>
                  {isNonTemplateBodyVarOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-60 overflow-y-auto custom-scrollbar">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                        Lead Fields
                      </div>
                      {leadFieldsList.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => {
                            const varTag = f.tag || `{{lead.${f.key}}}`;
                            const currentVal = config.messageText || '';
                            const textarea = nonTemplateBodyTextareaRef.current;
                            let nextVal = currentVal + varTag;
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              nextVal = currentVal.substring(0, start) + varTag + currentVal.substring(end);
                            }
                            handleConfigChange('messageText', nextVal);
                            setIsNonTemplateBodyVarOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-purple-50 hover:text-[#7C3AED] flex items-center justify-between cursor-pointer"
                        >
                          <span>{f.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {f.tag || `{{lead.${f.key}}}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <textarea
                ref={nonTemplateBodyTextareaRef}
                rows={4}
                value={config.messageText || ''}
                onChange={(e) => handleConfigChange('messageText', e.target.value)}
                placeholder="Type your message here... Use {{lead.name}} for personalization."
                className="w-full border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:border-[#7C3AED] focus:outline-none resize-y bg-white shadow-2xs"
              />
            </div>
            </>
            )}
          </div>
        );
      }

      // Action: Send Interactive (WhatsApp Buttons / CTA)
      case 'send_interactive': {
        const dynamicPhoneFields = leadFieldsList.filter(
          (f) => f.type === 'phone' || f.key.toLowerCase().includes('phone') || f.label.toLowerCase().includes('phone')
        );
        const defaultPhoneOptions: LeadFieldOption[] = [
          { key: 'alternate_phone', label: 'Alternate Phone', type: 'phone', tag: '{{lead.alternate_phone}}' },
          { key: 'phone', label: 'Phone', type: 'phone', tag: '{{lead.phone}}' }
        ];
        const phoneMap = new Map<string, LeadFieldOption>();
        defaultPhoneOptions.forEach((opt) => phoneMap.set(opt.label.toLowerCase(), opt));
        dynamicPhoneFields.forEach((opt) => phoneMap.set(opt.label.toLowerCase(), opt));
        const phoneOptions = Array.from(phoneMap.values());

        const selectedPhoneLabels: string[] = Array.isArray(config.toPhoneFields) && config.toPhoneFields.length > 0
          ? config.toPhoneFields
          : ['Phone'];

        const interactiveType = config.interactiveType || 'quick_reply';
        const buttons: { id: string; title: string }[] = Array.isArray(config.buttons) && config.buttons.length > 0
          ? config.buttons
          : [
              { id: 'btn_1', title: 'Yes, Interested' },
              { id: 'btn_2', title: 'Call Me Back' }
            ];

        return (
          <div ref={waContainerRef} className="space-y-4 font-sans">
            {/* Warning Alert Banner */}
            {!config.whatsappAccount && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-2.5 flex items-center gap-2 text-[#DC2626] text-xs font-normal shadow-2xs">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>Select Whatsapp Business Account</span>
              </div>
            )}

            {/* 1. Whatsapp Account */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Whatsapp Account
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsWaAccountDropdownOpen(!isWaAccountDropdownOpen);
                    setIsToPhoneDropdownOpen(false);
                  }}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <span className={config.whatsappAccount ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                    {config.whatsappAccount || 'Select Account'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${isWaAccountDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isWaAccountDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                    {waAccountsList.map((acc) => {
                      const isSelected = config.whatsappAccount === acc.name;
                      return (
                        <div
                          key={acc.id}
                          onClick={() => {
                            handleSingleOrBatchConfigChange({
                              whatsappAccount: acc.name,
                              whatsappAccountId: acc.id
                            });
                            setIsWaAccountDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <WorkflowIcon id="send_interactive" size={14} className={isSelected ? 'text-emerald-600' : 'text-slate-500'} />
                            <span>{acc.name}</span>
                          </div>
                          {acc.phoneNumber && (
                            <span className="text-[10px] text-slate-400 font-mono">{acc.phoneNumber}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {config.whatsappAccount && (
              <>
                {/* 2. To Phone Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    To Phone Field
                  </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsToPhoneDropdownOpen(!isToPhoneDropdownOpen);
                    setIsWaAccountDropdownOpen(false);
                  }}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span className="font-normal text-slate-800 truncate">
                      {selectedPhoneLabels.join(', ')}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${isToPhoneDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isToPhoneDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1">
                    {phoneOptions.map((opt) => {
                      const isChecked = selectedPhoneLabels.includes(opt.label) || (Array.isArray(config.toPhoneFields) && config.toPhoneFields.includes(opt.key));
                      return (
                        <div
                          key={opt.key}
                          onClick={() => {
                            let updated: string[];
                            if (isChecked) {
                              updated = selectedPhoneLabels.filter((p) => p !== opt.label && p !== opt.key);
                              if (updated.length === 0) updated = [opt.label];
                            } else {
                              updated = [...selectedPhoneLabels, opt.label];
                            }
                            handleSingleOrBatchConfigChange({
                              toPhoneFields: updated,
                              recipientPhoneVariable: `{{lead.${opt.key}}}`
                            });
                          }}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                        >
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                              isChecked
                                ? 'bg-[#7C3AED] border border-[#7C3AED] text-white shadow-2xs'
                                : 'border border-[#7C3AED] bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={`text-xs ${isChecked ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                            {opt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Interactive Type (Quick Reply vs CTA) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Interactive Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleConfigChange('interactiveType', 'quick_reply')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                    interactiveType === 'quick_reply'
                      ? 'bg-purple-50 border-[#7C3AED] text-[#7C3AED] shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  🔘 Quick Reply (Max 3 Buttons)
                </button>
                <button
                  type="button"
                  onClick={() => handleConfigChange('interactiveType', 'cta')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                    interactiveType === 'cta'
                      ? 'bg-purple-50 border-[#7C3AED] text-[#7C3AED] shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  🔗 Call To Action (URL / Call)
                </button>
              </div>
            </div>

            {/* 4. Header Text (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Header Text <span className="text-slate-400 font-normal">(Optional, max 60 chars)</span>
              </label>
              <input
                type="text"
                maxLength={60}
                value={config.headerText || ''}
                onChange={(e) => handleConfigChange('headerText', e.target.value)}
                placeholder="e.g. Exclusive Offer for you"
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#7C3AED] focus:outline-none shadow-2xs"
              />
            </div>

            {/* 5. Message Body Text with Add Variable */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Body Text <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsInteractiveBodyVarOpen(!isInteractiveBodyVarOpen)}
                    className="bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7C3AED] text-xs font-medium px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>Add Variable</span>
                  </button>
                  {isInteractiveBodyVarOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-60 overflow-y-auto custom-scrollbar">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                        Lead Fields
                      </div>
                      {leadFieldsList.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => {
                            const varTag = f.tag || `{{lead.${f.key}}}`;
                            const currentVal = config.bodyText || '';
                            const textarea = interactiveBodyTextareaRef.current;
                            let nextVal = currentVal + varTag;
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              nextVal = currentVal.substring(0, start) + varTag + currentVal.substring(end);
                            }
                            handleConfigChange('bodyText', nextVal);
                            setIsInteractiveBodyVarOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-purple-50 hover:text-[#7C3AED] flex items-center justify-between cursor-pointer"
                        >
                          <span>{f.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {f.tag || `{{lead.${f.key}}}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <textarea
                ref={interactiveBodyTextareaRef}
                rows={3}
                value={config.bodyText || ''}
                onChange={(e) => handleConfigChange('bodyText', e.target.value)}
                placeholder="Hi {{lead.name}}, are you interested in a quick demo?"
                className="w-full border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:border-[#7C3AED] focus:outline-none resize-y bg-white shadow-2xs"
              />
            </div>

            {/* 6. Footer Text (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Footer Text <span className="text-slate-400 font-normal">(Optional, max 60 chars)</span>
              </label>
              <input
                type="text"
                maxLength={60}
                value={config.footerText || ''}
                onChange={(e) => handleConfigChange('footerText', e.target.value)}
                placeholder="e.g. Tap an option below to respond"
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#7C3AED] focus:outline-none shadow-2xs"
              />
            </div>

            {/* 7. Buttons Builder */}
            {interactiveType === 'quick_reply' ? (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Quick Reply Buttons ({buttons.length}/3)
                  </span>
                  {buttons.length < 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...buttons, { id: `btn_${Date.now()}`, title: `Option ${buttons.length + 1}` }];
                        handleConfigChange('buttons', updated);
                      }}
                      className="text-xs font-semibold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Button</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {buttons.map((btn, idx) => (
                    <div key={btn.id || idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 w-16 shrink-0">
                        Button {idx + 1}
                      </span>
                      <input
                        type="text"
                        maxLength={20}
                        value={btn.title || ''}
                        onChange={(e) => {
                          const updated = [...buttons];
                          updated[idx].title = e.target.value;
                          handleConfigChange('buttons', updated);
                        }}
                        placeholder="Button Title (max 20 chars)"
                        className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#7C3AED] focus:outline-none shadow-2xs"
                      />
                      {buttons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = buttons.filter((_, i) => i !== idx);
                            handleConfigChange('buttons', updated);
                          }}
                          className="text-slate-400 hover:text-red-600 p-1.5 cursor-pointer"
                          title="Remove Button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* CTA Call & URL Buttons */
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800">
                  Call To Action Buttons
                </span>
                {/* 1. Website Link Button */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <span>🌐 Website URL Button</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      maxLength={20}
                      value={config.ctaUrlLabel || ''}
                      onChange={(e) => handleConfigChange('ctaUrlLabel', e.target.value)}
                      placeholder="Button Label (e.g. Visit Website)"
                      className="text-xs font-medium px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={config.ctaUrl || ''}
                      onChange={(e) => handleConfigChange('ctaUrl', e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="text-xs font-mono px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2. Phone Call Button */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <span>📞 Phone Call Button</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      maxLength={20}
                      value={config.ctaPhoneLabel || ''}
                      onChange={(e) => handleConfigChange('ctaPhoneLabel', e.target.value)}
                      placeholder="Button Label (e.g. Call Sales)"
                      className="text-xs font-medium px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={config.ctaPhone || ''}
                      onChange={(e) => handleConfigChange('ctaPhone', e.target.value)}
                      placeholder="+919876543210 or {{action.employee_phone}}"
                      className="text-xs font-mono px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
            </>
            )}
          </div>
        );
      }

      // 10. Add in List(s)
      case 'add_in_list': {
        const filteredLists = campaignLists.filter((l) =>
          l.toLowerCase().includes(listSearchQuery.toLowerCase())
        );

        return (
          <div ref={listContainerRef} className="space-y-4 font-sans">
            {/* Warning Alert Banner (Screenshot) */}
            {!config.listName && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-2.5 flex items-center gap-2 text-[#EF4444] text-xs font-normal">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                <span>No List Selected</span>
              </div>
            )}

            {/* Choose List Section */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Choose List
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsListDropdownOpen(!isListDropdownOpen)}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <span className={config.listName ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                    {config.listName || 'Select List'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${
                      isListDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isListDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                    {/* Search Bar */}
                    <div className="relative mb-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={listSearchQuery}
                        onChange={(e) => setListSearchQuery(e.target.value)}
                        placeholder="Search list..."
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:border-[#3a2088]"
                        autoFocus
                      />
                    </div>

                    {filteredLists.map((name) => {
                      const isSelected = config.listName === name;
                      return (
                        <div
                          key={name}
                          onClick={() => {
                            handleSingleOrBatchConfigChange({
                              listName: name
                            });
                            setIsListDropdownOpen(false);
                            setListSearchQuery('');
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-purple-50 text-[#3a2088] font-semibold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-[#3a2088]' : 'text-slate-400'}`} />
                            <span>{name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#3a2088]" />}
                        </div>
                      );
                    })}

                    {filteredLists.length === 0 && (
                      <div className="py-2 text-center text-xs text-slate-400 italic">
                        No matching lists found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // 11. Remove from List(s)
      case 'remove_from_list': {
        const filteredLists = campaignLists.filter((l) =>
          l.toLowerCase().includes(removeListSearchQuery.toLowerCase())
        );

        return (
          <div ref={removeListContainerRef} className="space-y-4 font-sans">
            {/* Warning Alert Banner (Screenshot) */}
            {!config.removeListName && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-2.5 flex items-center gap-2 text-[#EF4444] text-xs font-normal">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                <span>No List Selected</span>
              </div>
            )}

            {/* Choose Labels Section (Exact match to Screenshot) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Choose Labels
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRemoveListDropdownOpen(!isRemoveListDropdownOpen)}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <span className={config.removeListName ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                    {config.removeListName || 'Select List'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${
                      isRemoveListDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isRemoveListDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                    {/* Search Bar */}
                    <div className="relative mb-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={removeListSearchQuery}
                        onChange={(e) => setRemoveListSearchQuery(e.target.value)}
                        placeholder="Search list or label..."
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:border-[#3a2088]"
                        autoFocus
                      />
                    </div>

                    {filteredLists.map((name) => {
                      const isSelected = config.removeListName === name;
                      return (
                        <div
                          key={name}
                          onClick={() => {
                            handleSingleOrBatchConfigChange({
                              removeListName: name
                            });
                            setIsRemoveListDropdownOpen(false);
                            setRemoveListSearchQuery('');
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-rose-50 text-rose-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-rose-600' : 'text-slate-400'}`} />
                            <span>{name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-rose-600" />}
                        </div>
                      );
                    })}

                    {filteredLists.length === 0 && (
                      <div className="py-4 text-center text-xs text-slate-400 font-normal">
                        No lists found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // 12. Add Task (Redesigned per screenshot)
      case 'add_task': {
        const taskTypes = [
          { id: 'call_followup', label: 'Call Followup', icon: AlarmClock },
          { id: 'todo', label: 'Todo', icon: CheckSquare }
        ];

        const selectedTaskTypeObj = taskTypes.find(
          (t) => t.label === config.taskType || t.id === config.taskType
        );

        const priorityOptions = [
          { label: 'None', flagColor: 'text-slate-500' },
          { label: 'Low', flagColor: 'text-blue-500' },
          { label: 'Medium', flagColor: 'text-amber-500' },
          { label: 'High', flagColor: 'text-orange-500' },
          { label: 'Urgent', flagColor: 'text-red-600' }
        ];

        const deadlineUnits = ['Minute', 'Hour', 'Day', 'Week', 'Month'];
        const deadlineDirections = ['After', 'Before'];

        // Dynamic date fields from leadFieldsList
        const dynamicDateFields = leadFieldsList.filter(
          (f) =>
            f.type === 'date' ||
            f.type === 'datetime' ||
            f.key.includes('date') ||
            f.key.includes('created') ||
            f.key.includes('dob') ||
            f.key.includes('doj')
        );

        const currentPriority = priorityOptions.find((p) => p.label === config.taskPriority) || priorityOptions[0];

        return (
          <div ref={taskContainerRef} className="space-y-4 font-sans">
            {/* 1. Select Task Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Select Task Type
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsTaskTypeDropdownOpen(!isTaskTypeDropdownOpen);
                    setIsTaskAssignDropdownOpen(false);
                    setIsTaskPriorityDropdownOpen(false);
                    setIsTaskDeadlineUnitDropdownOpen(false);
                    setIsTaskDeadlineDirDropdownOpen(false);
                    setIsTaskDeadlineRefDropdownOpen(false);
                    setIsTaskDescVarOpen(false);
                  }}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3.5 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    {selectedTaskTypeObj && (
                      <selectedTaskTypeObj.icon className="w-4 h-4 text-slate-700 shrink-0" />
                    )}
                    <span className={config.taskType ? 'font-normal text-slate-800' : 'text-slate-500'}>
                      {selectedTaskTypeObj ? selectedTaskTypeObj.label : (config.taskType || 'Select Task Type')}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${
                      isTaskTypeDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isTaskTypeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-100">
                    {taskTypes.map((t) => {
                      const IconComponent = t.icon;
                      const isSelected =
                        config.taskType === t.label || config.taskType === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            handleConfigChange('taskType', t.label);
                            setIsTaskTypeDropdownOpen(false);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <IconComponent
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-[#7C3AED]' : 'text-slate-700'
                            }`}
                          />
                          <span>{t.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Assign to */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Assign to
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsTaskAssignDropdownOpen(!isTaskAssignDropdownOpen);
                    setIsTaskTypeDropdownOpen(false);
                    setIsTaskPriorityDropdownOpen(false);
                    setIsTaskDeadlineUnitDropdownOpen(false);
                    setIsTaskDeadlineDirDropdownOpen(false);
                    setIsTaskDeadlineRefDropdownOpen(false);
                    setIsTaskDescVarOpen(false);
                  }}
                  className="w-72 border border-slate-200 rounded-lg bg-white px-3 py-2 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="font-normal text-slate-800 truncate">
                      {config.assignTo || 'Lead Assignee'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${
                      isTaskAssignDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isTaskAssignDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                    {/* Default dynamic Lead Assignee */}
                    <div
                      onClick={() => {
                        handleConfigChange('assignTo', 'Lead Assignee');
                        setIsTaskAssignDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        (config.assignTo || 'Lead Assignee') === 'Lead Assignee'
                          ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span>Lead Assignee (Dynamic)</span>
                      </div>
                      {(config.assignTo || 'Lead Assignee') === 'Lead Assignee' && (
                        <Check className="w-3.5 h-3.5 text-[#7C3AED]" />
                      )}
                    </div>

                    {/* Team Members from agentsList */}
                    {agentsList.map((agent) => {
                      const isSelected = config.assignTo === agent.name;
                      return (
                        <div
                          key={agent.id}
                          onClick={() => {
                            handleConfigChange('assignTo', agent.name);
                            setIsTaskAssignDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{agent.name}</span>
                            {agent.role && (
                              <span className="text-[10px] text-slate-400">({agent.role})</span>
                            )}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#7C3AED]" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Priority
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsTaskPriorityDropdownOpen(!isTaskPriorityDropdownOpen);
                    setIsTaskTypeDropdownOpen(false);
                    setIsTaskAssignDropdownOpen(false);
                    setIsTaskDeadlineUnitDropdownOpen(false);
                    setIsTaskDeadlineDirDropdownOpen(false);
                    setIsTaskDeadlineRefDropdownOpen(false);
                    setIsTaskDescVarOpen(false);
                  }}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3.5 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Flag className={`w-3.5 h-3.5 shrink-0 ${currentPriority.flagColor}`} />
                    <span className="font-normal text-slate-800">
                      {config.taskPriority || 'None'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${
                      isTaskPriorityDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isTaskPriorityDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 space-y-1">
                    {priorityOptions.map((p) => {
                      const isSelected = (config.taskPriority || 'None') === p.label;
                      return (
                        <div
                          key={p.label}
                          onClick={() => {
                            handleConfigChange('taskPriority', p.label);
                            setIsTaskPriorityDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Flag className={`w-3.5 h-3.5 ${p.flagColor}`} />
                            <span>{p.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#7C3AED]" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Select Deadline */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Select Deadline
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Value */}
                <div className="w-28">
                  <input
                    type="number"
                    min={1}
                    value={config.deadlineValue !== undefined ? config.deadlineValue : 15}
                    onChange={(e) => handleConfigChange('deadlineValue', parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-xs text-center text-slate-800 focus:outline-none focus:border-[#7C3AED] shadow-2xs"
                  />
                </div>

                {/* 2. Unit Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTaskDeadlineUnitDropdownOpen(!isTaskDeadlineUnitDropdownOpen);
                      setIsTaskDeadlineDirDropdownOpen(false);
                      setIsTaskDeadlineRefDropdownOpen(false);
                      setIsTaskTypeDropdownOpen(false);
                      setIsTaskAssignDropdownOpen(false);
                      setIsTaskPriorityDropdownOpen(false);
                      setIsTaskDescVarOpen(false);
                    }}
                    className="border border-slate-200 rounded-lg bg-white px-3.5 py-2 text-xs text-slate-800 flex items-center gap-1.5 cursor-pointer hover:border-slate-300 shadow-2xs"
                  >
                    <span>{config.deadlineUnit || 'Minute'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  {isTaskDeadlineUnitDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-28 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1 font-sans animate-in fade-in-50 zoom-in-95 duration-100">
                      {deadlineUnits.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => {
                            handleConfigChange('deadlineUnit', u);
                            setIsTaskDeadlineUnitDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs font-medium cursor-pointer transition-colors ${
                            (config.deadlineUnit || 'Minute') === u
                              ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Direction Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTaskDeadlineDirDropdownOpen(!isTaskDeadlineDirDropdownOpen);
                      setIsTaskDeadlineUnitDropdownOpen(false);
                      setIsTaskDeadlineRefDropdownOpen(false);
                      setIsTaskTypeDropdownOpen(false);
                      setIsTaskAssignDropdownOpen(false);
                      setIsTaskPriorityDropdownOpen(false);
                      setIsTaskDescVarOpen(false);
                    }}
                    className="border border-slate-200 rounded-lg bg-white px-3.5 py-2 text-xs text-slate-800 flex items-center gap-1.5 cursor-pointer hover:border-slate-300 shadow-2xs"
                  >
                    <span>{config.deadlineDirection || 'After'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  {isTaskDeadlineDirDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-28 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1 font-sans animate-in fade-in-50 zoom-in-95 duration-100">
                      {deadlineDirections.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            handleConfigChange('deadlineDirection', d);
                            setIsTaskDeadlineDirDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs font-medium cursor-pointer transition-colors ${
                            (config.deadlineDirection || 'After') === d
                              ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Reference Picker Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTaskDeadlineRefDropdownOpen(!isTaskDeadlineRefDropdownOpen);
                      setIsTaskDeadlineUnitDropdownOpen(false);
                      setIsTaskDeadlineDirDropdownOpen(false);
                      setIsTaskTypeDropdownOpen(false);
                      setIsTaskAssignDropdownOpen(false);
                      setIsTaskPriorityDropdownOpen(false);
                      setIsTaskDescVarOpen(false);
                    }}
                    className="border border-slate-200 rounded-lg bg-white px-3.5 py-2 text-xs text-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-300 shadow-2xs"
                  >
                    <span>{config.deadlineReference || 'Previous step'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  {isTaskDeadlineRefDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 p-2 font-sans animate-in fade-in-50 zoom-in-95 duration-100 max-h-64 overflow-y-auto custom-scrollbar">
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={taskDeadlineSearchQuery}
                          onChange={(e) => setTaskDeadlineSearchQuery(e.target.value)}
                          placeholder="Search date field..."
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:border-[#7C3AED]"
                          autoFocus
                        />
                      </div>
                      {/* Previous step default */}
                      <button
                        type="button"
                        onClick={() => {
                          handleConfigChange('deadlineReference', 'Previous step');
                          setIsTaskDeadlineRefDropdownOpen(false);
                          setTaskDeadlineSearchQuery('');
                        }}
                        className={`w-full px-2.5 py-1.5 text-left text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          (config.deadlineReference || 'Previous step') === 'Previous step'
                            ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>Previous step</span>
                        {(config.deadlineReference || 'Previous step') === 'Previous step' && (
                          <Check className="w-3.5 h-3.5 text-[#7C3AED]" />
                        )}
                      </button>

                      {/* Dynamic Date Fields from leadFieldsList */}
                      {dynamicDateFields
                        .filter((f) =>
                          f.label.toLowerCase().includes(taskDeadlineSearchQuery.toLowerCase())
                        )
                        .map((field) => (
                          <button
                            key={field.key}
                            type="button"
                            onClick={() => {
                              handleConfigChange('deadlineReference', field.label);
                              setIsTaskDeadlineRefDropdownOpen(false);
                              setTaskDeadlineSearchQuery('');
                            }}
                            className={`w-full px-2.5 py-1.5 text-left text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                              config.deadlineReference === field.label
                                ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{field.label}</span>
                            </div>
                            {config.deadlineReference === field.label && (
                              <Check className="w-3.5 h-3.5 text-[#7C3AED]" />
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Description
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTaskDescVarOpen(!isTaskDescVarOpen)}
                    className="bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7C3AED] text-xs font-medium px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>Add Variable</span>
                  </button>
                  {isTaskDescVarOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-60 overflow-y-auto custom-scrollbar">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                        Lead Fields
                      </div>
                      {leadFieldsList.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => {
                            const varTag = f.tag || `{{lead.${f.key}}}`;
                            const currentVal = config.taskNotes || '';
                            const textarea = taskDescTextareaRef.current;
                            let nextVal = currentVal + varTag;
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              nextVal =
                                currentVal.substring(0, start) + varTag + currentVal.substring(end);
                            }
                            handleConfigChange('taskNotes', nextVal);
                            setIsTaskDescVarOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-purple-50 hover:text-[#7C3AED] flex items-center justify-between cursor-pointer"
                        >
                          <span>{f.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {f.tag || `{{lead.${f.key}}}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <textarea
                ref={taskDescTextareaRef}
                rows={4}
                value={config.taskNotes || ''}
                onChange={(e) => handleConfigChange('taskNotes', e.target.value)}
                placeholder=""
                className="w-full border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:border-[#7C3AED] focus:outline-none resize-y bg-white shadow-2xs"
              />
            </div>

            {/* 6. Cancel previous followups checkbox */}
            <div
              onClick={() =>
                handleConfigChange('cancelPreviousFollowups', !config.cancelPreviousFollowups)
              }
              className="flex items-center gap-2.5 cursor-pointer select-none pt-1"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  config.cancelPreviousFollowups
                    ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-2xs'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              >
                {config.cancelPreviousFollowups && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer">
                Cancel previous followups created on the lead
              </span>
            </div>
          </div>
        );
      }

      // 13. Cancel Tasks (Redesigned per screenshot)
      case 'cancel_tasks': {
        const availableCancelTypes = [
          { id: 'call_followup_template', name: 'Call Followup Task Template' },
          { id: 'todo', name: 'Todo' }
        ];

        const selectedTypes: string[] = Array.isArray(config.selectedTaskTypes)
          ? config.selectedTaskTypes
          : (config.cancelTaskType ? [config.cancelTaskType] : []);

        const filteredOptions = availableCancelTypes.filter((t) =>
          t.name.toLowerCase().includes(cancelTaskSearchQuery.toLowerCase())
        );

        const isAllSelected =
          filteredOptions.length > 0 &&
          filteredOptions.every((opt) => selectedTypes.includes(opt.name));

        const handleToggleSelectAll = () => {
          if (isAllSelected) {
            const visibleNames = new Set(filteredOptions.map((o) => o.name));
            const updated = selectedTypes.filter((name) => !visibleNames.has(name));
            handleConfigChange('selectedTaskTypes', updated);
          } else {
            const merged = Array.from(
              new Set([...selectedTypes, ...filteredOptions.map((o) => o.name)])
            );
            handleConfigChange('selectedTaskTypes', merged);
          }
        };

        const handleToggleItem = (name: string) => {
          let updated: string[];
          if (selectedTypes.includes(name)) {
            updated = selectedTypes.filter((n) => n !== name);
          } else {
            updated = [...selectedTypes, name];
          }
          handleConfigChange('selectedTaskTypes', updated);
        };

        return (
          <div ref={cancelTaskContainerRef} className="space-y-2 font-sans">
            <div>
              <p className="text-xs text-slate-500 font-normal mb-2">
                Select the task types which you want to cancel
              </p>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCancelTaskDropdownOpen(!isCancelTaskDropdownOpen)}
                  className={`w-full border rounded-lg bg-white px-3.5 py-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors shadow-2xs ${
                    isCancelTaskDropdownOpen
                      ? 'border-[#7C3AED] ring-1 ring-[#7C3AED]/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={
                      selectedTypes.length > 0
                        ? 'font-normal text-slate-800 truncate'
                        : 'text-slate-400 font-normal'
                    }
                  >
                    {selectedTypes.length > 0 ? selectedTypes.join(', ') : 'Select Task Types'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-150 ${
                      isCancelTaskDropdownOpen ? 'rotate-180 text-[#7C3AED]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {isCancelTaskDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-3 space-y-2.5 animate-in fade-in-50 zoom-in-95 duration-100">
                    {/* Search row with Select All Checkbox */}
                    <div className="flex items-center gap-2.5">
                      <div
                        onClick={handleToggleSelectAll}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          isAllSelected
                            ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-2xs'
                            : 'border-slate-300 bg-white hover:border-slate-400'
                        }`}
                      >
                        {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={cancelTaskSearchQuery}
                          onChange={(e) => setCancelTaskSearchQuery(e.target.value)}
                          placeholder=""
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 pr-8 focus:outline-none focus:border-[#7C3AED] bg-white shadow-2xs"
                          autoFocus
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="space-y-1 pt-1 max-h-60 overflow-y-auto custom-scrollbar">
                      {filteredOptions.map((item) => {
                        const isChecked = selectedTypes.includes(item.name);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleItem(item.name)}
                            className="flex items-center gap-2.5 cursor-pointer py-1.5 px-0.5 rounded hover:bg-slate-50 transition-colors"
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                isChecked
                                  ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-2xs'
                                  : 'border-slate-300 bg-white hover:border-slate-400'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-normal text-slate-800 select-none">
                              {item.name}
                            </span>
                          </div>
                        );
                      })}

                      {filteredOptions.length === 0 && (
                        <div className="py-3 text-center text-xs text-slate-400 font-normal">
                          No task types found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // 14. Add payment (Redesigned per screenshot)
      case 'add_payment': {
        const currencyOptions = [
          { code: 'INR', symbol: '₹' },
          { code: 'USD', symbol: '$' },
          { code: 'EUR', symbol: '€' },
          { code: 'GBP', symbol: '£' },
          { code: 'AED', symbol: 'AED' }
        ];

        const currentCurrency =
          currencyOptions.find((c) => c.code === config.paymentCurrency) || currencyOptions[0];

        const paymentStatuses = ['PENDING', 'SUCCESS', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'];

        const isCustomMode = config.amountMode === 'custom';

        const hasValidAmount = isCustomMode
          ? config.paymentAmount !== undefined && Number(config.paymentAmount) > 0
          : !!config.amountVariable;

        const showAmountWarning = !hasValidAmount;

        return (
          <div ref={paymentContainerRef} className="space-y-4 font-sans">
            <p className="text-sm font-normal text-slate-600 mb-1">
              Fill in the details to create a payment action
            </p>

            {/* Validation warning banner */}
            {showAmountWarning && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-2.5 flex items-center gap-2 text-[#EF4444] text-xs font-normal">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                <span>Amount needs to be greater than 0</span>
              </div>
            )}

            {/* 1. Amount Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Amount <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleConfigChange('amountMode', isCustomMode ? 'variable' : 'custom')
                  }
                  className="text-xs font-medium text-[#7C3AED] hover:underline cursor-pointer"
                >
                  {isCustomMode ? 'Map Variable' : 'Enter Custom Value'}
                </button>
              </div>

              <div className="w-full border border-slate-200 rounded-lg bg-white p-1.5 flex items-center gap-2 shadow-2xs focus-within:border-[#7C3AED]">
                {/* Currency Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaymentCurrencyDropdownOpen(!isPaymentCurrencyDropdownOpen);
                      setIsPaymentVarDropdownOpen(false);
                      setIsPaymentStatusDropdownOpen(false);
                      setIsPaymentDescVarOpen(false);
                    }}
                    className="border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 flex items-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span>
                      {currentCurrency.symbol} {currentCurrency.code}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {isPaymentCurrencyDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-100">
                      {currencyOptions.map((c) => (
                        <div
                          key={c.code}
                          onClick={() => {
                            handleConfigChange('paymentCurrency', c.code);
                            setIsPaymentCurrencyDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            currentCurrency.code === c.code
                              ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <span>
                            {c.symbol} {c.code}
                          </span>
                          {currentCurrency.code === c.code && (
                            <Check className="w-3.5 h-3.5 text-[#7C3AED]" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount Input or Variable Selector */}
                {isCustomMode ? (
                  <input
                    type="number"
                    min={1}
                    value={config.paymentAmount || ''}
                    onChange={(e) =>
                      handleConfigChange('paymentAmount', parseFloat(e.target.value) || 0)
                    }
                    placeholder="Enter amount"
                    className="flex-1 px-2 py-1 text-xs text-slate-800 focus:outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPaymentVarDropdownOpen(!isPaymentVarDropdownOpen);
                        setIsPaymentCurrencyDropdownOpen(false);
                        setIsPaymentStatusDropdownOpen(false);
                        setIsPaymentDescVarOpen(false);
                      }}
                      className="flex items-center justify-between w-full px-2 py-1 text-xs cursor-pointer text-slate-700"
                    >
                      <span
                        className={
                          config.amountVariable
                            ? 'font-normal text-slate-800'
                            : 'text-slate-400 font-normal'
                        }
                      >
                        {config.amountVariable || ''}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {isPaymentVarDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in-50 zoom-in-95 duration-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                          Select Deal / Numeric Variable
                        </div>
                        {leadFieldsList
                          .filter(
                            (f) =>
                              f.type === 'currency' ||
                              f.type === 'number' ||
                              f.key === 'deal_value' ||
                              f.key.includes('amount') ||
                              f.key.includes('value')
                          )
                          .map((f) => {
                            const varTag = f.tag || `{{lead.${f.key}}}`;
                            const isSelected = config.amountVariable === varTag;
                            return (
                              <div
                                key={f.key}
                                onClick={() => {
                                  handleConfigChange('amountVariable', varTag);
                                  setIsPaymentVarDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                                    : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <span>{f.label}</span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {varTag}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Status Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Status
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentStatusDropdownOpen(!isPaymentStatusDropdownOpen);
                    setIsPaymentCurrencyDropdownOpen(false);
                    setIsPaymentVarDropdownOpen(false);
                    setIsPaymentDescVarOpen(false);
                  }}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3.5 py-2.5 text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs"
                >
                  <span className="font-normal text-slate-800">
                    {config.paymentStatus || 'PENDING'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${
                      isPaymentStatusDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isPaymentStatusDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-100">
                    {paymentStatuses.map((st) => {
                      const isSelected = (config.paymentStatus || 'PENDING') === st;
                      return (
                        <div
                          key={st}
                          onClick={() => {
                            handleConfigChange('paymentStatus', st);
                            setIsPaymentStatusDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <span>{st}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#7C3AED]" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Description Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Description
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaymentDescVarOpen(!isPaymentDescVarOpen);
                      setIsPaymentCurrencyDropdownOpen(false);
                      setIsPaymentVarDropdownOpen(false);
                      setIsPaymentStatusDropdownOpen(false);
                    }}
                    className="text-xs font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                  >
                    Add Variable
                  </button>
                  {isPaymentDescVarOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in-50 zoom-in-95 duration-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                        Lead Fields
                      </div>
                      {leadFieldsList.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => {
                            const varTag = f.tag || `{{lead.${f.key}}}`;
                            const currentVal = config.paymentDescription || '';
                            const textarea = paymentDescTextareaRef.current;
                            let nextVal = currentVal + varTag;
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              nextVal =
                                currentVal.substring(0, start) + varTag + currentVal.substring(end);
                            }
                            handleConfigChange('paymentDescription', nextVal);
                            setIsPaymentDescVarOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-purple-50 hover:text-[#7C3AED] flex items-center justify-between cursor-pointer"
                        >
                          <span>{f.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {f.tag || `{{lead.${f.key}}}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <textarea
                ref={paymentDescTextareaRef}
                rows={4}
                value={config.paymentDescription || ''}
                onChange={(e) => handleConfigChange('paymentDescription', e.target.value)}
                placeholder=""
                className="w-full border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:border-[#7C3AED] focus:outline-none resize-y bg-white shadow-2xs"
              />
            </div>
          </div>
        );
      }

      // 15. Add IVR Action (Redesigned per screenshots)
      case 'add_ivr_action': {
        const fieldMappings: Record<string, string> = config.fieldMappings || {};

        const handleFieldMapChange = (fieldKey: string, value: string) => {
          const updated = { ...(config.fieldMappings || {}), [fieldKey]: value };
          handleConfigChange('fieldMappings', updated);
        };

        const handleClearFieldMap = (fieldKey: string) => {
          const updated = { ...(config.fieldMappings || {}) };
          delete updated[fieldKey];
          handleConfigChange('fieldMappings', updated);
        };

        return (
          <div className="space-y-4 font-sans" ref={ivrContainerRef}>
            {/* 1. IVR Action Type Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                IVR Action Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsIvrTypeDropdownOpen(!isIvrTypeDropdownOpen);
                    setOpenIvrFieldMappingId(null);
                  }}
                  className="w-full border border-slate-200 rounded-lg bg-white px-3.5 py-2.5 text-xs flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-2xs transition-colors"
                >
                  <span className={config.ivrActionType ? 'font-medium text-slate-900' : 'text-slate-400 font-normal'}>
                    {config.ivrActionType || 'Select an IVR Action Type'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${isIvrTypeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isIvrTypeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150">
                    {IVR_ACTION_TYPES.map((type) => {
                      const isSelected = config.ivrActionType === type;
                      return (
                        <div
                          key={type}
                          onClick={() => {
                            handleConfigChange('ivrActionType', type);
                            setIsIvrTypeDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected ? 'bg-purple-50 text-[#3a2088] font-semibold' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <span>{type}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#3a2088]" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Field Mapping Table (Screenshots 1 & 2) */}
            <div className="pt-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-3 text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
                <div className="col-span-4">Field</div>
                <div className="col-span-8">Mapping</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100">
                {IVR_MAPPING_FIELDS.map((field) => {
                  const mappedValue = fieldMappings[field.key] !== undefined ? fieldMappings[field.key] : '';
                  const isPopoverOpen = openIvrFieldMappingId === field.key;

                  return (
                    <div key={field.key} className="grid grid-cols-12 gap-3 py-2 items-center">
                      {/* Field Name */}
                      <div className="col-span-4 flex items-center text-xs font-medium text-slate-800">
                        <span>{field.label}</span>
                        {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                      </div>

                      {/* Mapping Input Box */}
                      <div className="col-span-8 relative">
                        {field.isUserPicker ? (
                          // Employee Id User Picker Row
                          <div
                            onClick={() => {
                              setOpenIvrFieldMappingId(isPopoverOpen ? null : field.key);
                              setIsIvrTypeDropdownOpen(false);
                              setIvrFieldSearchQuery('');
                            }}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white flex items-center justify-between text-xs cursor-pointer hover:border-slate-300 shadow-2xs transition-colors h-[38px]"
                          >
                            <span className={mappedValue ? 'font-medium text-slate-900 truncate' : 'text-slate-400 font-normal'}>
                              {mappedValue || field.placeholder || 'Select a User'}
                            </span>
                            {mappedValue && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearFieldMap(field.key);
                                }}
                                className="text-slate-400 hover:text-red-600 p-0.5"
                                title="Clear"
                              >
                                <X className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        ) : (
                          // Standard Field Mapping Row
                          <div
                            onClick={() => {
                              setOpenIvrFieldMappingId(isPopoverOpen ? null : field.key);
                              setIsIvrTypeDropdownOpen(false);
                              setIvrFieldSearchQuery('');
                            }}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white flex items-center justify-between text-xs cursor-pointer hover:border-slate-300 shadow-2xs transition-colors h-[38px]"
                          >
                            <div className="flex items-center gap-1.5 truncate flex-1 mr-1">
                              {field.key !== 'duration' && (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              {mappedValue ? (
                                <span className="font-medium text-slate-900 truncate">
                                  {mappedValue}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">
                                  {field.placeholder || ''}
                                </span>
                              )}
                            </div>
                            {mappedValue && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearFieldMap(field.key);
                                }}
                                className="text-slate-400 hover:text-red-600 p-0.5 shrink-0"
                                title="Clear"
                              >
                                <X className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        )}

                        {/* Mapping Popover */}
                        {isPopoverOpen && (
                          <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2.5 space-y-2 text-slate-800 font-sans animate-in fade-in-50 zoom-in-95 duration-150 max-w-[340px] w-[340px]">
                            {field.isUserPicker ? (
                              // User Picker Dropdown
                              <>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={ivrFieldSearchQuery}
                                    onChange={(e) => setIvrFieldSearchQuery(e.target.value)}
                                    placeholder="Search users..."
                                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] focus:bg-white"
                                    autoFocus
                                  />
                                </div>
                                <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleFieldMapChange(field.key, '{{lead.assigned_to}}');
                                      setOpenIvrFieldMappingId(null);
                                    }}
                                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-800 hover:bg-purple-50 hover:text-[#3a2088] transition-colors cursor-pointer text-left"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-purple-100 text-[#3a2088] flex items-center justify-center text-[10px] font-bold">
                                        L
                                      </span>
                                      <span>Lead Assignee</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {'{{lead.assigned_to}}'}
                                    </span>
                                  </button>

                                  {agentsList
                                    .filter((a) =>
                                      (a.name || '').toLowerCase().includes(ivrFieldSearchQuery.toLowerCase()) ||
                                      (a.email || '').toLowerCase().includes(ivrFieldSearchQuery.toLowerCase())
                                    )
                                    .map((agent) => (
                                      <button
                                        key={agent.id}
                                        type="button"
                                        onClick={() => {
                                          handleFieldMapChange(field.key, agent.name);
                                          setOpenIvrFieldMappingId(null);
                                        }}
                                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                            {agent.name.charAt(0).toUpperCase()}
                                          </span>
                                          <span className="truncate">{agent.name}</span>
                                        </div>
                                        {agent.role && (
                                          <span className="text-[10px] text-slate-400 ml-2 shrink-0">
                                            {agent.role}
                                          </span>
                                        )}
                                      </button>
                                    ))}
                                </div>
                              </>
                            ) : (
                              // Variable Picker Dropdown
                              <>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={ivrFieldSearchQuery}
                                    onChange={(e) => setIvrFieldSearchQuery(e.target.value)}
                                    placeholder="Search variable or type value..."
                                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] focus:bg-white"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && ivrFieldSearchQuery.trim()) {
                                        handleFieldMapChange(field.key, ivrFieldSearchQuery.trim());
                                        setOpenIvrFieldMappingId(null);
                                      }
                                    }}
                                  />
                                </div>

                                {ivrFieldSearchQuery.trim() && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleFieldMapChange(field.key, ivrFieldSearchQuery.trim());
                                      setOpenIvrFieldMappingId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-md bg-purple-50 text-[#3a2088] text-xs font-medium hover:bg-purple-100 transition-colors flex items-center justify-between cursor-pointer"
                                  >
                                    <span className="truncate">Use: <strong>{ivrFieldSearchQuery.trim()}</strong></span>
                                    <span className="text-[10px] font-bold shrink-0 ml-1">↵ Enter</span>
                                  </button>
                                )}

                                <div className="max-h-52 overflow-y-auto space-y-2 custom-scrollbar">
                                  {/* Event Fields */}
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                                      Event / IVR Fields
                                    </div>
                                    {IVR_EVENT_VARIABLES
                                      .filter(
                                        (v) =>
                                          v.label.toLowerCase().includes(ivrFieldSearchQuery.toLowerCase()) ||
                                          v.tag.toLowerCase().includes(ivrFieldSearchQuery.toLowerCase())
                                      )
                                      .map((v) => (
                                        <button
                                          key={v.key}
                                          type="button"
                                          onClick={() => {
                                            handleFieldMapChange(field.key, v.tag);
                                            setOpenIvrFieldMappingId(null);
                                          }}
                                          className="w-full flex items-center justify-between px-2 py-1 rounded text-xs text-slate-700 hover:bg-purple-50 hover:text-[#3a2088] transition-colors cursor-pointer text-left"
                                        >
                                          <span className="truncate">{v.label}</span>
                                          <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">{v.tag}</span>
                                        </button>
                                      ))}
                                  </div>

                                  {/* Lead Fields */}
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                                      Lead Fields
                                    </div>
                                    {leadFieldsList
                                      .filter(
                                        (f) =>
                                          f.label.toLowerCase().includes(ivrFieldSearchQuery.toLowerCase()) ||
                                          (f.tag || '').toLowerCase().includes(ivrFieldSearchQuery.toLowerCase())
                                      )
                                      .slice(0, 8)
                                      .map((f) => (
                                        <button
                                          key={f.key}
                                          type="button"
                                          onClick={() => {
                                            handleFieldMapChange(field.key, f.tag || `{{lead.${f.key}}}`);
                                            setOpenIvrFieldMappingId(null);
                                          }}
                                          className="w-full flex items-center justify-between px-2 py-1 rounded text-xs text-slate-700 hover:bg-purple-50 hover:text-[#3a2088] transition-colors cursor-pointer text-left"
                                        >
                                          <span className="truncate">{f.label}</span>
                                          <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">
                                            {f.tag || `{{lead.${f.key}}}`}
                                          </span>
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      // Extra: Meta CAPI
      case 'capi':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meta Conversions Event Name
              </label>
              <input
                type="text"
                value={config.capiEventName || 'Lead'}
                onChange={(e) => handleConfigChange('capiEventName', e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meta Pixel ID
              </label>
              <input
                type="text"
                value={config.pixelId || ''}
                onChange={(e) => handleConfigChange('pixelId', e.target.value)}
                placeholder="849204918239"
                className="w-full text-xs font-mono px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
              />
            </div>
          </div>
        );

      // 7. Check If Lead / Check If Whatsapp Message (Reusing CRM ConditionFilterChipsBar & AddConditionModal Component)
      case 'lead_condition': {
        const conditions: DynamicCondition[] = Array.isArray(config.conditions)
          ? config.conditions
          : [];

        const conditionType = config.conditionType || data.label || 'Check If Whatsapp Message';

        const optionsContext = {
          stages: INITIAL_STAGES.map(s => s.name),
          lostReasons: ['Budget', 'Competitor', 'Not Interested', 'Timing', 'Invalid Lead', 'Other'],
          assignees: INITIAL_AGENTS.map(m => m.name),
          sources: ['Facebook', 'Instagram', 'Google Ads', 'Website', 'Referral', 'Walk-in', 'LinkedIn', 'Other'],
          customFieldOptionsMap: {}
        };

        const handleUpdateCondition = (condId: string, updates: Partial<DynamicCondition>) => {
          const updated = conditions.map(c => c.id === condId ? { ...c, ...updates } : c);
          handleConfigChange('conditions', updated);
        };

        const handleRemoveCondition = (condId: string) => {
          const updated = conditions.filter(c => c.id !== condId);
          handleConfigChange('conditions', updated);
        };

        return (
          <div className="space-y-6 font-sans">
            {/* Top Alert Banner: Select Condition (Exact match to screenshot) */}
            {conditions.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>Select Condition</span>
              </div>
            )}

            {/* Condition Type Field (Exact match to screenshot) */}
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-1.5">
                Condition Type
              </label>
              <select
                value={conditionType}
                onChange={(e) => {
                  const val = e.target.value;
                  handleConfigChange('conditionType', val);
                  onUpdateNodeData(selectedNode.id, { label: val });
                }}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-purple-500 cursor-pointer shadow-2xs transition-colors"
              >
                <option value="Check If Whatsapp Message">Check If Whatsapp Message</option>
                <option value="Check If Lead">Check If Lead</option>
                <option value="Check If Event">Check If Event</option>
                <option value="Check If Call">Check If Call</option>
                <option value="Check If Payment">Check If Payment</option>
              </select>
            </div>

            {/* Centered "[+] Add a Condition" Trigger (Exact match to screenshot) */}
            <div className="flex flex-col items-center justify-center pt-3 space-y-4">
              <button
                type="button"
                onClick={() => setIsAddConditionModalOpen(true)}
                className="inline-flex items-center gap-2 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-6 h-6 rounded-md bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-[#7C3AED] group-hover:border-purple-400 group-hover:shadow-sm transition-all shrink-0 font-bold text-sm">
                  +
                </div>
                <span className="text-xs sm:text-sm font-medium text-[#7C3AED] group-hover:text-purple-800 border-b border-dotted border-[#7C3AED] pb-0.5 transition-colors">
                  Add a Condition
                </span>
              </button>

              {/* Active Conditions Displayed Below (Reusing CRM ConditionFilterChipsBar) */}
              {conditions.length > 0 && (
                <div className="flex justify-center w-full pt-2">
                  <ConditionFilterChipsBar
                    activeConditions={conditions}
                    onUpdateCondition={handleUpdateCondition}
                    onRemoveCondition={handleRemoveCondition}
                    optionsContext={optionsContext}
                  />
                </div>
              )}
            </div>

            {/* Add Condition Modal (Reusing CRM's Condition Picker Modal) */}
            <AddConditionModal
              isOpen={isAddConditionModalOpen}
              onClose={() => setIsAddConditionModalOpen(false)}
              onSelectCondition={(newCond) => {
                const updated = [...conditions, newCond];
                handleConfigChange('conditions', updated);
              }}
              optionsContext={optionsContext}
              customFields={INITIAL_CUSTOM_FIELDS}
            />
          </div>
        );
      }

      // 8. Event Condition / If Else (Reusing CRM ConditionFilterChipsBar & AddConditionModal Component)
      case 'event_condition': {
        const conditions: DynamicCondition[] = Array.isArray(config.conditions)
          ? config.conditions
          : [];

        const conditionType = config.conditionType || data.label || 'Event Condition / If Else';

        const optionsContext = {
          stages: INITIAL_STAGES.map(s => s.name),
          lostReasons: ['Budget', 'Competitor', 'Not Interested', 'Timing', 'Invalid Lead', 'Other'],
          assignees: INITIAL_AGENTS.map(m => m.name),
          sources: ['Facebook', 'Instagram', 'Google Ads', 'Website', 'Referral', 'Walk-in', 'LinkedIn', 'Other'],
          customFieldOptionsMap: {}
        };

        const handleUpdateCondition = (condId: string, updates: Partial<DynamicCondition>) => {
          const updated = conditions.map(c => c.id === condId ? { ...c, ...updates } : c);
          handleConfigChange('conditions', updated);
        };

        const handleRemoveCondition = (condId: string) => {
          const updated = conditions.filter(c => c.id !== condId);
          handleConfigChange('conditions', updated);
        };

        return (
          <div className="space-y-6 font-sans">
            {/* Top Alert Banner: Select Condition (Exact match to screenshot) */}
            {conditions.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>Select Condition</span>
              </div>
            )}

            {/* Condition Type Field (Exact match to screenshot) */}
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-1.5">
                Condition Type
              </label>
              <select
                value={conditionType}
                onChange={(e) => {
                  const val = e.target.value;
                  handleConfigChange('conditionType', val);
                  onUpdateNodeData(selectedNode.id, { label: val });
                }}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-purple-500 cursor-pointer shadow-2xs transition-colors"
              >
                <option value="Event Condition / If Else">Event Condition / If Else</option>
                <option value="Check If Call Duration">Check If Call Duration</option>
                <option value="Check If Whatsapp Message">Check If Whatsapp Message</option>
                <option value="Check If Webhook">Check If Webhook</option>
                <option value="Check If Lead">Check If Lead</option>
                <option value="Check If Payment">Check If Payment</option>
              </select>
            </div>

            {/* Centered "[+] Add a Condition" Trigger (Exact match to screenshot) */}
            <div className="flex flex-col items-center justify-center pt-3 space-y-4">
              <button
                type="button"
                onClick={() => setIsAddConditionModalOpen(true)}
                className="inline-flex items-center gap-2 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-6 h-6 rounded-md bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-[#7C3AED] group-hover:border-purple-400 group-hover:shadow-sm transition-all shrink-0 font-bold text-sm">
                  +
                </div>
                <span className="text-xs sm:text-sm font-medium text-[#7C3AED] group-hover:text-purple-800 border-b border-dotted border-[#7C3AED] pb-0.5 transition-colors">
                  Add a Condition
                </span>
              </button>

              {/* Active Conditions Displayed Below (Reusing CRM ConditionFilterChipsBar) */}
              {conditions.length > 0 && (
                <div className="flex justify-center w-full pt-2">
                  <ConditionFilterChipsBar
                    activeConditions={conditions}
                    onUpdateCondition={handleUpdateCondition}
                    onRemoveCondition={handleRemoveCondition}
                    optionsContext={optionsContext}
                  />
                </div>
              )}
            </div>

            {/* Add Condition Modal (Reusing CRM's Condition Picker Modal) */}
            <AddConditionModal
              isOpen={isAddConditionModalOpen}
              onClose={() => setIsAddConditionModalOpen(false)}
              onSelectCondition={(newCond) => {
                const updated = [...conditions, newCond];
                handleConfigChange('conditions', updated);
              }}
              optionsContext={optionsContext}
              customFields={INITIAL_CUSTOM_FIELDS}
            />
          </div>
        );
      }

      // Default fallback for Triggers
      default:
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Trigger Event Identifier
              </label>
              <input
                type="text"
                value={config.triggerEvent || data.catalogId}
                onChange={(e) => handleConfigChange('triggerEvent', e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Event Filter Scope
              </label>
              <input
                type="text"
                value={config.eventFilter || 'all'}
                onChange={(e) => handleConfigChange('eventFilter', e.target.value)}
                placeholder="all"
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
              />
            </div>
          </div>
        );
    }
  };

  const isCustomApi = data.catalogId === 'call_api';
  const isPushNotification = data.catalogId === 'notification_team_member';
  const isUpdateAssignee = data.catalogId === 'update_lead_assignee';
  const isUpdateLeadFields = data.catalogId === 'update_lead_fields';
  const isUpdateLeadRating = data.catalogId === 'update_lead_rating';
  const isUpdateLeadStatus = data.catalogId === 'update_lead_status';
  const isTimeDelay = data.catalogId === 'time_delay';
  const isSendWhatsapp = data.catalogId === 'send_template';
  const isAddInList = data.catalogId === 'add_in_list';
  const isRemoveFromList = data.catalogId === 'remove_from_list';
  const isAddTask = data.catalogId === 'add_task';
  const isCancelTasks = data.catalogId === 'cancel_tasks';
  const isAddPayment = data.catalogId === 'add_payment';
  const isAddIvrAction = data.catalogId === 'add_ivr_action';
  const isSendList = data.catalogId === 'send_list';
  const isSendNonTemplate = data.catalogId === 'send_non_template';
  const isSendInteractive = data.catalogId === 'send_interactive';
  const isCheckIfLead = data.catalogId === 'lead_condition' || data.category === 'lead_conditions';
  const isEventCondition = data.catalogId === 'event_condition' || data.category === 'event_conditions';
  const isCleanLayout = isCustomApi || isPushNotification || isUpdateAssignee || isUpdateLeadFields || isUpdateLeadRating || isUpdateLeadStatus || isTimeDelay || isSendWhatsapp || isAddInList || isRemoveFromList || isAddTask || isCancelTasks || isAddPayment || isAddIvrAction || isSendList || isSendNonTemplate || isSendInteractive || isCheckIfLead || isEventCondition;
  const drawerTitle = isCheckIfLead
    ? (config.conditionType || data.label || 'Check If Whatsapp Message')
    : isEventCondition
    ? (config.conditionType || data.label || 'Event Condition / If Else')
    : isSendInteractive
    ? 'Send Waca Interactive To Lead'
    : isSendNonTemplate
    ? 'Send Non Template message'
    : isSendList
    ? 'Send Waca List To Lead'
    : isAddIvrAction
    ? 'Add IVR Action'
    : isAddPayment
    ? 'Add payment'
    : isCancelTasks
    ? 'Cancel Tasks'
    : isAddTask
    ? 'Add Task'
    : isRemoveFromList
    ? 'Remove from List(s)'
    : isAddInList
    ? 'Add in List(s)'
    : isSendWhatsapp
    ? 'Send Whatsapp To Lead'
    : isTimeDelay
    ? 'Set Delay'
    : isUpdateLeadStatus
    ? 'Update lead status'
    : isUpdateLeadRating
    ? 'Update lead rating'
    : isUpdateLeadFields
    ? 'Update lead fields'
    : isUpdateAssignee
    ? 'Update Lead Assignee'
    : isPushNotification
    ? 'Send Push Notification To TeamMember'
    : isCustomApi
    ? 'Custom API'
    : (data.label || 'Configure Node');

  const handleSaveAction = () => {
    // Persist configured action directly into database table 'actions'
    const teamMemberSummary = Array.isArray(config.selectedTeamMembers) && config.selectedTeamMembers.length > 0
      ? config.selectedTeamMembers.join(', ')
      : (config.teamMember || config.targetTeamMember || 'Assignee');

    saveWorkflowActionToApi({
      id: config.actionId || id,
      nodeId: id,
      actionType: data.catalogId,
      name: data.label || drawerTitle,
      teamMember: teamMemberSummary,
      targetTeamMember: config.targetTeamMember || config.teamMember || 'assignee',
      header: config.header || config.notificationTitle || config.assignmentPreference || config.fieldLabel || config.ratingOperation || config.targetStage || (isTimeDelay ? `${config.delayValue || 10} ${config.delayUnit || 'Minute'}` : '') || (isSendWhatsapp ? config.whatsappAccount || 'WhatsApp Account' : '') || (isSendList ? config.whatsappAccount || 'WhatsApp Account' : '') || (isSendNonTemplate ? config.whatsappAccount || 'WhatsApp Account' : '') || (isSendInteractive ? config.whatsappAccount || 'WhatsApp Account' : '') || (isAddInList ? config.listName || 'List' : '') || (isRemoveFromList ? config.removeListName || 'Remove List' : '') || (isAddTask ? `${config.taskType || 'Task'} (${config.taskPriority || 'None'})` : '') || (isCancelTasks ? `Cancel: ${(config.selectedTaskTypes || []).join(', ') || 'Task Types'}` : '') || (isAddPayment ? `${config.paymentCurrency || 'INR'} ${config.amountMode === 'variable' && config.amountVariable ? config.amountVariable : (config.paymentAmount || '0')}` : '') || (isAddIvrAction ? (config.ivrActionType || 'IVR Action') : ''),
      body: config.body || config.notificationMessage || config.fieldValue || config.ratingValue || config.stageName || (isTimeDelay ? `${config.delayDirection || 'After'} ${config.delayReference || 'Previous step'}` : '') || (isSendWhatsapp ? config.templateName || 'WhatsApp Template' : '') || (isSendList ? config.buttonText || 'Interactive List Menu' : '') || (isSendNonTemplate ? `${(config.messageType || 'text').toUpperCase()}: ${config.messageText?.slice(0, 30) || 'Non-template message'}` : '') || (isSendInteractive ? (config.interactiveType === 'cta' ? `${config.ctaUrlLabel || 'Website'} • ${config.ctaPhoneLabel || 'Call'}` : `${(config.buttons || []).map((b: any) => b.title).join(', ') || 'Buttons'}`) : '') || (isAddInList ? config.listCategory || 'Marketing Segment' : '') || (isRemoveFromList ? 'Remove from list segment' : '') || (isAddTask ? `${config.deadlineValue || 15} ${config.deadlineUnit || 'Minute'} ${config.deadlineDirection || 'After'} ${config.deadlineReference || 'Previous step'}` : '') || (isCancelTasks ? `${(config.selectedTaskTypes || []).length} types to cancel` : '') || (isAddPayment ? `Status: ${config.paymentStatus || 'PENDING'}${config.paymentDescription ? ` - ${config.paymentDescription}` : ''}` : '') || (isAddIvrAction ? `${Object.keys(config.fieldMappings || {}).length} fields mapped` : ''),
      url: config.url !== undefined ? config.url : '{{LEAD_LINK}}',
      config: config
    }).catch(() => {});
    onClose();
  };

  return (
    <div className={`${isCleanLayout ? 'w-[580px]' : 'w-96'} flex flex-col bg-white border-l border-slate-200/90 shadow-2xl z-20 h-full animate-in slide-in-from-right duration-200 font-sans select-none`}>
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-slate-200/90 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          {isCleanLayout ? (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs">
              <WorkflowIcon id={data.catalogId || ''} size={16} className="text-slate-800" />
            </div>
          )}
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {drawerTitle}
            </h3>
            {!isCleanLayout && (
              <span className="text-[10px] font-bold text-[#3a2088] uppercase tracking-wide">
                {data.kind} • {data.catalogId}
              </span>
            )}
          </div>
        </div>

        {!isCleanLayout && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
        {/* Node Name & Description (Hidden for clean template selection in Custom API & Push Notification) */}
        {!isCleanLayout && (
          <div className="space-y-2.5 pb-3 border-b border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Node Display Name
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 focus:border-[#3a2088] focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notes / Subtitle
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Add optional notes for team"
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:border-[#3a2088] focus:outline-none shadow-2xs"
              />
            </div>
          </div>
        )}

        {/* Dynamic Node Parameters Form */}
        <div className="space-y-3.5">
          {!isCleanLayout && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#3a2088]" />
              <span>Parameters & Config</span>
            </div>
          )}

          {renderConfigForm()}
        </div>
      </div>

      {/* Drawer Footer Actions (TeleCRM Style: Cancel & Save) */}
      <div className="p-3 border-t border-slate-200/90 bg-white flex items-center justify-between gap-2.5">
        {!isCleanLayout && onDeleteNode ? (
          <button
            type="button"
            onClick={() => onDeleteNode(id)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-[#DC2626] hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[#DC2626] hover:underline font-semibold text-xs px-2.5 py-1.5 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAction}
            className="px-5 py-2 rounded-md text-xs font-bold bg-[#3a2088] hover:bg-[#2c186b] text-white shadow-xs transition-colors cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>

      {/* Create API Template Modal (Screenshot 2) */}
      <CreateApiTemplateModal
        isOpen={isCreateTemplateModalOpen}
        onClose={() => setIsCreateTemplateModalOpen(false)}
        onSaved={handleTemplateSaved}
      />
    </div>
  );
};
