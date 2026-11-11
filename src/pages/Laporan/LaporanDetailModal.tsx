import React from 'react';
import {
  Calendar,
  Users,
  MapPin,
  UserCheck,
  Dumbbell,
  Image as ImageIcon,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { LaporanSenam } from '../../types';
import { Modal } from '../../components/Modal/Modal';
import { formatDateIndo, formatDateTimeIndo, formatNumberIndo, getStatusAbsensiBadge } from '../../utils/formatters';

interface LaporanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LaporanSenam | null;
  onOpenLightbox: (imageUrl: string, caption?: string) => void;
}

export const LaporanDetailModal: React.FC<LaporanDetailModalProps> = ({
  isOpen,
  onClose,
  report,
  onOpenLightbox,
}) => {
  if (!report) return null;

  const statusBadge = getStatusAbsensiBadge(report.statusAbsensi);

  return (
    <Modal
      id="laporan-detail-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Laporan Kegiatan Senam"
      subtitle={`ID: ${report.idLaporan}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Photo Banner with Click to Zoom */}
        {report.fotoUrl ? (
          <div
            id="detail-photo-container"
            onClick={() => onOpenLightbox(report.fotoUrl, report.captionFoto)}
            className="relative rounded-2xl overflow-hidden bg-slate-900 cursor-pointer group max-h-72 flex items-center justify-center border border-slate-200"
          >
            <img
              src={report.fotoUrl}
              alt={report.captionFoto || report.jenisSenam}
              className="w-full h-72 object-cover group-hover:scale-102 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent flex items-end justify-between p-4">
              <div className="text-white">
                <span className="text-[10px] bg-emerald-600/90 text-white font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                  {report.sourceType === 'CAMERA' ? '📷 Foto Kamera' : '🖼️ Foto Galeri'}
                </span>
                {report.captionFoto && (
                  <p className="text-xs text-slate-200 italic mt-1.5 font-medium max-w-lg">
                    &ldquo;{report.captionFoto}&rdquo;
                  </p>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-white bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-xs group-hover:bg-white/30 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Perbesar
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-slate-400 text-xs flex flex-col items-center gap-1.5">
            <ImageIcon className="w-8 h-8 text-slate-300" />
            <span>Tidak ada foto dokumentasi terlampir (Status: {report.statusAbsensi})</span>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Desa / Wilayah</span>
              <p className="text-sm font-bold text-slate-800">Desa {report.namaDesa}</p>
              <span className="text-[10px] text-slate-400 font-mono">Kode: {report.idDesa}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Kader Pelapor</span>
              <p className="text-sm font-bold text-slate-800">{report.namaKader}</p>
              <span className="text-[10px] text-slate-400 font-mono">ID: {report.idKader}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Jenis Senam</span>
              <p className="text-sm font-bold text-slate-800">{report.jenisSenam}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Tanggal Pelaksanaan</span>
              <p className="text-sm font-bold text-slate-800">{formatDateIndo(report.tanggal)}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-100 text-teal-700">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Jumlah Peserta</span>
              <p className="text-base font-extrabold text-slate-900">
                {formatNumberIndo(report.jumlahPeserta)} <span className="text-xs font-normal text-slate-500">Orang</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Status Absensi</span>
              <div className="mt-0.5">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadge.bg} ${statusBadge.border}`}>
                  {statusBadge.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Caption block if present */}
        {report.captionFoto && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h5 className="text-xs font-bold text-slate-700 uppercase mb-1">Catatan / Keterangan Kegiatan</h5>
            <p className="text-sm text-slate-600 leading-relaxed">{report.captionFoto}</p>
          </div>
        )}

        {/* Audit timestamps */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-slate-100 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Waktu Input: {formatDateTimeIndo(report.createdAt)}</span>
          </div>
          {report.updatedAt && report.updatedAt !== report.createdAt && (
            <span>Diperbarui: {formatDateTimeIndo(report.updatedAt)}</span>
          )}
        </div>
      </div>
    </Modal>
  );
};
