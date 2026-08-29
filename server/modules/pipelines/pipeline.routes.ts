import { Router } from 'express';
import { pipelineController } from './pipeline.controller';

const router = Router();

router.get('/conversions/settings', (req, res) => pipelineController.getSettings(req, res));
router.post('/conversions/settings', (req, res) => pipelineController.updateSettings(req, res));
router.get('/conversions/queue', (req, res) => pipelineController.getQueue(req, res));
router.post('/conversions/dispatch', (req, res) => pipelineController.dispatchConversion(req, res));
router.post('/conversions/retry-all', (req, res) => pipelineController.retryAll(req, res));
router.get('/analytics/campaign-quality', (req, res) => pipelineController.getCampaignQuality(req, res));

export default router;
