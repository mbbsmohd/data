import crypto from 'crypto';
import { db } from '../database/index.js';
import { WalletService } from './walletService.js';
import { NotificationService } from './notificationService.js';
import { NOTIFICATION_EVENTS } from '../config/index.js';
import { verifyPassword } from '../utils/crypto.js';
import { SurityValidator } from '../security/SurityValidationEngine.js';

export interface WithdrawalRequestInput {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  pin: string;
  narration?: string;
}

export class WithdrawalService {
  /**
   * Submit Customer Withdrawal Request (Debits wallet & queues for Admin approval)
   */
  static async requestWithdrawal(userId: string, input: WithdrawalRequestInput) {
    const { amount, bankName, accountNumber, accountName, narration } = input;
    const pin = input.pin || (input as any).transactionPin;

    if (!amount || amount < 500) {
      throw new Error('Minimum withdrawal amount is ₦500.00');
    }
    if (amount > 1000000) {
      throw new Error('Maximum withdrawal amount per request is ₦1,000,000.00');
    }
    if (!bankName || !accountNumber || !accountName) {
      throw new Error('Bank Name, 10-digit Account Number, and Account Name are required');
    }

    const nubanCheck = SurityValidator.validateNuban(accountNumber);
    if (!nubanCheck.valid) {
      throw new Error(nubanCheck.error);
    }

    // Verify 4-digit transaction PIN
    const user = db.prepare('SELECT transaction_pin_hash, name, email, phone FROM users WHERE id = ?').get(userId) as any;
    if (!user) throw new Error('User account not found');

    if (!pin) {
      throw new Error('4-digit transaction authorization PIN is required');
    }

    if (user.transaction_pin_hash) {
      const pinValid = await verifyPassword(pin, user.transaction_pin_hash);
      if (!pinValid) {
        throw new Error('Incorrect transaction PIN. Please verify your 4-digit authorization PIN.');
      }
    }

    // Strict Name Matching Check (Anti-Fraud & KYC Compliance)
    const cleanUser = (user.name || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9\s]/g, '').trim();
    const cleanAccount = accountName.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9\s]/g, '').trim();
    const userWords = cleanUser.split(/\s+/).filter((w: string) => w.length > 1);
    const accountWords = cleanAccount.split(/\s+/).filter((w: string) => w.length > 1);

    const commonWords = userWords.filter((w: string) => accountWords.includes(w));
    if (userWords.length > 0 && accountWords.length > 0 && commonWords.length === 0) {
      throw new Error(`Bank account name mismatch: For security and anti-fraud compliance, destination bank account name ("${accountName}") must match your registered account name ("${user.name}"). Third-party payouts are prohibited.`);
    }

    // Check wallet balance
    const wallet = WalletService.getWallet(userId);
    if (wallet.balance < amount) {
      throw new Error(`Insufficient funds: You cannot withdraw ₦${amount.toLocaleString('en-NG')} because your current available balance is only ₦${wallet.balance.toLocaleString('en-NG')}.`);
    }

    const id = 'wd_' + crypto.randomBytes(8).toString('hex');
    const reference = 'WDR-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const now = new Date().toISOString();
    const fee = 0.0; // Zero withdrawal fee for high user satisfaction
    const netAmount = amount - fee;

    // 1. Authoritative double-entry wallet debit
    const debitRes = WalletService.debitWallet({
      userId,
      amount,
      category: 'WITHDRAWAL',
      reference,
      description: `Withdrawal to ${bankName} (${accountNumber} - ${accountName})`
    });

    // 2. Persist in withdrawal_requests
    db.prepare(`
      INSERT INTO withdrawal_requests (
        id, user_id, amount, fee, net_amount, bank_name, account_number, account_name,
        narration, status, admin_notes, payment_reference, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', '', ?, ?, ?)
    `).run(
      id,
      userId,
      amount,
      fee,
      netAmount,
      bankName.trim(),
      accountNumber.trim(),
      accountName.trim(),
      narration || `Wallet withdrawal payout`,
      reference,
      now,
      now
    );

    // 3. Dispatch automated email
    NotificationService.dispatch({
      userId,
      eventType: NOTIFICATION_EVENTS.WALLET_DEBITED,
      title: `Withdrawal Request Received: ₦${amount.toLocaleString('en-NG')}`,
      message: `Hello ${user.name}, your withdrawal request of ₦${amount.toLocaleString('en-NG')} to ${bankName} (${accountNumber} - ${accountName}) has been received and queued for manual processing. Ref: ${reference}.`
    });

    return {
      success: true,
      message: 'Withdrawal request submitted successfully. Processing by administrator.',
      newBalance: debitRes.newBalance,
      withdrawal: {
        id,
        reference,
        amount,
        netAmount,
        bankName,
        accountNumber,
        accountName,
        status: 'PENDING',
        createdAt: now
      }
    };
  }

  /**
   * Get User Withdrawal Requests
   */
  static getUserWithdrawals(userId: string) {
    return db.prepare(`
      SELECT * FROM withdrawal_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId);
  }

  /**
   * Super Admin: Get All Withdrawal Requests
   */
  static getAdminWithdrawals(status?: string) {
    if (status && status !== 'ALL') {
      return db.prepare(`
        SELECT w.*, u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM withdrawal_requests w
        JOIN users u ON w.user_id = u.id
        WHERE w.status = ?
        ORDER BY w.created_at DESC
        LIMIT 100
      `).all(status);
    }

    return db.prepare(`
      SELECT w.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM withdrawal_requests w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
      LIMIT 100
    `).all();
  }

  /**
   * Super Admin: Approve & Mark Paid (Completed)
   */
  static approveWithdrawal(withdrawalId: string, adminId: string, payload: { reference?: string; notes?: string }) {
    const w = db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(withdrawalId) as any;
    if (!w) throw new Error('Withdrawal request not found');

    if (w.status === 'COMPLETED') {
      throw new Error('This withdrawal has already been approved and paid out.');
    }
    if (w.status === 'REJECTED') {
      throw new Error('This withdrawal was already rejected and refunded.');
    }

    const now = new Date().toISOString();
    const payRef = payload.reference || 'PAY_' + Date.now();

    db.prepare(`
      UPDATE withdrawal_requests
      SET status = 'COMPLETED',
          payment_reference = ?,
          admin_notes = ?,
          processed_by = ?,
          processed_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(payRef, payload.notes || 'Payout executed manually by admin', adminId, now, now, withdrawalId);

    // Notify user with email
    NotificationService.dispatch({
      userId: w.user_id,
      eventType: NOTIFICATION_EVENTS.PAYMENT_CONFIRMED_SUCCESS,
      title: `Withdrawal Paid Out: ₦${w.amount.toLocaleString('en-NG')}`,
      message: `Your withdrawal of ₦${w.amount.toLocaleString('en-NG')} has been approved and sent to your bank: ${w.bank_name} (${w.account_number} - ${w.account_name}). Transfer Ref: ${payRef}.`
    });

    return {
      success: true,
      message: 'Withdrawal approved and marked as completed.',
      withdrawalId,
      status: 'COMPLETED',
      reference: payRef
    };
  }

  /**
   * Super Admin: Reject Withdrawal with Automated 100% Wallet Refund
   */
  static rejectWithdrawal(withdrawalId: string, adminId: string, payload: { reason: string }) {
    if (!payload.reason || payload.reason.trim() === '') {
      throw new Error('A rejection reason must be provided for the user notification.');
    }

    const w = db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(withdrawalId) as any;
    if (!w) throw new Error('Withdrawal request not found');

    if (w.status === 'COMPLETED') {
      throw new Error('Cannot reject a completed withdrawal.');
    }
    if (w.status === 'REJECTED') {
      throw new Error('This withdrawal has already been rejected and refunded.');
    }

    const now = new Date().toISOString();

    // 1. Update withdrawal status
    db.prepare(`
      UPDATE withdrawal_requests
      SET status = 'REJECTED',
          admin_notes = ?,
          processed_by = ?,
          processed_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(payload.reason.trim(), adminId, now, now, withdrawalId);

    // 2. Authoritative 100% instant refund to user's wallet
    const refundRef = 'REF_' + (w.payment_reference || w.id);
    WalletService.creditWallet({
      userId: w.user_id,
      amount: w.amount,
      category: 'REFUND',
      reference: refundRef,
      description: `Refund: Withdrawal rejected (${payload.reason})`
    });

    // 3. Notify user via email
    NotificationService.dispatch({
      userId: w.user_id,
      eventType: NOTIFICATION_EVENTS.PAYMENT_FAILED,
      title: `Withdrawal Request Rejected & Refunded (₦${w.amount.toLocaleString('en-NG')})`,
      message: `Your withdrawal request of ₦${w.amount.toLocaleString('en-NG')} was rejected: "${payload.reason}". The full amount of ₦${w.amount.toLocaleString('en-NG')} has been refunded back to your wallet balance.`
    });

    return {
      success: true,
      message: 'Withdrawal rejected and ₦' + w.amount.toFixed(2) + ' was refunded to the user wallet.',
      withdrawalId,
      status: 'REJECTED',
      refundRef
    };
  }
}
