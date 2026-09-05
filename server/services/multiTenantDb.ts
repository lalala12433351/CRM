import fs from 'fs';
import path from 'path';
import { getAwsClient } from '../../src/lib/awsDb';
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

export interface TenantAgent {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
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
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed' | 'Rejected';
  dueDate: string;
  taskValue: number;
  createdAt: string;
  createdByAdminId?: string;
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
  title: string;
  description?: string;
  timestamp: string;
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

interface LocalStoreSchema {
  tenants: Record<string, ClientTenant>;
  agents: Record<string, TenantAgent[]>;
  leads: Record<string, TenantLead[]>;
  stages: Record<string, TenantStage[]>;
  fields: Record<string, TenantFieldSetting[]>;
  tasks: Record<string, TenantTask[]>;
  calls: Record<string, TenantCall[]>;
  integrations: Record<string, TenantIntegration[]>;
  activities: Record<string, TenantActivity[]>;
  lostReasons: Record<string, string[]>;
  workflows: Record<string, TenantWorkflow[]>;
  templates: Record<string, TenantApiTemplate[]>;
  actions: Record<string, TenantAction[]>;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'multi_tenant_store.json');

const DEFAULT_WORKFLOWS: Omit<TenantWorkflow, 'tenantId'>[] = [
  {
    id: 'wf-1',
    name: 'On Website lead',
    hasDraft: false,
    event: 'Lead Creation',
    eventIcon: 'globe',
    status: true,
    statusMeta: '13d ago by Faisal C',
    totalRuns: 853,
    last24hRuns: 10,
    last24hFailures: 0,
    isDraft: false,
    nodes: [],
    edges: [],
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'wf-2',
    name: 'On Lead Status Change',
    hasDraft: true,
    event: 'Lead Status Change',
    eventIcon: 'file',
    status: true,
    statusMeta: '2M ago by Faisal C',
    totalRuns: 19233,
    last24hRuns: 432,
    last24hFailures: 0,
    isDraft: false,
    nodes: [],
    edges: [],
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'wf-3',
    name: 'On call log lead',
    hasDraft: false,
    event: 'Call Log',
    eventIcon: 'phone',
    status: true,
    statusMeta: '3M ago by Faisal C',
    totalRuns: 862,
    last24hRuns: 0,
    last24hFailures: 0,
    isDraft: false,
    nodes: [],
    edges: [],
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  }
];

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
  { id: 'f-h1', name: 'name', label: 'Name', type: 'text', required: true, isPrimary: true, primarySlot: 'H1', category: 'Primary', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-h2', name: 'phone', label: 'Number', type: 'phone', required: true, isPrimary: true, primarySlot: 'H2', category: 'Primary', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-status', name: 'status', label: 'Status', type: 'dropdown', options: ['Fresh', 'Contacted', 'Follow Up', 'Demo Scheduled', 'Proposal Sent', 'Converted', 'Lost'], required: true, isPrimary: true, category: 'Primary', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-deal-val', name: 'deal_value', label: 'Deal Value (₹)', type: 'currency', required: false, category: 'General', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
  { id: 'f-source', name: 'source', label: 'Lead Source', type: 'dropdown', options: ['Facebook Ads', 'Google Ads', 'Meta Ads', 'IndiaMart', 'JustDial', 'WhatsApp', 'Website Inbound', 'Instagram', 'Referral', 'Direct'], required: false, isPrimary: true, category: 'Primary', isHidden: false, createdOn: '2026-04-01T09:00:00.000Z', lastModified: '2026-04-01T09:00:00.000Z' },
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
    activities: {},
    lostReasons: {},
    calls: {},
    workflows: {},
    templates: {},
    actions: {}
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
          activities: parsed.activities || {},
          lostReasons: parsed.lostReasons || {},
          calls: parsed.calls || {},
          workflows: parsed.workflows || {},
          templates: parsed.templates || {},
          actions: parsed.actions || {}
        };
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
          role: 'Master Admin',
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
      role: 'Master Admin',
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

