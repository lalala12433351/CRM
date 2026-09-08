export interface WorkflowEventItem {
  id: string;
  name: string;
  badge?: 'Draft' | 'Published' | 'Paused';
  iconType: string;
  category?: string;
  description?: string;
}

export interface WorkflowEventCategory {
  id: string;
  name: string;
  iconType: string;
  defaultExpanded?: boolean;
  children: WorkflowEventItem[];
}

export type WorkflowEventEntry = 
  | { type: 'category'; data: WorkflowEventCategory }
  | { type: 'item'; data: WorkflowEventItem };

export const WORKFLOW_EVENT_ENTRIES: WorkflowEventEntry[] = [
  // 1. WhatsApp Accordion (open by default)
  {
    type: 'category',
    data: {
      id: 'cat-whatsapp',
      name: 'Whatsapp',
      iconType: 'whatsapp',
      defaultExpanded: true,
      children: [
        {
          id: 'on_whatsapp_received',
          name: 'On WhatsApp received',
          badge: 'Draft',
          iconType: 'whatsapp_msg',
          category: 'Whatsapp',
          description: 'Triggers when a new WhatsApp message is received from a lead'
        }
      ]
    }
  },

  // 2. On Lead Field Change (collapsed by default)
  {
    type: 'category',
    data: {
      id: 'cat-lead-field-change',
      name: 'On Lead Field Change',
      iconType: 'gear',
      defaultExpanded: false,
      children: [
        {
          id: 'on_lead_field_updated',
          name: 'On Lead Field Updated',
          iconType: 'gear',
          category: 'On Lead Field Change',
          description: 'Triggers when any custom or system field on a lead is modified'
        },
        {
          id: 'on_lead_tag_added',
          name: 'On Lead Tag Added',
          iconType: 'gear',
          category: 'On Lead Field Change',
          description: 'Triggers when a new tag is attached to a lead record'
        }
      ]
    }
  },

  // 3. Standalone Lead Ingest & Activity Events
  {
    type: 'item',
    data: {
      id: 'on_facebook_lead',
      name: 'On Facebook lead',
      badge: 'Published',
      iconType: 'facebook',
      description: 'Triggers automatically when a new lead is captured from Facebook Instant Forms'
    }
  },
  {
    type: 'item',
    data: {
      id: 'on_website_lead',
      name: 'On Website lead',
      badge: 'Published',
      iconType: 'globe',
      description: 'Triggers when an inbound lead submits a form on the website'
    }
  },
  {
    type: 'item',
    data: {
      id: 'on_justdial_lead',
      name: 'On Justdial lead',
      badge: 'Published',
      iconType: 'justdial',
      description: 'Triggers when an inquiry arrives from Justdial lead sync'
    }
  },
  {
    type: 'item',
    data: {
      id: 'on_woocommerce_payment',
      name: 'On WooCommerce payment',
      iconType: 'woocommerce',
      description: 'Triggers when an order or payment is processed in WooCommerce'
    }
  },
  {
    type: 'item',
    data: {
      id: 'on_call_log_lead',
      name: 'On call log lead',
      badge: 'Published',
      iconType: 'phone',
      description: 'Triggers when a new call log entry is recorded for a contact'
    }
  },
  {
    type: 'item',
    data: {
      id: 'on_excel_upload_lead',
      name: 'On Excel upload lead',
      iconType: 'excel',
      description: 'Triggers when leads are imported via CSV or Excel sheet upload'
    }
  },
  {
    type: 'item',
    data: {
      id: 'on_manual_lead',
      name: 'On manual lead',
      badge: 'Paused',
      iconType: 'gear',
      description: 'Triggers when an agent manually adds a lead into the CRM'
    }
  },
  {
    type: 'item',
    data: {
      id: 'on_lead_status_change',
      name: 'On Lead Status Change',
      badge: 'Published',
      iconType: 'status_change',
      description: 'Triggers when a lead transitions from one pipeline stage to another'
    }
  },
  {
    type: 'item',
    data: {
      id: 'on_lead_rating_change',
      name: 'On Lead Rating Change',
      badge: 'Draft',
      iconType: 'star',
      description: 'Triggers when lead rating or AI priority score changes (Hot, Warm, Cold)'
    }
  },
  {
    type: 'item',
    data: {
      id: 'on_lead_assignment_change',
      name: 'On Lead Assignment Change',
      badge: 'Draft',
      iconType: 'user',
      description: 'Triggers when a lead is reassigned to a telecaller or sales agent'
    }
  },
  {
    type: 'item',
    data: {
      id: 'on_user_note',
      name: 'On User Note',
      iconType: 'file_text',
      description: 'Triggers when an agent adds a custom note on a lead'
    }
  },
  {
    type: 'item',
    data: {
      id: 'on_system_note',
      name: 'On System Note',
      iconType: 'file_text',
      description: 'Triggers when an automated system note or audit log is posted'
    }
  },
  {
    type: 'item',
    data: {
      id: 'on_location_checkin',
      name: 'On Location Check-in',
      iconType: 'location',
      description: 'Triggers when field sales agents perform a mobile GPS location check-in'
    }
  },

  // 4. IVR Accordion
  {
    type: 'category',
    data: {
      id: 'cat-ivr',
      name: 'IVR',
      iconType: 'ivr',
      defaultExpanded: true,
      children: [
        {
          id: 'on_ivr_incoming_call',
          name: 'On IVR incoming call',
          iconType: 'ivr',
          category: 'IVR',
          description: 'Triggers when an incoming call connects to cloud IVR system'
        },
        {
          id: 'on_ivr_outgoing_call',
          name: 'On IVR outgoing call',
          iconType: 'ivr',
          category: 'IVR',
          description: 'Triggers when an automated IVR outbound call is dialed'
        }
      ]
    }
  },

  // 5. Call activities Accordion
  {
    type: 'category',
    data: {
      id: 'cat-call-activities',
      name: 'Call activities',
      iconType: 'phone',
      defaultExpanded: true,
      children: [
        {
          id: 'on_incoming_call_ended',
          name: 'On incoming call ended',
          badge: 'Draft',
          iconType: 'call_incoming_ended',
          category: 'Call activities',
          description: 'Triggers immediately after an inbound telecall terminates'
        },
        {
          id: 'on_outgoing_call_ended',
          name: 'On outgoing call ended',
          iconType: 'call_outgoing_ended',
          category: 'Call activities',
          description: 'Triggers after an outbound telecall by an agent finishes'
        },
        {
          id: 'on_missed_call',
          name: 'On Missed Call',
          iconType: 'call_missed',
          category: 'Call activities',
          description: 'Triggers when an inbound call goes unanswered or is dropped'
        },
        {
          id: 'on_call_recording_completed',
          name: 'On call recording completed',
          iconType: 'call_recording',
          category: 'Call activities',
          description: 'Triggers once the audio recording file is uploaded and available'
        }
      ]
    }
  },

  // 6. Payment activities Accordion
  {
    type: 'category',
    data: {
      id: 'cat-payment-activities',
      name: 'Payment activities',
      iconType: 'payment',
      defaultExpanded: true,
      children: [
        {
          id: 'on_payment_completed',
          name: 'On payment completed',
          iconType: 'payment',
          category: 'Payment activities',
          description: 'Triggers when payment is marked successful or captured'
        },
        {
          id: 'on_payment_pending',
          name: 'On payment pending',
          iconType: 'payment',
          category: 'Payment activities',
          description: 'Triggers when an invoice or payment link is generated and pending'
        },
        {
          id: 'on_payment_failed',
          name: 'On payment failed',
          iconType: 'payment',
          category: 'Payment activities',
          description: 'Triggers when transaction fails or is declined by gateway'
        },
        {
          id: 'on_payment_processing',
          name: 'On payment processing',
          iconType: 'payment',
          category: 'Payment activities',
          description: 'Triggers while payment settlement is undergoing bank processing'
        },
        {
          id: 'on_payment_cancelled',
          name: 'On payment cancelled',
          iconType: 'payment',
          category: 'Payment activities',
          description: 'Triggers when user cancels payment flow'
        },
        {
          id: 'on_payment_refunded',
          name: 'On payment refunded',
          iconType: 'payment',
          category: 'Payment activities',
          description: 'Triggers when transaction amount is partially or fully refunded'
        }
      ]
    }
  },

  // 7. On Custom Action Creation Accordion
  {
    type: 'category',
    data: {
      id: 'cat-custom-action-creation',
      name: 'On Custom Action Creation',
      iconType: 'custom_action',
      defaultExpanded: true,
      children: [
        {
          id: 'lead_recapture',
          name: 'Lead Recapture',
          iconType: 'lead_recapture',
          category: 'On Custom Action Creation',
          description: 'Triggers upon automatic lead recapture or deduplication action'
        }
      ]
    }
  },

  // 8. On Custom Action Updation Accordion
  {
    type: 'category',
    data: {
      id: 'cat-custom-action-updation',
      name: 'On Custom Action Updation',
      iconType: 'custom_action',
      defaultExpanded: true,
      children: [
        {
          id: 'justdial_action',
          name: 'Justdial',
          iconType: 'justdial',
          category: 'On Custom Action Updation',
          description: 'Triggers when Justdial custom webhook sync updates'
        }
      ]
    }
  }
];
