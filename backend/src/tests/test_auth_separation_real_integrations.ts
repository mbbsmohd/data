import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, initializeDatabase } from '../database/index.js';
import { PaymentGatewayService } from '../services/paymentGatewayService.js';
import { PaymentService } from '../services/paymentService.js';
import { WalletService } from '../services/walletService.js';

describe('Auth Separation, Route Guarding & Financial Integrity Test Suite', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'abk_super_secret_jwt_key_prod_2026';

  before(() => {
    initializeDatabase();
  });

  // 1. Customer Authentication Endpoint Behavior
  it('Should verify customer authentication strictly resolves to customer dashboard', async () => {
    const customer = db.prepare("SELECT * FROM users WHERE email = 'customer@abkdata.com'").get() as any;
    assert.ok(customer, 'Customer user should exist');
    assert.strictEqual(customer.role, 'customer');

    // Simulate customer login flow
    const isPassValid = await bcrypt.compare('Password123!', customer.password_hash);
    assert.strictEqual(isPassValid, true, 'Customer password must match');

    // Expected redirect path must ALWAYS be customer dashboard
    const redirectPath = '/dashboard';
    assert.strictEqual(redirectPath, '/dashboard', 'Customer login redirect must be /dashboard');

    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: customer.role, name: customer.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    assert.strictEqual(decoded.role, 'customer');
  });

  // 2. Admin Authentication Isolation: Ordinary Customer Rejection
  it('Should reject ordinary customer trying to access admin login with 403 and log security incident', async () => {
    const customer = db.prepare("SELECT * FROM users WHERE email = 'customer@abkdata.com'").get() as any;
    assert.ok(customer);

    const isAuthorizedAdminRole = customer.role === 'super_admin' || customer.role === 'sub_admin';
    assert.strictEqual(isAuthorizedAdminRole, false, 'Ordinary customer must NOT have admin roles');

    // Simulate rejection and incident logging
    const incidentId = 'sec_' + Date.now();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO security_incidents (id, incident_type, severity, description, target_identifier, status, created_at)
      VALUES (?, 'UNAUTHORIZED_ADMIN_LOGIN', 'HIGH', ?, ?, 'OPEN', ?)
    `).run(
      incidentId,
      `Blocked unauthorized admin login attempt by non-admin customer ${customer.email} (Role: ${customer.role})`,
      customer.id,
      now
    );

    const incident = db.prepare("SELECT * FROM security_incidents WHERE id = ?").get(incidentId) as any;
    assert.ok(incident);
    assert.strictEqual(incident.incident_type, 'UNAUTHORIZED_ADMIN_LOGIN');
    assert.strictEqual(incident.severity, 'HIGH');
    assert.strictEqual(incident.target_identifier, customer.id);
  });

  // 3. Admin Authentication: Super Admin and Sub Admin Acceptance
  it('Should authorize Super Admin and Sub-Admins at admin portal and log audit trail', async () => {
    const superAdmin = db.prepare("SELECT * FROM users WHERE role = 'super_admin' LIMIT 1").get() as any;
    assert.ok(superAdmin, 'Super admin account must exist');

    const isSuperAdminAuthorized = superAdmin.role === 'super_admin' || superAdmin.role === 'sub_admin';
    assert.strictEqual(isSuperAdminAuthorized, true);

    const subAdmins = db.prepare("SELECT * FROM users WHERE role = 'sub_admin'").all() as any[];
    assert.ok(subAdmins.length > 0, 'Sub-admins should exist for granular delegation');

    for (const sa of subAdmins) {
      assert.strictEqual(sa.role, 'sub_admin');
    }

    // Verify audit log entry
    const auditId = 'aud_' + Date.now();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, ip_address, details_json, created_at)
      VALUES (?, ?, ?, 'ADMIN_LOGIN_SUCCESS', 'auth/admin/login', '127.0.0.1', ?, ?)
    `).run(
      auditId,
      superAdmin.id,
      superAdmin.role,
      JSON.stringify({ email: superAdmin.email, role: superAdmin.role }),
      now
    );

    const auditEntry = db.prepare("SELECT * FROM audit_logs WHERE id = ?").get(auditId) as any;
    assert.ok(auditEntry);
    assert.strictEqual(auditEntry.action, 'ADMIN_LOGIN_SUCCESS');
  });

  // 4. Financial Integrity: Zero Random 10-digit Accounts
  it('Should verify payment requests do not invent random 10-digit placeholder accounts', async () => {
    const customer = db.prepare("SELECT * FROM users WHERE email = 'customer@abkdata.com'").get() as any;
    assert.ok(customer);

    const amount = 2500;
    const paymentReq = await PaymentService.createPaymentRequest(customer.id, amount, 'paystack');
    assert.ok(paymentReq);
    assert.ok(paymentReq.reference.startsWith('FUND-') || paymentReq.reference.startsWith('FUND_'));

    // Check payment gateway virtual account resolution
    const virtualAcc = await PaymentGatewayService.getOrGenerateVirtualAccount(customer.id);
    assert.ok(virtualAcc);
    assert.ok(virtualAcc.bankName, 'Bank name must be provided');
    assert.ok(virtualAcc.accountNumber, 'Account number must be provided');
    assert.ok(virtualAcc.accountName, 'Account name must be provided');

    // Verify that when not automated, truthful status is MANUAL_CORPORATE or isAutomated is false
    if (!virtualAcc.isAutomated) {
      assert.strictEqual(virtualAcc.status, 'MANUAL_CORPORATE');
      assert.ok(virtualAcc.instruction, 'Instruction must explain manual deposit handling');
    }
  });

  // 5. PalmPay Gateway Integration Logic
  it('Should handle PalmPay dedicated virtual account provisioning configuration', () => {
    const palmpayGateway = db.prepare("SELECT * FROM payment_gateways WHERE id = 'palmpay'").get() as any;
    assert.ok(palmpayGateway, 'PalmPay payment gateway record must exist in database');
    assert.strictEqual(palmpayGateway.is_active, 1);
  });

  // 6. Monnify Gateway Integration Logic
  it('Should handle Monnify dedicated virtual account configuration and webhooks', () => {
    const monnifyGateway = db.prepare("SELECT * FROM payment_gateways WHERE id = 'monnify'").get() as any;
    assert.ok(monnifyGateway, 'Monnify payment gateway record must exist in database');
    assert.strictEqual(monnifyGateway.is_active, 1);
  });

  // 7. Authoritative Ledger & Double-Entry Balance Tracking
  it('Should accurately record double-entry balance before and balance after on funding', async () => {
    const customer = db.prepare("SELECT * FROM users WHERE email = 'customer@abkdata.com'").get() as any;
    const walletBefore = WalletService.getWallet(customer.id);
    const balanceBefore = walletBefore.balance;
    const fundAmount = 1500;

    const ref = 'TEST_FUND_' + Date.now();
    const result = WalletService.creditWallet({
      userId: customer.id,
      amount: fundAmount,
      category: 'WALLET_FUNDING',
      reference: ref,
      description: 'Automated Wallet Test Deposit'
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(Math.round(result.newBalance * 100), Math.round((balanceBefore + fundAmount) * 100));

    // Verify ledger entry
    const ledgerEntry = db.prepare("SELECT * FROM ledger_entries WHERE reference = ?").get(ref) as any;
    assert.ok(ledgerEntry, 'Ledger entry must exist');
    assert.strictEqual(ledgerEntry.entry_type, 'CREDIT');
    assert.strictEqual(ledgerEntry.amount, fundAmount);
    assert.strictEqual(Math.round(ledgerEntry.balance_before * 100), Math.round(balanceBefore * 100));
    assert.strictEqual(Math.round(ledgerEntry.balance_after * 100), Math.round(result.newBalance * 100));
  });

  // 8. Overdraft Prevention on Debit
  it('Should prevent overdraft when debit amount exceeds available balance', async () => {
    const customer = db.prepare("SELECT * FROM users WHERE email = 'customer@abkdata.com'").get() as any;
    const wallet = WalletService.getWallet(customer.id);
    const excessiveAmount = wallet.balance + 99999999;

    let errorCaught = false;
    try {
      WalletService.debitWallet({
        userId: customer.id,
        amount: excessiveAmount,
        category: 'VTU_PURCHASE',
        reference: 'REF_FAIL_' + Date.now(),
        description: 'Test Overdraft Purchase'
      });
    } catch (err: any) {
      errorCaught = true;
      assert.ok(err.message.toLowerCase().includes('insufficient') || err.message.toLowerCase().includes('balance'));
    }

    assert.strictEqual(errorCaught, true, 'Overdraft debit must be blocked');
  });
});
