import { fetchWithTenantAuth } from '../lib/auth';

export interface StoredWorkflowAction {
  id: string;
  tenantId?: string;
  actionType: string;
  name?: string;
  teamMember?: string;
  targetTeamMember?: string;
  header?: string;
  body?: string;
  url?: string;
  config?: Record<string, any>;
  variablesUsed?: string[];
  workflowId?: string;
  nodeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const LOCAL_STORAGE_ACTIONS_KEY = 'pixbe_crm_workflow_actions_v1';

export function getLocalSavedActions(actionType?: string): StoredWorkflowAction[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIONS_KEY);
    if (!raw) return [];
    const list: StoredWorkflowAction[] = JSON.parse(raw);
    if (actionType) {
      return list.filter((a) => a.actionType === actionType);
    }
    return list;
  } catch {
    return [];
  }
}

export function saveLocalAction(action: StoredWorkflowAction): void {
  try {
    const current = getLocalSavedActions();
    const filtered = current.filter((a) => a.id !== action.id);
    const updated = [action, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_ACTIONS_KEY, JSON.stringify(updated));
  } catch {}
}

export async function fetchWorkflowActionsFromApi(actionType?: string): Promise<StoredWorkflowAction[]> {
  try {
    const query = actionType ? `?actionType=${encodeURIComponent(actionType)}` : '';
    const res = await fetchWithTenantAuth(`/api/actions${query}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.actions)) {
      localStorage.setItem(LOCAL_STORAGE_ACTIONS_KEY, JSON.stringify(data.actions));
      return data.actions;
    }
  } catch (err) {
    console.warn('Failed to fetch actions from API, using cached:', err);
  }
  return getLocalSavedActions(actionType);
}

export async function saveWorkflowActionToApi(actionData: Partial<StoredWorkflowAction>): Promise<StoredWorkflowAction | null> {
  const localAction: StoredWorkflowAction = {
    id: actionData.id || `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    actionType: actionData.actionType || 'notification_team_member',
    name: actionData.name || 'Push Notification',
    teamMember: actionData.teamMember || 'Assignee',
    targetTeamMember: actionData.targetTeamMember || 'assignee',
    header: actionData.header || '',
    body: actionData.body || '',
    url: actionData.url || '{{LEAD_LINK}}',
    config: actionData.config || {},
    variablesUsed: actionData.variablesUsed || [],
    workflowId: actionData.workflowId,
    nodeId: actionData.nodeId,
    createdAt: actionData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveLocalAction(localAction);

  try {
    const res = await fetchWithTenantAuth('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localAction)
    });
    const data = await res.json();
    if (data.success && data.action) {
      saveLocalAction(data.action);
      return data.action;
    }
  } catch (err) {
    console.warn('Failed to save action to backend API, cached in local store:', err);
  }

  return localAction;
}
