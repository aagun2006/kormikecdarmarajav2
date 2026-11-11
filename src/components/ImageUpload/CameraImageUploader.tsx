import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';
import { StatusAbsensi, UserRole } from '../../types';

interface CameraImageUploaderProps {
  id?: string;
  statusAbsensi: StatusAbsensi;
  userRole?: UserRole;
  currentPhotoUrl?: string;
  onPhotoSelected: (base64: string, previewUrl: string, sourceType: 'CAMERA' | 'GALLERY') => void;
  onPhotoRemoved: () => void;
  required?: boolean;
}

export const CameraImageUploader: React.FC<CameraImageUploaderProps> = ({
  id = 'camera-uploader',
  statusAbsensi,
  userRole,
  currentPhotoUrl,
  onPhotoSelected,
  onPhotoRemoved,
  required = false,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageMeta, setImageMeta] = useState<{ sizeKb?: number; width?: number; height?: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isHadir = statusAbsensi === 'Hadir';
  const isKader = userRole === 'Kader';
  // If Hadir, only camera is permitted, gallery is locked!
  // const isCameraOnly = isHadir;
  // PERBAIKAN: Hanya Kader yang wajib kamera mutlak saat Hadir. 
  // Admin & Koordinator tetap diizinkan pakai galeri jika diperlukan.
  const isCameraOnly = isHadir && isKader;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, sourceType: 'CAMERA' | 'GALLERY') => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    try {
      setIsProcessing(true);
      const compressed = await compressImage(file, 1280, 1280, 0.82);
      setImageMeta({
        sizeKb: compressed.sizeKb,
        width: compressed.width,
        height: compressed.height,
      });
      onPhotoSelected(compressed.base64, compressed.previewUrl, sourceType);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses gambar');
    } finally {
      setIsProcessing(false);
      // Reset input value so same photo can be reselected if needed
      e.target.value = '';
    }
  };

  return (
    <div id={id} className="space-y-3">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        id={`${id}-camera-input`}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'CAMERA')}
      />

      <input
        ref={galleryInputRef}
        id={`${id}-gallery-input`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'GALLERY')}
      />

      {/* Label and Status Requirement Hint */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <span>Foto Dokumentasi Kegiatan</span>
          {required && isHadir && <span className="text-rose-500 font-bold">* (Wajib Kamera)</span>}
          {!isHadir && <span className="text-slate-400 font-normal text-xs">(Opsional)</span>}
        </label>
        {isCameraOnly ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <Camera className="w-3 h-3" /> Mode Kamera Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            Kamera / Galeri Diizinkan
          </span>
        )}
      </div>

      {/* Error message if any */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Current / Selected Image Preview */}
      {currentPhotoUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
          <img
            src={currentPhotoUrl}
            alt="Preview foto kegiatan"
            className="w-full h-56 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4 opacity-90">
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1 bg-emerald-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Foto Siap
              </span>
              <button
                id={`${id}-remove-photo-btn`}
                type="button"
                onClick={() => {
                  setImageMeta(null);
                  onPhotoRemoved();
                }}
                className="p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs"
                title="Hapus foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-200">
              {imageMeta?.sizeKb ? (
                <span>
                  Ukuran: <strong className="text-white">{imageMeta.sizeKb} KB</strong> (Dioptimalkan)
                </span>
              ) : (
                <span>Foto Tersimpan</span>
              )}

              <button
                id={`${id}-retake-photo-btn`}
                type="button"
                onClick={() => {
                  if (isCameraOnly) {
                    cameraInputRef.current?.click();
                  } else {
                    cameraInputRef.current?.click();
                  }
                }}
                className="inline-flex items-center gap-1 text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-xs transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Ambil Ulang
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Action buttons when no photo is selected */
        <div className="grid grid-cols-1 gap-2.5">
          {/* Main Camera Button */}
          <button
            id={`${id}-take-camera-btn`}
            type="button"
            disabled={isProcessing}
            onClick={() => cameraInputRef.current?.click()}
            className={`w-full py-4 px-4 rounded-2xl border-2 border-dashed flex flex-col sm:flex-row items-center justify-center gap-3 transition-all ${
              isCameraOnly
                ? 'bg-emerald-50/70 border-emerald-400 hover:bg-emerald-100/70 text-emerald-800'
                : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className={`p-3 rounded-full ${isCameraOnly ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'}`}>
              <Camera className="w-6 h-6" />
            </div>
            <div className="text-center sm:text-left">
              <span className="font-bold text-sm block">
                {isProcessing ? 'Mengompresi Gambar...' : 'Buka Kamera Perangkat'}
              </span>
              <span className="text-xs text-slate-500">
                {isHadir
                  ? 'Wajib ambil langsung dari kamera untuk status Hadir'
                  : 'Ambil foto dokumentasi langsung di lokasi'}
              </span>
            </div>
          </button>

          {/* Gallery Button (Only permitted if status is NOT Hadir) */}
          {!isCameraOnly && (
            <button
              id={`${id}-pick-gallery-btn`}
              type="button"
              disabled={isProcessing}
              onClick={() => galleryInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-2 text-xs font-semibold shadow-2xs transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-slate-500" />
              <span>Pilih dari Galeri Perangkat (Khusus Izin / Alfa)</span>
            </button>
          )}

          {isCameraOnly && (
            <p className="text-[11px] text-amber-700 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Sesuai SOP KORMI Darmaraja, absensi <strong>Hadir</strong> mewajibkan foto kamera langsung di lokasi kegiatan.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
