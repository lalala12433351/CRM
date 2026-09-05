import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  Plus,
  Code,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Search,
  UserPlus
} from 'lucide-react';
import { CustomWorkflowNode, ConditionRule, HeaderKeyValue } from '../types/workflow.types';
import { StoredApiTemplate, getApiTemplates, fetchApiTemplatesFromApi } from '../../../utils/templateStorage';
import { saveWorkflowActionToApi } from '../../../utils/actionStorage';
import { fetchWithTenantAuth } from '../../../lib/auth';
import { INITIAL_AGENTS, INITIAL_CUSTOM_FIELDS } from '../../../constants/initialState';
import { CreateApiTemplateModal } from './CreateApiTemplateModal';
import { DynamicIcon } from './DynamicIcon';
import { WorkflowIcon } from './WorkflowIcons';

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
}

const DEFAULT_LEAD_FIELD_OPTIONS: LeadFieldOption[] = [
  { key: 'name', label: 'Lead Name', tag: '{{lead.name}}' },
  { key: 'phone', label: 'Lead Phone', tag: '{{lead.phone}}' },
  { key: 'email', label: 'Lead Email', tag: '{{lead.email}}' },
  { key: 'status', label: 'Lead Status', tag: '{{lead.status}}' },
  { key: 'deal_value', label: 'Deal Value', tag: '{{lead.deal_value}}' },
  { key: 'source', label: 'Lead Source', tag: '{{lead.source}}' },
  { key: 'company', label: 'Company', tag: '{{lead.company}}' },
  { key: 'city', label: 'City', tag: '{{lead.city}}' },
  { key: 'state', label: 'State', tag: '{{lead.state}}' },
  { key: 'address', label: 'Address', tag: '{{lead.address}}' },
  { key: 'notes', label: 'Special Remarks / Notes', tag: '{{lead.notes}}' },
  { key: 'lead_link', label: 'Lead Link (URL)', tag: '{{LEAD_LINK}}' }
];

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

  // Initial load of agents, lead fields & templates
  useEffect(() => {
    fetchWithTenantAuth('/api/agents')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.agents) && res.agents.length > 0) {
          setAgentsList(
            res.agents.map((a: any) => ({
              id: a.id || a.name,
              name: a.name,
              role: a.role,
              email: a.email
            }))
          );
        }
      })
      .catch(() => {});

    fetchWithTenantAuth('/api/field-settings')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.fields) && res.fields.length > 0) {
          const dynamicFields: LeadFieldOption[] = res.fields.map((f: any) => ({
            key: f.name || f.id,
            label: f.label || f.name,
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
              merged.push(item);
            }
          });
          setLeadFieldsList(merged);
        }
      })
      .catch(() => {});

    fetchApiTemplatesFromApi()
      .then((fresh) => {
        if (Array.isArray(fresh)) {
          setApiTemplatesList(fresh);
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
      case 'update_lead_fields':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Lead Field to Update
              </label>
              <select
                value={config.fieldName || 'company'}
                onChange={(e) => handleConfigChange('fieldName', e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 cursor-pointer shadow-2xs"
              >
                {LEAD_FIELDS.map((fld) => (
                  <option key={fld.value} value={fld.value}>
                    {fld.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Field Update Mode
              </label>
              <select
                value={config.fieldUpdateMode || 'set'}
                onChange={(e) => handleConfigChange('fieldUpdateMode', e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 cursor-pointer shadow-2xs"
              >
                <option value="set">Set New Value</option>
                <option value="append">Append to Existing</option>
                <option value="clear">Clear Field Value</option>
              </select>
            </div>

            {config.fieldUpdateMode !== 'clear' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Field Value
                </label>
                <input
                  type="text"
                  value={config.fieldValue || ''}
                  onChange={(e) => handleConfigChange('fieldValue', e.target.value)}
                  placeholder="e.g. Acme Enterprise"
                  className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
                />
              </div>
            )}
          </div>
        );

      // 6. Update Lead Rating
      case 'update_lead_rating':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lead Qualification Rating
              </label>
              <select
                value={config.targetRating || 'Hot'}
                onChange={(e) => handleConfigChange('targetRating', e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 cursor-pointer shadow-2xs"
              >
                <option value="Hot">🔥 Hot (High Intent)</option>
                <option value="Warm">⚡ Warm (Engaged)</option>
                <option value="Cold">❄️ Cold (Nurture)</option>
                <option value="Not Qualified">🚫 Not Qualified / Junk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Qualification Score (0 - 100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={config.ratingScore || 90}
                onChange={(e) => handleConfigChange('ratingScore', parseInt(e.target.value) || 0)}
                className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
              />
            </div>
          </div>
        );

      // 7. Update Lead Status
      case 'update_lead_status':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Pipeline Stage
              </label>
              <select
                value={config.targetStage || 'Contacted'}
                onChange={(e) => handleConfigChange('targetStage', e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 focus:border-[#3a2088] cursor-pointer shadow-2xs"
              >
                {CRM_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      // 8. Time Delay
      case 'time_delay':
        return (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delay Amount
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.delayValue || 15}
                  onChange={(e) => handleConfigChange('delayValue', parseInt(e.target.value) || 1)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Time Unit
                </label>
                <select
                  value={config.delayUnit || 'minutes'}
                  onChange={(e) => handleConfigChange('delayUnit', e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 cursor-pointer shadow-2xs"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          </div>
        );

      // 9. Send Template (WhatsApp / SMS)
      case 'send_template':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Approved Template Name
              </label>
              <input
                type="text"
                value={config.templateName || ''}
                onChange={(e) => handleConfigChange('templateName', e.target.value)}
                placeholder="lead_welcome_brochure"
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 font-mono shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Template Language
              </label>
              <select
                value={config.templateLanguage || 'en_US'}
                onChange={(e) => handleConfigChange('templateLanguage', e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 focus:border-[#3a2088] cursor-pointer shadow-2xs"
              >
                <option value="en_US">English (en_US)</option>
                <option value="en_GB">English (UK)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="es">Spanish (es)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recipient Phone Variable
              </label>
              <input
                type="text"
                value={config.recipientPhoneVariable || '{{lead.phone}}'}
                onChange={(e) => handleConfigChange('recipientPhoneVariable', e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 font-mono shadow-2xs"
              />
            </div>
          </div>
        );

      // 10. Add in List
      case 'add_in_list':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target List / Segment Name
              </label>
              <input
                type="text"
                value={config.listName || ''}
                onChange={(e) => handleConfigChange('listName', e.target.value)}
                placeholder="e.g. High Intent Buyers List"
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                List Category
              </label>
              <select
                value={config.listCategory || 'Marketing'}
                onChange={(e) => handleConfigChange('listCategory', e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 cursor-pointer shadow-2xs"
              >
                <option value="Marketing">Marketing Campaign Audience</option>
                <option value="Sales">Sales Priority Outreach</option>
                <option value="VIP">VIP / Enterprise Segment</option>
                <option value="Event">Webinar / Event Attendees</option>
              </select>
            </div>
          </div>
        );

      // 11. Remove from List
      case 'remove_from_list':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select List to Remove Lead From
              </label>
              <input
                type="text"
                value={config.removeListName || ''}
                onChange={(e) => handleConfigChange('removeListName', e.target.value)}
                placeholder="e.g. Cold Outreach Segment"
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
              />
            </div>
          </div>
        );

      // 12. Add Task
      case 'add_task':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={config.taskTitle || ''}
                onChange={(e) => handleConfigChange('taskTitle', e.target.value)}
                placeholder="Call lead for product demo"
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Due In (Hours)
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.taskDueInHours || 24}
                  onChange={(e) => handleConfigChange('taskDueInHours', parseInt(e.target.value) || 24)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Task Priority
                </label>
                <select
                  value={config.taskPriority || 'High'}
                  onChange={(e) => handleConfigChange('taskPriority', e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 cursor-pointer shadow-2xs"
                >
                  <option value="High">🔴 High Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="Low">🟢 Low Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Task Description / Agenda
              </label>
              <textarea
                rows={3}
                value={config.taskNotes || ''}
                onChange={(e) => handleConfigChange('taskNotes', e.target.value)}
                placeholder="Verify customer budget and send proposal."
                className="w-full text-xs font-medium p-2.5 rounded-md border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        );

      // 13. Cancel Tasks
      case 'cancel_tasks':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cancel Task Scope
              </label>
              <select
                value={config.cancelScope || 'all'}
                onChange={(e) => handleConfigChange('cancelScope', e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 cursor-pointer shadow-2xs"
              >
                <option value="all">All Open / Pending Tasks</option>
                <option value="overdue">Overdue Tasks Only</option>
                <option value="specific">Tasks matching specific title</option>
              </select>
            </div>

            {config.cancelScope === 'specific' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Task Title Filter
                </label>
                <input
                  type="text"
                  value={config.cancelTaskType || ''}
                  onChange={(e) => handleConfigChange('cancelTaskType', e.target.value)}
                  placeholder="e.g. Follow up call"
                  className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
                />
              </div>
            )}
          </div>
        );

      // 14. Add payment
      case 'add_payment':
        return (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={config.paymentAmount || 5000}
                  onChange={(e) => handleConfigChange('paymentAmount', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Currency
                </label>
                <select
                  value={config.paymentCurrency || 'INR'}
                  onChange={(e) => handleConfigChange('paymentCurrency', e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 cursor-pointer shadow-2xs"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={config.paymentStatus || 'Completed'}
                  onChange={(e) => handleConfigChange('paymentStatus', e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 cursor-pointer shadow-2xs"
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={config.paymentMode || 'UPI'}
                  onChange={(e) => handleConfigChange('paymentMode', e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 cursor-pointer shadow-2xs"
                >
                  <option value="UPI">UPI / QR</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Credit Card">Credit / Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Invoice / Reference #
              </label>
              <input
                type="text"
                value={config.invoiceNumber || ''}
                onChange={(e) => handleConfigChange('invoiceNumber', e.target.value)}
                placeholder="INV-2026-001"
                className="w-full text-xs font-mono px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
              />
            </div>
          </div>
        );

      // 15. Add IVR Action
      case 'add_ivr_action':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                IVR Campaign / Flow Name
              </label>
              <input
                type="text"
                value={config.ivrCampaignName || ''}
                onChange={(e) => handleConfigChange('ivrCampaignName', e.target.value)}
                placeholder="Auto-Qualification IVR Flow"
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Voice Bot Prompt / IVR Script
              </label>
              <textarea
                rows={3}
                value={config.ivrVoiceBotScript || ''}
                onChange={(e) => handleConfigChange('ivrVoiceBotScript', e.target.value)}
                placeholder="Welcome to Enterprise CRM. Press 1 for Sales, 2 for Support."
                className="w-full text-xs font-medium p-2.5 rounded-md border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Max Retries
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={config.ivrMaxRetries || 3}
                  onChange={(e) => handleConfigChange('ivrMaxRetries', parseInt(e.target.value) || 1)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ring Timeout (Seconds)
                </label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={config.ivrRingTimeout || 30}
                  onChange={(e) => handleConfigChange('ivrRingTimeout', parseInt(e.target.value) || 30)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
                />
              </div>
            </div>
          </div>
        );

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

      // 7. Lead Condition & Event Condition (Branching)
      case 'lead_condition':
      case 'event_condition':
        const fieldOptions = data.category === 'event_conditions' ? EVENT_FIELDS : LEAD_FIELDS;
        return (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Condition Logic
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
                <button
                  type="button"
                  onClick={() => handleConfigChange('logicOperator', 'AND')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded cursor-pointer transition-all ${
                    config.logicOperator !== 'OR'
                      ? 'bg-[#3a2088] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  AND
                </button>
                <button
                  type="button"
                  onClick={() => handleConfigChange('logicOperator', 'OR')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded cursor-pointer transition-all ${
                    config.logicOperator === 'OR'
                      ? 'bg-[#3a2088] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  OR
                </button>
              </div>
            </div>

            {/* Condition Rules List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  Rules ({rules.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="text-xs text-[#3a2088] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              </div>

              {rules.map((rule, idx) => (
                <div
                  key={rule.id || idx}
                  className="p-3 bg-slate-50 rounded-md border border-slate-200/90 space-y-2 relative shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Rule #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-slate-400 hover:text-[#DC2626] p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Field Selector */}
                  <div>
                    <select
                      value={rule.field}
                      onChange={(e) => handleUpdateRule(rule.id, { field: e.target.value })}
                      className="w-full text-xs font-medium px-2.5 py-1.5 rounded-md border border-slate-300/80 bg-white text-slate-900 cursor-pointer shadow-2xs"
                    >
                      {fieldOptions.map((fld) => (
                        <option key={fld.value} value={fld.value}>
                          {fld.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator & Value */}
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={rule.operator}
                      onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value as any })}
                      className="text-xs px-2 py-1.5 rounded-md border border-slate-300/80 bg-white text-slate-900 cursor-pointer shadow-2xs"
                    >
                      {OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                      placeholder="Value..."
                      className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300/80 bg-white text-slate-900 font-mono shadow-2xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

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
  const isCleanLayout = isCustomApi || isPushNotification || isUpdateAssignee;
  const drawerTitle = isUpdateAssignee
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
      header: config.header || config.notificationTitle || config.assignmentPreference || '',
      body: config.body || config.notificationMessage || '',
      url: config.url !== undefined ? config.url : '{{LEAD_LINK}}',
      config: config
    }).catch(() => {});
    onClose();
  };

  return (
    <div className="w-96 flex flex-col bg-white border-l border-slate-200/90 shadow-2xl z-20 h-full animate-in slide-in-from-right duration-200 font-sans select-none">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs">
            <WorkflowIcon id={data.catalogId || ''} size={16} className="text-slate-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {drawerTitle}
            </h3>
            <span className="text-[10px] font-bold text-[#3a2088] uppercase tracking-wide">
              {data.kind} • {data.catalogId}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
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
        <button
          type="button"
          onClick={() => onDeleteNode(id)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-[#DC2626] hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

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
