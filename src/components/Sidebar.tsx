import React, { useState } from 'react';
import { 
  Search,
  UserPlus,
  Phone,
  AtSign,
  Filter,
  Tag,
  TrendingUp,
  Bot,
  Link2,
  Headphones,
  LayoutDashboard,
  Users,
  MessageSquare,
  GitBranch,
  Calendar,
  Webhook,
  PhoneCall,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { ReportsSubTab } from './ReportsView';
import { AutomationsSubTab } from './WorkflowsView';

export type TabType = 
  | 'dashboard' 
  | 'campaigns'
  | 'add_lead'
  | 'leads' 
  | 'fields'
  | 'followups'
  | 'pipeline' 
  | 'calls' 
  | 'workflows'
  | 'reports'
  | 'whatsapp' 
  | 'inbox' 
  | 'analytics' 
  | 'marketing' 
  | 'integrations'
  | 'docs'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType, subTab?: ReportsSubTab | AutomationsSubTab) => void;
  unassignedLeadsCount: number;
  missedCallsCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenVoiceBot?: () => void;
  globalSavedFilters?: { id: string; name: string; iconType: string }[];
  activeFilterId?: string;
  setActiveFilterId?: (id: string) => void;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  unassignedLeadsCount,
  missedCallsCount = 0,
  onOpenVoiceBot,
  globalSavedFilters = [],
  activeFilterId = '',
  setActiveFilterId,
  isAdmin = false
}) => {
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isAutomationsOpen, setIsAutomationsOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Grouped Navigation matching reference layout (MAIN MENU, TOOLS, WORKSPACE)
  const menuSections = [
    {
      title: 'MAIN MENU',
      items: [
        { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
        { 
          id: 'followups' as TabType, 
          label: 'Follow-Ups & Calls', 
          icon: Phone, 
          badge: missedCallsCount > 0 ? missedCallsCount : undefined,
          badgeColor: 'bg-rose-500 text-white'
        },
        { id: 'leads' as TabType, label: 'Leads & Pipeline', icon: Users },
        { id: 'add_lead' as TabType, label: 'Add Lead', icon: UserPlus },
        { 
          id: 'inbox' as TabType, 
          label: 'Unified Inbox', 
          icon: AtSign
        },
      ]
    },
    {
      title: 'TOOLS',
      items: [
        { id: 'whatsapp' as TabType, label: 'WhatsApp CRM', icon: MessageSquare },
        { 
          id: 'workflows' as TabType, 
          label: 'AI Automations', 
          icon: Bot, 
          hasSubmenu: true,
          submenuType: 'workflows'
        },
        { 
          id: 'reports' as TabType, 
          label: 'Performance Reports', 
          icon: TrendingUp, 
          hasSubmenu: true,
          submenuType: 'reports'
        },
        ...(isAdmin ? [{ id: 'integrations' as TabType, label: 'Integrations', icon: Link2 }] : []),
      ]
    },
    {
      title: 'WORKSPACE',
      items: [
        { id: 'campaigns' as TabType, label: 'Campaigns & Tags', icon: Tag },
        { id: 'filters' as any, label: 'Saved Filters', icon: Filter, isFilterAction: true },
      ]
    }
  ];

  return (
    <aside className="w-64 glass-panel border-r border-white/60 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-3.5rem)] font-sans select-none z-20">
      
      {/* Top Search & Navigation List */}
      <div className="flex flex-col flex-1 overflow-y-auto px-3 py-3 space-y-4 ios-scroll">
        
        {/* Categorized Navigation Sections */}
        <div className="space-y-4">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {/* Section Header Text */}
              <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                {section.title}
              </div>

              {/* Section Items List */}
              <div className="space-y-0.5">
                {section.items.map((item: any) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id || (item.isFilterAction && isFiltersOpen);

                    if (item.submenuType === 'workflows') {
                      return (
                        <div key={item.id} className="space-y-0.5">
                          <button
                            onClick={() => {
                              setActiveTab('workflows', 'workflows');
                              setIsAutomationsOpen(!isAutomationsOpen);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                              activeTab === 'workflows'
                                ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200/80 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <Icon className={`w-4 h-4 ${activeTab === 'workflows' ? 'text-indigo-600' : 'text-slate-400'}`} />
                              <span>{item.label}</span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAutomationsOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Automations Collapsible Submenu */}
                          {isAutomationsOpen && (
                            <div className="pl-8 pr-1 space-y-0.5 py-1 text-xs">
                              <button
                                onClick={() => setActiveTab('workflows', 'workflows')}
                                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/60 font-medium cursor-pointer"
                              >
                                <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Workflows</span>
                              </button>
                              <button
                                onClick={() => setActiveTab('workflows', 'schedules')}
                                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/60 font-medium cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Drip Schedules</span>
                              </button>
                              <button
                                onClick={() => setActiveTab('workflows', 'webhooks')}
                                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/60 font-medium cursor-pointer"
                              >
                                <Webhook className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Webhooks</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (item.submenuType === 'reports') {
                      return (
                        <div key={item.id} className="space-y-0.5">
                          <button
                            onClick={() => {
                              setActiveTab('reports', 'call_logs');
                              setIsReportsOpen(!isReportsOpen);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                              activeTab === 'reports'
                                ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200/80 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <Icon className={`w-4 h-4 ${activeTab === 'reports' ? 'text-indigo-600' : 'text-slate-400'}`} />
                              <span>{item.label}</span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isReportsOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Reports Collapsible Submenu */}
                          {isReportsOpen && (
                            <div className="pl-8 pr-1 space-y-0.5 py-1 text-xs">
                              <button
                                onClick={() => setActiveTab('reports', 'call_logs')}
                                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/60 font-medium cursor-pointer"
                              >
                                <PhoneCall className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Call Log Report</span>
                              </button>
                              <button
                                onClick={() => setActiveTab('reports', 'leaderboard')}
                                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/60 font-medium cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Leaderboard</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="relative">
                        <button
                          onClick={() => {
                            if (item.isFilterAction) {
                              setIsFiltersOpen(!isFiltersOpen);
                            } else {
                              setActiveTab(item.id as TabType);
                              setIsFiltersOpen(false);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isActive
                              ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200/80 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span>{item.label}</span>
                          </div>

                          {item.badge !== undefined && item.badge > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                              {item.badge}
                            </span>
                          )}
                        </button>

                        {/* Filters Dropdown */}
                        {item.isFilterAction && isFiltersOpen && (
                          <div className="pl-8 pr-1 space-y-0.5 py-1.5 text-xs border-l-2 border-slate-100 ml-4">
                            {globalSavedFilters.map((filterItem) => {
                              const isSelected = activeFilterId === filterItem.id;
                              return (
                                <button
                                  key={filterItem.id}
                                  onClick={() => {
                                    if (setActiveFilterId) setActiveFilterId(filterItem.id);
                                    setActiveTab('leads');
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-50 text-indigo-900 font-bold'
                                      : 'text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="truncate">{filterItem.name || 'Untitled Filter'}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Section (Help Center & Settings Button matching reference) */}
      <div className="p-3 border-t border-white/50 bg-white/40 backdrop-blur-md space-y-1">
        {/* Help Center Button */}
        <button
          onClick={() => { if (onOpenVoiceBot) onOpenVoiceBot(); }}
          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200/60 transition-all cursor-pointer"
        >
          <Headphones className="w-4 h-4 text-slate-400" />
          <span>Help Center</span>
        </button>
      </div>
    </aside>
  );
};


