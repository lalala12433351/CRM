import { fetchWithTenantAuth } from '../lib/auth';
import { getEffectiveTenantId } from './workflowStorage';

export interface StoredApiTemplate {
  id: string;
  tenantId?: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpointUrl: string;
  timeoutSeconds?: number;
  headers: { key: string; value: string }[];
  bodyPayload?: string;
  queryParams?: { key: string; value: string }[];
  authConfig?: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKeyKey?: string;
    apiKeyValue?: string;
    apiKeyLocation?: 'header' | 'query';
  };
  variablesUsed?: string;
  workflow?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

const TEMPLATES_STORAGE_KEY = 'pixbe_crm_templates_db';

/**
 * Synchronously retrieves templates from local cache.
 */
export function getApiTemplates(tenantId?: string): StoredApiTemplate[] {
  const tId = getEffectiveTenantId(tenantId);
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(`${TEMPLATES_STORAGE_KEY}_${tId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[templateStorage] Error reading local templates cache:', e);
  }

  return [];
}

/**
 * Asynchronously fetch templates from the server endpoint /api/templates (persisted in database table templates).
 */
export async function fetchApiTemplatesFromApi(tenantId?: string): Promise<StoredApiTemplate[]> {
  const tId = getEffectiveTenantId(tenantId);
  try {
    const response = await fetchWithTenantAuth('/api/templates', {
      headers: {
        'x-tenant-id': tId
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.templates)) {
        const templates: StoredApiTemplate[] = data.templates;
        if (typeof window !== 'undefined') {
          localStorage.setItem(`${TEMPLATES_STORAGE_KEY}_${tId}`, JSON.stringify(templates));
        }
        return templates;
      }
    }
  } catch (err) {
    console.warn('[templateStorage] Failed to fetch templates from API, falling back to local cache:', err);
  }
  return getApiTemplates(tId);
}

/**
 * Calculates variables referenced within template endpoint URL, headers, and body payload.
 */
export function extractTemplateVariables(template: Partial<StoredApiTemplate>): string {
  const combined = `${template.endpointUrl || ''} ${JSON.stringify(template.headers || [])} ${template.bodyPayload || ''} ${JSON.stringify(template.queryParams || [])}`;
  const matches = combined.match(/\{\{([a-zA-Z0-9_.]+)\}\}/g);
  if (!matches || matches.length === 0) return 'None';
  const uniqueVars = Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, ''))));
  if (uniqueVars.length <= 2) return uniqueVars.join(', ');
  return `${uniqueVars[0]} +${uniqueVars.length - 1}`;
}

/**
 * Saves or updates a template in local cache and persists it into database table templates via POST /api/templates.
 */
export function saveApiTemplate(
  templateData: Partial<StoredApiTemplate>,
  tenantId?: string
): StoredApiTemplate[] {
  const tId = getEffectiveTenantId(tenantId);
  if (typeof window === 'undefined') return [];

  try {
    const currentList = getApiTemplates(tId);
    const existingIndex = currentList.findIndex(
      (t) => t.id === templateData.id || (templateData.name && t.name && t.name.trim().toLowerCase() === templateData.name.trim().toLowerCase())
    );

    const resolvedId = templateData.id || (existingIndex >= 0 ? currentList[existingIndex].id : `tpl-${Date.now()}`);
    const now = new Date().toISOString();

    const record: StoredApiTemplate = {
      id: resolvedId,
      tenantId: tId,
      name: templateData.name || 'My Awesome API',
      method: templateData.method || 'POST',
      endpointUrl: templateData.endpointUrl || '',
      timeoutSeconds: Number(templateData.timeoutSeconds) || 3,
      headers: templateData.headers || [],
      bodyPayload: templateData.bodyPayload || '',
      queryParams: templateData.queryParams || [],
      authConfig: templateData.authConfig || { type: 'none' },
      variablesUsed: extractTemplateVariables(templateData),
      workflow: templateData.workflow || (existingIndex >= 0 ? currentList[existingIndex].workflow : 'None'),
      createdBy: templateData.createdBy || (existingIndex >= 0 ? currentList[existingIndex].createdBy : 'FC'),
      createdAt: existingIndex >= 0 ? currentList[existingIndex].createdAt : (templateData.createdAt || now),
      updatedAt: now
    };

    let updatedList: StoredApiTemplate[];
    if (existingIndex >= 0) {
      updatedList = [...currentList];
      updatedList[existingIndex] = record;
    } else {
      updatedList = [record, ...currentList];
    }

    localStorage.setItem(`${TEMPLATES_STORAGE_KEY}_${tId}`, JSON.stringify(updatedList));

    // Persist to backend database table templates
    fetchWithTenantAuth('/api/templates', {
      method: 'POST',
      body: JSON.stringify(record),
      headers: {
        'x-tenant-id': tId
      }
    }).catch((err) => {
      console.warn('[templateStorage] Async save template to backend error:', err);
    });

    return updatedList;
  } catch (e) {
    console.warn('[templateStorage] Error saving template to DB:', e);
    return [];
  }
}

/**
 * Async version of saveApiTemplate that returns the saved StoredApiTemplate object.
 */
export async function saveApiTemplateAsync(
  templateData: Partial<StoredApiTemplate>,
  tenantId?: string
): Promise<StoredApiTemplate> {
  const tId = getEffectiveTenantId(tenantId);
  const updatedList = saveApiTemplate(templateData, tId);
  const saved = updatedList.find((t) => t.id === templateData.id || t.name === templateData.name) || updatedList[0];
  return saved;
}

/**
 * Deletes a template from local cache and removes it from database table templates via DELETE /api/templates/:id.
 */
export function deleteApiTemplate(
  id: string,
  tenantId?: string
): StoredApiTemplate[] {
  const tId = getEffectiveTenantId(tenantId);
  if (typeof window === 'undefined') return [];

  try {
    const currentList = getApiTemplates(tId);
    const updatedList = currentList.filter((t) => t.id !== id);
    localStorage.setItem(`${TEMPLATES_STORAGE_KEY}_${tId}`, JSON.stringify(updatedList));

    // Persist deletion
    fetchWithTenantAuth(`/api/templates/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'x-tenant-id': tId
      }
    }).catch((err) => {
      console.warn('[templateStorage] Async delete template from backend error:', err);
    });

    return updatedList;
  } catch (e) {
    console.warn('[templateStorage] Error deleting template from DB:', e);
    return [];
  }
}

/**
 * Live test execution for template configuration via /api/templates/test.
 */
export async function testApiTemplate(config: {
  method?: string;
  endpointUrl: string;
  headers?: { key: string; value: string }[];
  bodyPayload?: string;
  queryParams?: { key: string; value: string }[];
  authConfig?: any;
  timeoutSeconds?: number;
}): Promise<{
  success: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  data?: any;
  headers?: Record<string, string>;
  error?: string;
  url?: string;
}> {
  try {
    const response = await fetchWithTenantAuth('/api/templates/test', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    if (response.ok) {
      return await response.json();
    } else {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        status: response.status,
        statusText: response.statusText,
        durationMs: 0,
        error: errData.error || `HTTP ${response.status} Error`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      status: 0,
      statusText: 'Client Network Error',
      durationMs: 0,
      error: err.message || 'Failed to connect to backend test endpoint'
    };
  }
}
