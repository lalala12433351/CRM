import React, { useState, useEffect, useMemo } from 'react';
import { useSyncState } from './lib/hooks';
// Reusable UI Components & Modals
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LeadDetailModal } from './components/LeadDetailModal';
import { AiVoiceBotModal } from './components/AiVoiceBotModal';
import { GoogleSheetsIntegrationModal } from './components/GoogleSheetsIntegrationModal';
import { CommandPalette } from './components/CommandPalette';
import { AiCopilotModal } from './components/AiCopilotModal';
import { PowerDialerQueueModal } from './components/PowerDialerQueueModal';
import { PixbeLoadingScreen } from './components/PixbeLoadingScreen';

// Page Components & Types from ./pages
import {
  DashboardPage as DashboardView,
  LeadsPage as LeadsView,
  OmnichannelInboxPage as OmnichannelInboxView,
  PipelinePage as PipelineView,
  WhatsAppCrmPage as WhatsAppCrmView,
  WorkflowsPage as WorkflowsView,
  MyCallsPage as MyCallsView,
  AnalyticsPage as AnalyticsView,
  TeamPage as TeamView,
  MarketingPage as MarketingView,
  DocsAndSignPage as DocsAndSignView,
  AddLeadPage as AddLeadView,
  FollowUpsPage as FollowUpsView,
  ReportsPage as ReportsView,
  IntegrationsPage as IntegrationsView,
  SettingsPage as SettingsView,
  CampaignsPage as CampaignsView,
  TasksPage as TasksView,
  LoginPage as LoginView,
  SignUpPage as SignUpView,
  SetPasswordPage as SetPasswordView,
  AutomationsSubTab,
  ReportsSubTab,
  SettingsTab,
  CallingLogsPage as CallingLogsView,
  FieldsSettingsPage as FieldsSettingsView,
  CallFeedbackSettingsPage as CallFeedbackSettingsView,
  NotFoundPage as NotFoundView,
} from './pages';
import { WorkflowBuilderPage } from './features/workflow-builder';
import { saveWorkflowToDb, getWorkflowsFromDb, fetchWorkflowsFromApi } from './utils/workflowStorage';
import { executeWorkflowTriggers } from './utils/workflowEngine';
import { PhoneCall, X, Users } from 'lucide-react';
import { verifyCurrentSession, logoutWithApi, fetchWithTenantAuth, clearLocalStorageAuth, ensureServerSession } from './lib/auth';
import { formatArcleName } from './utils/brandUtils';
import { toast, useToast, ToastType } from './context/ToastContext';

import { 
  INITIAL_ACTIVITIES, 
  INITIAL_MESSAGES, 
  INITIAL_CALL_RECORDS, 
  INITIAL_TEMPLATES, 
  INITIAL_CAMPAIGNS, 
  INITIAL_WORKFLOWS, 
  HOURLY_METRICS,
} from './constants/initialState';

import { 
  Lead, 
  Agent, 
  PipelineStage, 
  ActivityLog, 
  WhatsAppMessage, 
  CallRecord, 
  WhatsAppTemplate, 
  WhatsAppCampaign, 
  WorkflowRule, 
  CustomFieldDef, 
  LeadStatus,
  PermissionTemplate,
  TaskTypeCategory,
  CrmTask,
  isAgentAdmin
} from './types';

import { getAgentPermissionRights } from './utils/permissionUtils';
import { getInitialViewFromUrl, syncUrlWithView, pathToView } from './utils/navigation';
import { canAccessView, getCrmRole, getDefaultViewForRole, formatRoleBadge } from './utils/roleUtils';
import { resolveAgentName, resolveLeadContact, matchesAgent } from './utils/agentDisplay';
import { ShieldCheck } from 'lucide-react';

export const StagesContext = React.createContext<PipelineStage[]>([]);

