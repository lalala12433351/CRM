import { executeAwsQuery } from '../../config/database';
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

export async function initializePaymentTables(): Promise<void> {
  try {
    await executeAwsQuery(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id VARCHAR(128) PRIMARY KEY,
        client_id VARCHAR(128) NOT NULL DEFAULT 'default_admin',
        order_id VARCHAR(128),
        payment_id VARCHAR(128),
        amount NUMERIC(12,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(32) DEFAULT 'created',
        payment_method VARCHAR(64),
        description TEXT,
        lead_id VARCHAR(128),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_client ON payment_transactions(client_id);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
    `);
    logger.info('⚡ Payment transactions table initialized in AWS Aurora RDS');
  } catch (err: any) {
    logger.warn('Payment table initialization notice:', err?.message || err);
  }
}

export async function savePaymentTransaction(tx: PaymentTransactionRecord): Promise<void> {
  const query = `
    INSERT INTO payment_transactions 
      (id, client_id, order_id, payment_id, amount, currency, status, payment_method, description, lead_id, metadata, updated_at)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET
      payment_id = EXCLUDED.payment_id,
      status = EXCLUDED.status,
      payment_method = EXCLUDED.payment_method,
      metadata = EXCLUDED.metadata,
      updated_at = CURRENT_TIMESTAMP;
  `;
  await executeAwsQuery(query, [
    tx.id,
    tx.clientId || 'default_admin',
    tx.orderId || null,
    tx.paymentId || null,
    tx.amount,
    tx.currency || 'INR',
    tx.status,
    tx.paymentMethod || 'Razorpay',
    tx.description || null,
    tx.leadId || null,
    JSON.stringify(tx.metadata || {})
  ]);
}

export async function getPaymentTransactions(clientId: string): Promise<PaymentTransactionRecord[]> {
  try {
    const res = await executeAwsQuery(
      `SELECT * FROM payment_transactions WHERE client_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [clientId]
    );
    if (!res || !res.rows) return [];
    return res.rows.map((row: any) => ({
      id: row.id,
      clientId: row.client_id,
      orderId: row.order_id,
      paymentId: row.payment_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      paymentMethod: row.payment_method,
      description: row.description,
      leadId: row.lead_id,
      metadata: row.metadata,
      createdAt: row.created_at
    }));
  } catch (err: any) {
    logger.warn('Failed to fetch payment transactions:', err?.message || err);
    return [];
  }
}
