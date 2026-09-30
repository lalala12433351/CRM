import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  BellRing, 
  Menu, 
  X, 
  Search, 
  Megaphone, 
  UserPlus, 
  GitBranch, 
  Trophy, 
  Inbox, 
  BarChart3, 
  Link2, 
  Globe, 
  FileText, 
  Settings, 
  UserCheck, 
  ChevronRight,
  Plus,
  PhoneCall,
  Smartphone,
  FileSpreadsheet,
  Kanban
} from 'lucide-react';
import { TabType } from './Sidebar';
import { ReportsSubTab, AutomationsSubTab } from '../pages';
import { Agent, isAgentAdmin } from '../types';
import { UserAvatar } from './UserAvatar';
import { formatArcleName } from '../utils/brandUtils';
import { isNative, nativePlatform } from '../lib/platform';
import { useBackHandler } from '../lib/backHandler';

interface MobileBottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType, subTab?: ReportsSubTab | AutomationsSubTab) => void;
  unassignedLeadsCount: number;
  pendingFollowUpsCount: number;
  activeAgent: Agent;
  agents: Agent[];
  companyName?: string;
  onSelectAgent: (agentId: string) => void;
  onOpenAddLeadModal?: () => void;
  onOpenGoogleSheets?: () => void;
  onOpenPowerDialer?: () => void;
  onOpenAiCopilot?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  unassignedLeadsCount,
  pendingFollowUpsCount,
  activeAgent,
  agents,
  companyName,
  onSelectAgent,
  onOpenAddLeadModal,
  onOpenGoogleSheets,
  onOpenPowerDialer,
  onOpenAiCopilot
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [showIosInstallGuide, setShowIosInstallGuide] = useState(false);

  useBackHandler(isDrawerOpen, () => setIsDrawerOpen(false));

  useEffect(() => {
    if (!isDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsDrawerOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isDrawerOpen]);

  // Grouped Navigation Items for Mobile Menu
  const navigationCategories = [
    {
      title: 'Core CRM & Leads',
      items: [
        { id: 'pipeline' as TabType, label: 'Pipeline Deals', icon: Kanban, desc: 'Kanban stages & deal flow' },
        { id: 'add_lead' as TabType, label: 'Add Lead Page', icon: UserPlus, desc: 'Quick lead capture form' },
        { id: 'campaigns' as TabType, label: 'Campaigns', icon: Megaphone, desc: 'WhatsApp & Meta ad campaigns' },
        { id: 'team' as TabType, label: 'Users & Team', icon: Users, desc: 'Team members and reporting structure' }
      ]
    },
    {
      title: 'Conversations & Automations',
      items: [
        { id: 'whatsapp' as TabType, label: 'WhatsApp CRM', icon: MessageSquare, desc: 'Chat sync & template broadcasts' },
        { id: 'workflows' as TabType, label: 'Automations', icon: GitBranch, desc: 'Drips & webhook triggers' },
        { id: 'reports' as TabType, label: 'Reports & Rankings', icon: Trophy, desc: 'Leaderboard & call recordings' }
      ]
    },
    {
      title: 'Analytics & Tools',
      items: [
        { id: 'analytics' as TabType, label: 'Analytics & CPL', icon: BarChart3, desc: 'Conversion charts & ad spend' },
        { id: 'integrations' as TabType, label: 'Integrations', icon: Link2, desc: '25 Sync integrations' },
        { id: 'marketing' as TabType, label: 'Marketing Webhooks', icon: Globe, desc: 'Webhook simulators' },
        { id: 'docs_sign' as TabType, label: 'Docs & E-Sign', icon: FileText, desc: 'Proposals & agreements' },
        ...(isNative ? [{ id: 'device_permissions' as TabType, label: 'Device Permissions', icon: Smartphone, desc: 'Calling, notifications & recordings' }] : []),
        { id: 'settings' as TabType, label: 'Settings & Billing', icon: Settings, desc: 'Buy licenses, GST & pipelines' }
      ]
    }
  ];

  const isAdmin = isAgentAdmin(activeAgent);
  const activeRole = (activeAgent.role || '').toLowerCase();
  const isManager = activeRole === 'manager' || activeRole.includes('manager');
  const isTelecaller = !isAdmin && !isManager;

  const filteredCategories = navigationCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => {
      if (['workflows', 'integrations', 'settings'].includes(item.id) && !isAdmin) return false;
      if (item.id === 'team' && !isAdmin) return false;
      if (isTelecaller && ['pipeline', 'reports', 'analytics', 'campaigns', 'marketing'].includes(item.id)) return false;
      return (
        item.label.toLowerCase().includes(mobileSearchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(mobileSearchQuery.toLowerCase())
      );
    })
  })).filter(cat => cat.items.length > 0);

  const handleSelectNavTab = (tab: TabType, subTab?: ReportsSubTab | AutomationsSubTab) => {
    setActiveTab(tab, subTab);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Fixed mobile bottom navigation */}
      <nav
        aria-label="Primary mobile navigation"
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 md:hidden pb-safe shadow-lg select-none hide-on-keyboard"
      >
        <div className="grid grid-cols-5 items-stretch min-h-[60px] px-1">
          {/* Tab 1: Dashboard */}
          <button
            type="button"
            onClick={() => handleSelectNavTab('dashboard')}
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
            className={`touch-target pressable flex flex-col items-center justify-center rounded-xl py-1 select-none cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 active:bg-slate-100'
            }`}
          >
            <div className="relative">
              <LayoutDashboard className="w-5 h-5" />
              {activeTab === 'dashboard' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-noto">Home</span>
          </button>

          {/* Tab 2: Leads */}
          <button
            type="button"
            onClick={() => handleSelectNavTab('leads')}
            aria-current={activeTab === 'leads' ? 'page' : undefined}
            className={`touch-target pressable flex flex-col items-center justify-center rounded-xl py-1 select-none cursor-pointer ${
              activeTab === 'leads' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 active:bg-slate-100'
            }`}
          >
            <div className="relative">
              <Users className="w-5 h-5" />
              {unassignedLeadsCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 bg-purple-600 text-white text-[8px] font-mono font-bold rounded-full border border-white">
                  {unassignedLeadsCount}
                </span>
              )}
              {activeTab === 'leads' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-noto">Leads</span>
          </button>

          {/* Tab 3: Unified Inbox (replacing WhatsApp for mobile devices) */}
          <button
            type="button"
            onClick={() => handleSelectNavTab('inbox')}
            aria-current={activeTab === 'inbox' ? 'page' : undefined}
            className={`touch-target pressable flex flex-col items-center justify-center rounded-xl py-1 select-none cursor-pointer ${
              activeTab === 'inbox' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 active:bg-slate-100'
            }`}
          >
            <div className="relative">
              <Inbox className="w-5 h-5" />
              {activeTab === 'inbox' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-noto">Inbox</span>
          </button>

          {/* Tab 4: Follow-Ups */}
          <button
            type="button"
            onClick={() => handleSelectNavTab('followups')}
            aria-current={activeTab === 'followups' ? 'page' : undefined}
            className={`touch-target pressable flex flex-col items-center justify-center rounded-xl py-1 select-none cursor-pointer ${
              activeTab === 'followups' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 active:bg-slate-100'
            }`}
          >
            <div className="relative">
              <BellRing className="w-5 h-5" />
              {pendingFollowUpsCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-indigo-600 text-white text-[8px] font-mono font-bold rounded-full flex items-center justify-center border border-white">
                  {pendingFollowUpsCount}
                </span>
              )}
              {activeTab === 'followups' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-noto">Calls</span>
          </button>

          {/* Tab 5: All Views / Drawer Menu */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isDrawerOpen}
            className={`touch-target pressable flex flex-col items-center justify-center rounded-xl py-1 select-none cursor-pointer ${
              isDrawerOpen ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 active:bg-slate-100'
            }`}
          >
            <div className="relative">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-noto">Menu</span>
          </button>
        </div>
      </nav>

      {/* Native-style slide-up navigation sheet */}
      {isDrawerOpen && (
        <div 
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-[60] md:hidden bg-slate-900/60 flex flex-col justify-end animate-in fade-in duration-200 cursor-pointer"
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            className="bg-white rounded-t-3xl max-h-[88dvh] flex flex-col w-full shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe font-noto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Drag Handle Header */}
            <div className="pt-3 pb-2 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2.5" />
              
              <div className="flex items-center space-x-2 pt-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {companyName ? (companyName.replace(/^ARCLE\s*[-–|:]\s*/i, '').trim().charAt(0).toUpperCase() || 'A') : 'A'}
                </div>
                <div>
                  <h3 id="mobile-menu-title" className="text-xs font-bold text-slate-900 font-sans">
                    {formatArcleName('ARCLE Mobile CRM', companyName)}
                  </h3>
                  <p className="text-[9px] text-slate-500">
                    {isNative ? `${nativePlatform === 'android' ? 'Android' : 'iOS'} App • All Views` : 'Mobile CRM • All Views'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 pt-1">
                {onOpenGoogleSheets && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenGoogleSheets();
                    }}
                    className="touch-target pressable px-2 rounded-xl bg-emerald-50 active:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center space-x-1 shadow-2xs"
                    title="Google Sheets Auto-Sync"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                    <span>Sheets</span>
                  </button>
                )}

                {onOpenAddLeadModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenAddLeadModal();
                    }}
                    className="touch-target pressable px-2.5 rounded-xl bg-white active:bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Lead</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close menu"
                  className="touch-target pressable rounded-full bg-slate-100 text-slate-600 active:bg-slate-200 cursor-pointer flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  aria-label="Search CRM views"
                  type="text"
                  placeholder="Search CRM tools, reports & views..."
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  className="w-full min-h-12 bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Scrollable Navigation Views */}
            <div className="overflow-y-auto p-4 space-y-4 flex-1 ios-scroll">
              
              {/* Quick AI & Call Tools Banner */}
              {(onOpenPowerDialer || onOpenAiCopilot) && (
                <div className="grid grid-cols-2 gap-2">
                  {onOpenAiCopilot && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        onOpenAiCopilot();
                      }}
                      className="touch-target pressable flex items-center space-x-2.5 p-2.5 rounded-xl bg-white border border-slate-200 active:bg-slate-100 text-slate-800 font-bold text-xs cursor-pointer text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                        <MessageSquare className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-bold text-xs leading-tight">AI Copilot</div>
                        <div className="text-[9px] text-slate-500 font-normal">Objection Buster</div>
                      </div>
                    </button>
                  )}

                  {onOpenPowerDialer && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        onOpenPowerDialer();
                      }}
                      className="touch-target pressable flex items-center space-x-2.5 p-2.5 rounded-xl bg-white border border-slate-200 active:bg-slate-100 text-slate-800 font-bold text-xs cursor-pointer text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                        <PhoneCall className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-bold text-xs leading-tight">Power Dialer</div>
                        <div className="text-[9px] text-slate-500 font-normal">Auto Call Queue</div>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Active Telecaller Switcher Strip */}
              {isAdmin && <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Telecaller</span>
                  <span className="text-[9px] text-slate-600 font-semibold">{activeAgent.name}</span>
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 ios-scroll">
                  {agents.map((ag) => (
                    <button
                      type="button"
                      key={ag.id}
                      onClick={() => onSelectAgent(ag.id)}
                      className={`touch-target pressable flex items-center space-x-1.5 px-2.5 rounded-xl text-[10px] font-semibold shrink-0 cursor-pointer ${
                        ag.id === activeAgent.id
                          ? 'bg-slate-800 text-white font-bold'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      <UserAvatar name={ag.name} avatarUrl={ag.avatar} size="xs" rounded="full" />
                      <span>{ag.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>}

              {/* PWA install guidance is only relevant in the mobile browser. */}
              {!isNative && <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-indigo-950">Add to iPhone Home Screen</p>
                    <p className="text-[9px] text-indigo-700">Tap Share in Safari ➔ Add to Home Screen</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIosInstallGuide(!showIosInstallGuide)}
                  className="touch-target pressable px-2 text-[9px] font-bold text-indigo-600 underline cursor-pointer shrink-0"
                >
                  {showIosInstallGuide ? 'Hide' : 'Info'}
                </button>
              </div>}

              {!isNative && showIosInstallGuide && (
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] space-y-1 animate-in fade-in">
                  <p className="font-bold text-amber-400">📲 How to install as iOS App:</p>
                  <p>1. Open this link in <strong>Safari</strong> on your iPhone or iPad.</p>
                  <p>2. Tap the <strong>Share button</strong> at the bottom center of Safari.</p>
                  <p>3. Scroll down and tap <strong>"Add to Home Screen"</strong>.</p>
                </div>
              )}

              {/* Categorized Views List */}
              {filteredCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">
                    {cat.title}
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => handleSelectNavTab(item.id)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`touch-target pressable w-full flex items-center justify-between px-3.5 py-2.5 text-left cursor-pointer ${
                            isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'active:bg-white text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0 pr-2">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              isActive ? 'bg-slate-200 text-slate-700' : 'bg-white border border-slate-200 text-slate-600'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 truncate block">{item.label}</span>
                              <p className="text-[9px] text-slate-500 truncate">{item.desc}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
