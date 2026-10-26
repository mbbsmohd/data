import crypto from 'crypto';
import { db } from '../database/index.js';
import { WalletService } from './walletService.js';
import { generateReference } from '../utils/crypto.js';

export class SavingsService {
  /**
   * Create or Deposit into SafeBox Locked Savings
   */
  static depositToSafeBox(userId: string, targetTitle: string, amount: number, lockPeriodDays = 30) {
    if (amount < 1000) {
      throw new Error('Minimum deposit for SafeBox savings is ₦1,000.00');
    }

    const reference = generateReference('SAVE');
    // Debit main wallet first
    WalletService.debitWallet({
      userId,
      amount,
      category: 'SAVINGS_DEPOSIT',
      reference,
      description: `Deposit to SafeBox: ${targetTitle}`
    });

    const now = new Date();
    const unlockDate = new Date(now.getTime() + lockPeriodDays * 24 * 60 * 60 * 1000).toISOString();
    const id = 'safe_' + crypto.randomBytes(8).toString('hex');
    const interestRatePa = lockPeriodDays >= 90 ? 18.0 : 15.0;

    db.prepare(`
      INSERT INTO savings_safebox (
        id, user_id, target_title, balance, interest_rate_pa, lock_period_days, unlock_date, total_interest_earned, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 0.0, 'ACTIVE', ?)
    `).run(
      id,
      userId,
      targetTitle,
      amount,
      interestRatePa,
      lockPeriodDays,
      unlockDate,
      now.toISOString()
    );

    return {
      id,
      targetTitle,
      balance: amount,
      interestRatePa,
      lockPeriodDays,
      unlockDate,
      status: 'ACTIVE'
    };
  }

  /**
   * Get user's SafeBox accounts
   */
  static getUserSafeBoxes(userId: string) {
    return db.prepare('SELECT * FROM savings_safebox WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  }

  /**
   * Withdraw from SafeBox to Main Wallet upon maturity
   */
  static withdrawFromSafeBox(safeBoxId: string, userId: string) {
    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      const box = db.prepare('SELECT * FROM savings_safebox WHERE id = ? AND user_id = ?').get(safeBoxId, userId) as any;
      if (!box) throw new Error('SafeBox savings account not found');
      if (box.status !== 'ACTIVE') throw new Error(`SafeBox is already ${box.status}`);

      // Calculate accrued interest: (balance * rate * days) / (365 * 100)
      const interestEarned = Math.round(((box.balance * box.interest_rate_pa * box.lock_period_days) / (365 * 100)) * 100) / 100;
      const totalPayout = Math.round((box.balance + interestEarned) * 100) / 100;

      db.prepare(`
        UPDATE savings_safebox
        SET balance = 0, total_interest_earned = ?, status = 'WITHDRAWN'
        WHERE id = ?
      `).run(interestEarned, box.id);

      db.exec('COMMIT;');

      // Credit main wallet with principal + interest
      const ref = generateReference('WTHDRW');
      const creditResult = WalletService.creditWallet({
        userId,
        amount: totalPayout,
        category: 'SAVINGS_WITHDRAWAL',
        reference: ref,
        description: `SafeBox Maturity Payout: ${box.target_title} (Principal ₦${box.balance} + Interest ₦${interestEarned})`
      });

      return {
        success: true,
        principal: box.balance,
        interestEarned,
        totalPayout,
        newWalletBalance: creditResult.newBalance
      };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
}
