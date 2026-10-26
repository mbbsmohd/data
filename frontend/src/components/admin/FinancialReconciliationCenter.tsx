import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, CheckCircle, RefreshCw, AlertCircle,
  FileText, Clock, ArrowRight, User, Wallet, CreditCard, ChevronRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../services/api';

export const FinancialReconciliationCenter: React.FC = () => {
  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const runAudit = async () => {
    try {
      setLoading(true);
      const res = await api.runReconciliationAudit();
      if (res && res.success) {
        setAuditResult(res);
        fetchHistory();
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Audit Failed', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.getReconciliationHistory();
      if (res && res.success) {
        setAuditHistory(res.history || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch audit history:', err);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  const handleResolve = async (discrepancy: any) => {
    const { value: notes, isConfirmed } = await Swal.fire({
      title: 'Resolve Financial Discrepancy',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6;">
          <p><strong>Check:</strong> ${discrepancy.checkType}</p>
          <p><strong>Affected Entity:</strong> <code>${discrepancy.affectedEntity}</code></p>
          <p><strong>Discrepancy:</strong> ${discrepancy.details}</p>
        </div>
      `,
      input: 'textarea',
      inputLabel: 'Audit Resolution Notes & Root Cause Justification',
      inputPlaceholder: 'e.g. Compensating ledger entry created, bank reversal verified, or gateway log confirmed...',
      inputValidator: (val) => (!val ? 'Please provide detailed resolution notes for the compliance audit trail.' : undefined),
      showCancelButton: true,
      confirmButtonText: 'Mark Discrepancy Resolved',
      confirmButtonColor: '#10B981'
    });

    if (isConfirmed && notes && auditResult?.auditId) {
      try {
        await api.resolveReconciliationDiscrepancy(auditResult.auditId, notes);
        Swal.fire({ icon: 'success', title: 'Discrepancy Resolved', timer: 1200, showConfirmButton: false });
        runAudit();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Resolution Failed', text: err.message });
      }
    }
  };

  const summary = auditResult?.summary || {
    walletLedgerMismatches: 0,
    paymentCreditMismatches: 0,
    withdrawalDebitMismatches: 0,
    stalePendingCount: 0,
    negativeWalletCount: 0
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 rounded-2xl text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  5-Point Automated Financial Reconciliation Engine
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  auditResult?.status === 'BALANCED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {auditResult?.status || 'SCANNING'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Continuous double-entry ledger audits preventing unbacked credits, phantom balances, double debits, and orphan transactions.
              </p>
            </div>
          </div>

          <button
            onClick={runAudit}
            disabled={loading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition shadow-sm w-fit active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Run Integrity Scan Now</span>
          </button>
        </div>

        {/* 5 Integrity Check Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Check 1 */}
          <div className={`p-4 rounded-2xl border transition ${
            summary.walletLedgerMismatches === 0
              ? 'bg-emerald-50/40 border-emerald-200'
              : 'bg-rose-50 border-rose-300'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">1. Wallet vs Ledger</span>
              {summary.walletLedgerMismatches === 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <div className={`text-xl font-black ${
              summary.walletLedgerMismatches === 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {summary.walletLedgerMismatches === 0 ? 'Matched (0)' : `${summary.walletLedgerMismatches} Discrepancy`}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Wallet balance = ∑(Credits - Debits)</span>
          </div>

          {/* Check 2 */}
          <div className={`p-4 rounded-2xl border transition ${
            summary.paymentCreditMismatches === 0
              ? 'bg-emerald-50/40 border-emerald-200'
              : 'bg-rose-50 border-rose-300'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">2. Inflows vs Credits</span>
              {summary.paymentCreditMismatches === 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <div className={`text-xl font-black ${
              summary.paymentCreditMismatches === 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {summary.paymentCreditMismatches === 0 ? 'Balanced (0)' : `${summary.paymentCreditMismatches} Unbacked`}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Confirmed payments = Ledger credits</span>
          </div>

          {/* Check 3 */}
          <div className={`p-4 rounded-2xl border transition ${
            summary.withdrawalDebitMismatches === 0
              ? 'bg-emerald-50/40 border-emerald-200'
              : 'bg-rose-50 border-rose-300'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">3. Payouts vs Debits</span>
              {summary.withdrawalDebitMismatches === 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <div className={`text-xl font-black ${
              summary.withdrawalDebitMismatches === 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {summary.withdrawalDebitMismatches === 0 ? 'Balanced (0)' : `${summary.withdrawalDebitMismatches} Discrepancy`}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Paid cashouts = Ledger debits</span>
          </div>

          {/* Check 4 */}
          <div className={`p-4 rounded-2xl border transition ${
            summary.stalePendingCount === 0
              ? 'bg-emerald-50/40 border-emerald-200'
              : 'bg-amber-50 border-amber-300'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">4. Stale Pending</span>
              {summary.stalePendingCount === 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600" />
              )}
            </div>
            <div className={`text-xl font-black ${
              summary.stalePendingCount === 0 ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {summary.stalePendingCount === 0 ? '0 Stale' : `${summary.stalePendingCount} Pending`}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Pending orders &gt; 30 minutes</span>
          </div>

          {/* Check 5 */}
          <div className={`p-4 rounded-2xl border transition ${
            summary.negativeWalletCount === 0
              ? 'bg-emerald-50/40 border-emerald-200'
              : 'bg-rose-50 border-rose-300'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">5. Wallet Overdrafts</span>
              {summary.negativeWalletCount === 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <div className={`text-xl font-black ${
              summary.negativeWalletCount === 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {summary.negativeWalletCount === 0 ? '0 Overdrafts' : `${summary.negativeWalletCount} Negative`}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Zero customer negative balances</span>
          </div>
        </div>
      </div>

      {/* Discrepancies Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Live Audit Scan Findings ({auditResult?.totalDiscrepancies || 0})
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Every audit exception is captured with cryptographic timestamps and compensating transaction references.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Scanning double-entry ledger database...</p>
          </div>
        ) : !auditResult?.discrepancies || auditResult.discrepancies.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50/30 border border-emerald-200 rounded-2xl space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-emerald-900">100% Balanced & Reconciled</h4>
            <p className="text-xs text-emerald-700 max-w-md mx-auto">
              All customer wallets, gateway payment requests, and double-entry ledger entries are mathematically verified with zero discrepancy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                  <th className="py-3 px-4 rounded-l-xl">Severity</th>
                  <th className="py-3 px-4">Audit Check Type</th>
                  <th className="py-3 px-4">Affected Entity / ID</th>
                  <th className="py-3 px-4">Discrepancy Details</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditResult.discrepancies.map((d: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        d.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : d.severity === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{d.checkType}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-blue-700">{d.affectedEntity}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-md">{d.details}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleResolve(d)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition"
                      >
                        Resolve Discrepancy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Audit Trail */}
      {auditHistory.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Recent Reconciliation Runs & Resolution Audit Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                  <th className="py-3 px-4 rounded-l-xl">Audit Run ID</th>
                  <th className="py-3 px-4">Result Status</th>
                  <th className="py-3 px-4">Discrepancy Count</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Resolution Notes</th>
                  <th className="py-3 px-4 rounded-r-xl">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditHistory.map((h: any) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-[11px] text-blue-700">{h.id}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        h.status === 'BALANCED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : h.status === 'RESOLVED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{h.discrepancy_count}</td>
                    <td className="py-3 px-4 text-slate-600">{h.performed_by}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{h.resolution_notes || '—'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(h.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
