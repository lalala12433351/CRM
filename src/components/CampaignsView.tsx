import React, { useState, useEffect, useMemo, useContext } from 'react';
import { 
  Megaphone, 
  Phone, 
  PhoneCall, 
  Star, 
  Bell, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Mail, 
  MessageSquare, 
  Send, 
  FileText, 
  Sparkles, 
  CheckSquare, 
  Calendar, 
  MapPin, 
  User, 
  Search, 
  Plus, 
  X, 
  Filter, 
  Share2, 
  AtSign,
  ArrowRight,
  ExternalLink,
  Info,
  Copy,
  Eye,
  Check,
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Layers,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Lead, Agent, LeadStatus, ActivityLog } from '../types';
import { StatusBadge } from './StatusBadge';
import { getStatusStyle, getStatusBadgeClasses } from '../utils/statusStyles';
import { StagesContext } from '../App';

interface CampaignsViewProps {
  leads: Lead[];
  agents: Agent[];
  initialCampaignHandle?: string;
  onOpenLeadDetail?: (lead: Lead) => void;
  onUpdateLead?: (lead: Lead) => void;
}

interface CampaignDef {
  id: string;
  handle: string;
  name: string;
  totalLeads: number;
  newLeads: number;
  progress: number;
  members: string[];
  errors: number;
}

const CAMPAIGNS_LIST: CampaignDef[] = [
  { id: 'camp-1', handle: '@master-form-iata-cargo', name: 'Master Form IATA Cargo', totalLeads: 178, newLeads: 178, progress: 0, members: ['MU', 'AR', 'RM', 'US', 'DR', 'PK'], errors: 5 },
  { id: 'camp-2', handle: '@master-form', name: 'Master Form', totalLeads: 1108, newLeads: 400, progress: 40, members: ['MU', 'AR', 'RM', 'US'], errors: 3 },
  { id: 'camp-3', handle: '@master-form-karnataka-vendor-data', name: 'Master Form-Karnataka-Vendor-data', totalLeads: 325, newLeads: 42, progress: 50, members: ['MU', 'DR'], errors: 0 },
  { id: 'camp-4', handle: '@vendor-data-kerala', name: 'Vendor-Data-Kerala', totalLeads: 310, newLeads: 110, progress: 20, members: ['RM', 'US', 'PK'], errors: 1 },
  { id: 'camp-5', handle: '@iata-meta-01', name: 'IATA Meta 01', totalLeads: 120, newLeads: 15, progress: 85, members: ['MU', 'AR'], errors: 0 },
  { id: 'camp-6', handle: '@master-form-kerala-vendor-data', name: 'Master Form-Kerala-Vendor-Data', totalLeads: 140, newLeads: 88, progress: 35, members: ['AR', 'RM', 'US'], errors: 2 },
  { id: 'camp-7', handle: '@master-form-iata', name: 'Master Form IATA', totalLeads: 492, newLeads: 150, progress: 65, members: ['RM', 'US', 'PK'], errors: 0 },
  { id: 'camp-8', handle: '@master-form-iata-cargo-v2', name: 'Master Form-IATA-Cargo-V2', totalLeads: 84, newLeads: 20, progress: 15, members: ['US', 'DR'], errors: 0 }
];

