import crypto from 'crypto';
import { db } from '../database/index.js';
import { NotificationService } from './notificationService.js';
import { NOTIFICATION_EVENTS } from '../config/index.js';

export interface WalletTransactionInput {
  userId: string;
  amount: number;
  category: 'WALLET_FUNDING' | 'VTU_PURCHASE' | 'AIRTIME_CASH' | 'TRANSFER' | 'COMMISSION_PAYOUT' | 'REFUND' | 'ADJUSTMENT' | 'SAVINGS_DEPOSIT' | 'SAVINGS_WITHDRAWAL' | 'WITHDRAWAL' | 'TIER_UPGRADE';
  reference: string;
  description: string;
}

export class WalletService {
  /**
   * Get wallet balance for a user
   */
  static getWallet(userId: string) {
    let wallet = db.prepare('SELECT id, user_id, balance, commission_balance, currency, is_locked FROM wallets WHERE user_id = ?').get(userId) as {
      id: string;
      user_id: string;
      balance: number;
      commission_balance: number;
      currency: string;
      is_locked: number;
    } | undefined;

    if (!wallet) {
      // Auto-create wallet if missing
      const walletId = 'wal_' + crypto.randomBytes(8).toString('hex');
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO wallets (id, user_id, balance, commission_balance, currency, is_locked, created_at, updated_at)
        VALUES (?, ?, 0.0, 0.0, 'NGN', 0, ?, ?)
      `).run(walletId, userId, now, now);

      wallet = {
        id: walletId,
        user_id: userId,
        balance: 0.0,
        commission_balance: 0.0,
        currency: 'NGN',
        is_locked: 0
      };
    }

    return wallet;
  }

  /**
   * Authoritative Atomic Balance Credit (Double-Entry Ledger)
   */
  static creditWallet(input: WalletTransactionInput): { success: boolean; newBalance: number; ledgerId: string } {
    const { userId, amount, category, reference, description } = input;
    if (amount <= 0) {
      throw new Error('Credit amount must be greater than zero');
    }

    const now = new Date().toISOString();
    const ledgerId = 'led_' + crypto.randomBytes(8).toString('hex');

    // Atomic execution
    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      const wallet = db.prepare('SELECT id, balance, is_locked FROM wallets WHERE user_id = ?').get(userId) as {
        id: string;
        balance: number;
        is_locked: number;
      } | undefined;

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.is_locked) {
        throw new Error('Wallet is locked by administrator. Financial transactions are restricted.');
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = Math.round((balanceBefore + amount) * 100) / 100;

      // Update wallet balance
      db.prepare(`
        UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?
      `).run(balanceAfter, now, wallet.id);

      // Insert immutable ledger entry
      db.prepare(`
        INSERT INTO ledger_entries (
          id, wallet_id, user_id, entry_type, amount, balance_before, balance_after,
          category, reference, description, created_at
        )
        VALUES (?, ?, ?, 'CREDIT', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ledgerId,
        wallet.id,
        userId,
        amount,
        balanceBefore,
        balanceAfter,
        category,
        reference,
        description,
        now
      );

      // If category is WALLET_FUNDING, update total_funded metric
      if (category === 'WALLET_FUNDING') {
        db.prepare('UPDATE users SET total_funded = total_funded + ? WHERE id = ?').run(amount, userId);
      }

      db.exec('COMMIT;');

      // Dispatch notification
      NotificationService.dispatch({
        userId,
        eventType: NOTIFICATION_EVENTS.WALLET_CREDITED,
        title: 'Wallet Credited Successfully',
        message: `Your wallet has been credited with ₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}. ${description}`,
        amount,
        reference,
        metadata: { newBalance: balanceAfter }
      });

      return { success: true, newBalance: balanceAfter, ledgerId };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Authoritative Atomic Balance Debit (Double-Entry Ledger)
   */
  static debitWallet(input: WalletTransactionInput): { success: boolean; newBalance: number; ledgerId: string } {
    const { userId, amount, category, reference, description } = input;
    if (amount <= 0) {
      throw new Error('Debit amount must be greater than zero');
    }

    const now = new Date().toISOString();
    const ledgerId = 'led_' + crypto.randomBytes(8).toString('hex');

    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      const wallet = db.prepare('SELECT id, balance, is_locked FROM wallets WHERE user_id = ?').get(userId) as {
        id: string;
        balance: number;
        is_locked: number;
      } | undefined;

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.is_locked) {
        throw new Error('Wallet is locked by administrator. Financial transactions are restricted.');
      }

      const balanceBefore = wallet.balance;
      if (balanceBefore < amount) {
        throw new Error(`Insufficient wallet balance. Required: ₦${amount.toFixed(2)}, Available: ₦${balanceBefore.toFixed(2)}`);
      }

      const balanceAfter = Math.round((balanceBefore - amount) * 100) / 100;

      // Update wallet balance
      db.prepare(`
        UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?
      `).run(balanceAfter, now, wallet.id);

      // Insert immutable ledger entry
      db.prepare(`
        INSERT INTO ledger_entries (
          id, wallet_id, user_id, entry_type, amount, balance_before, balance_after,
          category, reference, description, created_at
        )
        VALUES (?, ?, ?, 'DEBIT', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ledgerId,
        wallet.id,
        userId,
        amount,
        balanceBefore,
        balanceAfter,
        category,
        reference,
        description,
        now
      );

      // If category is VTU_PURCHASE, update vtu_purchases metric
      if (category === 'VTU_PURCHASE') {
        db.prepare('UPDATE users SET vtu_purchases = vtu_purchases + ? WHERE id = ?').run(amount, userId);
      }

      db.exec('COMMIT;');

      // Dispatch notification
      NotificationService.dispatch({
        userId,
        eventType: NOTIFICATION_EVENTS.WALLET_DEBITED,
        title: 'Wallet Debited',
        message: `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} has been debited for ${description}. Available balance: ₦${balanceAfter.toFixed(2)}`,
        amount,
        reference,
        metadata: { newBalance: balanceAfter }
      });

      return { success: true, newBalance: balanceAfter, ledgerId };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Transfer Commission to Main Wallet (matching image 2: Commission *** >)
   */
  static transferCommission(userId: string, amount: number) {
    if (amount <= 0) throw new Error('Transfer amount must be positive');

    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      const wallet = db.prepare('SELECT id, balance, commission_balance FROM wallets WHERE user_id = ?').get(userId) as {
        id: string;
        balance: number;
        commission_balance: number;
      } | undefined;

      if (!wallet || wallet.commission_balance < amount) {
        throw new Error('Insufficient commission balance');
      }

      const now = new Date().toISOString();
      const newCommission = Math.round((wallet.commission_balance - amount) * 100) / 100;
      const newBalance = Math.round((wallet.balance + amount) * 100) / 100;
      const ref = 'COM-TRF-' + crypto.randomBytes(4).toString('hex').toUpperCase();

      db.prepare('UPDATE wallets SET balance = ?, commission_balance = ?, updated_at = ? WHERE id = ?').run(
        newBalance,
        newCommission,
        now,
        wallet.id
      );

      db.prepare(`
        INSERT INTO ledger_entries (id, wallet_id, user_id, entry_type, amount, balance_before, balance_after, category, reference, description, created_at)
        VALUES (?, ?, ?, 'CREDIT', ?, ?, ?, 'COMMISSION_PAYOUT', ?, 'Commission transfer to main wallet', ?)
      `).run('led_' + crypto.randomBytes(8).toString('hex'), wallet.id, userId, amount, wallet.balance, newBalance, ref, now);

      db.exec('COMMIT;');
      return { success: true, newBalance, newCommission };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Get ledger entries / transaction history
   */
  static getLedgerHistory(userId: string, limit = 50) {
    return db.prepare(`
      SELECT id, entry_type, amount, balance_before, balance_after, category, reference, description, created_at
      FROM ledger_entries
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);
  }
}
