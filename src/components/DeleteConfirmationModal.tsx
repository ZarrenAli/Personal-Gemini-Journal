import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  entryTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  entryTitle,
  onCancel,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="delete-confirmation-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto p-2.5 sm:p-4 md:p-6 bg-[#0F172A]/80 backdrop-blur-xl animate-fade-in flex flex-col justify-start sm:justify-center items-center"
      onClick={onCancel}
    >
      <div
        id="delete-confirmation-dialog"
        className="my-auto mx-auto w-full max-w-md rounded-2xl bg-[#0F172A]/90 border border-[#E6C7C2]/20 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl text-slate-100 space-y-4 sm:space-y-5 max-h-[calc(100dvh-1.25rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 font-serif">
                Are you sure you want to delete this reflection?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            id="cancel-delete-x-btn"
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {entryTitle && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 font-sans italic line-clamp-2">
            "{entryTitle}"
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="cancel-delete-modal-btn"
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-modal-btn"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 border border-rose-500/40 shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            {isDeleting ? (
              <span>Deleting...</span>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
