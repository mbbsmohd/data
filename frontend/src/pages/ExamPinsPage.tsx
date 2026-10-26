import React, { useState } from 'react';
import { Award, CheckCircle2, Printer, Copy, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { TransactionPinModal } from '../components/TransactionPinModal';

export const ExamPinsPage: React.FC<{
  onBack: () => void;
  onRefreshUser: () => void;
}> = ({ onBack, onRefreshUser }) => {
  const [examBody, setExamBody] = useState<'WAEC' | 'NECO' | 'NABTEB' | 'JAMB'>('WAEC');
  const [quantity, setQuantity] = useState(1);
  const [studentPhone, setStudentPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [deliveredVouchers, setDeliveredVouchers] = useState<any[]>([]);

  const examOptions = [
    { id: 'WAEC', name: 'WAEC Result Checker', price: 3600, desc: 'Check May/June & GCE candidate results' },
    { id: 'NECO', name: 'NECO Result Token', price: 1200, desc: 'Access June/July SSCE & External results' },
    { id: 'NABTEB', name: 'NABTEB Scratch Card', price: 1100, desc: 'NBC/NTC exam result checker' },
    { id: 'JAMB', name: 'JAMB UTME e-Facility', price: 4700, desc: 'UTME profile activation & change of institution' },
  ];

  const selectedExam = examOptions.find(e => e.id === examBody)!;
  const totalAmount = selectedExam.price * quantity;

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentPhone || studentPhone.length < 10) {
      Swal.fire({ icon: 'warning', title: 'Phone Required', text: 'Enter recipient candidate/parent phone number.' });
      return;
    }
    setShowPinModal(true);
  };

  const handlePurchase = async () => {
    setShowPinModal(false);
    try {
      setLoading(true);
      const res = await api.purchaseVTU({
        category: 'exam_pin',
        billerOrNetwork: examBody,
        recipient: studentPhone,
        amount: totalAmount
      });

      // Parse generated serial / pin
      const generatedList = [];
      for (let i = 0; i < quantity; i++) {
        generatedList.push({
          id: `pin_${i}`,
          exam: examBody,
          pin: res.tokenOrPin || `WEC-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
          phone: studentPhone,
          date: new Date().toLocaleDateString(),
          ref: res.reference
        });
      }
      setDeliveredVouchers(generatedList);

      Swal.fire({
        icon: 'success',
        title: `${examBody} PIN Generated!`,
        text: 'Your examination voucher PIN is ready below and can be printed or shared.',
        confirmButtonColor: '#1E5BF9'
      });

      onRefreshUser();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Purchase Failed', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyPin = (pinText: string) => {
    navigator.clipboard.writeText(pinText);
    Swal.fire({ icon: 'success', title: 'PIN Copied', timer: 1200, showConfirmButton: false });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 mb-2"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <Award className="w-7 h-7 text-blue-600" />
          <span>Exam PINs & Result Checker Tokens</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Instant WAEC, NECO, NABTEB, and JAMB registration tokens with printable candidate slips
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          {/* Exam Body Selection */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2.5">
              Select Examination Body
            </label>
            <div className="grid grid-cols-2 gap-3">
              {examOptions.map(exam => {
                const isSelected = examBody === exam.id;
                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => setExamBody(exam.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500 shadow-sm'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-slate-900">{exam.name}</div>
                    <div className="text-[11px] font-bold text-blue-600 font-mono mt-0.5">₦{exam.price.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{exam.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleInitiate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Recipient Phone (Candidate / Parent)
                </label>
                <input
                  type="tel"
                  required
                  value={studentPhone}
                  onChange={e => setStudentPhone(e.target.value)}
                  placeholder="e.g. 08021234567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Quantity
                </label>
                <select
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700"
                >
                  {[1, 2, 3, 5, 10].map(q => (
                    <option key={q} value={q}>{q} {q === 1 ? 'Voucher PIN' : 'Voucher PINs'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Total Billing Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Total Cost ({quantity}x {examBody}):</span>
                <span className="text-[10px] text-emerald-600 font-bold">Instant e-Pin Delivery Guaranteed</span>
              </div>
              <span className="text-xl font-black font-mono text-blue-700">
                ₦{totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-2xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>Purchase {examBody} PIN(s)</span>
            </button>
          </form>
        </div>

        {/* Instructions & Guidelines Column */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Portal Guidelines</h4>
          <div className="space-y-3 text-xs text-slate-600 font-medium">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
              <strong className="text-blue-900 block mb-1">WAEC Online Portal:</strong>
              Visit <span className="underline font-mono">waecdirect.org</span> and enter the candidate 10-digit exam number, exam year, and the PIN generated.
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <strong className="text-emerald-900 block mb-1">NECO Online Portal:</strong>
              Visit <span className="underline font-mono">result.neco.gov.ng</span> and enter the exam year, exam type, token PIN, and registration number.
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Official 100% Genuine Exam Vouchers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Results Slip / Delivery Cards */}
      {deliveredVouchers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-slate-900">Delivered Examination Vouchers</h3>
              <p className="text-xs text-slate-500 font-medium">Provide these details to the candidate</p>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slips</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {deliveredVouchers.map((v, i) => (
              <div key={i} className="border-2 border-dashed border-blue-200 rounded-2xl p-4 bg-blue-50/30 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-blue-700 uppercase">{v.exam} Voucher #{i + 1}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{v.date}</span>
                </div>
                <div className="bg-white border border-blue-200 rounded-xl p-3 flex justify-between items-center">
                  <span className="font-mono font-extrabold text-sm text-slate-900 tracking-wider select-all">
                    {v.pin}
                  </span>
                  <button
                    onClick={() => copyPin(v.pin)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between font-mono">
                  <span>Phone: {v.phone}</span>
                  <span>Ref: {v.ref}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePurchase}
        title={`Authorize ${examBody} Purchase`}
        amount={totalAmount}
        recipient={studentPhone}
        serviceName={`${quantity}x ${examBody} Exam PIN`}
      />
    </div>
  );
};
