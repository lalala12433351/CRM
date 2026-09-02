import React, { useState } from 'react';
import { Megaphone, Globe, CheckCircle2, Copy, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

interface MarketingViewProps {
  onSimulateWebhookLead: (source: string) => void;
}

export const MarketingPage: React.FC<MarketingViewProps> = ({ onSimulateWebhookLead }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string) => {
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            <span>Lead Capture Integrations & Webhooks Hub</span>
          </h1>
          <p className="text-xs text-slate-500">Zero-latency lead capture from Facebook Lead Ads, Google Ads, IndiaMart, JustDial, Sulekha, 99acres, and Web forms</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'IndiaMart Lead Manager', icon: '🛒', source: 'IndiaMart', status: 'Connected', key: 'indiamart-webhook-key-992' },
          { name: 'JustDial Inbound Leads', icon: '📞', source: 'JustDial', status: 'Connected', key: 'justdial-api-v2-771' },
          { name: '99acres Real Estate Portal', icon: '🏢', source: '99acres', status: 'Connected', key: '99acres-feed-key-881' },
          { name: 'Sulekha B2B Marketplace', icon: '💼', source: 'Sulekha', status: 'Connected', key: 'sulekha-push-8832' },
          { name: 'Facebook & Instagram Ads', icon: '📘', source: 'Facebook Ads', status: 'Connected', key: 'fb-lead-gen-token-441' },
          { name: 'Google Ads Search Leads', icon: '🔍', source: 'Google Ads', status: 'Connected', key: 'gads-conversion-webhook-001' },
        ].map((item) => (
          <div key={item.name} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{item.icon}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                ✓ {item.status}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
              <p className="text-xs text-slate-500">Real-time Lead Capture Endpoint</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono text-slate-800">
              <span className="truncate max-w-[180px] font-bold">{item.key}</span>
              <button
                onClick={() => handleCopy(item.key)}
                className="text-indigo-600 hover:text-indigo-800 font-sans text-[10px] font-bold cursor-pointer"
              >
                {copiedKey === item.key ? 'Copied!' : 'Copy Key'}
              </button>
            </div>

            <button
              onClick={() => onSimulateWebhookLead(item.source)}
              className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center justify-center space-x-1.5 shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600 group-hover:text-white" />
              <span>Simulate Webhook Lead Arrival</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};


export const MarketingView = MarketingPage;
export default MarketingPage;
