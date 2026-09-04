import React, { useState, useEffect } from 'react';
import { toast } from '../context/ToastContext';
import { EmptyState } from '../components/EmptyState';
import { WorkflowBuilderPage } from '../features/workflow-builder';
import { 
  getWorkflowsFromDb, 
  fetchWorkflowsFromApi,
  saveWorkflowToDb, 
  deleteWorkflowFromDb, 
  toggleWorkflowStatusInDb,
  WorkflowRecord 
} from '../utils/workflowStorage';
import { 
  GitBranch, 
  RotateCw, 
  Plus, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  FileText, 
  Code, 
  Webhook, 
  Info, 
  Search, 
  ChevronDown,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  LayoutGrid,
  Layers,
  Globe,
  Phone,
  MessageSquare,
  ShoppingBag,
  CreditCard,
  Database,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { WorkflowRule } from '../types';

export type AutomationsSubTab = 'workflows' | 'schedules' | 'salesform' | 'api_templates' | 'webhooks' | 'apps';

interface WorkflowsViewProps {
  workflows?: WorkflowRule[];
  onToggleWorkflow?: (id: string) => void;
  onAddWorkflow?: (rule: WorkflowRule) => void;
  initialSubTab?: AutomationsSubTab;
  onOpenWorkflowBuilder?: (workflow?: any) => void;
  onShowToast?: (message: string) => void;
}

export const WorkflowsPage: React.FC<WorkflowsViewProps> = ({
  workflows = [],
  onToggleWorkflow,
  onAddWorkflow,
  initialSubTab = 'workflows',
  onOpenWorkflowBuilder,
  onShowToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AutomationsSubTab>(initialSubTab);

  // Synchronize activeSubTab whenever initialSubTab prop changes from sidebar
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [timeRange, setTimeRange] = useState<'All' | '24h' | '7d' | '30d'>('24h');
  
  // Tab states (Published vs Draft)
  const [workflowsTab, setWorkflowsTab] = useState<'Published' | 'Draft'>('Published');
  const [scheduleSubTab, setScheduleSubTab] = useState<'Published' | 'Draft'>('Published');
  const [salesformSubTab, setSalesformSubTab] = useState<'Published' | 'Draft'>('Published');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [eventTypeFilter, setEventTypeFilter] = useState('Select Event Types');
  const [appsCategory, setAppsCategory] = useState<'All' | 'Advertising' | 'Messaging' | 'E-Commerce' | 'Forms'>('All');

  // Visual Workflow Builder state
  const [isVisualBuilderOpen, setIsVisualBuilderOpen] = useState(false);
  const [selectedWorkflowForBuilder, setSelectedWorkflowForBuilder] = useState<any>(null);

  // Persistent workflows list from Database
  const [workflowsList, setWorkflowsList] = useState<WorkflowRecord[]>(() => getWorkflowsFromDb());

  // Reload workflows when tab becomes active or builder closes
  useEffect(() => {
    setWorkflowsList(getWorkflowsFromDb());
    fetchWorkflowsFromApi().then((fresh) => {
      if (Array.isArray(fresh) && fresh.length > 0) {
        setWorkflowsList(fresh);
      }
    }).catch(() => {});
  }, [activeSubTab, isVisualBuilderOpen]);

  const handleOpenBuilder = (workflowItem?: any) => {
    if (onOpenWorkflowBuilder) {
      onOpenWorkflowBuilder(workflowItem);
    } else {
      setSelectedWorkflowForBuilder(workflowItem || null);
      setIsVisualBuilderOpen(true);
    }
  };

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalTrigger, setModalTrigger] = useState('Lead Creation');
  const [modalEndpoint, setModalEndpoint] = useState('https://graph.facebook.com/v25.0/2...');

  // Live Data for Schedules
  const [schedules, setSchedules] = useState<any[]>([]);

  // Live Data for Salesforms
  const [salesforms, setSalesforms] = useState<any[]>([
    {
      id: 'sf-1',
      name: 'On lead field update',
      events: 'On Status update',
      status: true,
      statusUpdatedOn: '3M ago',
      statusUpdatedBy: 'FC',
      isDraft: false
    }
  ]);

  // Live Data for API Templates
  const [apiTemplates, setApiTemplates] = useState<any[]>([
    {
      id: 'api-1',
      name: 'CAPI',
      endpoint: 'https://graph.facebook.com/v25.0/2...',
      variablesUsed: 'Facebook Lead id +4',
      workflow: 'On Lead Status Change',
      lastModified: '4M ago',
      lastModifiedBy: 'FC'
    },
    {
      id: 'api-2',
      name: 'CAPI - CTWA',
      endpoint: 'https://graph.facebook.com/v25.0/2...',
      variablesUsed: 'CTWA id +4',
      workflow: 'None',
      lastModified: '4M ago',
      lastModifiedBy: 'FC'
    }
  ]);

  // Live Data for Connected Apps
  const [appsList, setAppsList] = useState<any[]>([
    {
      id: 'app-meta',
      name: 'Meta Lead Ads',
      category: 'Advertising',
      description: 'Automatically capture leads in real-time from Facebook & Instagram Instant Forms.',
      connected: true,
      icon: 'globe',
      badge: 'Active Webhook'
    },
    {
      id: 'app-whatsapp',
      name: 'WhatsApp Business API',
      category: 'Messaging',
      description: 'Send automated welcome messages, follow-up templates, and interactive buttons.',
      connected: true,
      icon: 'message',
      badge: 'Connected'
    },
    {
      id: 'app-sheets',
      name: 'Google Sheets Sync',
      category: 'Forms',
      description: 'Two-way synchronization for incoming leads and call status reports.',
      connected: true,
      icon: 'database',
      badge: 'Live Sync'
    },
    {
      id: 'app-shopify',
      name: 'Shopify & WooCommerce',
      category: 'E-Commerce',
      description: 'Ingest checkout leads and abandoned carts automatically into dialer queues.',
      connected: false,
      icon: 'shop',
      badge: 'Available'
    },
    {
      id: 'app-razorpay',
      name: 'Razorpay & Stripe',
      category: 'E-Commerce',
      description: 'Trigger instant conversion tracking (CAPI) upon successful fee payments.',
      connected: true,
      icon: 'card',
      badge: 'Active'
    },
    {
      id: 'app-zapier',
      name: 'Zapier & Make Connectors',
      category: 'Forms',
      description: 'Connect over 5,000+ business applications with inbound & outbound webhooks.',
      connected: true,
      icon: 'zap',
      badge: 'Integrated'
    }
  ]);

  // Handle Toast
  const triggerToast = (msg: string) => {
    if (onShowToast) onShowToast(msg);
    else toast.success(msg);
  };

  // Handle duplicate row
  const handleDuplicate = (type: string, name: string) => {
    if (type === 'Workflow') {
      const target = workflowsList.find((w) => w.name === name);
      if (target) {
        const dup: any = {
          ...target,
          id: `wf-${Date.now()}`,
          name: `${target.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updated = saveWorkflowToDb(dup);
        setWorkflowsList(updated);
        triggerToast(`Duplicated workflow: "${dup.name}"`);
        return;
      }
    }
    triggerToast(`Duplicated ${type}: "${name}"`);
  };

  // Handle delete row
  const handleDelete = (id: string, name: string) => {
    if (activeSubTab === 'workflows') {
      const updated = deleteWorkflowFromDb(id);
      setWorkflowsList(updated);
    } else if (activeSubTab === 'schedules') {
      setSchedules(prev => prev.filter(s => s.id !== id));
    } else if (activeSubTab === 'salesform') {
      setSalesforms(prev => prev.filter(sf => sf.id !== id));
    } else if (activeSubTab === 'api_templates') {
      setApiTemplates(prev => prev.filter(a => a.id !== id));
    }
    triggerToast(`Removed "${name}"`);
  };

  if (isVisualBuilderOpen) {
    return (
      <WorkflowBuilderPage
        initialWorkflow={selectedWorkflowForBuilder}
        onBack={() => {
          setSelectedWorkflowForBuilder(null);
          setIsVisualBuilderOpen(false);
          setWorkflowsList(getWorkflowsFromDb());
        }}
        onSave={(savedWorkflow) => {
          const updated = saveWorkflowToDb(savedWorkflow);
          setWorkflowsList(updated);
          triggerToast(`Workflow "${savedWorkflow.name}" saved to database!`);
        }}
      />
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-5 max-w-7xl mx-auto text-slate-900 font-sans">
      {/* ========================================================================= */}
      {/* 1. WORKFLOWS VIEW (Exact match to Screenshot 1)                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'workflows' && (
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <GitBranch className="w-5 h-5 text-[#3a2088]" />
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                  <span>Workflows</span>
                  <button 
                    onClick={() => {
                      triggerToast('Refreshing workflows from database...');
                      fetchWorkflowsFromApi().then((fresh) => {
                        setWorkflowsList(fresh);
                        triggerToast('Workflows up to date');
                      });
                    }}
                    className="text-slate-400 hover:text-[#3a2088] transition-colors p-0.5 cursor-pointer"
                    title="Refresh from DB"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                To execute complex automations with ease{' '}
                <button 
                  type="button"
                  onClick={() => toast.info('Workflows automatically route incoming leads, execute webhook triggers, and schedule calls.', 'Automations Guide')} 
                  className="text-[#3a2088] hover:underline font-semibold cursor-pointer"
                >
                  Learn More
                </button>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => handleOpenBuilder()}
                className="px-4 py-2 rounded-xl bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                <span>Create Workflow +</span>
              </button>
            </div>
          </div>

          {/* Time Filter Pills Row (All | 24h | 7d | 30d) */}
          <div className="flex justify-end">
            <div className="bg-white border border-slate-200/90 rounded-xl p-1 flex items-center space-x-1 text-xs font-medium text-slate-600 shadow-2xs">
              {(['All', '24h', '7d', '30d'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    timeRange === t ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 5 Metric Summary Cards (Total Runs, Success, Failed, Sleeping, Waiting for Reply) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Total Runs</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-900">462</p>
              <p className="text-[11px] text-slate-400 font-mono">last {timeRange}</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Success</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-emerald-600">100%</p>
              <p className="text-[11px] text-slate-400 font-mono">last {timeRange}</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Failed</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-[#DC2626]">0</p>
              <p className="text-[11px] text-slate-400 font-mono">last {timeRange}</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Sleeping</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-900">0</p>
              <p className="text-[11px] text-slate-400 font-mono">last {timeRange}</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Waiting for Reply</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-900">0</p>
              <p className="text-[11px] text-slate-400 font-mono">last {timeRange}</p>
            </div>
          </div>

          {/* Published vs Draft Tabs */}
          <div className="border-b border-slate-200 flex items-center space-x-6 text-xs font-bold pt-2">
            <button
              onClick={() => setWorkflowsTab('Published')}
              className={`pb-2.5 transition-all cursor-pointer ${
                workflowsTab === 'Published'
                  ? 'text-[#3a2088] border-b-2 border-[#3a2088] font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setWorkflowsTab('Draft')}
              className={`pb-2.5 transition-all cursor-pointer ${
                workflowsTab === 'Draft'
                  ? 'text-[#3a2088] border-b-2 border-[#3a2088] font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              Draft
            </button>
          </div>

          {/* Search Bar & Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="relative sm:col-span-6">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search flowchart by Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] shadow-2xs"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#EDE9FE] border border-[#DDD6FE] text-[#3a2088] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="On">On</option>
                <option value="Off">Off</option>
                <option value="All">All</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-600 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="Select Event Types">Select Event Types</option>
                <option value="Lead Creation">Lead Creation</option>
                <option value="Lead Status Change">Lead Status Change</option>
                <option value="Call Log">Call Log</option>
              </select>
            </div>
          </div>

          {/* Pagination Subtext */}
          <div className="text-[11px] font-semibold text-slate-500">
            1 - {workflowsList.length} of {workflowsList.length}
          </div>

          {/* Workflows Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4 text-center">Events</th>
                    <th className="py-3 px-4 text-center">
                      <div className="inline-flex items-center space-x-1">
                        <span>Status</span>
                        <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">Total runs</th>
                    <th className="py-3 px-4 text-center">Last 24h runs/failures</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {workflowsList
                    .filter((w) => {
                      if (workflowsTab === 'Draft' ? !w.isDraft : w.isDraft) return false;
                      if (searchQuery.trim() && !w.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                      if (statusFilter === 'On' && !w.status) return false;
                      if (statusFilter === 'Off' && w.status) return false;
                      if (eventTypeFilter !== 'Select Event Types' && !w.event.toLowerCase().includes(eventTypeFilter.toLowerCase())) return false;
                      return true;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4">
                          <EmptyState
                            title={workflowsTab === 'Draft' ? "No Draft Workflows" : "No Active Workflows"}
                            description="Create custom automation rules to automatically assign leads, send WhatsApp messages, and schedule tasks."
                            actionLabel="Create Workflow"
                            onAction={() => handleOpenBuilder()}
                            compact
                          />
                        </td>
                      </tr>
                    ) : (
                      workflowsList
                        .filter((w) => {
                          if (workflowsTab === 'Draft' ? !w.isDraft : w.isDraft) return false;
                          if (searchQuery.trim() && !w.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                          if (statusFilter === 'On' && !w.status) return false;
                          if (statusFilter === 'Off' && w.status) return false;
                          if (eventTypeFilter !== 'Select Event Types' && !w.event.toLowerCase().includes(eventTypeFilter.toLowerCase())) return false;
                          return true;
                        })
                        .map((wf) => (
                          <tr key={wf.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleOpenBuilder(wf)}
                                className="font-bold text-slate-900 hover:text-purple-600 text-xs text-left cursor-pointer transition-colors"
                              >
                                {wf.name}
                              </button>
                              {wf.hasDraft && (
                                <div>
                                  <button
                                    onClick={() => handleOpenBuilder(wf)}
                                    className="text-[11px] text-[#3a2088] underline hover:text-[#2c186b] font-medium cursor-pointer"
                                  >
                                    (Draft in progress)
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-[#3a2088] border border-indigo-200">
                                {wf.event || (wf.nodes && wf.nodes.length > 0 ? `${wf.nodes.length} steps` : 'Lead Creation')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex flex-col items-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={wf.status} 
                                    onChange={() => {
                                      const updated = toggleWorkflowStatusInDb(wf.id);
                                      setWorkflowsList(updated);
                                      triggerToast(`Workflow "${wf.name}" toggled ${wf.status ? 'OFF' : 'ON'}`);
                                    }}
                                    className="sr-only peer" 
                                  />
                                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#3a2088]"></div>
                                </label>
                                <span className="text-[10px] text-slate-400 mt-1 font-sans">{wf.statusMeta}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">{wf.totalRuns}</td>
                            <td className="py-3.5 px-4 text-center font-bold font-mono">
                              <span className="text-slate-900">{wf.last24hRuns}</span> / <span className="text-[#DC2626]">{wf.last24hFailures}</span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button 
                                  onClick={() => handleDuplicate('Workflow', wf.name)}
                                  className="p-1.5 rounded-lg border border-slate-200/90 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                  title="Duplicate"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(wf.id, wf.name)}
                                  className="p-1.5 rounded-lg border border-slate-200/90 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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
      {/* 2. SCHEDULES VIEW (Exact match to Screenshot 2)                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'schedules' && (
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#3a2088]" />
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                  <span>Schedules</span>
                  <button 
                    onClick={() => triggerToast('Refreshing schedules...')}
                    className="text-slate-400 hover:text-[#3a2088] transition-colors p-0.5 cursor-pointer"
                    title="Refresh"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                To automatically keep in touch with your leads{' '}
                <button 
                  type="button"
                  onClick={() => toast.info('Schedules trigger automatic messages and drip campaigns based on custom time delays.', 'Schedules Guide')} 
                  className="text-[#3a2088] hover:underline font-semibold cursor-pointer"
                >
                  Learn More
                </button>
              </p>
            </div>

            <button
              onClick={() => handleOpenBuilder()}
              className="px-4 py-2 rounded-xl bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>Create New Schedule +</span>
            </button>
          </div>

          {/* Time Filter Pills Row */}
          <div className="flex justify-end">
            <div className="bg-white border border-slate-200/90 rounded-xl p-1 flex items-center space-x-1 text-xs font-medium text-slate-600 shadow-2xs">
              {(['All', '24h', '7d', '30d'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    timeRange === t ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Metric Summary Cards (Total Runs, Success, Failed) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Total Runs</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-900">0</p>
              <p className="text-[11px] text-slate-400 font-mono">last {timeRange}</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Success</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-900">0%</p>
              <p className="text-[11px] text-slate-400 font-mono">last {timeRange}</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Failed</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-[#DC2626]">0</p>
              <p className="text-[11px] text-slate-400 font-mono">last {timeRange}</p>
            </div>
          </div>

          {/* Published vs Draft Tabs */}
          <div className="border-b border-slate-200 flex items-center space-x-6 text-xs font-bold pt-2">
            <button
              onClick={() => setScheduleSubTab('Published')}
              className={`pb-2.5 transition-all cursor-pointer ${
                scheduleSubTab === 'Published'
                  ? 'text-[#3a2088] border-b-2 border-[#3a2088] font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setScheduleSubTab('Draft')}
              className={`pb-2.5 transition-all cursor-pointer ${
                scheduleSubTab === 'Draft'
                  ? 'text-[#3a2088] border-b-2 border-[#3a2088] font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              Draft
            </button>
          </div>

          {/* Search Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="relative sm:col-span-6">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search flowchart by Name"
                className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] shadow-2xs"
              />
            </div>

            <div className="sm:col-span-3">
              <select className="w-full bg-[#EDE9FE] border border-[#DDD6FE] text-[#3a2088] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none cursor-pointer">
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-600 focus:outline-none cursor-pointer shadow-2xs">
                <option value="Select Event Types">Select Event Types</option>
                <option value="Scheduled Time">Scheduled Time</option>
              </select>
            </div>
          </div>

          {/* Schedules Table with Exact "No Flowcharts Found" Empty State */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4 text-center">Events</th>
                    <th className="py-3 px-4 text-center">
                      <div className="inline-flex items-center space-x-1">
                        <span>Status</span>
                        <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">Last run</th>
                    <th className="py-3 px-4 text-center">Last run status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold text-sm">
                        No Flowcharts Found
                      </td>
                    </tr>
                  ) : (
                    schedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{sch.name}</td>
                        <td className="py-3.5 px-4 text-center">{sch.events}</td>
                        <td className="py-3.5 px-4 text-center">ON</td>
                        <td className="py-3.5 px-4 text-center">{sch.lastRun}</td>
                        <td className="py-3.5 px-4 text-center">{sch.lastRunStatus}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button onClick={() => handleDelete(sch.id, sch.name)} className="p-1 text-slate-400 hover:text-rose-600">
                            <Trash2 className="w-3.5 h-3.5" />
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
      {/* 3. WEBHOOK MANAGEMENT VIEW (Exact match to Screenshot 3)                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'webhooks' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Webhook Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Incoming Webhook Connections from External Systems
            </p>
          </div>

          {/* Central Empty State Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-10 sm:p-14 text-center space-y-4 max-w-3xl mx-auto shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200">
              <Webhook className="w-7 h-7 text-[#3a2088]" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-base font-bold text-slate-900">No webhooks yet</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect external systems like Shopify, WooCommerce, or Razorpay to automatically create leads and trigger actions in Telecrm
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={() => handleOpenBuilder()}
                className="px-5 py-2.5 rounded-xl bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-bold cursor-pointer transition-all shadow-xs inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Webhook</span>
              </button>

              <div>
                <p className="text-xs text-slate-400 mb-1">or</p>
                <button 
                  type="button"
                  onClick={() => { 
                    toast.info('Endpoint: /api/webhook/ingest • Method: POST • Headers: Content-Type: application/json • Payload: { name, phone, email, source }', 'Webhook Endpoint API Documentation', 6000); 
                  }}
                  className="text-xs font-semibold text-[#3a2088] hover:underline inline-flex items-center space-x-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View webhook documentation</span>
                </button>
              </div>
            </div>
          </div>

          {/* Webhook Getting Started Guide Card */}
          <div className="bg-purple-50/60 border border-purple-200/90 rounded-2xl p-5 space-y-3 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Webhook Getting Started Guide</h3>
              <button
                onClick={() => triggerToast('Opening webhook documentation...')}
                className="px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-[#3a2088] text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View documentation</span>
              </button>
            </div>

            <p className="text-xs text-slate-600">Follow these steps to set up your first webhook integration:</p>

            <div className="space-y-2 pt-1">
              <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-purple-100/90 text-xs">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-[#3a2088] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="font-bold text-slate-900">Create a webhook endpoint</p>
                  <p className="text-[11px] text-slate-500">Generate a unique URL to receive JSON payloads from external landing pages and forms.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-purple-100/90 text-xs">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-[#3a2088] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="font-bold text-slate-900">Map custom payload fields</p>
                  <p className="text-[11px] text-slate-500">Map fields (Name, Phone, Email, City, Course) directly to TeleCRM contact fields.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-purple-100/90 text-xs">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-[#3a2088] font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                <div>
                  <p className="font-bold text-slate-900">Auto-Dial & Assign Leads</p>
                  <p className="text-[11px] text-slate-500">Automatically push incoming leads to agent power dialers and trigger WhatsApp welcome templates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SALESFORMS VIEW (Exact match to Screenshot 4)                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'salesform' && (
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#3a2088]" />
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                  <span>Salesforms</span>
                  <button 
                    onClick={() => triggerToast('Refreshing salesforms...')}
                    className="text-slate-400 hover:text-[#3a2088] transition-colors p-0.5 cursor-pointer"
                    title="Refresh"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                To automatically fill lead form data
              </p>
            </div>

            <button
              onClick={() => handleOpenBuilder()}
              className="px-4 py-2 rounded-xl bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>Create Salesform +</span>
            </button>
          </div>

          {/* Published vs Draft Tabs */}
          <div className="border-b border-slate-200 flex items-center space-x-6 text-xs font-bold pt-2">
            <button
              onClick={() => setSalesformSubTab('Published')}
              className={`pb-2.5 transition-all cursor-pointer ${
                salesformSubTab === 'Published'
                  ? 'text-[#3a2088] border-b-2 border-[#3a2088] font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setSalesformSubTab('Draft')}
              className={`pb-2.5 transition-all cursor-pointer ${
                salesformSubTab === 'Draft'
                  ? 'text-[#3a2088] border-b-2 border-[#3a2088] font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              Draft
            </button>
          </div>

          {/* Search Bar & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="relative sm:col-span-6">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search salesform by Name"
                className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] shadow-2xs"
              />
            </div>

            <div className="sm:col-span-6">
              <select className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-600 focus:outline-none cursor-pointer shadow-2xs">
                <option value="Status">Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Salesforms Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4 text-center">Events</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">
                      <div className="inline-flex items-center space-x-1">
                        <span>Status Updated On</span>
                        <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">Status Updated by</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {salesforms.map((sf) => (
                    <tr key={sf.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#3a2088] hover:underline cursor-pointer">
                        {sf.name}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold">
                          {sf.events}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded bg-[#3a2088] text-white font-bold text-[10px] uppercase tracking-wider">
                          ON
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">{sf.statusUpdatedOn}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-[#3a2088] font-bold text-[10px] flex items-center justify-center font-mono border border-purple-200 mx-auto">
                          {sf.statusUpdatedBy}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button 
                            onClick={() => handleDuplicate('Salesform', sf.name)}
                            className="p-1.5 rounded-lg border border-slate-200/90 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(sf.id, sf.name)}
                            className="p-1.5 rounded-lg border border-slate-200/90 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
      {/* 5. API TEMPLATES VIEW (Exact match to Screenshot 5)                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'api_templates' && (
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-[#3a2088]" />
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                  <span>API Templates</span>
                  <button 
                    onClick={() => triggerToast('Refreshing API templates...')}
                    className="text-slate-400 hover:text-[#3a2088] transition-colors p-0.5 cursor-pointer"
                    title="Refresh"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Create an API template once and use it everywhere
              </p>
            </div>

            <button
              onClick={() => handleOpenBuilder()}
              className="px-4 py-2 rounded-xl bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>Create New +</span>
            </button>
          </div>

          {/* API Templates Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-3 px-4">Template Name</th>
                    <th className="py-3 px-4">Endpoint URL</th>
                    <th className="py-3 px-4 text-center">Variables Used</th>
                    <th className="py-3 px-4 text-center">Workflow</th>
                    <th className="py-3 px-4 text-center">
                      <div className="inline-flex items-center space-x-1">
                        <span>Last Modified</span>
                        <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">Last Modified By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {apiTemplates.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{tpl.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 truncate max-w-xs">{tpl.endpoint}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold">
                          {tpl.variablesUsed}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {tpl.workflow === 'None' ? (
                          <span className="text-slate-400 italic font-normal">None</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-bold border border-purple-200">
                            {tpl.workflow}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">{tpl.lastModified}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-[#3a2088] font-bold text-[10px] flex items-center justify-center font-mono border border-purple-200 mx-auto">
                          {tpl.lastModifiedBy}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => triggerToast(`Testing API endpoint for "${tpl.name}"`)}
                          className="p-1.5 rounded-lg border border-slate-200/90 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="Open Template"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
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
      {/* 6. APPS COMPONENT (Apps & Connected Integrations Marketplace)              */}
      {/* ========================================================================= */}
      {activeSubTab === 'apps' && (
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <LayoutGrid className="w-5 h-5 text-[#3a2088]" />
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                  <span>Apps & Connected Integrations</span>
                  <button 
                    onClick={() => triggerToast('Refreshing connected apps...')}
                    className="text-slate-400 hover:text-[#3a2088] transition-colors p-0.5 cursor-pointer"
                    title="Refresh"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse and connect advertising channels, CRMs, webhooks, and payment platforms
              </p>
            </div>

            <button
              onClick={() => handleOpenBuilder()}
              className="px-4 py-2 rounded-xl bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>Connect New App +</span>
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {(['All', 'Advertising', 'Messaging', 'E-Commerce', 'Forms'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setAppsCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  appsCategory === cat
                    ? 'bg-[#3a2088] text-white shadow-2xs font-bold'
                    : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat === 'All' ? 'All Apps (6)' : cat}
              </button>
            ))}
          </div>

          {/* App Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {appsList
              .filter(app => appsCategory === 'All' || app.category === appsCategory)
              .map((app) => (
                <div key={app.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-[#3a2088]/40 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-[#3a2088] flex items-center justify-center font-bold">
                        {app.icon === 'globe' && <Globe className="w-5 h-5 text-[#3a2088]" />}
                        {app.icon === 'message' && <MessageSquare className="w-5 h-5 text-[#3a2088]" />}
                        {app.icon === 'database' && <Database className="w-5 h-5 text-[#3a2088]" />}
                        {app.icon === 'shop' && <ShoppingBag className="w-5 h-5 text-[#3a2088]" />}
                        {app.icon === 'card' && <CreditCard className="w-5 h-5 text-[#3a2088]" />}
                        {app.icon === 'zap' && <Zap className="w-5 h-5 text-[#3a2088]" />}
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        app.connected 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {app.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{app.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{app.description}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">{app.category}</span>
                    <button
                      onClick={() => {
                        setAppsList(prev => prev.map(a => a.id === app.id ? { ...a, connected: !a.connected, badge: !a.connected ? 'Connected' : 'Available' } : a));
                        triggerToast(`${app.name} ${app.connected ? 'disconnected' : 'connected successfully!'}`);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        app.connected
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-[#3a2088] hover:bg-[#2c186b] text-white shadow-2xs'
                      }`}
                    >
                      {app.connected ? 'Configure' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* CREATE ITEM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-[#3a2088] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Create {activeSubTab === 'workflows' ? 'Workflow' : activeSubTab === 'schedules' ? 'Schedule' : activeSubTab === 'salesform' ? 'Salesform' : activeSubTab === 'api_templates' ? 'API Template' : activeSubTab === 'apps' ? 'App Connection' : 'Webhook'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Configure trigger and automated rule</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = modalName.trim() || `New ${activeSubTab.toUpperCase()} Flow`;
                
                if (activeSubTab === 'workflows') {
                  const newWf = {
                    id: `wf-${Date.now()}`,
                    name,
                    hasDraft: false,
                    event: modalTrigger,
                    eventIcon: modalTrigger.toLowerCase().includes('phone') ? 'phone' : modalTrigger.toLowerCase().includes('status') ? 'file' : 'globe',
                    status: true,
                    statusMeta: 'Just now by Admin',
                    totalRuns: 0,
                    last24hRuns: 0,
                    last24hFailures: 0,
                    isDraft: false
                  };
                  setWorkflowsList(prev => [newWf, ...prev]);
                  if (onAddWorkflow) {
                    onAddWorkflow({
                      id: newWf.id,
                      name,
                      description: 'Custom automation trigger',
                      triggerEvent: modalTrigger,
                      condition: 'All Leads',
                      actions: ['Auto-Assign', 'Send WhatsApp Template'],
                      isActive: true,
                      executedCount: 0
                    });
                  }
                } else if (activeSubTab === 'schedules') {
                  setSchedules(prev => [{
                    id: `sch-${Date.now()}`,
                    name,
                    events: modalTrigger,
                    status: true,
                    lastRun: 'Scheduled',
                    lastRunStatus: 'Active',
                    isDraft: false
                  }, ...prev]);
                } else if (activeSubTab === 'salesform') {
                  setSalesforms(prev => [{
                    id: `sf-${Date.now()}`,
                    name,
                    events: modalTrigger,
                    status: true,
                    statusUpdatedOn: 'Just now',
                    statusUpdatedBy: 'Admin',
                    isDraft: false
                  }, ...prev]);
                } else if (activeSubTab === 'api_templates') {
                  setApiTemplates(prev => [{
                    id: `api-${Date.now()}`,
                    name,
                    endpoint: modalEndpoint,
                    variablesUsed: 'Lead ID +4',
                    workflow: 'On Lead Creation',
                    lastModified: 'Just now',
                    lastModifiedBy: 'Admin'
                  }, ...prev]);
                }

                triggerToast(`Created "${name}" successfully!`);
                setShowCreateModal(false);
                setModalName('');
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Title *</label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="e.g., On Website Lead Instant Welcome"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#3a2088]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Trigger Event</label>
                <select
                  value={modalTrigger}
                  onChange={(e) => setModalTrigger(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#3a2088] cursor-pointer"
                >
                  <option value="Lead Creation">Lead Creation</option>
                  <option value="Lead Status Change">Lead Status Change</option>
                  <option value="On Status update">On Status update</option>
                  <option value="Lead Creation +9">Lead Creation +9</option>
                  <option value="Scheduled Time">Scheduled Time</option>
                  <option value="Webhook Inbound">Webhook Inbound</option>
                </select>
              </div>

              {activeSubTab === 'api_templates' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Endpoint URL</label>
                  <input
                    type="text"
                    value={modalEndpoint}
                    onChange={(e) => setModalEndpoint(e.target.value)}
                    placeholder="https://api.yourdomain.com/v1/lead"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#3a2088]"
                  />
                </div>
              )}

              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 text-slate-700 space-y-1 text-[11px]">
                <p className="font-bold text-[#3a2088] flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-[#3a2088] shrink-0" />
                  <span>Real-Time Execution</span>
                </p>
                <p className="text-slate-600">This flow will automatically trigger on matching lead events in real-time.</p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#3a2088] hover:bg-[#2c186b] text-white font-bold transition-all cursor-pointer shadow-xs"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export const WorkflowsView = WorkflowsPage;
export default WorkflowsPage;
