'use client'

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const configs = {
  success: { icon: CheckCircle2, color: "var(--green)",  bg: "var(--green-dim)"  },
  error:   { icon: XCircle,      color: "var(--red)",    bg: "var(--red-dim)"    },
  warning: { icon: AlertTriangle,color: "var(--yellow)", bg: "var(--yellow-dim)" },
  info:    { icon: Info,         color: "var(--primary)",bg: "var(--primary-dim)" },
};

function Toast({ message, type = "success", duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const { icon: Icon, color } = configs[type];

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl min-w-[280px] max-w-sm"
      style={{
        background: "var(--background-2)",
        border: `1px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px var(--border)`,
        animation: visible ? "slide-in-left 0.3s ease" : "fade-in-fast 0.3s ease reverse",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(20px)",
        transition: "opacity 0.3s, transform 0.3s",
      }}
    >
      <Icon className="h-5 w-5 shrink-0" style={{ color }} />
      <p className="text-sm flex-1" style={{ color: "var(--foreground)" }}>{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        className="rounded-md p-1 transition-colors"
        style={{ color: "var(--foreground-dim)" }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Toast Context
interface ToastItem { id: string; message: string; type: ToastType; }
const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {mounted && createPortal(
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[9999]">
          {toasts.map(t => (
            <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
