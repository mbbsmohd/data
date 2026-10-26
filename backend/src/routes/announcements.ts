import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../database/index.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

/**
 * Public & Customer: Get Active Dashboard Announcements (for SweetAlert display)
 */
router.get('/active', (req: Request, res: Response): void => {
  try {
    const now = new Date().toISOString();
    const announcements = db.prepare(`
      SELECT id, title, message, type, badge_text, duration_days, expires_at, target_audience, created_at,
             ROUND(MAX(0, (julianday(expires_at) - julianday('now')) * 24)) as hours_remaining,
             ROUND(MAX(0, julianday(expires_at) - julianday('now'))) as days_remaining
      FROM dashboard_announcements
      WHERE is_active = 1 AND expires_at > ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(now) as any[];

    res.json({
      success: true,
      announcements
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin & Sub-Admins: Get All Dashboard Announcements (Active & Expired)
 */
router.get('/admin', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const announcements = db.prepare(`
      SELECT id, title, message, type, badge_text, duration_days, expires_at, is_active,
             target_audience, created_by, created_at, updated_at,
             CASE WHEN expires_at > datetime('now') THEN 1 ELSE 0 END as is_currently_valid,
             ROUND(MAX(0, (julianday(expires_at) - julianday('now')) * 24)) as hours_remaining,
             ROUND(MAX(0, julianday(expires_at) - julianday('now'))) as days_remaining
      FROM dashboard_announcements
      ORDER BY created_at DESC
      LIMIT 100
    `).all() as any[];

    res.json({
      success: true,
      announcements
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Create and Publish New Announcement
 */
router.post('/admin', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const { title, message, type, badgeText, durationDays, targetAudience } = req.body;
    if (!title || !message) {
      res.status(400).json({ success: false, message: 'Title and message are required' });
      return;
    }

    const days = Math.max(1, Math.min(365, parseInt(durationDays || '7', 10)));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    const id = 'ann_' + crypto.randomBytes(6).toString('hex');
    const createdBy = (req as any).user?.name || (req as any).user?.email || 'Super Admin';
    const nowIso = now.toISOString();

    db.prepare(`
      INSERT INTO dashboard_announcements (
        id, title, message, type, badge_text, duration_days, expires_at, is_active,
        target_audience, created_by, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      message.trim(),
      type || 'info',
      badgeText ? badgeText.trim().toUpperCase() : 'ANNOUNCEMENT',
      days,
      expiresAt,
      targetAudience || 'all',
      createdBy,
      nowIso,
      nowIso
    );

    res.json({
      success: true,
      message: `Announcement published successfully! Active on customer dashboards for ${days} days.`,
      announcement: {
        id,
        title,
        message,
        type: type || 'info',
        durationDays: days,
        expiresAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Update Existing Announcement
 */
router.put('/admin/:id', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { title, message, type, badgeText, durationDays, isActive, targetAudience } = req.body;

    const existing = db.prepare('SELECT * FROM dashboard_announcements WHERE id = ?').get(id) as any;
    if (!existing) {
      res.status(404).json({ success: false, message: 'Announcement not found' });
      return;
    }

    let newExpiresAt = existing.expires_at;
    let newDuration = existing.duration_days;
    if (durationDays !== undefined) {
      const days = Math.max(1, Math.min(365, parseInt(durationDays, 10)));
      newDuration = days;
      newExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE dashboard_announcements
      SET title = COALESCE(?, title),
          message = COALESCE(?, message),
          type = COALESCE(?, type),
          badge_text = COALESCE(?, badge_text),
          duration_days = ?,
          expires_at = ?,
          is_active = COALESCE(?, is_active),
          target_audience = COALESCE(?, target_audience),
          updated_at = ?
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      message ? message.trim() : null,
      type ?? null,
      badgeText ? badgeText.trim().toUpperCase() : null,
      newDuration,
      newExpiresAt,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      targetAudience ?? null,
      nowIso,
      id
    );

    res.json({
      success: true,
      message: 'Announcement updated successfully'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Delete Announcement
 */
router.delete('/admin/:id', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM dashboard_announcements WHERE id = ?').run(id);
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
