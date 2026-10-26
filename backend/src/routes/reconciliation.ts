import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../database/index.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

export interface ReconciliationDiscrepancy {
  id: string;
  checkType: 'WALLET_LEDGER_MISMATCH' | 'PAYMENT_CREDIT_MISMATCH' | 'WITHDRAWAL_DEBIT_MISMATCH' | 'STALE_PENDING_TX' | 'NEGATIVE_WALLET_BALANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  userEmail?: string;
  reference?: string;
  expectedValue: number | string;
  actualValue: number | string;
  discrepancyAmount?: number;
  description: string;
  detectedAt: string;
}

/**
 * Execute Full 5-Point Financial Reconciliation Engine
 */
export function runFinancialReconciliationAudit(performedBy = 'SYSTEM_DAEMON') {
  const discrepancies: ReconciliationDiscrepancy[] = [];
  const now = new Date().toISOString();

  // 1. Check: Wallet Balance vs Sum of Double-Entry Ledger Entries
  const wallets = db.prepare(`
    SELECT w.user_id, w.balance, u.email, u.name
    FROM wallets w
    JOIN users u ON w.user_id = u.id
  `).all() as any[];

  for (const w of wallets) {
    const ledgerSumRow = db.prepare(`
      SELECT 
        SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE -amount END) as calculated_balance
      FROM ledger_entries
      WHERE user_id = ?
    `).get(w.user_id) as any;

    const calculatedBalance = Math.round((ledgerSumRow?.calculated_balance || 0) * 100) / 100;
    const actualWalletBalance = Math.round((w.balance || 0) * 100) / 100;
    const diff = Math.abs(calculatedBalance - actualWalletBalance);

    if (diff > 0.05) {
      discrepancies.push({
        id: `disc_wal_${w.user_id}_${Date.now()}`,
        checkType: 'WALLET_LEDGER_MISMATCH',
        severity: diff > 1000 ? 'CRITICAL' : 'HIGH',
        userId: w.user_id,
        userEmail: w.email,
        expectedValue: calculatedBalance,
        actualValue: actualWalletBalance,
        discrepancyAmount: diff,
        description: `Wallet balance (₦${actualWalletBalance}) does not match authoritative ledger sum (₦${calculatedBalance}). Difference: ₦${diff.toFixed(2)}`,
        detectedAt: now
      });
    }
  }

  // 2. Check: Successful Gateway Payments vs Ledger Funding Credits
  const successfulPayments = db.prepare(`
    SELECT p.id, p.reference, p.amount, p.user_id, u.email
    FROM payment_requests p
    JOIN users u ON p.user_id = u.id
    WHERE p.status = 'SUCCESSFUL'
  `).all() as any[];

  for (const p of successfulPayments) {
    const ledgerCredit = db.prepare(`
      SELECT id, amount FROM ledger_entries 
      WHERE reference = ? AND entry_type = 'CREDIT'
    `).get(p.reference) as any;

    if (!ledgerCredit) {
      discrepancies.push({
        id: `disc_pay_missing_${p.reference}`,
        checkType: 'PAYMENT_CREDIT_MISMATCH',
        severity: 'CRITICAL',
        userId: p.user_id,
        userEmail: p.email,
        reference: p.reference,
        expectedValue: p.amount,
        actualValue: 0,
        discrepancyAmount: p.amount,
        description: `Confirmed gateway payment (${p.reference}) for ₦${p.amount} has no matching credit in ledger_entries`,
        detectedAt: now
      });
    } else if (Math.abs(ledgerCredit.amount - p.amount) > 0.05) {
      discrepancies.push({
        id: `disc_pay_diff_${p.reference}`,
        checkType: 'PAYMENT_CREDIT_MISMATCH',
        severity: 'HIGH',
        userId: p.user_id,
        userEmail: p.email,
        reference: p.reference,
        expectedValue: p.amount,
        actualValue: ledgerCredit.amount,
        discrepancyAmount: Math.abs(ledgerCredit.amount - p.amount),
        description: `Gateway payment amount (₦${p.amount}) differs from credited ledger amount (₦${ledgerCredit.amount})`,
        detectedAt: now
      });
    }
  }

  // 3. Check: Completed Withdrawals vs Ledger Debits
  const completedWithdrawals = db.prepare(`
    SELECT w.id, w.user_id, w.amount, w.net_amount, w.payment_reference, u.email
    FROM withdrawal_requests w
    JOIN users u ON w.user_id = u.id
    WHERE w.status = 'COMPLETED'
  `).all() as any[];

  for (const cw of completedWithdrawals) {
    const ref = cw.payment_reference || `WTH-${cw.id}`;
    const ledgerDebit = db.prepare(`
      SELECT id, amount FROM ledger_entries
      WHERE (reference = ? OR reference = ?) AND entry_type = 'DEBIT'
    `).get(ref, `WTH-${cw.id}`) as any;

    if (!ledgerDebit) {
      discrepancies.push({
        id: `disc_wth_missing_${cw.id}`,
        checkType: 'WITHDRAWAL_DEBIT_MISMATCH',
        severity: 'CRITICAL',
        userId: cw.user_id,
        userEmail: cw.email,
        reference: ref,
        expectedValue: cw.amount,
        actualValue: 0,
        discrepancyAmount: cw.amount,
        description: `Completed withdrawal (${ref}) for ₦${cw.amount} has no corresponding debit in ledger_entries`,
        detectedAt: now
      });
    }
  }

  // 4. Check: Stale Pending Transactions (> 30 minutes in pending state)
  const staleTransactions = db.prepare(`
    SELECT v.id, v.reference, v.charged_amount, v.user_id, v.service_category, v.created_at, u.email
    FROM vtu_transactions v
    JOIN users u ON v.user_id = u.id
    WHERE v.status IN ('PENDING', 'PROCESSING')
      AND v.created_at <= datetime('now', '-30 minutes')
  `).all() as any[];

  for (const st of staleTransactions) {
    discrepancies.push({
      id: `disc_stale_${st.reference}`,
      checkType: 'STALE_PENDING_TX',
      severity: 'MEDIUM',
      userId: st.user_id,
      userEmail: st.email,
      reference: st.reference,
      expectedValue: 'FINALIZED',
      actualValue: 'PENDING',
      discrepancyAmount: st.charged_amount,
      description: `VTU transaction ${st.reference} (${st.service_category}) has been pending for over 30 minutes. Requires provider status check or refund reversal.`,
      detectedAt: now
    });
  }

  // 5. Check: Negative Wallet Balances (Overdrafts)
  const negativeWallets = db.prepare(`
    SELECT w.user_id, w.balance, u.email, u.name
    FROM wallets w
    JOIN users u ON w.user_id = u.id
    WHERE w.balance < -0.01
  `).all() as any[];

  for (const nw of negativeWallets) {
    discrepancies.push({
      id: `disc_overdraft_${nw.user_id}`,
      checkType: 'NEGATIVE_WALLET_BALANCE',
      severity: 'CRITICAL',
      userId: nw.user_id,
      userEmail: nw.email,
      expectedValue: '>= 0.00',
      actualValue: nw.balance,
      discrepancyAmount: Math.abs(nw.balance),
      description: `Customer wallet is in negative balance deficit: ₦${nw.balance.toFixed(2)}. Anti-overdraft guard triggered.`,
      detectedAt: now
    });
  }

  // Save audit run into financial_reconciliations
  const auditId = 'rec_' + crypto.randomBytes(6).toString('hex');
  const auditStatus = discrepancies.length === 0 ? 'HEALTHY' : 'DISCREPANCIES_FOUND';

  try {
    db.prepare(`
      INSERT INTO financial_reconciliations (
        id, audit_type, status, discrepancy_count, details_json, performed_by, created_at
      )
      VALUES (?, 'FULL_SYSTEM_AUDIT', ?, ?, ?, ?, ?)
    `).run(auditId, auditStatus, discrepancies.length, JSON.stringify(discrepancies), performedBy, now);
  } catch (e) {
    console.error('Failed to log reconciliation audit', e);
  }

  return {
    auditId,
    status: auditStatus,
    timestamp: now,
    totalDiscrepancies: discrepancies.length,
    discrepancies,
    summary: {
      walletLedgerMismatches: discrepancies.filter(d => d.checkType === 'WALLET_LEDGER_MISMATCH').length,
      paymentCreditMismatches: discrepancies.filter(d => d.checkType === 'PAYMENT_CREDIT_MISMATCH').length,
      withdrawalDebitMismatches: discrepancies.filter(d => d.checkType === 'WITHDRAWAL_DEBIT_MISMATCH').length,
      stalePendingCount: discrepancies.filter(d => d.checkType === 'STALE_PENDING_TX').length,
      negativeWalletCount: discrepancies.filter(d => d.checkType === 'NEGATIVE_WALLET_BALANCE').length
    }
  };
}

