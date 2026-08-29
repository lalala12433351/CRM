import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  PhoneCall, 
  Bot, 
  MessageSquare, 
  Bell, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Check, 
  Clock,
  Kanban,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ChevronRight,
  ChevronDown,
  CreditCard,
  ShoppingCart,
  Receipt,
  Download,
  Edit3,
  ExternalLink,
  CheckCircle2,
  X,
  Zap,
  Info,
  Users,
  UserPlus,
  UserCheck,
  SlidersHorizontal
} from 'lucide-react';

const STAGE_COLOR_SWATCHES = [
  '#3d6b60', '#787d77', '#803300', '#ff6600', '#e69900',
  '#008e76', '#0073e6', '#6610f2', '#e80088', '#ff001b',
  '#00b4d8', '#55a600', '#0011a8', '#702066', '#591010'
];

interface ColorPickerDropdownProps {
  color: string;
  onChange: (newColor: string) => void;
}

const ColorPickerDropdown: React.FC<ColorPickerDropdownProps> = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button: Solid Color Bar with Chevron Down Arrow */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-36 h-9 px-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
      >
        {/* Solid Color Bar */}
        <div
          className="h-5 flex-1 rounded-md transition-transform group-hover:scale-[0.99]"
          style={{ backgroundColor: color }}
        />
        {/* Chevron Down Arrow */}
        <ChevronDown className={`w-4 h-4 text-slate-500 ml-2 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Palette Popover Dropdown (15 Circular Swatches in 3x5 Grid) */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-5 gap-2.5">
            {STAGE_COLOR_SWATCHES.map((c) => {
              const isSelected = color.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onChange(c);
                    setIsOpen(false);
                  }}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'scale-110 ring-2 ring-blue-600 ring-offset-2'
                      : 'hover:scale-110 opacity-95 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
import { PipelineStage, Agent, CustomFieldDef, PermissionTemplate } from '../types';
import { INITIAL_STAGES, INITIAL_AGENTS, INITIAL_CUSTOM_FIELDS, INITIAL_PERMISSION_TEMPLATES } from '../constants/initialState';
import { FieldsSettingsView } from './FieldsSettingsView';
import { PermissionsSettingsView } from './PermissionsSettingsView';

interface SettingsViewProps {
  companyName?: string;
  onUpdateCompanyName?: (name: string) => void;
  supportEmail?: string;
  onUpdateSupportEmail?: (email: string) => void;
  currency?: string;
  onUpdateCurrency?: (code: string) => void;
  activeAgent?: Agent;
  onShowToast?: (message: string) => void;
  stages?: PipelineStage[];
  onUpdateStages?: (stages: PipelineStage[]) => void;
  agents?: Agent[];
  onUpdateAgents?: (agents: Agent[]) => void;
  customFields?: CustomFieldDef[];
  onUpdateFields?: (fields: CustomFieldDef[]) => void;
  permissionTemplates?: PermissionTemplate[];
  onUpdatePermissionTemplates?: (templates: PermissionTemplate[]) => void;
  initialTab?: SettingsTab;
}

export type SettingsTab = 
  | 'fields'
  | 'permissions'
  | 'general' 
  | 'pipeline'
  | 'billing'
  | 'telephony' 
  | 'ai_scoring' 
  | 'whatsapp' 
  | 'notifications' 
  | 'security';

const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#059669', // Dark Green
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#64748B'  // Slate
];

const INDUSTRY_PRESETS = [
  {
    id: 'preset-realestate',
    name: 'Real Estate & Property',
    stages: [
      { id: 'stg-re-1', name: 'Fresh Inquiry', color: '#3B82F6', order: 1, winProbability: 10 },
      { id: 'stg-re-2', name: 'Site Visit Scheduled', color: '#8B5CF6', order: 2, winProbability: 30 },
      { id: 'stg-re-3', name: 'Site Visited', color: '#06B6D4', order: 3, winProbability: 50 },
      { id: 'stg-re-4', name: 'Negotiation', color: '#F59E0B', order: 4, winProbability: 75 },
      { id: 'stg-re-5', name: 'Booking Amount Paid', color: '#059669', order: 5, winProbability: 100 },
      { id: 'stg-re-6', name: 'Lost / Cancelled', color: '#EF4444', order: 6, winProbability: 0 },
    ]
  },
  {
    id: 'preset-edtech',
    name: 'EdTech & Admissions',
    stages: [
      { id: 'stg-ed-1', name: 'New Application', color: '#3B82F6', order: 1, winProbability: 15 },
      { id: 'stg-ed-2', name: 'Counseling Call', color: '#8B5CF6', order: 2, winProbability: 35 },
      { id: 'stg-ed-3', name: 'Demo Class Attended', color: '#06B6D4', order: 3, winProbability: 60 },
      { id: 'stg-ed-4', name: 'Fee Structure Shared', color: '#F59E0B', order: 4, winProbability: 80 },
      { id: 'stg-ed-5', name: 'Enrolled / Admitted', color: '#059669', order: 5, winProbability: 100 },
      { id: 'stg-ed-6', name: 'Not Eligible', color: '#64748B', order: 6, winProbability: 0 },
    ]
  },
  {
    id: 'preset-b2b',
    name: 'B2B SaaS & Enterprise',
    stages: [
      { id: 'stg-b2b-1', name: 'Inbound Lead', color: '#3B82F6', order: 1, winProbability: 10 },
      { id: 'stg-b2b-2', name: 'Discovery Call', color: '#6366F1', order: 2, winProbability: 25 },
      { id: 'stg-b2b-3', name: 'Demo Scheduled', color: '#06B6D4', order: 3, winProbability: 50 },
      { id: 'stg-b2b-4', name: 'Proposal Sent', color: '#F59E0B', order: 4, winProbability: 75 },
      { id: 'stg-b2b-5', name: 'Contract Signed', color: '#059669', order: 5, winProbability: 100 },
      { id: 'stg-b2b-6', name: 'Closed Lost', color: '#EF4444', order: 6, winProbability: 0 },
    ]
  },
  {
    id: 'preset-services',
    name: 'Agency & Services',
    stages: [
      { id: 'stg-srv-1', name: 'Contact Received', color: '#3B82F6', order: 1, winProbability: 10 },
      { id: 'stg-srv-2', name: 'Requirement Gathering', color: '#8B5CF6', order: 2, winProbability: 30 },
      { id: 'stg-srv-3', name: 'Quote / Estimate Shared', color: '#F59E0B', order: 3, winProbability: 60 },
      { id: 'stg-srv-4', name: 'Advance Invoice Paid', color: '#10B981', order: 4, winProbability: 90 },
      { id: 'stg-srv-5', name: 'Active Project', color: '#059669', order: 5, winProbability: 100 },
      { id: 'stg-srv-6', name: 'Disqualified', color: '#EF4444', order: 6, winProbability: 0 },
    ]
  }
];

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  companyName: initialCompanyName,
  onUpdateCompanyName,
  supportEmail: initialSupportEmail,
  onUpdateSupportEmail,
  currency: initialCurrency,
  onUpdateCurrency,
  activeAgent,
  onShowToast, 
  stages, 
  onUpdateStages,
  agents,
  onUpdateAgents,
  customFields,
  onUpdateFields,
  permissionTemplates,
  onUpdatePermissionTemplates,
  initialTab = 'general'
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [localCustomFields, setLocalCustomFields] = useState<CustomFieldDef[]>(customFields || INITIAL_CUSTOM_FIELDS);
  const [localTemplates, setLocalTemplates] = useState<PermissionTemplate[]>(permissionTemplates || INITIAL_PERMISSION_TEMPLATES);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  React.useEffect(() => {
    if (customFields) {
      setLocalCustomFields(customFields);
    }
  }, [customFields]);

  React.useEffect(() => {
    if (permissionTemplates) {
      setLocalTemplates(permissionTemplates);
    }
  }, [permissionTemplates]);

  const handleTemplatesChange = (updated: PermissionTemplate[]) => {
    setLocalTemplates(updated);
    if (onUpdatePermissionTemplates) {
      onUpdatePermissionTemplates(updated);
    }
  };

  const handleCustomFieldsChange = (updated: CustomFieldDef[]) => {
    setLocalCustomFields(updated);
    if (onUpdateFields) {
      onUpdateFields(updated);
    }
  };
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Assignees / Team Members State
  const [localAgents, setLocalAgents] = useState<Agent[]>(agents || INITIAL_AGENTS);
  const [showAddAssigneeModal, setShowAddAssigneeModal] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState('');
  const [newAssigneeEmail, setNewAssigneeEmail] = useState('');
  const [newAssigneePhone, setNewAssigneePhone] = useState('');
  const [newAssigneeRole, setNewAssigneeRole] = useState<'Telecaller' | 'Sales Manager' | 'Admin'>('Telecaller');
  const [newAssigneeStatus, setNewAssigneeStatus] = useState<'online' | 'offline'>('online');
  const [newAssigneeAvatar, setNewAssigneeAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  React.useEffect(() => {
    if (agents) {
      setLocalAgents(agents);
    }
  }, [agents]);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setNewAssigneeAvatar(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAssignee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssigneeName.trim() || !newAssigneeEmail.trim()) {
      if (onShowToast) onShowToast('Please enter name and email for the assignee.');
      return;
    }

    const sampleAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    ];

    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: newAssigneeName.trim(),
      email: newAssigneeEmail.trim(),
      phone: newAssigneePhone.trim() || '+91 98765 00000',
      role: newAssigneeRole,
      status: newAssigneeStatus,
      avatar: newAssigneeAvatar || sampleAvatars[0],
      totalCallsToday: 0,
      talkTimeMinutes: 0,
      convertedLeadsCount: 0,
      revenueGenerated: 0,
      responseTimeMinutes: 2.0,
    };

    const updatedList = [newAgent, ...localAgents];
    setLocalAgents(updatedList);
    if (onUpdateAgents) onUpdateAgents(updatedList);
    if (onShowToast) onShowToast(`Assignee ${newAgent.name} added successfully!`);

    setNewAssigneeName('');
    setNewAssigneeEmail('');
    setNewAssigneePhone('');
    setNewAssigneeRole('Telecaller');
    setNewAssigneeStatus('online');
    setNewAssigneeAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
    setShowAddAssigneeModal(false);
  };

  const handleRemoveAssignee = (agentId: string, agentName: string) => {
    const updatedList = localAgents.filter(a => a.id !== agentId);
    setLocalAgents(updatedList);
    if (onUpdateAgents) onUpdateAgents(updatedList);
    if (onShowToast) onShowToast(`Assignee "${agentName}" removed from workspace.`);
  };

  // Pipeline Stages Customization State
  const [localStages, setLocalStages] = useState<PipelineStage[]>(
    stages && stages.length > 0 ? stages : INITIAL_STAGES
  );

  useEffect(() => {
    if (stages && stages.length > 0) {
      setLocalStages(stages);
    }
  }, [stages]);

  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3B82F6');
  const [newStageCategory, setNewStageCategory] = useState<'initial' | 'active' | 'closed'>('active');

  // Lost Reasons State
  const [lostReasons, setLostReasons] = useState<string[]>([
    'No Need',
    'Unable to Connect',
    'Budget Issues',
    'Product does not fit need',
    'Lost to competitor',
    'Unknown Reason',
    'Not eligible',
    'Junk'
  ]);
  const [newLostReasonInput, setNewLostReasonInput] = useState('');

  // Form State - General Settings
  const [companyName, setCompanyName] = useState(initialCompanyName || 'ARCLE Real Estate & Sales');

  useEffect(() => {
    if (initialCompanyName) {
      setCompanyName(initialCompanyName);
    }
  }, [initialCompanyName]);

  const defaultSupportEmail = initialSupportEmail || activeAgent?.email || 'admin@company.com';
  const [supportEmail, setSupportEmail] = useState(defaultSupportEmail);

  useEffect(() => {
    if (initialSupportEmail || activeAgent?.email) {
      setSupportEmail(initialSupportEmail || activeAgent?.email || 'admin@company.com');
    }
  }, [initialSupportEmail, activeAgent?.email]);
  const [currency, setCurrency] = useState(initialCurrency || 'INR');

  useEffect(() => {
    if (initialCurrency) {
      setCurrency(initialCurrency);
    }
  }, [initialCurrency]);
  const [timezone, setTimezone] = useState('Asia/Kolkata (GMT+5:30)');
  const [workingHoursStart, setWorkingHoursStart] = useState('09:30');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:30');
  const [workingDays, setWorkingDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

  // Form State - Telephony Settings
  const [defaultCountryCode, setDefaultCountryCode] = useState('+91');
  const [powerDialerDelay, setPowerDialerDelay] = useState('5');
  const [autoRecordCalls, setAutoRecordCalls] = useState(true);
  const [autoNextDial, setAutoNextDial] = useState(true);
  const [sttLanguage, setSttLanguage] = useState('en-IN');

  // Form State - AI & Scoring Engine
  const [aiSensitivity, setAiSensitivity] = useState('balanced');
  const [hotLeadThreshold, setHotLeadThreshold] = useState(80);
  const [warmLeadThreshold, setWarmLeadThreshold] = useState(50);
  const [autoAssignHotLeads, setAutoAssignHotLeads] = useState(true);
  const [summaryFormat, setSummaryFormat] = useState('bullets');

  // Form State - WhatsApp & Webhooks
  const [waSenderNumber, setWaSenderNumber] = useState('+91 98765 43210');
  const [autoGreetingEnabled, setAutoGreetingEnabled] = useState(true);
  const [greetingMessage, setGreetingMessage] = useState('Hello {{name}}! Thank you for reaching out to ARCLE. A telecaller will connect with you shortly.');
  const [webhookRetryCount, setWebhookRetryCount] = useState('5');

  // Form State - Notifications
  const [desktopPush, setDesktopPush] = useState(true);
  const [hotLeadSoundAlert, setHotLeadSoundAlert] = useState(true);
  const [dailyDigestEmail, setDailyDigestEmail] = useState(true);
  const [unassignedAlarmMinutes, setUnassignedAlarmMinutes] = useState('15');

  // Form State - Security & Access
  const [enforceTwoFactor, setEnforceTwoFactor] = useState(true);
  const [exportPermission, setExportPermission] = useState('admins_only');
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('8');

  // Form State - Payments & Billing (Buy Licenses)
  const [billingPeriod, setBillingPeriod] = useState<'Quarterly' | 'Annual'>('Annual');
  const [cartItems, setCartItems] = useState<Array<{
    id: string;
    title: string;
    price: number;
    qty: number;
    category: 'license' | 'service';
  }>>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState(false);
  const [lastPaidTxnId, setLastPaidTxnId] = useState('');
  const [showEditBillingModal, setShowEditBillingModal] = useState(false);

  // Billing Details State
  const [billingOrg, setBillingOrg] = useState('SKYKITE INSTITUTE OF AVIATION AND AEROSPACE PVT LTD');
  const [billingEmail, setBillingEmail] = useState('coo@kiteaviation.in');
  const [billingGstin, setBillingGstin] = useState('07AABCS1429B1Z8');
  const [billingAddress, setBillingAddress] = useState('Plot 42, Aviation Enclave, Dwarka Sec-8, New Delhi - 110077');

  // Mock Past Transactions
  const [transactions, setTransactions] = useState([
    {
      id: 'TXN-2026-98124',
      date: '13 Aug 2026',
      item: 'Core CRM + WhatsApp Chat Sync (Annual License)',
      amount: 14145.84,
      tax: 2157.84,
      status: 'Completed',
      paymentMethod: 'Razorpay UPI (coo@okhdfcbank)',
      invoiceUrl: '#'
    },
    {
      id: 'TXN-2026-44102',
      date: '10 May 2026',
      item: 'Whatsapp Cloud API Setup Charges',
      amount: 1998.92,
      tax: 304.92,
      status: 'Completed',
      paymentMethod: 'Credit Card (HDFC **** 4242)',
      invoiceUrl: '#'
    }
  ]);

  // Cart Helper Functions
  const handleAddToCart = (item: { id: string; title: string; price: number; category: 'license' | 'service' }) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.filter((i) => i.id !== item.id);
      } else {
        return [...prev, { ...item, qty: 1 }];
      }
    });
    if (onShowToast) onShowToast(`Updated cart: "${item.title}"`);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as typeof cartItems
    );
  };

  const getCartSubtotal = () => cartItems.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
  const getCartGst = () => {
    const subtotal = getCartSubtotal();
    const discounted = promoApplied ? subtotal * 0.8 : subtotal;
    return Math.round(discounted * 0.18);
  };
  const getCartGrandTotal = () => {
    const subtotal = getCartSubtotal();
    const discounted = promoApplied ? subtotal * 0.8 : subtotal;
    return Math.round(discounted * 1.18);
  };

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'ARCLE20' || promoCode.trim().toUpperCase() === 'TELECRM20') {
      setPromoApplied(true);
      if (onShowToast) onShowToast('20% Discount Code Applied!');
    } else {
      alert('Invalid promo code. Try "TELECRM20" or "ARCLE20".');
    }
  };

  const handleCompletePayment = () => {
    setIsProcessingPayment(true);
    const totalAmount = getCartGrandTotal();

    setTimeout(() => {
      setIsProcessingPayment(false);
      const newTxnId = `TXN-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      setLastPaidTxnId(newTxnId);

      const newTxn = {
        id: newTxnId,
        date: '13 Aug 2026',
        item: cartItems.map(i => i.title).join(', '),
        amount: totalAmount,
        tax: getCartGst(),
        status: 'Completed',
        paymentMethod: selectedPaymentMethod === 'upi' ? 'Razorpay UPI (BHIM / PhonePe)' : selectedPaymentMethod === 'card' ? 'Visa Credit Card (**** 8812)' : 'HDFC Netbanking',
        invoiceUrl: '#'
      };

      setTransactions(prev => [newTxn, ...prev]);
      setCartItems([]);
      setShowCheckoutModal(false);
      setPaymentSuccessModal(true);

      if (onShowToast) onShowToast(`Payment of ₹${totalAmount.toLocaleString('en-IN')} successful! License extended.`);
    }, 1200);
  };

  const handleDownloadInvoice = (txn: any) => {
    alert(`Downloading GST Tax Invoice ${txn.id}\nOrganization: ${billingOrg}\nAmount: ₹${txn.amount}\nStatus: Paid`);
  };

  // Pipeline Stage Handlers
  const handleUpdateStageField = (stageId: string, field: keyof PipelineStage, value: any) => {
    setLocalStages((prev) => {
      const updated = prev.map((s) => (s.id === stageId ? { ...s, [field]: value } : s));
      if (onUpdateStages) onUpdateStages(updated);
      return updated;
    });
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localStages.length) return;
    const updated = [...localStages];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    const reordered = updated.map((st, i) => ({ ...st, order: i + 1 }));
    setLocalStages(reordered);
    if (onUpdateStages) onUpdateStages(reordered);
  };

  const handleDeleteStage = (stageId: string) => {
    if (localStages.length <= 2) {
      alert('Pipeline must contain at least 2 stages.');
      return;
    }
    setLocalStages((prev) => {
      const updated = prev.filter((s) => s.id !== stageId);
      if (onUpdateStages) onUpdateStages(updated);
      return updated;
    });
  };

  const handleAddCustomStage = () => {
    if (!newStageName.trim()) {
      alert('Please enter a stage name.');
      return;
    }
    const newStage: PipelineStage = {
      id: `custom-stage-${Date.now()}`,
      name: newStageName.trim(),
      color: newStageColor,
      order: localStages.length + 1,
      category: newStageCategory,
      winProbability: 50,
    };
    const updated = [...localStages, newStage];
    setLocalStages(updated);
    if (onUpdateStages) {
      onUpdateStages(updated);
    }
    setNewStageName('');
    setShowAddStageModal(false);
    if (onShowToast) {
      onShowToast(`Added custom pipeline stage "${newStage.name}"`);
    }
  };

  const handleApplyIndustryPreset = (preset: typeof INDUSTRY_PRESETS[0]) => {
    setLocalStages(preset.stages);
    if (onUpdateStages) {
      onUpdateStages(preset.stages);
    }
    if (onShowToast) {
      onShowToast(`Applied ${preset.name} pipeline preset (${preset.stages.length} stages)`);
    }
  };

  const handleResetStagesToDefault = () => {
    setLocalStages(INITIAL_STAGES);
    if (onUpdateStages) {
      onUpdateStages(INITIAL_STAGES);
    }
    if (onShowToast) {
      onShowToast('Reset pipeline stages & colors to default configuration');
    }
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    setSavedSuccess(false);

    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      if (onUpdateStages) {
        onUpdateStages(localStages);
      }
      if (onShowToast) {
        onShowToast('CRM Settings & Pipeline stages saved successfully!');
      }
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 600);
  };

  const handleResetDefaults = () => {
    setCompanyName('ARCLE Real Estate & Sales');
    setSupportEmail('support@arclecrm.io');
    setCurrency('INR');
    setTimezone('Asia/Kolkata (GMT+5:30)');
    setDefaultCountryCode('+91');
    setPowerDialerDelay('5');
    setAutoRecordCalls(true);
    setHotLeadThreshold(80);
    setWarmLeadThreshold(50);
    setAutoGreetingEnabled(true);
    setDesktopPush(true);
    setHotLeadSoundAlert(true);
    setLocalStages(INITIAL_STAGES);
    if (onUpdateStages) {
      onUpdateStages(INITIAL_STAGES);
    }
    if (onShowToast) {
      onShowToast('All CRM settings reset to system defaults');
    }
  };

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      if (workingDays.length > 1) {
        setWorkingDays(workingDays.filter((d) => d !== day));
      }
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  return (
    <div className="text-slate-900 font-sans space-y-5 select-none pb-8">
      
      {/* HEADER BAR */}
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans pb-2">
        <div>
          <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight flex items-center space-x-3">
            <span>CRM Settings & Preferences</span>
            <span className="text-[10px] font-sans font-medium bg-blue-50 text-[#2563eb] border border-blue-100 px-2.5 py-0.5 rounded-full tracking-wide">
              System Admin
            </span>
          </h1>
        </div>

        <div className="flex items-center space-x-2.5 font-sans shrink-0">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all cursor-pointer font-sans shadow-2xs"
          >
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-medium transition-all cursor-pointer font-sans shadow-sm shadow-blue-500/20 disabled:opacity-50 flex items-center space-x-2"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : savedSuccess ? (
              <span>Saved!</span>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>

      {/* TABS & CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans pt-2">
        
        {/* SIDEBAR NAVIGATION TABS */}
        <div className="lg:col-span-3 space-y-1.5 bg-white border border-slate-100 rounded-3xl p-3 h-fit shadow-xs font-sans">
          <p className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
            Configuration Sections
          </p>

          <button
            onClick={() => setActiveTab('fields')}
            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-sans transition-all cursor-pointer ${
              activeTab === 'fields'
                ? 'bg-[#eff6ff] text-[#2563eb] font-bold border border-blue-100'
                : 'bg-[#f8fafc] hover:bg-slate-100/80 text-slate-600 font-medium border border-transparent'
            }`}
          >
            <SlidersHorizontal className={`w-4 h-4 shrink-0 ${activeTab === 'fields' ? 'text-[#2563eb]' : 'text-slate-400'}`} />
            <span className="flex-1 text-left font-sans">Fields Settings</span>
            <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'fields' ? 'bg-blue-100 text-[#2563eb]' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {localCustomFields.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-sans transition-all cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-[#eff6ff] text-[#2563eb] font-bold border border-blue-100'
                : 'bg-[#f8fafc] hover:bg-slate-100/80 text-slate-600 font-medium border border-transparent'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === 'permissions' ? 'text-[#2563eb]' : 'text-slate-400'}`} />
            <span className="flex-1 text-left font-sans">Permission Templates</span>
            <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'permissions' ? 'bg-blue-100 text-[#2563eb]' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {localTemplates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-sans transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-[#eff6ff] text-[#2563eb] font-bold border border-blue-100'
                : 'bg-[#f8fafc] hover:bg-slate-100/80 text-slate-600 font-medium border border-transparent'
            }`}
          >
            <Building2 className={`w-4 h-4 shrink-0 ${activeTab === 'general' ? 'text-[#2563eb]' : 'text-slate-400'}`} />
            <span className="font-sans">General & Business</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-sans transition-all cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-[#eff6ff] text-[#2563eb] font-bold border border-blue-100'
                : 'bg-[#f8fafc] hover:bg-slate-100/80 text-slate-600 font-medium border border-transparent'
            }`}
          >
            <Kanban className={`w-4 h-4 shrink-0 ${activeTab === 'pipeline' ? 'text-[#2563eb]' : 'text-slate-400'}`} />
            <span className="flex-1 text-left font-sans">Pipeline Stages & Colors</span>
            <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'pipeline' ? 'bg-blue-100 text-[#2563eb]' : 'bg-amber-100 text-amber-700'
            }`}>
              New
            </span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-sans transition-all cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-[#eff6ff] text-[#2563eb] font-bold border border-blue-100'
                : 'bg-[#f8fafc] hover:bg-slate-100/80 text-slate-600 font-medium border border-transparent'
            }`}
          >
            <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === 'billing' ? 'text-[#2563eb]' : 'text-slate-400'}`} />
            <span className="flex-1 text-left font-sans">Buy Licenses & Billing</span>
            <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'billing' ? 'bg-blue-100 text-[#2563eb]' : 'bg-emerald-100 text-emerald-700'
            }`}>
              Billing
            </span>
          </button>

          <button
            onClick={() => setActiveTab('telephony')}
            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-sans transition-all cursor-pointer ${
              activeTab === 'telephony'
                ? 'bg-[#eff6ff] text-[#2563eb] font-bold border border-blue-100'
                : 'bg-[#f8fafc] hover:bg-slate-100/80 text-slate-600 font-medium border border-transparent'
            }`}
          >
            <PhoneCall className={`w-4 h-4 shrink-0 ${activeTab === 'telephony' ? 'text-[#2563eb]' : 'text-slate-400'}`} />
            <span className="font-sans">Telephony & Dialer</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_scoring')}
            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-sans transition-all cursor-pointer ${
              activeTab === 'ai_scoring'
                ? 'bg-[#eff6ff] text-[#2563eb] font-bold border border-blue-100'
                : 'bg-[#f8fafc] hover:bg-slate-100/80 text-slate-600 font-medium border border-transparent'
            }`}
          >
            <Bot className={`w-4 h-4 shrink-0 ${activeTab === 'ai_scoring' ? 'text-[#2563eb]' : 'text-slate-400'}`} />
            <span className="font-sans">AI & Lead Scoring</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-sans transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-[#eff6ff] text-[#2563eb] font-bold border border-blue-100'
                : 'bg-[#f8fafc] hover:bg-slate-100/80 text-slate-600 font-medium border border-transparent'
            }`}
          >
            <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === 'whatsapp' ? 'text-[#2563eb]' : 'text-slate-400'}`} />
            <span className="font-sans">WhatsApp & Automation</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-sans transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-[#eff6ff] text-[#2563eb] font-bold border border-blue-100'
                : 'bg-[#f8fafc] hover:bg-slate-100/80 text-slate-600 font-medium border border-transparent'
            }`}
          >
            <Bell className={`w-4 h-4 shrink-0 ${activeTab === 'notifications' ? 'text-[#2563eb]' : 'text-slate-400'}`} />
            <span className="font-sans">Notifications & Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-sans transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#eff6ff] text-[#2563eb] font-bold border border-blue-100'
                : 'bg-[#f8fafc] hover:bg-slate-100/80 text-slate-600 font-medium border border-transparent'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === 'security' ? 'text-[#2563eb]' : 'text-slate-400'}`} />
            <span className="font-sans">Security & Permissions</span>
          </button>
        </div>

        {/* TAB PANELS CONTAINER */}
        <div className="lg:col-span-9 bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-xs font-sans space-y-6">
          
          {/* TAB 0: FIELDS SETTINGS */}
          {activeTab === 'fields' && (
            <FieldsSettingsView
              customFields={localCustomFields}
              onUpdateFields={handleCustomFieldsChange}
              onShowToast={onShowToast}
            />
          )}

          {/* TAB: PERMISSION TEMPLATES */}
          {activeTab === 'permissions' && (
            <PermissionsSettingsView
              permissionTemplates={localTemplates}
              onUpdateTemplates={handleTemplatesChange}
              agents={localAgents}
              onUpdateAgents={(updatedAgents) => {
                setLocalAgents(updatedAgents);
                if (onUpdateAgents) onUpdateAgents(updatedAgents);
              }}
              onShowToast={onShowToast}
            />
          )}

          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-lg md:text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>General Workspace Profile</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Company / Workspace Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompanyName(val);
                      if (onUpdateCompanyName) onUpdateCompanyName(val);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Support Email Address</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSupportEmail(val);
                      if (onUpdateSupportEmail) onUpdateSupportEmail(val);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Base Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCurrency(val);
                      if (onUpdateCurrency) onUpdateCurrency(val);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="INR">INR (₹ Indian Rupee)</option>
                    <option value="USD">USD ($ US Dollar)</option>
                    <option value="AED">AED (د.إ UAE Dirham)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="GBP">GBP (£ British Pound)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (GMT+5:30)</option>
                    <option value="Asia/Dubai (GMT+4:00)">Asia/Dubai (GMT+4:00)</option>
                    <option value="America/New_York (GMT-5:00)">America/New_York (GMT-5:00)</option>
                    <option value="Europe/London (GMT+0:00)">Europe/London (GMT+0:00)</option>
                  </select>
                </div>
              </div>

              {/* Working Hours & Days */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Telecaller Working Hours & Schedule</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Shift Start Time</label>
                    <input
                      type="time"
                      value={workingHoursStart}
                      onChange={(e) => setWorkingHoursStart(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Shift End Time</label>
                    <input
                      type="time"
                      value={workingHoursEnd}
                      onChange={(e) => setWorkingHoursEnd(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Active Working Days</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                      const isSel = workingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            isSel
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PIPELINE STAGES & COLORS */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg md:text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center space-x-2">
                    <Kanban className="w-5 h-5 text-indigo-600" />
                    <span>Pipeline Stages & Color Customization</span>
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleResetStagesToDefault}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset Stages</span>
                  </button>
                </div>
              </div>

              {/* VERTICAL PIPELINE STAGES CONTAINER MATCHING IMAGE 2 */}
              <div className="space-y-6">

                {/* 1. INITIAL STAGE SECTION (1 OPTION: FRESH, COLOR: BLUE) */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center space-x-2">
                    <div className="px-4 py-2 bg-slate-200/90 text-slate-800 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-2xs">
                      <span>Initial stage</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-wrap md:flex-nowrap items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                        Default Initial
                      </span>
                      <span className="text-sm font-bold text-slate-900">Fresh</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-500 font-medium">Stage Color:</span>
                      <ColorPickerDropdown
                        color={localStages.find(s => s.name === 'Fresh')?.color || '#3B82F6'}
                        onChange={(newColor) => {
                          const freshStage = localStages.find(s => s.name === 'Fresh');
                          if (freshStage) handleUpdateStageField(freshStage.id, 'color', newColor);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ACTIVE STAGE SECTION (CUSTOM TAGS & COLORS) */}
                <div className="bg-emerald-50/30 border border-emerald-200/60 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="px-4 py-2 bg-emerald-100/90 text-emerald-900 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-2xs">
                      <span>Active stage</span>
                      <ChevronRight className="w-4 h-4 text-emerald-600" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddStageModal(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Active Stage / Tag</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {localStages
                      .filter((s) => s.name !== 'Fresh' && s.name !== 'Converted' && s.name !== 'Lost')
                      .map((stage, idx) => (
                        <div
                          key={stage.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-wrap md:flex-nowrap items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-bold flex items-center justify-center border border-slate-200">
                              {idx + 1}
                            </span>
                            <div className="flex flex-col space-y-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveStage(idx, 'up')}
                                className="p-0.5 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === localStages.filter(s => s.name !== 'Fresh' && s.name !== 'Converted' && s.name !== 'Lost').length - 1}
                                onClick={() => handleMoveStage(idx, 'down')}
                                className="p-0.5 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex-1 min-w-[180px]">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Custom Tag / Stage Name
                            </label>
                            <input
                              type="text"
                              value={stage.name}
                              onChange={(e) => handleUpdateStageField(stage.id, 'name', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Custom Color Tag
                            </label>
                            <ColorPickerDropdown
                              color={stage.color}
                              onChange={(newColor) => handleUpdateStageField(stage.id, 'color', newColor)}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteStage(stage.id)}
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                            title="Delete Custom Active Stage"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 3. CLOSED / FINAL STAGE SECTION (CONVERTED [BLUE] & LOST [RED]) */}
                <div className="bg-emerald-50/20 border border-emerald-200/50 rounded-2xl p-4 space-y-4 shadow-2xs">
                  <div className="flex items-center space-x-2">
                    <div className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-2xs">
                      <span>Closed stage</span>
                      <ChevronRight className="w-4 h-4 text-emerald-200" />
                    </div>
                  </div>

                  {/* WON SUB-BLOCK (CONVERTED - BLUE) */}
                  <div className="bg-white rounded-xl border border-emerald-300 overflow-hidden shadow-2xs">
                    <div className="bg-emerald-100/80 px-3.5 py-2 border-b border-emerald-200 font-bold text-xs text-emerald-900 flex items-center justify-between">
                      <span>Won</span>
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase">Final Won Option</span>
                    </div>
                    <div className="p-3.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-900">Converted</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-slate-500 font-medium">Stage Color:</span>
                        <ColorPickerDropdown
                          color={localStages.find(s => s.name === 'Converted')?.color || '#2563EB'}
                          onChange={(newColor) => {
                            const convertedStage = localStages.find(s => s.name === 'Converted');
                            if (convertedStage) handleUpdateStageField(convertedStage.id, 'color', newColor);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* LOST SUB-BLOCK (LOST - RED & REASON MANAGEMENT) */}
                  <div className="bg-white rounded-xl border border-rose-300 overflow-hidden shadow-2xs">
                    <div className="bg-rose-100/80 px-3.5 py-2 border-b border-rose-200 font-bold text-xs text-rose-900 flex items-center justify-between">
                      <span>Lost</span>
                      <span className="text-[10px] font-semibold text-rose-700 uppercase">Final Lost Option</span>
                    </div>
                    <div className="p-3.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 border-b border-slate-100">
                      <span className="text-sm font-bold text-slate-900">Lost</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-slate-500 font-medium">Stage Color:</span>
                        <ColorPickerDropdown
                          color={localStages.find(s => s.name === 'Lost')?.color || '#EF4444'}
                          onChange={(newColor) => {
                            const lostStage = localStages.find(s => s.name === 'Lost');
                            if (lostStage) handleUpdateStageField(lostStage.id, 'color', newColor);
                          }}
                        />
                      </div>
                    </div>

                    {/* Reason for Lost Leads Sub-Section */}
                    <div className="p-3.5 bg-slate-50/60 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-slate-700">
                          Reason for Lost leads ({lostReasons.length}/25)
                        </span>

                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Add lost reason..."
                            value={newLostReasonInput}
                            onChange={(e) => setNewLostReasonInput(e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newLostReasonInput.trim()) {
                                setLostReasons((prev) => [...prev, newLostReasonInput.trim()]);
                                setNewLostReasonInput('');
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {lostReasons.map((reason, rIdx) => (
                          <div key={rIdx} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-800 shadow-2xs">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400 font-mono text-[10px]">#</span>
                              <span>{reason}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setLostReasons((prev) => prev.filter((_, i) => i !== rIdx))}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Remove Lost Reason"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ADD STAGE MODAL */}
              {showAddStageModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                        <Plus className="w-4 h-4 text-indigo-600" />
                        <span>Add New Pipeline Stage</span>
                      </h3>
                      <button
                        onClick={() => setShowAddStageModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Stage Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Under Negotiation, Site Visited"
                          value={newStageName}
                          onChange={(e) => setNewStageName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">Select Stage Color</label>
                        <ColorPickerDropdown
                          color={newStageColor}
                          onChange={setNewStageColor}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">Stage Type / Category</label>
                        <select
                          value={newStageCategory}
                          onChange={(e) => setNewStageCategory(e.target.value as any)}
                          className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#2563eb] cursor-pointer capitalize"
                        >
                          <option value="initial" disabled={localStages.some((s) => s.category === 'initial' || s.name === 'Fresh')}>
                            Initial {localStages.some((s) => s.category === 'initial' || s.name === 'Fresh') ? '(Max 1 Set)' : ''}
                          </option>
                          <option value="active">Active</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddStageModal(false)}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomStage}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                      >
                        Add Stage
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TELEPHONY & POWER DIALER */}
          {activeTab === 'telephony' && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-lg md:text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center space-x-2">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  <span>Telephony & Call Settings</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Default Phone Country Code</label>
                  <select
                    value={defaultCountryCode}
                    onChange={(e) => setDefaultCountryCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="+91">+91 (India)</option>
                    <option value="+1">+1 (USA / Canada)</option>
                    <option value="+44">+44 (United Kingdom)</option>
                    <option value="+971">+971 (United Arab Emirates)</option>
                    <option value="+61">+61 (Australia)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Power Dialer Interval (seconds between leads)</label>
                  <select
                    value={powerDialerDelay}
                    onChange={(e) => setPowerDialerDelay(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="3">3 seconds (Fast queue)</option>
                    <option value="5">5 seconds (Standard recommended)</option>
                    <option value="10">10 seconds (Paced call review)</option>
                    <option value="15">15 seconds (Detailed prep)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Speech-To-Text Language Model</label>
                  <select
                    value={sttLanguage}
                    onChange={(e) => setSttLanguage(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="en-IN">English (India - en-IN)</option>
                    <option value="hi-IN">Hindi (hi-IN)</option>
                    <option value="hinglish">Hinglish / Code-mixed (Recommended)</option>
                    <option value="en-US">English (US - en-US)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Auto-Record Outbound & Inbound Calls</p>
                    <p className="text-[11px] text-slate-500">Save call audio recordings to lead details timeline for quality assurance.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRecordCalls}
                    onChange={(e) => setAutoRecordCalls(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Auto-Advance to Next Lead after Disposition</p>
                    <p className="text-[11px] text-slate-500">Automatically dial next queue contact after logging disposition notes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoNextDial}
                    onChange={(e) => setAutoNextDial(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI & LEAD SCORING */}
          {activeTab === 'ai_scoring' && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-lg md:text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-amber-600" />
                  <span>Gemini AI & Predictive Lead Scoring</span>
                </h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">AI Scoring Model Sensitivity</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'conservative', label: 'Conservative', desc: 'Higher bar for Hot rating' },
                      { id: 'balanced', label: 'Balanced (Default)', desc: 'Optimal AI lead classification' },
                      { id: 'aggressive', label: 'Aggressive', desc: 'FLAGS more leads as Hot' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setAiSensitivity(m.id)}
                        className={`p-3 rounded-lg text-left border transition-all cursor-pointer ${
                          aiSensitivity === m.id
                            ? 'bg-amber-50 border-amber-400 text-amber-900 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-bold">{m.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700">Hot Lead Threshold Score</label>
                      <span className="text-xs font-bold text-amber-700 font-mono">Score &ge; {hotLeadThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="95"
                      value={hotLeadThreshold}
                      onChange={(e) => setHotLeadThreshold(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700">Warm Lead Threshold Score</label>
                      <span className="text-xs font-bold text-indigo-700 font-mono">Score {warmLeadThreshold} - {hotLeadThreshold - 1}</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="60"
                      value={warmLeadThreshold}
                      onChange={(e) => setWarmLeadThreshold(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-700">Call Transcript AI Summary Style</label>
                  <select
                    value={summaryFormat}
                    onChange={(e) => setSummaryFormat(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="bullets">Bullet Points & Next Action Items (Recommended)</option>
                    <option value="executive">Executive Paragraph Summary</option>
                    <option value="full">Full Verbatim Transcript + Sentiment Analysis</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 mt-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Auto-Assign Hot Leads to Senior Telecallers</p>
                    <p className="text-[11px] text-slate-500">Instantly route high-value hot leads to top-performing agents.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAssignHotLeads}
                    onChange={(e) => setAutoAssignHotLeads(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHATSAPP & AUTOMATION */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-lg md:text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Business API & Webhooks</span>
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">WhatsApp Business Sender Phone</label>
                    <input
                      type="text"
                      value={waSenderNumber}
                      onChange={(e) => setWaSenderNumber(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Webhook Retry Limit on Failure</label>
                    <select
                      value={webhookRetryCount}
                      onChange={(e) => setWebhookRetryCount(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="3">3 retries (Exponential backoff)</option>
                      <option value="5">5 retries (Recommended)</option>
                      <option value="10">10 retries (High reliability)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">New Lead WhatsApp Auto-Greeting Template</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500">Enable Auto-Send</span>
                      <input
                        type="checkbox"
                        checked={autoGreetingEnabled}
                        onChange={(e) => setAutoGreetingEnabled(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                      />
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    disabled={!autoGreetingEnabled}
                    className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 disabled:opacity-40"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">Available variables: {"{{name}}"}, {"{{company}}"}, {"{{source}}"}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS & ALERTS */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-lg md:text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <span>Notification Preferences & Real-time Alerts</span>
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Browser Desktop Push Notifications</p>
                    <p className="text-[11px] text-slate-500">Receive instant browser popups when a new lead is assigned to you.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={desktopPush}
                    onChange={(e) => setDesktopPush(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Hot Lead Audio Chime Alert</p>
                    <p className="text-[11px] text-slate-500">Play an audio notification chime when an inbound lead is rated Hot by AI.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hotLeadSoundAlert}
                    onChange={(e) => setHotLeadSoundAlert(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded cursor-pointer accent-amber-600"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Daily Telecaller Digest Email</p>
                    <p className="text-[11px] text-slate-500">Send evening email summary of call volume, connected calls & deals closed.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={dailyDigestEmail}
                    onChange={(e) => setDailyDigestEmail(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-700">Unassigned Lead Warning Alarm Timer</label>
                  <select
                    value={unassignedAlarmMinutes}
                    onChange={(e) => setUnassignedAlarmMinutes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="5">5 minutes (Ultra fast SLA)</option>
                    <option value="15">15 minutes (Standard SLA)</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY & PERMISSIONS */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-lg md:text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Security & Data Access Controls</span>
                </h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Lead Contact Export Permission Policy</label>
                  <select
                    value={exportPermission}
                    onChange={(e) => setExportPermission(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="admins_only">Admins Only (Restricted - Highest Security)</option>
                    <option value="managers_admins">Managers & Admins</option>
                    <option value="all">All Telecallers & Users</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Inactivity Session Timeout</label>
                  <select
                    value={sessionTimeoutHours}
                    onChange={(e) => setSessionTimeoutHours(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="1">1 hour inactivity</option>
                    <option value="4">4 hours inactivity</option>
                    <option value="8">8 hours (End of shift)</option>
                    <option value="24">24 hours</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200 mt-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Enforce Two-Factor Authentication (2FA)</p>
                    <p className="text-[11px] text-slate-500">Require mobile OTP / Authenticator app code for team login.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforceTwoFactor}
                    onChange={(e) => setEnforceTwoFactor(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAYMENTS & LICENSES (BUY LICENSES & BILLING) */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              {/* Header Title Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2 font-sans">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>Buy Licenses</span>
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-normal font-noto">
                    Manage your billing, active subscription licenses & payment transaction history
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-[10px] font-noto">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium text-slate-700">GST Invoice Ready • 256-Bit Encrypted</span>
                </div>
              </div>

              {/* Main Grid: Left Column (Licenses & Services), Right Column (Billing Details & Cart) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* LEFT COLUMN: Licenses & Other Services */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Licenses Box */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="text-[10px] font-bold text-slate-500 font-noto uppercase tracking-wider">
                        Licenses
                      </h3>

                      {/* Quarterly / Annual Switcher */}
                      <div className="bg-slate-100 p-0.5 rounded-lg flex items-center space-x-1 text-[10px] font-medium text-slate-600 font-noto">
                        <button
                          onClick={() => setBillingPeriod('Quarterly')}
                          className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                            billingPeriod === 'Quarterly' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                          }`}
                        >
                          Quarterly
                        </button>
                        <button
                          onClick={() => setBillingPeriod('Annual')}
                          className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer flex items-center space-x-1 ${
                            billingPeriod === 'Annual' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                          }`}
                        >
                          <span>Annual</span>
                          <span className="text-[8px] font-noto px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                            Save 20%
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* License Card 1 */}
                    <div className="border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-300 transition-all bg-slate-50/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 font-noto">
                          <h4 className="text-xs font-bold text-slate-900">Core CRM (A)</h4>
                          <p className="text-xs font-extrabold text-slate-900">
                            {billingPeriod === 'Annual' ? '₹9,588.00' : '₹2,899.00'}
                            <span className="text-[9px] font-normal text-slate-500 ml-1">
                              / {billingPeriod === 'Annual' ? 'year' : 'quarter'}
                            </span>
                          </p>
                          <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Expiry Date: 13 Aug 2027</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart({
                          id: 'lic-core',
                          title: `Core CRM (${billingPeriod})`,
                          price: billingPeriod === 'Annual' ? 9588 : 2899,
                          category: 'license'
                        })}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-noto transition-all cursor-pointer shadow-2xs self-start sm:self-center ${
                          cartItems.some(i => i.id === 'lic-core')
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-white border border-purple-600 text-purple-700 hover:bg-purple-600 hover:text-white'
                        }`}
                      >
                        {cartItems.some(i => i.id === 'lic-core') ? 'In Cart ✓' : 'Add'}
                      </button>
                    </div>

                    {/* License Card 2 */}
                    <div className="border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-300 transition-all bg-slate-50/50">
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
                            <MessageSquare className="w-2.5 h-2.5" />
                          </div>
                        </div>

                        <div className="space-y-0.5 font-noto">
                          <h4 className="text-xs font-bold text-slate-900">Core CRM + WhatsApp Chat Sync (A)</h4>
                          <p className="text-xs font-extrabold text-slate-900">
                            {billingPeriod === 'Annual' ? '₹11,988.00' : '₹3,499.00'}
                            <span className="text-[9px] font-normal text-slate-500 ml-1">
                              / {billingPeriod === 'Annual' ? 'year' : 'quarter'}
                            </span>
                          </p>
                          <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Expiry Date: 13 Aug 2027</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart({
                          id: 'lic-wa-sync',
                          title: `Core CRM + WhatsApp Chat Sync (${billingPeriod})`,
                          price: billingPeriod === 'Annual' ? 11988 : 3499,
                          category: 'license'
                        })}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-noto transition-all cursor-pointer shadow-2xs self-start sm:self-center ${
                          cartItems.some(i => i.id === 'lic-wa-sync')
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-white border border-purple-600 text-purple-700 hover:bg-purple-600 hover:text-white'
                        }`}
                      >
                        {cartItems.some(i => i.id === 'lic-wa-sync') ? 'In Cart ✓' : 'Add'}
                      </button>
                    </div>
                  </div>

                  {/* Other Services Section */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-500 font-noto uppercase tracking-wider border-b border-slate-100 pb-2">
                      Other Services
                    </h3>

                    {/* Service 1 */}
                    <div className="border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-300 transition-all bg-slate-50/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 font-noto">
                          <h4 className="text-xs font-bold text-slate-900">Whatsapp Cloud API Setup Charges</h4>
                          <p className="text-xs font-extrabold text-slate-900">₹1,694.00</p>
                          <p className="text-[10px] text-slate-500">One-time Meta API verification & green badge assistance</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart({
                          id: 'srv-wa-api',
                          title: 'Whatsapp Cloud API Setup',
                          price: 1694,
                          category: 'service'
                        })}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-noto transition-all cursor-pointer shadow-2xs self-start sm:self-center ${
                          cartItems.some(i => i.id === 'srv-wa-api')
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-white border border-purple-600 text-purple-700 hover:bg-purple-600 hover:text-white'
                        }`}
                      >
                        {cartItems.some(i => i.id === 'srv-wa-api') ? 'In Cart ✓' : 'Add'}
                      </button>
                    </div>

                    {/* Service 2 */}
                    <div className="border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-300 transition-all bg-slate-50/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 font-noto">
                          <h4 className="text-xs font-bold text-slate-900">Automation Consultancy</h4>
                          <p className="text-xs font-extrabold text-slate-900">₹4,999.00</p>
                          <p className="text-[10px] text-slate-500">Dedicated engineer for custom CRM & API webhooks setup</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart({
                          id: 'srv-consulting',
                          title: 'Automation Consultancy',
                          price: 4999,
                          category: 'service'
                        })}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-noto transition-all cursor-pointer shadow-2xs self-start sm:self-center ${
                          cartItems.some(i => i.id === 'srv-consulting')
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-white border border-purple-600 text-purple-700 hover:bg-purple-600 hover:text-white'
                        }`}
                      >
                        {cartItems.some(i => i.id === 'srv-consulting') ? 'In Cart ✓' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Billing Details Box & Cart */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Billing Details Box */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2.5">
                    <h3 className="text-[10px] font-bold text-slate-500 font-noto uppercase tracking-wider">
                      Billing Details
                    </h3>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 font-noto">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-extrabold text-slate-900 uppercase tracking-tight">
                            {billingOrg}
                          </p>
                          <p className="text-[9px] text-slate-500">({billingEmail})</p>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[9px] font-semibold text-purple-600 shrink-0">
                          <button onClick={() => setShowEditBillingModal(true)} className="hover:underline cursor-pointer">
                            Edit
                          </button>
                          <span>|</span>
                          <button onClick={() => alert(`GSTIN: ${billingGstin}\nAddress: ${billingAddress}`)} className="hover:underline cursor-pointer">
                            View
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-200 flex items-center justify-between">
                        <span>GSTIN: {billingGstin}</span>
                        <span className="text-emerald-700 font-bold">18% Input Tax Credit</span>
                      </div>
                    </div>
                  </div>

                  {/* Shopping Cart Box */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-500 font-noto uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                      <span>Order Summary / Cart</span>
                      {cartItems.length > 0 && (
                        <span className="text-purple-600 font-bold">{cartItems.length} items</span>
                      )}
                    </h3>

                    {cartItems.length === 0 ? (
                      /* Empty Cart View */
                      <div className="py-8 text-center space-y-2 font-noto">
                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                          <ShoppingCart className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900">No items in cart!</p>
                          <p className="text-[10px] text-slate-400">Add items to proceed to checkout.</p>
                        </div>
                      </div>
                    ) : (
                      /* Cart Items List & Total Calculation */
                      <div className="space-y-3 font-noto">
                        <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {cartItems.map((item) => (
                            <div key={item.id} className="py-2 flex items-center justify-between">
                              <div className="space-y-0.5 min-w-0 pr-2">
                                <p className="text-[10px] font-bold text-slate-900 truncate">{item.title}</p>
                                <p className="text-[9px] text-purple-700 font-semibold">
                                  ₹{item.price.toLocaleString('en-IN')} x {item.qty}
                                </p>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  onClick={() => handleUpdateQty(item.id, -1)}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="text-[10px] font-bold px-1">{item.qty}</span>
                                <button
                                  onClick={() => handleUpdateQty(item.id, 1)}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Promo Code Input */}
                        <div className="flex space-x-1.5 pt-1.5 border-t border-slate-100">
                          <input
                            type="text"
                            placeholder="Promo code (TELECRM20)"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-noto uppercase focus:outline-none focus:border-purple-600"
                          />
                          <button
                            onClick={handleApplyPromo}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg cursor-pointer font-noto"
                          >
                            Apply
                          </button>
                        </div>

                        {/* Calculation Summary */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5 text-[10px] font-noto">
                          <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span>₹{getCartSubtotal().toLocaleString('en-IN')}</span>
                          </div>

                          {promoApplied && (
                            <div className="flex justify-between text-emerald-600 font-bold">
                              <span>Discount (20% Off)</span>
                              <span>-₹{(getCartSubtotal() * 0.2).toLocaleString('en-IN')}</span>
                            </div>
                          )}

                          <div className="flex justify-between text-slate-600">
                            <span>GST (18%)</span>
                            <span>₹{getCartGst().toLocaleString('en-IN')}</span>
                          </div>

                          <div className="flex justify-between text-slate-900 font-extrabold text-[11px] pt-1.5 border-t border-slate-200">
                            <span>Grand Total</span>
                            <span className="text-purple-700">₹{getCartGrandTotal().toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Checkout Button */}
                        <button
                          onClick={() => setShowCheckoutModal(true)}
                          className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] transition-all shadow-2xs cursor-pointer flex items-center justify-center space-x-1.5 font-noto"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Proceed to Checkout (₹{getCartGrandTotal().toLocaleString('en-IN')})</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Transaction History & Invoices */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 pt-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-2 font-sans">
                    <Receipt className="w-3.5 h-3.5 text-purple-600" />
                    <span>Past Payment Transactions & Invoices</span>
                  </h3>

                  <span className="text-[9px] text-slate-500 font-noto">
                    {transactions.length} Receipts Found
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] font-noto">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[8px] tracking-wider">
                        <th className="py-2 px-2.5">Transaction ID</th>
                        <th className="py-2 px-2.5">Date</th>
                        <th className="py-2 px-2.5">Service / License</th>
                        <th className="py-2 px-2.5">Amount</th>
                        <th className="py-2 px-2.5">Payment Method</th>
                        <th className="py-2 px-2.5">Status</th>
                        <th className="py-2 px-2.5 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-2.5 font-bold text-slate-900">{txn.id}</td>
                          <td className="py-2 px-2.5 text-slate-600">{txn.date}</td>
                          <td className="py-2 px-2.5 font-bold text-purple-900">{txn.item}</td>
                          <td className="py-2 px-2.5 font-extrabold text-slate-900">
                            ₹{txn.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2.5 text-slate-600 text-[9px]">{txn.paymentMethod}</td>
                          <td className="py-2 px-2.5">
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[8px]">
                              {txn.status}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-right">
                            <button
                              onClick={() => handleDownloadInvoice(txn)}
                              className="p-1 rounded border border-slate-200 hover:bg-slate-100 text-purple-600 transition-colors cursor-pointer inline-flex items-center space-x-1"
                              title="Download Tax Invoice PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span className="text-[8px] font-bold">PDF</span>
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

        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-noto">
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-4 space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 font-sans">Razorpay Payment Checkout</h3>
                  <p className="text-[10px] text-slate-500 font-noto">Total Payable: ₹{getCartGrandTotal().toLocaleString('en-IN')}</p>
                </div>
              </div>

              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-semibold text-slate-700">Select Payment Method</label>
              
              <div className="space-y-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('upi')}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedPaymentMethod === 'upi'
                      ? 'border-purple-600 bg-purple-50/50 text-purple-950 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">UPI</span>
                    <span>Google Pay / PhonePe / BHIM</span>
                  </div>
                  {selectedPaymentMethod === 'upi' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedPaymentMethod === 'card'
                      ? 'border-purple-600 bg-purple-50/50 text-purple-950 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    <span>Credit / Debit Card (Visa, Mastercard)</span>
                  </div>
                  {selectedPaymentMethod === 'card' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('netbanking')}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedPaymentMethod === 'netbanking'
                      ? 'border-purple-600 bg-purple-50/50 text-purple-950 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Netbanking (HDFC, ICICI, SBI, Axis)</span>
                  </div>
                  {selectedPaymentMethod === 'netbanking' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                </button>
              </div>

              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-800">GST Invoice Details</p>
                <p>Tax Invoice will be sent directly to <strong>{billingEmail}</strong> upon confirmation.</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompletePayment}
                disabled={isProcessingPayment}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>Pay ₹{getCartGrandTotal().toLocaleString('en-IN')} Now</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BILLING DETAILS MODAL */}
      {showEditBillingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-noto">
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-4 space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 font-sans">Edit Billing Details & GSTIN</h3>
              <button onClick={() => setShowEditBillingModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-[10px]">
              <div className="space-y-0.5">
                <label className="font-semibold text-slate-700">Company / Organization Name</label>
                <input
                  type="text"
                  value={billingOrg}
                  onChange={(e) => setBillingOrg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-0.5">
                <label className="font-semibold text-slate-700">Billing Email</label>
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-0.5">
                <label className="font-semibold text-slate-700">GSTIN Number</label>
                <input
                  type="text"
                  value={billingGstin}
                  onChange={(e) => setBillingGstin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-noto uppercase text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-0.5">
                <label className="font-semibold text-slate-700">Registered Business Address</label>
                <textarea
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowEditBillingModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowEditBillingModal(false);
                  if (onShowToast) onShowToast('Billing details updated successfully!');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SUCCESS MODAL */}
      {paymentSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-noto">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xs w-full p-4 text-center space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900 font-sans">Payment Completed!</h3>
              <p className="text-[10px] text-slate-500">Transaction ID: {lastPaidTxnId}</p>
            </div>

            <p className="text-[10px] text-slate-600">
              Your license extension and services have been activated. Tax invoice has been generated.
            </p>

            <button
              onClick={() => setPaymentSuccessModal(false)}
              className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold transition-all cursor-pointer font-noto"
            >
              Close & View Invoices
            </button>
          </div>
        </div>
      )}

      {/* ADD ASSIGNEE MODAL */}
      {showAddAssigneeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-noto">
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-4 space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 font-sans">Add New Team Assignee</h3>
                  <p className="text-[10px] text-slate-500">Create member for lead assignment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAssigneeModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAddAssignee} className="space-y-2.5 text-[10px]">
              {/* Assignee Profile Picture Slot */}
              <div className="space-y-1 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                <label className="font-semibold text-slate-700 block">Assignee Profile Picture *</label>
                <div className="flex items-center space-x-3 pt-0.5">
                  <img
                    src={newAssigneeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt="Preview"
                    className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500 shadow-2xs shrink-0 bg-slate-100"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <label className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] cursor-pointer inline-flex items-center space-x-1 shadow-2xs transition-all">
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[9px] text-slate-400">or paste link below</span>
                    </div>

                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={newAssigneeAvatar}
                      onChange={(e) => setNewAssigneeAvatar(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-mono text-slate-900 focus:outline-none focus:border-indigo-600 text-[10px]"
                    />
                  </div>
                </div>

                {/* Preset Avatars Bar */}
                <div className="flex items-center space-x-1.5 pt-1 overflow-x-auto">
                  <span className="text-[9px] font-semibold text-slate-400 shrink-0">Presets:</span>
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
                  ].map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewAssigneeAvatar(presetUrl)}
                      className={`w-5 h-5 rounded-full overflow-hidden border shrink-0 transition-transform cursor-pointer ${
                        newAssigneeAvatar === presetUrl ? 'ring-2 ring-indigo-600 scale-110 border-indigo-600' : 'border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={presetUrl} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={newAssigneeName}
                  onChange={(e) => setNewAssigneeName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 text-[11px]"
                />
              </div>

              <div className="space-y-0.5">
                <label className="font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="vikram@company.com"
                  value={newAssigneeEmail}
                  onChange={(e) => setNewAssigneeEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 text-[11px]"
                />
              </div>

              <div className="space-y-0.5">
                <label className="font-semibold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newAssigneePhone}
                  onChange={(e) => setNewAssigneePhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="font-semibold text-slate-700">Role</label>
                  <select
                    value={newAssigneeRole}
                    onChange={(e) => setNewAssigneeRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 text-[10px]"
                  >
                    <option value="Telecaller">Telecaller</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="font-semibold text-slate-700">Initial Status</label>
                  <select
                    value={newAssigneeStatus}
                    onChange={(e) => setNewAssigneeStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 text-[10px]"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAssigneeModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold cursor-pointer"
                >
                  Save Assignee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
