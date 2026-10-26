import { Router, Request, Response } from 'express';
import { db } from '../database/index.js';
import { authenticate } from '../middleware/auth.js';
import { WalletService } from '../services/walletService.js';
import { NotificationService } from '../services/notificationService.js';
import { NOTIFICATION_EVENTS } from '../config/index.js';
import crypto from 'crypto';

const router = Router();

/**
 * Get Referral Program Summary, Link & History
 */
router.get('/summary', authenticate, (req: Request, res: Response): void => {
  try {
    const user = db.prepare('SELECT id, name, referral_code, referred_by FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const wallet = db.prepare('SELECT balance, commission_balance FROM wallets WHERE user_id = ?').get(req.user!.id) as any;
    const settings = db.prepare('SELECT referral_bonus_amount, referral_commission_percent, app_name FROM system_settings LIMIT 1').get() as any;

    // Get all users referred by this user's referral code
    const referredUsers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.tier, u.status, u.created_at,
             u.total_funded, u.vtu_purchases
      FROM users u
      WHERE u.referred_by = ?
      ORDER BY u.created_at DESC
    `).all(user.referral_code) as any[];

    // Calculate total earned
    const totalEarnings = (db.prepare(`
      SELECT SUM(amount) as total FROM ledger_entries
      WHERE user_id = ? AND category IN ('REFERRAL_BONUS', 'COMMISSION_TRANSFER')
    `).get(req.user!.id) as any)?.total || 0;

    const summaryData = {
      referralCode: user.referral_code,
      referralLink: `${req.protocol}://${req.get('host') || 'localhost:3000'}/?ref=${user.referral_code}`,
      referredBy: user.referred_by,
      commissionBalance: wallet?.commission_balance || 0,
      walletBalance: wallet?.balance || 0,
      totalReferredCount: referredUsers.length,
      totalReferralEarnings: totalEarnings,
      referralBonusPerSignup: settings?.referral_bonus_amount || 100,
      referralCommissionPercent: settings?.referral_commission_percent || 1.5
    };

    res.json({
      success: true,
      ...summaryData,
      summary: summaryData,
      referredUsers: referredUsers.map(u => ({
        id: u.id,
        name: u.name,
        emailMasked: u.email ? u.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '***',
        joinedAt: u.created_at,
        tier: u.tier,
        status: u.status,
        vtuVolume: u.vtu_purchases || 0
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Transfer Referral Commission to Main Wallet
 */
router.post('/transfer-commission', authenticate, (req: Request, res: Response): void => {
  try {
    const { amount } = req.body;
    const numAmount = Number(amount);

    const wallet = db.prepare('SELECT id, balance, commission_balance FROM wallets WHERE user_id = ?').get(req.user!.id) as any;
    if (!wallet) {
      res.status(404).json({ success: false, message: 'Wallet not found' });
      return;
    }

    const availableCommission = wallet.commission_balance || 0;

    if (!numAmount || numAmount <= 0) {
      res.status(400).json({ success: false, message: 'Invalid transfer amount' });
      return;
    }

    if (numAmount > availableCommission) {
      res.status(400).json({
        success: false,
        message: `Insufficient commission balance. Available: ₦${availableCommission.toLocaleString('en-NG')}, Requested: ₦${numAmount.toLocaleString('en-NG')}`
      });
      return;
    }

    const now = new Date().toISOString();
    const reference = 'COM-TRF-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // Atomic SQLite transfer
    const newMainBal = wallet.balance + numAmount;
    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      // 1. Deduct from commission_balance
      db.prepare(`
        UPDATE wallets
        SET commission_balance = commission_balance - ?, updated_at = ?
        WHERE user_id = ?
      `).run(numAmount, now, req.user!.id);

      // 2. Credit to main balance
      db.prepare(`
        UPDATE wallets
        SET balance = balance + ?, updated_at = ?
        WHERE user_id = ?
      `).run(numAmount, now, req.user!.id);

      // 3. Double-entry ledger record
      const ledgerId = 'led_' + crypto.randomBytes(8).toString('hex');
      db.prepare(`
        INSERT INTO ledger_entries (
          id, wallet_id, user_id, entry_type, category, amount,
          balance_before, balance_after, reference, description, created_at
        )
        VALUES (?, ?, ?, 'CREDIT', 'COMMISSION_TRANSFER', ?, ?, ?, ?, ?, ?)
      `).run(
        ledgerId,
        wallet.id,
        req.user!.id,
        numAmount,
        wallet.balance,
        newMainBal,
        reference,
        `Transferred ₦${numAmount.toLocaleString('en-NG')} referral commission to main wallet`,
        now
      );

      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    const newBalance = newMainBal;

    NotificationService.dispatch({
      userId: req.user!.id,
      eventType: NOTIFICATION_EVENTS.WALLET_CREDITED,
      title: 'Commission Transferred to Wallet',
      message: `₦${numAmount.toLocaleString('en-NG')} referral commission has been transferred to your primary spending wallet. New Balance: ₦${newBalance.toLocaleString('en-NG')}.`
    });

    res.json({
      success: true,
      message: `₦${numAmount.toLocaleString('en-NG')} successfully moved to your main spending balance.`,
      transferredAmount: numAmount,
      newWalletBalance: newBalance,
      remainingCommissionBalance: availableCommission - numAmount,
      newCommissionBalance: availableCommission - numAmount
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
