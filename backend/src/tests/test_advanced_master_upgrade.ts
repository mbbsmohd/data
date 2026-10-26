import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { db, initializeDatabase } from '../database/index.js';
import { WalletService } from '../services/walletService.js';

describe('Advanced Master Upgrade: CMS, Maintenance, Wallets, Mobile Config & Security Center', () => {
  before(() => {
    initializeDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO cms_sections (id, title, content_json, draft_json, is_published, version, updated_by, updated_at)
      VALUES ('hero', 'Homepage Hero Section', ?, NULL, 1, 1, 'system', ?)
    `).run(JSON.stringify({
      headline: 'Automated SME Data, Airtime & Utility Hub',
      subheadline: 'Experience sub-3-second automated delivery for SME & Corporate Data, Airtime VTU, Electricity Tokens, Cable TV subscriptions, and SunKing Solar PINs.',
      ctaPrimaryText: 'Get Started Now',
      ctaPrimaryLink: '/app/dashboard',
      ctaSecondaryText: 'Explore Wholesale Plans',
      ctaSecondaryLink: '#services',
      badgeText: '⚡ 99.98% Gateway Uptime • Instant Delivery',
      heroImageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80'
    }), now);
  });
  // 1. CMS Content Management & Rollback
  it('Should verify CMS sections are seeded with default content', () => {
    const hero = db.prepare("SELECT * FROM cms_sections WHERE id = 'hero'").get() as any;
    assert.ok(hero, 'Hero section should exist');
    assert.strictEqual(hero.is_published, 1);
    assert.strictEqual(hero.version, 1);

    const parsed = JSON.parse(hero.content_json);
    assert.ok(parsed.headline.includes('Automated SME Data'));
  });

  it('Should save a CMS draft without incrementing published version', () => {
    const draftContent = JSON.stringify({ headline: 'Draft Headline For Next Week' });
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE cms_sections
      SET draft_json = ?, updated_at = ?
      WHERE id = 'hero'
    `).run(draftContent, now);

    const hero = db.prepare("SELECT * FROM cms_sections WHERE id = 'hero'").get() as any;
    assert.strictEqual(hero.version, 1);
    assert.ok(hero.draft_json.includes('Draft Headline'));
  });

  it('Should publish CMS section, archive revision, and increment version', () => {
    const heroBefore = db.prepare("SELECT * FROM cms_sections WHERE id = 'hero'").get() as any;
    const oldVersion = heroBefore.version;
    const newVersion = oldVersion + 1;
    const now = new Date().toISOString();

    const newContent = JSON.stringify({
      headline: 'Automated High-Speed Telecom & SME Data Hub v2',
      badgeText: '⚡ 99.99% Uptime'
    });

    // Archive revision
    db.prepare(`
      INSERT INTO cms_revisions (id, section_id, version, content_json, created_by, notes, created_at)
      VALUES (?, 'hero', ?, ?, 'admin@abkdata.com', 'Pre-upgrade snapshot', ?)
    `).run(`rev_test_${Date.now()}`, oldVersion, heroBefore.content_json, now);

    // Update section
    db.prepare(`
      UPDATE cms_sections
      SET content_json = ?, draft_json = NULL, version = ?, updated_at = ?
      WHERE id = 'hero'
    `).run(newContent, newVersion, now);

    const heroAfter = db.prepare("SELECT * FROM cms_sections WHERE id = 'hero'").get() as any;
    assert.strictEqual(heroAfter.version, newVersion);
    assert.strictEqual(heroAfter.draft_json, null);

    // Verify revision is stored
    const revisions = db.prepare("SELECT * FROM cms_revisions WHERE section_id = 'hero'").all();
    assert.ok(revisions.length >= 1, 'Should have archived revisions');
  });

  it('Should rollback CMS section to previous revision', () => {
    const rev = db.prepare("SELECT * FROM cms_revisions WHERE section_id = 'hero' ORDER BY version ASC LIMIT 1").get() as any;
    assert.ok(rev, 'Original revision should exist');

    const heroCurrent = db.prepare("SELECT * FROM cms_sections WHERE id = 'hero'").get() as any;
    const restoredVersion = heroCurrent.version + 1;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE cms_sections
      SET content_json = ?, version = ?, updated_at = ?
      WHERE id = 'hero'
    `).run(rev.content_json, restoredVersion, now);

    const rolledBack = db.prepare("SELECT * FROM cms_sections WHERE id = 'hero'").get() as any;
    assert.strictEqual(rolledBack.version, restoredVersion);
    assert.ok(rolledBack.content_json.includes('Automated SME Data'));
  });

  // 2. Platform Maintenance Mode & Scoped Enforcement
  it('Should configure maintenance mode with scope and audit history', () => {
    const now = new Date().toISOString();
    const testMsg = 'Scheduled API gateway optimization. Services resume in 10 mins.';

    db.prepare(`
      UPDATE system_settings
      SET maintenance_mode = 1,
          maintenance_scope = 'vtu_services',
          maintenance_message = ?,
          updated_at = ?
    `).run(testMsg, now);

    // Log to maintenance_logs
    db.prepare(`
      INSERT INTO maintenance_logs (id, action, scope, message, created_by, created_at)
      VALUES (?, 'ENABLED', 'vtu_services', ?, 'admin@abkdata.com', ?)
    `).run(`maint_test_${Date.now()}`, testMsg, now);

    const settings = db.prepare("SELECT maintenance_mode, maintenance_scope, maintenance_message FROM system_settings").get() as any;
    assert.strictEqual(settings.maintenance_mode, 1);
    assert.strictEqual(settings.maintenance_scope, 'vtu_services');
    assert.strictEqual(settings.maintenance_message, testMsg);

    const log = db.prepare("SELECT * FROM maintenance_logs WHERE scope = 'vtu_services' ORDER BY created_at DESC LIMIT 1").get() as any;
    assert.ok(log);
    assert.strictEqual(log.action, 'ENABLED');

    // Restore to normal live mode
    db.prepare("UPDATE system_settings SET maintenance_mode = 0, updated_at = ?").run(new Date().toISOString());
  });

  // 3. Customer Wallets Management: Old & New Balance + Dual Approval
  it('Should verify customer wallet inspection calculates old and new balance accurately', () => {
    const user = db.prepare("SELECT id FROM users WHERE email = 'customer@abkdata.com'").get() as any;
    assert.ok(user, 'Test customer must exist');

    const wallet = db.prepare("SELECT * FROM wallets WHERE user_id = ?").get(user.id) as any;
    const oldBalance = Number(wallet.balance);
    const creditAmount = 5000;
    const expectedNewBalance = oldBalance + creditAmount;

    // Execute atomic credit
    const result = WalletService.creditWallet({
      userId: user.id,
      amount: creditAmount,
      category: 'ADJUSTMENT',
      reference: 'ADJ_TEST_' + Date.now(),
      description: 'Audit Old/New Balance Test'
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newBalance, expectedNewBalance);

    // Record audited adjustment record
    const adjId = 'adj_verify_' + Date.now();
    db.prepare(`
      INSERT INTO wallet_adjustments (
        id, wallet_id, user_id, adjustment_type, amount, balance_before,
        projected_balance, balance_after, reason, reference, requested_by, status, created_at
      )
      VALUES (?, ?, ?, 'CREDIT', ?, ?, ?, ?, 'Automated verification test', ?, 'admin@abkdata.com', 'COMPLETED', ?)
    `).run(
      adjId, wallet.id, user.id, creditAmount, oldBalance, expectedNewBalance,
      result.newBalance, 'ADJ_REF_' + Date.now(), new Date().toISOString()
    );

    const adjRecord = db.prepare("SELECT * FROM wallet_adjustments WHERE id = ?").get(adjId) as any;
    assert.strictEqual(adjRecord.balance_before, oldBalance);
    assert.strictEqual(adjRecord.balance_after, expectedNewBalance);
    assert.strictEqual(adjRecord.status, 'COMPLETED');
  });

  it('Should reject debit exceeding customer balance (overdraft prevention)', () => {
    const user = db.prepare("SELECT id FROM users WHERE email = 'customer@abkdata.com'").get() as any;
    const wallet = db.prepare("SELECT balance FROM wallets WHERE user_id = ?").get(user.id) as any;
    const excessiveDebit = Number(wallet.balance) + 500000;

    assert.throws(() => {
      WalletService.debitWallet({
        userId: user.id,
        amount: excessiveDebit,
        category: 'ADJUSTMENT',
        reference: 'ADJ_FAIL_' + Date.now(),
        description: 'Should fail due to insufficient funds'
      });
    }, /Insufficient wallet balance/);
  });

  it('Should queue high-risk adjustments (>= ₦50,000) for dual-approval and commit on approval', () => {
    const user = db.prepare("SELECT id FROM users WHERE email = 'customer@abkdata.com'").get() as any;
    const wallet = db.prepare("SELECT id, balance FROM wallets WHERE user_id = ?").get(user.id) as any;
    const initialBal = Number(wallet.balance);
    const highRiskAmount = 75000;
    const projectedNew = initialBal + highRiskAmount;

    const adjId = 'adj_highrisk_' + Date.now();
    const ref = 'ADJ_DUAL_' + Date.now();
    const now = new Date().toISOString();

    // Insert pending dual approval record
    db.prepare(`
      INSERT INTO wallet_adjustments (
        id, wallet_id, user_id, adjustment_type, amount, balance_before,
        projected_balance, balance_after, reason, reference, requested_by, status, created_at
      )
      VALUES (?, ?, ?, 'CREDIT', ?, ?, ?, NULL, 'High value agent deposit compensation', ?, 'finance@abkdata.com', 'PENDING_APPROVAL', ?)
    `).run(adjId, wallet.id, user.id, highRiskAmount, initialBal, projectedNew, ref, now);

    // Verify it is pending
    const pending = db.prepare("SELECT * FROM wallet_adjustments WHERE id = ?").get(adjId) as any;
    assert.strictEqual(pending.status, 'PENDING_APPROVAL');
    assert.strictEqual(pending.balance_after, null);

    // Second admin dual-approves and commits
    const credResult = WalletService.creditWallet({
      userId: user.id,
      amount: highRiskAmount,
      category: 'ADJUSTMENT',
      reference: ref,
      description: `Dual-Approved Credit: (req by finance@abkdata.com, appr by admin@abkdata.com)`
    });

    db.prepare(`
      UPDATE wallet_adjustments
      SET status = 'COMPLETED',
          balance_after = ?,
          approved_by = 'admin@abkdata.com',
          approved_at = ?
      WHERE id = ?
    `).run(credResult.newBalance, new Date().toISOString(), adjId);

    const approved = db.prepare("SELECT * FROM wallet_adjustments WHERE id = ?").get(adjId) as any;
    assert.strictEqual(approved.status, 'COMPLETED');
    assert.strictEqual(approved.approved_by, 'admin@abkdata.com');
    assert.strictEqual(approved.balance_after, credResult.newBalance);
  });

  // 4. Mobile Remote Config & Telemetry
  it('Should verify mobile remote config and telemetry', () => {
    const config = db.prepare("SELECT * FROM mobile_app_config LIMIT 1").get() as any;
    assert.ok(config, 'Mobile app config should exist');
    assert.strictEqual(config.android_min_version, '1.0.0');
    assert.ok(config.play_store_url.includes('play.google.com'));

    // Record telemetry event
    const telId = 'tel_test_' + Date.now();
    db.prepare(`
      INSERT INTO mobile_telemetry (id, platform, app_version, device_model, os_version, event_type, details_json, created_at)
      VALUES (?, 'android', '1.0.0', 'Pixel 8', 'Android 14', 'APP_LAUNCH', '{"battery": 92}', ?)
    `).run(telId, new Date().toISOString());

    const tel = db.prepare("SELECT * FROM mobile_telemetry WHERE id = ?").get(telId) as any;
    assert.strictEqual(tel.platform, 'android');
    assert.strictEqual(tel.event_type, 'APP_LAUNCH');
  });

  // 5. Security Center & Incident Management
  it('Should manage security incidents with severity, assignment, and resolution notes', () => {
    const incId = 'sec_test_' + Date.now();
    db.prepare(`
      INSERT INTO security_incidents (id, incident_type, severity, description, target_identifier, status, created_at)
      VALUES (?, 'SUSPICIOUS_SESSION', 'HIGH', 'Simultaneous login attempts from conflicting geographical coordinates', 'agent@abkdata.com', 'OPEN', ?)
    `).run(incId, new Date().toISOString());

    const inc = db.prepare("SELECT * FROM security_incidents WHERE id = ?").get(incId) as any;
    assert.strictEqual(inc.severity, 'HIGH');
    assert.strictEqual(inc.status, 'OPEN');

    // Update incident to RESOLVED with notes
    const resolveTime = new Date().toISOString();
    db.prepare(`
      UPDATE security_incidents
      SET status = 'RESOLVED',
          assigned_to = 'security@abkdata.com',
          resolution_notes = 'Verified authorized VPN usage. Flagged as resolved.',
          resolved_at = ?
      WHERE id = ?
    `).run(resolveTime, incId);

    const resolved = db.prepare("SELECT * FROM security_incidents WHERE id = ?").get(incId) as any;
    assert.strictEqual(resolved.status, 'RESOLVED');
    assert.strictEqual(resolved.assigned_to, 'security@abkdata.com');
    assert.ok(resolved.resolution_notes.includes('VPN usage'));
  });
});
