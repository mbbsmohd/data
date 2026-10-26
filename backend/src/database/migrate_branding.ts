import { db } from './index.js';

console.log('🔄 Running Branding Migration to Bukar Data Sub...');

const tplRes = db.prepare(`
  UPDATE notification_templates 
  SET subject = REPLACE(subject, 'ABK Data', 'Bukar Data Sub'),
      html_template = REPLACE(REPLACE(html_template, 'ABK Data Link', 'Bukar Data Sub'), 'ABK Data', 'Bukar Data Sub'),
      sms_template = REPLACE(sms_template, 'ABK Data', 'Bukar Data Sub')
`).run();
console.log(`✅ Notification Templates updated: ${tplRes.changes}`);

const gwRes = db.prepare(`
  UPDATE payment_gateways 
  SET account_name = REPLACE(REPLACE(account_name, 'ABK DATA LINK', 'BUKAR DATA SUB'), 'ABK TELECOM', 'BUKAR DATA SUB')
`).run();
console.log(`✅ Payment Gateways updated: ${gwRes.changes}`);

const appCfgRes = db.prepare(`
  UPDATE mobile_app_config 
  SET app_name = 'Bukar Data Sub Mobile',
      play_store_url = 'https://play.google.com/store/apps/details?id=com.bukardatasub.app'
  WHERE id = 'cfg_mobile_001'
`).run();
console.log(`✅ Mobile App Config updated: ${appCfgRes.changes}`);

const sysRes = db.prepare(`
  UPDATE system_settings 
  SET app_name = 'Bukar Data Sub',
      support_email = 'support@bukardatasub.com'
`).run();
console.log(`✅ System Settings updated: ${sysRes.changes}`);

// Ensure admin@bukardatasub.com user exists
const existingBukarAdmin = db.prepare("SELECT id FROM users WHERE email = 'admin@bukardatasub.com'").get();
if (!existingBukarAdmin) {
  const existingAdmin = db.prepare("SELECT * FROM users WHERE email = 'admin@abkdata.com'").get() as any;
  if (existingAdmin) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, tier, status, transaction_pin_hash, created_at, updated_at)
      VALUES (?, ?, 'admin@bukardatasub.com', '08000000002', ?, 'super_admin', 3, 'active', ?, ?, ?)
    `).run('usr_admin_bds_001', 'Super Administrator (Bukar Data Sub)', existingAdmin.password_hash, existingAdmin.transaction_pin_hash, now, now);
    db.prepare(`
      INSERT INTO wallets (id, user_id, balance, commission_balance, created_at, updated_at)
      VALUES ('wal_admin_bds_001', 'usr_admin_bds_001', 5000000.0, 0.0, ?, ?)
    `).run(now, now);
    console.log('✅ admin@bukardatasub.com user registered');
  }
}

console.log('🎉 Brand migration completed successfully!');
