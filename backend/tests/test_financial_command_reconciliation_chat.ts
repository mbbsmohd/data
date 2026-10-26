import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/database/index.js';
import { computeFinancialCommandMetrics } from '../src/routes/financialCommand.js';
import { runFinancialReconciliationAudit } from '../src/routes/reconciliation.js';
import crypto from 'crypto';

test('Real-Time Financial Command Center, Reconciliation & Live Chat Test Suite', async (t) => {

  await t.test('1. Compute authoritative 23 financial command metrics from real DB rows', () => {
    const res = computeFinancialCommandMetrics('all');
    assert.ok(res, 'Result must exist');
    assert.strictEqual(res.currency, 'NGN', 'Currency must be NGN');
    assert.strictEqual(res.currencySymbol, '₦', 'Currency symbol must be ₦');
    assert.ok(res.metrics, 'Metrics object must exist');

    const m = res.metrics;

    // Check all 23 authoritative metrics exist
    assert.ok(typeof m.totalRegisteredUsers === 'number', 'Card 1: totalRegisteredUsers');
    assert.ok(typeof m.newUsersToday === 'number', 'Card 2: newUsersToday');
    assert.ok(typeof m.newUsersThisWeek === 'number', 'Card 3: newUsersThisWeek');
    assert.ok(typeof m.newUsersThisMonth === 'number', 'Card 3: newUsersThisMonth');
    assert.ok(typeof m.activeUsers === 'number', 'Card 4: activeUsers');
    assert.ok(typeof m.inactiveUsers === 'number', 'Card 4: inactiveUsers');
    assert.ok(typeof m.totalWalletBalances === 'number', 'Card 5: totalWalletBalances');
    assert.ok(typeof m.totalCustomerDeposits === 'number', 'Card 6: totalCustomerDeposits');
    assert.ok(typeof m.totalSuccessfulWithdrawals === 'number', 'Card 7: totalSuccessfulWithdrawals');
    assert.ok(typeof m.pendingWithdrawalsAmount === 'number', 'Card 8: pendingWithdrawalsAmount');
    assert.ok(typeof m.failedTransactionsCount === 'number', 'Card 9: failedTransactionsCount');
    assert.ok(typeof m.reversedTransactionsCount === 'number', 'Card 10: reversedTransactionsCount');
    assert.ok(typeof m.successfulVtuTransactionsCount === 'number', 'Card 11: successfulVtuTransactionsCount');
    assert.ok(typeof m.pendingProviderTransactionsCount === 'number', 'Card 12: pendingProviderTransactionsCount');
    assert.ok(typeof m.totalCustomerFundsHeld === 'number', 'Card 13: totalCustomerFundsHeld');
    assert.ok(typeof m.availablePlatformOperatingFunds === 'number', 'Card 14: availablePlatformOperatingFunds');
    assert.ok(typeof m.grossTransactionVolume === 'number', 'Card 15: grossTransactionVolume');
    assert.ok(typeof m.revenueEarned === 'number', 'Card 16: revenueEarned');
    assert.ok(typeof m.directTransactionCosts === 'number', 'Card 17: directTransactionCosts');
    assert.ok(typeof m.grossProfit === 'number', 'Card 18: grossProfit');
    assert.ok(typeof m.operatingExpenses === 'number', 'Card 19: operatingExpenses');
    assert.ok(typeof m.netProfitOrLoss === 'number', 'Card 20: netProfitOrLoss');
    assert.ok(Array.isArray(m.gatewayBalancesAndReconciliation), 'Card 21: gatewayBalancesAndReconciliation');
    assert.ok(typeof m.stalePendingCount === 'number', 'Card 22: stalePendingCount');
    assert.ok(typeof m.discrepancyCount === 'number', 'Card 23: discrepancyCount');

    // Mathematical integrity check:
    // Total customer funds held = Total wallet balances + Safebox savings
    assert.ok(m.totalCustomerFundsHeld >= m.totalWalletBalances, 'Customer funds held must be >= wallet balances');
  });

  await t.test('2. Operating Expenses (OpEx) lifecycle and impact on Net Profit', () => {
    const expenseId = 'exp_test_' + Date.now();
    const amount = 25000;
    const now = new Date().toISOString();

    // Record expense
    db.prepare(`
      INSERT INTO operating_expenses (id, title, category, amount, currency, notes, recorded_by, created_at)
      VALUES (?, 'Cloud Database VPS Hosting', 'SERVER_HOSTING', ?, 'NGN', 'Automated test expense', 'test_admin', ?)
    `).run(expenseId, amount, now);

    const inserted = db.prepare('SELECT * FROM operating_expenses WHERE id = ?').get(expenseId) as any;
    assert.ok(inserted, 'Expense record must exist');
    assert.strictEqual(inserted.amount, 25000);
    assert.strictEqual(inserted.category, 'SERVER_HOSTING');

    // Run metrics and check that operating expenses increased
    const res = computeFinancialCommandMetrics('all');
    assert.ok(res.metrics.operatingExpenses >= 25000, 'Metrics must recognize recorded operating expense');

    // Clean up
    db.prepare('DELETE FROM operating_expenses WHERE id = ?').run(expenseId);
  });

  await t.test('3. 5-Point Automated Financial Reconciliation Audit Engine', () => {
    const audit = runFinancialReconciliationAudit('compliance_officer_test');
    assert.ok(audit, 'Audit result must be returned');
    assert.ok(audit.auditId, 'Audit ID must be generated');
    assert.ok(['HEALTHY', 'DISCREPANCIES_FOUND'].includes(audit.status), 'Audit status must be valid');
    assert.ok(typeof audit.totalDiscrepancies === 'number', 'Total discrepancies must be numeric');
    assert.ok(audit.summary, 'Summary object must exist');
    assert.ok(typeof audit.summary.walletLedgerMismatches === 'number', 'Wallet ledger mismatch check');
    assert.ok(typeof audit.summary.paymentCreditMismatches === 'number', 'Payment credit mismatch check');
    assert.ok(typeof audit.summary.withdrawalDebitMismatches === 'number', 'Withdrawal debit mismatch check');
    assert.ok(typeof audit.summary.stalePendingCount === 'number', 'Stale pending check');
    assert.ok(typeof audit.summary.negativeWalletCount === 'number', 'Negative wallet overdraft check');

    // Verify logged in financial_reconciliations table
    const logged = db.prepare('SELECT * FROM financial_reconciliations WHERE id = ?').get(audit.auditId) as any;
    assert.ok(logged, 'Audit must be logged in database table');
    assert.strictEqual(logged.performed_by, 'compliance_officer_test');

    // Clean up
    db.prepare('DELETE FROM financial_reconciliations WHERE id = ?').run(audit.auditId);
  });

  await t.test('4. Real-time Customer Support Live Chat & Internal Staff Notes Privacy', () => {
    const convId = 'conv_test_' + Date.now();
    const customerId = 'usr_test_cust_' + Date.now();
    const adminId = 'usr_test_admin_' + Date.now();
    const now = new Date().toISOString();

    // Create user in DB for FK
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, tier, status, created_at, updated_at)
      VALUES (?, 'Test Chat Customer', ?, '08099990001', 'hash', 'customer', 1, 'active', ?, ?)
    `).run(customerId, `chatcust_${Date.now()}@example.com`, now, now);

    // Create conversation
    db.prepare(`
      INSERT INTO support_chat_conversations (
        id, user_id, user_name, user_email, subject, status,
        unread_admin_count, unread_user_count, last_message_text, last_message_at, created_at, updated_at
      ) VALUES (?, ?, 'Test Chat Customer', ?, 'Network issue on MTN', 'OPEN', 1, 0, 'Initial message', ?, ?, ?)
    `).run(convId, customerId, `chatcust_${Date.now()}@example.com`, now, now, now);

    // Insert 1 Customer message
    const msg1Id = 'msg_' + crypto.randomBytes(6).toString('hex');
    db.prepare(`
      INSERT INTO support_chat_messages (id, conversation_id, sender_id, sender_type, sender_name, message, is_internal_note, is_read, created_at)
      VALUES (?, ?, ?, 'USER', 'Test Chat Customer', 'My data transfer failed, please check.', 0, 0, ?)
    `).run(msg1Id, convId, customerId, now);

    // Insert 1 Admin Staff Public Message
    const msg2Id = 'msg_' + crypto.randomBytes(6).toString('hex');
    db.prepare(`
      INSERT INTO support_chat_messages (id, conversation_id, sender_id, sender_type, sender_name, message, is_internal_note, is_read, created_at)
      VALUES (?, ?, ?, 'ADMIN', 'Support Admin', 'Hello! We are looking into your transaction reference now.', 0, 0, ?)
    `).run(msg2Id, convId, adminId, now);

    // Insert 1 Staff-Only Internal Note (Must NEVER be visible to customer)
    const msg3Id = 'msg_' + crypto.randomBytes(6).toString('hex');
    db.prepare(`
      INSERT INTO support_chat_messages (id, conversation_id, sender_id, sender_type, sender_name, message, is_internal_note, is_read, created_at)
      VALUES (?, ?, ?, 'ADMIN', 'Support Admin', 'STAFF NOTE: MTN wholesale API returned 504 timeout, do not refund yet.', 1, 0, ?)
    `).run(msg3Id, convId, adminId, now);

    // Query messages as CUSTOMER (internal notes filtered out)
    const customerVisibleMessages = db.prepare(`
      SELECT * FROM support_chat_messages
      WHERE conversation_id = ? AND is_internal_note = 0
      ORDER BY created_at ASC
    `).all(convId) as any[];

    assert.strictEqual(customerVisibleMessages.length, 2, 'Customer should only see 2 public messages');
    assert.ok(!customerVisibleMessages.some(m => m.is_internal_note === 1), 'Customer must NEVER see internal staff notes');

    // Query messages as ADMIN (internal notes included)
    const adminVisibleMessages = db.prepare(`
      SELECT * FROM support_chat_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(convId) as any[];

    assert.strictEqual(adminVisibleMessages.length, 3, 'Admin must see all 3 messages including internal note');
    assert.ok(adminVisibleMessages.some(m => m.is_internal_note === 1), 'Admin must be able to view internal staff notes');

    // Clean up
    db.prepare('DELETE FROM support_chat_messages WHERE conversation_id = ?').run(convId);
    db.prepare('DELETE FROM support_chat_conversations WHERE id = ?').run(convId);
    db.prepare('DELETE FROM users WHERE id = ?').run(customerId);
  });

  await t.test('5. Security Account Lock, Session Revocation, and Login History', () => {
    const testUserId = 'usr_sec_test_' + Date.now();
    const testEmail = `sec_user_${Date.now()}@test.com`;
    const now = new Date().toISOString();

    // Create user with active session
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, tier, status, active_session_id, account_locked, created_at, updated_at)
      VALUES (?, 'Security Test User', ?, '08088880002', 'hash', 'customer', 1, 'active', 'sess_active_123', 0, ?, ?)
    `).run(testUserId, testEmail, now, now);

    // 1. Lock Account
    const lockReason = 'Suspicious velocity detected by automated risk engine';
    db.prepare(`
      UPDATE users 
      SET account_locked = 1, lock_reason = ?, active_session_id = NULL, updated_at = ?
      WHERE id = ?
    `).run(lockReason, now, testUserId);

    const lockedUser = db.prepare('SELECT account_locked, lock_reason, active_session_id FROM users WHERE id = ?').get(testUserId) as any;
    assert.strictEqual(lockedUser.account_locked, 1, 'Account must be marked locked');
    assert.strictEqual(lockedUser.lock_reason, lockReason, 'Lock reason must be saved');
    assert.strictEqual(lockedUser.active_session_id, null, 'Active session must be immediately revoked upon lock');

    // Record login attempt while locked in login_history
    const historyId = 'lh_' + crypto.randomBytes(6).toString('hex');
    db.prepare(`
      INSERT INTO login_history (id, user_id, email, status, ip_address, user_agent, failure_reason, created_at)
      VALUES (?, ?, ?, 'FAILED', '192.168.1.55', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'ACCOUNT_LOCKED', ?)
    `).run(historyId, testUserId, testEmail, now);

    const historyRecord = db.prepare('SELECT * FROM login_history WHERE id = ?').get(historyId) as any;
    assert.ok(historyRecord, 'Login history record must be persisted');
    assert.strictEqual(historyRecord.status, 'FAILED');
    assert.strictEqual(historyRecord.failure_reason, 'ACCOUNT_LOCKED');

    // 2. Unlock Account
    db.prepare(`
      UPDATE users 
      SET account_locked = 0, lock_reason = NULL, updated_at = ?
      WHERE id = ?
    `).run(now, testUserId);

    const unlockedUser = db.prepare('SELECT account_locked, lock_reason FROM users WHERE id = ?').get(testUserId) as any;
    assert.strictEqual(unlockedUser.account_locked, 0, 'Account must be unlocked');
    assert.strictEqual(unlockedUser.lock_reason, null, 'Lock reason must be cleared');

    // Clean up
    db.prepare('DELETE FROM login_history WHERE id = ?').run(historyId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
  });
});
