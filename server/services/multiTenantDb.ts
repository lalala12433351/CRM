import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { isPostgresStoreEnabled, workspaceDbName } from '../db/config';
import { bootstrapPostgres } from '../db/bootstrap';
import {
  deleteFacebookPageIndex,
  deleteMembership,
  listControlTenants,
  provisionTenant,
  upsertFacebookPageIndex,
  upsertMembership
} from '../db/provisionTenant';
import { loadWorkspaceSlice, persistWorkspaceSlice } from '../db/workspaceStore';

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
  managerId?: string;
  passwordHash?: string;
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

export interface TenantMessage {
  id: string;
  tenantId: string;
  leadId: string;
  direction: 'inbound' | 'outbound' | string;
  channel: string;
  content: string;
  mediaUrl?: string;
  status?: string;
  timestamp: string;
  templateId?: string;
  isBot?: boolean;
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
  messages: Record<string, TenantMessage[]>;
  whatsappTemplates: Record<string, any[]>;
  whatsappCampaigns: Record<string, any[]>;
}

function resolvePrimaryDataDir(): string {
  if (process.env.PIXBE_DATA_DIR) return process.env.PIXBE_DATA_DIR;
  // Prefer LocalAppData on Windows — Desktop/OneDrive locks cause silent write failures (FB leads lost).
  const localApp = process.env.LOCALAPPDATA || process.env.HOME || process.env.USERPROFILE;
  if (localApp) return path.join(localApp, 'PixbeCrm', 'data');
  return path.join(process.cwd(), '.data');
}

const LEGACY_DATA_DIR = path.join(process.cwd(), '.data');
const LEGACY_STORE_PATH = path.join(LEGACY_DATA_DIR, 'multi_tenant_store.json');
const DATA_DIR = resolvePrimaryDataDir();
const STORE_PATH = path.join(DATA_DIR, 'multi_tenant_store.json');
const MIRROR_STORE_PATH = LEGACY_STORE_PATH;

