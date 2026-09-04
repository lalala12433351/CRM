import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Check,
  Code,
  SlidersHorizontal
} from 'lucide-react';
import { CustomWorkflowNode, ConditionRule, HeaderKeyValue } from '../types/workflow.types';
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

      // 2. Call API / Webhook
      case 'call_api':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                HTTP Method & Endpoint URL
              </label>
              <div className="flex gap-2">
                <select
                  value={config.method || 'POST'}
                  onChange={(e) => handleConfigChange('method', e.target.value)}
                  className="w-24 text-xs font-bold px-2.5 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 focus:border-[#3a2088] focus:outline-none cursor-pointer shadow-2xs"
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
                  className="flex-1 text-xs px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 focus:border-[#3a2088] focus:outline-none font-mono shadow-2xs"
                />
              </div>
            </div>

            {/* HTTP Headers */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Headers ({headers.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddHeader}
                  className="text-xs text-[#3a2088] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Header
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
                      className="w-1/2 text-xs px-2.5 py-1.5 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 font-mono shadow-2xs"
                    />
                    <input
                      type="text"
                      value={hdr.value}
                      onChange={(e) => handleUpdateHeader(idx, hdr.key, e.target.value)}
                      placeholder="Value"
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 font-mono shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteHeader(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 cursor-pointer"
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
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-[#3a2088]" />
                  JSON Request Body
                </label>
                <span className="text-[10px] text-slate-400 font-mono">&#123;&#123;lead.name&#125;&#125;</span>
              </div>
              <textarea
                rows={5}
                value={config.bodyPayload || ''}
                onChange={(e) => handleBodyPayloadChange(e.target.value)}
                placeholder={'{\n  "lead_id": "{{lead.id}}",\n  "phone": "{{lead.phone}}"\n}'}
                className="w-full text-xs font-mono p-2.5 rounded-md border border-slate-300/80 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-[#3a2088]"
              />
              {jsonError && (
                <p className="text-[11px] text-[#DC2626] font-semibold mt-1">{jsonError}</p>
              )}
            </div>
          </div>
        );

      // 3. WhatsApp Template
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

      // 4. Update Lead Status
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

      // 5. Update Lead Assignee
      case 'update_lead_assignee':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assignment Strategy
              </label>
              <select
                value={config.assigneeType || 'round_robin'}
                onChange={(e) => handleConfigChange('assigneeType', e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 focus:border-[#3a2088] cursor-pointer shadow-2xs"
              >
                <option value="round_robin">Round Robin (Distribute Equally)</option>
                <option value="specific">Specific Agent / Telecaller</option>
              </select>
            </div>

            {config.assigneeType === 'specific' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Telecaller Agent
                </label>
                <input
                  type="text"
                  value={config.assigneeAgentName || ''}
                  onChange={(e) => handleConfigChange('assigneeAgentName', e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-300/80 bg-slate-50 focus:bg-white text-slate-900 shadow-2xs"
                />
              </div>
            )}
          </div>
        );

      // 6. Time Delay
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

  return (
    <div className="w-96 flex flex-col bg-white border-l border-slate-200/90 shadow-2xl z-20 h-full animate-in slide-in-from-right duration-200 font-sans select-none">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-50 border border-purple-200 text-[#3a2088]">
            <DynamicIcon name={data.iconName || 'Settings'} className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Configure Node
            </h3>
            <span className="text-[10px] font-bold text-[#3a2088] uppercase tracking-wide">
              {data.kind} • {data.catalogId}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
        {/* Node Name & Description */}
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

        {/* Dynamic Node Parameters Form */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#3a2088]" />
            <span>Parameters & Config</span>
          </div>

          {renderConfigForm()}
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-3 border-t border-slate-200/90 bg-slate-50 flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => onDeleteNode(id)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold text-[#DC2626] hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex-1 flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-md text-xs font-bold bg-[#3a2088] hover:bg-[#2c186b] text-white shadow-xs transition-colors cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          Done
        </button>
      </div>
    </div>
  );
};
