import React from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Apakah Anda yakin ingin menghapus data ini?',
  message = 'Data yang telah dihapus tidak dapat dipulihkan kembali.',
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  isLoading = false,
  variant = 'danger',
}) => {
  return (
    <Modal
      id="confirm-action-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Tindakan"
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center p-2">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
            variant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          {variant === 'danger' ? <Trash2 className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
        </div>
        <h4 className="text-base font-bold text-slate-800 mb-2">{title}</h4>
        <p className="text-sm text-slate-500 mb-6">{message}</p>

        <div className="flex items-center gap-3 w-full">
          <button
            id="confirm-modal-cancel-btn"
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            id="confirm-modal-submit-btn"
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-sm text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
