import React, { useState } from 'react';
import { toast } from '../context/ToastContext';
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
  ArrowRight,
  Info,
  ChevronDown
} from 'lucide-react';
import { Agent, CustomFieldDef } from '../types';

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
  agents?: Agent[];
  customFields?: CustomFieldDef[];
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

export const IntegrationsPage: React.FC<IntegrationsViewProps> = ({
  agents = [],
  customFields = [],
  onNavigateToCampaign,
  onOpenGoogleSheets
}) => {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INITIAL_INTEGRATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationDismissed, setNotificationDismissed] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Agent[]>(agents);
  const [dbLeadFields, setDbLeadFields] = useState<CustomFieldDef[]>(customFields);

  // Fetch real team members from the database if not provided via props
  React.useEffect(() => {
    if (agents && agents.length > 0) {
      setTeamMembers(agents);
    } else {
      fetch('/api/agents')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.agents)) {
            setTeamMembers(data.agents);
          }
        })
        .catch(() => { });
    }
  }, [agents]);

  // Fetch real lead fields dynamically from the database (/api/field-settings)
  React.useEffect(() => {
    if (customFields && customFields.length > 0) {
      setDbLeadFields(customFields);
    }
    fetch('/api/field-settings')
      .then(r => r.json())
      .then(fieldsRes => {
        if (fieldsRes?.success && Array.isArray(fieldsRes.fields) && fieldsRes.fields.length > 0) {
          setDbLeadFields(fieldsRes.fields);
        }
      })
      .catch(() => { });
  }, [customFields]);

  // Dynamically assemble all available TeleCRM lead fields strictly in database order
  const telecrmLeadFields = React.useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    (dbLeadFields || []).forEach(f => {
      const label = (f.label || f.name || '').trim();
      if (label && !seen.has(label.toLowerCase())) {
        seen.add(label.toLowerCase());
        list.push(label);
      }
    });

    return list;
  }, [dbLeadFields]);

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

  // Step-by-step Wizard State (matching user screenshots 1-4)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardPageId, setWizardPageId] = useState<string>('');
  const [wizardFormId, setWizardFormId] = useState<string>('');
  const [pageForms, setPageForms] = useState<Array<{ id: string; name: string; questions?: any[] }>>([]);
  const [formQuestions, setFormQuestions] = useState<Array<{ label: string; key: string; type?: string }>>([]);
  const [fieldMapping, setFieldMapping] = useState<Array<{ fbQuestion: string; telecrmField: string; replaceRule: string }>>([]);
  const [wizardCampaignName, setWizardCampaignName] = useState<string>('');
const [teamMemberRoleFilter, setTeamMemberRoleFilter] = useState<string>('All');
const [teamMemberSearch, setTeamMemberSearch] = useState<string>('');
const [selectedDistributionUsers, setSelectedDistributionUsers] = useState<string[]>([]);
const [distributeActiveOnly, setDistributeActiveOnly] = useState<boolean>(true);
const [importOption, setImportOption] = useState<string>('future_only');
const [isLoadingForms, setIsLoadingForms] = useState<boolean>(false);

