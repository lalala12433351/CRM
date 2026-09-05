import { CatalogItem, WorkflowCategory } from '../types/workflow.types';
import { MarkerType } from '@xyflow/react';

export interface CategoryMeta {
  id: WorkflowCategory;
  name: string;
  description: string;
  badgeCount?: number;
}

export const WORKFLOW_CATEGORIES: CategoryMeta[] = [
  {
    id: 'events',
    name: 'Events (Triggers)',
    description: 'Entry points that initiate this automation'
  },
  {
    id: 'actions',
    name: 'Actions',
    description: 'Outbound operations, API calls & CRM changes'
  },
  {
    id: 'lead_conditions',
    name: 'Lead Conditions',
    description: 'Filter flow based on lead attributes & tags'
  },
  {
    id: 'event_conditions',
    name: 'Event Conditions',
    description: 'Branch based on call duration or event payload'
  }
];

export interface ApiTemplateOption {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpointUrl: string;
  headers: { key: string; value: string }[];
  bodyPayload: string;
}

export const API_TEMPLATES: ApiTemplateOption[] = [
  {
    id: 'meta_capi',
    name: 'Meta Conversions API (CAPI)',
    method: 'POST',
    endpointUrl: 'https://graph.facebook.com/v18.0/{{pixel_id}}/events',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {{meta_access_token}}' }
    ],
    bodyPayload: JSON.stringify({
      data: [{
        event_name: 'Lead',
        event_time: '{{timestamp}}',
        user_data: {
          ph: '{{lead.phone_hash}}',
          em: '{{lead.email_hash}}'
        },
        custom_data: {
          lead_id: '{{lead.id}}',
          source: '{{lead.source}}'
        }
      }]
    }, null, 2)
  },
  {
    id: 'zapier_webhook',
    name: 'Zapier / Make Ingestion Webhook',
    method: 'POST',
    endpointUrl: 'https://hooks.zapier.com/hooks/catch/{{account_id}}/{{hook_id}}/',
    headers: [
      { key: 'Content-Type', value: 'application/json' }
    ],
    bodyPayload: JSON.stringify({
      lead_id: '{{lead.id}}',
      name: '{{lead.name}}',
      phone: '{{lead.phone}}',
      email: '{{lead.email}}',
      stage: '{{lead.status}}',
      source: '{{lead.source}}'
    }, null, 2)
  },
  {
    id: 'slack_notification',
    name: 'Slack Team Alert Webhook',
    method: 'POST',
    endpointUrl: 'https://hooks.slack.com/services/T000/B000/XXXX',
    headers: [
      { key: 'Content-Type', value: 'application/json' }
    ],
    bodyPayload: JSON.stringify({
      text: '🔥 *New High-Value Lead Captured!*\n*Name:* {{lead.name}}\n*Phone:* {{lead.phone}}\n*Status:* {{lead.status}}'
    }, null, 2)
  },
  {
    id: 'sms_gateway',
    name: 'SMS Gateway Trigger (Twilio / MSG91)',
    method: 'POST',
    endpointUrl: 'https://api.msg91.com/api/v5/flow/',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'authkey', value: '{{sms_auth_key}}' }
    ],
    bodyPayload: JSON.stringify({
      flow_id: '{{flow_id}}',
      recipients: [{
        mobiles: '{{lead.phone}}',
        name: '{{lead.name}}'
      }]
    }, null, 2)
  },
  {
    id: 'external_crm_sync',
    name: 'Sync Lead to External ERP / CRM',
    method: 'POST',
    endpointUrl: 'https://api.external-crm.com/v2/contacts',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {{external_api_token}}' }
    ],
    bodyPayload: JSON.stringify({
      contact_id: '{{lead.id}}',
      first_name: '{{lead.name}}',
      phone: '{{lead.phone}}',
      company: '{{lead.company}}',
      tags: '{{lead.tags}}'
    }, null, 2)
  },
  {
    id: 'custom_endpoint',
    name: 'Custom Webhook Endpoint',
    method: 'POST',
    endpointUrl: 'https://api.yourdomain.com/v1/webhook',
    headers: [
      { key: 'Content-Type', value: 'application/json' }
    ],
    bodyPayload: JSON.stringify({
      lead_id: '{{lead.id}}',
      phone: '{{lead.phone}}',
      status: '{{lead.status}}'
    }, null, 2)
  }
];

