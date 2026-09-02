import React, { useState } from 'react';
import { 
  Inbox, 
  MessageSquare, 
  Mail, 
  Send, 
  Sparkles, 
  User, 
  ShieldCheck, 
  Search, 
  ArrowLeft, 
  PhoneCall, 
  CheckCheck,
  Filter
} from 'lucide-react';
import { Lead, WhatsAppMessage } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface OmnichannelInboxProps {
  leads: Lead[];
  messages: WhatsAppMessage[];
  onSendMessage: (leadId: string, text: string) => void;
  onOpenLeadDetail?: (lead: Lead) => void;
  onCallLead?: (lead: Lead) => void;
}

export const OmnichannelInboxPage: React.FC<OmnichannelInboxProps> = ({
  leads,
  messages,
  onSendMessage,
  onOpenLeadDetail,
  onCallLead,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [channelFilter, setChannelFilter] = useState<string>('whatsapp');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.company && lead.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    const sourceLower = (lead.source || '').toLowerCase();
    const tagsLower = (lead.tags || []).map(t => t.toLowerCase());

    if (channelFilter === 'whatsapp') {
      return sourceLower.includes('whatsapp') || tagsLower.some(t => t.includes('whatsapp'));
    }
    if (channelFilter === 'instagram') {
      return sourceLower.includes('instagram') || tagsLower.some(t => t.includes('instagram'));
    }
    if (channelFilter === 'facebook') {
      return sourceLower.includes('facebook') || sourceLower.includes('meta') || tagsLower.some(t => t.includes('facebook') || t.includes('meta'));
    }
    if (channelFilter === 'email') {
      return Boolean(lead.email && lead.email.trim());
    }
    if (channelFilter === 'sms') {
      return Boolean(lead.phone && lead.phone.trim());
    }
    return true;
  });

  const selectedLead = (selectedLeadId ? filteredLeads.find((l) => l.id === selectedLeadId) : null) || filteredLeads[0] || null;
  const conversationMessages = selectedLead ? messages.filter((m) => m.leadId === selectedLead.id) : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedLead) return;
    onSendMessage(selectedLead.id, replyText);
    setReplyText('');
  };

  const handleAiReply = async () => {
    if (!selectedLead) return;
    setGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/generate-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: selectedLead.name,
          company: selectedLead.company,
          product: 'CRM Omnichannel Suite',
          stage: selectedLead.status
        })
      });
      const data = await res.json();
      if (data.message) setReplyText(data.message);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSelectLeadMobile = (leadId: string) => {
    setSelectedLeadId(leadId);
    setMobileShowThread(true);
  };

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-3 text-slate-800 font-sans pb-20 md:pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Inbox className="w-5 h-5 text-[#3a2088]" />
            <h1 className="text-sm sm:text-base font-bold text-slate-900 font-['Poppins',sans-serif]">Unified Inbox</h1>
          </div>
        </div>

        {/* Channel filter chips (Only actual channels, no 'All Channels') */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {['whatsapp', 'instagram', 'facebook', 'email', 'sms'].map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all shrink-0 ${
                channelFilter === ch 
                  ? 'bg-[#3a2088] text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inbox Box */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-12 min-h-[560px] max-h-[calc(100vh-14rem)]">
        {/* Left Column: Conversations List (Hidden on mobile if viewing thread) */}
        <div className={`${mobileShowThread ? 'hidden md:flex' : 'flex'} md:col-span-4 lg:col-span-4 flex-col border-r border-slate-200/80 bg-slate-50/50`}>
          {/* Search Input */}
          <div className="p-3 border-b border-slate-200/80 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] focus:ring-1 focus:ring-[#3a2088]"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredLeads.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-['Poppins',sans-serif]">
                No matching conversations found.
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const leadMsgs = messages.filter((m) => m.leadId === lead.id);
                const lastMsg = leadMsgs[leadMsgs.length - 1];
                const isSelected = lead.id === selectedLead?.id;

                return (
                  <div
                    key={lead.id}
                    onClick={() => handleSelectLeadMobile(lead.id)}
                    className={`p-3.5 rounded-xl border transition-all my-1 mx-1 cursor-pointer flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-slate-100/90 border-slate-400 shadow-2xs ring-1 ring-slate-300'
                        : 'bg-white border-slate-200/70 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-sm truncate font-['Poppins',sans-serif] ${isSelected ? 'font-extrabold text-[#3a2088]' : 'font-bold text-slate-900'}`}>
                          {lead.name}
                        </p>
                        <span className="text-[10px] font-semibold text-[#3a2088] shrink-0">
                          {lead.source}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-['Poppins',sans-serif]">
                        {lastMsg ? lastMsg.content : lead.company || lead.city || 'Incoming conversation'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{lead.ownerAgentName || 'Unassigned'}</span>
                        <span>₹{(lead.dealValue || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Thread & Composer (Visible on mobile if viewing thread) */}
        <div className={`${!mobileShowThread ? 'hidden md:flex' : 'flex'} md:col-span-8 lg:col-span-8 flex-col bg-white h-full`}>
          {selectedLead ? (
            <>
              {/* Thread Header */}
              <div className="p-3 sm:p-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileShowThread(false)}
                    className="md:hidden p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer shrink-0"
                    title="Back to inbox"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div 
                    className="flex items-center space-x-2.5 cursor-pointer group min-w-0"
                    onClick={() => onOpenLeadDetail && onOpenLeadDetail(selectedLead)}
                  >
                    <div className="min-w-0 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
                      <p className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#3a2088] truncate flex items-center space-x-1.5 font-['Poppins',sans-serif] tracking-tight">
                        <span className="truncate">{selectedLead.name}</span>
                        {selectedLead.company && (
                          <span className="text-xs text-slate-400 font-normal hidden sm:inline">({selectedLead.company})</span>
                        )}
                      </p>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 truncate mt-0.5">
                        <span>{selectedLead.phone}</span>
                        <span>•</span>
                        <StatusBadge status={selectedLead.status} size="xs" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {onCallLead && (
                    <button
                      onClick={() => onCallLead(selectedLead)}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center space-x-1 cursor-pointer shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Call</span>
                    </button>
                  )}
                  <button
                    onClick={() => onOpenLeadDetail && onOpenLeadDetail(selectedLead)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
                  >
                    View Lead
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 bg-slate-50/40 min-h-[300px]">
                {conversationMessages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs space-y-1">
                    <MessageSquare className="w-6 h-6 mx-auto text-slate-300" />
                    <p>No recorded messages in this thread yet.</p>
                    <p className="text-[11px]">Send a reply below or use AI Draft to begin conversation.</p>
                  </div>
                ) : (
                  conversationMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-xl text-xs space-y-1 shadow-xs ${
                          msg.direction === 'outbound'
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200/80'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <div className={`flex items-center justify-end space-x-1 text-[10px] ${msg.direction === 'outbound' ? 'text-indigo-200' : 'text-slate-400'}`}>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.direction === 'outbound' && <CheckCheck className="w-3 h-3 text-indigo-200" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Composer */}
              <form onSubmit={handleSend} className="p-2.5 sm:p-3 bg-white border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAiReply}
                    disabled={generatingAi}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all"
                  >
                    <Sparkles className={`w-3 h-3 text-indigo-600 ${generatingAi ? 'animate-spin' : ''}`} />
                    <span>{generatingAi ? 'Generating...' : 'AI Suggest Reply'}</span>
                  </button>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">Press Enter or click Send</span>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${selectedLead.name} via Omnichannel...`}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs flex items-center space-x-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 text-xs">
              Select a conversation from the left to view messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



export const OmnichannelInboxView = OmnichannelInboxPage;
export default OmnichannelInboxPage;
