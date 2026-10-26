import { describe, it } from 'node:test';
import assert from 'node:assert';
import { db } from '../database/index.js';
import { CONFIG } from '../config/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = CONFIG.JWT_SECRET;

async function request(path: string, options: any = {}) {
  const url = `http://127.0.0.1:5000${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, ok: res.ok, body: json };
}

async function runRbacTests() {
  console.log('🛡️ Running Anti-Penetration & RBAC Department Permissions Test Suite...\n');

  // 1. Create a subadmin for each department
  const subAdminPasswordHash = 'hashed_pass';
  const timestamp = Date.now();

  const financeEmail = `fin_officer_${timestamp}@abkdata.com`;
  const supportEmail = `support_rep_${timestamp}@abkdata.com`;
  const servicesEmail = `telecom_ops_${timestamp}@abkdata.com`;

  const finId = `user_fin_${timestamp}`;
  const supId = `user_sup_${timestamp}`;
  const opsId = `user_ops_${timestamp}`;
  const custId = `user_cust_${timestamp}`;

  const nowIso = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, sub_admin_role, status, active_session_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'sub_admin', 'finance', 'active', ?, ?, ?)
  `).run(finId, 'Finance Officer', financeEmail, `0801${timestamp.toString().slice(-7)}`, subAdminPasswordHash, 'sess_fin', nowIso, nowIso);

  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, sub_admin_role, status, active_session_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'sub_admin', 'support', 'active', ?, ?, ?)
  `).run(supId, 'Support Agent', supportEmail, `0802${timestamp.toString().slice(-7)}`, subAdminPasswordHash, 'sess_sup', nowIso, nowIso);

  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, sub_admin_role, status, active_session_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'sub_admin', 'services', 'active', ?, ?, ?)
  `).run(opsId, 'Services Engineer', servicesEmail, `0803${timestamp.toString().slice(-7)}`, subAdminPasswordHash, 'sess_ops', nowIso, nowIso);

  // Normal Customer Token
  const custEmail = `attacker_${timestamp}@gmail.com`;
  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, status, active_session_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'customer', 'active', ?, ?, ?)
  `).run(custId, 'Attacker', custEmail, `0804${timestamp.toString().slice(-7)}`, subAdminPasswordHash, 'sess_att', nowIso, nowIso);

  // Mint tokens
  const finToken = jwt.sign({ id: finId, email: financeEmail, role: 'sub_admin', sessionId: 'sess_fin' }, JWT_SECRET, { expiresIn: '1h' });
  const supToken = jwt.sign({ id: supId, email: supportEmail, role: 'sub_admin', sessionId: 'sess_sup' }, JWT_SECRET, { expiresIn: '1h' });
  const opsToken = jwt.sign({ id: opsId, email: servicesEmail, role: 'sub_admin', sessionId: 'sess_ops' }, JWT_SECRET, { expiresIn: '1h' });
  const custToken = jwt.sign({ id: custId, email: custEmail, role: 'customer', sessionId: 'sess_att' }, JWT_SECRET, { expiresIn: '1h' });

  let passCount = 0;

  console.log('1. Testing Customer Penetration Attempts on Admin APIs...');
  const hackAttempt1 = await request('/api/admin/stats', {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  assert.strictEqual(hackAttempt1.status, 403, 'Customer must be blocked with HTTP 403');
  console.log('  ✅ PASS: Customer blocked from /api/admin/stats (HTTP 403)');
  passCount++;

  const hackAttempt2 = await request('/api/admin/users', {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  assert.strictEqual(hackAttempt2.status, 403, 'Customer blocked from /api/admin/users');
  console.log('  ✅ PASS: Customer blocked from /api/admin/users (HTTP 403)');
  passCount++;

  console.log('\n2. Testing Finance Officer Permissions & Strict Boundaries...');
  const finPerms = await request('/api/admin/my-permissions', {
    headers: { Authorization: `Bearer ${finToken}` }
  });
  assert.strictEqual(finPerms.status, 200);
  assert.strictEqual(finPerms.body.department, 'finance');
  assert.strictEqual(finPerms.body.permissions.includes('ADJUST_WALLET'), true);
  assert.strictEqual(finPerms.body.permissions.includes('MANAGE_PLANS'), false);
  console.log('  ✅ PASS: Finance Officer has ADJUST_WALLET permission');
  console.log('  ✅ PASS: Finance Officer lacks MANAGE_PLANS permission');
  passCount += 2;

  // Finance Officer tries to access Users management (must be denied)
  const finHacksUsers = await request('/api/admin/users', {
    headers: { Authorization: `Bearer ${finToken}` }
  });
  assert.strictEqual(finHacksUsers.status, 403, 'Finance subadmin cannot view users');
  console.log('  ✅ PASS: Finance Officer blocked from accessing Users Directory (HTTP 403)');
  passCount++;

  console.log('\n3. Testing Support Agent Permissions & Strict Boundaries...');
  const supPerms = await request('/api/admin/my-permissions', {
    headers: { Authorization: `Bearer ${supToken}` }
  });
  assert.strictEqual(supPerms.status, 200);
  assert.strictEqual(supPerms.body.department, 'support');
  assert.strictEqual(supPerms.body.permissions.includes('VIEW_USERS'), true);
  assert.strictEqual(supPerms.body.permissions.includes('ADJUST_WALLET'), false);
  console.log('  ✅ PASS: Support Agent has VIEW_USERS permission');
  console.log('  ✅ PASS: Support Agent lacks ADJUST_WALLET permission');
  passCount += 2;

  // Support Agent tries to fund wallet (must be denied)
  const supTriesWalletHack = await request('/api/admin/wallet/adjustment', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: custId,
      type: 'CREDIT',
      amount: 100000,
      reason: 'Support unauthorized credit attempt'
    })
  });
  assert.strictEqual(supTriesWalletHack.status, 403, 'Support rep must be blocked from adjusting wallets');
  console.log('  ✅ PASS: Support Agent strictly blocked from /api/admin/wallet/adjustment (HTTP 403)');
  passCount++;

  console.log('\n4. Testing Telecom Services Ops Permissions & Strict Boundaries...');
  const opsPerms = await request('/api/admin/my-permissions', {
    headers: { Authorization: `Bearer ${opsToken}` }
  });
  assert.strictEqual(opsPerms.status, 200);
  assert.strictEqual(opsPerms.body.department, 'services');
  assert.strictEqual(opsPerms.body.permissions.includes('MANAGE_PLANS'), true);
  assert.strictEqual(opsPerms.body.permissions.includes('APPROVE_WITHDRAWALS'), false);
  console.log('  ✅ PASS: Services Engineer has MANAGE_PLANS permission');
  console.log('  ✅ PASS: Services Engineer lacks APPROVE_WITHDRAWALS permission');
  passCount += 2;

  // Services Engineer tries to view reports/finances
  const opsHacksReports = await request('/api/admin/reports/summary', {
    headers: { Authorization: `Bearer ${opsToken}` }
  });
  assert.strictEqual(opsHacksReports.status, 403, 'Services subadmin cannot view financial reports');
  console.log('  ✅ PASS: Services Engineer blocked from financial reports (HTTP 403)');
  passCount++;

  console.log('\n========================================');
  console.log(`🛡️ RBAC TEST SUMMARY: ${passCount} PASSED, 0 FAILED`);
  console.log('========================================');
}

runRbacTests().catch((err) => {
  console.error('❌ RBAC Test Failed:', err);
  process.exit(1);
});
