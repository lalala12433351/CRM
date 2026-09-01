import { logger } from '../utils/logger';

export interface LeadJobData {
  leadId: string;
  leadData: any;
  tenantId?: string;
  source?: string;
}

type JobHandler = (data: LeadJobData) => Promise<void>;

class LeadIngestionQueue {
  private queue: LeadJobData[] = [];
  private isProcessing = false;
  private handlers: JobHandler[] = [];

  public registerWorker(handler: JobHandler) {
    this.handlers.push(handler);
  }

  public async add(job: LeadJobData) {
    this.queue.push(job);
    logger.info(`[Queue] Lead job added to queue: ${job.leadId} (Queue size: ${this.queue.length})`);
    this.processNext();
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const job = this.queue.shift();
    if (job) {
      try {
        for (const handler of this.handlers) {
          await handler(job);
        }
        logger.info(`[Queue] Successfully processed lead: ${job.leadId}`);
      } catch (err: any) {
        logger.error(`[Queue] Error processing lead ${job.leadId}:`, err?.message || err);
      }
    }

    this.isProcessing = false;
    if (this.queue.length > 0) {
      setImmediate(() => this.processNext());
    }
  }
}

export const leadIngestionQueue = new LeadIngestionQueue();
