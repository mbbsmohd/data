import React, { useState } from 'react';
import {
  Users, Award, ArrowRight, CheckCircle2, Copy, Share2,
  DollarSign, Sparkles, TrendingUp, Shield, Zap, RefreshCw, AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';

export const ResellerPortalPage: React.FC<{
  user: any;
  onRefreshUser: () => void;
  onBack: () => void;
  onNavigateTo?: (page: string) => void;
}> = ({ user, onRefreshUser, onBack, onNavigateTo }) => {
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [loadingTransfer, setLoadingTransfer] = useState(false);

  const referralCode = user?.referral_code || 'ABK-PROMO';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: `${label} copied to clipboard.`,
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleUpgrade = async (targetTier: number, tierName: string, cost: number) => {
    const result = await Swal.fire({
      title: `Upgrade to ${tierName}?`,
      text: `An upgrade fee of ₦${cost.toLocaleString()} will be debited from your wallet.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Yes, Upgrade (₦${cost})`,
      confirmButtonColor: '#1E5BF9',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingUpgrade(true);
      const res = await api.upgradeTier(targetTier);
      Swal.fire({
        icon: 'success',
        title: 'Upgrade Successful!',
        text: res.message || `You are now a verified ${tierName}.`,
        confirmButtonColor: '#1E5BF9'
      });
      onRefreshUser();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Upgrade Failed', text: err.message });
    } finally {
      setLoadingUpgrade(false);
    }
  };

  const handleTransferCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(transferAmount);
    if (!amount || amount <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Enter an amount to transfer.' });
      return;
    }
    if (amount > (user?.commission_balance || 0)) {
      Swal.fire({ icon: 'error', title: 'Insufficient Commissions', text: 'Amount exceeds commission balance.' });
      return;
    }

    try {
      setLoadingTransfer(true);
      await api.transferCommission(amount);
      Swal.fire({
        icon: 'success',
        title: 'Commissions Transferred!',
        text: `₦${amount.toLocaleString()} has been moved to your main wallet balance.`,
        confirmButtonColor: '#1E5BF9'
      });
      setTransferAmount('');
      onRefreshUser();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Transfer Failed', text: err.message });
    } finally {
      setLoadingTransfer(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Award className="w-7 h-7 text-blue-600" />
            <span>Reseller & Agent Portal</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Wholesale data discounts, commission payouts, downline tracking, and tier margins
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Current Tier</span>
            <span className="text-sm font-extrabold text-blue-700">
              Tier {user?.tier || 1} • {user?.tier === 3 ? 'API Partner / VIP' : user?.tier === 2 ? 'Reseller / Agent' : 'Standard Customer'}
            </span>
          </div>
        </div>
      </div>

      {/* Top Cards: Tier Status & Commission Wallet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commission Card */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <DollarSign className="w-32 h-32" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-300 block mb-1">
            Reseller Commission Balance
          </span>
          <div className="text-3xl font-black font-mono tracking-tight text-white mb-4">
            ₦{(user?.commission_balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </div>

          <form onSubmit={handleTransferCommission} className="space-y-3 relative z-10">
            <label className="text-[11px] font-bold text-blue-200 block">
              Withdraw Commission to Main Wallet:
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                placeholder="Amount (e.g. 500)"
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-blue-300 text-xs font-bold flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={loadingTransfer || !user?.commission_balance}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow disabled:opacity-40"
              >
                {loadingTransfer ? 'Transferring...' : 'Transfer Now'}
              </button>
            </div>
          </form>
        </div>

        {/* Referral Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Referral Program</span>
              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                Earn ₦50 on First Funding
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">Invite Friends & Agents</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Share your referral code. When your invited user registers and purchases services, you earn instant commissions!
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Your Code</span>
                <span className="font-mono font-black text-blue-600 text-base">{referralCode}</span>
              </div>
              <button
                onClick={() => copyToClipboard(referralCode, 'Referral Code')}
                className="p-2 bg-white text-slate-700 hover:text-blue-600 rounded-xl border border-slate-200 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(referralLink, 'Referral Link')}
              className="flex-1 bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Register on ABK Data Link using my code ${referralCode} for cheapest data & bills: ${referralLink}`)}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </a>
          </div>
        </div>
      </div>

      {/* Pricing Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900">Wholesale Data & Airtime Pricing Comparison</h3>
          <p className="text-xs text-slate-500 font-medium">
            Higher tiers unlock substantial margins for high-volume transactions and enterprise resellers
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-4">Service / Plan</th>
                <th className="py-3 px-4">Tier 1 (Customer)</th>
                <th className="py-3 px-4 text-blue-600">Tier 2 (Reseller)</th>
                <th className="py-3 px-4 text-purple-600">Tier 3 (API / VIP)</th>
                <th className="py-3 px-4 text-emerald-600">Max Profit Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">MTN SME Data 1.0 GB</td>
                <td className="py-3 px-4">₦260</td>
                <td className="py-3 px-4 font-bold text-blue-600 bg-blue-50/50">₦248</td>
                <td className="py-3 px-4 font-bold text-purple-600 bg-purple-50/50">₦242</td>
                <td className="py-3 px-4 font-bold text-emerald-600">+ ₦58 / GB</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Airtel Corporate Gifting 1.0 GB</td>
                <td className="py-3 px-4">₦280</td>
                <td className="py-3 px-4 font-bold text-blue-600 bg-blue-50/50">₦265</td>
                <td className="py-3 px-4 font-bold text-purple-600 bg-purple-50/50">₦255</td>
                <td className="py-3 px-4 font-bold text-emerald-600">+ ₦45 / GB</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Glo SME / Corporate 1.0 GB</td>
                <td className="py-3 px-4">₦240</td>
                <td className="py-3 px-4 font-bold text-blue-600 bg-blue-50/50">₦230</td>
                <td className="py-3 px-4 font-bold text-purple-600 bg-purple-50/50">₦220</td>
                <td className="py-3 px-4 font-bold text-emerald-600">+ ₦80 / GB</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">9mobile Corporate 1.5 GB</td>
                <td className="py-3 px-4">₦350</td>
                <td className="py-3 px-4 font-bold text-blue-600 bg-blue-50/50">₦320</td>
                <td className="py-3 px-4 font-bold text-purple-600 bg-purple-50/50">₦300</td>
                <td className="py-3 px-4 font-bold text-emerald-600">+ ₦100 / GB</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Airtime VTU Top-up</td>
                <td className="py-3 px-4">2.0% Cash-back</td>
                <td className="py-3 px-4 font-bold text-blue-600 bg-blue-50/50">3.5% Cash-back</td>
                <td className="py-3 px-4 font-bold text-purple-600 bg-purple-50/50">5.0% Cash-back</td>
                <td className="py-3 px-4 font-bold text-emerald-600">5.0% Net Profit</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Recharge Card e-PINs</td>
                <td className="py-3 px-4">₦98 / ₦100 Card</td>
                <td className="py-3 px-4 font-bold text-blue-600 bg-blue-50/50">₦96 / ₦100 Card</td>
                <td className="py-3 px-4 font-bold text-purple-600 bg-purple-50/50">₦94 / ₦100 Card</td>
                <td className="py-3 px-4 font-bold text-emerald-600">6.0% Retail Margin</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tier Upgrade Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier 2 Card */}
        <div className={`border rounded-3xl p-6 bg-white transition ${
          user?.tier >= 2 ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-blue-200'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Tier 2 Package
              </span>
              <h4 className="text-xl font-black text-slate-900 mt-2">Reseller / Agent</h4>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-600">₦1,000</span>
              <span className="text-[10px] text-slate-400 block font-medium">One-time upgrade fee</span>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-slate-600 font-medium mb-6">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Wholesale SME data prices (₦248/GB MTN)</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>3.5% Airtime cashback bonus</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Custom business name on printed recharge vouchers</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Priority transaction queue routing</span>
            </li>
          </ul>

          {user?.tier >= 2 ? (
            <div className="bg-emerald-50 text-emerald-700 text-xs font-bold py-3 rounded-2xl text-center border border-emerald-200 flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Current Tier Active</span>
            </div>
          ) : (
            <button
              onClick={() => handleUpgrade(2, 'Reseller / Agent', 1000)}
              disabled={loadingUpgrade}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-2xl transition shadow-md shadow-blue-500/20"
            >
              {loadingUpgrade ? 'Processing Upgrade...' : 'Upgrade to Reseller (₦1,000)'}
            </button>
          )}
        </div>

        {/* Tier 3 Card */}
        <div className={`border rounded-3xl p-6 bg-white transition ${
          user?.tier >= 3 ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-purple-200'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                Tier 3 Package
              </span>
              <h4 className="text-xl font-black text-slate-900 mt-2">API Partner / VIP</h4>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-purple-600">₦5,000</span>
              <span className="text-[10px] text-slate-400 block font-medium">One-time upgrade fee</span>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-slate-600 font-medium mb-6">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Lowest floor API price (₦242/GB MTN)</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Automated Developer API Keys & Webhook delivery</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>5.0% Airtime cashback & ₦94/₦100 Recharge print discount</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Dedicated WhatsApp Account Manager</span>
            </li>
          </ul>

          {user?.tier >= 3 ? (
            <div className="bg-emerald-50 text-emerald-700 text-xs font-bold py-3 rounded-2xl text-center border border-emerald-200 flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>VIP Tier Active</span>
            </div>
          ) : (
            <button
              onClick={() => handleUpgrade(3, 'API Partner / VIP', 5000)}
              disabled={loadingUpgrade}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-3 rounded-2xl transition shadow-md shadow-purple-500/20"
            >
              {loadingUpgrade ? 'Processing Upgrade...' : 'Upgrade to VIP API (₦5,000)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
