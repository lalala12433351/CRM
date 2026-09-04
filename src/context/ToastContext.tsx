import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Global event bus for non-React callers
type ToastListener = (toast: Omit<ToastItem, 'id'>) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  show: (message: string, type: ToastType = 'info', title?: string, duration?: number) => {
    listeners.forEach((listener) => listener({ message, type, title, duration }));
  },
  success: (message: string, title?: string, duration?: number) => {
    listeners.forEach((listener) => listener({ message, type: 'success', title, duration }));
  },
  error: (message: string, title?: string, duration?: number) => {
    listeners.forEach((listener) => listener({ message, type: 'error', title, duration }));
  },
  warning: (message: string, title?: string, duration?: number) => {
    listeners.forEach((listener) => listener({ message, type: 'warning', title, duration }));
  },
  info: (message: string, title?: string, duration?: number) => {
    listeners.forEach((listener) => listener({ message, type: 'info', title, duration }));
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration: number = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, title?: string, dur?: number) => showToast(msg, 'success', title, dur), [showToast]);
  const error = useCallback((msg: string, title?: string, dur?: number) => showToast(msg, 'error', title, dur || 5000), [showToast]);
  const warning = useCallback((msg: string, title?: string, dur?: number) => showToast(msg, 'warning', title, dur), [showToast]);
  const info = useCallback((msg: string, title?: string, dur?: number) => showToast(msg, 'info', title, dur), [showToast]);

  // Subscribe to global singleton
  React.useEffect(() => {
    const handler: ToastListener = (t) => {
      showToast(t.message, t.type, t.title, t.duration);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, warning, info }}>
      {children}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback using global singleton if outside provider
    return {
      toasts: [],
      showToast: toast.show,
      removeToast: () => {},
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info
    };
  }
  return context;
}
