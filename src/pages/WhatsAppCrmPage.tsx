import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  FileText, 
  Zap, 
  CheckCircle2, 
  Plus, 
  Users, 
  BarChart2, 
  Clock, 
  Layers, 
  Settings, 
  Flame
} from 'lucide-react';
import { WhatsAppTemplate, WhatsAppCampaign, Lead } from '../types';

interface WhatsAppCrmViewProps {
  templates: WhatsAppTemplate[];
  campaigns: WhatsAppCampaign[];
  leads: Lead[];
  onAddTemplate: (tmpl: WhatsAppTemplate) => void;
  onCreateCampaign: (camp: WhatsAppCampaign) => void;
}

export const WhatsAppCrmPage: React.FC<WhatsAppCrmViewProps> = ({
  templates,
  campaigns,
  leads,
  onAddTemplate,
  onCreateCampaign,
}) => {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'templates' | 'drip' | 'chatbot' | 'settings'>('broadcast');

  // New campaign state
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [campName, setCampName] = useState('');
  const [selectedTmplId, setSelectedTmplId] = useState(templates[0]?.id || '');
  const [targetSegment, setTargetSegment] = useState('All Real Estate & SaaS Leads');

  // New template state
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [tmplName, setTmplName] = useState('');
  const [tmplCategory, setTmplCategory] = useState<'MARKETING' | 'UTILITY'>('MARKETING');
  const [tmplBody, setTmplBody] = useState('');

  // Launch Broadcast
  const handleLaunchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const tmpl = templates.find((t) => t.id === selectedTmplId) || templates[0];
    const newCamp: WhatsAppCampaign = {
      id: `camp-${Date.now()}`,
      name: campName || 'New Broadcast Campaign',
      templateId: tmpl.id,
      templateName: tmpl.name,
      targetSegment,
      totalAudience: leads.length,
      sentCount: leads.length,
      deliveredCount: Math.floor(leads.length * 0.98),
      readCount: Math.floor(leads.length * 0.82),
      replyCount: Math.floor(leads.length * 0.35),
      status: 'RUNNING',
      scheduledAt: new Date().toISOString()
    };
    onCreateCampaign(newCamp);
    setCampName('');
    setShowNewCampaignModal(false);
  };

  // Create Template
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const newTmpl: WhatsAppTemplate = {
      id: `tmpl-${Date.now()}`,
      name: tmplName.toLowerCase().replace(/\s+/g, '_') || 'custom_template',
      category: tmplCategory,
      language: 'en_US',
      body: tmplBody || 'Hi {{1}}, thanks for connecting!',
      variables: ['first_name'],
      status: 'APPROVED'
    };
    onAddTemplate(newTmpl);
    setTmplName('');
    setTmplBody('');
    setShowNewTemplateModal(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">WhatsApp CRM & Automation Suite</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              Official WhatsApp Cloud API
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bulk broadcasting, approved template manager, AI chatbot, and drip marketing sequences.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNewTemplateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Create Template</span>
          </button>

          <button
            onClick={() => setShowNewCampaignModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Send className="w-4 h-4" />
            <span>New Broadcast Campaign</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border border-slate-200 bg-white p-1.5 rounded-2xl font-nav shadow-2xs">
        {[
          { id: 'broadcast', label: 'Broadcasting Campaigns', icon: Send },
          { id: 'templates', label: 'Approved Templates', icon: FileText },
          { id: 'drip', label: 'WhatsApp Drip Nurturing', icon: Clock },
          { id: 'chatbot', label: 'AI WhatsApp Chatbot', icon: MessageSquare },
          { id: 'settings', label: 'Cloud API Config', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Broadcasting Campaigns */}
      {activeTab === 'broadcast' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    camp.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {camp.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(camp.scheduledAt).toLocaleDateString()}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{camp.name}</h3>
                <p className="text-xs text-slate-500">Template: <code className="text-emerald-700 font-mono font-bold">{camp.templateName}</code></p>

                {/* Performance Funnel Stats */}
                <div className="grid grid-cols-4 gap-1 pt-2 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Sent</p>
                    <p className="text-xs font-bold text-slate-900">{camp.sentCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Delivered</p>
                    <p className="text-xs font-bold text-indigo-600">{camp.deliveredCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Read</p>
                    <p className="text-xs font-bold text-emerald-600">{camp.readCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Replied</p>
                    <p className="text-xs font-bold text-amber-600">{camp.replyCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Approved Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ {tmpl.status}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">{tmpl.category}</span>
              </div>

              <h3 className="text-xs font-bold text-emerald-700 font-mono">{tmpl.name}</h3>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-sans leading-relaxed">
                {tmpl.body}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Drip Sequences */}
      {activeTab === 'drip' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Automated WhatsApp Drip Nurturing Workflows</span>
          </h2>

          <div className="space-y-3">
            {[
              { day: 'Day 1 (Instant)', title: 'Auto-Welcome & Product Catalog Brochure', status: 'Active' },
              { day: 'Day 2 (10:00 AM)', title: 'Customer Case Study & Video Demo Link', status: 'Active' },
              { day: 'Day 5 (03:00 PM)', title: 'Limited Time Enterprise Discount Coupon', status: 'Active' },
            ].map((drip, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase font-mono">{drip.day}</span>
                  <p className="text-xs font-bold text-slate-900">{drip.title}</p>
                </div>
                <span className="text-xs text-emerald-700 font-bold">✓ {drip.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AI Chatbot */}
      {activeTab === 'chatbot' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 text-indigo-600">
            <MessageSquare className="w-5 h-5" />
            <h2 className="text-sm font-bold text-slate-900">WhatsApp AI Lead Qualification Chatbot</h2>
          </div>
          <p className="text-xs text-slate-600">
            Auto-replies to incoming WhatsApp messages, asks qualification questions, and creates contacts in ARCLE CRM automatically.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <p className="font-bold text-emerald-700">Default Trigger Keywords:</p>
            <p className="text-slate-900 font-mono bg-white p-2 rounded-lg border border-slate-200">
              "price", "demo", "pricing", "catalog", "brochure", "call me", "features"
            </p>
          </div>
        </div>
      )}

      {/* TAB 5: Cloud API Settings */}
      {activeTab === 'settings' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900">WhatsApp Cloud API Configuration</h2>
          <div className="space-y-3 max-w-md">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Phone Number ID</label>
              <input type="text" readOnly value="1092837482910" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Webhook Status</label>
              <div className="flex items-center space-x-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified & Connected</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Launch Broadcast */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleLaunchCampaign} className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>New WhatsApp Broadcast Campaign</span>
              </h3>
              <button type="button" onClick={() => setShowNewCampaignModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g., Q3 Real Estate Offer Broadcast"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Approved Message Template</label>
                <select
                  value={selectedTmplId}
                  onChange={(e) => setSelectedTmplId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Audience Segment</label>
                <input
                  type="text"
                  value={targetSegment}
                  onChange={(e) => setTargetSegment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewCampaignModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Launch Broadcast
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Create Template */}
      {showNewTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTemplate} className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Create WhatsApp Message Template</span>
              </h3>
              <button type="button" onClick={() => setShowNewTemplateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Template Name (snake_case)</label>
                <input
                  type="text"
                  required
                  value={tmplName}
                  onChange={(e) => setTmplName(e.target.value)}
                  placeholder="e.g., site_visit_booking_v1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select
                  value={tmplCategory}
                  onChange={(e: any) => setTmplCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                >
                  <option value="MARKETING">MARKETING</option>
                  <option value="UTILITY">UTILITY</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Message Body (Use {'{{1}}'}, {'{{2}}'} for vars)</label>
                <textarea
                  rows={4}
                  required
                  value={tmplBody}
                  onChange={(e) => setTmplBody(e.target.value)}
                  placeholder="Hi {{1}} 👋! Thanks for inquiring with {{2}}. Click here to confirm your appointment..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewTemplateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Submit for Approval
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const WhatsAppCrmView = WhatsAppCrmPage;
export default WhatsAppCrmPage;
