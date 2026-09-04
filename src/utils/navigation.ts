/**
 * Pixbe CRM - URL Navigation & Browser History Sync
 * Maps CRM views to clean RESTful URL paths and keeps browser history in sync.
 */

export const VIEW_TO_PATH: Record<string, string> = {
  dashboard: '/dashboard',
  leads: '/leads',
  pipeline: '/pipeline',
  followups: '/followups',
  tasks: '/tasks',
  inbox: '/inbox',
  whatsapp: '/whatsapp',
  workflows: '/workflows',
  calls: '/my-calls',
  calling_logs: '/calling-logs',
  reports: '/reports',
  analytics: '/analytics',
  team: '/team',
  marketing: '/marketing',
  campaigns: '/campaigns',
  integrations: '/integrations',
  docs_sign: '/docs-sign',
  fields: '/fields',
  call_feedback: '/call-feedback',
  permissions: '/permissions',
  settings: '/settings',
  add_lead: '/add-lead',
  conversions: '/conversions',
  conversion_tracking: '/conversions',
  login: '/login',
  signup: '/signup',
  not_found: '/404',
};

export const PATH_TO_VIEW: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/leads': 'leads',
  '/pipeline': 'pipeline',
  '/followups': 'followups',
  '/follow-ups': 'followups',
  '/tasks': 'tasks',
  '/inbox': 'inbox',
  '/whatsapp': 'whatsapp',
  '/workflows': 'workflows',
  '/automations': 'workflows',
  '/my-calls': 'calls',
  '/calls': 'calls',
  '/calling-logs': 'calling_logs',
  '/calling_logs': 'calling_logs',
  '/reports': 'reports',
  '/analytics': 'analytics',
  '/team': 'team',
  '/marketing': 'marketing',
  '/campaigns': 'campaigns',
  '/integrations': 'integrations',
  '/docs-sign': 'docs_sign',
  '/docs_sign': 'docs_sign',
  '/fields': 'fields',
  '/call-feedback': 'call_feedback',
  '/call_feedback': 'call_feedback',
  '/permissions': 'permissions',
  '/settings': 'settings',
  '/add-lead': 'add_lead',
  '/add_lead': 'add_lead',
  '/conversions': 'conversion_tracking',
  '/conversion_tracking': 'conversion_tracking',
  '/login': 'login',
  '/signup': 'signup',
  '/sign-up': 'signup',
  '/404': 'not_found',
  '/not-found': 'not_found',
};

/**
 * Returns the view key corresponding to a given URL pathname
 */
export function pathToView(pathname: string): string | null {
  if (!pathname) return null;
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (normalized === '/' || normalized === '') return null;
  return PATH_TO_VIEW[normalized] || 'not_found';
}

/**
 * Returns the canonical URL path for a given view key
 */
export function viewToPath(view: string, subTab?: string): string {
  const basePath = VIEW_TO_PATH[view] || `/${view}`;
  if (subTab && subTab !== 'general' && subTab !== 'call_logs' && subTab !== 'workflows') {
    return `${basePath}?tab=${encodeURIComponent(subTab)}`;
  }
  return basePath;
}

/**
 * Parses the initial view from the current browser URL bar
 */
export function getInitialViewFromUrl(defaultFallback: string = 'leads'): string {
  if (typeof window === 'undefined') return defaultFallback;
  
  const fromPath = pathToView(window.location.pathname);
  if (fromPath) return fromPath;
  
  try {
    const stored = localStorage.getItem('pixbe_current_view');
    if (stored) return stored;
  } catch {}

  return defaultFallback;
}

/**
 * Synchronizes the browser address bar with the active view and subtab
 */
export function syncUrlWithView(view: string, subTab?: string, replace: boolean = false): void {
  if (typeof window === 'undefined') return;

  const targetPath = viewToPath(view, subTab);
  const currentPathWithQuery = window.location.pathname + window.location.search;

  if (currentPathWithQuery !== targetPath) {
    if (replace) {
      window.history.replaceState({ view, subTab }, '', targetPath);
    } else {
      window.history.pushState({ view, subTab }, '', targetPath);
    }
  }

  try {
    localStorage.setItem('pixbe_current_view', view);
  } catch {}
}
