import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { AirtimeToCashService } from '../services/airtimeToCashService.js';
import { requireRole } from '../middleware/rbac.js';
import { idempotencyGuard } from '../middleware/idempotency.js';

const router = Router();

/**
 * Submit Airtime to Cash Order
 */
router.post('/submit', authenticate, idempotencyGuard, (req: Request, res: Response): void => {
  try {
    const { network, senderPhone, airtimeAmount } = req.body;
    if (!network || !senderPhone || !airtimeAmount) {
      res.status(400).json({ success: false, message: 'Network, sender phone, and amount are required' });
      return;
    }

    const order = AirtimeToCashService.submitRequest(req.user!.id, network, senderPhone, Number(airtimeAmount));
    res.json({ success: true, message: 'Order submitted. Please transfer airtime to designated line.', order });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Get My Airtime to Cash Orders
 */
router.get('/my-orders', authenticate, (req: Request, res: Response): void => {
  try {
    const orders = AirtimeToCashService.getOrders(req.user!.id);
    res.json({ success: true, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Get All Orders
 */
router.get('/all-orders', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const orders = AirtimeToCashService.getOrders();
    res.json({ success: true, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Approve and Credit Order
 */
router.post('/approve/:id', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const result = AirtimeToCashService.approveOrder(id, notes);
    res.json({ success: true, message: 'Airtime confirmed and user wallet credited', ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
