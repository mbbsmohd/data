import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';
import { db } from '../database/index.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

/**
 * Get current user notifications
 */
router.get('/', authenticate, (req: Request, res: Response): void => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const notifications = NotificationService.getUserNotifications(req.user!.id, limit);
    const unreadCount = NotificationService.getUnreadCount(req.user!.id);
    res.json({ success: true, notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Mark notification as read
 */
router.post('/mark-read/:id', authenticate, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    NotificationService.markAsRead(id, req.user!.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Mark all as read
 */
router.post('/mark-all-read', authenticate, (req: Request, res: Response): void => {
  try {
    NotificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Get all 33 event notification templates
 */
router.get('/templates', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const templates = db.prepare('SELECT * FROM notification_templates ORDER BY event_key ASC').all();
    res.json({ success: true, templates });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Update template
 */
router.post('/templates/:id', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { subject, htmlTemplate, smsTemplate } = req.body;
    db.prepare(`
      UPDATE notification_templates
      SET subject = ?, html_template = ?, sms_template = ?
      WHERE id = ?
    `).run(subject, htmlTemplate, smsTemplate, id);

    res.json({ success: true, message: 'Notification template updated' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Customer Support: Get User Tickets
 */
router.get('/tickets', authenticate, (req: Request, res: Response): void => {
  try {
    const isStaff = req.user!.role === 'super_admin' || req.user!.role === 'sub_admin';
    const query = isStaff
      ? `SELECT st.*, u.name as user_name, u.phone as user_phone, u.email as user_email
         FROM support_tickets st
         JOIN users u ON st.user_id = u.id
         ORDER BY st.created_at DESC`
      : `SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`;

    const tickets = isStaff
      ? db.prepare(query).all()
      : db.prepare(query).all(req.user!.id);

    res.json({ success: true, tickets });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Customer Support: Create New Ticket
 */
router.post('/tickets', authenticate, (req: Request, res: Response): void => {
  try {
    const { subject, category, priority, message } = req.body;
    if (!subject || !category || !message) {
      res.status(400).json({ success: false, message: 'Subject, category, and message are required' });
      return;
    }

    const ticketId = 'tkt_' + Math.random().toString(36).substring(2, 10);
    const ticketNum = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO support_tickets (id, user_id, ticket_number, subject, category, priority, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
    `).run(ticketId, req.user!.id, ticketNum, subject, category, priority || 'MEDIUM', now, now);

    // Initial message in ticket_replies
    db.prepare(`
      INSERT INTO ticket_replies (id, ticket_id, sender_id, sender_type, message, created_at)
      VALUES (?, ?, ?, 'USER', ?, ?)
    `).run('rep_' + Math.random().toString(36).substring(2, 10), ticketId, req.user!.id, message, now);

    res.json({ success: true, message: 'Support ticket opened successfully', ticketNumber: ticketNum, ticketId });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Customer Support: Get Ticket Details with Replies
 */
router.get('/tickets/:id', authenticate, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const isStaff = req.user!.role === 'super_admin' || req.user!.role === 'sub_admin';

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id) as any;
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    if (!isStaff && ticket.user_id !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Unauthorized to view this ticket' });
      return;
    }

    const replies = db.prepare('SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC').all(id);
    res.json({ success: true, ticket, replies });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Customer Support: Reply to Ticket
 */
router.post('/tickets/:id/reply', authenticate, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
      return;
    }

    const isStaff = req.user!.role === 'super_admin' || req.user!.role === 'sub_admin';
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO ticket_replies (id, ticket_id, sender_id, sender_type, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('rep_' + Math.random().toString(36).substring(2, 10), id, req.user!.id, isStaff ? 'STAFF' : 'USER', message, now);

    db.prepare('UPDATE support_tickets SET updated_at = ? WHERE id = ?').run(now, id);

    res.json({ success: true, message: 'Reply added successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
