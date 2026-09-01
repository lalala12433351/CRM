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
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Zap,
  AlertCircle,
  ArrowRight
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

const INITIAL_CONNECTED_FORMS: ConnectedForm[] = [];


const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  // Active Integrations (1)
  {
    id: 'facebook',
    name: 'Meta',
    description: 'Capture leads directly from Meta (Facebook & Instagram) Lead Ads in real time.',
    isActive: true,
    category: 'social',
    iconType: 'facebook',
    webhookUrl: 'http://localhost:3000/api/webhooks/facebook',
    lastSync: 'Connected'
  },

  // Available Integrations
  {
    id: 'justdial',
    name: 'JustDial',
    description: 'Capture instant inquiry leads from JustDial portal feed into CRM account.',
    isActive: false,
    category: 'other',
    iconType: 'justdial',
    webhookUrl: 'http://localhost:3000/api/webhooks/justdial'
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Bidirectional sync with Google Drive spreadsheets, 1-click lead export & AI bulk import.',
    isActive: false,
    category: 'other',
    iconType: 'google_sheets'
  },
  {
    id: 'website_api',
    name: 'Website/API',
    description: 'Webhooks and REST API endpoint for capturing custom website form leads.',
    isActive: false,
    category: 'other',
    iconType: 'website_api',
    webhookUrl: 'http://localhost:3000/api/webhooks/website'
  },
  {
    id: '99acres',
    name: '99acres',
    description: 'Capture 99acres Leads in your CRM account',
    isActive: false,
    category: 'realestate',
    iconType: '99acres'
  },
  {
    id: 'callerdesk',
    name: 'CallerDesk',
    description: 'Integrate CallerDesk in your CRM account',
    isActive: false,
    category: 'telephony',
    iconType: 'callerdesk'
  },
  {
    id: 'google_meet',
    name: 'Google Meet',
    description: 'Integrate Google Meet in your CRM Account',
    isActive: false,
    category: 'other',
    iconType: 'google_meet'
  },
  {
    id: 'housing',
    name: 'Housing',
    description: 'Integrate Housing.com in your CRM account',
    isActive: false,
    category: 'realestate',
    iconType: 'housing'
  },
  {
    id: 'indiamart',
    name: 'IndiaMart',
    description: 'Integrate IndiaMart in your CRM account',
    isActive: false,
    category: 'other',
    iconType: 'indiamart'
  },
  {
    id: 'knowlarity',
    name: 'Knowlarity',
    description: 'Integrate Knowlarity in your CRM account',
    isActive: false,
    category: 'telephony',
    iconType: 'knowlarity'
  },
  {
    id: 'magicbricks',
    name: 'MagicBricks',
    description: 'Capture MagicBricks Leads in your CRM account',
    isActive: false,
    category: 'realestate',
    iconType: 'magicbricks'
  },
  {
    id: 'maqsam',
    name: 'Maqsam',
    description: 'Integrate Maqsam in your CRM account',
    isActive: false,
    category: 'telephony',
    iconType: 'maqsam'
  },
  {
    id: 'mcube',
    name: 'Mcube',
    description: 'Integrate MCube in your CRM account',
    isActive: false,
    category: 'telephony',
    iconType: 'mcube'
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    description: 'Receive new leads from Razorpay in your CRM account',
    isActive: false,
    category: 'payments',
    iconType: 'razorpay'
  },
  {
    id: 'shiksha',
    name: 'Shiksha',
    description: 'Capture Shiksha Leads in your CRM account',
    isActive: false,
    category: 'education',
    iconType: 'shiksha'
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Integrate Shopify in your CRM account',
    isActive: false,
    category: 'ecommerce',
    iconType: 'shopify'
  },
  {
    id: 'sulekha',
    name: 'Sulekha',
    description: 'Capture Sulekha Leads in your CRM account',
    isActive: false,
    category: 'other',
    iconType: 'sulekha'
  },
  {
    id: 'tatatele',
    name: 'Tata Tele',
    description: 'Integrate Tata Tele in your CRM Account',
    isActive: false,
    category: 'telephony',
    iconType: 'tatatele'
  },
  {
    id: 'telecmi',
    name: 'TeleCMI',
    description: 'Integrate TeleCMI in your CRM Account',
    isActive: false,
    category: 'telephony',
    iconType: 'telecmi'
  },
  {
    id: 'trade_india',
    name: 'Trade India',
    description: 'Integrate Trade India in your CRM Account',
    isActive: false,
    category: 'other',
    iconType: 'trade_india'
  },
  {
    id: 'whatsapp',
    name: 'Whatsapp',
    description: 'Receive new leads from your Whatsapp in your CRM account',
    isActive: false,
    category: 'messaging',
    iconType: 'whatsapp'
  },
  {
    id: 'whatsapp_widget',
    name: 'Whatsapp Chat Widget',
    description: 'Receive new leads from WhatsApp chat widget into CRM account',
    isActive: false,
    category: 'messaging',
    iconType: 'whatsapp_widget'
  },
  {
    id: 'whatsapp_cloud_api',
    name: 'Whatsapp Cloud API',
    description: 'Receive new leads from your Whatsapp Cloud API in your CRM account',
    isActive: false,
    category: 'messaging',
    iconType: 'whatsapp_cloud_api'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Integrate WooCommerce in your CRM account',
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

  // Meta (Facebook & Instagram) Lead Ads State & Multi-Page Sync
  const [fbUser, setFbUser] = useState<{ id?: string; name: string; email: string; avatar?: string } | null>(null);
  const [isLoggingInFb, setIsLoggingInFb] = useState(false);
  const [isFbConnectModalOpen, setIsFbConnectModalOpen] = useState(false);
  const [fbAppId, setFbAppId] = useState('');
  const [fbAppSecret, setFbAppSecret] = useState('');
  const [fbVerifyToken, setFbVerifyToken] = useState('pixbe_meta_verify_token');
  const [fbWebhookUrl, setFbWebhookUrl] = useState('');
  const [fbInputName, setFbInputName] = useState('');
  const [fbInputEmail, setFbInputEmail] = useState('');
  const [fbPageId, setFbPageId] = useState('');
  const [fbPageName, setFbPageName] = useState('');
  const [fbPageToken, setFbPageToken] = useState('');
  const [fbAvailablePages, setFbAvailablePages] = useState<Array<{ id: string; name: string; access_token: string; category?: string }>>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [fbStep, setFbStep] = useState<'overview' | 'select_page' | 'connected'>('overview');
  const [isSyncingFb, setIsSyncingFb] = useState(false);
  const [isSubscribingPage, setIsSubscribingPage] = useState(false);
  const [isSendingTestLead, setIsSendingTestLead] = useState(false);
  const [fbStatusMessage, setFbStatusMessage] = useState<string | null>(null);

  // Fetch Meta status on mount & listen for Meta OAuth Login popup postMessage callback
  React.useEffect(() => {
    fetch('/api/meta/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.metaAppId) setFbAppId(data.metaAppId);
          const cfg = data.config;
          if (cfg) {
            if (cfg.pageId) setFbPageId(cfg.pageId);
            if (cfg.pageName) setFbPageName(cfg.pageName);
            if (cfg.accessToken) setFbPageToken(cfg.accessToken);
            if (cfg.userAccount) setFbUser(cfg.userAccount);
            if (Array.isArray(cfg.pages) && cfg.pages.length > 0) {
              setFbAvailablePages(cfg.pages);
              setSelectedPageId(cfg.pages[0].id);
            }
            if (cfg.isConnected && cfg.pageName) {
              setFbStep('connected');
              setIntegrations(prev => prev.map(item => item.id === 'facebook' ? { ...item, isActive: true, lastSync: `Connected: ${cfg.pageName}` } : item));
            } else {
              setFbStep('overview');
            }
          }
        }
      })
      .catch(() => {});

    const handleFbAuthMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'META_AUTH_PAGES' || event.data.type === 'FB_AUTH_SUCCESS')) {
        const pages = event.data.pages || [];
        const user = event.data.user || event.data.config?.userAccount;
        if (user) setFbUser(user);
        if (Array.isArray(pages) && pages.length > 0) {
          setFbAvailablePages(pages);
          setSelectedPageId(pages[0].id);
          setFbStep('select_page');
          setModalStatusMsg(`⚡ Found ${pages.length} Facebook Page(s). Select your page to sync leads.`);
        } else if (event.data.config?.pageId) {
          setFbPageId(event.data.config.pageId);
          setFbStep('connected');
        }
        setIsFbConnectModalOpen(true);
      }
    };
    window.addEventListener('message', handleFbAuthMessage);
    return () => window.removeEventListener('message', handleFbAuthMessage);
  }, []);

  const handleConnectMeta = () => {
    const appId = "1785911265462186";
    // Use current origin so it works both locally (ngrok) and on CloudFront
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/meta/callback`);
    const scope = "leads_retrieval,pages_show_list,pages_read_engagement,pages_manage_ads";

    window.location.href = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
  };

  const handleOfficialFacebookLogin = () => {
    handleConnectMeta();
  };

  const handleSyncSelectedPage = async () => {
    const page = fbAvailablePages.find(p => p.id === selectedPageId);
    if (!page) {
      setModalStatusMsg("Please select a Facebook Page from the dropdown.");
      return;
    }
    await handleSelectAndSubscribePage(page);
  };

  const handleSelectAndSubscribePage = async (page: { id: string; name: string; access_token: string }) => {
    setIsSubscribingPage(true);
    setModalStatusMsg(null);
    try {
      const res = await fetch('/api/meta/subscribe-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token,
          crmUserId: 'default_admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        setFbPageId(page.id);
        setFbPageName(page.name);
        setFbPageToken(page.access_token);
        setFbStep('connected');
        setModalStatusMsg(`⚡ Successfully connected & subscribed "${page.name}"! Leads will automatically flow into your CRM.`);
        setIntegrations(prev => prev.map(item => item.id === 'facebook' ? { ...item, isActive: true, lastSync: `Connected: ${page.name}` } : item));
        
        setFormsList(prev => [
          {
            id: `f-${page.id}`,
            title: `${page.name} Lead Gen Ad Form`,
            companyName: page.name,
            period: 'Active Real-Time',
            totalLeads: 1,
            lastLeadTime: 'Just now',
            campaignHandle: `@${page.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
          },
          ...prev.filter(f => f.id !== `f-${page.id}`)
        ]);
      } else {
        setModalStatusMsg(`⚠️ Subscription notice: ${data.error || 'Failed to subscribe page'}`);
      }
    } catch (e: any) {
      setModalStatusMsg(`⚠️ Subscription error: ${e.message}`);
    } finally {
      setIsSubscribingPage(false);
    }
  };

  const handleSendTestLead = async () => {
    setIsSendingTestLead(true);
    setFbStatusMessage(null);
    try {
      const res = await fetch('/api/meta/test-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          phone: '+1 234 567 8900',
          city: 'Hyderabad'
        })
      });
      const data = await res.json();
      if (data.success && data.lead) {
        setFbStatusMessage(`✅ Real-time lead test successful! "${data.lead.name}" (${data.lead.phone}) saved to database.`);
        setFormsList(prev => prev.map((f, i) => i === 0 ? { ...f, totalLeads: f.totalLeads + 1, lastLeadTime: 'Just now' } : f));
      } else {
        setFbStatusMessage(`⚠️ Test lead notice: ${data.error}`);
      }
    } catch (e: any) {
      setFbStatusMessage(`⚠️ Error: ${e.message}`);
    } finally {
      setIsSendingTestLead(false);
    }
  };

  const handleOpenFbConnectModal = () => {
    setModalStatusMsg(null);
    setIsFbConnectModalOpen(true);
  };

  const handleFacebookLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fbPageToken.trim() && !fbAppSecret.trim()) {
      setModalStatusMsg("⚠️ Please enter a Meta Page Access Token (starts with EAAB...) or Meta App Secret.");
      return;
    }

    setIsLoggingInFb(true);
    setModalStatusMsg(null);
    try {
      // 1. If App Secret provided, save config first
      if (fbAppSecret.trim() || fbAppId.trim()) {
        await fetch('/api/meta/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: fbAppId.trim(),
            appSecret: fbAppSecret.trim(),
            verifyToken: fbVerifyToken.trim()
          })
        });
      }

      // 2. If Page Token provided, verify real Facebook Page via Graph API
      if (fbPageToken.trim()) {
        const res = await fetch('/api/meta/verify-real-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageToken: fbPageToken.trim(),
            pageId: fbPageId.trim() || undefined
          })
        });
        const data = await res.json();
        if (data.success && data.page) {
          setFbPageId(data.page.id);
          setFbPageName(data.page.name);
          setFbAvailablePages([data.page]);
          setFbStep('connected');
          setModalStatusMsg(`⚡ Successfully verified & connected real Facebook Page "${data.page.name}" (ID: ${data.page.id})!`);
          setIntegrations(prev => prev.map(item => item.id === 'facebook' ? { ...item, isActive: true, lastSync: `Connected: ${data.page.name}` } : item));
          
          setFormsList([
            {
              id: `f-${data.page.id}`,
              title: `${data.page.name} Lead Gen Stream`,
              companyName: data.page.name,
              period: 'Active Real-Time',
              totalLeads: 0,
              lastLeadTime: 'Listening for real leads',
              campaignHandle: `@${data.page.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
            }
          ]);
        } else {
          setModalStatusMsg(`⚠️ Meta Graph API Error: ${data.error || 'Failed to verify Page token with Meta'}`);
        }
      } else {
        setModalStatusMsg("⚡ Meta App Secret saved. You can now click 'Log in with Facebook' to authorize real pages.");
        setFbStep('overview');
      }
    } catch (e: any) {
      setModalStatusMsg(`⚠️ Connection error: ${e.message}`);
    } finally {
      setIsLoggingInFb(false);
    }
  };

  const handleFacebookLogout = async () => {
    try {
      await fetch('/api/meta/disconnect', { method: 'POST' });
    } catch (e) {}
    setFbUser(null);
    setFbPageToken('');
    setFbPageId('');
    setFbStep('overview');
    setIntegrations(prev => prev.map(item => item.id === 'facebook' ? { ...item, isActive: false, lastSync: 'Disconnected' } : item));
    setModalStatusMsg('Disconnected from Meta account.');
  };

  const handleSyncFacebookLeads = async () => {
    setIsSyncingFb(true);
    setFbStatusMessage(null);
    try {
      const res = await fetch('/api/facebook/sync-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: fbPageId, accessToken: fbPageToken, userAccount: fbUser })
      });
      const data = await res.json();
      if (data.success) {
        setFbStatusMessage(`⚡ ${data.message} (${data.formsSynced} Forms Scanned, ${data.newLeadsSaved} New Lead Saved into AWS Aurora RDS!)`);
      } else {
        setFbStatusMessage(`⚠️ ${data.error || 'Failed to sync Facebook Page leads'}`);
      }
    } catch (e: any) {
      setFbStatusMessage(`⚠️ Sync Notice: ${e.message || 'Server connection error'}`);
    } finally {
      setIsSyncingFb(false);
    }
  };

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

  // Universal Integrations UI State & Handlers
  const [integrationCreds, setIntegrationCreds] = useState<Record<string, string>>({});
  const [modalStatusMsg, setModalStatusMsg] = useState<string | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isSyncingLeads, setIsSyncingLeads] = useState(false);

  const handleTestIntegration = async () => {
    if (!selectedIntegration) return;
    setIsTestingConn(true);
    setModalStatusMsg(null);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedIntegration.id,
          name: selectedIntegration.name,
          credentials: integrationCreds
        })
      });
      const data = await res.json();
      setModalStatusMsg(data.message || `Connected to ${selectedIntegration.name}`);
    } catch (e: any) {
      setModalStatusMsg(`⚠️ Connection test notice: ${e.message}`);
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSaveIntegration = async () => {
    if (!selectedIntegration) return;
    setIsSaving(true);
    setModalStatusMsg(null);
    try {
      const res = await fetch('/api/integrations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedIntegration.id,
          name: selectedIntegration.name,
          isConnected: true,
          credentials: integrationCreds
        })
      });
      const data = await res.json();
      if (data.success) {
        setModalStatusMsg(`⚡ Successfully connected ${selectedIntegration.name}!`);
        setIntegrations(prev => prev.map(item => item.id === selectedIntegration.id ? { ...item, isActive: true, lastSync: 'Connected' } : item));
      } else {
        setModalStatusMsg(`⚠️ Error: ${data.error}`);
      }
    } catch (e: any) {
      setModalStatusMsg(`⚠️ Save notice: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncIntegrationLeads = async () => {
    if (!selectedIntegration) return;
    setIsSyncingLeads(true);
    setModalStatusMsg(null);
    try {
      const res = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedIntegration.id,
          name: selectedIntegration.name,
          credentials: integrationCreds
        })
      });
      const data = await res.json();
      if (data.success) {
        setModalStatusMsg(`⚡ ${data.message} (${data.leadSample?.name} ingested into AWS Aurora RDS!)`);
      } else {
        setModalStatusMsg(`⚠️ Sync Error: ${data.error}`);
      }
    } catch (e: any) {
      setModalStatusMsg(`⚠️ Sync notice: ${e.message}`);
    } finally {
      setIsSyncingLeads(false);
    }
  };

  // Open manage detail or activation modal
  const handleOpenModal = (integration: IntegrationItem) => {
    setModalStatusMsg(null);
    setIntegrationCreds({});
    if (integration.id === 'google_sheets') {
      if (onOpenGoogleSheets) {
        onOpenGoogleSheets();
        return;
      }
    }
    // Open Universal Configuration Modal for all integrations
    setSelectedIntegration(integration);
    setApiKeyInput(integration.apiKey || '');
    setIsModalOpen(true);
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
      companyName: 'Connected Organization Workspace',
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
  {/* MANAGE FACEBOOK VIEW (CLEAN & SIMPLE THEMED MATCHING DESIGN SYSTEM) */}
  {/* ========================================================================= */}
  if (selectedManageIntegration?.id === 'facebook') {
    return (
      <div className="text-slate-900 font-sans space-y-4 select-none animate-in fade-in duration-150">
        
        {/* TOP HEADER CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center text-white font-black text-xl shadow-xs">
              f
            </div>
            <div className="text-left">
              <h2 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
                Manage Facebook Lead Ads
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Official Meta Graph API v22.0 real-time webhook lead integration
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedManageIntegration(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-xs flex items-center space-x-1.5"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Integrations</span>
            </button>
          </div>
        </div>

        {/* MAIN 2-COLUMN SECTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          
          {/* CARD 1: 1. FACEBOOK SYNC & OAUTH */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Facebook Account & Sync
                </h3>
              </div>
              {fbAvailablePages.length > 0 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Connected ({fbAvailablePages.length} Page{fbAvailablePages.length > 1 ? 's' : ''})
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Not Connected
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Click below to authenticate your Facebook account. The system will automatically subscribe your Facebook pages to the CRM real-time lead webhook.
            </p>

            {/* THE SINGLE BUTTON */}
            <button
              onClick={handleConnectMeta}
              className="w-full py-3.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <span className="w-6 h-6 rounded-full bg-white text-[#1877F2] font-black text-sm flex items-center justify-center shadow-xs">
                f
              </span>
              <span>Connect Facebook</span>
            </button>

            {fbAvailablePages.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Active Page: <strong className="text-slate-900">{fbPageName || fbAvailablePages[0]?.name}</strong>
                </span>
                <button
                  onClick={handleFacebookLogout}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* CARD 2: 2. REAL-TIME WEBHOOK DETAILS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Webhook Endpoint
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                Graph API v22.0
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Callback URL (CloudFront HTTPS)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value="https://d3pcv3wpcxqhl2.cloudfront.net/api/webhooks/meta"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("https://d3pcv3wpcxqhl2.cloudfront.net/api/webhooks/meta");
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  {copiedUrl ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-blue-950">
                <span>⚡ Automatic Page Subscription</span>
              </div>
              <p className="text-[11px] text-blue-800">
                When you click <strong>Connect Facebook</strong>, your selected Facebook Pages are automatically registered with the Lead Ads webhook. Any new form submissions will instantly flow into your CRM.
              </p>
            </div>
          </div>

        </div>

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

                  <div className="col-span-4 md:col-span-3 flex items-center justify-end md:justify-start space-x-2">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active</span>
                    </span>

                    <button
                      onClick={() => {
                        if (item.id === 'facebook') {
                          setSelectedManageIntegration(item);
                        } else {
                          handleOpenModal(item);
                        }
                      }}
                      className="px-3 py-0.5 rounded-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0"
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

      {/* UNIVERSAL ACTIVATION / CONFIGURATION / WEBHOOK MODAL */}
      {isModalOpen && selectedIntegration && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden space-y-0 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                {renderBrandIcon(selectedIntegration.iconType, selectedIntegration.name)}
                <div>
                  <h3 className="font-bold text-slate-900 text-base md:text-lg">
                    {selectedIntegration.name} Live Integration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure API Keys, Webhooks & In-App Lead Sync for Telecrm
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

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <p className="text-slate-600 leading-relaxed text-xs">
                {selectedIntegration.description}
              </p>

              {/* Dynamic Platform-Specific Credential Inputs */}
              <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-left">
                {/* Render Platform-Specific Input Fields */}
                {selectedIntegration.id === 'facebook' ? (
                  <div className="space-y-3">
                    {fbUser ? (
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <img
                                src={fbUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                alt={fbUser.name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#1877F2]/30"
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#1877F2] rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                                f
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <h4 className="font-bold text-slate-900 text-xs">{fbUser.name}</h4>
                                <span className="px-1.5 py-0.2 bg-blue-50 text-[#1877F2] text-[9px] font-bold rounded border border-blue-200">
                                  Logged In
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">{fbUser.email}</p>
                            </div>
                          </div>

                          <button
                            onClick={handleFacebookLogout}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-[10px] font-semibold transition-all cursor-pointer"
                          >
                            Switch Account
                          </button>
                        </div>

                        {/* Connected Facebook Pages */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-600 block">
                            Active Connected Facebook Page
                          </label>
                          {fbAvailablePages.length > 0 ? (
                            <select
                              value={fbPageId}
                              onChange={(e) => {
                                const pId = e.target.value;
                                setFbPageId(pId);
                                const matched = fbAvailablePages.find(p => p.id === pId);
                                if (matched) {
                                  handleSelectAndSubscribePage(matched);
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1877F2]"
                            >
                              {fbAvailablePages.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (ID: {p.id})
                                </option>
                              ))}
                            </select>
                          ) : fbPageName ? (
                            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-900">
                              {fbPageName} {fbPageId ? `(ID: ${fbPageId})` : ''}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic p-2 bg-slate-50 border border-slate-200 rounded-lg">
                              No Facebook page connected yet.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2] flex items-center justify-center font-bold text-2xl mx-auto shadow-2xs">
                          f
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-xs">Connect your Facebook Account</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                            Log in with Facebook to automatically grant access to your Meta Ad Accounts, Facebook Pages, and Instant Lead Forms. No manual access tokens required.
                          </p>
                        </div>

                        <button
                          onClick={handleOfficialFacebookLogin}
                          disabled={isLoggingInFb}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center space-x-2"
                        >
                          <span className="w-5 h-5 rounded-full bg-white text-[#1877F2] font-black text-xs flex items-center justify-center shadow-xs">
                            f
                          </span>
                          <span>{isLoggingInFb ? 'Connecting to Facebook...' : 'Log in with Facebook'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : selectedIntegration.id === 'google_ads' || selectedIntegration.id === 'google_meet' ? (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Google Ads Webhook Secret Key</label>
                      <input
                        type="text"
                        value={integrationCreds['webhookKey'] || 'pixbe_google_ads_key'}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, webhookKey: e.target.value })}
                        placeholder="e.g. pixbe_google_ads_key"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Google Ads Customer Account ID</label>
                      <input
                        type="text"
                        value={integrationCreds['customerId'] || ''}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, customerId: e.target.value })}
                        placeholder="e.g. 892-102-3391"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </>
                ) : selectedIntegration.id === 'indiamart' ? (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">IndiaMart Registered Mobile Number</label>
                      <input
                        type="text"
                        value={integrationCreds['mobile'] || ''}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, mobile: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">IndiaMart CRM API Key</label>
                      <input
                        type="password"
                        value={integrationCreds['apiKey'] || ''}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, apiKey: e.target.value })}
                        placeholder="im_live_..."
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </>
                ) : selectedIntegration.id === 'justdial' ? (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">JustDial Account Phone Number</label>
                      <input
                        type="text"
                        value={integrationCreds['mobile'] || ''}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, mobile: e.target.value })}
                        placeholder="+91 98450 11223"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">JustDial Portal Access Key</label>
                      <input
                        type="password"
                        value={integrationCreds['apiKey'] || ''}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, apiKey: e.target.value })}
                        placeholder="jd_key_4482"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </>
                ) : selectedIntegration.id === 'shopify' || selectedIntegration.id === 'woocommerce' ? (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Store Domain URL</label>
                      <input
                        type="text"
                        value={integrationCreds['storeUrl'] || ''}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, storeUrl: e.target.value })}
                        placeholder="my-store.myshopify.com"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Admin Access Token</label>
                      <input
                        type="password"
                        value={integrationCreds['accessToken'] || ''}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, accessToken: e.target.value })}
                        placeholder="shpat_..."
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </>
                ) : selectedIntegration.id === 'razorpay' ? (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Razorpay Key ID</label>
                      <input
                        type="text"
                        value={integrationCreds['keyId'] || ''}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, keyId: e.target.value })}
                        placeholder="rzp_live_..."
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Razorpay Key Secret</label>
                      <input
                        type="password"
                        value={integrationCreds['keySecret'] || ''}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, keySecret: e.target.value })}
                        placeholder="Enter Key Secret"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </>
                ) : selectedIntegration.id.includes('whatsapp') ? (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">WhatsApp Phone Number ID</label>
                      <input
                        type="text"
                        value={integrationCreds['phoneId'] || ''}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, phoneId: e.target.value })}
                        placeholder="100982374981"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Permanent System Access Token (EAAG...)</label>
                      <input
                        type="password"
                        value={integrationCreds['accessToken'] || ''}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, accessToken: e.target.value })}
                        placeholder="EAAG..."
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">API Key / Access Token</label>
                      <input
                        type="password"
                        value={integrationCreds['apiKey'] || ''}
                        onChange={(e) => setIntegrationCreds({ ...integrationCreds, apiKey: e.target.value })}
                        placeholder="Enter API Key / Token"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Webhook Endpoint Box */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  Inbound Webhook Endpoint
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      selectedIntegration.id === 'facebook'
                        ? `${window.location.origin}/api/webhooks/facebook`
                        : (selectedIntegration.webhookUrl || `${window.location.origin}/api/webhooks/${selectedIntegration.id}`).replace(/https:\/\/api\.telecrm\.in\/v1\/(webhooks|leads\/public)\//g, `${window.location.origin}/api/webhooks/`)
                    }
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      handleCopyWebhook(
                        selectedIntegration.id === 'facebook'
                          ? `${window.location.origin}/api/webhooks/facebook`
                          : (selectedIntegration.webhookUrl || `${window.location.origin}/api/webhooks/${selectedIntegration.id}`).replace(/https:\/\/api\.telecrm\.in\/v1\/(webhooks|leads\/public)\//g, `${window.location.origin}/api/webhooks/`)
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>

              {modalStatusMsg && (
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium leading-relaxed">
                  {modalStatusMsg}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleTestIntegration}
                disabled={isTestingConn}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all flex items-center space-x-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSyncIntegrationLeads}
                  disabled={isSyncingLeads}
                  className="px-3.5 py-1.5 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold cursor-pointer transition-all flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLeads ? 'animate-spin' : ''}`} />
                  <span>Sync Leads Now</span>
                </button>

                <button
                  onClick={handleSaveIntegration}
                  disabled={isSaving}
                  className="px-5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save & Activate</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
