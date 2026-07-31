import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Check, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { usePremium } from "@/hooks/usePremium";
import { useAuthStore } from "@/store/authStore";
import { getFreeFeatures, getPremiumFeatures } from "@/constants/premium";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [{ title: t("seo.premiumTitle") }],
  }),
  component: PremiumPage,
});

function PremiumPage() {
  const { t: tr } = useTranslation();
  const { isPremium, upgradeDemo, isAuthenticated } = usePremium();
  const requestAuth = useAuthStore((s) => s.requestAuth);
  const [upgrading, setUpgrading] = useState(false);
  const freeFeatures = getFreeFeatures();
  const premiumFeatures = getPremiumFeatures();
  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      requestAuth("login");
      return;
    }
    setUpgrading(true);
    try {
      await upgradeDemo();
      toast.success(tr("toast.premiumUpgraded"));
    } catch (e) {
      toast.error((e as Error).message || tr("toast.premiumFailed"));
    } finally {
      setUpgrading(false);
    }
  };
  return (
    <div className="relative min-h-screen overflow-hidden bg-netflix-black pt-24 pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(229,9,20,0.22),_transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-1/4 top-1/3 h-[50%] w-[50%] rounded-full bg-amber-500/10 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-3xl px-4 md:px-8">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <BrandLogo linked={false} imgClassName="h-9" textClassName="text-2xl" />
          </div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-netflix-red/15 ring-1 ring-netflix-red/40">
            <Crown className="h-7 w-7 text-amber-300" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            {tr("premium.brandTitle")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-netflix-muted">{tr("premium.subtitleLong")}</p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-netflix-dark/80 shadow-2xl shadow-black/40 backdrop-blur-md">
          <div className="border-b border-white/10 bg-gradient-to-r from-netflix-red/20 via-transparent to-amber-400/10 px-6 py-5 md:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  {tr("premium.premium")}
                </p>
                <p className="mt-1 text-3xl font-extrabold text-white">
                  {tr("premium.pricePremiumAmount")}
                </p>
                <p className="text-xs text-netflix-muted">{tr("premium.priceNote")}</p>
              </div>
              {isPremium ? (
                <span className="rounded bg-white/10 px-2.5 py-1 text-xs text-netflix-muted">
                  {tr("premium.currentPlan")}
                </span>
              ) : (
                <Button
                  onClick={() => void handleUpgrade()}
                  disabled={upgrading}
                  className="bg-netflix-red px-6 font-bold text-white hover:bg-netflix-red-hover"
                >
                  {upgrading ? tr("premium.processing") : tr("premium.upgradeDemo")}
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            <FeatureColumn
              title={tr("premium.free")}
              price={tr("premium.priceFreeAmount")}
              features={freeFeatures}
              muted
              current={!isPremium}
            />
            <FeatureColumn
              title={tr("premium.premium")}
              price={tr("premium.pricePremiumAmount")}
              features={premiumFeatures}
              current={isPremium}
              accent
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          {isPremium && <p className="text-amber-300">{tr("premium.usingPremium")}</p>}
          <p className="mt-2 text-xs text-netflix-muted">{tr("premium.mvpNote")}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-netflix-muted hover:text-white">
            {tr("premium.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureColumn({
  title,
  price,
  features,
  muted,
  accent,
  current,
}: {
  title: string;
  price: string;
  features: readonly string[];
  muted?: boolean;
  accent?: boolean;
  current?: boolean;
}) {
  const { t: tr } = useTranslation();
  return (
    <div
      className={cn(
        "p-6 md:p-8",
        accent ? "bg-white/[0.03]" : "border-b border-white/10 md:border-b-0 md:border-r",
        muted && "opacity-90",
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-sm text-netflix-muted">{price}</p>
        </div>
        {current && (
          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-netflix-muted">
            {tr("premium.currentPlan")}
          </span>
        )}
      </div>
      <ul className="space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-netflix-text/90">
            <Check
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                accent ? "text-netflix-red" : "text-netflix-muted",
              )}
            />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
