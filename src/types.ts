export type LeadSource = 
  | 'Facebook-Meta-01'
  | 'Website'
  | 'Facebook Ads' 
  | 'Google Ads' 
  | 'IndiaMart' 
  | 'JustDial' 
  | 'Website Form' 
  | 'WhatsApp' 
  | 'Sulekha' 
  | '99acres'
  | 'Google Sheets'
  | 'Manual / Bulk CSV'
  | string;

export type LeadStatus = 
  | 'New Lead' 
  | 'Fresh' 
  | 'Open' 
  | 'RNR' 
  | 'Contacted' 
  | 'Call Connected'
  | 'Follow Up' 
  | 'Interested'
  | 'Qualified'
  | 'Appointment Booked'
  | 'Demo Scheduled' 
  | 'Proposal Sent' 
  | 'Converted' 
  | 'Won'
  | 'Lost'
  | 'Invalid'
  | 'Duplicate'
  | 'Not Reachable'
  | 'Call Back Later'
  | 'Not Interested'
  | 'Ringing No Answer'
  | 'Warm'
  | 'Visited'
  | 'Visit Scheduled'
  | 'Job enquiry'
  | 'IATA'
  | 'Next Batch'
  | 'Next Year'
  | 'CPL'
  | 'Existing'
  | string;

export type AIRating = 'Hot' | 'Warm' | 'Cold';

// ============================================================================
// CONVERSION TRACKING & ATTRIBUTION DATA TYPES
// ============================================================================

export type ConversionPlatform = 'google_ads' | 'meta_ads';

export type ConversionEventStatus = 
  | 'pending' 
  | 'processing' 
  | 'sent' 
  | 'failed' 
  | 'retrying' 
  | 'duplicate' 
  | 'permanently_failed';

export type LeadQualityTier = 'Cold' | 'Low Quality' | 'Medium Quality' | 'High Quality' | 'Converted';

export interface LeadAttribution {
  leadId: string;
  source: string;
  campaign?: string;
  campaignId?: string;
  adSet?: string;
  adSetId?: string;
  adName?: string;
  adId?: string;
  landingPageUrl?: string;
  formId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  googleClientId?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  device?: 'Mobile' | 'Desktop' | 'Tablet';
  browser?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  createdAt: string;
}

export interface LeadQualityScore {
  score: number; // 0 - 100
  tier: LeadQualityTier;
  breakdown: Array<{
    factor: string;
    points: number;
    matched: boolean;
    note?: string;
  }>;
  lastCalculatedAt: string;
}

export interface ConversionEventRecord {
  id: string; // Unique Event ID & Idempotency Key
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  platform: ConversionPlatform;
  eventName: string; // e.g. 'Qualified Lead', 'Schedule', 'Won Customer'
  crmStage: string;
  timestamp: string;
  value: number;
  currency: string;
  gclid?: string;
  fbclid?: string;
  hashedEmail?: string;
  hashedPhone?: string;
  status: ConversionEventStatus;
  sentAt?: string;
  responsePayload?: Record<string, any>;
  errorMessage?: string;
  retryCount: number;
  attributionData?: Partial<LeadAttribution>;
  isOfflineConversion: boolean;
}

export interface ConversionStageMapping {
  id: string;
  crmStage: string;
  googleAdsAction: string;
  googleAdsEnabled: boolean;
  metaEvent: string;
  metaEnabled: boolean;
  conversionValue: number;
  valueType: 'fixed' | 'dynamic' | 'deal_value';
  qualityThreshold: number; // minimum quality score required to send conversion
}

export interface ConversionTrackingSettings {
  googleAds: {
    enabled: boolean;
    customerId: string;
    conversionActionId: string;
    conversionActionName: string;
    developerToken: string;
    enhancedConversionsEnabled: boolean;
    offlineConversionsEnabled: boolean;
    defaultCurrency: string;
    status: 'connected' | 'error' | 'unconfigured';
    lastSync?: string;
  };
  metaAds: {
    enabled: boolean;
    pixelId: string;
    datasetId: string;
    accessToken: string;
    capiEnabled: boolean;
    testEventCode?: string;
    defaultCurrency: string;
    status: 'connected' | 'error' | 'unconfigured';
    lastSync?: string;
  };
  stageMappings: ConversionStageMapping[];
  qualityScoringRules: {
    validPhone: number;
    validEmail: number;
    contacted: number;
    callConnected: number;
    interested: number;
    qualified: number;
    appointmentBooked: number;
    converted: number;
    won: number;
    invalid: number;
    duplicate: number;
    fakeNumber: number;
    notInterested: number;
  };
  deduplicationRules: {
    preventDuplicateUploads: boolean;
    phoneDeduplication: boolean;
    emailDeduplication: boolean;
    autoDisqualifyInvalid: boolean;
  };
}