/**
 * Super Admin & Compliance: Run Real-Time Reconciliation Audit
 */
router.get('/audit-run', authenticate, requirePermission('VIEW_REPORTS'), (req: Request, res: Response): void => {
  try {
    const actorEmail = (req as any).user?.email || 'admin';
    const result = runFinancialReconciliationAudit(actorEmail);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Get Past Reconciliation Run History
 */
router.get('/history', authenticate, requirePermission('VIEW_REPORTS'), (req: Request, res: Response): void => {
  try {
    const history = db.prepare(`
      SELECT id, audit_type, status, discrepancy_count, performed_by, resolution_notes, resolved_by, created_at, resolved_at
      FROM financial_reconciliations
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

    res.json({ success: true, history });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Mark a Discrepancy Resolved with Evidence / Notes
 */
router.post('/resolve/:id', authenticate, requirePermission('MANAGE_SETTINGS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;
    const actorEmail = (req as any).user?.email || 'admin';
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE financial_reconciliations
      SET status = 'RESOLVED',
          resolution_notes = ?,
          resolved_by = ?,
          resolved_at = ?
      WHERE id = ?
    `).run(resolutionNotes || 'Discrepancy investigated and verified by administrator.', actorEmail, now, id);

    res.json({ success: true, message: 'Reconciliation discrepancy marked as resolved' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
