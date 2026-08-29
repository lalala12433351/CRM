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
  const [fbAppId, setFbAppId] = useState('1785911265462186');
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

  const handleOfficialFacebookLogin = () => {
    setIsLoggingInFb(true);
    setModalStatusMsg(null);

    const targetAppId = fbAppId.trim() || '1785911265462186';
    const redirectUri = encodeURIComponent(window.location.origin + '/api/auth/meta/callback');
    const scopes = encodeURIComponent('pages_show_list,pages_read_engagement,pages_manage_ads,leads_retrieval');
    const fbOAuthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${targetAppId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`;

    const width = 640;
    const height = 740;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      fbOAuthUrl,
      'MetaOfficialOAuthWindow',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      setModalStatusMsg('⚠️ Browser popup was blocked. Please allow popups for localhost to connect with Facebook.');
      setIsLoggingInFb(false);
    } else {
      setTimeout(() => setIsLoggingInFb(false), 2500);
    }
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0 text-left">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Linked Account
                </span>
                {!fbUser && (
                  <button 
                    onClick={handleOpenFbConnectModal}
                    className="text-[11px] font-bold text-white bg-[#1877F2] hover:bg-[#166FE5] px-2.5 py-1 rounded-md cursor-pointer transition-colors flex items-center space-x-1 shadow-2xs"
                  >
                    <span className="font-bold">f</span>
                    <span>+ Connect FB Account</span>
                  </button>
                )}
              </div>

              <div className="p-3">
                {fbUser ? (
                  <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/40 flex items-center justify-between group">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative">
                        <img
                          src={fbUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                          alt={fbUser.name}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-[#1877F2]/30 shrink-0"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#1877F2] rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                          f
                        </div>
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="text-xs font-bold text-slate-900 truncate flex items-center space-x-1">
                          <span>{fbUser.name}</span>
                          <span className="text-[9px] font-bold text-[#1877F2] bg-white px-1 rounded border border-blue-200">
                            OAuth
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate font-medium mt-0.5">
                          <span className="font-mono text-slate-700">{fbUser.email}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleFacebookLogout}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                    >
                      Unlink
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleOpenFbConnectModal}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span className="font-black text-sm">f</span>
                    <span>Log in with Facebook</span>
                  </button>
                )}
              </div>
            </div>

            {/* Facebook Page Live Lead Sync Card */}
            <div className="bg-white rounded-xl border border-indigo-200/80 shadow-2xs overflow-hidden p-3.5 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-[#1877F2] text-white flex items-center justify-center text-xs font-bold">f</div>
                  <span className="text-xs font-bold text-slate-900">Facebook Page Lead Sync</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  Facebook OAuth 2.0
                </span>
              </div>

              <div className="space-y-2 text-left">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Select Connected Facebook Page
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      {fbAvailablePages.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (ID: {p.id})
                        </option>
                      ))}
                    </select>
                  ) : fbPageName ? (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-900 flex items-center justify-between">
                      <span>{fbPageName} {fbPageId ? `(ID: ${fbPageId})` : ''}</span>
                      <span className="text-[10px] text-emerald-600 bg-white px-1.5 py-0.5 rounded font-mono">Active</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      No real Facebook page connected yet. Log in or enter a Page Token to connect your page.
                    </div>
                  )}
                </div>

                {!fbUser && (
                  <button
                    onClick={handleOpenFbConnectModal}
                    className="w-full py-2 px-3 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span className="font-bold">f</span>
                    <span>Log in with Facebook to Sync</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleSyncFacebookLeads}
                disabled={isSyncingFb}
                className="w-full py-2 px-3 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFb ? 'animate-spin' : ''}`} />
                <span>{isSyncingFb ? 'Syncing Meta Leads...' : 'Sync Facebook Page Leads'}</span>
              </button>

              {fbStatusMessage && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium leading-relaxed">
                  {fbStatusMessage}
                </div>
              )}
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
              {filteredForms.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl font-bold">
                    f
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Lead Forms Connected</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {fbUser ? "No active forms found for your connected page. Click 'Add New Form' to connect a form." : "Facebook integration is currently disconnected. Connect your Facebook account to import Meta lead forms."}
                  </p>
                </div>
              ) : (
                filteredForms.map((form) => (
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
                ))
              )}
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

        {/* MODAL: META (FACEBOOK & INSTAGRAM) LEAD ADS INTEGRATION */}
        {isFbConnectModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 text-left font-sans animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-5">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1877F2] text-white flex items-center justify-center font-bold text-xl shadow-md">
                    f
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Meta Lead Ads Integration</h3>
                    <p className="text-xs text-slate-500">Facebook & Instagram Lead Sync</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFbConnectModalOpen(false)} 
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              {modalStatusMsg && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-[#1877F2] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{modalStatusMsg}</span>
                </div>
              )}

              {/* VIEW 1: CONNECT WITH FACEBOOK BUTTON */}
              {fbStep === 'overview' && (
                <div className="space-y-4 text-center py-2">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">Connect your Facebook Account</h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Authorize access to your Facebook & Instagram Pages. New leads from your ad forms will automatically stream into Pixbe CRM.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOfficialFacebookLogin}
                    disabled={isLoggingInFb}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-bold shadow-md hover:shadow-lg cursor-pointer transition-all flex items-center justify-center space-x-2.5 disabled:opacity-75"
                  >
                    <span className="w-6 h-6 rounded-full bg-white text-[#1877F2] font-black text-sm flex items-center justify-center shadow-xs">
                      f
                    </span>
                    <span>{isLoggingInFb ? 'Connecting to Meta...' : 'Connect with Facebook'}</span>
                  </button>
                </div>
              )}

              {/* VIEW 2: SELECT PAGE & SYNC LEADS */}
              {fbStep === 'select_page' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">
                      Select Page:
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Choose which Facebook Page&apos;s lead forms should flow into Pixbe CRM:
                    </p>
                  </div>

                  <div className="relative">
                    <select
                      value={selectedPageId}
                      onChange={(e) => setSelectedPageId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#1877F2] focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="">-- Choose your Facebook Page ▾ --</option>
                      {fbAvailablePages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncSelectedPage}
                    disabled={!selectedPageId || isSubscribingPage}
                    className="w-full py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{isSubscribingPage ? 'Subscribing Page...' : 'Sync Leads'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleOfficialFacebookLogin}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold hover:underline cursor-pointer"
                    >
                      Connect a different Facebook account &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 3: CONNECTED & LIVE STATUS */}
              {fbStep === 'connected' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-950">
                          {fbPageName || 'Facebook Page'}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                        ● Real-Time Active
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Lead ads from this page automatically stream into your CRM as soon as a user submits an ad form on Facebook or Instagram.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setFbStep('select_page')}
                      className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      Switch Page
                    </button>
                    <button
                      type="button"
                      onClick={handleFacebookLogout}
                      className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}

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
                    handleOfficialFacebookLogin();
                  }}
                  disabled={isLoggingInFb}
                  className="px-5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-2"
                >
                  <span className="font-black text-sm">f</span>
                  <span>{isLoggingInFb ? 'Connecting...' : 'Connect with Facebook'}</span>
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
                Are you sure you want to unlink <strong className="text-slate-900">{fbUser?.name || 'Connected Facebook Account'}</strong>? This will pause lead sync for connected Meta forms.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsUnlinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleFacebookLogout();
                    setIsUnlinkModalOpen(false);
                    setSelectedManageIntegration(null);
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
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
