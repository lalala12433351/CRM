import React, { useState } from 'react';
import { 
  Search, 
  Globe, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Bell, 
  RefreshCw, 
  ChevronLeft, 
  Plus, 
  Download, 
  User, 
  ChevronRight, 
  Calendar, 
  Users, 
  Clock, 
  MoreVertical, 
  LogOut 
} from 'lucide-react';

export interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  category: 'social' | 'crm' | 'telephony' | 'ecommerce' | 'messaging' | 'payments' | 'realestate' | 'education' | 'other';
  iconBg?: string;
  iconType: string;
  webhookUrl?: string;
  apiKey?: string;
  lastSync?: string;
}

export interface ConnectedForm {
  id: string;
  title: string;
  companyName: string;
  period: string;
  totalLeads: number;
  lastLeadTime: string;
  campaignHandle: string;
}

export interface IntegrationsViewProps {
  onNavigateToCampaign?: (campaignHandle: string) => void;
  onOpenGoogleSheets?: () => void;
}

const INITIAL_CONNECTED_FORMS: ConnectedForm[] = [
  {
    id: 'f-1',
    title: 'Master Form IATA Cargo',
    companyName: 'Kite Institute of Aviation & Hospitality',
    period: '2M',
    totalLeads: 167,
    lastLeadTime: '19h',
    campaignHandle: '@master-form-iata-cargo'
  },
  {
    id: 'f-2',
    title: 'Master Form-Kerala-Vendor-Data',
    companyName: 'Kite Institute of Aviation & Hospitality',
    period: '2M',
    totalLeads: 140,
    lastLeadTime: '1M',
    campaignHandle: '@master-form-kerala-vendor-data'
  },
  {
    id: 'f-3',
    title: 'Master Form-Karnataka-Vendor-data',
    companyName: 'Kite Institute of Aviation & Hospitality',
    period: '2M',
    totalLeads: 325,
    lastLeadTime: '17d',
    campaignHandle: '@master-form-karnataka-vendor-data'
  },
  {
    id: 'f-4',
    title: 'Master Form IATA',
    companyName: 'Kite Institute of Aviation & Hospitality',
    period: '3M',
    totalLeads: 492,
    lastLeadTime: '1M',
    campaignHandle: '@master-form-iata'
  },
  {
    id: 'f-5',
    title: 'Master Form',
    companyName: 'Kite Institute of Aviation & Hospitality',
    period: '3M',
    totalLeads: 1108,
    lastLeadTime: '1h',
    campaignHandle: '@master-form'
  },
  {
    id: 'f-6',
    title: 'Master Form-IATA-Cargo-V2',
    companyName: 'Kite Institute of Aviation & Hospitality',
    period: '1M',
    totalLeads: 84,
    lastLeadTime: '3h',
    campaignHandle: '@master-form-iata-cargo-v2'
  },
  {
    id: 'f-7',
    title: 'Vendor-Data-Kerala',
    companyName: 'Kite Institute of Aviation & Hospitality',
    period: '2M',
    totalLeads: 310,
    lastLeadTime: '1d',
    campaignHandle: '@vendor-data-kerala'
  },
  {
    id: 'f-8',
    title: 'IATA Meta 01',
    companyName: 'Kite Institute of Aviation & Hospitality',
    period: '2M',
    totalLeads: 120,
    lastLeadTime: '5h',
    campaignHandle: '@iata-meta-01'
  }
];

