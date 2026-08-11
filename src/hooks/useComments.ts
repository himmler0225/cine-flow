import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isMissingColumnError } from "@/lib/schemaFlags";
import { commentsApi } from "@/services/platform/comments.service";
import { queryKeys } from "@/constants/queryKeys";
import { useAuthStore } from "@/store/authStore";
import { CACHE_TTL } from "@/constants/timing";

export interface UseCommentsOptions {
  episodeName?: string | null;
}

export function useComments(slug: string, options: UseCommentsOptions = {}) {
  const { episodeName } = options;

  const user = useAuthStore((s) => s.user);

  const requestAuth = useAuthStore((s) => s.requestAuth);

  const qc = useQueryClient();

  const queryKey = queryKeys.comments.byMovie(slug);

  const query = useQuery({
    queryKey,
    queryFn: () => commentsApi.fetchByMovie(slug),
    staleTime: CACHE_TTL.minute,
    retry: (count, err) => !isMissingColumnError(err) && count < 1,
  });

  const mutation = useMutation({
    mutationFn: async (input: { content: string; isSpoiler: boolean }) => {
      if (!user) {
        requestAuth("login");

        throw new Error("AUTH_REQUIRED");
      }

      await commentsApi.insert({
        userId: user.id,
        movieSlug: slug,
        content: input.content,
        isSpoiler: input.isSpoiler,
        episodeName: episodeName ?? null,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  return { ...query, submitComment: mutation.mutateAsync, isSubmitting: mutation.isPending };
}