const fetchPageForms = async (pageId: string) => {
  setIsLoadingForms(true);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`/api/integrations/facebook/pages/${pageId}/forms`, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data.success && Array.isArray(data.forms) && data.forms.length > 0) {
      setPageForms(data.forms);
      setWizardFormId(data.forms[0].id);
      const defaultHandle = `@${data.forms[0].name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      setWizardCampaignName(defaultHandle);
      fetchFormQuestions(pageId, data.forms[0].id);
    } else {
      setPageForms([]);
      setWizardFormId('');
    }
  } catch {
    setPageForms([]);
    setWizardFormId('');
  } finally {
    setIsLoadingForms(false);
  }
};

const fetchFormQuestions = async (pageId: string, formId: string) => {
  try {
    const res = await fetch(`/api/integrations/facebook/pages/${pageId}/forms/${formId}/questions`);
    const data = await res.json();
    if (data.success && Array.isArray(data.questions)) {
      setFormQuestions(data.questions);
      const map = data.questions.map((q: any) => {
        let telecrmField = '[ Select Telecrm Field To Map ]';
        const qText = (q.label || q.key || '').trim();
        const l = qText.toLowerCase();

        // Match against telecrm lead fields fetched from database
        const found = telecrmLeadFields.find(f => {
          const fl = f.toLowerCase();
          return fl === l || (l.includes(fl) && fl.length > 2);
        });

        if (found) {
          telecrmField = found;
        } else if (l.includes('budget') || l.includes('price') || l.includes('amount') || l.includes('crore')) {
          telecrmField = 'Deal Value';
        } else if (l.includes('visit') || l.includes('site')) {
          telecrmField = 'site visit';
        } else if (l.includes('when') || l.includes('time') || l.includes('plan') || l.includes('invest')) {
          telecrmField = 'Investment Timeline';
        } else if (l.includes('home') || l.includes('bhk') || l.includes('config') || l.includes('suit') || l.includes('require')) {
          telecrmField = 'Home Configuration';
        } else if (l.includes('email')) {
          telecrmField = 'Email';
        } else if (l.includes('phone') || l.includes('mobile') || l.includes('number')) {
          telecrmField = 'Number';
        } else if (l.includes('name')) {
          telecrmField = 'Name';
        } else if (l.includes('birth') || l.includes('dob')) {
          telecrmField = 'Date of Birth';
        } else if (l.includes('city')) {
          telecrmField = 'City';
        } else if (l.includes('state')) {
          telecrmField = 'State';
        }

        return {
          fbQuestion: qText,
          telecrmField,
          replaceRule: 'Replace if empty'
        };
      });
      setFieldMapping(map);
    }
  } catch { }
};

// Fetch Meta status on mount & listen for Meta OAuth Login popup postMessage callback
const fetchConnectedFacebookPages = React.useCallback(async () => {
  try {
    const res = await fetch('/api/integrations/facebook/pages');
    const data = await res.json();
    if (data.success && Array.isArray(data.pages)) {
      const pageMap = new Map<string, any>();
      data.pages.forEach((p: any) => {
        const pid = p.page_id || p.id;
        const existing = pageMap.get(pid);
        if (!existing || (existing.status !== 'active' && p.status === 'active')) {
          pageMap.set(pid, p);
        }
      });
      if (data.account) {
        setFbUser(data.account);
      }
      const uniquePages = Array.from(pageMap.values());
      const activePages = uniquePages.filter((p: any) => p.status === 'active');
      setFbAvailablePages(uniquePages);
      if (activePages.length > 0) {
        const directKeysPage = activePages.find((p: any) => (p.page_name || p.name || '').toLowerCase().includes('direct keys'));
        const firstPage = directKeysPage || activePages[0];
        const firstPageId = firstPage.page_id || firstPage.id;
        setFbPageId(firstPageId);
        setFbPageName(firstPage.page_name || firstPage.name);
        setWizardPageId(firstPageId);
        fetchPageForms(firstPageId);
        setFbStep('connected');
        setIntegrations(prev =>
          prev.map(item =>
            item.id === 'facebook'
              ? {
                ...item,
                isActive: true,
                lastSync: `Connected (${activePages.length} Page${activePages.length > 1 ? 's' : ''})`
              }
              : item
          )
        );
      } else {
        setIntegrations(prev =>
          prev.map(item =>
            item.id === 'facebook'
              ? { ...item, isActive: false, lastSync: 'Disconnected' }
              : item
          )
        );
      }
    }
  } catch {
    // Fallback
  }
}, []);

React.useEffect(() => {
  fetchConnectedFacebookPages();

  const handleFbAuthMessage = async (event: MessageEvent) => {
    if (event.data && (event.data.type === 'META_AUTH_SUCCESS' || event.data.type === 'FB_AUTH_SUCCESS')) {
      toast.success('Successfully connected Facebook Page(s) & registered webhooks!', 'Meta Integration');
      await fetchConnectedFacebookPages();
      setIsModalOpen(false);
      setIsFbConnectModalOpen(false);
      setSelectedManageIntegration((prev) => prev?.id === 'facebook' ? prev : null);
    } else if (event.data && event.data.type === 'META_AUTH_ERROR') {
      toast.error(event.data.error || 'Facebook connection failed', 'Meta Integration');
    }
  };

  window.addEventListener('message', handleFbAuthMessage);
  return () => window.removeEventListener('message', handleFbAuthMessage);
}, [fetchConnectedFacebookPages]);

const handleConnectMeta = async () => {
  setIsLoggingInFb(true);
  try {
    const res = await fetch('/api/integrations/facebook/connect?format=json');
    const data = await res.json();
    if (data.success && data.url) {
      const width = 650;
      const height = 750;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2.5;
      window.open(
        data.url,
        'Facebook OAuth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
      );
    } else {
      window.location.href = '/api/integrations/facebook/connect';
    }
  } catch {
    window.location.href = '/api/integrations/facebook/connect';
  } finally {
    setIsLoggingInFb(false);
  }
};

const handleDisconnectFacebookPage = async (pageId: string) => {
  try {
    const res = await fetch(`/api/integrations/facebook/pages/${pageId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Disconnected page ${pageId}`, 'Meta Integration');
      setFbAvailablePages(prev =>
        prev.map(p => ((p.page_id || p.id) === pageId ? { ...p, status: 'disconnected' } : p))
      );
      await fetchConnectedFacebookPages();
    } else {
      toast.error(data.error || 'Failed to disconnect page', 'Meta Integration');
    }
  } catch (err: any) {
    toast.error(err.message, 'Meta Integration');
  }
};

const handleRemoveFacebookPage = async (pageId: string) => {
  try {
    const res = await fetch(`/api/integrations/facebook/pages/${pageId}?hard=true`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Removed page ${pageId}`, 'Meta Integration');
      setFbAvailablePages(prev => prev.filter(p => (p.page_id || p.id) !== pageId));
      await fetchConnectedFacebookPages();
    } else {
      toast.error(data.error || 'Failed to remove page', 'Meta Integration');
    }
  } catch (err: any) {
    toast.error(err.message, 'Meta Integration');
  }
};

