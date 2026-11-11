import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Dumbbell, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { JenisSenam, UserSession } from '../../types';
import { api } from '../../services/api';
import { DataTable, Column } from '../../components/DataTable/DataTable';
import { Modal } from '../../components/Modal/Modal';
import { ConfirmModal } from '../../components/Modal/ConfirmModal';
import { formatDateIndo, getStatusBadge } from '../../utils/formatters';
import { useToast } from '../../components/Toast/Toast';

export const JenisSenamPage: React.FC<{ session: UserSession }> = ({ session }) => {
  const toast = useToast();
  const [jenisList, setJenisList] = useState<JenisSenam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJenis, setEditingJenis] = useState<JenisSenam | null>(null);
  const [namaJenis, setNamaJenis] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [jenisToDelete, setJenisToDelete] = useState<JenisSenam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = session.role === 'Admin';
  const canDelete = isAdmin;

  const fetchJenis = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      const res = await api.getJenisSenam();
      if (res.success && res.data) {
        setJenisList(res.data);
        if (isManualRefresh) toast.success('Data jenis senam berhasil disinkronkan.');
      }
    } catch (err) {
      toast.error('Gagal memuat master jenis senam.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJenis();
  }, []);

  const handleOpenAdd = () => {
    setEditingJenis(null);
    setNamaJenis('');
    setStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (j: JenisSenam) => {
    setEditingJenis(j);
    setNamaJenis(j.namaJenis);
    setStatus(j.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaJenis.trim()) {
      toast.warning('Nama jenis senam wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      let res;
      if (editingJenis) {
        res = await api.updateJenisSenam({
          idJenis: editingJenis.idJenis,
          namaJenis: namaJenis.trim(),
          status,
        });
      } else {
        res = await api.saveJenisSenam({
          namaJenis: namaJenis.trim(),
          status,
        });
      }

      if (res.success) {
        toast.success(res.message || 'Data jenis senam berhasil disimpan.');
        setIsModalOpen(false);
        fetchJenis();
      } else {
        toast.error(res.message || 'Gagal menyimpan data.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!jenisToDelete) return;
    const deletedId = jenisToDelete.idJenis;
    try {
      setIsDeleting(true);
      const res = await api.deleteJenisSenam(deletedId);
      if (res.success) {
        toast.success('Jenis senam berhasil dihapus.');
        setIsDeleteOpen(false);
        setJenisToDelete(null);
        // Instant optimistic removal from UI
        setJenisList((prev) => prev.filter((item) => item.idJenis !== deletedId));
        // Verify from database
        fetchJenis();
      } else {
        toast.error(res.message || 'Gagal menghapus jenis senam.');
      }
    } catch (err) {
      toast.error('Terjadi masalah saat menghapus data.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<JenisSenam>[] = [
    {
      header: 'ID Jenis',
      className: 'w-28 font-mono text-xs text-slate-500 font-bold',
      accessor: 'idJenis',
    },
    {
      header: 'Nama Jenis Senam',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <Dumbbell className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800 text-sm">{row.namaJenis}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => {
        const badge = getStatusBadge(row.status);
        return (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${badge.bg}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      header: 'Terdaftar',
      accessor: (row) => (
        <span className="text-xs text-slate-500">{formatDateIndo(row.createdAt)}</span>
      ),
    },
    {
      header: 'Aksi',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            id={`jenis-edit-btn-${row.idJenis}`}
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Jenis Senam"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {canDelete && (
            <button
              id={`jenis-delete-btn-${row.idJenis}`}
              onClick={() => {
                setJenisToDelete(row);
                setIsDeleteOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Hapus Jenis Senam"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const renderMobileCard = (row: JenisSenam) => {
    const badge = getStatusBadge(row.status);
    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">{row.namaJenis}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-400">{row.idJenis}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-sm border ${badge.bg}`}>
                {row.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {canDelete && (
            <button
              onClick={() => {
                setJenisToDelete(row);
                setIsDeleteOpen(true);
              }}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="master-jenis-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Master Jenis Senam KORMI</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar jenis dan kategori senam yang dilaporkan oleh kader dan koordinator
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="jenis-refresh-btn"
            type="button"
            onClick={() => fetchJenis(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors disabled:opacity-50"
            title="Segarkan Data dari Database"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            id="jenis-add-new-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jenis Senam</span>
          </button>
        </div>
      </div>

      <DataTable
        id="jenis-datatable"
        data={jenisList}
        columns={columns}
        keyExtractor={(j) => j.idJenis}
        searchPlaceholder="Cari jenis senam..."
        searchFilter={(item, query) => item.namaJenis.toLowerCase().includes(query.toLowerCase())}
        renderMobileCard={renderMobileCard}
        isLoading={isLoading}
      />

      {/* Form Modal */}
      <Modal
        id="jenis-form-modal"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJenis ? 'Edit Jenis Senam' : 'Tambah Jenis Senam Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Jenis Senam <span className="text-rose-500">*</span>
            </label>
            <input
              id="jenis-input-nama"
              type="text"
              value={namaJenis}
              onChange={(e) => setNamaJenis(e.target.value)}
              placeholder="Contoh: Senam Lansia / Senam SKJ"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Aktif')}
                className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  status === 'Aktif'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aktif</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('Nonaktif')}
                className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  status === 'Nonaktif'
                    ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Nonaktif</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Batal
            </button>
            <button
              id="jenis-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingJenis ? 'Simpan' : 'Tambah'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Hapus ${jenisToDelete?.namaJenis}?`}
        message="Data yang telah dihapus tidak dapat dipulihkan kembali."
        isLoading={isDeleting}
      />
    </div>
  );
};
