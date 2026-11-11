import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Memuat data...',
  size = 'md',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-6 gap-3 text-slate-600">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-emerald-600`} />
      {message && <p className="text-sm font-medium text-slate-700 animate-pulse">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        id="fullscreen-loader"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      >
        <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
