import React, { useState } from 'react';
import { 
  BellRing, 
  Calendar, 
  Clock, 
  PhoneCall, 
  Phone,
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
  Check,
  FileText
} from 'lucide-react';
import { Lead, Agent, CallRecord } from '../types';
import { isAgentAdmin } from '../types';
import { CallRecordingPlayer } from './CallRecordingPlayer';
import { StatusBadge } from './StatusBadge';
import { LeadSummaryModal } from './LeadSummaryModal';

interface FollowUpsViewProps {
  leads: Lead[];
  agents: Agent[];
  callRecords: CallRecord[];
  activeAgent?: Agent | null;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onOpenLeadDetail: (lead: Lead) => void;
  onCallLead: (lead: Lead) => void;
  onSendMessage: (leadId: string, text: string) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  leads,
  agents,
  callRecords,
  activeAgent,
  onUpdateLead,
  onOpenLeadDetail,
  onCallLead,
  onSendMessage,
}) => {
  const isAdmin = isAgentAdmin(activeAgent);
  const [filterType, setFilterType] = useState<'today' | 'overdue' | 'upcoming' | 'all'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('ALL');
  
  // Modal for scheduling a new follow-up
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [summaryLead, setSummaryLead] = useState<Lead | null>(null);
  const [modalLeadId, setModalLeadId] = useState('');
  const [modalDateTime, setModalDateTime] = useState('');
  const [modalDueDay, setModalDueDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [modalHour, setModalHour] = useState('09');
  const [modalMinute, setModalMinute] = useState('00');
  const [modalAmPm, setModalAmPm] = useState<'AM' | 'PM'>('AM');
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

    let h = parseInt(modalHour, 10);
    if (modalAmPm === 'PM' && h !== 12) h += 12;
    if (modalAmPm === 'AM' && h === 12) h = 0;
    const combinedDate = `${modalDueDay}T${String(h).padStart(2, '0')}:${modalMinute}:00`;

    const selectedDateTime = new Date(combinedDate);
    const now = new Date();
    if (selectedDateTime < now) {
      alert('Cannot schedule a follow-up in the past. Please select a future date and time.');
      return;
    }

    onUpdateLead(modalLeadId, {
      status: 'Follow Up',
      followUpAt: combinedDate,
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

    const selectedDateTime = new Date(rescheduleDate);
    const now = new Date();
    if (selectedDateTime < now) {
      alert('Cannot reschedule a follow-up to a past date/time. Please select a future date and time.');
      return;
    }

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
      followUpAt: undefined,
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
              <Phone className="w-4 h-4 text-slate-500" />
              <span>Follow-Ups & Call Queue</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const defaultDate = new Date(Date.now() + 3600000);
              setModalDueDay(defaultDate.toISOString().slice(0, 10));
              let h = defaultDate.getHours();
              const period = h >= 12 ? 'PM' : 'AM';
              h = h % 12;
              if (h === 0) h = 12;
              setModalHour(String(h).padStart(2, '0'));
              setModalMinute(String(Math.round(defaultDate.getMinutes() / 5) * 5 % 60).padStart(2, '0'));
              setModalAmPm(period);
              setModalDateTime(defaultDate.toISOString().slice(0, 16));
              setShowScheduleModal(true);
            }}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-[#3a2088] hover:bg-[#2e196e] text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Follow-Up</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 font-sans font-normal">
        <button
          onClick={() => setFilterType('today')}
          className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
            filterType === 'today'
              ? 'bg-white border-2 border-indigo-600 ring-2 ring-indigo-100 shadow-md text-slate-900 font-bold'
              : 'bg-transparent border-2 border-slate-300 text-slate-700 hover:bg-white/50 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Due Today</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-sans text-slate-900 mt-0.5">{dueTodayLeads.length}</p>
        </button>

        <button
          onClick={() => setFilterType('overdue')}
          className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
            filterType === 'overdue'
              ? 'bg-white border-2 border-rose-600 ring-2 ring-rose-100 shadow-md text-slate-900 font-bold'
              : 'bg-transparent border-2 border-slate-300 text-slate-700 hover:bg-white/50 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Overdue</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-sans text-slate-900 mt-0.5">{overdueLeads.length}</p>
        </button>

        <button
          onClick={() => setFilterType('all')}
          className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-white border-2 border-slate-800 ring-2 ring-slate-200 shadow-md text-slate-900 font-bold'
              : 'bg-transparent border-2 border-slate-300 text-slate-700 hover:bg-white/50 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>All Scheduled</span>
            <Filter className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-sans text-slate-900 mt-0.5">{followUpLeads.length}</p>
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
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 pl-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] focus:ring-1 focus:ring-[#3a2088]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-500 font-semibold shrink-0">Assignee:</span>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#3a2088] focus:ring-1 focus:ring-[#3a2088] cursor-pointer font-medium w-full sm:w-auto"
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
          <div className="bg-transparent border border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No pending follow-ups</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All scheduled call follow-ups for this filter have been completed or rescheduled.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs font-sans">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold">Customer Name</th>
                    <th className="py-3.5 px-4 font-bold">Company</th>
                    <th className="py-3.5 px-4 font-bold">Phone Number</th>
                    <th className="py-3.5 px-4 font-bold">Email</th>
                    <th className="py-3.5 px-4 font-bold">Assignee Notes</th>
                    <th className="py-3.5 px-4 font-bold">Scheduled Time</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {displayedLeads.map((lead) => {
                    const isOverdue = lead.followUpAt && lead.followUpAt.slice(0, 10) < todayStr;
                    const isToday = lead.followUpAt && lead.followUpAt.slice(0, 10) === todayStr;

                    return (
                      <tr 
                        key={lead.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => onOpenLeadDetail(lead)}
                      >
                        {/* Customer Name */}
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <span className="font-bold font-sans text-slate-900 text-sm">{lead.name}</span>
                        </td>

                        {/* Company (No Individual badge!) */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {lead.company && lead.company !== 'Individual' && lead.company !== 'Not Specified' ? lead.company : '-'}
                        </td>

                        {/* Phone Number */}
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                          {lead.phone}
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="text-slate-800 font-medium truncate block max-w-[160px]">{lead.email || '-'}</span>
                        </td>

                        {/* Assignee Notes (No pen icon, No / Intent) */}
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                          <p className="line-clamp-2 text-[11px] text-slate-700">
                            {lead.notes
                              ? lead.notes
                                  .replace(/Added manually\.?\s*/gi, '')
                                  .replace(/\[Follow-up Remark\]:\s*/gi, '')
                                  .trim() || 'No remarks.'
                              : 'No remarks.'}
                          </p>
                        </td>

                        {/* Scheduled Time */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                            isOverdue ? 'bg-rose-50 border-rose-200 text-rose-800' :
                            isToday ? 'bg-amber-50 border-amber-200 text-amber-800' :
                            'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{formatFollowUpTime(lead.followUpAt)}</span>
                          </span>
                        </td>

                        {/* Status (Clean Pill) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={lead.status || 'Follow Up'} size="xs" />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => onCallLead(lead)}
                              className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs flex items-center space-x-1"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>Call</span>
                            </button>

                            {rescheduleLeadId === lead.id ? (
                              <div className="inline-flex items-center space-x-1">
                                <input
                                  type="datetime-local"
                                  value={rescheduleDate}
                                  min={new Date().toISOString().slice(0, 16)}
                                  onChange={(e) => setRescheduleDate(e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-[11px] text-slate-900 focus:outline-none"
                                />
                                <button
                                  onClick={() => handleQuickReschedule(lead.id)}
                                  className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setRescheduleLeadId(null)}
                                  className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] cursor-pointer"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setRescheduleLeadId(lead.id);
                                  setRescheduleDate(lead.followUpAt ? lead.followUpAt.slice(0, 16) : new Date().toISOString().slice(0, 16));
                                }}
                                className="py-1 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                              >
                                <Calendar className="w-3 h-3" />
                                <span>Reschedule</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleMarkCompleted(lead)}
                              className="py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Complete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Lead Call Brief / Summary */}
      {summaryLead && (
        <LeadSummaryModal
          lead={summaryLead}
          onClose={() => setSummaryLead(null)}
          onCallLead={onCallLead}
        />
      )}

      {/* Schedule / Mark Lead into Follow-Up Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-4 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-sans">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 font-sans tracking-tight">
                <Phone className="w-4 h-4 text-slate-500" />
                <span className="font-sans">Schedule Lead as Follow-Up</span>
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 font-sans cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 font-sans">
              {/* Lead Selector — admin only */}
              {isAdmin ? (
                <div>
                  <label className="block text-[11px] font-sans uppercase text-slate-600 font-bold mb-1 tracking-wider">SELECT LEAD</label>
                  <select
                    value={modalLeadId}
                    onChange={(e) => setModalLeadId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer font-sans font-medium"
                  >
                    <option value="" className="font-sans">Choose a Lead</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id} className="font-sans">
                        {l.name} - {l.phone} ({l.company || l.source})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-sans uppercase text-slate-600 font-bold mb-1 tracking-wider">SELECT LEAD</label>
                  <select
                    value={modalLeadId}
                    onChange={(e) => setModalLeadId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer font-sans font-medium"
                  >
                    <option value="" className="font-sans">Choose a Lead</option>
                    {leads
                      .filter((l) => l.ownerAgentId === activeAgent?.id || l.ownerAgentName === activeAgent?.name)
                      .map((l) => (
                        <option key={l.id} value={l.id} className="font-sans">
                          {l.name} - {l.phone} ({l.company || l.source})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-sans uppercase text-slate-600 font-bold mb-2 tracking-wider">SCHEDULED FOLLOW-UP DATE & TIME</label>
                <div className="space-y-2 font-sans text-xs">
                  {/* Date picker */}
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={modalDueDay}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setModalDueDay(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3a2088]"
                    />
                  </div>

                  {/* Time selector */}
                  <div className="flex items-center space-x-2">
                    {/* Hour */}
                    <div className="flex-1">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#3a2088] focus-within:ring-1 focus-within:ring-[#3a2088]/20">
                        <Clock className="w-3.5 h-3.5 text-slate-400 ml-2.5 shrink-0" />
                        <select
                          value={modalHour}
                          onChange={(e) => setModalHour(e.target.value)}
                          className="flex-1 bg-transparent px-2 py-2 text-xs text-slate-900 focus:outline-none cursor-pointer"
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const v = String(i + 1).padStart(2, '0');
                            return <option key={v} value={v}>{v}</option>;
                          })}
                        </select>
                      </div>
                    </div>

                    <span className="text-slate-400 font-bold text-sm">:</span>

                    {/* Minute */}
                    <div className="flex-1">
                      <select
                        value={modalMinute}
                        onChange={(e) => setModalMinute(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3a2088] cursor-pointer"
                      >
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    {/* AM/PM switcher */}
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden shrink-0">
                      {(['AM', 'PM'] as const).map((period) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setModalAmPm(period)}
                          className={`px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                            modalAmPm === period
                              ? 'bg-[#3a2088] text-white'
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formatted Date Preview */}
                  {modalDueDay && (
                    <div className="mt-1.5 font-sans">
                      <p className="text-[11px] font-semibold text-[#3a2088] bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md inline-flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#3a2088]" />
                        <span>
                          Scheduled: {new Date(`${modalDueDay}T${String(
                            modalAmPm === 'PM'
                              ? (parseInt(modalHour) === 12 ? 12 : parseInt(modalHour) + 12)
                              : (parseInt(modalHour) === 12 ? 0 : parseInt(modalHour))
                          ).padStart(2, '0')}:${modalMinute}:00`).toLocaleString('en-IN', {
                            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          })}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 font-sans">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-sans font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={!modalLeadId}
                className="px-4 py-1.5 rounded-lg bg-[#3a2088] hover:bg-[#2e196e] text-white font-sans font-bold disabled:opacity-50 shadow-2xs cursor-pointer"
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
