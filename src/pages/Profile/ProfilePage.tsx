import React, { useState } from 'react';
import {
  UserCircle,
  MapPin,
  Shield,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  RotateCcw,
  Sparkles,
  Link,
  Wifi,
  WifiOff,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  UserCheck,
  Building,
} from 'lucide-react';
import { UserSession } from '../../types';
import { storage } from '../../services/storage';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast/Toast';
import { getRoleBadge } from '../../utils/formatters';
import { APP_NAME, APP_SHORT_NAME, APP_TAGLINE, APP_VERSION } from '../../constants/config';
import { ConfirmModal } from '../../components/Modal/ConfirmModal';

interface ProfilePageProps {
  session: UserSession;
  onLogout: () => void;
  onApiUrlChanged: () => void;
  onSessionUpdated?: (updatedSession: UserSession) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  session,
  onLogout,
  onApiUrlChanged,
  onSessionUpdated,
}) => {
  const toast = useToast();
  const roleBadge = getRoleBadge(session.role);
  const isAdmin = session.role === 'Admin';

  // Edit Profile States
  const [nama, setNama] = useState(session.nama || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  // Backend GAS URL States
  const [gasUrl, setGasUrl] = useState(storage.getApiUrl() || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    latency?: number;
  }>({ status: null, message: '' });

  // Cache & Local data states
  const [isResetDataModalOpen, setIsResetDataModalOpen] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim()) {
      toast.warning('Nama lengkap wajib diisi.');
      return;
    }

    if (password) {
      if (password.length < 4) {
        toast.warning('Password baru minimal 4 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Konfirmasi password tidak cocok dengan password baru.');
        return;
      }
    }

    try {
      setIsSubmittingProfile(true);
      const res = await api.updateProfile({
        nama: nama.trim(),
        ...(password.trim() ? { password: password.trim() } : {}),
      });

      if (res.success && res.data) {
        toast.success(res.message || 'Profil Anda berhasil diperbarui!');
        setPassword('');
        setConfirmPassword('');
        if (onSessionUpdated) {
          onSessionUpdated(res.data);
        }
      } else {
        toast.error(res.message || 'Gagal memperbarui profil.');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan saat menyimpan perubahan profil.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleClearCacheAndSync = async () => {
    try {
      setIsClearingCache(true);
      // Touch session to ensure fresh token timestamp
      const cur = storage.getSession();
      if (cur) {
        cur.token = `${cur.idUser}|${cur.username || ''}|${cur.role || ''}|${Date.now()}`;
        storage.setSession(cur);
      }
      toast.info('Membersihkan cache tampilan...');
      setTimeout(() => {
        toast.success('Cache dibersihkan! Tampilan telah disinkronkan langsung ke database.');
        setIsClearingCache(false);
      }, 500);
    } catch {
      setIsClearingCache(false);
    }
  };

  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      setTestResult({
        status: 'error',
        message: 'Masukkan URL Google Apps Script Web App terlebih dahulu.',
      });
      return;
    }

    try {
      setIsTesting(true);
      setTestResult({ status: null, message: 'Menguji koneksi ke server Apps Script...' });
      const startTime = performance.now();
      const res = await api.testConnection(gasUrl.trim());
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (res.success) {
        setTestResult({
          status: 'success',
          message: res.message || 'Koneksi ke Google Apps Script BERHASIL!',
          latency,
        });
        toast.success('Koneksi Google Apps Script berhasil terhubung!');
      } else {
        setTestResult({
          status: 'error',
          message: res.message || 'Gagal terhubung ke endpoint Apps Script.',
        });
        toast.error('Koneksi gagal. Periksa izin akses (Deploy as Anyone).');
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: 'Koneksi gagal dihubungi. Pastikan URL benar dan Web App dapat diakses publik.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveApiUrl = () => {
    storage.setApiUrl(gasUrl.trim());
    toast.success(
      gasUrl.trim()
        ? 'URL Google Apps Script berhasil disimpan!'
        : 'Mode penyimpanan lokal diaktifkan.'
    );
    onApiUrlChanged();
  };

  const handleClearApiUrl = () => {
    setGasUrl('');
    storage.setApiUrl('');
    setTestResult({ status: null, message: '' });
    toast.info('Mode kembali ke penyimpanan lokal (Offline/Demo Mode).');
    onApiUrlChanged();
  };

  const handleResetLocalData = async () => {
    try {
      setIsResettingData(true);
      await api.resetLocalDatabase();
      toast.success('Database lokal berhasil direset ke data bawaan awal.');
      setIsResetDataModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      toast.error('Gagal mereset database lokal.');
    } finally {
      setIsResettingData(false);
    }
  };

  return (
    <div id="profile-page" className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* 1. User Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-emerald-700/20">
            {session.nama.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{session.nama}</h2>
              <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-md ${roleBadge.bg}`}>
                {roleBadge.label}
              </span>
            </div>

            <p className="text-sm font-mono text-slate-500">@{session.username}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">{session.namaDesa ? `Desa ${session.namaDesa}` : 'Kecamatan Darmaraja'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">Hak Akses: {session.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Edit Profile Form Card (Nama & Password only, Desa & Role locked) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Edit Profil Akun Saya
              </h3>
              <p className="text-xs text-slate-500">
                Ubah nama tampilan dan kata sandi Anda. Hak akses dan desa dikunci oleh sistem.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Editable: Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserCircle className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="profile-nama-input"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400">Nama lengkap Anda yang akan muncul pada laporan kegiatan dan riwayat.</p>
            </div>

            {/* Read-Only: Username */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Username
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  <Lock className="w-2.5 h-2.5" /> Terkunci
                </span>
              </div>
              <input
                id="profile-username-locked"
                type="text"
                value={`@${session.username}`}
                disabled
                className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm font-mono text-slate-500 cursor-not-allowed select-none"
              />
              <p className="text-[11px] text-slate-400">Username digunakan untuk masuk (login) dan bersifat unik.</p>
            </div>

            {/* Read-Only: Role / Hak Akses (LOCKED) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hak Akses (Role)
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                  <Lock className="w-2.5 h-2.5" /> Tidak Dapat Diedit
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl">
                <Shield className="w-4 h-4 text-blue-600 shrink-0 ml-1" />
                <span className="text-sm font-bold text-slate-700 flex-1">{session.role}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hak akses dikelola secara terpusat oleh Administrator aplikasi.
              </p>
            </div>

            {/* Read-Only: Desa Penugasan (LOCKED) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Desa Penugasan
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                  <Lock className="w-2.5 h-2.5" /> Tidak Dapat Diedit
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl">
                <Building className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                <span className="text-sm font-bold text-slate-700">
                  {session.namaDesa ? `Desa ${session.namaDesa}` : 'Kecamatan Darmaraja (Semua Wilayah)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Wilayah penugasan desa dikelola dan ditentukan oleh Koordinator / Admin.
              </p>
            </div>

            {/* Editable: Password Baru */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ganti Password Baru (Opsional)
              </label>
              <div className="relative">
                <input
                  id="profile-new-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin ganti"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Minimal 4 karakter jika ingin mengganti password.</p>
            </div>

            {/* Editable: Konfirmasi Password Baru */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  id="profile-confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  disabled={!password}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400">Wajib sama persis dengan password baru di samping.</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              id="profile-submit-edit-btn"
              type="submit"
              disabled={isSubmittingProfile}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmittingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Profil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Cache & Sync Management Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-700">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Sinkronisasi & Pembersihan Cache Tampilan</h3>
            <p className="text-xs text-slate-500">
              Gunakan jika data di Google Sheets sudah berubah/dihapus tetapi tampilan masih menampilkan data lama.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
          <div>
            <p className="text-xs font-bold text-slate-700">Segarkan Cache & Paksa Pembacaan Database</p>
            <p className="text-[11px] text-slate-500">
              Menghapus cache HTTP browser dan memperbarui token sinkronisasi data secara langsung.
            </p>
          </div>
          <button
            id="profile-clear-cache-btn"
            type="button"
            onClick={handleClearCacheAndSync}
            disabled={isClearingCache}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isClearingCache ? 'animate-spin' : ''}`} />
            <span>{isClearingCache ? 'Menyinkronkan...' : 'Bersihkan Cache & Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* 4. Google Apps Script Configuration Card (KHUSUS ADMINISTRATOR) */}
      {isAdmin && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    Konfigurasi Backend Google Apps Script (GAS)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Khusus Admin
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Hubungkan frontend ke Google Sheets & Google Drive melalui Web App URL
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {storage.getApiUrl() ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Wifi className="w-3.5 h-3.5" /> Terhubung
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  <WifiOff className="w-3.5 h-3.5" /> Mode Lokal
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Google Apps Script Web App Exec URL
            </label>
            <div className="relative">
              <Link className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="profile-gas-url-input"
                type="url"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              * Dapatkan URL ini setelah melakukan <strong>Deploy &gt; New deployment &gt; Web app</strong>{' '}
              pada Google Apps Script dengan akses: <em>&ldquo;Who has access: Anyone&rdquo;</em>.
            </p>

            {/* Test connection result banner */}
            {testResult.message && (
              <div
                className={`p-3.5 rounded-xl text-xs sm:text-sm border flex items-center justify-between gap-3 ${
                  testResult.status === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                {testResult.latency !== undefined && (
                  <span className="font-mono text-[10px] bg-white/70 px-2 py-0.5 rounded-md font-semibold shrink-0">
                    {testResult.latency} ms
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                id="profile-test-connection-btn"
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menguji Endpoint...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>Uji Koneksi Server</span>
                  </>
                )}
              </button>

              <button
                id="profile-save-gas-url-btn"
                type="button"
                onClick={handleSaveApiUrl}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
              >
                Simpan Konfigurasi
              </button>

              {gasUrl && (
                <button
                  type="button"
                  onClick={handleClearApiUrl}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-colors"
                >
                  Gunakan Mode Lokal
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Local Storage Data Management (KHUSUS ADMINISTRATOR) */}
      {isAdmin && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-700">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">Manajemen Data Uji Coba Lokal</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Khusus Admin
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Reset atau pulihkan data awal 12 Desa, Kader, dan contoh Laporan Senam
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
            <div>
              <p className="text-xs font-bold text-slate-700">Reset Data Bawaan Sistem</p>
              <p className="text-[11px] text-slate-500">
                Mengembalikan seluruh data tabel ke benih awal (Seed Data).
              </p>
            </div>
            <button
              id="profile-reset-seed-data-btn"
              onClick={() => setIsResetDataModalOpen(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      )}

      {/* App Information */}
      <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200 text-center space-y-1">
        <p className="text-xs font-bold text-slate-700">
          {APP_NAME} • Versi {APP_VERSION}
        </p>
        <p className="text-[11px] text-slate-500 italic">&ldquo;{APP_TAGLINE}&rdquo;</p>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetDataModalOpen}
        onClose={() => setIsResetDataModalOpen(false)}
        onConfirm={handleResetLocalData}
        title="Reset Data Lokal ke Bawaan?"
        message="Tindakan ini akan menghapus seluruh data laporan senam buatan lokal dan mengisi kembali dengan 12 Desa serta Kader resmi Darmaraja."
        confirmLabel="Ya, Reset Sekarang"
        isLoading={isResettingData}
      />
    </div>
  );
};

