import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Key,
  MapPin,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { Desa, User, UserRole, UserSession } from '../../types';
import { api } from '../../services/api';
import { DataTable, Column } from '../../components/DataTable/DataTable';
import { Modal } from '../../components/Modal/Modal';
import { ConfirmModal } from '../../components/Modal/ConfirmModal';
import { formatDateIndo, getRoleBadge, getStatusBadge } from '../../utils/formatters';
import { useToast } from '../../components/Toast/Toast';

export const UsersPage: React.FC<{ session: UserSession }> = ({ session }) => {
  const toast = useToast();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [role, setRole] = useState<UserRole>('Kader');
  const [idDesa, setIdDesa] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = session.role === 'Admin';
  const isKoordinator = session.role === 'Koordinator';
  const canDelete = isAdmin;

  const fetchUsersAndDesa = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      const [usersRes, desaRes] = await Promise.all([api.getUsers(), api.getDesa()]);
      if (usersRes.success && usersRes.data) setUsersList(usersRes.data);
      if (desaRes.success && desaRes.data) setDesaList(desaRes.data);
      if (isManualRefresh) toast.success('Data pengguna berhasil disinkronkan.');
    } catch (err) {
      toast.error('Gagal memuat data pengguna.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsersAndDesa();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setNama('');
    setRole(isKoordinator ? 'Kader' : 'Kader');
    setIdDesa(desaList[0]?.idDesa || '');
    setStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword(''); 
    setNama(u.nama);
    setRole(u.role);
    setIdDesa(u.idDesa || '');
    setStatus(u.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !nama.trim()) {
      toast.warning('Username dan Nama lengkap wajib diisi.');
      return;
    }
    if (!editingUser && !password) {
      toast.warning('Password akun baru wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const d = desaList.find((item) => item.idDesa === idDesa);
      const namaDesa = d ? d.namaDesa : '';

      // 👇 PASTIKAN idUser DI-SET SECARA EKSPLISIT DI SINI DENGAN NAMA PROPERTI YANG PAS
      const payload: any = {
        idUser: editingUser ? editingUser.idUser : '', 
        username: username.trim(),
        nama: nama.trim(),
        role: isKoordinator ? 'Kader' : role,
        idDesa: role === 'Kader' ? idDesa : '',
        namaDesa: role === 'Kader' ? namaDesa : '',
        status,
      };

      if (password) {
        payload.password = password;
      }

      let res;
      if (editingUser) {
        // Kirim langsung payload yang sudah ada idUser-nya
        res = await api.updateUser(payload);
      } else {
        res = await api.saveUser(payload);
      }

      if (res.success) {
        toast.success(res.message || 'Pengguna berhasil disimpan.');
        setIsModalOpen(false);
        fetchUsersAndDesa();
      } else {
        toast.error(res.message || 'Gagal menyimpan pengguna.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat memproses data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    const deletedId = userToDelete.idUser;
    try {
      setIsDeleting(true);
      const res = await api.deleteUser(deletedId);
      if (res.success) {
        toast.success('Pengguna berhasil dihapus.');
        setIsDeleteOpen(false);
        setUserToDelete(null);
        // Instant optimistic removal from UI
        setUsersList((prev) => prev.filter((item) => item.idUser !== deletedId));
        // Verify from database
        fetchUsersAndDesa();
      } else {
        toast.error(res.message || 'Gagal menghapus pengguna.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'ID',
      className: 'w-24 font-mono text-xs text-slate-400 font-bold',
      accessor: 'idUser',
    },
    {
      header: 'Nama & Username',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs sm:text-sm">{row.nama}</span>
          <span className="text-[11px] text-slate-400 font-mono">@{row.username}</span>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (row) => {
        const badge = getRoleBadge(row.role);
        return (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${badge.bg}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      header: 'Penempatan Desa',
      accessor: (row) =>
        row.namaDesa ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <MapPin className="w-3.5 h-3.5" />
            <span>Desa {row.namaDesa}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">- (Kecamatan)</span>
        ),
    },
    {
      header: 'Status',
      accessor: (row) => {
        const badge = getStatusBadge(row.status);
        return (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      header: 'Terdaftar',
      accessor: (row) => (
        <span className="text-xs text-slate-400">{formatDateIndo(row.createdAt)}</span>
      ),
    },
    {
      header: 'Aksi',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            id={`user-edit-btn-${row.idUser}`}
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit User"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {canDelete && (
            <button
              id={`user-delete-btn-${row.idUser}`}
              onClick={() => {
                setUserToDelete(row);
                setIsDeleteOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Hapus User"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const renderMobileCard = (row: User) => {
    const roleBadge = getRoleBadge(row.role);
    const statusBadge = getStatusBadge(row.status);

    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-sm">
              {row.nama.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">{row.nama}</h4>
              <p className="text-xs text-slate-400 font-mono">@{row.username}</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${roleBadge.bg}`}>
            {roleBadge.label}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.namaDesa ? `Desa ${row.namaDesa}` : 'Kecamatan Darmaraja'}</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-md border ${statusBadge.bg}`}>
            {row.status}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={() => handleOpenEdit(row)}
            className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          {canDelete && (
            <button
              onClick={() => {
                setUserToDelete(row);
                setIsDeleteOpen(true);
              }}
              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="master-users-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {isKoordinator ? 'Manajemen Kader Senam Desa' : 'Manajemen Pengguna & Hak Akses'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola akun login untuk Admin, Koordinator Kecamatan, dan Kader 12 Desa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="users-refresh-btn"
            type="button"
            onClick={() => fetchUsersAndDesa(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors disabled:opacity-50"
            title="Segarkan Data dari Database"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            id="users-add-new-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{isKoordinator ? 'Tambah Kader Baru' : 'Tambah Pengguna'}</span>
          </button>
        </div>
      </div>

      <DataTable
        id="users-datatable"
        data={usersList}
        columns={columns}
        keyExtractor={(u) => u.idUser}
        searchPlaceholder="Cari nama, username, atau desa..."
        searchFilter={(item, query) =>
          item.nama.toLowerCase().includes(query.toLowerCase()) ||
          item.username.toLowerCase().includes(query.toLowerCase()) ||
          (item.namaDesa && item.namaDesa.toLowerCase().includes(query.toLowerCase()))
        }
        renderMobileCard={renderMobileCard}
        isLoading={isLoading}
      />

      {/* Form Modal */}
      <Modal
        id="users-form-modal"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Baru'}
        subtitle="Konfigurasi akun dan penempatan tugas wilayah"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              id="user-input-nama"
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Siti Rahmawati, S.Pd"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Username Login <span className="text-rose-500">*</span>
              </label>
              <input
                id="user-input-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                placeholder="Contoh: kader.darmaraja"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password {editingUser && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diganti)</span>}
              </label>
              <div className="relative">
                <input
                  id="user-input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? '••••••••' : 'Password baru'}
                  required={!editingUser}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Role Assignment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Role Akses <span className="text-rose-500">*</span>
              </label>
              {isKoordinator ? (
                <input
                  type="text"
                  value="Kader Desa (Terkunci)"
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-not-allowed"
                />
              ) : (
                <select
                  id="user-select-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Kader">Kader Desa</option>
                  <option value="Koordinator">Koordinator Kecamatan</option>
                  <option value="Admin">Administrator</option>
                </select>
              )}
            </div>

            {/* Desa Assignment if role === 'Kader' */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Penempatan Desa {role === 'Kader' && <span className="text-rose-500">*</span>}
              </label>
              <select
                id="user-select-desa"
                value={idDesa}
                onChange={(e) => setIdDesa(e.target.value)}
                disabled={role !== 'Kader'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">-- Pilih Desa --</option>
                {desaList.map((d) => (
                  <option key={d.idDesa} value={d.idDesa}>
                    Desa {d.namaDesa} ({d.idDesa})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Status Akun
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
              id="user-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Hapus Pengguna ${userToDelete?.nama}?`}
        message="Akun pengguna dan seluruh riwayat sesi terkait akan dihapus permanen."
        isLoading={isDeleting}
      />
    </div>
  );
};
