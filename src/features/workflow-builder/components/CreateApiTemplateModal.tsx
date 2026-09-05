import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  Check,
  Code,
  ArrowRight,
  Sparkles,
  Play,
  RotateCw,
  ExternalLink,
  Shield,
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';
import { toast } from '../../../context/ToastContext';
import { StoredApiTemplate, saveApiTemplate, testApiTemplate } from '../../../utils/templateStorage';

interface CreateApiTemplateModalProps {
  isOpen: boolean;
  initialTemplate?: Partial<StoredApiTemplate> | null;
  onClose: () => void;
  onSaved: (template: StoredApiTemplate) => void;
}

const AVAILABLE_VARIABLES = [
  { key: '{{lead.id}}', label: 'Lead ID', desc: 'Unique identifier of the lead' },
  { key: '{{lead.name}}', label: 'Lead Name', desc: 'Full contact name' },
  { key: '{{lead.phone}}', label: 'Phone Number', desc: 'Primary contact phone' },
  { key: '{{lead.email}}', label: 'Email Address', desc: 'Contact email' },
  { key: '{{lead.company}}', label: 'Company', desc: 'Company or business name' },
  { key: '{{lead.status}}', label: 'Status / Stage', desc: 'Current pipeline stage' },
  { key: '{{lead.source}}', label: 'Lead Source', desc: 'Acquisition channel' },
  { key: '{{lead.deal_value}}', label: 'Deal Value', desc: 'Total deal amount' },
  { key: '{{lead.assignee_name}}', label: 'Assignee Name', desc: 'Owner agent name' },
  { key: '{{timestamp}}', label: 'Timestamp', desc: 'Current ISO timestamp' }
];

