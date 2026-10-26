import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { db } from '../database/index.js';
import { hashPassword } from '../utils/crypto.js';

const router = Router();

/**
 * Get Reseller API Keys (Restricted to authorized merchant, agent, reseller, and API roles)
 */
router.get('/keys', authenticate, requireRole('super_admin', 'reseller', 'agent', 'api_client'), (req: Request, res: Response): void => {
  try {
    const keys = db.prepare(`
      SELECT id, name, api_key, ip_allowlist, daily_quota, used_today, is_active, created_at
      FROM reseller_api_keys
      WHERE user_id = ?
    `).all(req.user!.id);
    res.json({ success: true, keys });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Generate New Business API Key (Restricted to authorized roles)
 */
router.post('/keys/generate', authenticate, requireRole('super_admin', 'reseller', 'agent', 'api_client'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, ipAllowlist } = req.body;
    const apiKey = 'bds_live_' + crypto.randomBytes(16).toString('hex');
    const apiSecret = 'bds_sec_' + crypto.randomBytes(24).toString('hex');
    const secretHash = await hashPassword(apiSecret);
    const id = 'key_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO reseller_api_keys (id, user_id, api_key, api_secret_hash, name, ip_allowlist, daily_quota, used_today, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 500000, 0, 1, ?)
    `).run(id, req.user!.id, apiKey, secretHash, name || 'Production Key', ipAllowlist || null, now);

    res.json({
      success: true,
      message: 'API Key generated. Copy your secret now as it will not be displayed again.',
      id,
      apiKey,
      apiSecret
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
