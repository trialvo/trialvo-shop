/**
 * Global Toast system — zero-dependency, built with Tailwind.
 * Usage:
 *   const toast = useToast();
 *   toast.success("সফলভাবে সেভ হয়েছে!");
 *   toast.error("কিছু একটা সমস্যা হয়েছে।");
 *   toast.info("তথ্য লোড হচ্ছে...");
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

let _uid = 0;
const uid = () => ++_uid;

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    bar: "bg-emerald-500",
    icon_cls: "text-emerald-500",
    bg: "bg-white",
    border: "border-l-4 border-l-emerald-500",
  },
  error: {
    icon: XCircle,
    bar: "bg-red-500",
    icon_cls: "text-red-500",
    bg: "bg-white",
    border: "border-l-4 border-l-red-500",
  },
  warning: {
    icon: AlertTriangle,
    bar: "bg-amber-500",
    icon_cls: "text-amber-500",
    bg: "bg-white",
    border: "border-l-4 border-l-amber-500",
  },
  info: {
    icon: Info,
    bar: "bg-blue-500",
    icon_cls: "text-blue-500",
    bg: "bg-white",
    border: "border-l-4 border-l-blue-500",
  },
};

const DURATION = 3500; // ms

// ─── Single toast item ────────────────────────────────────────────────────────

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(dismiss, toast.duration ?? DURATION);
    return () => clearTimeout(timerRef.current);
  }, [dismiss, toast.duration]);

  const v = VARIANTS[toast.type] || VARIANTS.info;
  const Icon = v.icon;

  return (
    <div
      role="alert"
      className={`
        relative flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl
        border border-slate-100 shadow-xl px-4 py-3.5 overflow-hidden
        transition-all duration-300 ease-out
        ${v.bg} ${v.border}
        ${visible && !exiting ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
    >
      <Icon className={`mt-0.5 h-4.5 w-4.5 flex-shrink-0 ${v.icon_cls}`} />
      <p className="flex-1 text-sm font-medium text-[#0f172a] leading-relaxed">
        {toast.message}
      </p>
      <button
        onClick={dismiss}
        className="ml-1 flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${v.bar} animate-[shrink_var(--dur)_linear_forwards]`}
        style={{ "--dur": `${toast.duration ?? DURATION}ms` }}
      />
    </div>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2.5"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "info", duration) => {
    const id = uid();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, opts) => push(msg, "success", opts?.duration),
    error: (msg, opts) => push(msg, "error", opts?.duration),
    warning: (msg, opts) => push(msg, "warning", opts?.duration),
    info: (msg, opts) => push(msg, "info", opts?.duration),
    dismiss: remove,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export default ToastProvider;
