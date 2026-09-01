import React, { useState } from 'react';
import {
  Settings,
  Globe,
  PhoneCall,
  Bot,
  ShieldAlert,
  Save,
  CheckCircle2,
  Bell,
  Clock,
  Lock,
  Database
} from 'lucide-react';

export function SystemSettingsView() {
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Settings State
  const [platformName, setPlatformName] = useState('Pixbe Sales Enterprise');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('USD');
  const [leadDistribution, setLeadDistribution] = useState('Round Robin (Equal Share)');
  
  // Toggles
  const [callRecording, setCallRecording] = useState(true);
  const [autoWhisper, setAutoWhisper] = useState(true);
  const [geminiLeadScoring, setGeminiLeadScoring] = useState(true);
  const [autoAiBot, setAutoAiBot] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('12');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Platform System Settings successfully saved!');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg flex items-center gap-2 border border-slate-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">System & Platform Settings</h2>
          <p className="text-xs text-slate-500">Configure global platform parameters, telephony, and AI integrations</p>
        </div>

        <button
          onClick={handleSaveAll}
          className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-slate-800 active:bg-slate-300 active:text-black transition-all cursor-pointer shadow-2xs self-start"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Settings</span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: General Platform Config */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Globe className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">General Workspace Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Default Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="America/New_York">America/New_York (EST -5:00)</option>
                <option value="Europe/London">Europe/London (GMT +0:00)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Primary Reporting Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Telephony & Dialer Operations */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <PhoneCall className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Telecalling & Lead Distribution</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Automatic Lead Ingestion Routing</label>
              <select
                value={leadDistribution}
                onChange={(e) => setLeadDistribution(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="Round Robin (Equal Share)">Round Robin (Equal Share)</option>
                <option value="Capacity Weighted (Based on Agent Target)">Capacity Weighted (Based on Agent Target)</option>
                <option value="Fastest Responder (First to Accept)">Fastest Responder (First to Accept)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-800">Auto Audio Call Recording</span>
                  <p className="text-[11px] text-slate-500">Record all inbound and outbound telecalls</p>
                </div>
                <input
                  type="checkbox"
                  checked={callRecording}
                  onChange={(e) => setCallRecording(e.target.checked)}
                  className="w-4 h-4 rounded text-black focus:ring-black"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-800">Manager Barge & Whisper</span>
                  <p className="text-[11px] text-slate-500">Allow live call listening for sales coaching</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoWhisper}
                  onChange={(e) => setAutoWhisper(e.target.checked)}
                  className="w-4 h-4 rounded text-black focus:ring-black"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: AI & Gemini Automation */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Bot className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">AI Intelligence & VoiceBot</h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
              <div>
                <span className="font-semibold text-slate-800">Gemini 2.0 Automated Lead Scoring</span>
                <p className="text-[11px] text-slate-500">Auto-score intent, deal size probability, and follow-up urgency</p>
              </div>
              <input
                type="checkbox"
                checked={geminiLeadScoring}
                onChange={(e) => setGeminiLeadScoring(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-black"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
              <div>
                <span className="font-semibold text-slate-800">AI Autonomous VoiceBot Outreach</span>
                <p className="text-[11px] text-slate-500">Call unassigned cold leads within 60s of ingestion</p>
              </div>
              <input
                type="checkbox"
                checked={autoAiBot}
                onChange={(e) => setAutoAiBot(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-black"
              />
            </label>
          </div>
        </div>

        {/* Section 4: Security & Compliance */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Security & Authentication Policies</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
              <div>
                <span className="font-semibold text-slate-800">Mandatory 2FA</span>
                <p className="text-[11px] text-slate-500">Require OTP for all administrative logins</p>
              </div>
              <input
                type="checkbox"
                checked={twoFactorAuth}
                onChange={(e) => setTwoFactorAuth(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-black"
              />
            </label>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Session Inactivity Timeout (Hours)</label>
              <input
                type="number"
                value={sessionTimeoutHours}
                onChange={(e) => setSessionTimeoutHours(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
