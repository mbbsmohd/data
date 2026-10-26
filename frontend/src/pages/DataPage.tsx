import React, { useState, useEffect } from 'react';
import { Wifi, CheckCircle2, ArrowRight, Phone, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { TransactionPinModal } from '../components/TransactionPinModal';
import { TransactionProcessingModal, ProcessingStatus } from '../components/TransactionProcessingModal';

export const DataPage: React.FC<{ onBack: () => void; onRefreshUser: () => void }> = ({ onBack, onRefreshUser }) => {
  const [network, setNetwork] = useState('MTN');
  const [dataType, setDataType] = useState<'SME' | 'CG' | 'DIRECT'>('SME');
  const [phone, setPhone] = useState('09131797675');
  const [planCode, setPlanCode] = useState('MTN-SME-1GB');
  const [amount, setAmount] = useState(260);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [recentBeneficiaries] = useState(['09131797675', '08023456789', '08051234567']);

  // Processing Modal State
  const [procStatus, setProcStatus] = useState<ProcessingStatus>('IDLE');
  const [procTitle, setProcTitle] = useState('');
  const [procDesc, setProcDesc] = useState('');
  const [procRef, setProcRef] = useState('');
  const [procError, setProcError] = useState('');

  const fallbackPlans = [
    { code: `${network}-500MB`, name: '500 MB', amount: network === 'MTN' ? 140 : 150, validity: '30 Days' },
    { code: `${network}-1GB`, name: '1.0 GB', amount: network === 'MTN' ? 260 : network === 'AIRTEL' ? 280 : 240, validity: '30 Days' },
    { code: `${network}-2GB`, name: '2.0 GB', amount: network === 'MTN' ? 520 : network === 'AIRTEL' ? 560 : 480, validity: '30 Days' },
    { code: `${network}-3GB`, name: '3.0 GB', amount: network === 'MTN' ? 780 : 840, validity: '30 Days' },
    { code: `${network}-5GB`, name: '5.0 GB', amount: network === 'MTN' ? 1300 : 1400, validity: '30 Days' },
    { code: `${network}-10GB`, name: '10.0 GB', amount: network === 'MTN' ? 2600 : 2800, validity: '30 Days' },
    { code: `${network}-20GB`, name: '20.0 GB', amount: network === 'MTN' ? 5200 : 5600, validity: '30 Days' },
  ];

  useEffect(() => {
    fetchDynamicPlans();
  }, [network, dataType]);

  const fetchDynamicPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await api.getPlans(network, dataType);
      if (res.success && res.plans && res.plans.length > 0) {
        const formatted = res.plans.map((p: any) => ({
          code: p.plan_code,
          name: p.plan_name,
          amount: p.amount,
          validity: p.validity || '30 Days'
        }));
        setPlans(formatted);
        setPlanCode(formatted[0].code);
        setAmount(formatted[0].amount);
      } else {
        setPlans(fallbackPlans);
        setPlanCode(fallbackPlans[1].code);
        setAmount(fallbackPlans[1].amount);
      }
    } catch {
      setPlans(fallbackPlans);
      setPlanCode(fallbackPlans[1].code);
      setAmount(fallbackPlans[1].amount);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePhoneChange = async (val: string) => {
    setPhone(val);
    if (val.length >= 4) {
      try {
        const res = await api.detectNetwork(val);
        if (res.network && res.network !== network) {
          setNetwork(res.network);
        }
      } catch {
        // Fallback
      }
    }
  };

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 11) {
      Swal.fire({ icon: 'warning', title: 'Invalid Phone Number', text: 'Please enter a valid 11-digit phone number.' });
      return;
    }
    setShowPinModal(true);
  };

  const executeDataPurchase = async () => {
    setShowPinModal(false);
    setProcStatus('PROCESSING');
    setProcTitle('Delivering Data Bundle');
    setProcDesc(`Securing token and dispatching ${network} ${plans.find(p => p.code === planCode)?.name || ''} to ${phone}...`);
    setProcRef('');
    setProcError('');

    try {
      setLoading(true);
      const res = await api.purchaseVTU({
        category: 'data',
        billerOrNetwork: network,
        planCode,
        recipient: phone,
        amount
      });

      setProcStatus('SUCCESS');
      setProcTitle('Data Bundle Delivered!');
      setProcDesc(`Successfully sent to ${res.recipient || phone}. New Balance: ₦${res.newBalance?.toFixed(2) || '0.00'}`);
      setProcRef(res.reference);
      onRefreshUser();
    } catch (err: any) {
      setProcStatus('FAILED');
      setProcTitle('Purchase Failed');
      setProcDesc('The telecom provider was unable to complete this bundle purchase.');
      setProcError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <button
            onClick={onBack}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Wifi className="w-8 h-8 text-blue-600" />
            <span>Purchase SME & Corporate Data</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Real-time bundle gifting directly connected to live telecom APIs and hosted SIM gateways
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <form onSubmit={handlePurchase} className="space-y-6">
            {/* 1. Network Selector */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2.5">
                1. Select Telecom Network
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'MTN', name: 'MTN', tag: 'SME / Direct' },
                  { id: 'AIRTEL', name: 'AIRTEL', tag: 'CG / Direct' },
                  { id: 'GLO', name: 'GLO', tag: 'CG / SME' },
                  { id: '9MOBILE', name: '9MOBILE', tag: 'Corporate' },
                ].map(net => {
                  const isSelected = network === net.id;
                  return (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setNetwork(net.id)}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between h-22 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500 shadow-sm'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="font-black text-base text-slate-900">{net.name}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md self-start border border-emerald-200">
                        {net.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Data Type */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2.5">
                2. Data Type / Gifting Category
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['SME', 'CG', 'DIRECT'] as const).map(dt => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setDataType(dt)}
                    className={`py-3 px-4 text-xs md:text-sm font-bold rounded-2xl border transition ${
                      dataType === dt
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {dt === 'SME' ? 'SME Data' : dt === 'CG' ? 'Corporate Gifting' : 'Direct Gifting'}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Phone Number with Auto-Detection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  3. Recipient Phone Number
                </label>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                  Detected: {network} Network
                </span>
              </div>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="e.g. 08031234567"
                  className="w-full text-base font-mono font-bold border border-slate-200 rounded-2xl p-4 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-wider text-slate-900"
                />
                <Phone className="w-5 h-5 text-slate-400 absolute right-4 top-4" />
              </div>

              {/* Beneficiary quick picks */}
              <div className="flex items-center space-x-2 mt-2.5">
                <span className="text-xs text-slate-400 font-semibold">Recent Numbers:</span>
                {recentBeneficiaries.map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handlePhoneChange(b)}
                    className="text-xs font-mono font-bold text-blue-600 hover:underline bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Plan Selection Grid */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  4. Select Bundle Plan
                </label>
                {loadingPlans && (
                  <span className="text-xs text-blue-600 flex items-center space-x-1 font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading live plans...</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {plans.map(p => {
                  const isSelected = planCode === p.code;
                  return (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => { setPlanCode(p.code); setAmount(p.amount); }}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="font-black text-base text-slate-900">{p.name}</div>
                        <div className="text-sm font-black font-mono text-blue-700 mt-1">₦{p.amount.toLocaleString()}</div>
                      </div>
                      <div className="text-xs font-semibold text-slate-400 mt-2">{p.validity}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Summary & Submit Button */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-500">Total Debit Amount:</span>
                <span className="text-xl font-black font-mono text-blue-700">₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base py-4 rounded-2xl transition shadow-lg shadow-blue-500/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Fulfilling via Telecom Gateway...' : `Authorize & Purchase (${plans.find(p => p.code === planCode)?.name || 'Data Bundle'})`}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info & Balances */}
        <div className="space-y-4">
          <div className="bg-blue-50/80 rounded-3xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center space-x-2 text-blue-900 font-extrabold text-base">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Direct Telecomm Route</span>
            </div>
            <p className="text-sm text-blue-900/80 mt-2 leading-relaxed font-medium">
              Data orders are fulfilled live via authorized telecom enterprise gateway API endpoints and dedicated GSM SIM banks with 99.98% delivery success.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-black text-base text-slate-900">Balance Check USSD Codes</h3>
            <div className="space-y-2.5 text-sm text-slate-600 font-medium">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">MTN SME</span>
                <span className="font-mono text-blue-600 font-black">*461*4#</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">MTN CG</span>
                <span className="font-mono text-blue-600 font-black">*131*4#</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Airtel Data</span>
                <span className="font-mono text-blue-600 font-black">*140#</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Glo Data</span>
                <span className="font-mono text-blue-600 font-black">*127*0#</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-800">9mobile</span>
                <span className="font-mono text-blue-600 font-black">*228#</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={executeDataPurchase}
        title="Confirm Data Bundle"
        amount={amount}
        recipient={phone}
        serviceName={`${network} ${plans.find(p => p.code === planCode)?.name || planCode}`}
      />

      <TransactionProcessingModal
        isOpen={procStatus !== 'IDLE'}
        status={procStatus}
        title={procTitle}
        description={procDesc}
        reference={procRef}
        amount={amount}
        errorMessage={procError}
        onClose={() => setProcStatus('IDLE')}
      />
    </div>
  );
};
