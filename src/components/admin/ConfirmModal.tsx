import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmText,
  cancelText,
  danger = true,
  loading,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const resolvedConfirm = confirmText ?? t("admin.confirm");
  const resolvedCancel = cancelText ?? t("admin.cancel");
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) btnRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              danger ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>
        <p className="text-sm text-zinc-300">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/5 disabled:opacity-50"
          >
            {resolvedCancel}
          </button>
          <button
            ref={btnRef}
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 ${
              danger ? "bg-red-600 hover:bg-red-500" : "bg-netflix-red hover:bg-netflix-red-hover"
            }`}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {resolvedConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
