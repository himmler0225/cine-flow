import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-[420px] rounded-2xl border border-border bg-card p-8 shadow-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AuthBrand() {
  const { t } = useTranslation();
  return (
    <div className="mb-6 text-center">
      <div className="flex justify-center">
        <BrandLogo linked={false} imgClassName="h-11" textClassName="text-3xl" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("auth.tagline")}</p>
    </div>
  );
}
