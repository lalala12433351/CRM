import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Target, 
  ShieldAlert, 
  Zap, 
  MessageSquare, 
  Swords, 
  TrendingUp, 
  HelpCircle,
  PhoneCall
} from 'lucide-react';
import { Lead, Agent } from '../types';
import { formatArcleName } from '../utils/brandUtils';

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  leads: Lead[];
  activeAgent: Agent;
  companyName?: string;
  onSendMessage?: (leadId: string, text: string) => void;
  onOpenLeadDetail?: (lead: Lead) => void;
}

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({
  isOpen,
  onClose,
  lead,
  leads,
  activeAgent,
  companyName,
  onSendMessage,
  onOpenLeadDetail,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(lead?.id || leads[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'objections' | 'pitch' | 'battlecard' | 'whatsapp' | 'scoring'>('objections');
  const [selectedObjection, setSelectedObjection] = useState<string>('pricing');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [customResponse, setCustomResponse] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const currentLead = leads.find(l => l.id === selectedLeadId) || lead || leads[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const OBJECTION_SCRIPTS = {
    pricing: {
      title: "Price Objection: 'Your solution is too expensive / out of budget'",
      talkTrack: `“I completely understand budget is top of mind, ${currentLead?.name?.split(' ')[0] || 'Sir'}. Most of our clients in ${currentLead?.city || 'your area'} felt the same initially. However, by replacing 3 disconnected tools (manual dialer, third-party WhatsApp broadcast, and Excel spreadsheets), ARCLE CRM typically saves teams over ₹25,000/month per agent while boosting lead contact rates by 3.5x within the first 14 days.”`,
      followUpAction: "Offer customized tiered pricing with 14-day zero-risk trial.",
      whatsappFollowUp: `Hi ${currentLead?.name?.split(' ')[0] || 'there'}, totally understand your budget considerations! Here is a 1-page ROI calculator showing how teams in ${currentLead?.company || 'your industry'} recover 100% of their investment within 3 weeks: https://arclecrm.io/roi-calculator`
    },
    send_whatsapp: {
      title: "Brush-Off: 'Send details on WhatsApp, I will check later'",
      talkTrack: `“Certainly, ${currentLead?.name?.split(' ')[0] || 'Sir'}, I am sending the exact brochure to your WhatsApp right now. But to ensure I only send the relevant pricing without cluttering your chat, are you currently focusing more on automated calling dialers or WhatsApp marketing campaigns?”`,
      followUpAction: "Keep lead on call for 30 seconds to confirm specific pain point before sending template.",
      whatsappFollowUp: `Hi ${currentLead?.name?.split(' ')[0] || 'there'} 👋! As promised, here is the direct link to our product walkthrough and pricing deck: https://arclecrm.io/deck. Let me know if 4 PM tomorrow works for a quick 5-min screen share? 🚀`
    },
    competitor: {
      title: "Competitor: 'We are already evaluating TeleCRM / LeadSquared / Zoho'",
      talkTrack: `“They are great legacy platforms! Where ARCLE CRM stands out is our native WhatsApp Cloud API integration with 0% markup, built-in AI Voice qualification agent, and real-time live calling queues that require zero technical setup. Teams switching to us save up to 40% on recurring monthly overhead.”`,
      followUpAction: "Send side-by-side feature comparison matrix over WhatsApp.",
      whatsappFollowUp: `Hi ${currentLead?.name?.split(' ')[0] || 'there'}, here is the transparent side-by-side feature & cost breakdown between ARCLE CRM and traditional CRMs: https://arclecrm.io/vs-comparison. Notice the native WhatsApp integration!`
    },
    not_interested: {
      title: "Timing: 'Not looking to change software right now'",
      talkTrack: `“Fair enough, timing is everything. Just so I don't follow up unnecessarily, is your team satisfied with your current lead contact speed and follow-up tracking, or should we reconnect next quarter?”`,
      followUpAction: "Schedule a non-intrusive reminder task 30 days out in ARCLE Follow-ups.",
      whatsappFollowUp: `Understood ${currentLead?.name?.split(' ')[0] || 'Sir'}. I've noted down to reconnect with you next month. In the meantime, here is our weekly Indian Sales Benchmarks Report for your reference: https://arclecrm.io/benchmarks`
    }
  };

  const handleAskCustom = async () => {
    if (!customQuery.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: currentLead?.name,
          company: currentLead?.company,
          product: 'ARCLE CRM Full Suite',
          stage: currentLead?.status,
          intent: customQuery
        })
      });
      const data = await res.json();
      setCustomResponse(data.message || 'AI response ready.');
    } catch (e) {
      setCustomResponse(`“Hi ${currentLead?.name}, based on your question regarding '${customQuery}', here is our expert recommendation: focus on automated follow-up triggers and immediate 30-second WhatsApp greetings to capture lead intent.”`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-400/40 flex items-center justify-center text-violet-200 shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">
                  {formatArcleName('ARCLE AI Sales Copilot', companyName)}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-violet-400/20 text-violet-200 text-[10px] font-semibold uppercase tracking-wider border border-violet-400/30">
                  Live Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-300">Real-time objection busters, elevator pitches, and high-conversion responses</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Selector Pill & Tabs Header */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          {/* Lead Selector Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">Active Prospect:</span>
            <select
              value={selectedLeadId}
              onChange={e => setSelectedLeadId(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-2xs"
            >
              {leads.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name} • {l.company || l.city || 'Lead'} (₹{(l.dealValue || 0).toLocaleString()}) - {l.status}
                </option>
              ))}
            </select>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('objections')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'objections' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Objection Buster
            </button>
            <button
              onClick={() => setActiveTab('pitch')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'pitch' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dynamic Pitch
            </button>
            <button
              onClick={() => setActiveTab('battlecard')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'battlecard' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Competitor Battlecard
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'whatsapp' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              WhatsApp Assistant
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: OBJECTION BUSTER */}
          {activeTab === 'objections' && (
            <div className="space-y-5">
              
              {/* Objection Category Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'pricing', label: '💰 Too Expensive / Budget' },
                  { id: 'send_whatsapp', label: '💬 Send on WhatsApp' },
                  { id: 'competitor', label: '⚔️ Using Competitor' },
                  { id: 'not_interested', label: '⏳ Not Right Now' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedObjection(item.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border cursor-pointer ${
                      selectedObjection === item.id 
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Selected Objection Card */}
              {OBJECTION_SCRIPTS[selectedObjection as keyof typeof OBJECTION_SCRIPTS] && (() => {
                const data = OBJECTION_SCRIPTS[selectedObjection as keyof typeof OBJECTION_SCRIPTS];
                return (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        <span>{data.title}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        Recommended Talk Track
                      </span>
                    </div>

                    {/* Spoken Script Box */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 relative group">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Live Telecalling Script:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        {data.talkTrack}
                      </p>
                      <button
                        onClick={() => handleCopy(data.talkTrack, `script-${selectedObjection}`)}
                        className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        {copiedId === `script-${selectedObjection}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Verbal Script</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* WhatsApp Follow-up text */}
                    <div className="bg-[#f0fdf4] rounded-xl border border-emerald-200 p-4">
                      <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Immediate WhatsApp Follow-Up Message:</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-mono bg-white p-2.5 rounded-lg border border-emerald-100">
                        {data.whatsappFollowUp}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => handleCopy(data.whatsappFollowUp, `wa-${selectedObjection}`)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                        >
                          {copiedId === `wa-${selectedObjection}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy WhatsApp Text</span>
                        </button>
                        {onSendMessage && currentLead && (
                          <button
                            onClick={() => {
                              onSendMessage(currentLead.id, data.whatsappFollowUp);
                              handleCopy(data.whatsappFollowUp, `wa-sent`);
                            }}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send to {currentLead.name.split(' ')[0]}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: DYNAMIC PITCH */}
          {activeTab === 'pitch' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-indigo-950 flex items-center space-x-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <span>30-Second Elevator Pitch for {currentLead?.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold bg-indigo-200/70 text-indigo-900 px-2 py-0.5 rounded">
                    Source: {currentLead?.source || 'Inbound'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-indigo-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  “Hi {currentLead?.name?.split(' ')[0] || 'there'}, this is {activeAgent.name} from {formatArcleName('ARCLE CRM', companyName)}. I noticed your interest in scaling your sales outreach for {currentLead?.company || 'your team'}. We help high-velocity Indian sales teams replace disconnected calling and WhatsApp tools with a single auto-advancing dialer that triples lead conversions in the first 2 weeks. Do you have 3 minutes to see how this works for your {currentLead?.city || 'current'} operations?”
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    Target Deal Value: <strong className="text-slate-900">₹{(currentLead?.dealValue || 0).toLocaleString()}</strong>
                  </div>
                  <button
                    onClick={() => handleCopy(`Hi ${currentLead?.name?.split(' ')[0]}, this is ${activeAgent.name} from ${formatArcleName('ARCLE CRM', companyName)}...`, 'pitch-copy')}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer shadow-2xs flex items-center space-x-1.5"
                  >
                    {copiedId === 'pitch-copy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Elevator Pitch</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BATTLECARD */}
          {activeTab === 'battlecard' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                <Swords className="w-4 h-4 text-indigo-600" />
                <span>ARCLE CRM vs Industry Competitors</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="font-bold text-xs text-slate-900 pb-1 border-b border-slate-100">vs. TeleCRM</div>
                  <div className="text-xs text-slate-600 space-y-1.5">
                    <p className="text-emerald-700 font-semibold">✓ Built-in AI Voice qualification bot</p>
                    <p className="text-emerald-700 font-semibold">✓ Zero markup on official WhatsApp Cloud API</p>
                    <p className="text-slate-600">✓ Real-time status analytics charts & custom dimension slicing</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="font-bold text-xs text-slate-900 pb-1 border-b border-slate-100">vs. LeadSquared</div>
                  <div className="text-xs text-slate-600 space-y-1.5">
                    <p className="text-emerald-700 font-semibold">✓ 5x faster onboarding (instant zero code)</p>
                    <p className="text-emerald-700 font-semibold">✓ 60% lower total cost of ownership</p>
                    <p className="text-slate-600">✓ Modern intuitive UI built for field & inside telecallers</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="font-bold text-xs text-slate-900 pb-1 border-b border-slate-100">vs. Zoho CRM</div>
                  <div className="text-xs text-slate-600 space-y-1.5">
                    <p className="text-emerald-700 font-semibold">✓ Dedicated Indian telecalling power dialer</p>
                    <p className="text-emerald-700 font-semibold">✓ Native IndiaMart & Facebook webhook integration</p>
                    <p className="text-slate-600">✓ Auto WhatsApp follow-up triggers without complex Deluge code</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHATSAPP ASSISTANT & CUSTOM PROMPT */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Custom Message / Objection Generator</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customQuery}
                    onChange={e => setCustomQuery(e.target.value)}
                    placeholder="e.g. Lead wants a 20% discount on 10 user licenses..."
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                  <button
                    onClick={handleAskCustom}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-[#3a2088] text-white rounded-xl text-xs font-semibold hover:bg-[#2c186b] cursor-pointer transition-colors shadow-2xs flex items-center space-x-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isGenerating ? 'Drafting...' : 'Generate'}</span>
                  </button>
                </div>

                {customResponse && (
                  <div className="bg-white p-3.5 rounded-xl border border-indigo-200 text-xs text-slate-800 leading-relaxed font-sans mt-3 relative">
                    <p>{customResponse}</p>
                    <button
                      onClick={() => handleCopy(customResponse, 'custom-copy')}
                      className="mt-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedId === 'custom-copy' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'custom-copy' ? 'Copied' : 'Copy Message'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>AI Model: <strong>Gemini 3.6 Flash Performance Engine</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
