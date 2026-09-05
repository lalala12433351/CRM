import { WorkflowSerialized } from '../features/workflow-builder/types/workflow.types';
import { fetchWithTenantAuth, getAuthHeaders } from '../lib/auth';

export interface WorkflowRecord {
  id: string;
  tenantId?: string;
  name: string;
  hasDraft?: boolean;
  event: string;
  eventIcon?: string;
  status: boolean; // true = active/published, false = off/draft
  statusMeta: string;
  totalRuns: number;
  last24hRuns: number;
  last24hFailures: number;
  isDraft: boolean;
  nodes?: any[];
  edges?: any[];
  createdAt?: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'pixbe_crm_workflows_db';

export const DEFAULT_WORKFLOWS: WorkflowRecord[] = [
  {
    id: 'wf-1',
    name: 'On Website lead',
    hasDraft: false,
    event: 'Lead Creation',
    eventIcon: 'globe',
    status: true,
    statusMeta: '13d ago by Faisal C',
    totalRuns: 853,
    last24hRuns: 10,
    last24hFailures: 0,
    isDraft: false,
    nodes: [],
    edges: []
  },
  {
    id: 'wf-2',
    name: 'On Lead Status Change',
    hasDraft: true,
    event: 'Lead Status Change',
    eventIcon: 'file',
    status: true,
    statusMeta: '2M ago by Faisal C',
    totalRuns: 19233,
    last24hRuns: 432,
    last24hFailures: 0,
    isDraft: false,
    nodes: [],
    edges: []
  },
  {
    id: 'wf-3',
    name: 'On call log lead',
    hasDraft: false,
    event: 'Call Log',
    eventIcon: 'phone',
    status: true,
    statusMeta: '3M ago by Faisal C',
    totalRuns: 862,
    last24hRuns: 0,
    last24hFailures: 0,
    isDraft: false,
    nodes: [],
    edges: []
  }
];

export function getEffectiveTenantId(explicitTenantId?: string): string {
  if (explicitTenantId && explicitTenantId !== 'default_tenant') {
    return explicitTenantId;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pixbe_auth_user') : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.tenantId) return parsed.tenantId;
      }
    } catch {}
  }
  return explicitTenantId || 'default_tenant';
}

/**
 * Synchronously retrieves workflows from local cache and triggers background fetch to sync with .data/multi_tenant_store.json.
 */
export function getWorkflowsFromDb(tenantId?: string): WorkflowRecord[] {
  const tId = getEffectiveTenantId(tenantId);
  if (typeof window === 'undefined') return DEFAULT_WORKFLOWS;

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${tId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local workflows cache:', e);
  }

  // If no cache, return defaults
  return DEFAULT_WORKFLOWS;
}

/**
 * Asynchronously fetch workflows from the server endpoint /api/workflows (backed by .data/multi_tenant_store.json).
 */
export async function fetchWorkflowsFromApi(tenantId?: string): Promise<WorkflowRecord[]> {
  const tId = getEffectiveTenantId(tenantId);
  try {
    const response = await fetchWithTenantAuth('/api/workflows', {
      headers: {
        'x-tenant-id': tId
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.workflows)) {
        const workflows: WorkflowRecord[] = data.workflows;
        if (typeof window !== 'undefined') {
          localStorage.setItem(`${STORAGE_KEY}_${tId}`, JSON.stringify(workflows));
        }
        return workflows;
      }
    }
  } catch (err) {
    console.warn('[workflowStorage] Failed to fetch workflows from API, falling back to local cache:', err);
  }
  return getWorkflowsFromDb(tId);
}

/**
 * Saves a workflow to local cache and persists it into .data/multi_tenant_store.json via POST /api/workflows.
 */
