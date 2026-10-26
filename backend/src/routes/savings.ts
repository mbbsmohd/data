import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { SavingsService } from '../services/savingsService.js';
import { idempotencyGuard } from '../middleware/idempotency.js';

const router = Router();

/**
 * Get My SafeBoxes
 */
router.get('/', authenticate, (req: Request, res: Response): void => {
  try {
    const boxes = SavingsService.getUserSafeBoxes(req.user!.id);
    res.json({ success: true, boxes });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Deposit into SafeBox
 */
router.post('/deposit', authenticate, idempotencyGuard, (req: Request, res: Response): void => {
  try {
    const { targetTitle, amount, lockPeriodDays } = req.body;
    if (!targetTitle || !amount || Number(amount) < 1000) {
      res.status(400).json({ success: false, message: 'Title and minimum ₦1,000 deposit required' });
      return;
    }

    const result = SavingsService.depositToSafeBox(
      req.user!.id,
      targetTitle,
      Number(amount),
      lockPeriodDays ? Number(lockPeriodDays) : 30
    );

    res.json({ success: true, message: 'SafeBox savings deposit locked successfully', ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Withdraw Matured SafeBox
 */
router.post('/withdraw/:id', authenticate, idempotencyGuard, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const result = SavingsService.withdrawFromSafeBox(id, req.user!.id);
    res.json({ success: true, message: 'SafeBox savings & interest paid to main wallet', ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
