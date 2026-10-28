-- ==============================================================================
-- BUKAR DATA SUB — MYSQL / MARIADB / PHPMYADMIN PRODUCTION DATABASE IMPORT
-- Character set: utf8mb4 | Collation: utf8mb4_unicode_ci | Storage Engine: InnoDB
-- Super Administrator: admin@bukardatasub.com | Password: BukarData#2026 | PIN: 1234
-- Generated: 2026-10-28T18:09:38.730Z
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure for system_settings
-- --------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` VARCHAR(64) NOT NULL,
  `app_name` VARCHAR(191) NOT NULL DEFAULT 'Bukar Data Sub',
  `app_tagline` VARCHAR(255) NOT NULL DEFAULT 'Automated Telecom & Data Platform',
  `logo_url` TEXT DEFAULT NULL,
  `primary_color` VARCHAR(32) NOT NULL DEFAULT '#1E5BF9',
  `accent_color` VARCHAR(32) DEFAULT '#10B981',
  `support_email` VARCHAR(191) NOT NULL DEFAULT 'support@bukardatasub.com',
  `support_phone` VARCHAR(64) NOT NULL DEFAULT '09131797675',
  `whatsapp_number` VARCHAR(64) NOT NULL DEFAULT '2349131797675',
  `currency` VARCHAR(16) NOT NULL DEFAULT 'NGN',
  `currency_symbol` VARCHAR(8) NOT NULL DEFAULT '₦',
  `announcement_text` TEXT DEFAULT NULL,
  `announcement_type` VARCHAR(32) NOT NULL DEFAULT 'info',
  `announcement_active` TINYINT(1) NOT NULL DEFAULT 1,
  `announcement_target` VARCHAR(32) NOT NULL DEFAULT 'all',
  `smtp_host` VARCHAR(191) DEFAULT '',
  `smtp_port` INT DEFAULT 587,
  `smtp_user` VARCHAR(191) DEFAULT '',
  `smtp_pass` VARCHAR(255) DEFAULT '',
  `smtp_secure` TINYINT(1) DEFAULT 0,
  `smtp_from_name` VARCHAR(191) DEFAULT '',
  `smtp_from_email` VARCHAR(191) DEFAULT '',
  `maintenance_mode` TINYINT(1) DEFAULT 0,
  `maintenance_message` TEXT DEFAULT NULL,
  `maintenance_scope` VARCHAR(32) DEFAULT 'all',
  `maintenance_start_time` VARCHAR(64) DEFAULT '',
  `maintenance_end_time` VARCHAR(64) DEFAULT '',
  `maintenance_bypass_ips` TEXT DEFAULT NULL,
  `referral_bonus_amount` DECIMAL(14,2) DEFAULT 100.00,
  `referral_commission_percent` DECIMAL(6,2) DEFAULT 1.50,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for users
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(64) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'customer',
  `sub_admin_role` VARCHAR(32) DEFAULT NULL,
  `tier` INT NOT NULL DEFAULT 1,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `transaction_pin_hash` VARCHAR(255) DEFAULT NULL,
  `mfa_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `mfa_secret` VARCHAR(255) DEFAULT NULL,
  `biometric_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `biometric_public_key` TEXT DEFAULT NULL,
  `whatsapp_number` VARCHAR(64) DEFAULT NULL,
  `referral_code` VARCHAR(64) DEFAULT NULL,
  `referred_by` VARCHAR(64) DEFAULT NULL,
  `total_funded` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `vtu_purchases` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `failed_pin_attempts` INT DEFAULT 0,
  `pin_locked_until` VARCHAR(64) DEFAULT NULL,
  `two_factor_enabled` TINYINT(1) DEFAULT 0,
  `active_session_id` VARCHAR(128) DEFAULT NULL,
  `last_active_at` VARCHAR(64) DEFAULT NULL,
  `last_login_ip` VARCHAR(64) DEFAULT NULL,
  `virtual_account_bank` VARCHAR(128) DEFAULT NULL,
  `virtual_account_number` VARCHAR(64) DEFAULT NULL,
  `virtual_account_name` VARCHAR(191) DEFAULT NULL,
  `virtual_account_reference` VARCHAR(128) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `state` VARCHAR(64) DEFAULT NULL,
  `date_of_birth` VARCHAR(32) DEFAULT NULL,
  `avatar_url` TEXT DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `sound_enabled` TINYINT(1) DEFAULT 1,
  `account_locked` TINYINT(1) DEFAULT 0,
  `lock_reason` TEXT DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  UNIQUE KEY `idx_users_phone` (`phone`),
  UNIQUE KEY `idx_users_referral` (`referral_code`),
  KEY `idx_users_referred_by` (`referred_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for wallets
-- --------------------------------------------------------
DROP TABLE IF EXISTS `wallets`;
CREATE TABLE `wallets` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `balance` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `commission_balance` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(16) NOT NULL DEFAULT 'NGN',
  `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_wallet_user` (`user_id`),
  CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for ledger_entries
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ledger_entries`;
CREATE TABLE `ledger_entries` (
  `id` VARCHAR(64) NOT NULL,
  `wallet_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `entry_type` VARCHAR(16) NOT NULL,
  `amount` DECIMAL(16,2) NOT NULL,
  `balance_before` DECIMAL(16,2) NOT NULL,
  `balance_after` DECIMAL(16,2) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `reference` VARCHAR(128) NOT NULL,
  `description` TEXT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_ledger_ref` (`reference`),
  KEY `idx_ledger_user` (`user_id`, `created_at`),
  KEY `idx_ledger_wallet` (`wallet_id`),
  CONSTRAINT `fk_ledger_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_ledger_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for payment_gateways
