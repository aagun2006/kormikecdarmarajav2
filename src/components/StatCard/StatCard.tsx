import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatNumberIndo } from '../../utils/formatters';

interface StatCardProps {
  id?: string;
  title: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  subtitle?: string;
  colorScheme?: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'teal';
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  unit,
  icon: Icon,
  subtitle,
  colorScheme = 'emerald',
}) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      borderAccent: 'border-l-emerald-500',
      iconBg: 'bg-emerald-500 text-white',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      borderAccent: 'border-l-blue-500',
      iconBg: 'bg-blue-500 text-white',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      borderAccent: 'border-l-amber-500',
      iconBg: 'bg-amber-500 text-white',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600 border-purple-100',
      borderAccent: 'border-l-purple-500',
      iconBg: 'bg-purple-500 text-white',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      borderAccent: 'border-l-rose-500',
      iconBg: 'bg-rose-500 text-white',
    },
    teal: {
      bg: 'bg-teal-50 text-teal-600 border-teal-100',
      borderAccent: 'border-l-teal-500',
      iconBg: 'bg-teal-500 text-white',
    },
  };

  const scheme = colorMap[colorScheme];
  const formattedValue = typeof value === 'number' ? formatNumberIndo(value) : value;

  return (
    <div
      id={id}
      className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formattedValue}
            </span>
            {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