const INITIAL_CAMPAIGN_LEADS: Lead[] = [
  {
    id: 'camp-lead-rr-1',
    name: 'aananyyyyy',
    phone: '918075823263',
    email: 'aananyyyyy@gmail.com',
    company: 'Individual',
    city: 'Kozhikode',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Warm',
    pipelineStageId: 'stage-2',
    dealValue: 120000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '1d (11:59 AM Fri, 14 Aug 26)',
    updatedAt: '1d ago',
    aiScore: 82,
    aiRating: 'Warm',
    aiReasoning: 'Interested in aviation logistics',
    customFields: {},
    tags: ['Warm'],
    notes: 'Follow-up scheduled for next week.',
  },
  {
    id: 'camp-lead-rr-2',
    name: 'Shaiju ഗാനം',
    phone: '918089486567',
    email: 'shaijuganam@gmail.com',
    company: 'Individual',
    city: 'Malappuram',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Lost',
    pipelineStageId: 'stage-3',
    dealValue: 90000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '23s 18d ago CONNECTED',
    updatedAt: '18d ago',
    aiScore: 25,
    aiRating: 'Cold',
    aiReasoning: 'Selected alternative program',
    customFields: {},
    tags: ['Lost'],
    notes: 'Call connected for 23s. Lead opted out.',
  },
  {
    id: 'camp-lead-rr-3',
    name: 'Veipei Abdurahman',
    phone: '918139071928',
    email: 'veipei@gmail.com',
    company: 'Individual',
    city: 'Manjeri',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Lost',
    pipelineStageId: 'stage-3',
    dealValue: 85000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '19d ago',
    updatedAt: '19d ago',
    aiScore: 20,
    aiRating: 'Cold',
    aiReasoning: 'High course fees',
    customFields: {},
    tags: ['Lost'],
    notes: 'Location and fee mismatch.',
  },
  {
    id: 'camp-lead-rr-4',
    name: 'Iswarananda Sivananda Asramam',
    phone: '919496190523',
    email: 'iswarananda@gmail.com',
    company: 'Individual',
    city: 'Thrissur',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Lost',
    pipelineStageId: 'stage-3',
    dealValue: 95000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '20d ago',
    updatedAt: '20d ago',
    aiScore: 15,
    aiRating: 'Cold',
    aiReasoning: 'Joined another institute',
    customFields: {},
    tags: ['Lost'],
    notes: 'Already enrolled elsewhere.',
  },
  {
    id: 'camp-lead-rr-5',
    name: 'Chandran Kaiveli',
    phone: '919744380332',
    email: 'chandrankaiveli@gmail.com',
    company: 'Individual',
    city: 'Kannur',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Lost',
    pipelineStageId: 'stage-3',
    dealValue: 90000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '21d ago',
    updatedAt: '21d ago',
    aiScore: 22,
    aiRating: 'Cold',
    aiReasoning: 'Not answering calls',
    customFields: {},
    tags: ['Lost'],
    notes: 'Candidate relocation constraint.',
  },
  {
    id: 'camp-lead-rr-6',
    name: 'Lince Linz',
    phone: '919745201344',
    email: 'lincelinz@gmail.com',
    company: 'Individual',
    city: 'Ernakulam',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'RNR',
    pipelineStageId: 'stage-1',
    dealValue: 105000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '22d ago',
    updatedAt: '22d ago',
    aiScore: 40,
    aiRating: 'Cold',
    aiReasoning: 'Ringing no response',
    customFields: {},
    tags: ['RNR'],
    notes: 'Rang 4 times, no answer.',
  },
  {
    id: 'camp-lead-rr-7',
    name: 'Michealthomas',
    phone: '918594081939',
    email: 'michealthomas@gmail.com',
    company: 'Individual',
    city: 'Kottayam',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Lost',
    pipelineStageId: 'stage-3',
    dealValue: 90000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '23d ago',
    updatedAt: '23d ago',
    aiScore: 18,
    aiRating: 'Cold',
    aiReasoning: 'Budget constraint',
    customFields: {},
    tags: ['Lost'],
    notes: 'Course fee exceeds budget.',
  },
  {
    id: 'camp-lead-rr-8',
    name: 'Shinijith Kayyach',
    phone: '919847332110',
    email: 'shinijith@gmail.com',
    company: 'Individual',
    city: 'Calicut',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Lost',
    pipelineStageId: 'stage-3',
    dealValue: 95000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '24d ago',
    updatedAt: '24d ago',
    aiScore: 20,
    aiRating: 'Cold',
    aiReasoning: 'Not interested in aviation',
    customFields: {},
    tags: ['Lost'],
    notes: 'Requested removal from calling list.',
  },
  {
    id: 'camp-lead-rr-9',
    name: 'Ashraf K',
    phone: '919446112233',
    email: 'ashraf.k@gmail.com',
    company: 'Individual',
    city: 'Palakkad',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Contacted',
    pipelineStageId: 'stage-2',
    dealValue: 115000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '25d ago',
    updatedAt: '25d ago',
    aiScore: 68,
    aiRating: 'Warm',
    aiReasoning: 'Reviewing syllabus brochure',
    customFields: {},
    tags: ['Contacted'],
    notes: 'Requested course syllabus PDF.',
  },
  {
    id: 'camp-lead-rr-10',
    name: 'Muhammed Bilal',
    phone: '919744556677',
    email: 'bilal.m@gmail.com',
    company: 'Individual',
    city: 'Kasaragod',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Interested',
    pipelineStageId: 'stage-2',
    dealValue: 125000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '26d ago',
    updatedAt: '26d ago',
    aiScore: 85,
    aiRating: 'Hot',
    aiReasoning: 'Ready for admission counseling',
    customFields: {},
    tags: ['Interested'],
    notes: 'Counseling scheduled.',
  },
  {
    id: 'camp-lead-rr-11',
    name: 'Vasu Devareddy',
    phone: '917702190999',
    email: 'vasu.devareddy@gmail.com',
    company: 'Individual',
    city: 'Hyderabad',
    state: 'Telangana',
    source: 'Facebook-Meta-01',
    status: 'Fresh',
    pipelineStageId: 'stage-1',
    dealValue: 110000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '27d ago',
    updatedAt: 'Just Now',
    aiScore: 78,
    aiRating: 'Warm',
    aiReasoning: 'Interested in cargo logistics career transition',
    customFields: {},
    tags: ['Fresh'],
    notes: 'Called from ad campaign.',
  },
  {
    id: 'camp-lead-1',
    name: 'suprith Gowd',
    phone: '918884992069',
    email: 'Suprithg2527@gmail.com',
    company: 'Kite Institute of Aviation',
    city: 'Bengaluru',
    state: 'Karnataka',
    source: 'Facebook-Meta-01',
    status: 'Fresh',
    pipelineStageId: 'stage-1',
    dealValue: 120000,
    ownerAgentId: 'agent-1',
    ownerAgentName: 'Ummema Sufiya BM',
    createdAt: '5h ago',
    updatedAt: 'Just Now',
    aiScore: 92,
    aiRating: 'Hot',
    aiReasoning: 'Fresh inquiry for aviation cargo training batch 2026',
    customFields: { Batch: 'Empty', DateOfJoining: 'Empty', Age: 'Empty' },
    tags: ['IATACargo', 'Fresh'],
    notes: 'Inquired about course fees and batch dates.',
  },
  {
    id: 'camp-lead-2',
    name: 'mpg manaayil',
    phone: '919037276846',
    email: 'mpgmanaayil@gmail.com',
    company: 'Individual',
    city: 'Malappuram',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Fresh',
    pipelineStageId: 'stage-1',
    dealValue: 95000,
    ownerAgentId: 'agent-2',
    ownerAgentName: 'Farzana',
    createdAt: '6h ago',
    updatedAt: 'Just Now',
    aiScore: 85,
    aiRating: 'Hot',
    aiReasoning: 'Requested brochure',
    customFields: {},
    tags: ['Fresh'],
    notes: 'Fresh inquiry from Meta ads.',
  },
  {
    id: 'camp-lead-3',
    name: 'Vasu Devareddy',
    phone: '917702190999',
    email: 'vasu.devareddy@gmail.com',
    company: 'Individual',
    city: 'Hyderabad',
    state: 'Telangana',
    source: 'Facebook-Meta-01',
    status: 'Fresh',
    pipelineStageId: 'stage-1',
    dealValue: 110000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '8h ago',
    updatedAt: 'Just Now',
    aiScore: 78,
    aiRating: 'Warm',
    aiReasoning: 'Interested in cargo logistics career transition',
    customFields: {},
    tags: ['Fresh'],
    notes: 'Called from ad campaign.',
  },
  {
    id: 'camp-lead-4',
    name: 'Jenin Jose',
    phone: '918137082548',
    email: 'jeninjose@yahoo.com',
    company: 'Individual',
    city: 'Kochi',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Fresh',
    pipelineStageId: 'stage-1',
    dealValue: 130000,
    ownerAgentId: 'agent-4',
    ownerAgentName: 'philemon',
    createdAt: '12h ago',
    updatedAt: '12h ago',
    aiScore: 88,
    aiRating: 'Hot',
    aiReasoning: 'Aviation certification seeker',
    customFields: {},
    tags: ['Fresh'],
    notes: 'Wants admission details.',
  },
  {
    id: 'camp-lead-5',
    name: 'Amal krishna',
    phone: '919072296009',
    email: 'amal.krishna@gmail.com',
    company: 'Individual',
    city: 'Kollam',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Open',
    pipelineStageId: 'stage-1',
    dealValue: 100000,
    ownerAgentId: 'agent-5',
    ownerAgentName: 'Radhika M R',
    createdAt: '1d (12:31 PM Fri, 14 Aug 26)',
    updatedAt: '1d ago',
    aiScore: 74,
    aiRating: 'Warm',
    aiReasoning: 'Follow up on course brochure and syllabus',
    customFields: {},
    tags: ['Aviation'],
    notes: 'WhatsApp brochure delivered.',
  },
  {
    id: 'camp-lead-6',
    name: 'Anuu',
    phone: '919036501419',
    email: 'anuu.aviation@gmail.com',
    company: 'Individual',
    city: 'Bengaluru',
    state: 'Karnataka',
    source: 'Facebook-Meta-01',
    status: 'Warm',
    pipelineStageId: 'stage-2',
    dealValue: 140000,
    ownerAgentId: 'agent-1',
    ownerAgentName: 'Ummema Sufiya BM',
    createdAt: '1d ago',
    updatedAt: '1d ago',
    aiScore: 82,
    aiRating: 'Warm',
    aiReasoning: 'Requested campus counseling session',
    customFields: {},
    tags: ['Warm', 'VisitRequested'],
    notes: 'Wants to schedule a campus visit next week.',
  },
  {
    id: 'camp-lead-7',
    name: 'Sahad Ayyoob Ayyoob',
    phone: '919061972674',
    email: 'sahad.ayyoob@gmail.com',
    company: 'Individual',
    city: 'Calicut',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Lost',
    pipelineStageId: 'stage-3',
    dealValue: 90000,
    ownerAgentId: 'agent-6',
    ownerAgentName: 'Ashly James',
    createdAt: '1d (11:59 AM Fri, 14 Aug 26)',
    updatedAt: '1d ago',
    aiScore: 20,
    aiRating: 'Cold',
    aiReasoning: 'Selected local university degree program instead',
    customFields: {},
    tags: ['Lost'],
    notes: 'Joined another university program.',
  },
  {
    id: 'camp-lead-8',
    name: 'Adv Allen',
    phone: '919961111871',
    email: 'allen.adv@gmail.com',
    company: 'Individual',
    city: 'Trivandrum',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Interested',
    pipelineStageId: 'stage-2',
    dealValue: 125000,
    ownerAgentId: 'agent-7',
    ownerAgentName: 'Munavvir',
    createdAt: '2d ago',
    updatedAt: '1d ago',
    aiScore: 89,
    aiRating: 'Hot',
    aiReasoning: 'High intent for IATA Cargo batch registration',
    customFields: {},
    tags: ['Interested'],
    notes: 'Discussed seat booking fee and discount structure.',
  },
  {
    id: 'camp-lead-9',
    name: 'Alexander Gheevarghese',
    phone: '918590096589',
    email: 'alexvarghese619@gmail.com',
    company: 'Kite Institute of Aviation',
    city: 'Punalur',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Fresh',
    pipelineStageId: 'stage-1',
    dealValue: 120000,
    ownerAgentId: 'agent-1',
    ownerAgentName: 'Ummema Sufiya BM',
    createdAt: '19h ago',
    updatedAt: 'Just Now',
    aiScore: 92,
    aiRating: 'Hot',
    aiReasoning: 'Fresh inquiry for IATA Cargo batch 2026',
    customFields: { Batch: 'Empty', DateOfJoining: 'Empty', Age: 'Empty' },
    tags: ['IATACargo', 'Fresh'],
    notes: 'Inquired about course fees and batch dates.',
  },
  {
    id: 'camp-lead-10',
    name: 'Mohammed Rishad',
    phone: '919847120394',
    email: 'rishad.m@gmail.com',
    company: 'Individual',
    city: 'Kozhikode',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Contacted',
    pipelineStageId: 'stage-2',
    dealValue: 110000,
    ownerAgentId: 'agent-4',
    ownerAgentName: 'Divya Rameshan',
    createdAt: '2d ago',
    updatedAt: '1d ago',
    aiScore: 65,
    aiRating: 'Warm',
    aiReasoning: 'Follow-up requested after salary day',
    customFields: {},
    tags: ['Followup'],
    notes: 'Call back on 15th.',
  },
  {
    id: 'camp-lead-11',
    name: 'Shilpa Nair',
    phone: '919400281930',
    email: 'shilpa.nair@hotmail.com',
    company: 'Individual',
    city: 'Kottayam',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'RNR',
    pipelineStageId: 'stage-1',
    dealValue: 90000,
    ownerAgentId: 'agent-5',
    ownerAgentName: 'philemon',
    createdAt: '2d ago',
    updatedAt: '2d ago',
    aiScore: 40,
    aiRating: 'Cold',
    aiReasoning: 'Ring no response 3 times',
    customFields: {},
    tags: ['RNR'],
    notes: 'Tried calling 3 times, no answer.',
  },
  {
    id: 'camp-lead-12',
    name: 'Firoz Khan',
    phone: '919747881920',
    email: 'firozkhan@gmail.com',
    company: 'Individual',
    city: 'Palakkad',
    state: 'Kerala',
    source: 'Facebook-Meta-01',
    status: 'Converted',
    pipelineStageId: 'stage-4',
    dealValue: 130000,
    ownerAgentId: 'agent-3',
    ownerAgentName: 'Risvana Rahim',
    createdAt: '3d ago',
    updatedAt: 'Just Now',
    aiScore: 98,
    aiRating: 'Hot',
    aiReasoning: 'Paid registration token advance',
    customFields: {},
    tags: ['Converted', 'AdvancePaid'],
    notes: 'Registration advance fee received via UPI.',
  }
];

