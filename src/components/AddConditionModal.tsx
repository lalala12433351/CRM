import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Sliders, 
  Plus, 
  Phone, 
  Mail, 
  Building2, 
  User, 
  Layers, 
  Star, 
  IndianRupee, 
  MapPin, 
  Globe, 
  Calendar, 
  Tag, 
  AlertCircle, 
  ToggleLeft, 
  FileText,
  Clock 
} from 'lucide-react';
import { 
  DynamicCondition, 
  ConditionOperator, 
  FieldDataType, 
  DynamicOptionsContext, 
  getDynamicFieldOptions 
} from '../utils/conditionFilterEngine';
import { CustomFieldDef } from '../types';

export interface ConditionFieldItem {
  id: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  dataType: FieldDataType;
  defaultOperator: ConditionOperator;
  defaultValue?: string;
}

interface AddConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCondition: (condition: DynamicCondition) => void;
  optionsContext?: DynamicOptionsContext;
  customFields?: CustomFieldDef[];
}

export const AddConditionModal: React.FC<AddConditionModalProps> = ({
  isOpen,
  onClose,
  onSelectCondition,
  optionsContext = {},
  customFields = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const allConditionFields = useMemo<ConditionFieldItem[]>(() => {
    const fieldsList: ConditionFieldItem[] = [
      { id: 'assignee', label: 'Assignee', category: 'Fields', icon: User, dataType: 'user', defaultOperator: 'is', defaultValue: '' },
      { id: 'batch', label: 'Batch', category: 'Fields', icon: Layers, dataType: 'text', defaultOperator: 'contains', defaultValue: '' },
      { id: 'status', label: 'Lead Status', category: 'Fields', icon: Layers, dataType: 'select', defaultOperator: 'in', defaultValue: '' },
      { id: 'lostReason', label: 'Lost Reason', category: 'Fields', icon: AlertCircle, dataType: 'lost_reason', defaultOperator: 'is', defaultValue: '' },
      { id: 'rating', label: 'Lead Rating', category: 'Fields', icon: Star, dataType: 'select', defaultOperator: 'is', defaultValue: 'Hot' },
      { id: 'list', label: 'List(s)', category: 'Fields', icon: Tag, dataType: 'select', defaultOperator: 'in', defaultValue: '' },
      { id: 'createdOn', label: 'Created On', category: 'Fields', icon: Calendar, dataType: 'date', defaultOperator: 'is', defaultValue: 'Any' },
      { id: 'createdBy', label: 'Created By', category: 'Fields', icon: User, dataType: 'user', defaultOperator: 'is', defaultValue: '' },
      { id: 'phone', label: 'Phone', category: 'Fields', icon: Phone, dataType: 'phone', defaultOperator: 'begins_with', defaultValue: '+91' },
      { id: 'email', label: 'Email', category: 'Fields', icon: Mail, dataType: 'text', defaultOperator: 'is_not_empty', defaultValue: '' },
      { id: 'company', label: 'Company', category: 'Fields', icon: Building2, dataType: 'text', defaultOperator: 'contains', defaultValue: '' },
      { id: 'city', label: 'City', category: 'Fields', icon: MapPin, dataType: 'text', defaultOperator: 'contains', defaultValue: '' },
      { id: 'state', label: 'State', category: 'Fields', icon: MapPin, dataType: 'text', defaultOperator: 'contains', defaultValue: '' },
      { id: 'dealValue', label: 'Deal Value (₹)', category: 'Fields', icon: IndianRupee, dataType: 'number', defaultOperator: 'greater_than', defaultValue: '50000' },
      { id: 'call_duration_seconds', label: 'Call Duration (seconds)', category: 'Event Telemetry', icon: Clock, dataType: 'number', defaultOperator: 'greater_than', defaultValue: '30' },
      { id: 'call_disposition', label: 'Call Disposition', category: 'Event Telemetry', icon: Phone, dataType: 'text', defaultOperator: 'contains', defaultValue: 'Answered' },
      { id: 'whatsapp_message_body', label: 'WhatsApp Inbound Text', category: 'Event Telemetry', icon: FileText, dataType: 'text', defaultOperator: 'contains', defaultValue: '' },
      { id: 'payment_amount', label: 'Payment Amount (₹)', category: 'Event Telemetry', icon: IndianRupee, dataType: 'number', defaultOperator: 'greater_than', defaultValue: '1000' },
      { id: 'webhook_status_code', label: 'HTTP Status Code', category: 'Event Telemetry', icon: FileText, dataType: 'number', defaultOperator: 'equals', defaultValue: '200' }
    ];

    const addedKeys = new Set(fieldsList.map(f => f.id.toLowerCase()));

    (customFields || []).forEach(cf => {
      const key = cf.name || cf.id;
      if (addedKeys.has(key.toLowerCase())) return;
      addedKeys.add(key.toLowerCase());

      const label = cf.label || cf.name || cf.id;
      const typeLower = (cf.type || 'text').toLowerCase();

      let dataType: FieldDataType = 'text';
      let defaultOperator: ConditionOperator = 'contains';
      let icon = FileText;
      let defaultValue = '';

      if (typeLower === 'phone') {
        dataType = 'phone';
        defaultOperator = 'begins_with';
        icon = Phone;
        defaultValue = '+91';
      } else if (typeLower === 'date') {
        dataType = 'date';
        defaultOperator = 'is';
        icon = Calendar;
        defaultValue = 'Any';
      } else if (typeLower === 'number' || typeLower === 'currency') {
        dataType = 'number';
        defaultOperator = 'greater_than';
        icon = IndianRupee;
        defaultValue = '1000';
      } else if (typeLower === 'boolean') {
        dataType = 'boolean';
        defaultOperator = 'is_true';
        icon = ToggleLeft;
      } else if (typeLower === 'dropdown' || typeLower === 'select') {
        dataType = 'select';
        defaultOperator = 'in';
        icon = Layers;
      }

      fieldsList.push({
        id: key,
        label,
        category: 'Custom Fields',
        icon,
        dataType,
        defaultOperator,
        defaultValue
      });
    });

    return fieldsList;
  }, [customFields]);

  const quickConditionTriggers = useMemo(() => [
    { id: 'phone', label: '📞', fieldId: 'phone', fieldLabel: 'Phone', dataType: 'phone' as const, operator: 'is' as const, defaultValue: '' },
    { id: 'wa', label: '💬', fieldId: 'phone', fieldLabel: 'WhatsApp', dataType: 'phone' as const, operator: 'is' as const, defaultValue: '' },
    { id: 'email', label: '✉️', fieldId: 'email', fieldLabel: 'Email', dataType: 'text' as const, operator: 'is' as const, defaultValue: '' },
    { id: 'chat', label: '💭', fieldId: 'phone', fieldLabel: 'SMS', dataType: 'phone' as const, operator: 'is' as const, defaultValue: '' },
    { id: 'task', label: '🗂️', fieldId: 'task', fieldLabel: 'Task', dataType: 'text' as const, operator: 'is' as const, defaultValue: '' },
    { id: 'assignee_change', label: '☑️ Assignee Change to', fieldId: 'assignee', fieldLabel: 'Assignee', dataType: 'user' as const, operator: 'is' as const, defaultValue: '' },
    { id: 'status_change', label: 'Status Change to', fieldId: 'status', fieldLabel: 'Lead Status', dataType: 'select' as const, operator: 'in' as const, defaultValue: '' },
    { id: 'field_change', label: 'Field Change', fieldId: 'field', fieldLabel: 'Field Change', dataType: 'text' as const, operator: 'is' as const, defaultValue: '' },
    { id: 'rating_change', label: 'Rating Change to', fieldId: 'rating', fieldLabel: 'Lead Rating', dataType: 'select' as const, operator: 'is' as const, defaultValue: 'Hot' },
    { id: 'lead_lost', label: 'Lead Lost from', fieldId: 'lostReason', fieldLabel: 'Lost Reason', dataType: 'lost_reason' as const, operator: 'is' as const, defaultValue: '' },
    { id: 'lead_won', label: 'Lead Won from', fieldId: 'status', fieldLabel: 'Lead Won', dataType: 'select' as const, operator: 'in' as const, defaultValue: 'Won' },
    { id: 'lead_merged', label: 'Lead Merged', fieldId: 'merged', fieldLabel: 'Lead Merged', dataType: 'boolean' as const, operator: 'is_true' as const, defaultValue: '' },
    { id: 'last_wa', label: 'Last Whatsapp Sent', fieldId: 'lastWhatsapp', fieldLabel: 'Last Whatsapp', dataType: 'date' as const, operator: 'is' as const, defaultValue: 'Today' },
    { id: 'custom_api', label: '🎧 Custom API', fieldId: 'custom_api', fieldLabel: 'Custom API', dataType: 'text' as const, operator: 'is' as const, defaultValue: '' },
    { id: 'recaptured', label: 'Is Recaptured Lead', fieldId: 'recaptured', fieldLabel: 'Recaptured', dataType: 'boolean' as const, operator: 'is_true' as const, defaultValue: '' },
    { id: 'action_perf', label: 'Action Performed', fieldId: 'action', fieldLabel: 'Action', dataType: 'text' as const, operator: 'is' as const, defaultValue: '' },
    { id: 'fb', label: 'FB', fieldId: 'source', fieldLabel: 'Facebook', dataType: 'select' as const, operator: 'in' as const, defaultValue: 'Facebook' },
    { id: 'web', label: 'Web', fieldId: 'source', fieldLabel: 'Website', dataType: 'select' as const, operator: 'in' as const, defaultValue: 'Website' },
    { id: 'deal_val', label: '₹', fieldId: 'dealValue', fieldLabel: 'Deal Value', dataType: 'number' as const, operator: 'greater_than' as const, defaultValue: '50000' },
    { id: 'call_dur', label: '⏱️ Call Duration > 30s', fieldId: 'call_duration_seconds', fieldLabel: 'Call Duration (seconds)', dataType: 'number' as const, operator: 'greater_than' as const, defaultValue: '30' },
    { id: 'webhook_trig', label: '⚡ Webhook 200', fieldId: 'webhook_status_code', fieldLabel: 'HTTP Status Code', dataType: 'number' as const, operator: 'equals' as const, defaultValue: '200' }
  ], []);

  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return allConditionFields;
    const q = searchQuery.toLowerCase();
    return allConditionFields.filter(f => 
      f.label.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    );
  }, [allConditionFields, searchQuery]);

  if (!isOpen) return null;

  const handleSelectField = (field: ConditionFieldItem) => {
    const dynamicOpts = getDynamicFieldOptions(field.id, field.dataType, optionsContext);
    const newCond: DynamicCondition = {
      id: `cond_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fieldId: field.id,
      fieldLabel: field.label,
      dataType: field.dataType,
      operator: field.defaultOperator,
      value: field.defaultValue || (dynamicOpts.length > 0 ? dynamicOpts[0] : (field.dataType === 'date' ? 'Any' : '')),
      iconType: field.id
    };
    onSelectCondition(newCond);
    setSearchQuery('');
    onClose();
  };

  const handleSelectTrigger = (trig: typeof quickConditionTriggers[0]) => {
    const dynamicOpts = getDynamicFieldOptions(trig.fieldId, trig.dataType, optionsContext);
    const newCond: DynamicCondition = {
      id: `cond_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fieldId: trig.fieldId,
      fieldLabel: trig.fieldLabel,
      dataType: trig.dataType,
      operator: trig.operator,
      value: trig.defaultValue || (dynamicOpts.length > 0 ? dynamicOpts[0] : (trig.dataType === 'date' ? 'Any' : '')),
      iconType: trig.id
    };
    onSelectCondition(newCond);
    setSearchQuery('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex justify-end z-[99999] animate-in fade-in duration-200 font-sans"
      onClick={() => {
        setSearchQuery('');
        onClose();
      }}
    >
      <div 
        className="bg-white w-full max-w-[540px] h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Bar: [<-] [ Add a new condition ] [ 🔍 ] */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50/70">
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-[#50289B] focus-within:ring-2 focus-within:ring-purple-100 transition-all shadow-2xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Add a new condition"
              autoFocus
              className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div className="w-8 h-8 rounded-xl bg-[#50289B] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Search className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Quick Trigger Chips Horizontal Strip */}
        <div className="px-3.5 py-2.5 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
          {quickConditionTriggers.map((trig) => (
            <button
              key={trig.id}
              type="button"
              onClick={() => handleSelectTrigger(trig)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
            >
              <span>{trig.label}</span>
            </button>
          ))}
        </div>

        {/* Fields Section Header */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#50289B]" />
            <span>Fields</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400">
            {filteredFields.length} available
          </span>
        </div>

        {/* Scrollable Fields List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 custom-scrollbar">
          {filteredFields.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching condition fields found.
            </div>
          ) : (
            filteredFields.map((fld) => {
              const Icon = fld.icon;
              return (
                <button
                  key={fld.id}
                  type="button"
                  onClick={() => handleSelectField(fld)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-purple-50/80 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-purple-100 flex items-center justify-center text-slate-600 group-hover:text-[#50289B] transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-[#50289B]">
                        {fld.label}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {fld.category}
                      </div>
                    </div>
                  </div>

                  <div className="text-[#50289B] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Select any field to add condition
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