const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  // Active Integrations (3)
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Capture leads directly from Facebook & Instagram Lead Ads in real time.',
    isActive: true,
    category: 'social',
    iconType: 'facebook',
    webhookUrl: 'https://api.telecrm.in/v1/webhooks/facebook/fb_app_982347',
    lastSync: '2 mins ago'
  },
  {
    id: 'justdial',
    name: 'JustDial',
    description: 'Capture instant inquiry leads from JustDial portal feed into Telecrm account.',
    isActive: true,
    category: 'other',
    iconType: 'justdial',
    webhookUrl: 'https://api.telecrm.in/v1/webhooks/justdial/jd_key_4482',
    lastSync: '15 mins ago'
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Bidirectional sync with Google Drive spreadsheets, 1-click lead export & AI bulk import.',
    isActive: true,
    category: 'other',
    iconType: 'google_sheets',
    lastSync: 'Sync Connected'
  },
  {
    id: 'website_api',
    name: 'Website/API',
    description: 'Webhooks and REST API endpoint for capturing custom website form leads.',
    isActive: true,
    category: 'other',
    iconType: 'website_api',
    webhookUrl: 'https://api.telecrm.in/v1/leads/public/push?key=tc_live_8912739182',
    lastSync: 'Just now'
  },

  // Available Integrations (21)
  {
    id: '99acres',
    name: '99acres',
    description: 'Capture 99acres Leads in your Telecrm account',
    isActive: false,
    category: 'realestate',
    iconType: '99acres'
  },
  {
    id: 'callerdesk',
    name: 'CallerDesk',
    description: 'Integrate CallerDesk in your Telecrm account',
    isActive: false,
    category: 'telephony',
    iconType: 'callerdesk'
  },
  {
    id: 'google_meet',
    name: 'Google Meet',
    description: 'Integrate google meet in your Telecrm Account',
    isActive: false,
    category: 'other',
    iconType: 'google_meet'
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Integrate Google sheet in your Telecrm account',
    isActive: false,
    category: 'other',
    iconType: 'google_sheets'
  },
  {
    id: 'housing',
    name: 'Housing',
    description: 'Integrate Housing.com in your Telecrm account',
    isActive: false,
    category: 'realestate',
    iconType: 'housing'
  },
  {
    id: 'indiamart',
    name: 'IndiaMart',
    description: 'Integrate IndiaMart in your Telecrm account',
    isActive: false,
    category: 'other',
    iconType: 'indiamart'
  },
  {
    id: 'knowlarity',
    name: 'Knowlarity',
    description: 'Integrate Knowlarity in your Telecrm account',
    isActive: false,
    category: 'telephony',
    iconType: 'knowlarity'
  },
  {
    id: 'magicbricks',
    name: 'MagicBricks',
    description: 'Capture MagicBricks Leads in your Telecrm account',
    isActive: false,
    category: 'realestate',
    iconType: 'magicbricks'
  },
  {
    id: 'maqsam',
    name: 'Maqsam',
    description: 'Integrate Maqsam in your Telecrm account',
    isActive: false,
    category: 'telephony',
    iconType: 'maqsam'
  },
  {
    id: 'mcube',
    name: 'Mcube',
    description: 'Integrate MCube in your Telecrm account',
    isActive: false,
    category: 'telephony',
    iconType: 'mcube'
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    description: 'Receive new leads from Razorpay in your Telecrm account',
    isActive: false,
    category: 'payments',
    iconType: 'razorpay'
  },
  {
    id: 'shiksha',
    name: 'Shiksha',
    description: 'Capture Shiksha Leads in your Telecrm account',
    isActive: false,
    category: 'education',
    iconType: 'shiksha'
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Integrate Shopify in your Telecrm account',
    isActive: false,
    category: 'ecommerce',
    iconType: 'shopify'
  },
  {
    id: 'sulekha',
    name: 'Sulekha',
    description: 'Capture Sulekha Leads in your Telecrm account',
    isActive: false,
    category: 'other',
    iconType: 'sulekha'
  },
  {
    id: 'tatatele',
    name: 'Tata Tele',
    description: 'Integrate Tata Tele in your Telecrm Account',
    isActive: false,
    category: 'telephony',
    iconType: 'tatatele'
  },
  {
    id: 'telecmi',
    name: 'TeleCMI',
    description: 'Integrate TeleCMI in your Telecrm Account',
    isActive: false,
    category: 'telephony',
    iconType: 'telecmi'
  },
  {
    id: 'trade_india',
    name: 'Trade India',
    description: 'Integrate Trade India in your Telecrm Account',
    isActive: false,
    category: 'other',
    iconType: 'trade_india'
  },
  {
    id: 'whatsapp',
    name: 'Whatsapp',
    description: 'Receive new leads from your Whatsapp in your Telecrm account',
    isActive: false,
    category: 'messaging',
    iconType: 'whatsapp'
  },
  {
    id: 'whatsapp_widget',
    name: 'Whatsapp Chat Widget',
    description: 'Receive new leads from WhatsApp chat widget into Telecrm account',
    isActive: false,
    category: 'messaging',
    iconType: 'whatsapp_widget'
  },
  {
    id: 'whatsapp_cloud_api',
    name: 'Whatsapp Cloud API',
    description: 'Receive new leads from your Whatsapp Cloud API in your Telecrm account',
    isActive: false,
    category: 'messaging',
    iconType: 'whatsapp_cloud_api'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Integrate WooCommerce in your Telecrm account',
    isActive: false,
    category: 'ecommerce',
    iconType: 'woocommerce'
  }
];

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ 
  onNavigateToCampaign,
  onOpenGoogleSheets 
}) => {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INITIAL_INTEGRATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationDismissed, setNotificationDismissed] = useState(false);
  
  // Manage Mode Detail State
  const [selectedManageIntegration, setSelectedManageIntegration] = useState<IntegrationItem | null>(null);
  const [formsList, setFormsList] = useState<ConnectedForm[]>(INITIAL_CONNECTED_FORMS);
  const [formSearchTerm, setFormSearchTerm] = useState('');
  const [formViewMode, setFormViewMode] = useState<'card' | 'stats'>('card');
  
  // Modal State for activation/webhook
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Detail view action modals
  const [isAddFormModalOpen, setIsAddFormModalOpen] = useState(false);
  const [isAddNewAccountModalOpen, setIsAddNewAccountModalOpen] = useState(false);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');

  // Filtered integrations
  const filteredIntegrations = integrations.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeIntegrations = filteredIntegrations.filter((item) => item.isActive);
  const availableIntegrations = filteredIntegrations.filter((item) => !item.isActive);

  // Filtered forms in manage mode
  const filteredForms = formsList.filter((f) =>
    f.title.toLowerCase().includes(formSearchTerm.toLowerCase()) ||
    f.companyName.toLowerCase().includes(formSearchTerm.toLowerCase())
  );

  // Open manage detail or activation modal
  const handleOpenModal = (integration: IntegrationItem) => {
    if (integration.id === 'google_sheets') {
      if (onOpenGoogleSheets) {
        onOpenGoogleSheets();
        return;
      }
    }
    if (integration.isActive) {
      setSelectedManageIntegration(integration);
    } else {
      setSelectedIntegration(integration);
      setApiKeyInput(integration.apiKey || '');
      setIsModalOpen(true);
    }
  };

  // Toggle activation status
  const handleToggleActivation = (id: string, newStatus: boolean) => {
    setIsSaving(true);
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              isActive: newStatus,
              webhookUrl: newStatus
                ? item.webhookUrl || `https://api.telecrm.in/v1/webhooks/${item.id}/${Math.random().toString(36).substring(2, 10)}`
                : item.webhookUrl,
              lastSync: newStatus ? 'Just now' : undefined
            };
          }
          return item;
        })
      );
      setIsSaving(false);
      setIsModalOpen(false);
    }, 400);
  };

  // Copy webhook URL
  const handleCopyWebhook = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Handle Add Lead Form in Manage Detail Mode
  const handleAddLeadForm = () => {
    if (!newFormTitle.trim()) return;
    const newForm: ConnectedForm = {
      id: `f-${Date.now()}`,
      title: newFormTitle.trim(),
      companyName: 'Kite Institute of Aviation & Hospitality',
      period: '1M',
      totalLeads: 0,
      lastLeadTime: 'Just now',
      campaignHandle: `@${newFormTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    };
    setFormsList((prev) => [newForm, ...prev]);
    setNewFormTitle('');
    setIsAddFormModalOpen(false);
  };

  // Helper function to render brand logos with high visual fidelity
  const renderBrandIcon = (iconType: string, name: string) => {
    switch (iconType) {
      case 'facebook':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center text-white font-bold text-xl shadow-xs shrink-0">
            f
          </div>
        );
      case 'justdial':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#FF6A00] flex items-center justify-center text-white font-black text-sm shrink-0 font-sans tracking-tighter">
            Jd
          </div>
        );
      case 'website_api':
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
        );
      case '99acres':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#0081C8] flex flex-col items-center justify-center text-white text-[10px] font-black shrink-0 leading-tight">
            <span>99</span>
            <span className="text-[7px]">acres</span>
          </div>
        );
      case 'callerdesk':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#E53935] flex items-center justify-center text-white font-bold text-base shrink-0">
            CD
          </div>
        );
      case 'google_meet':
        return (
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0 shadow-2xs">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">M</span>
          </div>
        );
      case 'google_sheets':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#0F9D58] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-2xs">
            田
          </div>
        );
      case 'housing':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#FFC107] flex items-center justify-center text-slate-900 font-black text-sm shrink-0">
            🏠
          </div>
        );
      case 'indiamart':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#D32F2F] flex items-center justify-center text-white font-bold text-sm shrink-0">
            iM
          </div>
        );
      case 'knowlarity':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#1565C0] flex items-center justify-center text-white font-bold text-sm shrink-0">
            Kn
          </div>
        );
      case 'magicbricks':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#E64A19] flex items-center justify-center text-white font-black text-xs shrink-0">
            mb
          </div>
        );
      case 'maqsam':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#00BCD4] flex items-center justify-center text-white font-bold text-sm shrink-0">
            Mq
          </div>
        );
      case 'mcube':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#3F51B5] flex items-center justify-center text-white font-bold text-xs shrink-0">
            Mc
          </div>
        );
      case 'razorpay':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#02042B] border border-blue-500/30 flex items-center justify-center text-[#3395FF] font-black text-base shrink-0">
            ⚡
          </div>
        );
      case 'shiksha':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#009688] flex items-center justify-center text-white font-bold text-sm shrink-0">
            🎓
          </div>
        );
      case 'shopify':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#96BF48] flex items-center justify-center text-white font-bold text-lg shrink-0">
            🛍️
          </div>
        );
      case 'sulekha':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#FF5722] flex items-center justify-center text-white font-bold text-sm shrink-0">
            Su
          </div>
        );
      case 'tatatele':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#0D47A1] flex items-center justify-center text-white font-bold text-xs shrink-0">
            TATA
          </div>
        );
      case 'telecmi':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#E91E63] flex items-center justify-center text-white font-bold text-xs shrink-0">
            CMI
          </div>
        );
      case 'trade_india':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#C2185B] flex items-center justify-center text-white font-bold text-xs shrink-0">
            ti
          </div>
        );
      case 'whatsapp':
      case 'whatsapp_widget':
      case 'whatsapp_cloud_api':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-2xs">
            💬
          </div>
        );
      case 'woocommerce':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#96588A] flex items-center justify-center text-white font-bold text-base shrink-0">
            Woo
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm shrink-0">
            {name.slice(0, 2)}
          </div>
        );
    }
  };

  {/* ========================================================================= */}
  {/* MANAGE DETAIL VIEW MODE (MATCHES USER SCREENSHOT 100%) */}
  {/* ========================================================================= */}
  if (selectedManageIntegration) {
    return (
      <div className="text-slate-900 font-sans space-y-3.5 select-none animate-in fade-in duration-150">
        
        {/* TOP HEADER BAR */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setSelectedManageIntegration(null)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer border border-slate-200"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Integrations</span>
            </button>

            <div className="h-5 w-px bg-slate-200" />

            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-300">
                LJ
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">Libin Johnson</div>
                <div className="text-[11px] text-slate-500 font-medium">libinjohnsonpk123@gmail.com</div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsAddFormModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#6B46C1] hover:bg-[#5A38A8] text-white text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lead Form</span>
            </button>

            <button 
              onClick={() => setIsUnlinkModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 rotate-180" />
              <span>Unlink</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATION ALERT BANNER */}
        {!notificationDismissed && (
          <div className="bg-[#FFF8E6] border border-[#FFE082] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-[#8C6D00] shadow-2xs font-sans">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-[#FFE082]/60 flex items-center justify-center text-[#6B5300] shrink-0">
                <Bell className="w-3 h-3" />
              </div>
              <span className="text-[11px] md:text-xs text-[#7A5E00]">
                Stay on top of your pipeline — enable browser notifications for instant lead and task alerts.{' '}
                <button 
                  onClick={() => alert('Browser notifications enabled successfully!')}
                  className="underline font-bold text-[#6B5300] hover:text-black cursor-pointer ml-1"
                >
                  Enable
                </button>
              </span>
            </div>

            <button
              onClick={() => setNotificationDismissed(true)}
              className="text-[#A38200] hover:text-black p-0.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TWO COLUMN CONTENT AREA */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
          
          {/* LEFT SIDEBAR: LINKED ACCOUNT & REPORT */}
          <div className="md:col-span-4 space-y-3">
            {/* Download Marketing Report button */}
            <button 
              onClick={() => alert('Generating Marketing Performance Report PDF...')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#6B46C1] hover:bg-[#5A38A8] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Marketing Report</span>
            </button>

            {/* Linked Account Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Linked Account
                </span>
                <button 
                  onClick={() => setIsAddNewAccountModalOpen(true)}
                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                >
                  + Add New
                </button>
              </div>

              <div className="p-3">
                <div className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 transition-all flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-bold text-slate-900 truncate">Libin Johnson</div>
                      <div className="text-[10px] text-slate-500 truncate font-medium mt-0.5">
                        Integrated with: <span className="font-mono text-slate-700">libinjohnsonpk123@gmail.com</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-1 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN PANEL: FORMS LIST */}
          <div className="md:col-span-8 space-y-3">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={formSearchTerm}
                onChange={(e) => setFormSearchTerm(e.target.value)}
                placeholder="Search with page and form name"
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs font-sans"
              />
            </div>

            {/* Form Count Bar & View Switcher */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-600">
                {filteredForms.length} Forms found
              </span>

              <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
                <button 
                  onClick={() => setFormViewMode('card')}
                  className={`px-3 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                    formViewMode === 'card' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Card
                </button>
                <button 
                  onClick={() => setFormViewMode('stats')}
                  className={`px-3 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                    formViewMode === 'stats' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Stats
                </button>
              </div>
            </div>

            {/* List of Connected Lead Forms */}
            <div className="space-y-2">
              {filteredForms.map((form) => (
                <div 
                  key={form.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 hover:border-slate-300 transition-all flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1 text-left">
                    <h4 
                      onClick={() => onNavigateToCampaign && onNavigateToCampaign(form.campaignHandle)}
                      className="text-sm font-bold text-[#5B34A2] hover:text-[#4A2988] tracking-tight leading-tight hover:underline cursor-pointer"
                    >
                      {form.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {form.companyName}
                    </p>

                    {/* Stats Row */}
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1 font-mono">
                      <span className="flex items-center space-x-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{form.period}</span>
                      </span>
                      <span className="flex items-center space-x-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{form.totalLeads}</span>
                      </span>
                      <span className="flex items-center space-x-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Last lead: {form.lastLeadTime}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => onNavigateToCampaign ? onNavigateToCampaign(form.campaignHandle) : alert(`Viewing campaign leads for ${form.title}`)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <span>View Leads</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* MODAL: ADD LEAD FORM */}
        {isAddFormModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Add New Meta Lead Form</h3>
                <button onClick={() => setIsAddFormModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Meta Page & Form Name
                  </label>
                  <input
                    type="text"
                    value={newFormTitle}
                    onChange={(e) => setNewFormTitle(e.target.value)}
                    placeholder="e.g. Master Form Aviation Batch 2026"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Select the Meta Facebook/Instagram page form to automatically stream inbound leads directly into Telecrm campaign queues.
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsAddFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLeadForm}
                  className="px-5 py-2 rounded-xl bg-[#6B46C1] hover:bg-[#5A38A8] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Link Form
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD NEW ACCOUNT */}
        {isAddNewAccountModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Connect Facebook Meta Account</h3>
                <button onClick={() => setIsAddNewAccountModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Log in with Facebook to authenticate your Meta Business Suite ad account and connect additional lead forms.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsAddNewAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsAddNewAccountModalOpen(false);
                    alert('Authenticated with Facebook Business account successfully!');
                  }}
                  className="px-5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-2"
                >
                  <span className="font-black text-sm">f</span>
                  <span>Connect with Facebook</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: UNLINK ACCOUNT */}
        {isUnlinkModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-rose-700 text-base">Unlink Facebook Meta Account?</h3>
                <button onClick={() => setIsUnlinkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to unlink <strong className="text-slate-900">Libin Johnson (libinjohnsonpk123@gmail.com)</strong>? This will pause lead sync for all 8 connected forms.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsUnlinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsUnlinkModalOpen(false);
                    setSelectedManageIntegration(null);
                    alert('Facebook integration unlinked successfully.');
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Unlink
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  {/* ========================================================================= */}
  {/* INTEGRATIONS CATALOG VIEW (ALL INTEGRATIONS LIST) */}
  {/* ========================================================================= */}
  return (
    <div className="text-slate-900 font-sans space-y-4 select-none">
      
      {/* TOP NOTIFICATION BANNER */}
      {!notificationDismissed && (
        <div className="bg-[#FFF8E6] border border-[#FFE082] rounded-lg px-3 py-2 flex items-center justify-between text-xs text-[#8C6D00] shadow-2xs font-sans">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-[#FFE082]/60 flex items-center justify-center text-[#6B5300] shrink-0">
              <Bell className="w-3 h-3" />
            </div>
            <span className="text-[11px] md:text-xs text-[#7A5E00]">
              Stay on top of your pipeline — enable browser notifications for instant lead and task alerts.{' '}
              <button 
                onClick={() => alert('Browser notifications enabled successfully!')}
                className="underline font-bold text-[#6B5300] hover:text-black cursor-pointer"
              >
                Enable
              </button>
            </span>
          </div>

          <button
            onClick={() => setNotificationDismissed(true)}
            className="text-[#A38200] hover:text-black p-0.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP INTEGRATIONS HEADER & SEARCH BAR */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-3 flex flex-wrap items-center justify-between gap-2.5 font-sans">
        <div className="flex items-center space-x-2.5">
          <h2 className="text-xs md:text-sm font-bold text-slate-900 border-r border-slate-200 pr-3">
            Integrations
          </h2>
          <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">
            Connect lead sources, CRMs, webhooks & telephony providers
          </span>
        </div>

        {/* Search input with right search icon */}
        <div className="relative flex-1 max-w-sm min-w-[180px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Integration by name"
            className="w-full bg-white border border-slate-300 rounded-md pl-3 pr-8 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all font-sans shadow-2xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
        </div>
      </div>

      {/* SECTION 1: ACTIVE INTEGRATIONS */}
      <div className="space-y-2.5 font-sans">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
            Active Integration ({activeIntegrations.length})
          </h3>
          {activeIntegrations.length > 0 && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
              ● All systems synced
            </span>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          {activeIntegrations.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No active integrations found. Activate an integration below to begin.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Header row */}
              <div className="bg-slate-50/90 px-4 md:px-5 py-2 grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-8 md:col-span-9">INTEGRATIONS</div>
                <div className="col-span-4 md:col-span-3 text-right md:text-left">STATUS</div>
              </div>

              {/* Rows */}
              {activeIntegrations.map((item) => (
                <div
                  key={item.id}
                  className="px-4 md:px-5 py-2.5 grid grid-cols-12 items-center hover:bg-slate-50/70 transition-colors"
                >
                  <div className="col-span-8 md:col-span-9 flex items-center space-x-3">
                    {renderBrandIcon(item.iconType, item.name)}
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold text-slate-900 leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 max-w-xl">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-4 md:col-span-3 flex items-center justify-between md:justify-start space-x-2.5">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active</span>
                    </span>

                    <button
                      onClick={() => handleOpenModal(item)}
                      className="px-3.5 py-0.5 rounded-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: AVAILABLE INTEGRATIONS */}
      <div className="space-y-2.5 font-sans pt-1">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
            Available Integration ({availableIntegrations.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Click &quot;Activate now&quot; to setup webhook & API sync
          </span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          {availableIntegrations.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No matching available integrations found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Header row */}
              <div className="bg-slate-50/90 px-4 md:px-5 py-2 grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-8 md:col-span-9">INTEGRATIONS</div>
                <div className="col-span-4 md:col-span-3 text-right">ACTION</div>
              </div>

              {/* Rows */}
              {availableIntegrations.map((item) => (
                <div
                  key={item.id}
                  className="px-4 md:px-5 py-2 grid grid-cols-12 items-center hover:bg-slate-50/70 transition-colors"
                >
                  <div className="col-span-8 md:col-span-9 flex items-center space-x-3">
                    {renderBrandIcon(item.iconType, item.name)}
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold text-slate-900 leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 max-w-xl">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-4 md:col-span-3 flex justify-end">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="px-3.5 py-0.5 rounded-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      Activate now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ACTIVATION / WEBHOOK MODAL */}
      {isModalOpen && selectedIntegration && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden space-y-0">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                {renderBrandIcon(selectedIntegration.iconType, selectedIntegration.name)}
                <div>
                  <h3 className="font-bold text-slate-900 text-base md:text-lg">
                    {selectedIntegration.name} Integration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Activate lead integration for Telecrm
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              <p className="text-slate-600 leading-relaxed text-xs md:text-sm">
                {selectedIntegration.description}
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Telecrm Webhook Listener Endpoint
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      selectedIntegration.webhookUrl ||
                      `https://api.telecrm.in/v1/webhooks/${selectedIntegration.id}/live_key_${Math.random().toString(36).substring(2, 8)}`
                    }
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      handleCopyWebhook(
                        selectedIntegration.webhookUrl ||
                        `https://api.telecrm.in/v1/webhooks/${selectedIntegration.id}/live_key_982347`
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleActivation(selectedIntegration.id, true)}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
              >
                {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Activate Now</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
