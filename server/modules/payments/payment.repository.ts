import { logger } from '../../utils/logger';

export interface PaymentTransactionRecord {
  id: string;
  clientId: string;
  orderId?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  paymentMethod?: string;
  description?: string;
  leadId?: string;
  metadata?: any;
  createdAt?: string;
}

const localPaymentStore = new Map<string, PaymentTransactionRecord>();

export async function initializePaymentTables(): Promise<void> {
  logger.info('⚡ Payment repository initialized (local store)');
}

export async function savePaymentTransaction(tx: PaymentTransactionRecord): Promise<void> {
  const existing = localPaymentStore.get(tx.id);
  localPaymentStore.set(tx.id, {
    ...existing,
    ...tx,
    createdAt: existing?.createdAt || tx.createdAt || new Date().toISOString()
  });
}

export async function getPaymentTransactions(clientId: string): Promise<PaymentTransactionRecord[]> {
  const list: PaymentTransactionRecord[] = [];
  for (const record of localPaymentStore.values()) {
    if (record.clientId === clientId || record.clientId === 'default_admin') {
      list.push(record);
    }
  }
  return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

