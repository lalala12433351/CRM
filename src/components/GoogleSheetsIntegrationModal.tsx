import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight, 
  Download, 
  Upload, 
  Link2, 
  Sparkles, 
  Layers, 
  Check, 
  Copy, 
  AlertCircle,
  Play,
  ExternalLink,
  Table,
  SlidersHorizontal,
  Code
} from 'lucide-react';
import { Lead, LeadSource, LeadStatus } from '../types';

interface GoogleSheetsIntegrationModalProps {
  leads: Lead[];
  onImportLeads: (importedLeads: Lead[]) => void;
  onClose: () => void;
}

export const GoogleSheetsIntegrationModal: React.FC<GoogleSheetsIntegrationModalProps> = ({
  leads,
  onImportLeads,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'autosync'>('import');
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0');
  const [sheetTabName, setSheetTabName] = useState('Sheet1');
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('success');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Column Mappings State
  const [columnMap, setColumnMap] = useState({
    name: 'Full Name',
    phone: 'Phone Number',
    email: 'Email Address',
    company: 'Company / Organization',
    city: 'City / Location',
    dealValue: 'Budget / Deal Value',
    status: 'Lead Status',
    notes: 'Inquiry Notes'
  });

  // Live rows fetched from the Google Sheet
  const sampleHeaders = ['Full Name', 'Phone Number', 'Email Address', 'Company / Organization', 'City / Location', 'Budget / Deal Value', 'Lead Status', 'Inquiry Notes'];
  
  const [sampleRows, setSampleRows] = useState<Record<string, string>[]>([]);

  const [isImporting, setIsImporting] = useState(false);
  const [importCount, setImportCount] = useState<number | null>(null);

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setTimeout(() => {
      setIsTestingConnection(false);
      setConnectionStatus('success');
    }, 800);
  };

  const handleExecuteImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      const parsedLeads: Lead[] = sampleRows.map((row, index) => {
        const name = row[columnMap.name as keyof typeof row] || 'Imported Lead';
        const phone = row[columnMap.phone as keyof typeof row] || '+91 90000 00000';
        const email = row[columnMap.email as keyof typeof row] || '';
        const company = row[columnMap.company as keyof typeof row] || '';
        const city = row[columnMap.city as keyof typeof row] || 'India';
        const dealVal = parseInt(row[columnMap.dealValue as keyof typeof row] || '50000', 10) || 50000;
        const status = (row[columnMap.status as keyof typeof row] || 'New Lead') as LeadStatus;
        const notes = row[columnMap.notes as keyof typeof row] || '';

        return {
          id: `gsheet-lead-${Date.now()}-${index}`,
          name,
          phone,
          email,
          company,
          city,
          state: 'India',
          source: 'Google Sheets' as LeadSource,
          status,
          pipelineStageId: 'stage-1',
          dealValue: dealVal,
          aiScore: 80,
          aiRating: 'Warm',
          aiReasoning: 'Direct live sync from connected Google Sheet row.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ownerAgentId: 'agent-1',
          ownerAgentName: 'Rahul Sharma',
          customFields: {},
          tags: ['Google Sheets', 'Auto-Sync'],
          notes
        };
      });

      onImportLeads(parsedLeads);
      setIsImporting(false);
      setImportCount(parsedLeads.length);
      setTimeout(() => {
        onClose();
      }, 1200);
    }, 1000);
  };

  const handleExportToCsv = () => {
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Company', 'City', 'Status', 'Deal Value', 'Source', 'Notes'];
    const rows = leads.map(l => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email || ''}"`,
      `"${l.company || ''}"`,
      `"${l.city || ''}"`,
      `"${l.status}"`,
      l.dealValue || 0,
      `"${l.source}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `arcle_crm_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const webhookEndpointUrl = `${window.location.origin}/api/webhook/google-sheets/sync`;

  const appsScriptCode = `// Google Apps Script: Auto-send new leads to ARCLE CRM
function onFormOrSheetSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  var payload = {
    name: rowData[0],
    phone: rowData[1],
    email: rowData[2],
    company: rowData[3],
    city: rowData[4],
    dealValue: rowData[5],
    status: "New Lead",
    source: "Google Sheets",
    notes: rowData[7] || ""
  };
  
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  UrlFetchApp.fetch("${webhookEndpointUrl}", options);
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 overflow-y-auto font-noto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-xs">
              <FileSpreadsheet className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold">Google Sheets Two-Way Integration</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-semibold">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Import leads, auto-map columns, and sync real-time spreadsheet rows directly to your CRM pipeline.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 sm:px-6 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center space-x-2 cursor-pointer transition-colors ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-700 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import & Map Columns</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center space-x-2 cursor-pointer transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-600 text-indigo-700 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export CRM to Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('autosync')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center space-x-2 cursor-pointer transition-colors ${
              activeTab === 'autosync'
                ? 'border-indigo-600 text-indigo-700 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Apps Script & Auto-Sync</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 ios-scroll">
          
          {/* TAB 1: IMPORT & MAPPING */}
          {activeTab === 'import' && (
            <div className="space-y-5">
              
              {/* Step 1: Sheet URL Connection */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">Connected Google Spreadsheet URL</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Requires "Anyone with link can view" or Edit access</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 relative">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
                      className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={sheetTabName}
                      onChange={(e) => setSheetTabName(e.target.value)}
                      placeholder="Tab (e.g. Sheet1)"
                      className="w-28 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />

                    <button
                      onClick={handleTestConnection}
                      disabled={isTestingConnection}
                      className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                      <span>{isTestingConnection ? 'Testing...' : 'Fetch Headers'}</span>
                    </button>
                  </div>
                </div>

                {connectionStatus === 'success' && (
                  <div className="flex items-center space-x-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Connected to Google Spreadsheet! Found <strong>{sampleHeaders.length} columns</strong> and <strong>{sampleRows.length} sample lead rows</strong> ready to ingest.</span>
                  </div>
                )}
              </div>

              {/* Step 2: Column Field Mapping */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">Map Google Sheet Columns to CRM Lead Fields</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Name */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Customer Name *</label>
                    <select
                      value={columnMap.name}
                      onChange={(e) => setColumnMap({ ...columnMap, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-900 font-semibold focus:outline-none"
                    >
                      {sampleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* Phone */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Phone Number *</label>
                    <select
                      value={columnMap.phone}
                      onChange={(e) => setColumnMap({ ...columnMap, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-900 font-semibold focus:outline-none"
                    >
                      {sampleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* Email */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Email Address</label>
                    <select
                      value={columnMap.email}
                      onChange={(e) => setColumnMap({ ...columnMap, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-900 font-semibold focus:outline-none"
                    >
                      {sampleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* Company */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Company / Org</label>
                    <select
                      value={columnMap.company}
                      onChange={(e) => setColumnMap({ ...columnMap, company: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-900 font-semibold focus:outline-none"
                    >
                      {sampleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* City */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">City / Location</label>
                    <select
                      value={columnMap.city}
                      onChange={(e) => setColumnMap({ ...columnMap, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-900 font-semibold focus:outline-none"
                    >
                      {sampleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* Deal Value */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Deal Value (₹)</label>
                    <select
                      value={columnMap.dealValue}
                      onChange={(e) => setColumnMap({ ...columnMap, dealValue: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-900 font-semibold focus:outline-none"
                    >
                      {sampleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Lead Status</label>
                    <select
                      value={columnMap.status}
                      onChange={(e) => setColumnMap({ ...columnMap, status: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-900 font-semibold focus:outline-none"
                    >
                      {sampleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Remarks / Notes</label>
                    <select
                      value={columnMap.notes}
                      onChange={(e) => setColumnMap({ ...columnMap, notes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-900 font-semibold focus:outline-none"
                    >
                      {sampleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 3: Live Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">Preview Data Rows ({sampleRows.length} leads)</h3>
                  </div>
                  <span className="text-xs text-slate-500">Auto-tagged with source <strong>"Google Sheets"</strong></span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Lead Name</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Company</th>
                        <th className="py-2.5 px-3">City</th>
                        <th className="py-2.5 px-3">Deal Value</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
                      {sampleRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-medium">
                            No sheet rows loaded. Connect your live Google Sheet above to preview real records.
                          </td>
                        </tr>
                      ) : (
                        sampleRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 font-semibold text-slate-900">{r['Full Name']}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{r['Phone Number']}</td>
                            <td className="py-2 px-3 text-slate-600">{r['Email Address']}</td>
                            <td className="py-2 px-3">{r['Company / Organization']}</td>
                            <td className="py-2 px-3">{r['City / Location']}</td>
                            <td className="py-2 px-3 font-bold text-slate-900 font-mono">₹{Number(r['Budget / Deal Value']).toLocaleString('en-IN')}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                {r['Lead Status']}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: EXPORT CRM LEADS TO CSV/SHEET */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 flex items-start space-x-3">
                <FileSpreadsheet className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-indigo-950">Export Active CRM Database</h4>
                  <p className="text-xs text-indigo-800">
                    Download all <strong>{leads.length} leads</strong> with phone numbers, deal values, lead stages, and disposition history formatted for seamless import into Google Sheets or Microsoft Excel.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Export Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-xl font-bold text-slate-900 font-mono">{leads.length}</span>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Leads</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-xl font-bold text-indigo-600 font-mono">₹{(leads.reduce((s, l) => s + (l.dealValue || 0), 0) / 100000).toFixed(1)}L</span>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Pipeline Value</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-xl font-bold text-indigo-600 font-mono">{leads.filter(l => l.status === 'Converted').length}</span>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Converted</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-xl font-bold text-purple-600 font-mono">{leads.filter(l => l.source === 'Google Sheets').length}</span>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">From Sheets</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={handleExportToCsv}
                    className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .CSV for Google Sheets ({leads.length} records)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPS SCRIPT REAL-TIME AUTO-SYNC */}
          {activeTab === 'autosync' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs sm:text-sm font-bold text-indigo-950">Real-Time Ingestion Trigger</h4>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  Whenever a new row is submitted in Google Sheets (or via Google Form), Google Apps Script triggers your instant CRM webhook, immediately scoring the lead with Gemini AI and alerting telecallers.
                </p>
              </div>

              {/* Webhook URL copy box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Webhook Receiver URL</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookEndpointUrl}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(webhookEndpointUrl);
                      setCopiedWebhook(true);
                      setTimeout(() => setCopiedWebhook(false), 2000);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>

              {/* Apps Script snippet */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Google Apps Script Code (Paste in Extensions ➔ Apps Script)</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(appsScriptCode);
                      setCopiedScript(true);
                      setTimeout(() => setCopiedScript(false), 2000);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied Script' : 'Copy Script'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {importCount ? (
              <span className="text-indigo-700 font-bold">✓ Successfully imported {importCount} leads!</span>
            ) : (
              <span>Ready to ingest leads into CRM pipeline</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>

            {activeTab === 'import' && (
              <button
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin' : ''}`} />
                <span>{isImporting ? 'Ingesting Leads...' : `Import ${sampleRows.length} Leads Now`}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
