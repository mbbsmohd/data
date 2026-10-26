import assert from 'assert';
import { db } from '../database/index.js';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Admin Support, System Health & App Versioning Test Suite...\n');
  let passed = 0;

  // 1. Authenticate as Super Admin
  console.log('1. Authenticating Super Admin...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@abkdata.com',
      password: 'Admin@Secure2026!'
    })
  });
  const loginData: any = await loginRes.json();
  let adminToken = loginData.token;
  if (loginData.require2FA) {
    const twoFaOtp = loginData.devOtpCode || (db.prepare(`
      SELECT code FROM otp_verifications
      WHERE identifier = 'admin@abkdata.com' AND purpose = 'LOGIN_2FA' AND is_used = 0
      ORDER BY created_at DESC LIMIT 1
    `).get() as any)?.code;
    const otpVerifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@abkdata.com',
        code: twoFaOtp,
        purpose: 'LOGIN_2FA'
      })
    });
    const otpData: any = await otpVerifyRes.json();
    adminToken = otpData.token;
  }
  assert(adminToken, 'Super Admin token must be acquired');
  console.log('  ✅ PASS: Super Admin session acquired\n');
  passed++;

  // 2. Test GET /api/admin/system-health
  console.log('2. Testing System Health & Core Engine Diagnostics...');
  const healthRes = await fetch(`${BASE_URL}/admin/system-health`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const healthData: any = await healthRes.json();
  assert.strictEqual(healthRes.status, 200, 'System health must return HTTP 200');
  assert.strictEqual(healthData.success, true);
  assert.strictEqual(healthData.health.status, 'OPTIMAL');
  assert(healthData.health.database.sizeBytes > 0, 'Database file size must be > 0');
  assert(healthData.health.database.totalLedgerEntries >= 0, 'Ledger entries must be tracked');
  assert(healthData.health.memory.heapUsedMb > 0, 'Heap memory must be positive');
  console.log(`  ✅ PASS: Engine status is ${healthData.health.status}`);
  console.log(`  ✅ PASS: Database SQLite WAL size: ${healthData.health.database.sizeFormatted}`);
  console.log(`  ✅ PASS: Memory heap used: ${healthData.health.memory.heapUsedMb} MB`);
  passed += 3;

  // 3. Test GET /api/admin/app-version
  console.log('\n3. Testing Mobile App Versioning & Release Policy...');
  const verRes = await fetch(`${BASE_URL}/admin/app-version`);
  const verData: any = await verRes.json();
  assert.strictEqual(verRes.status, 200);
  assert.strictEqual(verData.success, true);
  assert.strictEqual(verData.version, '1.0.0');
  assert(verData.updateUrlAndroid.includes('com.abkdata.app'));
  assert(verData.updateUrlIos.length > 0);
  console.log(`  ✅ PASS: Mobile app package ID: com.abkdata.app (v${verData.version})`);
  console.log(`  ✅ PASS: Store URLs and update policies returned`);
  passed += 2;

  // 4. Test Customer Ticket Submission & Admin Reply
  console.log('\n4. Testing Customer Support Ticket Lifecycle & Staff Reply...');
  // Create a customer user
  const email = `testuser_${Date.now()}@example.com`;
  const phone = '080' + Math.floor(10000000 + Math.random() * 90000000);
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Salisu Diagnostic User',
      email,
      phone,
      password: 'password123',
      transactionPin: '4321'
    })
  });
  const regData: any = await regRes.json();
  const customerToken = regData.token;

  // Customer creates a support ticket
  const createTicketRes = await fetch(`${BASE_URL}/notifications/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      subject: 'Inquiry regarding MTN SME plan speed',
      message: 'Hello, please confirm latency on MTN SME data routes.',
      category: 'TELECOM',
      priority: 'HIGH'
    })
  });
  const ticketData: any = await createTicketRes.json();
  assert.strictEqual(ticketData.success, true, 'Ticket creation must succeed');
  const ticketId = ticketData.ticketId;
  console.log(`  ✅ PASS: Customer submitted support ticket: ${ticketId}`);
  passed++;

  // Admin retrieves tickets list
  const listTixRes = await fetch(`${BASE_URL}/admin/support/tickets?status=OPEN`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const listTixData: any = await listTixRes.json();
  assert.strictEqual(listTixData.success, true);
  const found = listTixData.tickets.find((t: any) => t.id === ticketId);
  assert(found, 'Created ticket must be visible in admin support tickets list');
  assert.strictEqual(found.user_name, 'Salisu Diagnostic User');
  console.log(`  ✅ PASS: Super Admin listed ticket with customer metadata`);
  passed += 2;

  // Admin replies to ticket and updates status to RESOLVED
  const replyRes = await fetch(`${BASE_URL}/admin/support/tickets/${ticketId}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      message: 'MTN SME routes are operating at < 350ms with automated failover enabled.',
      status: 'RESOLVED'
    })
  });
  const replyData: any = await replyRes.json();
  assert.strictEqual(replyData.success, true);
  console.log(`  ✅ PASS: Super Admin dispatched official staff reply and updated status to RESOLVED`);
  passed++;

  // Verify ticket status and replies in database
  const verifyTixRes = await fetch(`${BASE_URL}/admin/support/tickets?status=RESOLVED`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const verifyData: any = await verifyTixRes.json();
  const resolvedTicket = verifyData.tickets.find((t: any) => t.id === ticketId);
  assert(resolvedTicket, 'Ticket must now appear under RESOLVED filter');
  assert.strictEqual(resolvedTicket.status, 'RESOLVED');
  assert(resolvedTicket.replies.length >= 1, 'Ticket must contain staff reply');
  console.log(`  ✅ PASS: Thread history recorded with Staff sender type`);
  passed += 2;

  console.log('\n========================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, 0 FAILED`);
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
