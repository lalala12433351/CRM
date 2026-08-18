import { LeadStatus } from '../types';

export interface StatusStyleConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
  glow: string;
  darkBg: string;
  darkText: string;
  darkBorder: string;
  hex: string;
  label: string;
}

export const STATUS_STYLE_MAP: Record<string, StatusStyleConfig> = {
  'fresh': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    glow: 'shadow-emerald-500/20',
    darkBg: 'bg-emerald-950/50',
    darkText: 'text-emerald-400',
    darkBorder: 'border-emerald-800/60',
    hex: '#10B981',
    label: 'Fresh'
  },
  'new lead': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    glow: 'shadow-emerald-500/20',
    darkBg: 'bg-emerald-950/50',
    darkText: 'text-emerald-400',
    darkBorder: 'border-emerald-800/60',
    hex: '#10B981',
    label: 'New Lead'
  },
  'open': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    glow: 'shadow-blue-500/20',
    darkBg: 'bg-blue-950/50',
    darkText: 'text-blue-400',
    darkBorder: 'border-blue-800/60',
    hex: '#3B82F6',
    label: 'Open'
  },
  'contacted': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
    glow: 'shadow-indigo-500/20',
    darkBg: 'bg-indigo-950/50',
    darkText: 'text-indigo-400',
    darkBorder: 'border-indigo-800/60',
    hex: '#6366F1',
    label: 'Contacted'
  },
  'follow up': {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    glow: 'shadow-sky-500/20',
    darkBg: 'bg-sky-950/50',
    darkText: 'text-sky-300',
    darkBorder: 'border-sky-800/60',
    hex: '#0284C7',
    label: 'Follow Up'
  },
  'interested': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    glow: 'shadow-amber-500/20',
    darkBg: 'bg-amber-950/50',
    darkText: 'text-amber-300',
    darkBorder: 'border-amber-800/60',
    hex: '#F59E0B',
    label: 'Interested'
  },
  'warm': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    glow: 'shadow-amber-500/20',
    darkBg: 'bg-amber-950/50',
    darkText: 'text-amber-300',
    darkBorder: 'border-amber-800/60',
    hex: '#F59E0B',
    label: 'Warm'
  },
  'demo scheduled': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    glow: 'shadow-purple-500/20',
    darkBg: 'bg-purple-950/50',
    darkText: 'text-purple-300',
    darkBorder: 'border-purple-800/60',
    hex: '#8B5CF6',
    label: 'Demo Scheduled'
  },
  'visit scheduled': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    glow: 'shadow-purple-500/20',
    darkBg: 'bg-purple-950/50',
    darkText: 'text-purple-300',
    darkBorder: 'border-purple-800/60',
    hex: '#8B5CF6',
    label: 'Visit Scheduled'
  },
  'visited': {
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-700',
    border: 'border-fuchsia-200',
    dot: 'bg-fuchsia-500',
    glow: 'shadow-fuchsia-500/20',
    darkBg: 'bg-fuchsia-950/50',
    darkText: 'text-fuchsia-300',
    darkBorder: 'border-fuchsia-800/60',
    hex: '#D946EF',
    label: 'Visited'
  },
  'proposal sent': {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
    glow: 'shadow-teal-500/20',
    darkBg: 'bg-teal-950/50',
    darkText: 'text-teal-300',
    darkBorder: 'border-teal-800/60',
    hex: '#14B8A6',
    label: 'Proposal Sent'
  },
  'converted': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
    glow: 'shadow-emerald-500/20',
    darkBg: 'bg-emerald-900/60',
    darkText: 'text-emerald-300',
    darkBorder: 'border-emerald-700',
    hex: '#059669',
    label: 'Converted'
  },
  'existing': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
    glow: 'shadow-emerald-500/20',
    darkBg: 'bg-emerald-900/60',
    darkText: 'text-emerald-300',
    darkBorder: 'border-emerald-700',
    hex: '#059669',
    label: 'Existing'
  },
  'lost': {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    glow: 'shadow-rose-500/20',
    darkBg: 'bg-rose-950/50',
    darkText: 'text-rose-400',
    darkBorder: 'border-rose-800/60',
    hex: '#EF4444',
    label: 'Lost'
  },
  'not interested': {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    glow: 'shadow-rose-500/20',
    darkBg: 'bg-rose-950/50',
    darkText: 'text-rose-400',
    darkBorder: 'border-rose-800/60',
    hex: '#EF4444',
    label: 'Not Interested'
  },
  'rnr': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    glow: 'shadow-orange-500/20',
    darkBg: 'bg-orange-950/50',
    darkText: 'text-orange-400',
    darkBorder: 'border-orange-800/60',
    hex: '#F97316',
    label: 'RNR'
  },
  'ringing no answer': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    glow: 'shadow-orange-500/20',
    darkBg: 'bg-orange-950/50',
    darkText: 'text-orange-400',
    darkBorder: 'border-orange-800/60',
    hex: '#F97316',
    label: 'Ringing No Answer'
  },
  'not reachable': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    glow: 'shadow-orange-500/20',
    darkBg: 'bg-orange-950/50',
    darkText: 'text-orange-400',
    darkBorder: 'border-orange-800/60',
    hex: '#EA580C',
    label: 'Not Reachable'
  },
  'call back later': {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
    glow: 'shadow-cyan-500/20',
    darkBg: 'bg-cyan-950/50',
    darkText: 'text-cyan-300',
    darkBorder: 'border-cyan-800/60',
    hex: '#06B6D4',
    label: 'Call Back Later'
  },
  'iata': {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
    glow: 'shadow-violet-500/20',
    darkBg: 'bg-violet-950/50',
    darkText: 'text-violet-300',
    darkBorder: 'border-violet-800/60',
    hex: '#7C3AED',
    label: 'IATA'
  },
  'cpl': {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-600',
    glow: 'shadow-blue-500/20',
    darkBg: 'bg-blue-950/50',
    darkText: 'text-blue-300',
    darkBorder: 'border-blue-800/60',
    hex: '#2563EB',
    label: 'CPL'
  },
  'next batch': {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
    glow: 'shadow-slate-500/20',
    darkBg: 'bg-slate-800',
    darkText: 'text-slate-300',
    darkBorder: 'border-slate-700',
    hex: '#64748B',
    label: 'Next Batch'
  },
  'next year': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
    glow: 'shadow-indigo-500/20',
    darkBg: 'bg-indigo-950/50',
    darkText: 'text-indigo-300',
    darkBorder: 'border-indigo-800/60',
    hex: '#4F46E5',
    label: 'Next Year'
  },
  'job enquiry': {
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-300',
    dot: 'bg-zinc-500',
    glow: 'shadow-zinc-500/20',
    darkBg: 'bg-zinc-800',
    darkText: 'text-zinc-300',
    darkBorder: 'border-zinc-700',
    hex: '#71717A',
    label: 'Job enquiry'
  }
};

