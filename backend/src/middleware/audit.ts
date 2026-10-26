import { Request, Response, NextFunction } from 'express';
import { db } from '../database/index.js';
import crypto from 'crypto';

export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const actorId = req.user ? req.user.id : 'ANONYMOUS';
  const actorRole = req.user ? req.user.role : 'GUEST';

  res.on('finish', () => {
    // Only log state-mutating requests (POST, PUT, PATCH, DELETE) or admin calls
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || req.originalUrl.startsWith('/api/admin')) {
      const durationMs = Date.now() - start;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Sanitize body to remove passwords, OTPs, PINs, card numbers, secrets
      const sanitizedBody = { ...req.body };
      for (const field of ['password', 'pin', 'token', 'secret', 'apiKey', 'card_number', 'cvv', 'mfa_code']) {
        if (field in sanitizedBody) {
          sanitizedBody[field] = '[REDACTED]';
        }
      }

      try {
        db.prepare(`
          INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, user_agent, details_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'aud_' + crypto.randomBytes(8).toString('hex'),
          actorId,
          actorRole,
          `${req.method} ${req.baseUrl}${req.path} (${res.statusCode}) - ${durationMs}ms`,
          req.baseUrl.split('/')[2] || 'SYSTEM',
          req.params.id || null,
          ip,
          userAgent,
          JSON.stringify({ statusCode: res.statusCode, durationMs, body: sanitizedBody }),
          new Date().toISOString()
        );
      } catch (err) {
        console.error('Audit log write failure:', err);
      }
    }
  });

  next();
}

/**
 * Validates outgoing provider URLs against internal addresses, localhost, and cloud metadata endpoints
 */
export function isSafeOutboundUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    // Block localhost, link-local, loopback, private ranges, cloud metadata
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '169.254.169.254', // AWS/GCP/Azure instance metadata
      'metadata.google.internal',
      '10.',
      '192.168.',
      '172.16.',
      '172.17.',
      '172.18.',
      '172.19.',
      '172.20.',
      '172.21.',
      '172.22.',
      '172.23.',
      '172.24.',
      '172.25.',
      '172.26.',
      '172.27.',
      '172.28.',
      '172.29.',
      '172.30.',
      '172.31.'
    ];

    for (const blocked of blockedHosts) {
      if (hostname === blocked || hostname.startsWith(blocked)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
