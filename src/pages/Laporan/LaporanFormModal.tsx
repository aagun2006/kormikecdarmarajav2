import React, { useState, useEffect } from 'react';
import { Loader2, Save, AlertCircle, Info, Lock } from 'lucide-react';
import { Desa, JenisSenam, LaporanSenam, StatusAbsensi, User, UserSession } from '../../types';
import { Modal } from '../../components/Modal/Modal';
import { CameraImageUploader } from '../../components/ImageUpload/CameraImageUploader';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast/Toast';

interface LaporanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reportToEdit?: LaporanSenam | null;
  session: UserSession;
  desaList: Desa[];
  jenisSenamList: JenisSenam[];
  usersList: User[];
}

export const LaporanFormModal: React.FC<LaporanFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  reportToEdit,
  session,
  desaList,
  jenisSenamList,
  usersList,
}) => {
  const toast = useToast();
  const isKader = session.role === 'Kader';
  const isAdminOrKoordinator = session.role === 'Admin' || session.role === 'Koordinator';
  const isEdit = Boolean(reportToEdit);

  // Form states
  const [idDesa, setIdDesa] = useState(isKader ? session.idDesa : '');
  const [namaDesa, setNamaDesa] = useState(isKader ? session.namaDesa : '');
  const [idKader, setIdKader] = useState(isKader ? session.idUser : '');
  const [namaKader, setNamaKader] = useState(isKader ? session.nama : '');

  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jumlahPeserta, setJumlahPeserta] = useState<number | string>('');
  const [jenisSenam, setJenisSenam] = useState('Senam Desa');
  const [statusAbsensi, setStatusAbsensi] = useState<StatusAbsensi>('Hadir');

  const [fotoBase64, setFotoBase64] = useState<string>('');
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>('');
  const [captionFoto, setCaptionFoto] = useState('');
  const [sourceType, setSourceType] = useState<'CAMERA' | 'GALLERY'>('CAMERA');

  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filter daftar kader berdasarkan idDesa yang sedang dipilih
  const filteredKaderList = usersList.filter(
    (u) => u.role === 'Kader' && u.idDesa === idDesa && u.status === 'Aktif'
  );

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (reportToEdit) {
      setIdDesa(reportToEdit.idDesa);
      setNamaDesa(reportToEdit.namaDesa);
      setIdKader(reportToEdit.idKader);
      setNamaKader(reportToEdit.namaKader);
      setTanggal(reportToEdit.tanggal);
      setJumlahPeserta(reportToEdit.jumlahPeserta);
      setJenisSenam(reportToEdit.jenisSenam);
      setStatusAbsensi(reportToEdit.statusAbsensi);
      setCurrentPhotoUrl(reportToEdit.fotoUrl || '');
      setFotoBase64('');
      setCaptionFoto(reportToEdit.captionFoto || '');
      setSourceType(reportToEdit.sourceType || 'CAMERA');
    } else {
      const initialDesaId = isKader ? session.idDesa : desaList[0]?.idDesa || '';
      const initialDesaObj = desaList.find((d) => d.idDesa === initialDesaId);
      
      setIdDesa(initialDesaId);
      setNamaDesa(initialDesaObj ? initialDesaObj.namaDesa : '');
      
      if (isKader) {
        setIdKader(session.idUser);
        setNamaKader(session.nama);
      } else {
        // Cari kader pertama di desa tersebut jika ada
        const defaultKader = usersList.find((u) => u.role === 'Kader' && u.idDesa === initialDesaId);
        setIdKader(defaultKader ? defaultKader.idUser : '');
        setNamaKader(defaultKader ? defaultKader.nama : '');
      }

      setTanggal(new Date().toISOString().slice(0, 10));
      setJumlahPeserta('');
      setJenisSenam(jenisSenamList[0]?.namaJenis || 'Senam Desa');
      setStatusAbsensi('Hadir');
      setCurrentPhotoUrl('');
      setFotoBase64('');
      setCaptionFoto('');
      setSourceType('CAMERA');
    }
    setValidationError(null);
  }, [reportToEdit, isOpen, isKader, session, desaList, jenisSenamList, usersList]);

  // Sync village name and default kader when admin selects village
  const handleDesaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setIdDesa(selectedId);
    const d = desaList.find((item) => item.idDesa === selectedId);
    if (d) setNamaDesa(d.namaDesa);

    // Otomatis set kader pertama yang bertugas di desa tersebut
    const matchingKader = usersList.find((u) => u.role === 'Kader' && u.idDesa === selectedId && u.status === 'Aktif');
    if (matchingKader) {
      setIdKader(matchingKader.idUser);
      setNamaKader(matchingKader.nama);
    } else {
      setIdKader('');
      setNamaKader('');
    }
  };

  const handleKaderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIdKader = e.target.value;
    setIdKader(selectedIdKader);
    const k = usersList.find((u) => u.idUser === selectedIdKader);
    if (k) setNamaKader(k.nama);
  };

  const handleStatusChange = (newStatus: StatusAbsensi) => {
    setStatusAbsensi(newStatus);
    if (newStatus === 'Izin' || newStatus === 'Alfa') {
      setJumlahPeserta(0);
    } else if (jumlahPeserta === 0) {
      setJumlahPeserta('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // 1. Validations
    if (!tanggal) {
      setValidationError('Tanggal kegiatan wajib diisi.');
      return;
    }
    if (!jenisSenam) {
      setValidationError('Jenis senam wajib dipilih.');
      return;
    }
    if (!statusAbsensi) {
      setValidationError('Status absensi wajib dipilih.');
      return;
    }

    const countNum = parseInt(String(jumlahPeserta), 10);
    if (statusAbsensi === 'Hadir' && (isNaN(countNum) || countNum < 0)) {
      setValidationError('Jumlah peserta harus berupa angka valid (minimal 0).');
      return;
    }

    // 2. Strict Photo Validation for Hadir
    if (statusAbsensi === 'Hadir' && !fotoBase64 && !currentPhotoUrl) {
      setValidationError(
        "Kegiatan dengan status 'Hadir' WAJIB menyertakan foto dokumentasi."
      );
      return;
    }

    try {
      setIsLoading(true);

      const payload: Partial<LaporanSenam> & { fotoBase64?: string } = {
        idDesa: isKader ? session.idDesa : idDesa,
        namaDesa: isKader ? session.namaDesa : namaDesa,
        idKader: isKader ? session.idUser : idKader,
        namaKader: isKader ? session.nama : namaKader,
        tanggal,
        jumlahPeserta: statusAbsensi === 'Hadir' ? countNum : 0,
        jenisSenam,
        statusAbsensi,
        captionFoto: captionFoto.trim(),
        sourceType,
      };

      if (fotoBase64) {
        payload.fotoBase64 = fotoBase64;
      } else if (currentPhotoUrl) {
        payload.fotoUrl = currentPhotoUrl;
      }

      let res;
      if (isEdit && reportToEdit) {
        payload.idLaporan = reportToEdit.idLaporan;
        res = await api.updateLaporan(payload);
      } else {
        res = await api.saveLaporan(payload);
      }

      if (res.success) {
        toast.success(res.message || 'Laporan kegiatan senam berhasil disimpan.');
        onSuccess();
        onClose();
      } else {
        setValidationError(res.message || 'Gagal menyimpan laporan.');
      }
    } catch (err: any) {
      setValidationError('Terjadi kesalahan saat memproses data. Silakan coba kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      id="laporan-form-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Laporan Kegiatan Senam' : 'Input Laporan Kegiatan Senam'}
      subtitle={
        isKader
          ? `Laporan atas nama Desa ${session.namaDesa} • Kader ${session.nama}`
          : 'Form pencatatan dokumentasi & absensi senam KORMI'
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Banner */}
        {validationError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Identity Section (Readonly for Kader, Selectable for Admin/Koordinator) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>Desa / Wilayah</span>
              {isKader && <Lock className="w-3 h-3 text-slate-400" />}
            </label>
            {isKader ? (
              <input
                type="text"
                value={`Desa ${session.namaDesa} (${session.idDesa})`}
                readOnly
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 cursor-not-allowed"
              />
            ) : (
              <select
                id="laporan-select-desa"
                value={idDesa}
                onChange={handleDesaChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {desaList.map((d) => (
                  <option key={d.idDesa} value={d.idDesa}>
                    {d.namaDesa} ({d.idDesa})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>Kader Pelapor</span>
              {isKader && <Lock className="w-3 h-3 text-slate-400" />}
            </label>
            {isKader ? (
              <input
                type="text"
                value={`${session.nama} (${session.idUser})`}
                readOnly
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 cursor-not-allowed"
              />
            ) : (
              <select
                id="laporan-select-kader"
                value={idKader}
                onChange={handleKaderChange}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Pilih Kader Pelapor --</option>
                {filteredKaderList.map((k) => (
                  <option key={k.idUser} value={k.idUser}>
                    {k.nama} (@{k.username})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Core Activity Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tanggal Kegiatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tanggal Kegiatan <span className="text-rose-500">*</span>
            </label>
            <input
              id="laporan-input-tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Jenis Senam */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jenis Senam <span className="text-rose-500">*</span>
            </label>
            <select
              id="laporan-select-jenis"
              value={jenisSenam}
              onChange={(e) => setJenisSenam(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {jenisSenamList.map((j) => (
                <option key={j.idJenis} value={j.namaJenis}>
                  {j.namaJenis}
                </option>
              ))}
            </select>
          </div>

          {/* Status Absensi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Status Absensi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
              {(['Hadir', 'Izin', 'Alfa'] as StatusAbsensi[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    statusAbsensi === st
                      ? st === 'Hadir'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : st === 'Izin'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Jumlah Peserta (Only if Hadir) */}
        {statusAbsensi === 'Hadir' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jumlah Peserta Senam <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="laporan-input-peserta"
                type="number"
                min="0"
                value={jumlahPeserta}
                onChange={(e) => setJumlahPeserta(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                placeholder="Contoh: 35"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                Orang
              </span>
            </div>
          </div>
        )}

        {/* Camera Image Uploader */}
        <div className="pt-2">
          <CameraImageUploader
            id="laporan-camera-uploader"
            statusAbsensi={statusAbsensi}
            userRole={isAdminOrKoordinator ? 'Admin' : session.role} 
            currentPhotoUrl={currentPhotoUrl}
            required={statusAbsensi === 'Hadir'}
            onPhotoSelected={(base64, previewUrl, type) => {
              setFotoBase64(base64);
              setCurrentPhotoUrl(previewUrl);
              setSourceType(type);
              setValidationError(null);
            }}
            onPhotoRemoved={() => {
              setFotoBase64('');
              setCurrentPhotoUrl('');
            }}
          />
        </div>

        {/* Caption Foto */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Keterangan / Caption Foto (Opsional)
          </label>
          <textarea
            id="laporan-input-caption"
            value={captionFoto}
            onChange={(e) => setCaptionFoto(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            placeholder="Contoh: Senam SKJ di Alun-Alun Darmaraja dihadiri oleh seluruh warga..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            id="laporan-form-submit-btn"
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Laporan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'Simpan Perubahan' : 'Kirim Laporan'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};