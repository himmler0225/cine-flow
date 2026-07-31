import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function TopProgress() {
  const status = useRouterState({ select: (s) => s.status });
  const isLoading = status === "pending";
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    let raf: number;
    let hideT: number;
    if (isLoading) {
      setVisible(true);
      setWidth(10);
      const tick = () => {
        setWidth((w) => (w < 85 ? w + (90 - w) * 0.08 : w));
        raf = window.requestAnimationFrame(tick);
      };
      raf = window.requestAnimationFrame(tick);
    } else if (visible) {
      setWidth(100);
      hideT = window.setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 250);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (hideT) clearTimeout(hideT);
    };
  }, [isLoading]);
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 bg-transparent">
      <div
        className="h-full bg-netflix-red shadow-[0_0_10px_rgba(229,9,20,0.8)] transition-[width] duration-150 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