export const WORKFLOW_CATALOG: CatalogItem[] = [
  // =================== EVENTS (TRIGGERS) ===================
  {
    id: 'incoming_call_ended',
    kind: 'trigger',
    category: 'events',
    name: 'On incoming call ended',
    description: 'Triggers immediately when an inbound telecalling call concludes',
    iconName: 'PhoneCall',
    badge: 'Real-time',
    defaultConfig: {
      triggerEvent: 'incoming_call_ended',
      eventFilter: 'all_calls',
      notes: 'Triggers for all incoming phone calls'
    }
  },
  {
    id: 'incoming_whatsapp',
    kind: 'trigger',
    category: 'events',
    name: 'Incoming Whatsapp',
    description: 'Triggers when a customer replies or sends an inbound WhatsApp message',
    iconName: 'MessageSquare',
    badge: 'Popular',
    defaultConfig: {
      triggerEvent: 'incoming_whatsapp',
      eventFilter: 'any_message',
      notes: 'Triggers on incoming WhatsApp conversation'
    }
  },
  {
    id: 'payment_completed',
    kind: 'trigger',
    category: 'events',
    name: 'Payment Completed',
    description: 'Triggers when an online Razorpay, Stripe or manual payment completes',
    iconName: 'CreditCard',
    badge: 'Finance',
    defaultConfig: {
      triggerEvent: 'payment_completed',
      eventFilter: 'success_only',
      notes: 'Fires when transaction status is PAID'
    }
  },
  {
    id: 'lead_status_change',
    kind: 'trigger',
    category: 'events',
    name: 'On Lead Status Change',
    description: 'Triggers whenever a lead is moved across sales pipeline stages',
    iconName: 'RefreshCw',
    defaultConfig: {
      triggerEvent: 'lead_status_change',
      eventFilter: 'any_stage_change',
      notes: 'Monitors stage transition events'
    }
  },
  {
    id: 'missed_call',
    kind: 'trigger',
    category: 'events',
    name: 'On Missed Call',
    description: 'Triggers instantly when an inbound lead call goes unanswered',
    iconName: 'PhoneMissed',
    badge: 'Priority',
    defaultConfig: {
      triggerEvent: 'missed_call',
      eventFilter: 'all_missed',
      notes: 'Instant callback automation trigger'
    }
  },
  {
    id: 'facebook_lead',
    kind: 'trigger',
    category: 'events',
    name: 'Facebook Lead Ad Ingest',
    description: 'Triggers automatically when Meta Instant Form is submitted',
    iconName: 'Share2',
    defaultConfig: {
      triggerEvent: 'facebook_lead',
      leadSource: 'Facebook Ads',
      notes: 'Instant lead capture from Meta Ads'
    }
  },
  {
    id: 'custom_action_created',
    kind: 'trigger',
    category: 'events',
    name: 'Custom Webhook Trigger',
    description: 'Inbound HTTP webhook listener for custom third-party integrations',
    iconName: 'Zap',
    defaultConfig: {
      triggerEvent: 'custom_action_created',
      eventFilter: 'POST',
      notes: 'Receives JSON payloads at webhook endpoint'
    }
  },

  // =================== ACTIONS ===================
  {
    id: 'call_api',
    kind: 'action',
    category: 'actions',
    name: 'Call API',
    description: 'Send custom HTTP requests with template, URL, headers, and body fields',
    iconName: 'Globe',
    defaultConfig: {
      apiTemplate: '',
      method: 'POST',
      endpointUrl: '',
      headers: [],
      bodyPayload: '',
      notes: 'Custom API invocation'
    }
  },
  {
    id: 'capi',
    kind: 'action',
    category: 'actions',
    name: 'CAPI - Meta Conversions API',
    description: 'Post offline lead conversions back to Meta Ads Manager',
    iconName: 'Share2',
    badge: 'Marketing',
    defaultConfig: {
      apiTemplate: 'Meta Conversions API (CAPI)',
      capiEventName: 'Lead',
      pixelId: '849204918239',
      customEventCode: 'LEAD_OFFLINE_CONVERSION',
      notes: 'Syncs lead status to Facebook Pixel'
    }
  },
  {
    id: 'send_template',
    kind: 'action',
    category: 'actions',
    name: 'Send WhatsApp Template',
    description: 'Send official Meta Cloud API approved template with dynamic variables',
    iconName: 'Send',
    badge: 'WhatsApp',
    defaultConfig: {
      templateName: 'lead_welcome_brochure',
      templateLanguage: 'en_US',
      recipientPhoneVariable: '{{lead.phone}}',
      templateParams: {
        '1': '{{lead.name}}',
        '2': '{{company.name}}'
      },
      notes: 'Sends high-conversion welcome template'
    }
  },
  {
    id: 'update_lead_status',
    kind: 'action',
    category: 'actions',
    name: 'Update Lead Status',
    description: 'Move lead to a specified pipeline stage automatically',
    iconName: 'UserCheck',
    defaultConfig: {
      targetStage: 'Contacted',
      notes: 'Advances lead status in CRM'
    }
  },
  {
    id: 'update_lead_assignee',
    kind: 'action',
    category: 'actions',
    name: 'Update Lead Assignee',
    description: 'Assign lead to specific telecaller or distribute via round-robin',
    iconName: 'UserPlus',
    defaultConfig: {
      assigneeType: 'round_robin',
      assigneeAgentId: '',
      notes: 'Distributes leads equally among sales reps'
    }
  },
  {
    id: 'time_delay',
    kind: 'action',
    category: 'actions',
    name: 'Time Delay',
    description: 'Pause the workflow for minutes, hours or days before next step',
    iconName: 'Clock',
    defaultConfig: {
      delayValue: 15,
      delayUnit: 'minutes',
      notes: 'Wait period before subsequent actions'
    }
  },

  // =================== LEAD CONDITIONS ===================
  {
    id: 'lead_condition',
    kind: 'condition',
    category: 'lead_conditions',
    name: 'Lead Condition / If Else',
    description: 'Branch flow based on lead attributes, deal value, tags or source',
    iconName: 'Filter',
    badge: 'Branching',
    defaultConfig: {
      conditionType: 'lead',
      logicOperator: 'AND',
      rules: [
        {
          id: 'rule-1',
          field: 'status',
          operator: 'equals',
          value: 'Interested'
        }
      ],
      notes: 'Splits path into True (green) and False (red)'
    }
  },

  // =================== EVENT CONDITIONS ===================
  {
    id: 'event_condition',
    kind: 'condition',
    category: 'event_conditions',
    name: 'Event Condition / If Else',
    description: 'Branch flow based on call duration, response codes or message text',
    iconName: 'GitFork',
    badge: 'Branching',
    defaultConfig: {
      conditionType: 'event',
      logicOperator: 'AND',
      rules: [
        {
          id: 'rule-1',
          field: 'call_duration_seconds',
          operator: 'greater_than',
          value: '30'
        }
      ],
      notes: 'Evaluates real-time event telemetry'
    }
  }
];

