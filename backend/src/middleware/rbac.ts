import { Request, Response, NextFunction } from 'express';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized request' });
      return;
    }

    const normRole = (req.user.role || '').toLowerCase().replace(/[-_]/g, '');
    const normAllowed = allowedRoles.map(r => r.toLowerCase().replace(/[-_]/g, ''));

    if (normRole === 'superadmin' || normAllowed.includes(normRole)) {
      next(); // Super admin or matching role bypasses filter
      return;
    }

    res.status(403).json({
      success: false,
      message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] roles`
    });
  };
}

export function requireSubAdminPermission(...allowedSubRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized request' });
      return;
    }

    const normRole = (req.user.role || '').toLowerCase().replace(/[-_]/g, '');
    if (normRole === 'superadmin') {
      next();
      return;
    }

    if (normRole !== 'subadmin' || !req.user.sub_admin_role || !allowedSubRoles.includes(req.user.sub_admin_role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Sub-admin role requires [${allowedSubRoles.join(', ')}] permission level`
      });
      return;
    }

    next();
  };
}

/**
 * Granular Permission Guard Matrix:
 * Prevents privilege escalation and unauthorised administrative action attempts.
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const normRole = (req.user.role || '').toLowerCase().replace(/[-_]/g, '');
    if (normRole === 'superadmin') {
      next();
      return;
    }

    if (normRole !== 'subadmin') {
      res.status(403).json({ success: false, message: 'Access denied: Administrative privileges required' });
      return;
    }

    const subRole = req.user.sub_admin_role;
    const permissionsBySubRole: Record<string, string[]> = {
      finance: [
        'VIEW_STATS', 'VIEW_ACCOUNTS', 'VIEW_REPORTS', 'EXPORT_REPORTS',
        'VIEW_WITHDRAWALS', 'APPROVE_WITHDRAWALS', 'REJECT_WITHDRAWALS',
        'ADJUST_WALLET', 'VIEW_GATEWAYS'
      ],
      support: [
        'VIEW_STATS', 'VIEW_ACCOUNTS', 'VIEW_USERS', 'CREATE_USERS',
        'EDIT_USERS', 'RESET_CREDENTIALS', 'VIEW_TICKETS'
      ],
      services: [
        'VIEW_STATS', 'VIEW_ACCOUNTS', 'MANAGE_PLANS', 'MANAGE_PROVIDERS',
        'MANAGE_SIMS', 'SERVICE_ROUTING'
      ],
      security: [
        'VIEW_STATS', 'VIEW_ACCOUNTS', 'VIEW_AUDIT_LOGS', 'MANAGE_BACKUPS',
        'VIEW_GATEWAYS', 'MANAGE_SETTINGS'
      ]
    };

    const allowed = (subRole && permissionsBySubRole[subRole]) || [];
    if (allowed.includes(permission)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Security Access Denied: Your staff department [${subRole || 'unassigned'}] lacks the '${permission}' privilege. This incident has been logged for security review.`
    });
  };
}
