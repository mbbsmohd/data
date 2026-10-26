/**
 * ==============================================================================
 * BUKAR DATA SUB — ENTERPRISE TRANSACTION PROCESSING & STATUS FEEDBACK MODAL
 * ==============================================================================
 * Provides vector-based animated circular spinner, circular progress indicator,
 * live stage updates (Processing -> Confirming -> Success / Failed / Timeout),
 * idempotency protection, and clear recovery actions.
 */

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';

export type ProcessingStatus = 'IDLE' | 'PROCESSING' | 'CONFIRMING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';

export interface TransactionProcessingModalProps {
  isOpen: boolean;
  status: ProcessingStatus;
  title: string;
  description: string;
  reference?: string;
  amount?: number;
  currency?: string;
  progressPercent?: number; // If measurable (e.g., upload/export)
  errorMessage?: string;
  successActionLabel?: string;
  onSuccessAction?: () => void;
  onRetry?: () => void;
  onClose: () => void;
  timeoutSeconds?: number;
}

export const TransactionProcessingModal: React.FC<TransactionProcessingModalProps> = ({
  isOpen,
  status,
  title,
  description,
  reference,
  amount,
  currency = '₦',
  progressPercent,
  errorMessage,
  successActionLabel = 'Done',
  onSuccessAction,
  onRetry,
  onClose,
  timeoutSeconds = 35
}) => {
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Auto-track elapsed seconds during PROCESSING/CONFIRMING to detect timeout
  useEffect(() => {
    let timer: any = null;
    if (isOpen && (status === 'PROCESSING' || status === 'CONFIRMING')) {
      setElapsed(0);
      timer = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, status]);

  if (!isOpen || status === 'IDLE') return null;

  const handleCopyRef = () => {
    if (!reference) return;
    navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTimedOut = status === 'TIMEOUT' || (elapsed >= timeoutSeconds && (status === 'PROCESSING' || status === 'CONFIRMING'));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 text-center animate-scale-in overflow-hidden">
        {/* Subtle Top Ambient Gradient */}
        <div
          className={`absolute top-0 left-0 right-0 h-2 transition-colors duration-500 ${
            status === 'SUCCESS'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
              : status === 'FAILED'
              ? 'bg-gradient-to-r from-rose-500 to-red-600'
              : isTimedOut
              ? 'bg-gradient-to-r from-amber-500 to-orange-400'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}
        />

        {/* Close Button (Only active when finished or timed out to prevent aborted financial requests) */}
        {(status === 'SUCCESS' || status === 'FAILED' || isTimedOut) && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Central Vector Status Ring */}
        <div className="flex justify-center my-4">
          {status === 'SUCCESS' ? (
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-12 h-12 stroke-[2.2] animate-bounce-short" />
            </div>
          ) : status === 'FAILED' ? (
            <div className="w-20 h-20 rounded-full bg-rose-50 border-4 border-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
              <XCircle className="w-12 h-12 stroke-[2.2]" />
            </div>
          ) : isTimedOut ? (
            <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
              <Clock className="w-12 h-12 stroke-[2.2]" />
            </div>
          ) : (
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Animated Vector Circular Spinner */}
              <svg className="w-20 h-20 animate-spin text-blue-600" viewBox="0 0 50 50">
                <circle
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="transparent"
                  r="20"
                  cx="25"
                  cy="25"
                />
                <circle
                  className="text-blue-600"
                  strokeWidth="4"
                  strokeDasharray={progressPercent !== undefined ? '125.6' : '31.4 31.4'}
                  strokeDashoffset={
                    progressPercent !== undefined
                      ? 125.6 - (125.6 * progressPercent) / 100
                      : '0'
                  }
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="20"
                  cx="25"
                  cy="25"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-blue-700">
                {progressPercent !== undefined ? (
                  `${Math.round(progressPercent)}%`
                ) : (
                  <ShieldCheck className="w-6 h-6 text-blue-600/70" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Accessible Title */}
        <h3
          id="processing-modal-title"
          className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
        >
          {isTimedOut
            ? 'Awaiting Confirmation'
            : status === 'SUCCESS'
            ? 'Transaction Successful'
            : status === 'FAILED'
            ? 'Transaction Failed'
            : title}
        </h3>

        {/* Amount Display (if financial) */}
        {amount !== undefined && amount > 0 && (
          <div className="my-2 text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {currency}{amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}

        {/* Dynamic Description / Failure Explanation */}
        <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed max-w-sm mx-auto mt-2">
          {isTimedOut
            ? 'Your request was dispatched to the provider. We are reconciling the status. Check your transaction history before retrying to prevent double-spending.'
            : status === 'FAILED'
            ? errorMessage || description || 'The transaction could not be completed. Your wallet balance has been preserved.'
            : description}
        </p>

        {/* Transaction Reference Box */}
        {reference && (
          <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/90 flex items-center justify-between gap-2 text-left">
            <div className="min-w-0">
              <span className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Transaction Reference
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-800 truncate block">
                {reference}
              </span>
            </div>
            <button
              onClick={handleCopyRef}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-200"
              title="Copy Reference"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          {status === 'SUCCESS' ? (
            <button
              onClick={onSuccessAction || onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md transition active:scale-[0.98] flex items-center justify-center space-x-2 text-base"
            >
              <span>{successActionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : status === 'FAILED' ? (
            <div className="flex gap-2.5">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl transition active:scale-[0.98] flex items-center justify-center space-x-1.5 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-2xl transition active:scale-[0.98] text-sm"
              >
                Close
              </button>
            </div>
          ) : isTimedOut ? (
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-2xl transition active:scale-[0.98] text-sm"
              >
                I Understand, Check History
              </button>
            </div>
          ) : (
            <div className="py-2 text-xs font-semibold text-slate-400 flex items-center justify-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>Secured by Bukar Data Sub Double-Entry Ledger</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
