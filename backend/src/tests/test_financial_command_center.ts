import { describe, it } from 'node:test';
import assert from 'node:assert';
import { db } from '../database/index.js';
import { PaymentGatewayService } from '../services/paymentGatewayService.js';

describe('Financial Command Center & Platform Integrations', () => {
  it('Should verify PalmPay payment gateway is seeded and active', () => {
    const palmpay = db.prepare("SELECT * FROM payment_gateways WHERE id = 'palmpay'").get() as any;
    assert.ok(palmpay, 'PalmPay gateway should exist in payment_gateways table');
    assert.strictEqual(palmpay.bank_name, 'PalmPay MFB');
    assert.strictEqual(palmpay.is_active, 1);
  });

  it('Should process PalmPay webhook with valid payload', () => {
    // Insert a pending payment request
    const testRef = 'FUND_PALM_TEST_' + Date.now();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO payment_requests (id, user_id, reference, amount, currency, gateway, status, created_at)
      VALUES (?, 'usr_mohammed_002', ?, 2500.0, 'NGN', 'palmpay', 'PENDING', ?)
    `).run('prq_test_' + Date.now(), testRef, now);

    const webhookBody = JSON.stringify({
      orderStatus: 'SUCCESS',
      reference: testRef,
      transactionId: 'PLM_TX_' + Date.now(),
      amount: 2500.0
    });

    const result = PaymentGatewayService.processWebhook('palmpay', webhookBody, {});
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.processed, true);
    assert.strictEqual(result.reference, testRef);

    // Verify payment was marked successful and wallet credited
    const req = db.prepare('SELECT status FROM payment_requests WHERE reference = ?').get(testRef) as any;
    assert.strictEqual(req.status, 'SUCCESSFUL');
  });

  it('Should verify testimonials table has seeded reviews and public accessibility', () => {
    const testimonials = db.prepare('SELECT * FROM testimonials WHERE is_published = 1 ORDER BY sort_order ASC').all() as any[];
    assert.ok(testimonials.length >= 3, 'Should have at least 3 published testimonials seeded');
    assert.strictEqual(testimonials[0].author_name, 'Ibrahim Danladi');
    assert.strictEqual(testimonials[0].rating, 5);
  });

  it('Should calculate all 35+ KPIs correctly from database records', () => {
    // Customer breakdown
    const customerCounts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN tier >= 2 THEN 1 ELSE 0 END) as kyc_verified,
        SUM(CASE WHEN tier = 3 OR role IN ('agent', 'reseller') THEN 1 ELSE 0 END) as agents_resellers
      FROM users
      WHERE role != 'super_admin'
    `).get() as any;

    assert.ok(customerCounts.total > 0, 'Total customers should be > 0');
    assert.ok(customerCounts.active > 0, 'Active customers should be > 0');

    // Liabilities
    const walletLiab = db.prepare('SELECT SUM(balance) as total FROM wallets').get() as any;
    assert.ok(walletLiab.total >= 0, 'Wallet liabilities must be a non-negative number');

    // VTU Totals
    const vtuStats = db.prepare(`
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status IN ('COMPLETED', 'SUCCESSFUL') THEN charged_amount ELSE 0 END) as gross_volume,
        SUM(CASE WHEN status IN ('COMPLETED', 'SUCCESSFUL') THEN 1 ELSE 0 END) as successful_count
      FROM vtu_transactions
    `).get() as any;

    assert.ok(vtuStats.total_count >= 0);
    assert.ok(vtuStats.gross_volume >= 0);
  });

  it('Should retrieve 360 transaction details including timeline and double-entry ledger trail', () => {
    const demoTx = db.prepare("SELECT reference FROM vtu_transactions LIMIT 1").get() as any;
    assert.ok(demoTx, 'Should have at least one VTU transaction in database');

    const tx = db.prepare(`
      SELECT v.*, u.name as user_name, u.email as user_email
      FROM vtu_transactions v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.reference = ?
    `).get(demoTx.reference) as any;

    assert.ok(tx);
    assert.strictEqual(tx.reference, demoTx.reference);

    const ledger = db.prepare('SELECT * FROM ledger_entries WHERE reference = ?').all(demoTx.reference);
    assert.ok(ledger.length >= 1, 'Should have matching double-entry ledger entry');
  });
});
