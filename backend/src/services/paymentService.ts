import crypto from 'crypto';
import { db } from '../database/index.js';
import { WalletService } from './walletService.js';
import { NotificationService } from './notificationService.js';
import { NOTIFICATION_EVENTS } from '../config/index.js';
import { generateReference } from '../utils/crypto.js';

export class PaymentService {
  /**
   * Create a new payment request for wallet funding
   */
  static createPaymentRequest(userId: string, amount: number, gateway: 'monnify' | 'paystack' | 'flutterwave' | 'bank_transfer') {
    if (amount < 100) {
      throw new Error('Minimum funding amount is ₦100.00');
    }

    const reference = generateReference('FUND');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hr expiry
    const id = 'prq_' + crypto.randomBytes(8).toString('hex');

    // Authoritative virtual account retrieval (Never fake random account numbers)
    const user = db.prepare('SELECT virtual_account_bank, virtual_account_number, virtual_account_name, name FROM users WHERE id = ?').get(userId) as any;
    const corporateGateway = db.prepare("SELECT bank_name, account_number, account_name FROM payment_gateways WHERE id = 'manual_bank' OR is_default = 1 LIMIT 1").get() as any;

    let virtualAccountNumber: string | null = null;
    let virtualBankName: string | null = null;
    let virtualAccountName: string | null = null;

    if (user?.virtual_account_number && user?.virtual_account_bank) {
      virtualAccountNumber = user.virtual_account_number;
      virtualBankName = user.virtual_account_bank;
      virtualAccountName = user.virtual_account_name || user.name;
    } else if (corporateGateway?.account_number) {
      virtualAccountNumber = corporateGateway.account_number;
      virtualBankName = corporateGateway.bank_name || 'Moniepoint MFB';
      virtualAccountName = corporateGateway.account_name || 'BUKAR DATA SUB LTD';
    }

    db.prepare(`
      INSERT INTO payment_requests (
        id, user_id, reference, amount, currency, gateway, status,
        virtual_account_number, virtual_bank_name, virtual_account_name, expires_at, created_at
      )
      VALUES (?, ?, ?, ?, 'NGN', ?, 'PENDING', ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      reference,
      amount,
      gateway,
      virtualAccountNumber,
      virtualBankName,
      virtualAccountName,
      expiresAt,
      now
    );

    // Dispatch PAYMENT_REQUEST_CREATED notification
    NotificationService.dispatch({
      userId,
      eventType: NOTIFICATION_EVENTS.PAYMENT_REQUEST_CREATED,
      title: 'Payment Request Created',
      message: `A payment request of ₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} has been initiated via ${gateway.toUpperCase()}. Reference: ${reference}`,
      amount,
      reference,
      metadata: { gateway, virtualAccountNumber, virtualBankName, expiresAt }
    });

    return {
      id,
      reference,
      amount,
      gateway,
      virtualAccountNumber,
      virtualBankName,
      virtualAccountName,
      expiresAt,
      checkoutUrl: `/checkout/${reference}`
    };
  }

  /**
   * Complete payment (Webhook or Sandbox instant verification)
   * Prevents double-crediting atomically
   */
  static completePayment(reference: string, gatewayReference?: string) {
    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      const payment = db.prepare(`
        SELECT id, user_id, amount, status, gateway
        FROM payment_requests WHERE reference = ?
      `).get(reference) as {
        id: string;
        user_id: string;
        amount: number;
        status: string;
        gateway: string;
      } | undefined;

      if (!payment) {
        throw new Error('Payment request not found');
      }

      if (payment.status === 'SUCCESSFUL') {
        db.exec('COMMIT;');
        return { success: true, alreadyProcessed: true, message: 'Payment was already processed' };
      }

      const now = new Date().toISOString();
      const actualGatewayRef = gatewayReference || 'GW-' + crypto.randomBytes(6).toString('hex').toUpperCase();

      // Mark payment request as successful
      db.prepare(`
        UPDATE payment_requests
        SET status = 'SUCCESSFUL', gateway_reference = ?, paid_at = ?
        WHERE id = ?
      `).run(actualGatewayRef, now, payment.id);

      db.exec('COMMIT;');

      // Now credit user's wallet atomically through double-entry ledger
      const creditResult = WalletService.creditWallet({
        userId: payment.user_id,
        amount: payment.amount,
        category: 'WALLET_FUNDING',
        reference,
        description: `Automated Wallet Funding via ${payment.gateway.toUpperCase()}`
      });

      // Dispatch PAYMENT_CONFIRMED_SUCCESS & WALLET_FUNDING_CONFIRMED
      NotificationService.dispatch({
        userId: payment.user_id,
        eventType: NOTIFICATION_EVENTS.PAYMENT_CONFIRMED_SUCCESS,
        title: 'Payment Confirmed & Wallet Credited',
        message: `Your payment of ₦${payment.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} has been confirmed. Your wallet balance is now ₦${creditResult.newBalance.toFixed(2)}.`,
        amount: payment.amount,
        reference,
        metadata: { gateway: payment.gateway, gatewayReference: actualGatewayRef }
      });

      return {
        success: true,
        reference,
        amount: payment.amount,
        newBalance: creditResult.newBalance
      };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Verify Webhook Signature (e.g. Paystack / Monnify HMAC SHA512)
   */
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  }
}
