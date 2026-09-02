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
import { CustomDropdown, DropdownOption } from './CustomDropdown';

interface AddLeadViewProps {
  leads: Lead[];
  agents: Agent[];
  customFields: CustomFieldDef[];
  activeAgent?: Agent;
  onSaveLead: (lead: Lead) => void;
  onSaveAndCall?: (lead: Lead) => void;
  onImportBulkLeads: (leads: Partial<Lead>[]) => void;
  onCancel: () => void;
  onNavigateToTab?: (tab: string) => void;
  onShowToast?: (msg: string) => void;
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

// All Indian States and their major cities
const INDIA_STATES_CITIES: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kurnool', 'Kakinada', 'Rajamahendravaram', 'Kadapa', 'Anantapur'],
  'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Ziro', 'Naharlagun', 'Pasighat'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Karimganj'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Arrah', 'Begusarai', 'Katihar', 'Bihar Sharif'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Ambikapur'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Calangute', 'Colva'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Nadiad', 'Bharuch', 'Morbi'],
  'Haryana': ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'],
  'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Kangra'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Davangere', 'Hassan'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur', 'Kasaragod'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Rewa', 'Satna', 'Dewas', 'Chhindwara'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Navi Mumbai', 'Pimpri-Chinchwad', 'Vasai-Virar', 'Malegaon'],
  'Manipur': ['Imphal', 'Thoubal', 'Churachandpur', 'Bishnupur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Sikar', 'Bharatpur'],
  'Sikkim': ['Gangtok', 'Namchi', 'Geyzing', 'Mangan'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore', 'Erode', 'Thoothukudi', 'Tiruppur', 'Dindigul'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Noida', 'Ghaziabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Mathura', 'Firozabad'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Rishikesh', 'Kashipur'],
  'West Bengal': ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Baharampur', 'Kharagpur', 'Howrah'],
  'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Janakpuri', 'Laxmi Nagar', 'Karol Bagh', 'Saket', 'Pitampura'],
  'Chandigarh': ['Chandigarh'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Leh'],
  'Ladakh': ['Leh', 'Kargil'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Andaman & Nicobar Islands': ['Port Blair', 'Mayabunder', 'Diglipur'],
  'Dadra & Nagar Haveli and Daman & Diu': ['Daman', 'Diu', 'Silvassa'],
  'Lakshadweep': ['Kavaratti', 'Agatti'],
};

export const AddLeadView: React.FC<AddLeadViewProps> = ({
  leads,
  agents,
  customFields,
  activeAgent,
  onSaveLead,
  onSaveAndCall,
  onImportBulkLeads,
  onCancel,
  onNavigateToTab,
  onShowToast
}) => {
  // Top Active Mode / Tab: 'single' | 'excel' | 'integration'
  const [activeTab, setActiveTab] = useState<'single' | 'excel' | 'integration'>('single');

  // Toggle for Collapsible Additional Information Accordion Bar
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false);

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
  const [dealValue, setDealValue] = useState<string>('');
  const [requirement, setRequirement] = useState('');

  const [leadStatus, setLeadStatus] = useState<LeadStatus>('Fresh');
  const [assignedAgentId, setAssignedAgentId] = useState(activeAgent?.id || agents[0]?.id || '');
  const [priority, setPriority] = useState<'Hot' | 'Warm' | 'Cold'>('Hot');

  // Auto-sync default telecaller to current active logged-in agent on initial load only
  useEffect(() => {
    if (!assignedAgentId) {
      if (activeAgent?.id) {
        setAssignedAgentId(activeAgent.id);
      } else if (agents.length > 0) {
        setAssignedAgentId(agents[0].id);
      }
    }
  }, [activeAgent, agents]);

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

  // Handle Pincode Auto-Fill (digits only, max 6)
  const handlePincodeChange = (pinVal: string) => {
    const cleaned = pinVal.replace(/\D/g, '').slice(0, 6);
    setPincode(cleaned);
    if (PINCODE_DATABASE[cleaned]) {
      const data = PINCODE_DATABASE[cleaned];
      setCity(data.city);
      setState(data.state);
      setCountry(data.country);
    }
  };

  // When state changes reset city
  const handleStateChange = (stateVal: string) => {
    setState(stateVal);
    setCity('');
  };

  // AI Agent Recommender - Picks randomly from all available assignees
  const handleSuggestBestAgent = () => {
    if (!agents || agents.length === 0) return;
    const randomIndex = Math.floor(Math.random() * agents.length);
    setAssignedAgentId(agents[randomIndex].id);
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
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      errs.fullName = 'Full Name must be at least 2 characters.';
    }

    const digitsOnly = rawPhone.trim().replace(/\D/g, '');
    if (!rawPhone.trim()) {
      errs.phone = 'Phone Number is required.';
    } else if (digitsOnly.length < 10) {
      errs.phone = 'Phone number must contain at least 10 valid digits.';
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Email must be a valid address containing "@" and domain (e.g. name@company.com).';
    }

    if (pincode && pincode.trim().replace(/\D/g, '').length !== 6) {
      errs.pincode = 'Pincode must be exactly 6 digits.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const constructLead = (): Lead => {
    const assignedAgent = agents.find((a) => a.id === assignedAgentId);
    // If created without an assignee, automatically assign to current user account creating the lead
    const finalOwnerId = assignedAgent ? assignedAgent.id : (assignedAgentId || activeAgent?.id || agents[0]?.id || 'agent-admin');
    const finalOwnerName = assignedAgent ? assignedAgent.name : (agents.find((a) => a.id === assignedAgentId)?.name || activeAgent?.name || agents[0]?.name || 'Madhava sai nagendra');
    const finalPhone = `${countryCode} ${rawPhone.trim()}`;
    const finalSource: LeadSource = leadSource === ('Other' as any) ? (customLeadSource as any || 'Manual Entry') : leadSource;

    return {
      id: `lead-${Date.now()}`,
      name: fullName.trim(),
      phone: finalPhone,
      email: email.trim(),
      company: companyName || '',
      city: city || 'Not Specified',
      state: state || 'Not Specified',
      source: finalSource,
      status: leadStatus,
      pipelineStageId: 'stage-1',
      dealValue: Number(dealValue) || 0,
      ownerAgentId: finalOwnerId,
      ownerAgentName: finalOwnerName,
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
      whatsappOptIn: whatsappOptIn,
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
      setDealValue('');
      setRequirement('');
      setNotes('');
      setDuplicateWarning(null);
      if (onShowToast) onShowToast('Lead saved successfully! Ready to add another.');
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
      if (onShowToast) onShowToast('Please enter Name and Phone number for the integration lead.');
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
      ownerAgentId: assigned?.id || activeAgent?.id || agents[0]?.id || 'agent-admin',
      ownerAgentName: assigned?.name || activeAgent?.name || agents[0]?.name || 'System Administrator',
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

      {/* 2 Main Mode Tabs: Single Lead | Excel / CSV */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 font-medium">
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
              <div className="border-b border-slate-100 pb-2.5">
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
                    <CustomDropdown<string>
                      value={countryCode}
                      onChange={(val) => setCountryCode(val)}
                      options={[
                        { value: '+91', label: '+91 (IN)' },
                        { value: '+1', label: '+1 (US)' },
                        { value: '+44', label: '+44 (UK)' },
                        { value: '+971', label: '+971 (UAE)' },
                      ]}
                      align="left"
                      wrapperClassName="w-full"
                      className="w-full bg-slate-50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={rawPhone}
                      maxLength={10}
                      onChange={(e) => setRawPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className={`w-full bg-slate-50 border ${
                        formErrors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      } rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Email Address <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="rahul@example.com"
                    className={`w-full bg-slate-50 border ${
                      formErrors.email ? 'border-rose-400 bg-rose-50/50 focus:border-rose-600' : 'border-slate-200 focus:border-indigo-500'
                    } rounded-lg px-3 py-2 text-slate-900 focus:outline-none`}
                  />
                  {formErrors.email && <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      maxLength={6}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="400001"
                      className={`w-full bg-slate-50 border ${
                        formErrors.pincode ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      } rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.pincode && <p className="text-[11px] text-rose-600 mt-1">{formErrors.pincode}</p>}
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">State</label>
                    <CustomDropdown<string>
                      value={state}
                      onChange={(val) => handleStateChange(val)}
                      options={[
                        { value: '', label: 'Select State' },
                        ...Object.keys(INDIA_STATES_CITIES).sort().map((s) => ({ value: s, label: s }))
                      ]}
                      placeholder="Select State"
                      align="left"
                      wrapperClassName="w-full"
                      className="w-full bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">City</label>
                    <CustomDropdown<string>
                      value={city}
                      onChange={(val) => setCity(val)}
                      options={[
                        { value: '', label: state ? 'Select City' : 'Select State first' },
                        ...(INDIA_STATES_CITIES[state] || []).map((c) => ({ value: c, label: c }))
                      ]}
                      placeholder={state ? 'Select City' : 'Select State first'}
                      align="left"
                      wrapperClassName="w-full"
                      className="w-full bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Assignment & Status */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2. Lead Assignment & Status
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Lead Source</label>
                    <CustomDropdown<LeadSource>
                      value={leadSource}
                      onChange={(val) => setLeadSource(val)}
                      options={[
                        { value: 'Facebook Ads', label: 'Facebook Ads' },
                        { value: 'Google Ads', label: 'Google Ads' },
                        { value: 'WhatsApp', label: 'WhatsApp' },
                        { value: 'Website Form', label: 'Website Form' },
                        { value: 'IndiaMart', label: 'IndiaMart' },
                        { value: 'JustDial', label: 'JustDial' },
                        { value: 'Referral', label: 'Referral' },
                        { value: 'Other', label: 'Other' },
                      ]}
                      align="left"
                      wrapperClassName="w-full"
                      className="w-full bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Lead Status</label>
                    <CustomDropdown<LeadStatus>
                      value={leadStatus}
                      onChange={(val) => setLeadStatus(val)}
                      options={[
                        { value: 'New Lead', label: 'New Lead' },
                        { value: 'Contacted', label: 'Contacted' },
                        { value: 'Follow-Up Scheduled', label: 'Follow-Up Scheduled' },
                        { value: 'Interested', label: 'Interested' },
                        { value: 'Converted', label: 'Converted' },
                        { value: 'Lost', label: 'Lost' },
                      ]}
                      align="left"
                      wrapperClassName="w-full"
                      className="w-full bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold">Assigned Telecaller</label>
                    <button
                      type="button"
                      onClick={handleSuggestBestAgent}
                      className="text-[11px] text-[#3a2088] hover:underline font-semibold cursor-pointer"
                    >
                      Auto Assign
                    </button>
                  </div>
                  <CustomDropdown<string>
                    value={assignedAgentId}
                    onChange={(val) => setAssignedAgentId(val)}
                    options={[
                      { value: '', label: `Auto-Assign to Me (${activeAgent?.name || 'Creator'})` },
                      ...agents.map((agent) => ({
                        value: agent.id,
                        label: agent.name,
                      })),
                    ]}
                    align="left"
                    wrapperClassName="w-full"
                    className="w-full bg-slate-50"
                  />
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
                      type="text"
                      inputMode="numeric"
                      value={dealValue}
                      onChange={(e) => setDealValue(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
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
                          <CustomDropdown<string>
                            value={val || ''}
                            onChange={(newVal) =>
                              setCustomFieldValues((prev) => ({
                                ...prev,
                                [field.name]: newVal,
                              }))
                            }
                            options={[
                              { value: '', label: `-- Select ${field.label} --` },
                              ...(field.options || []).map((opt) => ({ value: opt, label: opt })),
                            ]}
                            placeholder={`-- Select ${field.label} --`}
                            align="left"
                            wrapperClassName="w-full"
                            className="w-full bg-slate-50"
                          />
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
                            type={field.type === 'number' || field.type === 'currency' ? 'number' : field.type === 'phone' ? 'tel' : 'text'}
                            value={val}
                            onChange={(e) => {
                              const inputVal = e.target.value;
                              const filteredVal = (field.type === 'number' || field.type === 'phone' || field.type === 'currency')
                                ? inputVal.replace(/\D/g, '')
                                : inputVal;
                              setCustomFieldValues((prev) => ({
                                ...prev,
                                [field.name]: filteredVal,
                              }));
                            }}
                            placeholder={field.type === 'phone' || field.type === 'number' ? 'e.g. 9876543210' : `Enter ${field.label}...`}
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
                className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-sky-500/25"
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

    </div>
  );
};
