import React, { useState, useEffect } from 'react';
import { Repeat, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Copy, Clock } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';

export const AirtimeToCashPage: React.FC<{ onBack: () => void; onRefreshUser: () => void }> = ({ onBack, onRefreshUser }) => {
  const [network, setNetwork] = useState('MTN');
  const [senderPhone, setSenderPhone] = useState('09131797675');
  const [airtimeAmount, setAirtimeAmount] = useState(2000);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const ratePercent = 85; // 85% cash rate
  const cashValue = Math.round(airtimeAmount * (ratePercent / 100));
  const designatedReceiver = '09131797675';

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await api.getMyAirtimeToCashOrders();
      if (res.success) setOrders(res.orders);
    } catch {
      // Fallback
    }
  };

  const handleCopyReceiver = () => {
    navigator.clipboard.writeText(designatedReceiver);
    Swal.fire({
      icon: 'success',
      title: 'Copied to Clipboard',
      text: `Designated receiver number: ${designatedReceiver}`,
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (airtimeAmount < 500) {
      Swal.fire({ icon: 'warning', title: 'Minimum Amount', text: 'Minimum airtime conversion amount is ₦500.' });
      return;
    }

    try {
      setLoading(true);
      const res = await api.submitAirtimeToCash({
        network,
        senderPhone,
        airtimeAmount
      });

      Swal.fire({
        icon: 'success',
        title: 'Order Created!',
        html: `
          <div style="text-align: left; font-size: 13px;">
            <p><strong>Order Reference:</strong> ${res.order.reference}</p>
            <p><strong>Amount to Transfer:</strong> ₦${airtimeAmount.toLocaleString()}</p>
            <p><strong>You Will Receive:</strong> <span style="color:#059669; font-weight:bold;">₦${cashValue.toLocaleString()}</span></p>
            <div style="background:#EFF6FF; padding:10px; border-radius:8px; margin:10px 0;">
              <p style="font-weight:bold; color:#1D4ED8;">Transfer Instructions:</p>
              <p>Transfer ₦${airtimeAmount} ${network} airtime from <strong>${senderPhone}</strong> to:</p>
              <p style="font-size:16px; font-weight:bold; color:#0F172A;">${res.order.designatedReceiverPhone}</p>
              <p style="font-size:11px; color:#64748B; margin-top:4px;">USSD Code: *321*${res.order.designatedReceiverPhone}*${airtimeAmount}*PIN#</p>
            </div>
            <p style="font-size:11px; color:#64748B;">Once the airtime transfer is received by our SIM host, your wallet will be credited automatically.</p>
          </div>
        `,
        confirmButtonColor: '#1E5BF9'
      });

      loadOrders();
      onRefreshUser();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Order Failed', text: err.message });
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
            Airtime to Cash Converter
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Convert airtime from your SIM card into cash at 85% instant payout rate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Converter Form */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 card-shadow">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Network */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                Select Network
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['MTN', 'AIRTEL', 'GLO', '9MOBILE'].map(net => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setNetwork(net)}
                    className={`py-3 rounded-2xl border font-bold text-xs transition flex flex-col items-center justify-center space-y-1 ${
                      network === net
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{net}</span>
                    <span className="text-[10px] font-bold text-emerald-600">85% Rate</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sender Phone */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Your Phone Number (Sending From)
              </label>
              <input
                type="text"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="w-full text-base font-bold border border-slate-200 rounded-2xl p-3.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="09131797675"
              />
            </div>

            {/* Airtime Amount */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Airtime Amount to Convert (₦)
              </label>
              <input
                type="number"
                value={airtimeAmount}
                onChange={(e) => setAirtimeAmount(Number(e.target.value))}
                min="500"
                step="100"
                className="w-full text-2xl font-black border border-slate-200 rounded-2xl p-3.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>

            {/* Payout Calculation Card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-bold">You Will Receive in Wallet</span>
                <div className="text-2xl font-black text-emerald-900">₦{cashValue.toLocaleString()}</div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Instant credit upon airtime confirmation</div>
              </div>
              <div className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl">
                85% Cash Value
              </div>
            </div>

            {/* Designated receiver line */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold">Designated Telecom Receiver SIM:</span>
                <div className="text-base font-black text-slate-900">{designatedReceiver}</div>
              </div>
              <button
                type="button"
                onClick={handleCopyReceiver}
                className="bg-white border border-slate-200 p-2 rounded-xl text-slate-700 hover:bg-slate-100 flex items-center space-x-1 text-xs font-bold"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white font-extrabold text-sm py-4 rounded-2xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Submitting Order...' : `Proceed with ₦${airtimeAmount.toLocaleString()} Conversion`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* History & Tips */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 card-shadow">
            <h3 className="font-extrabold text-sm text-slate-900 mb-3">Conversion History</h3>
            {orders.length === 0 ? (
              <p className="text-xs text-slate-400">No previous conversions yet</p>
            ) : (
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex justify-between font-bold">
                      <span>{o.network} ₦{o.airtime_amount}</span>
                      <span className="text-emerald-700">+₦{o.cash_value}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>{o.reference}</span>
                      <span className="font-bold text-slate-600">{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
