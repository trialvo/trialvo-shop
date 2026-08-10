import { X } from "lucide-react";

/**
 * Modal — accessible modal dialog with backdrop blur.
 *
 * Usage:
 *   <Modal open={!!editing} onClose={() => setEditing(null)} title="এডিট করুন" size="md">
 *     {form content}
 *   </Modal>
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md", // 'sm' | 'md' | 'lg' | 'xl'
  footer,
}) {
  if (!open) return null;

  const widths = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className={`relative z-10 w-full ${widths[size] || widths.md} bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <h2 className="text-sm font-bold text-[#0f172a]">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="px-6 pb-5 pt-0 flex justify-end gap-2 border-t border-slate-50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
