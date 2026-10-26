import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/database/index';
import bcrypt from 'bcryptjs';

test('Announcements, Bulk Pricing & User Profile Management Suite', async (t) => {
  await t.test('1. Announcement lifecycle with duration_days and auto-expiry', () => {
    const id = 'ann_test_' + Date.now();
    const durationDays = 5;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    db.prepare(`
      INSERT INTO dashboard_announcements (
        id, title, message, type, badge_text, duration_days, expires_at, is_active, target_audience, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'all', 'admin', ?, ?)
    `).run(
      id,
      '5-Day Flash Network Upgrade',
      'MTN SME speed increased by 300%. Enjoy seamless instant VTU.',
      'info',
      'Flash Promo',
      durationDays,
      expiresAt,
      nowIso,
      nowIso
    );

    // Fetch active
    const active = db.prepare(`
      SELECT * FROM dashboard_announcements 
      WHERE is_active = 1 AND datetime(expires_at) > datetime('now')
      ORDER BY created_at DESC
    `).all() as any[];

    const inserted = active.find(a => a.id === id);
    assert.ok(inserted, 'Inserted announcement should be active and non-expired');
    assert.strictEqual(inserted.duration_days, 5);
    assert.strictEqual(inserted.type, 'info');

    // Clean up
    db.prepare(`DELETE FROM dashboard_announcements WHERE id = ?`).run(id);
  });

  await t.test('2. Expired announcements should not appear in active queries', () => {
    const id = 'ann_expired_' + Date.now();
    const nowIso = new Date().toISOString();
    const pastExpiresAt = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

    db.prepare(`
      INSERT INTO dashboard_announcements (
        id, title, message, type, badge_text, duration_days, expires_at, is_active, target_audience, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, 1, 'all', 'admin', ?, ?)
    `).run(
      id,
      'Old Expired Notice',
      'This notice is expired.',
      'warning',
      'Old',
      pastExpiresAt,
      nowIso,
      nowIso
    );

    const active = db.prepare(`
      SELECT * FROM dashboard_announcements 
      WHERE is_active = 1 AND datetime(expires_at) > datetime('now')
    `).all() as any[];

    const found = active.find(a => a.id === id);
    assert.strictEqual(found, undefined, 'Expired notice must NOT be returned in active user announcements');

    // Clean up
    db.prepare(`DELETE FROM dashboard_announcements WHERE id = ?`).run(id);
  });

  await t.test('3. Bulk adjust plan prices updates amounts accurately', () => {
    // Pick an existing plan
    const sample = db.prepare(`SELECT * FROM service_plans WHERE network_or_biller = 'MTN' LIMIT 1`).get() as any;
    assert.ok(sample, 'Expected at least one MTN plan in database');

    const originalAmount = sample.amount;
    const percentIncrease = 10;
    const expectedNewAmount = Math.round(originalAmount * 1.10);

    // Apply bulk adjust logic
    db.prepare(`
      UPDATE service_plans
      SET amount = ROUND(amount * 1.10)
      WHERE id = ?
    `).run(sample.id);

    const updated = db.prepare(`SELECT * FROM service_plans WHERE id = ?`).get(sample.id) as any;
    assert.strictEqual(updated.amount, expectedNewAmount);

    // Revert back to original amount
    db.prepare(`UPDATE service_plans SET amount = ? WHERE id = ?`).run(originalAmount, sample.id);
  });

  await t.test('4. Admin can update full user profile, address, state, and credentials', () => {
    const user = db.prepare(`SELECT * FROM users WHERE role = 'customer' LIMIT 1`).get() as any;
    assert.ok(user, 'Expected at least one customer in database');

    const originalName = user.name;
    const testNewName = 'Alhaji Mohammed Test ' + Date.now();
    const testState = 'Kaduna';
    const testAddress = '14 Independence Way, Kaduna';
    const newPasswordHash = bcrypt.hashSync('NewSecurePass2026!', 10);
    const newPinHash = bcrypt.hashSync('8899', 10);

    db.prepare(`
      UPDATE users
      SET name = ?,
          state = ?,
          address = ?,
          password_hash = ?,
          transaction_pin_hash = ?
      WHERE id = ?
    `).run(testNewName, testState, testAddress, newPasswordHash, newPinHash, user.id);

    const updatedUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(user.id) as any;
    assert.strictEqual(updatedUser.name, testNewName);
    assert.strictEqual(updatedUser.state, testState);
    assert.strictEqual(updatedUser.address, testAddress);
    assert.ok(bcrypt.compareSync('NewSecurePass2026!', updatedUser.password_hash));
    assert.ok(bcrypt.compareSync('8899', updatedUser.transaction_pin_hash));

    // Revert name back to preserve customer test records
    db.prepare(`UPDATE users SET name = ? WHERE id = ?`).run(originalName, user.id);
  });
});
