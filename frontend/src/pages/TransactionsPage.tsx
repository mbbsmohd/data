import React, { useState, useEffect } from 'react';
import {
  ListOrdered, Search, Filter, Download, Printer, Share2,
  CheckCircle2, Clock, XCircle, ArrowUpRight, ArrowDownLeft, X,
  ShieldCheck, FileText, RefreshCw, Calendar
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';

export const TransactionsPage: React.FC<{
  onBack: () => void;
  settings?: any;
}> = ({ onBack, settings = {} }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const appName = settings.app_name || 'ABK Data Link';

  useEffect(() => {
    fetchTransactions();
  }, [category, status]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.getTransactions({
        category: category !== 'all' ? category : undefined,
        status: status !== 'all' ? status : undefined,
        search: search.trim() || undefined,
        limit: 100
      });
      if (res.success) {
        setTransactions(res.transactions || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const printReceipt = () => {
    window.print();
  };

  const shareReceiptWhatsApp = (receipt: any) => {
    const text = `*${appName} Transaction Receipt*\nRef: ${receipt.reference}\nService: ${receipt.biller_or_network} ${receipt.service_category?.toUpperCase()}\nRecipient: ${receipt.recipient}\nAmount: ₦${receipt.charged_amount?.toLocaleString()}\nStatus: ${receipt.status}\nDate: ${new Date(receipt.created_at).toLocaleString()}${receipt.token_or_pin ? `\nToken/PIN: ${receipt.token_or_pin}` : ''}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <ListOrdered className="w-7 h-7 text-blue-600" />
            <span>Transaction Ledger & Receipts</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Searchable log of all authoritative VTU, bill payments, voucher prints, and wallet transactions
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by reference, recipient phone, or network..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Services</option>
              <option value="data">Data Bundles</option>
              <option value="airtime">Airtime</option>
              <option value="solar_pin">Solar PIN</option>
              <option value="cable">Cable TV</option>
              <option value="electricity">Electricity</option>
              <option value="exam_pin">Exam PIN</option>
              <option value="bulk_sms">Bulk SMS</option>
            </select>

            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition shadow-sm"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading transaction ledger...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Transactions Found</h4>
            <p className="text-xs text-slate-400">Transactions performed across the platform will appear here.</p>
          </div>
        ) : (
          <div>
            {/* Mobile Cards (Viewports < 768px) */}
            <div className="md:hidden divide-y divide-slate-100">
              {transactions.map(tx => (
                <div key={tx.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase mr-1">
                        {tx.biller_or_network}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {tx.service_category?.replace('_', ' ').toUpperCase()}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="font-bold font-mono text-sm text-slate-900">
                        ₦{tx.charged_amount ? tx.charged_amount.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : tx.amount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="mt-1">
                        {tx.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>SUCCESS</span>
                          </span>
                        ) : tx.status === 'PENDING' ? (
                          <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                            <XCircle className="w-3 h-3" />
                            <span>FAILED</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Recipient:</span>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">{tx.recipient}</span>
                    </div>
                    {tx.token_or_pin && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold">Token/PIN:</span>
                        <span className="font-mono font-black text-emerald-700 text-xs">{tx.token_or_pin}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[170px]" title={tx.reference}>
                      Ref: {tx.reference}
                    </span>
                    <button
                      onClick={() => setSelectedReceipt(tx)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-blue-200 transition inline-flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (Viewports >= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Recipient / Details</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                        <span className="block text-[10px] text-slate-400">
                          {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-extrabold mr-1.5 uppercase">
                          {tx.biller_or_network}
                        </span>
                        <span>{tx.service_category?.replace('_', ' ').toUpperCase()}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-800">
                        {tx.recipient}
                        {tx.token_or_pin && (
                          <span className="block text-[10px] text-emerald-600 font-bold truncate max-w-[140px]">
                            Token: {tx.token_or_pin}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {tx.reference}
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-slate-900">
                        ₦{tx.charged_amount ? tx.charged_amount.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : tx.amount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>SUCCESS</span>
                          </span>
                        ) : tx.status === 'PENDING' ? (
                          <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                            <XCircle className="w-3 h-3" />
                            <span>FAILED</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceipt(tx)}
                          className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-[11px] px-3 py-1.5 rounded-xl transition inline-flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Printable Digital Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-slate-100 print:shadow-none print:border-none print:w-full">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center space-y-1 border-b border-slate-100 pb-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-xl shadow-md">
                {appName.charAt(0)}
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{appName}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Official Transaction Receipt</p>
            </div>

            {/* Receipt Amount Big Display */}
            <div className="bg-blue-50/60 rounded-2xl p-4 text-center mb-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
                Amount Paid
              </span>
              <div className="text-3xl font-black font-mono text-blue-900">
                ₦{(selectedReceipt.charged_amount || selectedReceipt.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
              <div className="inline-flex items-center space-x-1 mt-2 text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                <CheckCircle2 className="w-3 h-3" />
                <span>DELIVERY CONFIRMED & AUDITED</span>
              </div>
            </div>

            {/* Receipt Key-Value Rows */}
            <div className="space-y-2 text-xs border-b border-slate-100 pb-4 mb-4 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Ref:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service Category:</span>
                <span className="font-bold text-slate-900 uppercase">{selectedReceipt.service_category?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Biller / Network:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.biller_or_network}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary / Number:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-800">{new Date(selectedReceipt.created_at).toLocaleString()}</span>
              </div>

              {selectedReceipt.token_or_pin && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">Delivered Token / Voucher PIN</span>
                  <span className="font-mono font-extrabold text-sm text-slate-900 tracking-wider select-all">
                    {selectedReceipt.token_or_pin}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons (Hidden when printing) */}
            <div className="flex gap-2 print:hidden">
              <button
                onClick={printReceipt}
                className="flex-1 bg-slate-900 hover:bg-black text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={() => shareReceiptWhatsApp(selectedReceipt)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
