import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-[420px] rounded-2xl border border-white/10 bg-netflix-dark/90 p-8 shadow-2xl shadow-black/50 backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AuthBrand() {
  return (
    <div className="mb-6 text-center">
      <div className="flex justify-center">
        <BrandLogo linked={false} imgClassName="h-11" textClassName="text-3xl" />
      </div>
    </div>
  );
}

export function AuthCinematicFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden bg-netflix-black px-4 py-12",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 40%, rgba(229,9,20,0.12) 50%, transparent 60%), repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-0 h-[70%] w-[70%] rounded-full bg-netflix-red/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-1/4 bottom-0 h-[55%] w-[55%] rounded-full bg-red-900/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/70 to-netflix-black/40"
      />
      <div className="relative z-10 w-full max-w-[420px]">{children}</div>
    </div>
  );
}
