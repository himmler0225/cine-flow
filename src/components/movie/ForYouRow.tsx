import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MovieRow } from "@/components/movie/MovieRow";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import { recommendationsApi } from "@/services/platform/recommendations.service";
import { useAuthStore } from "@/store/authStore";

/** "For you": picks from the viewer's genres/countries; hidden until there's enough history. */
export function ForYouRow() {
  const { t } = useTranslation();

  const userId = useAuthStore((s) => (s.isAuthenticated ? s.user?.id : undefined));

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.recommendations.forUser(userId ?? ""),
    queryFn: () => recommendationsApi.forMe(),
    enabled: !!userId,
    staleTime: CACHE_TTL.thirtyMinutes,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  if (!userId) return null;

  if (!isLoading && (!data || data.items.length === 0)) return null;

  const basis = [...(data?.genres ?? []), ...(data?.countries ?? [])].join(", ");

  return (
    <MovieRow
      title={t("home.rows.forYou")}
      subtitle={basis ? t("home.rows.forYouBasis", { basis }) : undefined}
      movies={data?.items}
      isLoading={isLoading}
    />
  );
}
