import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Calendar,
  Activity,
  MapPin,
  Users,
  Image as ImageIcon,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import {
  Desa,
  JenisSenam,
  LaporanSenam,
  StatusAbsensi,
  User,
  UserSession,
} from '../../types';
import { api } from '../../services/api';
import { DataTable, Column } from '../../components/DataTable/DataTable';
import { formatDateIndo, formatNumberIndo, getStatusAbsensiBadge } from '../../utils/formatters';
import { ConfirmModal } from '../../components/Modal/ConfirmModal';
import { LaporanFormModal } from './LaporanFormModal';
import { LaporanDetailModal } from './LaporanDetailModal';
import { PhotoLightboxModal } from '../../components/Modal/PhotoLightboxModal';
import { useToast } from '../../components/Toast/Toast';

interface LaporanListPageProps {
  session: UserSession;
  onOpenReportFormDirectly?: boolean;
}

export const LaporanListPage: React.FC<LaporanListPageProps> = ({ session }) => {
  const toast = useToast();
  const isKader = session.role === 'Kader';

  // Data states
  const [reports, setReports] = useState<LaporanSenam[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);
  const [jenisSenamList, setJenisSenamList] = useState<JenisSenam[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterDesa, setFilterDesa] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reportToEdit, setReportToEdit] = useState<LaporanSenam | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<LaporanSenam | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<LaporanSenam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string | undefined>();

  const fetchAllData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      const [lapRes, desaRes, jsRes] = await Promise.all([
        api.getLaporan({ onlyMine: isKader }),
        api.getDesa(),
        api.getJenisSenam(),
      ]);

      if (lapRes.success && lapRes.data) setReports(lapRes.data);
      if (desaRes.success && desaRes.data) setDesaList(desaRes.data);
      if (jsRes.success && jsRes.data) setJenisSenamList(jsRes.data);
      if (isManualRefresh) toast.success('Data laporan berhasil disinkronkan.');
    } catch (err) {
      toast.error('Gagal memuat daftar laporan.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [session.idUser, isKader]);

  // Filtered dataset
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      if (filterDesa && item.idDesa !== filterDesa) return false;
      if (filterJenis && item.jenisSenam !== filterJenis) return false;
      if (filterStatus && item.statusAbsensi !== filterStatus) return false;
      if (filterDateStart && new Date(item.tanggal) < new Date(filterDateStart)) return false;
      if (filterDateEnd && new Date(item.tanggal) > new Date(filterDateEnd)) return false;
      return true;
    });
  }, [reports, filterDesa, filterJenis, filterStatus, filterDateStart, filterDateEnd]);

  // Search filter across desa, kader, jenis senam, caption
  const handleSearchFilter = (item: LaporanSenam, query: string) => {
    const q = query.toLowerCase();
    return (
      item.namaDesa.toLowerCase().includes(q) ||
      item.namaKader.toLowerCase().includes(q) ||
      item.jenisSenam.toLowerCase().includes(q) ||
      (item.captionFoto && item.captionFoto.toLowerCase().includes(q)) ||
      item.tanggal.includes(q)
    );
  };

  const handleResetFilters = () => {
    setFilterDateStart('');
    setFilterDateEnd('');
    setFilterDesa('');
    setFilterJenis('');
    setFilterStatus('');
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;
    const deletedId = reportToDelete.idLaporan;
    try {
      setIsDeleting(true);
      const res = await api.deleteLaporan(deletedId);
      if (res.success) {
        toast.success('Data berhasil dihapus.');
        setIsDeleteOpen(false);
        setReportToDelete(null);
        // Instant optimistic removal from UI
        setReports((prev) => prev.filter((item) => item.idLaporan !== deletedId));
        // Verify from database
        fetchAllData();
      } else {
        toast.error(res.message || 'Gagal menghapus laporan.');
      }
    } catch (err) {
      toast.error('Terjadi masalah saat menghapus data.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Table Columns Configuration
  const columns: Column<LaporanSenam>[] = [
    {
      header: 'No',
      className: 'w-12 text-center text-xs font-semibold text-slate-400',
      accessor: (row) => {
        const idx = filteredReports.findIndex((r) => r.idLaporan === row.idLaporan);
        return idx + 1;
      },
    },
    {
      header: 'Foto',
      className: 'w-16 text-center',
      accessor: (row) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (row.fotoUrl) {
              setLightboxUrl(row.fotoUrl);
              setLightboxCaption(row.captionFoto);
            }
          }}
          className={`w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center ${
            row.fotoUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
          }`}
        >
          {row.fotoUrl ? (
            <img
              src={row.fotoUrl}
              alt={row.captionFoto || row.jenisSenam}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-300" />
          )}
        </div>
      ),
    },
    {
      header: 'Tanggal',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs">{formatDateIndo(row.tanggal)}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.idLaporan}</span>
        </div>
      ),
    },
    {
      header: 'Desa',
      accessor: (row) => (
        <span className="font-bold text-emerald-800 text-xs">Desa {row.namaDesa}</span>
      ),
    },
    {
      header: 'Kader',
      accessor: (row) => (
        <span className="text-xs text-slate-700 font-medium">{row.namaKader}</span>
      ),
    },
    {
      header: 'Jenis Senam',
      accessor: (row) => (
        <span className="text-xs font-semibold text-slate-800">{row.jenisSenam}</span>
      ),
    },
    {
      header: 'Peserta',
      className: 'text-right',
      accessor: (row) => (
        <span className="text-xs font-bold text-slate-900">
          {formatNumberIndo(row.jumlahPeserta)} <span className="text-[10px] font-normal text-slate-500">org</span>
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => {
        const badge = getStatusAbsensiBadge(row.statusAbsensi);
        return (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badge.bg} ${badge.border}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      header: 'Aksi',
      className: 'text-right',
      accessor: (row) => {
        // RBAC on action buttons
        const canEdit =
          session.role === 'Admin' ||
          session.role === 'Koordinator' ||
          (session.role === 'Kader' && row.idKader === session.idUser);

        const canDelete = session.role === 'Admin' || session.role === 'Koordinator';

        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              id={`laporan-detail-btn-${row.idLaporan}`}
              onClick={() => {
                setSelectedReport(row);
                setIsDetailOpen(true);
              }}
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" />
            </button>

            {canEdit && (
              <button
                id={`laporan-edit-btn-${row.idLaporan}`}
                onClick={() => {
                  setReportToEdit(row);
                  setIsFormOpen(true);
                }}
                className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Laporan"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {canDelete && (
              <button
                id={`laporan-delete-btn-${row.idLaporan}`}
                onClick={() => {
                  setReportToDelete(row);
                  setIsDeleteOpen(true);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Hapus Laporan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Mobile Card Renderer
  const renderMobileCard = (row: LaporanSenam, index: number) => {
    const badge = getStatusAbsensiBadge(row.statusAbsensi);
    const canEdit =
      session.role === 'Admin' ||
      session.role === 'Koordinator' ||
      (session.role === 'Kader' && row.idKader === session.idUser);
    const canDelete = session.role === 'Admin' || session.role === 'Koordinator';

    return (
      <div
        id={`laporan-mobile-card-${row.idLaporan}`}
        className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
      >
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          <div
            onClick={() => {
              if (row.fotoUrl) {
                setLightboxUrl(row.fotoUrl);
                setLightboxCaption(row.captionFoto);
              }
            }}
            className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 relative"
          >
            {row.fotoUrl ? (
              <img
                src={row.fotoUrl}
                alt={row.captionFoto || row.jenisSenam}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
            <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 text-white px-1 rounded-sm">
              #{index}
            </span>
          </div>

          {/* Core Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg} ${badge.border}`}>
                {badge.label}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {formatDateIndo(row.tanggal)}
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-800 truncate">
              {row.jenisSenam}
            </h4>
            <p className="text-xs font-semibold text-emerald-700">
              Desa {row.namaDesa}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Kader: {row.namaKader}</span>
              <strong className="text-slate-800 font-bold">{row.jumlahPeserta} Peserta</strong>
            </div>
          </div>
        </div>

        {row.captionFoto && (
          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
            &ldquo;{row.captionFoto}&rdquo;
          </p>
        )}

        {/* Actions bar on mobile */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">{row.idLaporan}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setSelectedReport(row);
                setIsDetailOpen(true);
              }}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" /> Detail
            </button>
            {canEdit && (
              <button
                onClick={() => {
                  setReportToEdit(row);
                  setIsFormOpen(true);
                }}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => {
                  setReportToDelete(row);
                  setIsDeleteOpen(true);
                }}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="laporan-list-page" className="space-y-6">
      {/* Top Banner with Stats Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {isKader ? 'Daftar Laporan Kegiatan Saya' : 'Laporan Senam KORMI Darmaraja'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {filteredReports.length} laporan kegiatan senam terdata
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="laporan-refresh-btn"
            type="button"
            onClick={() => fetchAllData(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors disabled:opacity-50"
            title="Segarkan Data dari Database"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            id="laporan-add-new-btn"
            onClick={() => {
              setReportToEdit(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Input Laporan Baru</span>
          </button>
        </div>
      </div>

      {/* Main DataTable with Search & Multi-Filters */}
      <DataTable
        id="laporan-datatable"
        data={filteredReports}
        columns={columns}
        keyExtractor={(r) => r.idLaporan}
        searchPlaceholder="Cari desa, kader, senam, keterangan..."
        searchFilter={handleSearchFilter}
        renderMobileCard={renderMobileCard}
        isLoading={isLoading}
        emptyTitle="Belum Ada Laporan Senam"
        emptyDescription="Silakan input laporan baru menggunakan tombol di atas."
        emptyActionLabel="Input Laporan Sekarang"
        onEmptyAction={() => {
          setReportToEdit(null);
          setIsFormOpen(true);
        }}
        filterControls={
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Desa */}
            {!isKader && (
              <select
                id="filter-laporan-desa"
                value={filterDesa}
                onChange={(e) => setFilterDesa(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Semua Desa</option>
                {desaList.map((d) => (
                  <option key={d.idDesa} value={d.idDesa}>
                    {d.namaDesa}
                  </option>
                ))}
              </select>
            )}

            {/* Filter Jenis Senam */}
            <select
              id="filter-laporan-jenis"
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Semua Jenis Senam</option>
              {jenisSenamList.map((j) => (
                <option key={j.idJenis} value={j.namaJenis}>
                  {j.namaJenis}
                </option>
              ))}
            </select>

            {/* Filter Status Absensi */}
            <select
              id="filter-laporan-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Izin">Izin</option>
              <option value="Alfa">Alfa</option>
            </select>

            {(filterDesa || filterJenis || filterStatus || filterDateStart || filterDateEnd) && (
              <button
                onClick={handleResetFilters}
                className="p-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Reset Semua Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        }
      />

      {/* Form Modal (Add / Edit) */}
      <LaporanFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setReportToEdit(null);
        }}
        onSuccess={fetchAllData}
        reportToEdit={reportToEdit}
        session={session}
        desaList={desaList}
        jenisSenamList={jenisSenamList}
        usersList={usersList}
      />

      {/* Detail Modal */}
      <LaporanDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onOpenLightbox={(url, cap) => {
          setLightboxUrl(url);
          setLightboxCaption(cap);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setReportToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Apakah Anda yakin ingin menghapus data ini?"
        message="Data yang telah dihapus tidak dapat dipulihkan kembali."
        confirmLabel="Hapus Laporan"
        isLoading={isDeleting}
      />

      {/* Photo Lightbox Modal */}
      {lightboxUrl && (
        <PhotoLightboxModal
          isOpen={Boolean(lightboxUrl)}
          onClose={() => {
            setLightboxUrl(null);
            setLightboxCaption(undefined);
          }}
          imageUrl={lightboxUrl}
          caption={lightboxCaption}
        />
      )}
    </div>
  );
};
