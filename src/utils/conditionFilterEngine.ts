import React from 'react';
import { Lead, Agent, CustomFieldDef } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// DATA TYPES FOR DYNAMIC CONDITIONS (Matching Strict User Specifications)
// ─────────────────────────────────────────────────────────────────────────────

export type FieldDataType = 
  | 'text'          // String / Text / Email
  | 'number'        // Number / Currency / Numeric
  | 'phone'         // Phone
  | 'date'          // Date / Time
  | 'boolean'       // Boolean / Flag
  | 'select'        // Categorical / Multi-select / Enum / Stage
  | 'lost_reason'   // Lead Lost Reason (shows datas entered in stage lost reasons)
  | 'user';         // Created By / Assignee

export type ConditionOperator =
  // String / Text
  | 'equals'
  | 'not_equals'
  | 'begins_with'
  | 'not_begins_with'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty'
  // Number / Currency / Numeric
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  // Date / Time & Lost Reason & User
  | 'is'
  | 'is_not'
  // Boolean / Flag
  | 'is_true'
  | 'is_false'
  // Categorical / Multi-select / Enum
  | 'in';

export interface OperatorDefinition {
  id: ConditionOperator;
  label: string;
  isUnary?: boolean; // When true, value input is automatically hidden
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DATA TYPE TO OPERATOR MAPPING TABLE (Centralized Lookup Table)
// ─────────────────────────────────────────────────────────────────────────────

export const DATA_TYPE_OPERATOR_MAPPING: Record<FieldDataType, OperatorDefinition[]> = {
  // String / Text / Email
  text: [
    { id: 'equals', label: 'Equal To' },
    { id: 'not_equals', label: 'Not Equal To' },
    { id: 'begins_with', label: 'Begins With' },
    { id: 'not_begins_with', label: 'Not Begins With' },
    { id: 'contains', label: 'Contains' },
    { id: 'not_contains', label: 'Not Contains' },
    { id: 'is_empty', label: 'Is Empty', isUnary: true },
    { id: 'is_not_empty', label: 'Is Not Empty', isUnary: true }
  ],
  // Number / Currency / Numeric
  number: [
    { id: 'equals', label: 'Equal To' },
    { id: 'not_equals', label: 'Not Equal To' },
    { id: 'greater_than', label: 'Greater Than' },
    { id: 'less_than', label: 'Less Than' },
    { id: 'greater_than_or_equal', label: 'Greater Than or Equal To' },
    { id: 'less_than_or_equal', label: 'Less Than or Equal To' },
    { id: 'is_empty', label: 'Is Empty', isUnary: true },
    { id: 'is_not_empty', label: 'Is Not Empty', isUnary: true }
  ],
  // Phone
  phone: [
    { id: 'equals', label: 'Equal To' },
    { id: 'begins_with', label: 'Begins With' },
    { id: 'not_begins_with', label: 'Not Begins With' },
    { id: 'is_empty', label: 'Is Empty', isUnary: true },
    { id: 'is_not_empty', label: 'Is Not Empty', isUnary: true }
  ],
  // Date / Time
  date: [
    { id: 'is', label: 'Is' },
    { id: 'is_not', label: 'Is Not' },
    { id: 'is_empty', label: 'Is Empty', isUnary: true },
    { id: 'is_not_empty', label: 'Is Not Empty', isUnary: true }
  ],
  // Boolean / Flag
  boolean: [
    { id: 'is_true', label: 'Is True', isUnary: true },
    { id: 'is_false', label: 'Is False', isUnary: true },
    { id: 'is_empty', label: 'Is Empty', isUnary: true },
    { id: 'is_not_empty', label: 'Is Not Empty', isUnary: true }
  ],
  // Categorical / Multi-select / Enum / Stage
  select: [
    { id: 'in', label: 'In' },
    { id: 'is_not', label: 'Is not' },
    { id: 'is_empty', label: 'Is Empty', isUnary: true },
    { id: 'is_not_empty', label: 'Is Not Empty', isUnary: true }
  ],
  // Lead Lost Reason (shows datas entered in stage lost reasons)
  lost_reason: [
    { id: 'is', label: 'Is' },
    { id: 'is_not', label: 'Is Not' },
    { id: 'is_empty', label: 'Is Empty', isUnary: true },
    { id: 'is_not_empty', label: 'Is Not Empty', isUnary: true }
  ],
  // Created By / Assignee
  user: [
    { id: 'is', label: 'Is' },
    { id: 'is_not', label: 'Is Not' },
    { id: 'is_empty', label: 'Is Empty', isUnary: true },
    { id: 'is_not_empty', label: 'Is Not Empty', isUnary: true }
  ]
};

export interface DynamicCondition {
  id: string;
  fieldId: string;
  fieldLabel: string;
  dataType: FieldDataType;
  operator: ConditionOperator;
  value: string;
  iconType: string;
}

export interface ConditionFieldDef {
  id: string;
  label: string;
  icon: React.ElementType;
  dataType: FieldDataType;
  category: string;
  options?: string[];
  defaultOperator: ConditionOperator;
  defaultValue?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERATOR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const getOperatorLabel = (op: ConditionOperator): string => {
  switch (op) {
    case 'equals': return 'Equal To';
    case 'not_equals': return 'Not Equal To';
    case 'begins_with': return 'Begins With';
    case 'not_begins_with': return 'Not Begins With';
    case 'contains': return 'Contains';
    case 'not_contains': return 'Not Contains';
    case 'greater_than': return 'Greater Than';
    case 'less_than': return 'Less Than';
    case 'greater_than_or_equal': return 'Greater Than or Equal To';
    case 'less_than_or_equal': return 'Less Than or Equal To';
    case 'is': return 'Is';
    case 'is_not': return 'Is Not';
    case 'is_true': return 'Is True';
    case 'is_false': return 'Is False';
    case 'is_empty': return 'Is Empty';
    case 'is_not_empty': return 'Is Not Empty';
    case 'in': return 'In';
    default: return op;
  }
};

export const isUnaryOperator = (op: ConditionOperator): boolean => {
  return ['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(op);
};

export const getAvailableOperatorsForDataType = (dataType: FieldDataType): OperatorDefinition[] => {
  return DATA_TYPE_OPERATOR_MAPPING[dataType] || DATA_TYPE_OPERATOR_MAPPING.text;
};

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC OPTIONS RESOLUTION FOR FIELD STAGES
// ─────────────────────────────────────────────────────────────────────────────

export interface DynamicOptionsContext {
  leads?: Lead[];
  agents?: Agent[];
  stages?: { id: string; name: string }[];
  lostReasons?: string[];
  customFields?: CustomFieldDef[];
}

export const getDynamicFieldOptions = (
  fieldId: string,
  dataType: FieldDataType,
  context: DynamicOptionsContext
): string[] => {
  const { leads = [], agents = [], stages = [], lostReasons = [], customFields = [] } = context;
  const keyLower = fieldId.toLowerCase();

  // 1. Lost reason options from user stage configuration
  if (keyLower === 'lostreason' || keyLower === 'lost_reason' || dataType === 'lost_reason') {
    const optionsSet = new Set<string>();
    (lostReasons || []).forEach(r => {
      if (r && r.trim()) optionsSet.add(r.trim());
    });
    leads.forEach(l => {
      if (l.lostReason && l.lostReason.trim()) {
        optionsSet.add(l.lostReason.trim());
      }
    });
    if (optionsSet.size === 0) {
      ['No Need', 'Unable to Connect', 'Budget Issues', 'Product does not fit need', 'Lost to competitor', 'Unknown Reason', 'Not eligible', 'Junk'].forEach(r => optionsSet.add(r));
    }
    return Array.from(optionsSet);
  }

  // 2. Stage / Status options from user field stages
  if (keyLower === 'status' || keyLower === 'f-status' || keyLower === 'stage' || keyLower.includes('status') || keyLower.includes('stage')) {
    const optionsSet = new Set<string>();
    if (stages && stages.length > 0) {
      stages.forEach(s => {
        if (s.name && s.name.trim()) optionsSet.add(s.name.trim());
      });
    }
    // Also check customField options if defined on status field
    const statusCf = (customFields || []).find(c => c.id === 'f-status' || c.name === 'status');
    if (statusCf && statusCf.options) {
      statusCf.options.forEach(opt => optionsSet.add(opt));
    }
    leads.forEach(l => {
      if (l.status && l.status.trim()) optionsSet.add(l.status.trim());
    });
    if (optionsSet.size === 0) {
      ['Fresh', 'Follow Up', 'Interested', 'Call Back', 'Busy', 'Wrong Number', 'Not Interested', 'Deal Closed', 'Lost'].forEach(st => optionsSet.add(st));
    }
    return Array.from(optionsSet);
  }

  // 3. User / Assignee options
  if (keyLower === 'assignee' || keyLower === 'createdby' || keyLower === 'f-assignee' || dataType === 'user') {
    const optionsSet = new Set<string>();
    agents.forEach(a => {
      if (a.name && a.name.trim()) optionsSet.add(a.name.trim());
    });
    leads.forEach(l => {
      if (l.ownerAgentName && l.ownerAgentName.trim()) optionsSet.add(l.ownerAgentName.trim());
    });
    return Array.from(optionsSet);
  }

  // 4. Source options
  if (keyLower === 'source' || keyLower === 'f-source' || keyLower.includes('source')) {
    const optionsSet = new Set<string>();
    const sourceCf = (customFields || []).find(c => c.id === 'f-source' || c.name === 'source');
    if (sourceCf && sourceCf.options) {
      sourceCf.options.forEach(opt => optionsSet.add(opt));
    } else {
      ['Facebook Ads', 'Google Ads', 'Meta Ads', 'Website Inbound', 'WhatsApp', 'Instagram', 'Referral', 'Direct', 'IndiaMart', 'JustDial'].forEach(s => optionsSet.add(s));
    }
    leads.forEach(l => {
      if (l.source && l.source.trim()) optionsSet.add(l.source.trim());
    });
    return Array.from(optionsSet);
  }

  // 5. Custom Field options defined on the field
  const cf = (customFields || []).find(c => c.id === fieldId || c.name === fieldId);
  if (cf && cf.options && cf.options.length > 0) {
    return cf.options;
  }

  // 6. Generic categorical field options extraction from leads
  if (dataType === 'select') {
    const distinctVals = new Set<string>();
    leads.forEach(l => {
      const val = l.customFields?.[fieldId] ?? (l as any)[fieldId];
      if (val !== undefined && val !== null && String(val).trim()) {
        distinctVals.add(String(val).trim());
      }
    });
    return Array.from(distinctVals);
  }

  return [];
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. REAL-TIME FILTER EVALUATION LOGIC
// ─────────────────────────────────────────────────────────────────────────────

export const evaluateLeadAgainstConditions = (
  lead: Lead,
  conditions: DynamicCondition[],
  context: {
    agents?: Agent[];
    leadRatings?: Record<string, number>;
  }
): boolean => {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every(cond => {
    let rawVal: any = undefined;
    const key = cond.fieldId;
    const keyLower = key.toLowerCase();

    // Comprehensive field value resolver supporting standard & custom field stages
    if (key === 'name' || key === 'f-h1') {
      rawVal = lead.name;
    } else if (key === 'phone' || key === 'f-h2' || key === 'number' || keyLower.includes('phone')) {
      rawVal = lead.phone || lead.altPhone;
    } else if (key === 'email' || key === 'f-email' || keyLower.includes('email')) {
      rawVal = lead.email;
    } else if (key === 'company' || key === 'f-company' || keyLower.includes('company')) {
      rawVal = lead.company;
    } else if (key === 'city' || key === 'f-city') {
      rawVal = lead.city;
    } else if (key === 'state' || key === 'f-state') {
      rawVal = lead.state;
    } else if (key === 'status' || key === 'f-status' || keyLower.includes('status') || keyLower.includes('stage')) {
      rawVal = lead.status;
    } else if (key === 'rating' || key === 'f-rating' || keyLower.includes('rating')) {
      rawVal = context.leadRatings?.[lead.id] ?? lead.rating ?? lead.aiRating ?? '';
    } else if (key === 'dealValue' || key === 'deal_value' || key === 'f-deal-val' || keyLower.includes('deal')) {
      rawVal = lead.dealValue ?? (lead as any).deal_value ?? lead.customFields?.deal_value ?? lead.customFields?.dealValue ?? 0;
    } else if (key === 'source' || key === 'f-source' || keyLower.includes('source')) {
      rawVal = lead.source;
    } else if (key === 'assignee' || key === 'owner' || key === 'f-assignee' || keyLower.includes('assignee')) {
      rawVal = lead.ownerAgentName || context.agents?.find(a => a.id === lead.ownerAgentId)?.name || '';
    } else if (key === 'createdBy' || keyLower.includes('created by')) {
      rawVal = lead.ownerAgentName || context.agents?.find(a => a.id === lead.ownerAgentId)?.name || '';
    } else if (key === 'lostReason' || key === 'lost_reason' || keyLower.includes('lost')) {
      rawVal = lead.lostReason || '';
    } else if (key === 'tags' || keyLower.includes('tag')) {
      rawVal = Array.isArray(lead.tags) ? lead.tags.join(', ') : (lead.tags || '');
    } else if (key === 'createdOn' || key === 'createdAt' || key === 'f-created-at' || keyLower.includes('created')) {
      rawVal = lead.createdAt || '';
    } else if (key === 'notes' || key === 'f-notes' || keyLower.includes('note') || keyLower.includes('remark')) {
      rawVal = lead.notes || '';
    } else {
      rawVal = lead.customFields?.[key] ?? (lead as any)[key] ?? '';
    }

    const strVal = String(rawVal ?? '').toLowerCase().trim();
    const targetVal = String(cond.value ?? '').toLowerCase().trim();

    // 1. Unary operators across any type
    if (cond.operator === 'is_empty') {
      if (cond.dataType === 'user') {
        return !lead.ownerAgentName || strVal === 'unassigned' || strVal === '';
      }
      return rawVal === undefined || rawVal === null || strVal === '';
    }
    if (cond.operator === 'is_not_empty') {
      if (cond.dataType === 'user') {
        return Boolean(lead.ownerAgentName) && strVal !== 'unassigned' && strVal !== '';
      }
      return rawVal !== undefined && rawVal !== null && strVal !== '';
    }
    if (cond.operator === 'is_true') {
      return rawVal === true || rawVal === 'true' || rawVal === 1 || rawVal === '1' || strVal === 'yes';
    }
    if (cond.operator === 'is_false') {
      return rawVal === false || rawVal === 'false' || rawVal === 0 || rawVal === '0' || strVal === 'no';
    }

    // 2. Phone specific operations
    if (cond.dataType === 'phone') {
      const cleanLeadDigits = String(rawVal || '').replace(/\D/g, '');
      const cleanTargetDigits = String(cond.value || '').replace(/\D/g, '');
      if (cond.operator === 'equals') {
        return strVal === targetVal || (cleanTargetDigits.length >= 4 && cleanLeadDigits === cleanTargetDigits);
      }
      if (cond.operator === 'begins_with') {
        return strVal.startsWith(targetVal) || (cleanTargetDigits.length >= 2 && cleanLeadDigits.startsWith(cleanTargetDigits));
      }
      if (cond.operator === 'not_begins_with') {
        return !(strVal.startsWith(targetVal) || (cleanTargetDigits.length >= 2 && cleanLeadDigits.startsWith(cleanTargetDigits)));
      }
    }

    // 3. Number / Currency operations
    if (cond.dataType === 'number') {
      const numVal = Number(rawVal);
      const targetNum = Number(cond.value);
      if (isNaN(numVal) || isNaN(targetNum)) {
        if (cond.operator === 'equals') return strVal === targetVal;
        if (cond.operator === 'not_equals') return strVal !== targetVal;
        return false;
      }
      if (cond.operator === 'equals') return numVal === targetNum;
      if (cond.operator === 'not_equals') return numVal !== targetNum;
      if (cond.operator === 'greater_than') return numVal > targetNum;
      if (cond.operator === 'less_than') return numVal < targetNum;
      if (cond.operator === 'greater_than_or_equal') return numVal >= targetNum;
      if (cond.operator === 'less_than_or_equal') return numVal <= targetNum;
    }

    // 4. Date operations
    if (cond.dataType === 'date') {
      let leadDateYMD = '';
      if (rawVal) {
        const d = new Date(rawVal);
        if (!isNaN(d.getTime())) {
          leadDateYMD = d.toISOString().slice(0, 10);
        }
      }
      if (cond.operator === 'is') {
        return leadDateYMD === targetVal || strVal.includes(targetVal);
      }
      if (cond.operator === 'is_not') {
        return leadDateYMD !== targetVal && !strVal.includes(targetVal);
      }
    }

    // 5. Categorical / Multi-select / Lost Reason / User operations
    if (cond.dataType === 'select' || cond.dataType === 'lost_reason' || cond.dataType === 'user') {
      if (cond.operator === 'is' || cond.operator === 'equals') {
        return strVal === targetVal;
      }
      if (cond.operator === 'is_not' || cond.operator === 'not_equals') {
        return strVal !== targetVal;
      }
      if (cond.operator === 'in') {
        return strVal === targetVal || strVal.includes(targetVal) || targetVal.includes(strVal);
      }
    }

    // 6. String / Text default operations
    switch (cond.operator) {
      case 'equals':
      case 'is':
        return strVal === targetVal;
      case 'not_equals':
      case 'is_not':
        return strVal !== targetVal;
      case 'begins_with':
        return strVal.startsWith(targetVal);
      case 'not_begins_with':
        return !strVal.startsWith(targetVal);
      case 'contains':
        return strVal.includes(targetVal);
      case 'not_contains':
        return !strVal.includes(targetVal);
      default:
        return true;
    }
  });
};
