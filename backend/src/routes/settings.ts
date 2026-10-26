import { Router, Request, Response } from 'express';
import { db } from '../database/index.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/rbac.js';
import crypto from 'crypto';

const router = Router();

/**
 * Get Public System Settings, Dynamic Branding & Active Announcements
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    const settings = db.prepare('SELECT * FROM system_settings LIMIT 1').get() as any;
    res.json({
      success: true,
      settings: settings || {
        app_name: 'ABK Data Link',
        app_tagline: 'Automated Telecom & Data Platform',
        logo_url: '',
        primary_color: '#1E5BF9',
        support_email: 'support@abkdata.com',
        support_phone: '09131797675',
        currency: 'NGN',
        currency_symbol: '₦',
        announcement_text: 'Welcome to our newly upgraded automated data engine!',
        announcement_type: 'info',
        announcement_active: 1
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Update System Name, Logo, Branding & Announcements
 */
router.put('/', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const {
      appName,
      appTagline,
      logoUrl,
      primaryColor,
      accentColor,
      supportEmail,
      supportPhone,
      whatsappNumber,
      announcementText,
      announcementType,
      announcementActive,
      maintenanceMode,
      maintenanceMessage,
      referralBonusAmount,
      referralCommissionPercent
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE system_settings
      SET app_name = COALESCE(?, app_name),
          app_tagline = COALESCE(?, app_tagline),
          logo_url = COALESCE(?, logo_url),
          primary_color = COALESCE(?, primary_color),
          accent_color = COALESCE(?, accent_color),
          support_email = COALESCE(?, support_email),
          support_phone = COALESCE(?, support_phone),
          whatsapp_number = COALESCE(?, whatsapp_number),
          announcement_text = COALESCE(?, announcement_text),
          announcement_type = COALESCE(?, announcement_type),
          announcement_active = COALESCE(?, announcement_active),
          maintenance_mode = COALESCE(?, maintenance_mode),
          maintenance_message = COALESCE(?, maintenance_message),
          referral_bonus_amount = COALESCE(?, referral_bonus_amount),
          referral_commission_percent = COALESCE(?, referral_commission_percent),
          updated_at = ?
      WHERE id = (SELECT id FROM system_settings LIMIT 1) OR id = 'sys_settings_001'
    `).run(
      appName ?? null,
      appTagline ?? null,
      logoUrl ?? null,
      primaryColor ?? null,
      accentColor ?? null,
      supportEmail ?? null,
      supportPhone ?? null,
      whatsappNumber ?? null,
      announcementText ?? null,
      announcementType ?? null,
      announcementActive !== undefined ? (announcementActive ? 1 : 0) : null,
      maintenanceMode !== undefined ? (maintenanceMode ? 1 : 0) : null,
      maintenanceMessage ?? null,
      referralBonusAmount !== undefined ? Number(referralBonusAmount) : null,
      referralCommissionPercent !== undefined ? Number(referralCommissionPercent) : null,
      now
    );

    const updatedSettings = db.prepare('SELECT * FROM system_settings LIMIT 1').get();

    res.json({
      success: true,
      message: 'System branding and announcements updated successfully',
      settings: updatedSettings
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Configure Service Routing (Toggle Normal API vs. SIM Hosting for any service plan)
 */
router.post('/service-routing', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const { planId, routingType, simSlotId, ussdTemplate } = req.body;
    if (!planId || !['API', 'SIM_HOSTING'].includes(routingType)) {
      res.status(400).json({ success: false, message: 'planId and valid routingType (API or SIM_HOSTING) required' });
      return;
    }

    db.prepare(`
      UPDATE service_plans
      SET routing_type = ?, sim_slot_id = ?, ussd_template = ?
      WHERE id = ?
    `).run(routingType, simSlotId || null, ussdTemplate || null, planId);

    res.json({
      success: true,
      message: `Routing configuration updated to ${routingType}${simSlotId ? ` using SIM Slot ${simSlotId}` : ''}`
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Get User Saved Beneficiaries
 */
router.get('/beneficiaries', authenticate, (req: Request, res: Response): void => {
  try {
    const beneficiaries = db.prepare('SELECT * FROM beneficiaries WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
    res.json({ success: true, beneficiaries });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Add Beneficiary
 */
router.post('/beneficiaries', authenticate, (req: Request, res: Response): void => {
  try {
    const { category, identifier, name, networkOrBiller } = req.body;
    const id = 'ben_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO beneficiaries (id, user_id, category, identifier, name, network_or_biller, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.id, category, identifier, name, networkOrBiller, now);

    res.json({ success: true, message: 'Beneficiary saved', id });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Configure Outbound SMTP Mail Server
 */
router.post('/smtp', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, smtpFromName, smtpFromEmail } = req.body;
    db.prepare(`
      UPDATE system_settings
      SET smtp_host = COALESCE(?, smtp_host),
          smtp_port = COALESCE(?, smtp_port),
          smtp_user = COALESCE(?, smtp_user),
          smtp_pass = COALESCE(?, smtp_pass),
          smtp_secure = COALESCE(?, smtp_secure),
          smtp_from_name = COALESCE(?, smtp_from_name),
          smtp_from_email = COALESCE(?, smtp_from_email),
          updated_at = ?
      WHERE id = (SELECT id FROM system_settings LIMIT 1) OR id = 'sys_settings_001'
    `).run(
      smtpHost ?? null,
      smtpPort !== undefined ? Number(smtpPort) : null,
      smtpUser ?? null,
      smtpPass ?? null,
      smtpSecure !== undefined ? (smtpSecure ? 1 : 0) : null,
      smtpFromName ?? null,
      smtpFromEmail ?? null,
      new Date().toISOString()
    );

    res.json({ success: true, message: 'SMTP Email server settings saved successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Send Real Test Email via Configured SMTP
 */
router.post('/test-smtp', authenticate, requireRole('super_admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetEmail, customConfig } = req.body;
    if (!targetEmail) {
      res.status(400).json({ success: false, message: 'Target recipient email is required' });
      return;
    }

    const { NotificationService } = await import('../services/notificationService.js');
    const result = await NotificationService.testSmtpConnection(targetEmail, customConfig);

    res.json({
      success: true,
      message: `Test email successfully sent to ${targetEmail}`,
      details: {
        messageId: result.messageId,
        response: result.response
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: `SMTP Test Failed: ${err.message}` });
  }
});

/**
 * Super Admin / Staff: List all service & data plans for configuration
 */
router.get('/plans', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const plans = db.prepare(`
      SELECT sp.*, s.name as service_name, s.category as service_category,
             p.name as provider_name
      FROM service_plans sp
      LEFT JOIN services s ON sp.service_id = s.id
      LEFT JOIN api_providers p ON sp.provider_id = p.id
      ORDER BY sp.network_or_biller ASC, sp.amount ASC
    `).all();
    res.json({ success: true, plans });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Create New Service/Data Plan
 */
router.post('/plans', authenticate, requirePermission('MANAGE_PLANS'), (req: Request, res: Response): void => {
  try {
    const networkOrBiller = req.body.networkOrBiller || req.body.network || req.body.network_or_biller;
    const planName = req.body.planName || req.body.plan_name;
    const amount = req.body.amount || req.body.selling_price || req.body.sellingPrice;
    const planCode = req.body.planCode || req.body.plan_code;
    const validity = req.body.validity || req.body.validity_days || '30 Days';
    const dataType = req.body.dataType || req.body.data_type || 'SME';
    const planSize = req.body.planSize || req.body.plan_size || '1GB';
    const buyingPrice = req.body.buyingPrice ?? req.body.buying_price;
    const resellerPrice = req.body.resellerPrice ?? req.body.reseller_price;
    const apiPrice = req.body.apiPrice ?? req.body.api_price;
    const routingType = req.body.routingType || req.body.routing_type || 'API';
    const simSlotId = req.body.simSlotId || req.body.sim_slot_id || null;
    const ussdTemplate = req.body.ussdTemplate || req.body.ussd_template || null;
    const providerId = req.body.providerId || req.body.provider_id || null;
    const providerPlanId = req.body.providerPlanId || req.body.provider_plan_id || null;
    const serviceId = req.body.serviceId || req.body.service_id;

    if (!networkOrBiller || !planName || !amount) {
      res.status(400).json({ success: false, message: 'Network/Biller, plan name and amount are required' });
      return;
    }

    const id = 'pln_' + crypto.randomBytes(6).toString('hex');
    const actualServiceId = serviceId || (networkOrBiller.includes('MTN') || networkOrBiller.includes('AIRTEL') || networkOrBiller.includes('GLO') || networkOrBiller.includes('9MOBILE') ? 'srv_data' : 'srv_airtime');

    db.prepare(`
      INSERT INTO service_plans (
        id, service_id, network_or_biller, plan_name, plan_code, amount, validity,
        routing_type, sim_slot_id, ussd_template, is_available,
        data_type, plan_size, buying_price, reseller_price, api_price, provider_id, provider_plan_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      actualServiceId,
      networkOrBiller,
      planName,
      planCode || `${networkOrBiller}-${planSize || '1GB'}`,
      Number(amount),
      validity,
      routingType,
      simSlotId,
      ussdTemplate,
      dataType,
      planSize,
      buyingPrice !== undefined ? Number(buyingPrice) : Number(amount) * 0.95,
      resellerPrice !== undefined ? Number(resellerPrice) : Number(amount) * 0.98,
      apiPrice !== undefined ? Number(apiPrice) : Number(amount) * 0.96,
      providerId,
      providerPlanId
    );

    res.json({ success: true, message: 'Plan created successfully', id });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Update Service/Data Plan
 */
router.put('/plans/:id', authenticate, requirePermission('MANAGE_PLANS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const planName = req.body.planName || req.body.plan_name;
    const amount = req.body.amount || req.body.selling_price || req.body.sellingPrice;
    const validity = req.body.validity || req.body.validity_days;
    const dataType = req.body.dataType || req.body.data_type;
    const planSize = req.body.planSize || req.body.plan_size;
    const buyingPrice = req.body.buyingPrice ?? req.body.buying_price;
    const resellerPrice = req.body.resellerPrice ?? req.body.reseller_price;
    const apiPrice = req.body.apiPrice ?? req.body.api_price;
    const routingType = req.body.routingType || req.body.routing_type;
    const simSlotId = req.body.simSlotId || req.body.sim_slot_id;
    const ussdTemplate = req.body.ussdTemplate || req.body.ussd_template;
    const isAvailable = req.body.isAvailable ?? req.body.is_available;
    const providerId = req.body.providerId || req.body.provider_id;
    const providerPlanId = req.body.providerPlanId || req.body.provider_plan_id;

    db.prepare(`
      UPDATE service_plans
      SET plan_name = COALESCE(?, plan_name),
          amount = COALESCE(?, amount),
          validity = COALESCE(?, validity),
          data_type = COALESCE(?, data_type),
          plan_size = COALESCE(?, plan_size),
          buying_price = COALESCE(?, buying_price),
          reseller_price = COALESCE(?, reseller_price),
          api_price = COALESCE(?, api_price),
          routing_type = COALESCE(?, routing_type),
          sim_slot_id = COALESCE(?, sim_slot_id),
          ussd_template = COALESCE(?, ussd_template),
          is_available = COALESCE(?, is_available),
          provider_id = COALESCE(?, provider_id),
          provider_plan_id = COALESCE(?, provider_plan_id)
      WHERE id = ?
    `).run(
      planName ?? null,
      amount !== undefined ? Number(amount) : null,
      validity ?? null,
      dataType ?? null,
      planSize ?? null,
      buyingPrice !== undefined ? Number(buyingPrice) : null,
      resellerPrice !== undefined ? Number(resellerPrice) : null,
      apiPrice !== undefined ? Number(apiPrice) : null,
      routingType ?? null,
      simSlotId ?? null,
      ussdTemplate ?? null,
      isAvailable !== undefined ? (isAvailable ? 1 : 0) : null,
      providerId ?? null,
      providerPlanId ?? null,
      id
    );

    res.json({ success: true, message: 'Plan updated successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Delete Service/Data Plan
 */
router.delete('/plans/:id', authenticate, requirePermission('MANAGE_PLANS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM service_plans WHERE id = ?').run(id);
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Bulk Adjust Data Prices across the whole system
 */
router.post('/plans/bulk-adjust', authenticate, requirePermission('MANAGE_PLANS'), (req: Request, res: Response): void => {
  try {
    const { network, dataType, targetField, adjustmentType, value } = req.body;
    if (value === undefined || isNaN(Number(value))) {
      res.status(400).json({ success: false, message: 'Adjustment value is required' });
      return;
    }

    const numVal = Number(value);
    const target = targetField || 'all_prices';
    const isPercent = adjustmentType === 'PERCENTAGE';

    let filterClause = '1=1';
    const params: any[] = [];
    if (network && network !== 'ALL') {
      filterClause += ' AND network_or_biller = ?';
      params.push(network);
    }
    if (dataType && dataType !== 'ALL') {
      filterClause += ' AND data_type = ?';
      params.push(dataType);
    }

    const matchingPlans = db.prepare(`SELECT * FROM service_plans WHERE ${filterClause}`).all(...params) as any[];

    if (matchingPlans.length === 0) {
      res.status(400).json({ success: false, message: 'No plans found matching the selected network and data type' });
      return;
    }

    const updateStmt = db.prepare(`
      UPDATE service_plans
      SET amount = ?,
          reseller_price = ?,
          api_price = ?
      WHERE id = ?
    `);

    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      for (const p of matchingPlans) {
        let newAmount = p.amount;
        let newReseller = p.reseller_price || Math.round(p.amount * 0.96);
        let newApi = p.api_price || Math.round(p.amount * 0.95);

        if (target === 'amount' || target === 'all_prices') {
          newAmount = isPercent ? Math.round(p.amount * (1 + numVal / 100)) : Math.max(10, Math.round(p.amount + numVal));
        }
        if (target === 'reseller_price' || target === 'all_prices') {
          newReseller = isPercent ? Math.round(newReseller * (1 + numVal / 100)) : Math.max(10, Math.round(newReseller + numVal));
        }
        if (target === 'api_price' || target === 'all_prices') {
          newApi = isPercent ? Math.round(newApi * (1 + numVal / 100)) : Math.max(10, Math.round(newApi + numVal));
        }

        updateStmt.run(newAmount, newReseller, newApi, p.id);
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    res.json({
      success: true,
      message: `Successfully adjusted prices for ${matchingPlans.length} data plans across the system!`,
      count: matchingPlans.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Public: Get Published Testimonials for Landing Page
 */
router.get('/testimonials', (req: Request, res: Response): void => {
  try {
    const testimonials = db.prepare(`
      SELECT id, author_name, author_role, rating, content, avatar_url, sort_order, created_at
      FROM testimonials
      WHERE is_published = 1
      ORDER BY sort_order ASC, created_at DESC
    `).all();
    res.json({ success: true, testimonials });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// WEBSITE CMS CONTENT MANAGEMENT
// ==========================================

/**
 * Public: Get All Published CMS Sections
 */
router.get('/cms', (req: Request, res: Response): void => {
  try {
    const sections = db.prepare(`
      SELECT id, title, content_json, version, updated_at
      FROM cms_sections
      WHERE is_published = 1
    `).all() as any[];

    const formatted = sections.reduce((acc, row) => {
      try {
        acc[row.id] = {
          title: row.title,
          content: JSON.parse(row.content_json),
          version: row.version,
          updated_at: row.updated_at
        };
      } catch {
        acc[row.id] = { title: row.title, content: row.content_json };
      }
      return acc;
    }, {});

    res.json({ success: true, sections: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Get All CMS Sections (including drafts and versions)
 */
router.get('/admin/cms', authenticate, requirePermission('MANAGE_SETTINGS'), (req: Request, res: Response): void => {
  try {
    const sections = db.prepare(`
      SELECT id, title, content_json, draft_json, is_published, version, updated_by, updated_at
      FROM cms_sections
      ORDER BY id ASC
    `).all() as any[];

    const parsed = sections.map(s => {
      let content = null;
      let draft = null;
      try { content = JSON.parse(s.content_json); } catch { content = s.content_json; }
      if (s.draft_json) {
        try { draft = JSON.parse(s.draft_json); } catch { draft = s.draft_json; }
      }
      return { ...s, content, draft };
    });

    res.json({ success: true, sections: parsed });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Get CMS Section Revision History
 */
router.get('/admin/cms/:id/revisions', authenticate, requirePermission('MANAGE_SETTINGS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const revisions = db.prepare(`
      SELECT id, section_id, version, content_json, created_by, notes, created_at
      FROM cms_revisions
      WHERE section_id = ?
      ORDER BY version DESC
      LIMIT 20
    `).all(id) as any[];

    const parsed = revisions.map(r => {
      try {
        return { ...r, content: JSON.parse(r.content_json) };
      } catch {
        return r;
      }
    });

    res.json({ success: true, revisions: parsed });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Update CMS Section (Draft or Published)
 */
router.put('/admin/cms/:id', authenticate, requirePermission('MANAGE_SETTINGS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { title, content, isDraft, notes } = req.body;
    const actorEmail = (req as any).user?.email || 'admin';
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT * FROM cms_sections WHERE id = ?').get(id) as any;
    if (!existing) {
      res.status(404).json({ success: false, message: `CMS section ${id} not found` });
      return;
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    if (isDraft) {
      // Save as draft without publishing
      db.prepare(`
        UPDATE cms_sections
        SET title = COALESCE(?, title),
            draft_json = ?,
            updated_by = ?,
            updated_at = ?
        WHERE id = ?
      `).run(title || null, contentStr, actorEmail, now, id);

      res.json({ success: true, message: 'Draft saved successfully' });
      return;
    }

    // Publish: Archive existing version into cms_revisions first
    const newVersion = (existing.version || 1) + 1;
    const revId = `rev_${id}_v${existing.version}_${Date.now()}`;

    db.prepare(`
      INSERT INTO cms_revisions (id, section_id, version, content_json, created_by, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(revId, id, existing.version, existing.content_json, existing.updated_by || 'system', notes || `Archived prior to v${newVersion}`, now);

    // Update section with newly published content and clear draft
    db.prepare(`
      UPDATE cms_sections
      SET title = COALESCE(?, title),
          content_json = ?,
          draft_json = NULL,
          is_published = 1,
          version = ?,
          updated_by = ?,
          updated_at = ?
      WHERE id = ?
    `).run(title || null, contentStr, newVersion, actorEmail, now, id);

    res.json({ success: true, message: `CMS section published successfully (v${newVersion})`, version: newVersion });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Rollback CMS Section to Previous Revision
 */
router.post('/admin/cms/:id/rollback', authenticate, requirePermission('MANAGE_SETTINGS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { revisionId, version } = req.body;
    const actorEmail = (req as any).user?.email || 'admin';
    const now = new Date().toISOString();

    let revision: any = null;
    if (revisionId) {
      revision = db.prepare('SELECT * FROM cms_revisions WHERE id = ? AND section_id = ?').get(revisionId, id);
    } else if (version) {
      revision = db.prepare('SELECT * FROM cms_revisions WHERE section_id = ? AND version = ? ORDER BY created_at DESC LIMIT 1').get(id, version);
    }

    if (!revision) {
      res.status(404).json({ success: false, message: 'Revision record not found for rollback' });
      return;
    }

    const current = db.prepare('SELECT * FROM cms_sections WHERE id = ?').get(id) as any;
    const newVersion = (current?.version || 1) + 1;

    // Archive current before rolling back
    db.prepare(`
      INSERT INTO cms_revisions (id, section_id, version, content_json, created_by, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(`rev_${id}_pre_rollback_${Date.now()}`, id, current.version, current.content_json, actorEmail, `Pre-rollback snapshot before restoring v${revision.version}`, now);

    // Apply rollback content
    db.prepare(`
      UPDATE cms_sections
      SET content_json = ?,
          draft_json = NULL,
          is_published = 1,
          version = ?,
          updated_by = ?,
          updated_at = ?
      WHERE id = ?
    `).run(revision.content_json, newVersion, actorEmail, now, id);

    res.json({ success: true, message: `Rolled back to revision v${revision.version} (now v${newVersion})`, version: newVersion });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// MAINTENANCE MANAGEMENT & CONTROL
// ==========================================

/**
 * Admin: Get Maintenance Configuration & History
 */
router.get('/admin/maintenance', authenticate, requirePermission('MANAGE_SETTINGS'), (req: Request, res: Response): void => {
  try {
    const settings = db.prepare(`
      SELECT maintenance_mode, maintenance_scope, maintenance_message,
             maintenance_start_time, maintenance_end_time, maintenance_bypass_ips
      FROM system_settings
      LIMIT 1
    `).get() as any;

    const history = db.prepare(`
      SELECT id, action, scope, message, start_time, end_time, created_by, created_at
      FROM maintenance_logs
      ORDER BY created_at DESC
      LIMIT 25
    `).all();

    res.json({
      success: true,
      config: {
        active: Boolean(settings?.maintenance_mode),
        scope: settings?.maintenance_scope || 'all',
        message: settings?.maintenance_message || '',
        startTime: settings?.maintenance_start_time || '',
        endTime: settings?.maintenance_end_time || '',
        bypassIps: settings?.maintenance_bypass_ips || ''
      },
      history
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Update Maintenance Configuration & Schedule
 */
router.post('/admin/maintenance', authenticate, requirePermission('MANAGE_SETTINGS'), (req: Request, res: Response): void => {
  try {
    const { active, scope, message, startTime, endTime, bypassIps } = req.body;
    const actorEmail = (req as any).user?.email || 'admin';
    const now = new Date().toISOString();

    const modeInt = active ? 1 : 0;
    const finalScope = scope || 'all';
    const finalMsg = message || 'System undergoing scheduled maintenance. Services will resume shortly.';

    db.prepare(`
      UPDATE system_settings
      SET maintenance_mode = ?,
          maintenance_scope = ?,
          maintenance_message = ?,
          maintenance_start_time = ?,
          maintenance_end_time = ?,
          maintenance_bypass_ips = ?,
          updated_at = ?
    `).run(modeInt, finalScope, finalMsg, startTime || '', endTime || '', bypassIps || '', now);

    // Record in maintenance logs
    db.prepare(`
      INSERT INTO maintenance_logs (id, action, scope, message, start_time, end_time, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `maint_${Date.now()}`,
      active ? 'ENABLED' : 'DISABLED',
      finalScope,
      finalMsg,
      startTime || null,
      endTime || null,
      actorEmail,
      now
    );

    res.json({
      success: true,
      message: active ? `Maintenance mode activated with scope [${finalScope}]` : 'Maintenance mode deactivated (Platform Live)'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// MOBILE APP REMOTE CONFIG & TELEMETRY
// ==========================================

/**
 * Public: Get Mobile Remote Config (Used by React Native / Mobile App)
 */
router.get('/mobile-config', (req: Request, res: Response): void => {
  try {
    const cfg = db.prepare('SELECT * FROM mobile_app_config LIMIT 1').get() as any;
    if (!cfg) {
      res.json({
        success: true,
        config: {
          appName: 'ABK Data Mobile',
          androidMinVersion: '1.0.0',
          androidLatestVersion: '1.0.0',
          iosMinVersion: '1.0.0',
          iosLatestVersion: '1.0.0',
          forceUpdate: false,
          maintenanceMode: false
        }
      });
      return;
    }

    res.json({
      success: true,
      config: {
        appName: cfg.app_name,
        branding: JSON.parse(cfg.branding_json || '{}'),
        banners: JSON.parse(cfg.banner_json || '[]'),
        android: {
          minVersion: cfg.android_min_version,
          latestVersion: cfg.android_latest_version,
          storeUrl: cfg.play_store_url
        },
        ios: {
          minVersion: cfg.ios_min_version,
          latestVersion: cfg.ios_latest_version,
          storeUrl: cfg.app_store_url
        },
        forceUpdate: Boolean(cfg.force_update),
        updateTitle: cfg.update_title,
        updateNotes: cfg.update_notes,
        servicesEnabled: JSON.parse(cfg.services_enabled_json || '["data","airtime","electricity","cable","solar","exam"]'),
        maintenanceMode: Boolean(cfg.maintenance_mode),
        maintenanceMessage: cfg.maintenance_message
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Get Mobile Remote Config Details
 */
router.get('/admin/mobile-config', authenticate, requirePermission('MANAGE_SETTINGS'), (req: Request, res: Response): void => {
  try {
    const cfg = db.prepare('SELECT * FROM mobile_app_config LIMIT 1').get() as any;
    res.json({ success: true, config: cfg });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Update Mobile Remote Config
 */
router.put('/admin/mobile-config', authenticate, requirePermission('MANAGE_SETTINGS'), (req: Request, res: Response): void => {
  try {
    const {
      appName, branding, banners,
      androidMinVersion, androidLatestVersion,
      iosMinVersion, iosLatestVersion,
      forceUpdate, updateTitle, updateNotes,
      playStoreUrl, appStoreUrl,
      servicesEnabled, maintenanceMode, maintenanceMessage
    } = req.body;
    const actorEmail = (req as any).user?.email || 'admin';
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE mobile_app_config
      SET app_name = COALESCE(?, app_name),
          branding_json = COALESCE(?, branding_json),
          banner_json = COALESCE(?, banner_json),
          android_min_version = COALESCE(?, android_min_version),
          android_latest_version = COALESCE(?, android_latest_version),
          ios_min_version = COALESCE(?, ios_min_version),
          ios_latest_version = COALESCE(?, ios_latest_version),
          force_update = COALESCE(?, force_update),
          update_title = COALESCE(?, update_title),
          update_notes = COALESCE(?, update_notes),
          play_store_url = COALESCE(?, play_store_url),
          app_store_url = COALESCE(?, app_store_url),
          services_enabled_json = COALESCE(?, services_enabled_json),
          maintenance_mode = COALESCE(?, maintenance_mode),
          maintenance_message = COALESCE(?, maintenance_message),
          updated_by = ?,
          updated_at = ?
    `).run(
      appName || null,
      branding ? (typeof branding === 'string' ? branding : JSON.stringify(branding)) : null,
      banners ? (typeof banners === 'string' ? banners : JSON.stringify(banners)) : null,
      androidMinVersion || null,
      androidLatestVersion || null,
      iosMinVersion || null,
      iosLatestVersion || null,
      forceUpdate !== undefined ? (forceUpdate ? 1 : 0) : null,
      updateTitle || null,
      updateNotes || null,
      playStoreUrl || null,
      appStoreUrl || null,
      servicesEnabled ? (typeof servicesEnabled === 'string' ? servicesEnabled : JSON.stringify(servicesEnabled)) : null,
      maintenanceMode !== undefined ? (maintenanceMode ? 1 : 0) : null,
      maintenanceMessage !== undefined ? maintenanceMessage : null,
      actorEmail,
      now
    );

    res.json({ success: true, message: 'Mobile remote configuration updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Public: Record Mobile Telemetry Event
 */
router.post('/mobile-telemetry', (req: Request, res: Response): void => {
  try {
    const { platform, appVersion, deviceModel, osVersion, eventType, details } = req.body;
    if (!platform || !appVersion || !eventType) {
      res.status(400).json({ success: false, message: 'Missing required telemetry fields' });
      return;
    }

    db.prepare(`
      INSERT INTO mobile_telemetry (id, platform, app_version, device_model, os_version, event_type, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `tel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      platform,
      appVersion,
      deviceModel || 'Unknown Device',
      osVersion || 'Unknown OS',
      eventType,
      details ? JSON.stringify(details) : null,
      new Date().toISOString()
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Get Mobile Telemetry Analytics
 */
router.get('/admin/mobile-telemetry', authenticate, requirePermission('VIEW_STATS'), (req: Request, res: Response): void => {
  try {
    const totalEvents = (db.prepare('SELECT COUNT(*) as count FROM mobile_telemetry').get() as any)?.count || 0;
    const crashes = (db.prepare("SELECT COUNT(*) as count FROM mobile_telemetry WHERE event_type = 'CRASH'").get() as any)?.count || 0;
    const androidUsers = (db.prepare("SELECT COUNT(*) as count FROM mobile_telemetry WHERE platform = 'android'").get() as any)?.count || 0;
    const iosUsers = (db.prepare("SELECT COUNT(*) as count FROM mobile_telemetry WHERE platform = 'ios'").get() as any)?.count || 0;

    const recentLogs = db.prepare(`
      SELECT id, platform, app_version, device_model, os_version, event_type, details_json, created_at
      FROM mobile_telemetry
      ORDER BY created_at DESC
      LIMIT 50
    `).all();

    res.json({
      success: true,
      analytics: {
        totalEvents,
        crashes,
        androidUsers,
        iosUsers,
        recentLogs
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
