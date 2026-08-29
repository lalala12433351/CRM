import { Request, Response } from 'express';
import { aiService } from './ai.service';
import { logger } from '../../utils/logger';

export class AiController {
  public async scoreLead(req: Request, res: Response) {
    try {
      const { lead } = req.body;
      if (!lead) return res.status(400).json({ error: 'Lead details required' });
      const result = await aiService.scoreLead(lead);
      res.json(result);
    } catch (err: any) {
      logger.error('Error in /api/ai/score-lead:', err);
      res.status(500).json({ error: err.message || 'Failed to score lead' });
    }
  }

  public async transcribeCall(req: Request, res: Response) {
    try {
      const result = await aiService.transcribeCall(req.body);
      res.json(result);
    } catch (err: any) {
      logger.error('Error in /api/ai/transcribe-call:', err);
      res.status(500).json({ error: err.message || 'Failed to transcribe call' });
    }
  }

  public async generateWhatsApp(req: Request, res: Response) {
    try {
      const result = await aiService.generateWhatsApp(req.body);
      res.json(result);
    } catch (err: any) {
      logger.error('Error in /api/ai/generate-whatsapp:', err);
      res.status(500).json({ error: err.message || 'Failed to generate message' });
    }
  }

  public async voiceBotInterview(req: Request, res: Response) {
    try {
      const result = await aiService.voiceBotInterview(req.body);
      res.json(result);
    } catch (err: any) {
      logger.error('Error in /api/ai/voice-bot-interview:', err);
      res.status(500).json({ error: err.message || 'Failed voice bot turn' });
    }
  }

  public async businessInsights(req: Request, res: Response) {
    try {
      const result = await aiService.businessInsights(req.body);
      res.json(result);
    } catch (err: any) {
      logger.error('Error in /api/ai/business-insights:', err);
      res.status(500).json({ error: err.message || 'Failed to get insights' });
    }
  }
}

export const aiController = new AiController();
