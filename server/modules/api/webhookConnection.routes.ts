import { Router, Request, Response } from 'express';
import { requireApiToken } from '../../middleware/apiTokenAuth';
import { leadService } from '../leads/lead.service';
import { logger } from '../../utils/logger';

const router = Router();

// POST /api/webhookconnection/leads
router.post('/leads', requireApiToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const tokenConfig = (req as any).apiTokenConfig;
    
    // Support mapping logic similar to webhook ingestion
    const payload = req.body || {};
    
    // We should parse fields, etc. We can map standard fields.
    const leadData = {
      name: payload.name || payload.full_name || payload.firstName || 'Unknown Webhook Lead',
      phone: payload.phone || payload.phone_number || payload.mobile || '',
      email: payload.email || payload.email_address || '',
      company: payload.company || payload.company_name || '',
      source: payload.source || payload.lead_source || 'Website API',
      ...payload
    };

    // If it's an async request, we could return 202 immediately and process in background.
    // For now, we will perform the db operation synchronously but return a different status code
    // based on the token's configured apiType to fulfill the contract, or we could actually make it async.
    
    // Async vs Sync logic:
    if (tokenConfig.apiType === 'async') {
      res.status(202).json({ success: true, message: 'Lead accepted for processing asynchronously' });
      // Process in background
      Promise.resolve().then(async () => {
        try {
          await leadService.saveLead(tenantId, leadData);
        } catch (e) {
          logger.error('Background async lead creation failed', e);
        }
      });
    } else {
      // Sync processing
      const newLead = await leadService.saveLead(tenantId, leadData);
      res.status(201).json({ success: true, lead: newLead });
    }
  } catch (err: any) {
    logger.error('Error in webhookconnection /leads:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/webhookconnection/leads
// Optional GET support if clients use GET requests with query params for webhooks
router.get('/leads', requireApiToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const tokenConfig = (req as any).apiTokenConfig;
    const payload = req.query || {};

    const leadData = {
      name: (payload.name || payload.full_name || payload.firstName || 'Unknown Webhook Lead') as string,
      phone: (payload.phone || payload.phone_number || payload.mobile || '') as string,
      email: (payload.email || payload.email_address || '') as string,
      company: (payload.company || payload.company_name || '') as string,
      source: (payload.source || payload.lead_source || 'Website API') as string,
      ...payload
    };

    if (tokenConfig.apiType === 'async') {
      res.status(202).json({ success: true, message: 'Lead accepted for processing asynchronously' });
      Promise.resolve().then(async () => {
        try {
          await leadService.saveLead(tenantId, leadData);
        } catch (e) {
          logger.error('Background async lead creation failed', e);
        }
      });
    } else {
      const newLead = await leadService.saveLead(tenantId, leadData);
      res.status(201).json({ success: true, lead: newLead });
    }
  } catch (err: any) {
    logger.error('Error in webhookconnection /leads (GET):', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