/**
 * Local JSON multi-tenant store (Aurora-ready shape).
 *
 * Each top-level key maps 1:1 to a future Postgres/Aurora table, keyed by tenant_id:
 *   tenants, agents, leads, stages, fields, tasks, calls, integrations,
 *   facebookPages, activities, lostReasons, workflows, templates, actions, campaigns
 *
 * Persistence:
 *   - PIXBE_STORE=json (or no DB host): `.data/multi_tenant_store.json`
 *   - PIXBE_STORE=postgres (default when DB_HOST / AWS_RDS_HOST set):
 *       pixbe_control + one Postgres DB per workspace (Aurora-ready local path)
 */

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
    campaigns: {},
    messages: {},
    whatsappTemplates: {},
    whatsappCampaigns: {}
  };

  private postgresMode = false;
  private postgresReady = false;
  private persistInFlight: Promise<void> | null = null;

  constructor() {
    this.postgresMode = isPostgresStoreEnabled();
    if (!this.postgresMode) {
      this.initLocalStore();
      this.seedDefaultTenantIfNeeded();
    } else {
      logger.info(
        '[MultiTenantDB] Postgres mode enabled — call initPostgres() before serving traffic'
      );
    }
  }

  private saveTimer: NodeJS.Timeout | null = null;
  private dirty = false;

  /** Bootstrap control plane + load all workspace DBs into the in-memory cache. */
  public async initPostgres(): Promise<void> {
    if (!this.postgresMode) return;
    if (this.postgresReady) return;

    const boot = await bootstrapPostgres();
    if (!boot.ok) {
      throw new Error(`Postgres bootstrap failed: ${boot.error}`);
    }

    let tenants = await listControlTenants();
    if (
      tenants.length === 0 &&
      String(process.env.PIXBE_AUTO_IMPORT_JSON || 'true').toLowerCase() !== 'false'
    ) {
      const imported = await this.tryAutoImportJsonToPostgres();
      if (imported) tenants = await listControlTenants();
    }

    for (const t of tenants) {
      const payload = t.payload && typeof t.payload === 'object' ? t.payload : {};
      this.store.tenants[t.tenantId] = {
        ...payload,
        tenantId: t.tenantId,
        companyName: payload.companyName || t.tenantId,
        ownerEmail: payload.ownerEmail || '',
        ownerPhone: payload.ownerPhone || '',
        companyDescription: payload.companyDescription || '',
        businessType: payload.businessType || '',
        businessTypeOther: payload.businessTypeOther || '',
        referralSource: payload.referralSource || '',
        referralSourceOther: payload.referralSourceOther || '',
        status: payload.status || 'ACTIVE',
        settings: payload.settings || {},
        createdAt: payload.createdAt || new Date().toISOString(),
        updatedAt: payload.updatedAt || new Date().toISOString()
      };
      const slice = await loadWorkspaceSlice(t.tenantId, t.dbName || workspaceDbName(t.tenantId));
      this.store.agents[t.tenantId] = slice.agents || [];
      this.store.leads[t.tenantId] = slice.leads || [];
      this.store.stages[t.tenantId] = slice.stages || [];
      this.store.fields[t.tenantId] = slice.fields || [];
      this.store.tasks[t.tenantId] = slice.tasks || [];
      this.store.calls[t.tenantId] = slice.calls || [];
      this.store.integrations[t.tenantId] = slice.integrations || [];
      this.store.facebookPages[t.tenantId] = slice.facebookPages || [];
      this.store.activities[t.tenantId] = slice.activities || [];
      this.store.lostReasons[t.tenantId] = slice.lostReasons || [];
      this.store.workflows[t.tenantId] = slice.workflows || [];
      this.store.templates[t.tenantId] = slice.templates || [];
      this.store.actions[t.tenantId] = slice.actions || [];
      this.store.campaigns[t.tenantId] = slice.campaigns || [];
      this.store.messages[t.tenantId] = slice.messages || [];
      this.store.whatsappTemplates[t.tenantId] = slice.whatsappTemplates || [];
      this.store.whatsappCampaigns[t.tenantId] = slice.whatsappCampaigns || [];
    }

    this.healOrphanLeadOwners();
    this.healCorruptedLeadContactNames();
    this.healDenormalizedAgentLabels();

    this.postgresReady = true;
    logger.info(`[MultiTenantDB] Loaded ${tenants.length} workspace(s) from Postgres`);
  }

  private async tryAutoImportJsonToPostgres(): Promise<boolean> {
    const candidates = this.seedCandidatePaths().concat([STORE_PATH]);
    let storePath = '';
    for (const p of candidates) {
      if (p && fs.existsSync(p)) {
        storePath = p;
        break;
      }
    }
    if (!storePath) {
      logger.info('[MultiTenantDB] No JSON store found to auto-import');
      return false;
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      const tenantIds = Object.keys(parsed.tenants || {});
      if (!tenantIds.length) return false;
      logger.info(`[MultiTenantDB] Auto-importing ${tenantIds.length} tenant(s) from ${storePath}`);
      this.hydrateStoreFromParsed(parsed);
      for (const tenantId of tenantIds) {
        await this.persistTenantToPostgres(tenantId, { provision: true });
      }
      return true;
    } catch (err: any) {
      logger.warn('[MultiTenantDB] Auto-import skipped:', err?.message || err);
      return false;
    }
  }

  private async persistTenantToPostgres(
    tenantId: string,
    opts?: { provision?: boolean }
  ): Promise<void> {
    const tenant = this.store.tenants[tenantId];
    if (!tenant) return;
    const agents = this.store.agents[tenantId] || [];
    const admin =
      agents.find((a) => a.isAdmin || String(a.role || '').toLowerCase().includes('admin')) ||
      agents[0];
    const adminAgentId = admin?.id || `agent_${tenantId}_admin`;

    await provisionTenant({
      tenantId,
      companyName: tenant.companyName,
      ownerEmail: tenant.ownerEmail || admin?.email || '',
      ownerPhone: tenant.ownerPhone || admin?.phone || '',
      adminName: admin?.name || 'Admin',
      adminAgentId,
      role: (admin?.role as string) || 'Admin',
      tenantPayload: tenant as any,
      agentPayload: admin || {}
    });
    void opts;

    for (const agent of agents) {
      if (!agent?.email) continue;
      await upsertMembership({
        tenantId,
        email: agent.email,
        agentId: agent.id,
        role: String(agent.role || 'Telecaller'),
        isAdmin: Boolean(agent.isAdmin),
        payload: { name: agent.name, phone: agent.phone }
      });
    }

    for (const page of this.store.facebookPages[tenantId] || []) {
      if (page?.pageId) await upsertFacebookPageIndex(String(page.pageId), tenantId);
    }

    await persistWorkspaceSlice(tenantId, {
      agents,
      leads: this.store.leads[tenantId] || [],
      stages: this.store.stages[tenantId] || [],
      fields: this.store.fields[tenantId] || [],
      tasks: this.store.tasks[tenantId] || [],
      calls: this.store.calls[tenantId] || [],
      integrations: this.store.integrations[tenantId] || [],
      facebookPages: this.store.facebookPages[tenantId] || [],
      activities: this.store.activities[tenantId] || [],
      lostReasons: this.store.lostReasons[tenantId] || [],
      workflows: this.store.workflows[tenantId] || [],
      templates: this.store.templates[tenantId] || [],
      actions: this.store.actions[tenantId] || [],
      campaigns: this.store.campaigns[tenantId] || [],
      messages: this.store.messages[tenantId] || [],
      whatsappTemplates: this.store.whatsappTemplates[tenantId] || [],
      whatsappCampaigns: this.store.whatsappCampaigns[tenantId] || []
    });
  }

  private async persistAllToPostgres(): Promise<void> {
    if (this.persistInFlight) {
      await this.persistInFlight;
    }
    this.persistInFlight = (async () => {
      const ids = Object.keys(this.store.tenants || {});
      for (const tenantId of ids) {
        try {
          await this.persistTenantToPostgres(tenantId);
        } catch (err: any) {
          logger.warn(
            `[MultiTenantDB] Postgres persist failed for ${tenantId}:`,
            err?.message || err
          );
        }
      }
      this.dirty = false;
    })();
    await this.persistInFlight;
    this.persistInFlight = null;
  }

  private hydrateStoreFromParsed(parsed: any) {
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
      campaigns: parsed.campaigns || {},
      messages: parsed.messages || {},
      whatsappTemplates: parsed.whatsappTemplates || {},
      whatsappCampaigns: parsed.whatsappCampaigns || {}
    };
    for (const tid in this.store.agents) {
      if (Array.isArray(this.store.agents[tid])) {
        this.store.agents[tid].forEach((ag) => {
          const role = String(ag.role || '');
          if (
            role === 'Master Admin' ||
            role === 'Super Admin' ||
            role === 'Root' ||
            role.toLowerCase() === 'super admin' ||
            role.toLowerCase() === 'master admin'
          ) {
            ag.role = 'Admin';
            ag.isAdmin = true;
          }
        });
      }
    }
  }

  /** Seed sources only — never used for runtime reads once primary exists. */
  private seedCandidatePaths(): string[] {
    const cwd = process.cwd();
    const candidates = [
      MIRROR_STORE_PATH,
      LEGACY_STORE_PATH,
      path.join(cwd, 'dist', '.data', 'multi_tenant_store.json'),
      path.join(cwd, 'data-seed', 'multi_tenant_store.json'),
    ];
    return [...new Set(candidates.filter((p) => p && p !== STORE_PATH))];
  }

  private initLocalStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // Primary-only contract: load LocalAppData / PIXBE_DATA_DIR exclusively.
      // Seed once from project .data (or build seed) only when primary is missing.
      if (!fs.existsSync(STORE_PATH)) {
        const seed = this.seedCandidatePaths().find((p) => fs.existsSync(p)) || null;
        if (seed) {
          try {
            fs.copyFileSync(seed, STORE_PATH);
            logger.info('[MultiTenantDB] Seeded primary store from ' + seed + ' → ' + STORE_PATH);
          } catch (migErr: any) {
            logger.warn('[MultiTenantDB] Store seed notice:', migErr?.message || migErr);
          }
        }
      }

      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        this.hydrateStoreFromParsed(JSON.parse(raw));
        logger.info('[MultiTenantDB] Loaded primary store from ' + STORE_PATH);
        this.healOrphanLeadOwners();
        this.healCorruptedLeadContactNames();
        this.healDenormalizedAgentLabels();
        // Mirror primary → project .data so git/visibility stays aligned without flipping the source of truth
        this.saveStoreImmediate();
      } else {
        logger.info('[MultiTenantDB] No store found; initializing empty primary at ' + STORE_PATH);
        this.saveStoreImmediate();
      }

      process.once('exit', () => {
        try { this.saveStoreImmediate(); } catch {}
      });
      process.once('SIGINT', () => {
        try { this.saveStoreImmediate(); } catch {}
        process.exit(0);
      });
    } catch (e) {
      logger.warn('Failed to load local tenant store, initializing in-memory store:', e);
    }
  }

  private healOrphanLeadOwners() {
    let repaired = 0;
    for (const tenantId of Object.keys(this.store.leads || {})) {
      const agents = this.store.agents[tenantId] || [];
      if (!agents.length) continue;
      const agentIds = new Set(agents.map((a) => a.id));
      const admin =
        agents.find((a) => a.isAdmin || String(a.role || '').toLowerCase().includes('admin')) || agents[0];
      const leads = this.store.leads[tenantId] || [];
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        const ownerId = lead.ownerAgentId || (lead.assignedTo && agentIds.has(String(lead.assignedTo)) ? String(lead.assignedTo) : '');
        if (ownerId && agentIds.has(ownerId)) {
          if (!lead.ownerAgentId) {
            leads[i] = { ...lead, ownerAgentId: ownerId };
            repaired++;
          }
          continue;
        }
        // Stale Meta distribution targets (deleted agents) → reassign to Admin so leads stay visible
        leads[i] = {
          ...lead,
          ownerAgentId: admin.id,
          ownerAgentName: admin.name,
          assignedTo: admin.id
        };
        repaired++;
      }
    }
    if (repaired > 0) {
      logger.info(`[MultiTenantDB] Reassigned ${repaired} lead(s) with missing/stale owners to current Admin`);
      this.saveStoreImmediate();
    }
  }

  /**
   * If heal/sync previously copied an agent display name into lead.name, restore the
   * contact name from Meta/custom field payloads (full_name, Full name, Name, etc.).
   * Never invent names and never leave agent labels on lead.name when a Meta source exists.
   */
  private healCorruptedLeadContactNames() {
    let repaired = 0;
    for (const tenantId of Object.keys(this.store.leads || {})) {
      const agents = this.store.agents[tenantId] || [];
      if (!agents.length) continue;
      const agentNames = new Set(
        agents.map((a) => String(a.name || '').trim().toLowerCase()).filter(Boolean)
      );

      const pickContactName = (lead: any): string | null => {
        const cf = (lead && lead.customFields) || {};
        const firstLast = `${cf.first_name || cf.firstName || ''} ${cf.last_name || cf.lastName || ''}`.trim();
        const candidates = [
          cf.full_name,
          cf.fullName,
          cf['Full name'],
          cf['Full Name'],
          cf.Name,
          cf.name,
          firstLast,
          cf.meta_full_name,
          cf.lead_name,
          cf.leadName
        ];
        for (const raw of candidates) {
          const n = String(raw || '').trim();
          if (!n) continue;
          if (agentNames.has(n.toLowerCase())) continue;
          return n;
        }
        return null;
      };

      const leads = this.store.leads[tenantId] || [];
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        const current = String(lead.name || '').trim();
        if (!current || !agentNames.has(current.toLowerCase())) continue;
        const restored = pickContactName(lead);
        if (!restored || restored === current) continue;
        leads[i] = { ...lead, name: restored };
        repaired++;
      }
    }
    if (repaired > 0) {
      logger.info(`[MultiTenantDB] Restored ${repaired} lead contact name(s) from Meta/customFields (cleared agent-name corruption)`);
      this.saveStoreImmediate();
    }
  }

  /**
   * Rewrite every denormalized owner/assignee/agent label to match the live agents[]
   * profile for that id. Also refreshes embedded agent snapshots (e.g. campaign distribution).
   * CRITICAL: never writes agent names into lead.name (contact name).
   */
  private healDenormalizedAgentLabels() {
    let repaired = 0;
    const tenantIds = new Set<string>([
      ...Object.keys(this.store.agents || {}),
      ...Object.keys(this.store.leads || {}),
      ...Object.keys(this.store.tasks || {}),
      ...Object.keys(this.store.calls || {}),
      ...Object.keys(this.store.activities || {}),
      ...Object.keys(this.store.campaigns || {}),
      ...Object.keys(this.store.messages || {}),
      ...Object.keys(this.store.whatsappCampaigns || {})
    ]);

    const setIfChanged = (obj: any, key: string, value: string) => {
      if (!obj || value == null) return;
      if (obj[key] !== value) {
        obj[key] = value;
        repaired++;
      }
    };

    /** True for CRM lead records — contact `name` must never be overwritten by agent heal. */
    const isLeadLike = (obj: any) =>
      Boolean(
        obj &&
          typeof obj === 'object' &&
          (obj.formId != null ||
            obj.formName != null ||
            obj.pipelineStageId != null ||
            obj.customFields != null ||
            (obj.ownerAgentId != null && obj.phone != null && !obj.role))
      );

    const syncEmbeddedAgent = (entry: any, byId: Map<string, TenantAgent>) => {
      if (!entry || typeof entry !== 'object') return;
      // Never treat a lead record as an embedded agent snapshot
      if (isLeadLike(entry)) return;
      const id = entry.id || entry.agentId || entry.ownerAgentId || entry.assigneeAgentId;
      const agent = id ? byId.get(String(id)) : undefined;
      if (!agent) return;
      // Only rewrite `name` when this entry is clearly an agent snapshot (id is an agent id)
      if (entry.id && byId.has(String(entry.id))) {
        setIfChanged(entry, 'name', agent.name);
      }
      setIfChanged(entry, 'agentName', agent.name);
      setIfChanged(entry, 'ownerAgentName', agent.name);
      setIfChanged(entry, 'assigneeAgentName', agent.name);
      setIfChanged(entry, 'assigneeName', agent.name);
      if (agent.companyName) setIfChanged(entry, 'companyName', agent.companyName);
      if (agent.email) setIfChanged(entry, 'email', agent.email);
      if (agent.avatar !== undefined && entry.avatar !== agent.avatar) {
        entry.avatar = agent.avatar;
        repaired++;
      }
    };

    for (const tenantId of tenantIds) {
      const agents = this.store.agents[tenantId] || [];
      if (!agents.length) continue;
      const byId = new Map(agents.map((a) => [a.id, a]));
      const names = new Set(agents.map((a) => a.name));
      const admin =
        agents.find((a) => a.isAdmin || String(a.role || '').toLowerCase().includes('admin')) || agents[0];
      const aliasToId = new Map<string, string>([['agent-admin', admin.id]]);

      const resolveId = (raw?: string) => {
        if (!raw) return undefined;
        if (byId.has(raw)) return raw;
        return aliasToId.get(raw);
      };

      const syncPersonFields = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        // Lead contact records: only touch owner* labels — never contact `name`
        if (isLeadLike(obj)) {
          const ownerId = resolveId(obj.ownerAgentId) || obj.ownerAgentId;
          const owner = ownerId ? byId.get(String(ownerId)) : undefined;
          if (owner) setIfChanged(obj, 'ownerAgentName', owner.name);
          return;
        }
        let rawId = obj.agentId || obj.ownerAgentId || obj.assigneeAgentId || obj.id;
        const mapped = resolveId(rawId);
        if (rawId && mapped && rawId !== mapped) {
          if (obj.agentId === rawId) obj.agentId = mapped;
          if (obj.ownerAgentId === rawId) obj.ownerAgentId = mapped;
          if (obj.assigneeAgentId === rawId) obj.assigneeAgentId = mapped;
          repaired++;
          rawId = mapped;
        }
        // assignedTo must be an agent id, never a display name
        if (typeof obj.assignedTo === 'string' && obj.assignedTo && !byId.has(obj.assignedTo)) {
          if (!names.has(obj.assignedTo)) {
            obj.assignedTo = admin.id;
            repaired++;
          } else {
            const match = agents.find((a) => a.name === obj.assignedTo);
            if (match) {
              obj.assignedTo = match.id;
              repaired++;
            }
          }
        }
        const agent = rawId ? byId.get(String(rawId)) : undefined;
        if (agent) {
          if ('agentName' in obj) setIfChanged(obj, 'agentName', agent.name);
          if ('ownerAgentName' in obj) setIfChanged(obj, 'ownerAgentName', agent.name);
          if ('assigneeAgentName' in obj) setIfChanged(obj, 'assigneeAgentName', agent.name);
          if ('assigneeName' in obj) setIfChanged(obj, 'assigneeName', agent.name);
          // Embedded agent snapshot only — id must be a known agent id
          if ((obj.email != null || obj.role != null) && obj.id && byId.has(String(obj.id))) {
            setIfChanged(obj, 'name', agent.name);
            if (agent.companyName) setIfChanged(obj, 'companyName', agent.companyName);
          }
        }
      };

      const walkNested = (node: any) => {
        if (!node) return;
        if (Array.isArray(node)) {
          for (const item of node) walkNested(item);
          return;
        }
        if (typeof node !== 'object') return;
        syncPersonFields(node);
        for (const value of Object.values(node)) {
          if (value && typeof value === 'object') walkNested(value);
        }
      };

      for (const lead of this.store.leads[tenantId] || []) {
        const agent = lead.ownerAgentId ? byId.get(lead.ownerAgentId) : undefined;
        if (agent) {
          setIfChanged(lead, 'ownerAgentName', agent.name);
        } else if (lead.ownerAgentName && !names.has(lead.ownerAgentName) && admin) {
          lead.ownerAgentId = admin.id;
          setIfChanged(lead, 'ownerAgentName', admin.name);
        }
        // Nested lead.activities / history snapshots
        walkNested(lead.activities);
        walkNested((lead as any).activityHistory);
      }

      for (const task of this.store.tasks[tenantId] || []) {
        const agent = task.assigneeAgentId ? byId.get(task.assigneeAgentId) : undefined;
        if (agent) {
          setIfChanged(task, 'assigneeAgentName', agent.name);
        } else if (task.assigneeAgentName && !names.has(task.assigneeAgentName) && admin) {
          task.assigneeAgentId = admin.id;
          setIfChanged(task, 'assigneeAgentName', admin.name);
        }
      }

      for (const call of this.store.calls[tenantId] || []) {
        const mappedId = resolveId(call.agentId);
        if (mappedId && call.agentId !== mappedId) {
          call.agentId = mappedId;
          repaired++;
        }
        const agent = call.agentId ? byId.get(call.agentId) : undefined;
        if (agent) {
          setIfChanged(call, 'agentName', agent.name);
          if (call.assigneeName != null) setIfChanged(call, 'assigneeName', agent.name);
        } else if (
          ((call as any).agentName && !names.has((call as any).agentName)) ||
          ((call as any).assigneeName && !names.has((call as any).assigneeName))
        ) {
          if (admin) {
            (call as any).agentId = admin.id;
            setIfChanged(call, 'agentName', admin.name);
            setIfChanged(call, 'assigneeName', admin.name);
          }
        }
      }

      for (const act of this.store.activities[tenantId] || []) {
        const mappedId = resolveId(act.agentId);
        if (mappedId && act.agentId !== mappedId) {
          act.agentId = mappedId;
          repaired++;
        }
        const agent = act.agentId ? byId.get(act.agentId) : undefined;
        if (agent) {
          setIfChanged(act, 'agentName', agent.name);
        } else if (act.agentName && !names.has(act.agentName) && admin) {
          act.agentId = admin.id;
          setIfChanged(act, 'agentName', admin.name);
        }
      }

      for (const msg of this.store.messages[tenantId] || []) {
        const anyMsg = msg as any;
        const agent =
          (anyMsg.agentId && byId.get(anyMsg.agentId)) ||
          (anyMsg.ownerAgentId && byId.get(anyMsg.ownerAgentId)) ||
          undefined;
        if (agent) {
          if (anyMsg.agentName != null) setIfChanged(anyMsg, 'agentName', agent.name);
          if (anyMsg.ownerAgentName != null) setIfChanged(anyMsg, 'ownerAgentName', agent.name);
          if (anyMsg.senderName != null && anyMsg.agentId) setIfChanged(anyMsg, 'senderName', agent.name);
        }
      }

      for (const camp of this.store.campaigns[tenantId] || []) {
        const anyCamp = camp as any;
        if (Array.isArray(anyCamp.leadDistribution)) {
          for (const entry of anyCamp.leadDistribution) syncEmbeddedAgent(entry, byId);
        }
        if (Array.isArray(anyCamp.members)) {
          for (const entry of anyCamp.members) syncEmbeddedAgent(entry, byId);
        }
        if (Array.isArray(anyCamp.agents)) {
          for (const entry of anyCamp.agents) syncEmbeddedAgent(entry, byId);
        }
        // Nested settings / form configs that snapshot agents
        if (anyCamp.settings && typeof anyCamp.settings === 'object') {
          const dist = anyCamp.settings.leadDistribution || anyCamp.settings.distribution;
          if (Array.isArray(dist)) {
            for (const entry of dist) syncEmbeddedAgent(entry, byId);
          }
        }
      }

      for (const wa of this.store.whatsappCampaigns[tenantId] || []) {
        syncEmbeddedAgent(wa as any, byId);
        if (Array.isArray((wa as any).agents)) {
          for (const entry of (wa as any).agents) syncEmbeddedAgent(entry, byId);
        }
      }
    }

    if (repaired > 0) {
      logger.info(`[MultiTenantDB] Healed ${repaired} denormalized agent label(s) from current agent profiles`);
      this.saveStoreImmediate();
    }
  }

  /** Public re-heal after profile/agent renames so API responses never serve stale labels. */
  public healAgentLabelsNow() {
    this.healCorruptedLeadContactNames();
    this.healDenormalizedAgentLabels();
  }

  private writeStoreFile(targetPath: string, payload: string): boolean {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = targetPath + '.tmp-' + process.pid + '-' + Date.now();
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        fs.writeFileSync(tmp, payload, 'utf-8');
        try {
          fs.renameSync(tmp, targetPath);
        } catch {
          fs.copyFileSync(tmp, targetPath);
          try { fs.unlinkSync(tmp); } catch {}
        }
        return true;
      } catch (e: any) {
        try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch {}
        const start = Date.now();
        while (Date.now() - start < 40 * (attempt + 1)) { /* brief backoff for OneDrive locks */ }
        if (attempt === 7) {
          logger.warn('[MultiTenantDB] Write failed for ' + targetPath + ':', e?.message || e);
        }
      }
    }
    return false;
  }

  private saveStoreImmediate() {
    if (this.postgresMode) {
      void this.persistAllToPostgres();
      return;
    }
    const payload = JSON.stringify(this.store, null, 2);
    const okPrimary = this.writeStoreFile(STORE_PATH, payload);
    // Best-effort mirror into project .data for visibility / backup (never the read source when primary exists)
    if (MIRROR_STORE_PATH !== STORE_PATH) {
      const okMirror = this.writeStoreFile(MIRROR_STORE_PATH, payload);
      if (!okMirror) {
        logger.warn('[MultiTenantDB] Mirror write failed for ' + MIRROR_STORE_PATH);
      }
    }
    this.dirty = false;
    if (!okPrimary) {
      logger.warn('[MultiTenantDB] Primary store write failed — data kept in memory; will retry on next save');
    }
  }

  private saveStore() {
    this.dirty = true;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    // Persist immediately — debounce only coalesces bursts within the same tick
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveStoreImmediate();
    }, 0);
  }

  /** Ensure every collection bucket exists for a tenant (empty arrays — never invent demo rows). */
  private ensureTenantBuckets(tenantId: string) {
    const arrayKeys: Array<keyof LocalStoreSchema> = [
      'agents', 'leads', 'stages', 'fields', 'tasks', 'calls', 'integrations',
      'facebookPages', 'activities', 'lostReasons', 'workflows', 'templates', 'actions', 'campaigns', 'messages', 'whatsappTemplates', 'whatsappCampaigns'
    ];
    for (const key of arrayKeys) {
      const bucket = (this.store as any)[key] || ((this.store as any)[key] = {});
      if (bucket[tenantId] === undefined) {
        bucket[tenantId] = [];
      }
    }
  }

  private seedDefaultTenantIfNeeded() {
    // Intentionally empty: no mock tenants/agents/leads.
    // Workspaces are provisioned only via auth register → createTenant().
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
    this.ensureTenantBuckets(data.tenantId);

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

    if (this.postgresMode) {
      await this.persistTenantToPostgres(data.tenantId, { provision: true });
    } else {
      this.saveStore();
    }

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
  public async getLeads(tenantId: string, agentIds?: string[], isAdmin?: boolean): Promise<TenantLead[]> {
    this.ensureTenantBuckets(tenantId);
    const byId = new Map((this.store.agents[tenantId] || []).map((a) => [a.id, a]));
    const agentsList = this.store.agents[tenantId] || [];
    const agentsAdminId =
      agentsList.find((a) => a.isAdmin || String(a.role || '').toLowerCase().includes('admin'))?.id ||
      agentsList[0]?.id;
    const tenantLeads = [...(this.store.leads[tenantId] || [])].map((lead) => {
      // Backfill ownerAgentId from assignedTo for older Meta / Facebook leads
      let next = lead;
      if (!lead.ownerAgentId && lead.assignedTo) {
        next = { ...lead, ownerAgentId: String(lead.assignedTo) };
      }
      const agent = next.ownerAgentId ? byId.get(next.ownerAgentId) : undefined;
      if (agent && next.ownerAgentName !== agent.name) {
        next = { ...next, ownerAgentName: agent.name };
      }
      if (Array.isArray((next as any).activities)) {
        next = {
          ...next,
          activities: (next as any).activities.map((act: any) => {
            let mappedId = act.agentId;
            if (mappedId === 'agent-admin' && agentsAdminId && !byId.has('agent-admin')) {
              mappedId = agentsAdminId;
            }
            const resolved = mappedId ? byId.get(mappedId) : undefined;
            if (resolved && (act.agentName !== resolved.name || act.agentId !== mappedId)) {
              return { ...act, agentId: mappedId, agentName: resolved.name };
            }
            return act;
          })
        } as TenantLead;
      }
      return next;
    });

    tenantLeads.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

    if (!isAdmin) {
      const allowedAgentIds = new Set((agentIds || []).filter(Boolean));
      return tenantLeads.filter(
        (l) =>
          allowedAgentIds.has(l.ownerAgentId) ||
          (l.assignedTo ? allowedAgentIds.has(String(l.assignedTo)) : false)
      );
    }
    return tenantLeads;
  }

  public async saveLead(tenantId: string, leadData: Partial<TenantLead>): Promise<TenantLead> {
    this.ensureTenantBuckets(tenantId);
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

    const agentsForTenant = this.store.agents[targetTenantId] || [];
    const agentNameSet = new Set(
      agentsForTenant.map((a) => String(a.name || '').trim().toLowerCase()).filter(Boolean)
    );
    const metaContactName = (cf: any): string | null => {
      if (!cf || typeof cf !== 'object') return null;
      const firstLast = `${cf.first_name || cf.firstName || ''} ${cf.last_name || cf.lastName || ''}`.trim();
      for (const raw of [
        cf.full_name,
        cf.fullName,
        cf['Full name'],
        cf['Full Name'],
        cf.Name,
        cf.name,
        firstLast
      ]) {
        const n = String(raw || '').trim();
        if (n && !agentNameSet.has(n.toLowerCase())) return n;
      }
      return null;
    };
    const safeLeadName = (candidate: string | undefined, cf: any, fallback: string) => {
      const c = String(candidate || '').trim();
      if (c && !agentNameSet.has(c.toLowerCase()) && c !== 'Meta Test Lead' && !c.includes('<test lead')) {
        return c;
      }
      return metaContactName(cf) || (fallback && !agentNameSet.has(fallback.toLowerCase()) ? fallback : null) || c || 'New Inbound Lead';
    };

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

      const mergedCf = {
        ...(existing.customFields || {}),
        ...(leadData.customFields || {})
      };
      savedLead = {
        ...existing,
        ...leadData,
        id: existing.id, // Preserve existing ID
        name: safeLeadName(leadData.name, mergedCf, existing.name),
        phone: leadData.phone && !leadData.phone.includes('98765 00000') ? leadData.phone : existing.phone,
        email: leadData.email && !leadData.email.includes('test_lead@') ? leadData.email : existing.email,
        customFields: mergedCf,
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
        name: safeLeadName(leadData.name, leadData.customFields, 'New Inbound Lead'),
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

  /** Delete all Meta leads belonging to a Facebook page for this tenant. */
  public async deleteMetaLeadsByPage(tenantId: string, pageId: string): Promise<number> {
    if (!this.store.leads[tenantId]) return 0;
    const before = this.store.leads[tenantId].length;
    this.store.leads[tenantId] = this.store.leads[tenantId].filter((l) => {
      const metaPage = l.customFields?.meta_page_id || (l as any).pageId;
      const isMeta =
        String(l.source || '').toLowerCase().includes('meta') ||
        String(l.source || '').toLowerCase().includes('facebook') ||
        String(l.id || '').startsWith('meta-lead-');
      if (!isMeta) return true;
      return String(metaPage) !== String(pageId);
    });
    const removed = before - this.store.leads[tenantId].length;
    if (removed > 0) this.saveStore();
    return removed;
  }

  /** Delete all Meta leads belonging to a leadgen form for this tenant. */
  public async deleteMetaLeadsByForm(tenantId: string, formId: string): Promise<number> {
    if (!this.store.leads[tenantId]) return 0;
    const before = this.store.leads[tenantId].length;
    this.store.leads[tenantId] = this.store.leads[tenantId].filter((l) => {
      const metaForm = l.customFields?.meta_form_id || l.formId || l.customFields?.form_id;
      const isMeta =
        String(l.source || '').toLowerCase().includes('meta') ||
        String(l.source || '').toLowerCase().includes('facebook') ||
        String(l.id || '').startsWith('meta-lead-');
      if (!isMeta) return true;
      return String(metaForm) !== String(formId);
    });
    const removed = before - this.store.leads[tenantId].length;
    if (removed > 0) this.saveStore();
    return removed;
  }

  /** Delete every Meta/Facebook lead for a tenant (full account unlink). */
  public async deleteAllMetaLeads(tenantId: string): Promise<number> {
    if (!this.store.leads[tenantId]) return 0;
    const before = this.store.leads[tenantId].length;
    this.store.leads[tenantId] = this.store.leads[tenantId].filter((l) => {
      const isMeta =
        String(l.source || '').toLowerCase().includes('meta') ||
        String(l.source || '').toLowerCase().includes('facebook') ||
        String(l.id || '').startsWith('meta-lead-') ||
        !!l.customFields?.meta_leadgen_id;
      return !isMeta;
    });
    const removed = before - this.store.leads[tenantId].length;
    if (removed > 0) this.saveStore();
    return removed;
  }

  // =========================================================================
  // 3. TEAM MEMBERS / AGENTS (STRICTLY SCOPED TO tenantId)
  // =========================================================================
  public async getAgents(tenantId: string): Promise<TenantAgent[]> {
    this.ensureTenantBuckets(tenantId);
    return [...(this.store.agents[tenantId] || [])];
  }

  public async findAgentByEmail(email: string): Promise<TenantAgent | null> {
    const targetEmail = email.trim().toLowerCase();
    for (const agents of Object.values(this.store.agents || {})) {
      const match = agents.find((agent) => agent.email?.trim().toLowerCase() === targetEmail);
      if (match) return match;
    }
    return null;
  }

  public async saveAgent(tenantId: string, agentData: Partial<TenantAgent>): Promise<TenantAgent> {
    if (!this.store.agents[tenantId]) {
      this.store.agents[tenantId] = [];
    }

    const index = this.store.agents[tenantId].findIndex((a) => a.id === agentData.id);
    let agent: TenantAgent;

    const defaultRole = agentData.role || 'Telecaller';
    const roleLower = String(defaultRole).toLowerCase();
    const isTelecaller = roleLower.includes('caller') || roleLower === 'telecaller';
    const defaultPermission = agentData.permission || (agentData.isAdmin ? 'Admin' : defaultRole);
    const resolvedManagerId = isTelecaller
      ? (agentData.managerId !== undefined ? agentData.managerId : (index >= 0 ? this.store.agents[tenantId][index].managerId : undefined))
      : undefined;

    if (index >= 0) {
      agent = {
        ...this.store.agents[tenantId][index],
        ...agentData,
        role: defaultRole,
        permission: defaultPermission,
        isAdmin: agentData.isAdmin !== undefined ? Boolean(agentData.isAdmin) : (String(defaultPermission).toLowerCase() === 'admin'),
        managerId: resolvedManagerId,
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
        isAdmin: Boolean(agentData.isAdmin) || String(defaultPermission).toLowerCase() === 'admin',
        status: agentData.status || 'online',
        avatar: agentData.avatar || '',
        managerId: resolvedManagerId,
        passwordHash: agentData.passwordHash,
        totalCallsToday: 0,
        talkTimeMinutes: 0,
        convertedLeadsCount: 0,
        revenueGenerated: 0,
        responseTimeMinutes: 1.0
      };
      this.store.agents[tenantId].push(agent);
    }

    // Keep denormalized labels in sync when an agent is renamed
    if (agent?.id && agent?.name) {
      const byId = agent.id;
      const liveName = agent.name;
      for (const lead of this.store.leads[tenantId] || []) {
        if (lead.ownerAgentId === byId) lead.ownerAgentName = liveName;
      }
      for (const task of this.store.tasks[tenantId] || []) {
        if (task.assigneeAgentId === byId) task.assigneeAgentName = liveName;
      }
      for (const call of this.store.calls[tenantId] || []) {
        if (call.agentId === byId) {
          call.agentName = liveName;
          if ((call as any).assigneeName != null) (call as any).assigneeName = liveName;
        }
      }
      for (const act of this.store.activities[tenantId] || []) {
        if (act.agentId === byId) act.agentName = liveName;
      }
    }

    this.saveStore();
    if (this.postgresMode && agent.email) {
      void upsertMembership({
        tenantId,
        email: agent.email,
        agentId: agent.id,
        role: String(agent.role || 'Telecaller'),
        isAdmin: Boolean(agent.isAdmin),
        payload: { name: agent.name, phone: agent.phone }
      });
    }
    return agent;
  }

  public async deleteAgent(tenantId: string, agentId: string): Promise<boolean> {
    if (!this.store.agents[tenantId]) return false;
    this.store.agents[tenantId] = this.store.agents[tenantId].filter((a) => a.id !== agentId);
    this.saveStore();
    if (this.postgresMode) {
      void deleteMembership(tenantId, agentId);
    }
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

    const agents = this.store.agents[tenantId];
    let agentIndex = agents.findIndex((a) => a.id === currentId);
    if (agentIndex < 0 && data.email) {
      const emailLower = data.email.trim().toLowerCase();
      agentIndex = agents.findIndex((a) => (a.email || '').toLowerCase() === emailLower);
    }

    let agent: TenantAgent;
    const previous = agentIndex >= 0 ? agents[agentIndex] : null;
    const previousName = previous?.name || '';
    const previousId = previous?.id || currentId;
    const targetId = (data.id || previousId || currentId).trim() || currentId;

    if (agentIndex >= 0 && previous) {
      agent = {
        ...previous,
        id: targetId,
        name: data.name,
        email: data.email !== undefined ? data.email : previous.email,
        phone: data.phone !== undefined ? data.phone : previous.phone,
        avatar: data.avatar !== undefined ? data.avatar : previous.avatar,
        tenantId
      };
      agents[agentIndex] = agent;
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
      agents.push(agent);
    }

    const ownsByIdentity = (ownerId?: string, ownerName?: string) =>
      Boolean(
        (ownerId && (ownerId === previousId || ownerId === currentId)) ||
          (previousName && ownerName && ownerName.toLowerCase() === previousName.toLowerCase())
      );

    // Keep denormalized owner/assignee labels consistent across domain collections
    if (this.store.leads[tenantId]) {
      this.store.leads[tenantId].forEach((lead) => {
        if (ownsByIdentity(lead.ownerAgentId, lead.ownerAgentName)) {
          lead.ownerAgentId = targetId;
          lead.ownerAgentName = data.name;
        }
      });
    }

    if (this.store.tasks[tenantId]) {
      this.store.tasks[tenantId].forEach((task) => {
        if (ownsByIdentity(task.assigneeAgentId, task.assigneeAgentName)) {
          task.assigneeAgentId = targetId;
          task.assigneeAgentName = data.name;
        }
      });
    }

    if (this.store.calls?.[tenantId]) {
      this.store.calls[tenantId].forEach((call: any) => {
        if (ownsByIdentity(call.agentId, call.agentName) || ownsByIdentity(call.agentId, call.assigneeName)) {
          call.agentId = targetId;
          call.agentName = data.name;
          call.assigneeName = data.name;
        }
      });
    }

    if (this.store.activities?.[tenantId]) {
      this.store.activities[tenantId].forEach((act: any) => {
        if (ownsByIdentity(act.agentId, act.agentName)) {
          act.agentId = targetId;
          act.agentName = data.name;
        }
      });
    }

    // Campaign / WhatsApp embedded agent snapshots + any remaining stale labels
    this.healDenormalizedAgentLabels();
    this.saveStore();
    return agent;
  }

  // =========================================================================
  // 4. PIPELINE STAGES (STRICTLY SCOPED TO tenantId)
  // =========================================================================
  public async getPipelines(tenantId: string): Promise<TenantStage[]> {
    this.ensureTenantBuckets(tenantId);
    // Only seed defaults when the tenant has never had stages (undefined), not when intentionally empty
    if (this.store.stages[tenantId] === undefined) {
      this.store.stages[tenantId] = DEFAULT_STAGES.map((s) => ({ ...s, tenantId }));
      this.saveStore();
    } else if (!this.store.stages[tenantId] || this.store.stages[tenantId].length === 0) {
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
    const byId = new Map((this.store.agents[tenantId] || []).map((a) => [a.id, a]));
    return (this.store.tasks[tenantId] || []).map((task) => {
      const agent = task.assigneeAgentId ? byId.get(task.assigneeAgentId) : undefined;
      if (agent && task.assigneeAgentName !== agent.name) {
        return { ...task, assigneeAgentName: agent.name };
      }
      return task;
    });
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
    const byId = new Map((this.store.agents[tenantId] || []).map((a) => [a.id, a]));
    return (this.store.calls[tenantId] || []).map((call) => {
      const agent = call.agentId ? byId.get(call.agentId) : undefined;
      if (!agent) return call;
      let next = call;
      if (call.agentName !== agent.name) next = { ...next, agentName: agent.name };
      if ((call as any).assigneeName != null && (call as any).assigneeName !== agent.name) {
        next = { ...next, assigneeName: agent.name } as TenantCall;
      }
      return next;
    });
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
        callType: callData.callType || (callData as any).type || 'outgoing',
        disposition: callData.disposition || 'Connected',
        recordingUrl: callData.recordingUrl,
        callNotes: callData.callNotes || (callData as any).notes,
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
    if (this.postgresMode && page.pageId) {
      void upsertFacebookPageIndex(String(page.pageId), tenantId);
    }
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
      if (this.postgresMode) {
        void deleteFacebookPageIndex(pageId);
      }
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
  private normalizeCampaignHandle(str: string, fallback = ''): string {
    if (!str) return fallback;
    const withoutAt = String(str).trim().replace(/^@+/, '');
    const clean = withoutAt
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return clean ? `@${clean}` : fallback;
  }

  private isMetaCampaignSource(source?: string): boolean {
    return String(source || '').toLowerCase() === 'facebook lead ads';
  }

  public async getCampaigns(
    tenantId: string,
    opts?: { pageId?: string }
  ): Promise<TenantCampaign[]> {
    if (!this.store.campaigns) {
      this.store.campaigns = {};
    }
    const customList = this.store.campaigns[tenantId] || [];
    const campaignMap = new Map<string, TenantCampaign>();
    const liveFormIds = new Set<string>();
    const liveHandles = new Set<string>();
    const pageFilter = opts?.pageId ? String(opts.pageId) : '';

    // Connected Facebook pages for this tenant (used when no explicit pageId is passed)
    const connectedPageIds = new Set(
      (this.store.facebookPages?.[tenantId] || [])
        .filter((p) => p.status === 'active' && p.pageId)
        .map((p) => String(p.pageId))
    );

    const mappingMatchesPage = (mappingPageId: string) => {
      if (pageFilter) return !mappingPageId || mappingPageId === pageFilter;
      if (mappingPageId && connectedPageIds.size > 0 && !connectedPageIds.has(mappingPageId)) return false;
      return true;
    };

    // 1. Live Meta form mappings are the source of truth for Facebook campaigns
    try {
      const integrations = this.store.integrations?.[tenantId] || [];
      const fbIntegration = integrations.find((i) => i.id === 'facebook');
      const mappings: Record<string, any> = (fbIntegration?.credentials as any)?.campaignMappings || {};

      Object.values(mappings).forEach((m: any) => {
        if (!m) return;
        const mappingPageId = m.pageId ? String(m.pageId) : '';
        const name = m.campaignName || m.formName || 'Meta Campaign';
        const handle = this.normalizeCampaignHandle(m.campaignHandle || name, '@campaign');
        const key = handle.toLowerCase();
        // Always register live mapping identity so page-scoped reads cannot prune other pages
        if (m.formId) liveFormIds.add(String(m.formId));
        liveHandles.add(key);

        if (!mappingMatchesPage(mappingPageId)) return;

        campaignMap.set(key, {
          id: `camp-meta-${m.formId || key.replace(/^@/, '')}`,
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
          assignedAgentIds: Array.isArray(m.leadDistribution)
            ? m.leadDistribution.map((a: any) => a.id).filter(Boolean)
            : (m.assignedAgentIds || []),
          assignedAgentNames: m.assignedAgentNames || [],
          updatedAt: m.updatedAt || new Date().toISOString()
        });
      });
    } catch {}

    // 2. Custom workspace campaigns + still-mapped Meta mirrors. Drop stale Meta leftovers.
    const keptCustom: TenantCampaign[] = [];
    customList.forEach((c) => {
      const handle = this.normalizeCampaignHandle(c.handle || c.name, '@campaign');
      const key = handle.toLowerCase();
      const stillMapped = Boolean(
        (c.formId && liveFormIds.has(String(c.formId))) || liveHandles.has(key)
      );
      if (this.isMetaCampaignSource(c.source) && !stillMapped) {
        return;
      }
      const normalized = { ...c, handle };
      keptCustom.push(normalized);

      const campPageId = c.pageId ? String(c.pageId) : '';
      if (pageFilter) {
        // Chosen page: Meta campaigns must match; workspace-only (no page) still allowed
        if (campPageId && campPageId !== pageFilter) return;
        if (this.isMetaCampaignSource(c.source) && campPageId && campPageId !== pageFilter) return;
      } else if (campPageId && connectedPageIds.size > 0 && this.isMetaCampaignSource(c.source) && !connectedPageIds.has(campPageId)) {
        return;
      }

      if (!campaignMap.has(key)) {
        campaignMap.set(key, normalized);
      } else {
        const existing = campaignMap.get(key)!;
        campaignMap.set(key, {
          ...existing,
          ...normalized,
          id: normalized.id || existing.id,
          handle,
          formId: normalized.formId || existing.formId,
          formName: normalized.formName || existing.formName,
          pageId: normalized.pageId || existing.pageId,
          pageName: normalized.pageName || existing.pageName
        });
      }
    });

    if (keptCustom.length !== customList.length) {
      this.store.campaigns[tenantId] = keptCustom;
      this.saveStore();
      logger.info(
        `[MultiTenantDb] Pruned ${customList.length - keptCustom.length} stale Meta campaign(s) for tenant ${tenantId}`
      );
    }

    return Array.from(campaignMap.values());
  }

  public async saveCampaign(tenantId: string, campaignData: Partial<TenantCampaign> & { name: string }): Promise<TenantCampaign> {
    if (!this.store.campaigns) {
      this.store.campaigns = {};
    }
    if (!this.store.campaigns[tenantId]) {
      this.store.campaigns[tenantId] = [];
    }

    const now = new Date().toISOString();
    const handle = this.normalizeCampaignHandle(campaignData.handle || campaignData.name, '@campaign');
    const cleanHandle = handle.toLowerCase();

    const existingIndex = this.store.campaigns[tenantId].findIndex(
      (c) => c.id === campaignData.id || this.normalizeCampaignHandle(c.handle).toLowerCase() === cleanHandle
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
    if (!this.store.campaigns) this.store.campaigns = {};
    if (!this.store.campaigns[tenantId]) this.store.campaigns[tenantId] = [];

    const decoded = decodeURIComponent(campaignIdOrHandle || '');
    const targetHandle = this.normalizeCampaignHandle(decoded);
    const targetRaw = decoded.toLowerCase();
    const metaFormIdFromId = decoded.startsWith('camp-meta-') ? decoded.slice('camp-meta-'.length) : '';

    const removed = this.store.campaigns[tenantId].filter(
      (c) =>
        c.id === campaignIdOrHandle ||
        c.id === decoded ||
        c.handle.toLowerCase() === targetRaw ||
        (targetHandle && this.normalizeCampaignHandle(c.handle) === targetHandle)
    );

    const removedIds = new Set(removed.map((c) => c.id));
    const removedFormIds = new Set(removed.map((c) => String(c.formId || '')).filter(Boolean));
    const removedHandles = new Set(removed.map((c) => this.normalizeCampaignHandle(c.handle)));
    if (metaFormIdFromId) removedFormIds.add(metaFormIdFromId);
    if (targetHandle) removedHandles.add(targetHandle);

    if (removedIds.size > 0) {
      this.store.campaigns[tenantId] = this.store.campaigns[tenantId].filter((c) => !removedIds.has(c.id));
    }

    let mappingRemoved = false;
    const integrations = this.store.integrations?.[tenantId] || [];
    const fbIdx = integrations.findIndex((i) => i.id === 'facebook');
    if (fbIdx >= 0) {
      const creds = { ...(integrations[fbIdx].credentials || {}) } as any;
      const campaignMappings = { ...(creds.campaignMappings || {}) };
      for (const [formId, m] of Object.entries(campaignMappings) as [string, any][]) {
        const mappedHandle = this.normalizeCampaignHandle(m?.campaignHandle || m?.campaignName || '');
        if (
          removedFormIds.has(String(formId)) ||
          (m?.formId && removedFormIds.has(String(m.formId))) ||
          (mappedHandle && removedHandles.has(mappedHandle))
        ) {
          delete campaignMappings[formId];
          mappingRemoved = true;
        }
      }
      if (mappingRemoved) {
        creds.campaignMappings = campaignMappings;
        this.store.integrations[tenantId][fbIdx] = {
          ...integrations[fbIdx],
          credentials: creds,
          updatedAt: new Date().toISOString()
        };
      }
    }

    const deleted = removed.length > 0 || mappingRemoved;
    if (deleted) this.saveStore();
    return deleted;
  }

  /** Remove Meta campaignMappings + mirrored campaigns for a page. */
  public async deleteMetaMappingsByPage(
    tenantId: string,
    pageId: string
  ): Promise<{ mappings: number; campaigns: number }> {
    let mappings = 0;
    let campaigns = 0;
    const integrations = this.store.integrations?.[tenantId] || [];
    const fbIdx = integrations.findIndex((i) => i.id === 'facebook');
    if (fbIdx >= 0) {
      const creds = { ...(integrations[fbIdx].credentials || {}) } as any;
      const campaignMappings = { ...(creds.campaignMappings || {}) };
      const formIds: string[] = [];
      for (const [formId, m] of Object.entries(campaignMappings) as [string, any][]) {
        if (m && String(m.pageId) === String(pageId)) {
          formIds.push(formId);
          delete campaignMappings[formId];
          mappings++;
        }
      }
      creds.campaignMappings = campaignMappings;
      this.store.integrations[tenantId][fbIdx] = {
        ...integrations[fbIdx],
        credentials: creds,
        isConnected: Object.keys(campaignMappings).length > 0 || integrations[fbIdx].isConnected,
        updatedAt: new Date().toISOString()
      };

      if (this.store.campaigns?.[tenantId]) {
        const before = this.store.campaigns[tenantId].length;
        this.store.campaigns[tenantId] = this.store.campaigns[tenantId].filter((c) => {
          if (String(c.pageId) === String(pageId)) return false;
          if (c.formId && formIds.includes(String(c.formId))) return false;
          return true;
        });
        campaigns = before - this.store.campaigns[tenantId].length;
      }
      this.saveStore();
    }
    return { mappings, campaigns };
  }

  /** Remove a single form mapping + mirrored campaign. */
  public async deleteMetaMappingByForm(
    tenantId: string,
    formId: string
  ): Promise<{ mappings: number; campaigns: number }> {
    let mappings = 0;
    let campaigns = 0;
    const integrations = this.store.integrations?.[tenantId] || [];
    const fbIdx = integrations.findIndex((i) => i.id === 'facebook');
    if (fbIdx >= 0) {
      const creds = { ...(integrations[fbIdx].credentials || {}) } as any;
      const campaignMappings = { ...(creds.campaignMappings || {}) };
      if (campaignMappings[formId]) {
        delete campaignMappings[formId];
        mappings = 1;
      }
      creds.campaignMappings = campaignMappings;
      const remaining = Object.keys(campaignMappings).length;
      this.store.integrations[tenantId][fbIdx] = {
        ...integrations[fbIdx],
        credentials: creds,
        updatedAt: new Date().toISOString()
      };

      if (this.store.campaigns?.[tenantId]) {
        const before = this.store.campaigns[tenantId].length;
        this.store.campaigns[tenantId] = this.store.campaigns[tenantId].filter(
          (c) => String(c.formId) !== String(formId)
        );
        campaigns = before - this.store.campaigns[tenantId].length;
      }
      this.saveStore();
      void remaining;
    }
    return { mappings, campaigns };
  }

  /** Clear facebook integration connection flag and credentials after full unlink. */
  public async clearFacebookIntegration(tenantId: string): Promise<void> {
    const integrations = this.store.integrations?.[tenantId] || [];
    const fbIdx = integrations.findIndex((i) => i.id === 'facebook');
    if (fbIdx >= 0) {
      this.store.integrations[tenantId][fbIdx] = {
        ...integrations[fbIdx],
        isConnected: false,
        credentials: {},
        updatedAt: new Date().toISOString()
      };
      this.saveStore();
    }
    // Also wipe any leftover Meta-sourced campaigns
    if (this.store.campaigns?.[tenantId]) {
      this.store.campaigns[tenantId] = this.store.campaigns[tenantId].filter(
        (c) => String(c.source || '').toLowerCase() !== 'facebook lead ads'
      );
      this.saveStore();
    }
  }

  // =========================================================================
  // MESSAGES / WHATSAPP TEMPLATES / WHATSAPP CAMPAIGNS
  // =========================================================================
  public async getMessages(tenantId: string): Promise<TenantMessage[]> {
    this.ensureTenantBuckets(tenantId);
    return [...(this.store.messages[tenantId] || [])];
  }

  public async saveMessage(tenantId: string, messageData: Partial<TenantMessage>): Promise<TenantMessage> {
    this.ensureTenantBuckets(tenantId);
    const list = this.store.messages[tenantId];
    const idx = list.findIndex((m) => m.id === messageData.id);
    const now = new Date().toISOString();
    let saved: TenantMessage;
    if (idx >= 0) {
      saved = { ...list[idx], ...messageData, tenantId, updatedAt: now } as TenantMessage;
      list[idx] = saved;
    } else {
      saved = {
        id: messageData.id || `msg-${Date.now()}`,
        tenantId,
        leadId: messageData.leadId || '',
        direction: messageData.direction || 'outbound',
        channel: messageData.channel || 'whatsapp',
        content: messageData.content || '',
        mediaUrl: messageData.mediaUrl,
        status: messageData.status || 'delivered',
        timestamp: messageData.timestamp || now,
        templateId: messageData.templateId,
        isBot: messageData.isBot,
        createdAt: now,
        updatedAt: now
      };
      list.unshift(saved);
    }
    this.saveStore();
    return saved;
  }

  public async getWhatsappTemplates(tenantId: string): Promise<any[]> {
    this.ensureTenantBuckets(tenantId);
    return [...(this.store.whatsappTemplates[tenantId] || [])];
  }

  public async saveWhatsappTemplate(tenantId: string, data: any): Promise<any> {
    this.ensureTenantBuckets(tenantId);
    const list = this.store.whatsappTemplates[tenantId];
    const idx = list.findIndex((t: any) => t.id === data.id);
    const saved = { ...data, id: data.id || `wa-tmpl-${Date.now()}`, tenantId, updatedAt: new Date().toISOString() };
    if (idx >= 0) list[idx] = { ...list[idx], ...saved };
    else list.unshift(saved);
    this.saveStore();
    return saved;
  }

  public async getWhatsappCampaigns(tenantId: string): Promise<any[]> {
    this.ensureTenantBuckets(tenantId);
    return [...(this.store.whatsappCampaigns[tenantId] || [])];
  }

  public async saveWhatsappCampaign(tenantId: string, data: any): Promise<any> {
    this.ensureTenantBuckets(tenantId);
    const list = this.store.whatsappCampaigns[tenantId];
    const idx = list.findIndex((c: any) => c.id === data.id);
    const saved = { ...data, id: data.id || `wa-camp-${Date.now()}`, tenantId, updatedAt: new Date().toISOString() };
    if (idx >= 0) list[idx] = { ...list[idx], ...saved };
    else list.unshift(saved);
    this.saveStore();
    return saved;
  }

  // =========================================================================
  // WORKSPACE SETTINGS (stored on tenants[tenantId].settings)
  // =========================================================================
  public async getWorkspaceSettings(tenantId: string): Promise<Record<string, any>> {
    this.ensureTenantBuckets(tenantId);
    const tenant = this.store.tenants[tenantId];
    if (!tenant) {
      return {
        companyName: '',
        supportEmail: '',
        currency: 'INR',
        workspaceFeatures: {},
        callFeedbackStatuses: [],
        permissionTemplates: [],
        general: {}
      };
    }
    const settings = tenant.settings || {};
    return {
      companyName: tenant.companyName || settings.companyName || '',
      supportEmail: settings.supportEmail || tenant.ownerEmail || '',
      currency: settings.currency || 'INR',
      workspaceFeatures: settings.workspaceFeatures || {},
      callFeedbackStatuses: settings.callFeedbackStatuses || [],
      permissionTemplates: settings.permissionTemplates || [],
      general: settings.general || {},
      ...settings
    };
  }

  public async saveWorkspaceSettings(tenantId: string, patch: Record<string, any>): Promise<Record<string, any>> {
    this.ensureTenantBuckets(tenantId);
    if (!this.store.tenants[tenantId]) {
      this.store.tenants[tenantId] = {
        tenantId,
        companyName: patch.companyName || tenantId,
        ownerEmail: patch.supportEmail || '',
        status: 'ACTIVE',
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    const tenant = this.store.tenants[tenantId];
    const prev = tenant.settings || {};
    const next: Record<string, any> = {
      ...prev,
      ...patch,
      workspaceFeatures: patch.workspaceFeatures !== undefined
        ? { ...(prev.workspaceFeatures || {}), ...patch.workspaceFeatures }
        : prev.workspaceFeatures,
      general: patch.general !== undefined
        ? { ...(prev.general || {}), ...patch.general }
        : prev.general,
      callFeedbackStatuses: patch.callFeedbackStatuses !== undefined
        ? patch.callFeedbackStatuses
        : prev.callFeedbackStatuses,
      permissionTemplates: patch.permissionTemplates !== undefined
        ? patch.permissionTemplates
        : prev.permissionTemplates
    };
    if (patch.companyName) {
      tenant.companyName = String(patch.companyName);
      next.companyName = tenant.companyName;
      const agents = this.store.agents[tenantId] || [];
      agents.forEach((agent) => {
        agent.companyName = tenant.companyName;
      });
    }
    if (patch.currency) next.currency = patch.currency;
    if (patch.supportEmail) next.supportEmail = patch.supportEmail;
    tenant.settings = next;
    tenant.updatedAt = new Date().toISOString();
    this.saveStore();
    return this.getWorkspaceSettings(tenantId);
  }

}

export const multiTenantDb = new MultiTenantDatabase();
