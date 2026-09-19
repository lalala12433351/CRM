import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Settings, 
  ChevronDown, 
  AlertCircle, 
  Timer, 
  Bell, 
  ListFilter, 
  Layers, 
  PhoneCall, 
  Zap, 
  Sliders, 
  Users, 
  Shield, 
  CreditCard, 
  FileText,
  Building2,
  Check,
  Plus,
  X,
  Command,
  Search,
  LogOut,
  User,
  CheckCircle2,
  Clock,
  UserPlus,
  PhoneForwarded,
  CheckSquare,
  BellRing,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Agent, isAgentAdmin } from '../types';
import { formatArcleName } from '../utils/brandUtils';
import { UserAvatar } from './UserAvatar';
import { CrmRole, formatRoleBadge, getCrmRole } from '../utils/roleUtils';

export interface WorkAccount {
  id: string;
  name: string;
  orgName: string;
  type: string;
  badge: string;
  color: string;
  iconLetter: string;
  membersCount: number;
  plan: string;
}

const DEFAULT_WORK_ACCOUNTS: WorkAccount[] = [
  {
    id: 'acc-main',
    name: 'Workspace',
    orgName: 'Organization',
    type: 'Primary Account',
    badge: 'CRM',
    color: 'bg-[#5034a8]',
    iconLetter: 'W',
    membersCount: 0,
    plan: 'Workspace'
  }
];

interface NavbarProps {
  activeAgent: Agent;
  agents: Agent[];
  companyName?: string;
  onSelectAgent: (agentId: string) => void;
  onOpenLeadModal?: () => void;
  onAddNewLead?: () => void;
  onPushTestLead?: (source?: string) => void;
  onOpenVoiceBot?: () => void;
  onOpenPowerDialer?: () => void;
  onOpenAiCopilot?: () => void;
  onOpenCommandPalette?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  pendingFollowUpsCount?: number;
  pendingTasksCount?: number;
  leads?: any[];
  tasks?: any[];
  onOpenLeadDetail?: (lead: any) => void;
  onNavigateToFollowUps?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToTab?: (tab: string, subTab?: string) => void;
  currentView?: string;
  onShowToast?: (message: string) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeAgent,
  agents,
  companyName,
  onSelectAgent,
  onOpenLeadModal,
  onAddNewLead,
  onPushTestLead = () => {},
  onOpenVoiceBot = () => {},
  onOpenPowerDialer = () => {},
  onOpenAiCopilot = () => {},
  onOpenCommandPalette = () => {},
  searchQuery = '',
  setSearchQuery = (_query: string) => {},
  pendingFollowUpsCount = 0,
  pendingTasksCount = 0,
  leads = [],
  tasks = [],
  onOpenLeadDetail,
  onNavigateToFollowUps,
  onNavigateToSettings,
  onNavigateToTab,
  currentView = '',
  onShowToast,
  onLogout
}) => {
  // Work Accounts State
  const [workAccounts, setWorkAccounts] = useState<WorkAccount[]>(DEFAULT_WORK_ACCOUNTS);
  const [activeAccount, setActiveAccount] = useState<WorkAccount>(DEFAULT_WORK_ACCOUNTS[0]);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'all' | 'followups' | 'tasks'>('all');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLicenseBanner, setShowLicenseBanner] = useState(true);
  const canManageSettings = isAgentAdmin(activeAgent);
  const activeCrmRole = formatRoleBadge(activeAgent);
  const showTasksButton = activeCrmRole === 'Manager';

    /** Exactly one selectable account per CRM role that exists in the live tenant store. */
  const roleAccounts = useMemo(() => {
    const definitions = [
      { role: 'Admin' as const, label: 'Admin Account' },
      { role: 'Manager' as const, label: 'Manager Account' },
      { role: 'Telecaller' as const, label: 'Telecaller Account' },
    ];
    return definitions
      .map((def) => {
        const agent = (agents || []).find((a) => getCrmRole(a) === def.role);
        if (!agent) return null;
        return { ...def, agent };
      })
      .filter(Boolean) as Array<{ role: CrmRole; label: string; agent: Agent }>;
  }, [agents]);

const accountDropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationMenuOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchAccount = (account: WorkAccount) => {
    setActiveAccount(account);
    setIsAccountMenuOpen(false);
    if (onShowToast) {
      onShowToast(`Switched workspace to "${account.name}"`);
    }
  };

  const handleMenuClick = (tabOrAction: string, msg?: string, settingsSubTab?: string) => {
    setIsSettingsMenuOpen(false);
    if (onNavigateToTab) {
      onNavigateToTab(tabOrAction, settingsSubTab);
    } else if (onNavigateToSettings && tabOrAction === 'settings') {
      onNavigateToSettings();
    }
    if (msg && onShowToast) {
      onShowToast(msg);
    }
  };

  useEffect(() => {
    if (companyName) {
      const cleanCompany = companyName.replace(/^ARCLE\s*[-–|:•]\s*/i, '').replace(/^ARCLE\s+/i, '').trim() || companyName;
      const formattedWorkspaceName = cleanCompany;
      setWorkAccounts((prev) => {
        const copy = [...prev];
        copy[0] = {
          ...copy[0],
          name: formattedWorkspaceName,
          orgName: `${cleanCompany} HQ`,
          iconLetter: cleanCompany.charAt(0).toUpperCase()
        };
        return copy;
      });
      setActiveAccount((prev) => ({
        ...prev,
        name: formattedWorkspaceName,
        orgName: `${cleanCompany} HQ`,
        iconLetter: cleanCompany.charAt(0).toUpperCase()
      }));
    }
  }, [companyName]);

  const currentWorkspaceName = formatArcleName(activeAccount.name || 'Workspace', companyName);

  return (
    <header className="h-14 glass-panel border-b border-slate-200 px-3 md:px-5 flex items-center justify-between sticky top-0 z-30 text-slate-900 font-sans select-none relative shadow-xs">
      
      {/* LEFT: Institute / Workspace Selector & Settings Flyout Trigger Pill */}
      <div className="flex items-center min-w-0">
        <div className="flex items-center rounded-full bg-white border border-slate-200/90 shadow-2xs pl-1 pr-2 py-0.5 hover:border-slate-300 transition-all">
          {/* Workspace Dropdown Trigger */}
          <div className="relative" ref={accountDropdownRef}>
            <button
              onClick={() => {
                setIsAccountMenuOpen(!isAccountMenuOpen);
                setIsSettingsMenuOpen(false);
              }}
              className="flex items-center space-x-1.5 px-1.5 py-1 rounded-full hover:bg-slate-50 transition-colors cursor-pointer group text-left min-w-0"
              title="Switch Workspace"
            >
              <div className="w-6 h-6 rounded-full bg-[#5034a8] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                {(currentWorkspaceName || 'W').charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-xs md:text-sm text-slate-800 tracking-tight truncate max-w-[120px] sm:max-w-[220px] md:max-w-none">
                {currentWorkspaceName}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isAccountMenuOpen ? 'rotate-180 text-[#5034a8]' : 'group-hover:text-slate-800'}`} />
            </button>

            {/* WORKSPACES CHOOSER DROPDOWN POPOVER */}
            {isAccountMenuOpen && (
              <div className="absolute left-0 top-full mt-2.5 w-72 glass-dropdown rounded-2xl p-2.5 z-[99999] animate-in fade-in text-xs font-sans shadow-2xl border border-slate-200">
                {/* Header */}
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
                  WORKSPACES
                </div>
                
                {/* Workspaces List */}
                <div className="space-y-1 mb-2">
                  {workAccounts.map((account) => {
                    const isSelected = activeAccount.id === account.id;
                    return (
                      <button
                        key={account.id}
                        onClick={() => handleSwitchAccount(account)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-50/80 text-[#3a2088] border border-purple-200/80 shadow-2xs font-medium'
                            : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg ${account.color || 'bg-[#5034a8]'} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                            {account.iconLetter || account.name.charAt(0)}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="font-semibold text-xs text-slate-900 truncate flex items-center gap-1.5">
                              <span className="truncate">{account.name}</span>
                              {account.badge && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-normal">
                                  {account.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {account.orgName} • {account.membersCount} members
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#5034a8] shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Manage Workspaces Bottom Button (Admin Only) */}
                {isAgentAdmin(activeAgent) && <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      if (onNavigateToTab) {
                        onNavigateToTab('settings', 'general');
                      } else if (onNavigateToSettings) {
                        onNavigateToSettings();
                      }
                      if (onShowToast) onShowToast('Manage Workspaces');
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs text-center transition-all cursor-pointer shadow-2xs flex items-center justify-center space-x-2"
                  >
                    <span>Manage Workspaces</span>
                  </button>
                </div>}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-[1px] h-4 bg-slate-200 mx-1.5 shrink-0" />

          {/* Settings Gear Button with Popover Flyout */}
          {isAgentAdmin(activeAgent) && <div className="relative shrink-0" ref={settingsDropdownRef}>
            <button
              onClick={() => {
                setIsSettingsMenuOpen(!isSettingsMenuOpen);
                setIsAccountMenuOpen(false);
              }}
              className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                isSettingsMenuOpen || currentView === 'fields' || currentView === 'settings'
                  ? 'bg-purple-50 text-[#5034a8]'
                  : 'text-slate-500 hover:text-[#5034a8] hover:bg-slate-50'
              }`}
              title="Workspace Settings Menu"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* EXACT WORKSPACE / TEAM / BILLING SETTINGS FLYOUT MENU */}
            {isSettingsMenuOpen && (
              <div className="absolute left-0 top-full mt-2.5 w-[calc(100vw-24px)] max-w-xs glass-dropdown rounded-2xl p-2.5 z-[99999] animate-in fade-in text-xs font-sans shadow-2xl max-h-[80vh] overflow-y-auto">
                
                {/* WORKSPACE SECTION */}
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
                  WORKSPACE
                </div>
                <div className="space-y-0.5 mb-2">
                  {isAgentAdmin(activeAgent) && (
                    <button
                      onClick={() => handleMenuClick('settings', 'Lead Fields Settings', 'fields')}
                      className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer transition-all ${
                        currentView === 'fields'
                          ? 'bg-indigo-50/80 text-indigo-900 font-medium border border-indigo-200 shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ListFilter className="w-4 h-4 text-slate-500" />
                      <span>Lead Fields</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleMenuClick('settings', 'Pipeline Stages & Colors', 'pipeline')}
                    className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-slate-500" />
                    <span>Lead Stage</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick('call_feedback', 'Call Feedback Statuses & Dispositions')}
                    className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer transition-all ${
                      currentView === 'call_feedback'
                        ? 'bg-indigo-50/80 text-indigo-900 font-medium border border-indigo-200 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <PhoneCall className="w-4 h-4 text-slate-500" />
                    <span>Call Feedback</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick('workflows', 'Custom Automation Actions')}
                    className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-slate-500" />
                    <span>Custom Actions</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick('settings', 'System Preferences', 'general')}
                    className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <span>Preferences</span>
                  </button>
                </div>

                {/* TEAM SECTION */}
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-sans border-t border-slate-100 pt-2">
                  TEAM
                </div>
                <div className="space-y-0.5 mb-2">
                  <button
                    onClick={() => handleMenuClick('team', 'Managing Users & Representatives')}
                    className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Users & Team</span>
                  </button>

                  {isAgentAdmin(activeAgent) && (
                    <button
                      onClick={() => handleMenuClick('settings', 'Permission Templates & Roles', 'permissions')}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-slate-500" />
                      <span>Permission Templates</span>
                    </button>
                  )}
                </div>

                {/* BILLING SECTION (Admin Only) */}
                {isAgentAdmin(activeAgent) && (
                  <>
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-sans border-t border-slate-100 pt-2">
                      BILLING & PAYMENTS
                    </div>
                    <div className="space-y-0.5">
                      <button
                        onClick={() => handleMenuClick('settings', 'Buy Licenses & Billing Desk', 'billing')}
                        className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4 text-slate-500" />
                        <span>Buy Licenses / Payment Options</span>
                      </button>

                      <button
                        onClick={() => handleMenuClick('settings', 'Billing & Transaction History', 'billing')}
                        className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>Transaction History</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>}
        </div>
      </div>

      {/* RIGHT: Action Buttons & Modals */}
      <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">

        {/* Power Dialer Queue Button */}
        <button
          onClick={onOpenPowerDialer}
          className="hidden md:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#5034a8] hover:bg-[#432993] text-white font-semibold text-xs shadow-xs cursor-pointer transition-all shrink-0 mr-1.5 active:scale-95"
          title="Launch Power Dialer Call Queue"
        >
          <PhoneCall className="w-3.5 h-3.5 text-white shrink-0" />
          <span>Power Dialer</span>
        </button>

        {/* Tasks button — Manager only (Admin / Telecaller do not use Tasks) */}
        {showTasksButton && (
        <button
          onClick={() => { if (onNavigateToTab) onNavigateToTab('tasks'); }}
          className={`p-2 rounded-xl border transition-all cursor-pointer relative shadow-2xs ${
            currentView === 'tasks' 
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
              : 'bg-white/70 border-white/80 text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
          title={`Tasks${pendingTasksCount > 0 ? ` (${pendingTasksCount} pending)` : ''}`}
        >
          <Timer className="w-4.5 h-4.5" />
          {pendingTasksCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs">
              {pendingTasksCount > 99 ? '99+' : pendingTasksCount}
            </span>
          )}
        </button>
        )}

        {/* Notification Bell Button & Flyout */}
        <div className="relative" ref={notificationDropdownRef}>
          <button
            onClick={() => setIsNotificationMenuOpen(!isNotificationMenuOpen)}
            className={`p-2 rounded-xl border transition-all cursor-pointer relative shadow-2xs ${
              isNotificationMenuOpen 
                ? 'bg-purple-50 border-purple-200 text-[#3a2088]' 
                : 'border-white/80 bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900'
            }`}
            title={`Notifications${pendingFollowUpsCount > 0 ? ` (${pendingFollowUpsCount} pending follow-ups)` : ''}`}
          >
            <Bell className="w-4.5 h-4.5" />
            {pendingFollowUpsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs">
                {pendingFollowUpsCount > 99 ? '99+' : pendingFollowUpsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {isNotificationMenuOpen && (() => {
            const followupsList = (leads || []).filter((l: any) => l.followUpAt || l.status === 'Follow Up').slice(0, 5);
            const pendingTasksList = (tasks || []).filter((t: any) => t.status === 'Pending' || !t.status).slice(0, 5);
            const totalActiveAlerts = pendingFollowUpsCount + pendingTasksCount;

            return (
              <div className="absolute right-0 top-full mt-2.5 w-96 max-w-[calc(100vw-24px)] rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18),0_10px_20px_-5px_rgba(0,0,0,0.08)] p-0 z-[99999] animate-in fade-in slide-in-from-top-2 duration-150 text-xs font-sans overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-slate-50/90 via-purple-50/40 to-slate-50/90 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-[#5034a8]/10 text-[#5034a8] flex items-center justify-center">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-[13px] leading-tight">Notifications</h4>
                      <p className="text-[10px] text-slate-500">Live alerts & reminders</p>
                    </div>
                  </div>
                  {totalActiveAlerts > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-600 text-[10px] font-bold shadow-2xs">
                      {totalActiveAlerts} Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-semibold">
                      All Clear
                    </span>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center p-1.5 bg-slate-50/80 border-b border-slate-100 gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setNotificationTab('all')}
                    className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                      notificationTab === 'all'
                        ? 'bg-white text-[#5034a8] shadow-2xs border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({totalActiveAlerts})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationTab('followups')}
                    className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                      notificationTab === 'followups'
                        ? 'bg-white text-[#5034a8] shadow-2xs border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Follow-Ups ({pendingFollowUpsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationTab('tasks')}
                    className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                      notificationTab === 'tasks'
                        ? 'bg-white text-[#5034a8] shadow-2xs border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tasks ({pendingTasksCount})
                  </button>
                </div>

                {/* Content List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
                  {/* Follow-up Items */}
                  {(notificationTab === 'all' || notificationTab === 'followups') && followupsList.length > 0 && (
                    followupsList.map((lead: any) => (
                      <div
                        key={`notif-lead-${lead.id}`}
                        className="p-2.5 rounded-xl hover:bg-slate-50/90 transition-all group flex items-start space-x-3 cursor-pointer"
                        onClick={() => {
                          setIsNotificationMenuOpen(false);
                          if (onOpenLeadDetail) onOpenLeadDetail(lead);
                          else if (onNavigateToFollowUps) onNavigateToFollowUps();
                        }}
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 mt-0.5">
                          <PhoneForwarded className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 truncate text-[12px]">{lead.name || 'Unnamed Contact'}</span>
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                              Follow-Up
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{lead.phone || 'Phone not set'}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{lead.followUpAt ? new Date(lead.followUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Scheduled'}</span>
                            </span>
                            {lead.phone && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `tel:${lead.phone}`;
                                }}
                                className="px-2 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center space-x-1 cursor-pointer transition-all shadow-2xs"
                              >
                                <PhoneCall className="w-2.5 h-2.5" />
                                <span>Call</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Task Items */}
                  {(notificationTab === 'all' || notificationTab === 'tasks') && pendingTasksList.length > 0 && (
                    pendingTasksList.map((task: any) => (
                      <div
                        key={`notif-task-${task.id}`}
                        className="p-2.5 rounded-xl hover:bg-slate-50/90 transition-all flex items-start space-x-3 cursor-pointer"
                        onClick={() => {
                          setIsNotificationMenuOpen(false);
                          if (onNavigateToTab) onNavigateToTab('tasks');
                        }}
                      >
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/80 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 truncate text-[12px]">{task.title}</span>
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md shrink-0">
                              {task.priority || 'Task'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            Assigned to {task.assigneeAgentName || 'You'}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-slate-400">
                              {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'Pending action'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Empty state when no items in tab */}
                  {((notificationTab === 'all' && totalActiveAlerts === 0) ||
                    (notificationTab === 'followups' && followupsList.length === 0) ||
                    (notificationTab === 'tasks' && pendingTasksList.length === 0)) && (
                    <div className="p-6 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-800 text-[12px]">All caught up!</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">No pending follow-ups or alerts in this view.</p>
                    </div>
                  )}
                </div>

                {/* Footer Quick Links */}
                <div className="p-2.5 bg-slate-50/90 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationMenuOpen(false);
                      if (onNavigateToFollowUps) onNavigateToFollowUps();
                      else if (onNavigateToTab) onNavigateToTab('followups');
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#5034a8] hover:bg-[#3f278c] text-white font-bold text-center text-[11px] transition-colors cursor-pointer shadow-xs"
                  >
                    Open Follow-Ups
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationMenuOpen(false);
                      if (onNavigateToTab) onNavigateToTab('tasks');
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-center text-[11px] transition-colors cursor-pointer shadow-2xs"
                  >
                    View All Tasks
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Role Account Selector (Admin / Manager / Telecaller) */}
        <div className="relative" ref={userDropdownRef}>
          <button 
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsAccountMenuOpen(false);
              setIsSettingsMenuOpen(false);
              setIsNotificationMenuOpen(false);
            }}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group font-sans font-normal"
            title="Switch role account"
            aria-haspopup="listbox"
            aria-expanded={isUserMenuOpen}
          >
            <UserAvatar name={activeAgent.name} avatarUrl={activeAgent.avatar} size="md" rounded="full" />
            <span className="text-xs font-semibold text-slate-800 hidden sm:inline-block max-w-[180px] truncate">
              {activeAgent.name}
            </span>
            <span className="hidden md:inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100">
              {activeCrmRole}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180 text-indigo-600' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] max-w-sm glass-dropdown rounded-2xl p-2.5 z-[99999] animate-in fade-in text-xs font-sans font-normal shadow-2xl">
              <div className="flex items-center justify-between px-2 pb-2.5 mb-1 border-b border-slate-100 gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Switch account</p>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                    Choose Admin, Manager, or Telecaller
                  </p>
                </div>
                {canManageSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onNavigateToTab) onNavigateToTab('settings', 'profile');
                    }}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs group"
                    title="Profile & Workspace Settings"
                  >
                    <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                  </button>
                )}
              </div>

              <div className="space-y-1" role="listbox" aria-label="Role accounts">
                {roleAccounts.length === 0 && (
                  <p className="px-2 py-3 text-[11px] text-slate-500">No role accounts available yet. Create Manager/Telecaller users in Users & Team.</p>
                )}
                {roleAccounts.map((account) => {
                  const selected = getCrmRole(activeAgent) === account.role;
                  return (
                    <button
                      key={account.role}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        if (!selected || account.agent.id !== activeAgent.id) {
                          onSelectAgent(account.agent.id);
                        }
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                        selected
                          ? 'bg-indigo-50 border-indigo-200 shadow-2xs'
                          : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
                      }`}
                    >
                      <UserAvatar name={account.agent.name} avatarUrl={account.agent.avatar} size="md" rounded="full" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-[12px] font-bold truncate ${selected ? 'text-indigo-900' : 'text-slate-900'}`}>
                            {account.label}
                          </p>
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                            account.role === 'Admin'
                              ? 'bg-violet-100 text-violet-700'
                              : account.role === 'Manager'
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {account.role}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-700 truncate mt-0.5">
                          {account.agent.name}
                        </p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {onLogout && (
                <div className="pt-2 mt-1.5 border-t border-slate-100 font-sans">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-100 font-semibold text-xs transition-colors cursor-pointer font-sans"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
