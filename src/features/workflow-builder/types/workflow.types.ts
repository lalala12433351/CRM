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

    // Action 1: Call API
    apiTemplate?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    endpointUrl?: string;
    headers?: HeaderKeyValue[];
    bodyPayload?: string;

    // Action 2: Create Custom Action
    customActionName?: string;
    customActionCode?: string;
    customPayload?: string;

    // Action 3: Notification To TeamMember
    notificationChannel?: 'in_app' | 'email' | 'whatsapp' | 'sms';
    targetTeamMember?: 'assignee' | 'all_admins' | 'specific_agent';
    teamMemberAgentId?: string;
    teamMemberAgentName?: string;
    notificationTitle?: string;
    notificationMessage?: string;

    // Action 4: Update Lead Assignee
    assigneeType?: 'specific' | 'round_robin';
    assigneeAgentId?: string;
    assigneeAgentName?: string;

    // Action 5: Update Lead Fields
    fieldName?: string;
    fieldValue?: string;
    fieldUpdateMode?: 'set' | 'append' | 'clear';

    // Action 6: Update Lead Rating
    targetRating?: 'Hot' | 'Warm' | 'Cold' | 'Not Qualified';
    ratingScore?: number;

    // Action 7: Update Lead Status
    targetStage?: string;

    // Action 8: Time Delay
    delayValue?: number;
    delayUnit?: 'minutes' | 'hours' | 'days';

    // Action 9: Send Template
    templateName?: string;
    templateLanguage?: string;
    recipientPhoneVariable?: string;
    templateParams?: Record<string, string>;

    // Action 10: Add in List
    listName?: string;
    listCategory?: string;

    // Action 11: Remove from List
    removeListName?: string;

    // Action 12: Add Task
    taskTitle?: string;
    taskDueInHours?: number;
    taskPriority?: 'High' | 'Medium' | 'Low';
    taskNotes?: string;

    // Action 13: Cancel Tasks
    cancelScope?: 'all' | 'overdue' | 'specific';
    cancelTaskType?: string;

    // Action 14: Add payment
    paymentAmount?: number;
    paymentCurrency?: string;
    paymentStatus?: 'Completed' | 'Pending' | 'Partial';
    paymentMode?: 'UPI' | 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Cheque';
    invoiceNumber?: string;

    // Action 15: Add IVR Action
    ivrCampaignName?: string;
    ivrVoiceBotScript?: string;
    ivrMaxRetries?: number;
    ivrRingTimeout?: number;
    ivrCallerId?: string;

    // Extra: Meta CAPI
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
