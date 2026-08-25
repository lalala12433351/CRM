import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  User, 
  PhoneCall, 
  Bot, 
  Sparkles, 
  Plus, 
  FileSpreadsheet, 
  TrendingUp, 
  MessageSquare, 
  Kanban, 
  Zap, 
  Clock, 
  Settings, 
  ArrowRight,
  X
} from 'lucide-react';
import { Lead, Agent } from '../types';
import { StatusBadge } from './StatusBadge';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  agents: Agent[];
  onSelectLead: (lead: Lead) => void;
  onNavigate: (view: string) => void;
  onAddNewLead: () => void;
  onOpenPowerDialer: () => void;
  onOpenAiCopilot: () => void;
  onOpenVoiceBot: () => void;
  onOpenGoogleSheets: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  leads,
  agents,
  onSelectLead,
  onNavigate,
  onAddNewLead,
  onOpenPowerDialer,
  onOpenAiCopilot,
  onOpenVoiceBot,
  onOpenGoogleSheets,
}) => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'auto' | 'phone' | 'name' | 'email' | 'text'>('auto');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Quick navigation shortcuts
  const navigationItems = [
    { id: 'nav-leads', type: 'nav', title: 'Leads & Status Analytics', subtitle: 'View leads and 15-stage status distribution chart', icon: TrendingUp, action: () => onNavigate('leads') },
    { id: 'nav-dialer', type: 'action', title: 'Launch Power Dialer Queue', subtitle: 'Auto-advancing call queue with AI prompter and hotkeys', icon: PhoneCall, action: () => onOpenPowerDialer() },
    { id: 'nav-copilot', type: 'action', title: 'Open AI Sales Copilot', subtitle: 'Objection handling, instant pitches, and battlecards', icon: Sparkles, action: () => onOpenAiCopilot() },
    { id: 'nav-voicebot', type: 'action', title: 'Run AI Voice Bot Simulator', subtitle: 'Autonomous outbound qualification call agent', icon: Bot, action: () => onOpenVoiceBot() },
    { id: 'nav-new-lead', type: 'action', title: 'Add New Inbound Lead', subtitle: 'Create a new contact with custom fields and deal value', icon: Plus, action: () => onAddNewLead() },
    { id: 'nav-pipeline', type: 'nav', title: 'Deals Pipeline (Kanban)', subtitle: 'Drag-and-drop revenue stages and forecast', icon: Kanban, action: () => onNavigate('pipeline') },
    { id: 'nav-whatsapp', type: 'nav', title: 'WhatsApp CRM & Broadcasts', subtitle: 'Templates, bulk campaigns, and verified messaging', icon: MessageSquare, action: () => onNavigate('whatsapp') },
    { id: 'nav-workflows', type: 'nav', title: 'Visual Workflow Builder', subtitle: 'Automate lead routing, drips, and round-robin assignment', icon: Zap, action: () => onNavigate('workflows') },
    { id: 'nav-sheets', type: 'action', title: 'Google Sheets 2-Way Sync', subtitle: 'Manage bidirectional spreadsheet webhooks', icon: FileSpreadsheet, action: () => onOpenGoogleSheets() },
    { id: 'nav-followups', type: 'nav', title: 'Pending Follow-Ups & Tasks', subtitle: 'Scheduled reminders, callbacks, and calendar alerts', icon: Clock, action: () => onNavigate('followups') },
    { id: 'nav-settings', type: 'nav', title: 'CRM Workspace Settings', subtitle: 'Custom fields, permissions, API keys, and accounts', icon: Settings, action: () => onNavigate('settings') },
  ];

  // Filter leads based on query & search mode (phone, name, email, text, auto)
  const filteredLeads = query.trim()
    ? leads.filter(l => {
        const q = query.toLowerCase().trim();
        if (searchMode === 'phone') return l.phone?.includes(q) || l.altPhone?.includes(q);
        if (searchMode === 'name') return l.name?.toLowerCase().includes(q);
        if (searchMode === 'email') return l.email?.toLowerCase().includes(q);
        if (searchMode === 'text') return l.notes?.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q);
        // Auto mode
        return (
          l.name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          (l.company && l.company.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q))
        );
      }).slice(0, 5)
    : [];

  const filteredNav = query.trim()
    ? navigationItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : navigationItems;

  const allResults = [
    ...filteredNav.map(n => ({ kind: 'nav' as const, data: n })),
    ...filteredLeads.map(l => ({ kind: 'lead' as const, data: l }))
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : allResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = allResults[selectedIndex];
        if (selected) {
          if (selected.kind === 'nav') {
            selected.data.action();
          } else {
            onSelectLead(selected.data);
          }
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allResults, onClose, onSelectLead]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-indigo-600 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, lead name, phone, or view (e.g. 'dialer', 'Priya', 'pipeline')..."
            className="flex-1 bg-transparent border-none text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded">ESC</span>
        </div>

        {/* Search Mode Options Bar */}
        <div className="flex items-center space-x-1.5 px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px] overflow-x-auto">
          <span className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider shrink-0 mr-0.5">Search By:</span>
          {[
            { id: 'auto', label: 'Auto (Smart)' },
            { id: 'phone', label: 'Phone' },
            { id: 'name', label: 'Name' },
            { id: 'email', label: 'Email' },
            { id: 'text', label: 'Text & Notes' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSearchMode(m.id as any)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                searchMode === m.id
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNav.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                Commands & Navigation
              </div>
              {filteredNav.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected ? 'bg-indigo-50/90 text-indigo-950 font-medium' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-900 truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    {isSelected && <ArrowRight className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Lead Results */}
          {filteredLeads.length > 0 && (
            <div className="pt-2 border-t border-slate-100 mt-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                Matching Contacts ({filteredLeads.length})
              </div>
              {filteredLeads.map((lead, idx) => {
                const itemIndex = filteredNav.length + idx;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <button
                    key={lead.id}
                    onClick={() => {
                      onSelectLead(lead);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected ? 'bg-indigo-50/90 text-indigo-950 font-medium' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-violet-100 text-violet-700'
                      }`}>
                        {lead.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-900 flex items-center space-x-2">
                          <span className="truncate">{lead.name}</span>
                          <StatusBadge status={lead.status} size="xs" />
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {lead.phone} • {lead.company || lead.city || 'Individual'} • ₹{(lead.dealValue || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {isSelected && <ArrowRight className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}

          {allResults.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching commands or leads found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-3">
            <span>Use <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">↵</kbd> to select</span>
          </div>
          <span className="font-semibold text-indigo-600">ARCLE CRM Command Center</span>
        </div>
      </div>
    </div>
  );
};