export function App() {
  // Navigation & Active View State (synchronized with browser URL and history)
  const [currentView, setCurrentView] = useState<string>(() => {
    let fallback = 'dashboard';
    try {
      if (typeof sessionStorage !== 'undefined') {
        const u = sessionStorage.getItem('pixbe_auth_user');
        if (u) {
          const user = JSON.parse(u);
          const role = (user?.role || '').toLowerCase();
          if (role.includes('caller') || role === 'telecaller') fallback = 'dashboard';
          else if (role === 'manager') fallback = 'dashboard';
        }
      }
    } catch (e) {}
    return getInitialViewFromUrl(fallback);
  });
  const [previousView, setPreviousView] = useState<string>('dashboard');

  const handleOpenAddLead = () => {
    if (currentView !== 'add_lead') {
      setPreviousView(currentView);
    }
    setCurrentView('add_lead');
  };

  const [activeWorkflowForBuilder, setActiveWorkflowForBuilder] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get('id');
      const storedId = sessionStorage.getItem('pixbe_active_workflow_id') || localStorage.getItem('pixbe_active_workflow_id');
      const targetId = urlId || storedId;

      const dbWorkflows = getWorkflowsFromDb();
      if (targetId) {
        const found = dbWorkflows.find((w) => w.id === targetId || w.name === targetId);
        if (found) return found;
      }
      if (window.location.pathname.includes('workflow-builder')) {
        return dbWorkflows[0] || null;
      }
    } catch {}
    return null;
  });
  const [reportsSubTab, setReportsSubTab] = useState<ReportsSubTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab') as ReportsSubTab;
        if (tab && ['call_logs', 'agent_performance', 'lead_analytics', 'hourly_distribution'].includes(tab)) {
          return tab;
        }
      }
      return (localStorage.getItem('pixbe_reports_subtab') as ReportsSubTab) || 'call_logs';
    } catch {
      return 'call_logs';
    }
  });
  const [automationsSubTab, setAutomationsSubTab] = useState<AutomationsSubTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab') as AutomationsSubTab;
        if (tab && ['workflows', 'automations', 'canvas'].includes(tab)) {
          return tab;
        }
      }
      return (localStorage.getItem('pixbe_automations_subtab') as AutomationsSubTab) || 'workflows';
    } catch {
      return 'workflows';
    }
  });
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab') as SettingsTab;
        if (tab && ['general', 'pipelines', 'team', 'fields', 'permissions', 'lost_reasons', 'security'].includes(tab)) {
          return tab;
        }
      }
      return (localStorage.getItem('pixbe_settings_subtab') as SettingsTab) || 'general';
    } catch {
      return 'general';
    }
  });
  const [activeAgentId, setActiveAgentId] = useState<string>(() => {
    try {
      const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pixbe_auth_user') : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) return parsed.id;
      }
    } catch {}
    return '';
  });
  const [selectedCampaignHandle, setSelectedCampaignHandle] = useState<string>('@master-form-iata-cargo');
  const [activeFilterId, setActiveFilterId] = useState<string>('all_leads');

  // Keep navigation states synchronized with browser URL & localStorage
  // Real-World Authentication & Session State (Scoped to Session, not persistent localStorage)
  const [currentUser, setCurrentUser] = useState<Agent | null>(() => {
    clearLocalStorageAuth();
    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pixbe_auth_user') : null;
    if (stored) {
      try {
        return JSON.parse(stored) as Agent;
      } catch (e) {}
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pixbe_auth_user') : null;
    return !!stored;
  });
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | 'set-password'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (path === '/set-password' || path === '/set_password') return 'set-password';
      if (path === '/signup' || path === '/sign-up') return 'signup';
      if (path === '/login') return 'login';
    }
    return 'login';
  });
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Re-validate session against the server (clears stale offline tokens)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hadSession =
        typeof sessionStorage !== 'undefined' &&
        Boolean(sessionStorage.getItem('pixbe_auth_token') || sessionStorage.getItem('pixbe_auth_user'));
      const user = await verifyCurrentSession();
      if (cancelled) return;
      if (user) {
        setCurrentUser(user);
        setActiveAgentId(user.id);
        setIsAuthenticated(true);
      } else if (hadSession) {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep navigation states synchronized with browser URL & localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname.toLowerCase().replace(/\/+$/, '');

    // Public set-password link must keep query string (email/code)
    if (currentPath === '/set-password' || currentPath === '/set_password') {
      if (authScreen !== 'set-password') setAuthScreen('set-password');
      return;
    }

    if (!isAuthenticated) {
      if (authScreen === 'set-password') {
        setAuthScreen('login');
      }
      const targetPath = authScreen === 'signup' ? '/signup' : '/login';
      if (currentPath !== targetPath) {
        window.history.replaceState(null, '', targetPath);
      }
      return;
    }

    // When authenticated: if the URL is /login or /signup or root /, navigate to the active CRM view
    if (currentPath === '/login' || currentPath === '/signup' || currentPath === '/sign-up' || currentPath === '') {
      syncUrlWithView(currentView || 'dashboard');
      return;
    }

    const activeSubTab =
      currentView === 'reports' ? reportsSubTab :
      currentView === 'workflows' ? automationsSubTab :
      currentView === 'settings' ? settingsSubTab : undefined;

    syncUrlWithView(currentView, activeSubTab);
  }, [isAuthenticated, authScreen, currentView, reportsSubTab, automationsSubTab, settingsSubTab]);

  // Handle browser Back / Forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');

      if (!isAuthenticated) {
        if (path === '/set-password' || path === '/set_password') {
          setAuthScreen('set-password');
        } else if (path === '/signup' || path === '/sign-up') {
          setAuthScreen('signup');
        } else if (path === '/login') {
          setAuthScreen('login');
        }
        return;
      }

      if (path === '/set-password' || path === '/set_password') {
        setAuthScreen('set-password');
        return;
      }

      const viewFromPath = pathToView(window.location.pathname);
      if (viewFromPath && viewFromPath !== currentView) {
        setCurrentView(viewFromPath);
      }
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        if (viewFromPath === 'reports') setReportsSubTab(tab as ReportsSubTab);
        if (viewFromPath === 'workflows') setAutomationsSubTab(tab as AutomationsSubTab);
        if (viewFromPath === 'settings') setSettingsSubTab(tab as SettingsTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem('pixbe_reports_subtab', reportsSubTab);
    } catch {}
  }, [reportsSubTab]);

  useEffect(() => {
    try {
      localStorage.setItem('pixbe_automations_subtab', automationsSubTab);
    } catch {}
  }, [automationsSubTab]);

  useEffect(() => {
    try {
      localStorage.setItem('pixbe_settings_subtab', settingsSubTab);
    } catch {}
  }, [settingsSubTab]);

  // Global filters synchronized with database query logic
  const globalSavedFilters = [
    { id: 'all_leads', name: 'All Leads', iconType: 'arrow' },
    { id: 'active_leads', name: 'All Active Leads', iconType: 'arrow' },
    { id: 'followup_leads', name: 'Followup Leads', iconType: 'filter' },
  ];

  // Active authenticated tenant id
  const activeTenantId = currentUser?.tenantId || (typeof sessionStorage !== 'undefined' ? (() => {
    try {
      const u = sessionStorage.getItem('pixbe_auth_user');
      return u ? JSON.parse(u)?.tenantId : 'default_tenant';
    } catch { return 'default_tenant'; }
  })() : 'default_tenant') || 'default_tenant';

  // Core CRM Collections State strictly scoped to activeTenantId
  const [leads, setLeads] = useSyncState<Lead>('leads', activeTenantId);
  const [agents, setAgents] = useSyncState<Agent>('agents', activeTenantId);
  const [stages, setStages] = useSyncState<PipelineStage>('stages', activeTenantId);
  const [activities, setActivities] = useSyncState<ActivityLog>('activities', activeTenantId);
  const [messages, setMessages] = useSyncState<WhatsAppMessage>('messages', activeTenantId);
  const [callRecords, setCallRecords] = useSyncState<CallRecord>('callRecords', activeTenantId);
  const [templates, setTemplates] = useSyncState<WhatsAppTemplate>('templates', activeTenantId);
  const [campaigns, setCampaigns] = useSyncState<WhatsAppCampaign>('campaigns', activeTenantId);
  const [workflows, setWorkflows] = useSyncState<WorkflowRule>('workflows', activeTenantId);
  const [customFields, setCustomFields] = useSyncState<CustomFieldDef>('customFields', activeTenantId);
  const [permissionTemplates, setPermissionTemplates] = useSyncState<PermissionTemplate>('permissionTemplates', activeTenantId);
  const [taskCategories, setTaskCategories] = useSyncState<TaskTypeCategory>('taskCategories', activeTenantId);
  const [workspaceProfile, setWorkspaceProfile] = useSyncState<{ id: string; name: string }>('workspaceProfile', activeTenantId);
  const [workspaceEmail, setWorkspaceEmail] = useSyncState<{ id: string; email: string }>('workspaceEmail', activeTenantId);
  const [workspaceCurrency, setWorkspaceCurrency] = useSyncState<{ id: string; code: string }>('workspaceCurrency', activeTenantId);

  const rawCompanyName = (workspaceProfile && workspaceProfile[0]?.name) || currentUser?.companyName || '';
  const companyName = rawCompanyName;

  const INITIAL_TASK_CATEGORIES: TaskTypeCategory[] = [
    { id: 'task-type-call', name: 'Call Followups', color: 'indigo', isBuiltIn: true },
    { id: 'task-type-todo', name: 'Todo', color: 'emerald', isBuiltIn: true },
  ];

  const activeTaskCategories = taskCategories && taskCategories.length > 0 ? taskCategories : INITIAL_TASK_CATEGORIES;

  const [crmTasks, setCrmTasks] = useSyncState<CrmTask>('crmTasks', activeTenantId);

  const handleCreateCrmTask = (task: CrmTask) => {
    const taskWithTenant = { ...task, tenantId: activeTenantId };
    setCrmTasks((prev) => [...(prev || []), taskWithTenant]);
    fetchWithTenantAuth('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskWithTenant)
    }).catch(console.warn);
    showToast(`Task "${task.title}" created for ${task.assigneeAgentName}!`);
  };

  const handleDeleteCrmTask = (taskId: string) => {
    setCrmTasks((prev) => (prev || []).filter(t => t.id !== taskId));
    fetchWithTenantAuth(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    }).catch(console.warn);
    showToast('Task deleted.');
  };

  const handleUpdateCrmTaskStatus = (taskId: string, status: 'Pending' | 'Completed' | 'Rejected') => {
    setCrmTasks((prev) => (prev || []).map(t => t.id === taskId ? { ...t, status } : t));
    fetchWithTenantAuth(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }).catch(console.warn);
    showToast(`Task marked as ${status}.`);
  };

  const handleUpdateCrmTask = (taskId: string, updates: Partial<CrmTask>) => {
    setCrmTasks((prev) => (prev || []).map(t => t.id === taskId ? { ...t, ...updates } : t));
    fetchWithTenantAuth(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }).catch(console.warn);
    showToast('Task updated in database!');
  };

  const handleAddTaskCategory = (newCat: TaskTypeCategory) => {
    setTaskCategories((prev) => {
      const list = prev && prev.length > 0 ? prev : INITIAL_TASK_CATEGORIES;
      if (list.some((c) => c.name.toLowerCase() === newCat.name.toLowerCase())) return list;
      return [...list, newCat];
    });
    showToast(`Created task type "${newCat.name}" & saved to database!`);
  };

  const handleDeleteTaskCategory = (catId: string) => {
    setTaskCategories((prev) => {
      const list = prev && prev.length > 0 ? prev : INITIAL_TASK_CATEGORIES;
      const target = list.find((c) => c.id === catId);
      if (target?.isBuiltIn) return list;
      const filtered = list.filter((c) => c.id !== catId);
      showToast(`Removed task type "${target?.name || ''}" from database!`);
      return filtered;
    });
  };

  const activeTemplates = permissionTemplates;
  const activeStages = stages || [];
  const activeCustomFields = customFields || [];

  // Dynamic Browser Tab / Document Title containing ARCLE, view name & the given company name
  useEffect(() => {
    const brandName = rawCompanyName ? `${formatArcleName('ARCLE CRM', rawCompanyName)}` : 'ARCLE CRM & TeleSales';
    if (!isAuthenticated) {
      document.title =
        authScreen === 'signup'
          ? 'Create Account | ARCLE CRM'
          : authScreen === 'set-password'
            ? 'Set Password | ARCLE CRM'
            : 'Sign In | ARCLE CRM';
      return;
    }
    const viewTitleMap: Record<string, string> = {
      leads: `Leads Database | ${brandName}`,
      dashboard: `Sales Dashboard | ${brandName}`,
      pipeline: `Pipeline & Deals | ${brandName}`,
      followups: `Follow-ups & Scheduled Calls | ${brandName}`,
      tasks: `Tasks & Reminders | ${brandName}`,
      inbox: `Unified Inbox | ${brandName}`,
      whatsapp: `WhatsApp CRM | ${brandName}`,
      workflows: `AI Automations & Workflows | ${brandName}`,
      calls: `Call Records & Logs | ${brandName}`,
      calling_logs: `Call Records & Logs | ${brandName}`,
      reports: `Performance Reports | ${brandName}`,
      analytics: `Conversion & CPL Analytics | ${brandName}`,
      team: `Team & Agent Management | ${brandName}`,
      campaigns: `Marketing Campaigns | ${brandName}`,
      integrations: `Integrations & Webhooks | ${brandName}`,
      docs_sign: `Docs & E-Signatures | ${brandName}`,
      fields: `Custom Lead Fields | ${brandName}`,
      call_feedback: `Call Feedback Settings | ${brandName}`,
      settings: `Settings & Preferences | ${brandName}`,
      add_lead: `Add New Lead | ${brandName}`,
      not_found: `404 - Page Not Found | ARCLE CRM`,
    };

    document.title = viewTitleMap[currentView] || `${brandName}`;
  }, [isAuthenticated, authScreen, currentView, rawCompanyName]);

  const tenantLoadInFlightRef = React.useRef(false);

  // Fetch all domain data from database when authenticated and activeTenantId is ready
  const loadTenantDomainData = React.useCallback(async (tenantId?: string) => {
    if (tenantLoadInFlightRef.current) return;
    tenantLoadInFlightRef.current = true;
    try {
    await ensureServerSession();
    let activeId = tenantId || currentUser?.tenantId;
    if (!activeId) {
      try {
        const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pixbe_auth_user') : null;
        if (stored) {
          activeId = JSON.parse(stored)?.tenantId;
        }
      } catch {}
    }
    activeId = activeId || activeTenantId || 'default_tenant';

      const headers = { 'x-tenant-id': activeId };
      // Parallel high-performance multi-collection hydration with explicit tenant header
      const [leadsRes, agentsRes, pipelinesRes, fieldsRes, tasksRes, lostReasonsRes, activitiesRes, callsRes, campaignsRes, messagesRes, waTemplatesRes, waCampaignsRes, workflowsRes, workspaceRes] = await Promise.all([
        fetchWithTenantAuth('/api/leads', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetchWithTenantAuth('/api/agents', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetchWithTenantAuth('/api/pipelines', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetchWithTenantAuth('/api/field-settings', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetchWithTenantAuth('/api/tasks', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetchWithTenantAuth('/api/pipelines/lost-reasons', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetchWithTenantAuth('/api/activities', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetchWithTenantAuth('/api/calls', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetchWithTenantAuth('/api/campaigns', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetchWithTenantAuth('/api/messages', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetchWithTenantAuth('/api/whatsapp-templates', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetchWithTenantAuth('/api/whatsapp-campaigns', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetchWorkflowsFromApi(activeId).catch(() => []),
        fetchWithTenantAuth('/api/workspace/settings', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (leadsRes?.success && Array.isArray(leadsRes.leads)) {
        setLeads(leadsRes.leads);
      } else if (leadsRes?.success) {
        setLeads([]);
      }
      if (agentsRes?.success && Array.isArray(agentsRes.agents)) {
        setAgents(agentsRes.agents);
        // Keep the signed-in profile in sync with the persisted agent record
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const match = agentsRes.agents.find(
            (a: any) =>
              a.id === prev.id ||
              (a.email && prev.email && String(a.email).toLowerCase() === String(prev.email).toLowerCase())
          );
          if (!match) return prev;
          const synced = {
            ...prev,
            ...match,
            id: match.id || prev.id,
            name: match.name || prev.name,
            email: match.email || prev.email,
            phone: match.phone ?? prev.phone,
            avatar: match.avatar !== undefined ? match.avatar : prev.avatar,
            tenantId: match.tenantId || prev.tenantId,
            companyName: match.companyName || prev.companyName,
            role: match.role || prev.role,
            isAdmin: match.isAdmin ?? prev.isAdmin
          };
          try {
            sessionStorage.setItem('pixbe_auth_user', JSON.stringify(synced));
          } catch {}
          return synced;
        });
      }
      if (pipelinesRes?.success && Array.isArray(pipelinesRes.stages)) {
        setStages(pipelinesRes.stages);
      }
      if (fieldsRes?.success && Array.isArray(fieldsRes.fields)) {
        setCustomFields(fieldsRes.fields);
      }
      if (tasksRes?.success && Array.isArray(tasksRes.tasks)) {
        setCrmTasks(tasksRes.tasks);
      }
      if (lostReasonsRes?.success && Array.isArray(lostReasonsRes.lostReasons)) {
        setLostReasons(lostReasonsRes.lostReasons);
      }
      if (activitiesRes?.success && Array.isArray(activitiesRes.activities)) {
        setActivities(activitiesRes.activities);
      }
      if (callsRes?.success && Array.isArray(callsRes.calls)) {
        setCallRecords(callsRes.calls.map((c: any) => ({
          id: c.id,
          leadId: c.leadId || '',
          leadName: c.leadName || 'Contact',
          leadPhone: c.leadPhone || '',
          agentId: c.agentId || '',
          agentName: c.agentName || c.assigneeName || '',
          assigneeName: c.assigneeName,
          type: c.type || c.callType || 'outgoing',
          durationSeconds: c.durationSeconds || 0,
          callStartTime: c.callStart || c.callStartTime,
          callEndTime: c.callEnd || c.callEndTime,
          recordingUrl: c.recordingUrl,
          disposition: c.disposition || 'Connected',
          notes: c.notes || c.callNotes,
          callNotes: c.callNotes || c.notes,
          assigneeRemarks: c.assigneeRemarks,
          timestamp: c.timestamp || c.callStart || c.createdAt || new Date().toISOString(),
          transcript: c.transcript,
          aiSummary: c.aiSummary,
          sentiment: c.sentiment,
          tags: c.tags
        })));
      }
      if (messagesRes?.success && Array.isArray(messagesRes.messages)) {
        setMessages(messagesRes.messages);
      }
      if (waTemplatesRes?.success && Array.isArray(waTemplatesRes.templates)) {
        setTemplates(waTemplatesRes.templates);
      }
      if (waCampaignsRes?.success && Array.isArray(waCampaignsRes.campaigns)) {
        setCampaigns(waCampaignsRes.campaigns);
      }
      if (Array.isArray(workflowsRes) && workflowsRes.length >= 0) {
        // Keep builder cache warm; WorkflowsView reads via workflowStorage
      }
      void campaignsRes;
      if (workspaceRes?.success && workspaceRes.settings) {
        const ws = workspaceRes.settings;
        if (ws.companyName) {
          setWorkspaceProfile([{ id: 'default_workspace', name: ws.companyName }]);
          setCurrentUser((prev) => {
            if (!prev || prev.companyName === ws.companyName) return prev;
            const updated = { ...prev, companyName: ws.companyName };
            try {
              sessionStorage.setItem('pixbe_auth_user', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
        if (ws.supportEmail) setWorkspaceEmail([{ id: 'default_email', email: ws.supportEmail }]);
        if (ws.currency) setWorkspaceCurrency([{ id: 'default_currency', code: ws.currency }]);
        if (Array.isArray(ws.permissionTemplates) && ws.permissionTemplates.length > 0) {
          setPermissionTemplates(ws.permissionTemplates);
        }
        try {
          if (ws.workspaceFeatures && typeof window !== 'undefined') {
            localStorage.setItem('pixbe_workspace_features', JSON.stringify(ws.workspaceFeatures));
          }
          if (Array.isArray(ws.callFeedbackStatuses) && typeof window !== 'undefined') {
            localStorage.setItem('pixbe_call_feedback_statuses', JSON.stringify(ws.callFeedbackStatuses));
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Tenant data loading notice:', err);
    } finally {
      tenantLoadInFlightRef.current = false;
    }
  }, []);

  // Fetch all domain data from database when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const targetTenant = currentUser?.tenantId || activeTenantId;
      loadTenantDomainData(targetTenant);
    }
  }, [isAuthenticated, activeTenantId, loadTenantDomainData]);

  // Keep CRM collections live: refetch on focus/visibility and poll while the tab is open
  useEffect(() => {
    if (!isAuthenticated) return;
    const targetTenant = currentUser?.tenantId || activeTenantId;

    const refreshIfVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      loadTenantDomainData(targetTenant);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadTenantDomainData(targetTenant);
      }
    };

    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', onVisibility);
    const interval = window.setInterval(refreshIfVisible, 25000);

    return () => {
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, [isAuthenticated, activeTenantId, loadTenantDomainData, currentUser?.tenantId]);

  const [lostReasons, setLostReasons] = useState<string[]>([]);

  const handleUpdateLostReasons = (updatedReasons: string[]) => {
    setLostReasons(updatedReasons);
    fetchWithTenantAuth('/api/pipelines/lost-reasons', {
      method: 'POST',
      body: JSON.stringify(updatedReasons)
    }).catch((err) => console.warn('Lost reasons DB save notice:', err));
  };

  const handleSaveFieldsToDb = (updatedFields: CustomFieldDef[]) => {
    setCustomFields(updatedFields);
    fetchWithTenantAuth('/api/field-settings', {
      method: 'POST',
      body: JSON.stringify(updatedFields)
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          showToast(data?.error || 'Failed to save fields to database');
          return;
        }
        if (Array.isArray(data.result)) setCustomFields(data.result);
      })
      .catch(() => showToast('Failed to save fields to database'));
  };

  const saveWorkspaceSettings = (patch: Record<string, any>, toastMsg?: string) => {
    fetchWithTenantAuth('/api/workspace/settings', {
      method: 'PUT',
      body: JSON.stringify(patch)
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          showToast(data?.error || 'Failed to save workspace settings');
          return;
        }
        const ws = data.settings || {};
        if (ws.companyName) setWorkspaceProfile([{ id: 'default_workspace', name: ws.companyName }]);
        if (ws.supportEmail) setWorkspaceEmail([{ id: 'default_email', email: ws.supportEmail }]);
        if (ws.currency) setWorkspaceCurrency([{ id: 'default_currency', code: ws.currency }]);
        if (toastMsg) showToast(toastMsg);
      })
      .catch(() => showToast('Failed to save workspace settings'));
  };

  const handleLoginSuccess = async (agent: Agent) => {
    clearLocalStorageAuth();
    try {
      sessionStorage.setItem('pixbe_auth_user', JSON.stringify(agent));
    } catch (e) {}
    setCurrentUser(agent);
    setActiveAgentId(agent.id);
    if (agent.companyName) {
      setWorkspaceProfile([{ id: 'default_workspace', name: agent.companyName }]);
    }
    setIsAuthenticated(true);
    setIsLoggingIn(false);

    // Clean browser redirection to /dashboard ensuring all collections hydrate freshly
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (path === '/login' || path === '/signup' || path === '/sign-up' || path === '') {
        window.location.href = '/dashboard';
        return;
      }
    }

    await loadTenantDomainData(agent.tenantId || 'default_tenant');
    showToast(`Welcome back, ${agent.name || 'User'}!`);
  };

  const handleLogout = () => {
    clearLocalStorageAuth();
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('pixbe_auth_user');
        sessionStorage.removeItem('pixbe_auth_token');
      } catch (e) {}
    }
    logoutWithApi().catch(() => {});
    
    // Clean full navigation to /login to ensure the login page and subsequent logins render cleanly
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  
  // Modals & Overlay Drawers State
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [voiceBotLead, setVoiceBotLead] = useState<Lead | null>(null);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState<boolean>(false);
  const [isPowerDialerQueueOpen, setIsPowerDialerQueueOpen] = useState<boolean>(false);

  const showToast = (msg: string, type: ToastType = 'success', title?: string) => {
    toast.show(msg, type, title);
  };

  const activeAgentsList = agents && agents.length > 0 ? agents : (currentUser ? [currentUser] : []);
  const matchedDbAgent = currentUser
    ? activeAgentsList.find((a) =>
        a.id === currentUser.id ||
        (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase())
      ) || null
    : null;
  // Prefer the live session user for identity fields so profile edits show immediately
  // across Navbar / Settings / Leads without waiting for a full tenant reload.
  const activeAgent = matchedDbAgent && currentUser
    ? {
        ...matchedDbAgent,
        ...currentUser,
        id: currentUser.id || matchedDbAgent.id,
        name: currentUser.name || matchedDbAgent.name,
        email: currentUser.email || matchedDbAgent.email,
        phone: currentUser.phone ?? matchedDbAgent.phone,
        avatar: currentUser.avatar !== undefined && currentUser.avatar !== null
          ? currentUser.avatar
          : (matchedDbAgent.avatar || ''),
        role: currentUser.role || matchedDbAgent.role,
        isAdmin: currentUser.isAdmin ?? matchedDbAgent.isAdmin,
        tenantId: currentUser.tenantId || matchedDbAgent.tenantId,
        companyName: currentUser.companyName || matchedDbAgent.companyName
      }
    : (currentUser || activeAgentsList.find((a) => a.id === activeAgentId) || activeAgentsList[0]);
  const activeAgentRights = getAgentPermissionRights(activeAgent, activeTemplates);
  const isAdmin = isAgentAdmin(activeAgent);
  const activeSupportEmail = workspaceEmail?.[0]?.email || activeAgent?.email || currentUser?.email || 'admin@company.com';
  const activeCurrency = workspaceCurrency?.[0]?.code || 'INR';

  // RBAC Frontend Route Guards
  useEffect(() => {
    if (!isAuthenticated || !activeAgent) return;
    if (!canAccessView(activeAgent, currentView)) {
      const homeView = getDefaultViewForRole(activeAgent);
      setCurrentView(homeView);
      showToast(`Access denied for ${formatRoleBadge(activeAgent)}. Redirected.`);
    }
  }, [currentView, activeAgent, isAuthenticated]);

  // Strict Database Agents Scoping: Use live agents from database (or active logged in admin user)
  const crmRole = getCrmRole(activeAgent);
  const isManager = crmRole === 'Manager';
  const visibleAgents = isAdmin
    ? activeAgentsList
    : isManager
      ? activeAgentsList.filter((agent) => agent.id === activeAgent.id || agent.managerId === activeAgent.id)
      : activeAgentsList.filter((agent) => agent.id === activeAgent.id);

  const defaultOwnerId = activeAgent?.id || 'agent-admin';
  const defaultOwnerName = activeAgent?.name || 'System Administrator';

  // Normalize tenant + default Fresh status only — do NOT reassign ownership on read
  // (otherwise telecallers would incorrectly "own" unassigned leads in the UI).
  const sanitizedLeads = useMemo(() => {
    const curTenant = currentUser?.tenantId || activeTenantId;
    return (leads || []).map((l) => {
      let updated = { ...l, tenantId: l.tenantId || curTenant };
      if (!updated.status) {
        updated = { ...updated, status: 'Fresh' };
      }
      return updated;
    });
  }, [leads, currentUser?.tenantId, activeTenantId]);

  // Display-only projections: IDs stay as stored; labels always come from the live roster/leads.
  const liveLeads = useMemo(() => {
    return sanitizedLeads.map((l) => {
      const liveName = resolveAgentName(agents, {
        id: l.ownerAgentId,
        name: l.ownerAgentName,
        fallback: l.ownerAgentName || 'Unassigned'
      });
      if (liveName === (l.ownerAgentName || '')) return l;
      return { ...l, ownerAgentName: liveName };
    });
  }, [sanitizedLeads, agents]);

  const liveCallRecords = useMemo(() => {
    return (callRecords || []).map((c) => {
      const contact = resolveLeadContact(liveLeads, { id: c.leadId, name: c.leadName, phone: c.leadPhone });
      const agentLabel = resolveAgentName(agents, {
        id: c.agentId,
        name: c.assigneeName || c.agentName,
        fallback: c.agentName || 'Agent'
      });
      return {
        ...c,
        leadName: contact.name,
        leadPhone: contact.phone || c.leadPhone,
        agentName: agentLabel,
        assigneeName: agentLabel
      };
    });
  }, [callRecords, liveLeads, agents]);

  const liveCrmTasks = useMemo(() => {
    return (crmTasks || []).map((t) => ({
      ...t,
      assigneeAgentName: resolveAgentName(agents, {
        id: t.assigneeAgentId,
        name: t.assigneeAgentName,
        fallback: t.assigneeAgentName || 'Unassigned'
      })
    }));
  }, [crmTasks, agents]);

  const liveActivities = useMemo(() => {
    return (activities || []).map((a) => ({
      ...a,
      agentName: resolveAgentName(agents, {
        id: a.agentId,
        name: a.agentName,
        fallback: a.agentName || 'User'
      })
    }));
  }, [activities, agents]);

  const liveDetailLead = useMemo(() => {
    if (!detailLead) return null;
    return liveLeads.find((l) => l.id === detailLead.id) || detailLead;
  }, [detailLead, liveLeads]);

  const companyLeads = liveLeads;

  // Scoped Lead list: Admin = all, Manager = self + telecallers under them, Telecaller = assigned only
  const scopedOwnerIds = new Set(visibleAgents.map((agent) => agent.id));
  const visibleLeads = isAdmin
    ? companyLeads
    : companyLeads.filter((lead) => lead.ownerAgentId && scopedOwnerIds.has(lead.ownerAgentId));

  const handleAddAgent = async (
    newAgent: Agent
  ): Promise<{ success: boolean; error?: string; field?: 'email' | 'phone' }> => {
    const activeCompanyName = companyName || currentUser?.companyName || 'ARCLE Real Estate & Sales';
    const agentWithTenant: Agent = {
      ...newAgent,
      tenantId: activeTenantId,
      companyName: activeCompanyName,
    };
    const { password, ...safeAgent } = agentWithTenant;
    try {
      const res = await fetchWithTenantAuth('/api/agents', {
        method: 'POST',
        body: JSON.stringify(agentWithTenant)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        const error = data?.error || 'Failed to save user to database';
        showToast(error);
        return { success: false, error, field: data?.field };
      }
      if (data.agent) {
        setAgents((prev) => [data.agent, ...(prev || []).filter((a) => a.id !== data.agent.id && a.id !== safeAgent.id)]);
      }
      showToast('User account saved: ' + newAgent.name + ' (' + newAgent.role + ')');
      return { success: true };
    } catch {
      const error = 'Failed to save user to database';
      showToast(error);
      return { success: false, error };
    }
  };

  const handleRemoveAgent = (agentId: string) => {
    const targetAgent = agents.find((a) => a.id === agentId);
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
    fetchWithTenantAuth(`/api/agents/${agentId}`, {
      method: 'DELETE'
    }).catch(console.warn);
    showToast(`Removed user account: ${targetAgent?.name || agentId}`);
  };

  const handleToggleAdminPower = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          const nextIsAdmin = !isAgentAdmin(a);
          const nextRole = nextIsAdmin ? 'Admin' : 'Counselor';
          const updated = { ...a, isAdmin: nextIsAdmin, role: nextRole };
          fetchWithTenantAuth(`/api/agents/${agentId}`, {
            method: 'PUT',
            body: JSON.stringify(updated)
          }).catch(console.warn);
          showToast(`${nextIsAdmin ? 'Granted Admin powers to' : 'Revoked Admin powers from'} ${a.name}`);
          return updated;
        }
        return a;
      })
    );
  };

  const handleUpdateAgentRole = (agentId: string, newRole: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          const updated = { ...a, role: newRole };
          fetchWithTenantAuth(`/api/agents/${agentId}`, {
            method: 'PUT',
            body: JSON.stringify(updated)
          }).catch(console.warn);
          return updated;
        }
        return a;
      })
    );
    showToast(`Updated user role designation to: ${newRole}`);
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    const { password, ...safeAgent } = updatedAgent;
    setAgents((prev) =>
      prev.map((a) => (a.id === updatedAgent.id ? { ...a, ...safeAgent } : a))
    );
    fetchWithTenantAuth(`/api/agents/${updatedAgent.id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedAgent)
    }).catch(console.warn);
    showToast(`Updated user account details for ${updatedAgent.name}`);
  };

  const renderAccessRestricted = (viewTitle: string) => (
    <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-4 font-sans animate-in fade-in">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-bold text-slate-900">Access Restricted by Permission Template</h2>
        <p className="text-xs text-slate-500">
          Your assigned role permission template restricts access to <span className="font-bold text-slate-800">{viewTitle}</span>.
        </p>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 text-left space-y-1">
        <p><strong className="text-slate-700">Active Representative:</strong> {activeAgent?.name || 'Telecaller'} ({activeAgent?.role || 'Caller'})</p>
        <p><strong className="text-slate-700">Required Security Right:</strong> Admin privileges required to access this feature.</p>
      </div>
    </div>
  );

  // Open the Add Lead form (all new leads are persisted via /api/leads from AddLeadPage)
  const handleAddNewLead = () => {
    handleOpenAddLead();
  };

  const handleImportCsv = (importedLeads: Partial<Lead>[]) => {
    const tenantId = currentUser?.tenantId || activeTenantId;
    const formatted: Lead[] = importedLeads.map((imp, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      name: imp.name || 'Bulk Lead',
      phone: imp.phone || '',
      email: imp.email || '',
      company: imp.company || '',
      city: imp.city || '',
      state: imp.state || '',
      source: (imp.source as any) || 'Manual / Bulk CSV',
      status: 'Fresh' as any,
      pipelineStageId: activeStages[0]?.id || 'stage-1',
      dealValue: imp.dealValue || 0,
      aiScore: 0,
      aiRating: 'Cold' as any,
      aiReasoning: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerAgentId: activeAgent.id,
      ownerAgentName: activeAgent.name,
      tenantId,
      customFields: {},
      tags: ['Bulk CSV'],
      notes: ''
    }));

    setLeads((prev) => [...formatted, ...prev]);
    Promise.all(
      formatted.map((lead) =>
        fetchWithTenantAuth('/api/leads', {
          method: 'POST',
          body: JSON.stringify(lead)
        }).catch(console.warn)
      )
    ).then(() => loadTenantDomainData(tenantId));
    showToast(`Imported ${formatted.length} contacts into the database`);
  };

  const handleMergeLeads = (primaryId: string, duplicateId: string) => {
    const primary = leads.find((l) => l.id === primaryId);
    if (!primary) return;

    setLeads((prev) => prev.filter((l) => l.id !== duplicateId));
    fetchWithTenantAuth(`/api/leads/${duplicateId}`, { method: 'DELETE' }).catch(console.warn);
    showToast(`Merged duplicate lead into ${primary.name}`);
  };

  const handleAddCustomField = (field: CustomFieldDef) => {
    const updated = [...(customFields || []), field];
    handleSaveFieldsToDb(updated);
    showToast(`Custom lead field '${field.label}' saved to database`);
  };

  // Automatic Offline Conversion Dispatch Helper
  const triggerConversionDispatch = async (leadId: string, stage: LeadStatus, leadData?: Lead) => {
    try {
      const targetLead = leadData || leads.find((l) => l.id === leadId);
      if (!targetLead) return;
      
      const res = await fetchWithTenantAuth('/api/conversions/dispatch', {
        method: 'POST',
        body: JSON.stringify({
          leadId,
          stage,
          leadData: { ...targetLead, status: stage }
        })
      });
      const data = await res.json();
      if (data.success && data.dispatchedEvents && data.dispatchedEvents.length > 0) {
        console.log(`[Auto-Conversion] Dispatched ${data.dispatchedEvents.length} event(s) to ad networks for stage "${stage}"`);
      }
    } catch (err) {
      console.error('[Auto-Conversion] Error triggering offline conversion:', err);
    }
  };

  const handleUpdateLead = (updated: Lead) => {
    const existing = leads.find((l) => l.id === updated.id);
    const stageChanged = existing && existing.status !== updated.status;
    
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === updated.id);
      return exists ? prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)) : [updated, ...prev];
    });
    if (detailLead?.id === updated.id) setDetailLead((prev) => (prev ? { ...prev, ...updated } : updated));

    fetchWithTenantAuth('/api/leads', {
      method: 'POST',
      body: JSON.stringify(updated)
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) showToast(data?.error || 'Failed to save lead to database');
      })
      .catch(() => showToast('Failed to save lead to database'));
    
    if (stageChanged) {
      triggerConversionDispatch(updated.id, updated.status, updated);
      executeWorkflowTriggers('Lead Status Change', { lead: updated }, activeTenantId).catch(() => {});
    }
  };

  const handlePartialUpdateLead = (leadId: string, updates: Partial<Lead>, toastMsg?: string | null) => {
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === leadId);
      if (exists) {
        return prev.map((l) => (l.id === leadId ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l));
      } else {
        const found = leads.find((l) => l.id === leadId);
        if (found) {
          return [{ ...found, ...updates, updatedAt: new Date().toISOString() }, ...prev];
        }
        return prev;
      }
    });
    if (detailLead?.id === leadId) setDetailLead((prev) => (prev ? { ...prev, ...updates } : null));
    if (toastMsg) {
      showToast(toastMsg);
    }

    fetchWithTenantAuth('/api/leads', {
      method: 'POST',
      body: JSON.stringify({ id: leadId, ...updates })
    }).catch((err) => console.warn('Lead DB update notice:', err));
    
    if (updates.status) {
      triggerConversionDispatch(leadId, updates.status);
      executeWorkflowTriggers('Lead Status Change', { lead: { id: leadId, ...updates } }, activeTenantId).catch(() => {});
    }
    if (updates.notes) {
      executeWorkflowTriggers('On User Note', { lead: { id: leadId, ...updates }, note: updates.notes }, activeTenantId).catch(() => {});
    }
  };

  const handleUpdateLeadStage = (leadId: string, newStage: LeadStatus) => {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStage } : l));
    showToast(`Updated lead stage to '${newStage}'`);
    triggerConversionDispatch(leadId, newStage);
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (detailLead?.id === leadId) setDetailLead(null);
    fetchWithTenantAuth(`/api/leads/${leadId}`, {
      method: 'DELETE'
    }).catch(console.warn);
    showToast('Lead deleted successfully');
  };

  const handleClearAllLeads = () => {
    setLeads([]);
    showToast('All leads cleared! CRM is now clean.');
  };

  const handleSaveCallLog = (log: Partial<CallRecord>, followUpAt?: string) => {
    const newCall: CallRecord = {
      id: `call-${Date.now()}`,
      leadId: log.leadId || '',
      leadName: log.leadName || 'Lead',
      leadPhone: log.leadPhone || '',
      agentId: activeAgent.id,
      agentName: activeAgent.name,
      type: 'outgoing',
      durationSeconds: log.durationSeconds || 30,
      disposition: log.disposition || 'Interested',
      notes: log.notes || 'Call completed.',
      transcript: log.transcript,
      aiSummary: log.aiSummary,
      sentiment: log.sentiment || 'Positive',
      timestamp: new Date().toISOString()
    };

    setCallRecords((prev) => [newCall, ...prev]);
    fetchWithTenantAuth('/api/calls', {
      method: 'POST',
      body: JSON.stringify({
        ...newCall,
        callType: newCall.type,
        callNotes: newCall.notes,
        callStart: newCall.timestamp,
        assigneeName: newCall.agentName
      })
    }).catch(console.warn);

    // Log activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      leadId: newCall.leadId,
      agentId: activeAgent.id,
      agentName: activeAgent.name,
      type: 'call',
      title: `Outgoing Call - ${newCall.disposition}`,
      description: `Talk time: ${newCall.durationSeconds}s. Note: ${newCall.notes}`,
      timestamp: new Date().toISOString()
    };
    setActivities((prev) => [newAct, ...prev]);
    fetchWithTenantAuth('/api/activities', {
      method: 'POST',
      body: JSON.stringify(newAct)
    }).catch(console.warn);

    // Update agent stats
    setAgents((prev) => prev.map((a) => a.id === activeAgent.id ? { ...a, totalCallsToday: a.totalCallsToday + 1 } : a));
    showToast(`Call log saved for ${newCall.leadName}`);
  };

  const handleUpdateCallRecord = (callId: string, updates: Partial<CallRecord>) => {
    setCallRecords((prev) => prev.map((c) => (c.id === callId ? { ...c, ...updates, assigneeUpdatedAt: new Date().toISOString() } : c)));
    fetchWithTenantAuth('/api/calls/' + callId, {
      method: 'PUT',
      body: JSON.stringify({ id: callId, ...updates, callNotes: updates.notes || updates.callNotes })
    }).catch(console.warn);
    showToast('Call log remarks saved!');
  };

  // 3. WhatsApp Messages
  const handleSendMessage = (leadId: string, text: string) => {
    const newMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      leadId,
      direction: 'outbound',
      channel: 'whatsapp',
      content: text,
      timestamp: new Date().toISOString(),
      status: 'delivered'
    };
    setMessages((prev) => [...prev, newMsg]);
    fetchWithTenantAuth('/api/messages', {
      method: 'POST',
      body: JSON.stringify(newMsg)
    }).catch(console.warn);

    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      leadId,
      agentId: activeAgent.id,
      agentName: activeAgent.name,
      type: 'whatsapp',
      title: 'Outbound WhatsApp Sent',
      description: text,
      timestamp: new Date().toISOString()
    };
    setActivities((prev) => [newAct, ...prev]);
    fetchWithTenantAuth('/api/activities', {
      method: 'POST',
      body: JSON.stringify(newAct)
    }).catch(console.warn);
    showToast('WhatsApp message delivered!');
  };

  // 4. Simulate Real-Time Webhook Lead Push (IndiaMart, JustDial, 99acres)
  const handlePushTestLead = async (source: string = 'IndiaMart') => {
    const sources = ['IndiaMart', 'JustDial', '99acres', 'Facebook Ads', 'Google Ads', 'Sulekha'];
    const chosenSource = sources.includes(source) ? source : sources[Math.floor(Math.random() * sources.length)];
    
    showToast(`🔄 Pushing simulated webhook from ${chosenSource}...`);
    
    try {
      const res = await fetchWithTenantAuth('/api/webhooks/lead', {
        method: 'POST',
        body: JSON.stringify({
          name: `Vikramaditya Rao (${chosenSource})`,
          phone: `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`,
          email: 'vikram.rao@enterprise.in',
          company: 'Rao Logistics & Real Estate',
          city: 'Bengaluru',
          state: 'Karnataka',
          source: chosenSource,
          dealValue: 0,
          ownerAgentId: activeAgent.id,
          ownerAgentName: activeAgent.name
        })
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        showToast(`⚡ Real-Time Webhook Lead Pushed from ${chosenSource}!`);
      } else {
        showToast(`❌ Failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Webhook error:', err);
      showToast(`❌ Failed to push webhook lead`);
    }
  };

  // Global keyboard shortcuts for Cmd+K and Cmd+J
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsAiCopilotOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handlePowerDialerSaveCallLog = (leadId: string, disposition: LeadStatus, notes: string, durationSec: number) => {
    const targetLead = leads.find(l => l.id === leadId);
    const newRecord: CallRecord = {
      id: `call-${Date.now()}`,
      leadId: leadId,
      leadName: targetLead?.name || 'Prospect',
      leadPhone: targetLead?.phone || '+91 90000 00000',
      agentId: activeAgent.id,
      agentName: activeAgent.name,
      type: 'outgoing',
      durationSeconds: durationSec || 45,
      timestamp: new Date().toISOString(),
      disposition: disposition,
      recordingUrl: 'https://actions.google.com/sounds/v1/telecom/phone_dial_tone.ogg',
      callNotes: notes || `Call logged via Power Dialer queue.`,
      tags: [disposition]
    };

    setCallRecords(prev => [newRecord, ...prev]);

    // Update lead status and activity
    setLeads(prev => prev.map(l => l.id === leadId ? {
      ...l,
      status: disposition,
      updatedAt: new Date().toISOString(),
      notes: notes ? `${notes}\n---\n${l.notes || ''}` : l.notes
    } : l));

    setActivities(prev => [{
      id: `act-${Date.now()}`,
      leadId: leadId,
      agentId: activeAgent.id,
      agentName: activeAgent.name,
      type: 'call',
      title: `Outbound Call (${disposition})`,
      description: `${notes || 'Call completed'} - Duration: ${durationSec}s`,
      timestamp: new Date().toISOString()
    }, ...prev]);

    triggerConversionDispatch(leadId, disposition);
    showToast(`Call logged: ${targetLead?.name || 'Lead'} marked as ${disposition}`);
  };

  if (isLoggingIn) {
    return (
      <PixbeLoadingScreen
        companyName={currentUser?.companyName}
        userName={currentUser?.name}
        onFinish={() => {
          setIsAuthenticated(true);
          setIsLoggingIn(false);
          showToast(`Welcome back, ${currentUser?.name || 'User'}! Workspace synchronized.`);
        }}
      />
    );
  }

  if (!isAuthenticated || authScreen === 'set-password') {
    if (authScreen === 'set-password') {
      return (
        <SetPasswordView
          onDone={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
              return;
            }
            setAuthScreen('login');
            setIsAuthenticated(false);
          }}
        />
      );
    }
    if (authScreen === 'signup') {
      return (
        <SignUpView
          onSignUpSuccess={(registeredUser) => {
            handleLoginSuccess(registeredUser);
            showToast(`Company workspace provisioned for ${registeredUser.companyName || 'your account'}!`);
          }}
          onSwitchToLogin={() => {
            setAuthScreen('login');
            if (typeof window !== 'undefined') {
              window.history.pushState(null, '', '/login');
            }
          }}
        />
      );
    }
    return (
      <LoginView
        agents={agents}
        onLogin={handleLoginSuccess}
        onSwitchToSignUp={() => {
          setAuthScreen('signup');
          if (typeof window !== 'undefined') {
            window.history.pushState(null, '', '/signup');
          }
        }}
      />
    );
  }

  const pendingTasksCount = useMemo(() => {
    // Admin does not use Tasks
    if (isAdmin || crmRole === 'Telecaller') return 0;

    const pendingFromTasks = (liveCrmTasks || []).filter(t => t.status === 'Pending' || !t.status);
    if (crmRole === 'Manager') {
      const teamIds = new Set(visibleAgents.map((a) => a.id));
      return pendingFromTasks.filter(
        (t) => teamIds.has(t.assigneeAgentId) || t.assigneeAgentId === activeAgent?.id
      ).length;
    }
    return pendingFromTasks.filter(
      (t) => matchesAgent(agents, activeAgent, { id: t.assigneeAgentId, name: t.assigneeAgentName })
    ).length;
  }, [liveCrmTasks, activeAgent, isAdmin, crmRole, visibleAgents, agents]);

  const pendingFollowUpsCount = useMemo(() => {
    // Use role-scoped leads so Manager sees team follow-ups and Telecaller only their own
    return (visibleLeads || []).filter(
      (l) => l.followUpAt || l.status === 'Follow Up' || (l.status || '').toLowerCase().includes('follow')
    ).length;
  }, [visibleLeads]);

  if (currentView === 'workflow_builder') {
    return (
      <StagesContext.Provider value={activeStages}>
        <WorkflowBuilderPage
          key={activeWorkflowForBuilder?.id || 'new_workflow'}
          initialWorkflow={activeWorkflowForBuilder}
          onBack={() => {
            setActiveWorkflowForBuilder(null);
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.removeItem('pixbe_active_workflow_id');
            }
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('pixbe_active_workflow_id');
            }
            setCurrentView('workflows');
            syncUrlWithView('workflows');
          }}
          onSave={(savedWorkflow) => {
            saveWorkflowToDb(savedWorkflow, activeTenantId);
            showToast(`Workflow "${savedWorkflow.name}" saved and published!`);
            setActiveWorkflowForBuilder(savedWorkflow);
            if (typeof sessionStorage !== 'undefined' && savedWorkflow?.id) {
              sessionStorage.setItem('pixbe_active_workflow_id', savedWorkflow.id);
            }
            if (typeof localStorage !== 'undefined' && savedWorkflow?.id) {
              localStorage.setItem('pixbe_active_workflow_id', savedWorkflow.id);
            }
            syncUrlWithView('workflow_builder', undefined, true, { id: savedWorkflow.id });
            setWorkflows((prev) => {
              const exists = prev.some((w) => w.id === savedWorkflow.id || w.name === savedWorkflow.name);
              if (exists) {
                return prev.map((w) =>
                  w.id === savedWorkflow.id || w.name === savedWorkflow.name
                    ? { ...w, name: savedWorkflow.name, isActive: savedWorkflow.status === 'published' }
                    : w
                );
              }
              return [
                {
                  id: savedWorkflow.id,
                  name: savedWorkflow.name,
                  description: savedWorkflow.description || 'Visual workflow automation',
                  triggerEvent: savedWorkflow.nodes[0]?.data?.label || 'Lead Event',
                  condition: 'Custom Conditions',
                  actions: savedWorkflow.nodes.filter((n: any) => n.data?.kind === 'action').map((n: any) => n.data?.label),
                  isActive: savedWorkflow.status === 'published',
                  executedCount: 0
                },
                ...prev
              ];
            });
          }}
        />
      </StagesContext.Provider>
    );
  }

  return (
    <StagesContext.Provider value={activeStages}>
    <div className="h-screen h-[100dvh] max-w-[100vw] overflow-x-hidden glass-mesh-bg text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeAgent={activeAgent}
        agents={activeAgentsList}
        companyName={companyName || 'ARCLE Real Estate & Sales'}
        onOpenLeadModal={handleOpenAddLead}
        onAddNewLead={handleOpenAddLead}
        onPushTestLead={() => handlePushTestLead('IndiaMart')}
        onOpenVoiceBot={() => setVoiceBotLead(leads[0])}
        onOpenPowerDialer={() => setIsPowerDialerQueueOpen(true)}
        onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        pendingFollowUpsCount={pendingFollowUpsCount}
        pendingTasksCount={pendingTasksCount}
        leads={visibleLeads}
        tasks={liveCrmTasks}
        onOpenLeadDetail={(lead) => setDetailLead(lead)}
        onNavigateToFollowUps={() => setCurrentView('followups')}
        onNavigateToSettings={() => setCurrentView('settings')}
        onNavigateToTab={(tab, subTab) => {
          setCurrentView(tab);
          if (tab === 'settings' && subTab) {
            setSettingsSubTab(subTab as any);
          }
        }}
        currentView={currentView}
        onShowToast={(msg) => showToast(msg)}
        onLogout={handleLogout}
      />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar */}
        <Sidebar 
          activeTab={currentView as any} 
          setActiveTab={(tab, subTab) => {
            setCurrentView(tab);
            if (subTab) {
              if (tab === 'reports') setReportsSubTab(subTab as ReportsSubTab);
              if (tab === 'workflows') setAutomationsSubTab(subTab as AutomationsSubTab);
            }
          }} 
          automationsSubTab={automationsSubTab}
          reportsSubTab={reportsSubTab}
          unassignedLeadsCount={leads.filter((l) => !l.ownerAgentId).length}
          missedCallsCount={callRecords.filter((c) => c.type === 'missed').length}
          globalSavedFilters={globalSavedFilters}
          activeFilterId={activeFilterId}
          setActiveFilterId={setActiveFilterId}
          isAdmin={isAdmin}
          activeAgentRole={activeAgent?.role}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto bg-transparent p-3 md:p-5 pb-24 md:pb-5 ios-scroll min-h-0">
          {currentView === 'add_lead' && (
            <AddLeadView
              leads={liveLeads}
              agents={agents}
              customFields={customFields}
              activeAgent={activeAgent}
              onSaveLead={(newLead, stayOnPage = true) => {
                const leadWithDate: Lead = {
                  ...newLead,
                  createdAt: (newLead.createdAt && newLead.createdAt !== 'Just Now' && newLead.createdAt !== 'Just now')
                    ? newLead.createdAt
                    : new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                setLeads((prev) => [leadWithDate, ...prev]);
                fetchWithTenantAuth('/api/leads', {
                  method: 'POST',
                  body: JSON.stringify(leadWithDate)
                }).catch((err) => console.warn('Lead DB save notice:', err));

                if (leadWithDate.whatsappOptIn) {
                  const autoMsg: WhatsAppMessage = {
                    id: `msg-${Date.now()}`,
                    leadId: leadWithDate.id,
                    direction: 'outbound',
                    channel: 'whatsapp',
                    content: `Hi ${leadWithDate.name}, thank you for contacting us! Our representative ${leadWithDate.ownerAgentName || 'team'} will assist you shortly regarding your inquiry.`,
                    timestamp: new Date().toISOString(),
                    status: 'delivered'
                  };
                  setMessages((prev) => [...prev, autoMsg]);

                  const autoAct: ActivityLog = {
                    id: `act-${Date.now()}`,
                    leadId: leadWithDate.id,
                    agentId: activeAgent.id,
                    agentName: activeAgent.name,
                    type: 'whatsapp',
                    title: 'Automated WhatsApp Intro Dispatched',
                    description: `Automated welcome introduction message dispatched to ${leadWithDate.phone} via WhatsApp.`,
                    timestamp: new Date().toISOString()
                  };
                  setActivities((prev) => [autoAct, ...prev]);
                  showToast(`New Lead Saved & Automated WhatsApp Intro Message Dispatched to ${leadWithDate.name}!`);
                } else {
                  showToast(`New Lead Saved to Database: ${leadWithDate.name}`);
                }

                if (stayOnPage === false) {
                  setCurrentView(previousView || 'leads');
                }
              }}
              onSaveAndCall={(newLead) => {
                const leadWithDate: Lead = {
                  ...newLead,
                  createdAt: (newLead.createdAt && newLead.createdAt !== 'Just Now' && newLead.createdAt !== 'Just now')
                    ? newLead.createdAt
                    : new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                setLeads((prev) => [leadWithDate, ...prev]);
                fetchWithTenantAuth('/api/leads', {
                  method: 'POST',
                  body: JSON.stringify(leadWithDate)
                }).catch((err) => console.warn('Lead DB save notice:', err));

                if (newLead.whatsappOptIn) {
                  const autoMsg: WhatsAppMessage = {
                    id: `msg-${Date.now()}`,
                    leadId: newLead.id,
                    direction: 'outbound',
                    channel: 'whatsapp',
                    content: `Hi ${newLead.name}, thank you for contacting us! Our representative ${newLead.ownerAgentName || 'team'} is calling you now.`,
                    timestamp: new Date().toISOString(),
                    status: 'delivered'
                  };
                  setMessages((prev) => [...prev, autoMsg]);
                }
                showToast(`Saved Lead & Calling ${newLead.name}`);
                window.location.href = `tel:${newLead.phone}`;
              }}
              onImportBulkLeads={(bulkLeads) => {
                handleImportCsv(bulkLeads);
              }}
              onCancel={() => setCurrentView(previousView || 'leads')}
              onNavigateToTab={(tab) => setCurrentView(tab)}
            />
          )}

          {currentView === 'dashboard' && (
            activeAgentRights.dashboardView ? (
              <DashboardView
                leads={visibleLeads}
                agents={isAdmin ? activeAgentsList : visibleAgents}
                stages={activeStages}
                hourlyMetrics={HOURLY_METRICS}
                activeAgent={activeAgent}
                customFields={activeCustomFields}
                currency={activeCurrency}
                showLeadByStages={crmRole !== 'Telecaller'}
                onOpenLeadDetail={(lead) => setDetailLead(lead)}
                onNavigateToTab={(tab) => setCurrentView(tab)}
                onDeleteLead={handleDeleteLead}
                onUpdateLead={handlePartialUpdateLead}
                onRefreshData={() => loadTenantDomainData(activeTenantId)}
              />
            ) : renderAccessRestricted('Executive Dashboard')
          )}

          {currentView === 'pipeline' && (
            <PipelineView
              leads={visibleLeads}
              agents={visibleAgents}
              stages={activeStages}
              customFields={activeCustomFields}
              currency={activeCurrency}
              lostReasons={lostReasons}
              onUpdateLostReasons={handleUpdateLostReasons}
              activeAgent={activeAgent}
              activeTenantId={activeTenantId}
              onOpenLeadDetail={(lead) => setDetailLead(lead)}
              onUpdateLeadStage={(leadId, newStageStatus) => {
                handlePartialUpdateLead(leadId, { 
                  status: newStageStatus as any, 
                  pipelineStageId: newStageStatus 
                });
              }}
              onUpdateStages={(updatedStages) => {
                setStages(updatedStages);
                fetchWithTenantAuth('/api/pipelines', {
                  method: 'POST',
                  body: JSON.stringify(updatedStages)
                })
                  .then(async (res) => {
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok || !data?.success) {
                      showToast(data?.error || 'Failed to save pipeline stages to database');
                      return;
                    }
                    if (Array.isArray(data.stages)) setStages(data.stages);
                    showToast('Pipeline stages saved to database');
                  })
                  .catch(() => showToast('Failed to save pipeline stages to database'));
              }}
              onUpdateLead={handlePartialUpdateLead}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {currentView === 'leads' && (
            <LeadsView
              leads={visibleLeads}
              agents={visibleAgents}
              customFields={activeCustomFields}
              activeAgent={activeAgent}
              currency={activeCurrency}
              lostReasons={lostReasons}
              onUpdateLostReasons={handleUpdateLostReasons}
              onOpenLeadDetail={(lead) => setDetailLead(lead)}
              onAddNewLead={handleOpenAddLead}
              onImportCsv={handleImportCsv}
              onMergeLeads={handleMergeLeads}
              onAddCustomField={handleAddCustomField}
              onPushTestLead={handlePushTestLead}
              onDeleteLead={handleDeleteLead}
              onClearAllLeads={handleClearAllLeads}
              onUpdateLead={handlePartialUpdateLead}
              onRefreshData={() => loadTenantDomainData(activeTenantId)}
              onNavigateToTab={(tab) => setCurrentView(tab)}
              onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
              globalSavedFilters={globalSavedFilters}
              activeFilterId={activeFilterId}
              setActiveFilterId={setActiveFilterId}
            />
          )}

          {currentView === 'followups' && (
            <FollowUpsView
              leads={visibleLeads}
              agents={visibleAgents}
              customFields={activeCustomFields}
              callRecords={liveCallRecords}
              activeAgent={activeAgent}
              onUpdateLead={handlePartialUpdateLead}
              onOpenLeadDetail={(lead) => setDetailLead(lead)}
              onCallLead={(lead) => { window.location.href = `tel:${lead.phone}`; }}
              onSendMessage={handleSendMessage}
            />
          )}

          {currentView === 'tasks' && (
            isAdmin || crmRole === 'Telecaller' ? (
              renderAccessRestricted('Tasks & Reminders')
            ) : (
            <TasksView
              agents={visibleAgents}
              activeAgent={activeAgent}
              tasks={liveCrmTasks}
              currency={activeCurrency}
              onCreateTask={handleCreateCrmTask}
              onDeleteTask={handleDeleteCrmTask}
              onUpdateTaskStatus={handleUpdateCrmTaskStatus}
              onUpdateTask={handleUpdateCrmTask}
            />
            )
          )}

          {currentView === 'inbox' && (
            <OmnichannelInboxView
              leads={visibleLeads}
              messages={messages}
              agents={agents}
              onSendMessage={handleSendMessage}
              onOpenLeadDetail={(lead) => setDetailLead(lead)}
              onCallLead={(lead) => { window.location.href = `tel:${lead.phone}`; }}
            />
          )}

          {currentView === 'whatsapp' && (
            activeAgentRights.whatsappTemplates ? (
              <WhatsAppCrmView
                templates={templates}
                campaigns={campaigns}
                leads={visibleLeads}
                onAddTemplate={(tmpl) => {
                  setTemplates((prev) => [tmpl, ...prev]);
                  fetchWithTenantAuth('/api/whatsapp-templates', { method: 'POST', body: JSON.stringify(tmpl) }).catch(console.warn);
                }}
                onCreateCampaign={(camp) => {
                  setCampaigns((prev) => [camp, ...prev]);
                  fetchWithTenantAuth('/api/whatsapp-campaigns', { method: 'POST', body: JSON.stringify(camp) }).catch(console.warn);
                }}
              />
            ) : renderAccessRestricted('WhatsApp CRM & Messaging Templates')
          )}

          {currentView === 'workflows' && (
            isAdmin ? (
              <WorkflowsView
                workflows={workflows}
                initialSubTab={automationsSubTab}
                onToggleWorkflow={(id) => setWorkflows((prev) => prev.map((w) => w.id === id ? { ...w, isActive: !w.isActive } : w))}
                onAddWorkflow={(wf) => setWorkflows((prev) => [wf, ...prev])}
                onOpenWorkflowBuilder={(wf) => {
                  const target = wf || getWorkflowsFromDb(activeTenantId)[0] || null;
                  setActiveWorkflowForBuilder(target);
                  if (typeof sessionStorage !== 'undefined' && target?.id) {
                    sessionStorage.setItem('pixbe_active_workflow_id', target.id);
                  }
                  if (typeof localStorage !== 'undefined' && target?.id) {
                    localStorage.setItem('pixbe_active_workflow_id', target.id);
                  }
                  setCurrentView('workflow_builder');
                  syncUrlWithView('workflow_builder', undefined, false, target?.id ? { id: target.id } : undefined);
                }}
                onShowToast={(msg) => showToast(msg)}
              />
            ) : renderAccessRestricted('AI Automations & Workflows')
          )}


          {(currentView === 'calls' || currentView === 'calling_logs') && (
            <MyCallsView
              callRecords={liveCallRecords}
              agents={agents}
              activeAgent={activeAgent}
              leads={visibleLeads}
              onOpenLeadDetail={(lead) => setDetailLead(lead)}
              onUpdateCallRecord={handleUpdateCallRecord}
              onAddCallRecord={(newCall) => {
                setCallRecords((prev) => [newCall, ...prev]);
                fetchWithTenantAuth('/api/calls', {
                  method: 'POST',
                  body: JSON.stringify({
                    ...newCall,
                    callType: newCall.type,
                    callNotes: newCall.notes,
                    callStart: newCall.timestamp,
                    assigneeName: newCall.agentName
                  })
                }).catch(console.warn);
              }}
              onDeleteCallRecord={(callId) => {
                setCallRecords((prev) => prev.filter((c) => c.id !== callId));
                fetchWithTenantAuth('/api/calls/' + callId, { method: 'DELETE' }).catch(console.warn);
              }}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {currentView === 'reports' && (
            activeAgentRights.reports ? (
              <ReportsView
                initialSubTab={reportsSubTab}
                callRecords={liveCallRecords}
                agents={visibleAgents}
                leads={visibleLeads}
                activities={liveActivities}
                currentUser={activeAgent}
                onOpenLeadDetail={(lead) => setDetailLead(lead)}
                onUpdateCallRecord={handleUpdateCallRecord}
              />
            ) : renderAccessRestricted('Performance Reports & Analytics')
          )}

          {currentView === 'analytics' && (
            <AnalyticsView leads={visibleLeads} hourlyMetrics={HOURLY_METRICS} />
          )}

          {currentView === 'team' && (
            isAdmin ? <TeamView
              agents={agents}
              activeAgent={activeAgent}
              onToggleAgentStatus={(id, st) => setAgents((prev) => prev.map((a) => a.id === id ? { ...a, status: st } : a))}
              onAddAgent={handleAddAgent}
              onRemoveAgent={handleRemoveAgent}
              onToggleAdminPower={handleToggleAdminPower}
              onUpdateAgentRole={handleUpdateAgentRole}
              onUpdateAgent={handleUpdateAgent}
            /> : renderAccessRestricted('Users & Team')
          )}

          {currentView === 'marketing' && (
            isAdmin ? (
              <MarketingView onSimulateWebhookLead={(src) => handlePushTestLead(src)} />
            ) : renderAccessRestricted('Marketing Webhooks')
          )}

          {currentView === 'campaigns' && (
            crmRole === 'Telecaller' ? renderAccessRestricted('Campaigns & Tags') : (
            <CampaignsView
              activeTenantId={activeTenantId}
              leads={visibleLeads}
              agents={visibleAgents}
              activities={liveActivities}
              messages={messages}
              callRecords={liveCallRecords}
              customFields={activeCustomFields}
              initialCampaignHandle={selectedCampaignHandle}
              onOpenLeadDetail={(lead) => setDetailLead(lead)}
              onUpdateLead={handleUpdateLead}
              onAddActivity={(act) => setActivities((prev) => [{
                id: `act-${Date.now()}`,
                leadId: act.leadId || '',
                agentId: activeAgent.id,
                agentName: activeAgent.name,
                type: act.type || 'note',
                title: act.title || 'Note',
                description: act.description || '',
                timestamp: new Date().toISOString()
              }, ...prev])}
              onSendMessage={handleSendMessage}
              onOpenPowerDialerForLead={(ld) => {
                showToast(`Dialing ${ld.name} (${ld.phone})...`);
                window.location.href = `tel:${ld.phone}`;
              }}
              onDeleteLead={handleDeleteLead}
              onUpdateCallRecord={handleUpdateCallRecord}
              lostReasons={lostReasons}
              onNavigateToTab={(tab, subTab) => {
                setCurrentView(tab);
                if (tab === 'settings' && subTab) {
                  setSettingsSubTab(subTab as any);
                }
              }}
              onShowToast={(msg) => showToast(msg)}
            />
            )
          )}

          {currentView === 'integrations' && (
            isAdmin ? (
              <IntegrationsView 
                agents={agents}
                customFields={activeCustomFields}
                onNavigateToCampaign={(handle) => {
                  loadTenantDomainData(activeTenantId);
                  setSelectedCampaignHandle(handle);
                  setCurrentView('campaigns');
                }}
                onLeadsSynced={() => loadTenantDomainData(activeTenantId)}
              />
            ) : renderAccessRestricted('Integrations & Webhook Connections (Admin Only)')
          )}

          {currentView === 'docs_sign' && (
            <DocsAndSignView leads={visibleLeads} />
          )}

          {currentView === 'fields' && (
            isAdmin ? <FieldsSettingsView
              customFields={activeCustomFields}
              activeAgent={activeAgent}
              onUpdateFields={(updatedFields) => {
                handleSaveFieldsToDb(updatedFields);
                showToast('Custom fields database updated successfully!');
              }}
              onShowToast={(msg) => showToast(msg)}
            /> : renderAccessRestricted('Lead Fields')
          )}

          {currentView === 'call_feedback' && (
            isAdmin ? <CallFeedbackSettingsView
              activeAgent={activeAgent}
              onShowToast={(msg) => showToast(msg)}
            /> : renderAccessRestricted('Call Feedback Settings')
          )}

          {currentView === 'settings' && (
            isAdmin ? <SettingsView
              companyName={rawCompanyName || 'ARCLE Real Estate & Sales'}
              onUpdateCompanyName={(newName) => {
                setWorkspaceProfile([{ id: 'default_workspace', name: newName }]);
                if (currentUser) {
                  const updated = { ...currentUser, companyName: newName };
                  setCurrentUser(updated);
                  if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.setItem('pixbe_auth_user', JSON.stringify(updated));
                  }
                }
                saveWorkspaceSettings({ companyName: newName });
              }}
              supportEmail={activeSupportEmail}
              onUpdateSupportEmail={(newEmail) => {
                setWorkspaceEmail([{ id: 'default_email', email: newEmail }]);
                saveWorkspaceSettings({ supportEmail: newEmail });
              }}
              currency={activeCurrency}
              onUpdateCurrency={(newCurrency) => {
                setWorkspaceCurrency([{ id: 'default_currency', code: newCurrency }]);
                saveWorkspaceSettings({ currency: newCurrency }, `Workspace currency updated to ${newCurrency}`);
              }}
              activeAgent={activeAgent}
              stages={activeStages}
              onUpdateStages={(updatedStages) => {
                setStages(updatedStages);
                fetchWithTenantAuth('/api/pipelines', {
                  method: 'POST',
                  body: JSON.stringify(updatedStages)
                })
                  .then(async (res) => {
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok || !data?.success) {
                      showToast(data?.error || 'Failed to save pipeline stages to database');
                      return;
                    }
                    if (Array.isArray(data.stages)) setStages(data.stages);
                    showToast('Pipeline stages saved to database');
                  })
                  .catch(() => showToast('Failed to save pipeline stages to database'));
              }}
              agents={agents}
              onUpdateAgents={(updatedAgents) => {
                const prev = agents || [];
                const prevIds = new Set(prev.map((a) => a.id));
                const nextIds = new Set(updatedAgents.map((a) => a.id));
                setAgents(updatedAgents);
                updatedAgents.filter((a) => !prevIds.has(a.id)).forEach((a) => {
                  const password = (a as Agent).password;
                  if (!password || String(password).length < 8) {
                    showToast(`Skipped ${a.name}: temporary password (8+ chars) is required`);
                    return;
                  }
                  fetchWithTenantAuth('/api/agents', {
                    method: 'POST',
                    body: JSON.stringify({ ...a, password, tenantId: activeTenantId })
                  }).catch(console.warn);
                });
                prev.filter((a) => !nextIds.has(a.id)).forEach((a) => {
                  fetchWithTenantAuth('/api/agents/' + a.id, { method: 'DELETE' }).catch(console.warn);
                });
              }}
              onUpdateCurrentUser={(updatedUser) => {
                const prevId = activeAgent?.id || currentUser?.id;
                const prevEmail = (activeAgent?.email || currentUser?.email || '').toLowerCase();

                setCurrentUser(updatedUser);
                setActiveAgentId(updatedUser.id);

                setAgents((prev) => {
                  const list = prev || [];
                  const idx = list.findIndex(
                    (a) =>
                      a.id === prevId ||
                      a.id === updatedUser.id ||
                      (prevEmail && a.email && a.email.toLowerCase() === prevEmail) ||
                      (updatedUser.email && a.email && a.email.toLowerCase() === updatedUser.email.toLowerCase())
                  );
                  if (idx >= 0) {
                    const next = [...list];
                    next[idx] = { ...list[idx], ...updatedUser };
                    return next;
                  }
                  return [updatedUser, ...list];
                });

                if (typeof sessionStorage !== 'undefined') {
                  sessionStorage.setItem('pixbe_auth_user', JSON.stringify(updatedUser));
                  sessionStorage.removeItem('pixbe_current_user');
                }

                // Reload agents/leads/tasks/calls from DB so denormalized labels match primary store
                void loadTenantDomainData(updatedUser.tenantId || activeTenantId);
              }}
              customFields={activeCustomFields}
              onUpdateFields={(updatedFields) => {
                handleSaveFieldsToDb(updatedFields);
              }}
              permissionTemplates={activeTemplates}
              onUpdatePermissionTemplates={(updatedTemplates) => {
                setPermissionTemplates(updatedTemplates);
                saveWorkspaceSettings({ permissionTemplates: updatedTemplates }, 'Permission templates saved to database');
              }}
              lostReasons={lostReasons}
              onUpdateLostReasons={handleUpdateLostReasons}
              initialTab={settingsSubTab}
              onShowToast={(msg) => showToast(msg)} 
            /> : renderAccessRestricted('Workspace Settings')
          )}

          {![
            'add_lead', 'dashboard', 'pipeline', 'leads', 'followups', 'tasks',
            'inbox', 'whatsapp', 'workflows', 'workflow_builder', 'calls', 'calling_logs', 'reports',
            'analytics', 'team', 'marketing', 'campaigns', 'integrations',
            'docs_sign', 'fields', 'call_feedback', 'settings'
          ].includes(currentView) && (
            <NotFoundView onNavigate={(nextView) => setCurrentView(nextView)} />
          )}
        </main>
      </div>

      {/* MODAL 1: Lead Details Drawer */}
      {detailLead && (
        <LeadDetailModal
          lead={liveDetailLead || detailLead}
          allLeads={visibleLeads}
          agents={agents}
          activities={liveActivities}
          messages={messages}
          callRecords={liveCallRecords}
          lostReasons={lostReasons}
          customFields={activeCustomFields}
          onClose={() => setDetailLead(null)}
          onSelectLead={(nextLead) => setDetailLead(nextLead)}
          onUpdateLead={handleUpdateLead}
          onAddActivity={(act) => {
            const newActivity: ActivityLog = {
              id: act.id || `act-${Date.now()}`,
              leadId: act.leadId || detailLead.id,
              agentId: act.agentId || activeAgent.id,
              agentName: act.agentName || activeAgent.name,
              type: act.type || 'note',
              title: act.title || 'Activity',
              description: act.description || '',
              timestamp: act.timestamp || new Date().toISOString(),
              metadata: act.metadata
            };
            setActivities((prev) => [newActivity, ...prev]);

            // Persist activity inside the lead's own record in state and database safely
            setLeads((prev) =>
              prev.map((l) => {
                if (l.id === newActivity.leadId) {
                  const updatedLead = {
                    ...l,
                    activities: [newActivity, ...(l.activities || []).filter((a) => a.id !== newActivity.id)],
                    updatedAt: new Date().toISOString()
                  };
                  return updatedLead;
                }
                return l;
              })
            );

            // Also post to backend /api/activities
            fetchWithTenantAuth('/api/activities', {
              method: 'POST',
              body: JSON.stringify(newActivity)
            }).catch((err) => console.warn('Activity sync notice:', err));
          }}
          onSendMessage={handleSendMessage}
          onDeleteLead={handleDeleteLead}
          onUpdateCallRecord={handleUpdateCallRecord}
        />
      )}

      {/* MODAL 2: AI Voice Calling Bot Interview Simulator */}
      {voiceBotLead && (
        <AiVoiceBotModal
          lead={voiceBotLead}
          onClose={() => setVoiceBotLead(null)}
        />
      )}

      {/* MODAL 3: Google Sheets Two-Way Auto-Sync Modal */}
      {isGoogleSheetsModalOpen && (
        <GoogleSheetsIntegrationModal
          leads={visibleLeads}
          activeAgent={activeAgent}
          onImportLeads={(importedLeads) => {
            setLeads((prev) => [...importedLeads, ...prev]);
            showToast(`Imported ${importedLeads.length} leads from Google Sheets!`);
          }}
          onClose={() => setIsGoogleSheetsModalOpen(false)}
        />
      )}

      {/* MODAL 4: Global Quick Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        leads={visibleLeads}
        agents={agents}
        companyName={rawCompanyName}
        onSelectLead={(lead) => setDetailLead(lead)}
        onNavigate={(view) => setCurrentView(view)}
        onAddNewLead={handleOpenAddLead}
        onOpenPowerDialer={() => setIsPowerDialerQueueOpen(true)}
        onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
        onOpenVoiceBot={() => setVoiceBotLead(leads[0])}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
      />

      {/* MODAL 5: AI Sales Copilot & Objection Buster (Cmd + J) */}
      <AiCopilotModal
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
        lead={liveDetailLead || visibleLeads[0]}
        leads={visibleLeads}
        activeAgent={activeAgent}
        companyName={rawCompanyName}
        onSendMessage={handleSendMessage}
        onOpenLeadDetail={(lead) => setDetailLead(lead)}
      />

      {/* MODAL 6: Power Dialer Queue Modal */}
      <PowerDialerQueueModal
        isOpen={isPowerDialerQueueOpen}
        onClose={() => setIsPowerDialerQueueOpen(false)}
        leads={visibleLeads}
        activeAgent={activeAgent}
        companyName={rawCompanyName}
        currency={activeCurrency}
        onSaveCallLog={handlePowerDialerSaveCallLog}
        onSendMessage={handleSendMessage}
        onUpdateLeadStatus={(leadId, status) => {
          setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status, updatedAt: new Date().toISOString() } : l));
        }}
      />

      {/* iOS & Mobile Bottom Navigation Bar & Slide-up Drawer Menu */}
      <MobileBottomNav
        activeTab={currentView as any}
        setActiveTab={(tab, subTab) => {
          setCurrentView(tab);
          if (subTab) {
            if (tab === 'reports') setReportsSubTab(subTab as ReportsSubTab);
            if (tab === 'workflows') setAutomationsSubTab(subTab as AutomationsSubTab);
          }
        }}
        unassignedLeadsCount={leads.filter((l) => !l.ownerAgentId).length}
        pendingFollowUpsCount={pendingFollowUpsCount}
        activeAgent={activeAgent}
        agents={agents}
        companyName={rawCompanyName}
        onSelectAgent={(agentId) => setActiveAgentId(agentId)}
        onOpenAddLeadModal={handleOpenAddLead}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        onOpenPowerDialer={() => setIsPowerDialerQueueOpen(true)}
        onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
      />
    </div>
    </StagesContext.Provider>
  );
}

export default App;
