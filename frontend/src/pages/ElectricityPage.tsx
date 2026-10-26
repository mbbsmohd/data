import React, { useState } from 'react';
import { Zap, CheckCircle2, ArrowRight, UserCheck, Printer } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { TransactionPinModal } from '../components/TransactionPinModal';

export const ElectricityPage: React.FC<{ onBack: () => void; onRefreshUser: () => void }> = ({ onBack, onRefreshUser }) => {
  const [disco, setDisco] = useState('IKEDC');
  const [meterType, setMeterType] = useState<'PREPAID' | 'POSTPAID'>('PREPAID');
  const [meterNumber, setMeterNumber] = useState('04192847192');
  const [amount, setAmount] = useState(5000);
  const [phone, setPhone] = useState('09131797675');
  const [verifiedCustomer, setVerifiedCustomer] = useState<any | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const discos = [
    { code: 'IKEDC', name: 'Ikeja Electric (IKEDC)' },
    { code: 'EKEDC', name: 'Eko Electric (EKEDC)' },
    { code: 'AEDC', name: 'Abuja Electricity (AEDC)' },
    { code: 'IBEDC', name: 'Ibadan Electric (IBEDC)' },
    { code: 'PHED', name: 'Port Harcourt Electric (PHED)' },
    { code: 'EEDC', name: 'Enugu Electric (EEDC)' },
    { code: 'KEDCO', name: 'Kano Electric (KEDCO)' },
  ];

  const handleVerifyMeter = async () => {
    if (!meterNumber || meterNumber.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Invalid Meter', text: 'Enter a valid 11 or 13-digit meter number' });
      return;
    }
    try {
      setVerifying(true);
      const res = await api.verifyCustomer('electricity', disco, meterNumber);
      setVerifiedCustomer(res);
      Swal.fire({
        icon: 'success',
        title: 'Meter Verified',
        text: `Customer: ${res.customerName} • ${res.customerAddress}`,
        timer: 1800,
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
    if (!meterNumber || meterNumber.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Invalid Meter', text: 'Enter a valid meter number.' });
      return;
    }
    setShowPinModal(true);
  };

  const executeElectricityPurchase = async () => {
    setShowPinModal(false);
    try {
      setLoading(true);
      const res = await api.purchaseVTU({
        category: 'electricity',
        billerOrNetwork: disco,
        recipient: meterNumber,
        amount
      });

      setGeneratedToken(res.tokenOrPin);
      Swal.fire({
        icon: 'success',
        title: 'Electricity Token Generated!',
        html: `
          <div style="text-align: left; font-size: 13px;">
            <p><strong>DISCO:</strong> ${disco}</p>
            <p><strong>Meter Number:</strong> ${meterNumber}</p>
            <p><strong>Customer Name:</strong> ${verifiedCustomer?.customerName || 'Alhaji Abubakar Musa'}</p>
            <div style="background: #ECFDF5; border: 1px solid #10B981; padding: 14px; border-radius: 12px; margin: 12px 0; text-align: center;">
              <span style="font-size: 11px; font-weight: bold; color: #065F46; display: block;">20-DIGIT PREPAID TOKEN:</span>
              <span style="font-size: 20px; font-weight: 900; color: #047857; letter-spacing: 2px;">${res.tokenOrPin}</span>
            </div>
            <p style="font-size: 12px; color: #64748B;">Units: ${(amount / 72.5).toFixed(1)} kWh • Receipt Ref: ${res.reference}</p>
          </div>
        `,
        confirmButtonColor: '#059669'
      });
      onRefreshUser();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Payment Failed', text: err.message });
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
            Electricity Bill Payment & Tokens
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Instant 20-digit prepaid meter token generation and postpaid bill settlement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 card-shadow">
          <form onSubmit={handlePurchase} className="space-y-5">
            {/* DISCO */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                1. Select Distribution Company (DISCO)
              </label>
              <select
                value={disco}
                onChange={(e) => { setDisco(e.target.value); setVerifiedCustomer(null); }}
                className="w-full text-xs font-bold border border-slate-200 rounded-2xl p-3.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {discos.map(d => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Meter Type */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                2. Meter Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['PREPAID', 'POSTPAID'] as const).map(mt => (
                  <button
                    key={mt}
                    type="button"
                    onClick={() => setMeterType(mt)}
                    className={`py-3 rounded-2xl border font-bold text-xs transition ${
                      meterType === mt
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mt} METER
                  </button>
                ))}
              </div>
            </div>

            {/* Meter Number with validation */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                3. Meter Number
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={meterNumber}
                  onChange={(e) => { setMeterNumber(e.target.value); setVerifiedCustomer(null); }}
                  placeholder="e.g. 04192847192"
                  className="flex-1 text-base font-bold border border-slate-200 rounded-2xl p-3.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleVerifyMeter}
                  disabled={verifying}
                  className="bg-slate-800 text-white font-bold text-xs px-4 rounded-2xl hover:bg-slate-900 transition"
                >
                  {verifying ? 'Validating...' : 'Validate Meter'}
                </button>
              </div>

              {verifiedCustomer && (
                <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                  <div className="font-extrabold">{verifiedCustomer.customerName}</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">{verifiedCustomer.customerAddress}</div>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                4. Amount to Purchase (₦)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1000"
                step="500"
                className="w-full text-xl font-black border border-slate-200 rounded-2xl p-3.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Token result preview */}
            {generatedToken && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Your Prepaid Electricity Token</span>
                <div className="text-2xl font-black text-emerald-900 tracking-widest mt-1">{generatedToken}</div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-2 inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:underline"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt Slip</span>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white font-extrabold text-sm py-4 rounded-2xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Zap className="w-5 h-5" />
              <span>{loading ? 'Vend Request Processing...' : `Vend Token (₦${amount.toLocaleString()})`}</span>
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 text-xs text-emerald-900">
            <h3 className="font-extrabold text-sm mb-2">Prepaid Token Information</h3>
            <p className="leading-relaxed">
              Once issued, key your 20-digit token into your CIU (Customer Interface Unit) and press the blue or green button to credit your electricity units immediately.
            </p>
          </div>
        </div>
      </div>

      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={executeElectricityPurchase}
        title="Authorize Electricity Vend"
        amount={amount}
        recipient={meterNumber}
        serviceName={`${disco} ${meterType} Electricity`}
      />
    </div>
  );
};