const CAMPAIGN_ASSIGNEES = [
  { name: 'Akhitha Rameshan', percentage: 50.6, color: '#9BD3BA' },
  { name: 'Ummema Sufiya BM', percentage: 11.2, color: '#70C0FA' },
  { name: 'Radhika M R', percentage: 10.1, color: '#F8CF48' },
  { name: 'Farzana', percentage: 9.0, color: '#66CFBA' },
  { name: 'Risvana Rahim', percentage: 6.2, color: '#B08246' },
  { name: 'philemon', percentage: 6.2, color: '#8993DC' },
  { name: 'Munavvir', percentage: 2.8, color: '#4CD4E8' },
  { name: 'Harish', percentage: 1.7, color: '#8FE0B9' },
  { name: 'Ashly James', percentage: 1.1, color: '#F36565' },
  { name: 'Madhava sai nagendra', percentage: 1.1, color: '#A0E236' },
];

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  leads: propsLeads,
  agents,
  initialCampaignHandle,
  onOpenLeadDetail,
  onUpdateLead
}) => {
  const stages = useContext(StagesContext);
  // Campaign Selection State
  const [activeCampaign, setActiveCampaign] = useState<CampaignDef>(CAMPAIGNS_LIST[0]);
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);

  // Sync campaign selection when passed from parent
  useEffect(() => {
    if (initialCampaignHandle) {
      const found = CAMPAIGNS_LIST.find((c) => c.handle.toLowerCase() === initialCampaignHandle.toLowerCase());
      if (found) {
        setActiveCampaign(found);
      }
    }
  }, [initialCampaignHandle]);

  // Top License Expiry Banner
  const [showLicenseBanner, setShowLicenseBanner] = useState(true);

  // Accordion Toggles (Default 'calling' open to match screenshot)
  const [openAccordion, setOpenAccordion] = useState<string | null>('calling');

  // Assignee Filter state (e.g. 'Risvana Rahim')
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>('Risvana Rahim');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // Campaign Leads List State
  const [campaignLeads, setCampaignLeads] = useState<Lead[]>(INITIAL_CAMPAIGN_LEADS);
  const [selectedLead, setSelectedLead] = useState<Lead>(INITIAL_CAMPAIGN_LEADS[0]);
  const [campaignTab, setCampaignTab] = useState<'NEW' | 'ACTIVE'>('NEW');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Lead Detail Fields Toggle
  const [showMoreFields, setShowMoreFields] = useState(false);

  // Rating Stars State
  const [starRating, setStarRating] = useState(0);

  // Activity Note Input State
  const [newNoteText, setNewNoteText] = useState('');
  const [activeRightTab, setActiveRightTab] = useState<'Activity History' | 'Task'>('Activity History');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [activitiesList, setActivitiesList] = useState<Array<{ id: string; text: string; time: string; type: string }>>([
    { id: 'act-1', text: 'Lead Source : empty → Facebook-Meta-01', time: '5h', type: 'source' },
    { id: 'act-2', text: 'Facebook page : empty → 506000535940727', time: '5h', type: 'fb' },
    { id: 'act-3', text: 'Call Outgoing: 6s CONNECTED by Ummema Sufiya BM', time: '1d ago', type: 'call' },
    { id: 'act-4', text: 'Automated WhatsApp Intro Message Delivered', time: '1d ago', type: 'whatsapp' },
  ]);

  // Status Distribution Calculation
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Fresh': 0,
      'Open': 0,
      'Interested': 0,
      'Warm': 0,
      'Contacted': 0,
      'Converted': 0,
      'RNR': 0,
      'Lost': 0
    };
    campaignLeads.forEach(l => {
      const st = l.status || 'Fresh';
      if (counts[st] !== undefined) {
        counts[st]++;
      } else {
        counts[st] = (counts[st] || 0) + 1;
      }
    });
    return counts;
  }, [campaignLeads]);

  // Dynamic Telecaller Lead Allocation computation
  const telecallerAllocation = useMemo(() => {
    const counts: Record<string, number> = {};
    campaignLeads.forEach((lead) => {
      const assignee = lead.ownerAgentName || 'Unassigned';
      counts[assignee] = (counts[assignee] || 0) + 1;
    });

    const total = campaignLeads.length || 1;
    const colorPalette = [
      { bg: 'bg-[#5EEAD4]', stroke: '#2DD4BF', name: 'Farzana', hex: '#2DD4BF' },
      { bg: 'bg-[#FDE047]', stroke: '#EAB308', name: 'Risvana Rahim', hex: '#EAB308' },
      { bg: 'bg-[#60A5FA]', stroke: '#3B82F6', name: 'philemon', hex: '#3B82F6' },
      { bg: 'bg-[#34D399]', stroke: '#10B981', name: 'Munavvir', hex: '#10B981' },
      { bg: 'bg-[#F87171]', stroke: '#EF4444', name: 'Harish', hex: '#EF4444' },
      { bg: 'bg-[#FB923C]', stroke: '#F97316', name: 'Ashly James', hex: '#F97316' },
      { bg: 'bg-[#4ADE80]', stroke: '#22C55E', name: 'Madhava sai nagendra', hex: '#22C55E' },
      { bg: 'bg-[#A78BFA]', stroke: '#8B5CF6', name: 'Ummema Sufiya BM', hex: '#8B5CF6' }
    ];

    let currentOffset = 0;
    return Object.entries(counts).map(([agentName, count], idx) => {
      const percentage = Math.round((count / total) * 100);
      const colorObj = colorPalette[idx % colorPalette.length];
      const offset = currentOffset;
      currentOffset += percentage;

      return {
        agentName,
        count,
        percentage,
        colorObj,
        offset
      };
    });
  }, [campaignLeads]);

  // Handle lead selection
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  // Handle lead status change
  const handleStatusChange = (newStatus: LeadStatus) => {
    const updated = { ...selectedLead, status: newStatus };
    setSelectedLead(updated);
    setCampaignLeads((prev) => prev.map((l) => l.id === selectedLead.id ? updated : l));
    if (onUpdateLead) onUpdateLead(updated);
    
    // Add activity
    setActivitiesList((prev) => [
      { id: `act-${Date.now()}`, text: `Status updated to ${newStatus}`, time: 'Just now', type: 'status' },
      ...prev
    ]);
  };

  // Handle lead assignee change
  const handleAssigneeChange = (agentId: string, agentName: string) => {
    const updated = { ...selectedLead, ownerAgentId: agentId, ownerAgentName: agentName };
    setSelectedLead(updated);
    setCampaignLeads((prev) => prev.map((l) => l.id === selectedLead.id ? updated : l));
    if (onUpdateLead) onUpdateLead(updated);

    setActivitiesList((prev) => [
      { id: `act-${Date.now()}`, text: `Reallocated to ${agentName}`, time: 'Just now', type: 'assignment' },
      ...prev
    ]);
  };

  // Handle Add Note
  const handleAddNoteSubmit = () => {
    if (!newNoteText.trim()) return;
    setActivitiesList((prev) => [
      { id: `act-${Date.now()}`, text: `Note Added: ${newNoteText.trim()}`, time: 'Just now', type: 'note' },
      ...prev
    ]);
    setNewNoteText('');
  };

  // Filter leads by search and assignee
  const filteredLeads = useMemo(() => {
    return campaignLeads.filter((l) => {
      const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.phone.includes(searchQuery);
      const matchesAssignee = selectedAssigneeFilter === 'ALL' || !selectedAssigneeFilter
        ? true
        : (l.ownerAgentName || '').toLowerCase().includes(selectedAssigneeFilter.toLowerCase());
      
      return matchesSearch && matchesAssignee;
    });
  }, [campaignLeads, searchQuery, selectedAssigneeFilter]);

  // Solid Pie Chart Slice Renderer for Campaign Assignees Report
  const renderPieSlices = () => {
    let cumulativePercent = 0;
    const cx = 70;
    const cy = 70;
    const r = 64;

    return CAMPAIGN_ASSIGNEES.map((item, idx) => {
      const startAngle = (cumulativePercent / 100) * 360;
      const sliceAngle = (item.percentage / 100) * 360;
      const endAngle = startAngle + sliceAngle;
      cumulativePercent += item.percentage;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;

      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      return (
        <path
          key={idx}
          d={pathData}
          fill={item.color}
          stroke="#ffffff"
          strokeWidth="0.5"
          className="transition-opacity hover:opacity-85 cursor-pointer"
        />
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#F3F4F7] font-sans text-slate-800 space-y-3 pb-8 select-none">
      
      {/* TOP LICENSE EXPIRED BANNER (MATCHES TELECRM UI) */}
      {showLicenseBanner && (
        <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3.5 py-1.5 flex items-center justify-between text-xs text-[#991B1B] shadow-2xs font-sans">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span className="text-[11px] md:text-xs font-medium text-[#991B1B]">
              <strong>2 licenses have expired!</strong>{' '}
              <button 
                onClick={() => alert('Opening Team & User Management...')}
                className="underline font-bold text-[#7F1D1D] hover:text-black cursor-pointer mx-1"
              >
                View Users
              </button>
              {' '}|{' '}
              <button 
                onClick={() => alert('Redirecting to License Renewal Portal...')}
                className="underline font-bold text-[#7F1D1D] hover:text-black cursor-pointer ml-1"
              >
                Renew Now
              </button>
            </span>
          </div>

          <button
            onClick={() => setShowLicenseBanner(false)}
            className="text-[#991B1B] hover:text-black p-0.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* THREE COLUMN MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: CAMPAIGN DASHBOARD & ALLOCATION METRICS (3.5 Cols)            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 xl:col-span-3.5 space-y-3">
          
          {/* Main Campaign Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-semibold text-slate-500">
                Campaign Dashboard
              </span>
              <button 
                onClick={() => alert('Campaign settings')}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Campaign Handle & Dropdown Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-indigo-400 p-2.5 rounded-xl text-left cursor-pointer transition-all shadow-2xs"
              >
                <div className="truncate">
                  <h3 className="font-mono text-xs font-bold text-slate-900 truncate">
                    {activeCampaign.handle}
                  </h3>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              </button>

              {/* Campaign Switcher Dropdown */}
              {showCampaignDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase px-2 py-1 border-b border-slate-100 pb-1.5">
                    <span>Campaigns</span>
                    <span className="text-indigo-600 hover:underline cursor-pointer">See All</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1 pt-1">
                    {CAMPAIGNS_LIST.map((camp) => (
                      <button
                        key={camp.id}
                        onClick={() => {
                          setActiveCampaign(camp);
                          setShowCampaignDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          activeCampaign.id === camp.id ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Phone className={`w-3.5 h-3.5 ${activeCampaign.id === camp.id ? 'text-indigo-600' : 'text-slate-400'} shrink-0`} />
                          <div className="truncate">
                            <div className="font-mono text-[11px] font-bold truncate">{camp.handle.replace('@', '')}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0 ml-1">
                          {camp.totalLeads}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Campaign Quick Badges (2M, 178, 1, NONE) */}
            <div className="flex items-center space-x-2 text-[11px] font-mono">
              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>2M</span>
              </span>
              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
                <User className="w-3 h-3 text-slate-500" />
                <span>{activeCampaign.totalLeads}</span>
              </span>
              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
                <Filter className="w-3 h-3 text-slate-500" />
                <span>1</span>
              </span>
              <span className="bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded border border-slate-200">
                NONE
              </span>
            </div>

            {/* Members + Progress Dial + Dialer Launcher */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              {/* Avatars */}
              <div className="flex items-center -space-x-1.5">
                <span className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white text-indigo-800 text-[10px] font-bold flex items-center justify-center">
                  MU
                </span>
                <span className="w-6 h-6 rounded-full bg-amber-100 border-2 border-white text-amber-800 text-[10px] font-bold flex items-center justify-center">
                  AR
                </span>
                <span className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white text-slate-700 text-[10px] font-bold flex items-center justify-center">
                  +3
                </span>
              </div>

              {/* Progress 0% */}
              <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 font-mono">
                {activeCampaign.progress}%
              </div>

              {/* Purple TeleCRM Call Button */}
              <button 
                onClick={() => alert(`Starting campaign dialer for ${activeCampaign.handle}...`)}
                className="bg-[#4338CA] hover:bg-[#3730A3] text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                title="Launch Campaign Dialer"
              >
                <Phone className="w-3.5 h-3.5 fill-current" />
                <span className="font-mono text-sm leading-none">›</span>
              </button>
            </div>
          </div>

          {/* ACCORDION REPORTS */}
          <div className="space-y-2">
            
            {/* 1. Campaign Assignees Report (MATCHES SCREENSHOT) */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <button 
                onClick={() => setOpenAccordion(openAccordion === 'assignees' ? null : 'assignees')}
                className="w-full p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left"
              >
                <span className="text-slate-800 font-bold">Campaign Assignees Report</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openAccordion === 'assignees' ? 'rotate-180' : ''}`} />
              </button>

              {openAccordion === 'assignees' && (
                <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-white">
                  {/* 5 Errors alert link */}
                  <div className="flex justify-end">
                    <button 
                      onClick={() => alert('Viewing 5 campaign assignment errors...')}
                      className="text-xs font-semibold text-[#DC2626] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span className="underline">5 Errors</span>
                    </button>
                  </div>

                  {/* Pie chart + Assignees legend */}
                  <div className="grid grid-cols-12 gap-3 items-center">
                    {/* Left: SVG Solid Pie Chart */}
                    <div className="col-span-5 flex items-center justify-center">
                      <svg className="w-32 h-32" viewBox="0 0 140 140">
                        {renderPieSlices()}
                      </svg>
                    </div>

                    {/* Right: Detailed 10 Assignees List */}
                    <div className="col-span-7 space-y-1.5 text-xs">
                      {CAMPAIGN_ASSIGNEES.map((item, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedAssigneeFilter(item.name)}
                          className={`flex items-start space-x-2 text-[11px] leading-tight p-1 rounded-md cursor-pointer transition-colors ${
                            selectedAssigneeFilter === item.name ? 'bg-indigo-50 font-bold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" 
                            style={{ backgroundColor: item.color }} 
                          />
                          <div className="text-slate-800">
                            <span>{item.name}</span>{' '}
                            <span className="text-slate-600 font-medium">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Campaign Calling Report (MATCHES SCREENSHOT) */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <button 
                onClick={() => setOpenAccordion(openAccordion === 'calling' ? null : 'calling')}
                className="w-full p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left"
              >
                <span className="text-slate-800 font-bold">Campaign Calling Report</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openAccordion === 'calling' ? 'rotate-180' : ''}`} />
              </button>

              {openAccordion === 'calling' && (
                <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-white">
                  <div className="grid grid-cols-12 gap-3 items-center py-2">
                    {/* Left: Solid Red Pie Chart (100% pending) */}
                    <div className="col-span-6 flex items-center justify-center">
                      <svg className="w-28 h-28" viewBox="0 0 100 100">
                        {/* Red pending circle 100% */}
                        <circle cx="50" cy="50" r="45" fill="#F87171" />
                        {/* Subtle divider line pointing up to 12 o'clock */}
                        <line x1="50" y1="50" x2="50" y2="5" stroke="#E55B5B" strokeWidth="1" />
                      </svg>
                    </div>

                    {/* Right: Legend */}
                    <div className="col-span-6 space-y-2 text-xs">
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#9BD3BA] shrink-0" />
                        <span className="text-slate-700">connected (0%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F8CF48] shrink-0" />
                        <span className="text-slate-700">attempted (0%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F87171] shrink-0" />
                        <span className="text-slate-800 font-semibold">pending (100%)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#B08246] shrink-0" />
                        <span className="text-slate-700">skipped (0%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Leads Status Report (COLOR CODED!) */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <button 
                onClick={() => setOpenAccordion(openAccordion === 'status' ? null : 'status')}
                className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Leads Status Report</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openAccordion === 'status' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'status' && (
                <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50 text-xs">
                  <div className="space-y-1.5">
                    {Object.entries(statusCounts).map(([st, count]) => {
                      const numCount = Number(count);
                      const style = getStatusStyle(st);
                      const percentage = Math.round((numCount / (campaignLeads.length || 1)) * 100);
                      return (
                        <div key={st} className="flex items-center justify-between bg-white p-1.5 px-2.5 rounded-lg border border-slate-200/80">
                          <StatusBadge status={st} size="xs" />
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full ${style.dot}`} style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="font-mono font-bold text-slate-700 text-[11px] min-w-[20px] text-right">{numCount}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Leads Lost Reason Report */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <button 
                onClick={() => setOpenAccordion(openAccordion === 'lost' ? null : 'lost')}
                className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left"
              >
                <span>Leads Lost Reason Report</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openAccordion === 'lost' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'lost' && (
                <div className="p-3 border-t border-slate-100 space-y-1.5 bg-slate-50/50 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600">Joined Another Institute</span>
                    <span className="font-bold text-slate-800">45%</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600">High Course Fees</span>
                    <span className="font-bold text-slate-800">30%</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600">Location / Relocation Issue</span>
                    <span className="font-bold text-slate-800">25%</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* MIDDLE COLUMN: CAMPAIGN LEADS QUEUE (4 Cols)                              */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 xl:col-span-4 bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
          
          {/* Header & Tabs (@master-form-iata-cargo > Risvana Rahim Leads) */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="font-mono text-xs font-bold text-slate-800 truncate">
                {activeCampaign.handle} ›
              </span>

              {/* Assignee Filter Dropdown Pill */}
              <div className="relative">
                <button
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="px-2 py-0.5 rounded-md bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200/80 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <span className="truncate max-w-[140px]">
                    {selectedAssigneeFilter === 'ALL' ? 'All Leads' : `${selectedAssigneeFilter} Leads`}
                  </span>
                  <ChevronDown className="w-3 h-3 text-indigo-700 shrink-0" />
                </button>

                {showAssigneeDropdown && (
                  <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-30 font-sans">
                    <button
                      onClick={() => {
                        setSelectedAssigneeFilter('ALL');
                        setShowAssigneeDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center justify-between ${
                        selectedAssigneeFilter === 'ALL' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>All Campaign Leads</span>
                      <span className="text-[10px] text-slate-400 font-mono">({campaignLeads.length})</span>
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    {CAMPAIGN_ASSIGNEES.map((a) => {
                      const agentLeadCount = campaignLeads.filter((l) => (l.ownerAgentName || '').toLowerCase().includes(a.name.toLowerCase())).length;
                      return (
                        <button
                          key={a.name}
                          onClick={() => {
                            setSelectedAssigneeFilter(a.name);
                            setShowAssigneeDropdown(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center justify-between ${
                            selectedAssigneeFilter === a.name ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                            <span className="truncate">{a.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">({agentLeadCount})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1 text-xs font-bold shrink-0">
              <button
                onClick={() => setCampaignTab('ACTIVE')}
                className={`px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                  campaignTab === 'ACTIVE' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                ACTIVE
              </button>
              <button
                onClick={() => setCampaignTab('NEW')}
                className={`px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                  campaignTab === 'NEW' ? 'text-indigo-700 border-b-2 border-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                NEW ({filteredLeads.length})
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaign leads..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all font-sans"
            />
          </div>

          {/* Leads Queue List with COLOR CODED STATUSES */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredLeads.map((lead) => {
              const isSelected = selectedLead.id === lead.id;
              const isConnectedCall = lead.createdAt && lead.createdAt.includes('CONNECTED');
              const isDatedNote = lead.createdAt && lead.createdAt.includes('Fri, 14 Aug');

              return (
                <div
                  key={lead.id}
                  onClick={() => handleSelectLead(lead)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-400 shadow-2xs'
                      : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/60'
                  }`}
                >
                  {/* Row 1: Name & Status Badge */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-2">
                      <h4 
                        className="text-xs font-bold text-slate-900 leading-tight truncate"
                        title={lead.name}
                      >
                        {lead.name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                        {lead.phone}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className="text-[11px] text-slate-500 font-medium">Status:</span>
                      {/* DYNAMIC COLOR STATUS BADGE */}
                      <StatusBadge status={lead.status || 'Fresh'} size="xs" />
                      <Star className="w-3.5 h-3.5 text-slate-300 hover:text-amber-400 cursor-pointer ml-0.5" />
                    </div>
                  </div>

                  {/* Row 2: Sub Activity Row (MATCHES SCREENSHOT) */}
                  {(lead.createdAt || lead.ownerAgentName) && (
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                      <div className="flex items-center space-x-1 truncate min-w-0">
                        {isConnectedCall ? (
                          <div className="flex items-center space-x-1 text-emerald-600 font-semibold italic truncate">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0 fill-current" />
                            <span className="font-bold text-slate-800 not-italic">{lead.createdAt.split(' ')[0]}</span>
                            <span className="text-slate-500 font-normal">{lead.createdAt.replace(lead.createdAt.split(' ')[0], '')}</span>
                          </div>
                        ) : isDatedNote ? (
                          <div className="flex items-center space-x-1 text-slate-500 truncate">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.createdAt}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] truncate">{lead.createdAt || 'Assigned'}</span>
                        )}
                      </div>

                      {/* Agent Initials Pill */}
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[9px] border border-indigo-200 shrink-0">
                        {lead.ownerAgentName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ACTIVE LEAD DETAIL & DIALER WORKSPACE (4.5 Cols)            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 xl:col-span-4.5 bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
          
          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-bold truncate max-w-[200px]">
              {activeCampaign.handle}
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const nextIndex = (campaignLeads.findIndex((l) => l.id === selectedLead.id) + 1) % campaignLeads.length;
                  setSelectedLead(campaignLeads[nextIndex]);
                }}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-2xs active:scale-95 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Next</span>
              </button>

              <button 
                onClick={() => onOpenLeadDetail && onOpenLeadDetail(selectedLead)}
                className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer" 
                title="Expand full lead record"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lead Header Title, Color Status Selector & Rating */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {selectedLead.name}
                </h2>
                
                <div className="flex items-center space-x-2">
                  {/* DYNAMIC COLOR STATUS DROPDOWN SELECTOR */}
                  <div className="relative inline-flex items-center">
                    {(() => {
                      const stageConfig = stages.find(s => s.name.toLowerCase() === selectedLead.status.toLowerCase());
                      const color = stageConfig?.color || getStatusStyle(selectedLead.status).hex;
                      return (
                        <div 
                          style={{ backgroundColor: `${color}1A`, color: color, borderColor: `${color}40` }}
                          className="relative flex items-center rounded-lg pl-2 pr-6 py-1 text-xs font-bold border transition-colors shadow-2xs"
                        >
                          <span 
                            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}
                            className="w-2 h-2 rounded-full mr-1.5" 
                          />
                          <select
                            value={selectedLead.status}
                            onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                            className="bg-transparent text-inherit font-bold focus:outline-none cursor-pointer appearance-none text-xs"
                          >
                            {stages.map(s => (
                              <option key={s.name} value={s.name} className="bg-white text-slate-800">{s.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-inherit absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80" />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center space-x-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        onClick={() => setStarRating(star)}
                        className={`w-3.5 h-3.5 cursor-pointer ${
                          star <= starRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent Assigned Pill with Avatar */}
              <div className="flex items-center space-x-1.5 text-right">
                <span className="text-xs font-semibold text-slate-700">{selectedLead.ownerAgentName}</span>
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[10px] border border-indigo-200">
                  {selectedLead.ownerAgentName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Lead Details Fields Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-slate-400 text-[10px] font-semibold uppercase block">Phone</span>
              <div className="flex items-center space-x-1 font-mono font-bold text-slate-900 mt-0.5">
                <span className="text-xs">🇮🇳</span>
                <span>{selectedLead.phone}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] font-semibold uppercase block">Email</span>
              <span className="font-semibold text-slate-800 truncate block mt-0.5">
                {selectedLead.email || 'Suprithg2527@gmail.com'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] font-semibold uppercase block">Alternate Phone</span>
              <span className="text-slate-400 mt-0.5 block flex items-center space-x-1">
                <span>🇮🇳 91</span>
                <span>Enter Phone Number</span>
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] font-semibold uppercase block">Batch</span>
              <span className="text-slate-400 mt-0.5 block">Empty</span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] font-semibold uppercase block">City</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{selectedLead.city || 'Bengaluru'}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] font-semibold uppercase block">Date of Joining</span>
              <span className="text-slate-400 mt-0.5 block">Empty</span>
            </div>

            {showMoreFields && (
              <>
                <div>
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Address</span>
                  <span className="text-slate-400 mt-0.5 block">Empty</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Age</span>
                  <span className="text-slate-400 mt-0.5 block">Empty</span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowMoreFields(!showMoreFields)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>{showMoreFields ? 'Show less' : 'Show more'}</span>
            {showMoreFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* ACTION BUTTONS TOOLBAR (CALL, TASK, WHATSAPP, SMS, ADD NOTE, LEAD-IQ) */}
          <div className="grid grid-cols-6 gap-1 pt-1 border-t border-slate-100">
            <button 
              onClick={() => alert(`Calling ${selectedLead.name} (${selectedLead.phone})...`)}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4 text-slate-600 mb-1" />
              <span className="text-[9px] font-bold uppercase">Call</span>
            </button>

            <button 
              onClick={() => alert('Add Task scheduled')}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-slate-600 mb-1" />
              <span className="text-[9px] font-bold uppercase">Task</span>
            </button>

            <button 
              onClick={() => window.open(`https://wa.me/${selectedLead.phone}`, '_blank')}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="text-[9px] font-bold uppercase">WhatsApp</span>
            </button>

            <button 
              onClick={() => alert(`Sending SMS to ${selectedLead.phone}`)}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 text-slate-600 mb-1" />
              <span className="text-[9px] font-bold uppercase">SMS</span>
            </button>

            <button 
              onClick={() => {
                const el = document.getElementById('campaign-note-box');
                el?.focus();
              }}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-600 mb-1" />
              <span className="text-[9px] font-bold uppercase">Add Note</span>
            </button>

            <button 
              onClick={() => alert(`Lead-IQ AI Score: ${selectedLead.aiScore}/100 (${selectedLead.aiRating}). Analysis: ${selectedLead.aiReasoning}`)}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-600 mb-1" />
              <span className="text-[9px] font-bold uppercase">Lead-IQ</span>
            </button>
          </div>

          {/* ACTIVITY HISTORY / TASK TABS WITH TELECRM FILTERS */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 text-xs font-bold">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setActiveRightTab('Activity History')}
                  className={`pb-1.5 transition-all cursor-pointer ${
                    activeRightTab === 'Activity History'
                      ? 'border-b-2 border-indigo-600 text-indigo-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Activity History
                </button>
                <button
                  onClick={() => setActiveRightTab('Task')}
                  className={`pb-1.5 transition-all cursor-pointer ${
                    activeRightTab === 'Task'
                      ? 'border-b-2 border-indigo-600 text-indigo-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Task
                </button>
              </div>

              <button 
                onClick={() => alert('New Action Menu')}
                className="text-indigo-700 hover:bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-xs font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Action</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Filter Pills: All Actions ✕, Time ⌄, Team ⌄ */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <div className="relative">
                <button 
                  onClick={() => setShowActionDropdown(!showActionDropdown)}
                  className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <span>{actionFilter}</span>
                  <X className="w-3 h-3 text-indigo-500 ml-0.5" />
                  <ChevronDown className="w-3 h-3 text-indigo-500" />
                </button>
                {showActionDropdown && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1 text-xs w-36">
                    {['All Actions', 'Calls Only', 'WhatsApp', 'Notes', 'Status Changes'].map(f => (
                      <button
                        key={f}
                        onClick={() => {
                          setActionFilter(f);
                          setShowActionDropdown(false);
                        }}
                        className="w-full text-left px-2 py-1 hover:bg-slate-50 rounded text-slate-700 cursor-pointer"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => alert('Filter by Time')}
                className="bg-white border border-slate-200 hover:border-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center space-x-1 text-slate-700 cursor-pointer shadow-2xs"
              >
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Time</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <button 
                onClick={() => alert('Filter by Team')}
                className="bg-white border border-slate-200 hover:border-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center space-x-1 text-slate-700 cursor-pointer shadow-2xs"
              >
                <User className="w-3 h-3 text-slate-400" />
                <span>Team</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {/* Note Input */}
            <div className="space-y-1.5 pt-1">
              <textarea
                id="campaign-note-box"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Type your notes or call updates here..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-sans"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Shift + Enter for new line</span>
                <button
                  onClick={handleAddNoteSubmit}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </div>

            {/* Timeline Activities List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activitiesList.map((act) => (
                <div key={act.id} className="text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{act.text}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
