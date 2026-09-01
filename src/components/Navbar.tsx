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
  ShieldAlert
} from 'lucide-react';
import { Agent, isAgentAdmin } from '../types';
import { formatArcleName } from '../utils/brandUtils';

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
  pendingFollowUpsCount = 3,
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLicenseBanner, setShowLicenseBanner] = useState(true);

  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
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
    <header className="h-14 glass-panel border-b border-white/60 px-3 md:px-5 flex items-center justify-between sticky top-0 z-30 text-slate-900 font-sans select-none">
      
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
            <div className="absolute left-0 top-full mt-2 w-[calc(100vw-24px)] max-w-xs glass-dropdown rounded-2xl p-2.5 z-[9999] animate-in fade-in text-xs font-sans shadow-2xl max-h-[80vh] overflow-y-auto">
              
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
                  onClick={() => handleMenuClick('reports', 'Call Feedback & Analytics')}
                  className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
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

                  {/* SUPER ADMIN SHORTCUT */}
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-indigo-500 uppercase tracking-wider font-sans border-t border-slate-100 pt-2">
                    PLATFORM OPERATOR
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        if (onNavigateToTab) onNavigateToTab('superadmin');
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 cursor-pointer transition-all"
                    >
                      <ShieldAlert className="w-4 h-4 text-indigo-600" />
                      <span>Super Admin Command</span>
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

        {/* Super Admin Top Header Button */}
        {isAgentAdmin(activeAgent) && (
          <button
            onClick={() => onNavigateToTab && onNavigateToTab('superadmin')}
            className={`hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              currentView === 'superadmin'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200'
                : 'bg-white/80 border-slate-200/90 text-indigo-700 hover:bg-indigo-50'
            }`}
            title="Open Super Admin Command Center"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </button>
        )}

        {/* Power Dialer Queue Button */}
        <button
          onClick={onOpenPowerDialer}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs shadow-2xs cursor-pointer transition-all shrink-0 mr-2"
          title="Launch Power Dialer Call Queue"
        >
          <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Power Dialer</span>
        </button>

        {/* Call Followups Tasks Button */}
        <button
          onClick={() => { if (onNavigateToTab) onNavigateToTab('tasks'); }}
          className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            currentView === 'tasks' 
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
              : 'bg-white/70 border-white/80 text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
          title="Call Followups Tasks"
        >
          <Timer className="w-4.5 h-4.5" />
        </button>

        {/* Notification Bell Button */}
        <button
          onClick={() => { if (onShowToast) onShowToast('Notifications'); }}
          className="p-2 rounded-xl border border-white/80 bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer relative shadow-2xs"
          title="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {pendingFollowUpsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
          )}
        </button>

        {/* User Account Button (Rectangular white background behind user name) */}
        <div className="relative" ref={userDropdownRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group font-sans font-normal"
            title="User Account Menu"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center shadow-2xs overflow-hidden ring-1 ring-slate-200 font-sans shrink-0 border border-slate-200">
              {activeAgent.avatar ? (
                <img src={activeAgent.avatar} alt={activeAgent.name} className="w-full h-full object-cover" />
              ) : (
                activeAgent.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <span className="text-xs font-semibold text-slate-800 hidden sm:inline-block max-w-[150px] truncate">{activeAgent.name}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180 text-indigo-600' : ''}`} />
          </button>

          {/* User Account Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] max-w-xs glass-dropdown rounded-2xl p-3 z-[9999] animate-in fade-in text-xs font-sans font-normal shadow-2xl">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 font-sans">
                {activeAgent.avatar ? (
                  <img src={activeAgent.avatar} alt={activeAgent.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white text-slate-800 font-medium text-xs flex items-center justify-center shrink-0 font-sans border border-slate-200 shadow-sm">
                    {activeAgent.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="truncate font-sans">
                  <p className="font-bold text-slate-900 truncate font-open-sans" style={{ fontFamily: "'Open Sans', sans-serif" }}>{activeAgent.name}</p>
                  <p className="text-[11px] text-slate-500 truncate font-sans">{activeAgent.email || 'user@workspace.io'}</p>
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-600 mt-1 font-sans">
                    {isAgentAdmin(activeAgent) ? 'Master Admin' : activeAgent.role || 'Employee'}
                  </span>
                </div>
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
