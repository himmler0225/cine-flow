import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { UI_DELAY_MS } from "@/constants/timing";
import { cn } from "@/lib/utils";

interface NavDropdownProps {
  label: string;
  active?: boolean;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  width?: string;
}

export function NavDropdown({
  label,
  active,
  children,
  align = "left",
  width = "min-w-[460px]",
}: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const scheduleOpen = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = window.setTimeout(() => setOpen(true), UI_DELAY_MS.navbarOpen);
  };
  const scheduleClose = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), UI_DELAY_MS.navbarClose);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative inline-flex items-center gap-1 whitespace-nowrap py-1 text-sm transition-colors hover:text-white",
          active
            ? "text-white after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-netflix-red"
            : "text-netflix-text/80",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute top-full z-50 mt-2 rounded-xl border border-gray-700/60 bg-gray-900/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-sm",
              width,
              align === "right" ? "right-0" : "left-0",
            )}
            role="menu"
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
