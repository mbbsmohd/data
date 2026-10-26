import React, { useState } from 'react';
import { Tv, CheckCircle2, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { TransactionPinModal } from '../components/TransactionPinModal';

export const CablePage: React.FC<{ onBack: () => void; onRefreshUser: () => void }> = ({ onBack, onRefreshUser }) => {
  const [provider, setProvider] = useState<'DSTV' | 'GOTV' | 'STARTIMES'>('DSTV');
  const [smartcard, setSmartcard] = useState('1029384756');
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [planCode, setPlanCode] = useState('DSTV-COMP');
  const [amount, setAmount] = useState(15700);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const packages = {
    DSTV: [
      { code: 'DSTV-PADI', name: 'DStv Padi Bouquet', amount: 3600 },
      { code: 'DSTV-YANGA', name: 'DStv Yanga Bouquet', amount: 5100 },
      { code: 'DSTV-CONFAM', name: 'DStv Confam Bouquet', amount: 9300 },
      { code: 'DSTV-COMP', name: 'DStv Compact Bouquet', amount: 15700 },
      { code: 'DSTV-COMP-PLUS', name: 'DStv Compact Plus', amount: 25000 },
      { code: 'DSTV-PREM', name: 'DStv Premium Bouquet', amount: 37000 },
    ],
    GOTV: [
      { code: 'GOTV-SML', name: 'GOtv Smallie Bouquet', amount: 1575 },
      { code: 'GOTV-JIN', name: 'GOtv Jinja Bouquet', amount: 3300 },
      { code: 'GOTV-JOL', name: 'GOtv Jolli Bouquet', amount: 4850 },
      { code: 'GOTV-MAX', name: 'GOtv Max Bouquet', amount: 7200 },
      { code: 'GOTV-SUPA', name: 'GOtv Supa Bouquet', amount: 9600 },
    ],
    STARTIMES: [
      { code: 'STAR-NOVA', name: 'StarTimes Nova Bouquet', amount: 1700 },
      { code: 'STAR-BASIC', name: 'StarTimes Basic Bouquet', amount: 3300 },
      { code: 'STAR-SMART', name: 'StarTimes Smart Bouquet', amount: 4200 },
      { code: 'STAR-CLASSIC', name: 'StarTimes Classic Bouquet', amount: 5000 },
      { code: 'STAR-SUPER', name: 'StarTimes Super Bouquet', amount: 7500 },
    ]
  };

  const handleVerifySmartcard = async () => {
    if (!smartcard || smartcard.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Invalid Number', text: 'Enter a valid 10 or 11-digit IUC/Smartcard number' });
      return;
    }
    try {
      setVerifying(true);
      const res = await api.verifyCustomer('cable', provider, smartcard);
      setVerifiedName(res.customerName);
      Swal.fire({
        icon: 'success',
        title: 'Customer Verified',
        text: `Customer: ${res.customerName} (${res.accountStatus || 'Active'})`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Verification Failed', text: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartcard || smartcard.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Invalid Smartcard', text: 'Please enter a valid smartcard/IUC number' });
      return;
    }
    setShowPinModal(true);
  };

  const executeCablePurchase = async () => {
    setShowPinModal(false);
    try {
      setLoading(true);
      const res = await api.purchaseVTU({
        category: 'cable',
        billerOrNetwork: provider,
        planCode,
        recipient: smartcard,
        amount
      });

      Swal.fire({
        icon: 'success',
        title: 'Cable Subscription Renewed!',
        html: `
          <div style="text-align: left; font-size: 13px;">
            <p><strong>Provider:</strong> ${provider}</p>
            <p><strong>Smartcard/IUC:</strong> ${smartcard}</p>
            <p><strong>Customer:</strong> ${verifiedName || 'Verified Customer'}</p>
            <p><strong>Package:</strong> ${packages[provider].find(p => p.code === planCode)?.name}</p>
            <p><strong>Amount Charged:</strong> ₦${res.chargedAmount.toFixed(2)}</p>
            <p><strong>Reference:</strong> ${res.reference}</p>
          </div>
        `,
        confirmButtonColor: '#1E5BF9'
      });
      onRefreshUser();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Subscription Failed', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-xs font-bold text-blue-600 hover:underline mb-1 inline-block">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cable TV Subscriptions
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Instant IUC/Smartcard validation and bouquet reconnection
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 card-shadow">
          <form onSubmit={handlePurchase} className="space-y-5">
            {/* Provider */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                1. Select Cable Provider
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['DSTV', 'GOTV', 'STARTIMES'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setProvider(p);
                      setPlanCode(packages[p][0].code);
                      setAmount(packages[p][0].amount);
                    }}
                    className={`py-3 rounded-2xl border font-bold text-xs transition ${
                      provider === p
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Smartcard number with validation button */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                2. Smartcard / IUC Number
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={smartcard}
                  onChange={(e) => { setSmartcard(e.target.value); setVerifiedName(null); }}
                  placeholder="e.g. 1029384756"
                  className="flex-1 text-base font-bold border border-slate-200 rounded-2xl p-3.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleVerifySmartcard}
                  disabled={verifying}
                  className="bg-slate-800 text-white font-bold text-xs px-4 rounded-2xl hover:bg-slate-900 transition"
                >
                  {verifying ? 'Verifying...' : 'Validate Name'}
                </button>
              </div>

              {verifiedName && (
                <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center space-x-2 text-xs text-emerald-800 font-bold">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Customer: {verifiedName}</span>
                </div>
              )}
            </div>

            {/* Bouquet Selector */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                3. Select Package / Bouquet
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {packages[provider].map(pkg => (
                  <button
                    key={pkg.code}
                    type="button"
                    onClick={() => { setPlanCode(pkg.code); setAmount(pkg.amount); }}
                    className={`p-3.5 rounded-2xl border text-left transition flex justify-between items-center ${
                      planCode === pkg.code
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                        : 'border-slate-200 hover:border-blue-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{pkg.name}</div>
                      <div className="text-[10px] text-slate-400">1 Month Subscription</div>
                    </div>
                    <span className="font-black text-blue-700 text-sm">₦{pkg.amount.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-extrabold text-sm py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Reconnecting...' : `Renew Subscription (₦${amount.toLocaleString()})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 card-shadow">
            <h3 className="font-extrabold text-sm text-slate-900 mb-2">Reconnection Tip</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Please leave your decoder turned ON on Channel 200 (or Channel 100 for GOtv) during payment for instant automated signal activation within 60 seconds.
            </p>
          </div>
        </div>
      </div>

      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={executeCablePurchase}
        title="Authorize Cable TV Renewal"
        amount={amount}
        recipient={smartcard}
        serviceName={`${provider} ${packages[provider].find(p => p.code === planCode)?.name || planCode}`}
      />
    </div>
  );
};
