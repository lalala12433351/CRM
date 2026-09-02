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
}

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'multi_tenant_store.json');

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
    calls: {}
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
          calls: parsed.calls || {}
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
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
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
    if (!this.store.leads[tenantId]) {
      this.store.leads[tenantId] = [];
    }

    const existingIndex = this.store.leads[tenantId].findIndex((l) => l.id === leadData.id);
    const now = new Date().toISOString();

    let savedLead: TenantLead;

    if (existingIndex >= 0) {
      savedLead = {
        ...this.store.leads[tenantId][existingIndex],
        ...leadData,
        tenantId,
        updatedAt: now
      };
      this.store.leads[tenantId][existingIndex] = savedLead;
    } else {
      savedLead = {
        id: leadData.id || `lead-${Date.now()}`,
        tenantId,
        name: leadData.name || 'New Inbound Lead',
        phone: leadData.phone || '',
        email: leadData.email || '',
        company: leadData.company || '',
        city: leadData.city || '',
        state: leadData.state || '',
        source: leadData.source || 'Manual Entry',
        status: leadData.status || 'Fresh',
        pipelineStageId: leadData.pipelineStageId || 'stage-1',
        dealValue: Number(leadData.dealValue) || 0,
        ownerAgentId: leadData.ownerAgentId || leadData.assignee_id || 'agent-admin',
        ownerAgentName: leadData.ownerAgentName || leadData.assignee_name || 'Admin',
        aiScore: leadData.aiScore || 80,
        aiRating: leadData.aiRating || 'Hot',
        aiReasoning: leadData.aiReasoning || 'Direct CRM capture',
        notes: leadData.notes || '',
        lostReason: leadData.lostReason || undefined,
        customFields: leadData.customFields || {},
        tags: leadData.tags || [],
        createdAt: now,
        updatedAt: now,
        ...leadData
      };
      this.store.leads[tenantId].unshift(savedLead);
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
