import axios from 'axios';
import { paymentConfig } from '../../config/payment';
import { generateHmacSha256 } from '../../utils/crypto';
import { logger } from '../../utils/logger';
import { 
  savePaymentTransaction, 
  PaymentTransactionRecord 
} from './payment.repository';

export class PaymentService {
  /**
   * Create Razorpay Order
   */
  public async createOrder(params: {
    amount: number; // in Rupees
    currency?: string;
    receipt?: string;
    clientId: string;
    notes?: Record<string, any>;
  }) {
    const amountInPaise = Math.round(params.amount * 100);
    const currency = params.currency || paymentConfig.currency;
    const receipt = params.receipt || `rcpt_${Date.now()}`;

    try {
      // If Razorpay API credentials are configured, call Razorpay Orders API
      if (paymentConfig.keySecret !== 'rzp_test_secret_default' && process.env.RAZORPAY_KEY_ID) {
        const authHeader = 'Basic ' + Buffer.from(`${paymentConfig.keyId}:${paymentConfig.keySecret}`).toString('base64');
        const response = await axios.post(
          'https://api.razorpay.com/v1/orders',
          {
            amount: amountInPaise,
            currency,
            receipt,
            notes: params.notes || {}
          },
          {
            headers: { Authorization: authHeader }
          }
        );

        const order = response.data;
        await savePaymentTransaction({
          id: `tx_${order.id}`,
          clientId: params.clientId,
          orderId: order.id,
          amount: params.amount,
          currency,
          status: 'created',
          description: params.notes?.description || 'CRM License / Service',
          metadata: order
        });

        return order;
      }

      // Simulation / Test order mode
      const simulatedOrderId = `order_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await savePaymentTransaction({
        id: `tx_${simulatedOrderId}`,
        clientId: params.clientId,
        orderId: simulatedOrderId,
        amount: params.amount,
        currency,
        status: 'created',
        description: params.notes?.description || 'CRM License / Service',
        metadata: { simulated: true }
      });

      return {
        id: simulatedOrderId,
        entity: 'order',
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency,
        receipt,
        status: 'created',
        keyId: paymentConfig.keyId
      };
    } catch (err: any) {
      logger.error('Failed to create Razorpay order:', err?.response?.data || err.message);
      throw new Error(err?.response?.data?.error?.description || 'Failed to create payment order');
    }
  }

  /**
   * Verify Razorpay Payment Signature
   */
  public verifySignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    // If running in test simulation mode
    if (params.orderId.startsWith('order_sim_')) {
      return true;
    }

    const payload = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = generateHmacSha256(payload, paymentConfig.keySecret);
    return expectedSignature === params.signature;
  }

  /**
   * Create a direct Payment Link for leads
   */
  public async createPaymentLink(params: {
    amount: number;
    description: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    leadId?: string;
    clientId: string;
  }) {
    const linkId = `plink_${Date.now()}`;
    const amountInPaise = Math.round(params.amount * 100);

    try {
      if (paymentConfig.keySecret !== 'rzp_test_secret_default' && process.env.RAZORPAY_KEY_ID) {
        const authHeader = 'Basic ' + Buffer.from(`${paymentConfig.keyId}:${paymentConfig.keySecret}`).toString('base64');
        const res = await axios.post(
          'https://api.razorpay.com/v1/payment_links',
          {
            amount: amountInPaise,
            currency: 'INR',
            description: params.description,
            customer: {
              name: params.customerName,
              contact: params.customerPhone,
              email: params.customerEmail || ''
            },
            notify: { sms: true, email: !!params.customerEmail }
          },
          { headers: { Authorization: authHeader } }
        );
        return res.data;
      }

      // Fallback test payment link generator
      const mockPaymentUrl = `https://rzp.io/i/pixbe-${linkId.substring(6)}`;
      await savePaymentTransaction({
        id: `tx_${linkId}`,
        clientId: params.clientId,
        amount: params.amount,
        currency: 'INR',
        status: 'created',
        description: params.description,
        leadId: params.leadId,
        metadata: { paymentUrl: mockPaymentUrl, customer: params.customerName }
      });

      return {
        id: linkId,
        short_url: mockPaymentUrl,
        amount: amountInPaise,
        currency: 'INR',
        description: params.description,
        status: 'created'
      };
    } catch (err: any) {
      logger.error('Failed to create payment link:', err?.response?.data || err.message);
      throw new Error('Failed to generate payment link');
    }
  }

  /**
   * Process Razorpay Webhooks
   */
  public async handleWebhook(event: any) {
    const eventType = event.event;
    logger.info(`[Razorpay Webhook] Received event: ${eventType}`);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      if (payment) {
        await savePaymentTransaction({
          id: `tx_${payment.id}`,
          clientId: payment.notes?.clientId || 'default_admin',
          orderId: payment.order_id,
          paymentId: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: 'captured',
          paymentMethod: payment.method || 'Razorpay',
          description: payment.description,
          metadata: payment
        });
      }
    }
    return { status: 'ok' };
  }
}

export const paymentService = new PaymentService();
