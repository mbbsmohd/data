import { Request, Response, NextFunction } from 'express';
import { db } from '../database/index.js';

export function maintenanceGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = db.prepare(`
      SELECT maintenance_mode, maintenance_scope, maintenance_message, 
             maintenance_start_time, maintenance_end_time, maintenance_bypass_ips
      FROM system_settings 
      LIMIT 1
    `).get() as {
      maintenance_mode?: number;
      maintenance_scope?: string;
      maintenance_message?: string;
      maintenance_start_time?: string;
      maintenance_end_time?: string;
      maintenance_bypass_ips?: string;
    } | undefined;

    if (!settings || !settings.maintenance_mode) {
      return next();
    }

    // Check scheduled maintenance window if configured
    const now = new Date();
    if (settings.maintenance_start_time && settings.maintenance_end_time) {
      const start = new Date(settings.maintenance_start_time);
      const end = new Date(settings.maintenance_end_time);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (now < start || now > end) {
          return next();
        }
      }
    }

    // Critical operational routes that MUST NEVER be blocked:
    // 1. Health checks & monitoring
    if (req.path === '/api/health') return next();
    
    // 2. Public settings & branding (frontend needs to read maintenance banner / status)
    if (req.path.startsWith('/api/settings')) return next();

    // 3. Admin routes & admin authentication (Authorized staff MUST be able to manage the platform)
    if (req.path.startsWith('/api/admin')) return next();
    if (req.path.startsWith('/api/auth')) return next();

    // 4. Payment Gateway Webhooks (Must NEVER drop incoming payment settlements)
    if (req.path.startsWith('/api/payment/webhook')) return next();

    // 5. Check bypass IPs
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    if (settings.maintenance_bypass_ips) {
      const allowedIps = settings.maintenance_bypass_ips.split(',').map(s => s.trim());
      if (allowedIps.some(ip => ip && clientIp.includes(ip))) {
        return next();
      }
    }

    const scope = settings.maintenance_scope || 'all';
    const message = settings.maintenance_message || 'The system is undergoing scheduled optimization. We will be back online shortly.';

    // Scoped blocking
    if (scope === 'vtu_services') {
      // Only block VTU purchasing routes
      if (req.path.startsWith('/api/vtu/purchase') || req.path.startsWith('/api/airtime-to-cash')) {
        return res.status(503).json({
          success: false,
          maintenance: true,
          scope: 'vtu_services',
          message: `Telecom and VTU services are temporarily offline for network maintenance: ${message}`
        });
      }
      return next();
    }

    if (scope === 'apis') {
      if (req.path.startsWith('/api/reseller')) {
        return res.status(503).json({
          success: false,
          maintenance: true,
          scope: 'apis',
          message: `Reseller API gateway is currently undergoing scheduled maintenance: ${message}`
        });
      }
      return next();
    }

    // Default 'all' or 'website': Block customer financial / mutating operations
    const mutatingPrefixes = ['/api/vtu', '/api/wallet', '/api/withdrawals', '/api/airtime-to-cash', '/api/savings'];
    const isCustomerFinancial = mutatingPrefixes.some(prefix => req.path.startsWith(prefix));

    if (isCustomerFinancial && req.method !== 'GET') {
      return res.status(503).json({
        success: false,
        maintenance: true,
        scope,
        message
      });
    }

    // If scope is 'all' and non-GET on any customer endpoint
    if (scope === 'all' && !req.path.startsWith('/api/admin') && req.method !== 'GET') {
      return res.status(503).json({
        success: false,
        maintenance: true,
        scope: 'all',
        message
      });
    }

    next();
  } catch (error) {
    console.error('[MAINTENANCE GUARD ERROR]', error);
    next();
  }
}
