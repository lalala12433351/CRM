import React, { useState, useEffect, useMemo } from 'react';
import { useSyncState } from './lib/hooks';
import { seedDatabase, clearAllLeadsFromFirestore } from './lib/db';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { OmnichannelInboxView } from './components/OmnichannelInboxView';
import { PipelineView } from './components/PipelineView';
import { WhatsAppCrmView } from './components/WhatsAppCrmView';
import { WorkflowsView, AutomationsSubTab } from './components/WorkflowsView';
import { CallingLogsView } from './components/CallingLogsView';
import { AnalyticsView } from './components/AnalyticsView';
import { TeamView } from './components/TeamView';
import { MarketingView } from './components/MarketingView';
import { DocsAndSignView } from './components/DocsAndSignView';
import { AddLeadView } from './components/AddLeadView';
import { FollowUpsView } from './components/FollowUpsView';
import { ReportsView, ReportsSubTab } from './components/ReportsView';
import { IntegrationsView } from './components/IntegrationsView';
import { SettingsView, SettingsTab } from './components/SettingsView';
import { CampaignsView } from './components/CampaignsView';
import { FieldsSettingsView } from './components/FieldsSettingsView';
import { TasksView } from './components/TasksView';

import { LeadDetailModal } from './components/LeadDetailModal';
import { AiVoiceBotModal } from './components/AiVoiceBotModal';
import { GoogleSheetsIntegrationModal } from './components/GoogleSheetsIntegrationModal';
import { CommandPalette } from './components/CommandPalette';
import { AiCopilotModal } from './components/AiCopilotModal';
import { PowerDialerQueueModal } from './components/PowerDialerQueueModal';
import { LoginView } from './components/LoginView';
import { SignUpView } from './components/SignUpView';
import { PixbeLoadingScreen } from './components/PixbeLoadingScreen';
import { PhoneCall, X, Users } from 'lucide-react';
import { verifyCurrentSession, logoutWithApi } from './lib/auth';

