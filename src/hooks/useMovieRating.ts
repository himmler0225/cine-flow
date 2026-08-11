import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { ratingsApi } from "@/services/platform/ratings.service";
import { useAuthStore } from "@/store/authStore";
import { useRatingStore } from "@/store/ratingStore";
import { CACHE_TTL } from "@/constants/timing";

const ratingKeys = {
  aggregate: (slug: string) => ["ratings", "aggregate", slug] as const,
  user: (userId: string, slug: string) => ["ratings", "user", userId, slug] as const,
};

type Aggregate = {
  average: number;
  count: number;
};

export function useMovieRating(slug: string) {
  const userId = useAuthStore((s) => s.user?.id);

  const requestAuth = useAuthStore((s) => s.requestAuth);

  const localScore = useRatingStore((s) => s.ratings[slug] ?? null);

  const setLocal = useRatingStore((s) => s.set);

  const qc = useQueryClient();

  const aggregateQuery = useQuery({
    queryKey: ratingKeys.aggregate(slug),
    queryFn: () => ratingsApi.fetchAggregate(slug),
    staleTime: CACHE_TTL.twoMinutes,
  });

  const userQuery = useQuery({
    queryKey: ratingKeys.user(userId ?? "", slug),
    queryFn: () => ratingsApi.fetchUserRating(slug),
    enabled: !!userId,
    staleTime: CACHE_TTL.minute,
  });

  const mutation = useMutation({
    mutationFn: async (score: number) => {
      if (!userId) {
        setLocal(slug, score);

        return;
      }

      await ratingsApi.upsert(slug, score);
    },
    onMutate: async (score: number) => {
      if (!userId) return { prevUser: null, prevAgg: null };

      const userKey = ratingKeys.user(userId, slug);

      const aggKey = ratingKeys.aggregate(slug);

      await qc.cancelQueries({ queryKey: userKey });

      await qc.cancelQueries({ queryKey: aggKey });

      const prevUser = qc.getQueryData<number | null>(userKey) ?? null;

      const prevAgg = qc.getQueryData<Aggregate>(aggKey) ?? null;

      qc.setQueryData<number | null>(userKey, score);

      if (prevAgg) {
        const isNew = prevUser == null;

        const count = isNew ? prevAgg.count + 1 : prevAgg.count;

        const total = prevAgg.average * prevAgg.count - (prevUser ?? 0) + score;

        const average = count > 0 ? total / count : 0;

        qc.setQueryData<Aggregate>(aggKey, { average, count });
      }

      return { prevUser, prevAgg };
    },
    onError: (_err, _score, ctx) => {
      if (!userId || !ctx) return;

      qc.setQueryData(ratingKeys.user(userId, slug), ctx.prevUser);

      if (ctx.prevAgg) qc.setQueryData(ratingKeys.aggregate(slug), ctx.prevAgg);

      toast.error(t("toast.ratingFailed"));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ratingKeys.aggregate(slug) });

      if (userId) {
        void qc.invalidateQueries({ queryKey: ratingKeys.user(userId, slug) });
      }
    },
  });

  const userScore = userId ? (userQuery.data ?? null) : localScore;

  const rate = (score: number): Promise<void> => {
    if (!userId) {
      setLocal(slug, score);

      return Promise.resolve();
    }

    return mutation.mutateAsync(score);
  };

  const rateOrLogin = (score: number) => {
    if (!userId) {
      requestAuth("login");

      return;
    }

    return rate(score);
  };

  return {
    average: aggregateQuery.data?.average ?? 0,
    count: aggregateQuery.data?.count ?? 0,
    userScore,
    rate,
    rateOrLogin,
    isLoading: aggregateQuery.isLoading,
    isSubmitting: mutation.isPending,
  };
}
