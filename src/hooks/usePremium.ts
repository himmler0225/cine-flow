import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { isPremiumPlan, watchPartyHours } from "@/constants/premium";

export function usePremium() {
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isPremium = useMemo(() => isPremiumPlan(profile?.plan), [profile?.plan]);
  const partyHours = useMemo(() => watchPartyHours(profile?.plan), [profile?.plan]);

  const upgradeDemo = async () => {
    await updateProfile({ plan: "premium" });
  };

  return { isPremium, partyHours, upgradeDemo, isAuthenticated, profile };
}
