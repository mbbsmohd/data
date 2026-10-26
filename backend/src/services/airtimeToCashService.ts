import crypto from 'crypto';
import { db } from '../database/index.js';
import { WalletService } from './walletService.js';
import { NotificationService } from './notificationService.js';
import { NOTIFICATION_EVENTS } from '../config/index.js';
import { generateReference } from '../utils/crypto.js';

export class AirtimeToCashService {
  /**
   * Submit an Airtime-to-Cash conversion request
   */
  static submitRequest(userId: string, network: string, senderPhone: string, airtimeAmount: number) {
    if (airtimeAmount < 500) {
      throw new Error('Minimum airtime conversion amount is ₦500.00');
    }

    const ratePercent = 85.0; // 85% cash conversion rate
    const cashValue = Math.round((airtimeAmount * (ratePercent / 100)) * 100) / 100;
    const reference = generateReference('A2C');
    const now = new Date().toISOString();
    const id = 'a2c_' + crypto.randomBytes(8).toString('hex');

    // Designated receiver phone number from SIM Hosting pool
    const receiverSim = db.prepare(`
      SELECT phone_number FROM sim_hosts
      WHERE network = ? AND status = 'ONLINE'
      LIMIT 1
    `).get(network) as { phone_number: string } | undefined;

    const designatedReceiver = receiverSim ? receiverSim.phone_number : '09131797675';

    db.prepare(`
      INSERT INTO airtime_to_cash_orders (
        id, user_id, reference, network, sender_phone, designated_receiver_phone,
        airtime_amount, cash_value, rate_percent, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).run(
      id,
      userId,
      reference,
      network,
      senderPhone,
      designatedReceiver,
      airtimeAmount,
      cashValue,
      ratePercent,
      now,
      now
    );

    NotificationService.dispatch({
      userId,
      eventType: NOTIFICATION_EVENTS.VTU_TRANSACTION_RECEIVED,
      title: 'Airtime to Cash Request Received',
      message: `Your request to convert ₦${airtimeAmount} ${network} airtime for ₦${cashValue} cash has been received. Please transfer airtime to ${designatedReceiver}. Reference: ${reference}`,
      amount: cashValue,
      reference,
      metadata: { designatedReceiver, network, senderPhone }
    });

    return {
      id,
      reference,
      network,
      senderPhone,
      designatedReceiverPhone: designatedReceiver,
      airtimeAmount,
      cashValue,
      ratePercent,
      status: 'PENDING',
      instructions: `Transfer ₦${airtimeAmount} ${network} airtime from ${senderPhone} to our designated line: ${designatedReceiver}. Your wallet will be credited with ₦${cashValue} automatically once verified.`
    };
  }

  /**
   * Approve Airtime-to-Cash order and credit wallet (Admin / Automatic Telecom USSD callback)
   */
  static approveOrder(orderId: string, adminNotes?: string) {
    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      const order = db.prepare('SELECT * FROM airtime_to_cash_orders WHERE id = ?').get(orderId) as any;
      if (!order) throw new Error('Order not found');
      if (order.status !== 'PENDING') throw new Error(`Order is already ${order.status}`);

      const now = new Date().toISOString();
      db.prepare(`
        UPDATE airtime_to_cash_orders
        SET status = 'APPROVED_CREDITED', admin_notes = ?, updated_at = ?
        WHERE id = ?
      `).run(adminNotes || 'Airtime transfer verified successfully', now, order.id);

      db.exec('COMMIT;');

      // Credit customer wallet atomically
      const creditResult = WalletService.creditWallet({
        userId: order.user_id,
        amount: order.cash_value,
        category: 'AIRTIME_CASH',
        reference: order.reference,
        description: `Airtime to Cash Conversion (${order.network} ₦${order.airtime_amount})`
      });

      NotificationService.dispatch({
        userId: order.user_id,
        eventType: NOTIFICATION_EVENTS.WALLET_CREDITED,
        title: 'Airtime to Cash Approved',
        message: `Your airtime transfer has been confirmed! ₦${order.cash_value} has been credited to your wallet.`,
        amount: order.cash_value,
        reference: order.reference,
        metadata: { newBalance: creditResult.newBalance }
      });

      return { success: true, orderId, newBalance: creditResult.newBalance };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Get all orders (for admin review or user list)
   */
  static getOrders(userId?: string) {
    if (userId) {
      return db.prepare('SELECT * FROM airtime_to_cash_orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    }
    return db.prepare('SELECT a.*, u.name as user_name, u.email as user_email FROM airtime_to_cash_orders a JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC').all();
  }
}
