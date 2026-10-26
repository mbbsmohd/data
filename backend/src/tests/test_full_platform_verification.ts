import { db } from '../database/index.js';

async function runTests() {
  const BASE_URL = 'http://localhost:5000';
  console.log('🧪 Starting Full Platform Real Verification Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health & Branding
    console.log('1. Testing System Settings & Branding API...');
    const setRes = await fetch(`${BASE_URL}/api/settings`);
    const setData = await setRes.json();
    assert(setData.success === true, 'GET /api/settings returns success');
    assert(Boolean(setData.settings.app_name), `Brand Name is set: "${setData.settings.app_name}"`);

    // 2. Authentication: Sign in as admin with default seed password
    console.log('\n2. Testing Authentication...');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@abkdata.com',
        password: 'Admin@Secure2026!'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginData.success === true, 'Admin login initiated');
    let adminToken = adminLoginData.token;

    if (adminLoginData.require2FA) {
      console.log('  ℹ️ 2FA is active for admin, verifying 2FA OTP code...');
      const otpFromDb = (db.prepare(`
        SELECT code FROM otp_verifications
        WHERE identifier = 'admin@abkdata.com' AND purpose = 'LOGIN_2FA' AND is_used = 0
        ORDER BY created_at DESC LIMIT 1
      `).get() as any)?.code;
      const twoFaOtp = adminLoginData.devOtpCode || otpFromDb;
      const verify2FaRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'admin@abkdata.com',
          code: twoFaOtp,
          purpose: 'LOGIN_2FA'
        })
      });
      const verify2FaData = await verify2FaRes.json();
      adminToken = verify2FaData.token;
    }
    assert(Boolean(adminToken), 'Super Admin JWT session token successfully obtained');

    // 3. Forgot Password & OTP Flow
    console.log('\n3. Testing Real Password Reset & Fast OTP Engine...');
    const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@abkdata.com' })
    });
    const forgotData = await forgotRes.json();
    assert(forgotData.success === true, 'POST /api/auth/forgot-password dispatches OTP');

    // Retrieve fast OTP from DB
    const otpStmt = db.prepare(`
      SELECT code FROM otp_verifications
      WHERE identifier = 'admin@abkdata.com' AND purpose = 'PASSWORD_RESET' AND is_used = 0
      ORDER BY created_at DESC LIMIT 1
    `);
    const otpRow = otpStmt.get() as { code: string } | undefined;
    assert(Boolean(otpRow?.code), `Fast 6-digit OTP generated in database: ${otpRow?.code}`);

    // Execute password reset
    const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@abkdata.com',
        code: otpRow?.code,
        newPassword: 'Admin@Secure2026!'
      })
    });
    const resetData = await resetRes.json();
    assert(resetData.success === true, 'POST /api/auth/reset-password executes successfully');

    // 4. Test Customer Account Creation & PIN Setup
    console.log('\n4. Testing Customer Onboarding & 4-Digit PIN Security...');
    const testEmail = `customer_${Date.now()}@example.com`;
    const signupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Amina Bello',
        email: testEmail,
        phone: `080${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: 'CustomerPass123!',
        transactionPin: '5566'
      })
    });
    const signupData = await signupRes.json();
    assert(signupData.success === true, `Customer registered: ${testEmail}`);
    const customerToken = signupData.token;
    const customerId = signupData.user.id;

    // Verify 4-digit PIN works
    const verifyPinRes = await fetch(`${BASE_URL}/api/auth/verify-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ pin: '5566' })
    });
    const verifyPinData = await verifyPinRes.json();
    assert(verifyPinData.success === true, 'Customer 4-digit PIN 5566 successfully verified');

    // 5. Admin Manually Credits Customer Wallet
    console.log('\n5. Testing Super Admin Manual Wallet Credit & Double-Entry Ledger...');
    const creditRes = await fetch(`${BASE_URL}/api/admin/wallet/adjustment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: customerId,
        amount: 15000,
        type: 'CREDIT',
        reason: 'Initial onboarding grant'
      })
    });
    const creditData = await creditRes.json();
    if (!creditData.success) console.error('creditData error:', creditData);
    assert(creditData.success === true, 'Super Admin credited customer wallet ₦15,000');
    assert(creditData.newBalance === 15000, 'Customer balance is now exactly ₦15,000');

    // 6. Customer Requests Bank Withdrawal (Approved Flow)
    console.log('\n6. Testing Customer Bank Withdrawal Request & Admin Approval...');
    const withdraw1Res = await fetch(`${BASE_URL}/api/withdrawals/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        amount: 5000,
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'Amina Bello',
        pin: '5566',
        narration: 'Personal savings payout'
      })
    });
    const w1Data = await withdraw1Res.json();
    if (!w1Data.success) console.error('w1Data error:', w1Data);
    assert(w1Data.success === true, 'Customer submitted ₦5,000 withdrawal request');
    const w1Id = w1Data.withdrawal?.id;

    // Check balance after 1st debit
    const wal1 = await (await fetch(`${BASE_URL}/api/wallet`, { headers: { 'Authorization': `Bearer ${customerToken}` } })).json();
    assert(wal1.wallet.balance === 10000, `Wallet atomically debited from ₦15,000 to ₦10,000 (Current: ₦${wal1.wallet.balance})`);

    // Admin Approves Withdrawal
    const approveRes = await fetch(`${BASE_URL}/api/withdrawals/admin/${w1Id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        reference: 'BNK_TX_987654321',
        notes: 'Transferred via NIP Access Bank'
      })
    });
    const approveData = await approveRes.json();
    assert(approveData.success === true, 'Super Admin marked withdrawal as COMPLETED');
    assert(approveData.status === 'COMPLETED', 'Withdrawal status is COMPLETED');

    // 7. Customer Requests Second Withdrawal & Admin Rejects with 100% Instant Refund
    console.log('\n7. Testing Withdrawal Rejection & Guaranteed Instant 100% Refund...');
    const withdraw2Res = await fetch(`${BASE_URL}/api/withdrawals/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        amount: 4000,
        bankName: 'GTBank',
        accountNumber: '0987654321',
        accountName: 'Amina Bello Incomplete',
        pin: '5566',
        narration: 'Second withdrawal test'
      })
    });
    const w2Data = await withdraw2Res.json();
    assert(w2Data.success === true, 'Customer submitted ₦4,000 withdrawal request');
    const w2Id = w2Data.withdrawal?.id;

    const wal2 = await (await fetch(`${BASE_URL}/api/wallet`, { headers: { 'Authorization': `Bearer ${customerToken}` } })).json();
    assert(wal2.wallet.balance === 6000, `Wallet debited to ₦6,000 during request (Current: ₦${wal2.wallet.balance})`);

    // Admin Rejects Withdrawal
    const rejectRes = await fetch(`${BASE_URL}/api/withdrawals/admin/${w2Id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        reason: 'Bank account name mismatch with KYC document'
      })
    });
    const rejectData = await rejectRes.json();
    assert(rejectData.success === true, 'Admin rejected withdrawal');
    assert(rejectData.status === 'REJECTED', 'Withdrawal status is REJECTED');

    // Verify 100% wallet refund
    const walletRes = await fetch(`${BASE_URL}/api/wallet`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const walletData = await walletRes.json();
    assert(walletData.wallet.balance === 10000, `Wallet balance restored to exactly ₦10,000 (Current: ₦${walletData.wallet.balance})`);

    // Verify refund ledger entry exists
    const ledgerStmt = db.prepare(`
      SELECT * FROM ledger_entries
      WHERE user_id = ? AND category = 'REFUND'
      ORDER BY created_at DESC LIMIT 1
    `);
    const refundRow = ledgerStmt.get(customerId) as any;
    assert(Boolean(refundRow), 'Immutable double-entry REFUND ledger record confirmed');
    assert(refundRow?.amount === 4000, `Refund ledger amount matches: ₦${refundRow?.amount}`);

    // 8. Super Admin 360 User Inspection API
    console.log('\n8. Testing Super Admin User Inspection & Profile Management...');
    const inspectRes = await fetch(`${BASE_URL}/api/admin/users/${customerId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const inspectData = await inspectRes.json();
    assert(inspectData.success === true, 'GET /api/admin/users/:id returned 360 profile');
    assert(inspectData.data.ledgerEntries.length >= 3, `Double-entry ledger entries returned: ${inspectData.data.ledgerEntries.length}`);
    assert(inspectData.data.withdrawals.length === 2, `User withdrawals list returned: ${inspectData.data.withdrawals.length}`);

    // Update user role and tier
    const updateUserRes = await fetch(`${BASE_URL}/api/admin/users/${customerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Amina Bello (VIP Reseller)',
        role: 'agent',
        tier: 2,
        status: 'active'
      })
    });
    const updateUserData = await updateUserRes.json();
    assert(updateUserData.success === true, 'Super Admin updated user role to "agent" and tier to 2');

    // Reset user credentials directly
    const resetCredRes = await fetch(`${BASE_URL}/api/admin/users/${customerId}/reset-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        newPassword: 'BrandNewSecurePass123!',
        newPin: '9988'
      })
    });
    const resetCredData = await resetCredRes.json();
    assert(resetCredData.success === true, 'Super Admin reset customer password and 4-digit PIN');

    // Test sign in with new credentials
    const customerReLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        password: 'BrandNewSecurePass123!'
      })
    });
    const reLoginData = await customerReLogin.json();
    assert(reLoginData.success === true, 'Customer signed in with newly reset password');

    // Test verify new PIN 9988
    const verifyNewPinRes = await fetch(`${BASE_URL}/api/auth/verify-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${reLoginData.token}`
      },
      body: JSON.stringify({ pin: '9988' })
    });
    const verifyNewPinData = await verifyNewPinRes.json();
    assert(verifyNewPinData.success === true, 'New 4-digit PIN 9988 verified successfully');

    // 9. Enterprise Single Active Session Enforcement
    console.log('\n9. Testing Enterprise Single Active Session Enforcement...');
    // Login session 1
    const session1Res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, password: 'BrandNewSecurePass123!' })
    });
    const session1Data = await session1Res.json();
    const token1 = session1Data.token;
    assert(Boolean(token1), 'Session 1 token obtained for customer');

    // Verify token1 works
    const token1Check = await fetch(`${BASE_URL}/api/wallet`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    assert(token1Check.status === 200, 'Session 1 token successfully accesses protected endpoint');

    // Login session 2 from a new device/browser for the SAME customer
    const session2Res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, password: 'BrandNewSecurePass123!' })
    });
    const session2Data = await session2Res.json();
    const token2 = session2Data.token;
    assert(Boolean(token2), 'Session 2 token obtained for customer');

    // Now verify token1 is automatically terminated (HTTP 401 with sessionTerminated: true)
    const token1After = await fetch(`${BASE_URL}/api/wallet`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const token1AfterData = await token1After.json();
    assert(token1After.status === 401, 'Prior Session 1 token immediately rejected (HTTP 401)');
    assert(token1AfterData.sessionTerminated === true, 'Response flags sessionTerminated = true for client redirect');

    // Verify session 2 token is the ONLY active valid session
    const token2Check = await fetch(`${BASE_URL}/api/wallet`, {
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    assert(token2Check.status === 200, 'Active Session 2 token successfully authorized');

    // 10. Duplicate Transaction Guard (60s Idempotent Prevention)
    console.log('\n10. Testing 60-Second Duplicate Transaction Prevention Engine...');
    const duplicateRecipient = '08031234567';
    // First purchase of airtime
    const firstPurchaseRes = await fetch(`${BASE_URL}/api/vtu/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`,
        'X-Idempotency-Key': `idemp_${Date.now()}_1`
      },
      body: JSON.stringify({
        category: 'airtime',
        billerOrNetwork: 'MTN',
        recipient: duplicateRecipient,
        amount: 200
      })
    });
    const firstPurchaseData = await firstPurchaseRes.json();
    assert(firstPurchaseData.success === true, 'First airtime purchase of ₦200 succeeded');

    // Immediate second purchase with exact same user, recipient, category, and amount
    const duplicatePurchaseRes = await fetch(`${BASE_URL}/api/vtu/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`,
        'X-Idempotency-Key': `idemp_${Date.now()}_2`
      },
      body: JSON.stringify({
        category: 'airtime',
        billerOrNetwork: 'MTN',
        recipient: duplicateRecipient,
        amount: 200
      })
    });
    const duplicatePurchaseData = await duplicatePurchaseRes.json();
    assert(duplicatePurchaseData.success === false, 'Duplicate purchase blocked by server');
    assert(duplicatePurchaseData.message.includes('Duplicate transaction'), `Error message correctly reports duplicate protection: "${duplicatePurchaseData.message}"`);

    // 11. Sub-Admin Staff Creation, Department Role & Suspension
    console.log('\n11. Testing Sub-Admin Creation, Role Scoping & Suspension...');
    const subadminEmail = `subadmin_${Date.now()}@abkdata.com`;
    const subadminPhone = '080' + Math.floor(10000000 + Math.random() * 90000000);
    const createSubRes = await fetch(`${BASE_URL}/api/admin/subadmins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Fatima Finance Lead',
        email: subadminEmail,
        phone: subadminPhone,
        password: 'SubAdminPass2026!',
        subAdminRole: 'finance',
        transactionPin: '4321'
      })
    });
    const createSubData = await createSubRes.json();
    if (!createSubData.success) console.error('createSubData error:', createSubData);
    assert(createSubData.success === true, 'Super Admin created new sub-admin staff');
    const createdSubadminId = createSubData.subadmin?.id;
    assert(Boolean(createdSubadminId), 'Sub-admin user ID generated');

    // Verify sub-admin in list
    const listSubRes = await fetch(`${BASE_URL}/api/admin/subadmins`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const listSubData = await listSubRes.json();
    assert(listSubData.success === true, 'GET /api/admin/subadmins returned list');
    const foundSub = listSubData.subadmins.find((s: any) => s.email === subadminEmail);
    assert(Boolean(foundSub), `Sub-admin ${subadminEmail} listed in admin staff directory`);
    assert(foundSub?.sub_admin_role === 'finance' || foundSub?.subadmin_role === 'finance', `Assigned sub-admin role matches 'finance'`);

    // Suspend sub-admin
    const suspendSubRes = await fetch(`${BASE_URL}/api/admin/subadmins/${createdSubadminId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'suspended' })
    });
    const suspendSubData = await suspendSubRes.json();
    assert(suspendSubData.success === true, 'Super Admin suspended sub-admin account');

    // Verify suspension in DB
    const subDbRow = db.prepare('SELECT status FROM users WHERE id = ?').get(createdSubadminId) as any;
    assert(subDbRow?.status === 'suspended', 'Sub-admin status confirmed suspended in database');

    // 12. Real Financial Intelligence & Reporting Summary Engine
    console.log('\n12. Testing Financial Reports & Calculations Engine...');
    const reportRes = await fetch(`${BASE_URL}/api/admin/reports/summary?period=all`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const reportData = await reportRes.json();
    assert(reportData.success === true, 'GET /api/admin/reports/summary returned calculated metrics');
    assert(typeof reportData.summary.totalInflow === 'number', `Total Inflows computed: ₦${reportData.summary.totalInflow.toLocaleString()}`);
    assert(typeof reportData.summary.totalOutflow === 'number', `Total Outflows computed: ₦${reportData.summary.totalOutflow.toLocaleString()}`);
    assert(typeof reportData.summary.grossProfit === 'number', `Gross Profit margin computed: ₦${reportData.summary.grossProfit.toLocaleString()}`);
    assert(typeof reportData.summary.walletLiabilities === 'number', `Active User Wallet liabilities computed: ₦${reportData.summary.walletLiabilities.toLocaleString()}`);
    assert(Array.isArray(reportData.summary.categories), 'Service categories breakdown array returned');

    // Test RFC4180 CSV Export Endpoint
    const csvExportRes = await fetch(`${BASE_URL}/api/admin/reports/export?period=all`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(csvExportRes.status === 200, 'GET /api/admin/reports/export returns HTTP 200');
    const csvContent = await csvExportRes.text();
    assert(csvContent.includes('Reference,Date,Category,Network/Biller,Recipient'), 'CSV contains standard RFC4180 headers');
    assert(csvContent.split('\n').length >= 2, 'CSV contains generated transaction data lines');

    console.log(`\n========================================`);
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
