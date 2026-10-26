import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, ArrowRight, Upload, Users } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';

export const BulkSMSPage: React.FC<{ onBack: () => void; onRefreshUser: () => void }> = ({ onBack, onRefreshUser }) => {
  const [senderId, setSenderId] = useState('BUKAR-DATA');
  const [recipientsText, setRecipientsText] = useState('09131797675, 08023456789, 08051234567');
  const [message, setMessage] = useState('Dear customer, your data plan is now active. Thank you for choosing Bukar Data Sub!');
  const [loading, setLoading] = useState(false);

  const recipientList = recipientsText
    .split(/[,\n]/)
    .map(p => p.trim())
    .filter(p => p.length >= 10);

  const charCount = message.length;
  const pages = Math.ceil(charCount / 160) || 1;
  const ratePerPage = 3.50;
  const totalCost = recipientList.length * pages * ratePerPage;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recipientList.length === 0) {
      Swal.fire({ icon: 'warning', title: 'No Recipients', text: 'Enter at least one valid 11-digit phone number' });
      return;
    }

    try {
      setLoading(true);
      const res = await api.sendBulkSMS({
        senderId,
        recipients: recipientList,
        message
      });

      Swal.fire({
        icon: 'success',
        title: 'Bulk SMS Dispatched!',
        html: `
          <div style="text-align: left; font-size: 13px;">
            <p><strong>Sender ID:</strong> ${senderId}</p>
            <p><strong>Recipients:</strong> ${res.recipientCount} numbers</p>
            <p><strong>Pages per Recipient:</strong> ${res.pages} page(s)</p>
            <p><strong>Total Cost Charged:</strong> ₦${res.totalCost.toFixed(2)}</p>
            <p><strong>Status:</strong> <span style="color:#059669; font-weight:bold;">${res.status}</span></p>
          </div>
        `,
        confirmButtonColor: '#1E5BF9'
      });
      onRefreshUser();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Dispatch Failed', text: err.message });
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
            Bulk SMS Messaging Portal
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            High-priority corporate SMS route delivering to all networks including active DND numbers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 card-shadow">
          <form onSubmit={handleSend} className="space-y-5">
            {/* Sender ID */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                1. Sender ID (Max 11 Alphanumeric Characters)
              </label>
              <input
                type="text"
                maxLength={11}
                value={senderId}
                onChange={(e) => setSenderId(e.target.value.toUpperCase())}
                placeholder="e.g. BUKAR-DATA"
                className="w-full text-base font-bold border border-slate-200 rounded-2xl p-3.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Recipients */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  2. Recipient Phone Numbers
                </label>
                <span className="text-xs font-bold text-blue-600">
                  {recipientList.length} Valid Number(s)
                </span>
              </div>
              <textarea
                rows={4}
                value={recipientsText}
                onChange={(e) => setRecipientsText(e.target.value)}
                placeholder="Enter numbers separated by comma or new line e.g. 09131797675, 08023456789..."
                className="w-full text-sm font-medium border border-slate-200 rounded-2xl p-3.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Message composer */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  3. SMS Message Content
                </label>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {charCount} chars | {pages} page(s)
                </span>
              </div>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-sm font-medium border border-slate-200 rounded-2xl p-3.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Cost calculation */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Estimated Cost (₦3.50 / Page):</span>
                <div className="text-2xl font-black text-slate-900">₦{totalCost.toFixed(2)}</div>
              </div>
              <div className="text-right text-xs text-blue-600 font-bold">
                {recipientList.length} numbers × {pages} page(s)
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-extrabold text-sm py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>{loading ? 'Transmitting SMS Campaign...' : `Broadcast SMS (₦${totalCost.toFixed(2)})`}</span>
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 card-shadow text-xs text-slate-600">
            <h3 className="font-extrabold text-sm text-slate-900 mb-2">Corporate Route Benefits</h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Direct telecom interconnect.</li>
              <li>100% delivery to DND enabled numbers.</li>
              <li>Instant delivery reports (DLR).</li>
              <li>Clean alphanumeric branding.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
