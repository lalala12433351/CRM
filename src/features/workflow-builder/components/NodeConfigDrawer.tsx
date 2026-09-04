import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Save,
  Check,
  Code,
  Zap,
  Globe,
  Send,
  UserCheck,
  UserPlus,
  Clock,
  Filter,
  Layers,
  HelpCircle
} from 'lucide-react';
import { CustomWorkflowNode, ConditionRule, HeaderKeyValue, NodeTypeKind } from '../types/workflow.types';
import { DynamicIcon } from './DynamicIcon';

interface NodeConfigDrawerProps {
  selectedNode: CustomWorkflowNode | null;
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, updatedData: Partial<CustomWorkflowNode['data']>) => void;
  onDeleteNode: (nodeId: string) => void;
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

  // Sync state whenever selectedNode changes
  useEffect(() => {
    setLabel(data.label || '');
    setDescription(data.description || '');
    setConfig(data.config || {});
    setJsonError(null);
  }, [selectedNode.id, data]);

  const handleConfigChange = (key: string, value: any) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    onUpdateNodeData(id, {
      ...data,
      label,
      description,
      config: updated
    });
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
        // Validation check
        JSON.parse(bodyStr);
      }
      setJsonError(null);
    } catch (err: any) {
      setJsonError('Warning: Invalid JSON syntax');
    }
    handleConfigChange('bodyPayload', bodyStr);
  };

  // Render specific form sections
  const renderConfigForm = () => {
    switch (data.catalogId) {
      // 1. Meta Conversions API (CAPI)
      case 'capi':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Meta Event Name
              </label>
              <select
                value={config.capiEventName || 'Lead'}
                onChange={(e) => handleConfigChange('capiEventName', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Meta Pixel ID / Dataset ID
              </label>
              <input
                type="text"
                value={config.pixelId || ''}
                onChange={(e) => handleConfigChange('pixelId', e.target.value)}
                placeholder="e.g. 849204918239"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>
        );

      // 2. Call API / Webhook
      case 'call_api':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                HTTP Method & Endpoint URL
              </label>
              <div className="flex gap-2">
                <select
                  value={config.method || 'POST'}
                  onChange={(e) => handleConfigChange('method', e.target.value)}
                  className="w-24 text-xs font-bold px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* HTTP Headers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Headers ({headers.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddHeader}
                  className="text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Header
                </button>
              </div>
              <div className="space-y-2">
                {headers.map((hdr, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={hdr.key}
                      onChange={(e) => handleUpdateHeader(idx, e.target.value, hdr.value)}
                      placeholder="Header-Name"
                      className="w-1/2 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    />
                    <input
                      type="text"
                      value={hdr.value}
                      onChange={(e) => handleUpdateHeader(idx, hdr.key, e.target.value)}
                      placeholder="Value"
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteHeader(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-purple-500" />
                  JSON Request Body
                </label>
                <span className="text-[10px] text-slate-400">Supports variables: &#123;&#123;lead.name&#125;&#125;</span>
              </div>
              <textarea
                rows={6}
                value={config.bodyPayload || ''}
                onChange={(e) => handleBodyPayloadChange(e.target.value)}
                placeholder={'{\n  "lead_id": "{{lead.id}}",\n  "phone": "{{lead.phone}}"\n}'}
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {jsonError && (
                <p className="text-[11px] text-rose-500 mt-1">{jsonError}</p>
              )}
            </div>
          </div>
        );

      // 3. WhatsApp Template
      case 'send_template':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Approved Template Name
              </label>
              <input
                type="text"
                value={config.templateName || ''}
                onChange={(e) => handleConfigChange('templateName', e.target.value)}
                placeholder="lead_welcome_brochure"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Template Language
              </label>
              <select
                value={config.templateLanguage || 'en_US'}
                onChange={(e) => handleConfigChange('templateLanguage', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="en_US">English (en_US)</option>
                <option value="en_GB">English (UK)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="es">Spanish (es)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Phone Variable
              </label>
              <input
                type="text"
                value={config.recipientPhoneVariable || '{{lead.phone}}'}
                onChange={(e) => handleConfigChange('recipientPhoneVariable', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>
        );

      // 4. Update Lead Status
      case 'update_lead_status':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Pipeline Stage
              </label>
              <select
                value={config.targetStage || 'Contacted'}
                onChange={(e) => handleConfigChange('targetStage', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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

      // 5. Update Lead Assignee
      case 'update_lead_assignee':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assignment Strategy
              </label>
              <select
                value={config.assigneeType || 'round_robin'}
                onChange={(e) => handleConfigChange('assigneeType', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="round_robin">Round Robin (Distribute Equally)</option>
                <option value="specific">Specific Agent / Telecaller</option>
              </select>
            </div>

            {config.assigneeType === 'specific' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Telecaller Agent
                </label>
                <input
                  type="text"
                  value={config.assigneeAgentName || ''}
                  onChange={(e) => handleConfigChange('assigneeAgentName', e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>
        );

      // 6. Time Delay
      case 'time_delay':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Delay Amount
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.delayValue || 15}
                  onChange={(e) => handleConfigChange('delayValue', parseInt(e.target.value) || 1)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Time Unit
                </label>
                <select
                  value={config.delayUnit || 'minutes'}
                  onChange={(e) => handleConfigChange('delayUnit', e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          </div>
        );

      // 7. Lead Condition & Event Condition (Branching)
      case 'lead_condition':
      case 'event_condition':
        const fieldOptions = data.category === 'event_conditions' ? EVENT_FIELDS : LEAD_FIELDS;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Condition Logic
              </label>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleConfigChange('logicOperator', 'AND')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded ${
                    config.logicOperator !== 'OR'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  AND (All Match)
                </button>
                <button
                  type="button"
                  onClick={() => handleConfigChange('logicOperator', 'OR')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded ${
                    config.logicOperator === 'OR'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  OR (Any Match)
                </button>
              </div>
            </div>

            {/* Condition Rules List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Rules ({rules.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              </div>

              {rules.map((rule, idx) => (
                <div
                  key={rule.id || idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Rule #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-slate-400 hover:text-rose-500 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Field Selector */}
                  <div>
                    <select
                      value={rule.field}
                      onChange={(e) => handleUpdateRule(rule.id, { field: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
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
                      className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
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
                      placeholder="Target Value..."
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // Default fallback for Triggers or generic items
      default:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trigger Event Name
              </label>
              <input
                type="text"
                value={config.triggerEvent || data.catalogId}
                onChange={(e) => handleConfigChange('triggerEvent', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Filter / Scope
              </label>
              <input
                type="text"
                value={config.eventFilter || 'all'}
                onChange={(e) => handleConfigChange('eventFilter', e.target.value)}
                placeholder="all"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-96 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-20 h-full animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300">
            <DynamicIcon name={data.iconName || 'Settings'} className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Configure Node
            </h3>
            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase tracking-wide">
              {data.kind} • {data.catalogId}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* Node Name & Description */}
        <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Node Display Name
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes / Subtext
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Add optional notes for team"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Dynamic Node Parameters Form */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Parameters & Payload</span>
          </div>

          {renderConfigForm()}
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onDeleteNode(id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Node
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          Done
        </button>
      </div>
    </div>
  );
};
