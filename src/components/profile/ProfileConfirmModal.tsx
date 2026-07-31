import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProfileConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ProfileConfirmModal({
  open,
  title,
  message,
  confirmText,
  onConfirm,
  onCancel,
}: ProfileConfirmModalProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl border border-white/10 bg-netflix-dark p-6"
          >
            <div className="mb-3 flex items-start gap-3">
              <div className="rounded-full bg-red-500/20 p-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm text-netflix-muted">{message}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onCancel}
                className="rounded-md border border-white/10 px-4 py-2 text-sm text-netflix-text hover:bg-white/5"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={onConfirm}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
