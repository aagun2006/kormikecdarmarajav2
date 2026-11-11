import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Desa, UserSession } from '../../types';
import { api } from '../../services/api';
import { DataTable, Column } from '../../components/DataTable/DataTable';
import { Modal } from '../../components/Modal/Modal';
import { ConfirmModal } from '../../components/Modal/ConfirmModal';
import { formatDateIndo, getStatusBadge } from '../../utils/formatters';
import { useToast } from '../../components/Toast/Toast';

export const DesaPage: React.FC<{ session: UserSession }> = ({ session }) => {
  const toast = useToast();
  const [desaList, setDesaList] = useState<Desa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesa, setEditingDesa] = useState<Desa | null>(null);
  const [namaDesa, setNamaDesa] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [desaToDelete, setDesaToDelete] = useState<Desa | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = session.role === 'Admin';
  const canDelete = isAdmin;

  const fetchDesa = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      const res = await api.getDesa();
      if (res.success && res.data) {
        setDesaList(res.data);
        if (isManualRefresh) toast.success('Data desa berhasil disinkronkan.');
      }
    } catch (err) {
      toast.error('Gagal memuat data desa.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDesa();
  }, []);

  const handleOpenAdd = () => {
    setEditingDesa(null);
    setNamaDesa('');
    setStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Desa) => {
    setEditingDesa(d);
    setNamaDesa(d.namaDesa);
    setStatus(d.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaDesa.trim()) {
      toast.warning('Nama desa wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      let res;
      if (editingDesa) {
        res = await api.updateDesa({
          idDesa: editingDesa.idDesa,
          namaDesa: namaDesa.trim(),
          status,
        });
      } else {
        res = await api.saveDesa({
          namaDesa: namaDesa.trim(),
          status,
        });
      }

      if (res.success) {
        toast.success(res.message || 'Data desa berhasil disimpan.');
        setIsModalOpen(false);
        fetchDesa();
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
    if (!desaToDelete) return;
    const deletedId = desaToDelete.idDesa;
    try {
      setIsDeleting(true);
      const res = await api.deleteDesa(deletedId);
      if (res.success) {
        toast.success('Data desa berhasil dihapus.');
        setIsDeleteOpen(false);
        setDesaToDelete(null);
        // Instant optimistic removal from UI
        setDesaList((prev) => prev.filter((item) => item.idDesa !== deletedId));
        // Verify from database
        fetchDesa();
      } else {
        toast.error(res.message || 'Gagal menghapus desa.');
      }
    } catch (err) {
      toast.error('Terjadi masalah saat menghapus data.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Desa>[] = [
    {
      header: 'ID Desa',
      className: 'w-28 font-mono text-xs text-slate-500 font-bold',
      accessor: 'idDesa',
    },
    {
      header: 'Nama Desa',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Desa {row.namaDesa}</span>
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
            id={`desa-edit-btn-${row.idDesa}`}
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Desa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {canDelete && (
            <button
              id={`desa-delete-btn-${row.idDesa}`}
              onClick={() => {
                setDesaToDelete(row);
                setIsDeleteOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Hapus Desa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const renderMobileCard = (row: Desa) => {
    const badge = getStatusBadge(row.status);
    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Desa {row.namaDesa}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-400">{row.idDesa}</span>
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
                setDesaToDelete(row);
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
    <div id="master-desa-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Data Desa Kecamatan Darmaraja</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar 12 Desa di wilayah Kecamatan Darmaraja Kabupaten Sumedang
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="desa-refresh-btn"
            type="button"
            onClick={() => fetchDesa(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors disabled:opacity-50"
            title="Segarkan Data dari Database"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            id="desa-add-new-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Desa</span>
          </button>
        </div>
      </div>

      <DataTable
        id="desa-datatable"
        data={desaList}
        columns={columns}
        keyExtractor={(d) => d.idDesa}
        searchPlaceholder="Cari nama desa..."
        searchFilter={(item, query) => item.namaDesa.toLowerCase().includes(query.toLowerCase())}
        renderMobileCard={renderMobileCard}
        isLoading={isLoading}
      />

      {/* Form Modal */}
      <Modal
        id="desa-form-modal"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDesa ? 'Edit Data Desa' : 'Tambah Desa Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Desa <span className="text-rose-500">*</span>
            </label>
            <input
              id="desa-input-nama"
              type="text"
              value={namaDesa}
              onChange={(e) => setNamaDesa(e.target.value)}
              placeholder="Contoh: Darmaraja"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Status Desa
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
              id="desa-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingDesa ? 'Simpan' : 'Tambah'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Hapus Desa ${desaToDelete?.namaDesa}?`}
        message="Data yang telah dihapus tidak dapat dipulihkan kembali."
        isLoading={isDeleting}
      />
    </div>
  );
};
