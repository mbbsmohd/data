import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { CONFIG, NOTIFICATION_EVENTS } from '../config/index.js';
import { encryptField, hashPasswordSync } from '../utils/crypto.js';

// Ensure data directory exists
const dataDir = path.dirname(CONFIG.DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new DatabaseSync(CONFIG.DB_PATH);

// Configure WAL mode and foreign key constraints
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 10000;
`);

export function initializeDatabase() {
  db.exec(`
    -- System Dynamic Settings & Branding (Configurable by Super Admin)
    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY,
      app_name TEXT NOT NULL DEFAULT 'Bukar Data Sub',
      app_tagline TEXT NOT NULL DEFAULT 'Automated Telecom & Data Platform',
      logo_url TEXT DEFAULT '',
      primary_color TEXT NOT NULL DEFAULT '#1E5BF9',
      support_email TEXT NOT NULL DEFAULT 'support@bukardatasub.com',
      support_phone TEXT NOT NULL DEFAULT '09131797675',
      whatsapp_number TEXT NOT NULL DEFAULT '2349131797675',
      currency TEXT NOT NULL DEFAULT 'NGN',
      currency_symbol TEXT NOT NULL DEFAULT '₦',
      announcement_text TEXT DEFAULT 'Welcome to our newly upgraded automated data engine! SunKing Solar PINs and SME data delivery are 100% active.',
      announcement_type TEXT NOT NULL DEFAULT 'info', -- info, promo, warning, urgent
      announcement_active INTEGER NOT NULL DEFAULT 1,
      announcement_target TEXT NOT NULL DEFAULT 'all', -- all, public, users
      updated_at TEXT NOT NULL
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer', -- super_admin, sub_admin, reseller, agent, customer
      sub_admin_role TEXT, -- finance, support, services, security
      tier INTEGER NOT NULL DEFAULT 1, -- 1: Basic, 2: KYC Verified, 3: Merchant/Agent
      status TEXT NOT NULL DEFAULT 'active', -- active, suspended, pending_verification
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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Wallets
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

    -- Immutable Double-Entry Ledger
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      wallet_id TEXT NOT NULL REFERENCES wallets(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      entry_type TEXT NOT NULL, -- CREDIT, DEBIT
      amount REAL NOT NULL,
      balance_before REAL NOT NULL,
      balance_after REAL NOT NULL,
      category TEXT NOT NULL, -- WALLET_FUNDING, VTU_PURCHASE, AIRTIME_CASH, TRANSFER, COMMISSION_PAYOUT, REFUND, ADJUSTMENT, SAVINGS_DEPOSIT, SAVINGS_WITHDRAWAL
      reference TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Payment Requests & Gateways
    CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      reference TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'NGN',
      gateway TEXT NOT NULL, -- monnify, paystack, flutterwave, bank_transfer
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, SUCCESSFUL, FAILED, EXPIRED, CANCELLED
      gateway_reference TEXT,
      virtual_account_number TEXT,
      virtual_bank_name TEXT,
      virtual_account_name TEXT,
      paid_at TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL
    );

    -- Services Catalogue
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      provider_id TEXT,
      routing_type TEXT NOT NULL DEFAULT 'API', -- API or SIM_HOSTING
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

    -- Service Plans
    CREATE TABLE IF NOT EXISTS service_plans (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL REFERENCES services(id),
      network_or_biller TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      plan_code TEXT NOT NULL,
      amount REAL NOT NULL,
      validity TEXT,
      routing_type TEXT NOT NULL DEFAULT 'API', -- API or SIM_HOSTING
      sim_slot_id TEXT,
      ussd_template TEXT,
      description TEXT,
      is_available INTEGER NOT NULL DEFAULT 1
    );

    -- VTU & Digital Transactions
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
      routing_used TEXT NOT NULL DEFAULT 'API', -- API or SIM_HOSTING
      status TEXT NOT NULL DEFAULT 'PENDING',
      token_or_pin TEXT,
      provider_reference TEXT,
      provider_response TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Airtime to Cash Orders
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

    -- SafeBox / Locked Savings
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

    -- Saved Beneficiaries
    CREATE TABLE IF NOT EXISTS beneficiaries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      category TEXT NOT NULL, -- airtime, data, electricity, cable
      identifier TEXT NOT NULL, -- phone number or meter number
      name TEXT NOT NULL,
      network_or_biller TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- KYC & CAC Verifications
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

    -- API Providers
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
      created_at TEXT NOT NULL
    );

    -- SIM Hosting Gateway
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

    -- Notifications
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

    -- Notification Templates (All 33 events)
    CREATE TABLE IF NOT EXISTS notification_templates (
      id TEXT PRIMARY KEY,
      event_key TEXT UNIQUE NOT NULL,
      subject TEXT NOT NULL,
      html_template TEXT NOT NULL,
      sms_template TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    -- Audit Logs
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

    -- System Backups
    CREATE TABLE IF NOT EXISTS system_backups (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      checksum TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'COMPLETED',
      created_at TEXT NOT NULL
    );

    -- Reseller Business API Keys
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

    -- Support Tickets
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

    -- Ticket Replies
    CREATE TABLE IF NOT EXISTS ticket_replies (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      message TEXT NOT NULL,
      attachment_url TEXT,
      created_at TEXT NOT NULL
    );

    -- Idempotency Keys
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      request_path TEXT NOT NULL,
      response_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- OTP & 2FA Verifications
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

    -- Payment Gateways Configuration
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

    -- Customer Bank Withdrawal Requests (Admin Processed)
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
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, PROCESSING, COMPLETED, REJECTED, CANCELLED
      admin_notes TEXT,
      payment_reference TEXT,
      processed_by TEXT,
      processed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Customer Testimonials & Platform Reviews
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

    -- User Dashboard Announcements & Popups (SweetAlert)
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

    -- High-Performance Indices for Heavy Traffic
    CREATE INDEX IF NOT EXISTS idx_announcements_active ON dashboard_announcements(is_active, expires_at);
    CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_requests(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);
    CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger_entries(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_trans_user ON vtu_transactions(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_otp_verify ON otp_verifications(identifier, code, is_used);
    CREATE INDEX IF NOT EXISTS idx_testimonials_pub ON testimonials(is_published, sort_order);
  `);

  // Safe schema migrations for enhanced features
  const safeAlter = (sql: string) => {
    try { db.exec(sql); } catch {}
  };

  safeAlter("ALTER TABLE system_settings ADD COLUMN smtp_host TEXT DEFAULT ''");
  safeAlter("ALTER TABLE system_settings ADD COLUMN smtp_port INTEGER DEFAULT 587");
  safeAlter("ALTER TABLE system_settings ADD COLUMN smtp_user TEXT DEFAULT ''");
  safeAlter("ALTER TABLE system_settings ADD COLUMN smtp_pass TEXT DEFAULT ''");
  safeAlter("ALTER TABLE system_settings ADD COLUMN smtp_secure INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE system_settings ADD COLUMN smtp_from_name TEXT DEFAULT ''");
  safeAlter("ALTER TABLE system_settings ADD COLUMN smtp_from_email TEXT DEFAULT ''");
  safeAlter("ALTER TABLE system_settings ADD COLUMN maintenance_mode INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE system_settings ADD COLUMN maintenance_message TEXT DEFAULT 'System undergoing scheduled optimization. We will be back online shortly.'");
  safeAlter("ALTER TABLE system_settings ADD COLUMN accent_color TEXT DEFAULT '#10B981'");
  safeAlter("ALTER TABLE system_settings ADD COLUMN referral_bonus_amount REAL DEFAULT 100.0");
  safeAlter("ALTER TABLE system_settings ADD COLUMN referral_commission_percent REAL DEFAULT 1.5");

  safeAlter("ALTER TABLE service_plans ADD COLUMN data_type TEXT DEFAULT 'SME'");
  safeAlter("ALTER TABLE service_plans ADD COLUMN plan_size TEXT DEFAULT '1GB'");
  safeAlter("ALTER TABLE service_plans ADD COLUMN buying_price REAL DEFAULT 0");
  safeAlter("ALTER TABLE service_plans ADD COLUMN reseller_price REAL DEFAULT 0");
  safeAlter("ALTER TABLE service_plans ADD COLUMN api_price REAL DEFAULT 0");
  safeAlter("ALTER TABLE service_plans ADD COLUMN provider_id TEXT");
  safeAlter("ALTER TABLE service_plans ADD COLUMN provider_plan_id TEXT");
  safeAlter("ALTER TABLE service_plans ADD COLUMN routing_type TEXT DEFAULT 'API'");
  safeAlter("ALTER TABLE service_plans ADD COLUMN sim_slot_id TEXT");
  safeAlter("ALTER TABLE service_plans ADD COLUMN ussd_template TEXT");

  safeAlter("ALTER TABLE users ADD COLUMN failed_pin_attempts INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE users ADD COLUMN pin_locked_until TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE users ADD COLUMN active_session_id TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN last_active_at TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN last_login_ip TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN virtual_account_bank TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN virtual_account_number TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN virtual_account_name TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN virtual_account_reference TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN address TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN state TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN date_of_birth TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN avatar_url TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN bio TEXT");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by)");

  safeAlter("ALTER TABLE api_providers ADD COLUMN api_key_encrypted TEXT DEFAULT ''");
  safeAlter("ALTER TABLE api_providers ADD COLUMN data_endpoint TEXT DEFAULT '/data'");
  safeAlter("ALTER TABLE api_providers ADD COLUMN airtime_endpoint TEXT DEFAULT '/airtime'");
  safeAlter("ALTER TABLE api_providers ADD COLUMN cable_endpoint TEXT DEFAULT '/cable'");
  safeAlter("ALTER TABLE api_providers ADD COLUMN electricity_endpoint TEXT DEFAULT '/electricity'");
  safeAlter("ALTER TABLE api_providers ADD COLUMN balance_endpoint TEXT DEFAULT '/balance'");
  safeAlter("ALTER TABLE api_providers ADD COLUMN http_method TEXT DEFAULT 'POST'");

  safeAlter(`
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
    )
  `);

  safeAlter("CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_requests(user_id, status)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger_entries(user_id, created_at)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_trans_user ON vtu_transactions(user_id, created_at)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_otp_verify ON otp_verifications(identifier, code, is_used)");
  safeAlter("ALTER TABLE vtu_transactions ADD COLUMN channel TEXT DEFAULT 'WEB'");
  safeAlter("ALTER TABLE vtu_transactions ADD COLUMN cost_amount REAL DEFAULT 0");
  safeAlter("ALTER TABLE vtu_transactions ADD COLUMN profit_margin REAL DEFAULT 0");
  safeAlter("ALTER TABLE vtu_transactions ADD COLUMN idempotency_key TEXT");
  safeAlter("ALTER TABLE users ADD COLUMN sound_enabled INTEGER DEFAULT 1");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_trans_idempotency ON vtu_transactions(idempotency_key)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_trans_channel ON vtu_transactions(channel)");

  // Advanced Upgrade Migrations: Maintenance, CMS, Audited Adjustments, Mobile Remote Config, Security Center
  safeAlter("ALTER TABLE system_settings ADD COLUMN maintenance_scope TEXT DEFAULT 'all'");
  safeAlter("ALTER TABLE system_settings ADD COLUMN maintenance_start_time TEXT DEFAULT ''");
  safeAlter("ALTER TABLE system_settings ADD COLUMN maintenance_end_time TEXT DEFAULT ''");
  safeAlter("ALTER TABLE system_settings ADD COLUMN maintenance_bypass_ips TEXT DEFAULT ''");

  safeAlter(`
    CREATE TABLE IF NOT EXISTS cms_sections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      draft_json TEXT,
      is_published INTEGER NOT NULL DEFAULT 1,
      version INTEGER NOT NULL DEFAULT 1,
      updated_by TEXT,
      updated_at TEXT NOT NULL
    )
  `);

  safeAlter(`
    CREATE TABLE IF NOT EXISTS cms_revisions (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL REFERENCES cms_sections(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      content_json TEXT NOT NULL,
      created_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    )
  `);

  safeAlter(`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'all',
      message TEXT,
      start_time TEXT,
      end_time TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL
    )
  `);

  safeAlter(`
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
    )
  `);

  safeAlter(`
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
    )
  `);

  safeAlter(`
    CREATE TABLE IF NOT EXISTS mobile_telemetry (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      app_version TEXT NOT NULL,
      device_model TEXT,
      os_version TEXT,
      event_type TEXT NOT NULL,
      details_json TEXT,
      created_at TEXT NOT NULL
    )
  `);

  safeAlter(`
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
    )
  `);

  safeAlter("CREATE INDEX IF NOT EXISTS idx_cms_rev_sec ON cms_revisions(section_id, version)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_adj_user ON wallet_adjustments(user_id, status)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_sec_incidents ON security_incidents(status, severity)");

  // Real-Time Financial Command Center & Security Activity Migrations
  safeAlter(`
    CREATE TABLE IF NOT EXISTS login_history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      email TEXT NOT NULL,
      status TEXT NOT NULL, -- SUCCESS, FAILED
      ip_address TEXT,
      user_agent TEXT,
      failure_reason TEXT,
      created_at TEXT NOT NULL
    )
  `);

  safeAlter(`
    CREATE TABLE IF NOT EXISTS operating_expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- SERVER_HOSTING, SMS_GATEWAY, OFFICE_OPS, LEGAL_COMPLIANCE, CUSTOMER_SERVICE
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'NGN',
      notes TEXT,
      recorded_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  safeAlter(`
    CREATE TABLE IF NOT EXISTS support_chat_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      subject TEXT DEFAULT 'Customer Support Inquiry',
      status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, PENDING, RESOLVED, CLOSED
      assigned_to TEXT,
      internal_notes TEXT,
      unread_admin_count INTEGER NOT NULL DEFAULT 0,
      unread_user_count INTEGER NOT NULL DEFAULT 0,
      last_message_text TEXT,
      last_message_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  safeAlter(`
    CREATE TABLE IF NOT EXISTS support_chat_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES support_chat_conversations(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL,
      sender_type TEXT NOT NULL, -- USER, ADMIN, SYSTEM
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      attachment_url TEXT,
      is_internal_note INTEGER NOT NULL DEFAULT 0,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  safeAlter(`
    CREATE TABLE IF NOT EXISTS financial_reconciliations (
      id TEXT PRIMARY KEY,
      audit_type TEXT NOT NULL, -- WALLET_LEDGER_CONSISTENCY, GATEWAY_INFLOW_RECONCILIATION, WITHDRAWAL_PAYOUT_AUDIT, PENDING_TX_AUDIT, FULL_SYSTEM_AUDIT
      status TEXT NOT NULL DEFAULT 'HEALTHY', -- HEALTHY, DISCREPANCIES_FOUND, RESOLVED
      discrepancy_count INTEGER NOT NULL DEFAULT 0,
      details_json TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      resolution_notes TEXT,
      resolved_by TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    )
  `);

  safeAlter("CREATE INDEX IF NOT EXISTS idx_login_hist_user ON login_history(user_id, created_at)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_login_hist_email ON login_history(email, created_at)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_expenses_date ON operating_expenses(created_at)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON support_chat_conversations(user_id, status)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON support_chat_messages(conversation_id, created_at)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_fin_reconcil_status ON financial_reconciliations(status, created_at)");
  safeAlter("ALTER TABLE users ADD COLUMN account_locked INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE users ADD COLUMN lock_reason TEXT");
  safeAlter("ALTER TABLE services ADD COLUMN routing_type TEXT NOT NULL DEFAULT 'API'");
  safeAlter("ALTER TABLE services ADD COLUMN sim_slot_id TEXT");
  safeAlter("ALTER TABLE service_plans ADD COLUMN routing_type TEXT NOT NULL DEFAULT 'API'");
  safeAlter("ALTER TABLE service_plans ADD COLUMN sim_slot_id TEXT");
  safeAlter("ALTER TABLE service_plans ADD COLUMN ussd_template TEXT");

  // Operational Staff Tasks & Delegation Engine (Phase 7)
  safeAlter(`
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
    )
  `);

  safeAlter(`
    CREATE TABLE IF NOT EXISTS staff_task_comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES staff_tasks(id) ON DELETE CASCADE
    )
  `);

  safeAlter("CREATE INDEX IF NOT EXISTS idx_staff_tasks_status ON staff_tasks(status, priority)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_staff_tasks_assignee ON staff_tasks(assigned_to_user_id)");
  safeAlter("CREATE INDEX IF NOT EXISTS idx_task_comments_task ON staff_task_comments(task_id, created_at)");

  // System Name & Branding Migration to Bukar Data Sub
  try {
    db.prepare(`
      UPDATE system_settings
      SET app_name = 'Bukar Data Sub',
          app_tagline = 'Automated Telecom & Data Platform',
          support_email = 'support@bukardatasub.com'
      WHERE app_name LIKE '%ABK%' OR id = 'sys_settings_001'
    `).run();
  } catch {}

  seedInitialData();
}

function seedInitialData() {
  const now = new Date().toISOString();

  // 1. Seed Dynamic Settings if empty
  const settingsCheck = db.prepare('SELECT COUNT(*) as count FROM system_settings').get() as { count: number };
  if (!settingsCheck || settingsCheck.count === 0) {
    db.prepare(`
      INSERT INTO system_settings (
        id, app_name, app_tagline, logo_url, primary_color, support_email, support_phone,
        whatsapp_number, currency, currency_symbol, announcement_text, announcement_type,
        announcement_active, announcement_target, updated_at
      )
      VALUES (
        'sys_settings_001', 'Bukar Data Sub', 'Automated Telecom & Data Platform',
        '', '#1E5BF9', 'support@bukardatasub.com', '09131797675',
        '2349131797675', 'NGN', '₦',
        '⚡ High-speed SME Data and SunKing Solar PIN delivery channels are 100% operational.',
        'info', 1, 'all', ?
      )
    `).run(now);
  }

  // Seed Default Payment Gateways if empty
  const gatewayCheck = db.prepare('SELECT COUNT(*) as count FROM payment_gateways').get() as { count: number };
  if (!gatewayCheck || gatewayCheck.count === 0) {
    const insertGateway = db.prepare(`
      INSERT INTO payment_gateways (
        id, name, is_active, is_default, environment, public_key, contract_code, bank_name, account_number, account_name, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertGateway.run('monnify', 'Monnify Automated Reserved Accounts', 1, 1, 'production', '', '', 'Wema Bank', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', now);
    insertGateway.run('paystack', 'Paystack Dedicated NUBAN & Card Checkout', 1, 0, 'production', '', '', 'Titan / Wema Bank', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', now);
    insertGateway.run('flutterwave', 'Flutterwave Virtual Accounts & Cards', 0, 0, 'production', '', '', 'Wema / Barter', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', now);
    insertGateway.run('manual_bank', 'Direct Corporate Bank Deposit (Manual)', 1, 0, 'production', '', '', 'Moniepoint MFB', '9131797675', 'BUKAR DATA SUB LTD', now);
  }

  // Ensure PalmPay gateway exists
  const palmpayCheck = db.prepare("SELECT id FROM payment_gateways WHERE id = 'palmpay'").get();
  if (!palmpayCheck) {
    db.prepare(`
      INSERT INTO payment_gateways (
        id, name, is_active, is_default, environment, public_key, contract_code, bank_name, account_number, account_name, updated_at
      )
      VALUES ('palmpay', 'PalmPay Dedicated Virtual Accounts & Agency NUBAN', 1, 0, 'production', '', '', 'PalmPay MFB', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', ?)
    `).run(now);
  }

  // Seed Default Testimonials if empty
  const testCheck = db.prepare('SELECT COUNT(*) as count FROM testimonials').get() as { count: number };
  if (!testCheck || testCheck.count === 0) {
    const insertTestimonial = db.prepare(`
      INSERT INTO testimonials (id, author_name, author_role, rating, content, avatar_url, is_published, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTestimonial.run(
      'tst_001', 'Ibrahim Danladi', 'SME Data Merchant (Kano)', 5,
      'Bukar Data Sub has completely transformed my daily reselling business. SME data delivery takes less than 3 seconds, and the automated PalmPay/Monnify virtual accounts fund my wallet instantaneously with zero manual verification delays.',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      1, 1, now, now
    );
    insertTestimonial.run(
      'tst_002', 'Aisha Bello', 'POS & Agency Banking Operator (Kaduna)', 5,
      'The 16-digit SunKing Solar activation PIN engine is 100% dependable. My rural customers get their light back instantly without downtime. The UI is super fast and clean.',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      1, 2, now, now
    );
    insertTestimonial.run(
      'tst_003', 'Emeka Okafor', 'Software Engineer & API Reseller (Lagos)', 5,
      'Their Reseller API with strict HMAC webhooks, rate limiting, and 99.98% uptime SLA is the best in Nigeria. We route over 4,000 requests daily with zero discrepancies.',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      1, 3, now, now
    );
  }

  // 12. Seed CMS Sections if empty
  const cmsCheck = db.prepare('SELECT COUNT(*) as count FROM cms_sections').get() as { count: number };
  if (!cmsCheck || cmsCheck.count === 0) {
    const insertCms = db.prepare(`
      INSERT INTO cms_sections (id, title, content_json, draft_json, is_published, version, updated_by, updated_at)
      VALUES (?, ?, ?, ?, 1, 1, 'system', ?)
    `);

    insertCms.run(
      'hero',
      'Homepage Hero Section',
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
      null,
      now
    );

    insertCms.run(
      'services_promo',
      'Services & Promotional Showcase',
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
      null,
      now
    );

    insertCms.run(
      'contact_footer',
      'Contact & Footer Details',
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
      null,
      now
    );

    insertCms.run(
      'terms_privacy',
      'Legal & Compliance Policies',
      JSON.stringify({
        termsSummary: 'Users agree to adhere to CBN and NCC telecommunication guidelines. Unauthorized scraping or fraudulent chargebacks are strictly prohibited.',
        privacySummary: 'We encrypt all customer credentials using AES-256-GCM. We never store raw card details or share personal records with unauthorized third parties.',
        lastUpdated: 'October 2026'
      }),
      null,
      now
    );

    // Seed initial revision history for hero
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
  }

  // 13. Seed Mobile App Remote Config if empty
  const mobileConfigCheck = db.prepare('SELECT COUNT(*) as count FROM mobile_app_config').get() as { count: number };
  if (!mobileConfigCheck || mobileConfigCheck.count === 0) {
    db.prepare(`
      INSERT INTO mobile_app_config (
        id, app_name, branding_json, banner_json,
        android_min_version, android_latest_version, ios_min_version, ios_latest_version,
        force_update, update_title, update_notes, play_store_url, app_store_url,
        services_enabled_json, maintenance_mode, maintenance_message, updated_by, updated_at
      )
      VALUES (
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
  }

  // Clean Production Super Admin Initialization (Zero dummy users seeded)
  const userCheck = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (!userCheck || userCheck.count === 0) {
    const superAdminPasswordHash = hashPasswordSync('BukarData#2026');
    const pinHash = hashPasswordSync('1234');
    const adminId = 'usr_root_admin';
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, tier, status, transaction_pin_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'super_admin', 3, 'active', ?, ?, ?)
    `).run(adminId, 'Super Administrator', 'admin@bukardatasub.com', '08000000001', superAdminPasswordHash, pinHash, now, now);

    db.prepare(`
      INSERT INTO wallets (id, user_id, balance, commission_balance, currency, is_locked, created_at, updated_at)
      VALUES ('wal_root_admin', ?, 0.0, 0.0, 'NGN', 0, ?, ?)
    `).run(adminId, now, now);
  }

  // Initial SIM Hosting Hardware Inventory (Zero dummy balances, ready for live modem pairing)
  const simCheck = db.prepare('SELECT COUNT(*) as count FROM sim_hosts').get() as { count: number };
  if (!simCheck || simCheck.count === 0) {
    db.prepare(`
      INSERT OR IGNORE INTO sim_hosts (
        id, provider_name, server_url, sim_slot, phone_number, network,
        airtime_balance, status, last_heartbeat, daily_sms_sent, daily_sms_limit, ussd_code_template, created_at
      )
      VALUES
        ('sim_slot_1', 'Telecom Server Alpha', 'https://simserver1.telecom.net', 1, '', 'MTN', 0.00, 'OFFLINE', ?, 0, 1000, '*556#', ?),
        ('sim_slot_2', 'Telecom Server Alpha', 'https://simserver1.telecom.net', 2, '', 'AIRTEL', 0.00, 'OFFLINE', ?, 0, 1000, '*123#', ?),
        ('sim_slot_3', 'Telecom Server Beta', 'https://simserver2.telecom.net', 1, '', 'GLO', 0.00, 'OFFLINE', ?, 0, 1000, '*124#', ?)
    `).run(now, now, now, now, now, now);
  }

  // 6. Seed Services Catalogue with BOTH Normal API and SIM Hosting Routing Options!
  const servicesList = [
    { id: 'srv_data', category: 'data', name: 'Data Bundles', code: 'DATA', routing: 'API', icon: 'Wifi', badge: 'Up to 3%' },
    { id: 'srv_airtime', category: 'airtime', name: 'Airtime VTU', code: 'AIRTIME', routing: 'SIM_HOSTING', slot: 'sim_slot_1', icon: 'Phone', badge: 'Instant' },
    { id: 'srv_solar', category: 'solar_pin', name: 'SunKing Solar PIN', code: 'SOLAR_PIN', routing: 'API', icon: 'Sun', badge: 'Instant 16-Digit' },
    { id: 'srv_cable', category: 'cable', name: 'Cable TV Subscription', code: 'CABLE', routing: 'API', icon: 'Tv', badge: 'Active' },
    { id: 'srv_airtime_cash', category: 'airtime_cash', name: 'Airtime to Cash', code: 'AIRTIME_CASH', routing: 'SIM_HOSTING', slot: 'sim_slot_1', icon: 'Repeat', badge: 'Instant 85%' },
    { id: 'srv_electricity', category: 'electricity', name: 'Electricity Bills', code: 'ELECTRICITY', routing: 'API', icon: 'Zap', badge: '20-Digit Token' },
    { id: 'srv_recharge', category: 'recharge_print', name: 'Recharge Card Printing', code: 'RECHARGE_PRINT', routing: 'API', icon: 'Printer', badge: '2% Discount' },
    { id: 'srv_bulk_sms', category: 'bulk_sms', name: 'Bulk SMS Portal', code: 'BULK_SMS', routing: 'API', icon: 'Mail', badge: 'Corporate DND' },
    { id: 'srv_safebox', category: 'safebox', name: 'SafeBox Savings', code: 'SAFEBOX', routing: 'API', icon: 'Shield', badge: '15-18% p.a.' }
  ];

  for (const srv of servicesList) {
    db.prepare(`
      INSERT OR IGNORE INTO services (id, category, name, code, routing_type, sim_slot_id, is_active, icon, badge, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).run(srv.id, srv.category, srv.name, srv.code, srv.routing, srv.slot || null, srv.icon, srv.badge, now);
  }

  // 7. Seed Service Plans (MTN, Airtel, Glo, 9mobile, Solar PINs, Cable, etc.)
  const plans = [
    // MTN Data (Configured with both Normal API and SIM Hosting options!)
    { id: 'pln_mtn_500mb', srv: 'srv_data', biller: 'MTN', name: 'MTN 500MB SME Data', code: 'MTN-SME-500MB', amount: 140.0, validity: '30 Days', routing: 'API' },
    { id: 'pln_mtn_1gb', srv: 'srv_data', biller: 'MTN', name: 'MTN 1.0GB SME Data', code: 'MTN-SME-1GB', amount: 260.0, validity: '30 Days', routing: 'API' },
    { id: 'pln_mtn_2gb', srv: 'srv_data', biller: 'MTN', name: 'MTN 2.0GB SME Data', code: 'MTN-SME-2GB', amount: 520.0, validity: '30 Days', routing: 'SIM_HOSTING', slot: 'sim_slot_1', ussd: '*461*1*1*RECIPIENT*2#' },
    { id: 'pln_mtn_5gb', srv: 'srv_data', biller: 'MTN', name: 'MTN 5.0GB SME Data', code: 'MTN-SME-5GB', amount: 1300.0, validity: '30 Days', routing: 'API' },
    { id: 'pln_mtn_10gb', srv: 'srv_data', biller: 'MTN', name: 'MTN 10.0GB SME Data', code: 'MTN-SME-10GB', amount: 2600.0, validity: '30 Days', routing: 'SIM_HOSTING', slot: 'sim_slot_1', ussd: '*461*1*1*RECIPIENT*10#' },
    // Airtel Data
    { id: 'pln_air_1gb', srv: 'srv_data', biller: 'AIRTEL', name: 'Airtel 1.0GB Corporate Gifting', code: 'AIR-CG-1GB', amount: 280.0, validity: '30 Days', routing: 'API' },
    { id: 'pln_air_2gb', srv: 'srv_data', biller: 'AIRTEL', name: 'Airtel 2.0GB Corporate Gifting', code: 'AIR-CG-2GB', amount: 560.0, validity: '30 Days', routing: 'API' },
    // Glo Data
    { id: 'pln_glo_1gb', srv: 'srv_data', biller: 'GLO', name: 'Glo 1.0GB CG Data', code: 'GLO-CG-1GB', amount: 240.0, validity: '30 Days', routing: 'API' },
    { id: 'pln_glo_3gb', srv: 'srv_data', biller: 'GLO', name: 'Glo 3.0GB CG Data', code: 'GLO-CG-3GB', amount: 720.0, validity: '30 Days', routing: 'API' },
    // SunKing Solar PIN
    { id: 'pln_sun_1day', srv: 'srv_solar', biller: 'SUNKING', name: 'SunKing 1-Day Lighting Activation PIN', code: 'SUN-1DAY', amount: 350.0, validity: '24 Hours', routing: 'API' },
    { id: 'pln_sun_7day', srv: 'srv_solar', biller: 'SUNKING', name: 'SunKing 7-Day Solar Bundle PIN', code: 'SUN-7DAY', amount: 2200.0, validity: '7 Days', routing: 'API' },
    { id: 'pln_sun_30day', srv: 'srv_solar', biller: 'SUNKING', name: 'SunKing 30-Day Solar Home System PIN', code: 'SUN-30DAY', amount: 8900.0, validity: '30 Days', routing: 'API' },
  ];

  for (const pln of plans) {
    db.prepare(`
      INSERT OR IGNORE INTO service_plans (id, service_id, network_or_biller, plan_name, plan_code, amount, validity, routing_type, sim_slot_id, ussd_template, is_available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(pln.id, pln.srv, pln.biller, pln.name, pln.code, pln.amount, pln.validity, pln.routing, pln.slot || null, pln.ussd || null);
  }

  // 8. Seed API Providers
  const providers = [
    { id: 'prv_vtpass', name: 'VTPass Direct API', category: 'airtime', env: 'sandbox', url: 'https://sandbox.vtpass.com/api', masked: 'vtp_live_****8912', secret: 'vtp_secret_real_98127391' },
    { id: 'prv_clubk', name: 'ClubKonnect VTU Gateway', category: 'data', env: 'production', url: 'https://www.clubkonnect.com/api/v1', masked: 'ck_live_****3198', secret: 'ck_secret_real_38912783' },
    { id: 'prv_monnify', name: 'Monnify Virtual Accounts Gateway', category: 'payment', env: 'production', url: 'https://api.monnify.com/api/v1', masked: 'MNFY_****9912', secret: 'monnify_sec_8831923' },
    { id: 'prv_paystack', name: 'Paystack Payment Gateway', category: 'payment', env: 'production', url: 'https://api.paystack.co', masked: 'bds_paystack_****5510', secret: 'bds_paystack_secret_mock' },
    { id: 'prv_simhost', name: 'Telecom SIM Hosting Gateway Alpha', category: 'sim_hosting', env: 'production', url: 'https://gateway.simhost.ng/api/v2', masked: 'sim_live_****4401', secret: 'sim_token_991823' }
  ];

  for (const p of providers) {
    db.prepare(`
      INSERT OR IGNORE INTO api_providers (id, name, category, environment, base_url, api_key_masked, api_secret_encrypted, auth_method, priority, is_active, last_health_check, health_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'bearer_token', 1, 1, ?, 'HEALTHY', ?)
    `).run(p.id, p.name, p.category, p.env, p.url, p.masked, encryptField(p.secret), now, now);
  }

  // 9. Seed 33 Notification Templates
  const eventKeys = Object.keys(NOTIFICATION_EVENTS);
  for (const evKey of eventKeys) {
    const readable = evKey.replace(/_/g, ' ');
    db.prepare(`
      INSERT OR IGNORE INTO notification_templates (id, event_key, subject, html_template, sms_template, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(
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

  // System-wide Bukar Data Sub dynamic migration
  try {
    db.prepare(`
      UPDATE system_settings 
      SET app_name = 'Bukar Data Sub', support_email = 'support@bukardatasub.com'
      WHERE app_name LIKE '%ABK%' OR support_email LIKE '%abkdata%'
    `).run();
    db.prepare(`
      UPDATE notification_templates 
      SET subject = REPLACE(subject, 'ABK Data', 'Bukar Data Sub'),
          html_template = REPLACE(REPLACE(html_template, 'ABK Data Link', 'Bukar Data Sub'), 'ABK Data', 'Bukar Data Sub'),
          sms_template = REPLACE(sms_template, 'ABK Data', 'Bukar Data Sub')
      WHERE subject LIKE '%ABK Data%' OR html_template LIKE '%ABK Data%' OR sms_template LIKE '%ABK Data%'
    `).run();
    db.prepare(`
      UPDATE payment_gateways 
      SET account_name = REPLACE(REPLACE(account_name, 'ABK DATA LINK', 'BUKAR DATA SUB'), 'ABK TELECOM', 'BUKAR DATA SUB')
      WHERE account_name LIKE '%ABK%'
    `).run();
    db.prepare(`
      UPDATE mobile_app_config 
      SET app_name = 'Bukar Data Sub Mobile', play_store_url = 'https://play.google.com/store/apps/details?id=com.bukardatasub.app'
      WHERE id = 'cfg_mobile_001'
    `).run();
  } catch (err) {
    console.error('Bukar Data Sub migration error:', err);
  }

  console.log('Database seeded with dynamic branding, announcements, dual API/SIM routing, CMS sections, and mobile remote config!');
}