export interface CampaignQualityMetric {
  id: string;
  campaignName: string;
  platform: 'Google Ads' | 'Meta Ads' | 'Direct / Portal';
  adGroupOrSet?: string;
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  invalidLeads: number;
  duplicateLeads: number;
  spend: number;
  revenue: number;
  leadQualityRate: number; // qualifiedLeads / totalLeads
  conversionRate: number; // convertedLeads / totalLeads
  costPerLead: number;
  costPerQualifiedLead: number;
  costPerConversion: number;
  roas: number;
}

export type CustomFieldType = 
  | 'text' 
  | 'number' 
  | 'dropdown' 
  | 'date' 
  | 'boolean' 
  | 'phone' 
  | 'email' 
  | 'currency' 
  | 'textarea' 
  | 'url' 
  | 'multiselect';

export interface CustomFieldDef {
  id: string;
  name: string;
  label: string;
  type: CustomFieldType;
  options?: string[];
  required: boolean;
  isHidden?: boolean;
  isPrimary?: boolean;
  primarySlot?: 'H1' | 'H2' | null;
  createdOn?: string;
  lastModified?: string;
  description?: string;
  placeholder?: string;
  isUnique?: boolean;
  showInQuickAdd?: boolean;
  category?: 'Primary' | 'Contact' | 'Academic/Career' | 'General' | 'Custom';
}

export interface ActivityLog {
  id: string;
  leadId: string;
  type: 'call' | 'whatsapp' | 'email' | 'sms' | 'stage_change' | 'note' | 'task' | 'ai_score' | 'webhook';
  title: string;
  description: string;
  timestamp: string;
  agentId?: string;
  agentName?: string;
  metadata?: Record<string, any>;
}

export interface CallRecord {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  agentId: string;
  agentName: string;
  type: 'incoming' | 'outgoing' | 'missed' | 'outbound' | string;
  durationSeconds: number;
  recordingUrl?: string;
  disposition: LeadStatus | string;
  notes?: string;
  callNotes?: string;
  assigneeRemarks?: string;
  assigneeUpdatedAt?: string;
  timestamp: string;
  transcript?: string;
  aiSummary?: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative' | 'Escalation' | string;
  tags?: string[];
}

export interface WhatsAppMessage {
  id: string;
  leadId: string;
  direction: 'inbound' | 'outbound';
  channel: 'whatsapp' | 'instagram' | 'facebook' | 'email' | 'sms';
  content: string;
  mediaUrl?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  templateId?: string;
  isBot?: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  body: string;
  variables: string[];
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  targetSegment: string;
  totalAudience: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  replyCount: number;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED';
  scheduledAt: string;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  triggerEvent: string;
  condition: string;
  actions: string[];
  isActive: boolean;
  executedCount: number;
}

export type StageCategory = 'initial' | 'active' | 'closed';

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  category?: StageCategory;
  winProbability?: number;
  dealsCount?: number;
  totalValue?: number;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  password?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Sales Manager' | 'Telecaller' | 'Senior Counselor' | 'Admissions Lead' | 'Counselor' | string;
  status: 'online' | 'on_call' | 'break' | 'offline';
  avatar: string;
  totalCallsToday: number;
  talkTimeMinutes: number;
  convertedLeadsCount: number;
  revenueGenerated: number;
  responseTimeMinutes: number;
  currentActiveCallLeadId?: string;
  permissionTemplateId?: string;
  isAdmin?: boolean;
  tenantId?: string;
  companyName?: string;
}

export function isAgentAdmin(agent?: Agent | null): boolean {
  if (!agent) return false;
  const roleName = (agent.role || '').toLowerCase();
  const emailName = (agent.email || '').toLowerCase();
  return (
    agent.isAdmin === true ||
    roleName.includes('admin') ||
    roleName.includes('owner') ||
    emailName.includes('admin')
  );
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  city: string;
  state: string;
  source: LeadSource;
  status: LeadStatus;
  pipelineStageId: string;
  dealValue: number;
  ownerAgentId: string;
  ownerAgentName: string;
  createdAt: string;
  updatedAt: string;
  aiScore: number;
  tenantId?: string;
  aiRating: AIRating;
  aiReasoning: string;
  customFields: Record<string, any>;
  tags: string[];
  notes: string;
  rating?: number;
  altPhone?: string;
  batch?: string;
  dateOfJoining?: string;
  address?: string;
  age?: number | string;
  followUpAt?: string;
  lastContactedAt?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  costPerLead?: number;
  costPerAcquisition?: number;
  
  // Extended TeleCRM Lead Ingestion & Conversion Attribution attributes
  attribution?: LeadAttribution;
  qualityScore?: LeadQualityScore;
  conversionEvents?: ConversionEventRecord[];
  isDuplicate?: boolean;
  isInvalid?: boolean;
  gclid?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  conversionStatusSummary?: {
    googleLeadSent?: boolean;
    googleQualifiedSent?: boolean;
    googleConvertedSent?: boolean;
    metaLeadSent?: boolean;
    metaQualifiedSent?: boolean;
    metaScheduleSent?: boolean;
    metaPurchaseSent?: boolean;
  };
  
  alternatePhone?: string;
  gender?: string;
  dateOfBirth?: string;
  campaignName?: string;
  adSetName?: string;
  adName?: string;
  country?: string;
  pincode?: string;
  occupation?: string;
  requirement?: string;
  priority?: 'Hot' | 'Warm' | 'Cold';
  followUpNotes?: string;
  reminderEnabled?: boolean;
  whatsappOptIn?: boolean;
  smsOptIn?: boolean;
  emailOptIn?: boolean;
  attachments?: { name: string; size: string; type: string; url?: string }[];
}

