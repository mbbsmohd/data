import { db } from './index.js';

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[];

console.log('📊 DATABASE INVENTORY & ROW COUNTS:');
console.log('-------------------------------------------');

console.log('\n👑 CURRENT USERS IN DATABASE:');
console.log(db.prepare('SELECT id, name, email, role, tier, status FROM users').all());

console.log('\n💼 CURRENT WALLETS IN DATABASE:');
console.log(db.prepare('SELECT id, user_id, balance, commission_balance, currency FROM wallets').all());

for (const t of tables) {
  try {
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get() as { count: number };
    console.log(`${t.name.padEnd(32)}: ${countRow.count} rows`);
  } catch (e: any) {
    console.log(`${t.name.padEnd(32)}: Error (${e.message})`);
  }
}
console.log('-------------------------------------------');

console.log('\n👑 CURRENT USERS IN DATABASE:');
console.log(db.prepare('SELECT id, name, email, role, tier, status FROM users').all());

console.log('\n💼 CURRENT WALLETS IN DATABASE:');
console.log(db.prepare('SELECT id, user_id, balance, commission_balance, currency FROM wallets').all());

