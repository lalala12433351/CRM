import React, { useState } from 'react';
import { FileText, CheckCircle2, Download, Send, Plus, Sparkles, PenTool, ShieldCheck, Database, Server, Code2, Globe, Layers, CheckSquare, Copy, Check } from 'lucide-react';
import { Lead } from '../types';

interface DocsAndSignViewProps {
  leads: Lead[];
}

export const DocsAndSignView: React.FC<DocsAndSignViewProps> = ({ leads }) => {
  const [activeSubTab, setActiveSubTab] = useState<'proposals' | 'sow'>('sow');
  const [copied, setCopied] = useState(false);

  const [docs, setDocs] = useState([
    { id: 'doc-1', title: 'ARCLE Enterprise Proposal - Oberoi Realty', leadName: 'Rajesh Sharma', status: 'SIGNED', amount: 150000, date: '2025-05-10' },
    { id: 'doc-2', title: 'WhatsApp Automation SLA Agreement', leadName: 'Priya Nair', status: 'PENDING_SIGNATURE', amount: 85000, date: '2025-05-12' },
    { id: 'doc-3', title: 'TeleCRM Enterprise License Invoice', leadName: 'Amit Patel', status: 'DRAFT', amount: 220000, date: '2025-05-14' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docAmount, setDocAmount] = useState(100000);
  const [selectedLead, setSelectedLead] = useState(leads[0]?.name || 'Rajesh Sharma');

  const sowMarkdownText = `
# SCOPE OF WORK (SOW)
**Project Title**: TeleCRM & Lead Management Enterprise System  
**Client / Product**: TeleCRM Application  
**Tech Stack**: React.js (TypeScript) | Express.js (Node.js) | MongoDB on AWS | Cloudflare WAF & Security  
**Document Version**: 1.0.0  

---

## 1. PROJECT OVERVIEW & EXECUTIVE SUMMARY
The goal of this project is to build a high-performance, full-stack TeleCRM & Sales Pipeline Management platform tailored for tele-calling teams, sales managers, and digital marketers. The application automates lead capture, agent distribution, power dialing, WhatsApp marketing, follow-up scheduling, and real-time sales reporting.

---

## 2. TECHNICAL ARCHITECTURE & STACK SPECIFICATION

### 2.1 Frontend Tier (Client-Side)
- **Framework**: React.js (v18+) with TypeScript for strict type-safety
- **Build Tool**: Vite (Lightning-fast HMR and bundle optimization)
- **Styling**: Tailwind CSS for responsive utility-first UI
- **Iconography & UI**: Lucide-React icons & Motion animations
- **State Management**: React Hooks & Context API for client-side state

### 2.2 Backend Tier (Server-Side)
- **Runtime**: Node.js
- **Framework**: Express.js RESTful API architecture
- **Authentication**: JWT (JSON Web Tokens) with refresh token rotation & bcrypt password hashing
- **Middleware**: Helmet.js security headers, CORS configuration, Rate Limiting, Winston logger

### 2.3 Database Tier (Persistence)
- **Database Engine**: MongoDB (AWS DocumentDB / MongoDB Atlas on AWS)
- **ORM / ODM**: Mongoose ODM with schema validation & indexing
- **High Availability**: AWS Multi-AZ deployment with automated daily snapshots & automated failover

### 2.4 Security & Infrastructure Tier
- **Edge Security & CDN**: Cloudflare WAF (Web Application Firewall), DDoS Protection, Universal SSL/TLS Encryption, and DNS Proxying
- **Hosting Infrastructure**: AWS (EC2 / ECS Containerized deployment with AWS Application Load Balancer)
  `;

  const handleCopy = () => {
    navigator.clipboard.writeText(sowMarkdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setDocs([
      ...docs,
      {
        id: `doc-${Date.now()}`,
        title: docTitle || 'New Proposal',
        leadName: selectedLead,
        amount: docAmount,
        status: 'PENDING_SIGNATURE',
        date: new Date().toISOString().slice(0, 10)
      }
    ]);
    setDocTitle('');
    setShowModal(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Scope of Work (SOW) & Contracts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official System Scope of Work document, technical specifications, and client proposal management.
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 font-nav">
          <button
            onClick={() => setActiveSubTab('sow')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeSubTab === 'sow'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Scope of Work (SOW)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('proposals')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeSubTab === 'proposals'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Client Proposals & E-Sign</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SCOPE OF WORK DOCUMENT VIEW */}
      {activeSubTab === 'sow' && (
        <div className="space-y-6">
          {/* Tech Stack Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Frontend</span>
                <Code2 className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-sm font-bold text-slate-900">React.js (TypeScript)</p>
              <p className="text-[11px] text-slate-500">Vite, Tailwind CSS, Lucide Icons</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Backend</span>
                <Server className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-slate-900">Express.js (Node.js)</p>
              <p className="text-[11px] text-slate-500">RESTful API, JWT Auth, Winston</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Database & Cloud</span>
                <Database className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-slate-900">MongoDB on AWS</p>
              <p className="text-[11px] text-slate-500">AWS DocumentDB / Atlas, Mongoose</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Security & CDN</span>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-sm font-bold text-slate-900">Cloudflare Protection</p>
              <p className="text-[11px] text-slate-500">WAF, DDoS Shield, SSL, DNS Proxy</p>
            </div>
          </div>

          {/* SOW Document Reader Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Header Controls */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Official Scope of Work (SOW) Specification Document
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-2xs transition-all"
                  title="Copies plain text with zero background formatting - perfect for Google Docs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Clean Text!' : 'Copy for Google Docs (Plain Text)'}</span>
                </button>

                <button
                  onClick={() => alert('Exporting Scope of Work PDF document...')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-2xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SOW PDF</span>
                </button>
              </div>
            </div>

            {/* Document Background Callout Notice */}
            <div className="bg-indigo-50 px-6 py-2 border-b border-indigo-100 flex items-center justify-between text-[11px] text-indigo-900">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span><strong>Google Docs Friendly Paper Theme</strong>: The document below uses a clean white paper sheet so copying text will never paste with a dark background.</span>
              </span>
            </div>

            {/* Rendered Document Body */}
            <div className="p-6 md:p-12 bg-slate-50">
              <div className="bg-white text-slate-900 p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm space-y-6 text-xs leading-relaxed font-sans max-w-4xl mx-auto">
                
                {/* Document Header Title */}
                <div className="border-b border-slate-200 pb-5 space-y-2">
                  <div className="inline-block px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                    Enterprise Software Development Contract
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Scope of Work (SOW) — TeleCRM Product</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-[11px] text-slate-600 font-mono">
                    <div><strong className="text-slate-900">Frontend:</strong> React.js (TypeScript)</div>
                    <div><strong className="text-slate-900">Backend:</strong> Express.js (Node.js)</div>
                    <div><strong className="text-slate-900">Database:</strong> MongoDB on AWS</div>
                    <div><strong className="text-slate-900">Security:</strong> Cloudflare WAF</div>
                  </div>
                </div>

                {/* Section 1 */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span>1. Project Executive Summary</span>
                  </h3>
                  <p className="text-slate-700 pl-4 border-l-2 border-indigo-500/30">
                    The objective of this engagement is to design, develop, deploy, and support an enterprise-grade <strong>TeleCRM & Lead Management System</strong>. The system provides complete real-time lead lifecycle tracking, webhook integrations (Meta Ads, IndiaMart, Website Forms), power dialing capabilities, WhatsApp CRM automation, follow-ups queue tracking, and tele-caller performance analytics.
                  </p>
                </div>

                {/* Section 4 SLA */}
                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span>4. SLA & Delivery Schedule</span>
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-700 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">Estimated Delivery Timeline</p>
                      <p className="text-slate-600 text-[11px]">6 Weeks (including UAT, Cloudflare setup & AWS deployment)</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                        Ready for Development
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CLIENT PROPOSALS & E-SIGNATURES */}
      {activeSubTab === 'proposals' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Proposal</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Document Title</th>
                    <th className="px-4 py-3">Recipient Lead</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">E-Sign Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docs.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900 flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>{d.title}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">{d.leadName}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700 font-mono">₹{d.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === 'SIGNED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          d.status === 'PENDING_SIGNATURE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer">
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Client Proposal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Generate Client Quotation</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Proposal Title</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g., Enterprise SLA & License Quote"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Client Lead</label>
                <select
                  value={selectedLead}
                  onChange={(e) => setSelectedLead(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.name}>{l.name} ({l.company})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Total Value (₹)</label>
                <input
                  type="number"
                  value={docAmount}
                  onChange={(e) => setDocAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Send for E-Signature
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
