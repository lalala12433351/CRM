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
  Search
} from 'lucide-react';
import { Agent, isAgentAdmin } from '../types';

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
    id: 'acc-kite',
    name: 'Kite Institute of Aviation',
    orgName: 'Kite Aviation Academy HQ',
    type: 'Aviation & Admissions',
    badge: 'Aviation Desk',
    color: 'bg-[#5034a8]',
    iconLetter: 'K',
    membersCount: 24,
    plan: 'Enterprise'
  },
  {
    id: 'acc-1',
    name: 'ARCLE Real Estate & Sales',
    orgName: 'ARCLE Group HQ',
    type: 'Primary Account',
    badge: 'Real Estate',
    color: 'bg-indigo-600',
    iconLetter: 'A',
    membersCount: 24,
    plan: 'Enterprise'
  },
  {
    id: 'acc-2',
    name: 'ARCLE Enterprise SaaS',
    orgName: 'ARCLE Tech Solutions',
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
}

export const Navbar: React.FC<NavbarProps> = ({
  activeAgent,
  agents,
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
  onShowToast
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

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 md:px-5 flex items-center justify-between sticky top-0 z-30 text-slate-900 font-sans select-none shadow-2xs">
      
      {/* LEFT: Institute / Workspace Selector & Settings Flyout Trigger */}
      <div className="flex items-center space-x-2">
        {/* Workspace Dropdown Button */}
        <div className="relative" ref={accountDropdownRef}>
          <button
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer group text-left"
          >
            <div className="w-6 h-6 rounded-full bg-[#5034a8] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              <Plane className="w-3.5 h-3.5 transform -rotate-45" />
            </div>
            <span className="font-semibold text-xs md:text-sm text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
              {activeAccount.name}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAccountMenuOpen ? 'rotate-180 text-indigo-600' : ''}`} />
          </button>

          {/* Work Account Switcher Dropdown */}
          {isAccountMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in">
              <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Select Workspace</p>
              </div>
              <div className="space-y-1">
                {workAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleSwitchAccount(account)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      account.id === activeAccount.id ? 'bg-indigo-50 font-bold text-indigo-950' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{account.name}</span>
                    {account.id === activeAccount.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings Gear Button with Popover Flyout matching screenshot */}
        <div className="relative" ref={settingsDropdownRef}>
          <button
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isSettingsMenuOpen || currentView === 'fields' || currentView === 'settings'
                ? 'border-slate-300 bg-slate-100 text-slate-900 shadow-2xs'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
            }`}
            title="Workspace Settings Menu"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* EXACT WORKSPACE / TEAM / BILLING SETTINGS FLYOUT MENU */}
          {isSettingsMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in text-xs font-sans">
              
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
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Action Buttons & Modals */}
      <div className="flex items-center space-x-2 md:space-x-2.5">
        {/* Quick Command Launcher button */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs text-xs"
          title="Open Command Palette (Cmd + K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Quick Search</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-400">⌘K</kbd>
        </button>

        {/* AI Sales Copilot Button (Hidden on mobile top nav to avoid clutter, accessible via side drawer) */}
        <button
          onClick={onOpenAiCopilot}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all shrink-0"
          title="AI Sales Copilot & Objection Buster"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Copilot</span>
        </button>

        {/* Power Dialer Queue Button (Hidden on mobile top nav to avoid clutter, accessible via side drawer) */}
        <button
          onClick={onOpenPowerDialer}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all shrink-0"
          title="Launch Power Dialer Call Queue"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Power Dialer</span>
        </button>

        {/* Call Followups Tasks Button */}
        <button
          onClick={() => { if (onNavigateToTab) onNavigateToTab('tasks'); }}
          className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            currentView === 'tasks' 
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
          title="Call Followups Tasks"
        >
          <Timer className="w-4 h-4" />
        </button>

        {/* Notification Bell Button */}
        <button
          onClick={() => { if (onShowToast) onShowToast('Notifications'); }}
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer relative shadow-2xs"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {pendingFollowUpsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          )}
        </button>

        {/* User Account Switcher Popover */}
        <div className="relative" ref={userDropdownRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-all shadow-2xs group font-sans font-normal"
            title="Switch User Account / Role Persona"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-medium text-xs flex items-center justify-center shadow-2xs overflow-hidden ring-1 ring-slate-200">
              {activeAgent.avatar ? (
                <img src={activeAgent.avatar} alt={activeAgent.name} className="w-full h-full object-cover" />
              ) : (
                activeAgent.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-none pr-1">
              <span className="text-xs font-medium text-slate-800 truncate max-w-[120px]">{activeAgent.name}</span>
              <span className={`text-[10px] font-normal mt-0.5 ${isAgentAdmin(activeAgent) ? 'text-indigo-600' : 'text-slate-500'}`}>
                {isAgentAdmin(activeAgent) ? 'Admin' : activeAgent.role || 'Employee'}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180 text-indigo-600' : ''}`} />
          </button>

          {/* User Account Selection Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in text-xs font-sans font-normal">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider font-sans">Active User Account</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-medium text-slate-900 truncate">{activeAgent.name}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase ${
                    isAgentAdmin(activeAgent) ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {isAgentAdmin(activeAgent) ? 'Admin' : 'Employee'}
                  </span>
                </div>
              </div>

              <div className="px-2 py-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider font-sans">
                Switch User Persona
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {agents.map((ag) => {
                  const agIsAdmin = isAgentAdmin(ag);
                  const isSelected = ag.id === activeAgent.id;
                  return (
                    <button
                      key={ag.id}
                      onClick={() => {
                        onSelectAgent(ag.id);
                        setIsUserMenuOpen(false);
                        if (onShowToast) {
                          onShowToast(`Switched user account to ${ag.name} (${agIsAdmin ? 'Admin' : 'Employee'})`);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-50/90 border border-indigo-200 text-indigo-950 font-medium' 
                          : 'hover:bg-slate-50 text-slate-700 font-normal'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <img src={ag.avatar} alt={ag.name} className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-medium text-slate-900 truncate">{ag.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{ag.role || (agIsAdmin ? 'Admin' : 'Employee')}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-medium shrink-0 ml-1 ${
                        agIsAdmin ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {agIsAdmin ? 'Admin' : 'Employee'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
