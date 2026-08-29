import { logger } from '../utils/logger';

export interface WebhookEventJob {
  id: string;
  source: string;
  payload: any;
  receivedAt: string;
}

type WebhookHandler = (job: WebhookEventJob) => Promise<void>;

class WebhookProcessingQueue {
  private queue: WebhookEventJob[] = [];
  private isProcessing = false;
  private handlers: WebhookHandler[] = [];

  public registerWorker(handler: WebhookHandler) {
    this.handlers.push(handler);
  }

  public async add(event: WebhookEventJob) {
    this.queue.push(event);
    logger.debug(`[Webhook Queue] Event queued: ${event.source} (ID: ${event.id})`);
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
      } catch (err: any) {
        logger.error(`[Webhook Queue] Processing error:`, err?.message || err);
      }
    }

    this.isProcessing = false;
    if (this.queue.length > 0) {
      setImmediate(() => this.processNext());
    }
  }
}

export const webhookProcessingQueue = new WebhookProcessingQueue();
