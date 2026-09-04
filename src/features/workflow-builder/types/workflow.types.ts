import { Node, Edge } from '@xyflow/react';

export type WorkflowCategory = 'events' | 'actions' | 'lead_conditions' | 'event_conditions';

export type NodeTypeKind = 'trigger' | 'condition' | 'action';

export interface CatalogItem {
  id: string;
  kind: NodeTypeKind;
  category: WorkflowCategory;
  name: string;
  description: string;
  iconName: string;
  badge?: string;
  defaultConfig: Record<string, any>;
}

export interface HeaderKeyValue {
  key: string;
  value: string;
}

export interface ConditionRule {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'in';
  value: string;
}

export interface WorkflowNodeData extends Record<string, unknown> {
  kind: NodeTypeKind;
  catalogId: string;
  label: string;
  description?: string;
  iconName: string;
  category: WorkflowCategory;
  config: {
    // Triggers
    triggerEvent?: string;
    eventFilter?: string;
    leadSource?: string;

    // Conditions
    conditionType?: 'lead' | 'event';
    logicOperator?: 'AND' | 'OR';
    rules?: ConditionRule[];

    // Action: Call API / Webhook
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    endpointUrl?: string;
    headers?: HeaderKeyValue[];
    bodyPayload?: string;

    // Action: WhatsApp Template
    templateName?: string;
    templateLanguage?: string;
    recipientPhoneVariable?: string;
    templateParams?: Record<string, string>;

    // Action: Update Lead Status
    targetStage?: string;

    // Action: Update Assignee
    assigneeType?: 'specific' | 'round_robin';
    assigneeAgentId?: string;
    assigneeAgentName?: string;

    // Action: Time Delay
    delayValue?: number;
    delayUnit?: 'minutes' | 'hours' | 'days';

    // Action: CAPI
    capiEventName?: string;
    pixelId?: string;
    customEventCode?: string;

    // Generic extra
    notes?: string;
    [key: string]: any;
  };
  isValid?: boolean;
}

export type CustomWorkflowNode = Node<WorkflowNodeData, NodeTypeKind>;

export interface WorkflowSerialized {
  id: string;
  name: string;
  status: 'draft' | 'published';
  version: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  nodes: CustomWorkflowNode[];
  edges: Edge[];
}
