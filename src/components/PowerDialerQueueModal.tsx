import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  PhoneOff, 
  SkipForward, 
  Volume2, 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  Brain,
  FileText
} from 'lucide-react';
import { Lead, Agent, LeadStatus, formatDealValue } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatArcleName } from '../utils/brandUtils';

interface PowerDialerQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  activeAgent: Agent;
  companyName?: string;
  currency?: string;
  onSaveCallLog: (leadId: string, disposition: LeadStatus, notes: string, durationSec: number) => void;
  onSendMessage?: (leadId: string, text: string) => void;
  onUpdateLeadStatus?: (leadId: string, status: LeadStatus) => void;
}

export const PowerDialerQueueModal: React.FC<PowerDialerQueueModalProps> = ({
  isOpen,
  onClose,
  leads,
  activeAgent,
  companyName,
  currency = 'INR',
  onSaveCallLog,
  onUpdateLeadStatus,
}) => {
  const [queueIndex, setQueueIndex] = useState(0);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'fresh' | 'rnr' | 'hot'>('all');
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);

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

      if (e.code === 'Space') {
        e.preventDefault();
        if (callState === 'idle' || callState === 'ended') {
          handleStartCall();
        } else {
          handleEndCall();
        }
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleAdvanceNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, callState, currentLead]);

  if (!isOpen) return null;

  if (!currentLead) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 font-sans font-normal">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-center animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto border border-slate-200">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Power Dialer Queue Empty</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              There are currently no active leads in your call queue. Add or import new leads to start auto-dialing.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-md"
            >
              Close Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStartCall = () => {
    setCallState('calling');
    setCallDuration(0);
    setCountdown(null);

    setTimeout(() => {
      setCallState('connected');
    }, 1800);
  };

  const handleEndCall = () => {
    setCallState('ended');
    onSaveCallLog(currentLead.id, currentLead.status || 'Contacted', `Auto-logged power dialer call (${callDuration}s)`, callDuration);

    if (autoAdvance) {
      setCountdown(3);
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
    setCountdown(null);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 font-sans font-normal">
      <div 
        className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Bar (Bold Sans-Serif Theme) */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white text-slate-900 flex flex-wrap items-center justify-between border-b border-slate-200 gap-2">
          <div className="flex items-center min-w-0">
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-bold font-sans text-sm sm:text-base text-slate-900 tracking-tight truncate max-w-[160px] sm:max-w-none">
                  {formatArcleName('ARCLE Auto-Power Dialer Queue', companyName)}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                Lead {queueIndex + 1} of {queueLeads.length} • Agent: {activeAgent.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">
            {/* Filter Mode Selector */}
            <div className="flex items-center space-x-0.5 sm:space-x-1 bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200 text-xs font-sans">
              {(['all', 'fresh', 'rnr', 'hot'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setFilterMode(mode);
                    setQueueIndex(0);
                  }}
                  className={`px-2 sm:px-3 py-1 rounded-lg capitalize font-bold cursor-pointer transition-all text-[11px] sm:text-xs ${
                    filterMode === mode ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Split */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* LEFT 7 COLS: Current Lead Info & AI Script */}
          <div className="lg:col-span-7 p-6 space-y-5 bg-white">
            
            {/* Contact Card */}
            <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-2xs inline-flex">
                    <h3 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 tracking-tight">{currentLead.name}</h3>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center space-x-3 mt-2">
                    {currentLead.company && (
                      <span className="flex items-center space-x-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{currentLead.company}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentLead.city || 'India'}, {currentLead.state || ''}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold font-sans text-slate-900">
                    {formatDealValue(currentLead.dealValue || 0, currency)}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 inline-block mt-1">
                    {currentLead.source || 'Inbound'}
                  </span>
                </div>
              </div>

              {/* Phone Display Pill */}
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
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

            {/* AI Talking Points & Teleprompter Script */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold font-sans text-sm text-slate-900">AI Teleprompter Script</span>
                </div>
                {/* Working Interactive AI Summary Button */}
                <button
                  onClick={() => setShowAiSummaryModal(true)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] cursor-pointer transition-colors shadow-xs flex items-center space-x-1"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>AI Summary</span>
                </button>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-normal bg-white p-4 rounded-xl border border-slate-200">
                “Hi {currentLead.name.split(' ')[0]}, this is {activeAgent.name} following up on your recent enquiry regarding our CRM and automated WhatsApp dialer for {currentLead.company || 'your team'}. I wanted to quickly share our special pilot onboarding offer before the end of the month.”
              </p>
            </div>
          </div>

          {/* RIGHT 5 COLS: Live Calling Control & Next Lead */}
          <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-6 bg-white">
            
            {/* Live VoIP Call State Widget */}
            <div className="text-center space-y-4 my-auto">
              <div className="inline-flex flex-col items-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                  callState === 'calling' 
                    ? 'bg-amber-500 text-white animate-bounce ring-8 ring-amber-100'
                    : callState === 'connected'
                    ? 'bg-emerald-600 text-white ring-8 ring-emerald-100'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {callState === 'calling' ? (
                    <PhoneCall className="w-8 h-8 animate-pulse" />
                  ) : callState === 'connected' ? (
                    <Volume2 className="w-8 h-8" />
                  ) : (
                    <PhoneCall className="w-8 h-8" />
                  )}
                </div>

                <div className="mt-4">
                  <div className="text-xs font-bold font-sans uppercase tracking-wider text-slate-500">
                    {callState === 'calling' ? 'Ringing Prospect...' : callState === 'connected' ? 'Call in Progress' : 'READY TO DIAL'}
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-slate-900 mt-1">
                    {formatSeconds(callDuration)}
                  </div>
                </div>
              </div>

              {/* Audio Waveform Simulator */}
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
              <div className="flex items-center justify-center space-x-3 pt-2">
                {callState === 'idle' || callState === 'ended' ? (
                  <button
                    onClick={handleStartCall}
                    title="Call (Space)"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all flex items-center space-x-2"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all flex items-center space-x-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Call (Space)</span>
                  </button>
                )}

                {callState === 'connected' && (
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                      isMuted ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Actions: Auto-Advance toggle + Next Lead */}
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={e => setAutoAdvance(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Auto-advance after call</span>
                </label>

                {countdown !== null && (
                  <span className="font-bold text-indigo-600 animate-pulse">
                    Advancing in {countdown}s...
                  </span>
                )}
              </div>

              <button
                onClick={handleAdvanceNext}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-md flex items-center justify-center space-x-2"
              >
                <span>Next Lead in Queue (N)</span>
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Footer Legend */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-slate-500">
          <div className="flex items-center space-x-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">Space</kbd> Call / Hangup</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">N</kbd> Next</span>
          </div>
        </div>
      </div>

      {/* WORKING INTERACTIVE AI SUMMARY MODAL */}
      {showAiSummaryModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold font-sans text-slate-900">AI Lead & Sales Summary</h3>
              </div>
              <button onClick={() => setShowAiSummaryModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900">Prospect Profile & Intent</p>
                <p className="text-slate-700 leading-relaxed">
                  <span className="font-semibold">{currentLead.name}</span> ({currentLead.company || 'Enterprise Prospect'}) has shown high engagement via <span className="font-semibold">{currentLead.source}</span>. Estimated deal budget is <span className="font-semibold">{formatDealValue(currentLead.dealValue || 0, currency)}</span>.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900">Key Recommended Action Points</p>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>Highlight automated WhatsApp dialer onboarding offer.</li>
                  <li>Inquire about team size and current CRM software stack.</li>
                  <li>Schedule a 15-minute product walkthrough demo call.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="font-bold text-emerald-900">AI Product Fit Score:</span>
                <span className="font-bold text-emerald-700 text-sm">92% High Fit</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAiSummaryModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
