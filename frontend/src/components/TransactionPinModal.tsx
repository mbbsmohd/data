import React, { useState } from 'react';
import { Lock, X, Delete, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface TransactionPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  amount?: number;
  recipient?: string;
  serviceName?: string;
}

export const TransactionPinModal: React.FC<TransactionPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Authorize Transaction',
  amount,
  recipient,
  serviceName,
}) => {
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage('');
      if (nextPin.length === 4) {
        verifyAndSubmit(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  const verifyAndSubmit = async (fullPin: string) => {
    try {
      setLoading(true);
      setErrorMessage('');
      await api.verifyPin(fullPin);
      setLoading(false);
      setPin('');
      onSuccess();
    } catch (err: any) {
      setLoading(false);
      setPin('');
      setErrorMessage(err.message || 'Incorrect Transaction PIN. Default is 1234.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1 mb-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 font-medium">Enter your 4-digit PIN to authorize payment</p>
        </div>

        {/* Transaction Summary Card */}
        {(amount !== undefined || recipient) && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-5 space-y-1.5 text-xs">
            {serviceName && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Service:</span>
                <span className="font-bold text-slate-900">{serviceName}</span>
              </div>
            )}
            {recipient && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Recipient:</span>
                <span className="font-mono font-bold text-slate-900">{recipient}</span>
              </div>
            )}
            {amount !== undefined && (
              <div className="flex justify-between border-t border-slate-200/70 pt-1.5">
                <span className="text-slate-500 font-semibold">Total Debit:</span>
                <span className="font-extrabold text-blue-700 font-mono text-sm">
                  ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 4 PIN Dots */}
        <div className="flex justify-center items-center space-x-4 mb-4">
          {[0, 1, 2, 3].map(index => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-blue-600 scale-110 shadow-sm shadow-blue-400'
                    : 'bg-slate-200 border-2 border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {errorMessage && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center space-x-1.5 justify-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mb-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={loading || pin.length >= 4}
              className="h-13 bg-slate-50 hover:bg-slate-100 active:bg-blue-50 active:scale-95 text-slate-800 font-bold text-xl rounded-2xl transition border border-slate-100 shadow-sm flex items-center justify-center disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={loading || pin.length === 0}
            className="h-13 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-2xl transition border border-slate-100 flex items-center justify-center disabled:opacity-40"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            disabled={loading || pin.length >= 4}
            className="h-13 bg-slate-50 hover:bg-slate-100 active:bg-blue-50 active:scale-95 text-slate-800 font-bold text-xl rounded-2xl transition border border-slate-100 shadow-sm flex items-center justify-center disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || pin.length === 0}
            className="h-13 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold rounded-2xl transition border border-slate-100 flex items-center justify-center disabled:opacity-40"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center pt-2">
          <span className="text-[11px] text-slate-400 font-medium flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Default PIN is 1234 (Change anytime in Security Settings)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
