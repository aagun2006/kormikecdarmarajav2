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
import { SenamTerbanyakItem } from '../../types';
import { formatNumberIndo } from '../../utils/formatters';
import { Activity } from 'lucide-react';

interface SenamTerbanyakChartProps {
  data: SenamTerbanyakItem[];
  isLoading?: boolean;
}

const BAR_COLORS = [
  '#059669', // Emerald 600
  '#2563eb', // Blue 600
  '#f97316', // Orange 500
  '#9333ea', // Purple 600
  '#0d9488', // Teal 600
  '#e11d48', // Rose 600
];

export const SenamTerbanyakChart: React.FC<SenamTerbanyakChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
        <span className="text-xs text-slate-400 font-medium">Memuat data grafik senam...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl text-center p-6 border border-dashed border-slate-200">
        <Activity className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-sm font-semibold text-slate-600">Belum ada data kegiatan</p>
        <p className="text-xs text-slate-400 max-w-xs mt-0.5">
          Data grafik akan muncul saat ada laporan kegiatan senam pada periode ini.
        </p>
      </div>
    );
  }

  const totalKegiatan = data.reduce((acc, curr) => acc + curr.jumlahKegiatan, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: SenamTerbanyakItem = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 space-y-1">
          <p className="font-bold text-emerald-400 text-sm">{item.jenisSenam}</p>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Jumlah Kegiatan:</span>
            <strong className="text-white">{item.jumlahKegiatan} kali</strong>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Total Peserta:</span>
            <strong className="text-white">{formatNumberIndo(item.totalPeserta)} orang</strong>
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
          Total Kegiatan Periode: <strong className="text-slate-800">{totalKegiatan} Kali</strong>
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
              dataKey="jenisSenam"
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
            <Bar dataKey="jumlahKegiatan" radius={[8, 8, 0, 0]} maxBarSize={48}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