const DEFAULT_STYLE: StatusStyleConfig = {
  bg: 'bg-slate-100',
  text: 'text-slate-700',
  border: 'border-slate-200',
  dot: 'bg-slate-500',
  glow: 'shadow-slate-500/20',
  darkBg: 'bg-slate-800',
  darkText: 'text-slate-300',
  darkBorder: 'border-slate-700',
  hex: '#64748B',
  label: 'Unknown'
};

export function getStatusStyle(status?: LeadStatus | string | null): StatusStyleConfig {
  if (!status) return STATUS_STYLE_MAP['fresh'];
  const key = status.toString().trim().toLowerCase();
  
  if (STATUS_STYLE_MAP[key]) {
    return STATUS_STYLE_MAP[key];
  }
  
  // Fuzzy matching
  if (key.includes('fresh') || key.includes('new')) return STATUS_STYLE_MAP['fresh'];
  if (key.includes('follow') || key.includes('back')) return STATUS_STYLE_MAP['follow up'];
  if (key.includes('interest') || key.includes('warm')) return STATUS_STYLE_MAP['interested'];
  if (key.includes('contact')) return STATUS_STYLE_MAP['contacted'];
  if (key.includes('convert') || key.includes('won') || key.includes('closed won') || key.includes('exist')) return STATUS_STYLE_MAP['converted'];
  if (key.includes('lost') || key.includes('not interest') || key.includes('drop')) return STATUS_STYLE_MAP['lost'];
  if (key.includes('rnr') || key.includes('ring') || key.includes('reach')) return STATUS_STYLE_MAP['rnr'];
  if (key.includes('demo') || key.includes('visit') || key.includes('meeting')) return STATUS_STYLE_MAP['demo scheduled'];
  if (key.includes('prop') || key.includes('quote')) return STATUS_STYLE_MAP['proposal sent'];
  
  return {
    ...DEFAULT_STYLE,
    label: status
  };
}

export function getStatusBadgeClasses(status?: LeadStatus | string | null, isDarkMode = false): string {
  const style = getStatusStyle(status);
  if (isDarkMode) {
    return `${style.darkBg} ${style.darkText} ${style.darkBorder} border`;
  }
  return `${style.bg} ${style.text} ${style.border} border`;
}
