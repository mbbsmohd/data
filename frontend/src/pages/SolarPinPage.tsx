import React, { useState } from 'react';
import { Sun, CheckCircle2, ArrowRight, ShieldCheck, Printer, KeyRound } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { TransactionPinModal } from '../components/TransactionPinModal';

export const SolarPinPage: React.FC<{ onBack: () => void; onRefreshUser: () => void }> = ({ onBack, onRefreshUser }) => {
  const [productCode, setProductCode] = useState('SUN-7DAY');
  const [accountNumber, setAccountNumber] = useState('SUN-8891238');
  const [amount, setAmount] = useState(2200);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const solarPackages = [
    { code: 'SUN-1DAY', name: 'SunKing 1-Day Lighting Activation PIN', amount: 350, validity: '24 Hours', desc: 'Instant 24-hr token for EasyBuy units' },
    { code: 'SUN-7DAY', name: 'SunKing 7-Day Solar Bundle Activation PIN', amount: 2200, validity: '7 Days', desc: 'Weekly continuous solar light & phone charging' },
    { code: 'SUN-30DAY', name: 'SunKing 30-Day Solar Home System PIN', amount: 8900, validity: '30 Days', desc: 'Full monthly household lighting & TV system token' },
    { code: 'SUN-BOOM', name: 'SunKing Boom Solar Energy Token', amount: 14500, validity: '60 Days', desc: 'Commercial solar power kit token' },
  ];

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || accountNumber.trim().length < 5) {
      Swal.fire({ icon: 'warning', title: 'Invalid Account Number', text: 'Please enter your SunKing Unit/Account Number.' });
      return;
    }
    setShowPinModal(true);
  };

  const executeSolarPurchase = async () => {
    setShowPinModal(false);
    try {
      setLoading(true);
      const res = await api.purchaseVTU({
        category: 'solar_pin',
        billerOrNetwork: 'SUNKING',
        planCode: productCode,
        recipient: accountNumber,
        amount
      });

      setGeneratedPin(res.tokenOrPin);
      Swal.fire({
        icon: 'success',
        title: 'SunKing Solar PIN Generated!',
        html: `
          <div style="text-align: left; font-size: 14px;">
            <p><strong>Account ID:</strong> ${accountNumber}</p>
            <p><strong>Package:</strong> ${solarPackages.find(p => p.code === productCode)?.name}</p>
            <div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 14px; border-radius: 12px; margin: 12px 0; text-align: center;">
              <span style="font-size: 11px; font-weight: bold; color: #92400E; display: block;">16-DIGIT ACTIVATION PIN:</span>
              <span style="font-size: 22px; font-weight: 900; color: #B45309; letter-spacing: 2px;">${res.tokenOrPin}</span>
            </div>
            <p style="font-size: 12px; color: #64748B;">Enter this PIN directly into your SunKing keypad to activate power immediately.</p>
          </div>
        `,
        confirmButtonColor: '#D97706'
      });
      onRefreshUser();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Generation Failed', text: err.message });
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
            SunKing Solar PIN Generator
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Instant 16-digit activation codes for SunKing EasyBuy and Solar Home Systems
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 card-shadow">
          <form onSubmit={handlePurchase} className="space-y-5">
            {/* Package selector */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                1. Select SunKing Package Plan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {solarPackages.map(pkg => (
                  <button
                    key={pkg.code}
                    type="button"
                    onClick={() => { setProductCode(pkg.code); setAmount(pkg.amount); }}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                      productCode === pkg.code
                        ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-amber-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">{pkg.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{pkg.desc}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-black text-amber-600 text-base">₦{pkg.amount.toLocaleString()}</span>
                      <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{pkg.validity}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Account ID */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                2. SunKing Unit ID / Account Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. SUN-8891238"
                  className="w-full text-base font-bold border border-slate-200 rounded-2xl p-3.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <KeyRound className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Found on the barcode sticker behind your SunKing control unit.</p>
            </div>

            {/* Generated PIN preview if available */}
            {generatedPin && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Active Activation Code</span>
                <div className="text-2xl font-black text-amber-900 tracking-widest mt-1">{generatedPin}</div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-2 inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 hover:underline"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt Slip</span>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white font-extrabold text-sm py-4 rounded-2xl hover:bg-amber-700 transition shadow-lg shadow-amber-600/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Sun className="w-5 h-5" />
              <span>{loading ? 'Generating 16-Digit PIN...' : `Generate SunKing PIN (₦${amount.toLocaleString()})`}</span>
            </button>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-amber-50 rounded-3xl p-5 border border-amber-100">
            <h3 className="font-extrabold text-sm text-amber-900 mb-2">How SunKing PINs Work</h3>
            <ol className="text-xs text-amber-800 space-y-2 list-decimal list-inside leading-relaxed font-medium">
              <li>Select your duration (1-Day, 7-Day, or 30-Day).</li>
              <li>Input your unit serial/account number.</li>
              <li>Instantly receive your 16-digit numeric token.</li>
              <li>Key the code into your SunKing solar battery unit to unlock power.</li>
            </ol>
          </div>
        </div>
      </div>

      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={executeSolarPurchase}
        title="Authorize Solar PIN Purchase"
        amount={amount}
        recipient={accountNumber}
        serviceName={solarPackages.find(p => p.code === productCode)?.name || 'SunKing Solar PIN'}
      />
    </div>
  );
};
