import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export type OperationState = 'idle' | 'processing' | 'confirming' | 'successful' | 'failed';

interface LoadingOverlayProps {
  state: OperationState;
  message?: string;
  submessage?: string;
  onCancel?: () => void;
  fullScreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  state,
  message,
  submessage,
  onCancel,
  fullScreen = false
}) => {
  if (state === 'idle') return null;

  const content = (
    <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full mx-4 flex flex-col items-center text-center animate-scale-in">
      <div className="mb-4">
        {state === 'processing' && (
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 animate-spin">
            <Loader2 className="w-7 h-7" />
          </div>
        )}
        {state === 'confirming' && (
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 animate-pulse">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        )}
        {state === 'successful' && (
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 animate-scale-in">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        )}
        {state === 'failed' && (
          <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 animate-scale-in">
            <XCircle className="w-8 h-8" />
          </div>
        )}
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-1">
        {message || (
          state === 'processing' ? 'Processing Operation...' :
          state === 'confirming' ? 'Confirming with Telecommunication Provider...' :
          state === 'successful' ? 'Transaction Completed' : 'Operation Failed'
        )}
      </h3>

      {submessage && (
        <p className="text-xs text-slate-500 mb-4 max-w-xs">{submessage}</p>
      )}

      {onCancel && (state === 'processing' || state === 'confirming') && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancel Request
        </button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9998] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-fade-in">
        {content}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-[2px] flex items-center justify-center rounded-2xl animate-fade-in">
      {content}
    </div>
  );
};
