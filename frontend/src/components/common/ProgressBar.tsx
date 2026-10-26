import React, { useEffect, useState } from 'react';
import { globalLoading } from '../../utils/loadingManager';

export const TopProgressBar: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = globalLoading.subscribe((isLoading, currentProgress) => {
      setLoading(isLoading || currentProgress > 0);
      setProgress(currentProgress);
    });
    return unsubscribe;
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3px] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 shadow-md shadow-blue-500/50 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: 'width, opacity',
          transitionDuration: progress === 100 ? '400ms' : '200ms'
        }}
      />
    </div>
  );
};
