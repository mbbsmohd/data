import React, { useState, useEffect } from 'react';
import {
  Users, Gift, Copy, Check, Share2, ArrowRight, ArrowLeft,
  DollarSign, TrendingUp, RefreshCw, Award, Wallet, Sparkles
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';

interface ReferralsPageProps {
  onBack: () => void;
  onRefreshUser?: () => void;
}

export const ReferralsPage: React.FC<ReferralsPageProps> = ({ onBack, onRefreshUser }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Transfer Commission Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    loadReferralSummary();
  }, []);

  const loadReferralSummary = async () => {
    setLoading(true);
    try {
      const res = await api.getReferralSummary();
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed to load referral data', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const referralLink = data?.referralCode
    ? `${window.location.origin}/?ref=${data.referralCode}`
    : '';

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Get instant cheap data bundles, airtime discounts, and bill payments on Bukar Data Sub! Sign up with my link and get bonuses: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleTransferCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(transferAmount);
    if (!num || num <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Enter an amount greater than ₦0.' });
      return;
    }
    if (num > (data?.commissionBalance || 0)) {
      Swal.fire({ icon: 'warning', title: 'Insufficient Commission', text: 'Transfer amount exceeds your commission balance.' });
      return;
    }

    setTransferring(true);
    try {
      const res = await api.transferReferralCommission({ amount: num });
      Swal.fire({
        icon: 'success',
        title: 'Commission Transferred!',
        text: res.message || `₦${num.toLocaleString('en-NG')} successfully moved to your main spending wallet.`,
        confirmButtonColor: '#1E5BF9'
      });
      setShowTransferModal(false);
      setTransferAmount('');
      loadReferralSummary();
      if (onRefreshUser) onRefreshUser();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Transfer Failed', text: err.message });
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center space-x-2 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <button
          onClick={loadReferralSummary}
          className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center space-x-1.5 text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5" />
            <span>Refer & Earn Program</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            Invite Friends & Earn Real Cash Commissions
          </h1>
          <p className="text-xs md:text-sm text-blue-100 font-medium">
            Earn instant signup rewards plus lifetime commissions every time your referred friends purchase data, airtime, or cable packages!
          </p>
        </div>
      </div>

      {/* Referral Link & Code Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-900">Your Exclusive Referral Link</h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between font-mono text-xs text-slate-700 truncate">
            <span className="truncate">{referralLink || 'Loading referral link...'}</span>
            <span className="ml-2 font-black text-blue-600 uppercase tracking-widest">{data?.referralCode}</span>
          </div>

          <button
            onClick={handleCopyLink}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center space-x-2 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Commission Balance */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Commission Balance</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              ₦{(data?.commissionBalance || 0).toLocaleString('en-NG')}
            </div>
            <span className="text-xs text-slate-400 mt-0.5 block">Ready for transfer</span>
          </div>
          <button
            disabled={!data?.commissionBalance || data.commissionBalance <= 0}
            onClick={() => {
              setTransferAmount(String(data?.commissionBalance || 0));
              setShowTransferModal(true);
            }}
            className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs py-2.5 rounded-xl transition border border-emerald-200 flex items-center justify-center space-x-1.5"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Transfer to Spending Wallet</span>
          </button>
        </div>

        {/* Total Referred Users */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Referred Friends</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {data?.totalReferredCount || 0}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Active network referrals</span>
        </div>

        {/* Total Referral Earnings */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Lifetime Earnings</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            ₦{(data?.totalReferralEarnings || 0).toLocaleString('en-NG')}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Commissions earned so far</span>
        </div>
      </div>

      {/* Referred Friends Directory */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Your Network Members</h3>
          <span className="text-xs text-slate-500 font-bold">
            {data?.referredUsers?.length || 0} User(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Friend Name</th>
                <th className="py-3 px-4">Contact (Masked)</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Account Tier</th>
                <th className="py-3 px-4 text-right">Transactions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {(!data?.referredUsers || data.referredUsers.length === 0) ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    You have not referred anyone yet. Share your referral link above to start earning!
                  </td>
                </tr>
              ) : (
                data.referredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {u.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{u.emailMasked}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                      {new Date(u.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Tier {u.tier || 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      ₦{(u.vtuVolume || 0).toLocaleString('en-NG')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Commission Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Transfer Commission</h3>
                <p className="text-xs text-slate-500">Move earnings to spending wallet</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              Available Commission Balance: <b>₦{(data?.commissionBalance || 0).toLocaleString('en-NG')}</b>. Transferred funds are immediately credited to your spending balance for data purchases, withdrawals, and airtime.
            </p>

            <form onSubmit={handleTransferCommission} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Amount to Transfer (₦)
                </label>
                <input
                  type="number"
                  min="1"
                  max={data?.commissionBalance || 0}
                  required
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full text-base font-bold font-mono p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md flex items-center space-x-1.5"
                >
                  <span>{transferring ? 'Transferring...' : 'Confirm Transfer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
