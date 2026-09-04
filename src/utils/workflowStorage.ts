import { WorkflowSerialized } from '../features/workflow-builder/types/workflow.types';

export interface WorkflowRecord {
  id: string;
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
    isDraft: false
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
    isDraft: false
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
    isDraft: false
  }
];

export function getWorkflowsFromDb(tenantId: string = 'default_tenant'): WorkflowRecord[] {
  if (typeof window === 'undefined') return DEFAULT_WORKFLOWS;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${tenantId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading workflows DB:', e);
  }
  return DEFAULT_WORKFLOWS;
}

export function saveWorkflowToDb(
  serialized: WorkflowSerialized,
  tenantId: string = 'default_tenant'
): WorkflowRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const currentList = getWorkflowsFromDb(tenantId);
    const triggerLabel =
      serialized.nodes.find((n) => n.type === 'trigger' || n.data?.kind === 'trigger')?.data?.label ||
      'Lead Trigger Event';

    const isDraft = serialized.status === 'draft';
    const isPublished = serialized.status === 'published';

    const existingIndex = currentList.findIndex(
      (w) => w.id === serialized.id || w.name.trim().toLowerCase() === serialized.name.trim().toLowerCase()
    );

    const record: WorkflowRecord = {
      id: serialized.id || `wf-${Date.now()}`,
      name: serialized.name || 'Untitled Workflow',
      hasDraft: isDraft,
      event: triggerLabel,
      eventIcon: 'globe',
      status: isPublished,
      statusMeta: 'Just now by Admin',
      totalRuns: existingIndex >= 0 ? currentList[existingIndex].totalRuns : 0,
      last24hRuns: existingIndex >= 0 ? currentList[existingIndex].last24hRuns : 0,
      last24hFailures: existingIndex >= 0 ? currentList[existingIndex].last24hFailures : 0,
      isDraft: isDraft,
      nodes: serialized.nodes,
      edges: serialized.edges,
      createdAt: existingIndex >= 0 ? currentList[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedList: WorkflowRecord[];
    if (existingIndex >= 0) {
      updatedList = [...currentList];
      updatedList[existingIndex] = record;
    } else {
      updatedList = [record, ...currentList];
    }

    localStorage.setItem(`${STORAGE_KEY}_${tenantId}`, JSON.stringify(updatedList));
    return updatedList;
  } catch (e) {
    console.warn('Error saving workflow to DB:', e);
    return [];
  }
}

export function deleteWorkflowFromDb(
  id: string,
  tenantId: string = 'default_tenant'
): WorkflowRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const currentList = getWorkflowsFromDb(tenantId);
    const updatedList = currentList.filter((w) => w.id !== id);
    localStorage.setItem(`${STORAGE_KEY}_${tenantId}`, JSON.stringify(updatedList));
    return updatedList;
  } catch (e) {
    console.warn('Error deleting workflow from DB:', e);
    return [];
  }
}

export function toggleWorkflowStatusInDb(
  id: string,
  tenantId: string = 'default_tenant'
): WorkflowRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const currentList = getWorkflowsFromDb(tenantId);
    const updatedList = currentList.map((w) => {
      if (w.id === id) {
        return {
          ...w,
          status: !w.status,
          statusMeta: 'Just now by Admin'
        };
      }
      return w;
    });
    localStorage.setItem(`${STORAGE_KEY}_${tenantId}`, JSON.stringify(updatedList));
    return updatedList;
  } catch (e) {
    console.warn('Error toggling workflow in DB:', e);
    return [];
  }
}