export const SAMPLE_TEMPLATES = [
  {
    id: 'tpl-instant-welcome',
    name: 'Instant WhatsApp Welcome & Agent Assign Flow',
    description: 'Captures incoming leads, validates status, sends WhatsApp welcome brochure and assigns agent.',
    nodes: [
      {
        id: 'node-trigger-1',
        type: 'trigger',
        position: { x: 50, y: 150 },
        data: {
          kind: 'trigger',
          catalogId: 'facebook_lead',
          label: 'Facebook Lead Ad Ingest',
          description: 'Instant lead capture from Meta Ads',
          iconName: 'Share2',
          category: 'events',
          config: {
            triggerEvent: 'facebook_lead',
            leadSource: 'Facebook Ads'
          }
        }
      },
      {
        id: 'node-condition-1',
        type: 'condition',
        position: { x: 380, y: 130 },
        data: {
          kind: 'condition',
          catalogId: 'lead_condition',
          label: 'Check: Valid Phone & Fresh Status',
          description: 'Validates contact number before messaging',
          iconName: 'Filter',
          category: 'lead_conditions',
          config: {
            conditionType: 'lead',
            logicOperator: 'AND',
            rules: [
              { id: 'r1', field: 'phone', operator: 'is_not_empty', value: '' },
              { id: 'r2', field: 'status', operator: 'equals', value: 'Fresh' }
            ]
          }
        }
      },
      {
        id: 'node-action-1',
        type: 'action',
        position: { x: 740, y: 60 },
        data: {
          kind: 'action',
          catalogId: 'send_template',
          label: 'Send Welcome WhatsApp Brochure',
          description: 'Dispatches instant catalog to customer',
          iconName: 'Send',
          category: 'actions',
          config: {
            templateName: 'lead_welcome_brochure',
            templateLanguage: 'en_US',
            recipientPhoneVariable: '{{lead.phone}}'
          }
        }
      },
      {
        id: 'node-action-2',
        type: 'action',
        position: { x: 1060, y: 60 },
        data: {
          kind: 'action',
          catalogId: 'update_lead_assignee',
          label: 'Round-Robin Lead Assignment',
          description: 'Equally distributes to active sales agents',
          iconName: 'UserPlus',
          category: 'actions',
          config: {
            assigneeType: 'round_robin'
          }
        }
      },
      {
        id: 'node-action-3',
        type: 'action',
        position: { x: 740, y: 260 },
        data: {
          kind: 'action',
          catalogId: 'call_api',
          label: 'Log Invalid Lead to Audit Webhook',
          description: 'Sends notification for manual phone verification',
          iconName: 'Globe',
          category: 'actions',
          config: {
            method: 'POST',
            endpointUrl: 'https://api.crm.internal/v1/invalid-leads'
          }
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'node-trigger-1',
        sourceHandle: 'output',
        target: 'node-condition-1',
        targetHandle: 'input',
        animated: true,
        type: 'smoothstep',
        style: { stroke: '#3a2088', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3a2088', width: 14, height: 14 }
      },
      {
        id: 'e2',
        source: 'node-condition-1',
        sourceHandle: 'true',
        target: 'node-action-1',
        targetHandle: 'input',
        animated: true,
        type: 'smoothstep',
        style: { stroke: '#10b981', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 14, height: 14 }
      },
      {
        id: 'e3',
        source: 'node-action-1',
        sourceHandle: 'output',
        target: 'node-action-2',
        targetHandle: 'input',
        animated: true,
        type: 'smoothstep',
        style: { stroke: '#475569', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#475569', width: 14, height: 14 }
      },
      {
        id: 'e4',
        source: 'node-condition-1',
        sourceHandle: 'false',
        target: 'node-action-3',
        targetHandle: 'input',
        animated: true,
        type: 'smoothstep',
        style: { stroke: '#DC2626', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#DC2626', width: 14, height: 14 }
      }
    ]
  }
];
