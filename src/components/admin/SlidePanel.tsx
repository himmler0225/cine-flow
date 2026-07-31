import { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}

export function SlidePanel({ open, onClose, title, children, width = 480 }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[61] flex w-full flex-col border-l border-white/10 bg-zinc-950 shadow-2xl transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ maxWidth: width }}
      >
        <header className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="min-w-0 flex-1 text-sm font-semibold text-white">{title}</div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </>
  );
}
