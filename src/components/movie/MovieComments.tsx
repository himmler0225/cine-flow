import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useComments } from "@/hooks/useComments";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/i18n";
import { getUserInitial } from "@/lib/userDisplay";

interface MovieCommentsProps {
  slug: string;
  movieName: string;
  episodeName?: string | null;
  episodeOptions?: string[];
  className?: string;
}

export function MovieComments({
  slug,
  movieName,
  episodeName,
  episodeOptions,
  className,
}: MovieCommentsProps) {
  const { t, i18n } = useTranslation();

  const [content, setContent] = useState("");

  const [spoiler, setSpoiler] = useState(false);

  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(() => new Set());

  const [episodeFilter, setEpisodeFilter] = useState<string | null>(episodeName ?? null);

  const activeEpisode = episodeName ?? episodeFilter;

  const {
    data: allComments = [],
    isLoading,
    submitComment,
    isSubmitting,
  } = useComments(slug, {
    episodeName: activeEpisode,
  });

  const comments = useMemo(() => {
    if (!activeEpisode) return allComments;

    if (episodeName) {
      return allComments.filter((c) => c.episode_name === activeEpisode);
    }

    return allComments.filter((c) => !c.episode_name || c.episode_name === activeEpisode);
  }, [allComments, activeEpisode, episodeName]);

  const placeholder = activeEpisode
    ? t("movie.commentPlaceholderEpisode", { episode: activeEpisode, movie: movieName })
    : t("movie.commentPlaceholderMovie", { movie: movieName });

  const submit = async () => {
    const text = content.trim();

    if (text.length < 2) {
      toast.error(t("toast.commentTooShort"));

      return;
    }

    try {
      await submitComment({ content: text, isSpoiler: spoiler });

      setContent("");

      setSpoiler(false);

      toast.success(t("toast.commentSent"));
    } catch (e) {
      if ((e as Error).message === "AUTH_REQUIRED") return;

      toast.error((e as Error).message || t("toast.commentFailed"));
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {episodeOptions && episodeOptions.length > 0 && !episodeName && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-netflix-muted">{t("movie.filterByEpisode")}</span>
          <button
            type="button"
            onClick={() => setEpisodeFilter(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs transition-colors",
              episodeFilter == null
                ? "bg-netflix-red text-white"
                : "bg-white/10 text-netflix-muted hover:bg-white/15",
            )}
          >
            {t("common.all")}
          </button>
          {episodeOptions.slice(0, 12).map((ep) => (
            <button
              key={ep}
              type="button"
              onClick={() => setEpisodeFilter(ep)}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors",
                episodeFilter === ep
                  ? "bg-netflix-red text-white"
                  : "bg-white/10 text-netflix-muted hover:bg-white/15",
              )}
            >
              {ep}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-md border border-white/10 bg-black/40 px-3 py-2 text-base sm:text-sm text-white placeholder:text-netflix-muted focus:border-netflix-red focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-netflix-muted">
            <input
              type="checkbox"
              checked={spoiler}
              onChange={(e) => setSpoiler(e.target.checked)}
              className="rounded border-white/20"
            />
            {t("movie.containsSpoiler")}
          </label>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void submit()}
            className="inline-flex items-center gap-1.5 rounded bg-netflix-red px-4 py-1.5 text-sm font-semibold text-white hover:bg-netflix-red-hover disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> {t("movie.sendComment")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-netflix-muted">
          <MessageSquare className="h-10 w-10 opacity-40" />
          <p className="text-sm">
            {activeEpisode
              ? t("movie.noCommentsEpisode", { episode: activeEpisode })
              : t("movie.noCommentsFirst")}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-white/5 bg-black/30 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-netflix-red text-xs font-bold text-white">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getUserInitial(c.username)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-white">{c.username}</span>
                    <span className="text-xs text-netflix-muted">
                      {formatRelativeTime(c.created_at, i18n.language)}
                    </span>
                    {c.episode_name && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-netflix-muted">
                        {c.episode_name}
                      </span>
                    )}
                    {c.is_spoiler && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                        {t("movie.spoiler")}
                      </span>
                    )}
                  </div>
                  {c.is_spoiler && !revealedSpoilers.has(c.id) ? (
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedSpoilers((prev) => {
                          const next = new Set(prev);

                          next.add(c.id);

                          return next;
                        })
                      }
                      className="group relative mt-1 w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red"
                    >
                      <p className="select-none text-sm text-netflix-text/90 blur-sm" aria-hidden>
                        {c.content}
                      </p>
                      <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40 text-xs font-medium text-white backdrop-blur-[1px] transition-colors group-hover:bg-black/50">
                        {t("movie.revealSpoiler")}
                      </span>
                    </button>
                  ) : (
                    <p className="mt-1 text-sm text-netflix-text/90">{c.content}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
