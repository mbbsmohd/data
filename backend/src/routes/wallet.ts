import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { WalletService } from '../services/walletService.js';
import { idempotencyGuard } from '../middleware/idempotency.js';

const router = Router();

/**
 * Get wallet summary & balance
 */
router.get('/', authenticate, (req: Request, res: Response): void => {
  try {
    const wallet = WalletService.getWallet(req.user!.id);
    res.json({ success: true, wallet });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get ledger entries / transaction history
 */
router.get('/history', authenticate, (req: Request, res: Response): void => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const history = WalletService.getLedgerHistory(req.user!.id, limit);
    res.json({ success: true, history });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Transfer Commission to Main Wallet (matching Screenshot 2: Commission *** >)
 */
router.post('/transfer-commission', authenticate, idempotencyGuard, (req: Request, res: Response): void => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'Valid transfer amount is required' });
      return;
    }

    const result = WalletService.transferCommission(req.user!.id, Number(amount));
    res.json({ success: true, message: 'Commission transferred to main wallet', ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
