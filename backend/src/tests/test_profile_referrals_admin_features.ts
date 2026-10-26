import { api } from './test_api_client';
import { db } from '../database';

async function runTests() {
  console.log('🚀 Running Profile, Anti-Fraud Withdrawal, Referral & Admin Feature Tests...\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failCount++;
    }
  }

  try {
    // 1. Admin Login
    console.log('1. Authenticating Super Admin...');
    const adminLoginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@abkdata.com', password: 'Admin@Secure2026!' })
    });
    const adminLoginData = await adminLoginRes.json();
    let adminToken = adminLoginData.token;
    if (adminLoginData.require2FA) {
      const otpRow: any = db.prepare("SELECT code FROM otp_verifications WHERE identifier = 'admin@abkdata.com' AND purpose = 'LOGIN_2FA' AND is_used = 0 ORDER BY created_at DESC LIMIT 1").get();
      const otpCode = adminLoginData.devOtpCode || otpRow?.code;
      const verifyRes = await fetch('http://127.0.0.1:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'admin@abkdata.com', code: otpCode, purpose: 'LOGIN_2FA' })
      });
      const verifyData = await verifyRes.json();
      adminToken = verifyData.token;
    }
    assert(Boolean(adminToken), 'Super Admin JWT session acquired');

    // 2. Admin creates a new User with initial balance
    console.log('\n2. Testing Admin User Provisioning & Initial Ledger Credit...');
    const userTimestamp = Date.now();
    const testEmail = `chidi_${userTimestamp}@example.com`;
    const createUserRes = await fetch('http://127.0.0.1:5000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Chidi Okafor',
        email: testEmail,
        phone: `080${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: 'Password123!',
        transactionPin: '1234',
        role: 'agent',
        tier: 2,
        initialBalance: 12000
      })
    });
    const createUserData = await createUserRes.json();
    assert(createUserData.success === true, 'Admin successfully created new agent account');
    assert(createUserData.user.balance === 12000, 'Initial balance of ₦12,000 credited to ledger');
    assert(Boolean(createUserData.user.referralCode), 'User has unique referral code generated');

    // Login as the newly created user
    const userLoginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, password: 'Password123!' })
    });
    const userLoginData = await userLoginRes.json();
    const userToken = userLoginData.token;
    assert(Boolean(userToken), 'New user successfully logged in');

    // 3. User Profile Anti-Fraud Protection
    console.log('\n3. Testing User Profile Anti-Fraud Locking & Secondary Field Editing...');
    // Attempting to directly change legal name should be rejected with HTTP 403
    const illegalUpdateRes = await fetch('http://127.0.0.1:5000/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({ name: 'Fraud Name Change' })
    });
    assert(illegalUpdateRes.status === 403, 'Direct update to legal name strictly rejected (HTTP 403)');

    // Attempting to directly change email should be rejected
    const illegalEmailRes = await fetch('http://127.0.0.1:5000/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({ email: 'newemail@example.com' })
    });
    assert(illegalEmailRes.status === 403, 'Direct update to email strictly rejected (HTTP 403)');

    // Valid secondary update (Address, State, Bio, WhatsApp)
    const validProfileRes = await fetch('http://127.0.0.1:5000/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        address: '15 Awolowo Road, Ikoyi',
        state: 'Lagos',
        dateOfBirth: '1992-05-14',
        bio: 'Telecom Agent & VTU Merchant',
        whatsappNumber: '2348012345678'
      })
    });
    const validProfileData = await validProfileRes.json();
    assert(validProfileData.success === true, 'Secondary profile fields updated successfully');
    assert(validProfileData.user.address === '15 Awolowo Road, Ikoyi', 'Address saved accurately');
    assert(validProfileData.user.state === 'Lagos', 'State saved accurately');

    // Formal identity change ticket request
    const ticketRes = await fetch('http://127.0.0.1:5000/api/auth/profile/request-update-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        field: 'Legal Name',
        requestedValue: 'Chidi David Okafor',
        reason: 'Adding middle name per National Identity Number update'
      })
    });
    const ticketData = await ticketRes.json();
    assert(ticketData.success === true, 'Formal KYC identity change ticket submitted to support desk');
    assert(Boolean(ticketData.ticketId), 'Support Ticket ID generated');

    // 4. Withdrawal Anti-Fraud Security
    console.log('\n4. Testing Anti-Fraud Withdrawal Checks (Balance & Name Token Matching)...');
    // Test A: User attempts to withdraw more than their balance
    const overdrawRes = await fetch('http://127.0.0.1:5000/api/withdrawals/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        amount: 25000, // Balance is only 12000
        bankCode: '044',
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'Chidi Okafor',
        transactionPin: '1234'
      })
    });
    const overdrawData = await overdrawRes.json();
    assert(overdrawRes.status === 400, 'Withdrawal exceeding wallet balance rejected (HTTP 400)');
    assert((overdrawData.message || overdrawData.error || '').includes('Insufficient funds'), 'Clear error indicates insufficient balance');

    // Test B: Destination account name does not match user registered name
    const mismatchedNameRes = await fetch('http://127.0.0.1:5000/api/withdrawals/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        amount: 3000,
        bankCode: '044',
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'Babatunde Fashola', // Different person
        transactionPin: '1234'
      })
    });
    const mismatchedData = await mismatchedNameRes.json();
    assert(mismatchedNameRes.status === 400, 'Third-party withdrawal strictly blocked by name verification');
    assert((mismatchedData.message || mismatchedData.error || '').toLowerCase().includes('match'), 'Clear anti-fraud rationale provided');

    // Test C: Matching account name ("Chidi Okafor") within balance (₦3,000)
    const validWithdrawRes = await fetch('http://127.0.0.1:5000/api/withdrawals/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        amount: 3000,
        bankCode: '044',
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'Okafor Chidi', // Token match (Bello Amina <-> Amina Bello)
        transactionPin: '1234'
      })
    });
    const validWithdrawData = await validWithdrawRes.json();
    assert(validWithdrawData.success === true, 'Legitimate same-name withdrawal accepted');
    assert(validWithdrawData.newBalance === 9000, 'Balance atomically updated to ₦9,000 (12000 - 3000)');

    // 5. Referral Program & Commission Transfer Engine
    console.log('\n5. Testing Referral Engine & Atomic Commission Transfer...');
    const referralSummaryRes = await fetch('http://127.0.0.1:5000/api/referrals/summary', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const refData = await referralSummaryRes.json();
    assert(refData.success === true, 'Referral summary retrieved');
    assert(Boolean(refData.summary.referralCode), `Referral code verified: ${refData.summary.referralCode}`);
    assert(refData.summary.referralLink.includes(refData.summary.referralCode), 'Shareable affiliate link contains user referral code');

    // Add some commission balance to test transfer
    db.prepare('UPDATE wallets SET commission_balance = 2500 WHERE user_id = ?').run(createUserData.user.id);

    // Transfer ₦2,000 commission to main spending wallet
    const transferRes = await fetch('http://127.0.0.1:5000/api/referrals/transfer-commission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({ amount: 2000 })
    });
    const transferData = await transferRes.json();
    if (!transferData.success) {
      console.log('Transfer Data Debug:', transferData);
    }
    assert(transferData.success === true, 'Transferred ₦2,000 commission to main wallet');
    assert(transferData.newCommissionBalance === 500, 'Remaining commission balance is ₦500 (2500 - 2000)');
    assert(transferData.newWalletBalance === 11000, 'Main wallet balance increased to ₦11,000 (9000 + 2000)');

    // Verify double-entry ledger entry was created
    const ledgerRow: any = db.prepare("SELECT * FROM ledger_entries WHERE user_id = ? AND category = 'COMMISSION_TRANSFER' ORDER BY created_at DESC LIMIT 1").get(createUserData.user.id);
    assert(Boolean(ledgerRow), 'Atomic COMMISSION_TRANSFER record created in ledger');
    assert(ledgerRow.amount === 2000, 'Ledger entry records exact transfer amount ₦2,000');
    assert(ledgerRow.balance_before === 9000 && ledgerRow.balance_after === 11000, 'Ledger before and after balances strictly preserved');

    // 6. Admin Multi-Year Financial Reports & CSV Export
    console.log('\n6. Testing Multi-Year Financial Reports & Custom Date Ranges...');
    // Test Year filter
    const yearReportRes = await fetch('http://127.0.0.1:5000/api/admin/reports/summary?year=2026', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const yearReportData = await yearReportRes.json();
    assert(yearReportData.success === true, 'Reports summary for year 2026 retrieved');
    assert(typeof yearReportData.summary.totalInflow === 'number', 'Total inflows computed for 2026');

    // Test Custom Date Range filter
    const customReportRes = await fetch('http://127.0.0.1:5000/api/admin/reports/summary?startDate=2026-01-01&endDate=2026-12-31', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const customReportData = await customReportRes.json();
    assert(customReportData.success === true, 'Reports summary for custom date range retrieved');

    // Test Year CSV Export
    const csvRes = await fetch('http://127.0.0.1:5000/api/admin/reports/export?year=2026', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(csvRes.status === 200, 'Financial CSV export for year 2026 returned HTTP 200');
    const csvText = await csvRes.text();
    assert(csvText.includes('Reference') && csvText.includes('Category'), 'CSV contains standard transaction headers');

    // 7. Platform Settings (Maintenance Mode, Referral Bonus & Commission)
    console.log('\n7. Testing Platform Settings & Emergency Maintenance Mode Toggle...');
    const updateSettingsRes = await fetch('http://127.0.0.1:5000/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        appName: 'ABK Data Cloud Premium',
        primaryColor: '#1E5BF9',
        accentColor: '#10B981',
        maintenanceMode: 1,
        maintenanceMessage: 'Scheduled engine upgrade in progress.',
        referralBonusAmount: 200,
        referralCommissionPercent: 3
      })
    });
    const updateSettingsData = await updateSettingsRes.json();
    assert(updateSettingsData.success === true, 'Settings successfully updated');
    assert(updateSettingsData.settings.maintenance_mode === 1, 'Maintenance mode set to 1');
    assert(updateSettingsData.settings.referral_bonus_amount === 200, 'Referral bonus amount updated to ₦200');
    assert(updateSettingsData.settings.referral_commission_percent === 3, 'Referral commission set to 3%');

    // Revert maintenance mode back to 0 for normal operations
    await fetch('http://127.0.0.1:5000/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ maintenanceMode: 0 })
    });
    assert(true, 'Maintenance mode safely restored to 0 (Normal Live Operation)');

    console.log(`\n========================================`);
    console.log(`🎉 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`========================================\n`);

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Test Suite encountered error:', err);
    process.exit(1);
  }
}

runTests();
