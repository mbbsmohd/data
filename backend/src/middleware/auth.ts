import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/index.js';
import { db } from '../database/index.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'sub_admin' | 'reseller' | 'agent' | 'customer';
  sub_admin_role?: 'finance' | 'support' | 'services' | 'security';
  tier: number;
  status: string;
  active_session_id?: string;
  account_locked?: number;
  lock_reason?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication token missing or invalid format' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as { id: string; email: string; sessionId?: string };
    const user = db.prepare(`
      SELECT id, name, email, phone, role, sub_admin_role, tier, status, active_session_id, account_locked, lock_reason
      FROM users WHERE id = ?
    `).get(decoded.id) as AuthUser | undefined;

    if (!user) {
      res.status(401).json({ success: false, message: 'User account not found or deactivated' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Account is suspended. Please contact customer care.' });
      return;
    }

    if (user.account_locked === 1) {
      res.status(403).json({
        success: false,
        accountLocked: true,
        message: `Account is locked by administration: ${user.lock_reason || 'Security review required. Please contact support.'}`
      });
      return;
    }

    // Strict Single-Session Security Enforcement (One active session per user, session revocation support)
    if (decoded.sessionId && (!user.active_session_id || decoded.sessionId !== user.active_session_id)) {
      res.status(401).json({
        success: false,
        sessionTerminated: true,
        message: 'Security Alert: Your session has been revoked or terminated because of another login. Please sign in again.'
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token. Please log in again.' });
  }
}
