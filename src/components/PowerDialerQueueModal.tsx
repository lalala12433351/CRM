import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, 
  PhoneOff, 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  Mic, 
  MicOff, 
  MessageSquare, 
  Clock, 
  User, 
  MapPin, 
  Building, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Send, 
  Tag, 
  AlertCircle,
  FileText,
  ChevronRight,
  Flame,
  Zap,
  Info
} from 'lucide-react';
import { Lead, Agent, CallRecord, LeadStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface PowerDialerQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  activeAgent: Agent;
  onSaveCallLog: (leadId: string, disposition: LeadStatus, notes: string, durationSec: number) => void;
  onSendMessage?: (leadId: string, text: string) => void;
  onUpdateLeadStatus?: (leadId: string, status: LeadStatus) => void;
}

export const PowerDialerQueueModal: React.FC<PowerDialerQueueModalProps> = ({
  isOpen,
  onClose,
  leads,
  activeAgent,
  onSaveCallLog,
  onSendMessage,
  onUpdateLeadStatus,
}) => {
  const [queueIndex, setQueueIndex] = useState(0);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedDisposition, setSelectedDisposition] = useState<LeadStatus | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'fresh' | 'rnr' | 'hot'>('all');

  // Filter queue leads
  const queueLeads = React.useMemo(() => {
    return leads.filter(l => {
      if (filterMode === 'fresh') return l.status === 'Fresh' || l.status === 'New Lead';
      if (filterMode === 'rnr') return l.status === 'RNR';
      if (filterMode === 'hot') return l.aiRating === 'Hot' || (l.dealValue || 0) > 100000;
      return true;
    });
  }, [leads, filterMode]);

  const currentLead = queueLeads[queueIndex] || queueLeads[0];

  // Call timer interval
  useEffect(() => {
    let interval: any = null;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Countdown timer for auto-advance
  useEffect(() => {
    let timer: any = null;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      setCountdown(null);
      handleAdvanceNext();
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Prevent hotkey if user is actively typing in the notes textarea
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (callState === 'idle' || callState === 'ended') {
          handleStartCall();
        } else {
          handleEndCall();
        }
      } else if (e.key === '1') {
        e.preventDefault();
        handleSelectDisposition('Interested');
      } else if (e.key === '2') {
        e.preventDefault();
        handleSelectDisposition('RNR');
      } else if (e.key === '3') {
        e.preventDefault();
        handleSelectDisposition('Follow Up');
      } else if (e.key === '4') {
        e.preventDefault();
        handleSelectDisposition('Lost');
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleAdvanceNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, callState, currentLead]);

  if (!isOpen || !currentLead) return null;

  const handleStartCall = () => {
    setCallState('calling');
    setCallDuration(0);
    setSelectedDisposition(null);
    setCountdown(null);

    // Simulate connection after 2 seconds
    setTimeout(() => {
      setCallState('connected');
    }, 1800);
  };

  const handleEndCall = () => {
    setCallState('ended');
    // Default disposition to Follow Up or RNR if call was under 5 seconds
    if (callDuration < 5) {
      setSelectedDisposition('RNR');
    }
  };

  const handleSelectDisposition = (disp: LeadStatus) => {
    setSelectedDisposition(disp);
    if (onUpdateLeadStatus && currentLead) {
      onUpdateLeadStatus(currentLead.id, disp);
    }
    onSaveCallLog(currentLead.id, disp, notes || `Call logged via Power Dialer queue. Duration: ${callDuration}s`, callDuration);

    if (autoAdvance) {
      setCountdown(3); // 3 seconds countdown to next lead
    }
  };

  const handleAdvanceNext = () => {
    if (queueIndex < queueLeads.length - 1) {
      setQueueIndex(prev => prev + 1);
    } else {
      setQueueIndex(0);
    }
    setCallState('idle');
    setCallDuration(0);
    setNotes('');
    setSelectedDisposition(null);
    setCountdown(null);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <PhoneCall className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm">ARCLE Auto-Power Dialer Queue</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                  VoIP Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Lead {queueIndex + 1} of {queueLeads.length} • Agent: {activeAgent.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter Mode Selector */}
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg text-xs">
              {(['all', 'fresh', 'rnr', 'hot'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setFilterMode(mode);
                    setQueueIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-md capitalize font-semibold cursor-pointer transition-all ${
                    filterMode === mode ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Split: Left Prospect Info & Script, Right Call Stage & Dispositions */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* LEFT 7 COLS: Current Lead Info, AI Talking Points & History */}
          <div className="lg:col-span-7 p-6 space-y-5 bg-[#f8fafc]">
            
            {/* Contact Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-slate-900">{currentLead.name}</h3>
                    {currentLead.aiRating === 'Hot' && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                        <Flame className="w-3 h-3" />
                        <span>Hot Lead</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center space-x-3 mt-1">
                    <span className="flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentLead.company || 'Individual Prospect'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentLead.city || 'India'}, {currentLead.state || ''}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    ₹{(currentLead.dealValue || 50000).toLocaleString()}
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    {currentLead.source || 'Inbound'}
                  </span>
                </div>
              </div>

              {/* Phone number display pill */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-500">Phone:</span>
                  <span className="text-sm font-bold text-slate-900 tracking-wide font-mono">{currentLead.phone}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-semibold text-slate-500">Status:</span>
                  <StatusBadge status={currentLead.status} size="xs" />
                </div>
              </div>
            </div>

            {/* AI Talking Points & Teleprompter */}
            <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>AI Teleprompter Script</span>
                </div>
                <span className="text-[10px] bg-indigo-200/60 text-indigo-900 px-2 py-0.5 rounded font-mono">
                  Contextual AI
                </span>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-xl border border-indigo-100">
                “Hi {currentLead.name.split(' ')[0]}, this is {activeAgent.name} following up on your recent enquiry regarding our enterprise CRM and automated WhatsApp dialer for {currentLead.company || 'your team'}. I wanted to quickly share our special pilot onboarding offer before the end of the month.”
              </p>

              {currentLead.aiReasoning && (
                <div className="text-[11px] text-indigo-800 bg-indigo-100/60 p-2 rounded-lg flex items-start space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{currentLead.aiReasoning}</span>
                </div>
              )}
            </div>

            {/* Call Notes Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Call Remarks / Conversation Notes:</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Type quick call notes (e.g. 'Requested pricing proposal, callback tomorrow at 3 PM')..."
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-2xs resize-none"
              />
            </div>
          </div>

          {/* RIGHT 5 COLS: Live Calling Stage, Waveform, Dispositions & Advance */}
          <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-6 bg-white">
            
            {/* Live VoIP Call State Widget */}
            <div className="text-center space-y-4">
              <div className="inline-flex flex-col items-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  callState === 'calling' 
                    ? 'bg-amber-500 text-white animate-bounce ring-8 ring-amber-100'
                    : callState === 'connected'
                    ? 'bg-emerald-600 text-white ring-8 ring-emerald-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {callState === 'calling' ? (
                    <PhoneCall className="w-8 h-8 animate-pulse" />
                  ) : callState === 'connected' ? (
                    <Volume2 className="w-8 h-8" />
                  ) : (
                    <PhoneCall className="w-8 h-8" />
                  )}
                </div>

                <div className="mt-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {callState === 'calling' ? 'Ringing Prospect...' : callState === 'connected' ? 'Call in Progress' : 'Ready to Dial'}
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                    {formatSeconds(callDuration)}
                  </div>
                </div>
              </div>

              {/* Audio Waveform Simulator when connected */}
              {callState === 'connected' && (
                <div className="flex items-center justify-center space-x-1 h-8">
                  {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 35, 70].map((h, i) => (
                    <span 
                      key={i} 
                      className="w-1 bg-indigo-600 rounded-full animate-pulse"
                      style={{ height: `${h}%`, animationDuration: `${0.4 + (i % 4) * 0.2}s` }}
                    />
                  ))}
                </div>
              )}

              {/* Dial / Hangup Master Button */}
              <div className="flex items-center justify-center space-x-3">
                {callState === 'idle' || callState === 'ended' ? (
                  <button
                    onClick={handleStartCall}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all flex items-center space-x-2"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Start Call (Space)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all flex items-center space-x-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Hang Up (Space)</span>
                  </button>
                )}

                {callState === 'connected' && (
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      isMuted ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Disposition Matrix (Hotkeys 1-4) */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Select Disposition:</span>
                <span className="text-slate-400 font-normal">Hotkeys 1–4</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: '1', label: 'Interested', status: 'Interested' as LeadStatus, color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' },
                  { key: '2', label: 'RNR / No Ans', status: 'RNR' as LeadStatus, color: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100' },
                  { key: '3', label: 'Follow Up', status: 'Follow Up' as LeadStatus, color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
                  { key: '4', label: 'Lost / Dead', status: 'Lost' as LeadStatus, color: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200' },
                ].map(item => (
                  <button
                    key={item.status}
                    onClick={() => handleSelectDisposition(item.status)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedDisposition === item.status ? 'ring-2 ring-indigo-600 ' + item.color : item.color
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded bg-black/10 flex items-center justify-center text-[10px] font-mono">
                        {item.key}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {selectedDisposition === item.status && <CheckCircle2 className="w-4 h-4 text-indigo-700" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Actions: Auto-Advance toggle + Next Lead */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={e => setAutoAdvance(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Auto-advance after disposition</span>
                </label>

                {countdown !== null && (
                  <span className="font-bold text-indigo-600 animate-pulse">
                    Advancing in {countdown}s...
                  </span>
                )}
              </div>

              <button
                onClick={handleAdvanceNext}
                className="w-full py-2.5 bg-[#3a2088] hover:bg-[#2c186b] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs flex items-center justify-center space-x-2"
              >
                <span>Next Lead in Queue (N)</span>
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Footer Hotkey Legend */}
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border font-mono text-[10px]">Space</kbd> Call / Hangup</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border font-mono text-[10px]">1-4</kbd> Dispositions</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border font-mono text-[10px]">N</kbd> Skip / Next</span>
          </div>
          <span className="font-semibold text-slate-700">Telecalling Velocity: 45 calls/hour</span>
        </div>
      </div>
    </div>
  );
};
