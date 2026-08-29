import { Request, Response } from 'express';
import { paymentService } from './payment.service';
import { getPaymentTransactions, savePaymentTransaction } from './payment.repository';
import { logger } from '../../utils/logger';

export class PaymentController {
  public async createOrder(req: any, res: Response) {
    try {
      const { amount, receipt, notes } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid amount' });
      }

      const clientId = req.tenantId || req.user?.id || 'default_admin';
      const order = await paymentService.createOrder({
        amount: Number(amount),
        receipt,
        clientId,
        notes
      });

      res.status(201).json({ success: true, order });
    } catch (err: any) {
      logger.error('Payment create-order error:', err?.message || err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async verifyPayment(req: any, res: Response) {
    try {
      const { orderId, paymentId, signature, amount, paymentMethod } = req.body;
      const isValid = paymentService.verifySignature({
        orderId,
        paymentId,
        signature
      });

      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Invalid payment signature' });
      }

      const clientId = req.tenantId || req.user?.id || 'default_admin';
      await savePaymentTransaction({
        id: `tx_${paymentId || Date.now()}`,
        clientId,
        orderId,
        paymentId,
        amount: Number(amount) || 0,
        currency: 'INR',
        status: 'captured',
        paymentMethod: paymentMethod || 'Razorpay',
        description: 'CRM Subscription License Payment'
      });

      res.json({
        success: true,
        message: 'Payment verified and transaction recorded successfully',
        transactionId: paymentId
      });
    } catch (err: any) {
      logger.error('Payment verify error:', err?.message || err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async createPaymentLink(req: any, res: Response) {
    try {
      const { amount, description, customerName, customerPhone, customerEmail, leadId } = req.body;
      if (!amount || !customerName || !customerPhone) {
        return res.status(400).json({ success: false, error: 'Amount, customerName, and customerPhone are required' });
      }

      const clientId = req.tenantId || req.user?.id || 'default_admin';
      const link = await paymentService.createPaymentLink({
        amount: Number(amount),
        description: description || 'Quote / Service Fee',
        customerName,
        customerPhone,
        customerEmail,
        leadId,
        clientId
      });

      res.status(201).json({ success: true, paymentLink: link });
    } catch (err: any) {
      logger.error('Payment create-link error:', err?.message || err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async getTransactions(req: any, res: Response) {
    try {
      const clientId = req.tenantId || req.user?.id || 'default_admin';
      const transactions = await getPaymentTransactions(clientId);
      res.json({ success: true, transactions });
    } catch (err: any) {
      logger.error('Get transactions error:', err?.message || err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async handleWebhook(req: Request, res: Response) {
    try {
      await paymentService.handleWebhook(req.body);
      res.status(200).json({ status: 'ok' });
    } catch (err: any) {
      logger.error('Razorpay webhook error:', err?.message || err);
      res.status(500).json({ status: 'error' });
    }
  }
}

export const paymentController = new PaymentController();
