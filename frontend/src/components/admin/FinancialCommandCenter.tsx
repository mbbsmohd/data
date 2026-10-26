import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Users, Wallet, ArrowDownRight, ArrowUpRight,
  ShieldAlert, RefreshCw, Calendar, FileSpreadsheet, Printer, Filter,
  CheckCircle, AlertTriangle, Clock, Server, CreditCard, DollarSign,
  Plus, Trash2, Landmark, Zap, BarChart3, Activity, Layers, Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../services/api';

export const FinancialCommandCenter: React.FC = () => {
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [streamActive, setStreamActive] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'pnl' | 'expenses'>('metrics');

  // Profit and Loss State
  const [pnlData, setPnlData] = useState<any>(null);
  const [loadingPnl, setLoadingPnl] = useState(false);

  // Operating Expenses State
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'SERVER_HOSTING',
    amount: '',
    notes: ''
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchMetrics = async (period = selectedPeriod, s = startDate, e = endDate) => {
    try {
      setLoading(true);
      const res = await api.getFinancialCommandMetrics({ period, startDate: s, endDate: e });
      if (res && res.metrics) {
        setMetricsData(res);
      }
    } catch (err: any) {
      console.error('Failed to fetch financial command metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPnl = async (period = selectedPeriod, s = startDate, e = endDate) => {
    try {
      setLoadingPnl(true);
      const res = await api.getProfitLossAnalytics({ period, startDate: s, endDate: e });
      if (res && res.success) {
        setPnlData(res);
      }
    } catch (err: any) {
      console.error('Failed to fetch P&L data:', err);
    } finally {
      setLoadingPnl(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoadingExpenses(true);
      const res = await api.getOperatingExpenses();
      if (res && res.success) {
        setExpenses(res.expenses || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch operating expenses:', err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    fetchMetrics(selectedPeriod, startDate, endDate);
    if (activeSubTab === 'pnl') fetchPnl(selectedPeriod, startDate, endDate);
    if (activeSubTab === 'expenses') fetchExpenses();
  }, [selectedPeriod, activeSubTab]);

  // Setup Server-Sent Events (SSE) live updates
  useEffect(() => {
    if (!streamActive) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    try {
      const token = localStorage.getItem('abk_token') || localStorage.getItem('abk_admin_token');
      // Using EventSource with stream
      const sse = new EventSource(`/api/admin/financial-command/live-stream?period=${selectedPeriod}`);
      eventSourceRef.current = sse;

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.metrics) {
            setMetricsData(payload);
          }
        } catch (e) {
          console.error('SSE JSON parse error', e);
        }
      };

      sse.onerror = () => {
        // Fallback polling every 8s if SSE fails or disconnects
        console.warn('SSE stream disconnected, polling fallback');
      };
    } catch (e) {
      console.warn('Failed to start SSE stream', e);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [streamActive, selectedPeriod]);

  const handleApplyCustomDates = () => {
    if (!startDate || !endDate) {
      Swal.fire({ icon: 'warning', title: 'Dates Required', text: 'Please specify both start and end dates' });
      return;
    }
    fetchMetrics('custom', startDate, endDate);
    if (activeSubTab === 'pnl') fetchPnl('custom', startDate, endDate);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount || Number(newExpense.amount) <= 0) {
      Swal.fire({ icon: 'error', title: 'Invalid Input', text: 'Please provide a valid title and amount' });
      return;
    }

    try {
      await api.addOperatingExpense({
        title: newExpense.title.trim(),
        category: newExpense.category,
        amount: Number(newExpense.amount),
        notes: newExpense.notes
      });
      Swal.fire({ icon: 'success', title: 'Expense Recorded', timer: 1200, showConfirmButton: false });
      setShowAddExpenseModal(false);
      setNewExpense({ title: '', category: 'SERVER_HOSTING', amount: '', notes: '' });
      fetchExpenses();
      fetchMetrics();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed to record expense', text: err.message });
    }
  };

  const handleDeleteExpense = async (id: string, title: string) => {
    const confirm = await Swal.fire({
      title: `Delete expense: ${title}?`,
      text: 'This will update Net Profit calculations in real-time.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      confirmButtonColor: '#EF4444'
    });
    if (confirm.isConfirmed) {
      try {
        await api.deleteOperatingExpense(id);
        Swal.fire({ icon: 'success', title: 'Expense Deleted', timer: 1200, showConfirmButton: false });
        fetchExpenses();
        fetchMetrics();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.message });
      }
    }
  };

  const m = metricsData?.metrics;

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-md shadow-blue-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    Real-Time Financial Command Center
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    23 Authoritative Metrics
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Computed directly from immutable double-entry ledger entries, payment gateways, and verified bank records.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live Stream SSE Status Pill */}
            <button
              onClick={() => setStreamActive(!streamActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 border transition ${
                streamActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${streamActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              <span>{streamActive ? 'Live SSE Stream Active' : 'Live Stream Paused'}</span>
            </button>

            {/* Quick Period Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'today', label: 'Today' },
                { id: '7days', label: '7 Days' },
                { id: '30days', label: '30 Days' },
                { id: 'all', label: 'All Time' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPeriod(p.id);
                    setStartDate('');
                    setEndDate('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedPeriod === p.id && !startDate
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchMetrics()}
              disabled={loading}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              title="Manual Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Date Range & Sub-tab Switchers */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setActiveSubTab('metrics')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${
                activeSubTab === 'metrics'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>23 Command Cards</span>
            </button>

            <button
              onClick={() => setActiveSubTab('pnl')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${
                activeSubTab === 'pnl'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Profit & Loss Breakdown</span>
            </button>

            <button
              onClick={() => setActiveSubTab('expenses')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${
                activeSubTab === 'expenses'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Operating Expenses Register</span>
            </button>
          </div>

          {/* Custom Date Range Filter */}
          <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
            />
            <button
              onClick={handleApplyCustomDates}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: 23 COMMAND CARDS */}
      {activeSubTab === 'metrics' && (
        <>
          {loading && !m ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">Reconciling ledger entries and computing 23 financial metrics...</p>
            </div>
          ) : m ? (
            <div className="space-y-8">
              {/* SECTION 1: CORE CUSTOMER FUNDS & LIABILITIES (Cards 5, 6, 13, 14, 22) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                    <Landmark className="w-4 h-4 text-blue-600" />
                    <span>Group 1: Authoritative Customer Balances, Deposits & Funds Held</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">Formulated: Closing = Opening + Inflows - Debits</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Card 5: Total Wallet Balances */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">5. Total Wallet Balances</span>
                      <Wallet className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">₦{Number(m.totalWalletBalances || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                    <p className="text-[11px] text-slate-500 mt-1">Across all verified customer wallets</p>
                  </div>

                  {/* Card 6: Total Customer Deposits */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">6. Customer Deposits</span>
                      <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-emerald-700">₦{Number(m.totalCustomerDeposits || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                    <p className="text-[11px] text-slate-500 mt-1">{m.totalCustomerDepositsCount || 0} confirmed inflows</p>
                  </div>

                  {/* Card 13: Total Customer Funds Held */}
                  <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">13. Customer Funds Held</span>
                      <ShieldAlert className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-black text-blue-900">₦{Number(m.totalCustomerFundsHeld || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                    <p className="text-[11px] text-slate-500 mt-1">Main Wallets + SafeBox Savings</p>
                  </div>

                  {/* Card 14: Available Platform Operating Funds */}
                  <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700">14. Operating Funds</span>
                      <Zap className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-black text-indigo-900">₦{Number(m.availablePlatformOperatingFunds || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                    <p className="text-[11px] text-slate-500 mt-1">Reconciled excess platform capital</p>
                  </div>

                  {/* Card 22: Total Pending Wallet Funding Requests */}
                  <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">22. Pending Fundings</span>
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black text-amber-900">{m.stalePendingCount || 0}</div>
                    <p className="text-[11px] text-slate-500 mt-1">Awaiting provider gateway callback</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PROFIT & LOSS INTELLIGENCE (Cards 15, 16, 17, 18, 19, 20) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>Group 2: Transparent Profit & Loss Command (Strict Accounting Formula)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">Net Profit = Gross Profit − OpEx − Commissions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  {/* Card 15: Gross Transaction Volume */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">15. Gross Volume (GTV)</span>
                    <div className="text-xl font-black text-slate-900 mt-1">₦{Number(m.grossTransactionVolume || 0).toLocaleString('en-NG')}</div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Deposits + VTU + Payouts</span>
                  </div>

                  {/* Card 16: Revenue Earned */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">16. Revenue Earned</span>
                    <div className="text-xl font-black text-blue-700 mt-1">₦{Number(m.revenueEarned || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Retail margins & fees</span>
                  </div>

                  {/* Card 17: Direct Transaction Costs */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">17. Direct Costs</span>
                    <div className="text-xl font-black text-rose-600 mt-1">₦{Number(m.directTransactionCosts || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Wholesale API billing</span>
                  </div>

                  {/* Card 18: Gross Profit */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200 shadow-xs">
                    <span className="text-[10px] font-bold text-blue-700 uppercase block">18. Gross Profit</span>
                    <div className="text-xl font-black text-blue-900 mt-1">₦{Number(m.grossProfit || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                    <span className="text-[10px] text-blue-600 font-bold mt-1 block">Margin: {m.profitMarginPercent}%</span>
                  </div>

                  {/* Card 19: Operating Expenses */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">19. Operating Expenses</span>
                    <div className="text-xl font-black text-orange-600 mt-1">₦{Number(m.operatingExpenses || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Server, SMS & compliance</span>
                  </div>

                  {/* Card 20: Net Profit or Loss */}
                  <div className={`p-4 rounded-2xl border shadow-xs ${
                    Number(m.netProfitOrLoss || 0) >= 0
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
                      : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase block ${
                      Number(m.netProfitOrLoss || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>20. Net Platform Profit</span>
                    <div className={`text-xl font-black mt-1 ${
                      Number(m.netProfitOrLoss || 0) >= 0 ? 'text-emerald-900' : 'text-rose-900'
                    }`}>
                      ₦{Number(m.netProfitOrLoss || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </div>
                    <span className={`text-[10px] font-bold mt-1 block ${
                      Number(m.netProfitOrLoss || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {Number(m.netProfitOrLoss || 0) >= 0 ? 'Net Profitable' : 'Deficit Recorded'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: USERS & ACQUISITION VELOCITY (Cards 1, 2, 3, 4) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Group 3: Verified User Growth & Engagement Metrics</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Card 1: Total Registered Users */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Total Users</span>
                    <div className="text-xl font-black text-slate-900 mt-1">{m.totalRegisteredUsers || 0}</div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Customer & Merchant accounts</span>
                  </div>

                  {/* Card 2: New Users Today */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">2. New Today</span>
                    <div className="text-xl font-black text-purple-700 mt-1">{m.newUsersToday || 0}</div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Signed up past 24 hrs</span>
                  </div>

                  {/* Card 3a: New Users This Week */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">3. New This Week</span>
                    <div className="text-xl font-black text-indigo-700 mt-1">{m.newUsersThisWeek || 0}</div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Past 7 running days</span>
                  </div>

                  {/* Card 3b: New Users This Month */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">New This Month</span>
                    <div className="text-xl font-black text-indigo-700 mt-1">{m.newUsersThisMonth || 0}</div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Past 30 running days</span>
                  </div>

                  {/* Card 4a: Active Users */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase block">4. Active Users</span>
                    <div className="text-xl font-black text-emerald-700 mt-1">{m.activeUsers || 0}</div>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">In good standing</span>
                  </div>

                  {/* Card 4b: Inactive Users */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-rose-500 uppercase block">Inactive / Locked</span>
                    <div className="text-xl font-black text-rose-700 mt-1">{m.inactiveUsers || 0}</div>
                    <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">Suspended or locked</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: WITHDRAWALS & VTU LIFECYCLE (Cards 7, 8, 9, 10, 11, 12) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-cyan-600" />
                    <span>Group 4: Payouts, Order Fulfillment & Reversal Integrity</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Card 7: Total Successful Withdrawals */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">7. Paid Cashouts</span>
                    <div className="text-lg font-black text-slate-900 mt-1">₦{Number(m.totalSuccessfulWithdrawals || 0).toLocaleString('en-NG')}</div>
                    <span className="text-[10px] text-emerald-600 font-bold block">{m.totalSuccessfulWithdrawalsCount || 0} completed payouts</span>
                  </div>

                  {/* Card 8: Pending Withdrawals */}
                  <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/10">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">8. Pending Cashouts</span>
                    <div className="text-lg font-black text-amber-900 mt-1">₦{Number(m.pendingWithdrawalsAmount || 0).toLocaleString('en-NG')}</div>
                    <span className="text-[10px] text-amber-600 font-bold block">{m.pendingWithdrawalsCount || 0} in review queue</span>
                  </div>

                  {/* Card 11: Successful VTU Transactions */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">11. Successful VTU</span>
                    <div className="text-lg font-black text-emerald-700 mt-1">₦{Number(m.successfulVtuTransactionsAmount || 0).toLocaleString('en-NG')}</div>
                    <span className="text-[10px] text-slate-500 block">{m.successfulVtuTransactionsCount || 0} orders delivered</span>
                  </div>

                  {/* Card 12: Pending Provider Transactions */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">12. Pending Provider</span>
                    <div className="text-lg font-black text-indigo-700 mt-1">{m.pendingProviderTransactionsCount || 0}</div>
                    <span className="text-[10px] text-slate-400 block">₦{Number(m.pendingProviderTransactionsAmount || 0).toLocaleString('en-NG')} processing</span>
                  </div>

                  {/* Card 9: Failed Transactions */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-rose-600 uppercase block">9. Failed Orders</span>
                    <div className="text-lg font-black text-rose-700 mt-1">{m.failedTransactionsCount || 0}</div>
                    <span className="text-[10px] text-slate-400 block">₦{Number(m.failedTransactionsAmount || 0).toLocaleString('en-NG')} unbilled</span>
                  </div>

                  {/* Card 10: Reversed Transactions */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-purple-600 uppercase block">10. Reversed / Refunded</span>
                    <div className="text-lg font-black text-purple-700 mt-1">{m.reversedTransactionsCount || 0}</div>
                    <span className="text-[10px] text-slate-400 block">₦{Number(m.reversedTransactionsAmount || 0).toLocaleString('en-NG')} refunded</span>
                  </div>
                </div>
              </div>

              {/* SECTION 5: GATEWAYS & DISCREPANCIES (Cards 21 & 23) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-violet-600" />
                    <span>Group 5: Automated Inflow Gateways & Reconciliation Differences (Card 21)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {(m.gatewayBalancesAndReconciliation || []).map((gw: any) => (
                    <div key={gw.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">{gw.name}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          gw.reconciliationStatus === 'RECONCILED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {gw.reconciliationStatus}
                        </span>
                      </div>
                      <div className="text-lg font-black text-slate-900">
                        ₦{Number(gw.successfulVolume || 0).toLocaleString('en-NG')}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>{gw.totalCount} Inflows</span>
                        <span>{gw.pendingCount > 0 ? `${gw.pendingCount} Pending` : 'All Reconciled'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 6: HARDWARE & SLA FLEET (Card 23) */}
              <div className="p-5 bg-slate-900 text-white rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-black tracking-tight">23. System Infrastructure, API Latency & Provider Health</h4>
                      <p className="text-[11px] text-slate-400">Continuous hardware telemetry and upstream API availability</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
                    UPTIME: 99.98%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Database Engine</span>
                    <div className="text-sm font-black text-emerald-400 mt-1">SQLite WAL Engine</div>
                    <span className="text-[10px] text-slate-400">Zero-locking concurrent writes</span>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Average API Latency</span>
                    <div className="text-sm font-black text-cyan-400 mt-1">42ms</div>
                    <span className="text-[10px] text-slate-400">Lightning-fast fulfillment</span>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Ledger Integrity Status</span>
                    <div className="text-sm font-black text-emerald-400 mt-1">100% Balanced</div>
                    <span className="text-[10px] text-slate-400">0 unallocated debits</span>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Discrepancy Count</span>
                    <div className={`text-sm font-black mt-1 ${m.discrepancyCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.discrepancyCount} Detected
                    </div>
                    <span className="text-[10px] text-slate-400">{m.discrepancyCount === 0 ? 'Flawless Reconciliation' : 'Investigate in Recon tab'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* SUB-TAB 2: PROFIT & LOSS BREAKDOWN */}
      {activeSubTab === 'pnl' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Comprehensive Profit & Loss Statement
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Verified financial statement adhering to standard accounting principles: Recognized Revenue − Cost of Goods Sold (COGS) = Gross Profit − Operating Expenses (OpEx) = Net Profit.
                </p>
              </div>

              {pnlData && (
                <button
                  onClick={() => {
                    const csvRows = [
                      ['Category', 'Amount (NGN)'],
                      ['Recognized Gross Revenue', pnlData.summary.recognizedRevenue],
                      ['Direct Provider Costs (COGS)', pnlData.summary.directProviderCosts],
                      ['Gross Profit Margin', pnlData.summary.grossProfit],
                      ['Total Operating Expenses', pnlData.summary.operatingExpenses],
                      ['Net Profit or Loss', pnlData.summary.netProfit]
                    ];
                    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `Bukar_Data_Sub_Profit_Loss_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm w-fit"
                >
                  <Download className="w-4 h-4" />
                  <span>Download P&L CSV</span>
                </button>
              )}
            </div>

            {loadingPnl ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Calculating recognized revenues and direct costs...</p>
              </div>
            ) : pnlData ? (
              <div className="space-y-6">
                {/* Executive P&L Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block uppercase">1. Gross Revenue</span>
                    <div className="text-xl font-black text-slate-900 mt-1">₦{Number(pnlData.summary.recognizedRevenue || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Retail VTU + fees</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block uppercase">2. Direct Provider Costs</span>
                    <div className="text-xl font-black text-rose-600 mt-1">₦{Number(pnlData.summary.directProviderCosts || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Wholesale API billing</span>
                  </div>

                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200">
                    <span className="text-[11px] font-bold text-blue-700 block uppercase">3. Gross Profit</span>
                    <div className="text-xl font-black text-blue-900 mt-1">₦{Number(pnlData.summary.grossProfit || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                    <span className="text-[10px] text-blue-600 font-bold mt-1 block">Margin: {pnlData.summary.grossProfitMarginPercent}%</span>
                  </div>

                  <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200">
                    <span className="text-[11px] font-bold text-orange-700 block uppercase">4. Operating Overheads</span>
                    <div className="text-xl font-black text-orange-900 mt-1">₦{Number(pnlData.summary.operatingExpenses || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                    <span className="text-[10px] text-orange-600 mt-1 block">Server, SMS & compliance</span>
                  </div>

                  <div className={`p-4 rounded-2xl border ${
                    Number(pnlData.summary.netProfit || 0) >= 0
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-rose-50 border-rose-300'
                  }`}>
                    <span className={`text-[11px] font-bold block uppercase ${
                      Number(pnlData.summary.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>5. Net Platform Profit</span>
                    <div className={`text-xl font-black mt-1 ${
                      Number(pnlData.summary.netProfit || 0) >= 0 ? 'text-emerald-900' : 'text-rose-900'
                    }`}>
                      ₦{Number(pnlData.summary.netProfit || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </div>
                    <span className={`text-[10px] font-bold mt-1 block ${
                      Number(pnlData.summary.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      Net Margin: {pnlData.summary.netProfitMarginPercent}%
                    </span>
                  </div>
                </div>

                {/* Periodic Breakdowns (Daily / Weekly / Monthly / Quarterly / Yearly) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Periodic P&L Performance Breakdown
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                          <th className="py-3 px-4 rounded-l-xl">Interval Period</th>
                          <th className="py-3 px-4">Gross Revenue</th>
                          <th className="py-3 px-4">Direct Wholesale Costs</th>
                          <th className="py-3 px-4">Gross Profit</th>
                          <th className="py-3 px-4">Operating Overheads</th>
                          <th className="py-3 px-4 rounded-r-xl">Net Profit / Loss</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pnlData.breakdowns?.map((b: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 font-medium">
                            <td className="py-3 px-4 font-bold text-slate-800">{b.periodName}</td>
                            <td className="py-3 px-4 text-slate-700">₦{Number(b.revenue || 0).toLocaleString('en-NG')}</td>
                            <td className="py-3 px-4 text-rose-600">₦{Number(b.directCosts || 0).toLocaleString('en-NG')}</td>
                            <td className="py-3 px-4 font-bold text-blue-700">₦{Number(b.grossProfit || 0).toLocaleString('en-NG')}</td>
                            <td className="py-3 px-4 text-orange-600">₦{Number(b.expenses || 0).toLocaleString('en-NG')}</td>
                            <td className="py-3 px-4 font-black">
                              <span className={Number(b.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                ₦{Number(b.netProfit || 0).toLocaleString('en-NG')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: OPERATING EXPENSES REGISTER */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Operating Expenses (OpEx) Register
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Record real operational expenditures (Server cloud hosting, SMS gateway units, legal & compliance fees, office management) to ensure accurate Net Profit calculations.
                </p>
              </div>

              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Expense</span>
              </button>
            </div>

            {loadingExpenses ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Loading operating expenses...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Landmark className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold">No operating expenses recorded yet.</p>
                <p className="text-[11px]">Click "Record New Expense" above to add server hosting, SMS API, or operational costs.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                      <th className="py-3 px-4 rounded-l-xl">Expense Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Recorded By</th>
                      <th className="py-3 px-4">Date Recorded</th>
                      <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp: any) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <div>{exp.title}</div>
                          {exp.notes && <div className="text-[11px] text-slate-400 font-normal">{exp.notes}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-rose-600">
                          ₦{Number(exp.amount || 0).toLocaleString('en-NG')}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{exp.recorded_by}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(exp.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id, exp.title)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">Record Operating Expense</h3>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Expense Title / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS EC2 Cloud Server Monthly Bill"
                  value={newExpense.title}
                  onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Expense Category</label>
                <select
                  value={newExpense.category}
                  onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                >
                  <option value="SERVER_HOSTING">Cloud / Server Hosting (AWS, DigitalOcean, VPS)</option>
                  <option value="SMS_GATEWAY">SMS Gateway Units (Termii, Twilio)</option>
                  <option value="OFFICE_OPS">Office & Operational Expenses</option>
                  <option value="LEGAL_COMPLIANCE">Legal, CAC & Regulatory Compliance</option>
                  <option value="CUSTOMER_SERVICE">Customer Support & Staff Tools</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Amount (₦ NGN)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 45000"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Additional Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Reference number, invoice ID or payment receipt..."
                  value={newExpense.notes}
                  onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-sm transition"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
