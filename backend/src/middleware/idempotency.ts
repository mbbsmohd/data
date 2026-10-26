import { Request, Response, NextFunction } from 'express';
import { db } from '../database/index.js';

export function idempotencyGuard(req: Request, res: Response, next: NextFunction): void {
  const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;

  if (!idempotencyKey) {
    // If no key provided, continue normally
    next();
    return;
  }

  const userId = req.user ? req.user.id : 'ANONYMOUS';
  const existing = db.prepare(`
    SELECT response_json FROM idempotency_keys
    WHERE key = ? AND user_id = ?
  `).get(idempotencyKey, userId) as { response_json: string } | undefined;

  if (existing) {
    try {
      const parsed = JSON.parse(existing.response_json);
      res.setHeader('X-Idempotent-Replay', 'true');
      res.status(parsed.status || 200).json(parsed.body);
      return;
    } catch {
      // Fallback
    }
  }

  // Intercept res.json to capture response
  const originalJson = res.json.bind(res);
  res.json = (body: any): Response => {
    try {
      const payload = JSON.stringify({
        status: res.statusCode,
        body
      });
      db.prepare(`
        INSERT OR REPLACE INTO idempotency_keys (key, user_id, request_path, response_json, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(idempotencyKey, userId, req.originalUrl, payload, new Date().toISOString());
    } catch (err) {
      console.error('Failed to store idempotency record:', err);
    }
    return originalJson(body);
  };

  next();
}
