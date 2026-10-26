/**
 * ==============================================================================
 * BUKAR DATA SUB — STAFF TASK ASSIGNMENT & OPERATIONAL DELEGATION ROUTER
 * ==============================================================================
 * Enables authorized administrators to create, assign, track, escalate,
 * and resolve operational tasks for sub-admins and support staff.
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../database/index.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { NotificationService } from '../services/notificationService.js';
import { NOTIFICATION_EVENTS } from '../config/index.js';

const router = Router();

// Apply admin authentication to all task routes
router.use(authenticate, requireRole('super_admin', 'sub_admin'));

/**
 * GET /api/admin/tasks
 * Filterable, paginated task list
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    const { status, priority, category, assigneeId, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = `SELECT * FROM staff_tasks WHERE 1=1`;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (priority && priority !== 'all') {
      query += ` AND priority = ?`;
      params.push(priority);
    }
    if (category && category !== 'all') {
      query += ` AND category = ?`;
      params.push(category);
    }
    if (assigneeId) {
      query += ` AND assigned_to_user_id = ?`;
      params.push(assigneeId);
    }
    if (search) {
      query += ` AND (title LIKE ? OR description LIKE ? OR task_id_display LIKE ? OR related_reference LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const totalRow = db.prepare(countQuery).get(...params) as { count: number };
    const total = totalRow?.count || 0;

    query += ` ORDER BY CASE priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, created_at DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const tasks = db.prepare(query).all(...params);

    // Summary counts for dashboard badges
    const statusCounts = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'ASSIGNED' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'WAITING_INFO' THEN 1 ELSE 0 END) as waiting_info,
        SUM(CASE WHEN status = 'PENDING_APPROVAL' THEN 1 ELSE 0 END) as pending_approval,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed
      FROM staff_tasks
    `).get() as any;

    res.json({
      success: true,
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      summary: statusCounts || { open: 0, assigned: 0, in_progress: 0, waiting_info: 0, resolved: 0, closed: 0 }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/tasks/staff/list
 * Returns sub-admins & staff available for assignment
 */