-- --------------------------------------------------------
DROP TABLE IF EXISTS `payment_gateways`;
CREATE TABLE `payment_gateways` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `environment` VARCHAR(32) NOT NULL DEFAULT 'production',
  `public_key` TEXT DEFAULT NULL,
  `secret_key_encrypted` TEXT DEFAULT NULL,
  `api_key_encrypted` TEXT DEFAULT NULL,
  `contract_code` VARCHAR(64) DEFAULT '',
  `webhook_secret_encrypted` TEXT DEFAULT NULL,
  `merchant_id` VARCHAR(128) DEFAULT '',
  `bank_name` VARCHAR(128) DEFAULT '',
  `account_number` VARCHAR(64) DEFAULT '',
  `account_name` VARCHAR(191) DEFAULT '',
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for api_providers
-- --------------------------------------------------------
DROP TABLE IF EXISTS `api_providers`;
CREATE TABLE `api_providers` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `environment` VARCHAR(32) NOT NULL DEFAULT 'sandbox',
  `base_url` VARCHAR(255) NOT NULL,
  `api_key_masked` VARCHAR(64) NOT NULL,
  `api_secret_encrypted` TEXT NOT NULL,
  `auth_method` VARCHAR(64) NOT NULL DEFAULT 'bearer_token',
  `priority` INT NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `timeout_seconds` INT NOT NULL DEFAULT 15,
  `last_health_check` VARCHAR(64) DEFAULT NULL,
  `health_status` VARCHAR(32) NOT NULL DEFAULT 'HEALTHY',
  `api_key_encrypted` TEXT DEFAULT NULL,
  `data_endpoint` VARCHAR(128) DEFAULT '/data',
  `airtime_endpoint` VARCHAR(128) DEFAULT '/airtime',
  `cable_endpoint` VARCHAR(128) DEFAULT '/cable',
  `electricity_endpoint` VARCHAR(128) DEFAULT '/electricity',
  `balance_endpoint` VARCHAR(128) DEFAULT '/balance',
  `http_method` VARCHAR(16) DEFAULT 'POST',
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for sim_hosts
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sim_hosts`;
CREATE TABLE `sim_hosts` (
  `id` VARCHAR(64) NOT NULL,
  `provider_name` VARCHAR(191) NOT NULL,
  `server_url` VARCHAR(255) NOT NULL,
  `sim_slot` INT NOT NULL,
  `phone_number` VARCHAR(64) NOT NULL,
  `network` VARCHAR(32) NOT NULL,
  `airtime_balance` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
  `last_heartbeat` VARCHAR(64) DEFAULT NULL,
  `daily_sms_sent` INT NOT NULL DEFAULT 0,
  `daily_sms_limit` INT NOT NULL DEFAULT 1000,
  `ussd_code_template` VARCHAR(128) DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for services
-- --------------------------------------------------------
DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (
  `id` VARCHAR(64) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `provider_id` VARCHAR(64) DEFAULT NULL,
  `routing_type` VARCHAR(32) NOT NULL DEFAULT 'API',
  `sim_slot_id` VARCHAR(64) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `min_amount` DECIMAL(14,2) NOT NULL DEFAULT 50.00,
  `max_amount` DECIMAL(14,2) NOT NULL DEFAULT 500000.00,
  `reseller_discount_percent` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `cashback_percent` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `icon` VARCHAR(64) DEFAULT NULL,
  `badge` VARCHAR(64) DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_service_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for service_plans
-- --------------------------------------------------------
DROP TABLE IF EXISTS `service_plans`;
CREATE TABLE `service_plans` (
  `id` VARCHAR(64) NOT NULL,
  `service_id` VARCHAR(64) NOT NULL,
  `network_or_biller` VARCHAR(64) NOT NULL,
  `plan_name` VARCHAR(191) NOT NULL,
  `plan_code` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `validity` VARCHAR(64) DEFAULT NULL,
  `routing_type` VARCHAR(32) NOT NULL DEFAULT 'API',
  `sim_slot_id` VARCHAR(64) DEFAULT NULL,
  `ussd_template` VARCHAR(128) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `data_type` VARCHAR(32) DEFAULT 'SME',
  `plan_size` VARCHAR(32) DEFAULT '1GB',
  `buying_price` DECIMAL(14,2) DEFAULT 0.00,
  `reseller_price` DECIMAL(14,2) DEFAULT 0.00,
  `api_price` DECIMAL(14,2) DEFAULT 0.00,
  `provider_id` VARCHAR(64) DEFAULT NULL,
  `provider_plan_id` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_plan_service` (`service_id`),
  CONSTRAINT `fk_plan_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for vtu_transactions
-- --------------------------------------------------------
DROP TABLE IF EXISTS `vtu_transactions`;
CREATE TABLE `vtu_transactions` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `service_category` VARCHAR(64) NOT NULL,
  `reference` VARCHAR(128) NOT NULL,
  `biller_or_network` VARCHAR(64) NOT NULL,
  `recipient` VARCHAR(128) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `discount_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `charged_amount` DECIMAL(14,2) NOT NULL,
  `routing_used` VARCHAR(32) NOT NULL DEFAULT 'API',
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `token_or_pin` VARCHAR(255) DEFAULT NULL,
  `provider_reference` VARCHAR(128) DEFAULT NULL,
  `provider_response` TEXT DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL,
  `channel` VARCHAR(32) DEFAULT 'WEB',
  `cost_amount` DECIMAL(14,2) DEFAULT 0.00,
  `profit_margin` DECIMAL(14,2) DEFAULT 0.00,
  `idempotency_key` VARCHAR(128) DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_vtu_ref` (`reference`),
  KEY `idx_trans_user` (`user_id`, `created_at`),
  KEY `idx_trans_idempotency` (`idempotency_key`),
  KEY `idx_trans_channel` (`channel`),
  CONSTRAINT `fk_vtu_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for payment_requests
-- --------------------------------------------------------
DROP TABLE IF EXISTS `payment_requests`;
CREATE TABLE `payment_requests` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `reference` VARCHAR(128) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `currency` VARCHAR(16) NOT NULL DEFAULT 'NGN',
  `gateway` VARCHAR(64) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `gateway_reference` VARCHAR(128) DEFAULT NULL,
  `virtual_account_number` VARCHAR(64) DEFAULT NULL,
  `virtual_bank_name` VARCHAR(128) DEFAULT NULL,
  `virtual_account_name` VARCHAR(191) DEFAULT NULL,
  `paid_at` VARCHAR(64) DEFAULT NULL,
  `expires_at` VARCHAR(64) DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_pay_req_ref` (`reference`),
  KEY `idx_pay_req_user` (`user_id`),
  CONSTRAINT `fk_pay_req_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for withdrawal_requests
-- --------------------------------------------------------
DROP TABLE IF EXISTS `withdrawal_requests`;
CREATE TABLE `withdrawal_requests` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `fee` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `net_amount` DECIMAL(14,2) NOT NULL,
  `bank_name` VARCHAR(128) NOT NULL,
  `account_number` VARCHAR(64) NOT NULL,
  `account_name` VARCHAR(191) NOT NULL,
  `narration` TEXT DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `admin_notes` TEXT DEFAULT NULL,
  `payment_reference` VARCHAR(128) DEFAULT NULL,
  `processed_by` VARCHAR(64) DEFAULT NULL,
  `processed_at` VARCHAR(64) DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_withdrawals_user` (`user_id`, `status`),
  KEY `idx_withdrawals_status` (`status`),
  CONSTRAINT `fk_withdrawal_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for testimonials
