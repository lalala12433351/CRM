import React, { useState } from 'react';
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
  Bot, 
  Trophy, 
  Inbox, 
  BarChart3, 
  Link2, 
  Globe, 
  FileText, 
  Settings, 
  UserCheck, 
  Sparkles,
  ChevronRight,
  Plus,
  PhoneCall,
  Smartphone,
  FileSpreadsheet
} from 'lucide-react';
import { TabType } from './Sidebar';
import { ReportsSubTab } from './ReportsView';
import { AutomationsSubTab } from './WorkflowsView';
import { Agent, isAgentAdmin } from '../types';
import { formatArcleName } from '../utils/brandUtils';

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

  // Grouped Navigation Items for Mobile Menu
  const navigationCategories = [
    {
      title: 'Core CRM & Leads',
      items: [
        { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard, desc: 'Sales overview & KPIs' },
        { id: 'leads' as TabType, label: 'Lead Database', icon: Users, desc: 'All incoming customer leads' },
        { id: 'add_lead' as TabType, label: 'Add Lead Page', icon: UserPlus, desc: 'Quick lead capture form' },
        { id: 'followups' as TabType, label: 'Follow-Ups Queue', icon: BellRing, desc: 'Due phone calls & alarms' },
        { id: 'campaigns' as TabType, label: 'Campaigns', icon: Megaphone, desc: 'WhatsApp & Meta ad campaigns' }
      ]
    },
    {
      title: 'Conversations & Automations',
      items: [
        { id: 'whatsapp' as TabType, label: 'WhatsApp CRM', icon: MessageSquare, desc: 'Chat sync & template broadcasts' },
        { id: 'inbox' as TabType, label: 'Unified Inbox', icon: Inbox, desc: 'Omnichannel chat messages' },
        { id: 'workflows' as TabType, label: 'Automations', icon: Bot, desc: 'AI drips & webhook triggers' },
        { id: 'reports' as TabType, label: 'Reports & Rankings', icon: Trophy, desc: 'Leaderboard & call recordings' }
      ]
    },
    {
      title: 'Analytics & Tools',
      items: [
        { id: 'analytics' as TabType, label: 'Analytics & CPL', icon: BarChart3, desc: 'Conversion charts & ad spend' },
        { id: 'integrations' as TabType, label: 'Integrations', icon: Link2, desc: '25 Sync integrations' },
        { id: 'marketing' as TabType, label: 'Marketing Webhooks', icon: Globe, desc: 'Webhook simulators' },
        { id: 'docs' as TabType, label: 'Docs & E-Sign', icon: FileText, desc: 'Proposals & agreements' },
        { id: 'settings' as TabType, label: 'Settings & Billing', icon: Settings, desc: 'Buy licenses, GST & pipelines' }
      ]
    }
  ];

  const isAdmin = isAgentAdmin(activeAgent);

  const filteredCategories = navigationCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => {
      if (item.id === 'integrations' && !isAdmin) return false;
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
      {/* FIXED iOS BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-slate-200 z-40 md:hidden pb-safe shadow-lg">
        <div className="grid grid-cols-5 items-center h-14 px-1">
          {/* Tab 1: Dashboard */}
          <button
            onClick={() => handleSelectNavTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
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
            onClick={() => handleSelectNavTab('leads')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              activeTab === 'leads' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
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
            onClick={() => handleSelectNavTab('inbox')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              activeTab === 'inbox' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
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
            onClick={() => handleSelectNavTab('followups')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              activeTab === 'followups' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
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
            onClick={() => setIsDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              isDrawerOpen ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-noto">Menu</span>
          </button>
        </div>
      </nav>

      {/* iOS NATIVE SLIDE-UP NAVIGATION SHEET / DRAWER */}
      {isDrawerOpen && (
        <div 
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-50 md:hidden bg-slate-900/60 flex flex-col justify-end animate-in fade-in duration-200 cursor-pointer"
        >
          <div 
            className="bg-white rounded-t-3xl max-h-[88vh] flex flex-col w-full shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe font-noto cursor-default"
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
                  <h3 className="text-xs font-bold text-slate-900 font-sans">
                    {formatArcleName('ARCLE Mobile CRM', companyName)}
                  </h3>
                  <p className="text-[9px] text-slate-500">iOS App Mode • All Views</p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 pt-1">
                {onOpenGoogleSheets && (
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenGoogleSheets();
                    }}
                    className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center space-x-1 shadow-2xs"
                    title="Google Sheets Auto-Sync"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                    <span>Sheets</span>
                  </button>
                )}

                {onOpenAddLeadModal && (
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenAddLeadModal();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold flex items-center space-x-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Lead</span>
                  </button>
                )}

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
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
                  type="text"
                  placeholder="Search CRM tools, reports & views..."
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
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
                      onClick={() => {
                        setIsDrawerOpen(false);
                        onOpenAiCopilot();
                      }}
                      className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer text-left transition-all active:scale-[0.98]"
                    >
                      <div className="p-1.5 rounded-lg bg-white/20 shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-xs leading-tight">AI Copilot</div>
                        <div className="text-[9px] text-violet-100 font-normal">Objection Buster</div>
                      </div>
                    </button>
                  )}

                  {onOpenPowerDialer && (
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        onOpenPowerDialer();
                      }}
                      className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-xs cursor-pointer text-left transition-all active:scale-[0.98]"
                    >
                      <div className="p-1.5 rounded-lg bg-white/20 shrink-0">
                        <PhoneCall className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-bold text-xs leading-tight">Power Dialer</div>
                        <div className="text-[9px] text-blue-100 font-normal">Auto Call Queue</div>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Active Telecaller Switcher Strip */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Telecaller</span>
                  <span className="text-[9px] text-indigo-600 font-semibold">{activeAgent.name}</span>
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 ios-scroll">
                  {agents.map((ag) => (
                    <button
                      key={ag.id}
                      onClick={() => onSelectAgent(ag.id)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold shrink-0 cursor-pointer transition-all ${
                        ag.id === activeAgent.id
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      <img src={ag.avatar} alt={ag.name} className="w-4 h-4 rounded-full object-cover" />
                      <span>{ag.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* iOS PWA Install Badge */}
              <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-indigo-950">Add to iPhone Home Screen</p>
                    <p className="text-[9px] text-indigo-700">Tap Share in Safari ➔ Add to Home Screen</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIosInstallGuide(!showIosInstallGuide)}
                  className="text-[9px] font-bold text-indigo-600 underline cursor-pointer shrink-0"
                >
                  {showIosInstallGuide ? 'Hide' : 'Info'}
                </button>
              </div>

              {showIosInstallGuide && (
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
                          key={item.id}
                          onClick={() => handleSelectNavTab(item.id)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-all cursor-pointer ${
                            isActive ? 'bg-indigo-50 text-indigo-950 font-bold' : 'hover:bg-white text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0 pr-2">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              isActive ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
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
