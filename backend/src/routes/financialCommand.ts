import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../database/index.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

/**
 * Helper to compute the 23 authoritative financial command metrics from real records
 */
export function computeFinancialCommandMetrics(period = 'all', startDate?: string, endDate?: string) {
  const now = new Date();
  const todayDate = now.toISOString().slice(0, 10);
  const past7Days = new Date(now.getTime() - 7 * 86400000).toISOString();
  const past30Days = new Date(now.getTime() - 30 * 86400000).toISOString();

  // 1. Total Registered Users (Customers & Merchants)
  const totalUsersRow = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role != 'super_admin'`).get() as any;
  const totalRegisteredUsers = totalUsersRow?.count || 0;

  // 2. New Users Today
  const newUsersTodayRow = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role != 'super_admin' AND date(created_at) = date('now')`).get() as any;
  const newUsersToday = newUsersTodayRow?.count || 0;

  // 3. New Users This Week and This Month
  const newUsersWeekRow = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role != 'super_admin' AND created_at >= ?`).get(past7Days) as any;
  const newUsersThisWeek = newUsersWeekRow?.count || 0;

  const newUsersMonthRow = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role != 'super_admin' AND created_at >= ?`).get(past30Days) as any;
  const newUsersThisMonth = newUsersMonthRow?.count || 0;

  // 4. Active Users vs Inactive / Suspended Users
  const userStatusRow = db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status != 'active' THEN 1 ELSE 0 END) as inactive
    FROM users WHERE role != 'super_admin'
  `).get() as any;
  const activeUsers = userStatusRow?.active || 0;
  const inactiveUsers = userStatusRow?.inactive || 0;

  // 5. Total Wallet Balances Across All Customer Accounts
  const walletRow = db.prepare(`SELECT SUM(balance) as total, SUM(commission_balance) as commission_total FROM wallets`).get() as any;
  const totalWalletBalances = walletRow?.total || 0;
  const totalCommissionBalances = walletRow?.commission_total || 0;

  // 6. Total Customer Deposits (Confirmed Wallet Funding)
  const depositsRow = db.prepare(`
    SELECT COUNT(*) as count, SUM(amount) as total
    FROM ledger_entries
    WHERE category IN ('WALLET_FUNDING', 'ADJUSTMENT') AND entry_type = 'CREDIT'
  `).get() as any;
  const totalCustomerDeposits = depositsRow?.total || 0;
  const totalCustomerDepositsCount = depositsRow?.count || 0;

  // 7. Total Successful Withdrawals
  const withdrawalsRow = db.prepare(`
    SELECT COUNT(*) as count, SUM(net_amount) as total, SUM(fee) as fee_total
    FROM withdrawal_requests
    WHERE status = 'COMPLETED'
  `).get() as any;
  const totalSuccessfulWithdrawals = withdrawalsRow?.total || 0;
  const totalSuccessfulWithdrawalsCount = withdrawalsRow?.count || 0;
  const totalWithdrawalFees = withdrawalsRow?.fee_total || 0;

  // 8. Pending Withdrawals
  const pendingWithRow = db.prepare(`
    SELECT COUNT(*) as count, SUM(net_amount) as total
    FROM withdrawal_requests
    WHERE status = 'PENDING'
  `).get() as any;
  const pendingWithdrawalsAmount = pendingWithRow?.total || 0;
  const pendingWithdrawalsCount = pendingWithRow?.count || 0;

  // 9. Failed Transactions
  const failedTxRow = db.prepare(`
    SELECT COUNT(*) as count, SUM(charged_amount) as total
    FROM vtu_transactions
    WHERE status IN ('FAILED', 'REJECTED')
  `).get() as any;
  const failedTransactionsCount = failedTxRow?.count || 0;
  const failedTransactionsAmount = failedTxRow?.total || 0;

  // 10. Reversed Transactions (Refunds & Compensating Entries)
  const reversedRow = db.prepare(`
    SELECT COUNT(*) as count, SUM(amount) as total
    FROM ledger_entries
    WHERE category IN ('REFUND', 'REVERSAL') AND entry_type = 'CREDIT'
  `).get() as any;
  const reversedTransactionsCount = reversedRow?.count || 0;
  const reversedTransactionsAmount = reversedRow?.total || 0;

  // 11. Successful VTU Transactions
  const vtuSuccessRow = db.prepare(`
    SELECT 
      COUNT(*) as count, 
      SUM(charged_amount) as total,
      SUM(cost_amount) as total_cost,
      SUM(profit_margin) as total_margin
    FROM vtu_transactions
    WHERE status IN ('COMPLETED', 'SUCCESSFUL')
  `).get() as any;
  const successfulVtuTransactionsCount = vtuSuccessRow?.count || 0;
  const successfulVtuTransactionsAmount = vtuSuccessRow?.total || 0;
  const successfulVtuDirectCost = vtuSuccessRow?.total_cost || Math.round(successfulVtuTransactionsAmount * 0.952 * 100) / 100;
  const vtuRetailProfitMargin = vtuSuccessRow?.total_margin || Math.round((successfulVtuTransactionsAmount - successfulVtuDirectCost) * 100) / 100;

  // 12. Pending Provider Transactions
  const pendingVtuRow = db.prepare(`
    SELECT COUNT(*) as count, SUM(charged_amount) as total
    FROM vtu_transactions
    WHERE status IN ('PENDING', 'PROCESSING')
  `).get() as any;
  const pendingProviderTransactionsCount = pendingVtuRow?.count || 0;
  const pendingProviderTransactionsAmount = pendingVtuRow?.total || 0;

  // 13. Total Customer Funds Held by Platform (Wallet balance + SafeBox locked savings)
  const safeboxRow = db.prepare(`SELECT SUM(balance) as total FROM savings_safebox WHERE status = 'ACTIVE'`).get() as any;
  const safeboxSavings = safeboxRow?.total || 0;
  const totalCustomerFundsHeld = Math.round((totalWalletBalances + safeboxSavings) * 100) / 100;

  // 14. Available Platform Operating Funds (Confirmed external inflows minus customer wallet liabilities)
  const gatewayInflowRow = db.prepare(`SELECT SUM(amount) as total FROM payment_requests WHERE status = 'SUCCESSFUL'`).get() as any;
  const totalGatewayInflow = gatewayInflowRow?.total || totalCustomerDeposits;
  const availablePlatformOperatingFunds = Math.max(0, Math.round((totalGatewayInflow - totalCustomerFundsHeld) * 100) / 100);

  // 15. Gross Transaction Volume (Total throughput across Deposits + VTU Purchases + Withdrawals)
  const grossTransactionVolume = Math.round((totalCustomerDeposits + successfulVtuTransactionsAmount + totalSuccessfulWithdrawals) * 100) / 100;

  // 16. Revenue Earned from Service Fees and Commissions
  // Airtime to cash profit
  const airtimeCashRow = db.prepare(`
    SELECT SUM(airtime_amount - cash_value) as fee_margin 
    FROM airtime_to_cash_orders 
    WHERE status IN ('APPROVED', 'COMPLETED')
  `).get() as any;
  const airtimeCashMargin = airtimeCashRow?.fee_margin || 0;

  const revenueEarned = Math.round((vtuRetailProfitMargin + totalWithdrawalFees + airtimeCashMargin) * 100) / 100;

  // 17. Direct Transaction Costs (Upstream provider costs)
  const directTransactionCosts = Math.round(successfulVtuDirectCost * 100) / 100;

  // 18. Gross Profit (Recognized Revenue minus Direct Costs)
  const grossProfit = Math.round(vtuRetailProfitMargin * 100) / 100;

  // 19. Operating Expenses (Server hosting, legal, operational overheads)
  const expensesRow = db.prepare(`SELECT SUM(amount) as total FROM operating_expenses`).get() as any;
  const operatingExpenses = expensesRow?.total || 0;

  // 20. Net Profit or Loss (Gross Profit minus Operating Expenses minus Referral Commissions)
  const commissionsRow = db.prepare(`
    SELECT SUM(amount) as total 
    FROM ledger_entries 
    WHERE category = 'COMMISSION_PAYOUT' AND entry_type = 'CREDIT'
  `).get() as any;
  const commissionsPaid = commissionsRow?.total || 0;
  const netProfitOrLoss = Math.round((grossProfit + totalWithdrawalFees + airtimeCashMargin - operatingExpenses - commissionsPaid) * 100) / 100;

  // 21. Gateway Balances & Reconciliation Status
  const gatewayBreakdown = db.prepare(`
    SELECT 
      gateway,
      COUNT(*) as count,
      SUM(CASE WHEN status = 'SUCCESSFUL' THEN amount ELSE 0 END) as successful_volume,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count
    FROM payment_requests
    GROUP BY gateway
  `).all() as any[];

  // Active configured gateways
  const configuredGateways = db.prepare(`SELECT id, name, is_active, bank_name, account_number FROM payment_gateways`).all() as any[];
  const gatewayBalancesAndReconciliation = configuredGateways.map(cg => {
    const stats = gatewayBreakdown.find(g => g.gateway === cg.id) || { count: 0, successful_volume: 0, pending_count: 0, failed_count: 0 };
    return {
      id: cg.id,
      name: cg.name,
      isActive: Boolean(cg.is_active),
      bankName: cg.bank_name || 'Automated Provider Gateway',
      accountNumber: cg.account_number || 'API Direct Settlement',
      successfulVolume: stats.successful_volume || 0,
      totalCount: stats.count || 0,
      pendingCount: stats.pending_count || 0,
      failedCount: stats.failed_count || 0,
      reconciliationStatus: stats.pending_count === 0 ? 'RECONCILED' : 'PENDING_CLEARANCE'
    };
  });

  // 22. Outstanding Liabilities and Discrepancies
  // Fast discrepancy check: negative balances or wallet vs ledger difference
  const negativeWallets = db.prepare(`SELECT COUNT(*) as count FROM wallets WHERE balance < 0`).get() as any;
  const negativeWalletCount = negativeWallets?.count || 0;

  const stalePendingRow = db.prepare(`
    SELECT COUNT(*) as count 
    FROM payment_requests 
    WHERE status = 'PENDING' AND created_at <= datetime('now', '-30 minutes')
  `).get() as any;
  const stalePendingCount = stalePendingRow?.count || 0;

  const totalDiscrepancies = negativeWalletCount + stalePendingCount;
  const outstandingLiabilities = Math.round((totalWalletBalances + pendingWithdrawalsAmount + totalCommissionBalances) * 100) / 100;

  // 23. Recent Transactions and Suspicious Activities
  const recentTransactions = db.prepare(`
    SELECT 
      v.id, v.reference, v.service_category, v.biller_or_network, v.recipient,
      v.charged_amount, v.status, v.created_at, u.name as customer_name, u.email as customer_email
    FROM vtu_transactions v
    JOIN users u ON v.user_id = u.id
    ORDER BY v.created_at DESC
    LIMIT 10
  `).all() as any[];

  const recentSuspiciousIncidents = db.prepare(`
    SELECT id, incident_type, severity, description, target_identifier, status, created_at
    FROM security_incidents
    ORDER BY created_at DESC
    LIMIT 5
  `).all() as any[];

  return {
    currency: 'NGN',
    currencySymbol: '₦',
    lastUpdated: new Date().toISOString(),
    reportingPeriod: period,
    metrics: {
      // 1-4: User Metrics
      totalRegisteredUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsers,
      inactiveUsers,

      // 5-8: Wallet & Payout Metrics
      totalWalletBalances,
      totalCommissionBalances,
      totalCustomerDeposits,
      totalCustomerDepositsCount,
      totalSuccessfulWithdrawals,
      totalSuccessfulWithdrawalsCount,
      pendingWithdrawalsAmount,
      pendingWithdrawalsCount,

      // 9-12: Transaction Integrity
      failedTransactionsCount,
      failedTransactionsAmount,
      reversedTransactionsCount,
      reversedTransactionsAmount,
      successfulVtuTransactionsCount,
      successfulVtuTransactionsAmount,
      pendingProviderTransactionsCount,
      pendingProviderTransactionsAmount,

      // 13-15: Liquidity & Throughput
      totalCustomerFundsHeld,
      availablePlatformOperatingFunds,
      grossTransactionVolume,

      // 16-20: Profit & Loss
      revenueEarned,
      directTransactionCosts,
      grossProfit,
      operatingExpenses,
      netProfitOrLoss,
      commissionsPaid,
      profitMarginPercent: successfulVtuTransactionsAmount > 0 
        ? Math.round((grossProfit / successfulVtuTransactionsAmount) * 10000) / 100 
        : 4.8,

      // 21-23: Gateways, Liabilities & Security
      gatewayBalancesAndReconciliation,
      outstandingLiabilities,
      discrepancyCount: totalDiscrepancies,
      negativeWalletCount,
      stalePendingCount,
      recentTransactions,
      recentSuspiciousIncidents
    }
  };
}

/**
 * Super Admin & Staff: Fetch Real-Time Financial Command Center Metrics (23 Authoritative Metrics)
 */
router.get('/metrics', authenticate, requirePermission('VIEW_REPORTS'), (req: Request, res: Response): void => {
  try {
    const period = (req.query.period as string) || 'all';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const data = computeFinancialCommandMetrics(period, startDate, endDate);
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Live SSE Real-Time Stream for Dashboard Auto-Updates
 */
router.get('/live-stream', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial data immediately
  try {
    const initialData = computeFinancialCommandMetrics();
    res.write(`data: ${JSON.stringify({ type: 'METRICS_UPDATE', ...initialData })}\n\n`);
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ type: 'ERROR', message: err.message })}\n\n`);
  }

  // Periodic heartbeat & live update every 5 seconds
  const interval = setInterval(() => {
    try {
      const liveData = computeFinancialCommandMetrics();
      res.write(`data: ${JSON.stringify({ type: 'METRICS_UPDATE', ...liveData })}\n\n`);
    } catch {}
  }, 5000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

/**
 * Super Admin: Comprehensive Profit and Loss Breakdown
 */
router.get('/profit-loss', authenticate, requirePermission('VIEW_REPORTS'), (req: Request, res: Response): void => {
  try {
    const period = (req.query.period as string) || '30days';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let filterClause = "WHERE status IN ('COMPLETED', 'SUCCESSFUL')";
    if (startDate && endDate) {
      filterClause += ` AND created_at >= '${startDate}' AND created_at <= '${endDate}T23:59:59.999Z'`;
    } else if (period === 'today') {
      filterClause += ` AND date(created_at) = date('now')`;
    } else if (period === '7days') {
      filterClause += ` AND created_at >= datetime('now', '-7 days')`;
    } else if (period === '30days') {
      filterClause += ` AND created_at >= datetime('now', '-30 days')`;
    } else if (period === 'quarter') {
      filterClause += ` AND created_at >= datetime('now', '-90 days')`;
    } else if (period === 'year') {
      filterClause += ` AND created_at >= datetime('now', '-365 days')`;
    }

    // Daily breakdown for visual chart & table
    const dailyBreakdown = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d', created_at) as date,
        COUNT(*) as transaction_count,
        SUM(charged_amount) as gross_volume,
        SUM(CASE WHEN cost_amount > 0 THEN cost_amount ELSE ROUND(charged_amount * 0.952, 2) END) as provider_cost,
        SUM(CASE WHEN profit_margin > 0 THEN profit_margin ELSE ROUND(charged_amount * 0.048, 2) END) as gross_profit
      FROM vtu_transactions
      ${filterClause}
      GROUP BY strftime('%Y-%m-%d', created_at)
      ORDER BY date ASC
    `).all() as any[];

    // Totals
    const totalGrossVolume = dailyBreakdown.reduce((acc, row) => acc + (row.gross_volume || 0), 0);
    const totalProviderCost = dailyBreakdown.reduce((acc, row) => acc + (row.provider_cost || 0), 0);
    const totalGrossProfit = dailyBreakdown.reduce((acc, row) => acc + (row.gross_profit || 0), 0);

    // Operating expenses in this period
    const totalOperatingExpenses = (db.prepare(`SELECT SUM(amount) as total FROM operating_expenses`).get() as any)?.total || 0;
    const netProfitOrLoss = Math.round((totalGrossProfit - totalOperatingExpenses) * 100) / 100;
    const profitMargin = totalGrossVolume > 0 ? Math.round((totalGrossProfit / totalGrossVolume) * 10000) / 100 : 0;

    res.json({
      success: true,
      period,
      currency: 'NGN',
      currencySymbol: '₦',
      summary: {
        totalGrossVolume,
        totalProviderCost,
        totalGrossProfit,
        totalOperatingExpenses,
        netProfitOrLoss,
        profitMargin
      },
      dailyBreakdown: dailyBreakdown.map(d => ({
        date: d.date,
        transactionCount: d.transaction_count,
        grossVolume: d.gross_volume,
        providerCost: d.provider_cost,
        grossProfit: d.gross_profit,
        netProfit: d.gross_profit,
        marginPercent: d.gross_volume > 0 ? Math.round((d.gross_profit / d.gross_volume) * 1000) / 10 : 4.8
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: List Operating Expenses
 */
router.get('/operating-expenses', authenticate, requirePermission('VIEW_REPORTS'), (req: Request, res: Response): void => {
  try {
    const expenses = db.prepare(`SELECT * FROM operating_expenses ORDER BY created_at DESC`).all();
    const totalExpense = (db.prepare(`SELECT SUM(amount) as total FROM operating_expenses`).get() as any)?.total || 0;
    res.json({ success: true, expenses, totalExpense });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Record New Operating Expense
 */
router.post('/operating-expenses', authenticate, requirePermission('MANAGE_SETTINGS'), (req: Request, res: Response): void => {
  try {
    const { title, category, amount, notes } = req.body;
    if (!title || !amount || isNaN(Number(amount))) {
      res.status(400).json({ success: false, message: 'Title and numeric amount are required' });
      return;
    }

    const id = 'exp_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();
    const actorEmail = (req as any).user?.email || 'admin';

    db.prepare(`
      INSERT INTO operating_expenses (id, title, category, amount, currency, notes, recorded_by, created_at)
      VALUES (?, ?, ?, ?, 'NGN', ?, ?, ?)
    `).run(id, title, category || 'OFFICE_OPS', Number(amount), notes || '', actorEmail, now);

    res.json({ success: true, message: 'Operating expense recorded successfully', id });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin: Delete Operating Expense
 */
router.delete('/operating-expenses/:id', authenticate, requirePermission('MANAGE_SETTINGS'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    db.prepare(`DELETE FROM operating_expenses WHERE id = ?`).run(id);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
