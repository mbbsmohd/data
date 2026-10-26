import assert from 'assert';
import { db, initializeDatabase } from '../src/database/index.js';
import { WalletService } from '../src/services/walletService.js';
import { PaymentService } from '../src/services/paymentService.js';
import { VTUService } from '../src/services/vtuService.js';
import { AirtimeToCashService } from '../src/services/airtimeToCashService.js';
import { SavingsService } from '../src/services/savingsService.js';
import { KYCVerificationService } from '../src/services/kycVerificationService.js';
import { SimHostingService } from '../src/services/simHostingService.js';
import { ProviderService } from '../src/services/providerService.js';
import { BackupService } from '../src/services/backupService.js';
import { NotificationService } from '../src/services/notificationService.js';
import { NOTIFICATION_EVENTS } from '../src/config/index.js';

async function runTestSuite() {
  console.log('--- STARTING PLATFORM TEST SUITE ---');

  // 1. Initialize DB
  initializeDatabase();
  console.log('✓ Test 1: Database initialized & seeded with authoritative tables');

  // 2. Mohammed's Wallet balance
  const mohammed = db.prepare("SELECT id FROM users WHERE email = 'mohammed@bukardatasub.com' OR email = 'mohammed@abkdata.com'").get() as any;
  assert(mohammed, 'Mohammed user must exist');
  const initialWallet = WalletService.getWallet(mohammed.id);
  assert(initialWallet.balance >= 50, 'Mohammed wallet should have initial balance');
  console.log(`✓ Test 2: User wallet loaded. Initial balance: ₦${initialWallet.balance.toFixed(2)}`);

  // 3. Test Double-Entry Ledger Credit (Wallet Funding)
  const fundRef = 'TEST-FUND-' + Date.now();
  const fundResult = WalletService.creditWallet({
    userId: mohammed.id,
    amount: 5000.0,
    category: 'WALLET_FUNDING',
    reference: fundRef,
    description: 'Test automated bank funding'
  });
  assert(fundResult.success === true, 'Credit must succeed');
  assert(fundResult.newBalance === initialWallet.balance + 5000.0, 'Balance must accurately reflect credit');
  console.log(`✓ Test 3: Double-entry ledger credit successful. New balance: ₦${fundResult.newBalance.toFixed(2)}`);

  // 4. Test VTU Airtime Purchase
  const vtuAirtime = await VTUService.executePurchase({
    userId: mohammed.id,
    category: 'airtime',
    billerOrNetwork: 'MTN',
    recipient: '09131797675',
    amount: 100.0
  });
  assert(vtuAirtime.status === 'COMPLETED', 'VTU transaction must complete');
  console.log(`✓ Test 4: VTU Airtime transaction completed. Reference: ${vtuAirtime.reference}`);

  // 5. Test SunKing Solar PIN Generation (Matching Screenshot 4)
  const solarPurchase = await VTUService.executePurchase({
    userId: mohammed.id,
    category: 'solar_pin',
    billerOrNetwork: 'SUNKING',
    planCode: 'SUN-7DAY',
    recipient: 'SUN-8891238',
    amount: 2200.0
  });
  assert(solarPurchase.tokenOrPin !== null, 'Solar PIN must be generated');
  console.log(`✓ Test 5: SunKing Solar PIN generated: ${solarPurchase.tokenOrPin}`);

  // 6. Test Airtime-to-Cash Workflow (Matching Screenshot 4)
  const a2cOrder = AirtimeToCashService.submitRequest(mohammed.id, 'MTN', '09131797675', 1000.0);
  assert(a2cOrder.cashValue === 850.0, '85% cash value calculation correct');
  const approval = AirtimeToCashService.approveOrder(a2cOrder.id, 'Automated test verification');
  assert(approval.success === true, 'Approval must succeed and credit wallet');
  console.log(`✓ Test 6: Airtime-to-Cash processed and approved. Credited: ₦${a2cOrder.cashValue}`);

  // 7. Test SafeBox Locked Savings (Matching Screenshot 2)
  const safeBox = SavingsService.depositToSafeBox(mohammed.id, 'School Fees Target', 2000.0, 30);
  assert(safeBox.status === 'ACTIVE', 'SafeBox savings must be active');
  const withdraw = SavingsService.withdrawFromSafeBox(safeBox.id, mohammed.id);
  assert(withdraw.success === true, 'SafeBox maturity withdrawal must succeed');
  console.log(`✓ Test 7: SafeBox deposit and maturity payout successful. Payout: ₦${withdraw.totalPayout}`);

  // 8. Test KYC Verification Tasks (Matching Screenshot 3)
  const kycData = KYCVerificationService.getTasks();
  assert(kycData.counts.completed >= 86, 'Completed count must be at least 86 matching screenshot 3');
  assert(kycData.counts.cancelled >= 3, 'Cancelled count must be at least 3 matching screenshot 3');
  console.log(`✓ Test 8: KYC Verification tasks matching screenshot 3: Completed: ${kycData.counts.completed}, Cancelled: ${kycData.counts.cancelled}`);

  // 9. Test Hosted SIM USSD execution
  const sims = SimHostingService.getHostedSims();
  assert(sims.length > 0, 'Hosted SIM lines must be present');
  const ussd = await SimHostingService.executeUSSD((sims[0] as any).id, '*556#');
  assert(ussd.success === true, 'USSD execution must return response');
  console.log(`✓ Test 9: SIM Hosting USSD executed on ${(sims[0] as any).network}: ${ussd.networkResponse}`);

  // 10. Test Provider Credential Masking & Health Check (Zero credential leak)
  const providers = ProviderService.getProviders() as any[];
  assert(providers.length > 0, 'Providers must exist');
  for (const p of providers) {
    assert(!p.api_secret, 'Raw API secret must NEVER be exposed in provider list');
    assert(p.api_key_masked.includes('****'), 'API key must be securely masked');
  }
  const testConn = await ProviderService.testConnection(providers[0].id);
  assert(testConn.status === 'HEALTHY', 'Test connection must report healthy');
  console.log(`✓ Test 10: Provider security verified: Zero secret leaks, health check successful (${testConn.latencyMs}ms)`);

  // 11. Test Automated Backup & Restore Integrity
  const backup = BackupService.createBackup();
  assert(backup.status === 'COMPLETED', 'Backup creation must complete');
  const restoreTest = BackupService.testRestore(backup.backupId);
  assert(restoreTest.integrity === 'VERIFIED_100%', 'Restore integrity must be 100% verified');
  console.log(`✓ Test 11: Encrypted backup created (${backup.sizeBytes} bytes) and restored in test sandbox with SHA-256 integrity match`);

  console.log('\n========================================');
  console.log('🎉 ALL 11 BACKEND PLATFORM TESTS PASSED!');
  console.log('========================================\n');
}

runTestSuite().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
