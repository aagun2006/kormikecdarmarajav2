import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { SenamDesaTeraktifItem } from '../../types';
import { formatNumberIndo } from '../../utils/formatters';
import { Trophy, Award } from 'lucide-react';

interface SenamDesaTeraktifChartProps {
  data: SenamDesaTeraktifItem[];
  isLoading?: boolean;
}

export const SenamDesaTeraktifChart: React.FC<SenamDesaTeraktifChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
        <span className="text-xs text-slate-400 font-medium">Memuat peringkat desa teraktif...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl text-center p-6 border border-dashed border-slate-200">
        <Trophy className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-sm font-semibold text-slate-600">Belum ada data Senam Desa</p>
        <p className="text-xs text-slate-400 max-w-xs mt-0.5">
          Grafik ini khusus membandingkan keaktifan kegiatan berkategori &ldquo;Senam Desa&rdquo;.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: SenamDesaTeraktifItem = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 space-y-1">
          <p className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
            <Award className="w-4 h-4" /> Desa {item.namaDesa}
          </p>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Total Senam Desa:</span>
            <strong className="text-white">{item.totalKegiatan} Kali</strong>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Total Peserta:</span>
            <strong className="text-emerald-400">{formatNumberIndo(item.totalPeserta)} Warga</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Ranking Keaktifan: <strong className="text-slate-800">{data.length} Desa Terdata</strong>
        </span>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="namaDesa"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalKegiatan" radius={[8, 8, 0, 0]} maxBarSize={44}>
              {data.map((_, index) => {
                // Top 3 distinct gradient colors
                const color =
                  index === 0
                    ? '#f59e0b' // Gold / Amber for #1
                    : index === 1
                    ? '#0284c7' // Cyan/Blue for #2
                    : index === 2
                    ? '#10b981' // Emerald for #3
                    : '#64748b'; // Slate for others
                return <Cell key={`cell-desa-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
