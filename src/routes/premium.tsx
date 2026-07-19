import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Check, Crown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";
import { useAuthStore } from "@/store/authStore";
import { t } from "@/lib/i18n";

const FREE_FEATURE_KEYS = [
  "premium.features.unlimited",
  "premium.features.watchParty6h",
  "premium.features.favoritesHistory",
  "premium.features.aiKira",
] as const;

const PREMIUM_FEATURE_KEYS = [
  "premium.features.watchParty12h",
  "premium.features.privatePin",
  "premium.features.badge",
  "premium.features.noAds",
] as const;

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
    <div className="min-h-screen bg-netflix-black pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="text-center">
          <Crown className="mx-auto h-12 w-12 text-amber-400" />
          <h1 className="mt-4 text-3xl font-extrabold text-white md:text-4xl">
            {tr("premium.brandTitle")}
          </h1>
          <p className="mt-2 text-netflix-muted">{tr("premium.subtitleLong")}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <PlanCard
            title={tr("premium.free")}
            price={tr("premium.priceFreeAmount")}
            features={FREE_FEATURE_KEYS.map((key) => tr(key))}
            current={!isPremium}
          />
          <PlanCard
            title={tr("premium.premium")}
            price={tr("premium.pricePremiumAmount")}
            priceNote={tr("premium.priceNote")}
            features={PREMIUM_FEATURE_KEYS.map((key) => tr(key))}
            highlight
            current={isPremium}
          />
        </div>

        <div className="mt-8 text-center">
          {isPremium ? (
            <p className="text-amber-400">{tr("premium.usingPremium")}</p>
          ) : (
            <Button
              onClick={() => void handleUpgrade()}
              disabled={upgrading}
              className="bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-6 text-lg font-bold text-black hover:from-amber-400 hover:to-amber-500"
            >
              {upgrading ? tr("premium.processing") : tr("premium.upgradeDemo")}
            </Button>
          )}
          <p className="mt-3 text-xs text-netflix-muted">{tr("premium.mvpNote")}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-netflix-muted hover:text-white">
            {tr("premium.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  title,
  price,
  priceNote,
  features,
  highlight,
  current,
}: {
  title: string;
  price: string;
  priceNote?: string;
  features: readonly string[];
  highlight?: boolean;
  current?: boolean;
}) {
  const { t: tr } = useTranslation();

  return (
    <div
      className={`rounded-xl border p-6 ${
        highlight
          ? "border-amber-400/40 bg-gradient-to-b from-amber-400/10 to-transparent"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {current && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-netflix-muted">
            {tr("premium.currentPlan")}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-white">{price}</p>
      {priceNote && <p className="text-xs text-netflix-muted">{priceNote}</p>}
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-netflix-text/90">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
