import React, { useState } from 'react';
import { Phone, CheckCircle2, Zap, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { TransactionPinModal } from '../components/TransactionPinModal';
import { TransactionProcessingModal, ProcessingStatus } from '../components/TransactionProcessingModal';

export const AirtimePage: React.FC<{
  onBack: () => void;
  onRefreshUser: () => void;
}> = ({ onBack, onRefreshUser }) => {
  const [network, setNetwork] = useState('MTN');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('500');
  const [showPinModal, setShowPinModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Processing Feedback Modal States
  const [procStatus, setProcStatus] = useState<ProcessingStatus>('IDLE');
  const [procTitle, setProcTitle] = useState('');
  const [procDesc, setProcDesc] = useState('');
  const [procRef, setProcRef] = useState('');
  const [procError, setProcError] = useState('');

  const networks = [
    { id: 'MTN', name: 'MTN VTU', discount: '2.5%', color: 'from-amber-400 to-yellow-500', text: 'text-amber-900' },
    { id: 'AIRTEL', name: 'Airtel VTU', discount: '2.0%', color: 'from-red-500 to-rose-600', text: 'text-white' },
    { id: 'GLO', name: 'Glo VTU', discount: '3.0%', color: 'from-emerald-500 to-green-600', text: 'text-white' },
    { id: '9MOBILE', name: '9mobile VTU', discount: '2.5%', color: 'from-emerald-700 to-teal-800', text: 'text-white' },
  ];

  const handlePhoneChange = async (val: string) => {
    setPhone(val);
    if (val.length >= 4) {
      try {
        const res = await api.detectNetwork(val);
        if (res.network) setNetwork(res.network);
      } catch {
        // Fallback
      }
    }
  };

  const currentDiscountRate = network === 'GLO' ? 0.03 : network === 'AIRTEL' ? 0.02 : 0.025;
  const numAmount = Number(amount) || 0;
  const discountAmount = Math.round(numAmount * currentDiscountRate * 100) / 100;
  const finalCharge = Math.max(0, numAmount - discountAmount);

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      Swal.fire({ icon: 'warning', title: 'Invalid Phone Number', text: 'Enter a valid Nigerian mobile phone number.' });
      return;
    }
    if (numAmount < 50 || numAmount > 50000) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Airtime amount must be between ₦50 and ₦50,000.' });
      return;
    }

    setShowPinModal(true);
  };

  const handleExecutePurchase = async () => {
    setShowPinModal(false);
    setProcStatus('PROCESSING');
    setProcTitle('Recharging Airtime');
    setProcDesc(`Securing token and dispatching ₦${numAmount.toLocaleString()} ${network} airtime to ${phone}...`);
    setProcRef('');
    setProcError('');

    try {
      setLoading(true);
      const res = await api.purchaseVTU({
        category: 'airtime',
        billerOrNetwork: network,
        recipient: phone,
        amount: numAmount
      });

      setProcStatus('SUCCESS');
      setProcTitle('Airtime Delivered!');
      setProcDesc(`₦${numAmount.toLocaleString()} ${network} airtime sent to ${phone}. Saved discount: ₦${res.discountAmount || discountAmount}.`);
      setProcRef(res.reference);

      onRefreshUser();
      setPhone('');
    } catch (err: any) {
      setProcStatus('FAILED');
      setProcTitle('Airtime Top-Up Failed');
      setProcDesc('The telecom provider was unable to complete this airtime recharge.');
      setProcError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 mb-2"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <Phone className="w-7 h-7 text-blue-600" />
          <span>Instant Airtime Top-Up</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Instant VTU airtime recharge across all networks with instant cash-back discounts
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        {/* Network Selection */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2.5">
            Select Telecom Network
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {networks.map(net => {
              const isSelected = network === net.id;
              return (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => setNetwork(net.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between h-20 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500 shadow-sm'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-extrabold text-xs text-slate-900">{net.name}</span>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full self-start border border-emerald-200">
                    {net.discount} OFF
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleInitiate} className="space-y-4">
          {/* Recipient Phone */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Recipient Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="e.g. 08031234567"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Amounts */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Select or Enter Amount
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {['100', '200', '500', '1000', '2000', '5000'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    amount === val
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  ₦{val}
                </button>
              ))}
            </div>

            <input
              type="number"
              min="50"
              max="50000"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Custom amount (₦50 - ₦50,000)"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Discount Summary Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5 text-xs font-medium">
            <div className="flex justify-between">
              <span className="text-slate-500">Airtime Face Value:</span>
              <span className="font-mono font-bold text-slate-900">₦{numAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Instant Cash-back Saved:</span>
              <span className="font-mono font-bold">- ₦{discountAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200/80 pt-2 text-sm font-extrabold text-blue-700">
              <span>Total Wallet Charge:</span>
              <span className="font-mono">₦{finalCharge.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-2xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>Recharge Airtime Now</span>
          </button>
        </form>
      </div>

      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleExecutePurchase}
        title="Confirm Airtime Purchase"
        amount={finalCharge}
        recipient={phone}
        serviceName={`${network} Airtime Topup`}
      />

      <TransactionProcessingModal
        isOpen={procStatus !== 'IDLE'}
        status={procStatus}
        title={procTitle}
        description={procDesc}
        reference={procRef}
        amount={finalCharge}
        errorMessage={procError}
        onClose={() => setProcStatus('IDLE')}
      />
    </div>
  );
};