export interface DocumentQuote {
  id: string;
  leadId: string;
  leadName: string;
  leadCompany: string;
  docType: 'Quotation' | 'Invoice' | 'Proposal' | 'NDA';
  docNumber: string;
  items: { description: string; qty: number; unitPrice: number; amount: number }[];
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Signed' | 'Paid';
  createdAt: string;
  validUntil: string;
  signedAt?: string;
  signatureUrl?: string;
}

export interface HourlyMetric {
  hour: string;
  totalCalls: number;
  connectedCalls: number;
  leadsCaptured: number;
  conversions: number;
  revenue: number;
}

export interface VoiceBotSession {
  id: string;
  leadId: string;
  leadName: string;
  phone: string;
  status: 'In Progress' | 'Completed' | 'Failed';
  transcript: { speaker: 'AI VoiceBot' | 'Lead'; text: string; time: string }[];
  qualificationScore: number;
  budgetIdentified?: string;
  purchaseIntent?: 'High' | 'Medium' | 'Low';
  recommendedNextAction: string;
}

export type FilterField = 
  | 'createdAt'
  | 'status'
  | 'source'
  | 'aiRating'
  | 'ownerAgentId'
  | 'dealValue'
  | 'city'
  | 'tags'
  | 'name'
  | 'phone';

export type FilterOperator = 
  | 'is'
  | 'is_not'
  | 'any'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'greater_than'
  | 'less_than'
  | 'contains';

export interface FilterCondition {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

export interface SortConfig {
  field: 'createdAt' | 'name' | 'dealValue' | 'aiScore' | 'updatedAt';
  direction: 'newest' | 'oldest' | 'highest' | 'lowest' | 'asc' | 'desc';
}

export interface SavedViewDef {
  id: string;
  name: string;
  conditions: FilterCondition[];
  sort: SortConfig;
  isPreset?: boolean;
}

export interface PermissionRights {
  // Access Rights
  leads: boolean;
  salesform: boolean;
  team: boolean;
  permissions: boolean;
  calling: boolean;
  reports: boolean;
  automations: boolean;
  tasks: boolean;
  billings: boolean;
  integrations: boolean;
  aiAgents: boolean;

  // View Rights
  leadView: boolean;
  dashboardView: boolean;
  leadsTableView: boolean;

  // Templates Rights
  whatsappTemplates: boolean;
  smsTemplates: boolean;
  emailTemplates: boolean;

  // Embedded Apps
  embeddedApps: boolean;
}

export interface PermissionTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isRoot?: boolean;
  assignedCount: number;
  assignedAgents: string[]; // Agent IDs
  lastModifiedOn: string;
  lastModifiedBy?: string;
  createdOn?: string;
  createdBy?: string;
  rights: PermissionRights;
}

export interface TaskTypeCategory {
  id: string;
  name: string;
  color?: string;
  isBuiltIn?: boolean;
  createdAt?: string;
}

export interface CrmTask {
  id: string;
  title: string;
  description: string;
  assigneeAgentId: string;
  assigneeAgentName: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed' | 'Rejected';
  createdAt: string;
  createdByAdminId?: string;
  taskValue?: number;
  category?: string;
  leadId?: string;
  leadName?: string;
}

export function getCurrencySymbol(code: string = 'INR'): string {
  switch (code) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'AED': return 'AED ';
    case 'INR':
    default: return '₹';
  }
}

export function formatDealValue(amount: number | string = 0, currencyCode: string = 'INR'): string {
  const num = Number(amount) || 0;
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${num.toLocaleString()}`;
}

export function formatDealValueCompact(amount: number = 0, currencyCode: string = 'INR'): string {
  const symbol = getCurrencySymbol(currencyCode);
  if (amount >= 1000000) return `${symbol}${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(0)}k`;
  return `${symbol}${amount.toLocaleString()}`;
}
