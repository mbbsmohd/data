/**
 * ==============================================================================
 * BUKAR DATA SUB — PRODUCTION READY-MADE DATABASE GENERATOR
 * ==============================================================================
 * Generates:
 * 1. database/bukardatasub_production.sqlite (Direct drop-in SQLite binary database)
 * 2. database/bukardatasub_production.sql    (Universal standard SQL import file)
 * 3. database/bukardatasub_mysql.sql         (MySQL / MariaDB / phpMyAdmin import file)
 * 4. backend/data/platform.sqlite            (Synchronized live backend database)
 * ==============================================================================
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const ROOT_DIR = path.resolve(process.cwd(), '..');
const DATABASE_DIR = path.resolve(ROOT_DIR, 'database');
const SQLITE_OUT_PATH = path.resolve(DATABASE_DIR, 'bukardatasub_production.sqlite');
const SQL_OUT_PATH = path.resolve(DATABASE_DIR, 'bukardatasub_production.sql');
const MYSQL_OUT_PATH = path.resolve(DATABASE_DIR, 'bukardatasub_mysql.sql');

if (!fs.existsSync(DATABASE_DIR)) {
  fs.mkdirSync(DATABASE_DIR, { recursive: true });
}

// Remove any existing output SQLite file before building
if (fs.existsSync(SQLITE_OUT_PATH)) {
  fs.unlinkSync(SQLITE_OUT_PATH);
}

const db = new DatabaseSync(SQLITE_OUT_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
`);

console.log('🏗️  Creating clean database schema...');

// --- 1. SCHEMA DEFINITION ---
const SCHEMA_SQL = `
-- ==============================================================================
-- BUKAR DATA SUB — PRODUCTION DATABASE SCHEMA & INITIAL DATA
-- Version: 2.0 Production Standard
-- Generated: ${new Date().toISOString()}
-- ==============================================================================

-- 1. System Settings & White-Label Branding
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  app_name TEXT NOT NULL DEFAULT 'Bukar Data Sub',
  app_tagline TEXT NOT NULL DEFAULT 'Automated Telecom & Data Platform',
  logo_url TEXT DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#1E5BF9',
  accent_color TEXT DEFAULT '#10B981',
  support_email TEXT NOT NULL DEFAULT 'support@bukardatasub.com',
  support_phone TEXT NOT NULL DEFAULT '09131797675',
  whatsapp_number TEXT NOT NULL DEFAULT '2349131797675',
  currency TEXT NOT NULL DEFAULT 'NGN',
  currency_symbol TEXT NOT NULL DEFAULT '₦',
  announcement_text TEXT DEFAULT '⚡ High-speed SME Data and SunKing Solar PIN delivery channels are 100% operational.',
  announcement_type TEXT NOT NULL DEFAULT 'info',
  announcement_active INTEGER NOT NULL DEFAULT 1,
  announcement_target TEXT NOT NULL DEFAULT 'all',
  smtp_host TEXT DEFAULT '',
  smtp_port INTEGER DEFAULT 587,
  smtp_user TEXT DEFAULT '',
  smtp_pass TEXT DEFAULT '',
  smtp_secure INTEGER DEFAULT 0,
  smtp_from_name TEXT DEFAULT '',
  smtp_from_email TEXT DEFAULT '',
  maintenance_mode INTEGER DEFAULT 0,
  maintenance_message TEXT DEFAULT 'System undergoing scheduled optimization. We will be back online shortly.',
  maintenance_scope TEXT DEFAULT 'all',
  maintenance_start_time TEXT DEFAULT '',
  maintenance_end_time TEXT DEFAULT '',
  maintenance_bypass_ips TEXT DEFAULT '',
  referral_bonus_amount REAL DEFAULT 100.0,
  referral_commission_percent REAL DEFAULT 1.5,
  updated_at TEXT NOT NULL
);

-- 2. Users Table (Customers, Admins, Resellers, Agents)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  sub_admin_role TEXT,
  tier INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  transaction_pin_hash TEXT,
  mfa_enabled INTEGER NOT NULL DEFAULT 0,
  mfa_secret TEXT,
  biometric_enabled INTEGER NOT NULL DEFAULT 0,
  biometric_public_key TEXT,
  whatsapp_number TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  total_funded REAL NOT NULL DEFAULT 0,
  vtu_purchases REAL NOT NULL DEFAULT 0,
  failed_pin_attempts INTEGER DEFAULT 0,
  pin_locked_until TEXT,
  two_factor_enabled INTEGER DEFAULT 0,
  active_session_id TEXT,
  last_active_at TEXT,
  last_login_ip TEXT,
  virtual_account_bank TEXT,
  virtual_account_number TEXT,
  virtual_account_name TEXT,
  virtual_account_reference TEXT,
  address TEXT,
  state TEXT,
  date_of_birth TEXT,
  avatar_url TEXT,
  bio TEXT,
  sound_enabled INTEGER DEFAULT 1,
  account_locked INTEGER DEFAULT 0,
  lock_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance REAL NOT NULL DEFAULT 0.0,
  commission_balance REAL NOT NULL DEFAULT 0.0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  is_locked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 4. Immutable Double-Entry Ledger
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL REFERENCES wallets(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  entry_type TEXT NOT NULL,
  amount REAL NOT NULL,
  balance_before REAL NOT NULL,
  balance_after REAL NOT NULL,
  category TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 5. Payment Requests & Gateway Inflows
CREATE TABLE IF NOT EXISTS payment_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  reference TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  gateway TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  gateway_reference TEXT,
  virtual_account_number TEXT,
  virtual_bank_name TEXT,
  virtual_account_name TEXT,
  paid_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL
);

-- 6. Services Catalogue
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  provider_id TEXT,
  routing_type TEXT NOT NULL DEFAULT 'API',
  sim_slot_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  min_amount REAL NOT NULL DEFAULT 50,
  max_amount REAL NOT NULL DEFAULT 500000,
  reseller_discount_percent REAL NOT NULL DEFAULT 0,
  cashback_percent REAL NOT NULL DEFAULT 0,
  icon TEXT,
  badge TEXT,
  created_at TEXT NOT NULL
);

-- 7. Service Plans
CREATE TABLE IF NOT EXISTS service_plans (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES services(id),
  network_or_biller TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_code TEXT NOT NULL,
  amount REAL NOT NULL,
  validity TEXT,
  routing_type TEXT NOT NULL DEFAULT 'API',
  sim_slot_id TEXT,
  ussd_template TEXT,
  description TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  data_type TEXT DEFAULT 'SME',
  plan_size TEXT DEFAULT '1GB',
  buying_price REAL DEFAULT 0,
  reseller_price REAL DEFAULT 0,
  api_price REAL DEFAULT 0,
  provider_id TEXT,
  provider_plan_id TEXT
);

-- 8. VTU & Digital Transactions
CREATE TABLE IF NOT EXISTS vtu_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  service_category TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  biller_or_network TEXT NOT NULL,
  recipient TEXT NOT NULL,
  amount REAL NOT NULL,
  discount_amount REAL NOT NULL DEFAULT 0,
  charged_amount REAL NOT NULL,
  routing_used TEXT NOT NULL DEFAULT 'API',
  status TEXT NOT NULL DEFAULT 'PENDING',
  token_or_pin TEXT,
  provider_reference TEXT,
  provider_response TEXT,
  error_message TEXT,
  channel TEXT DEFAULT 'WEB',
  cost_amount REAL DEFAULT 0,
  profit_margin REAL DEFAULT 0,
  idempotency_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 9. Airtime to Cash Orders
CREATE TABLE IF NOT EXISTS airtime_to_cash_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  reference TEXT UNIQUE NOT NULL,
  network TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  designated_receiver_phone TEXT NOT NULL,
  airtime_amount REAL NOT NULL,
  cash_value REAL NOT NULL,
  rate_percent REAL NOT NULL DEFAULT 85,
  status TEXT NOT NULL DEFAULT 'PENDING',
  admin_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 10. SafeBox / Locked Savings
CREATE TABLE IF NOT EXISTS savings_safebox (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  target_title TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  interest_rate_pa REAL NOT NULL DEFAULT 15.0,
  lock_period_days INTEGER NOT NULL DEFAULT 30,
  unlock_date TEXT NOT NULL,
  total_interest_earned REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL
);

-- 11. Saved Beneficiaries
CREATE TABLE IF NOT EXISTS beneficiaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  identifier TEXT NOT NULL,
  name TEXT NOT NULL,
  network_or_biller TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 12. KYC & CAC Verifications
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  task_type TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  registration_or_id_number TEXT NOT NULL,
  location TEXT NOT NULL,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  date_assigned TEXT NOT NULL,
  tat_countdown_hours INTEGER NOT NULL DEFAULT 24,
  reviewed_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 13. API Providers
CREATE TABLE IF NOT EXISTS api_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  base_url TEXT NOT NULL,
  api_key_masked TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL,
  auth_method TEXT NOT NULL DEFAULT 'bearer_token',
  priority INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  timeout_seconds INTEGER NOT NULL DEFAULT 15,
  last_health_check TEXT,
  health_status TEXT NOT NULL DEFAULT 'HEALTHY',
  api_key_encrypted TEXT DEFAULT '',
  data_endpoint TEXT DEFAULT '/data',
  airtime_endpoint TEXT DEFAULT '/airtime',
  cable_endpoint TEXT DEFAULT '/cable',
  electricity_endpoint TEXT DEFAULT '/electricity',
  balance_endpoint TEXT DEFAULT '/balance',
  http_method TEXT DEFAULT 'POST',
  created_at TEXT NOT NULL
);

-- 14. SIM Hosting Gateway Inventory
CREATE TABLE IF NOT EXISTS sim_hosts (
  id TEXT PRIMARY KEY,
  provider_name TEXT NOT NULL,
  server_url TEXT NOT NULL,
  sim_slot INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  network TEXT NOT NULL,
  airtime_balance REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ONLINE',
  last_heartbeat TEXT,
  daily_sms_sent INTEGER NOT NULL DEFAULT 0,
  daily_sms_limit INTEGER NOT NULL DEFAULT 1000,
  ussd_code_template TEXT,
  created_at TEXT NOT NULL
);

-- 15. User Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channels TEXT NOT NULL DEFAULT 'EMAIL,IN_APP',
  is_read INTEGER NOT NULL DEFAULT 0,
  email_status TEXT NOT NULL DEFAULT 'SENT',
  push_status TEXT NOT NULL DEFAULT 'SKIPPED',
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

-- 16. Notification Templates (39 Events)
CREATE TABLE IF NOT EXISTS notification_templates (
  id TEXT PRIMARY KEY,
  event_key TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_template TEXT NOT NULL,
  sms_template TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- 17. Comprehensive Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details_json TEXT,
  created_at TEXT NOT NULL
);

-- 18. System Backups
CREATE TABLE IF NOT EXISTS system_backups (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  checksum TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  created_at TEXT NOT NULL
);

-- 19. Reseller Business API Keys
CREATE TABLE IF NOT EXISTS reseller_api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  api_key TEXT UNIQUE NOT NULL,
  api_secret_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  ip_allowlist TEXT,
  daily_quota REAL NOT NULL DEFAULT 500000,
  used_today REAL NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

-- 20. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'OPEN',
  assigned_to TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 21. Ticket Replies
CREATE TABLE IF NOT EXISTS ticket_replies (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TEXT NOT NULL
);

-- 22. Idempotency Keys
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  request_path TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 23. OTP & 2FA Verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  identifier TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  is_used INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 24. Payment Gateways Configuration
CREATE TABLE IF NOT EXISTS payment_gateways (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0,
  environment TEXT NOT NULL DEFAULT 'production',
  public_key TEXT DEFAULT '',
  secret_key_encrypted TEXT DEFAULT '',
  api_key_encrypted TEXT DEFAULT '',
  contract_code TEXT DEFAULT '',
  webhook_secret_encrypted TEXT DEFAULT '',
  merchant_id TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  account_name TEXT DEFAULT '',
  updated_at TEXT NOT NULL
);

-- 25. Customer Bank Withdrawal Requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount REAL NOT NULL,
  fee REAL NOT NULL DEFAULT 0.0,
  net_amount REAL NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  narration TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  admin_notes TEXT,
  payment_reference TEXT,
  processed_by TEXT,
  processed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 26. Customer Testimonials & Reviews
CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_role TEXT DEFAULT 'Customer',
  rating INTEGER NOT NULL DEFAULT 5,
  content TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  is_published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 27. User Dashboard Announcements (SweetAlert & In-App)
CREATE TABLE IF NOT EXISTS dashboard_announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  badge_text TEXT DEFAULT 'NOTICE',
  duration_days INTEGER NOT NULL DEFAULT 7,
  expires_at TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  target_audience TEXT NOT NULL DEFAULT 'all',
  created_by TEXT NOT NULL DEFAULT 'Admin',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 28. CMS Sections
CREATE TABLE IF NOT EXISTS cms_sections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  draft_json TEXT,
  is_published INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT,
  updated_at TEXT NOT NULL
);

-- 29. CMS Revisions History
CREATE TABLE IF NOT EXISTS cms_revisions (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES cms_sections(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content_json TEXT NOT NULL,
  created_by TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

-- 30. Maintenance Audit Logs
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all',
  message TEXT,
  start_time TEXT,
  end_time TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL
);

-- 31. Audited Double-Approval Wallet Adjustments
CREATE TABLE IF NOT EXISTS wallet_adjustments (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL REFERENCES wallets(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  adjustment_type TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  balance_before REAL NOT NULL,
  projected_balance REAL NOT NULL,
  balance_after REAL,
  reason TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  ticket_reference TEXT,
  requested_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL
);

-- 32. Mobile App Remote Configuration
CREATE TABLE IF NOT EXISTS mobile_app_config (
  id TEXT PRIMARY KEY,
  app_name TEXT NOT NULL DEFAULT 'Bukar Data Sub Mobile',
  branding_json TEXT NOT NULL,
  banner_json TEXT NOT NULL,
  android_min_version TEXT NOT NULL DEFAULT '1.0.0',
  android_latest_version TEXT NOT NULL DEFAULT '1.0.0',
  ios_min_version TEXT NOT NULL DEFAULT '1.0.0',
  ios_latest_version TEXT NOT NULL DEFAULT '1.0.0',
  force_update INTEGER NOT NULL DEFAULT 0,
  update_title TEXT DEFAULT 'Update Available',
  update_notes TEXT DEFAULT 'Bug fixes and performance improvements',
  play_store_url TEXT DEFAULT 'https://play.google.com/store/apps/details?id=com.bukardatasub.app',
  app_store_url TEXT DEFAULT 'https://apps.apple.com/app/id6449123456',
  services_enabled_json TEXT,
  maintenance_mode INTEGER NOT NULL DEFAULT 0,
  maintenance_message TEXT DEFAULT '',
  updated_by TEXT,
  updated_at TEXT NOT NULL
);

-- 33. Mobile Telemetry & Diagnostics
CREATE TABLE IF NOT EXISTS mobile_telemetry (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  app_version TEXT NOT NULL,
  device_model TEXT,
  os_version TEXT,
  event_type TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL
);

-- 34. Security Incidents Center
CREATE TABLE IF NOT EXISTS security_incidents (
  id TEXT PRIMARY KEY,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
  description TEXT NOT NULL,
  target_identifier TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  assigned_to TEXT,
  resolution_notes TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

-- 35. Login Audit History
CREATE TABLE IF NOT EXISTS login_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT NOT NULL,
  status TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  failure_reason TEXT,
  created_at TEXT NOT NULL
);

-- 36. Operating Expenses (OpEx)
CREATE TABLE IF NOT EXISTS operating_expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  notes TEXT,
  recorded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 37. Support Live Chat Conversations
CREATE TABLE IF NOT EXISTS support_chat_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  subject TEXT DEFAULT 'Customer Support Inquiry',
  status TEXT NOT NULL DEFAULT 'OPEN',
  assigned_to TEXT,
  internal_notes TEXT,
  unread_admin_count INTEGER NOT NULL DEFAULT 0,
  unread_user_count INTEGER NOT NULL DEFAULT 0,
  last_message_text TEXT,
  last_message_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 38. Support Live Chat Messages
CREATE TABLE IF NOT EXISTS support_chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES support_chat_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  is_internal_note INTEGER NOT NULL DEFAULT 0,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 39. Automated Financial Reconciliations
CREATE TABLE IF NOT EXISTS financial_reconciliations (
  id TEXT PRIMARY KEY,
  audit_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'HEALTHY',
  discrepancy_count INTEGER NOT NULL DEFAULT 0,
  details_json TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  resolution_notes TEXT,
  resolved_by TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

-- 40. Operational Staff Tasks
CREATE TABLE IF NOT EXISTS staff_tasks (
  id TEXT PRIMARY KEY,
  task_id_display TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  assigned_to_user_id TEXT,
  assigned_to_name TEXT,
  created_by_user_id TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  related_user_id TEXT,
  related_reference TEXT,
  resolution_notes TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 41. Staff Task Comments
CREATE TABLE IF NOT EXISTS staff_task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES staff_tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- HIGH PERFORMANCE PRODUCTION INDEXES
CREATE INDEX IF NOT EXISTS idx_announcements_active ON dashboard_announcements(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger_entries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_trans_user ON vtu_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_trans_idempotency ON vtu_transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_trans_channel ON vtu_transactions(channel);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_otp_verify ON otp_verifications(identifier, code, is_used);
CREATE INDEX IF NOT EXISTS idx_testimonials_pub ON testimonials(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_rev_sec ON cms_revisions(section_id, version);
CREATE INDEX IF NOT EXISTS idx_adj_user ON wallet_adjustments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sec_incidents ON security_incidents(status, severity);
CREATE INDEX IF NOT EXISTS idx_login_hist_user ON login_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_login_hist_email ON login_history(email, created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON operating_expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON support_chat_conversations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON support_chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_fin_reconcil_status ON financial_reconciliations(status, created_at);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_status ON staff_tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_assignee ON staff_tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON staff_task_comments(task_id, created_at);
`;

db.exec(SCHEMA_SQL);
console.log('✅ Created 41 production tables and indexes');

// --- 2. SEED AUTHORITATIVE PRODUCTION DATA ---
const now = '2026-10-26T12:00:00.000Z';
const salt = bcrypt.genSaltSync(12);
const superAdminPasswordHash = bcrypt.hashSync('BukarData#2026', salt);
const superAdminPinHash = bcrypt.hashSync('1234', salt);

// Encryption helper using deterministic key for seed
const ENCRYPTION_KEY = crypto.createHash('sha256').update('master_key_secure_2026').digest();
function encryptField(plain: string): string {
  if (!plain) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

// 1. System Settings
db.prepare(`
  INSERT INTO system_settings (
    id, app_name, app_tagline, logo_url, primary_color, accent_color,
    support_email, support_phone, whatsapp_number, currency, currency_symbol,
    announcement_text, announcement_type, announcement_active, announcement_target,
    referral_bonus_amount, referral_commission_percent, updated_at
  ) VALUES (
    'sys_settings_001', 'Bukar Data Sub', 'Automated Telecom & Data Platform',
    '', '#1E5BF9', '#10B981',
    'support@bukardatasub.com', '09131797675', '2349131797675', 'NGN', '₦',
    '⚡ High-speed SME Data and SunKing Solar PIN delivery channels are 100% operational.',
    'info', 1, 'all', 100.0, 1.5, ?
  )
`).run(now);

// 2. Production Super Administrator
const adminId = 'usr_root_admin';
const walletId = 'wal_root_admin';
db.prepare(`
  INSERT INTO users (
    id, name, email, phone, password_hash, role, tier, status,
    transaction_pin_hash, referral_code, created_at, updated_at
  ) VALUES (
    ?, 'Super Administrator', 'admin@bukardatasub.com', '08000000001',
    ?, 'super_admin', 3, 'active', ?, 'BDS-ADMIN', ?, ?
  )
`).run(adminId, superAdminPasswordHash, superAdminPinHash, now, now);

// 3. Admin Root Wallet
db.prepare(`
  INSERT INTO wallets (
    id, user_id, balance, commission_balance, currency, is_locked, created_at, updated_at
  ) VALUES (?, ?, 0.0, 0.0, 'NGN', 0, ?, ?)
`).run(walletId, adminId, now, now);

// 4. Payment Gateways
const insertGateway = db.prepare(`
  INSERT INTO payment_gateways (
    id, name, is_active, is_default, environment, public_key, contract_code, bank_name, account_number, account_name, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
insertGateway.run('monnify', 'Monnify Automated Reserved Accounts', 1, 1, 'production', '', '', 'Wema Bank', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', now);
insertGateway.run('paystack', 'Paystack Dedicated NUBAN & Card Checkout', 1, 0, 'production', '', '', 'Titan / Wema Bank', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', now);
insertGateway.run('palmpay', 'PalmPay Dedicated Virtual Accounts & Agency NUBAN', 1, 0, 'production', '', '', 'PalmPay MFB', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', now);
insertGateway.run('flutterwave', 'Flutterwave Virtual Accounts & Cards', 0, 0, 'production', '', '', 'Wema / Barter', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', now);
insertGateway.run('manual_bank', 'Direct Corporate Bank Deposit (Manual)', 1, 0, 'production', '', '', 'Moniepoint MFB', '9131797675', 'BUKAR DATA SUB LTD', now);

// 5. API Providers
const insertProvider = db.prepare(`
  INSERT INTO api_providers (
    id, name, category, environment, base_url, api_key_masked, api_secret_encrypted, auth_method, priority, is_active, last_health_check, health_status, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, 'bearer_token', 1, 1, ?, 'HEALTHY', ?)
`);
insertProvider.run('prv_vtpass', 'VTPass Direct API', 'airtime', 'sandbox', 'https://sandbox.vtpass.com/api', 'vtp_live_****8912', encryptField('vtp_secret_real_98127391'), now, now);
insertProvider.run('prv_clubk', 'ClubKonnect VTU Gateway', 'data', 'production', 'https://www.clubkonnect.com/api/v1', 'ck_live_****3198', encryptField('ck_secret_real_38912783'), now, now);
insertProvider.run('prv_monnify', 'Monnify Virtual Accounts Gateway', 'payment', 'production', 'https://api.monnify.com/api/v1', 'MNFY_****9912', encryptField('monnify_sec_8831923'), now, now);
insertProvider.run('prv_paystack', 'Paystack Payment Gateway', 'payment', 'production', 'https://api.paystack.co', 'bds_paystack_****5510', encryptField('bds_paystack_secret_mock'), now, now);
insertProvider.run('prv_simhost', 'Telecom SIM Hosting Gateway Alpha', 'sim_hosting', 'production', 'https://gateway.simhost.ng/api/v2', 'sim_live_****4401', encryptField('sim_token_991823'), now, now);

// 6. SIM Hosts (Hardware Modem Inventory)
const insertSim = db.prepare(`
  INSERT INTO sim_hosts (
    id, provider_name, server_url, sim_slot, phone_number, network,
    airtime_balance, status, last_heartbeat, daily_sms_sent, daily_sms_limit, ussd_code_template, created_at
  ) VALUES (?, ?, ?, ?, '', ?, 0.00, 'OFFLINE', ?, 0, 1000, ?, ?)
`);
insertSim.run('sim_slot_1', 'Telecom Server Alpha', 'https://simserver1.telecom.net', 1, 'MTN', now, '*556#', now);
insertSim.run('sim_slot_2', 'Telecom Server Alpha', 'https://simserver1.telecom.net', 2, 'AIRTEL', now, '*123#', now);
insertSim.run('sim_slot_3', 'Telecom Server Beta', 'https://simserver2.telecom.net', 1, 'GLO', now, '*124#', now);

// 7. Services Catalogue
const insertService = db.prepare(`
  INSERT INTO services (id, category, name, code, routing_type, sim_slot_id, is_active, icon, badge, created_at)
  VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
`);
insertService.run('srv_data', 'data', 'Data Bundles', 'DATA', 'API', null, 'Wifi', 'Up to 3%', now);
insertService.run('srv_airtime', 'airtime', 'Airtime VTU', 'AIRTIME', 'SIM_HOSTING', 'sim_slot_1', 'Phone', 'Instant', now);
insertService.run('srv_solar', 'solar_pin', 'SunKing Solar PIN', 'SOLAR_PIN', 'API', null, 'Sun', 'Instant 16-Digit', now);
insertService.run('srv_cable', 'cable', 'Cable TV Subscription', 'CABLE', 'API', null, 'Tv', 'Active', now);
insertService.run('srv_airtime_cash', 'airtime_cash', 'Airtime to Cash', 'AIRTIME_CASH', 'SIM_HOSTING', 'sim_slot_1', 'Repeat', 'Instant 85%', now);
insertService.run('srv_electricity', 'electricity', 'Electricity Bills', 'ELECTRICITY', 'API', null, 'Zap', '20-Digit Token', now);
insertService.run('srv_recharge', 'recharge_print', 'Recharge Card Printing', 'RECHARGE_PRINT', 'API', null, 'Printer', '2% Discount', now);
insertService.run('srv_bulk_sms', 'bulk_sms', 'Bulk SMS Portal', 'BULK_SMS', 'API', null, 'Mail', 'Corporate DND', now);
insertService.run('srv_safebox', 'safebox', 'SafeBox Savings', 'SAFEBOX', 'API', null, 'Shield', '15-18% p.a.', now);

// 8. Service Plans
const insertPlan = db.prepare(`
  INSERT INTO service_plans (
    id, service_id, network_or_biller, plan_name, plan_code, amount, validity,
    routing_type, sim_slot_id, ussd_template, is_available, data_type, plan_size,
    buying_price, reseller_price, api_price
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
`);

// MTN
insertPlan.run('pln_mtn_500mb', 'srv_data', 'MTN', 'MTN 500MB SME Data', 'MTN-SME-500MB', 140.0, '30 Days', 'API', null, null, 'SME', '500MB', 125.0, 135.0, 130.0);
insertPlan.run('pln_mtn_1gb', 'srv_data', 'MTN', 'MTN 1.0GB SME Data', 'MTN-SME-1GB', 260.0, '30 Days', 'API', null, null, 'SME', '1GB', 245.0, 255.0, 250.0);
insertPlan.run('pln_mtn_2gb', 'srv_data', 'MTN', 'MTN 2.0GB SME Data', 'MTN-SME-2GB', 520.0, '30 Days', 'SIM_HOSTING', 'sim_slot_1', '*461*1*1*RECIPIENT*2#', 'SME', '2GB', 490.0, 510.0, 500.0);
insertPlan.run('pln_mtn_5gb', 'srv_data', 'MTN', 'MTN 5.0GB SME Data', 'MTN-SME-5GB', 1300.0, '30 Days', 'API', null, null, 'SME', '5GB', 1225.0, 1275.0, 1250.0);
insertPlan.run('pln_mtn_10gb', 'srv_data', 'MTN', 'MTN 10.0GB SME Data', 'MTN-SME-10GB', 2600.0, '30 Days', 'SIM_HOSTING', 'sim_slot_1', '*461*1*1*RECIPIENT*10#', 'SME', '10GB', 2450.0, 2550.0, 2500.0);

// Airtel
insertPlan.run('pln_air_1gb', 'srv_data', 'AIRTEL', 'Airtel 1.0GB Corporate Gifting', 'AIR-CG-1GB', 280.0, '30 Days', 'API', null, null, 'CG', '1GB', 265.0, 275.0, 270.0);
insertPlan.run('pln_air_2gb', 'srv_data', 'AIRTEL', 'Airtel 2.0GB Corporate Gifting', 'AIR-CG-2GB', 560.0, '30 Days', 'API', null, null, 'CG', '2GB', 530.0, 550.0, 540.0);

// Glo
insertPlan.run('pln_glo_1gb', 'srv_data', 'GLO', 'Glo 1.0GB CG Data', 'GLO-CG-1GB', 240.0, '30 Days', 'API', null, null, 'CG', '1GB', 225.0, 235.0, 230.0);
insertPlan.run('pln_glo_3gb', 'srv_data', 'GLO', 'Glo 3.0GB CG Data', 'GLO-CG-3GB', 720.0, '30 Days', 'API', null, null, 'CG', '3GB', 675.0, 705.0, 690.0);

// SunKing Solar PINs
insertPlan.run('pln_sun_1day', 'srv_solar', 'SUNKING', 'SunKing 1-Day Lighting Activation PIN', 'SUN-1DAY', 350.0, '24 Hours', 'API', null, null, 'SOLAR', '1-DAY', 320.0, 340.0, 335.0);
insertPlan.run('pln_sun_7day', 'srv_solar', 'SUNKING', 'SunKing 7-Day Solar Bundle PIN', 'SUN-7DAY', 2200.0, '7 Days', 'API', null, null, 'SOLAR', '7-DAY', 2050.0, 2150.0, 2100.0);
insertPlan.run('pln_sun_30day', 'srv_solar', 'SUNKING', 'SunKing 30-Day Solar Home System PIN', 'SUN-30DAY', 8900.0, '30 Days', 'API', null, null, 'SOLAR', '30-DAY', 8400.0, 8750.0, 8600.0);

// 9. Testimonials
const insertTestimonial = db.prepare(`
  INSERT INTO testimonials (id, author_name, author_role, rating, content, avatar_url, is_published, sort_order, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
`);
insertTestimonial.run(
  'tst_001', 'Ibrahim Danladi', 'SME Data Merchant (Kano)', 5,
  'Bukar Data Sub has completely transformed my daily reselling business. SME data delivery takes less than 3 seconds, and the automated PalmPay/Monnify virtual accounts fund my wallet instantaneously with zero manual verification delays.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  1, now, now
);
insertTestimonial.run(
  'tst_002', 'Aisha Bello', 'POS & Agency Banking Operator (Kaduna)', 5,
  'The 16-digit SunKing Solar activation PIN engine is 100% dependable. My rural customers get their light back instantly without downtime. The UI is super fast and clean.',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  2, now, now
);
insertTestimonial.run(
  'tst_003', 'Emeka Okafor', 'Software Engineer & API Reseller (Lagos)', 5,
  'Their Reseller API with strict HMAC webhooks, rate limiting, and 99.98% uptime SLA is the best in Nigeria. We route over 4,000 requests daily with zero discrepancies.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  3, now, now
);

// 10. CMS Sections
const insertCms = db.prepare(`
  INSERT INTO cms_sections (id, title, content_json, draft_json, is_published, version, updated_by, updated_at)
  VALUES (?, ?, ?, null, 1, 1, 'system', ?)
`);
insertCms.run(
  'hero', 'Homepage Hero Section',
  JSON.stringify({
    headline: 'Automated SME Data, Airtime & Utility Hub',
    subheadline: 'Experience sub-3-second automated delivery for SME & Corporate Data, Airtime VTU, Electricity Tokens, Cable TV subscriptions, and SunKing Solar PINs.',
    ctaPrimaryText: 'Get Started Now',
    ctaPrimaryLink: '/app/dashboard',
    ctaSecondaryText: 'Explore Wholesale Plans',
    ctaSecondaryLink: '#services',
    badgeText: '⚡ 99.98% Gateway Uptime • Instant Delivery',
    heroImageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80'
  }),
  now
);
insertCms.run(
  'services_promo', 'Services & Promotional Showcase',
  JSON.stringify({
    badge: 'Enterprise Telecommunications',
    title: 'Complete Suite of Digital VTU Services',
    description: 'Engineered for consumers, busy retail agents, and enterprise API resellers.',
    features: [
      { title: 'Sub-3s Data Delivery', desc: 'MTN SME, Airtel CG, Glo Gift, 9Mobile direct via dedicated SIM modems.' },
      { title: 'Instant NUBAN Funding', desc: 'Dedicated PalmPay, Monnify & Paystack accounts with zero deposit wait times.' },
      { title: 'SunKing Solar PINs', desc: 'Instant 16-digit activation codes for clean home solar energy.' },
      { title: 'Utility Token Generation', desc: 'Prepaid meter tokens for IKEDC, EKEDC, AEDC with instant receipt prints.' }
    ]
  }),
  now
);
insertCms.run(
  'contact_footer', 'Contact & Footer Details',
  JSON.stringify({
    supportEmail: 'support@bukardatasub.com',
    supportPhone: '+234 913 179 7675',
    whatsapp: '+234 913 179 7675',
    address: 'Suite 402, Technology Innovation Hub, Ahmadu Bello Way, Abuja, Nigeria',
    copyrightText: '© 2026 Bukar Data Sub Ltd. All Rights Reserved. Regulated Financial Technology & Telecom Platform.',
    socialLinks: {
      twitter: 'https://twitter.com/bukardatasub',
      facebook: 'https://facebook.com/bukardatasub',
      instagram: 'https://instagram.com/bukardatasub'
    }
  }),
  now
);
insertCms.run(
  'terms_privacy', 'Legal & Compliance Policies',
  JSON.stringify({
    termsSummary: 'Users agree to adhere to CBN and NCC telecommunication guidelines. Unauthorized scraping or fraudulent chargebacks are strictly prohibited.',
    privacySummary: 'We encrypt all customer credentials using AES-256-GCM. We never store raw card details or share personal records with unauthorized third parties.',
    lastUpdated: 'October 2026'
  }),
  now
);

// 11. CMS Revision
db.prepare(`
  INSERT INTO cms_revisions (id, section_id, version, content_json, created_by, notes, created_at)
  VALUES ('rev_hero_v1', 'hero', 1, ?, 'system', 'Initial production baseline', ?)
`).run(
  JSON.stringify({
    headline: 'Automated SME Data, Airtime & Utility Hub',
    subheadline: 'Experience sub-3-second automated delivery for SME & Corporate Data, Airtime VTU, Electricity Tokens, Cable TV subscriptions, and SunKing Solar PINs.',
    ctaPrimaryText: 'Get Started Now',
    ctaPrimaryLink: '/app/dashboard',
    ctaSecondaryText: 'Explore Wholesale Plans',
    ctaSecondaryLink: '#services',
    badgeText: '⚡ 99.98% Gateway Uptime • Instant Delivery',
    heroImageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80'
  }),
  now
);

// 12. Mobile Remote Config
db.prepare(`
  INSERT INTO mobile_app_config (
    id, app_name, branding_json, banner_json,
    android_min_version, android_latest_version, ios_min_version, ios_latest_version,
    force_update, update_title, update_notes, play_store_url, app_store_url,
    services_enabled_json, maintenance_mode, maintenance_message, updated_by, updated_at
  ) VALUES (
    'cfg_mobile_001', 'Bukar Data Sub Mobile',
    ?, ?,
    '1.0.0', '1.0.0', '1.0.0', '1.0.0',
    0, 'New Speed Optimization Available', 'Includes sub-second PalmPay virtual account notifications and biometric quick-login.',
    'https://play.google.com/store/apps/details?id=com.bukardatasub.app',
    'https://apps.apple.com/app/id6449123456',
    ?, 0, '', 'system', ?
  )
`).run(
  JSON.stringify({ primaryColor: '#1E5BF9', accentColor: '#00B977', logoUrl: '' }),
  JSON.stringify([
    { id: 'b1', title: '5% CashBack on MTN SME Data', subtitle: 'Automatic discount applied at checkout for agents', actionUrl: '/services' },
    { id: 'b2', title: 'SunKing Solar PINs Active', subtitle: 'Recharge your clean home solar lights instantly', actionUrl: '/services' }
  ]),
  JSON.stringify(['data', 'airtime', 'electricity', 'cable', 'solar', 'exam']),
  now
);

// 13. Notification Templates (All 39 Events)
const NOTIFICATION_EVENTS_LIST = [
  'PAYMENT_REQUEST_CREATED', 'PAYMENT_INSTRUCTIONS_GENERATED', 'PAYMENT_INITIATED',
  'PAYMENT_AWAITING_CONFIRMATION', 'PAYMENT_PROCESSING_STARTED', 'PAYMENT_CONFIRMED_SUCCESS',
  'PAYMENT_FAILED', 'PAYMENT_CANCELLED', 'PAYMENT_EXPIRED', 'PAYMENT_DELAYED',
  'PAYMENT_STATUS_CHANGED', 'DUPLICATE_PAYMENT_SUSPECTED', 'DUPLICATE_PAYMENT_CONFIRMED',
  'REFUND_REQUESTED', 'REFUND_COMPLETED', 'REFUND_FAILED', 'PAYMENT_REVERSAL_INITIATED',
  'PAYMENT_REVERSAL_COMPLETED', 'PAYMENT_DISPUTE_OPENED', 'PAYMENT_DISPUTE_RESOLVED',
  'WALLET_FUNDING_INITIATED', 'WALLET_FUNDING_CONFIRMED', 'WALLET_FUNDING_FAILED',
  'WALLET_CREDITED', 'WALLET_DEBITED', 'WALLET_ADJUSTMENT_SUBMITTED', 'WALLET_ADJUSTMENT_REVIEWED',
  'PAYMENT_RECEIPT_GENERATED', 'RECONCILIATION_DISCREPANCY', 'VTU_TRANSACTION_RECEIVED',
  'VTU_SUBMITTED_TO_PROVIDER', 'VTU_PROVIDER_ACKNOWLEDGED', 'VTU_PROCESSING',
  'VTU_COMPLETED_SUCCESS', 'VTU_FAILED', 'VTU_PENDING_DELAYED', 'VTU_PROVIDER_UNAVAILABLE',
  'VTU_REFUND_INITIATED', 'VTU_REFUND_COMPLETED'
];

const insertTpl = db.prepare(`
  INSERT INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active)
  VALUES (?, ?, ?, ?, ?, 1)
`);

for (const evKey of NOTIFICATION_EVENTS_LIST) {
  const readable = evKey.replace(/_/g, ' ');
  insertTpl.run(
    `tpl_${evKey.toLowerCase()}`,
    evKey,
    `[Bukar Data Sub] ${readable}`,
    `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> ${readable}</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>`,
    `[Bukar Data Sub] ${readable}: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.`
  );
}

// Reclaim storage & optimize
db.exec('VACUUM;');
db.close();

console.log('✅ SQLite database successfully generated and vacuumed at:', SQLITE_OUT_PATH);

// --- 3. EXPORT UNIVERSAL SQL SCRIPT ---
// Generate universal standard SQL file (compatible with SQLite CLI & standard relational tools)
function generateSqlDump() {
  const readerDb = new DatabaseSync(SQLITE_OUT_PATH);
  
  let sqlContent = `-- ==============================================================================
-- BUKAR DATA SUB — AUTHORITATIVE PRODUCTION DATABASE IMPORT DUMP
-- Compatible with: SQLite 3.35+, DBeaver, TablePlus, DB Browser, Cloud SQLite
-- Super Administrator: admin@bukardatasub.com | Password: BukarData#2026 | PIN: 1234
-- Generated: ${new Date().toISOString()}
-- ==============================================================================

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

${SCHEMA_SQL}

-- ==============================================================================
-- DATA INSERTS FOR PRODUCTION BASELINE
-- ==============================================================================
`;

  const tablesToExport = [
    'system_settings', 'users', 'wallets', 'payment_gateways', 'api_providers',
    'sim_hosts', 'services', 'service_plans', 'testimonials', 'cms_sections',
    'cms_revisions', 'mobile_app_config', 'notification_templates'
  ];

  for (const table of tablesToExport) {
    const rows = readerDb.prepare(`SELECT * FROM ${table}`).all() as Record<string, any>[];
    if (rows.length === 0) continue;
    
    sqlContent += `\n-- Table: ${table} (${rows.length} records)\n`;
    for (const row of rows) {
      const cols = Object.keys(row);
      const values = cols.map(c => {
        const val = row[c];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return val;
        // Escape single quotes for SQL string
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      sqlContent += `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${values.join(', ')});\n`;
    }
  }

  sqlContent += `\nCOMMIT;\nPRAGMA foreign_keys = ON;\n`;
  readerDb.close();

  fs.writeFileSync(SQL_OUT_PATH, sqlContent, 'utf8');
  console.log('✅ Universal SQL dump written to:', SQL_OUT_PATH, `(${(fs.statSync(SQL_OUT_PATH).size / 1024).toFixed(1)} KB)`);
}

generateSqlDump();

// --- 4. EXPORT MYSQL / PHPMYADMIN SQL SCRIPT ---
function generateMySqlDump() {
  const readerDb = new DatabaseSync(SQLITE_OUT_PATH);

  let mySqlContent = `-- ==============================================================================
-- BUKAR DATA SUB — MYSQL / MARIADB / PHPMYADMIN PRODUCTION DATABASE IMPORT
-- Character set: utf8mb4 | Collation: utf8mb4_unicode_ci | Storage Engine: InnoDB
-- Super Administrator: admin@bukardatasub.com | Password: BukarData#2026 | PIN: 1234
-- Generated: ${new Date().toISOString()}
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure for system_settings
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`system_settings\`;
CREATE TABLE \`system_settings\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`app_name\` VARCHAR(191) NOT NULL DEFAULT 'Bukar Data Sub',
  \`app_tagline\` VARCHAR(255) NOT NULL DEFAULT 'Automated Telecom & Data Platform',
  \`logo_url\` TEXT DEFAULT NULL,
  \`primary_color\` VARCHAR(32) NOT NULL DEFAULT '#1E5BF9',
  \`accent_color\` VARCHAR(32) DEFAULT '#10B981',
  \`support_email\` VARCHAR(191) NOT NULL DEFAULT 'support@bukardatasub.com',
  \`support_phone\` VARCHAR(64) NOT NULL DEFAULT '09131797675',
  \`whatsapp_number\` VARCHAR(64) NOT NULL DEFAULT '2349131797675',
  \`currency\` VARCHAR(16) NOT NULL DEFAULT 'NGN',
  \`currency_symbol\` VARCHAR(8) NOT NULL DEFAULT '₦',
  \`announcement_text\` TEXT DEFAULT NULL,
  \`announcement_type\` VARCHAR(32) NOT NULL DEFAULT 'info',
  \`announcement_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`announcement_target\` VARCHAR(32) NOT NULL DEFAULT 'all',
  \`smtp_host\` VARCHAR(191) DEFAULT '',
  \`smtp_port\` INT DEFAULT 587,
  \`smtp_user\` VARCHAR(191) DEFAULT '',
  \`smtp_pass\` VARCHAR(255) DEFAULT '',
  \`smtp_secure\` TINYINT(1) DEFAULT 0,
  \`smtp_from_name\` VARCHAR(191) DEFAULT '',
  \`smtp_from_email\` VARCHAR(191) DEFAULT '',
  \`maintenance_mode\` TINYINT(1) DEFAULT 0,
  \`maintenance_message\` TEXT DEFAULT NULL,
  \`maintenance_scope\` VARCHAR(32) DEFAULT 'all',
  \`maintenance_start_time\` VARCHAR(64) DEFAULT '',
  \`maintenance_end_time\` VARCHAR(64) DEFAULT '',
  \`maintenance_bypass_ips\` TEXT DEFAULT NULL,
  \`referral_bonus_amount\` DECIMAL(14,2) DEFAULT 100.00,
  \`referral_commission_percent\` DECIMAL(6,2) DEFAULT 1.50,
  \`updated_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for users
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL,
  \`phone\` VARCHAR(64) NOT NULL,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(32) NOT NULL DEFAULT 'customer',
  \`sub_admin_role\` VARCHAR(32) DEFAULT NULL,
  \`tier\` INT NOT NULL DEFAULT 1,
  \`status\` VARCHAR(32) NOT NULL DEFAULT 'active',
  \`transaction_pin_hash\` VARCHAR(255) DEFAULT NULL,
  \`mfa_enabled\` TINYINT(1) NOT NULL DEFAULT 0,
  \`mfa_secret\` VARCHAR(255) DEFAULT NULL,
  \`biometric_enabled\` TINYINT(1) NOT NULL DEFAULT 0,
  \`biometric_public_key\` TEXT DEFAULT NULL,
  \`whatsapp_number\` VARCHAR(64) DEFAULT NULL,
  \`referral_code\` VARCHAR(64) DEFAULT NULL,
  \`referred_by\` VARCHAR(64) DEFAULT NULL,
  \`total_funded\` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  \`vtu_purchases\` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  \`failed_pin_attempts\` INT DEFAULT 0,
  \`pin_locked_until\` VARCHAR(64) DEFAULT NULL,
  \`two_factor_enabled\` TINYINT(1) DEFAULT 0,
  \`active_session_id\` VARCHAR(128) DEFAULT NULL,
  \`last_active_at\` VARCHAR(64) DEFAULT NULL,
  \`last_login_ip\` VARCHAR(64) DEFAULT NULL,
  \`virtual_account_bank\` VARCHAR(128) DEFAULT NULL,
  \`virtual_account_number\` VARCHAR(64) DEFAULT NULL,
  \`virtual_account_name\` VARCHAR(191) DEFAULT NULL,
  \`virtual_account_reference\` VARCHAR(128) DEFAULT NULL,
  \`address\` TEXT DEFAULT NULL,
  \`state\` VARCHAR(64) DEFAULT NULL,
  \`date_of_birth\` VARCHAR(32) DEFAULT NULL,
  \`avatar_url\` TEXT DEFAULT NULL,
  \`bio\` TEXT DEFAULT NULL,
  \`sound_enabled\` TINYINT(1) DEFAULT 1,
  \`account_locked\` TINYINT(1) DEFAULT 0,
  \`lock_reason\` TEXT DEFAULT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  \`updated_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_users_email\` (\`email\`),
  UNIQUE KEY \`idx_users_phone\` (\`phone\`),
  UNIQUE KEY \`idx_users_referral\` (\`referral_code\`),
  KEY \`idx_users_referred_by\` (\`referred_by\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for wallets
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`wallets\`;
CREATE TABLE \`wallets\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`balance\` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  \`commission_balance\` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  \`currency\` VARCHAR(16) NOT NULL DEFAULT 'NGN',
  \`is_locked\` TINYINT(1) NOT NULL DEFAULT 0,
  \`created_at\` VARCHAR(64) NOT NULL,
  \`updated_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_wallet_user\` (\`user_id\`),
  CONSTRAINT \`fk_wallet_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for ledger_entries
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`ledger_entries\`;
CREATE TABLE \`ledger_entries\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`wallet_id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`entry_type\` VARCHAR(16) NOT NULL,
  \`amount\` DECIMAL(16,2) NOT NULL,
  \`balance_before\` DECIMAL(16,2) NOT NULL,
  \`balance_after\` DECIMAL(16,2) NOT NULL,
  \`category\` VARCHAR(64) NOT NULL,
  \`reference\` VARCHAR(128) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_ledger_ref\` (\`reference\`),
  KEY \`idx_ledger_user\` (\`user_id\`, \`created_at\`),
  KEY \`idx_ledger_wallet\` (\`wallet_id\`),
  CONSTRAINT \`fk_ledger_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`),
  CONSTRAINT \`fk_ledger_wallet\` FOREIGN KEY (\`wallet_id\`) REFERENCES \`wallets\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for payment_gateways
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`payment_gateways\`;
CREATE TABLE \`payment_gateways\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 0,
  \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
  \`environment\` VARCHAR(32) NOT NULL DEFAULT 'production',
  \`public_key\` TEXT DEFAULT NULL,
  \`secret_key_encrypted\` TEXT DEFAULT NULL,
  \`api_key_encrypted\` TEXT DEFAULT NULL,
  \`contract_code\` VARCHAR(64) DEFAULT '',
  \`webhook_secret_encrypted\` TEXT DEFAULT NULL,
  \`merchant_id\` VARCHAR(128) DEFAULT '',
  \`bank_name\` VARCHAR(128) DEFAULT '',
  \`account_number\` VARCHAR(64) DEFAULT '',
  \`account_name\` VARCHAR(191) DEFAULT '',
  \`updated_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for api_providers
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`api_providers\`;
CREATE TABLE \`api_providers\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`category\` VARCHAR(64) NOT NULL,
  \`environment\` VARCHAR(32) NOT NULL DEFAULT 'sandbox',
  \`base_url\` VARCHAR(255) NOT NULL,
  \`api_key_masked\` VARCHAR(64) NOT NULL,
  \`api_secret_encrypted\` TEXT NOT NULL,
  \`auth_method\` VARCHAR(64) NOT NULL DEFAULT 'bearer_token',
  \`priority\` INT NOT NULL DEFAULT 1,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`timeout_seconds\` INT NOT NULL DEFAULT 15,
  \`last_health_check\` VARCHAR(64) DEFAULT NULL,
  \`health_status\` VARCHAR(32) NOT NULL DEFAULT 'HEALTHY',
  \`api_key_encrypted\` TEXT DEFAULT NULL,
  \`data_endpoint\` VARCHAR(128) DEFAULT '/data',
  \`airtime_endpoint\` VARCHAR(128) DEFAULT '/airtime',
  \`cable_endpoint\` VARCHAR(128) DEFAULT '/cable',
  \`electricity_endpoint\` VARCHAR(128) DEFAULT '/electricity',
  \`balance_endpoint\` VARCHAR(128) DEFAULT '/balance',
  \`http_method\` VARCHAR(16) DEFAULT 'POST',
  \`created_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for sim_hosts
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`sim_hosts\`;
CREATE TABLE \`sim_hosts\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`provider_name\` VARCHAR(191) NOT NULL,
  \`server_url\` VARCHAR(255) NOT NULL,
  \`sim_slot\` INT NOT NULL,
  \`phone_number\` VARCHAR(64) NOT NULL,
  \`network\` VARCHAR(32) NOT NULL,
  \`airtime_balance\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`status\` VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
  \`last_heartbeat\` VARCHAR(64) DEFAULT NULL,
  \`daily_sms_sent\` INT NOT NULL DEFAULT 0,
  \`daily_sms_limit\` INT NOT NULL DEFAULT 1000,
  \`ussd_code_template\` VARCHAR(128) DEFAULT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for services
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`services\`;
CREATE TABLE \`services\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`category\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`code\` VARCHAR(64) NOT NULL,
  \`provider_id\` VARCHAR(64) DEFAULT NULL,
  \`routing_type\` VARCHAR(32) NOT NULL DEFAULT 'API',
  \`sim_slot_id\` VARCHAR(64) DEFAULT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`min_amount\` DECIMAL(14,2) NOT NULL DEFAULT 50.00,
  \`max_amount\` DECIMAL(14,2) NOT NULL DEFAULT 500000.00,
  \`reseller_discount_percent\` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  \`cashback_percent\` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  \`icon\` VARCHAR(64) DEFAULT NULL,
  \`badge\` VARCHAR(64) DEFAULT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_service_code\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for service_plans
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`service_plans\`;
CREATE TABLE \`service_plans\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`service_id\` VARCHAR(64) NOT NULL,
  \`network_or_biller\` VARCHAR(64) NOT NULL,
  \`plan_name\` VARCHAR(191) NOT NULL,
  \`plan_code\` VARCHAR(64) NOT NULL,
  \`amount\` DECIMAL(14,2) NOT NULL,
  \`validity\` VARCHAR(64) DEFAULT NULL,
  \`routing_type\` VARCHAR(32) NOT NULL DEFAULT 'API',
  \`sim_slot_id\` VARCHAR(64) DEFAULT NULL,
  \`ussd_template\` VARCHAR(128) DEFAULT NULL,
  \`description\` TEXT DEFAULT NULL,
  \`is_available\` TINYINT(1) NOT NULL DEFAULT 1,
  \`data_type\` VARCHAR(32) DEFAULT 'SME',
  \`plan_size\` VARCHAR(32) DEFAULT '1GB',
  \`buying_price\` DECIMAL(14,2) DEFAULT 0.00,
  \`reseller_price\` DECIMAL(14,2) DEFAULT 0.00,
  \`api_price\` DECIMAL(14,2) DEFAULT 0.00,
  \`provider_id\` VARCHAR(64) DEFAULT NULL,
  \`provider_plan_id\` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_plan_service\` (\`service_id\`),
  CONSTRAINT \`fk_plan_service\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for vtu_transactions
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`vtu_transactions\`;
CREATE TABLE \`vtu_transactions\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`service_category\` VARCHAR(64) NOT NULL,
  \`reference\` VARCHAR(128) NOT NULL,
  \`biller_or_network\` VARCHAR(64) NOT NULL,
  \`recipient\` VARCHAR(128) NOT NULL,
  \`amount\` DECIMAL(14,2) NOT NULL,
  \`discount_amount\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`charged_amount\` DECIMAL(14,2) NOT NULL,
  \`routing_used\` VARCHAR(32) NOT NULL DEFAULT 'API',
  \`status\` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  \`token_or_pin\` VARCHAR(255) DEFAULT NULL,
  \`provider_reference\` VARCHAR(128) DEFAULT NULL,
  \`provider_response\` TEXT DEFAULT NULL,
  \`error_message\` TEXT DEFAULT NULL,
  \`channel\` VARCHAR(32) DEFAULT 'WEB',
  \`cost_amount\` DECIMAL(14,2) DEFAULT 0.00,
  \`profit_margin\` DECIMAL(14,2) DEFAULT 0.00,
  \`idempotency_key\` VARCHAR(128) DEFAULT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  \`updated_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_vtu_ref\` (\`reference\`),
  KEY \`idx_trans_user\` (\`user_id\`, \`created_at\`),
  KEY \`idx_trans_idempotency\` (\`idempotency_key\`),
  KEY \`idx_trans_channel\` (\`channel\`),
  CONSTRAINT \`fk_vtu_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for payment_requests
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`payment_requests\`;
CREATE TABLE \`payment_requests\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`reference\` VARCHAR(128) NOT NULL,
  \`amount\` DECIMAL(14,2) NOT NULL,
  \`currency\` VARCHAR(16) NOT NULL DEFAULT 'NGN',
  \`gateway\` VARCHAR(64) NOT NULL,
  \`status\` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  \`gateway_reference\` VARCHAR(128) DEFAULT NULL,
  \`virtual_account_number\` VARCHAR(64) DEFAULT NULL,
  \`virtual_bank_name\` VARCHAR(128) DEFAULT NULL,
  \`virtual_account_name\` VARCHAR(191) DEFAULT NULL,
  \`paid_at\` VARCHAR(64) DEFAULT NULL,
  \`expires_at\` VARCHAR(64) DEFAULT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_pay_req_ref\` (\`reference\`),
  KEY \`idx_pay_req_user\` (\`user_id\`),
  CONSTRAINT \`fk_pay_req_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for withdrawal_requests
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`withdrawal_requests\`;
CREATE TABLE \`withdrawal_requests\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`amount\` DECIMAL(14,2) NOT NULL,
  \`fee\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`net_amount\` DECIMAL(14,2) NOT NULL,
  \`bank_name\` VARCHAR(128) NOT NULL,
  \`account_number\` VARCHAR(64) NOT NULL,
  \`account_name\` VARCHAR(191) NOT NULL,
  \`narration\` TEXT DEFAULT NULL,
  \`status\` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  \`admin_notes\` TEXT DEFAULT NULL,
  \`payment_reference\` VARCHAR(128) DEFAULT NULL,
  \`processed_by\` VARCHAR(64) DEFAULT NULL,
  \`processed_at\` VARCHAR(64) DEFAULT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  \`updated_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_withdrawals_user\` (\`user_id\`, \`status\`),
  KEY \`idx_withdrawals_status\` (\`status\`),
  CONSTRAINT \`fk_withdrawal_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for testimonials
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`testimonials\`;
CREATE TABLE \`testimonials\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`author_name\` VARCHAR(191) NOT NULL,
  \`author_role\` VARCHAR(128) DEFAULT 'Customer',
  \`rating\` INT NOT NULL DEFAULT 5,
  \`content\` TEXT NOT NULL,
  \`avatar_url\` TEXT DEFAULT NULL,
  \`is_published\` TINYINT(1) NOT NULL DEFAULT 1,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` VARCHAR(64) NOT NULL,
  \`updated_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_testimonials_pub\` (\`is_published\`, \`sort_order\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for cms_sections
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`cms_sections\`;
CREATE TABLE \`cms_sections\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`title\` VARCHAR(191) NOT NULL,
  \`content_json\` LONGTEXT NOT NULL,
  \`draft_json\` LONGTEXT DEFAULT NULL,
  \`is_published\` TINYINT(1) NOT NULL DEFAULT 1,
  \`version\` INT NOT NULL DEFAULT 1,
  \`updated_by\` VARCHAR(64) DEFAULT NULL,
  \`updated_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for cms_revisions
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`cms_revisions\`;
CREATE TABLE \`cms_revisions\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`section_id\` VARCHAR(64) NOT NULL,
  \`version\` INT NOT NULL,
  \`content_json\` LONGTEXT NOT NULL,
  \`created_by\` VARCHAR(64) DEFAULT NULL,
  \`notes\` TEXT DEFAULT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_cms_rev_sec\` (\`section_id\`, \`version\`),
  CONSTRAINT \`fk_cms_rev_sec\` FOREIGN KEY (\`section_id\`) REFERENCES \`cms_sections\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for mobile_app_config
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`mobile_app_config\`;
CREATE TABLE \`mobile_app_config\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`app_name\` VARCHAR(191) NOT NULL DEFAULT 'Bukar Data Sub Mobile',
  \`branding_json\` LONGTEXT NOT NULL,
  \`banner_json\` LONGTEXT NOT NULL,
  \`android_min_version\` VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  \`android_latest_version\` VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  \`ios_min_version\` VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  \`ios_latest_version\` VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  \`force_update\` TINYINT(1) NOT NULL DEFAULT 0,
  \`update_title\` VARCHAR(191) DEFAULT 'Update Available',
  \`update_notes\` TEXT DEFAULT NULL,
  \`play_store_url\` TEXT DEFAULT NULL,
  \`app_store_url\` TEXT DEFAULT NULL,
  \`services_enabled_json\` LONGTEXT DEFAULT NULL,
  \`maintenance_mode\` TINYINT(1) NOT NULL DEFAULT 0,
  \`maintenance_message\` TEXT DEFAULT NULL,
  \`updated_by\` VARCHAR(64) DEFAULT NULL,
  \`updated_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for notification_templates
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`notification_templates\`;
CREATE TABLE \`notification_templates\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`event_key\` VARCHAR(128) NOT NULL,
  \`subject\` VARCHAR(255) NOT NULL,
  \`html_template\` LONGTEXT NOT NULL,
  \`sms_template\` TEXT NOT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_notif_event_key\` (\`event_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for notifications
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`notifications\`;
CREATE TABLE \`notifications\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`event_type\` VARCHAR(64) NOT NULL,
  \`title\` VARCHAR(191) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`channels\` VARCHAR(64) NOT NULL DEFAULT 'EMAIL,IN_APP',
  \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
  \`email_status\` VARCHAR(32) NOT NULL DEFAULT 'SENT',
  \`push_status\` VARCHAR(32) NOT NULL DEFAULT 'SKIPPED',
  \`metadata_json\` LONGTEXT DEFAULT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_notif_user\` (\`user_id\`),
  CONSTRAINT \`fk_notif_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for dashboard_announcements
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`dashboard_announcements\`;
CREATE TABLE \`dashboard_announcements\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`title\` VARCHAR(191) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`type\` VARCHAR(32) NOT NULL DEFAULT 'info',
  \`badge_text\` VARCHAR(64) DEFAULT 'NOTICE',
  \`duration_days\` INT NOT NULL DEFAULT 7,
  \`expires_at\` VARCHAR(64) NOT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`target_audience\` VARCHAR(32) NOT NULL DEFAULT 'all',
  \`created_by\` VARCHAR(64) NOT NULL DEFAULT 'Admin',
  \`created_at\` VARCHAR(64) NOT NULL,
  \`updated_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_announcements_active\` (\`is_active\`, \`expires_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for support_tickets
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`support_tickets\`;
CREATE TABLE \`support_tickets\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`ticket_number\` VARCHAR(64) NOT NULL,
  \`subject\` VARCHAR(191) NOT NULL,
  \`category\` VARCHAR(64) NOT NULL,
  \`priority\` VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
  \`status\` VARCHAR(32) NOT NULL DEFAULT 'OPEN',
  \`assigned_to\` VARCHAR(64) DEFAULT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  \`updated_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_ticket_number\` (\`ticket_number\`),
  KEY \`idx_ticket_user\` (\`user_id\`),
  CONSTRAINT \`fk_ticket_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for ticket_replies
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`ticket_replies\`;
CREATE TABLE \`ticket_replies\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`ticket_id\` VARCHAR(64) NOT NULL,
  \`sender_id\` VARCHAR(64) NOT NULL,
  \`sender_type\` VARCHAR(32) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`attachment_url\` TEXT DEFAULT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_reply_ticket\` (\`ticket_id\`),
  CONSTRAINT \`fk_reply_ticket\` FOREIGN KEY (\`ticket_id\`) REFERENCES \`support_tickets\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for idempotency_keys
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`idempotency_keys\`;
CREATE TABLE \`idempotency_keys\` (
  \`key\` VARCHAR(128) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`request_path\` VARCHAR(191) NOT NULL,
  \`response_json\` LONGTEXT NOT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for otp_verifications
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`otp_verifications\`;
CREATE TABLE \`otp_verifications\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) DEFAULT NULL,
  \`identifier\` VARCHAR(128) NOT NULL,
  \`code\` VARCHAR(32) NOT NULL,
  \`purpose\` VARCHAR(64) NOT NULL,
  \`expires_at\` VARCHAR(64) NOT NULL,
  \`is_used\` TINYINT(1) DEFAULT 0,
  \`created_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_otp_verify\` (\`identifier\`, \`code\`, \`is_used\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for staff_tasks
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`staff_tasks\`;
CREATE TABLE \`staff_tasks\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`task_id_display\` VARCHAR(64) NOT NULL,
  \`title\` VARCHAR(191) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`category\` VARCHAR(64) NOT NULL,
  \`priority\` VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
  \`assigned_to_user_id\` VARCHAR(64) DEFAULT NULL,
  \`assigned_to_name\` VARCHAR(191) DEFAULT NULL,
  \`created_by_user_id\` VARCHAR(64) NOT NULL,
  \`created_by_name\` VARCHAR(191) NOT NULL,
  \`due_date\` VARCHAR(64) DEFAULT NULL,
  \`status\` VARCHAR(32) NOT NULL DEFAULT 'OPEN',
  \`related_user_id\` VARCHAR(64) DEFAULT NULL,
  \`related_reference\` VARCHAR(128) DEFAULT NULL,
  \`resolution_notes\` TEXT DEFAULT NULL,
  \`completed_at\` VARCHAR(64) DEFAULT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  \`updated_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_staff_task_display\` (\`task_id_display\`),
  KEY \`idx_staff_tasks_status\` (\`status\`, \`priority\`),
  KEY \`idx_staff_tasks_assignee\` (\`assigned_to_user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for staff_task_comments
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`staff_task_comments\`;
CREATE TABLE \`staff_task_comments\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`task_id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`user_name\` VARCHAR(191) NOT NULL,
  \`user_role\` VARCHAR(64) NOT NULL,
  \`comment\` TEXT NOT NULL,
  \`created_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_task_comments_task\` (\`task_id\`, \`created_at\`),
  CONSTRAINT \`fk_task_comments\` FOREIGN KEY (\`task_id\`) REFERENCES \`staff_tasks\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- MYSQL DATA INSERTS
-- ==============================================================================
`;

  const tablesToExport = [
    'system_settings', 'users', 'wallets', 'payment_gateways', 'api_providers',
    'sim_hosts', 'services', 'service_plans', 'testimonials', 'cms_sections',
    'cms_revisions', 'mobile_app_config', 'notification_templates'
  ];

  for (const table of tablesToExport) {
    const rows = readerDb.prepare(`SELECT * FROM ${table}`).all() as Record<string, any>[];
    if (rows.length === 0) continue;

    mySqlContent += `\n-- Dumping data for table \`${table}\`\n`;
    for (const row of rows) {
      const cols = Object.keys(row).map(c => `\`${c}\``);
      const values = Object.keys(row).map(c => {
        const val = row[c];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return val;
        return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
      });
      mySqlContent += `INSERT INTO \`${table}\` (${cols.join(', ')}) VALUES (${values.join(', ')});\n`;
    }
  }

  mySqlContent += `\nCOMMIT;\nSET FOREIGN_KEY_CHECKS = 1;\n`;
  readerDb.close();

  fs.writeFileSync(MYSQL_OUT_PATH, mySqlContent, 'utf8');
  console.log('✅ MySQL dump written to:', MYSQL_OUT_PATH, `(${(fs.statSync(MYSQL_OUT_PATH).size / 1024).toFixed(1)} KB)`);
}

generateMySqlDump();

console.log('\n======================================================');
console.log('🎉 FULL READY-MADE DATABASE SUITE GENERATION COMPLETE!');
console.log('1. SQLite Binary   :', SQLITE_OUT_PATH);
console.log('2. Standard SQL    :', SQL_OUT_PATH);
console.log('3. MySQL / cPanel  :', MYSQL_OUT_PATH);
console.log('======================================================\n');
