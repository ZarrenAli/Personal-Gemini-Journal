import React, { useEffect } from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type?: 'success' | 'info' | 'error';
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      id="toast-notification-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          id={`toast-${toast.id}`}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0F172A]/90 border border-[#A3B18A]/30 text-slate-100 shadow-xl backdrop-blur-2xl transition-all duration-300 animate-slide-up"
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-[#B0A8B9] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#A3B18A] shrink-0" />
          )}

          <span className="text-xs font-medium text-slate-200 flex-1">{toast.message}</span>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
