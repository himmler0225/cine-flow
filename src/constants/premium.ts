import { t } from "@/lib/i18n";
import { ROLE } from "@/constants/roles";

export const PREMIUM_PLAN = ROLE.PREMIUM;

export function getPremiumFeatures(): string[] {
  return [
    t("premium.features.watchParty12h"),
    t("premium.features.privatePin"),
    t("premium.features.badge"),
    t("premium.features.skipAds"),
  ];
}

export function getFreeFeatures(): string[] {
  return [
    t("premium.features.unlimited"),
    t("premium.features.watchParty6h"),
    t("premium.features.favoritesHistory"),
  ];
}

export function isPremiumPlan(plan: string | null | undefined): boolean {
  return plan === PREMIUM_PLAN;
}

export function watchPartyHours(plan: string | null | undefined): number {
  return isPremiumPlan(plan) ? 12 : 6;
}
