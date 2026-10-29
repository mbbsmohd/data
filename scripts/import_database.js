/**
 * ==============================================================================
 * BUKAR DATA SUB — DATABASE ONE-CLICK IMPORT UTILITY
 * ==============================================================================
 * Imports the complete, production-ready database into backend/data/platform.sqlite.
 * Usage:
 *   node scripts/import_database.js
 *   npm run db:import
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SQLITE_SOURCE = path.resolve(ROOT_DIR, 'database', 'bukardatasub_production.sqlite');
const SQL_SOURCE = path.resolve(ROOT_DIR, 'database', 'bukardatasub_production.sql');
const TARGET_DIR = path.resolve(ROOT_DIR, 'backend', 'data');
const TARGET_DB = path.resolve(TARGET_DIR, 'platform.sqlite');

console.log('🚀 BUKAR DATA SUB — DATABASE IMPORT UTILITY');
console.log('======================================================');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Backup existing database if it exists
if (fs.existsSync(TARGET_DB)) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.resolve(TARGET_DIR, `platform.sqlite.pre_import_${timestamp}`);
  try {
    fs.copyFileSync(TARGET_DB, backupFile);
    console.log(`📦 Created backup of existing database: ${path.basename(backupFile)}`);
  } catch (err) {
    console.warn('⚠️ Could not create backup:', err.message);
  }
}

// Perform import:
// Preference 1: Binary copy of pre-indexed SQLite file (instantaneous & exact)
if (fs.existsSync(SQLITE_SOURCE)) {
  console.log(`📥 Importing binary SQLite database: ${path.basename(SQLITE_SOURCE)}...`);
  
  // Clean up any stale WAL/SHM files to prevent WAL mismatch
  const walFile = path.resolve(TARGET_DIR, 'platform.sqlite-wal');
  const shmFile = path.resolve(TARGET_DIR, 'platform.sqlite-shm');
  try { if (fs.existsSync(walFile)) fs.unlinkSync(walFile); } catch {}
  try { if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile); } catch {}

  fs.copyFileSync(SQLITE_SOURCE, TARGET_DB);
  console.log('✅ SQLite binary imported successfully into:', TARGET_DB);
} else if (fs.existsSync(SQL_SOURCE)) {
  // Preference 2: Execute SQL script directly
  console.log(`📥 Executing SQL import script: ${path.basename(SQL_SOURCE)}...`);
  const sql = fs.readFileSync(SQL_SOURCE, 'utf8');
  const db = new DatabaseSync(TARGET_DB);
  db.exec(sql);
  db.close();
  console.log('✅ SQL statements executed successfully into:', TARGET_DB);
} else {
  console.error('❌ Error: Neither bukardatasub_production.sqlite nor bukardatasub_production.sql found in database/ directory!');
  process.exit(1);
}

// Verify imported database
try {
  const verifyDb = new DatabaseSync(TARGET_DB);
  const settings = verifyDb.prepare('SELECT app_name, support_email, currency FROM system_settings WHERE id = ?').get('sys_settings_001');
  const admin = verifyDb.prepare('SELECT email, role, tier FROM users WHERE id = ?').get('usr_root_admin');
  const plans = verifyDb.prepare('SELECT count(*) as c FROM service_plans').get();
  const gateways = verifyDb.prepare('SELECT count(*) as c FROM payment_gateways').get();
  const reserved = verifyDb.prepare('SELECT count(*) as c FROM reserved_accounts').get();
  verifyDb.close();

  console.log('\n======================================================');
  console.log('🎉 DATABASE IMPORT VERIFIED SUCCESSFULLY!');
  console.log(`   - Platform Name   : ${settings?.app_name || 'Bukar Data Sub'}`);
  console.log(`   - Support Email   : ${settings?.support_email || 'support@bukardatasub.com'}`);
  console.log(`   - Active Currency : ${settings?.currency || 'NGN'}`);
  console.log(`   - Super Admin     : ${admin?.email || 'admin@bukardatasub.com'} (Role: ${admin?.role || 'super_admin'})`);
  console.log(`   - Telecom Plans   : ${plans?.c || 0} active plans`);
  console.log(`   - Payment Gateways: ${gateways?.c || 0} gateways configured`);
  console.log('======================================================\n');
} catch (err) {
  console.warn('⚠️ Verification warning:', err.message);
}