import { 
  INITIAL_LEADS, 
  INITIAL_AGENTS, 
  INITIAL_ACTIVITIES, 
  INITIAL_MESSAGES, 
  INITIAL_CALL_RECORDS, 
  INITIAL_TEMPLATES, 
  INITIAL_CAMPAIGNS, 
  INITIAL_WORKFLOWS, 
  INITIAL_CUSTOM_FIELDS, 
  INITIAL_STAGES, 
  HOURLY_METRICS,
  INITIAL_PERMISSION_TEMPLATES 
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
import { ShieldCheck } from 'lucide-react';

export const StagesContext = React.createContext<PipelineStage[]>(INITIAL_STAGES);

export function App() {
  // Navigation & Active View State (defaulting to 'leads' to match screenshot view)
  const [currentView, setCurrentView] = useState<string>('leads');
  const [reportsSubTab, setReportsSubTab] = useState<ReportsSubTab>('call_logs');
  const [automationsSubTab, setAutomationsSubTab] = useState<AutomationsSubTab>('workflows');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsTab>('general');
  const [activeAgentId, setActiveAgentId] = useState<string>('agent-ms');
  const [selectedCampaignHandle, setSelectedCampaignHandle] = useState<string>('@master-form-iata-cargo');
  const [activeFilterId, setActiveFilterId] = useState<string>('all_leads');

  // Global filters synchronized with database query logic
  const globalSavedFilters = [
    { id: 'all_leads', name: 'All Leads', iconType: 'arrow' },
    { id: 'active_leads', name: 'All Active Leads', iconType: 'arrow' },
    { id: 'followup_leads', name: 'Followup Leads', iconType: 'filter' },
  ];

  // Core CRM Collections State synchronized with Firebase
  const [leads, setLeads] = useSyncState<Lead>('leads');
  const [agents, setAgents] = useSyncState<Agent>('agents');
  const [stages, setStages] = useSyncState<PipelineStage>('stages');
  const [activities, setActivities] = useSyncState<ActivityLog>('activities');
  const [messages, setMessages] = useSyncState<WhatsAppMessage>('messages');
  const [callRecords, setCallRecords] = useSyncState<CallRecord>('callRecords');
  const [templates, setTemplates] = useSyncState<WhatsAppTemplate>('templates');
  const [campaigns, setCampaigns] = useSyncState<WhatsAppCampaign>('campaigns');
  const [workflows, setWorkflows] = useSyncState<WorkflowRule>('workflows');
  const [customFields, setCustomFields] = useSyncState<CustomFieldDef>('customFields');
  const [permissionTemplates, setPermissionTemplates] = useSyncState<PermissionTemplate>('permissionTemplates');
  const [taskCategories, setTaskCategories] = useSyncState<TaskTypeCategory>('taskCategories');
  const [workspaceProfile, setWorkspaceProfile] = useSyncState<{ id: string; name: string }>('workspaceProfile');
  const companyName = workspaceProfile?.[0]?.name || 'ARCLE Real Estate & Sales';
  const [workspaceEmail, setWorkspaceEmail] = useSyncState<{ id: string; email: string }>('workspaceEmail');
  const [workspaceCurrency, setWorkspaceCurrency] = useSyncState<{ id: string; code: string }>('workspaceCurrency');

  const INITIAL_TASK_CATEGORIES: TaskTypeCategory[] = [
    { id: 'task-type-call', name: 'Call Followups', color: 'indigo', isBuiltIn: true },
    { id: 'task-type-todo', name: 'Todo', color: 'emerald', isBuiltIn: true },
  ];

  const activeTaskCategories = taskCategories && taskCategories.length > 0 ? taskCategories : INITIAL_TASK_CATEGORIES;

  const [crmTasks, setCrmTasks] = useSyncState<CrmTask>('crmTasks');

  const handleCreateCrmTask = (task: CrmTask) => {
    setCrmTasks((prev) => [...(prev || []), task]);
    showToast(`Task "${task.title}" created for ${task.assigneeAgentName}!`);
  };

  const handleDeleteCrmTask = (taskId: string) => {
    setCrmTasks((prev) => (prev || []).filter(t => t.id !== taskId));
    showToast('Task deleted.');
  };

  const handleUpdateCrmTaskStatus = (taskId: string, status: 'Pending' | 'Completed' | 'Rejected') => {
    setCrmTasks((prev) => (prev || []).map(t => t.id === taskId ? { ...t, status } : t));
    showToast(`Task marked as ${status}.`);
  };

  const handleUpdateCrmTask = (taskId: string, updates: Partial<CrmTask>) => {
    setCrmTasks((prev) => (prev || []).map(t => t.id === taskId ? { ...t, ...updates } : t));
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

  const activeTemplates = permissionTemplates.length > 0 ? permissionTemplates : INITIAL_PERMISSION_TEMPLATES;
  const activeStages = stages && stages.length > 0 ? stages : INITIAL_STAGES;
  const activeCustomFields = customFields && customFields.length > 0 ? customFields : INITIAL_CUSTOM_FIELDS;

  // Real-World Authentication & Session State
  const [currentUser, setCurrentUser] = useState<Agent | null>(() => {
    const stored = localStorage.getItem('pixbe_auth_user');
    if (stored) {
      try {
        return JSON.parse(stored) as Agent;
      } catch (e) {}
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  useEffect(() => {
    seedDatabase();
    verifyCurrentSession().then((authenticatedUser) => {
      if (authenticatedUser) {
        setIsAuthenticated(true);
        setCurrentUser(authenticatedUser);
        setActiveAgentId(authenticatedUser.id);
      }
    });
    fetch('/api/field-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.fields) && data.fields.length > 0) {
          setCustomFields(data.fields);
        }
      })
      .catch((err) => console.warn('Field settings DB fetch notice:', err));
  }, []);

  const handleSaveFieldsToDb = (updatedFields: CustomFieldDef[]) => {
    setCustomFields(updatedFields);
    fetch('/api/field-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    }).catch((err) => console.warn('Field settings DB save notice:', err));
  };

  const handleLoginSuccess = (agent: Agent) => {
    setCurrentUser(agent);
    setActiveAgentId(agent.id);
    localStorage.setItem('pixbe_auth_user', JSON.stringify(agent));
    setIsLoggingIn(true);
  };

  const handleLogout = async () => {
    await logoutWithApi();
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('pixbe_auth_user');
    showToast('Logged out of workspace.');
  };

  const handleSelectAgent = (agentId: string) => {
    const targetAgent = agents.find((a) => a.id === agentId) || INITIAL_AGENTS.find((a) => a.id === agentId);
    if (targetAgent) {
      setCurrentUser(targetAgent);
      setActiveAgentId(targetAgent.id);
      localStorage.setItem('pixbe_auth_user', JSON.stringify(targetAgent));
      showToast(`Switched active user to ${targetAgent.name} (${isAgentAdmin(targetAgent) ? 'Admin' : 'Employee'})`);
    } else {
      setActiveAgentId(agentId);
    }
  };

  // Modals & Overlay Drawers State
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [voiceBotLead, setVoiceBotLead] = useState<Lead | null>(null);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState<boolean>(false);
  const [isPowerDialerQueueOpen, setIsPowerDialerQueueOpen] = useState<boolean>(false);
  const [isPowerDialerChoiceModalOpen, setIsPowerDialerChoiceModalOpen] = useState<boolean>(false);

  // Toast alert banner state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const activeAgentsList = agents && agents.length > 0 ? agents : (currentUser ? [currentUser] : INITIAL_AGENTS);
  const activeAgent = currentUser || activeAgentsList.find((a) => a.id === activeAgentId) || activeAgentsList[0];
  const activeAgentRights = getAgentPermissionRights(activeAgent, activeTemplates);
  const isAdmin = isAgentAdmin(activeAgent);
  const activeSupportEmail = workspaceEmail?.[0]?.email || activeAgent?.email || currentUser?.email || 'admin@company.com';
  const activeCurrency = workspaceCurrency?.[0]?.code || 'INR';

  // Strict Database Agents Scoping: Use live agents from database (or active logged in admin user)
  const visibleAgents = activeAgentsList;

  const defaultOwnerId = activeAgent?.id || visibleAgents[0]?.id || 'agent-admin';
  const defaultOwnerName = activeAgent?.name || visibleAgents[0]?.name || 'Madhava sai nagendra';

  // Automatically assign any unassigned leads to the active logged in user that created them & guarantee default status is Fresh
  const sanitizedLeads = useMemo(() => {
    return leads.map((l) => {
      let updated = l;
      if (!l.ownerAgentName || l.ownerAgentName === 'Unassigned' || !l.ownerAgentId) {
        updated = {
          ...updated,
          ownerAgentId: defaultOwnerId,
          ownerAgentName: defaultOwnerName,
        };
      }
      if (!updated.status) {
        updated = {
          ...updated,
          status: 'Fresh',
        };
      }
      return updated;
    });
  }, [leads, defaultOwnerId, defaultOwnerName]);

  const companyLeads = currentUser?.tenantId 
    ? sanitizedLeads.filter((l) => l.tenantId === currentUser.tenantId)
    : sanitizedLeads;

  // Scoped Lead list based on role: Admins see ALL company leads, Employees see ONLY assigned leads
  const visibleLeads = isAdmin
    ? companyLeads
    : companyLeads.filter((l) => l.ownerAgentId === activeAgent.id || l.ownerAgentName === activeAgent.name || (activeAgent.email && l.email === activeAgent.email));

  const handleAddAgent = (newAgent: Agent) => {
    const activeCompanyName = companyName || currentUser?.companyName || 'ARCLE Real Estate & Sales';
    const agentWithTenant: Agent = {
      ...newAgent,
      tenantId: currentUser?.tenantId || 'tenant-default',
      companyName: activeCompanyName,
    };
    setAgents((prev) => [agentWithTenant, ...(prev || [])]);
    showToast(`User account created for ${activeCompanyName}: ${newAgent.name} (${newAgent.role})`);
  };

  const handleRemoveAgent = (agentId: string) => {
    const targetAgent = agents.find((a) => a.id === agentId);
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
    showToast(`Removed user account: ${targetAgent?.name || agentId}`);
  };

  const handleToggleAdminPower = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          const nextIsAdmin = !isAgentAdmin(a);
          const nextRole = nextIsAdmin ? 'Admin' : 'Counselor';
          showToast(`${nextIsAdmin ? 'Granted Admin powers to' : 'Revoked Admin powers from'} ${a.name}`);
          return { ...a, isAdmin: nextIsAdmin, role: nextRole };
        }
        return a;
      })
    );
  };

  const handleUpdateAgentRole = (agentId: string, newRole: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, role: newRole } : a))
    );
    showToast(`Updated user role designation to: ${newRole}`);
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === updatedAgent.id ? { ...a, ...updatedAgent } : a))
    );
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

  // 1. Handlers for Leads
  const handleAddNewLead = () => {
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: 'Ananya Deshmukh',
      phone: '+91 98765 00112',
      email: 'ananya@puneventures.in',
      company: 'Pune Ventures Pvt Ltd',
      city: 'Pune',
      state: 'Maharashtra',
      source: 'Facebook Ads',
      status: 'New Lead',
      pipelineStageId: 'stage-1',
      dealValue: 0,
      aiScore: 88,
      aiRating: 'Hot',
      aiReasoning: 'High engagement on Facebook ad for 3BHK penthouse. Immediate buy intent.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerAgentId: activeAgent.id,
      ownerAgentName: activeAgent.name,
      tenantId: currentUser?.tenantId,
      customFields: {},
      tags: ['Facebook Ads', 'High Value'],
      notes: ''
    };

    setLeads((prev) => [newLead, ...prev]);
    showToast(`New Lead Captured: ${newLead.name} via ${newLead.source}`);
  };

  const handleImportCsv = (importedLeads: Partial<Lead>[]) => {
    const formatted: Lead[] = importedLeads.map((imp, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      name: imp.name || 'Bulk Lead',
      phone: imp.phone || '+91 90000 00000',
      email: imp.email || '',
      company: imp.company || 'Inbound Company',
      city: imp.city || 'Mumbai',
      state: 'Maharashtra',
      source: imp.source || 'Manual / Bulk CSV',
      status: 'New Lead',
      pipelineStageId: 'stage-1',
      dealValue: imp.dealValue || 0,
      aiScore: 75,
      aiRating: 'Warm',
      aiReasoning: 'Bulk CSV imported lead file.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerAgentId: activeAgent.id,
      ownerAgentName: activeAgent.name,
      customFields: {},
      tags: ['Bulk CSV'],
      notes: ''
    }));

    setLeads((prev) => [...formatted, ...prev]);
    showToast(`Successfully imported ${formatted.length} contacts from CSV!`);
  };

  const handleMergeLeads = (primaryId: string, duplicateId: string) => {
    const primary = leads.find((l) => l.id === primaryId);
    if (!primary) return;

    setLeads((prev) => prev.filter((l) => l.id !== duplicateId));
    showToast(`Merged duplicate lead into ${primary.name}`);
  };

  const handleAddCustomField = (field: CustomFieldDef) => {
    setCustomFields((prev) => [...prev, field]);
    showToast(`Custom lead field '${field.label}' saved!`);
  };

  // Automatic Offline Conversion Dispatch Helper
  const triggerConversionDispatch = async (leadId: string, stage: LeadStatus, leadData?: Lead) => {
    try {
      const targetLead = leadData || leads.find((l) => l.id === leadId);
      if (!targetLead) return;
      
      const res = await fetch('/api/conversions/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    if (detailLead?.id === updated.id) setDetailLead(updated);
    
    if (stageChanged) {
      triggerConversionDispatch(updated.id, updated.status, updated);
    }
  };

  const handlePartialUpdateLead = (leadId: string, updates: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l)));
    if (detailLead?.id === leadId) setDetailLead((prev) => prev ? { ...prev, ...updates } : null);
    showToast('Lead follow-up / details updated');
    
    if (updates.status) {
      triggerConversionDispatch(leadId, updates.status);
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
    showToast('Lead deleted successfully');
  };

  const handleClearAllLeads = () => {
    setLeads([]);
    clearAllLeadsFromFirestore();
    showToast('All mock leads cleared! CRM is now clean and ready for real Meta Leads.');
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

    // Update agent stats
    setAgents((prev) => prev.map((a) => a.id === activeAgent.id ? { ...a, totalCallsToday: a.totalCallsToday + 1 } : a));
    showToast(`Call log saved for ${newCall.leadName}`);
  };

  const handleUpdateCallRecord = (callId: string, updates: Partial<CallRecord>) => {
    setCallRecords((prev) => prev.map((c) => (c.id === callId ? { ...c, ...updates, assigneeUpdatedAt: new Date().toISOString() } : c)));
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
    showToast('WhatsApp message delivered!');
  };

  // 4. Simulate Real-Time Webhook Lead Push (IndiaMart, JustDial, 99acres)
  const handlePushTestLead = async (source: string = 'IndiaMart') => {
    const sources = ['IndiaMart', 'JustDial', '99acres', 'Facebook Ads', 'Google Ads', 'Sulekha'];
    const chosenSource = sources.includes(source) ? source : sources[Math.floor(Math.random() * sources.length)];
    
    showToast(`🔄 Pushing simulated webhook from ${chosenSource}...`);
    
    try {
      const res = await fetch('/api/webhooks/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  if (!isAuthenticated) {
    if (authScreen === 'signup') {
      return (
        <SignUpView
          onSignUpSuccess={(registeredUser) => {
            handleLoginSuccess(registeredUser);
            showToast(`Company workspace provisioned for ${registeredUser.companyName || 'your account'}!`);
          }}
          onSwitchToLogin={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <LoginView
        agents={agents.length > 0 ? agents : INITIAL_AGENTS}
        onLogin={handleLoginSuccess}
        onSwitchToSignUp={() => setAuthScreen('signup')}
      />
    );
  }

  return (
    <StagesContext.Provider value={activeStages}>
    <div className="min-h-screen glass-mesh-bg text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 glass-card text-slate-800 px-4 py-2.5 rounded-xl text-xs font-sans font-semibold flex items-center">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeAgent={activeAgent}
        agents={agents}
        companyName={companyName || 'ARCLE Real Estate & Sales'}
        onSelectAgent={handleSelectAgent}
        onOpenLeadModal={() => setCurrentView('add_lead')}
        onAddNewLead={() => setCurrentView('add_lead')}
        onPushTestLead={() => handlePushTestLead('IndiaMart')}
        onOpenVoiceBot={() => setVoiceBotLead(leads[0])}
        onOpenPowerDialer={() => setIsPowerDialerChoiceModalOpen(true)}
        onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        pendingFollowUpsCount={leads.filter((l) => l.followUpAt || l.status === 'Follow Up').length}
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
      <div className="flex flex-1 overflow-hidden">
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
          unassignedLeadsCount={leads.filter((l) => !l.ownerAgentId).length}
          missedCallsCount={callRecords.filter((c) => c.type === 'missed').length}
          globalSavedFilters={globalSavedFilters}
          activeFilterId={activeFilterId}
          setActiveFilterId={setActiveFilterId}
          isAdmin={isAdmin}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto bg-transparent p-3 md:p-5 pb-20 md:pb-5 ios-scroll">
          {currentView === 'add_lead' && (
            <AddLeadView
              leads={leads}
              agents={agents}
              customFields={customFields}
              activeAgent={activeAgent}
              onSaveLead={(newLead) => {
                setLeads((prev) => [newLead, ...prev]);
                if (newLead.whatsappOptIn) {
                  const autoMsg: WhatsAppMessage = {
                    id: `msg-${Date.now()}`,
                    leadId: newLead.id,
                    direction: 'outbound',
                    channel: 'whatsapp',
                    content: `Hi ${newLead.name}, thank you for contacting us! Our representative ${newLead.ownerAgentName || 'team'} will assist you shortly regarding your inquiry.`,
                    timestamp: new Date().toISOString(),
                    status: 'delivered'
                  };
                  setMessages((prev) => [...prev, autoMsg]);

                  const autoAct: ActivityLog = {
                    id: `act-${Date.now()}`,
                    leadId: newLead.id,
                    agentId: activeAgent.id,
                    agentName: activeAgent.name,
                    type: 'whatsapp',
                    title: 'Automated WhatsApp Intro Dispatched',
                    description: `Automated welcome introduction message dispatched to ${newLead.phone} via WhatsApp.`,
                    timestamp: new Date().toISOString()
                  };
                  setActivities((prev) => [autoAct, ...prev]);
                  showToast(`New Lead Saved & Automated WhatsApp Intro Message Dispatched to ${newLead.name}!`);
                } else {
                  showToast(`New Lead Ingested: ${newLead.name}`);
                }
                setCurrentView('leads');
              }}
              onSaveAndCall={(newLead) => {
                setLeads((prev) => [newLead, ...prev]);
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
                setCurrentView('leads');
                window.location.href = `tel:${newLead.phone}`;
              }}
              onImportBulkLeads={(bulkLeads) => {
                handleImportCsv(bulkLeads);
                setCurrentView('leads');
              }}
              onCancel={() => setCurrentView('leads')}
              onNavigateToTab={(tab) => setCurrentView(tab)}
            />
          )}

          {currentView === 'campaigns' && (
            <CampaignsView
              leads={leads}
              agents={agents}
              initialCampaignHandle={selectedCampaignHandle}
              onOpenLeadDetail={(lead) => setDetailLead(lead)}
              onUpdateLead={handleUpdateLead}
            />
          )}

          {currentView === 'dashboard' && (
            activeAgentRights.dashboardView ? (
              <DashboardView
                leads={visibleLeads}
                agents={visibleAgents}
                stages={activeStages}
                hourlyMetrics={HOURLY_METRICS}
                activeAgent={activeAgent}
                customFields={activeCustomFields}
                currency={activeCurrency}
                onOpenLeadDetail={(lead) => setDetailLead(lead)}
                onNavigateToTab={(tab) => setCurrentView(tab)}
                onDeleteLead={handleDeleteLead}
                onUpdateLead={handlePartialUpdateLead}
              />
            ) : renderAccessRestricted('Executive Dashboard')
          )}

          {currentView === 'pipeline' && (
            <PipelineView
              leads={visibleLeads}
              stages={activeStages}
              customFields={activeCustomFields}
              currency={activeCurrency}
              onOpenLeadDetail={(lead) => setDetailLead(lead)}
              onUpdateLeadStage={(leadId, newStageStatus) => {
                setLeads((prev) =>
                  prev.map((l) => (l.id === leadId ? { ...l, status: newStageStatus, updatedAt: 'Just Now' } : l))
                );
                showToast(`Updated lead stage to ${newStageStatus}`);
              }}
              onUpdateStages={(updatedStages) => {
                setStages(updatedStages);
                showToast('Pipeline stages updated!');
              }}
              onUpdateLead={handlePartialUpdateLead}
            />
          )}

          {currentView === 'leads' && (
            <LeadsView
              leads={visibleLeads}
              agents={visibleAgents}
              customFields={activeCustomFields}
              activeAgent={activeAgent}
              currency={activeCurrency}
              onOpenLeadDetail={(lead) => setDetailLead(lead)}
              onAddNewLead={handleAddNewLead}
              onImportCsv={handleImportCsv}
              onMergeLeads={handleMergeLeads}
              onAddCustomField={handleAddCustomField}
              onPushTestLead={handlePushTestLead}
              onDeleteLead={handleDeleteLead}
              onClearAllLeads={handleClearAllLeads}
              onUpdateLead={handlePartialUpdateLead}
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
              callRecords={callRecords}
              activeAgent={activeAgent}
              onUpdateLead={handlePartialUpdateLead}
              onOpenLeadDetail={(lead) => setDetailLead(lead)}
              onCallLead={(lead) => { window.location.href = `tel:${lead.phone}`; }}
              onSendMessage={handleSendMessage}
            />
          )}

          {currentView === 'tasks' && (
            <TasksView
              agents={visibleAgents}
              activeAgent={activeAgent}
              tasks={crmTasks || []}
              currency={activeCurrency}
              onCreateTask={handleCreateCrmTask}
              onDeleteTask={handleDeleteCrmTask}
              onUpdateTaskStatus={handleUpdateCrmTaskStatus}
              onUpdateTask={handleUpdateCrmTask}
            />
          )}

          {currentView === 'inbox' && (
            <OmnichannelInboxView
              leads={visibleLeads}
              messages={messages}
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
                onAddTemplate={(tmpl) => setTemplates((prev) => [tmpl, ...prev])}
                onCreateCampaign={(camp) => setCampaigns((prev) => [camp, ...prev])}
              />
            ) : renderAccessRestricted('WhatsApp CRM & Messaging Templates')
          )}

          {currentView === 'workflows' && (
            activeAgentRights.automations ? (
              <WorkflowsView
                workflows={workflows}
                initialSubTab={automationsSubTab}
                onToggleWorkflow={(id) => setWorkflows((prev) => prev.map((w) => w.id === id ? { ...w, isActive: !w.isActive } : w))}
                onAddWorkflow={(wf) => setWorkflows((prev) => [wf, ...prev])}
                onShowToast={(msg) => showToast(msg)}
              />
            ) : renderAccessRestricted('AI Automations & Workflows')
          )}

          {currentView === 'calling_logs' && (
            <CallingLogsView callRecords={callRecords} onUpdateCallRecord={handleUpdateCallRecord} />
          )}

          {currentView === 'reports' && (
            activeAgentRights.reports ? (
              <ReportsView
                initialSubTab={reportsSubTab}
                callRecords={callRecords}
                agents={agents}
                leads={visibleLeads}
                activities={activities}
                onOpenLeadDetail={(lead) => setDetailLead(lead)}
                onUpdateCallRecord={handleUpdateCallRecord}
              />
            ) : renderAccessRestricted('Performance Reports & Analytics')
          )}

          {currentView === 'analytics' && (
            <AnalyticsView leads={visibleLeads} hourlyMetrics={HOURLY_METRICS} />
          )}

          {currentView === 'team' && (
            <TeamView
              agents={agents}
              activeAgent={activeAgent}
              onToggleAgentStatus={(id, st) => setAgents((prev) => prev.map((a) => a.id === id ? { ...a, status: st } : a))}
              onAddAgent={handleAddAgent}
              onRemoveAgent={handleRemoveAgent}
              onToggleAdminPower={handleToggleAdminPower}
              onUpdateAgentRole={handleUpdateAgentRole}
              onUpdateAgent={handleUpdateAgent}
            />
          )}

          {currentView === 'marketing' && (
            <MarketingView onSimulateWebhookLead={(src) => handlePushTestLead(src)} />
          )}

          {currentView === 'campaigns' && (
            <CampaignsView
              leads={visibleLeads}
              agents={agents}
              initialCampaignHandle={selectedCampaignHandle}
              onOpenLeadDetail={(lead) => setDetailLead(lead)}
              onUpdateLead={handlePartialUpdateLead}
              onNavigateToTab={(tab, subTab) => {
                setCurrentView(tab);
                if (tab === 'settings' && subTab) {
                  setSettingsSubTab(subTab as any);
                }
              }}
            />
          )}

          {currentView === 'integrations' && (
            isAdmin ? (
              <IntegrationsView 
                onNavigateToCampaign={(handle) => {
                  setSelectedCampaignHandle(handle);
                  setCurrentView('campaigns');
                }}
              />
            ) : renderAccessRestricted('Integrations & Webhook Connections (Admin Only)')
          )}

          {currentView === 'docs_sign' && (
            <DocsAndSignView leads={leads} />
          )}

          {currentView === 'fields' && (
            <FieldsSettingsView
              customFields={activeCustomFields}
              activeAgent={activeAgent}
              onUpdateFields={(updatedFields) => {
                handleSaveFieldsToDb(updatedFields);
                showToast('Custom fields database updated successfully!');
              }}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView 
              companyName={companyName}
              onUpdateCompanyName={(newName) => {
                setWorkspaceProfile([{ id: 'default_workspace', name: newName }]);
              }}
              supportEmail={activeSupportEmail}
              onUpdateSupportEmail={(newEmail) => {
                setWorkspaceEmail([{ id: 'default_email', email: newEmail }]);
              }}
              currency={activeCurrency}
              onUpdateCurrency={(newCurrency) => {
                setWorkspaceCurrency([{ id: 'default_currency', code: newCurrency }]);
                showToast(`Workspace currency updated to ${newCurrency}`);
              }}
              activeAgent={activeAgent}
              stages={activeStages}
              onUpdateStages={(updatedStages) => {
                setStages(updatedStages);
              }}
              agents={agents}
              onUpdateAgents={(updatedAgents) => {
                setAgents(updatedAgents);
              }}
              customFields={activeCustomFields}
              onUpdateFields={(updatedFields) => {
                handleSaveFieldsToDb(updatedFields);
              }}
              permissionTemplates={activeTemplates}
              onUpdatePermissionTemplates={(updatedTemplates) => {
                setPermissionTemplates(updatedTemplates);
                showToast('Permission templates updated successfully!');
              }}
              initialTab={settingsSubTab}
              onShowToast={(msg) => showToast(msg)} 
            />
          )}
        </main>
      </div>

      {/* MODAL 1: Lead Details Drawer */}
      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          allLeads={leads}
          agents={agents}
          activities={activities}
          messages={messages}
          callRecords={callRecords}
          onClose={() => setDetailLead(null)}
          onSelectLead={(nextLead) => setDetailLead(nextLead)}
          onUpdateLead={handleUpdateLead}
          onAddActivity={(act) => setActivities((prev) => [{
            id: `act-${Date.now()}`,
            leadId: detailLead.id,
            agentId: activeAgent.id,
            agentName: activeAgent.name,
            type: act.type || 'note',
            title: act.title || 'Note',
            description: act.description || '',
            timestamp: new Date().toISOString()
          }, ...prev])}
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
          leads={leads}
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
        onSelectLead={(lead) => setDetailLead(lead)}
        onNavigate={(view) => setCurrentView(view)}
        onAddNewLead={() => setCurrentView('add_lead')}
        onOpenPowerDialer={() => setIsPowerDialerQueueOpen(true)}
        onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
        onOpenVoiceBot={() => setVoiceBotLead(leads[0])}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
      />

      {/* MODAL 5: AI Sales Copilot & Objection Buster (Cmd + J) */}
      <AiCopilotModal
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
        lead={detailLead || leads[0]}
        leads={leads}
        activeAgent={activeAgent}
        onSendMessage={handleSendMessage}
        onOpenLeadDetail={(lead) => setDetailLead(lead)}
      />

      {/* MODAL 6: Power Dialer Queue Modal */}
      <PowerDialerQueueModal
        isOpen={isPowerDialerQueueOpen}
        onClose={() => setIsPowerDialerQueueOpen(false)}
        leads={visibleLeads}
        activeAgent={activeAgent}
        currency={activeCurrency}
        onSaveCallLog={handlePowerDialerSaveCallLog}
        onSendMessage={handleSendMessage}
        onUpdateLeadStatus={(leadId, status) => {
          setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status, updatedAt: new Date().toISOString() } : l));
        }}
      />

      {/* MODAL: Choose Power Dialer Mode (Queue vs Lead Directory) */}
      {isPowerDialerChoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans font-normal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-sans text-slate-900 tracking-tight">Choose Power Dialer Mode</h3>
              </div>
              <button 
                onClick={() => setIsPowerDialerChoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Select how you would like to initiate your outbound telecalling session:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: Power Dialer Queue */}
              <button
                onClick={() => {
                  setIsPowerDialerChoiceModalOpen(false);
                  setIsPowerDialerQueueOpen(true);
                }}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-600 hover:ring-2 hover:ring-indigo-100 transition-all text-left space-y-2 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold font-sans text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Power Dialer Queue
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Sequentially dial active leads in your automated queue with AI teleprompter assistance.
                  </p>
                </div>
              </button>

              {/* Option 2: Lead Directory */}
              <button
                onClick={() => {
                  setIsPowerDialerChoiceModalOpen(false);
                  setCurrentView('leads');
                }}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-600 hover:ring-2 hover:ring-emerald-100 transition-all text-left space-y-2 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold font-sans text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Lead Directory
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Browse, filter, and manually trigger calls directly from the master lead table grid.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsPowerDialerChoiceModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
        pendingFollowUpsCount={leads.filter((l) => l.followUpAt || l.status === 'Follow Up').length}
        activeAgent={activeAgent}
        agents={agents}
        onSelectAgent={(agentId) => setActiveAgentId(agentId)}
        onOpenAddLeadModal={handleAddNewLead}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        onOpenPowerDialer={() => setIsPowerDialerChoiceModalOpen(true)}
        onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
      />
    </div>
    </StagesContext.Provider>
  );
}

export default App;
