-- ==============================================================================
-- BUKAR DATA SUB — AUTHORITATIVE PRODUCTION DATABASE IMPORT DUMP
-- Compatible with: SQLite 3.35+, DBeaver, TablePlus, DB Browser, Cloud SQLite
-- Super Administrator: admin@bukardatasub.com | Password: BukarData#2026 | PIN: 1234
-- Generated: 2026-10-29T17:06:50.583Z
-- ==============================================================================

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;


-- ==============================================================================
-- BUKAR DATA SUB — PRODUCTION DATABASE SCHEMA & INITIAL DATA
-- Version: 2.0 Production Standard
-- Generated: 2026-10-29T17:06:49.932Z
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


-- 5b. Dedicated Virtual Reserved Accounts (Monnify, PalmPay, Paystack)
CREATE TABLE IF NOT EXISTS reserved_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'monnify', -- monnify, palmpay, paystack, flutterwave, manual_bank
  bank_name TEXT NOT NULL, -- Wema Bank, Sterling Bank, Fidelity Bank, PalmPay MFB, Moniepoint MFB
  bank_code TEXT DEFAULT '',
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_reference TEXT NOT NULL,
  reservation_reference TEXT,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
  bvn TEXT,
  nin TEXT,
  collection_channel TEXT DEFAULT 'RESERVED_ACCOUNT',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Ready-Made View Aliases (Matching reserveAccounts and reserve_accounts)
CREATE VIEW IF NOT EXISTS reserveAccounts AS SELECT * FROM reserved_accounts;
CREATE VIEW IF NOT EXISTS reserve_accounts AS SELECT * FROM reserved_accounts;

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

CREATE INDEX IF NOT EXISTS idx_reserve_acc_user ON reserved_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_reserve_acc_num ON reserved_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_reserve_acc_ref ON reserved_accounts(account_reference);
CREATE INDEX IF NOT EXISTS idx_reserve_acc_provider ON reserved_accounts(provider);



-- ==============================================================================
-- DATA INSERTS FOR PRODUCTION BASELINE
-- ==============================================================================

-- Table: system_settings (1 records)
INSERT OR REPLACE INTO system_settings (id, app_name, app_tagline, logo_url, primary_color, accent_color, support_email, support_phone, whatsapp_number, currency, currency_symbol, announcement_text, announcement_type, announcement_active, announcement_target, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, smtp_from_name, smtp_from_email, maintenance_mode, maintenance_message, maintenance_scope, maintenance_start_time, maintenance_end_time, maintenance_bypass_ips, referral_bonus_amount, referral_commission_percent, updated_at) VALUES ('sys_settings_001', 'Bukar Data Sub', 'Automated Telecom & Data Platform', '', '#1E5BF9', '#10B981', 'support@bukardatasub.com', '09131797675', '2349131797675', 'NGN', '₦', '⚡ High-speed SME Data and SunKing Solar PIN delivery channels are 100% operational.', 'info', 1, 'all', '', 587, '', '', 0, '', '', 0, 'System undergoing scheduled optimization. We will be back online shortly.', 'all', '', '', '', 100, 1.5, '2026-10-26T12:00:00.000Z');

-- Table: users (1 records)
INSERT OR REPLACE INTO users (id, name, email, phone, password_hash, role, sub_admin_role, tier, status, transaction_pin_hash, mfa_enabled, mfa_secret, biometric_enabled, biometric_public_key, whatsapp_number, referral_code, referred_by, total_funded, vtu_purchases, failed_pin_attempts, pin_locked_until, two_factor_enabled, active_session_id, last_active_at, last_login_ip, virtual_account_bank, virtual_account_number, virtual_account_name, virtual_account_reference, address, state, date_of_birth, avatar_url, bio, sound_enabled, account_locked, lock_reason, created_at, updated_at) VALUES ('usr_root_admin', 'Super Administrator', 'admin@bukardatasub.com', '08000000001', '$2b$12$VR.gADaeUzG/3BvZKbK9p.h.FqgWyEebsQGTXFWbKTethDIHtpYs6', 'super_admin', NULL, 3, 'active', '$2b$12$VR.gADaeUzG/3BvZKbK9p.z9lEchCEo8IYVezsaAcZwcLgy1Jehka', 0, NULL, 0, NULL, NULL, 'BDS-ADMIN', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, NULL, '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');

-- Table: wallets (1 records)
INSERT OR REPLACE INTO wallets (id, user_id, balance, commission_balance, currency, is_locked, created_at, updated_at) VALUES ('wal_root_admin', 'usr_root_admin', 0, 0, 'NGN', 0, '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');

