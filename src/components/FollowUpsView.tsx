import React, { useState } from 'react';
import { 
  BellRing, 
  Calendar, 
  Clock, 
  PhoneCall, 
  MessageSquare, 
  UserCheck, 
  CheckCircle2, 
  Plus, 
  Search, 
  Edit3, 
  AlertCircle, 
  ArrowRight,
  Filter,
  Sparkles,
  ChevronRight,
  Check
} from 'lucide-react';
import { Lead, Agent, CallRecord } from '../types';
import { CallRecordingPlayer } from './CallRecordingPlayer';
import { StatusBadge } from './StatusBadge';

interface FollowUpsViewProps {
  leads: Lead[];
  agents: Agent[];
  callRecords: CallRecord[];
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onOpenLeadDetail: (lead: Lead) => void;
  onCallLead: (lead: Lead) => void;
  onSendMessage: (leadId: string, text: string) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  leads,
  agents,
  callRecords,
  onUpdateLead,
  onOpenLeadDetail,
  onCallLead,
  onSendMessage,
}) => {
  const [filterType, setFilterType] = useState<'today' | 'overdue' | 'upcoming' | 'all'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('ALL');
  
  // Modal for scheduling a new follow-up
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [modalLeadId, setModalLeadId] = useState('');
  const [modalDateTime, setModalDateTime] = useState('');
  const [modalRemarks, setModalRemarks] = useState('');
  
  // Reschedule inline state
  const [rescheduleLeadId, setRescheduleLeadId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Filter leads that have followUpAt set or status === 'Follow Up'
  const followUpLeads = leads.filter(
    (l) => l.followUpAt || l.status === 'Follow Up'
  );

  // Categorize
  const dueTodayLeads = followUpLeads.filter(
    (l) => l.followUpAt && l.followUpAt.slice(0, 10) === todayStr
  );

  const overdueLeads = followUpLeads.filter(
    (l) => l.followUpAt && l.followUpAt.slice(0, 10) < todayStr
  );

  const upcomingLeads = followUpLeads.filter(
    (l) => l.followUpAt && l.followUpAt.slice(0, 10) > todayStr
  );

  // Filtered List
  const displayedLeads = followUpLeads.filter((l) => {
    // 1. Filter Category Tab
    if (filterType === 'today') {
      if (!l.followUpAt || l.followUpAt.slice(0, 10) !== todayStr) return false;
    } else if (filterType === 'overdue') {
      if (!l.followUpAt || l.followUpAt.slice(0, 10) >= todayStr) return false;
    } else if (filterType === 'upcoming') {
      if (!l.followUpAt || l.followUpAt.slice(0, 10) <= todayStr) return false;
    }

    // 2. Filter Agent
    if (selectedAgentId !== 'ALL' && l.ownerAgentId !== selectedAgentId) {
      return false;
    }

    // 3. Search Term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.company.toLowerCase().includes(q) ||
        (l.notes && l.notes.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const handleSaveSchedule = () => {
    if (!modalLeadId) return;
    const targetLead = leads.find((l) => l.id === modalLeadId);
    if (!targetLead) return;

    onUpdateLead(modalLeadId, {
      status: 'Follow Up',
      followUpAt: modalDateTime || new Date().toISOString(),
      notes: modalRemarks ? `${targetLead.notes ? targetLead.notes + '\n' : ''}[Follow-up Remark]: ${modalRemarks}` : targetLead.notes,
      updatedAt: new Date().toISOString()
    });

    setShowScheduleModal(false);
    setModalLeadId('');
    setModalDateTime('');
    setModalRemarks('');
  };

  const handleQuickReschedule = (leadId: string) => {
    if (!rescheduleDate) return;
    onUpdateLead(leadId, {
      status: 'Follow Up',
      followUpAt: rescheduleDate,
      updatedAt: new Date().toISOString()
    });
    setRescheduleLeadId(null);
    setRescheduleDate('');
  };

  const handleMarkCompleted = (lead: Lead) => {
    onUpdateLead(lead.id, {
      status: 'Contacted',
      updatedAt: new Date().toISOString()
    });
  };

  const formatFollowUpTime = (isoString?: string) => {
    if (!isoString) return 'Not Scheduled';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="p-2 sm:p-4 space-y-3 max-w-7xl mx-auto text-slate-800 font-sans pb-20 md:pb-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
              <BellRing className="w-4 h-4 text-amber-600" />
              <span>Follow-Ups & Call Queue</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
              {followUpLeads.length} Queued
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage due today, overdue, and upcoming lead follow-ups with 1-click dialer and WhatsApp messages.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setModalDateTime(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
              setShowScheduleModal(true);
            }}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Follow-Up</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          onClick={() => setFilterType('today')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
            filterType === 'today'
              ? 'bg-amber-50/80 border-amber-300 text-amber-900 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>Due Today</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{dueTodayLeads.length}</p>
        </button>

        <button
          onClick={() => setFilterType('overdue')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
            filterType === 'overdue'
              ? 'bg-rose-50/80 border-rose-300 text-rose-900 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>Overdue</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{overdueLeads.length}</p>
        </button>

        <button
          onClick={() => setFilterType('upcoming')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
            filterType === 'upcoming'
              ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>Upcoming</span>
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{upcomingLeads.length}</p>
        </button>

        <button
          onClick={() => setFilterType('all')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
            filterType === 'all'
              ? 'bg-slate-100 border-slate-300 text-slate-900 ring-2 ring-slate-400/20'
              : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>All Scheduled</span>
            <Filter className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{followUpLeads.length}</p>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search follow-ups by lead, phone, notes..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 pl-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-500 font-semibold shrink-0">Assignee:</span>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none cursor-pointer font-medium w-full sm:w-auto"
          >
            <option value="ALL">All Telecallers</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>{ag.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Follow-Up Leads Grid / List */}
      <div className="space-y-3">
        {displayedLeads.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center space-y-2 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No pending follow-ups</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All scheduled call follow-ups for this filter have been completed or rescheduled.
            </p>
          </div>
        ) : (
          displayedLeads.map((lead) => {
            const isOverdue = lead.followUpAt && lead.followUpAt.slice(0, 10) < todayStr;
            const isToday = lead.followUpAt && lead.followUpAt.slice(0, 10) === todayStr;
            const lastCall = callRecords.find((c) => c.leadId === lead.id);

            return (
              <div
                key={lead.id}
                className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 sm:p-4 transition-all shadow-xs space-y-3"
              >
                {/* Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isOverdue ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      isToday ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {lead.name.charAt(0)}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 onClick={() => onOpenLeadDetail(lead)} className="font-bold text-xs sm:text-sm text-slate-900 cursor-pointer hover:text-indigo-600 hover:underline truncate">
                          {lead.name}
                        </h3>
                        {lead.company && (
                          <span className="text-xs text-slate-500">({lead.company})</span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {lead.source}
                        </span>
                        <StatusBadge status={lead.status || 'Follow Up'} size="xs" />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-0.5">
                        <span className="flex items-center space-x-1 text-slate-600">
                          <span className="text-slate-400">Phone:</span>
                          <span className="font-semibold text-slate-900">{lead.phone}</span>
                        </span>

                        <span className="text-slate-300">•</span>

                        <span className="flex items-center space-x-1 text-indigo-700 font-medium">
                          <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span>{lead.ownerAgentName || 'Unassigned'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Time badge */}
                  <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                    <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 ${
                      isOverdue ? 'bg-rose-50 border-rose-200 text-rose-800' :
                      isToday ? 'bg-amber-50 border-amber-200 text-amber-800' :
                      'bg-slate-50 border-slate-200 text-slate-800'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatFollowUpTime(lead.followUpAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Lead Notes & Remarks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60 space-y-1">
                    <span className="text-[10px] uppercase text-slate-500 font-bold flex items-center space-x-1">
                      <Edit3 className="w-3 h-3 text-amber-600" />
                      <span>Assignee Notes / Intent</span>
                    </span>
                    <p className="text-slate-800 line-clamp-2">
                      {lead.notes || 'No specific follow-up remarks entered yet.'}
                    </p>
                  </div>

                  {/* Latest Call Recording & Transcript preview if exists */}
                  {lastCall ? (
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-800">Last Call ({lastCall.disposition})</span>
                        <span>{lastCall.durationSeconds}s</span>
                      </div>
                      <p className="text-xs text-slate-800 line-clamp-1">
                        {lastCall.assigneeRemarks ? `Remark: "${lastCall.assigneeRemarks}"` : lastCall.aiSummary ? `Summary: ${lastCall.aiSummary}` : lastCall.notes}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60 flex items-center justify-center text-xs text-slate-400">
                      <span>No previous call logs recorded</span>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                  <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:space-x-2">
                    {/* 1-Click Power Dialer */}
                    <button
                      onClick={() => onCallLead(lead)}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1 shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </button>

                    {/* WhatsApp Quick Reminder */}
                    <button
                      onClick={() => {
                        const msg = `Hi ${lead.name}, this is ${lead.ownerAgentName} following up regarding your inquiry with ${lead.company || 'our team'}. Are you available for a quick 2-minute call?`;
                        onSendMessage(lead.id, msg);
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Open Full Lead Detail */}
                    <button
                      onClick={() => onOpenLeadDetail(lead)}
                      className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Details</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    {/* Reschedule inline toggle */}
                    {rescheduleLeadId === lead.id ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="datetime-local"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-[11px] text-slate-900 focus:outline-none"
                        />
                        <button
                          onClick={() => handleQuickReschedule(lead.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-xs cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setRescheduleLeadId(null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setRescheduleLeadId(lead.id);
                          setRescheduleDate(lead.followUpAt ? lead.followUpAt.slice(0, 16) : new Date().toISOString().slice(0, 16));
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
                      >
                        Reschedule
                      </button>
                    )}

                    <button
                      onClick={() => handleMarkCompleted(lead)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule / Mark Lead into Follow-Up Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-4 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <BellRing className="w-4 h-4 text-amber-600" />
                <span>Mark / Schedule Lead as Follow-Up</span>
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 font-bold mb-1">Select Lead</label>
                <select
                  value={modalLeadId}
                  onChange={(e) => setModalLeadId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                >
                  <option value="">-- Choose a Lead --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} - {l.phone} ({l.company || l.source})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 font-bold mb-1">Scheduled Follow-Up Date & Time</label>
                <input
                  type="datetime-local"
                  value={modalDateTime}
                  onChange={(e) => setModalDateTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 font-bold mb-1">Assignee Follow-Up Remarks & Notes</label>
                <textarea
                  rows={3}
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  placeholder="Specify agenda for follow-up call, client instructions, or specific questions..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={!modalLeadId}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50 shadow-2xs"
              >
                Save & Move to Follow Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
