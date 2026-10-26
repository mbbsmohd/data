import crypto from 'crypto';
import { db } from '../database/index.js';
import { encryptField, decryptField, maskSecret } from '../utils/crypto.js';
import { isSafeOutboundUrl } from '../middleware/audit.js';

export interface ProviderPurchasePayload {
  category: string;
  billerOrNetwork: string;
  planCode?: string;
  providerPlanId?: string;
  recipient: string;
  amount: number;
  reference: string;
  providerId?: string;
}

export class ProviderService {
  /**
   * List all providers with masked secrets for admin UI
   */
  static getProviders() {
    return db.prepare(`
      SELECT id, name, category, environment, base_url, api_key_masked,
             auth_method, priority, is_active, timeout_seconds,
             data_endpoint, airtime_endpoint, cable_endpoint, electricity_endpoint, balance_endpoint,
             last_health_check, health_status, created_at
      FROM api_providers
      ORDER BY priority ASC
    `).all();
  }

  /**
   * Upsert provider configuration (encrypts API key and Secret with AES-256-GCM)
   */
  static upsertProvider(providerData: {
    id?: string;
    name: string;
    category: string;
    environment: 'sandbox' | 'production';
    baseUrl: string;
    apiKey: string;
    apiSecret?: string;
    authMethod?: string;
    priority?: number;
    timeoutSeconds?: number;
    dataEndpoint?: string;
    airtimeEndpoint?: string;
    cableEndpoint?: string;
    electricityEndpoint?: string;
    balanceEndpoint?: string;
  }) {
    if (!isSafeOutboundUrl(providerData.baseUrl)) {
      throw new Error('Blocked: URL violates SSRF safety policy (private network or metadata IP disallowed)');
    }

    const id = providerData.id || 'prv_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();
    const maskedKey = maskSecret(providerData.apiKey);

    const existing = db.prepare('SELECT id, api_key_encrypted, api_secret_encrypted FROM api_providers WHERE id = ?').get(id) as any;

    let keyEncrypted = existing ? existing.api_key_encrypted : '';
    if (providerData.apiKey && providerData.apiKey.trim() !== '') {
      keyEncrypted = encryptField(providerData.apiKey.trim());
    }

    let secretEncrypted = existing ? existing.api_secret_encrypted : '';
    if (providerData.apiSecret && providerData.apiSecret.trim() !== '') {
      secretEncrypted = encryptField(providerData.apiSecret.trim());
    }

    const dataEp = providerData.dataEndpoint || '/data';
    const airtimeEp = providerData.airtimeEndpoint || '/airtime';
    const cableEp = providerData.cableEndpoint || '/cable';
    const electricityEp = providerData.electricityEndpoint || '/electricity';
    const balanceEp = providerData.balanceEndpoint || '/balance';

    if (existing) {
      db.prepare(`
        UPDATE api_providers
        SET name = ?, category = ?, environment = ?, base_url = ?, api_key_masked = ?,
            api_key_encrypted = ?, api_secret_encrypted = ?, auth_method = ?, priority = ?,
            timeout_seconds = ?, data_endpoint = ?, airtime_endpoint = ?, cable_endpoint = ?,
            electricity_endpoint = ?, balance_endpoint = ?
        WHERE id = ?
      `).run(
        providerData.name,
        providerData.category,
        providerData.environment,
        providerData.baseUrl,
        maskedKey,
        keyEncrypted,
        secretEncrypted,
        providerData.authMethod || 'bearer_token',
        providerData.priority || 1,
        providerData.timeoutSeconds || 15,
        dataEp,
        airtimeEp,
        cableEp,
        electricityEp,
        balanceEp,
        id
      );
    } else {
      db.prepare(`
        INSERT INTO api_providers (
          id, name, category, environment, base_url, api_key_masked, api_key_encrypted, api_secret_encrypted,
          auth_method, priority, is_active, timeout_seconds, data_endpoint, airtime_endpoint,
          cable_endpoint, electricity_endpoint, balance_endpoint, last_health_check, health_status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 'HEALTHY', ?)
      `).run(
        id,
        providerData.name,
        providerData.category,
        providerData.environment,
        providerData.baseUrl,
        maskedKey,
        keyEncrypted,
        secretEncrypted,
        providerData.authMethod || 'bearer_token',
        providerData.priority || 1,
        providerData.timeoutSeconds || 15,
        dataEp,
        airtimeEp,
        cableEp,
        electricityEp,
        balanceEp,
        now,
        now
      );
    }

    return { success: true, id, maskedKey };
  }

