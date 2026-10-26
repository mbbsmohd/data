import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../database/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * List Conversations
 * - Admin sees all customer conversations
 * - Customer sees their own conversation
 */
router.get('/conversations', authenticate, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const isAdmin = user.role === 'super_admin' || user.role === 'sub_admin';

    let conversations: any[];
    if (isAdmin) {
      conversations = db.prepare(`
        SELECT c.*, u.phone as user_phone, u.tier as user_tier, u.status as user_status
        FROM support_chat_conversations c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.updated_at DESC
      `).all();
    } else {
      conversations = db.prepare(`
        SELECT * FROM support_chat_conversations
        WHERE user_id = ?
        ORDER BY updated_at DESC
      `).all(user.id);
    }

    res.json({ success: true, conversations, isAdmin });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get or Create Active Conversation for Customer
 */
router.post('/conversations', authenticate, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const { subject } = req.body;
    const now = new Date().toISOString();

    // Check if open conversation already exists
    let existing = db.prepare(`
      SELECT * FROM support_chat_conversations
      WHERE user_id = ? AND status != 'CLOSED'
      ORDER BY updated_at DESC LIMIT 1
    `).get(user.id) as any;

    if (!existing) {
      const userRecord = db.prepare(`SELECT name, email FROM users WHERE id = ?`).get(user.id) as any;
      const convId = 'chat_conv_' + crypto.randomBytes(6).toString('hex');
      const initialSubject = subject || 'Live Customer Assistance';

      db.prepare(`
        INSERT INTO support_chat_conversations (
          id, user_id, user_name, user_email, subject, status,
          unread_admin_count, unread_user_count, last_message_text, last_message_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'OPEN', 0, 0, 'Conversation started', ?, ?, ?)
      `).run(
        convId,
        user.id,
        userRecord?.name || 'Customer',
        userRecord?.email || user.email,
        initialSubject,
        now,
        now,
        now
      );

      // Add system greeting message
      const msgId = 'msg_' + crypto.randomBytes(6).toString('hex');
      db.prepare(`
        INSERT INTO support_chat_messages (
          id, conversation_id, sender_id, sender_type, sender_name, message, is_internal_note, is_read, created_at
        ) VALUES (?, ?, 'system', 'SYSTEM', 'Support Assistant', 'Hello! Welcome to Bukar Data Sub 24/7 customer support. How can we help you today?', 0, 1, ?)
      `).run(msgId, convId, now);

      existing = db.prepare(`SELECT * FROM support_chat_conversations WHERE id = ?`).get(convId);
    }

    res.json({ success: true, conversation: existing });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get Messages for a Conversation
 */
router.get('/conversations/:id/messages', authenticate, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const isAdmin = user.role === 'super_admin' || user.role === 'sub_admin';

    // Verify access
    const conv = db.prepare(`SELECT * FROM support_chat_conversations WHERE id = ?`).get(id) as any;
    if (!conv) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    if (!isAdmin && conv.user_id !== user.id) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Customers must never see internal staff notes!
    let messages: any[];
    if (isAdmin) {
      messages = db.prepare(`
        SELECT * FROM support_chat_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
      `).all(id);

      // Reset admin unread count
      db.prepare(`UPDATE support_chat_conversations SET unread_admin_count = 0 WHERE id = ?`).run(id);
    } else {
      messages = db.prepare(`
        SELECT * FROM support_chat_messages
        WHERE conversation_id = ? AND is_internal_note = 0
        ORDER BY created_at ASC
      `).all(id);

      // Reset user unread count
      db.prepare(`UPDATE support_chat_conversations SET unread_user_count = 0 WHERE id = ?`).run(id);
    }

    res.json({ success: true, conversation: conv, messages });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Send Message in Conversation
 */
router.post('/conversations/:id/messages', authenticate, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { message, attachmentUrl, isInternalNote } = req.body;
    const user = (req as any).user;
    const isAdmin = user.role === 'super_admin' || user.role === 'sub_admin';

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, message: 'Message text is required' });
      return;
    }

    const conv = db.prepare(`SELECT * FROM support_chat_conversations WHERE id = ?`).get(id) as any;
    if (!conv) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    if (!isAdmin && conv.user_id !== user.id) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const userRecord = db.prepare(`SELECT name FROM users WHERE id = ?`).get(user.id) as any;
    const senderName = userRecord?.name || user.email;
    const senderType = isAdmin ? 'ADMIN' : 'USER';
    const isNote = Boolean(isAdmin && isInternalNote);
    const msgId = 'msg_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO support_chat_messages (
        id, conversation_id, sender_id, sender_type, sender_name, message, attachment_url, is_internal_note, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(msgId, id, user.id, senderType, senderName, message.trim(), attachmentUrl || null, isNote ? 1 : 0, now);

    // Update conversation metadata
    if (!isNote) {
      if (isAdmin) {
        db.prepare(`
          UPDATE support_chat_conversations
          SET last_message_text = ?,
              last_message_at = ?,
              unread_user_count = unread_user_count + 1,
              status = 'PENDING',
              updated_at = ?
          WHERE id = ?
        `).run(message.trim().slice(0, 80), now, now, id);
      } else {
        db.prepare(`
          UPDATE support_chat_conversations
          SET last_message_text = ?,
              last_message_at = ?,
              unread_admin_count = unread_admin_count + 1,
              status = 'OPEN',
              updated_at = ?
          WHERE id = ?
        `).run(message.trim().slice(0, 80), now, now, id);
      }
    }

    res.json({
      success: true,
      message: {
        id: msgId,
        conversation_id: id,
        sender_id: user.id,
        sender_type: senderType,
        sender_name: senderName,
        message: message.trim(),
        attachment_url: attachmentUrl || null,
        is_internal_note: isNote ? 1 : 0,
        created_at: now
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Update Conversation Status / Assignee / Notes (Admin Only)
 */
router.patch('/conversations/:id', authenticate, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { status, assignedTo, internalNotes } = req.body;
    const user = (req as any).user;
    const isAdmin = user.role === 'super_admin' || user.role === 'sub_admin';

    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Administrative privilege required' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];
    const now = new Date().toISOString();

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (assignedTo !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assignedTo);
    }
    if (internalNotes !== undefined) {
      updates.push('internal_notes = ?');
      params.push(internalNotes);
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(id);

    db.prepare(`UPDATE support_chat_conversations SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    res.json({ success: true, message: 'Conversation updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
