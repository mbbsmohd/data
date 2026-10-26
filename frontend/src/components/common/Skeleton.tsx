import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'card' | 'stat' | 'table-row' | 'service-card' | 'chart';
  width?: string;
  height?: string;
  className?: string;
  columns?: number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height,
  className = '',
  columns = 5,
  count = 1
}) => {
  if (variant === 'stat') {
    return (
      <div className={`p-5 rounded-2xl bg-white border border-slate-100 shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-24 bg-slate-200 rounded animate-shimmer" />
          <div className="w-8 h-8 rounded-xl bg-slate-200 animate-shimmer" />
        </div>
        <div className="h-8 w-36 bg-slate-200 rounded-lg animate-shimmer mb-2" />
        <div className="h-3 w-20 bg-slate-100 rounded animate-shimmer" />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 animate-shimmer" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-1/3 bg-slate-200 rounded animate-shimmer" />
            <div className="h-3 w-1/4 bg-slate-100 rounded animate-shimmer" />
          </div>
        </div>
        <div className="h-20 bg-slate-100 rounded-xl animate-shimmer" />
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, rIdx) => (
          <div key={rIdx} className={`flex items-center space-x-4 p-4 bg-white border-b border-slate-100 ${className}`}>
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-slate-200 rounded animate-shimmer flex-1"
                style={{ width: `${Math.max(40, 100 - cIdx * 15)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'service-card') {
    return (
      <div className={`p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-3 ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-slate-200 animate-shimmer" />
        <div className="h-4 w-20 bg-slate-200 rounded animate-shimmer" />
        <div className="h-3 w-16 bg-slate-100 rounded animate-shimmer" />
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={`p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-slate-200 rounded animate-shimmer" />
          <div className="h-8 w-24 bg-slate-100 rounded-lg animate-shimmer" />
        </div>
        <div className="h-52 bg-slate-50 rounded-xl animate-shimmer flex items-end justify-between px-6 pb-4">
          <div className="w-8 h-20 bg-slate-200 rounded-t" />
          <div className="w-8 h-36 bg-slate-200 rounded-t" />
          <div className="w-8 h-28 bg-slate-200 rounded-t" />
          <div className="w-8 h-44 bg-slate-200 rounded-t" />
          <div className="w-8 h-32 bg-slate-200 rounded-t" />
        </div>
      </div>
    );
  }

  // Default 'text'
  return (
    <div
      className={`bg-slate-200 rounded animate-shimmer ${className}`}
      style={{ width, height: height || '16px' }}
    />
  );
};