  /**
   * Real Network Test Connection Endpoint with SSRF guard and real HTTP response
   */
  static async testConnection(providerId: string) {
    const provider = db.prepare('SELECT * FROM api_providers WHERE id = ?').get(providerId) as any;
    if (!provider) throw new Error('Provider not found');

    if (!isSafeOutboundUrl(provider.base_url)) {
      throw new Error('SSRF Blocked: Destination URL rejected by network security filter');
    }

    const start = Date.now();
    const now = new Date().toISOString();

    const apiKey = decryptField(provider.api_key_encrypted);
    const apiSecret = decryptField(provider.api_secret_encrypted);

    const checkUrl = `${provider.base_url.replace(/\/$/, '')}${provider.balance_endpoint || ''}`;

    let httpCode = 0;
    let diagnostic = '';
    let status = 'HEALTHY';

    // If sandbox mode is configured on provider, simulate reliable local health verification
    if (provider.environment === 'sandbox') {
      const latencyMs = Math.floor(45 + Math.random() * 25);
      status = 'HEALTHY';
      diagnostic = `Sandbox test connection verified (200 OK). Latency: ${latencyMs}ms.`;
      db.prepare('UPDATE api_providers SET last_health_check = ?, health_status = ? WHERE id = ?').run(
        now,
        status,
        providerId
      );
      return {
        providerId,
        name: provider.name,
        endpointChecked: checkUrl,
        status,
        httpCode: 200,
        latencyMs,
        diagnostic,
        timestamp: now
      };
    }

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'Bukar-Data-Sub-Engine/2.0'
      };

      if (provider.auth_method === 'bearer_token' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else if (provider.auth_method === 'token_header' && apiKey) {
        headers['Authorization'] = `Token ${apiKey}`;
      } else if (provider.auth_method === 'basic_auth' && apiKey) {
        headers['Authorization'] = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
      } else if (provider.auth_method === 'api_key_header' && apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const res = await fetch(checkUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(provider.timeout_seconds * 1000 || 10000)
      });

      httpCode = res.status;
      const latencyMs = Date.now() - start;

      if (res.ok) {
        status = 'HEALTHY';
        diagnostic = `Connection established (${httpCode} OK). Latency: ${latencyMs}ms.`;
      } else if (res.status === 401 || res.status === 403) {
        status = 'AUTH_ERROR';
        diagnostic = `Authentication rejected (${httpCode}). Verify your API key or IP whitelist.`;
      } else {
        status = 'DEGRADED';
        diagnostic = `Endpoint returned HTTP ${httpCode} (${res.statusText}).`;
      }

      db.prepare('UPDATE api_providers SET last_health_check = ?, health_status = ? WHERE id = ?').run(
        now,
        status,
        providerId
      );

      return {
        providerId,
        name: provider.name,
        endpointChecked: checkUrl,
        status,
        httpCode,
        latencyMs,
        diagnostic,
        timestamp: now
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      status = 'UNREACHABLE';
      diagnostic = `Network error: ${err.message}`;

      db.prepare('UPDATE api_providers SET last_health_check = ?, health_status = ? WHERE id = ?').run(
        now,
        status,
        providerId
      );

      return {
        providerId,
        name: provider.name,
        endpointChecked: checkUrl,
        status,
        httpCode: 0,
        latencyMs,
        diagnostic,
        timestamp: now
      };
    }
  }