-- Table: reserved_accounts (5 records)
INSERT OR REPLACE INTO reserved_accounts (id, user_id, provider, bank_name, bank_code, account_number, account_name, account_reference, reservation_reference, currency, status, bvn, nin, collection_channel, created_at, updated_at) VALUES ('res_wema_001', 'usr_root_admin', 'monnify', 'Wema Bank', '035', '9938128312', 'BUKAR DATA SUB / MOHAMMED ADAMU', 'BDS-RES-ROOT-WEMA', 'MNFY_RES_001', 'NGN', 'ACTIVE', NULL, NULL, 'RESERVED_ACCOUNT', '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO reserved_accounts (id, user_id, provider, bank_name, bank_code, account_number, account_name, account_reference, reservation_reference, currency, status, bvn, nin, collection_channel, created_at, updated_at) VALUES ('res_sterling_001', 'usr_root_admin', 'monnify', 'Sterling Bank', '232', '8812739123', 'BUKAR DATA SUB / MOHAMMED ADAMU', 'BDS-RES-ROOT-STERLING', 'MNFY_RES_002', 'NGN', 'ACTIVE', NULL, NULL, 'RESERVED_ACCOUNT', '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO reserved_accounts (id, user_id, provider, bank_name, bank_code, account_number, account_name, account_reference, reservation_reference, currency, status, bvn, nin, collection_channel, created_at, updated_at) VALUES ('res_fidelity_001', 'usr_root_admin', 'monnify', 'Fidelity Bank', '070', '7712391283', 'BUKAR DATA SUB / MOHAMMED ADAMU', 'BDS-RES-ROOT-FIDELITY', 'MNFY_RES_003', 'NGN', 'ACTIVE', NULL, NULL, 'RESERVED_ACCOUNT', '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO reserved_accounts (id, user_id, provider, bank_name, bank_code, account_number, account_name, account_reference, reservation_reference, currency, status, bvn, nin, collection_channel, created_at, updated_at) VALUES ('res_palmpay_001', 'usr_root_admin', 'palmpay', 'PalmPay MFB', '999991', '8012345678', 'BUKAR DATA SUB / MOHAMMED ADAMU', 'BDS-RES-ROOT-PALMPAY', 'PLM_RES_001', 'NGN', 'ACTIVE', NULL, NULL, 'RESERVED_ACCOUNT', '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO reserved_accounts (id, user_id, provider, bank_name, bank_code, account_number, account_name, account_reference, reservation_reference, currency, status, bvn, nin, collection_channel, created_at, updated_at) VALUES ('res_moniepoint_001', 'usr_root_admin', 'manual_bank', 'Moniepoint MFB', '50515', '9131797675', 'BUKAR DATA SUB LTD', 'BDS-CORP-MONIEPOINT', 'MNP_CORP_001', 'NGN', 'ACTIVE', NULL, NULL, 'RESERVED_ACCOUNT', '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');

-- Table: payment_gateways (5 records)
INSERT OR REPLACE INTO payment_gateways (id, name, is_active, is_default, environment, public_key, secret_key_encrypted, api_key_encrypted, contract_code, webhook_secret_encrypted, merchant_id, bank_name, account_number, account_name, updated_at) VALUES ('monnify', 'Monnify Automated Reserved Accounts', 1, 1, 'production', '', '', '', '', '', '', 'Wema Bank', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO payment_gateways (id, name, is_active, is_default, environment, public_key, secret_key_encrypted, api_key_encrypted, contract_code, webhook_secret_encrypted, merchant_id, bank_name, account_number, account_name, updated_at) VALUES ('paystack', 'Paystack Dedicated NUBAN & Card Checkout', 1, 0, 'production', '', '', '', '', '', '', 'Titan / Wema Bank', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO payment_gateways (id, name, is_active, is_default, environment, public_key, secret_key_encrypted, api_key_encrypted, contract_code, webhook_secret_encrypted, merchant_id, bank_name, account_number, account_name, updated_at) VALUES ('palmpay', 'PalmPay Dedicated Virtual Accounts & Agency NUBAN', 1, 0, 'production', '', '', '', '', '', '', 'PalmPay MFB', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO payment_gateways (id, name, is_active, is_default, environment, public_key, secret_key_encrypted, api_key_encrypted, contract_code, webhook_secret_encrypted, merchant_id, bank_name, account_number, account_name, updated_at) VALUES ('flutterwave', 'Flutterwave Virtual Accounts & Cards', 0, 0, 'production', '', '', '', '', '', '', 'Wema / Barter', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO payment_gateways (id, name, is_active, is_default, environment, public_key, secret_key_encrypted, api_key_encrypted, contract_code, webhook_secret_encrypted, merchant_id, bank_name, account_number, account_name, updated_at) VALUES ('manual_bank', 'Direct Corporate Bank Deposit (Manual)', 1, 0, 'production', '', '', '', '', '', '', 'Moniepoint MFB', '9131797675', 'BUKAR DATA SUB LTD', '2026-10-26T12:00:00.000Z');

-- Table: api_providers (5 records)
INSERT OR REPLACE INTO api_providers (id, name, category, environment, base_url, api_key_masked, api_secret_encrypted, auth_method, priority, is_active, timeout_seconds, last_health_check, health_status, api_key_encrypted, data_endpoint, airtime_endpoint, cable_endpoint, electricity_endpoint, balance_endpoint, http_method, created_at) VALUES ('prv_vtpass', 'VTPass Direct API', 'airtime', 'sandbox', 'https://sandbox.vtpass.com/api', 'vtp_live_****8912', 'jU2FIKiEHyHx7m/u:7bhpqO/hLHL1OS7BS7pNQQ==:tZxO/bFBhgk00Gab3h/fSzxr3XKm/UIQ', 'bearer_token', 1, 1, 15, '2026-10-26T12:00:00.000Z', 'HEALTHY', '', '/data', '/airtime', '/cable', '/electricity', '/balance', 'POST', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO api_providers (id, name, category, environment, base_url, api_key_masked, api_secret_encrypted, auth_method, priority, is_active, timeout_seconds, last_health_check, health_status, api_key_encrypted, data_endpoint, airtime_endpoint, cable_endpoint, electricity_endpoint, balance_endpoint, http_method, created_at) VALUES ('prv_clubk', 'ClubKonnect VTU Gateway', 'data', 'production', 'https://www.clubkonnect.com/api/v1', 'ck_live_****3198', 'aDG/tYYk+ip3JGGa:v7YfdHx4mfcMGvU+AyXN+Q==:SvQhJgeFTa8y65Hdzy2IGLrY+C4J53Y=', 'bearer_token', 1, 1, 15, '2026-10-26T12:00:00.000Z', 'HEALTHY', '', '/data', '/airtime', '/cable', '/electricity', '/balance', 'POST', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO api_providers (id, name, category, environment, base_url, api_key_masked, api_secret_encrypted, auth_method, priority, is_active, timeout_seconds, last_health_check, health_status, api_key_encrypted, data_endpoint, airtime_endpoint, cable_endpoint, electricity_endpoint, balance_endpoint, http_method, created_at) VALUES ('prv_monnify', 'Monnify Virtual Accounts Gateway', 'payment', 'production', 'https://api.monnify.com/api/v1', 'MNFY_****9912', 'v4DcSOD/yIuOVH8L:HVy195NQC4AdTZo4mDySQw==:1Wm8o+TB8SsjpoPsCmUJf3CM0w==', 'bearer_token', 1, 1, 15, '2026-10-26T12:00:00.000Z', 'HEALTHY', '', '/data', '/airtime', '/cable', '/electricity', '/balance', 'POST', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO api_providers (id, name, category, environment, base_url, api_key_masked, api_secret_encrypted, auth_method, priority, is_active, timeout_seconds, last_health_check, health_status, api_key_encrypted, data_endpoint, airtime_endpoint, cable_endpoint, electricity_endpoint, balance_endpoint, http_method, created_at) VALUES ('prv_paystack', 'Paystack Payment Gateway', 'payment', 'production', 'https://api.paystack.co', 'bds_paystack_****5510', 'Tic4FU0BUbJACzMT:bSivbtigAKBufXdsaK8NBQ==:9Yoz6s8ycQKeBuXswNO+kiIRlkr9EjYA', 'bearer_token', 1, 1, 15, '2026-10-26T12:00:00.000Z', 'HEALTHY', '', '/data', '/airtime', '/cable', '/electricity', '/balance', 'POST', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO api_providers (id, name, category, environment, base_url, api_key_masked, api_secret_encrypted, auth_method, priority, is_active, timeout_seconds, last_health_check, health_status, api_key_encrypted, data_endpoint, airtime_endpoint, cable_endpoint, electricity_endpoint, balance_endpoint, http_method, created_at) VALUES ('prv_simhost', 'Telecom SIM Hosting Gateway Alpha', 'sim_hosting', 'production', 'https://gateway.simhost.ng/api/v2', 'sim_live_****4401', '4+UKzSEpB1p2P7qy:Tunr+BZtFt1qYBfELE2XrQ==:KZMGhWE5E2X5l8ewGPJaOA==', 'bearer_token', 1, 1, 15, '2026-10-26T12:00:00.000Z', 'HEALTHY', '', '/data', '/airtime', '/cable', '/electricity', '/balance', 'POST', '2026-10-26T12:00:00.000Z');

-- Table: sim_hosts (3 records)
INSERT OR REPLACE INTO sim_hosts (id, provider_name, server_url, sim_slot, phone_number, network, airtime_balance, status, last_heartbeat, daily_sms_sent, daily_sms_limit, ussd_code_template, created_at) VALUES ('sim_slot_1', 'Telecom Server Alpha', 'https://simserver1.telecom.net', 1, '', 'MTN', 0, 'OFFLINE', '2026-10-26T12:00:00.000Z', 0, 1000, '*556#', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO sim_hosts (id, provider_name, server_url, sim_slot, phone_number, network, airtime_balance, status, last_heartbeat, daily_sms_sent, daily_sms_limit, ussd_code_template, created_at) VALUES ('sim_slot_2', 'Telecom Server Alpha', 'https://simserver1.telecom.net', 2, '', 'AIRTEL', 0, 'OFFLINE', '2026-10-26T12:00:00.000Z', 0, 1000, '*123#', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO sim_hosts (id, provider_name, server_url, sim_slot, phone_number, network, airtime_balance, status, last_heartbeat, daily_sms_sent, daily_sms_limit, ussd_code_template, created_at) VALUES ('sim_slot_3', 'Telecom Server Beta', 'https://simserver2.telecom.net', 1, '', 'GLO', 0, 'OFFLINE', '2026-10-26T12:00:00.000Z', 0, 1000, '*124#', '2026-10-26T12:00:00.000Z');

-- Table: services (9 records)
INSERT OR REPLACE INTO services (id, category, name, code, provider_id, routing_type, sim_slot_id, is_active, min_amount, max_amount, reseller_discount_percent, cashback_percent, icon, badge, created_at) VALUES ('srv_data', 'data', 'Data Bundles', 'DATA', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Wifi', 'Up to 3%', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO services (id, category, name, code, provider_id, routing_type, sim_slot_id, is_active, min_amount, max_amount, reseller_discount_percent, cashback_percent, icon, badge, created_at) VALUES ('srv_airtime', 'airtime', 'Airtime VTU', 'AIRTIME', NULL, 'SIM_HOSTING', 'sim_slot_1', 1, 50, 500000, 0, 0, 'Phone', 'Instant', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO services (id, category, name, code, provider_id, routing_type, sim_slot_id, is_active, min_amount, max_amount, reseller_discount_percent, cashback_percent, icon, badge, created_at) VALUES ('srv_solar', 'solar_pin', 'SunKing Solar PIN', 'SOLAR_PIN', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Sun', 'Instant 16-Digit', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO services (id, category, name, code, provider_id, routing_type, sim_slot_id, is_active, min_amount, max_amount, reseller_discount_percent, cashback_percent, icon, badge, created_at) VALUES ('srv_cable', 'cable', 'Cable TV Subscription', 'CABLE', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Tv', 'Active', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO services (id, category, name, code, provider_id, routing_type, sim_slot_id, is_active, min_amount, max_amount, reseller_discount_percent, cashback_percent, icon, badge, created_at) VALUES ('srv_airtime_cash', 'airtime_cash', 'Airtime to Cash', 'AIRTIME_CASH', NULL, 'SIM_HOSTING', 'sim_slot_1', 1, 50, 500000, 0, 0, 'Repeat', 'Instant 85%', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO services (id, category, name, code, provider_id, routing_type, sim_slot_id, is_active, min_amount, max_amount, reseller_discount_percent, cashback_percent, icon, badge, created_at) VALUES ('srv_electricity', 'electricity', 'Electricity Bills', 'ELECTRICITY', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Zap', '20-Digit Token', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO services (id, category, name, code, provider_id, routing_type, sim_slot_id, is_active, min_amount, max_amount, reseller_discount_percent, cashback_percent, icon, badge, created_at) VALUES ('srv_recharge', 'recharge_print', 'Recharge Card Printing', 'RECHARGE_PRINT', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Printer', '2% Discount', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO services (id, category, name, code, provider_id, routing_type, sim_slot_id, is_active, min_amount, max_amount, reseller_discount_percent, cashback_percent, icon, badge, created_at) VALUES ('srv_bulk_sms', 'bulk_sms', 'Bulk SMS Portal', 'BULK_SMS', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Mail', 'Corporate DND', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO services (id, category, name, code, provider_id, routing_type, sim_slot_id, is_active, min_amount, max_amount, reseller_discount_percent, cashback_percent, icon, badge, created_at) VALUES ('srv_safebox', 'safebox', 'SafeBox Savings', 'SAFEBOX', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Shield', '15-18% p.a.', '2026-10-26T12:00:00.000Z');

-- Table: service_plans (12 records)
INSERT OR REPLACE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, description, is_available, data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id) VALUES ('pln_mtn_500mb', 'srv_data', 'MTN', 'MTN 500MB SME Data', 'MTN-SME-500MB', 140, '30 Days', 'API', NULL, NULL, NULL, 1, 'SME', '500MB', 125, 135, 130, NULL, NULL);
INSERT OR REPLACE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, description, is_available, data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id) VALUES ('pln_mtn_1gb', 'srv_data', 'MTN', 'MTN 1.0GB SME Data', 'MTN-SME-1GB', 260, '30 Days', 'API', NULL, NULL, NULL, 1, 'SME', '1GB', 245, 255, 250, NULL, NULL);
INSERT OR REPLACE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, description, is_available, data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id) VALUES ('pln_mtn_2gb', 'srv_data', 'MTN', 'MTN 2.0GB SME Data', 'MTN-SME-2GB', 520, '30 Days', 'SIM_HOSTING', 'sim_slot_1', '*461*1*1*RECIPIENT*2#', NULL, 1, 'SME', '2GB', 490, 510, 500, NULL, NULL);
INSERT OR REPLACE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, description, is_available, data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id) VALUES ('pln_mtn_5gb', 'srv_data', 'MTN', 'MTN 5.0GB SME Data', 'MTN-SME-5GB', 1300, '30 Days', 'API', NULL, NULL, NULL, 1, 'SME', '5GB', 1225, 1275, 1250, NULL, NULL);
INSERT OR REPLACE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, description, is_available, data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id) VALUES ('pln_mtn_10gb', 'srv_data', 'MTN', 'MTN 10.0GB SME Data', 'MTN-SME-10GB', 2600, '30 Days', 'SIM_HOSTING', 'sim_slot_1', '*461*1*1*RECIPIENT*10#', NULL, 1, 'SME', '10GB', 2450, 2550, 2500, NULL, NULL);
INSERT OR REPLACE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, description, is_available, data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id) VALUES ('pln_air_1gb', 'srv_data', 'AIRTEL', 'Airtel 1.0GB Corporate Gifting', 'AIR-CG-1GB', 280, '30 Days', 'API', NULL, NULL, NULL, 1, 'CG', '1GB', 265, 275, 270, NULL, NULL);
INSERT OR REPLACE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, description, is_available, data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id) VALUES ('pln_air_2gb', 'srv_data', 'AIRTEL', 'Airtel 2.0GB Corporate Gifting', 'AIR-CG-2GB', 560, '30 Days', 'API', NULL, NULL, NULL, 1, 'CG', '2GB', 530, 550, 540, NULL, NULL);
INSERT OR REPLACE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, description, is_available, data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id) VALUES ('pln_glo_1gb', 'srv_data', 'GLO', 'Glo 1.0GB CG Data', 'GLO-CG-1GB', 240, '30 Days', 'API', NULL, NULL, NULL, 1, 'CG', '1GB', 225, 235, 230, NULL, NULL);
INSERT OR REPLACE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, description, is_available, data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id) VALUES ('pln_glo_3gb', 'srv_data', 'GLO', 'Glo 3.0GB CG Data', 'GLO-CG-3GB', 720, '30 Days', 'API', NULL, NULL, NULL, 1, 'CG', '3GB', 675, 705, 690, NULL, NULL);
INSERT OR REPLACE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, description, is_available, data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id) VALUES ('pln_sun_1day', 'srv_solar', 'SUNKING', 'SunKing 1-Day Lighting Activation PIN', 'SUN-1DAY', 350, '24 Hours', 'API', NULL, NULL, NULL, 1, 'SOLAR', '1-DAY', 320, 340, 335, NULL, NULL);
INSERT OR REPLACE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, description, is_available, data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id) VALUES ('pln_sun_7day', 'srv_solar', 'SUNKING', 'SunKing 7-Day Solar Bundle PIN', 'SUN-7DAY', 2200, '7 Days', 'API', NULL, NULL, NULL, 1, 'SOLAR', '7-DAY', 2050, 2150, 2100, NULL, NULL);
INSERT OR REPLACE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, description, is_available, data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id) VALUES ('pln_sun_30day', 'srv_solar', 'SUNKING', 'SunKing 30-Day Solar Home System PIN', 'SUN-30DAY', 8900, '30 Days', 'API', NULL, NULL, NULL, 1, 'SOLAR', '30-DAY', 8400, 8750, 8600, NULL, NULL);

-- Table: testimonials (3 records)
INSERT OR REPLACE INTO testimonials (id, author_name, author_role, rating, content, avatar_url, is_published, sort_order, created_at, updated_at) VALUES ('tst_001', 'Ibrahim Danladi', 'SME Data Merchant (Kano)', 5, 'Bukar Data Sub has completely transformed my daily reselling business. SME data delivery takes less than 3 seconds, and the automated PalmPay/Monnify virtual accounts fund my wallet instantaneously with zero manual verification delays.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', 1, 1, '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO testimonials (id, author_name, author_role, rating, content, avatar_url, is_published, sort_order, created_at, updated_at) VALUES ('tst_002', 'Aisha Bello', 'POS & Agency Banking Operator (Kaduna)', 5, 'The 16-digit SunKing Solar activation PIN engine is 100% dependable. My rural customers get their light back instantly without downtime. The UI is super fast and clean.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', 1, 2, '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO testimonials (id, author_name, author_role, rating, content, avatar_url, is_published, sort_order, created_at, updated_at) VALUES ('tst_003', 'Emeka Okafor', 'Software Engineer & API Reseller (Lagos)', 5, 'Their Reseller API with strict HMAC webhooks, rate limiting, and 99.98% uptime SLA is the best in Nigeria. We route over 4,000 requests daily with zero discrepancies.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', 1, 3, '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');

-- Table: cms_sections (4 records)
INSERT OR REPLACE INTO cms_sections (id, title, content_json, draft_json, is_published, version, updated_by, updated_at) VALUES ('hero', 'Homepage Hero Section', '{"headline":"Automated SME Data, Airtime & Utility Hub","subheadline":"Experience sub-3-second automated delivery for SME & Corporate Data, Airtime VTU, Electricity Tokens, Cable TV subscriptions, and SunKing Solar PINs.","ctaPrimaryText":"Get Started Now","ctaPrimaryLink":"/app/dashboard","ctaSecondaryText":"Explore Wholesale Plans","ctaSecondaryLink":"#services","badgeText":"⚡ 99.98% Gateway Uptime • Instant Delivery","heroImageUrl":"https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80"}', NULL, 1, 1, 'system', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO cms_sections (id, title, content_json, draft_json, is_published, version, updated_by, updated_at) VALUES ('services_promo', 'Services & Promotional Showcase', '{"badge":"Enterprise Telecommunications","title":"Complete Suite of Digital VTU Services","description":"Engineered for consumers, busy retail agents, and enterprise API resellers.","features":[{"title":"Sub-3s Data Delivery","desc":"MTN SME, Airtel CG, Glo Gift, 9Mobile direct via dedicated SIM modems."},{"title":"Instant NUBAN Funding","desc":"Dedicated PalmPay, Monnify & Paystack accounts with zero deposit wait times."},{"title":"SunKing Solar PINs","desc":"Instant 16-digit activation codes for clean home solar energy."},{"title":"Utility Token Generation","desc":"Prepaid meter tokens for IKEDC, EKEDC, AEDC with instant receipt prints."}]}', NULL, 1, 1, 'system', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO cms_sections (id, title, content_json, draft_json, is_published, version, updated_by, updated_at) VALUES ('contact_footer', 'Contact & Footer Details', '{"supportEmail":"support@bukardatasub.com","supportPhone":"+234 913 179 7675","whatsapp":"+234 913 179 7675","address":"Suite 402, Technology Innovation Hub, Ahmadu Bello Way, Abuja, Nigeria","copyrightText":"© 2026 Bukar Data Sub Ltd. All Rights Reserved. Regulated Financial Technology & Telecom Platform.","socialLinks":{"twitter":"https://twitter.com/bukardatasub","facebook":"https://facebook.com/bukardatasub","instagram":"https://instagram.com/bukardatasub"}}', NULL, 1, 1, 'system', '2026-10-26T12:00:00.000Z');
INSERT OR REPLACE INTO cms_sections (id, title, content_json, draft_json, is_published, version, updated_by, updated_at) VALUES ('terms_privacy', 'Legal & Compliance Policies', '{"termsSummary":"Users agree to adhere to CBN and NCC telecommunication guidelines. Unauthorized scraping or fraudulent chargebacks are strictly prohibited.","privacySummary":"We encrypt all customer credentials using AES-256-GCM. We never store raw card details or share personal records with unauthorized third parties.","lastUpdated":"October 2026"}', NULL, 1, 1, 'system', '2026-10-26T12:00:00.000Z');

-- Table: cms_revisions (1 records)
INSERT OR REPLACE INTO cms_revisions (id, section_id, version, content_json, created_by, notes, created_at) VALUES ('rev_hero_v1', 'hero', 1, '{"headline":"Automated SME Data, Airtime & Utility Hub","subheadline":"Experience sub-3-second automated delivery for SME & Corporate Data, Airtime VTU, Electricity Tokens, Cable TV subscriptions, and SunKing Solar PINs.","ctaPrimaryText":"Get Started Now","ctaPrimaryLink":"/app/dashboard","ctaSecondaryText":"Explore Wholesale Plans","ctaSecondaryLink":"#services","badgeText":"⚡ 99.98% Gateway Uptime • Instant Delivery","heroImageUrl":"https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80"}', 'system', 'Initial production baseline', '2026-10-26T12:00:00.000Z');

-- Table: mobile_app_config (1 records)
INSERT OR REPLACE INTO mobile_app_config (id, app_name, branding_json, banner_json, android_min_version, android_latest_version, ios_min_version, ios_latest_version, force_update, update_title, update_notes, play_store_url, app_store_url, services_enabled_json, maintenance_mode, maintenance_message, updated_by, updated_at) VALUES ('cfg_mobile_001', 'Bukar Data Sub Mobile', '{"primaryColor":"#1E5BF9","accentColor":"#00B977","logoUrl":""}', '[{"id":"b1","title":"5% CashBack on MTN SME Data","subtitle":"Automatic discount applied at checkout for agents","actionUrl":"/services"},{"id":"b2","title":"SunKing Solar PINs Active","subtitle":"Recharge your clean home solar lights instantly","actionUrl":"/services"}]', '1.0.0', '1.0.0', '1.0.0', '1.0.0', 0, 'New Speed Optimization Available', 'Includes sub-second PalmPay virtual account notifications and biometric quick-login.', 'https://play.google.com/store/apps/details?id=com.bukardatasub.app', 'https://apps.apple.com/app/id6449123456', '["data","airtime","electricity","cable","solar","exam"]', 0, '', 'system', '2026-10-26T12:00:00.000Z');

-- Table: notification_templates (39 records)
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_request_created', 'PAYMENT_REQUEST_CREATED', '[Bukar Data Sub] PAYMENT REQUEST CREATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT REQUEST CREATED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT REQUEST CREATED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_instructions_generated', 'PAYMENT_INSTRUCTIONS_GENERATED', '[Bukar Data Sub] PAYMENT INSTRUCTIONS GENERATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT INSTRUCTIONS GENERATED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT INSTRUCTIONS GENERATED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_initiated', 'PAYMENT_INITIATED', '[Bukar Data Sub] PAYMENT INITIATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT INITIATED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT INITIATED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_awaiting_confirmation', 'PAYMENT_AWAITING_CONFIRMATION', '[Bukar Data Sub] PAYMENT AWAITING CONFIRMATION', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT AWAITING CONFIRMATION</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT AWAITING CONFIRMATION: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_processing_started', 'PAYMENT_PROCESSING_STARTED', '[Bukar Data Sub] PAYMENT PROCESSING STARTED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT PROCESSING STARTED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT PROCESSING STARTED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_confirmed_success', 'PAYMENT_CONFIRMED_SUCCESS', '[Bukar Data Sub] PAYMENT CONFIRMED SUCCESS', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT CONFIRMED SUCCESS</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT CONFIRMED SUCCESS: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_failed', 'PAYMENT_FAILED', '[Bukar Data Sub] PAYMENT FAILED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT FAILED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT FAILED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_cancelled', 'PAYMENT_CANCELLED', '[Bukar Data Sub] PAYMENT CANCELLED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT CANCELLED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT CANCELLED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_expired', 'PAYMENT_EXPIRED', '[Bukar Data Sub] PAYMENT EXPIRED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT EXPIRED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT EXPIRED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_delayed', 'PAYMENT_DELAYED', '[Bukar Data Sub] PAYMENT DELAYED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT DELAYED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT DELAYED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_status_changed', 'PAYMENT_STATUS_CHANGED', '[Bukar Data Sub] PAYMENT STATUS CHANGED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT STATUS CHANGED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT STATUS CHANGED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_duplicate_payment_suspected', 'DUPLICATE_PAYMENT_SUSPECTED', '[Bukar Data Sub] DUPLICATE PAYMENT SUSPECTED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> DUPLICATE PAYMENT SUSPECTED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] DUPLICATE PAYMENT SUSPECTED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_duplicate_payment_confirmed', 'DUPLICATE_PAYMENT_CONFIRMED', '[Bukar Data Sub] DUPLICATE PAYMENT CONFIRMED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> DUPLICATE PAYMENT CONFIRMED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] DUPLICATE PAYMENT CONFIRMED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_refund_requested', 'REFUND_REQUESTED', '[Bukar Data Sub] REFUND REQUESTED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> REFUND REQUESTED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] REFUND REQUESTED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_refund_completed', 'REFUND_COMPLETED', '[Bukar Data Sub] REFUND COMPLETED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> REFUND COMPLETED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] REFUND COMPLETED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_refund_failed', 'REFUND_FAILED', '[Bukar Data Sub] REFUND FAILED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> REFUND FAILED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] REFUND FAILED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_reversal_initiated', 'PAYMENT_REVERSAL_INITIATED', '[Bukar Data Sub] PAYMENT REVERSAL INITIATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT REVERSAL INITIATED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT REVERSAL INITIATED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_reversal_completed', 'PAYMENT_REVERSAL_COMPLETED', '[Bukar Data Sub] PAYMENT REVERSAL COMPLETED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT REVERSAL COMPLETED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT REVERSAL COMPLETED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_dispute_opened', 'PAYMENT_DISPUTE_OPENED', '[Bukar Data Sub] PAYMENT DISPUTE OPENED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT DISPUTE OPENED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT DISPUTE OPENED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_dispute_resolved', 'PAYMENT_DISPUTE_RESOLVED', '[Bukar Data Sub] PAYMENT DISPUTE RESOLVED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT DISPUTE RESOLVED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT DISPUTE RESOLVED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_wallet_funding_initiated', 'WALLET_FUNDING_INITIATED', '[Bukar Data Sub] WALLET FUNDING INITIATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> WALLET FUNDING INITIATED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] WALLET FUNDING INITIATED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_wallet_funding_confirmed', 'WALLET_FUNDING_CONFIRMED', '[Bukar Data Sub] WALLET FUNDING CONFIRMED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> WALLET FUNDING CONFIRMED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] WALLET FUNDING CONFIRMED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_wallet_funding_failed', 'WALLET_FUNDING_FAILED', '[Bukar Data Sub] WALLET FUNDING FAILED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> WALLET FUNDING FAILED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] WALLET FUNDING FAILED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_wallet_credited', 'WALLET_CREDITED', '[Bukar Data Sub] WALLET CREDITED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> WALLET CREDITED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] WALLET CREDITED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_wallet_debited', 'WALLET_DEBITED', '[Bukar Data Sub] WALLET DEBITED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> WALLET DEBITED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] WALLET DEBITED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_wallet_adjustment_submitted', 'WALLET_ADJUSTMENT_SUBMITTED', '[Bukar Data Sub] WALLET ADJUSTMENT SUBMITTED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> WALLET ADJUSTMENT SUBMITTED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] WALLET ADJUSTMENT SUBMITTED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_wallet_adjustment_reviewed', 'WALLET_ADJUSTMENT_REVIEWED', '[Bukar Data Sub] WALLET ADJUSTMENT REVIEWED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> WALLET ADJUSTMENT REVIEWED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] WALLET ADJUSTMENT REVIEWED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_payment_receipt_generated', 'PAYMENT_RECEIPT_GENERATED', '[Bukar Data Sub] PAYMENT RECEIPT GENERATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> PAYMENT RECEIPT GENERATED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] PAYMENT RECEIPT GENERATED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_reconciliation_discrepancy', 'RECONCILIATION_DISCREPANCY', '[Bukar Data Sub] RECONCILIATION DISCREPANCY', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> RECONCILIATION DISCREPANCY</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] RECONCILIATION DISCREPANCY: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_vtu_transaction_received', 'VTU_TRANSACTION_RECEIVED', '[Bukar Data Sub] VTU TRANSACTION RECEIVED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> VTU TRANSACTION RECEIVED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] VTU TRANSACTION RECEIVED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_vtu_submitted_to_provider', 'VTU_SUBMITTED_TO_PROVIDER', '[Bukar Data Sub] VTU SUBMITTED TO PROVIDER', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> VTU SUBMITTED TO PROVIDER</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] VTU SUBMITTED TO PROVIDER: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_vtu_provider_acknowledged', 'VTU_PROVIDER_ACKNOWLEDGED', '[Bukar Data Sub] VTU PROVIDER ACKNOWLEDGED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> VTU PROVIDER ACKNOWLEDGED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] VTU PROVIDER ACKNOWLEDGED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_vtu_processing', 'VTU_PROCESSING', '[Bukar Data Sub] VTU PROCESSING', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> VTU PROCESSING</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] VTU PROCESSING: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_vtu_completed_success', 'VTU_COMPLETED_SUCCESS', '[Bukar Data Sub] VTU COMPLETED SUCCESS', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> VTU COMPLETED SUCCESS</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] VTU COMPLETED SUCCESS: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_vtu_failed', 'VTU_FAILED', '[Bukar Data Sub] VTU FAILED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> VTU FAILED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] VTU FAILED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_vtu_pending_delayed', 'VTU_PENDING_DELAYED', '[Bukar Data Sub] VTU PENDING DELAYED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> VTU PENDING DELAYED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] VTU PENDING DELAYED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_vtu_provider_unavailable', 'VTU_PROVIDER_UNAVAILABLE', '[Bukar Data Sub] VTU PROVIDER UNAVAILABLE', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> VTU PROVIDER UNAVAILABLE</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] VTU PROVIDER UNAVAILABLE: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_vtu_refund_initiated', 'VTU_REFUND_INITIATED', '[Bukar Data Sub] VTU REFUND INITIATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> VTU REFUND INITIATED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] VTU REFUND INITIATED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);
INSERT OR REPLACE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active) VALUES ('tpl_vtu_refund_completed', 'VTU_REFUND_COMPLETED', '[Bukar Data Sub] VTU REFUND COMPLETED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bukar Data Sub</h2>
      <p>Dear {{name}},</p>
      <p><strong>Event:</strong> VTU REFUND COMPLETED</p>
      <p>{{message}}</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Reference:</strong> {{reference}}</p>
        <p><strong>Amount:</strong> ₦{{amount}}</p>
        <p><strong>Date & Time:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">{{status}}</span></p>
      </div>
    </div>', '[Bukar Data Sub] VTU REFUND COMPLETED: Reference {{reference}}, Amount: N{{amount}}, Status: {{status}}. Visit your dashboard to view details.', 1);

COMMIT;
PRAGMA foreign_keys = ON;
