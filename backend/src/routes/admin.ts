import { Router, Request, Response } from 'express';
import fs from 'fs';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/rbac.js';
import { db } from '../database/index.js';
import { CONFIG } from '../config/index.js';
import { WalletService } from '../services/walletService.js';
import { BackupService } from '../services/backupService.js';
import { generateReference } from '../utils/crypto.js';
import { SURITY_RULES, runSurityDiagnosticAudit, SurityValidator } from '../security/SurityValidationEngine.js';

const router = Router();

/**
 * Get Current Admin Scoped Permissions
 */
router.get('/my-permissions', authenticate, (req: Request, res: Response): void => {
  const normRole = (req.user!.role || '').toLowerCase().replace(/[-_]/g, '');
  if (normRole === 'superadmin') {
    res.json({
      success: true,
      role: 'super_admin',
      isSuperAdmin: true,
      permissions: ['*']
    });
    return;
  }
  const subRole = req.user!.sub_admin_role;
  const permissionsBySubRole: Record<string, string[]> = {
    finance: [
      'VIEW_STATS', 'VIEW_ACCOUNTS', 'VIEW_REPORTS', 'EXPORT_REPORTS',
      'VIEW_WITHDRAWALS', 'APPROVE_WITHDRAWALS', 'REJECT_WITHDRAWALS',
      'ADJUST_WALLET', 'VIEW_GATEWAYS'
    ],
    support: [
      'VIEW_STATS', 'VIEW_ACCOUNTS', 'VIEW_USERS', 'CREATE_USERS',
      'EDIT_USERS', 'RESET_CREDENTIALS', 'VIEW_TICKETS'
    ],
    services: [
      'VIEW_STATS', 'VIEW_ACCOUNTS', 'MANAGE_PLANS', 'MANAGE_PROVIDERS',
      'MANAGE_SIMS', 'SERVICE_ROUTING'
    ],
    security: [
      'VIEW_STATS', 'VIEW_ACCOUNTS', 'VIEW_AUDIT_LOGS', 'MANAGE_BACKUPS',
      'VIEW_GATEWAYS', 'MANAGE_SETTINGS'
    ]
  };
  const permissions = (subRole && permissionsBySubRole[subRole]) || [];
  res.json({
    success: true,
    role: 'sub_admin',
    subAdminRole: subRole,
    department: subRole,
    isSuperAdmin: false,
    permissions
  });
});

/**
 * Super Admin Overview Dashboard KPIs
 */
router.get('/stats', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
    const totalFunded = (db.prepare('SELECT SUM(amount) as total FROM ledger_entries WHERE category = "WALLET_FUNDING"').get() as any).total || 0;
    const totalVTU = (db.prepare('SELECT SUM(amount) as total FROM vtu_transactions WHERE status = "COMPLETED"').get() as any).total || 0;
    const activeProviders = (db.prepare('SELECT COUNT(*) as count FROM api_providers WHERE is_active = 1').get() as any).count;
    const hostedSimsOnline = (db.prepare('SELECT COUNT(*) as count FROM sim_hosts WHERE status = "ONLINE"').get() as any).count;
    const pendingKYC = (db.prepare('SELECT COUNT(*) as count FROM kyc_verifications WHERE status = "PENDING_APPROVAL" OR status = "PENDING"').get() as any).count;

    const recentTxns = db.prepare(`
      SELECT v.*, u.name as user_name, u.email as user_email
      FROM vtu_transactions v
      JOIN users u ON v.user_id = u.id
      ORDER BY v.created_at DESC
      LIMIT 10
    `).all();

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalFunded,
        totalVTU,
        activeProviders,
        hostedSimsOnline,
        pendingKYC
      },
      recentTransactions: recentTxns
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * User Management
 */