const handleDisconnectIntegration = async (integration: IntegrationItem) => {
  if (integration.id === 'facebook') {
    await handleFacebookLogout();
    return;
  }
  try {
    await fetch('/api/integrations/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: integration.id, name: integration.name })
    });
    setIntegrations(prev =>
      prev.map(item =>
        item.id === integration.id
          ? { ...item, isActive: false, lastSync: undefined }
          : item
      )
    );
    toast.success(`Disconnected ${integration.name}`, 'Integrations');
    if (selectedIntegration?.id === integration.id) {
      setIsModalOpen(false);
    }
  } catch (err: any) {
    toast.error(err.message || 'Failed to disconnect integration', 'Integrations');
  }
};

const handleOfficialFacebookLogin = () => {
  handleConnectMeta();
};

const handleSyncSelectedPage = async () => {
  const page = fbAvailablePages.find(p => p.id === selectedPageId || (p as any).page_id === selectedPageId);
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
    await fetch('/api/integrations/facebook/disconnect', { method: 'POST' });
    await fetch('/api/meta/disconnect', { method: 'POST' });
  } catch (e) { }
  setFbUser(null);
  setFbPageToken('');
  setFbPageId('');
  setFbAvailablePages([]);
  setFbStep('overview');
  setIntegrations(prev => prev.map(item => item.id === 'facebook' ? { ...item, isActive: false, lastSync: 'Disconnected' } : item));
  setModalStatusMsg('Disconnected from Meta account.');
  toast.success('Disconnected from Meta account', 'Meta Integration');
  await fetchConnectedFacebookPages();
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

