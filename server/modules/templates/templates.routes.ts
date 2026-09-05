import { Router, Request, Response } from 'express';
import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/templates - Retrieve all templates for current tenant
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const tenantId =
      (req as any).tenantId ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'default_tenant';

    const templates = await multiTenantDb.getTemplates(tenantId);
    res.json({ success: true, tenantId, templates });
  } catch (err: any) {
    logger.error('Error fetching templates:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/templates - Create or update template in database table templates
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const tenantId =
      (req as any).tenantId ||
      (req.headers['x-tenant-id'] as string) ||
      req.body?.tenantId ||
      process.env.DEFAULT_TENANT_ID ||
      'default_tenant';

    const templateData = { ...req.body, tenantId };
    const saved = await multiTenantDb.saveTemplate(tenantId, templateData);
    res.status(201).json({ success: true, tenantId, template: saved });
  } catch (err: any) {
    logger.error('Error saving template:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/templates/:id - Delete template from database
router.delete('/templates/:id', async (req: Request, res: Response) => {
  try {
    const tenantId =
      (req as any).tenantId ||
      (req.headers['x-tenant-id'] as string) ||
      process.env.DEFAULT_TENANT_ID ||
      'default_tenant';

    const success = await multiTenantDb.deleteTemplate(tenantId, req.params.id);
    res.json({ success, message: success ? 'Template deleted successfully' : 'Template not found' });
  } catch (err: any) {
    logger.error('Error deleting template:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/templates/test - Live test execution for an API template configuration
router.post('/templates/test', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      method = 'POST',
      endpointUrl,
      headers = [],
      bodyPayload = '',
      queryParams = [],
      authConfig = { type: 'none' },
      timeoutSeconds = 3
    } = req.body;

    if (!endpointUrl) {
      return res.status(400).json({
        success: false,
        error: 'API Endpoint URL is required'
      });
    }

    // Build query URL
    let targetUrl = endpointUrl.trim();
    if (queryParams && Array.isArray(queryParams) && queryParams.length > 0) {
      const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
      for (const q of queryParams) {
        if (q.key && q.key.trim()) {
          urlObj.searchParams.set(q.key.trim(), q.value || '');
        }
      }
      targetUrl = urlObj.toString();
    }

    // Build headers
    const reqHeaders: Record<string, string> = {
      'User-Agent': 'Pixbe-CRM-Workflow-Runner/1.0'
    };

    if (Array.isArray(headers)) {
      for (const h of headers) {
        if (h.key && h.key.trim()) {
          reqHeaders[h.key.trim()] = h.value || '';
        }
      }
    }

    // Apply Auth
    if (authConfig?.type === 'bearer' && authConfig.token) {
      reqHeaders['Authorization'] = `Bearer ${authConfig.token}`;
    } else if (authConfig?.type === 'basic' && authConfig.username) {
      const creds = Buffer.from(`${authConfig.username}:${authConfig.password || ''}`).toString('base64');
      reqHeaders['Authorization'] = `Basic ${creds}`;
    } else if (authConfig?.type === 'apikey' && authConfig.apiKeyKey) {
      if (authConfig.apiKeyLocation === 'query') {
        const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
        urlObj.searchParams.set(authConfig.apiKeyKey, authConfig.apiKeyValue || '');
        targetUrl = urlObj.toString();
      } else {
        reqHeaders[authConfig.apiKeyKey] = authConfig.apiKeyValue || '';
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.max(1, timeoutSeconds) * 1000);

    const fetchOptions: RequestInit = {
      method: (method || 'POST').toUpperCase(),
      headers: reqHeaders,
      signal: controller.signal
    };

    if (['POST', 'PUT', 'PATCH'].includes(fetchOptions.method!) && bodyPayload) {
      fetchOptions.body = typeof bodyPayload === 'string' ? bodyPayload : JSON.stringify(bodyPayload);
      if (!reqHeaders['Content-Type'] && !reqHeaders['content-type']) {
        reqHeaders['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeout);
    const durationMs = Date.now() - startTime;

    let responseData: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
    } else {
      responseData = await response.text();
    }

    const resHeadersObj: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      resHeadersObj[key] = val;
    });

    res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      data: responseData,
      headers: resHeadersObj,
      url: targetUrl
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    logger.warn('[templates/test] Test execution failed:', err?.message || err);
    res.status(200).json({
      success: false,
      status: 0,
      statusText: err.name === 'AbortError' ? 'Request Timeout' : 'Network Error',
      durationMs,
      error: err.message || 'Failed to reach endpoint URL'
    });
  }
});

export default router;