router.get('/staff/list', (req: Request, res: Response): void => {
  try {
    const staff = db.prepare(`
      SELECT id, name, email, role, sub_admin_role, status 
      FROM users 
      WHERE role IN ('super_admin', 'sub_admin') AND status = 'active'
      ORDER BY name ASC
    `).all();
    res.json({ success: true, staff });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/tasks/:id
 * Get single task details with comments thread
 */
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const task = db.prepare('SELECT * FROM staff_tasks WHERE id = ? OR task_id_display = ?').get(req.params.id, req.params.id) as any;
    if (!task) {
      res.status(404).json({ success: false, message: 'Staff task not found' });
      return;
    }

    const comments = db.prepare(`
      SELECT * FROM staff_task_comments 
      WHERE task_id = ? 
      ORDER BY created_at ASC
    `).all(task.id);

    res.json({ success: true, task, comments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/tasks
 * Create a new operational task
 */
router.post('/', (req: Request, res: Response): void => {
  try {
    const currentUser = (req as any).user;
    const {
      title,
      description,
      category = 'GENERAL',
      priority = 'MEDIUM',
      assignedToUserId,
      dueDate,
      relatedUserId,
      relatedReference
    } = req.body;

    if (!title || !description) {
      res.status(400).json({ success: false, message: 'Task title and description are required' });
      return;
    }

    // Determine sequential task display identifier (e.g. TSK-1001)
    const countRow = db.prepare('SELECT COUNT(*) as count FROM staff_tasks').get() as { count: number };
    const taskIndex = (countRow?.count || 0) + 1001;
    const taskIdDisplay = `TSK-${taskIndex}`;
    const taskId = 'tsk_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    let assignedToName: string | null = null;
    let initialStatus = 'OPEN';

    if (assignedToUserId) {
      const assignee = db.prepare('SELECT name FROM users WHERE id = ?').get(assignedToUserId) as any;
      if (assignee) {
        assignedToName = assignee.name;
        initialStatus = 'ASSIGNED';
      }
    }

    db.prepare(`
      INSERT INTO staff_tasks (
        id, task_id_display, title, description, category, priority,
        assigned_to_user_id, assigned_to_name, created_by_user_id, created_by_name,
        due_date, status, related_user_id, related_reference, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      taskIdDisplay,
      title,
      description,
      category,
      priority,
      assignedToUserId || null,
      assignedToName,
      currentUser.id,
      currentUser.name || 'Administrator',
      dueDate || null,
      initialStatus,
      relatedUserId || null,
      relatedReference || null,
      now,
      now
    );

    // If assigned to a staff member, dispatch notification
    if (assignedToUserId) {
      NotificationService.dispatch({
        userId: assignedToUserId,
        eventType: NOTIFICATION_EVENTS.SECURITY_ALERT,
        title: `New Task Assignment: ${taskIdDisplay}`,
        message: `You have been assigned to task ${taskIdDisplay} (${title}). Priority: ${priority}.`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Operational task created successfully',
      taskId,
      taskIdDisplay
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/admin/tasks/:id
 * Update task attributes or reassign
 */
router.put('/:id', (req: Request, res: Response): void => {
  try {
    const task = db.prepare('SELECT * FROM staff_tasks WHERE id = ?').get(req.params.id) as any;
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const {
      title,
      description,
      category,
      priority,
      assignedToUserId,
      dueDate,
      relatedReference
    } = req.body;

    let assignedToName = task.assigned_to_name;
    let newStatus = task.status;

    if (assignedToUserId && assignedToUserId !== task.assigned_to_user_id) {
      const assignee = db.prepare('SELECT name FROM users WHERE id = ?').get(assignedToUserId) as any;
      if (assignee) {
        assignedToName = assignee.name;
        if (task.status === 'OPEN') newStatus = 'ASSIGNED';
      }
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE staff_tasks
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          priority = COALESCE(?, priority),
          assigned_to_user_id = ?,
          assigned_to_name = ?,
          due_date = ?,
          status = ?,
          related_reference = COALESCE(?, related_reference),
          updated_at = ?
      WHERE id = ?
    `).run(
      title,
      description,
      category,
      priority,
      assignedToUserId || null,
      assignedToName,
      dueDate || task.due_date,
      newStatus,
      relatedReference,
      now,
      task.id
    );

    res.json({ success: true, message: 'Task updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/admin/tasks/:id/status
 * Update status & resolution notes
 */
router.patch('/:id/status', (req: Request, res: Response): void => {
  try {
    const task = db.prepare('SELECT * FROM staff_tasks WHERE id = ?').get(req.params.id) as any;
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const { status, resolutionNotes } = req.body;
    if (!status) {
      res.status(400).json({ success: false, message: 'Status is required' });
      return;
    }

    const validStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_INFO', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED', 'REOPENED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
      return;
    }

    const now = new Date().toISOString();
    const completedAt = (status === 'RESOLVED' || status === 'CLOSED') ? now : null;

    db.prepare(`
      UPDATE staff_tasks
      SET status = ?,
          resolution_notes = COALESCE(?, resolution_notes),
          completed_at = COALESCE(?, completed_at),
          updated_at = ?
      WHERE id = ?
    `).run(status, resolutionNotes || null, completedAt, now, task.id);

    res.json({ success: true, message: `Task status updated to ${status}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/tasks/:id/comments
 * Append audit / collaboration comment
 */
router.post('/:id/comments', (req: Request, res: Response): void => {
  try {
    const currentUser = (req as any).user;
    const task = db.prepare('SELECT id FROM staff_tasks WHERE id = ?').get(req.params.id) as any;
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const { comment } = req.body;
    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      res.status(400).json({ success: false, message: 'Comment text is required' });
      return;
    }

    const commentId = 'cmnt_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO staff_task_comments (id, task_id, user_id, user_name, user_role, comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      commentId,
      task.id,
      currentUser.id,
      currentUser.name || 'Staff Member',
      currentUser.role || 'sub_admin',
      comment.trim(),
      now
    );

    db.prepare('UPDATE staff_tasks SET updated_at = ? WHERE id = ?').run(now, task.id);

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      comment: {
        id: commentId,
        taskId: task.id,
        userName: currentUser.name || 'Staff Member',
        userRole: currentUser.role || 'sub_admin',
        comment: comment.trim(),
        createdAt: now
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
