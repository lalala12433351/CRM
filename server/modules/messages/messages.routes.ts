import { Router, Request, Response } from 'express';
import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';

const router = Router();

function tenantIdOf(req: Request): string {
  return (
    (req as any).tenantId ||
    (req.headers['x-tenant-id'] as string) ||
    (req.body?.tenantId as string) ||
    process.env.DEFAULT_TENANT_ID ||
    'default_tenant'
  );
}

router.get('/messages', async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const messages = await multiTenantDb.getMessages(tenantId);
    res.json({ success: true, tenantId, messages });
  } catch (err: any) {
    logger.error('Error fetching messages:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/messages', async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const saved = await multiTenantDb.saveMessage(tenantId, { ...req.body, tenantId });
    res.status(201).json({ success: true, tenantId, message: saved });
  } catch (err: any) {
    logger.error('Error saving message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/whatsapp-templates', async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const templates = await multiTenantDb.getWhatsappTemplates(tenantId);
    res.json({ success: true, tenantId, templates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/whatsapp-templates', async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const saved = await multiTenantDb.saveWhatsappTemplate(tenantId, { ...req.body, tenantId });
    res.status(201).json({ success: true, tenantId, template: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/whatsapp-campaigns', async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const campaigns = await multiTenantDb.getWhatsappCampaigns(tenantId);
    res.json({ success: true, tenantId, campaigns });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/whatsapp-campaigns', async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const saved = await multiTenantDb.saveWhatsappCampaign(tenantId, { ...req.body, tenantId });
    res.status(201).json({ success: true, tenantId, campaign: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
