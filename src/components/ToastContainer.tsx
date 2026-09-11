import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast, ToastItem } from '../context/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <aside 
      aria-label="Notifications"
      className="fixed top-5 right-3 sm:right-6 z-[999999] flex flex-col space-y-2.5 max-w-[calc(100vw-24px)] w-[380px] pointer-events-none font-sans"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </aside>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const duration = toast.duration ?? 4000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration <= 0) return;
    const interval = 20;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, interval);

    return () => clearInterval(timer);
  }, [duration]);

  const typeConfig = {
    success: {
      cardBorder: 'border-emerald-200/80 hover:border-emerald-300',
      progressBar: 'bg-emerald-500',
      defaultTitle: 'Success'
    },
    error: {
      cardBorder: 'border-rose-200/80 hover:border-rose-300',
      progressBar: 'bg-rose-500',
      defaultTitle: 'Error'
    },
    warning: {
      cardBorder: 'border-amber-200/80 hover:border-amber-300',
      progressBar: 'bg-amber-500',
      defaultTitle: 'Attention'
    },
    info: {
      cardBorder: 'border-purple-200/80 hover:border-purple-300',
      progressBar: 'bg-[#5034a8]',
      defaultTitle: 'Notification'
    }
  };

  const config = typeConfig[toast.type] || typeConfig.info;

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border shadow-[0_10px_35px_-5px_rgba(0,0,0,0.12),0_4px_8px_-2px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-start space-x-3 transition-all duration-200 animate-in fade-in slide-in-from-top-3 select-none ${config.cardBorder}`}
    >
      {/* Message Body */}
      <div className="flex-1 min-w-0 pr-1 text-xs font-sans">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-bold text-slate-900 tracking-tight text-[13px]">
            {toast.title || config.defaultTitle}
          </span>
        </div>
        <p className="text-[12px] text-slate-600 font-normal leading-relaxed break-words">
          {toast.message}
        </p>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0 mt-0.5"
        title="Dismiss"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Subtle Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-100/80 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${config.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