export function saveWorkflowToDb(
  serialized: WorkflowSerialized | any,
  tenantId?: string
): WorkflowRecord[] {
  const tId = getEffectiveTenantId(tenantId);
  if (typeof window === 'undefined') return [];

  try {
    const currentList = getWorkflowsFromDb(tId);
    const triggerLabel =
      serialized.nodes?.find((n: any) => n.type === 'trigger' || n.data?.kind === 'trigger')?.data?.label ||
      serialized.event ||
      'Lead Trigger Event';

    const isDraft = serialized.status === 'draft' || Boolean(serialized.isDraft);
    const isPublished = serialized.status === 'published' || serialized.status === true;

    const existingIndex = currentList.findIndex(
      (w) => w.id === serialized.id || (w.name && serialized.name && w.name.trim().toLowerCase() === serialized.name.trim().toLowerCase())
    );

    const record: WorkflowRecord = {
      id: serialized.id || `wf-${Date.now()}`,
      tenantId: tId,
      name: serialized.name || 'Untitled Workflow',
      hasDraft: isDraft,
      event: triggerLabel,
      eventIcon: serialized.eventIcon || 'globe',
      status: isPublished,
      statusMeta: 'Just now by Admin',
      totalRuns: existingIndex >= 0 ? currentList[existingIndex].totalRuns : 0,
      last24hRuns: existingIndex >= 0 ? currentList[existingIndex].last24hRuns : 0,
      last24hFailures: existingIndex >= 0 ? currentList[existingIndex].last24hFailures : 0,
      isDraft: isDraft,
      nodes: serialized.nodes || [],
      edges: serialized.edges || [],
      createdAt: existingIndex >= 0 ? currentList[existingIndex].createdAt : (serialized.createdAt || new Date().toISOString()),
      updatedAt: new Date().toISOString()
    };

    let updatedList: WorkflowRecord[];
    if (existingIndex >= 0) {
      updatedList = [...currentList];
      updatedList[existingIndex] = record;
    } else {
      updatedList = [record, ...currentList];
    }

    localStorage.setItem(`${STORAGE_KEY}_${tId}`, JSON.stringify(updatedList));

    // Persist to multi_tenant_store.json via API
    fetchWithTenantAuth('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(record),
      headers: {
        'x-tenant-id': tId
      }
    }).catch((err) => {
      console.warn('[workflowStorage] Async save to backend JSON store error:', err);
    });

    return updatedList;
  } catch (e) {
    console.warn('Error saving workflow to DB:', e);
    return [];
  }
}

/**
 * Async version of saveWorkflowToDb returning a Promise.
 */
export async function saveWorkflowToDbAsync(
  serialized: WorkflowSerialized | any,
  tenantId?: string
): Promise<WorkflowRecord> {
  const tId = getEffectiveTenantId(tenantId);
  const updatedList = saveWorkflowToDb(serialized, tId);
  const saved = updatedList.find((w) => w.id === serialized.id || w.name === serialized.name) || updatedList[0];
  return saved;
}

/**
 * Deletes a workflow from local cache and removes it from .data/multi_tenant_store.json via DELETE /api/workflows/:id.
 */
export function deleteWorkflowFromDb(
  id: string,
  tenantId?: string
): WorkflowRecord[] {
  const tId = getEffectiveTenantId(tenantId);
  if (typeof window === 'undefined') return [];

  try {
    const currentList = getWorkflowsFromDb(tId);
    const updatedList = currentList.filter((w) => w.id !== id);
    localStorage.setItem(`${STORAGE_KEY}_${tId}`, JSON.stringify(updatedList));

    // Persist deletion to multi_tenant_store.json
    fetchWithTenantAuth(`/api/workflows/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'x-tenant-id': tId
      }
    }).catch((err) => {
      console.warn('[workflowStorage] Async delete from backend JSON store error:', err);
    });

    return updatedList;
  } catch (e) {
    console.warn('Error deleting workflow from DB:', e);
    return [];
  }
}

/**
 * Toggles a workflow status (Active/Inactive) and updates .data/multi_tenant_store.json via PUT /api/workflows/:id/toggle.
 */
export function toggleWorkflowStatusInDb(
  id: string,
  tenantId?: string
): WorkflowRecord[] {
  const tId = getEffectiveTenantId(tenantId);
  if (typeof window === 'undefined') return [];

  try {
    const currentList = getWorkflowsFromDb(tId);
    const updatedList = currentList.map((w) => {
      if (w.id === id) {
        return {
          ...w,
          status: !w.status,
          statusMeta: 'Just now by Admin',
          updatedAt: new Date().toISOString()
        };
      }
      return w;
    });

    localStorage.setItem(`${STORAGE_KEY}_${tId}`, JSON.stringify(updatedList));

    // Persist status toggle to multi_tenant_store.json
    fetchWithTenantAuth(`/api/workflows/${encodeURIComponent(id)}/toggle`, {
      method: 'PUT',
      headers: {
        'x-tenant-id': tId
      }
    }).catch((err) => {
      console.warn('[workflowStorage] Async toggle in backend JSON store error:', err);
    });

    return updatedList;
  } catch (e) {
    console.warn('Error toggling workflow in DB:', e);
    return [];
  }
}
