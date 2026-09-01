import { Request, Response } from 'express';
import { pipelineService } from './pipeline.service';

export class PipelineController {
  public getSettings(req: Request, res: Response) {
    res.json(pipelineService.getSettings());
  }

  public updateSettings(req: Request, res: Response) {
    try {
      const updated = pipelineService.updateSettings(req.body);
      res.json({ status: 'success', message: 'Settings updated successfully', settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public getQueue(req: Request, res: Response) {
    const { platform, status } = req.query;
    res.json(pipelineService.getQueue(platform ? String(platform) : undefined, status ? String(status) : undefined));
  }

  public dispatchConversion(req: Request, res: Response) {
    try {
      const { lead, stageName, value } = req.body;
      if (!lead || !stageName) {
        return res.status(400).json({ error: 'lead and stageName required' });
      }
      const result = pipelineService.dispatchConversion(lead, stageName, value);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public retryAll(req: Request, res: Response) {
    const retriedCount = pipelineService.retryAll();
    res.json({ status: 'success', retriedCount, message: `Successfully reprocessed ${retriedCount} events.` });
  }

  public getCampaignQuality(req: Request, res: Response) {
    res.json({ metrics: pipelineService.getCampaignQualityMetrics() });
  }
}

export const pipelineController = new PipelineController();
