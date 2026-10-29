import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { PaymentService } from '../services/paymentService.js';
import { PaymentGatewayService } from '../services/paymentGatewayService.js';
import { idempotencyGuard } from '../middleware/idempotency.js';

const router = Router();

/**
 * Super Admin: List all configured Payment Gateways (Masked keys)
 */
router.get('/gateways', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const gateways = PaymentGatewayService.getGateways();
    res.json({ success: true, gateways });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Update Payment Gateway Credentials (AES-256-GCM Encrypted)
 */
router.put('/gateways/:id', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const result = PaymentGatewayService.updateGateway(id, req.body);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Customer: Get All Dedicated Reserved Virtual Accounts (Monnify / PalmPay / Paystack)
 */
router.get(['/reserved-accounts', '/reserve-accounts'], authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    let accounts = PaymentGatewayService.getReservedAccounts(req.user!.id) as any[];
    if (!accounts || accounts.length === 0) {
      await PaymentGatewayService.getOrGenerateVirtualAccount(req.user!.id);
      accounts = PaymentGatewayService.getReservedAccounts(req.user!.id) as any[];
    }
    res.json({ success: true, count: accounts.length, accounts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: List All Dedicated Reserved Accounts in the System
 */
router.get('/admin/reserved-accounts', authenticate, requireRole('super_admin'), (req: Request, res: Response): void => {
  try {
    const accounts = PaymentGatewayService.getAllReservedAccounts();
    res.json({ success: true, count: accounts.length, accounts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Customer: Get Automated Dedicated Virtual Account (Wema Bank / Titan Bank / Moniepoint)
 */
router.get('/virtual-account', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const account = await PaymentGatewayService.getOrGenerateVirtualAccount(req.user!.id);
    res.json({ success: true, account });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Customer: Initiate Wallet Funding Request / Online Checkout (Paystack / Monnify)
 */
router.post('/initiate', authenticate, idempotencyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, gateway } = req.body;
    if (!amount || Number(amount) < 100) {
      res.status(400).json({ success: false, message: 'Minimum funding amount is ₦100.00' });
      return;
    }

    const selectedGateway = gateway || 'paystack';
    const result = await PaymentGatewayService.initializeCheckout(req.user!.id, Number(amount), selectedGateway);
    const virtualAcc = await PaymentGatewayService.getOrGenerateVirtualAccount(req.user!.id);

    res.json({
      success: true,
      reference: result.reference,
      checkoutUrl: result.checkoutUrl,
      virtualBankName: virtualAcc.bankName,
      virtualAccountNumber: virtualAcc.accountNumber,
      virtualAccountName: virtualAcc.accountName,
      message: result.message
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Real Webhook Receiver for Monnify, Paystack, Flutterwave
 * Enforces HMAC SHA512 signature verification
 */
router.post('/webhook/:gateway', (req: Request, res: Response): void => {
  try {
    const { gateway } = req.params;
    const rawBody = JSON.stringify(req.body);
    const headers = req.headers as Record<string, string>;

    const result = PaymentGatewayService.processWebhook(gateway, rawBody, headers);
    res.json({ status: 'success', ...result });
  } catch (err: any) {
    console.error(`Webhook error (${req.params.gateway}):`, err.message);
    res.status(400).json({ status: 'error', message: err.message });
  }
});

export default router;
