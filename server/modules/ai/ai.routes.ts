import { Router } from 'express';
import { aiController } from './ai.controller';

const router = Router();

router.post('/ai/score-lead', (req, res) => aiController.scoreLead(req, res));
router.post('/ai/transcribe-call', (req, res) => aiController.transcribeCall(req, res));
router.post('/ai/generate-whatsapp', (req, res) => aiController.generateWhatsApp(req, res));
router.post('/ai/voice-bot-interview', (req, res) => aiController.voiceBotInterview(req, res));
router.post('/ai/business-insights', (req, res) => aiController.businessInsights(req, res));

export default router;