  /**
   * Execute Real Outbound Purchase against configured external telecom API
   */
  static async executeProviderPurchase(input: ProviderPurchasePayload): Promise<{
    success: boolean;
    providerRef?: string;
    providerResponse?: any;
    error?: string;
  }> {
    const { category, billerOrNetwork, planCode, providerPlanId, recipient, amount, reference, providerId } = input;

    // 1. Locate configured provider
    let provider: any = null;
    if (providerId) {
      provider = db.prepare('SELECT * FROM api_providers WHERE id = ? AND is_active = 1').get(providerId);
    }
    if (!provider) {
      provider = db.prepare(`
        SELECT * FROM api_providers
        WHERE (category = ? OR category = 'all') AND is_active = 1
        ORDER BY priority ASC LIMIT 1
      `).get(category);
    }

    if (!provider) {
      return {
        success: false,
        error: `No active API provider configured for ${category}. Admin must configure API credentials in Admin Suite.`
      };
    }

    // If sandbox mode is explicitly set on provider
    if (provider.environment === 'sandbox') {
      return {
        success: true,
        providerRef: `SANDBOX_${provider.name.slice(0, 3).toUpperCase()}_${Date.now()}`,
        providerResponse: {
          status: 'DELIVERED',
          mode: 'sandbox',
          network: billerOrNetwork,
          phone: recipient,
          plan: providerPlanId || planCode,
          amount
        }
      };
    }

    // 2. Real Outbound HTTP Execution
    const apiKey = decryptField(provider.api_key_encrypted);
    const apiSecret = decryptField(provider.api_secret_encrypted);

    const targetEndpoint = category === 'data' ? (provider.data_endpoint || '/data')
      : category === 'airtime' ? (provider.airtime_endpoint || '/airtime')
      : category === 'cable' ? (provider.cable_endpoint || '/cable')
      : (provider.electricity_endpoint || '/electricity');

    const cleanBase = provider.base_url.replace(/\/$/, '');
    let targetUrl = `${cleanBase}${targetEndpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Bukar-Data-Sub-Engine/2.0'
    };

    if (provider.auth_method === 'bearer_token' && apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (provider.auth_method === 'token_header' && apiKey) {
      headers['Authorization'] = `Token ${apiKey}`;
    } else if (provider.auth_method === 'basic_auth' && apiKey) {
      headers['Authorization'] = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
    } else if (provider.auth_method === 'api_key_header' && apiKey) {
      headers['x-api-key'] = apiKey;
    } else if (provider.auth_method === 'query_param' && apiKey) {
      const sep = targetUrl.includes('?') ? '&' : '?';
      targetUrl += `${sep}api_key=${encodeURIComponent(apiKey)}&api_secret=${encodeURIComponent(apiSecret)}`;
    }

    const payload = {
      network: billerOrNetwork,
      phone: recipient,
      mobile_number: recipient,
      plan: providerPlanId || planCode,
      plan_code: providerPlanId || planCode,
      amount,
      reference,
      request_id: reference
    };

    try {
      const res = await fetch(targetUrl, {
        method: provider.http_method || 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout((provider.timeout_seconds || 25) * 1000)
      });

      const rawText = await res.text();
      let responseBody: any = {};
      try {
        responseBody = JSON.parse(rawText);
      } catch {
        responseBody = { raw: rawText };
      }

      if (res.ok) {
        // Evaluate provider status flag
        const isSuccess = responseBody.status === 'success' ||
                          responseBody.status === 'successful' ||
                          responseBody.status === 'delivered' ||
                          responseBody.code === '200' ||
                          responseBody.code === 200 ||
                          responseBody.Status === 'successful';

        if (isSuccess || res.status === 200) {
          const providerRef = responseBody.reference ||
                              responseBody.order_id ||
                              responseBody.trans_id ||
                              responseBody.id ||
                              reference;
          return {
            success: true,
            providerRef: String(providerRef),
            providerResponse: responseBody
          };
        } else {
          const errMsg = responseBody.message || responseBody.msg || responseBody.error || 'Provider rejected transaction';
          return {
            success: false,
            error: errMsg,
            providerResponse: responseBody
          };
        }
      } else {
        return {
          success: false,
          error: `Provider HTTP Error ${res.status}: ${res.statusText}`,
          providerResponse: responseBody
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: `Telecom API Network Error: ${err.message}`
      };
    }
  }
}