{/* ========================================================================= */ }
{/* MANAGE FACEBOOK VIEW (SYSTEMATIC 6-STEP LEAD SETUP WIZARD) */ }
{/* ========================================================================= */ }
if (selectedManageIntegration?.id === 'facebook') {
  const activePage = fbAvailablePages.find(p => (p.page_id || p.id) === wizardPageId) || fbAvailablePages[0];
  const activeForm = pageForms.find(f => f.id === wizardFormId) || pageForms[0];

  const filteredTeamMembers = teamMembers.filter(tm => {
    const matchesSearch = tm.name.toLowerCase().includes(teamMemberSearch.toLowerCase());
    const matchesRole = teamMemberRoleFilter === 'All' || (tm.role || '').toLowerCase() === teamMemberRoleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const connectedAccountName = fbUser?.name || activePage?.page_name || activePage?.name || 'Facebook Account';
  const connectedAccountEmail = fbUser?.email || (activePage ? `${(activePage.page_name || activePage.name || 'meta').toLowerCase().replace(/[^a-z0-9]/g, '')}@facebook.com` : 'Connected');

  const handleFinishIntegration = async () => {
    if (!activePage || !activeForm) {
      toast.error('Please select both a Facebook Page and Lead Form from the database.', 'Validation');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        pageId: activePage.page_id || activePage.id,
        pageName: activePage.page_name || activePage.name,
        formId: activeForm.id,
        formName: activeForm.name,
        campaignName: wizardCampaignName.replace(/^@/, '').trim(),
        campaignHandle: wizardCampaignName.startsWith('@') ? wizardCampaignName.trim() : `@${wizardCampaignName.trim()}`,
        fieldMapping,
        leadDistribution: teamMembers.filter(tm => selectedDistributionUsers.includes(tm.id)),
        importOption
      };

      const res = await fetch('/api/integrations/facebook/campaign-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Successfully configured campaign "${wizardCampaignName}"! Incoming leads will automatically route to this campaign.`, 'Campaign Configured');

        // Register form in connected forms list so it appears systematically
        setFormsList(prev => [
          {
            id: `f-${payload.formId}`,
            title: payload.formName,
            companyName: payload.pageName,
            period: 'Active Real-Time',
            totalLeads: 0,
            lastLeadTime: 'Listening for live leads',
            campaignHandle: payload.campaignHandle
          },
          ...prev.filter(f => f.id !== `f-${payload.formId}`)
        ]);

        if (onNavigateToCampaign) {
          onNavigateToCampaign(payload.campaignHandle);
        } else {
          setWizardStep(1);
          setSelectedManageIntegration(null);
        }
      } else {
        toast.error(data.error || 'Failed to save campaign mapping', 'Meta Integration');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error configuring campaign', 'Meta Integration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="text-slate-900 font-sans space-y-4 select-none animate-in fade-in duration-150">

      {/* TOP BREADCRUMB HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedManageIntegration(null)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center space-x-1 cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Integrations</span>
        </button>
      </div>

      {/* MAIN SPLIT VIEW (LEFT: LINKED ACCOUNTS, RIGHT: STEP-BY-STEP WIZARD) */}
      <div className="grid grid-cols-12 gap-5 items-start">

        {/* LEFT COLUMN: LINKED ACCOUNTS PANEL */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Linked Account</span>
            <button
              onClick={handleConnectMeta}
              className="px-2.5 py-1 rounded-md bg-[#6342E8] hover:bg-[#5234D0] text-white text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>Add New</span>
            </button>
          </div>

          {/* DOWNLOAD MARKETING REPORT BUTTON */}
          <button
            onClick={() => toast.info('Generating Meta marketing and lead conversion report...', 'Marketing Report')}
            className="w-full py-2 px-3 rounded-lg bg-[#5338B7] hover:bg-[#462F9C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
          >
            Download Marketing Report
          </button>

          {/* ACTIVE ACCOUNT CARD */}
          <div className="bg-white rounded-xl border border-purple-200/80 p-3.5 shadow-xs hover:border-[#6342E8] transition-all cursor-pointer flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-left overflow-hidden">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {connectedAccountName}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">Integrated</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  with: {connectedAccountEmail}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* RIGHT COLUMN: 6-STEP FORM SETUP WIZARD */}
        <div className="col-span-12 lg:col-span-9 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs text-left space-y-6">

          {/* TOP RIGHT PROFILE / UNLINK HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {connectedAccountName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {connectedAccountEmail}
                </p>
              </div>
            </div>

            <button
              onClick={handleFacebookLogout}
              className="px-3.5 py-1.5 rounded-lg border border-rose-400 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Unlink</span>
            </button>
          </div>

          {/* BACK TO ALL FORMS LINK */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (wizardStep > 1) setWizardStep(wizardStep - 1);
                else setSelectedManageIntegration(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <span>&larr; All forms</span>
            </button>
          </div>

          {/* 6-STEP PROGRESS TRACKER (PIXEL PERFECT AS IN SCREENSHOTS) */}
          <div className="relative py-2 select-none overflow-x-auto">
            <div className="flex items-center justify-between min-w-[650px] relative">

              {/* Horizontal dotted connector line */}
              <div className="absolute top-3.5 left-8 right-8 border-t-2 border-dashed border-[#6342E8]/40 -z-0" />

              {[
                { step: 1, label: 'Step 1', desc: 'Facebook details' },
                { step: 2, label: 'Step 2', desc: 'Map FB questions' },
                { step: 3, label: 'Step 3', desc: 'Choose campaign' },
                { step: 4, label: 'Step 4', desc: 'Lead distribution' },
                { step: 5, label: 'Step 5', desc: 'Import data' },
                { step: 6, label: 'Step 6', desc: 'Finish Integration' },
              ].map((s) => {
                const isCompleted = wizardStep > s.step;
                const isActive = wizardStep === s.step;
                return (
                  <div
                    key={s.step}
                    onClick={() => setWizardStep(s.step)}
                    className="flex flex-col items-center text-center cursor-pointer z-10 px-2"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isCompleted
                        ? 'bg-[#5338B7] text-white shadow-xs'
                        : isActive
                          ? 'bg-white border-2 border-[#5338B7] text-[#5338B7] ring-4 ring-purple-100'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                        }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : isActive ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#5338B7]" />
                      ) : (
                        <span className="text-[10px] font-bold">{s.step}</span>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold mt-1.5 ${isActive ? 'text-[#5338B7]' : 'text-slate-700'}`}>
                      {s.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium max-w-[90px] leading-tight">
                      {s.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 1: FACEBOOK DETAILS (SCREENSHOT 1) */}
          {/* ========================================================================= */}
          {wizardStep === 1 && (
            <div className="space-y-6 pt-4 max-w-xl mx-auto animate-in fade-in duration-150">

              {/* Select FB Page */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 block">
                  Select FB Page
                </label>
                <p className="text-[11px] text-slate-500">
                  Select one of the page linked with FB account
                </p>
                <select
                  value={wizardPageId || activePage?.page_id || activePage?.id || ''}
                  onChange={(e) => {
                    const pId = e.target.value;
                    setWizardPageId(pId);
                    fetchPageForms(pId);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#6342E8] shadow-2xs cursor-pointer"
                >
                  {fbAvailablePages.length === 0 ? (
                    <option value="">Select Option</option>
                  ) : (
                    fbAvailablePages.map((p: any) => (
                      <option key={p.page_id || p.id} value={p.page_id || p.id}>
                        {p.page_name || p.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Select Lead Form */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 block">
                    Select Lead Form
                  </label>
                  <button
                    type="button"
                    onClick={() => fetchPageForms(wizardPageId || activePage?.page_id || activePage?.id || '')}
                    className="text-[11px] font-semibold text-[#6342E8] hover:text-[#5234D0] flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingForms ? 'animate-spin' : ''}`} />
                    <span>Refresh forms</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select one of the lead form published over selected FB Page
                </p>
                <select
                  value={wizardFormId}
                  onChange={(e) => {
                    const fId = e.target.value;
                    setWizardFormId(fId);
                    const sel = pageForms.find(f => f.id === fId);
                    if (sel) {
                      setWizardCampaignName(`@${sel.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
                      fetchFormQuestions(wizardPageId || activePage?.page_id || activePage?.id || '', fId);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#6342E8] shadow-2xs cursor-pointer"
                >
                  {isLoadingForms ? (
                    <option value="">Loading lead forms from Facebook Graph API...</option>
                  ) : pageForms.length === 0 ? (
                    <option value="">Select a published form...</option>
                  ) : (
                    pageForms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.id})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => {
                    if (!wizardFormId && pageForms.length > 0) {
                      setWizardFormId(pageForms[0].id);
                    }
                    setWizardStep(2);
                  }}
                  className="px-6 py-2 rounded-lg bg-[#6342E8] hover:bg-[#5234D0] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: MAP FB QUESTIONS (SCREENSHOT 2) */}
          {/* ========================================================================= */}
          {wizardStep === 2 && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-800 tracking-wider">
                  MAP YOUR DATA
                </span>
                <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-[#5338B7]/10 text-[#5338B7] text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#5338B7]" />
                  <span>TELECRM FIELD</span>
                </div>
              </div>

              {/* Table rows matching Screenshot 2 */}
              <div className="space-y-2.5">
                {fieldMapping.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center">

                    {/* FB Form Question */}
                    <div className="col-span-5 relative">
                      <div className="w-full flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800">
                        <span className="text-[#1877F2] font-black text-xs">f</span>
                        <span>{item.fbQuestion}</span>
                      </div>
                    </div>

                    {/* Replace Rule */}
                    <div className="col-span-3">
                      <select
                        value={item.replaceRule}
                        onChange={(e) => {
                          const newMap = [...fieldMapping];
                          newMap[idx].replaceRule = e.target.value;
                          setFieldMapping(newMap);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#6342E8] shadow-2xs cursor-pointer"
                      >
                        <option value="Replace if empty">Replace if empty</option>
                        <option value="Always replace">Always replace</option>
                        <option value="Never replace">Never replace</option>
                      </select>
                    </div>

                    {/* TeleCRM Target Field (Fetched from Database) */}
                    <div className="col-span-3">
                      <select
                        value={item.telecrmField}
                        onChange={(e) => {
                          const newMap = [...fieldMapping];
                          newMap[idx].telecrmField = e.target.value;
                          setFieldMapping(newMap);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#6342E8] shadow-2xs cursor-pointer"
                      >
                        <option value="[ Select Telecrm Field To Map ]">[ Select Telecrm Field To Map ]</option>
                        {telecrmLeadFields.map((fName) => {
                          const isUsed = fieldMapping.some((m, mIdx) => mIdx !== idx && m.telecrmField === fName);
                          return (
                            <option key={fName} value={fName} disabled={isUsed}>
                              {fName} {isUsed ? '(Already mapped)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Status Icon matching user screenshot */}
                    <div className="col-span-1 flex items-center justify-center">
                      {item.telecrmField !== '[ Select Telecrm Field To Map ]' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold" title="Field unmapped">
                          i
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setWizardStep(1)}
                  className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  className="px-6 py-2 rounded-lg bg-[#6342E8] hover:bg-[#5234D0] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: CHOOSE CAMPAIGN (SCREENSHOT 3) */}
          {/* ========================================================================= */}
          {wizardStep === 3 && (
            <div className="space-y-6 pt-2 animate-in fade-in duration-150">

              {/* Header matching Screenshot 3 */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Choose campaign action
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This will help you to manage all your leads collectively and easily
                  </p>
                </div>

                <button
                  onClick={() => toast.info('You can type any campaign name below or select existing campaigns.', 'Campaign Action')}
                  className="px-3.5 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1 cursor-pointer shadow-2xs"
                >
                  <span>Create new campaign</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* Campaign Name Field */}
              <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  CREATE CAMPAIGN WITH THIS BATCH
                </span>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    CAMPAIGN NAME
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={wizardCampaignName}
                      onChange={(e) => setWizardCampaignName(e.target.value)}
                      placeholder="Enter campaign name (e.g. @summer-ads)"
                      className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-4 py-2 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-[#6342E8] shadow-2xs transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    💡 This campaign will automatically register and appear in your <strong>Campaigns &amp; Tags</strong> component for granular lead grouping &amp; tracking.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setWizardStep(4)}
                  className="px-6 py-2 rounded-lg bg-[#6342E8] hover:bg-[#5234D0] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: LEAD DISTRIBUTION (SCREENSHOT 4) */}
          {/* ========================================================================= */}
          {wizardStep === 4 && (
            <div className="space-y-5 pt-2 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Lead Distribution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will help you to distribute all your leads collectively and easily
                </p>
              </div>

              {/* Search and Team Members Card */}
              <div className="bg-white border border-purple-200/80 rounded-2xl p-4 shadow-xs space-y-3">

                {/* Search Bar + Role Pills */}
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#6342E8] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={teamMemberSearch}
                      onChange={(e) => setTeamMemberSearch(e.target.value)}
                      placeholder="Search team member"
                      className="w-full bg-purple-50/40 border border-purple-200/60 rounded-xl pl-8 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6342E8]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {['Root', 'Admin', 'Manager', 'Caller', 'Marketing_user'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setTeamMemberRoleFilter(teamMemberRoleFilter === role ? 'All' : role)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${teamMemberRoleFilter === role
                          ? 'bg-[#6342E8] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Members List */}
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                  {filteredTeamMembers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No team members found matching criteria in the database.
                    </div>
                  ) : (
                    filteredTeamMembers.map((member) => {
                      const isSelected = selectedDistributionUsers.includes(member.id);
                      const initials = (member.name || '').split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'TM';
                      return (
                        <div
                          key={member.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedDistributionUsers(selectedDistributionUsers.filter(id => id !== member.id));
                            } else {
                              setSelectedDistributionUsers([...selectedDistributionUsers, member.id]);
                            }
                          }}
                          className="py-2.5 px-2 flex items-center space-x-3 hover:bg-slate-50/80 rounded-xl cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            className="w-4 h-4 rounded text-[#6342E8] focus:ring-[#6342E8] border-slate-300"
                          />
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-[#5338B7] font-bold text-[10px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">
                              {member.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {member.role || 'Agent'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selection Notice in Red */}
                <div className="text-right pt-1">
                  {selectedDistributionUsers.length === 0 ? (
                    <span className="text-[11px] font-semibold text-rose-500">
                      No member selected
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600">
                      {selectedDistributionUsers.length} member(s) selected for round-robin auto assignment
                    </span>
                  )}
                </div>
              </div>

              {/* Distribute only among active users checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="distributeActiveOnly"
                  checked={distributeActiveOnly}
                  onChange={(e) => setDistributeActiveOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6342E8] focus:ring-[#6342E8] border-slate-300 cursor-pointer"
                />
                <label htmlFor="distributeActiveOnly" className="text-xs font-semibold text-slate-800 cursor-pointer flex items-center space-x-1">
                  <span>Distribute leads among selected active users only</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setWizardStep(3)}
                  className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setWizardStep(5)}
                  className="px-6 py-2 rounded-lg bg-[#6342E8] hover:bg-[#5234D0] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: IMPORT DATA */}
          {/* ========================================================================= */}
          {wizardStep === 5 && (
            <div className="space-y-5 pt-2 max-w-lg mx-auto animate-in fade-in duration-150">
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-900">
                  Import Lead Data
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose how historical leads should be synchronized into your CRM database
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'future_only', title: 'Only sync future real-time leads', desc: 'Recommended: Captures new inbound Meta leads as soon as leads submit the form.' },
                  { id: 'last_30_days', title: 'Import leads from the last 30 days', desc: 'Imports recent submissions from this lead form and tags them with this campaign.' },
                  { id: 'all', title: 'Import all historical leads', desc: 'Imports all available past leads recorded on this form by Facebook Graph API.' },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setImportOption(opt.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${importOption === opt.id
                      ? 'bg-purple-50/50 border-[#6342E8] shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="importOption"
                      checked={importOption === opt.id}
                      onChange={() => setImportOption(opt.id)}
                      className="mt-0.5 text-[#6342E8] focus:ring-[#6342E8]"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{opt.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setWizardStep(4)}
                  className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setWizardStep(6)}
                  className="px-6 py-2 rounded-lg bg-[#6342E8] hover:bg-[#5234D0] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 6: FINISH INTEGRATION */}
          {/* ========================================================================= */}
          {wizardStep === 6 && (
            <div className="space-y-5 pt-2 max-w-lg mx-auto animate-in fade-in duration-150">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Finish Facebook Integration
                </h3>
                <p className="text-xs text-slate-500">
                  Review your configuration below and activate live synchronization
                </p>
              </div>

              {/* Summary Box */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Facebook Page:</span>
                  <span className="font-bold text-slate-800">{activePage?.page_name || activePage?.name || 'Facebook Page'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Lead Form:</span>
                  <span className="font-bold text-slate-800">{activeForm?.name || 'no-otp-form---andra'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Campaign Handle:</span>
                  <span className="font-mono font-bold text-[#6342E8]">{wizardCampaignName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Mapped Fields:</span>
                  <span className="font-bold text-slate-800">{fieldMapping.filter(m => m.telecrmField !== '[ Select Telecrm Field To Map ]').length} Fields</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Lead Distribution:</span>
                  <span className="font-bold text-slate-800">
                    {selectedDistributionUsers.length > 0 ? `${selectedDistributionUsers.length} Users Selected` : 'Default Admin'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setWizardStep(5)}
                  className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleFinishIntegration}
                  disabled={isSaving}
                  className="px-7 py-2 rounded-lg bg-[#6342E8] hover:bg-[#5234D0] text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Finish Integration</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

{/* ========================================================================= */ }
{/* INTEGRATIONS CATALOG VIEW (ALL INTEGRATIONS LIST) */ }
{/* ========================================================================= */ }
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
              onClick={() => toast.success('Browser push notifications enabled successfully!', 'Notifications')}
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

                  <button
                    onClick={() => handleDisconnectIntegration(item)}
                    className="px-2.5 py-0.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0"
                  >
                    Disconnect
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
        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden space-y-0 max-h-[90vh] flex flex-col m-auto my-auto">

          {/* Modal Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-3">
              {renderBrandIcon(selectedIntegration.iconType, selectedIntegration.name)}
              <div>
                <h3 className="font-bold text-slate-900 text-base md:text-lg">
                  {selectedIntegration.name} Live Integration
                </h3>
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
                      <div className="w-10 h-10 rounded-xl bg-[#0866FF]/10 border border-[#0866FF]/20 text-[#0866FF] flex items-center justify-center font-bold text-xl mx-auto shadow-2xs">
                        f
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-xs">Connect your Facebook Account</h4>
                      </div>

                      <button
                        onClick={handleOfficialFacebookLogin}
                        disabled={isLoggingInFb}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#0866FF] hover:bg-[#0052CC] active:bg-[#0041A8] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60 mx-auto"
                      >
                        <span className="w-4 h-4 rounded-full bg-white text-[#0866FF] font-black text-[10px] flex items-center justify-center shadow-xs shrink-0">
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
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTestIntegration}
                disabled={isTestingConn}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all flex items-center space-x-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>

              {selectedIntegration.isActive && (
                <button
                  onClick={() => handleDisconnectIntegration(selectedIntegration)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer transition-all flex items-center space-x-1"
                >
                  <span>Disconnect</span>
                </button>
              )}
            </div>

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


export const IntegrationsView = IntegrationsPage;
export default IntegrationsPage;
