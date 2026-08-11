import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { isPremiumPlan, watchPartyHours } from "@/constants/premium";
import { profilesApi } from "@/services/platform/profiles.service";

export function usePremium() {
  const user = useAuthStore((s) => s.user);

  const profile = useAuthStore((s) => s.profile);

  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isPremium = useMemo(() => isPremiumPlan(profile?.plan), [profile?.plan]);

  const partyHours = useMemo(() => watchPartyHours(profile?.plan), [profile?.plan]);

  const upgradeDemo = async () => {
    await profilesApi.upgradeToPremium();

    if (user) await fetchProfile(user.id);
  };

  return { isPremium, partyHours, upgradeDemo, isAuthenticated, profile };
}
