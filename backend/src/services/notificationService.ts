import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { db } from '../database/index.js';
import { CONFIG, NOTIFICATION_EVENTS, NotificationEventType } from '../config/index.js';

export interface DispatchNotificationOptions {
  userId: string;
  eventType: NotificationEventType;
  title: string;
  message: string;
  amount?: number;
  reference?: string;
  metadata?: Record<string, any>;
  channels?: ('EMAIL' | 'IN_APP' | 'PUSH' | 'SMS')[];
}

export class NotificationService {
  /**
   * Helper to build nodemailer transporter from settings or environment
   */
  static getTransporter() {
    try {
      const settings = db.prepare('SELECT * FROM system_settings LIMIT 1').get() as any;
      if (settings && settings.smtp_host && settings.smtp_user) {
        return {
          transporter: nodemailer.createTransport({
            host: settings.smtp_host,
            port: Number(settings.smtp_port) || 587,
            secure: Boolean(settings.smtp_secure),
            auth: {
              user: settings.smtp_user,
              pass: settings.smtp_pass || ''
            },
            tls: {
              rejectUnauthorized: false
            }
          }),
          from: `"${settings.smtp_from_name || settings.app_name || 'Bukar Data Sub'}" <${settings.smtp_from_email || settings.support_email || 'noreply@bukardatasub.com'}>`
        };
      }
    } catch (e) {
      console.error('Error creating SMTP transporter:', e);
    }
    return null;
  }

  /**
   * Send test SMTP email to verify configuration
   */
  static async testSmtpConnection(targetEmail: string, customConfig?: any) {
    let transportConfig: any;
    let fromAddress = '"Bukar Data Sub Test Desk" <test@bukardatasub.com>';

    const host = customConfig?.smtpHost || customConfig?.host;
    const user = customConfig?.smtpUser || customConfig?.user;
    const port = Number(customConfig?.smtpPort || customConfig?.port) || 587;
    const pass = customConfig?.smtpPass || customConfig?.pass || '';
    const secure = Boolean(customConfig?.smtpSecure ?? customConfig?.secure);
    const fromName = customConfig?.smtpFromName || customConfig?.fromName || 'Bukar Data Sub';
    const fromEmail = customConfig?.smtpFromEmail || customConfig?.fromEmail || 'noreply@bukardatasub.com';

    if (host && user) {
      transportConfig = {
        host,
        port,
        secure,
        auth: {
          user,
          pass
        },
        tls: { rejectUnauthorized: false }
      };
      fromAddress = `"${fromName}" <${fromEmail}>`;
    } else {
      const active = this.getTransporter();
      if (!active) {
        throw new Error('SMTP host and username must be configured first');
      }
      return await active.transporter.sendMail({
        from: active.from,
        to: targetEmail,
        subject: '✅ SMTP Configuration Test - Real Email Working!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px;">
            <h2 style="color: #1E40AF; margin-top: 0;">SMTP Email Verified!</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">This test confirms that your outbound SMTP email server is live, verified, and sending production emails successfully.</p>
            <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 12px; padding: 12px; margin-top: 16px;">
              <span style="font-size: 13px; font-weight: bold; color: #166534;">Delivered to: ${targetEmail}</span><br>
              <span style="font-size: 12px; color: #4B5563;">Timestamp: ${new Date().toISOString()}</span>
            </div>
          </div>
        `
      });
    }

    const testTransporter = nodemailer.createTransport(transportConfig);
    const info = await testTransporter.sendMail({
      from: fromAddress,
      to: targetEmail,
      subject: '✅ SMTP Configuration Test - Real Email Working!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px;">
          <h2 style="color: #1E40AF; margin-top: 0;">SMTP Email Verified!</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.5;">This test confirms that your outbound SMTP email server is live, verified, and sending production emails successfully.</p>
          <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 12px; padding: 12px; margin-top: 16px;">
            <span style="font-size: 13px; font-weight: bold; color: #166534;">Delivered to: ${targetEmail}</span><br>
            <span style="font-size: 12px; color: #4B5563;">Timestamp: ${new Date().toISOString()}</span>
          </div>
        </div>
      `
    });

    return info;
  }

  /**
   * Dispatch multi-channel notification for any event in the 33-event catalogue
   */
  static async dispatch(options: DispatchNotificationOptions): Promise<{ id: string; success: boolean }> {
    const {
      userId,
      eventType,
      title,
      message,
      amount = 0,
      reference = 'N/A',
      metadata = {},
      channels = ['EMAIL', 'IN_APP']
    } = options;

    const safeRef = reference || 'N/A';
    const safeAmount = amount !== undefined ? amount.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00';
    const safeMetadata = metadata || {};
    const safeEventType = eventType || 'MFA_STATUS_CHANGED';

    const notifId = 'ntf_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    let userName = 'Valued Customer';
    let userEmail = '';
    let finalTitle = title;
    let finalHtml = message;

    try {
      // 1. Fetch user email and name for template rendering
      const user = db.prepare('SELECT id, name, email, phone FROM users WHERE id = ?').get(userId) as
        | { id: string; name: string; email: string; phone: string }
        | undefined;

      userName = user?.name || 'Valued Customer';
      userEmail = user?.email || '';

      // 2. Fetch template if available
      const template = db.prepare('SELECT subject, html_template, sms_template FROM notification_templates WHERE event_key = ?').get(safeEventType) as
        | { subject: string; html_template: string; sms_template: string }
        | undefined;

      if (template) {
        finalTitle = (template.subject || title)
          .replace(/{{name}}/g, userName)
          .replace(/{{reference}}/g, safeRef);

        finalHtml = (template.html_template || message)
          .replace(/{{name}}/g, userName)
          .replace(/{{message}}/g, message)
          .replace(/{{reference}}/g, safeRef)
          .replace(/{{amount}}/g, safeAmount)
          .replace(/{{status}}/g, safeMetadata.status || 'COMPLETED')
          .replace(/{{timestamp}}/g, new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }));
      }

      // 3. Store In-App Notification in DB
      db.prepare(`
        INSERT INTO notifications (
          id, user_id, event_type, title, message, channels, is_read, email_status, push_status, metadata_json, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 0, 'DELIVERED', 'SKIPPED', ?, ?)
      `).run(
        notifId,
        userId,
        safeEventType,
        finalTitle,
        message,
        channels.join(','),
        JSON.stringify({ ...safeMetadata, reference: safeRef, amount, renderedHtml: finalHtml }),
        now
      );
    } catch (err) {
      console.error('Notification dispatch preparation error:', err);
    }

