import { Router, Request, Response } from 'express';
import { pipelineController } from './pipeline.controller';
import { multiTenantDb } from '../../services/multiTenantDb';

const router = Router();

// GET /api/pipelines - Fetch pipeline stages scoped to tenantId
router.get('/pipelines', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const stages = await multiTenantDb.getPipelines(tenantId);
    res.json({ success: true, tenantId, stages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/pipelines - Save pipeline stages scoped to tenantId
router.post('/pipelines', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || req.body?.tenantId || process.env.DEFAULT_TENANT_ID || 'default_tenant';
    const stages = Array.isArray(req.body) ? req.body : req.body.stages || [];
    const saved = await multiTenantDb.savePipelines(tenantId, stages);
    res.json({ success: true, tenantId, stages: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/conversions/settings', (req, res) => pipelineController.getSettings(req, res));
router.post('/conversions/settings', (req, res) => pipelineController.updateSettings(req, res));
router.get('/conversions/queue', (req, res) => pipelineController.getQueue(req, res));
router.post('/conversions/dispatch', (req, res) => pipelineController.dispatchConversion(req, res));
router.post('/conversions/retry-all', (req, res) => pipelineController.retryAll(req, res));
router.get('/analytics/campaign-quality', (req, res) => pipelineController.getCampaignQuality(req, res));

export default router;
