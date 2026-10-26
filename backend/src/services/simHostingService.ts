import crypto from 'crypto';
import { db } from '../database/index.js';

export class SimHostingService {
  /**
   * List all hosted SIM lines and status
   */
  static getHostedSims() {
    return db.prepare('SELECT * FROM sim_hosts ORDER BY sim_slot ASC').all();
  }

  /**
   * Run USSD code on a hosted SIM (e.g. check balance, trigger data transfer)
   */
  static async executeUSSD(simId: string, ussdCode: string) {
    const sim = db.prepare('SELECT * FROM sim_hosts WHERE id = ?').get(simId) as any;
    if (!sim) throw new Error('Hosted SIM slot not found');
    if (sim.status !== 'ONLINE') throw new Error(`SIM is currently ${sim.status}`);

    const now = new Date().toISOString();
    // Simulated telecom USSD gateway exchange
    let responseText = '';
    if (ussdCode.startsWith('*556') || ussdCode.startsWith('*123') || ussdCode.startsWith('*124')) {
      responseText = `Main Balance: ₦${sim.airtime_balance.toFixed(2)}. Bonus: ₦1,420.00. Valid till 28-Nov-2026.`;
    } else {
      responseText = `USSD Request '${ussdCode}' sent successfully to ${sim.network} network. Acknowledged by MSC.`;
    }

    db.prepare('UPDATE sim_hosts SET last_heartbeat = ? WHERE id = ?').run(now, simId);

    return {
      success: true,
      simId,
      network: sim.network,
      phoneNumber: sim.phone_number,
      ussdCode,
      networkResponse: responseText,
      timestamp: now
    };
  }

  /**
   * Add or update hosted SIM line
   */
  static upsertSim(simData: {
    id?: string;
    providerName: string;
    serverUrl: string;
    simSlot: number;
    phoneNumber: string;
    network: string;
    dailySmsLimit?: number;
    ussdCodeTemplate?: string;
  }) {
    const id = simData.id || 'sim_slot_' + crypto.randomBytes(4).toString('hex');
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT id FROM sim_hosts WHERE id = ?').get(id);
    if (existing) {
      db.prepare(`
        UPDATE sim_hosts
        SET provider_name = ?, server_url = ?, sim_slot = ?, phone_number = ?, network = ?, daily_sms_limit = ?, ussd_code_template = ?
        WHERE id = ?
      `).run(
        simData.providerName,
        simData.serverUrl,
        simData.simSlot,
        simData.phoneNumber,
        simData.network,
        simData.dailySmsLimit || 1000,
        simData.ussdCodeTemplate || '*556#',
        id
      );
    } else {
      db.prepare(`
        INSERT INTO sim_hosts (
          id, provider_name, server_url, sim_slot, phone_number, network,
          airtime_balance, status, last_heartbeat, daily_sms_sent, daily_sms_limit, ussd_code_template, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 10000.0, 'ONLINE', ?, 0, ?, ?, ?)
      `).run(
        id,
        simData.providerName,
        simData.serverUrl,
        simData.simSlot,
        simData.phoneNumber,
        simData.network,
        now,
        simData.dailySmsLimit || 1000,
        simData.ussdCodeTemplate || '*556#',
        now
      );
    }

    return { success: true, id };
  }
}
