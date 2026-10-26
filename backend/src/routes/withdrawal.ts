import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { idempotencyGuard } from '../middleware/idempotency.js';
import { WithdrawalService } from '../services/withdrawalService.js';

const router = Router();

/**
 * Customer: Submit Bank Withdrawal Request
 */
router.post('/request', authenticate, idempotencyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await WithdrawalService.requestWithdrawal(req.user!.id, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Customer: Get My Withdrawal History
 */
router.get('/my-requests', authenticate, (req: Request, res: Response): void => {
  try {
    const withdrawals = WithdrawalService.getUserWithdrawals(req.user!.id);
    res.json({ success: true, withdrawals });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: List All Withdrawal Requests
 */
router.get('/admin/all', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const status = req.query.status as string | undefined;
    const withdrawals = WithdrawalService.getAdminWithdrawals(status);
    res.json({ success: true, withdrawals });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Approve Withdrawal Request & Mark as Paid Out
 */
router.post(['/admin/:id/approve', '/:id/approve'], authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const result = WithdrawalService.approveWithdrawal(id, req.user!.id, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Reject Withdrawal Request & Trigger 100% Instant Wallet Refund
 */
router.post(['/admin/:id/reject', '/:id/reject'], authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const result = WithdrawalService.rejectWithdrawal(id, req.user!.id, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
