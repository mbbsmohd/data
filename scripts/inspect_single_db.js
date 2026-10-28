import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';

const dbPath = process.argv[2] || 'database/bukardatasub_production.sqlite';
console.log('Inspecting database:', dbPath);

const db = new DatabaseSync(dbPath);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
console.log('Total tables in database:', tables.length);

let totalRecords = 0;
for (const t of tables) {
  const res = db.prepare(`SELECT count(*) as c FROM "${t.name}"`).get();
  if (res.c > 0) {
    console.log(`  - ${t.name.padEnd(28)}: ${res.c} records`);
    totalRecords += res.c;
  }
}

console.log('Total seeded production records:', totalRecords);
const admin = db.prepare("SELECT email, role, tier FROM users").get();
console.log('Root Super Admin:', admin);
const settings = db.prepare("SELECT app_name, support_email, currency FROM system_settings").get();
console.log('System Settings:', settings);
