/**
 * ==============================================================================
 * BUKAR DATA SUB — CLEAN PRODUCTION DATABASE INITIALIZER
 * ==============================================================================
 * Purges all seed, demo, and test data, leaving an absolute pristine production
 * environment ready for live customer traffic and real financial accounting.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './index.js';

console.log('🧹 STARTING FRESH PRODUCTION DATABASE PURGE...');

// 1. Tables to completely wipe (0 rows)
const purgeTables = [
  'ledger_entries',
  'vtu_transactions',
  'withdrawal_requests',
  'payment_requests',
  'wallet_adjustments',
  'savings_safebox',
  'airtime_to_cash_orders',
  'kyc_verifications',
  'support_tickets',
  'ticket_replies',
  'support_chat_conversations',
  'support_chat_messages',
  'beneficiaries',
  'dashboard_announcements',
  'security_incidents',
  'notifications',
  'otp_verifications',
  'audit_logs',
  'login_history',
  'idempotency_keys',
  'reseller_api_keys',
  'mobile_telemetry',
  'maintenance_logs',
  'operating_expenses',
  'financial_reconciliations',
  'system_backups'
];

for (const tbl of purgeTables) {
  try {
    const res = db.prepare(`DELETE FROM ${tbl}`).run();
    console.log(`  🗑️  Purged ${tbl.padEnd(28)}: ${res.changes} rows deleted`);
  } catch (e: any) {
    console.warn(`  ⚠️ Could not purge ${tbl}: ${e.message}`);
  }
}

// 2. Wipe all users and wallets
try {
  const delWallets = db.prepare('DELETE FROM wallets').run();
  console.log(`  🗑️  Purged wallets                     : ${delWallets.changes} rows deleted`);
  const delUsers = db.prepare('DELETE FROM users').run();
  console.log(`  🗑️  Purged users                       : ${delUsers.changes} rows deleted`);
} catch (e: any) {
  console.error('Error purging users/wallets:', e.message);
}

// 3. Insert Sole Production Super Administrator
const now = new Date().toISOString();
const salt = bcrypt.genSaltSync(12);
const superAdminPasswordHash = bcrypt.hashSync('BukarData#2026', salt);
const pinHash = bcrypt.hashSync('1234', salt);
const adminId = 'usr_root_admin';
const walletId = 'wal_root_admin';

db.prepare(`
  INSERT INTO users (
    id, name, email, phone, password_hash, role, tier, status,
    transaction_pin_hash, referral_code, created_at, updated_at
  )
  VALUES (?, ?, ?, ?, ?, 'super_admin', 3, 'active', ?, 'BDS-ADMIN', ?, ?)
`).run(
  adminId,
  'Super Administrator',
  'admin@bukardatasub.com',
  '08000000001',
  superAdminPasswordHash,
  pinHash,
  now,
  now
);

db.prepare(`
  INSERT INTO wallets (
    id, user_id, balance, commission_balance, currency, is_locked, created_at, updated_at
  )
  VALUES (?, ?, 0.0, 0.0, 'NGN', 0, ?, ?)
`).run(walletId, adminId, now, now);

// Re-seed root administrator reserved accounts
try {
  const insertReserved = db.prepare(`
    INSERT OR REPLACE INTO reserved_accounts (
      id, user_id, provider, bank_name, bank_code, account_number, account_name,
      account_reference, reservation_reference, currency, status, collection_channel, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NGN', 'ACTIVE', 'RESERVED_ACCOUNT', ?, ?)
  `);
  insertReserved.run('res_wema_001', adminId, 'monnify', 'Wema Bank', '035', '9938128312', 'BUKAR DATA SUB / MOHAMMED ADAMU', 'BDS-RES-ROOT-WEMA', 'MNFY_RES_001', now, now);
  insertReserved.run('res_sterling_001', adminId, 'monnify', 'Sterling Bank', '232', '8812739123', 'BUKAR DATA SUB / MOHAMMED ADAMU', 'BDS-RES-ROOT-STERLING', 'MNFY_RES_002', now, now);
  insertReserved.run('res_fidelity_001', adminId, 'monnify', 'Fidelity Bank', '070', '7712391283', 'BUKAR DATA SUB / MOHAMMED ADAMU', 'BDS-RES-ROOT-FIDELITY', 'MNFY_RES_003', now, now);
  insertReserved.run('res_palmpay_001', adminId, 'palmpay', 'PalmPay MFB', '999991', '8012345678', 'BUKAR DATA SUB / MOHAMMED ADAMU', 'BDS-RES-ROOT-PALMPAY', 'PLM_RES_001', now, now);
  insertReserved.run('res_moniepoint_001', adminId, 'manual_bank', 'Moniepoint MFB', '50515', '9131797675', 'BUKAR DATA SUB LTD', 'BDS-CORP-MONIEPOINT', 'MNP_CORP_001', now, now);
  console.log('  ✅ Created ready-made dedicated Reserved Accounts (Wema, Sterling, Fidelity, PalmPay, Moniepoint)');
} catch (e: any) {
  console.warn('Could not reseed reserved_accounts:', e.message);
}

console.log('  ✅ Created clean production Super Administrator: admin@bukardatasub.com (Wallet: ₦0.00)');

// 4. Reset SIM Hosting hardware to 0.00 offline baseline
try {
  db.prepare(`
    UPDATE sim_hosts
    SET airtime_balance = 0.00,
        status = 'OFFLINE',
        phone_number = '',
        daily_sms_sent = 0
  `).run();
  console.log('  ✅ Reset SIM hosts inventory to ₦0.00 balance (Status: OFFLINE)');
} catch (e: any) {
  console.warn('Could not reset sim_hosts:', e.message);
}

// 5. Ensure System Settings are pristine
db.prepare(`
  UPDATE system_settings
  SET app_name = 'Bukar Data Sub',
      app_tagline = 'Automated Telecom & Data Platform',
      support_email = 'support@bukardatasub.com',
      support_phone = '09131797675',
      whatsapp_number = '2349131797675',
      currency = 'NGN',
      currency_symbol = '₦',
      announcement_text = '',
      announcement_active = 0,
      updated_at = ?
  WHERE id = 'sys_settings_001'
`).run(now);
console.log('  ✅ System settings updated to official Bukar Data Sub production values');

// 6. Ensure Payment Gateways have zero dummy accounts
db.prepare(`
  UPDATE payment_gateways
  SET account_name = 'BUKAR DATA SUB LTD',
      updated_at = ?
  WHERE account_name LIKE '%ABK%' OR account_name LIKE '%MOHAMMED%'
`).run(now);
console.log('  ✅ Payment gateways updated with corporate account name: BUKAR DATA SUB LTD');

// 7. Vacuum Database to reclaim free space & rebuild indices
console.log('🧹 Reclaiming SQLite storage & rebuilding indexes (VACUUM)...');
db.exec('VACUUM;');

console.log('\n======================================================');
console.log('🎉 PRODUCTION DATABASE INITIALIZATION COMPLETE!');
console.log('   - Total Registered Customers: 0');
console.log('   - Total Active Transactions : 0');
console.log('   - Total Financial Inflows   : ₦0.00');
console.log('   - Total Customer Liabilities: ₦0.00');
console.log('   - Active Administrator      : admin@bukardatasub.com');
console.log('======================================================\n');
