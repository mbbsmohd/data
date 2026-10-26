import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  isLoading?: boolean;
  loadingText?: string;
  preventDoubleClick?: boolean;
  icon?: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  loadingText,
  preventDoubleClick = true,
  disabled,
  onClick,
  icon,
  className = '',
  ...props
}) => {
  const [internalBusy, setInternalBusy] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || internalBusy || disabled) return;

    if (preventDoubleClick) {
      setInternalBusy(true);
      try {
        if (onClick) {
          await onClick(e);
        }
      } finally {
        setTimeout(() => setInternalBusy(false), 400); // 400ms cooldown to block rapid multi-clicks
      }
    } else if (onClick) {
      onClick(e);
    }
  };

  const isBusy = isLoading || internalBusy;

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-500/20 border border-blue-600',
    secondary: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-500/20 border border-emerald-600',
    danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md shadow-rose-500/20 border border-rose-600',
    outline: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm',
    ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600'
  };

  return (
    <button
      {...props}
      disabled={disabled || isBusy}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center font-medium rounded-xl px-4 py-2.5 text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none ${variantStyles[variant]} ${className}`}
    >
      {isBusy && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
      )}
      {!isBusy && icon && (
        <span className="mr-2 inline-flex items-center">{icon}</span>
      )}
      <span>{isBusy && loadingText ? loadingText : children}</span>
    </button>
  );
};
