import React, { useState } from 'react';
import { Printer, CheckCircle2, ArrowRight, ShieldCheck, Download, CreditCard } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';

export const RechargePrintPage: React.FC<{ onBack: () => void; onRefreshUser: () => void }> = ({ onBack, onRefreshUser }) => {
  const [network, setNetwork] = useState('MTN');
  const [denomination, setDenomination] = useState(100);
  const [quantity, setQuantity] = useState(10);
  const [businessName, setBusinessName] = useState('BUKAR DATA SUB ENTERPRISES');
  const [generatedBatch, setGeneratedBatch] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const wholesaleDiscount = 0.02; // 2% discount
  const unitCost = denomination * (1 - wholesaleDiscount);
  const totalCost = unitCost * quantity;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.generateRechargeCards({
        network,
        denomination,
        quantity,
        businessName
      });

      setGeneratedBatch(res);
      Swal.fire({
        icon: 'success',
        title: 'Recharge e-PINs Generated!',
        text: `Generated batch of ${quantity}x ₦${denomination} ${network} cards. Total charged: ₦${res.totalCharged.toFixed(2)}`,
        confirmButtonColor: '#1E5BF9'
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
            Recharge Card Printing & e-PINs
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Generate and print branded physical recharge card vouchers with wholesale discounts
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 card-shadow mb-8">
        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Network */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
              1. Select Network
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['MTN', 'AIRTEL', 'GLO', '9MOBILE'].map(net => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setNetwork(net)}
                  className={`py-3 rounded-2xl border font-bold text-xs transition ${
                    network === net
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          {/* Denomination */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
              2. Denomination
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[100, 200, 500, 1000].map(den => (
                <button
                  key={den}
                  type="button"
                  onClick={() => setDenomination(den)}
                  className={`py-3 rounded-2xl border font-bold text-xs transition ${
                    denomination === den
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ₦{den}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                3. Quantity (Cards to Print)
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                max="50"
                className="w-full text-base font-bold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                4. Custom Business / Enterprise Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full text-base font-bold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Pricing summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Total Cost (2% Wholesale Margin Applied):</span>
              <div className="text-2xl font-black text-slate-900">₦{totalCost.toFixed(2)}</div>
            </div>
            <div className="text-right text-xs text-emerald-600 font-bold">
              Face Value: ₦{(denomination * quantity).toLocaleString()}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-extrabold text-sm py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Printer className="w-5 h-5" />
            <span>{loading ? 'Generating Encrypted Pins...' : `Generate ${quantity}x ₦${denomination} Cards`}</span>
          </button>
        </form>
      </div>

      {/* Generated Cards Printable Sheet */}
      {generatedBatch && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 card-shadow print:p-0">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Printable Voucher Sheet</h2>
              <p className="text-xs text-slate-500">Batch Reference: {generatedBatch.reference}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sheet</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedBatch.cards.map((card: any, idx: number) => (
              <div key={idx} className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex justify-between items-center text-xs font-bold pb-2 border-b border-slate-200">
                  <span className="text-blue-700">{card.businessName}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px]">₦{card.denomination}</span>
                </div>
                <div className="text-center py-3">
                  <span className="text-[10px] text-slate-400 block font-mono">PIN CODE:</span>
                  <span className="text-xl font-black text-slate-900 tracking-wider font-mono">{card.pin}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                  <span>Serial: {card.serialNumber}</span>
                  <span className="font-bold text-blue-600">{card.loadCode}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
