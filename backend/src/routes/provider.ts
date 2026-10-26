import { Router, Request, Response } from 'express';
import { db } from '../database/index.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { ProviderService } from '../services/providerService.js';

const router = Router();

/**
 * List API Providers (Masked credentials, zero leak)
 */
router.get('/', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const providers = ProviderService.getProviders();
    res.json({ success: true, providers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Configure / Update API Provider
 */
router.post('/upsert', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const result = ProviderService.upsertProvider(req.body);
    res.json({ success: true, message: 'Provider configuration securely updated', ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Test Connection with SSRF protection & safe masking
 */
router.post('/test-connection/:id', authenticate, requireRole('super_admin', 'sub_admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await ProviderService.testConnection(id);
    res.json({ success: true, message: 'Health check completed successfully', result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Delete API Provider
 */
router.delete('/:id', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM api_providers WHERE id = ?').run(id);
    res.json({ success: true, message: 'Provider deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
