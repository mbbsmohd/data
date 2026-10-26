import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { SimHostingService } from '../services/simHostingService.js';

const router = Router();

/**
 * List all hosted SIM lines
 */
router.get('/', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const sims = SimHostingService.getHostedSims();
    res.json({ success: true, sims });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Run USSD Command on SIM
 */
router.post('/ussd', authenticate, requireRole('super_admin', 'sub_admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { simId, ussdCode } = req.body;
    if (!simId || !ussdCode) {
      res.status(400).json({ success: false, message: 'simId and ussdCode are required' });
      return;
    }

    const result = await SimHostingService.executeUSSD(simId, ussdCode);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Upsert SIM configuration
 */
router.post('/upsert', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const result = SimHostingService.upsertSim(req.body);
    res.json({ success: true, message: 'Hosted SIM configuration saved', ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
