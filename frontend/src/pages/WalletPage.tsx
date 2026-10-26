import React, { useState, useEffect } from 'react';
import {
  CreditCard, ArrowDownLeft, ArrowUpRight, Copy, CheckCircle2,
  RefreshCw, Filter, Download, Building, Check, X, Landmark,
  FileText, Send, Clock, AlertTriangle, ShieldCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { TransactionReceiptModal, ReceiptData } from '../components/TransactionReceiptModal';

export const WalletPage: React.FC<{ user: any; onBack: () => void; onRefreshUser: () => void }> = ({ user, onBack, onRefreshUser }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'ledger' | 'withdrawals'>('ledger');

  const [showFundModal, setShowFundModal] = useState(false);
  const [fundTab, setFundTab] = useState<'transfer' | 'card'>('transfer');
  const [fundAmount, setFundAmount] = useState('2000');
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [copiedAcc, setCopiedAcc] = useState(false);

  // Withdrawal Modal & Form State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    bankName: 'Moniepoint MFB',
    accountNumber: '',
    accountName: '',
    amount: '',
    pin: '',
    narration: ''
  });

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Dedicated Virtual Account state
  const [virtualAccount, setVirtualAccount] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    isAutomated?: boolean;
    instruction?: string;
  } | null>(null);

  useEffect(() => {
    loadHistory();
    loadVirtualAccount();
    loadWithdrawals();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getLedgerHistory(100);
      if (res.success) setHistory(res.history);
    } catch {
      // Fallback
    }
  };

  const loadWithdrawals = async () => {
    try {
      const res = await api.getMyWithdrawals();
      if (res.success) setWithdrawals(res.withdrawals || []);
    } catch {
      // Fallback
    }
  };

  const loadVirtualAccount = async () => {
    try {
      const res = await api.getVirtualAccount();
      if (res.success && res.account) {
        setVirtualAccount(res.account);
      }
    } catch {
      // Fallback
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
    Swal.fire({
      icon: 'success',
      title: 'Copied to Clipboard',
      text,
      timer: 1400,
      showConfirmButton: false
    });
  };

  const handleViewReceipt = (item: any) => {
    setSelectedReceipt({
      reference: item.reference,
      category: item.category,
      serviceName: item.description,
      amount: item.amount,
      status: 'SUCCESSFUL',
      date: new Date(item.created_at).toLocaleString('en-NG'),
      balanceBefore: item.balance_before,
      balanceAfter: item.balance_after,
      paymentMethod: item.category === 'WALLET_FUNDING' ? 'Bank Deposit / Gateway' : 'Authoritative Wallet'
    });
    setShowReceiptModal(true);
  };

  const openWithdrawModal = () => {
    setWithdrawForm(prev => ({
      ...prev,
      accountName: prev.accountName || user.name || '',
      amount: '',
      pin: '',
      narration: ''
    }));
    setShowWithdrawModal(true);
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawForm.amount);
    if (!amt || amt < 500) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Minimum withdrawal amount is ₦500.00' });
      return;
    }
    if (amt > (user.wallet_balance || 0)) {
      Swal.fire({ icon: 'error', title: 'Insufficient Funds', text: `You cannot withdraw ₦${amt.toLocaleString('en-NG')} because your available balance is only ₦${(user.wallet_balance || 0).toLocaleString('en-NG')}` });
      return;
    }
    if (!withdrawForm.accountNumber || !/^\d{10}$/.test(withdrawForm.accountNumber.trim())) {
      Swal.fire({ icon: 'warning', title: 'Invalid Account Number', text: 'Enter a valid 10-digit Nigerian NUBAN' });
      return;
    }
    if (!withdrawForm.accountName.trim()) {
      Swal.fire({ icon: 'warning', title: 'Account Name Required', text: 'Enter the destination account name' });
      return;
    }

    // Strict Name Matching
    const cleanUser = (user.name || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9\s]/g, '').trim();
    const cleanAccount = withdrawForm.accountName.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9\s]/g, '').trim();
    const userWords = cleanUser.split(/\s+/).filter((w: string) => w.length > 1);
    const accountWords = cleanAccount.split(/\s+/).filter((w: string) => w.length > 1);
    const commonWords = userWords.filter((w: string) => accountWords.includes(w));
    if (userWords.length > 0 && accountWords.length > 0 && commonWords.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Account Name Mismatch',
        text: `Destination bank account name ("${withdrawForm.accountName}") must match your registered account name ("${user.name}"). For anti-fraud and KYC safety, third-party payouts are prohibited.`
      });
      return;
    }

    if (!withdrawForm.pin || withdrawForm.pin.length !== 4) {
      Swal.fire({ icon: 'warning', title: 'Transaction PIN Required', text: 'Enter your 4-digit transaction authorization PIN' });
      return;
    }

    try {
      setLoadingWithdraw(true);
      const res = await api.requestWithdrawal({
        amount: amt,
        bankName: withdrawForm.bankName,
        accountNumber: withdrawForm.accountNumber.trim(),
        accountName: withdrawForm.accountName.trim(),
        pin: withdrawForm.pin.trim(),
        narration: withdrawForm.narration || undefined
      });

      Swal.fire({
        icon: 'success',
        title: 'Withdrawal Submitted!',
        text: `Your withdrawal request of ₦${amt.toLocaleString('en-NG')} has been queued for admin verification and payout.`,
        confirmButtonColor: '#2563EB'
      });

      setShowWithdrawModal(false);
      setWithdrawForm({
        bankName: 'Moniepoint MFB',
        accountNumber: '',
        accountName: '',
        amount: '',
        pin: '',
        narration: ''
      });
      onRefreshUser();
      loadHistory();
      loadWithdrawals();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Withdrawal Failed', text: err.message });
    } finally {
      setLoadingWithdraw(false);
    }
  };

  const handleOnlineCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundAmount || Number(fundAmount) < 100) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Minimum funding amount is ₦100.00' });
      return;
    }

    try {
      setLoading(true);
      const res = await api.initiateFunding(Number(fundAmount), 'paystack');
      if (res.checkoutUrl) {
        Swal.fire({
          icon: 'info',
          title: 'Opening Payment Gateway',
          text: 'Redirecting to secure online payment portal...',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          window.location.href = res.checkoutUrl;
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Direct Bank Transfer',
          html: `
            <div style="text-align: left; font-size: 14px; line-height: 1.6;" class="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <p><strong>Bank:</strong> ${res.virtualBankName}</p>
              <p><strong>Account Number:</strong> <span style="font-size: 20px; color: #2563EB; font-weight: 800; letter-spacing: 1px;">${res.virtualAccountNumber}</span></p>
              <p><strong>Account Name:</strong> ${res.virtualAccountName}</p>
              <p><strong>Amount:</strong> ₦${Number(fundAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
              <p style="color: #64748b; font-size: 12px; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                Reference: <code style="font-weight: bold; color: #0f172a;">${res.reference}</code><br/>
                Transfer the exact amount to your verified virtual account. Your balance will credit automatically upon webhook confirmation.
              </p>
            </div>
          `,
          confirmButtonColor: '#2563EB',
          confirmButtonText: 'I Have Paid'
        });
        setShowFundModal(false);
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Payment Initiation Failed', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(h => {
    if (filterType === 'ALL') return true;
    return h.entry_type === filterType;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-sm font-bold text-blue-600 hover:underline mb-1 inline-block">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Wallet & Financial Ledger
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Authoritative double-entry balance accounts and automated bank funding
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={openWithdrawModal}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-sm px-5 py-3 rounded-2xl transition shadow-sm flex items-center space-x-2"
          >
            <Landmark className="w-4 h-4 text-purple-600" />
            <span>Withdraw</span>
          </button>
          <button
            onClick={() => setShowFundModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-2xl transition shadow-md flex items-center space-x-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>+ Fund Wallet</span>
          </button>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-blue-200 text-xs font-bold uppercase tracking-wider">Authoritative Balance</span>
            <div className="text-3xl md:text-4xl font-black mt-2 font-mono">
              ₦{user.wallet_balance ? user.wallet_balance.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>
          <div className="mt-6 flex space-x-2">
            <button
              onClick={() => setShowFundModal(true)}
              className="flex-1 bg-white text-blue-800 font-extrabold text-xs py-3 rounded-xl hover:bg-blue-50 transition shadow-sm text-center"
            >
              + Fund Wallet
            </button>
            <button
              onClick={openWithdrawModal}
              className="flex-1 bg-blue-950/40 hover:bg-blue-950/70 text-white border border-blue-400/30 font-extrabold text-xs py-3 rounded-xl transition text-center flex items-center justify-center space-x-1"
            >
              <Landmark className="w-3.5 h-3.5 text-blue-200" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Dedicated Account Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 card-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Automated Virtual Account</span>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                Auto-Credit 24/7
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs text-slate-500 font-bold uppercase">{virtualAccount?.bankName || 'WEMA BANK / MONNIFY'}</div>
              <div className="text-2xl font-black text-slate-900 tracking-wider font-mono mt-1">
                {virtualAccount?.accountNumber || '9131797675'}
              </div>
              <div className="text-xs text-slate-600 font-semibold mt-1">
                {virtualAccount?.accountName || user.name}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleCopy(virtualAccount?.accountNumber || '9131797675')}
            className="mt-4 border border-blue-200 bg-blue-50/60 py-2.5 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 transition flex items-center justify-center space-x-1.5"
          >
            {copiedAcc ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAcc ? 'Copied Account Number!' : 'Copy Account Number'}</span>
          </button>
        </div>

        {/* Instant Automated Gateway Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 card-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Automated Payment Gateway</span>
              <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>256-Bit SSL</span>
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs text-slate-500 font-bold uppercase">Online Cards & USSD</div>
              <div className="text-xl font-black text-slate-900 tracking-tight mt-1">
                Instant Automated Credit
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Fund securely via Debit Card, USSD, or Bank App. Gateway webhook auto-credits balance in &lt;3 seconds.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setFundTab('card');
              setShowFundModal(true);
            }}
            className="mt-4 border border-blue-200 bg-blue-50/70 py-2.5 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 transition flex items-center justify-center space-x-1.5"
          >
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>Pay with Card / USSD</span>
          </button>
        </div>
      </div>

      {/* History Container with Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden">
        {/* Navigation Tabs between Ledger and Withdrawals */}
        <div className="flex items-center space-x-6 border-b border-slate-100 px-6 pt-4">
          <button
            onClick={() => setActiveHistoryTab('ledger')}
            className={`pb-3 text-xs md:text-sm font-black transition border-b-2 flex items-center space-x-2 ${
              activeHistoryTab === 'ledger'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Double-Entry Ledger ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveHistoryTab('withdrawals')}
            className={`pb-3 text-xs md:text-sm font-black transition border-b-2 flex items-center space-x-2 ${
              activeHistoryTab === 'withdrawals'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>My Bank Withdrawals ({withdrawals.length})</span>
          </button>
        </div>

        {/* Tab 1: Ledger Entries */}
        {activeHistoryTab === 'ledger' && (
          <div>
            <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Authoritative Ledger History</h2>
                <p className="text-xs text-slate-500 font-medium">Every financial debit and credit is recorded with before & after balances.</p>
              </div>

              <div className="flex items-center space-x-2">
                {(['ALL', 'CREDIT', 'DEBIT'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      filterType === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f} Records
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Cards (Viewports < 768px) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium text-xs">
                  No ledger transactions recorded yet.
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div key={item.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase inline-block">
                          {item.category}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">{item.description}</h4>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-sm font-black font-mono block ${item.entry_type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {item.entry_type === 'CREDIT' ? '+' : '-'}₦{item.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px] font-mono">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-sans">Before:</span>
                        <span className="text-slate-600 font-bold">₦{item.balance_before.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-sans">After:</span>
                        <span className="text-slate-900 font-bold">₦{item.balance_after.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[170px]" title={item.reference}>
                        Ref: {item.reference}
                      </span>
                      <button
                        onClick={() => handleViewReceipt(item)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-blue-200 transition inline-flex items-center space-x-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table (Viewports >= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFBFD] text-slate-400 font-bold uppercase text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Description</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Amount</th>
                    <th className="py-3.5 px-6">Balance Before</th>
                    <th className="py-3.5 px-6">Balance After</th>
                    <th className="py-3.5 px-6">Reference</th>
                    <th className="py-3.5 px-6">Date & Time</th>
                    <th className="py-3.5 px-6 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-medium text-sm">
                        No ledger transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-6 font-bold text-slate-900">{item.description}</td>
                        <td className="py-3.5 px-6">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-mono text-xs font-semibold">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-black font-mono text-sm">
                          <span className={item.entry_type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}>
                            {item.entry_type === 'CREDIT' ? '+' : '-'}₦{item.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-slate-500 font-mono">₦{item.balance_before.toFixed(2)}</td>
                        <td className="py-3.5 px-6 font-bold text-slate-900 font-mono">₦{item.balance_after.toFixed(2)}</td>
                        <td className="py-3.5 px-6 text-slate-400 font-mono text-xs">{item.reference}</td>
                        <td className="py-3.5 px-6 text-slate-500">
                          {new Date(item.created_at).toISOString().replace('T', ' ').slice(0, 16)}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleViewReceipt(item)}
                            className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-[11px] px-2.5 py-1.5 rounded-xl border border-slate-200 transition inline-flex items-center space-x-1"
                            title="Generate & print official receipt"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: My Bank Withdrawals */}
        {activeHistoryTab === 'withdrawals' && (
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Direct Bank Withdrawal History</h2>
                <p className="text-xs text-slate-500 font-medium">Payouts to verified commercial bank accounts and automated refunds on rejection.</p>
              </div>
              <button
                onClick={openWithdrawModal}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center space-x-1.5"
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>+ New Request</span>
              </button>
            </div>

            {/* Mobile Cards (Viewports < 768px) */}
            <div className="md:hidden divide-y divide-slate-100">
              {withdrawals.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium text-xs">
                  No bank withdrawal requests yet.
                </div>
              ) : (
                withdrawals.map((w) => (
                  <div key={w.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{w.bank_name}</div>
                        <div className="font-mono text-blue-700 font-bold text-[11px]">{w.account_number}</div>
                        <div className="text-[10px] text-slate-500">{w.account_name}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono font-black text-sm text-slate-900">
                          ₦{w.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          w.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          ● {w.status}
                        </span>
                      </div>
                    </div>
                    {w.admin_notes && (
                      <div className="text-[11px] font-medium text-slate-700 bg-slate-50 p-2 rounded-lg">
                        {w.admin_notes}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1">
                      <span className="truncate max-w-[170px]">Ref: {w.payment_reference || w.id}</span>
                      <span>{new Date(w.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table (Viewports >= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFBFD] text-slate-400 font-bold uppercase text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Destination Bank & Account</th>
                    <th className="py-3.5 px-6">Amount (₦)</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Payment Reference / Notes</th>
                    <th className="py-3.5 px-6">Requested At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-sm">
                        No bank withdrawal requests yet.
                      </td>
                    </tr>
                  ) : (
                    withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-slate-900">{w.bank_name}</div>
                          <div className="font-mono text-blue-700 font-bold text-xs">{w.account_number}</div>
                          <div className="text-[11px] text-slate-500">{w.account_name}</div>
                        </td>
                        <td className="py-3.5 px-6 font-mono font-black text-sm text-slate-900">
                          ₦{w.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                            w.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : w.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            ● {w.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">
                          {w.admin_notes && (
                            <div className="text-xs font-semibold text-slate-700">{w.admin_notes}</div>
                          )}
                          <div className="font-mono text-[11px] text-slate-400">{w.payment_reference || w.id}</div>
                        </td>
                        <td className="py-3.5 px-6 text-slate-500">
                          {new Date(w.created_at).toISOString().replace('T', ' ').slice(0, 16)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Request Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <Landmark className="w-6 h-6 text-purple-600" />
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Request Bank Withdrawal</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Transfer funds from your wallet to any commercial Nigerian bank account. Processed manually by admin.
              </p>
            </div>

            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between text-xs">
              <span className="font-bold text-purple-900">Available Wallet Balance:</span>
              <strong className="font-mono font-black text-purple-700 text-sm">
                ₦{user.wallet_balance ? user.wallet_balance.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}
              </strong>
            </div>

            <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200/80 flex items-start space-x-2 text-xs text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <b>Anti-Fraud & KYC Compliance:</b> Withdrawals are restricted to bank accounts matching your legal account name (<b>{user.name}</b>). Third-party withdrawals will fail verification.
              </span>
            </div>

            <form onSubmit={handleRequestWithdrawal} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Destination Bank</label>
                <select
                  value={withdrawForm.bankName}
                  onChange={e => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                  className="w-full text-sm font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Moniepoint MFB">Moniepoint MFB</option>
                  <option value="OPay (PayCom)">OPay (PayCom)</option>
                  <option value="PalmPay">PalmPay</option>
                  <option value="Kuda Bank">Kuda Bank</option>
                  <option value="Wema Bank">Wema Bank</option>
                  <option value="Guaranty Trust Bank (GTBank)">Guaranty Trust Bank (GTBank)</option>
                  <option value="Access Bank">Access Bank</option>
                  <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                  <option value="FCMB">FCMB</option>
                  <option value="Sterling Bank">Sterling Bank</option>
                  <option value="Fidelity Bank">Fidelity Bank</option>
                  <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
                  <option value="Union Bank">Union Bank</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">10-Digit Account Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={withdrawForm.accountNumber}
                    onChange={e => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="0123456789"
                    required
                    className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={withdrawForm.accountName}
                    onChange={e => setWithdrawForm({ ...withdrawForm, accountName: e.target.value })}
                    placeholder="Full Account Name"
                    required
                    className="w-full text-sm font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Withdrawal Amount (₦)</label>
                  <input
                    type="number"
                    min="500"
                    max={user.wallet_balance || 1000000}
                    value={withdrawForm.amount}
                    onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                    placeholder="min 500"
                    required
                    className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">4-Digit Authorization PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={withdrawForm.pin}
                    onChange={e => setWithdrawForm({ ...withdrawForm, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="••••"
                    required
                    className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Narration (Optional)</label>
                <input
                  type="text"
                  value={withdrawForm.narration}
                  onChange={e => setWithdrawForm({ ...withdrawForm, narration: e.target.value })}
                  placeholder="e.g. Sales withdrawal payout"
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 bg-slate-50"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loadingWithdraw}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-2xl transition shadow-md text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{loadingWithdraw ? 'Submitting Request...' : 'Submit Withdrawal Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receipt={selectedReceipt}
      />

      {/* Fund Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowFundModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Fund Wallet</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Real-time automated credit via dedicated NUBAN or online payment gateway
              </p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setFundTab('transfer')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center justify-center space-x-2 ${
                  fundTab === 'transfer' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Dedicated Bank Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => setFundTab('card')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center justify-center space-x-2 ${
                  fundTab === 'card' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay via Card / USSD</span>
              </button>
            </div>

            {fundTab === 'transfer' ? (
              <div className="space-y-4">
                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Bank Name</span>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                      Automated 24/7 Credit
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    {virtualAccount?.bankName || 'Wema Bank / Monnify'}
                  </div>

                  <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block">Dedicated Virtual NUBAN</span>
                      <span className="text-2xl md:text-3xl font-black text-blue-700 font-mono tracking-wider">
                        {virtualAccount?.accountNumber || '9131797675'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(virtualAccount?.accountNumber || '9131797675')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center space-x-1.5"
                    >
                      {copiedAcc ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedAcc ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-blue-200/60">
                    <span className="text-xs font-semibold text-slate-500 block">Account Name</span>
                    <span className="text-sm font-bold text-slate-900">
                      {virtualAccount?.accountName || user.name}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-900">100% Automated Instant Credit:</div>
                  <p>1. Open your banking app (Opay, PalmPay, Kuda, GTBank, Zenith, FirstBank, Access, Moniepoint, etc.).</p>
                  <p>2. Transfer any desired amount to your dedicated virtual account number above.</p>
                  <p>3. Your wallet balance credits automatically in under 3 seconds via secure payment gateway API. No manual waiting!</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOnlineCheckout} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Amount to Fund (₦)</label>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    min="100"
                    required
                    className="w-full text-2xl font-black font-mono border border-slate-200 rounded-2xl p-3.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['1000', '2000', '5000', '10000', '20000', '50000'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFundAmount(val)}
                      className="py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition"
                    >
                      +₦{Number(val).toLocaleString()}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition shadow-md text-base disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>{loading ? 'Initializing Gateway Session...' : `Pay ₦${Number(fundAmount).toLocaleString()} via Card / USSD`}</span>
                </button>

                <p className="text-[11px] text-center text-slate-400 font-medium">
                  Protected by 256-bit SSL encryption. Accepts Mastercard, Visa, Verve & Bank USSD.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
