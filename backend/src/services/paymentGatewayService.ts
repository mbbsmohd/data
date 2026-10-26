import crypto from 'crypto';
import { db } from '../database/index.js';
import { encryptField, decryptField, maskSecret } from '../utils/crypto.js';
import { PaymentService } from './paymentService.js';
import { WalletService } from './walletService.js';
import { NotificationService } from './notificationService.js';
import { NOTIFICATION_EVENTS } from '../config/index.js';

export class PaymentGatewayService {
  /**
   * List all payment gateways with secrets safely masked for Admin Suite
   */
  static getGateways() {
    const rows = db.prepare('SELECT * FROM payment_gateways ORDER BY is_default DESC, name ASC').all() as any[];
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      isActive: Boolean(r.is_active),
      isDefault: Boolean(r.is_default),
      environment: r.environment,
      publicKey: r.public_key,
      contractCode: r.contract_code,
      merchantId: r.merchant_id,
      bankName: r.bank_name,
      accountNumber: r.account_number,
      accountName: r.account_name,
      hasSecretKey: Boolean(r.secret_key_encrypted),
      secretKeyMasked: r.secret_key_encrypted ? maskSecret(decryptField(r.secret_key_encrypted)) : '',
      hasApiKey: Boolean(r.api_key_encrypted),
      apiKeyMasked: r.api_key_encrypted ? maskSecret(decryptField(r.api_key_encrypted)) : '',
      hasWebhookSecret: Boolean(r.webhook_secret_encrypted),
      webhookSecretMasked: r.webhook_secret_encrypted ? maskSecret(decryptField(r.webhook_secret_encrypted)) : '',
      updatedAt: r.updated_at
    }));
  }

  /**
   * Update payment gateway credentials with AES-256-GCM encryption
   */
  static updateGateway(id: string, payload: {
    name?: string;
    isActive?: boolean;
    isDefault?: boolean;
    environment?: 'sandbox' | 'production';
    publicKey?: string;
    secretKey?: string;
    apiKey?: string;
    contractCode?: string;
    webhookSecret?: string;
    merchantId?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  }) {
    const existing = db.prepare('SELECT * FROM payment_gateways WHERE id = ?').get(id) as any;
    if (!existing) {
      throw new Error(`Gateway '${id}' not found`);
    }

    const now = new Date().toISOString();

    let secretEncrypted = existing.secret_key_encrypted;
    if (payload.secretKey && payload.secretKey.trim() !== '') {
      secretEncrypted = encryptField(payload.secretKey.trim());
    }

    let apiKeyEncrypted = existing.api_key_encrypted;
    if (payload.apiKey && payload.apiKey.trim() !== '') {
      apiKeyEncrypted = encryptField(payload.apiKey.trim());
    }

    let webhookEncrypted = existing.webhook_secret_encrypted;
    if (payload.webhookSecret && payload.webhookSecret.trim() !== '') {
      webhookEncrypted = encryptField(payload.webhookSecret.trim());
    }

    // If marked default, unset others first
    if (payload.isDefault) {
      db.prepare('UPDATE payment_gateways SET is_default = 0').run();
    }

    db.prepare(`
      UPDATE payment_gateways
      SET name = COALESCE(?, name),
          is_active = COALESCE(?, is_active),
          is_default = COALESCE(?, is_default),
          environment = COALESCE(?, environment),
          public_key = COALESCE(?, public_key),
          secret_key_encrypted = ?,
          api_key_encrypted = ?,
          contract_code = COALESCE(?, contract_code),
          webhook_secret_encrypted = ?,
          merchant_id = COALESCE(?, merchant_id),
          bank_name = COALESCE(?, bank_name),
          account_number = COALESCE(?, account_number),
          account_name = COALESCE(?, account_name),
          updated_at = ?
      WHERE id = ?
    `).run(
      payload.name ?? null,
      payload.isActive !== undefined ? (payload.isActive ? 1 : 0) : null,
      payload.isDefault !== undefined ? (payload.isDefault ? 1 : 0) : null,
      payload.environment ?? null,
      payload.publicKey ?? null,
      secretEncrypted,
      apiKeyEncrypted,
      payload.contractCode ?? null,
      webhookEncrypted,
      payload.merchantId ?? null,
      payload.bankName ?? null,
      payload.accountNumber ?? null,
      payload.accountName ?? null,
      now,
      id
    );

    return { success: true, message: `Gateway '${id}' updated securely.` };
  }

  /**
   * Fetch active dedicated virtual bank account for user or generate a live one via API
   */
  static async getOrGenerateVirtualAccount(userId: string) {
    const user = db.prepare('SELECT id, name, email, phone, virtual_account_bank, virtual_account_number, virtual_account_name FROM users WHERE id = ?').get(userId) as any;
    if (!user) throw new Error('User not found');

    if (user.virtual_account_number && user.virtual_account_bank) {
      return {
        bankName: user.virtual_account_bank,
        accountNumber: user.virtual_account_number,
        accountName: user.virtual_account_name || user.name,
        isAutomated: true
      };
    }

    // Fetch default active gateway
    const gateway = db.prepare('SELECT * FROM payment_gateways WHERE is_active = 1 AND is_default = 1 LIMIT 1').get() as any;

    if (gateway && gateway.id === 'monnify') {
      const apiKey = decryptField(gateway.api_key_encrypted);
      const secretKey = decryptField(gateway.secret_key_encrypted);
      const contractCode = gateway.contract_code;

      if (apiKey && secretKey && contractCode) {
        try {
          const baseUrl = gateway.environment === 'sandbox' ? 'https://sandbox.monnify.com' : 'https://api.monnify.com';
          const authBuffer = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

          // 1. Monnify Login
          const authRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${authBuffer}`,
              'Content-Type': 'application/json'
            }
          });
          const authData = await authRes.json() as any;

          if (authData.requestSuccessful && authData.responseBody?.accessToken) {
            const token = authData.responseBody.accessToken;

            // 2. Reserve Account
            const reserveRes = await fetch(`${baseUrl}/api/v2/bank-transfer/reserved-accounts`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                accountReference: `USR_${user.id}_${Date.now()}`,
                accountName: user.name,
                currencyCode: 'NGN',
                contractCode,
                customerEmail: user.email,
                customerName: user.name,
                getAllAvailableBanks: true
              })
            });

            const reserveData = await reserveRes.json() as any;
            if (reserveData.requestSuccessful && reserveData.responseBody?.accounts?.length > 0) {
              const primaryAcc = reserveData.responseBody.accounts[0];
              const bName = primaryAcc.bankName || 'Wema Bank';
              const accNum = primaryAcc.accountNumber;
              const accName = reserveData.responseBody.accountName || user.name;

              db.prepare(`
                UPDATE users
                SET virtual_account_bank = ?, virtual_account_number = ?, virtual_account_name = ?
                WHERE id = ?
              `).run(bName, accNum, accName, user.id);

              return {
                bankName: bName,
                accountNumber: accNum,
                accountName: accName,
                isAutomated: true
              };
            }
          }
        } catch (err) {
          console.error('Monnify reserved account API call error:', err);
        }
      }
    }

    if (gateway && gateway.id === 'paystack') {
      const secretKey = decryptField(gateway.secret_key_encrypted);
      if (secretKey) {
        try {
          // 1. Create Paystack customer
          const custRes = await fetch('https://api.paystack.co/customer', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${secretKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: user.email,
              first_name: user.name.split(' ')[0],
              last_name: user.name.split(' ').slice(1).join(' ') || 'Customer',
              phone: user.phone
            })
          });
          const custData = await custRes.json() as any;

          if (custData.status && custData.data?.customer_code) {
            const customerCode = custData.data.customer_code;

            // 2. Assign dedicated NUBAN
            const nubanRes = await fetch('https://api.paystack.co/dedicated_account', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                customer: customerCode,
                preferred_bank: 'wema-bank'
              })
            });

            const nubanData = await nubanRes.json() as any;
            if (nubanData.status && nubanData.data?.account_number) {
              const bName = nubanData.data.bank?.name || 'Wema Bank';
              const accNum = nubanData.data.account_number;
              const accName = nubanData.data.account_name || user.name;

              db.prepare(`
                UPDATE users
                SET virtual_account_bank = ?, virtual_account_number = ?, virtual_account_name = ?
                WHERE id = ?
              `).run(bName, accNum, accName, user.id);

              return {
                bankName: bName,
                accountNumber: accNum,
                accountName: accName,
                isAutomated: true
              };
            }
          }
        } catch (err) {
          console.error('Paystack dedicated account API call error:', err);
        }
      }
    }

    if (gateway && gateway.id === 'palmpay') {
      const apiKey = decryptField(gateway.api_key_encrypted);
      const secretKey = decryptField(gateway.secret_key_encrypted);
      if (apiKey && secretKey) {
        try {
          const baseUrl = gateway.environment === 'sandbox' ? 'https://sandbox.palmpay.com' : 'https://api.palmpay.com';
          const res = await fetch(`${baseUrl}/api/v1/virtual-account/create`, {
            method: 'POST',
            headers: {
              'X-PalmPay-App-Id': apiKey,
              'Authorization': `Bearer ${secretKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: user.id,
              customerName: user.name,
              email: user.email,
              phone: user.phone
            })
          });
          const data = await res.json() as any;
          if (data.respCode === '000000' && data.accountNo) {
            const bName = 'PalmPay MFB';
            const accNum = data.accountNo;
            const accName = data.accountName || user.name;

            db.prepare(`
              UPDATE users
              SET virtual_account_bank = ?, virtual_account_number = ?, virtual_account_name = ?
              WHERE id = ?
            `).run(bName, accNum, accName, user.id);

            return {
              bankName: bName,
              accountNumber: accNum,
              accountName: accName,
              isAutomated: true
            };
          }
        } catch (err) {
          console.error('PalmPay virtual account API call error:', err);
        }
      }
    }

    // Fallback to Admin's configured corporate bank account details (Moniepoint / Manual)
    const manualGateway = db.prepare("SELECT bank_name, account_number, account_name FROM payment_gateways WHERE id = 'manual_bank'").get() as any;
    const settings = db.prepare('SELECT support_phone, whatsapp_number, app_name FROM system_settings LIMIT 1').get() as any;

    const bName = manualGateway?.bank_name || 'Moniepoint MFB';
    const accNum = manualGateway?.account_number || '9131797675';
    const accName = manualGateway?.account_name || `${settings?.app_name || 'BUKAR DATA SUB'} / MOHAMMED ADAMU`;

    return {
      bankName: bName,
      accountNumber: accNum,
      accountName: accName,
      isAutomated: false,
      status: 'MANUAL_CORPORATE',
      instruction: 'Transfer to this verified corporate account. Dedicated automated accounts will be activated once payment gateway credentials are confirmed.'
    };
  }

  /**
   * Initialize online card / bank / USSD checkout session via active gateway
   */
  static async initializeCheckout(userId: string, amount: number, gatewayId = 'paystack') {
    const user = db.prepare('SELECT id, name, email, phone FROM users WHERE id = ?').get(userId) as any;
    if (!user) throw new Error('User not found');

    const gateway = db.prepare('SELECT * FROM payment_gateways WHERE id = ? AND is_active = 1').get(gatewayId) as any;
    const reference = 'FUND_' + crypto.randomBytes(6).toString('hex').toUpperCase();

    // 1. Record pending payment request
    const id = 'prq_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO payment_requests (
        id, user_id, reference, amount, currency, gateway, status, expires_at, created_at
      )
      VALUES (?, ?, ?, ?, 'NGN', ?, 'PENDING', ?, ?)
    `).run(id, userId, reference, amount, gatewayId, expiresAt, now);

    // 2. Real Paystack initialize
    if (gatewayId === 'paystack') {
      const secretKey = decryptField(gateway?.secret_key_encrypted);
      if (secretKey) {
        try {
          const res = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${secretKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: user.email,
              amount: Math.round(amount * 100), // in kobo
              reference,
              callback_url: `https://bukardatasub.com/wallet?payment_ref=${reference}`,
              metadata: { userId: user.id, customerName: user.name }
            })
          });

          const data = await res.json() as any;
          if (data.status && data.data?.authorization_url) {
            return {
              success: true,
              reference,
              checkoutUrl: data.data.authorization_url,
              accessCode: data.data.access_code
            };
          }
        } catch (err) {
          console.error('Paystack transaction initialize error:', err);
        }
      }
    }

    // 3. Real Monnify initialize
    if (gatewayId === 'monnify') {
      const apiKey = decryptField(gateway?.api_key_encrypted);
      const secretKey = decryptField(gateway?.secret_key_encrypted);
      const contractCode = gateway?.contract_code;

      if (apiKey && secretKey && contractCode) {
        try {
          const baseUrl = gateway.environment === 'sandbox' ? 'https://sandbox.monnify.com' : 'https://api.monnify.com';
          const authBuffer = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

          const authRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${authBuffer}` }
          });
          const authData = await authRes.json() as any;

          if (authData.requestSuccessful && authData.responseBody?.accessToken) {
            const token = authData.responseBody.accessToken;
            const initRes = await fetch(`${baseUrl}/api/v1/merchant/transactions/init-transaction`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                amount,
                customerName: user.name,
                customerEmail: user.email,
                paymentReference: reference,
                paymentDescription: `Wallet Funding - ${reference}`,
                currencyCode: 'NGN',
                contractCode,
                redirectUrl: `https://bukardatasub.com/wallet?payment_ref=${reference}`
              })
            });

            const initData = await initRes.json() as any;
            if (initData.requestSuccessful && initData.responseBody?.checkoutUrl) {
              return {
                success: true,
                reference,
                checkoutUrl: initData.responseBody.checkoutUrl
              };
            }
          }
        } catch (err) {
          console.error('Monnify transaction initialize error:', err);
        }
      }
    }

    return {
      success: true,
      reference,
      checkoutUrl: null,
      message: 'Payment reference created. Transfer directly to your dedicated virtual account to credit your wallet.'
    };
  }

  /**
   * Process Real Inbound Webhook with HMAC Signature Verification
   */
  static processWebhook(gatewayId: string, rawBody: string, headers: Record<string, string>) {
    const gateway = db.prepare('SELECT * FROM payment_gateways WHERE id = ?').get(gatewayId) as any;
    if (!gateway) {
      throw new Error(`Unknown gateway webhook: ${gatewayId}`);
    }

    const payload = JSON.parse(rawBody);

    // Verify HMAC Signature if secret is configured
    if (gatewayId === 'paystack') {
      const secret = decryptField(gateway.secret_key_encrypted);
      const signature = headers['x-paystack-signature'];
      if (secret && signature) {
        const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
        if (hash !== signature) {
          throw new Error('Invalid Paystack webhook signature');
        }
      }

      if (payload.event === 'charge.success') {
        const reference = payload.data?.reference;
        const amount = Number(payload.data?.amount) / 100; // kobo to NGN
        const gatewayRef = payload.data?.id;

        if (reference) {
          PaymentService.completePayment(reference, String(gatewayRef));
          return { success: true, processed: true, reference };
        }
      }
    }

    if (gatewayId === 'monnify') {
      const secret = decryptField(gateway.secret_key_encrypted);
      const signature = headers['monnify-signature'];
      if (secret && signature) {
        const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
        if (hash !== signature) {
          throw new Error('Invalid Monnify webhook signature');
        }
      }

      const eventData = payload.eventData;
      if (eventData && eventData.paymentStatus === 'PAID') {
        const reference = eventData.paymentReference;
        const gatewayRef = eventData.transactionReference;
        if (reference) {
          PaymentService.completePayment(reference, gatewayRef);
          return { success: true, processed: true, reference };
        }
      }
    }

    if (gatewayId === 'palmpay') {
      const secret = decryptField(gateway.secret_key_encrypted) || decryptField(gateway.webhook_secret_encrypted);
      const signature = headers['x-palmpay-signature'] || headers['signature'];
      if (secret && signature) {
        const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        if (hash.toLowerCase() !== signature.toLowerCase()) {
          throw new Error('Invalid PalmPay webhook signature');
        }
      }

      const isSuccess = payload.orderStatus === 'SUCCESS' || payload.status === 'SUCCESS' || payload.data?.status === 'SUCCESS';
      if (isSuccess) {
        const reference = payload.reference || payload.orderNo || payload.data?.reference || payload.data?.orderNo;
        const gatewayRef = payload.transactionId || payload.palmpayOrderNo || payload.data?.transactionId || reference;
        if (reference) {
          PaymentService.completePayment(reference, String(gatewayRef));
          return { success: true, processed: true, reference };
        }
      }
    }

    if (gatewayId === 'flutterwave') {
      const secret = decryptField(gateway.webhook_secret_encrypted) || decryptField(gateway.secret_key_encrypted);
      const signature = headers['verif-hash'];
      if (secret && signature) {
        if (signature !== secret) {
          throw new Error('Invalid Flutterwave webhook signature');
        }
      }

      if (payload.event === 'charge.completed' && payload.data?.status === 'successful') {
        const reference = payload.data?.tx_ref;
        const gatewayRef = payload.data?.id;
        if (reference) {
          PaymentService.completePayment(reference, String(gatewayRef));
          return { success: true, processed: true, reference };
        }
      }
    }

    return { success: true, processed: false, message: 'Event ignored or not a successful charge' };
  }
}