export const CreateApiTemplateModal: React.FC<CreateApiTemplateModalProps> = ({
  isOpen,
  initialTemplate,
  onClose,
  onSaved
}) => {
  if (!isOpen) return null;

  // Form State
  const [name, setName] = useState(initialTemplate?.name || '');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>(
    initialTemplate?.method || 'POST'
  );
  const [endpointUrl, setEndpointUrl] = useState(initialTemplate?.endpointUrl || '');
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(initialTemplate?.timeoutSeconds || 3);

  // Tabs: 'Headers' | 'Body' | 'Query Params' | 'Auth'
  const [activeTab, setActiveTab] = useState<'Headers' | 'Body' | 'Query Params' | 'Auth'>('Headers');

  // Headers
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>(
    initialTemplate?.headers && initialTemplate.headers.length > 0
      ? initialTemplate.headers
      : [{ key: 'Content-type', value: 'application/json' }]
  );

  // Body
  const [bodyPayload, setBodyPayload] = useState<string>(
    initialTemplate?.bodyPayload ||
      JSON.stringify(
        {
          lead_id: '{{lead.id}}',
          name: '{{lead.name}}',
          phone: '{{lead.phone}}',
          email: '{{lead.email}}',
          status: '{{lead.status}}'
        },
        null,
        2
      )
  );

  // Query Params
  const [queryParams, setQueryParams] = useState<{ key: string; value: string }[]>(
    initialTemplate?.queryParams && initialTemplate.queryParams.length > 0
      ? initialTemplate.queryParams
      : [{ key: '', value: '' }]
  );

  // Auth
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic' | 'apikey'>(
    initialTemplate?.authConfig?.type || 'none'
  );
  const [authToken, setAuthToken] = useState(initialTemplate?.authConfig?.token || '');
  const [authUsername, setAuthUsername] = useState(initialTemplate?.authConfig?.username || '');
  const [authPassword, setAuthPassword] = useState(initialTemplate?.authConfig?.password || '');
  const [apiKeyKey, setApiKeyKey] = useState(initialTemplate?.authConfig?.apiKeyKey || '');
  const [apiKeyValue, setApiKeyValue] = useState(initialTemplate?.authConfig?.apiKeyValue || '');
  const [apiKeyLocation, setApiKeyLocation] = useState<'header' | 'query'>(
    initialTemplate?.authConfig?.apiKeyLocation || 'header'
  );

  // Dropdown UI states
  const [showVarDropdown, setShowVarDropdown] = useState(false);
  const [varTarget, setVarTarget] = useState<'url' | 'body'>('url');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Handlers for Headers
  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleUpdateHeader = (index: number, key: string, value: string) => {
    const updated = [...headers];
    updated[index] = { key, value };
    setHeaders(updated);
  };

  const handleDeleteHeader = (index: number) => {
    if (headers.length === 1) {
      setHeaders([{ key: '', value: '' }]);
      return;
    }
    setHeaders(headers.filter((_, i) => i !== index));
  };

  // Handlers for Query Params
  const handleAddQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '' }]);
  };

  const handleUpdateQueryParam = (index: number, key: string, value: string) => {
    const updated = [...queryParams];
    updated[index] = { key, value };
    setQueryParams(updated);
  };

  const handleDeleteQueryParam = (index: number) => {
    if (queryParams.length === 1) {
      setQueryParams([{ key: '', value: '' }]);
      return;
    }
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };

  // Insert Variable
  const handleInsertVariable = (variableKey: string) => {
    if (varTarget === 'url') {
      setEndpointUrl(prev => prev + variableKey);
    } else {
      setBodyPayload(prev => prev + variableKey);
    }
    setShowVarDropdown(false);
  };

  // Copy Endpoint URL
  const handleCopyUrl = () => {
    if (endpointUrl) {
      navigator.clipboard.writeText(endpointUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
      toast.success('Endpoint URL copied to clipboard');
    }
  };

  // Live Test Execution
  const handleRunTest = async () => {
    if (!endpointUrl.trim()) {
      toast.error('Please enter an API Endpoint URL first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const cleanHeaders = headers.filter(h => h.key.trim().length > 0);
      const cleanQueryParams = queryParams.filter(q => q.key.trim().length > 0);

      const result = await testApiTemplate({
        method,
        endpointUrl: endpointUrl.trim(),
        headers: cleanHeaders,
        bodyPayload,
        queryParams: cleanQueryParams,
        authConfig: {
          type: authType,
          token: authToken,
          username: authUsername,
          password: authPassword,
          apiKeyKey,
          apiKeyValue,
          apiKeyLocation
        },
        timeoutSeconds
      });

      setTestResult(result);
      if (result.success) {
        toast.success(`Test executed successfully: HTTP ${result.status}`);
      } else {
        toast.error(`Test returned status: ${result.status || 'Error'} (${result.statusText || result.error})`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Test execution failed');
      setTestResult({
        success: false,
        status: 0,
        statusText: 'Client Error',
        durationMs: 0,
        error: err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Save Template into Database Table 'templates'
  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Template Name is required');
      return;
    }

    if (!endpointUrl.trim()) {
      toast.error('API Endpoint URL is required');
      return;
    }

    const cleanHeaders = headers.filter(h => h.key.trim().length > 0);
    const cleanQueryParams = queryParams.filter(q => q.key.trim().length > 0);

    const templateRecord: Partial<StoredApiTemplate> = {
      id: initialTemplate?.id || `tpl-${Date.now()}`,
      name: name.trim(),
      method,
      endpointUrl: endpointUrl.trim(),
      timeoutSeconds: Number(timeoutSeconds) || 3,
      headers: cleanHeaders,
      bodyPayload,
      queryParams: cleanQueryParams,
      authConfig: {
        type: authType,
        token: authToken,
        username: authUsername,
        password: authPassword,
        apiKeyKey,
        apiKeyValue,
        apiKeyLocation
      },
      workflow: initialTemplate?.workflow || 'None',
      createdBy: initialTemplate?.createdBy || 'FC'
    };

    const savedList = saveApiTemplate(templateRecord);
    const saved = savedList.find(t => t.id === templateRecord.id || t.name === templateRecord.name) || (templateRecord as StoredApiTemplate);

    toast.success(`API Template "${saved.name}" saved to database!`);
    onSaved(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto max-h-[92vh]">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Stepper / API Template Manager Sidebar                       */}
        {/* ========================================================================= */}
        <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200/90 p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                API Template Manager
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Create Template
              </p>
            </div>

            {/* Step 1: Request Information */}
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-full bg-[#3a2088] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                1
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#3a2088]">
                  Request Information
                </p>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">
                  Define API Endpoint and Test
                </p>
              </div>
            </div>
          </div>

          {/* Need Help Box */}
          <div className="mt-8 md:mt-0 p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
              <HelpCircle className="w-3.5 h-3.5 text-[#3a2088]" />
              <span>Need Help?</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              Check our documentation for detailed guides on creating templates.
            </p>
            <button
              type="button"
              onClick={() => {
                toast.info(
                  'Documentation: In API templates, use {{lead.id}}, {{lead.name}}, and {{lead.phone}} to dynamically interpolate lead attributes at execution time.',
                  'API Template Guides',
                  6000
                );
              }}
              className="text-xs font-bold text-[#3a2088] hover:underline flex items-center space-x-1 cursor-pointer pt-0.5"
            >
              <span>View Documentation</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Create API Template Main Form                               */}
        {/* ========================================================================= */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {/* Header Row with Cancel */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              {initialTemplate?.id ? 'Edit API Template' : 'Create API Template'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
            
            {/* Section: Request Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 tracking-wide">
                Request Information
              </h4>

              {/* Template Name * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome API"
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] focus:ring-1 focus:ring-[#3a2088] shadow-2xs"
                />
              </div>

              {/* HTTP Method * and API Endpoint URL * */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    HTTP Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#3a2088] cursor-pointer shadow-2xs"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div className="sm:col-span-9">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      API Endpoint URL <span className="text-rose-500">*</span>
                    </label>

                    {/* Add Variable Button / Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setVarTarget('url');
                          setShowVarDropdown(!showVarDropdown);
                        }}
                        className="text-[11px] font-bold text-[#3a2088] bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Add Variable</span>
                      </button>

                      {showVarDropdown && (
                        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 space-y-1 max-h-56 overflow-y-auto">
                          <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                            Insert Lead Variable
                          </p>
                          {AVAILABLE_VARIABLES.map((v) => (
                            <button
                              key={v.key}
                              type="button"
                              onClick={() => handleInsertVariable(v.key)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-xs flex flex-col cursor-pointer transition-colors"
                            >
                              <span className="font-bold text-[#3a2088] font-mono">{v.key}</span>
                              <span className="text-[10px] text-slate-500">{v.label} - {v.desc}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      placeholder="https://awesome-api.com/customers/{{lead.id}}"
                      className="w-full text-xs font-mono px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3a2088] focus:ring-1 focus:ring-[#3a2088] shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedUrl ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* API Timeout (s) * */}
              <div className="w-full sm:w-44">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  API Timeout (s) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 3)}
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#3a2088] shadow-2xs"
                />
              </div>

              {/* Sub-Tabs: Headers | Body | Query Params | Auth */}
              <div className="pt-2">
                <div className="border-b border-slate-200 flex items-center space-x-6 text-xs font-bold">
                  {(['Headers', 'Body', 'Query Params', 'Auth'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`pb-2.5 transition-all cursor-pointer ${
                        activeTab === tab
                          ? 'text-[#3a2088] border-b-2 border-[#3a2088] font-bold'
                          : 'text-slate-500 hover:text-slate-800 font-medium'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab 1: Headers */}
                {activeTab === 'Headers' && (
                  <div className="pt-4 space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-600 font-bold text-[11px] border-b border-slate-100">
                            <th className="pb-2 px-1 w-5/12">Key</th>
                            <th className="pb-2 px-1 w-5/12">Value</th>
                            <th className="pb-2 px-1 text-right w-2/12">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {headers.map((h, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-1">
                                <input
                                  type="text"
                                  value={h.key}
                                  onChange={(e) => handleUpdateHeader(idx, e.target.value, h.value)}
                                  placeholder="Content-type"
                                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 font-mono focus:border-[#3a2088] focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-1">
                                <input
                                  type="text"
                                  value={h.value}
                                  onChange={(e) => handleUpdateHeader(idx, h.key, e.target.value)}
                                  placeholder="application/json"
                                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 font-mono focus:border-[#3a2088] focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-1 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  {idx === headers.length - 1 ? (
                                    <button
                                      type="button"
                                      onClick={handleAddHeader}
                                      className="p-2 rounded-lg border border-purple-200 bg-purple-50 text-[#3a2088] hover:bg-purple-100 transition-colors cursor-pointer shadow-2xs"
                                      title="Add Header"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteHeader(idx)}
                                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 2: Body */}
                {activeTab === 'Body' && (
                  <div className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">
                        JSON Request Payload
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setVarTarget('body');
                          setShowVarDropdown(!showVarDropdown);
                        }}
                        className="text-[11px] font-bold text-[#3a2088] bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg flex items-center space-x-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Add Variable to Body</span>
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={bodyPayload}
                      onChange={(e) => setBodyPayload(e.target.value)}
                      placeholder={'{\n  "lead_id": "{{lead.id}}",\n  "phone": "{{lead.phone}}"\n}'}
                      className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-[#3a2088]"
                    />
                  </div>
                )}

                {/* Tab 3: Query Params */}
                {activeTab === 'Query Params' && (
                  <div className="pt-4 space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-600 font-bold text-[11px] border-b border-slate-100">
                            <th className="pb-2 px-1 w-5/12">Key</th>
                            <th className="pb-2 px-1 w-5/12">Value</th>
                            <th className="pb-2 px-1 text-right w-2/12">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {queryParams.map((q, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-1">
                                <input
                                  type="text"
                                  value={q.key}
                                  onChange={(e) => handleUpdateQueryParam(idx, e.target.value, q.value)}
                                  placeholder="api_key"
                                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 font-mono focus:border-[#3a2088] focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-1">
                                <input
                                  type="text"
                                  value={q.value}
                                  onChange={(e) => handleUpdateQueryParam(idx, q.key, e.target.value)}
                                  placeholder="{{lead.id}}"
                                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 font-mono focus:border-[#3a2088] focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-1 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  {idx === queryParams.length - 1 ? (
                                    <button
                                      type="button"
                                      onClick={handleAddQueryParam}
                                      className="p-2 rounded-lg border border-purple-200 bg-purple-50 text-[#3a2088] hover:bg-purple-100 transition-colors cursor-pointer shadow-2xs"
                                      title="Add Parameter"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteQueryParam(idx)}
                                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 4: Auth */}
                {activeTab === 'Auth' && (
                  <div className="pt-4 space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Authentication Type
                      </label>
                      <select
                        value={authType}
                        onChange={(e) => setAuthType(e.target.value as any)}
                        className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none cursor-pointer"
                      >
                        <option value="none">None / No Authentication</option>
                        <option value="bearer">Bearer Token (Authorization: Bearer ...)</option>
                        <option value="basic">Basic Auth (Username & Password)</option>
                        <option value="apikey">API Key Header / Query Param</option>
                      </select>
                    </div>

                    {authType === 'bearer' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Bearer Token
                        </label>
                        <input
                          type="text"
                          value={authToken}
                          onChange={(e) => setAuthToken(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                          className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-900"
                        />
                      </div>
                    )}

                    {authType === 'basic' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            value={authUsername}
                            onChange={(e) => setAuthUsername(e.target.value)}
                            placeholder="admin"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Password
                          </label>
                          <input
                            type="password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {authType === 'apikey' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              API Key Name
                            </label>
                            <input
                              type="text"
                              value={apiKeyKey}
                              onChange={(e) => setApiKeyKey(e.target.value)}
                              placeholder="X-API-KEY"
                              className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              API Key Value
                            </label>
                            <input
                              type="text"
                              value={apiKeyValue}
                              onChange={(e) => setApiKeyValue(e.target.value)}
                              placeholder="key_live_..."
                              className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-900"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Pass Key In
                          </label>
                          <select
                            value={apiKeyLocation}
                            onChange={(e) => setApiKeyLocation(e.target.value as any)}
                            className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 cursor-pointer"
                          >
                            <option value="header">Request Header</option>
                            <option value="query">URL Query Parameter</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Live Test Result Box */}
            {testResult && (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        testResult.status >= 200 && testResult.status < 300
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {testResult.status ? `HTTP ${testResult.status} ${testResult.statusText || ''}` : 'Execution Error'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {testResult.durationMs}ms latency
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                    {testResult.url}
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto rounded-lg bg-slate-900 p-2 text-[11px] font-mono text-emerald-400">
                  <pre className="whitespace-pre-wrap break-all">
                    {typeof testResult.data === 'object'
                      ? JSON.stringify(testResult.data, null, 2)
                      : testResult.data || testResult.error || 'Empty response'}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions Bar */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleRunTest}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#3a2088] text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              {isTesting ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 text-[#3a2088]" />
              )}
              <span>{isTesting ? 'Testing Endpoint...' : 'Test Template'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Save Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
