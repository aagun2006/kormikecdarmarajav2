import React, { useEffect, useState } from 'react';
import {
  Activity,
  Users,
  MapPin,
  Calendar,
  Filter,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  Dumbbell,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import {
  DashboardFilter,
  DashboardStats,
  Desa,
  JenisSenam,
  LaporanSenam,
  SenamDesaTeraktifItem,
  SenamTerbanyakItem,
  UserSession,
} from '../../types';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard/StatCard';
import { SenamTerbanyakChart } from '../../components/Charts/SenamTerbanyakChart';
import { SenamDesaTeraktifChart } from '../../components/Charts/SenamDesaTeraktifChart';
import { SkeletonStatCards } from '../../components/Loading/SkeletonCard';
import { formatDateIndo, formatNumberIndo, getRoleBadge, getStatusAbsensiBadge } from '../../utils/formatters';
import { useToast } from '../../components/Toast/Toast';

interface DashboardPageProps {
  session?: UserSession | null;
  onOpenReportDetail: (report: LaporanSenam) => void;
  onNavigateToLaporan?: () => void;
  onOpenNewReport?: () => void;
  onOpenLogin?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  session,
  onOpenReportDetail,
  onNavigateToLaporan,
  onOpenNewReport,
  onOpenLogin,
}) => {
  const toast = useToast();
  const isPublic = !session;

  // Helper to get default current month start and end dates
const getDefaultDateRange = () => {
    const now = new Date();
    
    // Tambahkan ": Date" agar TypeScript tahu ini format tanggal
    const formatLokal = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    // Ambil tanggal 1 di bulan ini
    const dateFirstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const firstDay = formatLokal(dateFirstDay);
    const today = formatLokal(now);
    
    return { firstDay, today };
  };

  const { firstDay, today } = getDefaultDateRange();

  const [filter, setFilter] = useState<DashboardFilter>({
    tanggalMulai: firstDay,
    tanggalAkhir: today,
    jenisSenam: '',
    idDesa: '',
  });

  const [activeFilterDisplay, setActiveFilterDisplay] = useState<DashboardFilter>({
    tanggalMulai: firstDay,
    tanggalAkhir: today,
    jenisSenam: '',
    idDesa: '',
  });

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [senamTerbanyak, setSenamTerbanyak] = useState<SenamTerbanyakItem[]>([]);
  const [senamTeraktif, setSenamTeraktif] = useState<SenamDesaTeraktifItem[]>([]);
  const [recentReports, setRecentReports] = useState<LaporanSenam[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);
  const [jenisSenamList, setJenisSenamList] = useState<JenisSenam[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const roleBadge = session ? getRoleBadge(session.role) : null;

  const fetchDashboardData = async (currentFilter: DashboardFilter) => {
    try {
      setIsRefreshing(true);
      const [statsRes, terbanyakRes, teraktifRes, laporanRes, desaRes, jsRes] = await Promise.all([
        api.getDashboardStats(currentFilter),
        api.getSenamTerbanyak(currentFilter),
        api.getSenamTeraktif(currentFilter),
        api.getLaporan({ ...currentFilter }),
        api.getDesa(),
        api.getJenisSenam(),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (terbanyakRes.success && terbanyakRes.data) setSenamTerbanyak(terbanyakRes.data);
      if (teraktifRes.success && teraktifRes.data) setSenamTeraktif(teraktifRes.data);
      if (laporanRes.success && laporanRes.data) {
        // Take top 10 most recent
        setRecentReports(laporanRes.data.slice(0, 10));
      }
      if (desaRes.success && desaRes.data) setDesaList(desaRes.data);
      if (jsRes.success && jsRes.data) setJenisSenamList(jsRes.data);
    } catch (err) {
      toast.error('Gagal memuat sebagian data dashboard.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(filter);
  }, []);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilterDisplay({ ...filter });
    fetchDashboardData(filter);
    toast.info('Filter dashboard diterapkan.');
  };

  const handleResetFilter = () => {
    const { firstDay: f, today: t } = getDefaultDateRange();
    const reset = {
      tanggalMulai: f,
      tanggalAkhir: t,
      jenisSenam: '',
      idDesa: '',
    };
    setFilter(reset);
    setActiveFilterDisplay(reset);
    fetchDashboardData(reset);
    toast.info('Filter dikembalikan ke bulan berjalan.');
  };

  return (
    <div id="dashboard-page" className="space-y-6">
      {/* 1. Header Greeting Section (Public vs Logged In) */}
      <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> KORMI Kecamatan Darmaraja
              </span>
              {roleBadge ? (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-white/20 text-emerald-100 border border-white/20">
                  Akses Terbuka Publik
                </span>
              )}
            </div>

            {session ? (
              <>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Selamat datang, {session.nama}!
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                  Pantau dokumentasi, kehadiran kader, dan perkembangan kebugaran senam warga di{' '}
                  {session.namaDesa ? `Desa ${session.namaDesa}` : 'seluruh wilayah Kecamatan Darmaraja'}.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Dashboard Monitoring Senam
                </h2>
                <p className="text-slate-200 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                  Informasi rekapitulasi kegiatan senam kebugaran, absensi kader, dan partisipasi warga di 12 Desa Kecamatan Darmaraja secara transparan dan terintegrasi.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="dashboard-refresh-btn"
              type="button"
              onClick={() => {
                fetchDashboardData(filter);
                toast.success('Data dashboard disinkronkan langsung dari database.');
              }}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-semibold text-xs sm:text-sm rounded-xl border border-white/20 transition-all flex items-center gap-2 disabled:opacity-50"
              title="Segarkan Data Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Segarkan Data</span>
            </button>

            {session ? (
              onOpenNewReport && (
                <button
                  id="dashboard-new-laporan-btn"
                  onClick={onOpenNewReport}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>Input Laporan Baru</span>
                </button>
              )
            ) : (
              onOpenLogin && (
                <button
                  id="dashboard-login-btn"
                  onClick={onOpenLogin}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Masuk Akun Pengurus / Kader</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 2. Stat Cards Grid (6 cards) */}
      {isLoading ? (
        <SkeletonStatCards />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            id="stat-total-kegiatan"
            title="Total Kegiatan"
            value={stats?.totalKegiatan ?? 0}
            unit="Kali"
            icon={Activity}
            colorScheme="emerald"
            subtitle="Seluruh Periode"
          />
          <StatCard
            id="stat-total-peserta"
            title="Total Peserta"
            value={stats?.totalPeserta ?? 0}
            unit="Orang"
            icon={Users}
            colorScheme="blue"
            subtitle="Warga Berolahraga"
          />
          <StatCard
            id="stat-total-desa"
            title="Total Desa"
            value={stats?.totalDesa ?? 12}
            unit="Desa"
            icon={MapPin}
            colorScheme="purple"
            subtitle="Kec. Darmaraja"
          />
          <StatCard
            id="stat-total-kader"
            title="Total Kader"
            value={stats?.totalKader ?? 0}
            unit="Kader"
            icon={Award}
            colorScheme="amber"
            subtitle="Kader Aktif"
          />
          <StatCard
            id="stat-kegiatan-bulan-ini"
            title="Kegiatan Bulan Ini"
            value={stats?.kegiatanBulanIni ?? 0}
            unit="Kali"
            icon={Calendar}
            colorScheme="teal"
            subtitle="Bulan Berjalan"
          />
          <StatCard
            id="stat-peserta-bulan-ini"
            title="Peserta Bulan Ini"
            value={stats?.pesertaBulanIni ?? 0}
            unit="Orang"
            icon={TrendingUp}
            colorScheme="rose"
            subtitle="Bulan Berjalan"
          />
        </div>
      )}

      {/* 3. Filter Dashboard Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Filter Analisis & Grafik</h3>
              <p className="text-xs text-slate-500">
                Sesuaikan range tanggal, jenis senam, atau desa untuk memperbarui visualisasi data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Periode Aktif:{' '}
              <strong className="text-slate-700 font-semibold">
                {formatDateIndo(activeFilterDisplay.tanggalMulai)} s/d{' '}
                {formatDateIndo(activeFilterDisplay.tanggalAkhir)}
              </strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Tanggal Mulai */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Tanggal Mulai
            </label>
            <input
              id="filter-tanggal-mulai"
              type="date"
              value={filter.tanggalMulai}
              onChange={(e) => setFilter({ ...filter, tanggalMulai: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Tanggal Akhir */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Tanggal Akhir
            </label>
            <input
              id="filter-tanggal-akhir"
              type="date"
              value={filter.tanggalAkhir}
              onChange={(e) => setFilter({ ...filter, tanggalAkhir: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Jenis Senam */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Jenis Senam
            </label>
            <select
              id="filter-jenis-senam"
              value={filter.jenisSenam}
              onChange={(e) => setFilter({ ...filter, jenisSenam: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Semua Jenis Senam</option>
              {jenisSenamList.map((j) => (
                <option key={j.idJenis} value={j.namaJenis}>
                  {j.namaJenis}
                </option>
              ))}
            </select>
          </div>

          {/* Desa */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Desa
            </label>
            <select
              id="filter-desa"
              value={filter.idDesa}
              onChange={(e) => setFilter({ ...filter, idDesa: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Semua Desa</option>
              {desaList.map((d) => (
                <option key={d.idDesa} value={d.idDesa}>
                  {d.namaDesa}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              id="filter-apply-btn"
              type="submit"
              disabled={isRefreshing}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Terapkan</span>
            </button>
            <button
              id="filter-reset-btn"
              type="button"
              onClick={handleResetFilter}
              disabled={isRefreshing}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              title="Reset ke bulan berjalan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4 & 5. Charts Grid: Senam Terbanyak & Senam Desa Teraktif */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Senam Terbanyak */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Senam Terbanyak</h3>
                <p className="text-xs text-slate-400">Jumlah kegiatan menurut jenis senam</p>
              </div>
            </div>
          </div>
          <SenamTerbanyakChart data={senamTerbanyak} isLoading={isLoading} />
        </div>

        {/* Chart 2: Senam Desa Teraktif */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Senam Desa Teraktif</h3>
                <p className="text-xs text-slate-400">Ranking keaktifan khusus kategori &ldquo;Senam Desa&rdquo;</p>
              </div>
            </div>
          </div>
          <SenamDesaTeraktifChart data={senamTeraktif} isLoading={isLoading} />
        </div>
      </div>

      {/* 6. 10 Laporan Terakhir Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">10 Laporan Terakhir</h3>
              <p className="text-xs text-slate-400">Dokumentasi kegiatan senam terkini (terbaru ke terlama)</p>
            </div>
          </div>

          <button
            id="dashboard-view-all-laporan-btn"
            onClick={onNavigateToLaporan}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <span>Lihat Semua Laporan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentReports.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Belum ada laporan kegiatan senam pada periode ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {recentReports.map((item) => {
              const statusBadge = getStatusAbsensiBadge(item.statusAbsensi);
              return (
                <div
                  key={item.idLaporan}
                  id={`recent-report-${item.idLaporan}`}
                  onClick={() => onOpenReportDetail(item)}
                  className="group bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 hover:border-emerald-300 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md flex flex-col"
                >
                  {/* Photo thumbnail */}
                  <div className="relative h-32 bg-slate-800 overflow-hidden">
                    {item.fotoUrl ? (
                      <img
                        src={item.fotoUrl}
                        alt={item.captionFoto || item.jenisSenam}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-1 bg-slate-100">
                        <Activity className="w-6 h-6 text-slate-300" />
                        <span>Tanpa Foto</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-xs ${statusBadge.bg} ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-1 rounded-md">
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>{formatDateIndo(item.tanggal)}</span>
                        <strong className="text-slate-700 font-semibold">{item.jumlahPeserta} Peserta</strong>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {item.jenisSenam}
                      </h4>
                      <p className="text-[11px] font-medium text-emerald-600 mt-0.5">
                        Desa {item.namaDesa}
                      </p>
                      {item.captionFoto && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 italic mt-1">
                          &ldquo;{item.captionFoto}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate">Kader: {item.namaKader}</span>
                      <span className="text-emerald-600 font-semibold">Detail →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
