import { 
  Lead, 
  Agent, 
  PipelineStage, 
  CallRecord, 
  ActivityLog, 
  WhatsAppMessage, 
  WhatsAppTemplate, 
  WhatsAppCampaign, 
  WorkflowRule, 
  CustomFieldDef, 
  DocumentQuote, 
  HourlyMetric, 
  PermissionTemplate 
} from '../types';

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent-admin',
    name: 'Madhava sai nagendra',
    email: 'admin@company.com',
    phone: '+91 98765 43210',
    role: 'Master Admin',
    isAdmin: true,
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    totalCallsToday: 0,
    talkTimeMinutes: 0,
    convertedLeadsCount: 0,
    revenueGenerated: 0,
    responseTimeMinutes: 1.0,
  }
];

export const INITIAL_STAGES: PipelineStage[] = [
  { id: 'stage-1', name: 'Fresh', color: '#3B82F6', order: 1, category: 'initial', winProbability: 10 },
  { id: 'stage-2', name: 'Contacted', color: '#8B5CF6', order: 2, category: 'active', winProbability: 25 },
  { id: 'stage-3', name: 'Follow Up', color: '#F59E0B', order: 3, category: 'active', winProbability: 40 },
  { id: 'stage-4', name: 'Demo Scheduled', color: '#06B6D4', order: 4, category: 'active', winProbability: 60 },
  { id: 'stage-5', name: 'Proposal Sent', color: '#10B981', order: 5, category: 'active', winProbability: 80 },
  { id: 'stage-6', name: 'Converted', color: '#059669', order: 6, category: 'closed', winProbability: 100 },
  { id: 'stage-7', name: 'Lost', color: '#EF4444', order: 7, category: 'closed', winProbability: 0 },
];

export const INITIAL_CUSTOM_FIELDS: CustomFieldDef[] = [
  // Active Default Fields (Name, Number, Status, Deal Value, Lead Source)
  { id: 'f-h1', name: 'name', label: 'Name', type: 'text', required: true, isPrimary: true, primarySlot: 'H1', createdOn: '3M ago', lastModified: '3M ago', category: 'Primary', isHidden: false },
  { id: 'f-h2', name: 'phone', label: 'Number', type: 'phone', required: true, isPrimary: true, primarySlot: 'H2', createdOn: '3M ago', lastModified: '3M ago', category: 'Primary', isHidden: false },
  { id: 'f-status', name: 'status', label: 'Status', type: 'dropdown', options: ['New Lead', 'Contacted', 'Follow Up', 'Demo Scheduled', 'Proposal Sent', 'Converted', 'Lost'], required: true, isPrimary: true, createdOn: '3M ago', lastModified: '3M ago', category: 'Primary', isHidden: false },
  { id: 'f-deal-val', name: 'deal_value', label: 'Deal Value (₹)', type: 'currency', required: false, createdOn: '3M ago', lastModified: '3M ago', category: 'General', isHidden: false },
  { id: 'f-source', name: 'source', label: 'Lead Source', type: 'dropdown', options: ['Facebook Ads', 'Google Ads', 'Meta Ads', 'IndiaMart', 'JustDial', 'WhatsApp', 'Website Inbound', 'Instagram', 'Referral', 'Direct'], required: false, isPrimary: true, createdOn: '3M ago', lastModified: '3M ago', category: 'Primary', isHidden: false },
  
  // Secondary Fields
  { id: 'f-assignee', name: 'assignee', label: 'Assignee', type: 'text', required: false, isPrimary: true, createdOn: '3M ago', lastModified: '3M ago', category: 'Primary', isHidden: true },
  { id: 'f-created-at', name: 'createdOn', label: 'Created On', type: 'date', required: false, isPrimary: true, createdOn: '3M ago', lastModified: '3M ago', category: 'Primary', isHidden: true },
  { id: 'f-addr', name: 'address', label: 'Address', type: 'text', required: false, createdOn: '3M ago', lastModified: '3M ago', category: 'Contact', isHidden: true },
  { id: 'f-age', name: 'age', label: 'Age', type: 'text', required: false, createdOn: '3M ago', lastModified: '3M ago', category: 'General', isHidden: true },
  { id: 'f-alt-phone', name: 'alternate_phone', label: 'Alternate Phone', type: 'phone', required: false, createdOn: '3M ago', lastModified: '3M ago', category: 'Contact', isHidden: true },
  { id: 'f-city', name: 'city', label: 'City', type: 'text', required: false, createdOn: '3M ago', lastModified: '3M ago', category: 'Contact', isHidden: true },
  { id: 'f-company', name: 'company', label: 'Company', type: 'text', required: false, createdOn: '3M ago', lastModified: '3M ago', category: 'General', isHidden: true },
  { id: 'f-email', name: 'email', label: 'Email', type: 'email', required: false, createdOn: '3M ago', lastModified: '3M ago', category: 'Contact', isHidden: true },
  { id: 'f-gender', name: 'gender', label: 'Gender', type: 'dropdown', options: ['Male', 'Female', 'Other'], required: false, createdOn: '3M ago', lastModified: '3M ago', category: 'General', isHidden: true },
  { id: 'f-state', name: 'state', label: 'State', type: 'text', required: false, createdOn: '3M ago', lastModified: '3M ago', category: 'Contact', isHidden: true },
  { id: 'f-notes', name: 'special_remarks', label: 'Special Remarks Notes', type: 'textarea', required: false, createdOn: '3M ago', lastModified: '3M ago', category: 'General', isHidden: true },
];

