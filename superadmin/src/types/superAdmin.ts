export type SuperAdminTab = 
  | 'overview' 
  | 'tenants' 
  | 'billing' 
  | 'database' 
  | 'users' 
  | 'ai-quotas' 
  | 'omnichannel' 
  | 'audit-logs';

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'ARCHIVED';
export type PlanTier = 'Starter' | 'Growth' | 'Enterprise' | 'Custom';

export interface SuperAdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SUPPORT_ADMIN' | 'FINANCE_ADMIN';
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
}

export interface SuperAdminOverviewStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalLeads: number;
  totalAgents: number;
  totalCallsToday: number;
  talkTimeMinutesToday: number;
  mrr: number; // in INR
  arr: number; // in INR
  rdsConnected: boolean;
  rdsDatabase?: string;
  rdsLatencyMs: number;
  growthTrends: Array<{
    month: string;
    tenants: number;
    revenue: number;
    leads: number;
  }>;
  callVolumeByHour: Array<{
    hour: string;
    calls: number;
    talkTime: number;
  }>;
  planDistribution: Array<{
    plan: PlanTier;
    count: number;
    revenue: number;
  }>;
}

export interface TenantRecord {
  id: string;
  tenantId: string;
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  businessType?: string;
  businessTypeOther?: string;
  referralSource?: string;
  status: TenantStatus;
  planTier: PlanTier;
  agentsCount: number;
  leadsCount: number;
  callsCount: number;
  convertedRevenue: number;
  currency: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  companyName?: string;
  planTier: PlanTier;
  billingCycle: 'monthly' | 'annual';
  amount: number;
  currency: string;
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  maxAgents: number;
  maxLeadsPerMonth: number;
  aiCreditsBalance: number;
  razorpaySubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetTenantId?: string;
  targetTenantName?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface DatabaseTableSummary {
  tableName: string;
  rowCount: number;
  columns: string[];
  sampleRows?: any[];
}

export interface AiTenantQuota {
  tenantId: string;
  companyName: string;
  planTier: PlanTier;
  geminiTokensUsed: number;
  geminiTokenLimit: number;
  voiceBotMinutesUsed: number;
  voiceBotMinuteLimit: number;
  autoLeadScoringEnabled: boolean;
  sentimentAnalysisEnabled: boolean;
}

export interface GlobalPlatformSettings {
  maintenanceMode: boolean;
  allowPublicSignups: boolean;
  defaultTrialDays: number;
  globalNoticeMessage?: string;
  autoApproveWhatsAppTemplates: boolean;
  minPasswordLength: number;
}