    // Real email dispatch using configured SMTP (with graceful fallback log)
    if (channels.includes('EMAIL') && userEmail) {
      console.log(`[EMAIL DISPATCH] To: ${userEmail} | Event: ${eventType} | Subject: ${finalTitle}`);
      try {
        const mailSetup = this.getTransporter();
        if (mailSetup) {
          await mailSetup.transporter.sendMail({
            from: mailSetup.from,
            to: userEmail,
            subject: finalTitle,
            html: finalHtml
          });
          db.prepare('UPDATE notifications SET email_status = ? WHERE id = ?').run('SENT', notifId);
        }
      } catch (mailErr: any) {
        console.error(`[EMAIL ERROR] Failed to send email to ${userEmail}:`, mailErr.message);
        db.prepare('UPDATE notifications SET email_status = ? WHERE id = ?').run('FAILED', notifId);
      }
    }

    return { id: notifId, success: true };
  }

  /**
   * Get In-App Notifications for a user
   */
  static getUserNotifications(userId: string, limit = 20) {
    return db.prepare(`
      SELECT id, event_type, title, message, is_read, email_status, created_at, metadata_json
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);
  }

  /**
   * Get unread notifications count
   */
  static getUnreadCount(userId: string): number {
    const res = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId) as { count: number };
    return res ? res.count : 0;
  }

  /**
   * Mark notification as read
   */
  static markAsRead(notificationId: string, userId: string) {
    db.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE id = ? AND user_id = ?
    `).run(notificationId, userId);
  }

  /**
   * Mark all notifications as read
   */
  static markAllAsRead(userId: string) {
    db.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE user_id = ?
    `).run(userId);
  }
}
