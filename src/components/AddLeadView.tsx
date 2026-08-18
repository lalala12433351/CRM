import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Upload, 
  Link2, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Zap, 
  MapPin, 
  Building, 
  Tag, 
  Calendar, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Download, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  PhoneCall, 
  RefreshCw, 
  Copy, 
  X,
  FileSpreadsheet,
  User,
  SlidersHorizontal,
  Globe,
  Share2,
  ExternalLink,
  ShieldCheck,
  Database
} from 'lucide-react';
import { Lead, Agent, LeadSource, LeadStatus, CustomFieldDef } from '../types';

interface AddLeadViewProps {
  leads: Lead[];
  agents: Agent[];
  customFields: CustomFieldDef[];
  onSaveLead: (lead: Lead) => void;
  onSaveAndCall?: (lead: Lead) => void;
  onImportBulkLeads: (leads: Partial<Lead>[]) => void;
  onCancel: () => void;
  onNavigateToTab?: (tab: string) => void;
}

// Sample Pincode Database for Smart Auto-Fill
const PINCODE_DATABASE: Record<string, { city: string; state: string; country: string }> = {
  '400001': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
  '400050': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
  '110001': { city: 'New Delhi', state: 'Delhi', country: 'India' },
  '560001': { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
  '560100': { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  '700001': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
  '500001': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
  '411001': { city: 'Pune', state: 'Maharashtra', country: 'India' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
  '302001': { city: 'Jaipur', state: 'Rajasthan', country: 'India' },
  '10001': { city: 'New York', state: 'New York', country: 'USA' },
  '90210': { city: 'Los Angeles', state: 'California', country: 'USA' },
};

export const AddLeadView: React.FC<AddLeadViewProps> = ({
  leads,
  agents,
  customFields,
  onSaveLead,
  onSaveAndCall,
  onImportBulkLeads,
  onCancel,
  onNavigateToTab
}) => {
  // Top Active Mode / Tab: 'single' | 'excel' | 'integration'
  const [activeTab, setActiveTab] = useState<'single' | 'excel' | 'integration'>('single');

  // Toggle for optional advanced settings in single lead mode
  const [showAdvanced, setShowAdvanced] = useState(false);

  // -------------------------------------------------------------
  // FORM STATE: SINGLE LEAD
  // -------------------------------------------------------------
  const [countryCode, setCountryCode] = useState('+91');
  const [rawPhone, setRawPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');

  const [leadSource, setLeadSource] = useState<LeadSource>('Facebook Ads');
  const [customLeadSource, setCustomLeadSource] = useState('');

  const [campaignName, setCampaignName] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');

  const [companyName, setCompanyName] = useState('');
  const [dealValue, setDealValue] = useState<number>(100000);
  const [requirement, setRequirement] = useState('');

  const [leadStatus, setLeadStatus] = useState<LeadStatus>('New Lead');
  const [assignedAgentId, setAssignedAgentId] = useState(agents[0]?.id || '');
  const [priority, setPriority] = useState<'Hot' | 'Warm' | 'Cold'>('Hot');

  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  const [selectedTags, setSelectedTags] = useState<string[]>(['HighIntent']);
  const [newTagInput, setNewTagInput] = useState('');

  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Real-time Duplicate Detection State
  const [duplicateWarning, setDuplicateWarning] = useState<Lead | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [draftSavedAlert, setDraftSavedAlert] = useState(false);

  // -------------------------------------------------------------
  // FORM STATE: INTEGRATION SIMULATION
  // -------------------------------------------------------------
  const [integProvider, setIntegProvider] = useState<string>('Meta Ads');
  const [integName, setIntegName] = useState('Alexander Gheevarghese');
  const [integPhone, setIntegPhone] = useState('98590096589');
  const [integEmail, setIntegEmail] = useState('alexvarghese619@gmail.com');
  const [integCampaign, setIntegCampaign] = useState('master-form-iata-cargo');
  const [integCity, setIntegCity] = useState('Punalur');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [integSuccessMsg, setIntegSuccessMsg] = useState('');

  // Restore draft if exists
  useEffect(() => {
    const savedDraft = localStorage.getItem('lead_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.rawPhone) setRawPhone(parsed.rawPhone);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.companyName) setCompanyName(parsed.companyName);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save Draft to Local Storage
  const handleSaveDraft = () => {
    const draft = { fullName, rawPhone, email, companyName, notes };
    localStorage.setItem('lead_draft', JSON.stringify(draft));
    setDraftSavedAlert(true);
    setTimeout(() => setDraftSavedAlert(false), 3000);
  };

  const handleClearDraft = () => {
    localStorage.removeItem('lead_draft');
    setDraftSavedAlert(false);
  };

  // Check Duplicate Phone in real time
  useEffect(() => {
    if (rawPhone.trim().length >= 8) {
      const cleanPhone = rawPhone.trim().replace(/\D/g, '');
      const existing = leads.find((l) => l.phone.replace(/\D/g, '').includes(cleanPhone));
      if (existing) {
        setDuplicateWarning(existing);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [rawPhone, leads]);

  // Handle Pincode Auto-Fill
  const handlePincodeChange = (pinVal: string) => {
    setPincode(pinVal);
    if (PINCODE_DATABASE[pinVal]) {
      const data = PINCODE_DATABASE[pinVal];
      setCity(data.city);
      setState(data.state);
      setCountry(data.country);
    }
  };

  // AI Agent Recommender
  const handleSuggestBestAgent = () => {
    if (agents.length === 0) return;
    const sorted = [...agents].sort((a, b) => a.totalCallsToday - b.totalCallsToday);
    const bestAgent = sorted[0];
    setAssignedAgentId(bestAgent.id);
  };

  // Tag Handlers
  const handleAddTag = () => {
    if (newTagInput.trim() && !selectedTags.includes(newTagInput.trim())) {
      setSelectedTags([...selectedTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove));
  };

  // -------------------------------------------------------------
  // BUILD SINGLE LEAD OBJECT & SUBMIT
  // -------------------------------------------------------------
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full Name is required.';
    if (!rawPhone.trim()) errs.phone = 'Phone Number is required.';
    if (email && !email.includes('@')) errs.email = 'Invalid email address.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const constructLead = (): Lead => {
    const assignedAgent = agents.find((a) => a.id === assignedAgentId) || agents[0];
    const finalPhone = `${countryCode} ${rawPhone.trim()}`;
    const finalSource: LeadSource = leadSource === ('Other' as any) ? (customLeadSource as any || 'Manual Entry') : leadSource;

    return {
      id: `lead-${Date.now()}`,
      name: fullName.trim(),
      phone: finalPhone,
      email: email.trim(),
      company: companyName || 'Individual',
      city: city || 'Not Specified',
      state: state || 'Not Specified',
      source: finalSource,
      status: leadStatus,
      pipelineStageId: 'stage-1',
      dealValue: Number(dealValue) || 100000,
      ownerAgentId: assignedAgent?.id || 'agent-1',
      ownerAgentName: assignedAgent?.name || 'Unassigned',
      createdAt: 'Just Now',
      updatedAt: 'Just Now',
      aiScore: priority === 'Hot' ? 88 : priority === 'Warm' ? 68 : 45,
      aiRating: priority,
      aiReasoning: 'Inbound lead entry',
      customFields: customFieldValues,
      tags: selectedTags,
      notes: notes || requirement || 'Added manually.',
      pincode: pincode,
      priority: priority,
      followUpAt: followUpDate || undefined,
      followUpNotes: followUpNotes || undefined,
      alternatePhone: alternatePhone || undefined,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || campaignName || undefined,
    };
  };

  const handleSaveSingleLead = (action: 'save' | 'save_and_add_another' | 'save_and_call') => {
    if (!validateForm()) return;

    const newLead = constructLead();

    if (action === 'save_and_call') {
      if (onSaveAndCall) {
        onSaveAndCall(newLead);
      } else {
        onSaveLead(newLead);
      }
    } else {
      onSaveLead(newLead);
    }

    handleClearDraft();

    if (action === 'save_and_add_another') {
      setFullName('');
      setRawPhone('');
      setEmail('');
      setCompanyName('');
      setRequirement('');
      setNotes('');
      setDuplicateWarning(null);
      alert('Lead saved successfully! Ready to add another.');
    } else if (action === 'save') {
      onCancel();
    }
  };

  // -------------------------------------------------------------
  // TAB 2: BULK CSV / EXCEL UPLOAD STATE
  // -------------------------------------------------------------
  const [csvStep, setCsvStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState('');
  const [columnMappings, setColumnMappings] = useState({
    name: 'Full Name',
    phone: 'Phone Number',
    email: 'Email ID',
    company: 'Company Name',
    city: 'City',
    source: 'Lead Source',
    dealValue: 'Deal Value',
  });
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importFinished, setImportFinished] = useState(false);

  const handleSimulateCsvDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      setCsvStep(2);
    }
  };

  const handleDownloadSampleCsv = () => {
    const headers = ['Full Name', 'Phone Number', 'Email ID', 'Company Name', 'City', 'Lead Source', 'Deal Value'];
    const row1 = ['Vikram Sharma', '+919876543210', 'vikram@sharmagroup.in', 'Sharma Enterprises', 'Mumbai', 'Facebook Ads', '250000'];
    const row2 = ['Neha Kulkarni', '+919988776655', 'neha.k@puneventure.com', 'Pune Venture', 'Pune', 'IndiaMart', '180000'];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row1.join(','), row2.join(',')].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Sample_Leads_Import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartCsvImport = () => {
    setIsImporting(true);
    setCsvStep(3);
    setImportProgress(0);

    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          setImportFinished(true);

          const dummyBulkLeads: Partial<Lead>[] = [
            { name: 'Vikram Sharma', phone: '+91 9876543210', email: 'vikram@sharmagroup.in', company: 'Sharma Enterprises', city: 'Mumbai', source: 'Facebook Ads', dealValue: 250000, status: 'New Lead' },
            { name: 'Neha Kulkarni', phone: '+91 9988776655', email: 'neha.k@puneventure.com', company: 'Pune Venture', city: 'Pune', source: 'IndiaMart', dealValue: 180000, status: 'New Lead' },
            { name: 'Ananya Roy', phone: '+91 9831002233', email: 'ananya@roytech.com', company: 'Roy Tech Solutions', city: 'Kolkata', source: 'Google Ads', dealValue: 320000, status: 'New Lead' },
          ];
          onImportBulkLeads(dummyBulkLeads);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // -------------------------------------------------------------
  // TAB 3: INTEGRATIONS SUBMIT
  // -------------------------------------------------------------
  const handlePushIntegrationLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!integName || !integPhone) {
      alert('Please enter Name and Phone number for the integration lead.');
      return;
    }

    const assigned = agents[0];
    const newIntegLead: Lead = {
      id: `lead-integ-${Date.now()}`,
      name: integName,
      phone: integPhone.startsWith('+') ? integPhone : `+91 ${integPhone}`,
      email: integEmail || 'client@integration.io',
      company: integCampaign ? `@${integCampaign}` : 'Meta Lead Ads',
      city: integCity || 'Mumbai',
      state: 'Maharashtra',
      source: integProvider as LeadSource || 'Facebook Ads',
      status: 'New Lead',
      pipelineStageId: 'stage-1',
      dealValue: 150000,
      ownerAgentId: assigned?.id || 'agent-1',
      ownerAgentName: assigned?.name || 'Unassigned',
      createdAt: 'Just Now',
      updatedAt: 'Just Now',
      aiScore: 92,
      aiRating: 'Hot',
      aiReasoning: `Ingested automatically from ${integProvider} live webhook`,
      customFields: {},
      tags: ['Integration', integProvider.replace(/\s+/g, '')],
      notes: `Lead generated via campaign @${integCampaign}`,
      utmCampaign: integCampaign,
      utmSource: integProvider.toLowerCase(),
    };

    onSaveLead(newIntegLead);
    setIntegSuccessMsg(`Lead "${integName}" ingested successfully from ${integProvider}!`);
    setTimeout(() => setIntegSuccessMsg(''), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 p-3 md:p-5 font-sans text-slate-900">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Add New Lead</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create single contacts, import Excel / CSV files, or connect lead forms via integrations.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <button
            onClick={handleSaveDraft}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer flex items-center space-x-1"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Draft Restored Banner Notification */}
      {draftSavedAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between font-medium">
          <span className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Form draft saved locally.</span>
          </span>
          <button onClick={handleClearDraft} className="text-slate-500 hover:text-slate-900 underline text-xs">
            Clear Draft
          </button>
        </div>
      )}

      {/* 3 Main Mode Tabs: Single Lead | Excel / CSV | From Integrations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 font-medium">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'single'
              ? 'bg-white text-indigo-700 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <UserPlus className="w-4 h-4 text-indigo-600" />
          <span>1. Add Single Lead</span>
        </button>

        <button
          onClick={() => setActiveTab('excel')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'excel'
              ? 'bg-white text-indigo-700 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>2. Excel / CSV Import</span>
        </button>

        <button
          onClick={() => setActiveTab('integration')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'integration'
              ? 'bg-white text-indigo-700 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Link2 className="w-4 h-4 text-violet-600" />
          <span>3. From Integrations</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ADD SINGLE LEAD FORM */}
      {/* ========================================================================= */}
      {activeTab === 'single' && (
        <div className="space-y-4">
          {/* Real-time Duplicate Phone Warning */}
          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Duplicate Notice:</strong> Lead with phone number <strong>{duplicateWarning.phone}</strong> already exists ({duplicateWarning.name} - Assigned to {duplicateWarning.ownerAgentName}).
                </span>
              </div>
              <button
                onClick={() => {
                  setFullName(duplicateWarning.name);
                  setEmail(duplicateWarning.email || '');
                  setCity(duplicateWarning.city || '');
                  setCompanyName(duplicateWarning.company || '');
                }}
                className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold cursor-pointer shrink-0 ml-2"
              >
                Autofill Existing
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Contact Information */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                <User className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  1. Contact Information
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full bg-slate-50 border ${
                      formErrors.fullName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    } rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500`}
                  />
                  {formErrors.fullName && <p className="text-[11px] text-rose-600 mt-1">{formErrors.fullName}</p>}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Code</label>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (UAE)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={rawPhone}
                      onChange={(e) => setRawPhone(e.target.value)}
                      placeholder="9876543210"
                      className={`w-full bg-slate-50 border ${
                        formErrors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      } rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="400001"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Mumbai"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Maharashtra"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Assignment & Status */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                <Tag className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2. Lead Assignment & Status
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Lead Source</label>
                    <select
                      value={leadSource}
                      onChange={(e) => setLeadSource(e.target.value as LeadSource)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Facebook Ads">Facebook Ads</option>
                      <option value="Google Ads">Google Ads</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Website Form">Website Form</option>
                      <option value="IndiaMart">IndiaMart</option>
                      <option value="JustDial">JustDial</option>
                      <option value="Referral">Referral</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Lead Status</label>
                    <select
                      value={leadStatus}
                      onChange={(e) => setLeadStatus(e.target.value as LeadStatus)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="New Lead">New Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Follow-Up Scheduled">Follow-Up Scheduled</option>
                      <option value="Interested">Interested</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold">Assigned Telecaller</label>
                    <button
                      type="button"
                      onClick={handleSuggestBestAgent}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>Auto Assign</span>
                    </button>
                  </div>
                  <select
                    value={assignedAgentId}
                    onChange={(e) => setAssignedAgentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.role}) - {agent.totalCallsToday} calls today
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['Hot', 'Warm', 'Cold'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer border text-center ${
                            priority === p
                              ? p === 'Hot'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                                : p === 'Warm'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                                : 'bg-slate-100 text-slate-800 border-slate-300 font-bold'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Est. Deal Value (₹)</label>
                    <input
                      type="number"
                      value={dealValue}
                      onChange={(e) => setDealValue(Number(e.target.value))}
                      placeholder="100000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Context & Requirements */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                <Building className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  3. Business & Requirements
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Sharma Enterprises"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Lead Notes / Requirement</label>
                  <textarea
                    rows={2}
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    placeholder="Describe specific client needs, budget, or discussion notes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tags</label>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center space-x-1"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-600 cursor-pointer ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Add tag and press Enter"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Next Follow-Up */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  4. Schedule Follow-Up
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Follow-Up Date & Time</label>
                  <input
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Follow-Up Agenda / Note</label>
                  <input
                    type="text"
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="e.g. Call regarding quotation review"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center space-x-2 text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappOptIn}
                      onChange={(e) => setWhatsappOptIn(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Send automated WhatsApp introduction message</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Dynamic Custom Fields Section */}
          {customFields && customFields.filter(f => !f.isHidden).length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    5. Dynamic Custom Fields ({customFields.filter(f => !f.isHidden).length})
                  </h2>
                </div>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('fields')}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Manage Fields</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {customFields
                  .filter((f) => !f.isHidden)
                  .map((field) => {
                    const val = customFieldValues[field.name] ?? '';
                    return (
                      <div key={field.id} className="space-y-1">
                        <label className="block text-slate-700 font-semibold truncate flex items-center justify-between">
                          <span>
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                          </span>
                          {field.category && (
                            <span className="text-[9px] font-mono text-slate-400 font-normal">
                              {field.category}
                            </span>
                          )}
                        </label>

                        {field.type === 'dropdown' ? (
                          <select
                            value={val}
                            onChange={(e) =>
                              setCustomFieldValues((prev) => ({
                                ...prev,
                                [field.name]: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">-- Select {field.label} --</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'boolean' ? (
                          <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) =>
                                setCustomFieldValues((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.checked,
                                }))
                              }
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-slate-700">Yes / Completed</span>
                          </label>
                        ) : field.type === 'date' ? (
                          <input
                            type="date"
                            value={val}
                            onChange={(e) =>
                              setCustomFieldValues((prev) => ({
                                ...prev,
                                [field.name]: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                          >
                          </input>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            rows={2}
                            value={val}
                            onChange={(e) =>
                              setCustomFieldValues((prev) => ({
                                ...prev,
                                [field.name]: e.target.value,
                              }))
                            }
                            placeholder={`Enter ${field.label}...`}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                        ) : (
                          <input
                            type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
                            value={val}
                            onChange={(e) =>
                              setCustomFieldValues((prev) => ({
                                ...prev,
                                [field.name]: e.target.value,
                              }))
                            }
                            placeholder={`Enter ${field.label}...`}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Optional Advanced Settings Toggle */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer border-b border-slate-200"
            >
              <span className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Advanced Marketing & Campaign Settings (Optional)</span>
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Q3_FB_Leads"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">UTM Source</label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="facebook"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">UTM Medium</label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="cpc"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveSingleLead('save_and_add_another')}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-all cursor-pointer"
              >
                Save & Add Another
              </button>

              {onSaveAndCall && (
                <button
                  type="button"
                  onClick={() => handleSaveSingleLead('save_and_call')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Save & Call Now</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSaveSingleLead('save')}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                Save Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXCEL / CSV IMPORT WIZARD */}
      {/* ========================================================================= */}
      {activeTab === 'excel' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          {/* Wizard Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-semibold">
            <span className="text-slate-900 font-bold">Excel & CSV Bulk Lead Import Wizard</span>
            <span className="text-slate-500">Step {csvStep} of 3</span>
          </div>

          {/* STEP 1: Upload File */}
          {csvStep === 1 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-all">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900 mb-1">Upload Excel (.xlsx) or CSV Spreadsheet</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Drag and drop your sales lead list here or click browse to choose file.
                </p>
                <label className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer inline-block shadow-xs">
                  Browse Excel / CSV File
                  <input type="file" accept=".csv,.xlsx" onChange={handleSimulateCsvDrop} className="hidden" />
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleDownloadSampleCsv}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Sample Excel / CSV Template</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Map Columns */}
          {csvStep === 2 && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-center justify-between font-semibold">
                <span>File Loaded: <strong>{fileName || 'Leads_Import.csv'}</strong></span>
                <button onClick={() => setCsvStep(1)} className="text-emerald-700 hover:underline">Change File</button>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Column Field Mapper</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {Object.entries(columnMappings).map(([field, sample]) => (
                    <div key={field} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                      <span className="font-semibold text-slate-700 capitalize">{field}</span>
                      <span className="text-emerald-600 font-semibold">{sample}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  onClick={() => setCsvStep(1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleStartCsvImport}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Start Import
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Progress & Finished */}
          {csvStep === 3 && (
            <div className="space-y-4 text-center py-6">
              {!importFinished ? (
                <div className="space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">Importing Excel Leads...</h3>
                  <div className="w-full bg-slate-200 rounded-full h-2 max-w-md mx-auto">
                    <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">{importProgress}% Completed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">Excel Import Complete!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Successfully imported sample leads into your CRM database.
                  </p>
                  <button
                    onClick={onCancel}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Go to Directory
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FROM INTEGRATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'integration' && (
        <div className="space-y-4">
          {integSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{integSuccessMsg}</span>
            </div>
          )}

          {/* Active Connectors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'Meta Ads', title: 'Meta Lead Ads (FB & IG)', status: 'Connected & Syncing', count: '167 Leads', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
              { id: 'Google Ads', title: 'Google Lead Forms', status: 'Connected (API V2)', count: '48 Leads', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
              { id: 'IndiaMart', title: 'IndiaMART Buyer Leads', status: 'Connected', count: '32 Leads', color: 'bg-amber-50 border-amber-200 text-amber-700' },
              { id: 'Justdial', title: 'Justdial Express Sync', status: 'Connected', count: '19 Leads', color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { id: 'Website Form', title: 'Website Webhook API', status: 'Active (200 OK)', count: '85 Leads', color: 'bg-purple-50 border-purple-200 text-purple-700' },
              { id: 'Zapier', title: 'Zapier & Sheet Sync', status: 'Live Sync', count: '112 Leads', color: 'bg-rose-50 border-rose-200 text-rose-700' },
            ].map((integ) => (
              <div key={integ.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{integ.title}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${integ.color}`}>
                    {integ.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Captured: <strong>{integ.count}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setIntegProvider(integ.id);
                      setIntegCampaign(`master-form-${integ.id.toLowerCase().replace(/\s+/g, '-')}`);
                    }}
                    className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer flex items-center space-x-0.5"
                  >
                    <span>Use Provider</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Test Trigger / Ingest Form from Integration */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-violet-600" />
                  <span>Simulate / Capture Inbound Integration Lead</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test instant lead ingestion from Meta Ads, Google Forms, or Webhooks.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('https://api.arclecrm.io/v1/webhooks/inbound-leads');
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5 text-violet-600" />
                  <span>{copiedWebhook ? 'Copied URL!' : 'Copy Webhook Endpoint'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handlePushIntegrationLead} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Integration Provider</label>
                <select
                  value={integProvider}
                  onChange={(e) => setIntegProvider(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                >
                  <option value="Meta Ads">Meta Lead Ads (FB & IG)</option>
                  <option value="Google Ads">Google Lead Form Ads</option>
                  <option value="IndiaMart">IndiaMART Buyer Enquiry</option>
                  <option value="Justdial">Justdial Express</option>
                  <option value="Website Form">Website Webhook API</option>
                  <option value="Zapier">Zapier / Google Sheets</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lead Full Name *</label>
                <input
                  type="text"
                  value={integName}
                  onChange={(e) => setIntegName(e.target.value)}
                  placeholder="Alexander Gheevarghese"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={integPhone}
                  onChange={(e) => setIntegPhone(e.target.value)}
                  placeholder="98590096589"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email ID</label>
                <input
                  type="email"
                  value={integEmail}
                  onChange={(e) => setIntegEmail(e.target.value)}
                  placeholder="alexvarghese619@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Form / Campaign Handle</label>
                <input
                  type="text"
                  value={integCampaign}
                  onChange={(e) => setIntegCampaign(e.target.value)}
                  placeholder="master-form-iata-cargo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">City</label>
                <input
                  type="text"
                  value={integCity}
                  onChange={(e) => setIntegCity(e.target.value)}
                  placeholder="Punalur"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="col-span-1 md:col-span-3 flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center space-x-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Push Ingested Lead</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
