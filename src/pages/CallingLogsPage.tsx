import React, { useState } from 'react';
import { 
  PhoneCall, 
  Clock, 
  Sparkles, 
  FileText, 
  UserCheck, 
  MessageSquare, 
  Save, 
  Check, 
  Calendar, 
  Volume2, 
  Edit3, 
  CheckCircle2,
  Tag
} from 'lucide-react';
import { CallRecord } from '../types';
import { CallRecordingPlayer } from '../components/CallRecordingPlayer';
import { StatusBadge } from '../components/StatusBadge';

interface CallingLogsViewProps {
  callRecords: CallRecord[];
  onUpdateCallRecord?: (callId: string, updates: Partial<CallRecord>) => void;
}

export const CallingLogsPage: React.FC<CallingLogsViewProps> = ({ callRecords, onUpdateCallRecord }) => {
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [editingRemarksId, setEditingRemarksId] = useState<string | null>(null);
  const [tempRemarks, setTempRemarks] = useState<string>('');
  const [modalRemarks, setModalRemarks] = useState<string>('');
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    if (mins > 0) {
      return `${mins}m ${remainderSecs}s`;
    }
    return `${secs}s`;
  };

  const formatCallTime = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timestamp;
    }
  };

  const handleStartEditRemarks = (call: CallRecord) => {
    setEditingRemarksId(call.id);
    setTempRemarks(call.assigneeRemarks || call.notes || '');
  };

  const handleSaveInlineRemarks = (callId: string) => {
    if (onUpdateCallRecord) {
      onUpdateCallRecord(callId, {
        assigneeRemarks: tempRemarks,
        assigneeUpdatedAt: new Date().toISOString()
      });
    }
    setEditingRemarksId(null);
    setSavedSuccessId(callId);
    setTimeout(() => setSavedSuccessId(null), 2000);
  };

  const handleSaveModalRemarks = (callId: string) => {
    if (onUpdateCallRecord) {
      onUpdateCallRecord(callId, {
        assigneeRemarks: modalRemarks,
        assigneeUpdatedAt: new Date().toISOString()
      });
    }
    setSavedSuccessId(`modal-${callId}`);
    setTimeout(() => setSavedSuccessId(null), 2000);
  };

  const handleOpenModal = (call: CallRecord) => {
    setSelectedCall(call);
    setModalRemarks(call.assigneeRemarks || call.notes || '');
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>Call Logs, Audio Recordings & Transcripts</span>
            </h1>
            <span className="px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold">
              {callRecords.length} LOGS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed call history with duration, exact timestamps, playable recordings, AI transcripts, and assignee remarks.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono text-slate-800">
          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Total Talktime: {formatDuration(callRecords.reduce((acc, c) => acc + (c.durationSeconds || 0), 0))}</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-2.5">Lead Contact</th>
                <th className="px-3.5 py-2.5">Assignee Agent</th>
                <th className="px-3.5 py-2.5">Call Time & Duration</th>
                <th className="px-3.5 py-2.5 min-w-[220px]">Call Recording</th>
                <th className="px-3.5 py-2.5 min-w-[200px]">Assignee Remarks</th>
                <th className="px-3.5 py-2.5 text-right">Transcript & AI Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {callRecords.map((call) => (
                <tr key={call.id} className="hover:bg-slate-50 transition-all">
                  {/* Lead Details */}
                  <td className="px-3.5 py-3">
                    <p className="font-bold text-slate-900">{call.leadName}</p>
                    <p className="text-[10px] font-mono text-slate-500">{call.leadPhone}</p>
                    <div className="mt-1">
                      <StatusBadge status={call.disposition} size="xs" />
                    </div>
                  </td>

                  {/* Telecaller / Assignee */}
                  <td className="px-3.5 py-3">
                    <div className="flex items-center space-x-1.5 text-slate-900">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-bold text-xs">{call.agentName}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 capitalize">{call.type} Call</span>
                  </td>

                  {/* Call Time & Duration */}
                  <td className="px-3.5 py-3 font-mono text-[11px]">
                    <div className="flex items-center space-x-1 text-slate-700">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatCallTime(call.timestamp)}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-emerald-700 mt-1 font-bold">
                      <Clock className="w-3 h-3" />
                      <span>Duration: {formatDuration(call.durationSeconds)}</span>
                    </div>
                  </td>

                  {/* Call Recording Player */}
                  <td className="px-3.5 py-2.5">
                    <CallRecordingPlayer
                      recordingUrl={call.recordingUrl}
                      durationSeconds={call.durationSeconds}
                      callId={call.id}
                    />
                  </td>

                  {/* Assignee Remarks Area */}
                  <td className="px-3.5 py-2.5">
                    {editingRemarksId === call.id ? (
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={tempRemarks}
                          onChange={(e) => setTempRemarks(e.target.value)}
                          placeholder="Type assignee remarks..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex items-center space-x-1 justify-end">
                          <button
                            onClick={() => setEditingRemarksId(null)}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 hover:text-slate-900"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveInlineRemarks(call.id)}
                            className="px-2 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-bold flex items-center space-x-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEditRemarks(call)}
                        className="group relative bg-slate-50 border border-slate-200 hover:border-slate-300 p-2 rounded-lg cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5 font-mono">
                          <span className="font-bold text-slate-700">Assignee Remarks</span>
                          <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-slate-700" />
                        </div>
                        <p className="text-xs text-slate-700 italic line-clamp-2">
                          {call.assigneeRemarks ? `"${call.assigneeRemarks}"` : call.notes ? call.notes : 'Click to enter assignee remarks...'}
                        </p>
                        {savedSuccessId === call.id && (
                          <span className="text-[9px] text-emerald-700 font-mono font-bold flex items-center space-x-1 mt-1">
                            <Check className="w-3 h-3" />
                            <span>Saved!</span>
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* AI Summary & Transcript Trigger */}
                  <td className="px-3.5 py-3 text-right">
                    <button
                      onClick={() => handleOpenModal(call)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold cursor-pointer transition-all inline-flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Transcript & AI Summary</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Call Transcript, Recording & Assignee Remarks Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                    <span>Call Log & Transcript Details</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-800">
                    {selectedCall.disposition}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lead: <span className="text-slate-900 font-bold">{selectedCall.leadName}</span> ({selectedCall.leadPhone}) • Assignee: <span className="text-slate-900 font-bold">{selectedCall.agentName}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedCall(null)}
                className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Call Details Grid: Call Time & Duration */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Call Date & Time</span>
                  <span className="font-bold text-slate-900">{formatCallTime(selectedCall.timestamp)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Call Duration</span>
                  <span className="font-bold text-emerald-700">{formatDuration(selectedCall.durationSeconds)} ({selectedCall.durationSeconds} seconds)</span>
                </div>
              </div>

              {/* Call Recording Player */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-900 uppercase tracking-wider font-mono block">
                  Call Recording Playback
                </label>
                <CallRecordingPlayer
                  recordingUrl={selectedCall.recordingUrl}
                  durationSeconds={selectedCall.durationSeconds}
                  callId={selectedCall.id}
                />
              </div>

              {/* Assignee Remarks Input Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 font-mono text-[11px] flex items-center space-x-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Assignee Remarks & Follow-Up Notes</span>
                  </label>
                  {selectedCall.assigneeUpdatedAt && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Last saved: {new Date(selectedCall.assigneeUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  placeholder="Enter assignee remarks, action items, customer sentiment, or specific follow-up instructions..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Visible to assigned telecallers and sales managers</span>
                  <button
                    onClick={() => handleSaveModalRemarks(selectedCall.id)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer flex items-center space-x-1 shadow-2xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savedSuccessId === `modal-${selectedCall.id}` ? 'Saved Remarks!' : 'Save Remarks'}</span>
                  </button>
                </div>
              </div>

              {/* AI Summary */}
              {selectedCall.aiSummary && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
                  <p className="font-bold text-indigo-900 font-mono text-[11px] flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Executive Summary:</span>
                  </p>
                  <p className="text-indigo-950 leading-relaxed text-xs">{selectedCall.aiSummary}</p>
                </div>
              )}

              {/* Full Call Transcript */}
              {selectedCall.transcript && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900 font-mono text-[11px] block">
                    Full Line-by-Line AI Transcript
                  </label>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {selectedCall.transcript}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCall(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export const CallingLogsView = CallingLogsPage;
export default CallingLogsPage;
