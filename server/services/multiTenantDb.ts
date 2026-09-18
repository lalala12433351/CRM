import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface ClientTenant {
  tenantId: string;
  companyName: string;
  ownerEmail: string;
  ownerPhone?: string;
  companyDescription?: string;
  businessType?: string;
  businessTypeOther?: string;
  referralSource?: string;
  referralSourceOther?: string;
  status: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TenantLead {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  city?: string;
  state?: string;
  source: string;
  status: string;
  pipelineStageId: string;
  dealValue: number;
  ownerAgentId: string;
  ownerAgentName: string;
  managerId?: string;
  aiScore?: number;
  aiRating?: string;
  aiReasoning?: string;
  notes?: string;
  lostReason?: string;
  customFields?: Record<string, any>;
  tags?: string[];
  gclid?: string;
  fbclid?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type UserRole = 'Admin' | 'Manager' | 'Telecaller';

export interface TenantAgent {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole | string; // Keep string to support legacy roles temporarily
  permission?: string;
  companyName: string;
  isAdmin: boolean;
  status: string;
  avatar?: string;
  totalCallsToday?: number;
  talkTimeMinutes?: number;
  convertedLeadsCount?: number;
  revenueGenerated?: number;
  responseTimeMinutes?: number;
}

export interface TenantStage {
  id: string;
  tenantId: string;
  name: string;
  color: string;
  order: number;
  category: 'initial' | 'active' | 'closed';
  winProbability: number;
  isActive?: boolean;
}

export interface TenantFieldSetting {
  id: string;
  tenantId: string;
  name: string;
  label: string;
  type: string;
  required?: boolean;
  isPrimary?: boolean;
  primarySlot?: string;
  category?: string;
  options?: string[];
  isHidden?: boolean;
  displayOrder?: number;
  createdOn?: string;
  lastModified?: string;
}

export interface TenantTask {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  assigneeAgentId: string;
  assigneeAgentName: string;
  priority: 'High' | 'Medium' | 'Low' | 'high' | 'medium' | 'low';
  status: 'Pending' | 'Completed' | 'Rejected' | 'pending' | 'completed' | 'rejected' | 'cancelled' | 'Cancelled';
  dueDate: string;
  taskValue?: number;
  createdAt: string;
  createdByAdminId?: string;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
}

export interface TenantIntegration {
  id: string;
  tenantId: string;
  integrationName: string;
  isConnected: boolean;
  credentials: Record<string, any>;
  syncFrequency?: string;
  lastSyncAt?: string;
  updatedAt?: string;
}

export interface TenantActivity {
  id: string;
  tenantId: string;
  leadId?: string;
  agentId?: string;
  agentName?: string;
  type: string;
  title?: string;
  description?: string;
  timestamp?: string;
  action?: string;
  details?: string;
  createdAt?: string;
}

export interface TenantCall {
  id: string;
  tenantId: string;
  leadId?: string;
  leadName: string;
  leadPhone: string;
  callStart: string;
  callEnd: string;
  durationSeconds: number;
  agentId?: string;
  agentName?: string;
  assigneeName: string;
  callType?: 'incoming' | 'outgoing' | 'missed' | 'outbound' | string;
  disposition?: string;
  recordingUrl?: string;
  callNotes?: string;
  assigneeRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantWorkflow {
  id: string;
  tenantId: string;
  name: string;
  hasDraft?: boolean;
  event: string;
  eventIcon?: string;
  status: boolean;
  statusMeta: string;
  totalRuns: number;
  last24hRuns: number;
  last24hFailures: number;
  isDraft: boolean;
  nodes?: any[];
  edges?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantApiTemplate {
  id: string;
  tenantId: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpointUrl: string;
  timeoutSeconds?: number;
  headers: { key: string; value: string }[];
  bodyPayload?: string;
  queryParams?: { key: string; value: string }[];
  authConfig?: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKeyKey?: string;
    apiKeyValue?: string;
    apiKeyLocation?: 'header' | 'query';
  };
  variablesUsed?: string;
  workflow?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantAction {
  id: string;
  tenantId: string;
  actionType: string;
  name?: string;
  teamMember?: string;
  targetTeamMember?: string;
  header?: string;
  body?: string;
  url?: string;
  config?: Record<string, any>;
  variablesUsed?: string[];
  workflowId?: string;
  nodeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FacebookPageIntegration {
  id: string;
  clientId: string;
  pageId: string;
  pageName: string;
  accessToken: string;
  status: 'active' | 'disconnected' | 'revoked' | string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantCampaign {
  id: string;
  tenantId: string;
  name: string;
  handle: string;
  description?: string;
  source?: string;
  formId?: string;
  formName?: string;
  pageId?: string;
  pageName?: string;
  status?: 'active' | 'paused' | 'archived';
  distributionRule?: 'round_robin' | 'all' | 'direct';
  assignedAgentIds?: string[];
  assignedAgentNames?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface LocalStoreSchema {
  tenants: Record<string, ClientTenant>;
  agents: Record<string, TenantAgent[]>;
  leads: Record<string, TenantLead[]>;
  stages: Record<string, TenantStage[]>;
  fields: Record<string, TenantFieldSetting[]>;
  tasks: Record<string, TenantTask[]>;
  calls: Record<string, TenantCall[]>;
  integrations: Record<string, TenantIntegration[]>;
  facebookPages: Record<string, FacebookPageIntegration[]>;
  activities: Record<string, TenantActivity[]>;
  lostReasons: Record<string, string[]>;
  workflows: Record<string, TenantWorkflow[]>;
  templates: Record<string, TenantApiTemplate[]>;
  actions: Record<string, TenantAction[]>;
  campaigns: Record<string, TenantCampaign[]>;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'multi_tenant_store.json');

const DEFAULT_WORKFLOWS: Omit<TenantWorkflow, 'tenantId'>[] = [];

const DEFAULT_STAGES: Omit<TenantStage, 'tenantId'>[] = [
  { id: 'stage-1', name: 'Fresh', color: '#3B82F6', order: 1, category: 'initial', winProbability: 10, isActive: true },
  { id: 'stage-2', name: 'Contacted', color: '#8B5CF6', order: 2, category: 'active', winProbability: 25, isActive: true },
  { id: 'stage-3', name: 'Follow Up', color: '#F59E0B', order: 3, category: 'active', winProbability: 40, isActive: true },
  { id: 'stage-4', name: 'Demo Scheduled', color: '#06B6D4', order: 4, category: 'active', winProbability: 60, isActive: true },
  { id: 'stage-5', name: 'Proposal Sent', color: '#10B981', order: 5, category: 'active', winProbability: 80, isActive: true },
  { id: 'stage-6', name: 'Converted', color: '#059669', order: 6, category: 'closed', winProbability: 100, isActive: true },
  { id: 'stage-7', name: 'Lost', color: '#EF4444', order: 7, category: 'closed', winProbability: 0, isActive: true },
];

const DEFAULT_FIELDS: Omit<TenantFieldSetting, 'tenantId'>[] = [
  { id: 'f-batch', name: 'batch', label: 'Batch', type: 'text', required: false, category: 'General', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-doj', name: 'date_of_joining', label: 'Date of Joining', type: 'date', required: false, category: 'General', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-city', name: 'city', label: 'City', type: 'text', required: false, category: 'Contact', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-addr', name: 'address', label: 'Address', type: 'text', required: false, category: 'Contact', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-age', name: 'age', label: 'Age', type: 'text', required: false, category: 'General', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-dob', name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: false, category: 'General', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-h1', name: 'name', label: 'Name', type: 'text', required: true, isPrimary: true, primarySlot: 'H1', category: 'Primary', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-h2', name: 'phone', label: 'Number', type: 'phone', required: true, isPrimary: true, primarySlot: 'H2', category: 'Primary', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-status', name: 'status', label: 'Status', type: 'dropdown', options: ['Fresh', 'Contacted', 'Follow Up', 'Demo Scheduled', 'Proposal Sent', 'Converted', 'Lost'], required: true, isPrimary: true, category: 'Primary', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-deal-val', name: 'deal_value', label: 'Deal Value (₹)', type: 'currency', required: false, category: 'General', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-source', name: 'source', label: 'Lead Source', type: 'dropdown', options: ['Facebook Ads', 'Google Ads', 'Meta Ads', 'IndiaMart', 'JustDial', 'WhatsApp', 'Website Inbound', 'Instagram', 'Referral', 'Direct'], required: false, isPrimary: true, category: 'Primary', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-company', name: 'company', label: 'Company', type: 'text', required: false, category: 'General', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-email', name: 'email', label: 'Email', type: 'email', required: false, category: 'Contact', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-state', name: 'state', label: 'State', type: 'text', required: false, category: 'Contact', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-notes', name: 'special_remarks', label: 'Special Remarks / Notes', type: 'textarea', required: false, category: 'General', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' }
];

const DEFAULT_LOST_REASONS = [
  'No Need',
  'Unable to Connect',
  'Budget Issues',
  'Product does not fit need',
  'Lost to competitor',
  'Unknown Reason',
  'Not eligible',
  'Junk'
];

export class MultiTenantDatabase {
  private store: LocalStoreSchema = {
    tenants: {},
    agents: {},
    leads: {},
    stages: {},
    fields: {},
    tasks: {},
    integrations: {},
    facebookPages: {},
    activities: {},
    lostReasons: {},
    calls: {},
    workflows: {},
    templates: {},
    actions: {},
    campaigns: {}
  };

  constructor() {
    this.initLocalStore();
    this.seedDefaultTenantIfNeeded();
  }

  private initLocalStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        this.store = {
          tenants: parsed.tenants || {},
          agents: parsed.agents || {},
          leads: parsed.leads || {},
          stages: parsed.stages || {},
          fields: parsed.fields || {},
          tasks: parsed.tasks || {},
          integrations: parsed.integrations || {},
          facebookPages: parsed.facebookPages || {},
          activities: parsed.activities || {},
          lostReasons: parsed.lostReasons || {},
          calls: parsed.calls || {},
          workflows: parsed.workflows || {},
          templates: parsed.templates || {},
          actions: parsed.actions || {},
          campaigns: parsed.campaigns || {}
        };
        // Normalize any legacy 'Master Admin' roles in stored agents to 'Admin'
        for (const tid in this.store.agents) {
          if (Array.isArray(this.store.agents[tid])) {
            this.store.agents[tid].forEach((ag) => {
              if (ag.role === 'Master Admin') {
                ag.role = 'Admin';
              }
            });
          }
        }
      } else {
        this.saveStore();
      }
    } catch (e) {
      logger.warn('Failed to load local tenant store, initializing in-memory store:', e);
    }
  }

  private saveStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (e) {
      logger.warn('Failed to write local tenant store:', e);
    }
  }

  private seedDefaultTenantIfNeeded() {
    const defaultTenantId = process.env.DEFAULT_TENANT_ID || 'default_tenant';
    if (!this.store.tenants[defaultTenantId] && Object.keys(this.store.tenants).length === 0) {
      this.store.tenants[defaultTenantId] = {
        tenantId: defaultTenantId,
        companyName: 'Default Workspace',
        ownerEmail: 'admin@company.com',
        ownerPhone: '+91 98000 00000',
        companyDescription: 'Enterprise CRM Workspace',
        businessType: 'General Business',
        status: 'ACTIVE',
        settings: { currency: 'INR', autoDialer: true, whatsappCrm: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.store.agents[defaultTenantId] = [
        {
          id: 'agent-admin',
          tenantId: defaultTenantId,
          name: 'System Administrator',
          email: 'admin@company.com',
          phone: '+91 98000 00000',
          role: 'Admin',
          companyName: 'Default Workspace',
          isAdmin: true,
          status: 'online',
          avatar: '',
          totalCallsToday: 0,
          talkTimeMinutes: 0,
          convertedLeadsCount: 0,
          revenueGenerated: 0,
          responseTimeMinutes: 1.0
        }
      ];

      this.store.stages[defaultTenantId] = DEFAULT_STAGES.map((s) => ({ ...s, tenantId: defaultTenantId }));
      this.store.fields[defaultTenantId] = DEFAULT_FIELDS.map((f) => ({ ...f, tenantId: defaultTenantId }));
      this.store.leads[defaultTenantId] = [];
      this.store.tasks[defaultTenantId] = [];
      this.store.integrations[defaultTenantId] = [];
      this.store.activities[defaultTenantId] = [];

      this.saveStore();
    }
  }

  // =========================================================================
  // 1. TENANT MANAGEMENT
  // =========================================================================
  public async createTenant(data: {
    tenantId: string;
    companyName: string;
    ownerEmail: string;
    ownerPhone?: string;
    adminName: string;
    companyDescription?: string;
    businessType?: string;
    businessTypeOther?: string;
    referralSource?: string;
    referralSourceOther?: string;
  }): Promise<ClientTenant> {
    const tenant: ClientTenant = {
      tenantId: data.tenantId,
      companyName: data.companyName,
      ownerEmail: data.ownerEmail,
      ownerPhone: data.ownerPhone || '',
      companyDescription: data.companyDescription || '',
      businessType: data.businessType || '',
      businessTypeOther: data.businessTypeOther || '',
      referralSource: data.referralSource || '',
      referralSourceOther: data.referralSourceOther || '',
      status: 'ACTIVE',
      settings: { currency: 'INR', autoDialer: true, whatsappCrm: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.tenants[data.tenantId] = tenant;

    // Seed tenant admin user
    const adminAgent: TenantAgent = {
      id: `agent_${Date.now().toString().slice(-6)}`,
      tenantId: data.tenantId,
      name: data.adminName,
      email: data.ownerEmail,
      phone: data.ownerPhone || '+91 98000 00000',
      role: 'Admin',
      companyName: data.companyName,
      isAdmin: true,
      status: 'online',
      avatar: '',
      totalCallsToday: 0,
      talkTimeMinutes: 0,
      convertedLeadsCount: 0,
      revenueGenerated: 0,
      responseTimeMinutes: 1.0
    };

    this.store.agents[data.tenantId] = [adminAgent];
    this.store.stages[data.tenantId] = DEFAULT_STAGES.map((s) => ({ ...s, tenantId: data.tenantId }));
    this.store.fields[data.tenantId] = DEFAULT_FIELDS.map((f) => ({ ...f, tenantId: data.tenantId }));
    this.store.leads[data.tenantId] = [];
    this.store.tasks[data.tenantId] = [];
    this.store.integrations[data.tenantId] = [];
    this.store.activities[data.tenantId] = [];

    this.saveStore();

    logger.info(`[MultiTenantDb] Tenant created & initialized: ${tenant.companyName} (${tenant.tenantId})`);
    return tenant;
  }

  public getTenantByOwnerEmail(email: string): ClientTenant | undefined {
    const cleanEmail = (email || '').toLowerCase().trim();
    return Object.values(this.store.tenants).find(
      (t) => t.ownerEmail && t.ownerEmail.toLowerCase().trim() === cleanEmail
    );
  }

  public getAgentByEmail(email: string): TenantAgent | undefined {
    const cleanEmail = (email || '').toLowerCase().trim();
    for (const agentList of Object.values(this.store.agents)) {
      const match = agentList.find((a) => a.email && a.email.toLowerCase().trim() === cleanEmail);
      if (match) return match;
    }
    return undefined;
  }

  public getTenant(tenantId: string): ClientTenant | undefined {
    return this.store.tenants[tenantId];
  }

  // =========================================================================
  // 2. LEADS CRUD (STRICTLY SCOPED TO tenantId)
  // =========================================================================
  public async getLeads(tenantId: string, agentId?: string, isAdmin?: boolean): Promise<TenantLead[]> {
    const tenantLeads = [...(this.store.leads[tenantId] || [])];
    
    // Strictly sort newest created first (latest timestamp on top)
    tenantLeads.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

    if (!isAdmin && agentId) {
      return tenantLeads.filter(
        (l) => l.ownerAgentId === agentId || l.ownerAgentName?.toLowerCase().includes(agentId.toLowerCase())
      );
    }
    return tenantLeads;
  }

  public async saveLead(tenantId: string, leadData: Partial<TenantLead>): Promise<TenantLead> {
    if (!this.store.leads) {
      this.store.leads = {};
    }
    if (!this.store.leads[tenantId]) {
      this.store.leads[tenantId] = [];
    }

    // 1. Locate the exact lead by id (first in current tenant, then across all tenant buckets)
    let targetTenantId = tenantId;
    let existingIndex = this.store.leads[targetTenantId].findIndex((l) => l.id === leadData.id);

    if (existingIndex === -1 && leadData.tenantId && this.store.leads[leadData.tenantId]) {
      const idx = this.store.leads[leadData.tenantId].findIndex((l) => l.id === leadData.id);
      if (idx >= 0) {
        targetTenantId = leadData.tenantId;
        existingIndex = idx;
      }
    }

    if (existingIndex === -1 && leadData.id) {
      for (const tId of Object.keys(this.store.leads)) {
        const idx = this.store.leads[tId].findIndex((l) => l.id === leadData.id);
        if (idx >= 0) {
          targetTenantId = tId;
          existingIndex = idx;
          break;
        }
      }
    }

    // 2. Intelligent Duplicate Authentication (by Meta leadgen ID, normalized phone, or email)
    const normalizePhone = (p?: string) => (p || '').replace(/\D/g, '').slice(-10);
    const cleanLeadPhone = normalizePhone(leadData.phone);
    const cleanLeadEmail = (leadData.email || '').trim().toLowerCase();
    const metaLeadgenId = leadData.customFields?.meta_leadgen_id || (leadData.id?.startsWith('meta-lead-') ? leadData.id.replace('meta-lead-', '') : null);

    if (existingIndex === -1 && this.store.leads[targetTenantId]) {
      const dupIndex = this.store.leads[targetTenantId].findIndex((l) => {
        // A. Match by meta_leadgen_id
        if (metaLeadgenId && (l.customFields?.meta_leadgen_id === metaLeadgenId || l.id === `meta-lead-${metaLeadgenId}`)) {
          return true;
        }
        // B. Match by normalized 10-digit phone number (skip dummy numbers)
        if (cleanLeadPhone && cleanLeadPhone.length >= 10 && cleanLeadPhone !== '0000000000' && !cleanLeadPhone.includes('9876500000')) {
          const existingPhone = normalizePhone(l.phone);
          if (existingPhone && existingPhone === cleanLeadPhone) {
            return true;
          }
        }
        // C. Match by email (skip dummy placeholders)
        if (
          cleanLeadEmail &&
          cleanLeadEmail.includes('@') &&
          !cleanLeadEmail.includes('test_lead@') &&
          !cleanLeadEmail.includes('@meta.com') &&
          !cleanLeadEmail.includes('example.com')
        ) {
          const existingEmail = (l.email || '').trim().toLowerCase();
          if (existingEmail && existingEmail === cleanLeadEmail) {
            return true;
          }
        }
        return false;
      });

      if (dupIndex >= 0) {
        existingIndex = dupIndex;
      }
    }

    const now = new Date().toISOString();
    
    // Resolve and preserve accurate ISO timestamp
    let resolvedCreatedAt = now;
    if (leadData.createdAt && leadData.createdAt !== 'Just Now' && leadData.createdAt !== 'Just now') {
      if (leadData.createdAt.includes('ago')) {
        const match = leadData.createdAt.match(/(\d+)\s*(d|day|days|h|hour|hours|m|min|minute|minutes)/i);
        if (match) {
          const val = parseInt(match[1], 10);
          const unit = match[2].toLowerCase();
          const d = new Date();
          if (unit.startsWith('d')) d.setDate(d.getDate() - val);
          else if (unit.startsWith('h')) d.setHours(d.getHours() - val);
          else if (unit.startsWith('m')) d.setMinutes(d.getMinutes() - val);
          resolvedCreatedAt = d.toISOString();
        } else {
          resolvedCreatedAt = now;
        }
      } else {
        const parsed = new Date(leadData.createdAt).getTime();
        resolvedCreatedAt = !isNaN(parsed) ? new Date(parsed).toISOString() : now;
      }
    } else if (leadData.id) {
      const numMatch = leadData.id.match(/(\d{10,14})/);
      if (numMatch) {
        const ts = parseInt(numMatch[1], 10);
        if (!isNaN(ts) && ts > 1500000000000 && ts < 2500000000000) {
          resolvedCreatedAt = new Date(ts).toISOString();
        }
      }
    }

    let savedLead: TenantLead;

    if (existingIndex >= 0 && this.store.leads[targetTenantId]) {
      const existing = this.store.leads[targetTenantId][existingIndex];
      const preservedCreatedAt = (existing.createdAt && existing.createdAt !== 'Just Now' && existing.createdAt !== 'Just now')
        ? existing.createdAt
        : resolvedCreatedAt;

      // Merge tags
      const mergedTags = Array.from(new Set([...(existing.tags || []), ...(leadData.tags || []), 'Meta Re-submission']));

      // Add re-submission activity record
      const existingActivities = existing.activities || [];
      const newActivity = {
        id: `act-${Date.now()}`,
        leadId: existing.id,
        agentId: existing.ownerAgentId || 'agent-admin',
        agentName: existing.ownerAgentName || 'System',
        type: 'note' as const,
        title: 'Meta Lead Form Re-submission',
        description: `Lead re-submitted form on ${new Date().toLocaleString()}`,
        timestamp: now
      };

      savedLead = {
        ...existing,
        ...leadData,
        id: existing.id, // Preserve existing ID
        name: leadData.name && leadData.name !== 'Meta Test Lead' && !leadData.name.includes('<test lead') ? leadData.name : existing.name,
        phone: leadData.phone && !leadData.phone.includes('98765 00000') ? leadData.phone : existing.phone,
        email: leadData.email && !leadData.email.includes('test_lead@') ? leadData.email : existing.email,
        customFields: {
          ...(existing.customFields || {}),
          ...(leadData.customFields || {})
        },
        tags: mergedTags,
        activities: [newActivity, ...existingActivities],
        tenantId: targetTenantId,
        createdAt: preservedCreatedAt,
        updatedAt: now
      };
      this.store.leads[targetTenantId][existingIndex] = savedLead;
      console.log(`\n🔄 [META DUPLICATE MERGED] -> Name: "${savedLead.name}" | Existing ID: ${savedLead.id} | Phone: ${savedLead.phone}`);
    } else {
      savedLead = {
        id: leadData.id || `lead-${Date.now()}`,
        tenantId: targetTenantId,
        name: leadData.name || 'New Inbound Lead',
        phone: leadData.phone || '',
        email: leadData.email || '',
        company: leadData.company || '',
        city: leadData.city || '',
        state: leadData.state || '',
        source: leadData.source || 'Manual Entry',
        status: leadData.status || 'Fresh',
        pipelineStageId: leadData.pipelineStageId || 'stage-1',
        dealValue: leadData.dealValue !== undefined ? Number(leadData.dealValue) : 0,
        ownerAgentId: leadData.ownerAgentId || leadData.assignee_id || 'agent-admin',
        ownerAgentName: leadData.ownerAgentName || leadData.assignee_name || 'Admin',
        aiScore: leadData.aiScore || 80,
        aiRating: leadData.aiRating || 'Hot',
        aiReasoning: leadData.aiReasoning || 'Direct CRM capture',
        notes: leadData.notes || '',
        lostReason: leadData.lostReason || undefined,
        customFields: leadData.customFields || {},
        tags: leadData.tags || [],
        ...leadData,
        createdAt: resolvedCreatedAt,
        updatedAt: now
      };
      this.store.leads[targetTenantId].unshift(savedLead);
      console.log(`\n📥 [CRM NEW LEAD SAVED] -> Name: "${savedLead.name}" | Phone: ${savedLead.phone} | Source: "${savedLead.source}" | Tenant: ${targetTenantId}`);
    }

    // Keep store strictly sorted newest created first
    if (this.store.leads[targetTenantId]) {
      this.store.leads[targetTenantId].sort((a, b) => {
        const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return timeB - timeA;
      });
    }

    this.saveStore();
    return savedLead;
  }

  public async deleteLead(tenantId: string, leadId: string): Promise<boolean> {
    if (!this.store.leads[tenantId]) return false;
    const initialLen = this.store.leads[tenantId].length;
    this.store.leads[tenantId] = this.store.leads[tenantId].filter((l) => l.id !== leadId);
    const deleted = this.store.leads[tenantId].length < initialLen;
    if (deleted) this.saveStore();
    return deleted;
  }

  // =========================================================================
  // 3. TEAM MEMBERS / AGENTS (STRICTLY SCOPED TO tenantId)
  // =========================================================================
  public async getAgents(tenantId: string): Promise<TenantAgent[]> {
    if (!this.store.agents[tenantId] || this.store.agents[tenantId].length === 0) {
      const defaultAgents: TenantAgent[] = [
        {
          id: 'agent-root',
          tenantId,
          name: 'Super Admin (Root)',
          email: 'root@company.com',
          phone: '+91 99000 00001',
          role: 'Root',
          companyName: 'Default Workspace',
          isAdmin: true,
          status: 'online',
          avatar: '',
          totalCallsToday: 0,
          talkTimeMinutes: 0,
          convertedLeadsCount: 0,
          revenueGenerated: 0,
          responseTimeMinutes: 1.0
        },
        {
          id: 'agent-admin',
          tenantId,
          name: 'System Administrator',
          email: 'admin@company.com',
          phone: '+91 98000 00000',
          role: 'Admin',
          companyName: 'Default Workspace',
          isAdmin: true,
          status: 'online',
          avatar: '',
          totalCallsToday: 0,
          talkTimeMinutes: 0,
          convertedLeadsCount: 0,
          revenueGenerated: 0,
          responseTimeMinutes: 1.0
        },
        {
          id: 'agent-mgr',
          tenantId,
          name: 'Vikram Singh',
          email: 'vikram.manager@company.com',
          phone: '+91 98111 22334',
          role: 'Manager',
          companyName: 'Default Workspace',
          isAdmin: false,
          status: 'online',
          avatar: '',
          totalCallsToday: 12,
          talkTimeMinutes: 45,
          convertedLeadsCount: 5,
          revenueGenerated: 120000,
          responseTimeMinutes: 2.0
        },
        {
          id: 'agent-caller',
          tenantId,
          name: 'Rahul Sharma',
          email: 'rahul.caller@company.com',
          phone: '+91 98222 33445',
          role: 'Caller',
          companyName: 'Default Workspace',
          isAdmin: false,
          status: 'online',
          avatar: '',
          totalCallsToday: 28,
          talkTimeMinutes: 110,
          convertedLeadsCount: 8,
          revenueGenerated: 85000,
          responseTimeMinutes: 1.5
        },
        {
          id: 'agent-marketing',
          tenantId,
          name: 'Priya Patel',
          email: 'priya.marketing@company.com',
          phone: '+91 98333 44556',
          role: 'Marketing_user',
          companyName: 'Default Workspace',
          isAdmin: false,
          status: 'online',
          avatar: '',
          totalCallsToday: 5,
          talkTimeMinutes: 18,
          convertedLeadsCount: 2,
          revenueGenerated: 35000,
          responseTimeMinutes: 2.5
        }
      ];
      this.store.agents[tenantId] = defaultAgents;
      this.saveStore();
    }
    return this.store.agents[tenantId] || [];
  }

  public async saveAgent(tenantId: string, agentData: Partial<TenantAgent>): Promise<TenantAgent> {
    if (!this.store.agents[tenantId]) {
      this.store.agents[tenantId] = [];
    }

    const index = this.store.agents[tenantId].findIndex((a) => a.id === agentData.id);
    let agent: TenantAgent;

    const defaultRole = agentData.role || 'Caller';
    const defaultPermission = agentData.permission || (agentData.isAdmin ? 'Admin' : (defaultRole === 'Marketing' ? 'Marketer' : defaultRole));

    if (index >= 0) {
      agent = {
        ...this.store.agents[tenantId][index],
        ...agentData,
        role: defaultRole,
        permission: defaultPermission,
        isAdmin: agentData.isAdmin !== undefined ? Boolean(agentData.isAdmin) : (defaultPermission.toLowerCase() === 'admin'),
        tenantId
      };
      this.store.agents[tenantId][index] = agent;
    } else {
      agent = {
        id: agentData.id || `agent-${Date.now()}`,
        tenantId,
        name: agentData.name || 'New Team Member',
        email: agentData.email || '',
        phone: agentData.phone || '',
        role: defaultRole,
        permission: defaultPermission,
        companyName: agentData.companyName || this.store.tenants[tenantId]?.companyName || 'Company',
        isAdmin: Boolean(agentData.isAdmin) || defaultPermission.toLowerCase() === 'admin',
        status: agentData.status || 'online',
        avatar: agentData.avatar || '',
        totalCallsToday: 0,
        talkTimeMinutes: 0,
        convertedLeadsCount: 0,
        revenueGenerated: 0,
        responseTimeMinutes: 1.0
      };
      this.store.agents[tenantId].push(agent);
    }

    this.saveStore();
    return agent;
  }

  public async deleteAgent(tenantId: string, agentId: string): Promise<boolean> {
    if (!this.store.agents[tenantId]) return false;
    this.store.agents[tenantId] = this.store.agents[tenantId].filter((a) => a.id !== agentId);
    this.saveStore();
    return true;
  }

  public async updateAgentProfile(
    tenantId: string,
    currentId: string,
    data: { name: string; id?: string; email?: string; phone?: string; avatar?: string }
  ): Promise<TenantAgent | null> {
    if (!this.store.agents[tenantId]) {
      this.store.agents[tenantId] = [];
    }

    const agentIndex = this.store.agents[tenantId].findIndex((a) => a.id === currentId);
    let agent: TenantAgent;

    const targetId = data.id || currentId;

    if (agentIndex >= 0) {
      agent = {
        ...this.store.agents[tenantId][agentIndex],
        id: targetId,
        name: data.name,
        email: data.email !== undefined ? data.email : this.store.agents[tenantId][agentIndex].email,
        phone: data.phone !== undefined ? data.phone : this.store.agents[tenantId][agentIndex].phone,
        avatar: data.avatar !== undefined ? data.avatar : this.store.agents[tenantId][agentIndex].avatar,
        tenantId
      };
      this.store.agents[tenantId][agentIndex] = agent;
    } else {
      agent = {
        id: targetId,
        tenantId,
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        role: 'Admin',
        companyName: this.store.tenants[tenantId]?.companyName || 'Company',
        isAdmin: true,
        status: 'online',
        avatar: data.avatar || '',
        totalCallsToday: 0,
        talkTimeMinutes: 0,
        convertedLeadsCount: 0,
        revenueGenerated: 0,
        responseTimeMinutes: 1.0
      };
      this.store.agents[tenantId].push(agent);
    }

    // If ID or name changed, update corresponding leads
    if (this.store.leads[tenantId]) {
      this.store.leads[tenantId].forEach((lead) => {
        if (lead.ownerAgentId === currentId) {
          lead.ownerAgentId = data.id;
          lead.ownerAgentName = data.name;
        }
      });
    }

    // Also update tasks
    if (this.store.tasks[tenantId]) {
      this.store.tasks[tenantId].forEach((task) => {
        if (task.assigneeAgentId === currentId) {
          task.assigneeAgentId = data.id;
          task.assigneeAgentName = data.name;
        }
      });
    }

    this.saveStore();
    return agent;
  }

  // =========================================================================
  // 4. PIPELINE STAGES (STRICTLY SCOPED TO tenantId)
  // =========================================================================
  public async getPipelines(tenantId: string): Promise<TenantStage[]> {
    if (!this.store.stages[tenantId] || this.store.stages[tenantId].length === 0) {
      this.store.stages[tenantId] = DEFAULT_STAGES.map((s) => ({ ...s, tenantId }));
      this.saveStore();
    }
    return this.store.stages[tenantId];
  }

  public async savePipelines(tenantId: string, stages: TenantStage[]): Promise<TenantStage[]> {
    this.store.stages[tenantId] = stages.map((s) => ({ ...s, tenantId }));
    this.saveStore();
    return this.store.stages[tenantId];
  }

  // =========================================================================
  // 4B. LOST REASONS (STRICTLY SCOPED TO tenantId)
  // =========================================================================
  public async getLostReasons(tenantId: string): Promise<string[]> {
    if (!this.store.lostReasons) {
      this.store.lostReasons = {};
    }
    if (!this.store.lostReasons[tenantId] || this.store.lostReasons[tenantId].length === 0) {
      this.store.lostReasons[tenantId] = [...DEFAULT_LOST_REASONS];
      this.saveStore();
    }
    return this.store.lostReasons[tenantId];
  }

  public async saveLostReasons(tenantId: string, reasons: string[]): Promise<string[]> {
    if (!this.store.lostReasons) {
      this.store.lostReasons = {};
    }
    this.store.lostReasons[tenantId] = reasons;
    this.saveStore();
    return this.store.lostReasons[tenantId];
  }

  // =========================================================================
  // 5. FIELD SETTINGS (STRICTLY SCOPED TO tenantId)
  // =========================================================================
  public async getFieldSettings(tenantId: string): Promise<TenantFieldSetting[]> {
    if (!this.store.fields[tenantId] || this.store.fields[tenantId].length === 0) {
      this.store.fields[tenantId] = DEFAULT_FIELDS.map((f) => ({ ...f, tenantId }));
      this.saveStore();
    }
    return this.store.fields[tenantId];
  }

  public async saveFieldSettings(tenantId: string, fields: TenantFieldSetting[]): Promise<TenantFieldSetting[]> {
    const now = new Date().toISOString();
    this.store.fields[tenantId] = fields.map((f) => ({
      ...f,
      tenantId,
      createdOn: f.createdOn || now,
      lastModified: f.lastModified || now
    }));
    this.saveStore();
    return this.store.fields[tenantId];
  }

  // =========================================================================
  // 6. TASKS (STRICTLY SCOPED TO tenantId)
  // =========================================================================
  public async getTasks(tenantId: string): Promise<TenantTask[]> {
    return this.store.tasks[tenantId] || [];
  }

  public async saveTask(tenantId: string, taskData: Partial<TenantTask>): Promise<TenantTask> {
    if (!this.store.tasks[tenantId]) {
      this.store.tasks[tenantId] = [];
    }

    const existingIndex = this.store.tasks[tenantId].findIndex((t) => t.id === taskData.id);
    let task: TenantTask;

    if (existingIndex >= 0) {
      task = {
        ...this.store.tasks[tenantId][existingIndex],
        ...taskData,
        tenantId
      };
      this.store.tasks[tenantId][existingIndex] = task;
    } else {
      task = {
        id: taskData.id || `task-${Date.now()}`,
        tenantId,
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        assigneeAgentId: taskData.assigneeAgentId || '',
        assigneeAgentName: taskData.assigneeAgentName || 'Unassigned',
        priority: taskData.priority || 'Medium',
        status: taskData.status || 'Pending',
        dueDate: taskData.dueDate || new Date().toISOString(),
        taskValue: Number(taskData.taskValue) || 0,
        createdAt: new Date().toISOString(),
        createdByAdminId: taskData.createdByAdminId
      };
      this.store.tasks[tenantId].unshift(task);
    }

    this.saveStore();
    return task;
  }

  public async deleteTask(tenantId: string, taskId: string): Promise<boolean> {
    if (!this.store.tasks[tenantId]) return false;
    this.store.tasks[tenantId] = this.store.tasks[tenantId].filter((t) => t.id !== taskId);
    this.saveStore();
    return true;
  }

  // =========================================================================
  // 6b. CALLS (STRICTLY SCOPED TO tenantId WITH ASSIGNEE NAME)
  // =========================================================================
  public async getCalls(tenantId: string): Promise<TenantCall[]> {
    return this.store.calls[tenantId] || [];
  }

  public async saveCall(tenantId: string, callData: Partial<TenantCall>): Promise<TenantCall> {
    if (!this.store.calls[tenantId]) {
      this.store.calls[tenantId] = [];
    }

    const existingIndex = this.store.calls[tenantId].findIndex((c) => c.id === callData.id);
    let call: TenantCall;

    if (existingIndex >= 0) {
      call = {
        ...this.store.calls[tenantId][existingIndex],
        ...callData,
        tenantId,
        updatedAt: new Date().toISOString()
      };
      this.store.calls[tenantId][existingIndex] = call;
    } else {
      const now = new Date();
      const duration = Number(callData.durationSeconds) || 0;
      const startTime = callData.callStart || now.toISOString();
      const endTime = callData.callEnd || new Date(new Date(startTime).getTime() + duration * 1000).toISOString();

      call = {
        id: callData.id || `call-${Date.now()}`,
        tenantId,
        leadId: callData.leadId,
        leadName: callData.leadName || 'Contact',
        leadPhone: callData.leadPhone || '',
        callStart: startTime,
        callEnd: endTime,
        durationSeconds: duration,
        agentId: callData.agentId,
        agentName: callData.agentName,
        assigneeName: callData.assigneeName || callData.agentName || 'Agent',
        callType: callData.callType || 'outgoing',
        disposition: callData.disposition || 'Connected',
        recordingUrl: callData.recordingUrl,
        callNotes: callData.callNotes,
        assigneeRemarks: callData.assigneeRemarks,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      this.store.calls[tenantId].unshift(call);
    }

    this.saveStore();
    return call;
  }

  public async deleteCall(tenantId: string, callId: string): Promise<boolean> {
    if (!this.store.calls[tenantId]) return false;
    this.store.calls[tenantId] = this.store.calls[tenantId].filter((c) => c.id !== callId);
    this.saveStore();
    return true;
  }

  // =========================================================================
  // 7. INTEGRATIONS CONFIG (STRICTLY SCOPED TO tenantId)
  // =========================================================================
  public async getIntegrations(tenantId: string): Promise<TenantIntegration[]> {
    return this.store.integrations[tenantId] || [];
  }

  public async saveIntegration(tenantId: string, config: Partial<TenantIntegration>): Promise<TenantIntegration> {
    if (!this.store.integrations[tenantId]) {
      this.store.integrations[tenantId] = [];
    }

    const existingIndex = this.store.integrations[tenantId].findIndex((i) => i.id === config.id);
    let item: TenantIntegration;

    if (existingIndex >= 0) {
      item = {
        ...this.store.integrations[tenantId][existingIndex],
        ...config,
        tenantId,
        updatedAt: new Date().toISOString()
      };
      this.store.integrations[tenantId][existingIndex] = item;
    } else {
      item = {
        id: config.id || `integ-${Date.now()}`,
        tenantId,
        integrationName: config.integrationName || 'Custom Integration',
        isConnected: config.isConnected !== undefined ? config.isConnected : true,
        credentials: config.credentials || {},
        syncFrequency: config.syncFrequency || 'Real-time',
        lastSyncAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.store.integrations[tenantId].push(item);
    }

    this.saveStore();
    return item;
  }

  // =========================================================================
  // 8. ACTIVITY LOGS (STRICTLY SCOPED TO tenantId)
  // =========================================================================
  public async getActivityLogs(tenantId: string): Promise<TenantActivity[]> {
    return this.store.activities[tenantId] || [];
  }

  public async logActivity(tenantId: string, activity: Partial<TenantActivity>): Promise<TenantActivity> {
    if (!this.store.activities[tenantId]) {
      this.store.activities[tenantId] = [];
    }
    const act: TenantActivity = {
      id: activity.id || `act-${Date.now()}`,
      tenantId,
      leadId: activity.leadId,
      agentId: activity.agentId,
      agentName: activity.agentName,
      type: activity.type || 'system',
      title: activity.title || 'Activity',
      description: activity.description || '',
      timestamp: activity.timestamp || new Date().toISOString()
    };
    this.store.activities[tenantId].unshift(act);
    this.saveStore();
    return act;
  }

  public async deleteActivity(tenantId: string, activityId: string): Promise<boolean> {
    let deleted = false;
    if (this.store.activities && this.store.activities[tenantId]) {
      const initial = this.store.activities[tenantId].length;
      this.store.activities[tenantId] = this.store.activities[tenantId].filter((a) => a.id !== activityId);
      if (this.store.activities[tenantId].length < initial) {
        deleted = true;
      }
    }
    // Also remove from all leads if attached inside lead.activities
    if (this.store.leads) {
      for (const tId of Object.keys(this.store.leads)) {
        for (const l of this.store.leads[tId]) {
          if (Array.isArray(l.activities)) {
            const initial = l.activities.length;
            l.activities = l.activities.filter((a: any) => a.id !== activityId);
            if (l.activities.length < initial) {
              deleted = true;
            }
          }
        }
      }
    }
    return deleted;
  }

  // =========================================================================
  // 10. WORKFLOWS (PERSISTED IN DATABASE & MULTI-TENANT STORE)
  // =========================================================================
  public async getWorkflows(tenantId: string): Promise<TenantWorkflow[]> {
    if (!this.store.workflows) {
      this.store.workflows = {};
    }
    
    // Check if store has workflows for this tenant
    if (!this.store.workflows[tenantId]) {
      this.store.workflows[tenantId] = [];
      this.saveStore();
    }
    return this.store.workflows[tenantId];
  }

  public async saveWorkflow(tenantId: string, workflowData: Partial<TenantWorkflow>): Promise<TenantWorkflow> {
    if (!this.store.workflows) {
      this.store.workflows = {};
    }
    if (!this.store.workflows[tenantId]) {
      this.store.workflows[tenantId] = [];
    }

    const index = this.store.workflows[tenantId].findIndex(
      (w) => w.id === workflowData.id || (workflowData.name && w.name && w.name.trim().toLowerCase() === workflowData.name.trim().toLowerCase())
    );

    const now = new Date().toISOString();
    let workflow: TenantWorkflow;

    if (index >= 0) {
      workflow = {
        ...this.store.workflows[tenantId][index],
        ...workflowData,
        tenantId,
        nodes: workflowData.nodes !== undefined ? workflowData.nodes : (this.store.workflows[tenantId][index].nodes || []),
        edges: workflowData.edges !== undefined ? workflowData.edges : (this.store.workflows[tenantId][index].edges || []),
        updatedAt: now
      };
      this.store.workflows[tenantId][index] = workflow;
    } else {
      workflow = {
        id: workflowData.id || `wf-${Date.now()}`,
        tenantId,
        name: workflowData.name || 'Untitled Workflow',
        hasDraft: workflowData.hasDraft || false,
        event: workflowData.event || 'Lead Creation',
        eventIcon: workflowData.eventIcon || 'globe',
        status: workflowData.status !== undefined ? Boolean(workflowData.status) : true,
        statusMeta: workflowData.statusMeta || (workflowData.isDraft ? 'Draft saved by Admin' : 'Published by Admin'),
        totalRuns: workflowData.totalRuns || 0,
        last24hRuns: workflowData.last24hRuns || 0,
        last24hFailures: workflowData.last24hFailures || 0,
        isDraft: Boolean(workflowData.isDraft),
        nodes: workflowData.nodes || [],
        edges: workflowData.edges || [],
        createdAt: workflowData.createdAt || now,
        updatedAt: now
      };
      this.store.workflows[tenantId].unshift(workflow);
    }

    this.saveStore();
    return workflow;
  }

  public async deleteWorkflow(tenantId: string, workflowId: string): Promise<boolean> {
    if (!this.store.workflows || !this.store.workflows[tenantId]) return false;
    const initialLen = this.store.workflows[tenantId].length;
    this.store.workflows[tenantId] = this.store.workflows[tenantId].filter((w) => w.id !== workflowId);
    const deleted = this.store.workflows[tenantId].length < initialLen;
    if (deleted) {
      this.saveStore();
    }
    return deleted;
  }

  public async toggleWorkflowStatus(tenantId: string, workflowId: string, explicitStatus?: boolean): Promise<TenantWorkflow | null> {
    if (!this.store.workflows || !this.store.workflows[tenantId]) return null;
    const target = this.store.workflows[tenantId].find((w) => w.id === workflowId);
    if (!target) return null;
    target.status = explicitStatus !== undefined ? Boolean(explicitStatus) : !target.status;
    (target as any).is_active = target.status;
    target.statusMeta = target.status ? 'Published by Admin' : 'Disabled by Admin';
    target.updatedAt = new Date().toISOString();
    this.saveStore();
    return target;
  }

  // =========================================================================
  // 11. API TEMPLATES (PERSISTED IN DATABASE & MULTI-TENANT STORE)
  // =========================================================================
  public async getTemplates(tenantId: string): Promise<TenantApiTemplate[]> {
    if (!this.store.templates) {
      this.store.templates = {};
    }

    if (this.store.templates[tenantId] && this.store.templates[tenantId].length > 0) {
      return this.store.templates[tenantId];
    }



    return this.store.templates[tenantId] || [];
  }

  public async saveTemplate(tenantId: string, templateData: Partial<TenantApiTemplate>): Promise<TenantApiTemplate> {
    if (!this.store.templates) {
      this.store.templates = {};
    }
    if (!this.store.templates[tenantId]) {
      this.store.templates[tenantId] = [];
    }

    const index = this.store.templates[tenantId].findIndex(
      (t) => t.id === templateData.id || (templateData.name && t.name && t.name.trim().toLowerCase() === templateData.name.trim().toLowerCase())
    );

    const now = new Date().toISOString();
    let template: TenantApiTemplate;

    if (index >= 0) {
      template = {
        ...this.store.templates[tenantId][index],
        ...templateData,
        tenantId,
        headers: templateData.headers !== undefined ? templateData.headers : (this.store.templates[tenantId][index].headers || []),
        queryParams: templateData.queryParams !== undefined ? templateData.queryParams : (this.store.templates[tenantId][index].queryParams || []),
        authConfig: templateData.authConfig !== undefined ? templateData.authConfig : (this.store.templates[tenantId][index].authConfig || { type: 'none' }),
        updatedAt: now
      };
      this.store.templates[tenantId][index] = template;
    } else {
      template = {
        id: templateData.id || `tpl-${Date.now()}`,
        tenantId,
        name: templateData.name || 'My Awesome API',
        method: templateData.method || 'POST',
        endpointUrl: templateData.endpointUrl || '',
        timeoutSeconds: Number(templateData.timeoutSeconds) || 3,
        headers: templateData.headers || [],
        bodyPayload: templateData.bodyPayload || '',
        queryParams: templateData.queryParams || [],
        authConfig: templateData.authConfig || { type: 'none' },
        variablesUsed: templateData.variablesUsed || '',
        workflow: templateData.workflow || 'None',
        createdBy: templateData.createdBy || 'FC',
        createdAt: templateData.createdAt || now,
        updatedAt: now
      };
      this.store.templates[tenantId].unshift(template);
    }

    this.saveStore();
    return template;
  }

  public async deleteTemplate(tenantId: string, templateId: string): Promise<boolean> {
    if (!this.store.templates || !this.store.templates[tenantId]) return false;
    const initialLen = this.store.templates[tenantId].length;
    this.store.templates[tenantId] = this.store.templates[tenantId].filter((t) => t.id !== templateId);
    const deleted = this.store.templates[tenantId].length < initialLen;
    if (deleted) {
      this.saveStore();
    }
    return deleted;
  }

  // =========================================================================
  // 13. WORKFLOW ACTIONS TABLE (STRICTLY SCOPED TO tenantId)
  // =========================================================================
  public async getActions(tenantId: string, actionType?: string): Promise<TenantAction[]> {
    if (!this.store.actions) {
      this.store.actions = {};
    }
    const list = this.store.actions[tenantId] || [];
    if (actionType) {
      return list.filter((a) => a.actionType === actionType);
    }
    return list;
  }

  public async saveAction(tenantId: string, actionData: Partial<TenantAction>): Promise<TenantAction> {
    if (!this.store.actions) {
      this.store.actions = {};
    }
    if (!this.store.actions[tenantId]) {
      this.store.actions[tenantId] = [];
    }

    const now = new Date().toISOString();
    const actionId = actionData.id || `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const existingIndex = this.store.actions[tenantId].findIndex((a) => a.id === actionId);

    let action: TenantAction;
    if (existingIndex >= 0) {
      action = {
        ...this.store.actions[tenantId][existingIndex],
        ...actionData,
        id: actionId,
        tenantId,
        updatedAt: now
      };
      this.store.actions[tenantId][existingIndex] = action;
    } else {
      action = {
        id: actionId,
        tenantId,
        actionType: actionData.actionType || 'notification_team_member',
        name: actionData.name || 'Push Notification Action',
        teamMember: actionData.teamMember || 'Assignee',
        targetTeamMember: actionData.targetTeamMember || 'assignee',
        header: actionData.header || '',
        body: actionData.body || '',
        url: actionData.url || '{{LEAD_LINK}}',
        config: actionData.config || {},
        variablesUsed: actionData.variablesUsed || [],
        workflowId: actionData.workflowId,
        nodeId: actionData.nodeId,
        createdAt: actionData.createdAt || now,
        updatedAt: now
      };
      this.store.actions[tenantId].unshift(action);
    }

    this.saveStore();
    logger.info(`[MultiTenantDb] Saved action '${action.name || action.id}' (${action.actionType}) for tenant ${tenantId}`);
    return action;
  }

  public async deleteAction(tenantId: string, id: string): Promise<boolean> {
    if (!this.store.actions || !this.store.actions[tenantId]) {
      return false;
    }
    const prevLen = this.store.actions[tenantId].length;
    this.store.actions[tenantId] = this.store.actions[tenantId].filter((a) => a.id !== id);
    const deleted = this.store.actions[tenantId].length < prevLen;
    if (deleted) {
      this.saveStore();
    }
    return deleted;
  }

  // =========================================================================
  // FACEBOOK PAGE INTEGRATIONS (MULTI-TENANT STORE)
  // =========================================================================
  public async getFacebookPages(tenantId: string): Promise<FacebookPageIntegration[]> {
    const list = this.store.facebookPages?.[tenantId] || [];
    return [...list];
  }

  public async getFacebookPageByPageId(pageId: string): Promise<FacebookPageIntegration | null> {
    if (!this.store.facebookPages) return null;
    for (const tenantId of Object.keys(this.store.facebookPages)) {
      const pages = this.store.facebookPages[tenantId] || [];
      const found = pages.find((p) => p.pageId === pageId && p.status === 'active');
      if (found) return found;
    }
    return null;
  }

  public async saveFacebookPage(
    tenantId: string,
    pageData: Partial<FacebookPageIntegration>
  ): Promise<FacebookPageIntegration> {
    if (!this.store.facebookPages) this.store.facebookPages = {};
    if (!this.store.facebookPages[tenantId]) this.store.facebookPages[tenantId] = [];

    const now = new Date().toISOString();
    const existingIndex = this.store.facebookPages[tenantId].findIndex(
      (p) => p.pageId === pageData.pageId || (pageData.id && p.id === pageData.id)
    );

    let page: FacebookPageIntegration;
    if (existingIndex >= 0) {
      page = {
        ...this.store.facebookPages[tenantId][existingIndex],
        ...pageData,
        updatedAt: now
      } as FacebookPageIntegration;
      this.store.facebookPages[tenantId][existingIndex] = page;
    } else {
      page = {
        id: pageData.id || `fb_page_${pageData.pageId || Date.now()}`,
        clientId: tenantId,
        pageId: pageData.pageId || '',
        pageName: pageData.pageName || 'Facebook Page',
        accessToken: pageData.accessToken || '',
        status: pageData.status || 'active',
        createdAt: pageData.createdAt || now,
        updatedAt: now
      };
      this.store.facebookPages[tenantId].unshift(page);
    }

    this.saveStore();
    logger.info(`[MultiTenantDb] Saved Facebook Page '${page.pageName}' (${page.pageId}) for tenant ${tenantId}`);
    return page;
  }

  public async updateFacebookPageStatus(pageId: string, status: string, tenantId?: string): Promise<void> {
    if (!this.store.facebookPages) return;
    const targets = tenantId ? [tenantId] : Object.keys(this.store.facebookPages);
    let updated = false;

    for (const tId of targets) {
      const list = this.store.facebookPages[tId] || [];
      for (const p of list) {
        if (p.pageId === pageId) {
          p.status = status;
          p.updatedAt = new Date().toISOString();
          updated = true;
        }
      }
    }

    if (updated) {
      this.saveStore();
    }
  }

  public async deleteFacebookPage(tenantId: string, pageId: string, hard = false): Promise<boolean> {
    if (!this.store.facebookPages || !this.store.facebookPages[tenantId]) {
      return false;
    }
    if (hard) {
      const beforeCount = this.store.facebookPages[tenantId].length;
      this.store.facebookPages[tenantId] = this.store.facebookPages[tenantId].filter(
        (p) => p.pageId !== pageId && p.id !== pageId
      );
      this.saveStore();
      return this.store.facebookPages[tenantId].length < beforeCount;
    } else {
      let found = false;
      for (const p of this.store.facebookPages[tenantId]) {
        if (p.pageId === pageId || p.id === pageId) {
          p.status = 'disconnected';
          p.updatedAt = new Date().toISOString();
          found = true;
        }
      }
      if (found) {
        this.saveStore();
      }
      return found;
    }
  }


  // =========================================================================
  // 14. WORKSPACE CAMPAIGNS (MULTI-TENANT STORE + META INTEGRATION MAPPINGS)
  // =========================================================================
  public async getCampaigns(tenantId: string): Promise<TenantCampaign[]> {
    if (!this.store.campaigns) {
      this.store.campaigns = {};
    }
    const customList = this.store.campaigns[tenantId] || [];
    const campaignMap = new Map<string, TenantCampaign>();

    const cleanHandleStr = (str: string) => {
      if (!str) return '';
      const clean = str.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
      return `@${clean.replace(/^@/, '')}`;
    };

    // 1. Meta Integration mapped campaigns
    try {
      const integrations = this.store.integrations?.[tenantId] || [];
      const fbIntegration = integrations.find((i) => i.id === 'facebook');
      const mappings: Record<string, any> = (fbIntegration?.credentials as any)?.campaignMappings || {};

      Object.values(mappings).forEach((m: any) => {
        if (!m) return;
        const name = m.campaignName || m.formName || 'Meta Campaign';
        const rawHandle = m.campaignHandle || cleanHandleStr(name);
        const handle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
        const key = handle.toLowerCase();

        campaignMap.set(key, {
          id: `camp-meta-${m.formId || Math.random().toString(36).substr(2, 6)}`,
          tenantId,
          name,
          handle,
          formId: m.formId,
          formName: m.formName,
          pageId: m.pageId,
          pageName: m.pageName,
          source: 'Facebook Lead Ads',
          status: 'active',
          distributionRule: m.distributionRule || 'round_robin',
          assignedAgentIds: m.assignedAgentIds || [],
          assignedAgentNames: m.assignedAgentNames || [],
          updatedAt: m.updatedAt || new Date().toISOString()
        });
      });
    } catch {}

    // 2. Custom created workspace campaigns
    customList.forEach((c) => {
      const handle = c.handle ? (c.handle.startsWith('@') ? c.handle : `@${c.handle}`) : cleanHandleStr(c.name);
      const key = handle.toLowerCase();
      if (!campaignMap.has(key)) {
        campaignMap.set(key, {
          ...c,
          handle
        });
      } else {
        const existing = campaignMap.get(key)!;
        campaignMap.set(key, {
          ...existing,
          ...c,
          handle
        });
      }
    });

    return Array.from(campaignMap.values());
  }

  public async saveCampaign(tenantId: string, campaignData: Partial<TenantCampaign> & { name: string }): Promise<TenantCampaign> {
    if (!this.store.campaigns) {
      this.store.campaigns = {};
    }
    if (!this.store.campaigns[tenantId]) {
      this.store.campaigns[tenantId] = [];
    }

    const cleanHandleStr = (str: string) => {
      if (!str) return '@campaign';
      const clean = str.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
      return `@${clean.replace(/^@/, '')}`;
    };

    const now = new Date().toISOString();
    const rawHandle = campaignData.handle || cleanHandleStr(campaignData.name);
    const handle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
    const cleanHandle = handle.toLowerCase();

    const existingIndex = this.store.campaigns[tenantId].findIndex(
      (c) => c.id === campaignData.id || c.handle.toLowerCase() === cleanHandle
    );

    const campaignId = campaignData.id || `camp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    let savedCamp: TenantCampaign;
    if (existingIndex >= 0) {
      savedCamp = {
        ...this.store.campaigns[tenantId][existingIndex],
        ...campaignData,
        id: this.store.campaigns[tenantId][existingIndex].id,
        tenantId,
        handle,
        updatedAt: now
      };
      this.store.campaigns[tenantId][existingIndex] = savedCamp;
    } else {
      savedCamp = {
        id: campaignId,
        tenantId,
        name: campaignData.name,
        handle,
        description: campaignData.description || '',
        source: campaignData.source || 'Workspace Campaign',
        formId: campaignData.formId,
        formName: campaignData.formName,
        pageId: campaignData.pageId,
        pageName: campaignData.pageName,
        status: campaignData.status || 'active',
        distributionRule: campaignData.distributionRule || 'round_robin',
        assignedAgentIds: campaignData.assignedAgentIds || [],
        assignedAgentNames: campaignData.assignedAgentNames || [],
        createdAt: campaignData.createdAt || now,
        updatedAt: now
      };
      this.store.campaigns[tenantId].unshift(savedCamp);
    }

    this.saveStore();
    logger.info(`[MultiTenantDb] Saved campaign '${savedCamp.name}' (${savedCamp.handle}) for tenant ${tenantId}`);
    return savedCamp;
  }

  public async deleteCampaign(tenantId: string, campaignIdOrHandle: string): Promise<boolean> {
    if (!this.store.campaigns || !this.store.campaigns[tenantId]) {
      return false;
    }
    const target = campaignIdOrHandle.toLowerCase();
    const prevLen = this.store.campaigns[tenantId].length;
    this.store.campaigns[tenantId] = this.store.campaigns[tenantId].filter(
      (c) => c.id !== campaignIdOrHandle && c.handle.toLowerCase() !== target
    );
    const deleted = this.store.campaigns[tenantId].length < prevLen;
    if (deleted) {
      this.saveStore();
    }
    return deleted;
  }
}

export const multiTenantDb = new MultiTenantDatabase();
