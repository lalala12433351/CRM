import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3,
  Search,
  UserPlus,
  Phone,
  AtSign,
  Filter,
  Tag,
  TrendingUp,
  Bot,
  Link2,
  Sparkles,
  Headphones,
  SlidersHorizontal,
  LayoutDashboard,
  Users,
  BellRing,
  Trophy,
  MessageSquare,
  Inbox,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  GitBranch,
  Calendar,
  Code,
  LineChart,
  Zap,
  List,
  Webhook,
  PhoneCall,
  UserCheck
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
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  unassignedLeadsCount,
  missedCallsCount = 0,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse,
  onOpenVoiceBot,
  globalSavedFilters = [],
  activeFilterId = '',
  setActiveFilterId
}) => {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(true);
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;
  const toggleCollapse = externalOnToggleCollapse || (() => setInternalIsCollapsed(prev => !prev));

  // Filters Popover State
  const [isFiltersPopoverOpen, setIsFiltersPopoverOpen] = useState(false);
  const filtersPopoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersPopoverRef.current && !filtersPopoverRef.current.contains(event.target as Node)) {
        setIsFiltersPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // The core icons shown on the screenshot rail
  const railItems = [
    { id: 'dashboard' as TabType, label: 'Analytics & Pipeline', icon: BarChart3, tooltip: 'Dashboard' },
    { id: 'leads' as TabType, label: 'Search & Leads', icon: Search, tooltip: 'Search Leads' },
    { id: 'add_lead' as TabType, label: 'Add Lead', icon: UserPlus, tooltip: 'Add Lead' },
    { id: 'followups' as TabType, label: 'Calls & Dialer', icon: Phone, tooltip: 'Dialer & Follow-Ups', badge: missedCallsCount > 0 ? missedCallsCount : undefined },
    { id: 'inbox' as TabType, label: 'Messages & Mail', icon: AtSign, tooltip: 'Unified Inbox' },
    { id: 'filters' as any, label: 'Filters', icon: Filter, tooltip: 'Saved Filters', isFilterAction: true },
    { id: 'whatsapp' as TabType, label: 'WhatsApp', icon: MessageSquare, tooltip: 'WhatsApp CRM' },
    { id: 'campaigns' as TabType, label: 'Campaigns & Tags', icon: Tag, tooltip: 'Campaigns' },
    { id: 'reports' as TabType, label: 'Performance Reports', icon: TrendingUp, tooltip: 'Reports & Leaderboard', hasReportsMenu: true },
    { id: 'workflows' as TabType, label: 'AI Automations', icon: Bot, tooltip: 'Automations & Workflows', hasAutomationsMenu: true },
    { id: 'integrations' as TabType, label: 'Integrations', icon: Link2, tooltip: 'Integrations & Webhooks' },
  ];

  return (
    <aside className="w-[60px] bg-white border-r border-slate-200 flex flex-col justify-between items-center py-2.5 shrink-0 hidden md:flex min-h-[calc(100vh-3.5rem)] font-sans select-none z-20 shadow-2xs">
      
      {/* Top Navigation Rail */}
      <div className="flex flex-col items-center space-y-1.5 w-full px-1.5 pt-1">
        {/* Rail Icons */}
        <div className="flex flex-col items-center space-y-1.5 w-full">
          {railItems.map((item) => {
            const Icon = item.icon;

            if (item.hasAutomationsMenu) {
              return (
                <div key={item.id} className="relative group/menu w-full flex justify-center">
                  <button
                    onClick={() => setActiveTab('workflows', 'workflows')}
                    title={item.tooltip}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                      activeTab === 'workflows'
                        ? 'bg-indigo-50 text-[#5034a8] font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </button>

                  {/* FLYOUT MENU */}
                  <div className="absolute left-full top-0 ml-3 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-2 hidden group-hover/menu:block z-50 animate-in fade-in">
                    <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">
                      Automations
                    </div>
                    <button
                      onClick={() => setActiveTab('workflows', 'workflows')}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Workflows</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('workflows', 'schedules')}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Drip Schedules</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('workflows', 'webhooks')}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      <Webhook className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Webhooks</span>
                    </button>
                  </div>
                </div>
              );
            }

            if (item.hasReportsMenu) {
              return (
                <div key={item.id} className="relative group/reports w-full flex justify-center">
                  <button
                    onClick={() => setActiveTab('reports', 'call_logs')}
                    title={item.tooltip}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                      activeTab === 'reports'
                        ? 'bg-indigo-50 text-[#5034a8] font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </button>

                  {/* FLYOUT MENU */}
                  <div className="absolute left-full top-0 ml-3 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-2 hidden group-hover/reports:block z-50 animate-in fade-in">
                    <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">
                      Reports
                    </div>
                    <button
                      onClick={() => setActiveTab('reports', 'call_logs')}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Call Log Report</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('reports', 'leaderboard')}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      <Trophy className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Leaderboard</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('reports', 'user_report')}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>User Performance</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="relative group w-full flex justify-center"
                ref={item.isFilterAction ? filtersPopoverRef : null}
              >
                <button
                  onClick={() => {
                    if (item.isFilterAction) {
                      setIsFiltersPopoverOpen(!isFiltersPopoverOpen);
                    } else if ((item as any).isAiAction) {
                      onOpenVoiceBot && onOpenVoiceBot();
                    } else {
                      setActiveTab(item.id as TabType);
                      setIsFiltersPopoverOpen(false);
                    }
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    (activeTab === item.id || (item.isFilterAction && isFiltersPopoverOpen))
                      ? 'bg-[#ede9fe] text-[#5b21b6] shadow-sm font-bold' 
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                  title={item.tooltip}
                >
                  <Icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-mono font-bold flex items-center justify-center border border-white">
                      {item.badge}
                    </span>
                  )}
                </button>

                {item.tooltip && !item.isFilterAction && (
                  <div className="absolute left-14 bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl ml-2 border border-slate-700 pointer-events-none">
                    {item.tooltip}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-700"></div>
                  </div>
                )}

                {/* FILTERS POPOVER */}
                {item.isFilterAction && isFiltersPopoverOpen && (
                  <div className="absolute left-[64px] top-0 w-72 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-[100] p-2.5 space-y-1.5 animate-in fade-in slide-in-from-left-2 text-xs">
                    {/* Popover Header */}
                    <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-700 text-xs">Filters</span>
                      <div className="flex items-center space-x-3">
                        <button className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
                          <List className="w-3 h-3" />
                          <span>Arrange</span>
                        </button>
                        <button className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                          + Create New
                        </button>
                      </div>
                    </div>

                    {/* Popover List Items */}
                    <div className="max-h-80 overflow-y-auto space-y-0.5 pt-1 ios-scroll">
                      {globalSavedFilters.map((filterItem) => {
                        const isSelected = activeFilterId === filterItem.id;
                        return (
                          <button
                            key={filterItem.id}
                            onClick={() => {
                              if (setActiveFilterId) setActiveFilterId(filterItem.id);
                              setActiveTab('leads');
                              setIsFiltersPopoverOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#ede9fe] text-[#5b21b6] font-bold'
                                : 'text-slate-700 hover:bg-slate-50 font-medium'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 truncate">
                              {filterItem.iconType === 'arrow' ? (
                                <span className={`w-4 h-4 shrink-0 rounded flex items-center justify-center text-xs font-bold ${isSelected ? 'text-[#5b21b6]' : 'text-indigo-600'}`}>
                                  ↖
                                </span>
                              ) : (
                                <Filter className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#5b21b6]' : 'text-indigo-600'}`} />
                              )}
                              <span className="truncate">{filterItem.name || 'Untitled Filter'}</span>
                            </div>
                            <LineChart className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#5b21b6]' : 'text-slate-400 opacity-60 group-hover:opacity-100'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Headphones & Version Footer matching screenshot */}
      <div className="flex flex-col items-center space-y-1 pt-2 w-full border-t border-slate-100">
        <button 
          onClick={() => { if (onOpenVoiceBot) onOpenVoiceBot(); }}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-all cursor-pointer"
          title="Customer Support / Audio Dialer"
        >
          <Headphones className="w-5 h-5 stroke-[1.75]" />
        </button>
        <span className="text-[10px] text-slate-400 font-mono tracking-tight font-medium">
          v189.1
        </span>
      </div>
    </aside>
  );
};


