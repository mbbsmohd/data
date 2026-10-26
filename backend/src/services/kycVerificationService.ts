import crypto from 'crypto';
import { db } from '../database/index.js';
import { NotificationService } from './notificationService.js';
import { NOTIFICATION_EVENTS } from '../config/index.js';

export class KYCVerificationService {
  /**
   * Get Verification Tasks by Status (Matching Screenshot 3)
   */
  static getTasks(status?: string, search?: string) {
    let sql = 'SELECT * FROM kyc_verifications';
    const params: any[] = [];
    const conditions: string[] = [];

    if (status && status !== 'ALL') {
      conditions.push('status = ?');
      params.push(status.toUpperCase());
    }

    if (search) {
      conditions.push('(subject_name LIKE ? OR registration_or_id_number LIKE ? OR location LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC LIMIT 100';
    const rawTasks = db.prepare(sql).all(...params) as any[];

    // Mask sensitive identity registration/BVN/NIN numbers to prevent identity theft
    const tasks = rawTasks.map(t => ({
      ...t,
      registration_or_id_number: t.registration_or_id_number && t.registration_or_id_number.length > 6
        ? `${t.registration_or_id_number.slice(0, 3)}****${t.registration_or_id_number.slice(-3)}`
        : t.registration_or_id_number
    }));

    // Calculate pill counts matching Screenshot 3
    const counts = {
      pending: (db.prepare("SELECT COUNT(*) as count FROM kyc_verifications WHERE status = 'PENDING'").get() as any).count,
      completed: (db.prepare("SELECT COUNT(*) as count FROM kyc_verifications WHERE status = 'COMPLETED'").get() as any).count,
      cancelled: (db.prepare("SELECT COUNT(*) as count FROM kyc_verifications WHERE status = 'CANCELLED'").get() as any).count,
      pendingApproval: (db.prepare("SELECT COUNT(*) as count FROM kyc_verifications WHERE status = 'PENDING_APPROVAL'").get() as any).count,
      rejected: (db.prepare("SELECT COUNT(*) as count FROM kyc_verifications WHERE status = 'REJECTED'").get() as any).count,
    };

    return { tasks, counts };
  }

  /**
   * Submit new verification task (e.g. CAC, NIN, BVN)
   */
  static submitTask(userId: string, taskType: string, subjectName: string, regNumber: string, location: string, documentUrl?: string) {
    const id = 'kyc_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const dateAssigned = now.split('T')[0];

    db.prepare(`
      INSERT INTO kyc_verifications (
        id, user_id, task_type, subject_name, registration_or_id_number, location,
        document_url, status, date_assigned, tat_countdown_hours, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', ?, 24, ?, ?)
    `).run(
      id,
      userId,
      taskType,
      subjectName,
      regNumber,
      location,
      documentUrl || '',
      dateAssigned,
      now,
      now
    );

    // Update user status
    db.prepare("UPDATE users SET status = 'pending_verification' WHERE id = ?").run(userId);

    NotificationService.dispatch({
      userId,
      eventType: NOTIFICATION_EVENTS.KYC_TASK_STATUS_UPDATED,
      title: 'Verification Task Submitted',
      message: `Your ${taskType} document verification has been submitted and assigned for review (TAT: 24h).`,
      metadata: { taskId: id, taskType, subjectName }
    });

    return { id, taskType, subjectName, status: 'PENDING_APPROVAL', dateAssigned };
  }

  /**
   * Admin Review Task (Approve, Reject, or Cancel)
   */
  static reviewTask(taskId: string, reviewerEmail: string, decision: 'COMPLETED' | 'REJECTED' | 'CANCELLED', reason?: string) {
    const task = db.prepare('SELECT * FROM kyc_verifications WHERE id = ?').get(taskId) as any;
    if (!task) throw new Error('Task not found');

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE kyc_verifications
      SET status = ?, rejection_reason = ?, reviewed_by = ?, tat_countdown_hours = 0, updated_at = ?
      WHERE id = ?
    `).run(decision, reason || null, reviewerEmail, now, taskId);

    if (decision === 'COMPLETED') {
      // Upgrade user to Tier 3 (Merchant / Agent)
      db.prepare("UPDATE users SET tier = 3, status = 'active' WHERE id = ?").run(task.user_id);
    } else if (decision === 'REJECTED') {
      db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(task.user_id);
    }

    NotificationService.dispatch({
      userId: task.user_id,
      eventType: NOTIFICATION_EVENTS.KYC_TASK_STATUS_UPDATED,
      title: `Verification Task ${decision}`,
      message: decision === 'COMPLETED'
        ? `Congratulations! Your ${task.task_type} verification was approved. Your account is now Tier 3 Verified.`
        : `Your ${task.task_type} verification was ${decision.toLowerCase()}: ${reason || 'Document requirements not met.'}`,
      metadata: { taskId, decision, reason }
    });

    return { success: true, taskId, decision };
  }
}
