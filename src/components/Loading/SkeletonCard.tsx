import React from 'react';

export const SkeletonCard: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-slate-200 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-100 rounded w-full"></div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonStatCards: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs animate-pulse">
          <div className="h-3 bg-slate-200 rounded w-2/3 mb-2"></div>
          <div className="h-7 bg-slate-300 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-slate-100 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
};