export const INITIAL_LEADS: Lead[] = [];
export const INITIAL_CALL_RECORDS: CallRecord[] = [];
export const INITIAL_ACTIVITIES: ActivityLog[] = [];
export const INITIAL_MESSAGES: WhatsAppMessage[] = [];
export const INITIAL_TEMPLATES: WhatsAppTemplate[] = [];
export const INITIAL_CAMPAIGNS: WhatsAppCampaign[] = [];
export const INITIAL_WORKFLOWS: WorkflowRule[] = [];
export const HOURLY_METRICS: HourlyMetric[] = [];
export const INITIAL_DOCS: DocumentQuote[] = [];

export const INITIAL_PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'perm-caller',
    name: 'Default Caller Permissions',
    description: 'Standard calling, lead follow-up and whatsapp templates access for telecallers',
    isDefault: true,
    assignedCount: 0,
    assignedAgents: [],
    lastModifiedOn: '3M ago',
    createdOn: '6:40 PM Wed, 13 May 26',
    createdBy: 'Admin',
    lastModifiedBy: 'FC',
    rights: {
      leads: true,
      salesform: true,
      team: false,
      permissions: false,
      calling: true,
      reports: true,
      automations: true,
      tasks: true,
      billings: false,
      integrations: false,
      aiAgents: true,
      leadView: true,
      dashboardView: false,
      leadsTableView: true,
      whatsappTemplates: true,
      smsTemplates: true,
      emailTemplates: true,
      embeddedApps: true,
    }
  },
  {
    id: 'perm-admin',
    name: 'Default Admin Permissions',
    description: 'Complete administrative access to all CRM settings, permissions, billing, and teams',
    isDefault: true,
    assignedCount: 1,
    assignedAgents: ['agent-admin'],
    lastModifiedOn: '3M ago',
    createdOn: '9:00 AM Wed, 01 Apr 26',
    createdBy: 'Root Admin',
    lastModifiedBy: 'FC',
    rights: {
      leads: true,
      salesform: true,
      team: true,
      permissions: true,
      calling: true,
      reports: true,
      automations: true,
      tasks: true,
      billings: true,
      integrations: true,
      aiAgents: true,
      leadView: true,
      dashboardView: true,
      leadsTableView: true,
      whatsappTemplates: true,
      smsTemplates: true,
      emailTemplates: true,
      embeddedApps: true,
    }
  }
];
