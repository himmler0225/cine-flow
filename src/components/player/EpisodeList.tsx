import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { EpisodeServer } from "@/types/movie";
import { cn } from "@/lib/utils";

export interface EpisodeProgressInfo {
  ratio: number;
  finished: boolean;
}

interface Props {
  servers: EpisodeServer[];
  serverIdx: number;
  episodeIdx: number;
  onSelect: (s: number, e: number) => void;
  progressByEpisode?: Record<string, EpisodeProgressInfo>;
  serverLayout?: "wrap" | "stack";
  hideEpisodeHeading?: boolean;
  accent?: "primary" | "soft";
  variant?: "compact" | "tile";
}

function parseEpisodeNumber(name: string): string | null {
  const m = name.match(/^t(?:ập|ap)\s*0*(\d+)$/i);

  if (!m) return null;

  return m[1].padStart(2, "0");
}

export function EpisodeList({
  servers,
  serverIdx,
  episodeIdx,
  onSelect,
  progressByEpisode,
  serverLayout = "wrap",
  hideEpisodeHeading = false,
  accent = "primary",
  variant = "compact",
}: Props) {
  const { t } = useTranslation();

  const listRef = useRef<HTMLDivElement>(null);

  // Long series: keep the current episode in view inside the list (scrolls the list only,
  // never the page — scrollIntoView would also move the page on phones).
  useEffect(() => {
    const list = listRef.current;

    const active = list?.querySelector<HTMLElement>('[aria-current="true"]');

    if (!list || !active || list.scrollHeight <= list.clientHeight) return;

    const top = active.offsetTop;

    const bottom = top + active.offsetHeight;

    if (top >= list.scrollTop && bottom <= list.scrollTop + list.clientHeight) return;

    list.scrollTo({ top: Math.max(0, top - list.clientHeight / 2 + active.offsetHeight / 2) });
  }, [serverIdx, episodeIdx]);

  if (!servers?.length) return null;

  const stacked = serverLayout === "stack";

  const soft = accent === "soft";

  const tile = variant === "tile";

  const serverActive = soft
    ? "border border-netflix-red/60 bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(229,9,20,0.15)]"
    : "bg-netflix-red text-white";

  const serverIdle = soft
    ? "border border-white/10 bg-white/[0.04] text-netflix-text hover:border-white/25 hover:bg-white/[0.08]"
    : "bg-white/10 text-netflix-text hover:bg-white/20";

  const episodeActive = soft
    ? "border-netflix-red/70 bg-white/10 text-white ring-1 ring-netflix-red/25"
    : "border-netflix-red bg-netflix-red text-white";

  const episodeIdle =
    "border-white/10 bg-white/5 text-netflix-text hover:border-white/30 hover:bg-white/10";

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-netflix-muted">
          {t("movie.selectServerPlay")}
        </p>
        <div
          className={cn("flex gap-2", stacked ? "flex-col" : "flex-wrap items-stretch")}
          role="tablist"
          aria-label={t("movie.selectServerPlay")}
        >
          {servers.map((s, i) => (
            <button
              key={s.server_name + i}
              onClick={() => onSelect(i, 0)}
              role="tab"
              aria-selected={i === serverIdx}
              className={cn(
                "min-h-9 rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red/50",
                stacked ? "w-full text-left" : "py-1.5",
                i === serverIdx ? serverActive : serverIdle,
              )}
            >
              {s.server_name}
            </button>
          ))}
        </div>
      </div>

      <div>
        {!hideEpisodeHeading && (
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-netflix-muted">
            {t("movie.episodeList")}
          </p>
        )}
        <div
          ref={listRef}
          className={cn(
            "relative grid gap-2 overflow-y-auto pr-1",
            tile
              ? "max-h-[min(56vh,560px)] grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2.5"
              : stacked
                ? "max-h-[min(52vh,520px)] grid-cols-4 sm:grid-cols-5"
                : "max-h-[60vh] grid-cols-4 sm:grid-cols-5 md:grid-cols-4 xl:grid-cols-5",
          )}
          role="list"
          aria-label={t("movie.episodeList")}
        >
          {servers[serverIdx]?.server_data.map((ep, i) => {
            const prog = progressByEpisode?.[ep.name];

            const ratio = prog ? Math.min(1, Math.max(0, prog.ratio)) : 0;

            const showBar = ratio > 0.01 && !prog?.finished;

            const epNum = tile ? parseEpisodeNumber(ep.name) : null;

            return (
              <button
                key={ep.slug + i}
                onClick={() => onSelect(serverIdx, i)}
                aria-current={i === episodeIdx ? "true" : undefined}
                aria-label={`${ep.name}${i === episodeIdx ? t("player.nowPlaying") : ""}${prog?.finished ? " · đã xem xong" : ""}${showBar ? ` · đã xem ${Math.round(ratio * 100)}%` : ""}`}
                className={cn(
                  "relative overflow-hidden rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red/50",
                  tile ? "min-h-[3.25rem] px-2 py-1.5" : "min-h-9 px-2 py-2 text-xs font-medium",
                  i === episodeIdx ? episodeActive : episodeIdle,
                )}
              >
                {tile && epNum ? (
                  <span className="flex flex-col items-center justify-center leading-tight">
                    <span
                      className={cn(
                        "text-[9px] font-semibold uppercase tracking-widest",
                        i === episodeIdx ? "text-white/80" : "text-netflix-muted",
                      )}
                    >
                      {t("movie.episodeTileLabel")}
                      {prog?.finished && (
                        <span
                          aria-hidden
                          className={cn(
                            "ml-1",
                            i === episodeIdx ? "text-white" : "text-emerald-400",
                          )}
                        >
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="text-base font-bold">{epNum}</span>
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex items-center justify-center gap-1",
                      tile && "min-h-[2.25rem] text-xs font-semibold",
                    )}
                  >
                    {ep.name}
                    {prog?.finished && (
                      <span
                        aria-hidden
                        className={cn(
                          "ml-0.5 text-[10px]",
                          i === episodeIdx ? "text-white" : "text-emerald-400",
                        )}
                      >
                        ✓
                      </span>
                    )}
                  </span>
                )}
                {showBar && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute bottom-0 left-0 h-[3px] transition-all",
                      i === episodeIdx ? "bg-white/80" : "bg-netflix-red",
                    )}
                    style={{ width: `${ratio * 100}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
