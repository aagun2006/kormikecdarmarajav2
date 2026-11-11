import React from 'react';
import { X, ExternalLink, Download, Image as ImageIcon } from 'lucide-react';

interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  caption?: string;
  metadata?: {
    desa?: string;
    kader?: string;
    tanggal?: string;
    jenisSenam?: string;
    sourceType?: string;
  };
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Dokumentasi Foto Senam',
  caption,
  metadata,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="photo-lightbox-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-semibold truncate">{title}</h4>
          </div>
          <div className="flex items-center gap-2">
            {imageUrl && (
              <a
                id="lightbox-download-link"
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                download="laporan-senam-kormi.jpg"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Buka gambar di tab baru"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              id="lightbox-close-btn"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Tutup foto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-[300px] max-h-[65vh] bg-black/40 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={caption || 'Dokumentasi kegiatan senam'}
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
              <ImageIcon className="w-10 h-10 opacity-40" />
              <span>Tidak ada foto dokumentasi</span>
            </div>
          )}
        </div>

        {/* Caption & Metadata Footer */}
        {(caption || metadata) && (
          <div className="px-5 py-4 bg-slate-950/90 border-t border-slate-800 text-slate-300 text-xs sm:text-sm">
            {caption && (
              <p className="text-white font-medium mb-2 italic">
                &ldquo;{caption}&rdquo;
              </p>
            )}
            {metadata && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                {metadata.desa && (
                  <div>
                    <span className="text-slate-500 block">Desa:</span>
                    <span className="text-slate-200 font-medium">{metadata.desa}</span>
                  </div>
                )}
                {metadata.kader && (
                  <div>
                    <span className="text-slate-500 block">Kader:</span>
                    <span className="text-slate-200 font-medium">{metadata.kader}</span>
                  </div>
                )}
                {metadata.tanggal && (
                  <div>
                    <span className="text-slate-500 block">Tanggal:</span>
                    <span className="text-slate-200 font-medium">{metadata.tanggal}</span>
                  </div>
                )}
                {metadata.sourceType && (
                  <div>
                    <span className="text-slate-500 block">Sumber:</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      ● {metadata.sourceType}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
