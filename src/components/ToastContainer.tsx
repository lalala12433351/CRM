import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, ToastItem } from '../context/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <aside 
      aria-label="Notifications"
      className="fixed top-4 right-3 sm:right-6 z-[999999] flex flex-col space-y-2.5 max-w-[calc(100vw-24px)] w-[380px] pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </aside>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';
  const isInfo = toast.type === 'info';

  const typeConfig = {
    success: {
      bg: 'bg-emerald-50/95 border-emerald-200/90 text-emerald-950',
      iconBg: 'bg-emerald-500 text-white',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      icon: CheckCircle2,
      defaultTitle: 'Success'
    },
    error: {
      bg: 'bg-rose-50/95 border-rose-200/90 text-rose-950',
      iconBg: 'bg-rose-500 text-white',
      badgeBg: 'bg-rose-100 text-rose-800',
      icon: AlertCircle,
      defaultTitle: 'Error'
    },
    warning: {
      bg: 'bg-amber-50/95 border-amber-200/90 text-amber-950',
      iconBg: 'bg-amber-500 text-white',
      badgeBg: 'bg-amber-100 text-amber-800',
      icon: AlertTriangle,
      defaultTitle: 'Attention'
    },
    info: {
      bg: 'bg-indigo-50/95 border-indigo-200/90 text-indigo-950',
      iconBg: 'bg-indigo-600 text-white',
      badgeBg: 'bg-indigo-100 text-indigo-800',
      icon: Info,
      defaultTitle: 'Update'
    }
  };

  const config = typeConfig[toast.type] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      className={`pointer-events-auto rounded-2xl border shadow-xl backdrop-blur-md p-3.5 flex items-start space-x-3 transition-all animate-in fade-in slide-in-from-top-3 duration-200 select-none ${config.bg}`}
    >
      {/* Icon Badge */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${config.iconBg}`}>
        <IconComponent className="w-4.5 h-4.5 stroke-[2.2]" />
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 pr-1 text-xs font-sans">
        <div className="flex items-center space-x-1.5 mb-0.5">
          <span className="font-bold tracking-tight text-[13px]">
            {toast.title || config.defaultTitle}
          </span>
        </div>
        <p className="text-[12px] opacity-90 leading-snug font-normal break-words">
          {toast.message}
        </p>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer shrink-0"
        title="Dismiss Notification"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