router.get('/users', authenticate, requirePermission('VIEW_USERS'), (req: Request, res: Response): void => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.sub_admin_role, u.tier, u.status,
             u.account_locked, u.lock_reason, u.last_active_at,
             CASE WHEN u.active_session_id IS NOT NULL THEN 1 ELSE 0 END as has_active_session,
             u.referral_code, u.referred_by, u.total_funded, u.vtu_purchases, u.created_at,
             (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.referral_code) as referral_count,
             w.balance as wallet_balance, w.commission_balance
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      ORDER BY u.created_at DESC
      LIMIT 200
    `).all();
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Create User Account Directly
 */
router.post('/users', authenticate, requirePermission('CREATE_USERS'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role, tier, status, transactionPin, initialBalance } = req.body;
    if (!name || !email || !phone || !password) {
      res.status(400).json({ success: false, message: 'Name, email, phone, and password are required' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?').get(cleanEmail, cleanPhone);
    if (existing) {
      res.status(400).json({ success: false, message: 'Email or phone number already in use' });
      return;
    }

    const { hashPassword } = await import('../utils/crypto.js');
    const crypto = await import('crypto');
    const userId = 'usr_' + crypto.randomBytes(6).toString('hex');
    const passwordHash = await hashPassword(password);
    const pinHash = await hashPassword(transactionPin || '1234');
    const userReferral = 'BDS-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const sessionId = 'sess_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (
        id, name, email, phone, password_hash, role, tier, status,
        transaction_pin_hash, referral_code, active_session_id, last_active_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      name.trim(),
      cleanEmail,
      cleanPhone,
      passwordHash,
      role || 'customer',
      Number(tier) || 1,
      status || 'active',
      pinHash,
      userReferral,
      sessionId,
      now,
      now,
      now
    );

    // Create wallet
    const walId = 'wal_' + crypto.randomBytes(8).toString('hex');
    const initBal = Number(initialBalance) || 0;
    db.prepare(`
      INSERT INTO wallets (id, user_id, balance, commission_balance, currency, is_locked, created_at, updated_at)
      VALUES (?, ?, ?, 0.0, 'NGN', 0, ?, ?)
    `).run(walId, userId, initBal, now, now);

    if (initBal > 0) {
      const ledId = 'led_' + crypto.randomBytes(8).toString('hex');
      db.prepare(`
        INSERT INTO ledger_entries (
          id, wallet_id, user_id, entry_type, category, amount,
          balance_before, balance_after, reference, description, created_at
        )
        VALUES (?, ?, ?, 'CREDIT', 'ADJUSTMENT', ?, 0, ?, ?, ?, ?)
      `).run(
        ledId,
        walId,
        userId,
        initBal,
        initBal,
        'ADM-INIT-' + Date.now(),
        `Initial opening balance grant by admin ${req.user!.email}`,
        now
      );
    }

    res.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: userId,
        name,
        email: cleanEmail,
        phone: cleanPhone,
        role: role || 'customer',
        tier: Number(tier) || 1,
        balance: initBal,
        referralCode: userReferral
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Update User Status / Role
 */
router.post('/users/:id/update-status', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { status, role, subAdminRole, tier } = req.body;
    db.prepare(`
      UPDATE users
      SET status = COALESCE(?, status),
          role = COALESCE(?, role),
          sub_admin_role = ?,
          tier = COALESCE(?, tier)
      WHERE id = ?
    `).run(status, role, subAdminRole || null, tier, id);

    res.json({ success: true, message: 'User updated successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Full Detailed Inspection of User Profile & History
 */
router.get('/users/:id', authenticate, requirePermission('VIEW_USERS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.sub_admin_role, u.tier, u.status,
             u.whatsapp_number, u.referral_code, u.total_funded, u.vtu_purchases,
             u.virtual_account_bank, u.virtual_account_number, u.virtual_account_name,
             u.biometric_enabled, u.two_factor_enabled, u.created_at, u.updated_at,
             w.balance as wallet_balance, w.commission_balance, w.is_locked
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      WHERE u.id = ?
    `).get(id) as any;

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const transactions = db.prepare(`
      SELECT * FROM vtu_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
    `).all(id);

    const ledger = db.prepare(`
      SELECT * FROM ledger_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 25
    `).all(id);

    const withdrawals = db.prepare(`
      SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 15
    `).all(id);

    const referralCount = (db.prepare('SELECT COUNT(*) as count FROM users WHERE referred_by = ?').get(user.referral_code) as any)?.count || 0;

    res.json({
      success: true,
      user,
      transactions,
      ledger,
      withdrawals,
      referralCount,
      data: {
        ...user,
        balance: user.wallet_balance || 0,
        transactions,
        ledger,
        ledgerEntries: ledger,
        withdrawals,
        referralCount,
        virtualAccount: user.virtual_account_number ? {
          bank_name: user.virtual_account_bank,
          account_number: user.virtual_account_number,
          account_name: user.virtual_account_name,
          provider: 'Monnify / Paystack'
        } : null
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Full Edit of User Profile Information
 */
router.put('/users/:id', authenticate, requirePermission('EDIT_USERS'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, subAdminRole, tier, status, address, state, newPassword, newPin } = req.body;
    const now = new Date().toISOString();

    const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existingUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (email || phone) {
      const duplicate = db.prepare('SELECT id FROM users WHERE (email = ? OR phone = ?) AND id != ?').get(email || '', phone || '', id);
      if (duplicate) {
        res.status(400).json({ success: false, message: 'Email or phone number is already registered to another user' });
        return;
      }
    }

    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          role = COALESCE(?, role),
          sub_admin_role = COALESCE(?, sub_admin_role),
          tier = COALESCE(?, tier),
          status = COALESCE(?, status),
          address = COALESCE(?, address),
          state = COALESCE(?, state),
          updated_at = ?
      WHERE id = ?
    `).run(
      name ?? null,
      email ?? null,
      phone ?? null,
      role ?? null,
      subAdminRole ?? null,
      tier !== undefined ? Number(tier) : null,
      status ?? null,
      address ?? null,
      state ?? null,
      now,
      id
    );

    if (newPassword && String(newPassword).length >= 6) {
      const { hashPassword } = await import('../utils/crypto.js');
      const passHash = await hashPassword(String(newPassword));
      db.prepare('UPDATE users SET password_hash = ?, active_session_id = NULL, updated_at = ? WHERE id = ?').run(passHash, now, id);
    }
    if (newPin && /^\d{4}$/.test(String(newPin).trim())) {
      const { hashPassword } = await import('../utils/crypto.js');
      const pinHash = await hashPassword(String(newPin).trim());
      db.prepare('UPDATE users SET transaction_pin_hash = ?, failed_pin_attempts = 0, pin_locked_until = NULL, updated_at = ? WHERE id = ?').run(pinHash, now, id);
    }

    res.json({ success: true, message: 'User profile and credentials updated successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Reset User Password or Transaction PIN
 */
router.post('/users/:id/reset-credentials', authenticate, requirePermission('RESET_CREDENTIALS'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword, newPin } = req.body;
    const { hashPassword } = await import('../utils/crypto.js');
    const now = new Date().toISOString();

    const updates: string[] = [];
    const params: any[] = [];

    if (newPassword && newPassword.length >= 6) {
      const pHash = await hashPassword(newPassword);
      updates.push('password_hash = ?');
      params.push(pHash);
    }

    if (newPin && /^\d{4}$/.test(newPin)) {
      const pinHash = await hashPassword(newPin);
      updates.push('transaction_pin_hash = ?', 'failed_pin_attempts = 0', 'pin_locked_until = NULL');
      params.push(pinHash);
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, message: 'Please provide a valid newPassword (min 6 chars) or newPin (4 digits)' });
      return;
    }

    updates.push('updated_at = ?');
    params.push(now, id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    res.json({ success: true, message: 'User credentials updated successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin & Analytics: Accurate User Registration Statistics
 */
router.get('/users/registration-stats', authenticate, requirePermission('VIEW_USERS'), (req: Request, res: Response): void => {
  try {
    const now = new Date();
    const past7Days = new Date(now.getTime() - 7 * 86400000).toISOString();
    const past30Days = new Date(now.getTime() - 30 * 86400000).toISOString();
    const past90Days = new Date(now.getTime() - 90 * 86400000).toISOString();
    const past365Days = new Date(now.getTime() - 365 * 86400000).toISOString();

    const counts = db.prepare(`
      SELECT
        COUNT(*) as totalUsers,
        SUM(CASE WHEN role != 'super_admin' THEN 1 ELSE 0 END) as totalCustomers,
        SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) as newToday,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as newThisWeek,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as newThisMonth,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as newThisQuarter,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as newThisYear,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeUsers,
        SUM(CASE WHEN status != 'active' THEN 1 ELSE 0 END) as inactiveUsers,
        SUM(CASE WHEN account_locked = 1 THEN 1 ELSE 0 END) as lockedUsers
      FROM users
    `).get(past7Days, past30Days, past90Days, past365Days) as any;

    const kycCounts = db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as verifiedKyc,
        SUM(CASE WHEN status = 'PENDING' OR status = 'PENDING_APPROVAL' THEN 1 ELSE 0 END) as pendingKyc
      FROM kyc_verifications
    `).get() as any;

    res.json({
      success: true,
      stats: {
        totalUsers: counts?.totalUsers || 0,
        totalCustomers: counts?.totalCustomers || 0,
        newToday: counts?.newToday || 0,
        newThisWeek: counts?.newThisWeek || 0,
        newThisMonth: counts?.newThisMonth || 0,
        newThisQuarter: counts?.newThisQuarter || 0,
        newThisYear: counts?.newThisYear || 0,
        activeUsers: counts?.activeUsers || 0,
        inactiveUsers: counts?.inactiveUsers || 0,
        lockedUsers: counts?.lockedUsers || 0,
        verifiedKyc: kycCounts?.verifiedKyc || 0,
        pendingKyc: kycCounts?.pendingKyc || 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin & Security: Lock User Account
 */
router.post('/users/:id/lock', authenticate, requirePermission('EDIT_USERS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const admin = (req as any).user;
    const lockReason = reason?.trim() || 'Suspicious activity or administrative security review';
    const now = new Date().toISOString();

    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    if (user.role === 'super_admin') {
      res.status(403).json({ success: false, message: 'Super Administrator accounts cannot be locked' });
      return;
    }

    db.prepare(`
      UPDATE users
      SET account_locked = 1,
          lock_reason = ?,
          active_session_id = NULL,
          updated_at = ?
      WHERE id = ?
    `).run(lockReason, now, id);

    try {
      db.prepare(`
        INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, details_json, created_at)
        VALUES (?, ?, ?, 'USER_LOCKED', 'user', ?, ?, ?, ?)
      `).run(
        'aud_' + crypto.randomBytes(6).toString('hex'),
        admin.id,
        admin.role,
        id,
        req.ip || '127.0.0.1',
        JSON.stringify({ targetEmail: user.email, reason: lockReason }),
        now
      );

      db.prepare(`
        INSERT INTO security_incidents (id, incident_type, severity, description, target_identifier, status, assigned_to, created_at)
        VALUES (?, 'ACCOUNT_LOCKED', 'HIGH', ?, ?, 'RESOLVED', ?, ?)
      `).run(
        'inc_' + Date.now(),
        `Account locked by admin ${admin.email}: ${lockReason}`,
        user.email,
        admin.email,
        now
      );
    } catch {}

    res.json({
      success: true,
      message: `User account locked and active sessions revoked successfully`,
      user: { id, accountLocked: 1, lockReason }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin & Security: Unlock User Account
 */
router.post('/users/:id/unlock', authenticate, requirePermission('EDIT_USERS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const admin = (req as any).user;
    const now = new Date().toISOString();

    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    db.prepare(`
      UPDATE users
      SET account_locked = 0,
          lock_reason = NULL,
          updated_at = ?
      WHERE id = ?
    `).run(now, id);

    try {
      db.prepare(`
        INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, details_json, created_at)
        VALUES (?, ?, ?, 'USER_UNLOCKED', 'user', ?, ?, ?, ?)
      `).run(
        'aud_' + crypto.randomBytes(6).toString('hex'),
        admin.id,
        admin.role,
        id,
        req.ip || '127.0.0.1',
        JSON.stringify({ targetEmail: user.email }),
        now
      );
    } catch {}

    res.json({
      success: true,
      message: `User account unlocked successfully`,
      user: { id, accountLocked: 0 }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin & Security: Force Revoke All Active Sessions
 */
router.post('/users/:id/revoke-sessions', authenticate, requirePermission('EDIT_USERS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const admin = (req as any).user;
    const now = new Date().toISOString();

    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    db.prepare(`
      UPDATE users
      SET active_session_id = NULL,
          updated_at = ?
      WHERE id = ?
    `).run(now, id);

    try {
      db.prepare(`
        INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, details_json, created_at)
        VALUES (?, ?, ?, 'SESSION_REVOKED', 'user', ?, ?, ?, ?)
      `).run(
        'aud_' + crypto.randomBytes(6).toString('hex'),
        admin.id,
        admin.role,
        id,
        req.ip || '127.0.0.1',
        JSON.stringify({ targetEmail: user.email }),
        now
      );
    } catch {}

    res.json({
      success: true,
      message: `All active sessions revoked for ${user.email}. User will be required to log in again.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin & Security: Login Attempts & Audit Activity Explorer
 */
router.get('/security/login-history', authenticate, requirePermission('VIEW_AUDIT_LOGS'), (req: Request, res: Response): void => {
  try {
    const { search, status, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT lh.id, lh.user_id, lh.email, lh.status, lh.ip_address, lh.user_agent, lh.failure_reason, lh.created_at,
             u.name as user_name, u.role as user_role
      FROM login_history lh
      LEFT JOIN users u ON lh.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (lh.email LIKE ? OR lh.ip_address LIKE ? OR u.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (status) {
      query += ` AND lh.status = ?`;
      params.push(String(status).toUpperCase());
    }

    query += ` ORDER BY lh.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const records = db.prepare(query).all(...params) as any[];

    // Mask IPs for safe viewing (e.g., 192.168.***.***)
    const sanitized = records.map(r => {
      let maskedIp = r.ip_address;
      if (r.ip_address && r.ip_address.includes('.')) {
        const parts = r.ip_address.split('.');
        if (parts.length === 4) {
          maskedIp = `${parts[0]}.${parts[1]}.***.***`;
        }
      }
      return {
        ...r,
        ip_masked: maskedIp
      };
    });

    const totalCount = (db.prepare(`SELECT COUNT(*) as count FROM login_history`).get() as any)?.count || 0;

    res.json({
      success: true,
      totalCount,
      history: sanitized
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Customer Wallets Directory with Balances & Operational Metrics
 */
router.get('/wallets', authenticate, requirePermission('VIEW_ACCOUNTS'), (req: Request, res: Response): void => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT w.id as wallet_id, w.user_id, w.balance, w.commission_balance, w.currency, w.is_locked,
             u.name as user_name, u.email as user_email, u.phone as user_phone, u.role, u.tier, u.status as user_status,
             (SELECT COUNT(*) FROM ledger_entries l WHERE l.user_id = u.id) as ledger_count,
             (SELECT COALESCE(SUM(amount), 0) FROM ledger_entries l WHERE l.user_id = u.id AND l.entry_type = 'CREDIT' AND l.category = 'WALLET_FUNDING') as total_deposited,
             (SELECT COALESCE(SUM(amount), 0) FROM vtu_transactions v WHERE v.user_id = u.id AND v.status = 'COMPLETED') as total_vtu_spent
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR w.id LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status === 'locked') {
      query += ` AND w.is_locked = 1`;
    } else if (status === 'active') {
      query += ` AND w.is_locked = 0`;
    }

    query += ` ORDER BY w.balance DESC LIMIT 150`;

    const wallets = (db.prepare(query) as any).all(...params);
    res.json({ success: true, wallets });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Deep Customer Wallet Inspection 360°
 */
router.get('/wallets/:userId/detail', authenticate, requirePermission('VIEW_ACCOUNTS'), (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;

    const user = db.prepare(`
      SELECT id, name, email, phone, role, tier, status, referral_code, created_at
      FROM users WHERE id = ?
    `).get(userId) as any;

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const wallet = db.prepare(`
      SELECT id, balance, commission_balance, currency, is_locked, created_at, updated_at
      FROM wallets WHERE user_id = ?
    `).get(userId) as any;

    if (!wallet) {
      res.status(404).json({ success: false, message: 'Wallet not found for this user' });
      return;
    }

    // Totals calculations
    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN entry_type = 'CREDIT' AND category = 'WALLET_FUNDING' THEN amount ELSE 0 END), 0) as total_deposits,
        COALESCE(SUM(CASE WHEN entry_type = 'DEBIT' AND category = 'VTU_PURCHASE' THEN amount ELSE 0 END), 0) as total_purchases,
        COALESCE(SUM(CASE WHEN entry_type = 'CREDIT' AND category = 'REFUND' THEN amount ELSE 0 END), 0) as total_refunds,
        COALESCE(SUM(CASE WHEN category = 'ADJUSTMENT' THEN amount ELSE 0 END), 0) as total_adjustments
      FROM ledger_entries
      WHERE user_id = ?
    `).get(userId) as any;

    // Recent 20 immutable double-entry ledger entries
    const ledger = db.prepare(`
      SELECT id, entry_type, amount, balance_before, balance_after, category, reference, description, created_at
      FROM ledger_entries
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 25
    `).all(userId);

    // Recent audited adjustments
    const adjustments = db.prepare(`
      SELECT id, adjustment_type, amount, balance_before, projected_balance, balance_after,
             reason, reference, ticket_reference, requested_by, status, approved_by, approved_at, created_at
      FROM wallet_adjustments
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 15
    `).all(userId);

    res.json({
      success: true,
      walletDetail: {
        user,
        wallet,
        totals,
        ledger,
        adjustments
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Audited Wallet Balance Adjustment Workflow
 * Supports preview projection, old balance -> new balance calculation,
 * atomic double-entry ledger posting, and dual-approval for high-risk operations (>= ₦50,000).
 */
router.post(['/wallet/adjustment', '/wallets/adjustment'], authenticate, requirePermission('ADJUST_WALLET'), (req: Request, res: Response): void => {
  try {
    const { userId, type, amount, reason, ticketReference, idempotencyKey } = req.body;
    const actorRole = (req.user!.role || '').toLowerCase().replace(/[-_]/g, '');
    const isSuperAdmin = actorRole === 'superadmin';
    const actorEmail = req.user!.email;

    if (!userId || !type || !amount || !reason) {
      res.status(400).json({ success: false, message: 'userId, type (CREDIT/DEBIT), amount, and reason required' });
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ success: false, message: 'Valid positive adjustment amount is required' });
      return;
    }

    const wallet = db.prepare('SELECT id, balance, currency, is_locked FROM wallets WHERE user_id = ?').get(userId) as any;
    if (!wallet) {
      res.status(404).json({ success: false, message: 'Target customer wallet not found' });
      return;
    }

    const oldBalance = Number(wallet.balance);
    const upperType = String(type).toUpperCase();
    if (upperType !== 'CREDIT' && upperType !== 'DEBIT') {
      res.status(400).json({ success: false, message: "Type must be either 'CREDIT' or 'DEBIT'" });
      return;
    }

    // Safety debit check: never permit overdraft unless authorized
    if (upperType === 'DEBIT' && oldBalance < numAmount) {
      res.status(400).json({
        success: false,
        message: `Insufficient funds: Customer balance is ₦${oldBalance.toLocaleString()}, cannot debit ₦${numAmount.toLocaleString()}.`
      });
      return;
    }

    const projectedBalance = upperType === 'CREDIT' ? oldBalance + numAmount : oldBalance - numAmount;
    const ref = generateReference('ADJ');
    const adjId = `adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // Dual-approval threshold: operations >= ₦50,000 submitted by non-superadmins require dual approval
    const HIGH_RISK_THRESHOLD = 50000;
    if (numAmount >= HIGH_RISK_THRESHOLD && !isSuperAdmin) {
      db.prepare(`
        INSERT INTO wallet_adjustments (
          id, wallet_id, user_id, adjustment_type, amount, currency, balance_before,
          projected_balance, balance_after, reason, reference, ticket_reference,
          requested_by, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 'PENDING_APPROVAL', ?)
      `).run(
        adjId, wallet.id, userId, upperType, numAmount, wallet.currency || 'NGN',
        oldBalance, projectedBalance, reason, ref, ticketReference || null, actorEmail, now
      );

      res.status(202).json({
        success: true,
        pendingApproval: true,
        message: `High-value adjustment (₦${numAmount.toLocaleString()}) recorded. Submitted for secondary Super Admin approval before ledger commitment.`,
        oldBalance,
        adjustmentAmount: numAmount,
        projectedNewBalance: projectedBalance,
        adjustmentId: adjId,
        reference: ref
      });
      return;
    }

    // Direct Authoritative Execution (Immediate Atomic Ledger Post)
    let committedResult;
    if (upperType === 'CREDIT') {
      committedResult = WalletService.creditWallet({
        userId,
        amount: numAmount,
        category: 'ADJUSTMENT',
        reference: ref,
        description: `Admin Manual Credit: ${reason} (by ${actorEmail})`
      });
    } else {
      committedResult = WalletService.debitWallet({
        userId,
        amount: numAmount,
        category: 'ADJUSTMENT',
        reference: ref,
        description: `Admin Manual Debit: ${reason} (by ${actorEmail})`
      });
    }

    const authoritativeNewBalance = (committedResult as any).balanceAfter ?? committedResult.newBalance ?? projectedBalance;

    // Record audited adjustment entry
    db.prepare(`
      INSERT INTO wallet_adjustments (
        id, wallet_id, user_id, adjustment_type, amount, currency, balance_before,
        projected_balance, balance_after, reason, reference, ticket_reference,
        requested_by, status, approved_by, approved_at, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?)
    `).run(
      adjId, wallet.id, userId, upperType, numAmount, wallet.currency || 'NGN',
      oldBalance, projectedBalance, authoritativeNewBalance, reason, ref, ticketReference || null,
      actorEmail, actorEmail, now, now
    );

    res.json({
      success: true,
      message: `Wallet ${upperType.toLowerCase()} of ₦${numAmount.toLocaleString()} committed successfully.`,
      oldBalance,
      adjustmentAmount: numAmount,
      newBalance: authoritativeNewBalance,
      adjustmentType: upperType,
      reference: ref,
      adjustmentId: adjId
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Get Adjustments Pending Dual Approval
 */
router.get('/wallets/adjustments/pending', authenticate, requirePermission('APPROVE_WITHDRAWALS'), (req: Request, res: Response): void => {
  try {
    const pending = db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM wallet_adjustments a
      JOIN users u ON a.user_id = u.id
      WHERE a.status = 'PENDING_APPROVAL'
      ORDER BY a.created_at ASC
    `).all();

    res.json({ success: true, pending });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Approve Pending Wallet Adjustment (Dual Approval)
 */
router.post('/wallets/adjustments/:id/approve', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const actorEmail = req.user!.email;
    const now = new Date().toISOString();

    const adj = db.prepare('SELECT * FROM wallet_adjustments WHERE id = ?').get(id) as any;
    if (!adj) {
      res.status(404).json({ success: false, message: 'Adjustment request not found' });
      return;
    }

    if (adj.status !== 'PENDING_APPROVAL') {
      res.status(400).json({ success: false, message: `Adjustment cannot be approved; current status is ${adj.status}` });
      return;
    }

    // Fetch current authoritative wallet
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(adj.user_id) as any;
    const currentBalance = Number(wallet?.balance || 0);

    if (adj.adjustment_type === 'DEBIT' && currentBalance < adj.amount) {
      res.status(400).json({
        success: false,
        message: `Cannot approve debit: User balance is now ₦${currentBalance.toLocaleString()}, which is below requested debit of ₦${adj.amount.toLocaleString()}.`
      });
      return;
    }

    let result;
    if (adj.adjustment_type === 'CREDIT') {
      result = WalletService.creditWallet({
        userId: adj.user_id,
        amount: adj.amount,
        category: 'ADJUSTMENT',
        reference: adj.reference,
        description: `Dual-Approved Credit: ${adj.reason} (req by ${adj.requested_by}, appr by ${actorEmail})`
      });
    } else {
      result = WalletService.debitWallet({
        userId: adj.user_id,
        amount: adj.amount,
        category: 'ADJUSTMENT',
        reference: adj.reference,
        description: `Dual-Approved Debit: ${adj.reason} (req by ${adj.requested_by}, appr by ${actorEmail})`
      });
    }

    const finalBal = (result as any).balanceAfter ?? result.newBalance;

    db.prepare(`
      UPDATE wallet_adjustments
      SET status = 'COMPLETED',
          balance_after = ?,
          approved_by = ?,
          approved_at = ?
      WHERE id = ?
    `).run(finalBal, actorEmail, now, id);

    res.json({
      success: true,
      message: `Adjustment approved and committed. New customer balance: ₦${finalBal.toLocaleString()}`,
      oldBalance: currentBalance,
      newBalance: finalBal
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Reject Pending Wallet Adjustment
 */
router.post('/wallets/adjustments/:id/reject', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const actorEmail = req.user!.email;
    const now = new Date().toISOString();

    const adj = db.prepare('SELECT * FROM wallet_adjustments WHERE id = ?').get(id) as any;
    if (!adj) {
      res.status(404).json({ success: false, message: 'Adjustment request not found' });
      return;
    }

    db.prepare(`
      UPDATE wallet_adjustments
      SET status = 'REJECTED',
          approved_by = ?,
          approved_at = ?,
          reason = reason || ' | REJECTION REASON: ' || ?
      WHERE id = ?
    `).run(actorEmail, now, reason || 'Rejected by administrator', id);

    res.json({ success: true, message: 'Adjustment request rejected' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// SECURITY CENTER & INCIDENT MANAGEMENT
// ==========================================

/**
 * Security Center Overview Metrics
 */
router.get('/security/overview', authenticate, requirePermission('VIEW_AUDIT_LOGS'), (req: Request, res: Response): void => {
  try {
    const openIncidents = (db.prepare("SELECT COUNT(*) as count FROM security_incidents WHERE status IN ('OPEN', 'INVESTIGATING')").get() as any)?.count || 0;
    const criticalIncidents = (db.prepare("SELECT COUNT(*) as count FROM security_incidents WHERE severity = 'CRITICAL' AND status != 'RESOLVED'").get() as any)?.count || 0;
    const failedLogins = (db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE action LIKE '%FAIL%' OR target_type = 'LOGIN_FAIL'").get() as any)?.count || 0;
    const duplicateBlocks = (db.prepare("SELECT COUNT(*) as count FROM security_incidents WHERE incident_type = 'DUPLICATE_TX_BLOCKED'").get() as any)?.count || 0;

    const recentIncidents = db.prepare(`
      SELECT id, incident_type, severity, description, target_identifier, status, assigned_to, created_at
      FROM security_incidents
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

    const recentAuditEvents = db.prepare(`
      SELECT id, actor_role, action, target_type, ip_address, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 15
    `).all();

    res.json({
      success: true,
      security: {
        openIncidents,
        criticalIncidents,
        failedLogins,
        duplicateBlocks,
        recentIncidents,
        recentAuditEvents
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * List Security Incidents
 */
router.get('/security/incidents', authenticate, requirePermission('VIEW_AUDIT_LOGS'), (req: Request, res: Response): void => {
  try {
    const { status, severity } = req.query;
    let query = 'SELECT * FROM security_incidents WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';
    const incidents = (db.prepare(query) as any).all(...params);

    res.json({ success: true, incidents });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Update Security Incident (Assign / Status / Notes)
 */
router.patch('/security/incidents/:id', authenticate, requirePermission('VIEW_AUDIT_LOGS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { status, assignedTo, resolutionNotes } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE security_incidents
      SET status = COALESCE(?, status),
          assigned_to = COALESCE(?, assigned_to),
          resolution_notes = COALESCE(?, resolution_notes),
          resolved_at = CASE WHEN ? = 'RESOLVED' THEN ? ELSE resolved_at END
      WHERE id = ?
    `).run(status ?? null, assignedTo ?? null, resolutionNotes ?? null, status, now, id);

    res.json({ success: true, message: 'Security incident updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Audit Logs Viewer
 */
router.get('/audit-logs', authenticate, requirePermission('VIEW_AUDIT_LOGS'), (req: Request, res: Response): void => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Backups Management
 */
router.get('/backups', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const backups = BackupService.getBackups();
    res.json({ success: true, backups });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/backups/create', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const result = BackupService.createBackup();
    res.json({ success: true, message: 'Encrypted backup created successfully', backup: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/backups/test-restore/:id', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const result = BackupService.testRestore(id);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Get Sub-Admins
 */
router.get('/subadmins', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const subadmins = db.prepare(`
      SELECT id, name, email, phone, role, sub_admin_role, status, tier,
             created_at, last_active_at, last_login_ip
      FROM users
      WHERE role = 'sub_admin'
      ORDER BY created_at DESC
    `).all();
    res.json({ success: true, subadmins });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Create Sub-Admin with Specific Role
 */
router.post('/subadmins', authenticate, requireRole('super_admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, subAdminRole, transactionPin } = req.body;
    if (!name || !email || !phone || !password || !subAdminRole) {
      res.status(400).json({ success: false, message: 'Name, email, phone, password, and sub-admin role are required' });
      return;
    }

    const validRoles = ['finance', 'support', 'services', 'security'];
    if (!validRoles.includes(subAdminRole)) {
      res.status(400).json({ success: false, message: `Invalid sub-admin role. Allowed: ${validRoles.join(', ')}` });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?').get(email, phone);
    if (existing) {
      res.status(400).json({ success: false, message: 'Email or phone number is already registered' });
      return;
    }

    const { hashPassword } = await import('../utils/crypto.js');
    const crypto = await import('crypto');
    const userId = 'usr_sub_' + crypto.randomBytes(6).toString('hex');
    const passwordHash = await hashPassword(password);
    const pinHash = await hashPassword(transactionPin || '1234');
    const userReferral = 'ADM-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const sessionId = 'sess_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (
        id, name, email, phone, password_hash, role, sub_admin_role, tier, status,
        transaction_pin_hash, referral_code, active_session_id, last_active_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'sub_admin', ?, 3, 'active', ?, ?, ?, ?, ?, ?)
    `).run(userId, name, email, phone, passwordHash, subAdminRole, pinHash, userReferral, sessionId, now, now, now);

    // Create sub-admin wallet
    db.prepare(`
      INSERT INTO wallets (id, user_id, balance, commission_balance, currency, is_locked, created_at, updated_at)
      VALUES (?, ?, 0.0, 0.0, 'NGN', 0, ?, ?)
    `).run('wal_' + crypto.randomBytes(8).toString('hex'), userId, now, now);

    res.json({
      success: true,
      message: `Sub-admin account created successfully with '${subAdminRole}' permissions`,
      subadmin: { id: userId, name, email, phone, role: 'sub_admin', subAdminRole, status: 'active' }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Suspend or Update Sub-Admin Status
 */
router.put('/subadmins/:id/status', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { status, subAdminRole } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET status = COALESCE(?, status),
          sub_admin_role = COALESCE(?, sub_admin_role),
          updated_at = ?
      WHERE id = ? AND role = 'sub_admin'
    `).run(status ?? null, subAdminRole ?? null, now, id);

    res.json({ success: true, message: `Sub-admin updated successfully` });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Financial Reports & 35+ KPIs Financial Command Center Engine
 */
router.get('/reports/summary', authenticate, requirePermission('VIEW_REPORTS'), (req: Request, res: Response): void => {
  try {
    const period = (req.query.period as string) || 'all';
    const year = req.query.year as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let dateFilter = '';
    const now = new Date();
    if (year && /^\d{4}$/.test(year)) {
      dateFilter = `WHERE strftime('%Y', created_at) = '${year}'`;
    } else if (startDate && endDate) {
      dateFilter = `WHERE created_at >= '${startDate}' AND created_at <= '${endDate}T23:59:59.999Z'`;
    } else if (period === 'today') {
      const today = now.toISOString().slice(0, 10);
      dateFilter = `WHERE created_at >= '${today}'`;
    } else if (period === '7days') {
      const past7 = new Date(now.getTime() - 7 * 86400000).toISOString();
      dateFilter = `WHERE created_at >= '${past7}'`;
    } else if (period === '30days') {
      const past30 = new Date(now.getTime() - 30 * 86400000).toISOString();
      dateFilter = `WHERE created_at >= '${past30}'`;
    } else if (/^\d{4}$/.test(period)) {
      dateFilter = `WHERE strftime('%Y', created_at) = '${period}'`;
    }

    // Customer Breakdown
    const customerCounts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN tier >= 2 THEN 1 ELSE 0 END) as kyc_verified,
        SUM(CASE WHEN tier = 3 OR role IN ('agent', 'reseller') THEN 1 ELSE 0 END) as agents_resellers
      FROM users
      WHERE role != 'super_admin'
    `).get() as any;

    const totalCustomers = customerCounts?.total || 0;
    const activeCustomers = customerCounts?.active || 0;
    const kycVerifiedCustomers = customerCounts?.kyc_verified || 0;
    const agentsResellersCount = customerCounts?.agents_resellers || 0;

    // Liabilities
    const totalWalletLiability = (db.prepare('SELECT SUM(balance) as total FROM wallets').get() as any)?.total || 0;
    const totalCommissionLiability = (db.prepare('SELECT SUM(commission_balance) as total FROM wallets').get() as any)?.total || 0;
    const pendingWithdrawalRow = (db.prepare("SELECT COUNT(*) as count, SUM(net_amount) as total FROM withdrawal_requests WHERE status = 'PENDING'").get() as any);
    const totalPendingWithdrawals = pendingWithdrawalRow?.total || 0;
    const totalPendingWithdrawalsCount = pendingWithdrawalRow?.count || 0;
    const completedWithdrawalRow = (db.prepare(`
      SELECT COUNT(*) as count, SUM(net_amount) as total FROM withdrawal_requests 
      ${dateFilter ? dateFilter + ' AND' : 'WHERE'} status = 'COMPLETED'
    `).get() as any);
    const totalWithdrawalsProcessed = completedWithdrawalRow?.total || 0;
    const totalWithdrawalsCount = completedWithdrawalRow?.count || 0;

    // Inflows by Gateway
    const gatewayInflows = db.prepare(`
      SELECT gateway, SUM(amount) as volume, COUNT(*) as count
      FROM payment_requests
      ${dateFilter ? dateFilter + ' AND' : 'WHERE'} status = 'SUCCESSFUL'
      GROUP BY gateway
    `).all() as any[];

    let monnifyInflow = 0;
    let paystackInflow = 0;
    let palmpayInflow = 0;
    let flutterwaveInflow = 0;
    let manualBankInflow = 0;

    for (const gw of gatewayInflows) {
      if (gw.gateway === 'monnify') monnifyInflow = gw.volume;
      else if (gw.gateway === 'paystack') paystackInflow = gw.volume;
      else if (gw.gateway === 'palmpay') palmpayInflow = gw.volume;
      else if (gw.gateway === 'flutterwave') flutterwaveInflow = gw.volume;
      else if (gw.gateway === 'manual_bank' || gw.gateway === 'bank_transfer') manualBankInflow = gw.volume;
    }

    // Ledger Deposits Inflow
    const totalDepositsInflow = (db.prepare(`
      SELECT SUM(amount) as total FROM ledger_entries
      ${dateFilter ? dateFilter + ' AND' : 'WHERE'} category IN ('WALLET_FUNDING', 'ADJUSTMENT') AND entry_type = 'CREDIT'
    `).get() as any)?.total || 0;

    // VTU Totals & Performance
    const vtuStats = (db.prepare(`
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status IN ('COMPLETED', 'SUCCESSFUL') THEN charged_amount ELSE 0 END) as gross_volume,
        SUM(CASE WHEN status IN ('COMPLETED', 'SUCCESSFUL') THEN 1 ELSE 0 END) as successful_count,
        SUM(CASE WHEN status IN ('FAILED', 'REJECTED') THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN status IN ('PENDING', 'PROCESSING') THEN 1 ELSE 0 END) as pending_count
      FROM vtu_transactions
      ${dateFilter}
    `).get() as any);

    const totalTransactionsCount = vtuStats?.total_count || 0;
    const totalVTUGrossVolume = vtuStats?.gross_volume || 0;
    const successfulTransactionsCount = vtuStats?.successful_count || 0;
    const failedTransactionsCount = vtuStats?.failed_count || 0;
    const pendingTransactionsCount = vtuStats?.pending_count || 0;

    const totalVTUWholesaleCost = Math.round(totalVTUGrossVolume * 0.952 * 100) / 100;
    const totalVTUGrossProfit = Math.round((totalVTUGrossVolume - totalVTUWholesaleCost) * 100) / 100;
    const transactionSuccessRate = totalTransactionsCount > 0 ? Math.round((successfulTransactionsCount / totalTransactionsCount) * 10000) / 100 : 100.0;
    const averageTransactionValue = successfulTransactionsCount > 0 ? Math.round((totalVTUGrossVolume / successfulTransactionsCount) * 100) / 100 : 0.0;

    // Service Categories Breakdown
    const categoryRows = db.prepare(`
      SELECT service_category, COUNT(*) as count, SUM(charged_amount) as volume
      FROM vtu_transactions
      ${dateFilter ? dateFilter + ' AND' : 'WHERE'} status IN ('COMPLETED', 'SUCCESSFUL')
      GROUP BY service_category
    `).all() as any[];

    let dataVolume = 0;
    let airtimeVolume = 0;
    let solarPinVolume = 0;
    let cableVolume = 0;
    let electricityVolume = 0;
    let rechargePrintVolume = 0;

    for (const cr of categoryRows) {
      if (cr.service_category === 'data') dataVolume = cr.volume;
      else if (cr.service_category === 'airtime') airtimeVolume = cr.volume;
      else if (cr.service_category === 'solar_pin') solarPinVolume = cr.volume;
      else if (cr.service_category === 'cable') cableVolume = cr.volume;
      else if (cr.service_category === 'electricity') electricityVolume = cr.volume;
      else if (cr.service_category === 'recharge_print') rechargePrintVolume = cr.volume;
    }

    // Airtime to Cash Volume
    const airtimeCashVolume = (db.prepare(`
      SELECT SUM(cash_value) as total FROM airtime_to_cash_orders
      ${dateFilter ? dateFilter + ' AND' : 'WHERE'} status IN ('APPROVED', 'COMPLETED')
    `).get() as any)?.total || 0;

    // Safebox Locked Savings
    const safeboxSavingsDeposited = (db.prepare(`
      SELECT SUM(balance) as total FROM savings_safebox WHERE status = 'ACTIVE'
    `).get() as any)?.total || 0;

    // Telemetry & Hardware Modems
    const activeSimModemsCount = (db.prepare("SELECT COUNT(*) as count FROM sim_hosts WHERE status = 'ONLINE'").get() as any)?.count || 0;
    const simModemsTotalAirtimeBalance = (db.prepare("SELECT SUM(airtime_balance) as total FROM sim_hosts").get() as any)?.total || 0;
    const activeApiProvidersCount = (db.prepare("SELECT COUNT(*) as count FROM api_providers WHERE is_active = 1").get() as any)?.count || 0;

    // Ledger Commissions & Refunds
    const totalCommissionsPaid = (db.prepare(`
      SELECT SUM(amount) as total FROM ledger_entries
      ${dateFilter ? dateFilter + ' AND' : 'WHERE'} category = 'COMMISSION_PAYOUT'
    `).get() as any)?.total || 0;

    const totalRefundsProcessed = (db.prepare(`
      SELECT SUM(amount) as total FROM ledger_entries
      ${dateFilter ? dateFilter + ' AND' : 'WHERE'} category = 'REFUND'
    `).get() as any)?.total || 0;

    const netPlatformProfit = Math.round((totalVTUGrossProfit - totalCommissionsPaid) * 100) / 100;

    // Daily Volume Trend (Last 30 records)
    const dailyVolumeTrend = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d', created_at) as date,
        SUM(charged_amount) as vtu_volume,
        COUNT(*) as tx_count,
        ROUND(SUM(charged_amount) * 0.048, 2) as estimated_profit
      FROM vtu_transactions
      ${dateFilter ? dateFilter + ' AND' : 'WHERE'} status IN ('COMPLETED', 'SUCCESSFUL')
      GROUP BY strftime('%Y-%m-%d', created_at)
      ORDER BY date ASC
      LIMIT 30
    `).all() as any[];

    res.json({
      success: true,
      period: year || period,
      summary: {
        // Customer KPIs
        totalCustomers,
        totalRegisteredCustomers: totalCustomers,
        activeCustomers,
        kycVerifiedCustomers,
        agentsResellersCount,
        resellerMerchantCount: agentsResellersCount,

        // Liabilities KPIs
        totalWalletLiability,
        walletLiabilities: totalWalletLiability,
        totalCommissionLiability,
        totalPendingWithdrawals,
        pendingWithdrawals: totalPendingWithdrawals,
        totalPendingWithdrawalsCount,
        totalWithdrawalsProcessed,
        paidWithdrawals: totalWithdrawalsProcessed,
        totalWithdrawalsCount,

        // Inflow & Gateway KPIs
        totalInflow: totalDepositsInflow,
        totalDeposits: totalDepositsInflow,
        totalDepositsInflow,
        monnifyInflow,
        paystackInflow,
        palmpayInflow,
        flutterwaveInflow,
        manualBankInflow,

        // VTU & Revenue KPIs
        totalVTUGrossVolume,
        totalVTUVolume: totalVTUGrossVolume,
        vtuVolume: totalVTUGrossVolume,
        totalVTUWholesaleCost,
        totalVTUGrossProfit,
        grossProfit: totalVTUGrossProfit,
        netPlatformProfit,
        netRevenueProfit: netPlatformProfit,
        totalOutflow: totalVTUGrossVolume + totalWithdrawalsProcessed,

        // Services Volume Breakdown
        dataVolume,
        airtimeVolume,
        solarPinVolume,
        cableVolume,
        electricityVolume,
        rechargePrintVolume,
        airtimeCashVolume,
        safeboxSavingsDeposited,

        // Transaction Performance KPIs
        totalTransactionsCount,
        successfulTransactionsCount,
        failedTransactionsCount,
        pendingTransactionsCount,
        transactionSuccessRate,
        averageTransactionValue,

        // Hardware & Telemetry KPIs
        activeSimModemsCount,
        simModemsTotalAirtimeBalance,
        activeApiProvidersCount,

        // Financial Adjustments
        totalCommissionsPaid,
        totalRefundsProcessed,

        // Structured Breakdown Arrays for Visual Charts
        categories: categoryRows.map((c: any) => ({
          category: c.service_category,
          count: c.count,
          volume: c.volume || 0,
          wholesaleCost: Math.round((c.volume || 0) * 0.952),
          profit: Math.round((c.volume || 0) * 0.048)
        })),
        categoryBreakdown: categoryRows,
        gatewayBreakdown: [
          { gateway: 'monnify', name: 'Monnify Reserved Accounts', volume: monnifyInflow },
          { gateway: 'paystack', name: 'Paystack NUBAN & Cards', volume: paystackInflow },
          { gateway: 'palmpay', name: 'PalmPay Virtual Accounts', volume: palmpayInflow },
          { gateway: 'flutterwave', name: 'Flutterwave Accounts', volume: flutterwaveInflow },
          { gateway: 'manual_bank', name: 'Corporate Bank Transfer', volume: manualBankInflow }
        ],
        dailyVolumeTrend
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Financial Transaction Explorer with Pagination & Filtering
 */
router.get('/transactions', authenticate, requirePermission('VIEW_TRANSACTIONS'), (req: Request, res: Response): void => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '20', 10)));
    const offset = (page - 1) * limit;

    const status = req.query.status as string;
    const search = req.query.search as string;
    const serviceCategory = req.query.serviceCategory as string;
    const channel = req.query.channel as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (serviceCategory && serviceCategory !== 'ALL') {
      whereClauses.push('v.service_category = ?');
      params.push(serviceCategory);
    }
    if (status && status !== 'ALL') {
      whereClauses.push('v.status = ?');
      params.push(status);
    }
    if (channel && channel !== 'ALL') {
      whereClauses.push('v.channel = ?');
      params.push(channel);
    }
    if (startDate && endDate) {
      whereClauses.push('v.created_at >= ? AND v.created_at <= ?');
      params.push(startDate, `${endDate}T23:59:59.999Z`);
    }
    if (search && search.trim() !== '') {
      whereClauses.push('(v.reference LIKE ? OR v.recipient LIKE ? OR v.provider_reference LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const q = `%${search.trim()}%`;
      params.push(q, q, q, q, q, q);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = db.prepare(`
      SELECT COUNT(*) as total
      FROM vtu_transactions v
      LEFT JOIN users u ON v.user_id = u.id
      ${whereSql}
    `).get(...params) as any;
    const total = countRow?.total || 0;

    const rows = db.prepare(`
      SELECT 
        v.id, v.user_id, v.service_category, v.reference, v.biller_or_network,
        v.recipient, v.amount, v.discount_amount, v.charged_amount, v.routing_used,
        v.status, v.token_or_pin, v.provider_reference, v.channel, v.cost_amount, v.profit_margin,
        v.created_at, v.updated_at,
        u.name as user_name, u.email as user_email, u.phone as user_phone, u.tier as user_tier
      FROM vtu_transactions v
      LEFT JOIN users u ON v.user_id = u.id
      ${whereSql}
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    res.json({
      success: true,
      transactions: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: 360 Transaction Details Inspection Modal
 */
router.get('/transactions/:ref/details', authenticate, requirePermission('VIEW_TRANSACTIONS'), (req: Request, res: Response): void => {
  try {
    const { ref } = req.params;

    // 1. Check vtu_transactions
    let tx = db.prepare(`
      SELECT v.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.tier as user_tier,
             w.balance as wallet_balance
      FROM vtu_transactions v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN wallets w ON w.user_id = v.user_id
      WHERE v.reference = ? OR v.id = ?
    `).get(ref, ref) as any;

    let transactionType = 'VTU_PURCHASE';

    // 2. Fallback to payment_requests (Deposits)
    if (!tx) {
      const pr = db.prepare(`
        SELECT p.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.tier as user_tier,
               w.balance as wallet_balance
        FROM payment_requests p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN wallets w ON w.user_id = p.user_id
        WHERE p.reference = ? OR p.id = ?
      `).get(ref, ref) as any;

      if (pr) {
        transactionType = 'WALLET_FUNDING';
        tx = {
          id: pr.id,
          user_id: pr.user_id,
          service_category: 'funding',
          reference: pr.reference,
          biller_or_network: (pr.gateway || 'MANUAL').toUpperCase(),
          recipient: pr.virtual_account_number || 'Direct Funding',
          amount: pr.amount,
          discount_amount: 0,
          charged_amount: pr.amount,
          routing_used: pr.gateway,
          status: pr.status,
          token_or_pin: null,
          provider_reference: pr.gateway_reference,
          channel: 'WEB',
          cost_amount: 0,
          profit_margin: 0,
          created_at: pr.created_at,
          updated_at: pr.paid_at || pr.created_at,
          user_name: pr.user_name,
          user_email: pr.user_email,
          user_phone: pr.user_phone,
          user_tier: pr.user_tier,
          wallet_balance: pr.wallet_balance
        };
      }
    }

    // 3. Fallback to withdrawal_requests
    if (!tx) {
      const wr = db.prepare(`
        SELECT w.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.tier as user_tier,
               wal.balance as wallet_balance
        FROM withdrawal_requests w
        LEFT JOIN users u ON w.user_id = u.id
        LEFT JOIN wallets wal ON wal.user_id = w.user_id
        WHERE w.payment_reference = ? OR w.id = ?
      `).get(ref, ref) as any;

      if (wr) {
        transactionType = 'BANK_WITHDRAWAL';
        tx = {
          id: wr.id,
          user_id: wr.user_id,
          service_category: 'withdrawal',
          reference: wr.payment_reference || wr.id,
          biller_or_network: wr.bank_name,
          recipient: `${wr.account_number} (${wr.account_name})`,
          amount: wr.amount,
          discount_amount: wr.fee,
          charged_amount: wr.net_amount,
          routing_used: 'BANK_DISBURSEMENT',
          status: wr.status,
          token_or_pin: null,
          provider_reference: wr.payment_reference,
          channel: 'WEB',
          cost_amount: wr.fee,
          profit_margin: wr.fee,
          created_at: wr.created_at,
          updated_at: wr.updated_at,
          user_name: wr.user_name,
          user_email: wr.user_email,
          user_phone: wr.user_phone,
          user_tier: wr.user_tier,
          wallet_balance: wr.wallet_balance
        };
      }
    }

    if (!tx) {
      res.status(404).json({ success: false, message: `Transaction '${ref}' not found` });
      return;
    }

    // Double-entry ledger audit trail
    const ledgerEntries = db.prepare(`
      SELECT id, entry_type, amount, balance_before, balance_after, category, reference, description, created_at
      FROM ledger_entries
      WHERE reference = ? OR user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(tx.reference, tx.user_id) as any[];

    // Chronological Timeline Events
    const timeline = [
      {
        step: 'INITIATED',
        timestamp: tx.created_at,
        description: `Transaction reference ${tx.reference} created via ${tx.channel || 'WEB'}.`,
        status: 'SUCCESS'
      },
      {
        step: 'LEDGER_VERIFIED',
        timestamp: tx.created_at,
        description: `Customer balance and double-entry ledger checked and authorized.`,
        status: 'SUCCESS'
      },
      {
        step: 'PROVIDER_ROUTED',
        timestamp: tx.created_at,
        description: `Order dispatched via ${tx.routing_used || 'API Gateway'}.`,
        status: tx.status === 'FAILED' ? 'FAILED' : 'SUCCESS'
      },
      {
        step: 'SETTLED',
        timestamp: tx.updated_at || tx.created_at,
        description: `Status resolved to ${tx.status}. ${tx.token_or_pin ? 'Delivery Token/PIN issued.' : ''}`,
        status: tx.status === 'COMPLETED' || tx.status === 'SUCCESSFUL' ? 'SUCCESS' : (tx.status === 'PENDING' ? 'PENDING' : 'FAILED')
      }
    ];

    res.json({
      success: true,
      transactionType,
      transaction: tx,
      user: {
        id: tx.user_id,
        name: tx.user_name,
        email: tx.user_email,
        phone: tx.user_phone,
        tier: tx.user_tier,
        walletBalance: tx.wallet_balance
      },
      ledgerTrail: ledgerEntries,
      timeline
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Get All Testimonials
 */
router.get('/testimonials', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const rows = db.prepare('SELECT * FROM testimonials ORDER BY sort_order ASC, created_at DESC').all();
    res.json({ success: true, testimonials: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Create Testimonial
 */
router.post('/testimonials', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { authorName, authorRole, rating, content, avatarUrl, isPublished, sortOrder } = req.body;
    if (!authorName || !content) {
      res.status(400).json({ success: false, message: 'Author name and testimonial content are required' });
      return;
    }

    const id = 'tst_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO testimonials (id, author_name, author_role, rating, content, avatar_url, is_published, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      authorName,
      authorRole || 'Customer',
      rating !== undefined ? Number(rating) : 5,
      content,
      avatarUrl || '',
      isPublished !== undefined ? (isPublished ? 1 : 0) : 1,
      sortOrder !== undefined ? Number(sortOrder) : 0,
      now,
      now
    );

    res.json({ success: true, message: 'Testimonial created successfully', id });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Update Testimonial
 */
router.put('/testimonials/:id', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { authorName, authorRole, rating, content, avatarUrl, isPublished, sortOrder } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE testimonials
      SET author_name = COALESCE(?, author_name),
          author_role = COALESCE(?, author_role),
          rating = COALESCE(?, rating),
          content = COALESCE(?, content),
          avatar_url = COALESCE(?, avatar_url),
          is_published = COALESCE(?, is_published),
          sort_order = COALESCE(?, sort_order),
          updated_at = ?
      WHERE id = ?
    `).run(
      authorName ?? null,
      authorRole ?? null,
      rating !== undefined ? Number(rating) : null,
      content ?? null,
      avatarUrl ?? null,
      isPublished !== undefined ? (isPublished ? 1 : 0) : null,
      sortOrder !== undefined ? Number(sortOrder) : null,
      now,
      id
    );

    res.json({ success: true, message: 'Testimonial updated successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Toggle Testimonial Publish Status
 */
router.patch('/testimonials/:id/publish', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT is_published FROM testimonials WHERE id = ?').get(id) as any;
    if (!existing) {
      res.status(404).json({ success: false, message: 'Testimonial not found' });
      return;
    }

    const newStatus = existing.is_published ? 0 : 1;
    const now = new Date().toISOString();
    db.prepare('UPDATE testimonials SET is_published = ?, updated_at = ? WHERE id = ?').run(newStatus, now, id);

    res.json({ success: true, message: `Testimonial ${newStatus ? 'published' : 'hidden'}`, isPublished: Boolean(newStatus) });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Delete Testimonial
 */
router.delete('/testimonials/:id', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
    res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Structured CSV Data Export
 */
router.get(
  '/reports/export',
  (req: Request, res: Response, next: any) => {
    if (req.query.token && !req.headers.authorization) {
      req.headers.authorization = `Bearer ${req.query.token}`;
    }
    next();
  },
  authenticate,
  requirePermission('EXPORT_REPORTS'),
  (req: Request, res: Response): void => {
  try {
    const period = (req.query.period as string) || 'all';
    const year = req.query.year as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let dateFilter = '';
    const now = new Date();
    if (year && /^\d{4}$/.test(year)) {
      dateFilter = `WHERE strftime('%Y', v.created_at) = '${year}'`;
    } else if (startDate && endDate) {
      dateFilter = `WHERE v.created_at >= '${startDate}' AND v.created_at <= '${endDate}T23:59:59.999Z'`;
    } else if (period === 'today') {
      const today = now.toISOString().slice(0, 10);
      dateFilter = `WHERE v.created_at >= '${today}'`;
    } else if (period === '7days') {
      const past7 = new Date(now.getTime() - 7 * 86400000).toISOString();
      dateFilter = `WHERE v.created_at >= '${past7}'`;
    } else if (period === '30days') {
      const past30 = new Date(now.getTime() - 30 * 86400000).toISOString();
      dateFilter = `WHERE v.created_at >= '${past30}'`;
    } else if (/^\d{4}$/.test(period)) {
      dateFilter = `WHERE strftime('%Y', v.created_at) = '${period}'`;
    }

    const txns = db.prepare(`
      SELECT v.reference, v.service_category, v.biller_or_network, v.recipient,
             v.amount, v.charged_amount, v.status, v.created_at, u.name as user_name, u.email as user_email
      FROM vtu_transactions v
      JOIN users u ON v.user_id = u.id
      ${dateFilter}
      ORDER BY v.created_at DESC
      LIMIT 5000
    `).all() as any[];

    let csv = 'Reference,Date,Category,Network/Biller,Recipient,Amount,Charged,Status,Customer Name,Customer Email\n';
    for (const t of txns) {
      csv += `"${t.reference}","${t.created_at}","${t.service_category}","${t.biller_or_network}","${t.recipient}",${t.amount},${t.charged_amount},"${t.status}","${t.user_name}","${t.user_email}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_report_${year || period || 'export'}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Get All Support Tickets
 */
router.get('/support/tickets', authenticate, requirePermission('VIEW_TICKETS'), (req: Request, res: Response): void => {
  try {
    const status = req.query.status as string;
    let sql = `
      SELECT st.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM support_tickets st
      JOIN users u ON st.user_id = u.id
    `;
    const params: any[] = [];
    if (status && status !== 'ALL') {
      sql += ' WHERE st.status = ?';
      params.push(status.toUpperCase());
    }
    sql += ' ORDER BY st.created_at DESC LIMIT 100';

    const tickets = db.prepare(sql).all(...params) as any[];

    const ticketsWithReplies = tickets.map(t => {
      const replies = db.prepare(`
        SELECT r.*, 
               CASE WHEN r.sender_type = 'USER' THEN u.name ELSE 'Support Officer' END as sender_name
        FROM ticket_replies r
        LEFT JOIN users u ON r.sender_id = u.id
        WHERE r.ticket_id = ?
        ORDER BY r.created_at ASC
      `).all(t.id);
      return { ...t, replies };
    });

    res.json({ success: true, tickets: ticketsWithReplies });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Reply to Support Ticket & Update Status
 */
router.post('/support/tickets/:id/reply', authenticate, requirePermission('VIEW_TICKETS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { message, status } = req.body;
    if (!message || message.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
      return;
    }

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id) as any;
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    const replyId = 'rep_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();
    const newStatus = status ? status.toUpperCase() : 'RESOLVED';

    db.prepare(`
      INSERT INTO ticket_replies (id, ticket_id, sender_id, sender_type, message, created_at)
      VALUES (?, ?, ?, 'ADMIN', ?, ?)
    `).run(replyId, id, req.user!.id, message.trim(), now);

    db.prepare(`
      UPDATE support_tickets
      SET status = ?, assigned_to = ?, updated_at = ?
      WHERE id = ?
    `).run(newStatus, req.user!.email, now, id);

    res.json({ success: true, message: 'Reply dispatched to customer', newStatus });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: System Health Diagnostics
 */
router.get('/system-health', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    let dbSizeBytes = 0;
    try {
      const stat = fs.statSync(CONFIG.DB_PATH);
      dbSizeBytes = stat.size;
    } catch {}

    const memUsage = process.memoryUsage();
    const uptimeSecs = Math.floor(process.uptime());

    const activeProvidersCount = (db.prepare('SELECT COUNT(*) as count FROM api_providers WHERE is_active = 1').get() as any)?.count || 0;
    const activeSimsCount = (db.prepare("SELECT COUNT(*) as count FROM sim_hosts WHERE status = 'ONLINE'").get() as any)?.count || 0;
    const pendingWithdrawalsCount = (db.prepare("SELECT COUNT(*) as count FROM withdrawal_requests WHERE status = 'PENDING'").get() as any)?.count || 0;
    const totalLedgerEntriesCount = (db.prepare('SELECT COUNT(*) as count FROM ledger_entries').get() as any)?.count || 0;

    res.json({
      success: true,
      health: {
        status: 'OPTIMAL',
        uptimeSeconds: uptimeSecs,
        uptimeFormatted: `${Math.floor(uptimeSecs / 3600)}h ${Math.floor((uptimeSecs % 3600) / 60)}m`,
        database: {
          engine: 'SQLite WAL Mode',
          sizeBytes: dbSizeBytes,
          sizeFormatted: `${(dbSizeBytes / (1024 * 1024)).toFixed(2)} MB`,
          totalLedgerEntries: totalLedgerEntriesCount
        },
        memory: {
          rssMb: Math.round(memUsage.rss / 1024 / 1024),
          heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024)
        },
        services: {
          activeProviders: activeProvidersCount,
          activeSimModems: activeSimsCount,
          pendingCashoutQueue: pendingWithdrawalsCount
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Mobile App Versioning & Release Policy
 */
router.get('/app-version', (req: Request, res: Response): void => {
  res.json({
    success: true,
    version: '1.0.0',
    buildNumber: 100,
    minSupportedVersion: '1.0.0',
    forceUpdate: false,
    updateUrlAndroid: 'https://play.google.com/store/apps/details?id=com.bukardatasub.app',
    updateUrlIos: 'https://apps.apple.com/app/id6470000000',
    releaseNotes: 'Performance optimization, real-time OTP delivery, Moniecrm business vaults, and instant transaction receipts.'
  });
});

/**
 * Super Admin: Get All Surity Security & Authentication Rules (100+ Enterprise Rules)
 */
router.get('/security/surity-rules', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const rulesSummary = SURITY_RULES.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      severity: r.severity,
      description: r.description,
      remediation: r.remediation,
      active: r.active
    }));

    const domainCounts: Record<string, number> = {};
    for (const r of SURITY_RULES) {
      domainCounts[r.category] = (domainCounts[r.category] || 0) + 1;
    }

    res.json({
      success: true,
      totalRules: SURITY_RULES.length,
      domains: domainCounts,
      rules: rulesSummary
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Run Live Surity Security Diagnostic Audit (100+ Live Checks)
 */
router.post('/security/surity-audit', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const auditReport = runSurityDiagnosticAudit();

    // Log the audit event to audit_logs
    try {
      db.prepare(`
        INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, user_agent, details_json, created_at)
        VALUES (?, ?, ?, 'SURITY_AUDIT_EXECUTED', 'system', 'security_engine', ?, ?, ?, ?)
      `).run(
        'aud_' + crypto.randomBytes(6).toString('hex'),
        req.user!.id,
        req.user!.role,
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'SurityEngine',
        JSON.stringify({
          score: auditReport.scorePercent,
          totalRules: auditReport.totalRulesEvaluated,
          passed: auditReport.passed,
          failed: auditReport.failed,
          status: auditReport.status
        }),
        auditReport.timestamp
      );
    } catch {}

    res.json({
      success: true,
      report: auditReport
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
