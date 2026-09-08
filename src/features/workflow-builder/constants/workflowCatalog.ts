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

export const API_TEMPLATES: ApiTemplateOption[] = [];

export const WORKFLOW_CATALOG: CatalogItem[] = [
  // =================== EVENTS (TRIGGERS) ===================
  {
    id: 'on_whatsapp_received',
    kind: 'trigger',
    category: 'events',
    name: 'On WhatsApp received',
    description: 'Triggers when an inbound WhatsApp message or reply is received',
    iconName: 'MessageSquare',
    badge: 'Draft',
    defaultConfig: {
      triggerEvent: 'on_whatsapp_received',
      notes: 'Inbound WhatsApp webhook trigger'
    }
  },
  {
    id: 'on_facebook_lead',
    kind: 'trigger',
    category: 'events',
    name: 'On Facebook lead',
    description: 'Triggers automatically when a new lead is captured from Facebook Instant Forms',
    iconName: 'Share2',
    badge: 'Published',
    defaultConfig: {
      triggerEvent: 'on_facebook_lead',
      leadSource: 'Facebook Ads'
    }
  },
  {
    id: 'on_website_lead',
    kind: 'trigger',
    category: 'events',
    name: 'On Website lead',
    description: 'Triggers when an inbound lead submits a form on the website',
    iconName: 'Globe',
    badge: 'Published',
    defaultConfig: {
      triggerEvent: 'on_website_lead',
      leadSource: 'Website Inbound'
    }
  },
  {
    id: 'on_justdial_lead',
    kind: 'trigger',
    category: 'events',
    name: 'On Justdial lead',
    description: 'Triggers when an inquiry arrives from Justdial lead sync',
    iconName: 'Share2',
    badge: 'Published',
    defaultConfig: {
      triggerEvent: 'on_justdial_lead',
      leadSource: 'JustDial'
    }
  },
  {
    id: 'on_woocommerce_payment',
    kind: 'trigger',
    category: 'events',
    name: 'On WooCommerce payment',
    description: 'Triggers when an order or payment is processed in WooCommerce',
    iconName: 'CreditCard',
    defaultConfig: {
      triggerEvent: 'on_woocommerce_payment'
    }
  },
  {
    id: 'on_call_log_lead',
    kind: 'trigger',
    category: 'events',
    name: 'On call log lead',
    description: 'Triggers when a new call log entry is recorded for a contact',
    iconName: 'PhoneCall',
    badge: 'Published',
    defaultConfig: {
      triggerEvent: 'on_call_log_lead'
    }
  },
  {
    id: 'on_excel_upload_lead',
    kind: 'trigger',
    category: 'events',
    name: 'On Excel upload lead',
    description: 'Triggers when leads are imported via CSV or Excel sheet upload',
    iconName: 'Share2',
    defaultConfig: {
      triggerEvent: 'on_excel_upload_lead'
    }
  },
  {
    id: 'on_manual_lead',
    kind: 'trigger',
    category: 'events',
    name: 'On manual lead',
    description: 'Triggers when an agent manually adds a lead into the CRM',
    iconName: 'Settings',
    badge: 'Paused',
    defaultConfig: {
      triggerEvent: 'on_manual_lead'
    }
  },
  {
    id: 'on_lead_status_change',
    kind: 'trigger',
    category: 'events',
    name: 'On Lead Status Change',
    description: 'Triggers whenever a lead is moved across sales pipeline stages',
    iconName: 'RefreshCw',
    badge: 'Published',
    defaultConfig: {
      triggerEvent: 'on_lead_status_change'
    }
  },
  {
    id: 'on_lead_rating_change',
    kind: 'trigger',
    category: 'events',
    name: 'On Lead Rating Change',
    description: 'Triggers when lead rating or AI priority score changes (Hot, Warm, Cold)',
    iconName: 'Star',
    badge: 'Draft',
    defaultConfig: {
      triggerEvent: 'on_lead_rating_change'
    }
  },
  {
    id: 'on_lead_assignment_change',
    kind: 'trigger',
    category: 'events',
    name: 'On Lead Assignment Change',
    description: 'Triggers when a lead is reassigned to a telecaller or sales agent',
    iconName: 'User',
    badge: 'Draft',
    defaultConfig: {
      triggerEvent: 'on_lead_assignment_change'
    }
  },
  {
    id: 'on_user_note',
    kind: 'trigger',
    category: 'events',
    name: 'On User Note',
    description: 'Triggers when an agent adds a custom note on a lead',
    iconName: 'FileText',
    defaultConfig: {
      triggerEvent: 'on_user_note'
    }
  },
  {
    id: 'on_system_note',
    kind: 'trigger',
    category: 'events',
    name: 'On System Note',
    description: 'Triggers when an automated system note or audit log is posted',
    iconName: 'FileText',
    defaultConfig: {
      triggerEvent: 'on_system_note'
    }
  },
  {
    id: 'on_location_checkin',
    kind: 'trigger',
    category: 'events',
    name: 'On Location Check-in',
    description: 'Triggers when field sales agents perform a mobile GPS location check-in',
    iconName: 'MapPin',
    defaultConfig: {
      triggerEvent: 'on_location_checkin'
    }
  },
  {
    id: 'on_ivr_incoming_call',
    kind: 'trigger',
    category: 'events',
    name: 'On IVR incoming call',
    description: 'Triggers when an incoming call connects to cloud IVR system',
    iconName: 'PhoneCall',
    defaultConfig: {
      triggerEvent: 'on_ivr_incoming_call'
    }
  },
  {
    id: 'on_ivr_outgoing_call',
    kind: 'trigger',
    category: 'events',
    name: 'On IVR outgoing call',
    description: 'Triggers when an automated IVR outbound call is dialed',
    iconName: 'PhoneCall',
    defaultConfig: {
      triggerEvent: 'on_ivr_outgoing_call'
    }
  },
  {
    id: 'on_incoming_call_ended',
    kind: 'trigger',
    category: 'events',
    name: 'On incoming call ended',
    description: 'Triggers immediately when an inbound telecalling call concludes',
    iconName: 'PhoneCall',
    badge: 'Draft',
    defaultConfig: {
      triggerEvent: 'on_incoming_call_ended',
      eventFilter: 'all_calls'
    }
  },
  {
    id: 'on_outgoing_call_ended',
    kind: 'trigger',
    category: 'events',
    name: 'On outgoing call ended',
    description: 'Triggers after an outbound telecall by an agent finishes',
    iconName: 'PhoneCall',
    defaultConfig: {
      triggerEvent: 'on_outgoing_call_ended'
    }
  },
  {
    id: 'on_missed_call',
    kind: 'trigger',
    category: 'events',
    name: 'On Missed Call',
    description: 'Triggers instantly when an inbound lead call goes unanswered',
    iconName: 'PhoneMissed',
    defaultConfig: {
      triggerEvent: 'on_missed_call'
    }
  },
  {
    id: 'on_call_recording_completed',
    kind: 'trigger',
    category: 'events',
    name: 'On call recording completed',
    description: 'Triggers once the audio recording file is uploaded and available',
    iconName: 'PhoneCall',
    defaultConfig: {
      triggerEvent: 'on_call_recording_completed'
    }
  },
  {
    id: 'on_payment_completed',
    kind: 'trigger',
    category: 'events',
    name: 'On payment completed',
    description: 'Triggers when payment is marked successful or captured',
    iconName: 'CreditCard',
    defaultConfig: {
      triggerEvent: 'on_payment_completed'
    }
  },
  {
    id: 'on_payment_pending',
    kind: 'trigger',
    category: 'events',
    name: 'On payment pending',
    description: 'Triggers when an invoice or payment link is generated and pending',
    iconName: 'CreditCard',
    defaultConfig: {
      triggerEvent: 'on_payment_pending'
    }
  },
  {
    id: 'on_payment_failed',
    kind: 'trigger',
    category: 'events',
    name: 'On payment failed',
    description: 'Triggers when transaction fails or is declined by gateway',
    iconName: 'CreditCard',
    defaultConfig: {
      triggerEvent: 'on_payment_failed'
    }
  },
  {
    id: 'on_payment_processing',
    kind: 'trigger',
    category: 'events',
    name: 'On payment processing',
    description: 'Triggers while payment settlement is undergoing bank processing',
    iconName: 'CreditCard',
    defaultConfig: {
      triggerEvent: 'on_payment_processing'
    }
  },
  {
    id: 'on_payment_cancelled',
    kind: 'trigger',
    category: 'events',
    name: 'On payment cancelled',
    description: 'Triggers when user cancels payment flow',
    iconName: 'CreditCard',
    defaultConfig: {
      triggerEvent: 'on_payment_cancelled'
    }
  },
  {
    id: 'on_payment_refunded',
    kind: 'trigger',
    category: 'events',
    name: 'On payment refunded',
    description: 'Triggers when transaction amount is partially or fully refunded',
    iconName: 'CreditCard',
    defaultConfig: {
      triggerEvent: 'on_payment_refunded'
    }
  },
  {
    id: 'lead_recapture',
    kind: 'trigger',
    category: 'events',
    name: 'Lead Recapture',
    description: 'Triggers upon automatic lead recapture or deduplication action',
    iconName: 'Users',
    defaultConfig: {
      triggerEvent: 'lead_recapture'
    }
  },
  {
    id: 'justdial_action',
    kind: 'trigger',
    category: 'events',
    name: 'Justdial',
    description: 'Triggers when Justdial custom webhook sync updates',
    iconName: 'Share2',
    defaultConfig: {
      triggerEvent: 'justdial_action'
    }
  },

  // =================== ACTIONS (ALL 15 ACTIONS MATCHING CATALOG) ===================
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
    id: 'create_custom_action',
    kind: 'action',
    category: 'actions',
    name: 'Create Custom Action',
    description: 'Execute custom webhook or external business action',
    iconName: 'Activity',
    defaultConfig: {
      customActionName: 'Trigger Webhook Action',
      customActionCode: 'ACTION_EXECUTE_V1',
      customPayload: '{\n  "status": "triggered"\n}',
      notes: 'Custom business logic'
    }
  },
  {
    id: 'notification_team_member',
    kind: 'action',
    category: 'actions',
    name: 'Notification To TeamMember',
    description: 'Send push alert to team members and lead assignees with dynamic variables',
    iconName: 'Bell',
    defaultConfig: {
      teamMember: 'Assignee',
      targetTeamMember: 'assignee',
      header: '',
      body: '',
      url: '{{LEAD_LINK}}',
      notes: 'Push notification to team member'
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
      assignmentPreference: 'Assign Always',
      taskPreference: 'No Change',
      ignoreCurrentAssignee: 'No',
      selectedTeamMembers: [],
      distributeActiveOnly: true,
      fallbackAssignee: '',
      notes: 'Distribute leads among team members'
    }
  },
  {
    id: 'update_lead_fields',
    kind: 'action',
    category: 'actions',
    name: 'Update Lead Fields',
    description: 'Update lead attributes, source, company, location or custom fields',
    iconName: 'Settings',
    defaultConfig: {
      fieldName: '',
      fieldLabel: '',
      fieldValue: '',
      fieldType: 'text',
      fieldUpdateMode: 'set',
      notes: ''
    }
  },
  {
    id: 'update_lead_rating',
    kind: 'action',
    category: 'actions',
    name: 'Update Lead Rating',
    description: 'Update lead qualification rating to Hot, Warm, Cold or Not Qualified',
    iconName: 'Star',
    defaultConfig: {
      ratingOperation: 'replace',
      ratingValue: '',
      notes: ''
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
      targetStage: '',
      stageName: '',
      stageColor: '',
      status: '',
      notes: ''
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
      delayValue: 10,
      delayUnit: 'Minute',
      delayDirection: 'After',
      delayReference: 'Previous step',
      notes: ''
    }
  },
  {
    id: 'send_template',
    kind: 'action',
    category: 'actions',
    name: 'Send Whatsapp To Lead',
    description: 'Send official WhatsApp template with dynamic variables to lead phone',
    iconName: 'Send',
    badge: 'WhatsApp',
    defaultConfig: {
      whatsappAccount: '',
      toPhoneFields: ['Phone'],
      templateName: '',
      templateLanguage: 'en_US',
      recipientPhoneVariable: '{{lead.phone}}',
      notes: ''
    }
  },
  {
    id: 'add_in_list',
    kind: 'action',
    category: 'actions',
    name: 'Add in List(s)',
    description: 'Add lead to a campaign list, tag group, or audience segment',
    iconName: 'Tag',
    defaultConfig: {
      listName: '',
      listCategory: 'Marketing Segment',
      notes: 'Tags lead into campaign audience'
    }
  },
  {
    id: 'remove_from_list',
    kind: 'action',
    category: 'actions',
    name: 'Remove from List(s)',
    description: 'Remove lead from a campaign list or audience segment',
    iconName: 'Tag',
    defaultConfig: {
      removeListName: '',
      notes: 'Suppresses lead from cold campaigns'
    }
  },
  {
    id: 'add_task',
    kind: 'action',
    category: 'actions',
    name: 'Add Task',
    description: 'Create an automated follow-up task or reminder for the lead assignee',
    iconName: 'CheckSquare',
    defaultConfig: {
      taskType: '',
      assignTo: 'Lead Assignee',
      taskPriority: 'None',
      deadlineValue: 15,
      deadlineUnit: 'Minute',
      deadlineDirection: 'After',
      deadlineReference: 'Previous step',
      taskNotes: '',
      cancelPreviousFollowups: false,
      notes: 'Automated CRM task'
    }
  },
  {
    id: 'cancel_tasks',
    kind: 'action',
    category: 'actions',
    name: 'Cancel Tasks',
    description: 'Cancel all open or pending tasks associated with this lead',
    iconName: 'XSquare',
    defaultConfig: {
      selectedTaskTypes: [],
      cancelScope: 'specific',
      notes: 'Cancel specific task types created on the lead'
    }
  },
  {
    id: 'add_payment',
    kind: 'action',
    category: 'actions',
    name: 'Add payment',
    description: 'Record a deal payment or transaction against this lead',
    iconName: 'CreditCard',
    defaultConfig: {
      paymentAmount: 0,
      amountMode: 'variable',
      amountVariable: '',
      paymentCurrency: 'INR',
      paymentStatus: 'PENDING',
      paymentDescription: '',
      notes: 'Records revenue transaction'
    }
  },
  {
    id: 'add_ivr_action',
    kind: 'action',
    category: 'actions',
    name: 'Add IVR Action',
    description: 'Trigger automated IVR voice dialer or speech bot call to the lead',
    iconName: 'Headphones',
    badge: 'Telephony',
    defaultConfig: {
      ivrActionType: '',
      fieldMappings: {},
      notes: 'Outbound automated IVR action'
    }
  },
  {
    id: 'send_list',
    kind: 'action',
    category: 'actions',
    name: 'Send Waca List To Lead',
    description: 'Send a WhatsApp interactive list menu with custom sections and selectable options',
    iconName: 'Send',
    badge: 'WhatsApp',
    defaultConfig: {
      whatsappAccount: '',
      toPhoneFields: ['Phone'],
      recipientPhoneVariable: '{{lead.phone}}',
      headerText: '',
      bodyText: 'Please choose an option from the menu below:',
      footerText: '',
      buttonText: 'Select Option',
      sections: [
        {
          id: 'sec_1',
          title: 'Options',
          rows: [
            { id: 'opt_1', title: 'Option 1', description: '' },
            { id: 'opt_2', title: 'Option 2', description: '' }
          ]
        }
      ],
      notes: 'WhatsApp Interactive List Message'
    }
  },
  {
    id: 'send_non_template',
    kind: 'action',
    category: 'actions',
    name: 'Send Non Template message',
    description: 'Send custom non-template text or media message to leads within the 24-hour service window',
    iconName: 'Send',
    badge: 'WhatsApp',
    defaultConfig: {
      whatsappAccount: '',
      toPhoneFields: ['Phone'],
      recipientPhoneVariable: '{{lead.phone}}',
      messageType: 'text',
      messageText: '',
      mediaUrl: '',
      mediaCaption: '',
      notes: 'WhatsApp Non-Template Session Message'
    }
  },
  {
    id: 'send_interactive',
    kind: 'action',
    category: 'actions',
    name: 'Send Waca Interactive To Lead',
    description: 'Send WhatsApp quick reply action buttons or call-to-action website/call buttons',
    iconName: 'Send',
    badge: 'WhatsApp',
    defaultConfig: {
      whatsappAccount: '',
      toPhoneFields: ['Phone'],
      recipientPhoneVariable: '{{lead.phone}}',
      interactiveType: 'quick_reply',
      headerType: 'none',
      headerText: '',
      bodyText: '',
      footerText: '',
      buttons: [
        { id: 'btn_1', title: 'Yes, Interested' },
        { id: 'btn_2', title: 'Call Me Back' }
      ],
      ctaUrlLabel: 'Visit Website',
      ctaUrl: 'https://',
      ctaPhoneLabel: 'Call Us',
      ctaPhone: '',
      notes: 'WhatsApp Interactive Button Message'
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

  // =================== LEAD CONDITIONS ===================
  {
    id: 'lead_condition',
    kind: 'condition',
    category: 'lead_conditions',
    name: 'Check If Lead',
    description: 'Branch flow based on lead attributes, deal value, tags or source',
    iconName: 'Filter',
    badge: 'Branching',
    defaultConfig: {
      conditionType: 'Check If Whatsapp Message',
      logicOperator: 'AND',
      conditions: [],
      rules: [],
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
      conditionType: 'Event Condition / If Else',
      logicOperator: 'AND',
      conditions: [],
      rules: [],
      notes: 'Branch flow based on call duration, response codes or message text'
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