-- --------------------------------------------------------
DROP TABLE IF EXISTS `testimonials`;
CREATE TABLE `testimonials` (
  `id` VARCHAR(64) NOT NULL,
  `author_name` VARCHAR(191) NOT NULL,
  `author_role` VARCHAR(128) DEFAULT 'Customer',
  `rating` INT NOT NULL DEFAULT 5,
  `content` TEXT NOT NULL,
  `avatar_url` TEXT DEFAULT NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_testimonials_pub` (`is_published`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for cms_sections
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cms_sections`;
CREATE TABLE `cms_sections` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `content_json` LONGTEXT NOT NULL,
  `draft_json` LONGTEXT DEFAULT NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `version` INT NOT NULL DEFAULT 1,
  `updated_by` VARCHAR(64) DEFAULT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for cms_revisions
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cms_revisions`;
CREATE TABLE `cms_revisions` (
  `id` VARCHAR(64) NOT NULL,
  `section_id` VARCHAR(64) NOT NULL,
  `version` INT NOT NULL,
  `content_json` LONGTEXT NOT NULL,
  `created_by` VARCHAR(64) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cms_rev_sec` (`section_id`, `version`),
  CONSTRAINT `fk_cms_rev_sec` FOREIGN KEY (`section_id`) REFERENCES `cms_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for mobile_app_config
-- --------------------------------------------------------
DROP TABLE IF EXISTS `mobile_app_config`;
CREATE TABLE `mobile_app_config` (
  `id` VARCHAR(64) NOT NULL,
  `app_name` VARCHAR(191) NOT NULL DEFAULT 'Bukar Data Sub Mobile',
  `branding_json` LONGTEXT NOT NULL,
  `banner_json` LONGTEXT NOT NULL,
  `android_min_version` VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  `android_latest_version` VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  `ios_min_version` VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  `ios_latest_version` VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  `force_update` TINYINT(1) NOT NULL DEFAULT 0,
  `update_title` VARCHAR(191) DEFAULT 'Update Available',
  `update_notes` TEXT DEFAULT NULL,
  `play_store_url` TEXT DEFAULT NULL,
  `app_store_url` TEXT DEFAULT NULL,
  `services_enabled_json` LONGTEXT DEFAULT NULL,
  `maintenance_mode` TINYINT(1) NOT NULL DEFAULT 0,
  `maintenance_message` TEXT DEFAULT NULL,
  `updated_by` VARCHAR(64) DEFAULT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for notification_templates
-- --------------------------------------------------------
DROP TABLE IF EXISTS `notification_templates`;
CREATE TABLE `notification_templates` (
  `id` VARCHAR(64) NOT NULL,
  `event_key` VARCHAR(128) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `html_template` LONGTEXT NOT NULL,
  `sms_template` TEXT NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_notif_event_key` (`event_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for notifications
-- --------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `event_type` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `channels` VARCHAR(64) NOT NULL DEFAULT 'EMAIL,IN_APP',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `email_status` VARCHAR(32) NOT NULL DEFAULT 'SENT',
  `push_status` VARCHAR(32) NOT NULL DEFAULT 'SKIPPED',
  `metadata_json` LONGTEXT DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for dashboard_announcements
-- --------------------------------------------------------
DROP TABLE IF EXISTS `dashboard_announcements`;
CREATE TABLE `dashboard_announcements` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(32) NOT NULL DEFAULT 'info',
  `badge_text` VARCHAR(64) DEFAULT 'NOTICE',
  `duration_days` INT NOT NULL DEFAULT 7,
  `expires_at` VARCHAR(64) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `target_audience` VARCHAR(32) NOT NULL DEFAULT 'all',
  `created_by` VARCHAR(64) NOT NULL DEFAULT 'Admin',
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_announcements_active` (`is_active`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for support_tickets
-- --------------------------------------------------------
DROP TABLE IF EXISTS `support_tickets`;
CREATE TABLE `support_tickets` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `ticket_number` VARCHAR(64) NOT NULL,
  `subject` VARCHAR(191) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `priority` VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
  `status` VARCHAR(32) NOT NULL DEFAULT 'OPEN',
  `assigned_to` VARCHAR(64) DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_ticket_number` (`ticket_number`),
  KEY `idx_ticket_user` (`user_id`),
  CONSTRAINT `fk_ticket_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for ticket_replies
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ticket_replies`;
CREATE TABLE `ticket_replies` (
  `id` VARCHAR(64) NOT NULL,
  `ticket_id` VARCHAR(64) NOT NULL,
  `sender_id` VARCHAR(64) NOT NULL,
  `sender_type` VARCHAR(32) NOT NULL,
  `message` TEXT NOT NULL,
  `attachment_url` TEXT DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reply_ticket` (`ticket_id`),
  CONSTRAINT `fk_reply_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for idempotency_keys
-- --------------------------------------------------------
DROP TABLE IF EXISTS `idempotency_keys`;
CREATE TABLE `idempotency_keys` (
  `key` VARCHAR(128) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `request_path` VARCHAR(191) NOT NULL,
  `response_json` LONGTEXT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for otp_verifications
-- --------------------------------------------------------
DROP TABLE IF EXISTS `otp_verifications`;
CREATE TABLE `otp_verifications` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `identifier` VARCHAR(128) NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `purpose` VARCHAR(64) NOT NULL,
  `expires_at` VARCHAR(64) NOT NULL,
  `is_used` TINYINT(1) DEFAULT 0,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_otp_verify` (`identifier`, `code`, `is_used`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for staff_tasks
-- --------------------------------------------------------
DROP TABLE IF EXISTS `staff_tasks`;
CREATE TABLE `staff_tasks` (
  `id` VARCHAR(64) NOT NULL,
  `task_id_display` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `priority` VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
  `assigned_to_user_id` VARCHAR(64) DEFAULT NULL,
  `assigned_to_name` VARCHAR(191) DEFAULT NULL,
  `created_by_user_id` VARCHAR(64) NOT NULL,
  `created_by_name` VARCHAR(191) NOT NULL,
  `due_date` VARCHAR(64) DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'OPEN',
  `related_user_id` VARCHAR(64) DEFAULT NULL,
  `related_reference` VARCHAR(128) DEFAULT NULL,
  `resolution_notes` TEXT DEFAULT NULL,
  `completed_at` VARCHAR(64) DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_staff_task_display` (`task_id_display`),
  KEY `idx_staff_tasks_status` (`status`, `priority`),
  KEY `idx_staff_tasks_assignee` (`assigned_to_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for staff_task_comments
-- --------------------------------------------------------
DROP TABLE IF EXISTS `staff_task_comments`;
CREATE TABLE `staff_task_comments` (
  `id` VARCHAR(64) NOT NULL,
  `task_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `user_name` VARCHAR(191) NOT NULL,
  `user_role` VARCHAR(64) NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_task_comments_task` (`task_id`, `created_at`),
  CONSTRAINT `fk_task_comments` FOREIGN KEY (`task_id`) REFERENCES `staff_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- MYSQL DATA INSERTS
-- ==============================================================================

-- Dumping data for table `system_settings`
INSERT INTO `system_settings` (`id`, `app_name`, `app_tagline`, `logo_url`, `primary_color`, `accent_color`, `support_email`, `support_phone`, `whatsapp_number`, `currency`, `currency_symbol`, `announcement_text`, `announcement_type`, `announcement_active`, `announcement_target`, `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_secure`, `smtp_from_name`, `smtp_from_email`, `maintenance_mode`, `maintenance_message`, `maintenance_scope`, `maintenance_start_time`, `maintenance_end_time`, `maintenance_bypass_ips`, `referral_bonus_amount`, `referral_commission_percent`, `updated_at`) VALUES ('sys_settings_001', 'Bukar Data Sub', 'Automated Telecom & Data Platform', '', '#1E5BF9', '#10B981', 'support@bukardatasub.com', '09131797675', '2349131797675', 'NGN', '₦', '⚡ High-speed SME Data and SunKing Solar PIN delivery channels are 100% operational.', 'info', 1, 'all', '', 587, '', '', 0, '', '', 0, 'System undergoing scheduled optimization. We will be back online shortly.', 'all', '', '', '', 100, 1.5, '2026-10-26T12:00:00.000Z');

-- Dumping data for table `users`
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `sub_admin_role`, `tier`, `status`, `transaction_pin_hash`, `mfa_enabled`, `mfa_secret`, `biometric_enabled`, `biometric_public_key`, `whatsapp_number`, `referral_code`, `referred_by`, `total_funded`, `vtu_purchases`, `failed_pin_attempts`, `pin_locked_until`, `two_factor_enabled`, `active_session_id`, `last_active_at`, `last_login_ip`, `virtual_account_bank`, `virtual_account_number`, `virtual_account_name`, `virtual_account_reference`, `address`, `state`, `date_of_birth`, `avatar_url`, `bio`, `sound_enabled`, `account_locked`, `lock_reason`, `created_at`, `updated_at`) VALUES ('usr_root_admin', 'Super Administrator', 'admin@bukardatasub.com', '08000000001', '$2b$12$OOpvlttGPgm/0sGPfJylcePx.Ip0Zl7YAZgUfEQdcjiRYMDe7GKve', 'super_admin', NULL, 3, 'active', '$2b$12$OOpvlttGPgm/0sGPfJylceG6A0zZQZA3EkIzDXSVEJqeo62K16jTm', 0, NULL, 0, NULL, NULL, 'BDS-ADMIN', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, NULL, '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');

-- Dumping data for table `wallets`
INSERT INTO `wallets` (`id`, `user_id`, `balance`, `commission_balance`, `currency`, `is_locked`, `created_at`, `updated_at`) VALUES ('wal_root_admin', 'usr_root_admin', 0, 0, 'NGN', 0, '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');

-- Dumping data for table `payment_gateways`
INSERT INTO `payment_gateways` (`id`, `name`, `is_active`, `is_default`, `environment`, `public_key`, `secret_key_encrypted`, `api_key_encrypted`, `contract_code`, `webhook_secret_encrypted`, `merchant_id`, `bank_name`, `account_number`, `account_name`, `updated_at`) VALUES ('monnify', 'Monnify Automated Reserved Accounts', 1, 1, 'production', '', '', '', '', '', '', 'Wema Bank', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', '2026-10-26T12:00:00.000Z');
INSERT INTO `payment_gateways` (`id`, `name`, `is_active`, `is_default`, `environment`, `public_key`, `secret_key_encrypted`, `api_key_encrypted`, `contract_code`, `webhook_secret_encrypted`, `merchant_id`, `bank_name`, `account_number`, `account_name`, `updated_at`) VALUES ('paystack', 'Paystack Dedicated NUBAN & Card Checkout', 1, 0, 'production', '', '', '', '', '', '', 'Titan / Wema Bank', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', '2026-10-26T12:00:00.000Z');
INSERT INTO `payment_gateways` (`id`, `name`, `is_active`, `is_default`, `environment`, `public_key`, `secret_key_encrypted`, `api_key_encrypted`, `contract_code`, `webhook_secret_encrypted`, `merchant_id`, `bank_name`, `account_number`, `account_name`, `updated_at`) VALUES ('palmpay', 'PalmPay Dedicated Virtual Accounts & Agency NUBAN', 1, 0, 'production', '', '', '', '', '', '', 'PalmPay MFB', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', '2026-10-26T12:00:00.000Z');
INSERT INTO `payment_gateways` (`id`, `name`, `is_active`, `is_default`, `environment`, `public_key`, `secret_key_encrypted`, `api_key_encrypted`, `contract_code`, `webhook_secret_encrypted`, `merchant_id`, `bank_name`, `account_number`, `account_name`, `updated_at`) VALUES ('flutterwave', 'Flutterwave Virtual Accounts & Cards', 0, 0, 'production', '', '', '', '', '', '', 'Wema / Barter', '', 'BUKAR DATA SUB / MOHAMMED ADAMU', '2026-10-26T12:00:00.000Z');
INSERT INTO `payment_gateways` (`id`, `name`, `is_active`, `is_default`, `environment`, `public_key`, `secret_key_encrypted`, `api_key_encrypted`, `contract_code`, `webhook_secret_encrypted`, `merchant_id`, `bank_name`, `account_number`, `account_name`, `updated_at`) VALUES ('manual_bank', 'Direct Corporate Bank Deposit (Manual)', 1, 0, 'production', '', '', '', '', '', '', 'Moniepoint MFB', '9131797675', 'BUKAR DATA SUB LTD', '2026-10-26T12:00:00.000Z');

-- Dumping data for table `api_providers`
INSERT INTO `api_providers` (`id`, `name`, `category`, `environment`, `base_url`, `api_key_masked`, `api_secret_encrypted`, `auth_method`, `priority`, `is_active`, `timeout_seconds`, `last_health_check`, `health_status`, `api_key_encrypted`, `data_endpoint`, `airtime_endpoint`, `cable_endpoint`, `electricity_endpoint`, `balance_endpoint`, `http_method`, `created_at`) VALUES ('prv_vtpass', 'VTPass Direct API', 'airtime', 'sandbox', 'https://sandbox.vtpass.com/api', 'vtp_live_****8912', 'xcf3kSTKfrGz1A7I:RHmZLTSJ9fBS5nvISEOJLw==:SxYecH3HY94lQ1VBw4u0/nutAmqKbJi7', 'bearer_token', 1, 1, 15, '2026-10-26T12:00:00.000Z', 'HEALTHY', '', '/data', '/airtime', '/cable', '/electricity', '/balance', 'POST', '2026-10-26T12:00:00.000Z');
INSERT INTO `api_providers` (`id`, `name`, `category`, `environment`, `base_url`, `api_key_masked`, `api_secret_encrypted`, `auth_method`, `priority`, `is_active`, `timeout_seconds`, `last_health_check`, `health_status`, `api_key_encrypted`, `data_endpoint`, `airtime_endpoint`, `cable_endpoint`, `electricity_endpoint`, `balance_endpoint`, `http_method`, `created_at`) VALUES ('prv_clubk', 'ClubKonnect VTU Gateway', 'data', 'production', 'https://www.clubkonnect.com/api/v1', 'ck_live_****3198', '1f8YkOoHR3C7A2Bi:0fe1Gtoa3Jk2KJInixjj9A==:eZAB5QdQg05zGD1BncrR6bcMcY5ULTo=', 'bearer_token', 1, 1, 15, '2026-10-26T12:00:00.000Z', 'HEALTHY', '', '/data', '/airtime', '/cable', '/electricity', '/balance', 'POST', '2026-10-26T12:00:00.000Z');
INSERT INTO `api_providers` (`id`, `name`, `category`, `environment`, `base_url`, `api_key_masked`, `api_secret_encrypted`, `auth_method`, `priority`, `is_active`, `timeout_seconds`, `last_health_check`, `health_status`, `api_key_encrypted`, `data_endpoint`, `airtime_endpoint`, `cable_endpoint`, `electricity_endpoint`, `balance_endpoint`, `http_method`, `created_at`) VALUES ('prv_monnify', 'Monnify Virtual Accounts Gateway', 'payment', 'production', 'https://api.monnify.com/api/v1', 'MNFY_****9912', 'v7FTvzWCA5wqvglQ:yzcnAo0F/iMYJLJk5pxdBQ==:jI9FwO//56w0X00KKFxqB2oksw==', 'bearer_token', 1, 1, 15, '2026-10-26T12:00:00.000Z', 'HEALTHY', '', '/data', '/airtime', '/cable', '/electricity', '/balance', 'POST', '2026-10-26T12:00:00.000Z');
INSERT INTO `api_providers` (`id`, `name`, `category`, `environment`, `base_url`, `api_key_masked`, `api_secret_encrypted`, `auth_method`, `priority`, `is_active`, `timeout_seconds`, `last_health_check`, `health_status`, `api_key_encrypted`, `data_endpoint`, `airtime_endpoint`, `cable_endpoint`, `electricity_endpoint`, `balance_endpoint`, `http_method`, `created_at`) VALUES ('prv_paystack', 'Paystack Payment Gateway', 'payment', 'production', 'https://api.paystack.co', 'bds_paystack_****5510', 'v6FXB21DKQNALl+z:SEhwBYKSfTMS4cm9JK/vnA==:UMV+VDMHIi4vi8BHfkDQ5vKa6cB65ZQd', 'bearer_token', 1, 1, 15, '2026-10-26T12:00:00.000Z', 'HEALTHY', '', '/data', '/airtime', '/cable', '/electricity', '/balance', 'POST', '2026-10-26T12:00:00.000Z');
INSERT INTO `api_providers` (`id`, `name`, `category`, `environment`, `base_url`, `api_key_masked`, `api_secret_encrypted`, `auth_method`, `priority`, `is_active`, `timeout_seconds`, `last_health_check`, `health_status`, `api_key_encrypted`, `data_endpoint`, `airtime_endpoint`, `cable_endpoint`, `electricity_endpoint`, `balance_endpoint`, `http_method`, `created_at`) VALUES ('prv_simhost', 'Telecom SIM Hosting Gateway Alpha', 'sim_hosting', 'production', 'https://gateway.simhost.ng/api/v2', 'sim_live_****4401', 'vCHqI8CpMSf0zRQU:7YuygUaZ8T0rO4VLcLA6FA==:NydrSqG4XavsyzqqYn7yBw==', 'bearer_token', 1, 1, 15, '2026-10-26T12:00:00.000Z', 'HEALTHY', '', '/data', '/airtime', '/cable', '/electricity', '/balance', 'POST', '2026-10-26T12:00:00.000Z');

-- Dumping data for table `sim_hosts`
INSERT INTO `sim_hosts` (`id`, `provider_name`, `server_url`, `sim_slot`, `phone_number`, `network`, `airtime_balance`, `status`, `last_heartbeat`, `daily_sms_sent`, `daily_sms_limit`, `ussd_code_template`, `created_at`) VALUES ('sim_slot_1', 'Telecom Server Alpha', 'https://simserver1.telecom.net', 1, '', 'MTN', 0, 'OFFLINE', '2026-10-26T12:00:00.000Z', 0, 1000, '*556#', '2026-10-26T12:00:00.000Z');
INSERT INTO `sim_hosts` (`id`, `provider_name`, `server_url`, `sim_slot`, `phone_number`, `network`, `airtime_balance`, `status`, `last_heartbeat`, `daily_sms_sent`, `daily_sms_limit`, `ussd_code_template`, `created_at`) VALUES ('sim_slot_2', 'Telecom Server Alpha', 'https://simserver1.telecom.net', 2, '', 'AIRTEL', 0, 'OFFLINE', '2026-10-26T12:00:00.000Z', 0, 1000, '*123#', '2026-10-26T12:00:00.000Z');
INSERT INTO `sim_hosts` (`id`, `provider_name`, `server_url`, `sim_slot`, `phone_number`, `network`, `airtime_balance`, `status`, `last_heartbeat`, `daily_sms_sent`, `daily_sms_limit`, `ussd_code_template`, `created_at`) VALUES ('sim_slot_3', 'Telecom Server Beta', 'https://simserver2.telecom.net', 1, '', 'GLO', 0, 'OFFLINE', '2026-10-26T12:00:00.000Z', 0, 1000, '*124#', '2026-10-26T12:00:00.000Z');

-- Dumping data for table `services`
INSERT INTO `services` (`id`, `category`, `name`, `code`, `provider_id`, `routing_type`, `sim_slot_id`, `is_active`, `min_amount`, `max_amount`, `reseller_discount_percent`, `cashback_percent`, `icon`, `badge`, `created_at`) VALUES ('srv_data', 'data', 'Data Bundles', 'DATA', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Wifi', 'Up to 3%', '2026-10-26T12:00:00.000Z');
INSERT INTO `services` (`id`, `category`, `name`, `code`, `provider_id`, `routing_type`, `sim_slot_id`, `is_active`, `min_amount`, `max_amount`, `reseller_discount_percent`, `cashback_percent`, `icon`, `badge`, `created_at`) VALUES ('srv_airtime', 'airtime', 'Airtime VTU', 'AIRTIME', NULL, 'SIM_HOSTING', 'sim_slot_1', 1, 50, 500000, 0, 0, 'Phone', 'Instant', '2026-10-26T12:00:00.000Z');
INSERT INTO `services` (`id`, `category`, `name`, `code`, `provider_id`, `routing_type`, `sim_slot_id`, `is_active`, `min_amount`, `max_amount`, `reseller_discount_percent`, `cashback_percent`, `icon`, `badge`, `created_at`) VALUES ('srv_solar', 'solar_pin', 'SunKing Solar PIN', 'SOLAR_PIN', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Sun', 'Instant 16-Digit', '2026-10-26T12:00:00.000Z');
INSERT INTO `services` (`id`, `category`, `name`, `code`, `provider_id`, `routing_type`, `sim_slot_id`, `is_active`, `min_amount`, `max_amount`, `reseller_discount_percent`, `cashback_percent`, `icon`, `badge`, `created_at`) VALUES ('srv_cable', 'cable', 'Cable TV Subscription', 'CABLE', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Tv', 'Active', '2026-10-26T12:00:00.000Z');
INSERT INTO `services` (`id`, `category`, `name`, `code`, `provider_id`, `routing_type`, `sim_slot_id`, `is_active`, `min_amount`, `max_amount`, `reseller_discount_percent`, `cashback_percent`, `icon`, `badge`, `created_at`) VALUES ('srv_airtime_cash', 'airtime_cash', 'Airtime to Cash', 'AIRTIME_CASH', NULL, 'SIM_HOSTING', 'sim_slot_1', 1, 50, 500000, 0, 0, 'Repeat', 'Instant 85%', '2026-10-26T12:00:00.000Z');
INSERT INTO `services` (`id`, `category`, `name`, `code`, `provider_id`, `routing_type`, `sim_slot_id`, `is_active`, `min_amount`, `max_amount`, `reseller_discount_percent`, `cashback_percent`, `icon`, `badge`, `created_at`) VALUES ('srv_electricity', 'electricity', 'Electricity Bills', 'ELECTRICITY', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Zap', '20-Digit Token', '2026-10-26T12:00:00.000Z');
INSERT INTO `services` (`id`, `category`, `name`, `code`, `provider_id`, `routing_type`, `sim_slot_id`, `is_active`, `min_amount`, `max_amount`, `reseller_discount_percent`, `cashback_percent`, `icon`, `badge`, `created_at`) VALUES ('srv_recharge', 'recharge_print', 'Recharge Card Printing', 'RECHARGE_PRINT', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Printer', '2% Discount', '2026-10-26T12:00:00.000Z');
INSERT INTO `services` (`id`, `category`, `name`, `code`, `provider_id`, `routing_type`, `sim_slot_id`, `is_active`, `min_amount`, `max_amount`, `reseller_discount_percent`, `cashback_percent`, `icon`, `badge`, `created_at`) VALUES ('srv_bulk_sms', 'bulk_sms', 'Bulk SMS Portal', 'BULK_SMS', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Mail', 'Corporate DND', '2026-10-26T12:00:00.000Z');
INSERT INTO `services` (`id`, `category`, `name`, `code`, `provider_id`, `routing_type`, `sim_slot_id`, `is_active`, `min_amount`, `max_amount`, `reseller_discount_percent`, `cashback_percent`, `icon`, `badge`, `created_at`) VALUES ('srv_safebox', 'safebox', 'SafeBox Savings', 'SAFEBOX', NULL, 'API', NULL, 1, 50, 500000, 0, 0, 'Shield', '15-18% p.a.', '2026-10-26T12:00:00.000Z');

-- Dumping data for table `service_plans`
INSERT INTO `service_plans` (`id`, `service_id`, `network_or_biller`, `plan_name`, `plan_code`, `amount`, `validity`, `routing_type`, `sim_slot_id`, `ussd_template`, `description`, `is_available`, `data_type`, `plan_size`, `buying_price`, `reseller_price`, `api_price`, `provider_id`, `provider_plan_id`) VALUES ('pln_mtn_500mb', 'srv_data', 'MTN', 'MTN 500MB SME Data', 'MTN-SME-500MB', 140, '30 Days', 'API', NULL, NULL, NULL, 1, 'SME', '500MB', 125, 135, 130, NULL, NULL);
INSERT INTO `service_plans` (`id`, `service_id`, `network_or_biller`, `plan_name`, `plan_code`, `amount`, `validity`, `routing_type`, `sim_slot_id`, `ussd_template`, `description`, `is_available`, `data_type`, `plan_size`, `buying_price`, `reseller_price`, `api_price`, `provider_id`, `provider_plan_id`) VALUES ('pln_mtn_1gb', 'srv_data', 'MTN', 'MTN 1.0GB SME Data', 'MTN-SME-1GB', 260, '30 Days', 'API', NULL, NULL, NULL, 1, 'SME', '1GB', 245, 255, 250, NULL, NULL);
INSERT INTO `service_plans` (`id`, `service_id`, `network_or_biller`, `plan_name`, `plan_code`, `amount`, `validity`, `routing_type`, `sim_slot_id`, `ussd_template`, `description`, `is_available`, `data_type`, `plan_size`, `buying_price`, `reseller_price`, `api_price`, `provider_id`, `provider_plan_id`) VALUES ('pln_mtn_2gb', 'srv_data', 'MTN', 'MTN 2.0GB SME Data', 'MTN-SME-2GB', 520, '30 Days', 'SIM_HOSTING', 'sim_slot_1', '*461*1*1*RECIPIENT*2#', NULL, 1, 'SME', '2GB', 490, 510, 500, NULL, NULL);
INSERT INTO `service_plans` (`id`, `service_id`, `network_or_biller`, `plan_name`, `plan_code`, `amount`, `validity`, `routing_type`, `sim_slot_id`, `ussd_template`, `description`, `is_available`, `data_type`, `plan_size`, `buying_price`, `reseller_price`, `api_price`, `provider_id`, `provider_plan_id`) VALUES ('pln_mtn_5gb', 'srv_data', 'MTN', 'MTN 5.0GB SME Data', 'MTN-SME-5GB', 1300, '30 Days', 'API', NULL, NULL, NULL, 1, 'SME', '5GB', 1225, 1275, 1250, NULL, NULL);
INSERT INTO `service_plans` (`id`, `service_id`, `network_or_biller`, `plan_name`, `plan_code`, `amount`, `validity`, `routing_type`, `sim_slot_id`, `ussd_template`, `description`, `is_available`, `data_type`, `plan_size`, `buying_price`, `reseller_price`, `api_price`, `provider_id`, `provider_plan_id`) VALUES ('pln_mtn_10gb', 'srv_data', 'MTN', 'MTN 10.0GB SME Data', 'MTN-SME-10GB', 2600, '30 Days', 'SIM_HOSTING', 'sim_slot_1', '*461*1*1*RECIPIENT*10#', NULL, 1, 'SME', '10GB', 2450, 2550, 2500, NULL, NULL);
INSERT INTO `service_plans` (`id`, `service_id`, `network_or_biller`, `plan_name`, `plan_code`, `amount`, `validity`, `routing_type`, `sim_slot_id`, `ussd_template`, `description`, `is_available`, `data_type`, `plan_size`, `buying_price`, `reseller_price`, `api_price`, `provider_id`, `provider_plan_id`) VALUES ('pln_air_1gb', 'srv_data', 'AIRTEL', 'Airtel 1.0GB Corporate Gifting', 'AIR-CG-1GB', 280, '30 Days', 'API', NULL, NULL, NULL, 1, 'CG', '1GB', 265, 275, 270, NULL, NULL);
INSERT INTO `service_plans` (`id`, `service_id`, `network_or_biller`, `plan_name`, `plan_code`, `amount`, `validity`, `routing_type`, `sim_slot_id`, `ussd_template`, `description`, `is_available`, `data_type`, `plan_size`, `buying_price`, `reseller_price`, `api_price`, `provider_id`, `provider_plan_id`) VALUES ('pln_air_2gb', 'srv_data', 'AIRTEL', 'Airtel 2.0GB Corporate Gifting', 'AIR-CG-2GB', 560, '30 Days', 'API', NULL, NULL, NULL, 1, 'CG', '2GB', 530, 550, 540, NULL, NULL);
INSERT INTO `service_plans` (`id`, `service_id`, `network_or_biller`, `plan_name`, `plan_code`, `amount`, `validity`, `routing_type`, `sim_slot_id`, `ussd_template`, `description`, `is_available`, `data_type`, `plan_size`, `buying_price`, `reseller_price`, `api_price`, `provider_id`, `provider_plan_id`) VALUES ('pln_glo_1gb', 'srv_data', 'GLO', 'Glo 1.0GB CG Data', 'GLO-CG-1GB', 240, '30 Days', 'API', NULL, NULL, NULL, 1, 'CG', '1GB', 225, 235, 230, NULL, NULL);
INSERT INTO `service_plans` (`id`, `service_id`, `network_or_biller`, `plan_name`, `plan_code`, `amount`, `validity`, `routing_type`, `sim_slot_id`, `ussd_template`, `description`, `is_available`, `data_type`, `plan_size`, `buying_price`, `reseller_price`, `api_price`, `provider_id`, `provider_plan_id`) VALUES ('pln_glo_3gb', 'srv_data', 'GLO', 'Glo 3.0GB CG Data', 'GLO-CG-3GB', 720, '30 Days', 'API', NULL, NULL, NULL, 1, 'CG', '3GB', 675, 705, 690, NULL, NULL);
INSERT INTO `service_plans` (`id`, `service_id`, `network_or_biller`, `plan_name`, `plan_code`, `amount`, `validity`, `routing_type`, `sim_slot_id`, `ussd_template`, `description`, `is_available`, `data_type`, `plan_size`, `buying_price`, `reseller_price`, `api_price`, `provider_id`, `provider_plan_id`) VALUES ('pln_sun_1day', 'srv_solar', 'SUNKING', 'SunKing 1-Day Lighting Activation PIN', 'SUN-1DAY', 350, '24 Hours', 'API', NULL, NULL, NULL, 1, 'SOLAR', '1-DAY', 320, 340, 335, NULL, NULL);
INSERT INTO `service_plans` (`id`, `service_id`, `network_or_biller`, `plan_name`, `plan_code`, `amount`, `validity`, `routing_type`, `sim_slot_id`, `ussd_template`, `description`, `is_available`, `data_type`, `plan_size`, `buying_price`, `reseller_price`, `api_price`, `provider_id`, `provider_plan_id`) VALUES ('pln_sun_7day', 'srv_solar', 'SUNKING', 'SunKing 7-Day Solar Bundle PIN', 'SUN-7DAY', 2200, '7 Days', 'API', NULL, NULL, NULL, 1, 'SOLAR', '7-DAY', 2050, 2150, 2100, NULL, NULL);
INSERT INTO `service_plans` (`id`, `service_id`, `network_or_biller`, `plan_name`, `plan_code`, `amount`, `validity`, `routing_type`, `sim_slot_id`, `ussd_template`, `description`, `is_available`, `data_type`, `plan_size`, `buying_price`, `reseller_price`, `api_price`, `provider_id`, `provider_plan_id`) VALUES ('pln_sun_30day', 'srv_solar', 'SUNKING', 'SunKing 30-Day Solar Home System PIN', 'SUN-30DAY', 8900, '30 Days', 'API', NULL, NULL, NULL, 1, 'SOLAR', '30-DAY', 8400, 8750, 8600, NULL, NULL);

-- Dumping data for table `testimonials`
INSERT INTO `testimonials` (`id`, `author_name`, `author_role`, `rating`, `content`, `avatar_url`, `is_published`, `sort_order`, `created_at`, `updated_at`) VALUES ('tst_001', 'Ibrahim Danladi', 'SME Data Merchant (Kano)', 5, 'Bukar Data Sub has completely transformed my daily reselling business. SME data delivery takes less than 3 seconds, and the automated PalmPay/Monnify virtual accounts fund my wallet instantaneously with zero manual verification delays.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', 1, 1, '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');
INSERT INTO `testimonials` (`id`, `author_name`, `author_role`, `rating`, `content`, `avatar_url`, `is_published`, `sort_order`, `created_at`, `updated_at`) VALUES ('tst_002', 'Aisha Bello', 'POS & Agency Banking Operator (Kaduna)', 5, 'The 16-digit SunKing Solar activation PIN engine is 100% dependable. My rural customers get their light back instantly without downtime. The UI is super fast and clean.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', 1, 2, '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');
INSERT INTO `testimonials` (`id`, `author_name`, `author_role`, `rating`, `content`, `avatar_url`, `is_published`, `sort_order`, `created_at`, `updated_at`) VALUES ('tst_003', 'Emeka Okafor', 'Software Engineer & API Reseller (Lagos)', 5, 'Their Reseller API with strict HMAC webhooks, rate limiting, and 99.98% uptime SLA is the best in Nigeria. We route over 4,000 requests daily with zero discrepancies.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', 1, 3, '2026-10-26T12:00:00.000Z', '2026-10-26T12:00:00.000Z');

-- Dumping data for table `cms_sections`
INSERT INTO `cms_sections` (`id`, `title`, `content_json`, `draft_json`, `is_published`, `version`, `updated_by`, `updated_at`) VALUES ('hero', 'Homepage Hero Section', '{"headline":"Automated SME Data, Airtime & Utility Hub","subheadline":"Experience sub-3-second automated delivery for SME & Corporate Data, Airtime VTU, Electricity Tokens, Cable TV subscriptions, and SunKing Solar PINs.","ctaPrimaryText":"Get Started Now","ctaPrimaryLink":"/app/dashboard","ctaSecondaryText":"Explore Wholesale Plans","ctaSecondaryLink":"#services","badgeText":"⚡ 99.98% Gateway Uptime • Instant Delivery","heroImageUrl":"https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80"}', NULL, 1, 1, 'system', '2026-10-26T12:00:00.000Z');
INSERT INTO `cms_sections` (`id`, `title`, `content_json`, `draft_json`, `is_published`, `version`, `updated_by`, `updated_at`) VALUES ('services_promo', 'Services & Promotional Showcase', '{"badge":"Enterprise Telecommunications","title":"Complete Suite of Digital VTU Services","description":"Engineered for consumers, busy retail agents, and enterprise API resellers.","features":[{"title":"Sub-3s Data Delivery","desc":"MTN SME, Airtel CG, Glo Gift, 9Mobile direct via dedicated SIM modems."},{"title":"Instant NUBAN Funding","desc":"Dedicated PalmPay, Monnify & Paystack accounts with zero deposit wait times."},{"title":"SunKing Solar PINs","desc":"Instant 16-digit activation codes for clean home solar energy."},{"title":"Utility Token Generation","desc":"Prepaid meter tokens for IKEDC, EKEDC, AEDC with instant receipt prints."}]}', NULL, 1, 1, 'system', '2026-10-26T12:00:00.000Z');
INSERT INTO `cms_sections` (`id`, `title`, `content_json`, `draft_json`, `is_published`, `version`, `updated_by`, `updated_at`) VALUES ('contact_footer', 'Contact & Footer Details', '{"supportEmail":"support@bukardatasub.com","supportPhone":"+234 913 179 7675","whatsapp":"+234 913 179 7675","address":"Suite 402, Technology Innovation Hub, Ahmadu Bello Way, Abuja, Nigeria","copyrightText":"© 2026 Bukar Data Sub Ltd. All Rights Reserved. Regulated Financial Technology & Telecom Platform.","socialLinks":{"twitter":"https://twitter.com/bukardatasub","facebook":"https://facebook.com/bukardatasub","instagram":"https://instagram.com/bukardatasub"}}', NULL, 1, 1, 'system', '2026-10-26T12:00:00.000Z');
INSERT INTO `cms_sections` (`id`, `title`, `content_json`, `draft_json`, `is_published`, `version`, `updated_by`, `updated_at`) VALUES ('terms_privacy', 'Legal & Compliance Policies', '{"termsSummary":"Users agree to adhere to CBN and NCC telecommunication guidelines. Unauthorized scraping or fraudulent chargebacks are strictly prohibited.","privacySummary":"We encrypt all customer credentials using AES-256-GCM. We never store raw card details or share personal records with unauthorized third parties.","lastUpdated":"October 2026"}', NULL, 1, 1, 'system', '2026-10-26T12:00:00.000Z');

-- Dumping data for table `cms_revisions`
INSERT INTO `cms_revisions` (`id`, `section_id`, `version`, `content_json`, `created_by`, `notes`, `created_at`) VALUES ('rev_hero_v1', 'hero', 1, '{"headline":"Automated SME Data, Airtime & Utility Hub","subheadline":"Experience sub-3-second automated delivery for SME & Corporate Data, Airtime VTU, Electricity Tokens, Cable TV subscriptions, and SunKing Solar PINs.","ctaPrimaryText":"Get Started Now","ctaPrimaryLink":"/app/dashboard","ctaSecondaryText":"Explore Wholesale Plans","ctaSecondaryLink":"#services","badgeText":"⚡ 99.98% Gateway Uptime • Instant Delivery","heroImageUrl":"https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80"}', 'system', 'Initial production baseline', '2026-10-26T12:00:00.000Z');

-- Dumping data for table `mobile_app_config`
INSERT INTO `mobile_app_config` (`id`, `app_name`, `branding_json`, `banner_json`, `android_min_version`, `android_latest_version`, `ios_min_version`, `ios_latest_version`, `force_update`, `update_title`, `update_notes`, `play_store_url`, `app_store_url`, `services_enabled_json`, `maintenance_mode`, `maintenance_message`, `updated_by`, `updated_at`) VALUES ('cfg_mobile_001', 'Bukar Data Sub Mobile', '{"primaryColor":"#1E5BF9","accentColor":"#00B977","logoUrl":""}', '[{"id":"b1","title":"5% CashBack on MTN SME Data","subtitle":"Automatic discount applied at checkout for agents","actionUrl":"/services"},{"id":"b2","title":"SunKing Solar PINs Active","subtitle":"Recharge your clean home solar lights instantly","actionUrl":"/services"}]', '1.0.0', '1.0.0', '1.0.0', '1.0.0', 0, 'New Speed Optimization Available', 'Includes sub-second PalmPay virtual account notifications and biometric quick-login.', 'https://play.google.com/store/apps/details?id=com.bukardatasub.app', 'https://apps.apple.com/app/id6449123456', '["data","airtime","electricity","cable","solar","exam"]', 0, '', 'system', '2026-10-26T12:00:00.000Z');

-- Dumping data for table `notification_templates`
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_request_created', 'PAYMENT_REQUEST_CREATED', '[Bukar Data Sub] PAYMENT REQUEST CREATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_instructions_generated', 'PAYMENT_INSTRUCTIONS_GENERATED', '[Bukar Data Sub] PAYMENT INSTRUCTIONS GENERATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_initiated', 'PAYMENT_INITIATED', '[Bukar Data Sub] PAYMENT INITIATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_awaiting_confirmation', 'PAYMENT_AWAITING_CONFIRMATION', '[Bukar Data Sub] PAYMENT AWAITING CONFIRMATION', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_processing_started', 'PAYMENT_PROCESSING_STARTED', '[Bukar Data Sub] PAYMENT PROCESSING STARTED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_confirmed_success', 'PAYMENT_CONFIRMED_SUCCESS', '[Bukar Data Sub] PAYMENT CONFIRMED SUCCESS', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_failed', 'PAYMENT_FAILED', '[Bukar Data Sub] PAYMENT FAILED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_cancelled', 'PAYMENT_CANCELLED', '[Bukar Data Sub] PAYMENT CANCELLED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_expired', 'PAYMENT_EXPIRED', '[Bukar Data Sub] PAYMENT EXPIRED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_delayed', 'PAYMENT_DELAYED', '[Bukar Data Sub] PAYMENT DELAYED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_status_changed', 'PAYMENT_STATUS_CHANGED', '[Bukar Data Sub] PAYMENT STATUS CHANGED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_duplicate_payment_suspected', 'DUPLICATE_PAYMENT_SUSPECTED', '[Bukar Data Sub] DUPLICATE PAYMENT SUSPECTED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_duplicate_payment_confirmed', 'DUPLICATE_PAYMENT_CONFIRMED', '[Bukar Data Sub] DUPLICATE PAYMENT CONFIRMED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_refund_requested', 'REFUND_REQUESTED', '[Bukar Data Sub] REFUND REQUESTED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_refund_completed', 'REFUND_COMPLETED', '[Bukar Data Sub] REFUND COMPLETED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_refund_failed', 'REFUND_FAILED', '[Bukar Data Sub] REFUND FAILED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_reversal_initiated', 'PAYMENT_REVERSAL_INITIATED', '[Bukar Data Sub] PAYMENT REVERSAL INITIATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_reversal_completed', 'PAYMENT_REVERSAL_COMPLETED', '[Bukar Data Sub] PAYMENT REVERSAL COMPLETED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_dispute_opened', 'PAYMENT_DISPUTE_OPENED', '[Bukar Data Sub] PAYMENT DISPUTE OPENED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_dispute_resolved', 'PAYMENT_DISPUTE_RESOLVED', '[Bukar Data Sub] PAYMENT DISPUTE RESOLVED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_wallet_funding_initiated', 'WALLET_FUNDING_INITIATED', '[Bukar Data Sub] WALLET FUNDING INITIATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_wallet_funding_confirmed', 'WALLET_FUNDING_CONFIRMED', '[Bukar Data Sub] WALLET FUNDING CONFIRMED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_wallet_funding_failed', 'WALLET_FUNDING_FAILED', '[Bukar Data Sub] WALLET FUNDING FAILED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_wallet_credited', 'WALLET_CREDITED', '[Bukar Data Sub] WALLET CREDITED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_wallet_debited', 'WALLET_DEBITED', '[Bukar Data Sub] WALLET DEBITED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_wallet_adjustment_submitted', 'WALLET_ADJUSTMENT_SUBMITTED', '[Bukar Data Sub] WALLET ADJUSTMENT SUBMITTED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_wallet_adjustment_reviewed', 'WALLET_ADJUSTMENT_REVIEWED', '[Bukar Data Sub] WALLET ADJUSTMENT REVIEWED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_payment_receipt_generated', 'PAYMENT_RECEIPT_GENERATED', '[Bukar Data Sub] PAYMENT RECEIPT GENERATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_reconciliation_discrepancy', 'RECONCILIATION_DISCREPANCY', '[Bukar Data Sub] RECONCILIATION DISCREPANCY', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_vtu_transaction_received', 'VTU_TRANSACTION_RECEIVED', '[Bukar Data Sub] VTU TRANSACTION RECEIVED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_vtu_submitted_to_provider', 'VTU_SUBMITTED_TO_PROVIDER', '[Bukar Data Sub] VTU SUBMITTED TO PROVIDER', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_vtu_provider_acknowledged', 'VTU_PROVIDER_ACKNOWLEDGED', '[Bukar Data Sub] VTU PROVIDER ACKNOWLEDGED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_vtu_processing', 'VTU_PROCESSING', '[Bukar Data Sub] VTU PROCESSING', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_vtu_completed_success', 'VTU_COMPLETED_SUCCESS', '[Bukar Data Sub] VTU COMPLETED SUCCESS', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_vtu_failed', 'VTU_FAILED', '[Bukar Data Sub] VTU FAILED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_vtu_pending_delayed', 'VTU_PENDING_DELAYED', '[Bukar Data Sub] VTU PENDING DELAYED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_vtu_provider_unavailable', 'VTU_PROVIDER_UNAVAILABLE', '[Bukar Data Sub] VTU PROVIDER UNAVAILABLE', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_vtu_refund_initiated', 'VTU_REFUND_INITIATED', '[Bukar Data Sub] VTU REFUND INITIATED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
INSERT INTO `notification_templates` (`id`, `event_key`, `subject`, `html_template`, `sms_template`, `is_active`) VALUES ('tpl_vtu_refund_completed', 'VTU_REFUND_COMPLETED', '[Bukar Data Sub] VTU REFUND COMPLETED', '<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
SET FOREIGN_KEY_CHECKS = 1;
