import { Router, Request, Response } from 'express';
import { db } from '../database/index.js';
import { authenticate } from '../middleware/auth.js';
import { VTUService } from '../services/vtuService.js';
import { idempotencyGuard } from '../middleware/idempotency.js';

const router = Router();

/**
 * Verify Customer Meter or Smartcard
 */
router.post('/verify-customer', (req: Request, res: Response): void => {
  try {
    const { category, billerOrNetwork, customerId } = req.body;
    const result = VTUService.verifyCustomer(category, billerOrNetwork, customerId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Detect Telecom Network from Phone Number
 */
router.get('/detect-network', (req: Request, res: Response): void => {
  const phone = req.query.phone as string;
  if (!phone) {
    res.json({ network: 'MTN' });
    return;
  }
  const network = VTUService.detectNetwork(phone);
  res.json({ success: true, network });
});

/**
 * Generate Recharge Card e-PINs
 */
router.post('/generate-recharge-cards', authenticate, idempotencyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { network, denomination, quantity, businessName } = req.body;
    const result = await VTUService.generateRechargeCardPins(
      req.user!.id,
      network,
      Number(denomination),
      Number(quantity),
      businessName || 'BUKAR DATA SUB'
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Send Bulk SMS
 */
router.post('/send-bulk-sms', authenticate, idempotencyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { senderId, recipients, message } = req.body;
    const result = await VTUService.sendBulkSMS(
      req.user!.id,
      senderId,
      recipients,
      message
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Get Service Catalogue and Active Plans
 */
router.get('/catalogue', (req: Request, res: Response): void => {
  try {
    const catalogue = VTUService.getServiceCatalogue();
    res.json({ success: true, catalogue });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get Filtered Active Plans (for Data, Cable, Solar etc.)
 */
router.get('/plans', (req: Request, res: Response): void => {
  try {
    const network = req.query.network as string;
    const dataType = req.query.dataType as string;

    let sql = 'SELECT * FROM service_plans WHERE is_available = 1';
    const params: any[] = [];

    if (network) {
      sql += ' AND network_or_biller = ?';
      params.push(network);
    }
    if (dataType) {
      sql += ' AND (data_type = ? OR data_type IS NULL)';
      params.push(dataType);
    }

    sql += ' ORDER BY amount ASC';
    const plans = db.prepare(sql).all(...params);
    res.json({ success: true, plans });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Purchase Airtime, Data, Solar PIN, TV, Electricity, Betting, Exam PIN
 */
router.post('/purchase', authenticate, idempotencyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, billerOrNetwork, planCode, recipient, amount } = req.body;
    if (!category || !billerOrNetwork || !recipient || !amount) {
      res.status(400).json({ success: false, message: 'Missing required purchase parameters' });
      return;
    }

    const result = await VTUService.executePurchase({
      userId: req.user!.id,
      category,
      billerOrNetwork,
      planCode,
      recipient,
      amount: Number(amount)
    });

    res.json({ success: true, message: `${category.toUpperCase()} transaction successful`, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Get Recent Activity (matching Screenshot 4: Recent Activity)
 */
router.get('/recent-activity', authenticate, (req: Request, res: Response): void => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const activities = VTUService.getRecentTransactions(req.user!.id, limit);
    res.json({ success: true, activities });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Filterable Transactions with Search & Pagination
 */
router.get('/transactions', authenticate, (req: Request, res: Response): void => {
  try {
    const category = req.query.category as string;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    let query = `
      SELECT id, service_category, reference, biller_or_network, recipient,
             amount, discount_amount, charged_amount, status, token_or_pin, created_at
      FROM vtu_transactions
      WHERE user_id = ?
    `;
    const params: any[] = [req.user!.id];

    if (category && category !== 'all') {
      query += ` AND service_category = ?`;
      params.push(category);
    }
    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (search && search.trim().length > 0) {
      query += ` AND (reference LIKE ? OR recipient LIKE ? OR biller_or_network LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const transactions = db.prepare(query).all(...params);
    res.json({ success: true, transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get Single Transaction Receipt
 */
router.get('/receipt/:reference', authenticate, (req: Request, res: Response): void => {
  try {
    const { reference } = req.params;
    const tx = db.prepare(`
      SELECT vt.*, u.name as user_name, u.phone as user_phone, u.email as user_email
      FROM vtu_transactions vt
      JOIN users u ON vt.user_id = u.id
      WHERE vt.reference = ? AND (vt.user_id = ? OR ? IN ('super_admin', 'sub_admin'))
    `).get(reference, req.user!.id, req.user!.role);

    if (!tx) {
      res.status(404).json({ success: false, message: 'Transaction receipt not found' });
      return;
    }

    res.json({ success: true, receipt: tx });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