    // Async attempt to provision in RDS
    this.syncTenantToRds(tenant, adminAgent).catch(() => {});

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
    const tenantLeads = this.store.leads[tenantId] || [];
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

      savedLead = {
        ...existing,
        ...leadData,
        customFields: {
          ...(existing.customFields || {}),
          ...(leadData.customFields || {})
        },
        tenantId: targetTenantId,
        createdAt: preservedCreatedAt,
        updatedAt: now
      };
      this.store.leads[targetTenantId][existingIndex] = savedLead;
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
    }

    this.saveStore();
    this.syncLeadToRds(savedLead).catch(() => {});
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
        role: 'Master Admin',
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
    if (!this.store.workflows[tenantId] || this.store.workflows[tenantId].length === 0) {
      // Try to hydrate from RDS PostgreSQL database
      const fromRds = await this.fetchWorkflowsFromRds(tenantId);
      if (fromRds && fromRds.length > 0) {
        this.store.workflows[tenantId] = fromRds;
        this.saveStore();
      } else {
        this.store.workflows[tenantId] = DEFAULT_WORKFLOWS.map((w) => ({ ...w, tenantId }));
        this.saveStore();
      }
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
    this.syncWorkflowToRds(workflow).catch((err) => {
      logger.warn('[multiTenantDb] Async RDS sync for workflow error:', err?.message || err);
    });
    return workflow;
  }

  public async deleteWorkflow(tenantId: string, workflowId: string): Promise<boolean> {
    if (!this.store.workflows || !this.store.workflows[tenantId]) return false;
    const initialLen = this.store.workflows[tenantId].length;
    this.store.workflows[tenantId] = this.store.workflows[tenantId].filter((w) => w.id !== workflowId);
    const deleted = this.store.workflows[tenantId].length < initialLen;
    if (deleted) {
      this.saveStore();
      this.deleteWorkflowFromRds(tenantId, workflowId).catch(() => {});
    }
    return deleted;
  }

  public async toggleWorkflowStatus(tenantId: string, workflowId: string): Promise<TenantWorkflow | null> {
    if (!this.store.workflows || !this.store.workflows[tenantId]) return null;
    const target = this.store.workflows[tenantId].find((w) => w.id === workflowId);
    if (!target) return null;
    target.status = !target.status;
    target.statusMeta = target.status ? 'Published by Admin' : 'Disabled by Admin';
    target.updatedAt = new Date().toISOString();
    this.saveStore();
    this.syncWorkflowToRds(target).catch(() => {});
    return target;
  }

  private async syncWorkflowToRds(workflow: TenantWorkflow) {
    let pool: any = null;
    let client: any = null;
    try {
      pool = await getAwsClient();
      client = await pool.connect();
      await client.query(`
        INSERT INTO workflows (
          id, title, trigger_event, actions, is_active, tenant_id,
          name, event, event_icon, status, status_meta, total_runs,
          last_24h_runs, last_24h_failures, is_draft, has_draft,
          nodes, edges, data, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          trigger_event = EXCLUDED.trigger_event,
          actions = EXCLUDED.actions,
          is_active = EXCLUDED.is_active,
          tenant_id = EXCLUDED.tenant_id,
          name = EXCLUDED.name,
          event = EXCLUDED.event,
          event_icon = EXCLUDED.event_icon,
          status = EXCLUDED.status,
          status_meta = EXCLUDED.status_meta,
          total_runs = EXCLUDED.total_runs,
          last_24h_runs = EXCLUDED.last_24h_runs,
          last_24h_failures = EXCLUDED.last_24h_failures,
          is_draft = EXCLUDED.is_draft,
          has_draft = EXCLUDED.has_draft,
          nodes = EXCLUDED.nodes,
          edges = EXCLUDED.edges,
          data = EXCLUDED.data,
          updated_at = NOW();
      `, [
        workflow.id,
        workflow.name,
        workflow.event || 'Lead Creation',
        JSON.stringify(workflow.nodes?.filter((n: any) => n.data?.kind === 'action') || []),
        Boolean(workflow.status),
        workflow.tenantId,
        workflow.name,
        workflow.event || 'Lead Creation',
        workflow.eventIcon || 'globe',
        Boolean(workflow.status),
        workflow.statusMeta || 'Active',
        workflow.totalRuns || 0,
        workflow.last24hRuns || 0,
        workflow.last24hFailures || 0,
        Boolean(workflow.isDraft),
        Boolean(workflow.hasDraft),
        JSON.stringify(workflow.nodes || []),
        JSON.stringify(workflow.edges || []),
        JSON.stringify(workflow)
      ]);
    } catch (err: any) {
      logger.warn('[multiTenantDb] Failed to sync workflow to RDS:', err?.message || err);
    } finally {
      if (client) try { client.release(); } catch {}
      if (pool) try { await pool.end(); } catch {}
    }
  }

  private async fetchWorkflowsFromRds(tenantId: string): Promise<TenantWorkflow[]> {
    let pool: any = null;
    let client: any = null;
    try {
      pool = await getAwsClient();
      client = await pool.connect();
      const res = await client.query(`
        SELECT * FROM workflows WHERE tenant_id = $1 OR tenant_id IS NULL ORDER BY updated_at DESC;
      `, [tenantId]);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((row: any) => ({
          id: row.id,
          tenantId: row.tenant_id || tenantId,
          name: row.name || row.title || 'Untitled Workflow',
          hasDraft: Boolean(row.has_draft),
          event: row.event || row.trigger_event || 'Lead Creation',
          eventIcon: row.event_icon || 'globe',
          status: row.status !== undefined ? Boolean(row.status) : (row.is_active !== undefined ? Boolean(row.is_active) : true),
          statusMeta: row.status_meta || 'Saved in Database',
          totalRuns: row.total_runs || row.execution_count || 0,
          last24hRuns: row.last_24h_runs || 0,
          last24hFailures: row.last_24h_failures || 0,
          isDraft: Boolean(row.is_draft),
          nodes: typeof row.nodes === 'string' ? JSON.parse(row.nodes) : (Array.isArray(row.nodes) ? row.nodes : []),
          edges: typeof row.edges === 'string' ? JSON.parse(row.edges) : (Array.isArray(row.edges) ? row.edges : []),
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
        }));
      }
    } catch {
      // Ignored for fallback
    } finally {
      if (client) try { client.release(); } catch {}
      if (pool) try { await pool.end(); } catch {}
    }
    return [];
  }

  private async deleteWorkflowFromRds(tenantId: string, workflowId: string) {
    let pool: any = null;
    let client: any = null;
    try {
      pool = await getAwsClient();
      client = await pool.connect();
      await client.query(`DELETE FROM workflows WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL);`, [workflowId, tenantId]);
    } catch {
    } finally {
      if (client) try { client.release(); } catch {}
      if (pool) try { await pool.end(); } catch {}
    }
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

    // Try to hydrate from RDS PostgreSQL database with 2s timeout
    try {
      const fromRds = await Promise.race([
        this.fetchTemplatesFromRds(tenantId),
        new Promise<TenantApiTemplate[]>((resolve) => setTimeout(() => resolve([]), 2000))
      ]);
      if (fromRds && fromRds.length > 0) {
        this.store.templates[tenantId] = fromRds;
        this.saveStore();
      }
    } catch {}

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
    this.syncTemplateToRds(template).catch((err) => {
      logger.warn('[multiTenantDb] Async RDS sync for template error:', err?.message || err);
    });
    return template;
  }

  public async deleteTemplate(tenantId: string, templateId: string): Promise<boolean> {
    if (!this.store.templates || !this.store.templates[tenantId]) return false;
    const initialLen = this.store.templates[tenantId].length;
    this.store.templates[tenantId] = this.store.templates[tenantId].filter((t) => t.id !== templateId);
    const deleted = this.store.templates[tenantId].length < initialLen;
    if (deleted) {
      this.saveStore();
      this.deleteTemplateFromRds(tenantId, templateId).catch(() => {});
    }
    return deleted;
  }

  private async syncTemplateToRds(template: TenantApiTemplate) {
    let pool: any = null;
    let client: any = null;
    try {
      pool = await getAwsClient();
      client = await pool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS templates (
          id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(255) DEFAULT 'default_tenant',
          name VARCHAR(255) NOT NULL,
          method VARCHAR(20) DEFAULT 'POST',
          endpoint_url TEXT NOT NULL,
          timeout_seconds INT DEFAULT 3,
          headers JSONB DEFAULT '[]'::jsonb,
          body_payload TEXT,
          query_params JSONB DEFAULT '[]'::jsonb,
          auth_config JSONB DEFAULT '{"type":"none"}'::jsonb,
          variables_used VARCHAR(255),
          workflow VARCHAR(255) DEFAULT 'None',
          created_by VARCHAR(255) DEFAULT 'FC',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await client.query(`
        INSERT INTO templates (
          id, tenant_id, name, method, endpoint_url, timeout_seconds,
          headers, body_payload, query_params, auth_config, variables_used,
          workflow, created_by, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        ON CONFLICT (id) DO UPDATE SET
          tenant_id = EXCLUDED.tenant_id,
          name = EXCLUDED.name,
          method = EXCLUDED.method,
          endpoint_url = EXCLUDED.endpoint_url,
          timeout_seconds = EXCLUDED.timeout_seconds,
          headers = EXCLUDED.headers,
          body_payload = EXCLUDED.body_payload,
          query_params = EXCLUDED.query_params,
          auth_config = EXCLUDED.auth_config,
          variables_used = EXCLUDED.variables_used,
          workflow = EXCLUDED.workflow,
          created_by = EXCLUDED.created_by,
          updated_at = NOW();
      `, [
        template.id,
        template.tenantId,
        template.name,
        template.method,
        template.endpointUrl,
        template.timeoutSeconds || 3,
        JSON.stringify(template.headers || []),
        template.bodyPayload || '',
        JSON.stringify(template.queryParams || []),
        JSON.stringify(template.authConfig || { type: 'none' }),
        template.variablesUsed || '',
        template.workflow || 'None',
        template.createdBy || 'FC'
      ]);
    } catch (err: any) {
      logger.warn('[multiTenantDb] Failed to sync template to RDS:', err?.message || err);
    } finally {
      if (client) try { client.release(); } catch {}
      if (pool) try { await pool.end(); } catch {}
    }
  }

  private async fetchTemplatesFromRds(tenantId: string): Promise<TenantApiTemplate[]> {
    let pool: any = null;
    let client: any = null;
    try {
      pool = await getAwsClient();
      client = await pool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS templates (
          id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(255) DEFAULT 'default_tenant',
          name VARCHAR(255) NOT NULL,
          method VARCHAR(20) DEFAULT 'POST',
          endpoint_url TEXT NOT NULL,
          timeout_seconds INT DEFAULT 3,
          headers JSONB DEFAULT '[]'::jsonb,
          body_payload TEXT,
          query_params JSONB DEFAULT '[]'::jsonb,
          auth_config JSONB DEFAULT '{"type":"none"}'::jsonb,
          variables_used VARCHAR(255),
          workflow VARCHAR(255) DEFAULT 'None',
          created_by VARCHAR(255) DEFAULT 'FC',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const res = await client.query(`
        SELECT * FROM templates WHERE tenant_id = $1 OR tenant_id IS NULL ORDER BY updated_at DESC;
      `, [tenantId]);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((row: any) => ({
          id: row.id,
          tenantId: row.tenant_id || tenantId,
          name: row.name || 'Untitled Template',
          method: row.method || 'POST',
          endpointUrl: row.endpoint_url || '',
          timeoutSeconds: row.timeout_seconds !== undefined ? Number(row.timeout_seconds) : 3,
          headers: typeof row.headers === 'string' ? JSON.parse(row.headers) : (Array.isArray(row.headers) ? row.headers : []),
          bodyPayload: row.body_payload || '',
          queryParams: typeof row.query_params === 'string' ? JSON.parse(row.query_params) : (Array.isArray(row.query_params) ? row.query_params : []),
          authConfig: typeof row.auth_config === 'string' ? JSON.parse(row.auth_config) : (row.auth_config || { type: 'none' }),
          variablesUsed: row.variables_used || '',
          workflow: row.workflow || 'None',
          createdBy: row.created_by || 'FC',
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
        }));
      }
    } catch {
      // Ignored for fallback
    } finally {
      if (client) try { client.release(); } catch {}
      if (pool) try { await pool.end(); } catch {}
    }
    return [];
  }

  private async deleteTemplateFromRds(tenantId: string, templateId: string) {
    let pool: any = null;
    let client: any = null;
    try {
      pool = await getAwsClient();
      client = await pool.connect();
      await client.query(`DELETE FROM templates WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL);`, [templateId, tenantId]);
    } catch {
    } finally {
      if (client) try { client.release(); } catch {}
      if (pool) try { await pool.end(); } catch {}
    }
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
  // ASYNC RDS SYNC HELPERS (WHEN DB IS ACCESSIBLE)
  // =========================================================================
  private async syncTenantToRds(tenant: ClientTenant, adminAgent: TenantAgent) {
    let pool: any = null;
    let client: any = null;
    try {
      pool = await getAwsClient();
      client = await pool.connect();
      await client.query(`
        INSERT INTO client_tenants (tenant_id, company_name, owner_email, owner_phone, status, settings)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (tenant_id) DO UPDATE SET updated_at = NOW();
      `, [tenant.tenantId, tenant.companyName, tenant.ownerEmail, tenant.ownerPhone, tenant.status, JSON.stringify(tenant.settings)]);

      await client.query(`
        INSERT INTO agents (id, name, email, phone, role, status, tenant_id, company_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, updated_at = NOW();
      `, [adminAgent.id, adminAgent.name, adminAgent.email, adminAgent.phone, adminAgent.role, adminAgent.status, adminAgent.tenantId, adminAgent.companyName]);
    } catch {
      // Ignored for non-blocking local operation
    } finally {
      if (client) try { client.release(); } catch {}
      if (pool) try { await pool.end(); } catch {}
    }
  }

  private async syncLeadToRds(lead: TenantLead) {
    let pool: any = null;
    let client: any = null;
    try {
      pool = await getAwsClient();
      client = await pool.connect();
      await client.query(`
        INSERT INTO leads (id, name, phone, email, company, city, state, source, status, pipeline_stage_id, deal_value, assignee_id, assignee_name, data, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          status = EXCLUDED.status,
          deal_value = EXCLUDED.deal_value,
          assignee_id = EXCLUDED.assignee_id,
          assignee_name = EXCLUDED.assignee_name,
          tenant_id = EXCLUDED.tenant_id,
          updated_at = NOW();
      `, [
        lead.id, lead.name, lead.phone, lead.email, lead.company, lead.city, lead.state,
        lead.source, lead.status, lead.pipelineStageId, lead.dealValue,
        lead.ownerAgentId, lead.ownerAgentName, JSON.stringify(lead), lead.tenantId
      ]);
    } catch {
      // Ignored for non-blocking local operation
    } finally {
      if (client) try { client.release(); } catch {}
      if (pool) try { await pool.end(); } catch {}
    }
  }
}

export const multiTenantDb = new MultiTenantDatabase();
