import React, { useRef, useState } from 'react';
import {
  CheckCircle2, AlertTriangle, RefreshCw, X, Download, Printer,
  Share2, Copy, Check, ShieldCheck, Zap, ArrowDownLeft, Building2,
  Calendar, CreditCard, Hash, User, QrCode
} from 'lucide-react';

export interface ReceiptData {
  reference: string;
  category: string;
  serviceName?: string;
  billerOrNetwork?: string;
  recipient?: string;
  amount: number;
  status: 'SUCCESSFUL' | 'FAILED' | 'REFUNDED' | 'PENDING' | string;
  date: string;
  balanceBefore?: number;
  balanceAfter?: number;
  discount?: number;
  token?: string; // e.g. electricity token or e-pin
  units?: string;
  paymentMethod?: string;
  customerName?: string;
}

export const TransactionReceiptModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
  appName?: string;
  supportPhone?: string;
  supportEmail?: string;
}> = ({
  isOpen,
  onClose,
  receipt,
  appName = 'Bukar Data Sub',
  supportPhone = '09131797675',
  supportEmail = 'support@bukardatasub.com'
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  if (!isOpen || !receipt) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(receipt.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `🧾 ${appName} Transaction Receipt\nRef: ${receipt.reference}\nAmount: ₦${receipt.amount.toLocaleString('en-NG')}\nService: ${receipt.serviceName || receipt.billerOrNetwork || receipt.category}\nStatus: ${receipt.status}\nDate: ${receipt.date}`;
    if (navigator.share) {
      navigator.share({
        title: `${appName} Receipt`,
        text: text
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const isSuccess = receipt.status === 'SUCCESSFUL' || receipt.status === 'COMPLETED';
  const isRefunded = receipt.status === 'REFUNDED';
  const isPending = receipt.status === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg my-auto">
        {/* Close Button Floating */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:-right-4 text-white hover:text-slate-300 p-2 rounded-full bg-slate-900/60 backdrop-blur transition"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Printable Receipt Card */}
        <div
          ref={receiptRef}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col print:shadow-none print:border-none print:m-0"
        >
          {/* Top Decorative Header with Animated Gradient & Security Watermark */}
          <div className="relative bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-7 text-center overflow-hidden">
            {/* Background glowing decorations */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              {/* Brand Logo & Name */}
              <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase mb-3 border border-white/20">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Verified Transaction Receipt</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{appName}</h2>
              <p className="text-xs text-blue-100 font-medium">Telecom, Utilities & Automated FinTech Payouts</p>

              {/* Status Icon with Animated Pulse */}
              <div className="mt-4 mb-2 relative">
                {isSuccess && (
                  <div className="w-16 h-16 rounded-full bg-emerald-500/30 flex items-center justify-center ring-8 ring-emerald-500/20 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  </div>
                )}
                {isRefunded && (
                  <div className="w-16 h-16 rounded-full bg-purple-500/30 flex items-center justify-center ring-8 ring-purple-500/20">
                    <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                      <RefreshCw className="w-7 h-7" />
                    </div>
                  </div>
                )}
                {isPending && (
                  <div className="w-16 h-16 rounded-full bg-amber-500/30 flex items-center justify-center ring-8 ring-amber-500/20 animate-spin">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
                      <RefreshCw className="w-7 h-7" />
                    </div>
                  </div>
                )}
                {!isSuccess && !isRefunded && !isPending && (
                  <div className="w-16 h-16 rounded-full bg-rose-500/30 flex items-center justify-center ring-8 ring-rose-500/20">
                    <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                  </div>
                )}
              </div>

              {/* Amount Display */}
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-1">
                ₦{receipt.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>

              <div className="mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    isSuccess
                      ? 'bg-emerald-400/25 text-emerald-100 border border-emerald-300/40'
                      : isRefunded
                      ? 'bg-purple-400/25 text-purple-100 border border-purple-300/40'
                      : isPending
                      ? 'bg-amber-400/25 text-amber-100 border border-amber-300/40'
                      : 'bg-rose-400/25 text-rose-100 border border-rose-300/40'
                  }`}
                >
                  ● {receipt.status}
                </span>
              </div>
            </div>
          </div>

          {/* Jagged / Perforated Receipt Cut Line */}
          <div className="h-4 bg-white relative flex items-center justify-between px-2 overflow-hidden border-b border-dashed border-slate-200">
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-slate-100 -mt-2 inline-block" />
            ))}
          </div>

          {/* Receipt Body & Details */}
          <div className="p-6 sm:p-7 space-y-4 text-xs sm:text-sm">
            {/* Electricity Token or Recharge PIN Highlight Box */}
            {receipt.token && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 p-4 rounded-2xl text-center space-y-1">
                <span className="text-[11px] font-extrabold uppercase text-amber-800 tracking-wider flex items-center justify-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Purchased Token / PIN</span>
                </span>
                <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 tracking-wider select-all">
                  {receipt.token}
                </div>
                {receipt.units && (
                  <div className="text-xs text-slate-600 font-semibold">Units: {receipt.units}</div>
                )}
              </div>
            )}

            {/* Key-Value Breakdown Grid */}
            <div className="space-y-2.5 divide-y divide-slate-100">
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium">Service / Product</span>
                <span className="font-extrabold text-slate-900 text-right">
                  {receipt.serviceName || receipt.billerOrNetwork || receipt.category}
                </span>
              </div>

              {receipt.recipient && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Recipient / Destination</span>
                  <span className="font-mono font-bold text-slate-900 text-right">{receipt.recipient}</span>
                </div>
              )}

              {receipt.customerName && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Customer Name</span>
                  <span className="font-bold text-slate-900 text-right">{receipt.customerName}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium">Date & Time</span>
                <span className="font-semibold text-slate-800 text-right">{receipt.date}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium">Transaction Reference</span>
                <div className="flex items-center space-x-1.5">
                  <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[170px] sm:max-w-none">
                    {receipt.reference}
                  </span>
                  <button
                    onClick={handleCopyRef}
                    className="p-1 hover:bg-slate-100 rounded text-blue-600 transition"
                    title="Copy Reference"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium">Payment Method</span>
                <span className="font-bold text-slate-800 text-right">
                  {receipt.paymentMethod || 'Authoritative In-App Wallet'}
                </span>
              </div>

              {receipt.balanceBefore !== undefined && receipt.balanceAfter !== undefined && (
                <div className="grid grid-cols-2 gap-2 pt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block">Balance Before:</span>
                    <strong className="font-mono text-slate-800">
                      ₦{receipt.balanceBefore.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block">Balance After:</span>
                    <strong className="font-mono text-blue-700">
                      ₦{receipt.balanceAfter.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* QR Code and Authenticity Stamp */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider">
                    Authoritative Record
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Secured by {appName} Double-Entry Ledger
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-400">
                <div>Support: {supportPhone}</div>
                <div>{supportEmail}</div>
              </div>
            </div>
          </div>

          {/* Action Bar (Print / Share / Download) */}
          <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs py-3 px-3 rounded-2xl border border-slate-200 transition flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={handleShare}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-3 rounded-2xl transition flex items-center justify-center space-x-1.5 shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>{shared ? 'Copied Details!' : 'Share / Save'}</span>
            </button>

            <button
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs py-3 px-4 rounded-2xl transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
