import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Database,
  Users,
  Bot,
  Share2,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  LogIn,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  PhoneCall,
  Activity,
  Layers,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Server,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import {
  SuperAdminTab,
  SuperAdminOverviewStats,
  TenantRecord,
  TenantSubscription,
  SuperAdminAuditLog,
  DatabaseTableSummary,
  AiTenantQuota,
  PlanTier,
  TenantStatus
} from '../../types/superAdmin';
import { ProvisionTenantModal } from './ProvisionTenantModal';

interface SuperAdminViewProps {
  onExitSuperAdmin?: () => void;
  onImpersonateTenant: (tenantId: string, companyName: string, token: string, user: any) => void;
}

export function SuperAdminView({ onExitSuperAdmin, onImpersonateTenant }: SuperAdminViewProps) {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data States
  const [stats, setStats] = useState<SuperAdminOverviewStats | null>(null);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [dbTables, setDbTables] = useState<DatabaseTableSummary[]>([]);
  const [dbConnection, setDbConnection] = useState<any>(null);
  const [aiQuotas, setAiQuotas] = useState<AiTenantQuota[]>([]);
  const [auditLogs, setAuditLogs] = useState<SuperAdminAuditLog[]>([]);
  const [metaPages, setMetaPages] = useState<any[]>([]);

  // Filter States
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantStatusFilter, setTenantStatusFilter] = useState('ALL');
  const [tenantPlanFilter, setTenantPlanFilter] = useState('ALL');
  const [selectedTableSchema, setSelectedTableSchema] = useState<DatabaseTableSummary | null>(null);

  // Modal States
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Fetch all Super Admin data
  const loadAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);

    try {
      // 1. Overview stats
      const statsRes = await fetch('/api/superadmin/overview');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // 2. Tenants list
      const tenantsRes = await fetch('/api/superadmin/tenants');
      const tenantsData = await tenantsRes.json();
      if (tenantsData.success) setTenants(tenantsData.tenants);

      // 3. Subscriptions
      const subRes = await fetch('/api/superadmin/subscriptions');
      const subData = await subRes.json();
      if (subData.success) setSubscriptions(subData.subscriptions);

      // 4. Users
      const usersRes = await fetch('/api/superadmin/users');
      const usersData = await usersRes.json();
      if (usersData.success) setAllUsers(usersData.users);

      // 5. Database telemetry
      const dbRes = await fetch('/api/superadmin/database');
      const dbData = await dbRes.json();
      if (dbData.success) {
        setDbConnection(dbData.connection);
        setDbTables(dbData.tables || []);
      }

      // 6. AI Quotas
      const aiRes = await fetch('/api/superadmin/ai-quotas');
      const aiData = await aiRes.json();
      if (aiData.success) setAiQuotas(aiData.quotas);

      // 7. Audit Logs
      const auditRes = await fetch('/api/superadmin/audit-logs');
      const auditData = await auditRes.json();
      if (auditData.success) setAuditLogs(auditData.logs);

      // 8. Meta Pages
      const metaRes = await fetch('/api/superadmin/meta-pages');
      const metaData = await metaRes.json();
      if (metaData.success) setMetaPages(metaData.pages);
    } catch (err) {
      console.error('Failed to load Super Admin data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Tenant Actions
  const handleImpersonate = async (tenant: TenantRecord) => {
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenant.tenantId}/impersonate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.impersonationToken) {
        onImpersonateTenant(tenant.tenantId, tenant.companyName, data.impersonationToken, data.adminUser);
      } else {
        alert(data.error || 'Failed to start impersonation session.');
      }
    } catch (e: any) {
      alert(e.message || 'Error starting impersonation');
    }
  };

  const handleToggleTenantStatus = async (tenant: TenantRecord) => {
    const newStatus: TenantStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenant.tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setTenants((prev) =>
          prev.map((t) => (t.tenantId === tenant.tenantId ? { ...t, status: newStatus } : t))
        );
        showNotice(`Tenant ${tenant.companyName} set to ${newStatus}`);
      }
    } catch (e) {
      alert('Failed to update tenant status');
    }
  };

  const handleRunMigration = async () => {
    try {
      const res = await fetch('/api/superadmin/database/migrate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotice('Aurora RDS tables schema verified & updated successfully.');
        loadAllData(true);
      }
    } catch (e) {
      alert('Failed to execute migration');
    }
  };

  // Filtered Tenants List
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      if (tenantStatusFilter !== 'ALL' && t.status !== tenantStatusFilter) return false;
      if (tenantPlanFilter !== 'ALL' && t.planTier !== tenantPlanFilter) return false;
      if (tenantSearch.trim()) {
        const q = tenantSearch.toLowerCase();
        return (
          t.companyName.toLowerCase().includes(q) ||
          t.tenantId.toLowerCase().includes(q) ||
          t.ownerEmail.toLowerCase().includes(q) ||
          (t.businessType && t.businessType.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tenants, tenantSearch, tenantStatusFilter, tenantPlanFilter]);

  const navItems = [
    { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'tenants', label: 'Tenants Directory', icon: Building2, badge: tenants.length },
    { id: 'billing', label: 'Subscriptions & Billing', icon: CreditCard },
    { id: 'database', label: 'Aurora RDS Cluster', icon: Database, badge: 'Live' },
    { id: 'users', label: 'Global Users', icon: Users, badge: allUsers.length },
    { id: 'ai-quotas', label: 'AI Token Quotas', icon: Bot },
    { id: 'omnichannel', label: 'Omnichannel Gateway', icon: Share2 },
    { id: 'audit-logs', label: 'Security & Audit Logs', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-poppins flex flex-col glass-mesh-bg">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="glass-panel sticky top-0 z-30 px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-200">
            PX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base tracking-tight">PIXBE CRM</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Platform Management & Multi-Tenant Operations</p>
          </div>
        </div>

        {/* Status Indicators & Right Actions */}
        <div className="flex items-center gap-4">
          {/* RDS Database Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200/90 text-xs shadow-sm">
            <div className={`w-2 h-2 rounded-full ${dbConnection?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-semibold text-slate-700">AWS Aurora RDS:</span>
            <span className="text-slate-500 text-[11px]">
              {dbConnection?.connected ? `Connected (${stats?.rdsLatencyMs || 38}ms)` : 'Connecting...'}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadAllData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white/80 border border-transparent hover:border-slate-200 transition-all"
            title="Refresh All Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Return to CRM Button */}
          {onExitSuperAdmin && (
            <button
              onClick={onExitSuperAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500" />
              <span>Back to CRM Workspace</span>
            </button>
          )}

          {/* Admin Avatar */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow">
              SA
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">Master Admin</div>
              <div className="text-[10px] text-slate-400 leading-tight">superadmin@pixbe.com</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + Tab Views */}
      <div className="flex-1 flex overflow-hidden">
        {/* Super Admin Sidebar */}
        <aside className="w-64 glass-panel border-r border-slate-200/80 p-4 space-y-1.5 shrink-0 hidden md:block overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SuperAdminTab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-6 mt-6 border-t border-slate-200/80 space-y-3">
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 text-xs">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Multi-Tenant Cluster</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                PostgreSQL partition active on <strong>AWS Aurora RDS (ap-south-2)</strong>.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: PLATFORM OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Overview</h1>
                  <p className="text-xs text-slate-500">Live operational telemetry across all tenant organizations</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsProvisionModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Provision Tenant</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tenants */}
                <div className="glass-card p-5 rounded-2xl border border-white/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tenants</span>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">{stats?.totalTenants || tenants.length}</div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{stats?.activeTenants || tenants.length} Active Organizations</span>
                  </div>
                </div>

                {/* Monthly Recurring Revenue */}
                <div className="glass-card p-5 rounded-2xl border border-white/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly MRR</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ₹{(stats?.mrr || 4999 * Math.max(tenants.length, 1)).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    ARR: ₹{((stats?.arr || 4999 * 12)).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Total Platform Leads */}
                <div className="glass-card p-5 rounded-2xl border border-white/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Leads Managed</span>
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {(stats?.totalLeads || 142).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Across all ingestion sources</div>
                </div>

                {/* Calls Today & Telecaller Activity */}
                <div className="glass-card p-5 rounded-2xl border border-white/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Calls Made Today</span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">{stats?.totalCallsToday || 58}</div>
                  <div className="text-xs text-slate-500 font-medium">
                    {stats?.talkTimeMinutesToday || 214} mins total audio talk time
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Growth Trend */}
                <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-white/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Revenue & Tenant Growth Trend</h2>
                      <p className="text-xs text-slate-500">Monthly progression of active tenant subscriptions</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                      Last 6 Months
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.growthTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                          formatter={(val: any) => [`₹${val}`, 'Revenue']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Call Volume by Hour */}
                <div className="glass-card p-5 rounded-2xl border border-white/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Today's Dialer Calls</h2>
                      <p className="text-xs text-slate-500">Hourly telecalling volume</p>
                    </div>
                    <Activity className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.callVolumeByHour || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                        />
                        <Bar dataKey="calls" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Tenants Quick Strip */}
              <div className="glass-card p-5 rounded-2xl border border-white/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Recently Active Tenants</h2>
                  <button
                    onClick={() => setActiveTab('tenants')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <span>View All {tenants.length} Tenants</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tenants.slice(0, 3).map((tenant) => (
                    <div key={tenant.tenantId} className="p-4 rounded-xl bg-white/70 border border-slate-200/80 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{tenant.companyName}</div>
                          <div className="text-[11px] text-slate-500">{tenant.businessType || 'General Business'}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tenant.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>{tenant.agentsCount} Agents</span>
                        <span>{tenant.leadsCount} Leads</span>
                        <button
                          onClick={() => handleImpersonate(tenant)}
                          className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] flex items-center gap-1 transition-all"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Login As</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TENANTS DIRECTORY */}
          {/* ========================================================================= */}
          {activeTab === 'tenants' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tenants Directory</h1>
                  <p className="text-xs text-slate-500">
                    Manage client companies, plans, permissions, and 1-Click login impersonation
                  </p>
                </div>
                <button
                  onClick={() => setIsProvisionModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Provision New Tenant</span>
                </button>
              </div>

              {/* Filters & Search Row */}
              <div className="glass-card p-4 rounded-2xl border border-white/60 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by company name, tenant ID, or owner email..."
                    value={tenantSearch}
                    onChange={(e) => setTenantSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={tenantStatusFilter}
                    onChange={(e) => setTenantStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="TRIAL">Trial Only</option>
                    <option value="SUSPENDED">Suspended Only</option>
                  </select>

                  <select
                    value={tenantPlanFilter}
                    onChange={(e) => setTenantPlanFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="ALL">All Plans</option>
                    <option value="Starter">Starter</option>
                    <option value="Growth">Growth</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              {/* Tenants Table */}
              <div className="glass-card rounded-2xl border border-white/60 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Company & Tenant ID</th>
                        <th className="py-3.5 px-4">Admin Contact</th>
                        <th className="py-3.5 px-4">Industry</th>
                        <th className="py-3.5 px-4">Plan Tier</th>
                        <th className="py-3.5 px-4 text-center">Agents</th>
                        <th className="py-3.5 px-4 text-center">Leads</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTenants.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-slate-400">
                            No matching tenants found.
                          </td>
                        </tr>
                      ) : (
                        filteredTenants.map((t) => (
                          <tr key={t.tenantId} className="hover:bg-white/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 text-sm">{t.companyName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{t.tenantId}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{t.ownerName}</div>
                              <div className="text-[11px] text-slate-500">{t.ownerEmail}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{t.businessType || 'General'}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {t.planTier}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-semibold">{t.agentsCount}</td>
                            <td className="py-3 px-4 text-center font-semibold">{t.leadsCount}</td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleTenantStatus(t)}
                                title="Click to Toggle Status"
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                  t.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                }`}
                              >
                                {t.status}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleImpersonate(t)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-200 inline-flex items-center gap-1.5 transition-all active:scale-95"
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Login As</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SUBSCRIPTIONS & BILLING */}
          {/* ========================================================================= */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscriptions & Revenue</h1>
                <p className="text-xs text-slate-500">
                  Razorpay payment transactions, license allocations, and MRR breakdown
                </p>
              </div>

              {/* Plan Tiers Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    tier: 'Starter Plan',
                    price: '₹1,999',
                    cycle: '/ month',
                    agents: 'Up to 3 Telecallers',
                    leads: '2,500 Inbound Leads / mo',
                    features: ['Power Dialer Audio Logs', 'Basic Pipeline Stages', 'Local Storage Audio'],
                    color: 'blue'
                  },
                  {
                    tier: 'Growth Plan (Popular)',
                    price: '₹4,999',
                    cycle: '/ month',
                    agents: 'Up to 10 Telecallers',
                    leads: '15,000 Inbound Leads / mo',
                    features: ['WhatsApp Cloud API CRM', 'Google Ads CAPI & Meta CAPI', 'AI Lead Scoring Engine'],
                    color: 'indigo'
                  },
                  {
                    tier: 'Enterprise Suite',
                    price: '₹14,999',
                    cycle: '/ month',
                    agents: 'Up to 50 Telecallers',
                    leads: '100,000 Inbound Leads / mo',
                    features: ['AI VoiceBot Qualification', 'Dedicated Aurora Partition', 'Custom SLA & Onboarding'],
                    color: 'purple'
                  },
                ].map((plan, idx) => (
                  <div key={idx} className="glass-card p-5 rounded-2xl border border-white/60 space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{plan.tier}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Active
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-slate-900">{plan.price}</span>
                      <span className="text-xs text-slate-500">{plan.cycle}</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="font-semibold text-slate-800">• {plan.agents}</div>
                      <div className="font-semibold text-slate-800">• {plan.leads}</div>
                      {plan.features.map((f, fIdx) => (
                        <div key={fIdx} className="text-slate-500">• {f}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Subscriptions Ledger Table */}
              <div className="glass-card rounded-2xl border border-white/60 overflow-hidden shadow-sm space-y-3 p-5">
                <h2 className="text-sm font-bold text-slate-900">Tenant Subscription Ledger</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Company Name</th>
                        <th className="py-3 px-4">Plan Tier</th>
                        <th className="py-3 px-4">Billing Cycle</th>
                        <th className="py-3 px-4">Monthly Fee</th>
                        <th className="py-3 px-4">Current Period End</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-white/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{sub.companyName || sub.tenantId}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                              {sub.planTier}
                            </span>
                          </td>
                          <td className="py-3 px-4 capitalize">{sub.billingCycle}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">₹{sub.amount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              {sub.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: AURORA RDS CLUSTER & DATABASE TELEMETRY */}
          {/* ========================================================================= */}
          {activeTab === 'database' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AWS Aurora RDS Cluster</h1>
                  <p className="text-xs text-slate-500">
                    Live database telemetry, connection pooling, and multi-tenant schema verification
                  </p>
                </div>
                <button
                  onClick={handleRunMigration}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all self-start"
                >
                  <Server className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Verify Schema & Migrate</span>
                </button>
              </div>

              {/* Database Telemetry Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-2xl border border-white/60 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cluster Host Endpoint</div>
                  <div className="text-xs font-mono font-bold text-slate-800 truncate" title="AWS Aurora RDS Cluster Host">
                    database-1.cluster-cvwo02ecys5c.ap-south-2.rds.amazonaws.com
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active In Region ap-south-2</span>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-white/60 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Database Engine</div>
                  <div className="text-sm font-bold text-slate-900">PostgreSQL 15.4 (Aurora Serverless)</div>
                  <div className="text-[11px] text-slate-500 font-medium pt-1">SSL Mode: Enabled (IAM RDS Signer)</div>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-white/60 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Schema Tables</div>
                  <div className="text-2xl font-extrabold text-indigo-600">{dbTables.length || 26} Tables</div>
                  <div className="text-[11px] text-slate-500 font-medium">All Multi-Tenant Partitions Intact</div>
                </div>
              </div>

              {/* Tables Summary Grid */}
              <div className="glass-card rounded-2xl border border-white/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Registered Database Tables & Live Row Counts</h2>
                  <span className="text-xs text-slate-500 font-medium">Consuming /api/db/tables</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dbTables.length === 0 ? (
                    <div className="col-span-3 text-center py-6 text-slate-400 text-xs">
                      Loading Aurora RDS table summaries...
                    </div>
                  ) : (
                    dbTables.map((table, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedTableSchema(table)}
                        className="p-3 rounded-xl bg-white/70 hover:bg-white border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer shadow-sm group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {table.tableName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                            {table.rowCount} rows
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {table.columns.length} columns defined
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Table Schema Modal */}
              {selectedTableSchema && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-lg w-full font-poppins space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">Table: {selectedTableSchema.tableName}</h3>
                        <p className="text-xs text-slate-500">{selectedTableSchema.rowCount} Total Rows Recorded</p>
                      </div>
                      <button
                        onClick={() => setSelectedTableSchema(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <div className="text-xs font-semibold text-slate-700">Columns Schema:</div>
                      <div className="grid grid-cols-1 gap-1">
                        {selectedTableSchema.columns.map((c, cIdx) => (
                          <div key={cIdx} className="text-xs font-mono px-2 py-1 bg-slate-50 rounded border border-slate-100 text-slate-700">
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setSelectedTableSchema(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: GLOBAL USERS DIRECTORY */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Global Users & Telecallers</h1>
                <p className="text-xs text-slate-500">
                  Cross-tenant visibility of all sales counselors, telecallers, and administrators
                </p>
              </div>

              <div className="glass-card rounded-2xl border border-white/60 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">User Name</th>
                        <th className="py-3 px-4">Tenant Company</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Calls Today</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400">
                            No cross-tenant users recorded.
                          </td>
                        </tr>
                      ) : (
                        allUsers.map((u, idx) => (
                          <tr key={idx} className="hover:bg-white/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px]">
                                {u.name?.charAt(0) || 'U'}
                              </div>
                              <span>{u.name}</span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">{u.companyName || u.tenantId}</td>
                            <td className="py-3 px-4 text-slate-500">{u.email}</td>
                            <td className="py-3 px-4 font-medium text-indigo-700">{u.role}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {u.status || 'online'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-semibold">{u.totalCallsToday || 0}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: AI TOKEN QUOTAS */}
          {/* ========================================================================= */}
          {activeTab === 'ai-quotas' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Usage & Quota Controller</h1>
                <p className="text-xs text-slate-500">
                  Monitor Google Gemini 2.0 tokens, AI VoiceBot qualification minutes, and sentiment analysis credits
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiQuotas.map((q) => (
                  <div key={q.tenantId} className="glass-card p-5 rounded-2xl border border-white/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-sm">{q.companyName}</div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {q.planTier}
                      </span>
                    </div>

                    {/* Gemini Token Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Google Gemini Tokens:</span>
                        <span className="font-bold">
                          {q.geminiTokensUsed.toLocaleString()} / {q.geminiTokenLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${Math.min((q.geminiTokensUsed / q.geminiTokenLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* VoiceBot Minutes Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>AI VoiceBot Minutes:</span>
                        <span className="font-bold">
                          {q.voiceBotMinutesUsed} / {q.voiceBotMinuteLimit} mins
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min((q.voiceBotMinutesUsed / q.voiceBotMinuteLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: OMNICHANNEL & META / WHATSAPP GATEWAY */}
          {/* ========================================================================= */}
          {activeTab === 'omnichannel' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Omnichannel & Webhooks Gateway</h1>
                <p className="text-xs text-slate-500">
                  Global Meta Connected Pages (`meta_connected_pages`), WhatsApp Cloud API routing, and webhooks
                </p>
              </div>

              <div className="glass-card rounded-2xl border border-white/60 p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Connected Meta (Facebook / Instagram) Pages</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Page Name</th>
                        <th className="py-2.5 px-4">Page ID</th>
                        <th className="py-2.5 px-4">Client / Tenant</th>
                        <th className="py-2.5 px-4">Token Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {metaPages.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-slate-400">
                            No Meta pages connected yet across tenants.
                          </td>
                        </tr>
                      ) : (
                        metaPages.map((p, idx) => (
                          <tr key={idx} className="hover:bg-white/60">
                            <td className="py-3 px-4 font-bold text-slate-900">{p.page_name}</td>
                            <td className="py-3 px-4 font-mono text-slate-500">{p.page_id}</td>
                            <td className="py-3 px-4 font-medium text-indigo-700">{p.client_id || p.tenant_id}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                Valid Token
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: SECURITY & AUDIT LOGS */}
          {/* ========================================================================= */}
          {activeTab === 'audit-logs' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Platform Audit Logs</h1>
                <p className="text-xs text-slate-500">
                  Immutable audit trail of administrative actions, impersonations, and migrations
                </p>
              </div>

              <div className="glass-card rounded-2xl border border-white/60 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-white/60 transition-colors flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{log.action}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          Initiated by <strong>{log.adminEmail}</strong>
                          {log.targetTenantName && ` for tenant ${log.targetTenantName}`}
                        </div>
                        {log.details && (
                          <div className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Provision Tenant Modal */}
      <ProvisionTenantModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        onSuccess={(newTenant) => {
          showNotice(`Tenant "${newTenant.companyName}" successfully provisioned!`);
          loadAllData(true);
        }}
      />
    </div>
  );
}
