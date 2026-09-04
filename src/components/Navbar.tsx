import React, { useState, useRef, useEffect } from 'react';
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
  Plane,
  X,
  Sparkles,
  Command,
  Search,
  LogOut,
  User
} from 'lucide-react';
import { Agent, isAgentAdmin } from '../types';
import { formatArcleName } from '../utils/brandUtils';
import { UserAvatar } from './UserAvatar';

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
    name: 'Primary Workspace',
    orgName: 'Main Organization HQ',
    type: 'Primary Account',
    badge: 'Sales & CRM',
    color: 'bg-[#5034a8]',
    iconLetter: 'P',
    membersCount: 12,
    plan: 'Enterprise'
  },
  {
    id: 'acc-1',
    name: 'Real Estate & Sales',
    orgName: 'Sales Group HQ',
    type: 'Primary Account',
    badge: 'Real Estate',
    color: 'bg-indigo-600',
    iconLetter: 'R',
    membersCount: 24,
    plan: 'Enterprise'
  },
  {
    id: 'acc-2',
    name: 'Enterprise SaaS',
    orgName: 'Tech Solutions Workspace',
    type: 'B2B Software Workspace',
    badge: 'B2B SaaS',
    color: 'bg-emerald-600',
    iconLetter: 'S',
    membersCount: 12,
    plan: 'Pro Team'
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLicenseBanner, setShowLicenseBanner] = useState(true);

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
      
      {/* LEFT: Institute / Workspace Selector & Settings Flyout Trigger */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
        {/* Workspace Title Badge */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 px-1.5 sm:px-2 py-1 rounded-lg text-left min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#5034a8] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
            <Plane className="w-3.5 h-3.5 transform -rotate-45" />
          </div>
          <span className="font-semibold text-xs md:text-sm text-slate-800 tracking-tight truncate max-w-[120px] sm:max-w-[220px] md:max-w-none">
            {currentWorkspaceName}
          </span>
        </div>

        {/* Settings Gear Button with Popover Flyout matching screenshot */}
        <div className="relative shrink-0" ref={settingsDropdownRef}>
          <button
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center ${
              isSettingsMenuOpen || currentView === 'fields' || currentView === 'settings'
                ? 'border-slate-300/80 bg-white/80 text-slate-900 shadow-2xs'
                : 'border-slate-200/80 bg-white/50 hover:bg-white/90 text-slate-600'
            }`}
            title="Workspace Settings Menu"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* EXACT WORKSPACE / TEAM / BILLING SETTINGS FLYOUT MENU */}
          {isSettingsMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-[calc(100vw-24px)] max-w-xs glass-dropdown rounded-2xl p-2.5 z-[99999] animate-in fade-in text-xs font-sans shadow-2xl max-h-[80vh] overflow-y-auto">
              
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
        </div>

      </div>

      {/* RIGHT: Action Buttons & Modals */}
      <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">

        {/* Power Dialer Queue Button */}
        <button
          onClick={onOpenPowerDialer}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs shadow-2xs cursor-pointer transition-all shrink-0 mr-2"
          title="Launch Power Dialer Call Queue"
        >
          <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Power Dialer</span>
        </button>

        {/* Call Followups Tasks Button with Pending Tasks Badge */}
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
          {isNotificationMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-24px)] glass-dropdown rounded-2xl p-3 z-[99999] animate-in fade-in text-xs font-sans shadow-2xl">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-[#3a2088]" />
                  <span className="font-bold text-slate-900">Notifications & Alarms</span>
                </div>
                {pendingFollowUpsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                    {pendingFollowUpsCount} Due
                  </span>
                )}
              </div>

              <div className="py-2.5 space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-[11px]">Follow-Up Reminders</span>
                    <span className="font-mono font-bold text-slate-900 text-[11px]">{pendingFollowUpsCount}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Scheduled client calls and follow-ups requiring attention.</p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-[11px]">Pending Tasks</span>
                    <span className="font-mono font-bold text-slate-900 text-[11px]">{pendingTasksCount}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Uncompleted tasks and action items assigned to you.</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationMenuOpen(false);
                    if (onNavigateToFollowUps) onNavigateToFollowUps();
                    else if (onNavigateToTab) onNavigateToTab('followups');
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#3a2088] hover:bg-[#2c186b] text-white font-bold text-center text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  View Follow-Ups
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationMenuOpen(false);
                    if (onNavigateToTab) onNavigateToTab('tasks');
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-center text-xs transition-colors cursor-pointer"
                >
                  View Tasks
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Account Button (Rectangular white background behind user name) */}
        <div className="relative" ref={userDropdownRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group font-sans font-normal"
            title="User Account Menu"
          >
            <UserAvatar name={activeAgent.name} avatarUrl={activeAgent.avatar} size="md" rounded="full" />
            <span className="text-xs font-semibold text-slate-800 hidden sm:inline-block max-w-[150px] truncate">{activeAgent.name}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180 text-indigo-600' : ''}`} />
          </button>

          {/* User Account Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] max-w-xs glass-dropdown rounded-2xl p-3 z-[99999] animate-in fade-in text-xs font-sans font-normal shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-sans gap-2">
                <div className="flex items-center space-x-3 truncate">
                  <UserAvatar name={activeAgent.name} avatarUrl={activeAgent.avatar} size="lg" rounded="xl" />
                  <div className="truncate font-sans">
                    <p className="font-bold text-slate-900 truncate font-open-sans" style={{ fontFamily: "'Open Sans', sans-serif" }}>{activeAgent.name}</p>
                    <p className="text-[11px] text-slate-500 truncate font-sans">{activeAgent.email || 'user@workspace.io'}</p>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-600 font-sans">
                        {isAgentAdmin(activeAgent) ? 'Master Admin' : activeAgent.role || 'Employee'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {activeAgent.id}</span>
                    </div>
                  </div>
                </div>

                {/* Settings Icon Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onNavigateToTab) onNavigateToTab('settings', 'profile');
                  }}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs group"
                  title="Profile & Database User ID Settings"
                >
                  <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                </button>
              </div>

              {/* Log Out Action */}
              {onLogout && (
                <div className="pt-2 font-sans">
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
