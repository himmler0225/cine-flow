import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Film } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MovieRow } from "@/components/movie/MovieRow";
import { MovieComments } from "@/components/movie/MovieComments";
import { EpisodeList } from "@/components/player/EpisodeList";
import { useAuthStore } from "@/store/authStore";
import { getYoutubeEmbed } from "@/utils/youtube";

import type { MovieDetailTabsProps } from "@/types/movieDetail";
import { getDefaultDetailTab } from "@/types/movieDetail";

export function MovieDetailTabs({
  slug,
  movie,
  episodes,
  related,
  relatedLoading,
  progressByEpisode,
}: MovieDetailTabsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [serverIdx, setServerIdx] = useState(0);
  const [episodeIdx, setEpisodeIdx] = useState(0);

  const trailerEmbed = movie.trailer_url ? getYoutubeEmbed(movie.trailer_url) : null;
  const defaultTab = getDefaultDetailTab(episodes, !!trailerEmbed);
  const episodeNames = episodes[0]?.server_data.map((e) => e.name) ?? [];

  const tabTriggerClass =
    "shrink-0 snap-start rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-netflix-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-netflix-red data-[state=active]:border-netflix-red data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none";

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: 0.05 }}
      className="relative z-10 border-t border-white/10 bg-netflix-black"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-12">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="scrollbar-hide -mx-4 mb-8 flex h-auto w-[calc(100%+2rem)] snap-x snap-mandatory flex-nowrap justify-start gap-0 overflow-x-auto rounded-none border-b border-white/10 bg-transparent px-4 pb-px md:mx-0 md:w-full md:px-0">
            {episodes.length > 0 && (
              <TabsTrigger value="episodes" className={tabTriggerClass}>
                {t("movie.episodes", { count: episodes[0]?.server_data.length ?? 0 })}
              </TabsTrigger>
            )}
            {trailerEmbed && (
              <TabsTrigger value="trailer" className={tabTriggerClass}>
                {t("movie.trailer")}
              </TabsTrigger>
            )}
            <TabsTrigger value="cast" className={tabTriggerClass}>
              {t("movie.cast")}
            </TabsTrigger>
            <TabsTrigger value="similar" className={tabTriggerClass}>
              {t("movie.similar")}
            </TabsTrigger>
            {isAuthenticated && (
              <TabsTrigger value="comments" className={tabTriggerClass}>
                {t("movie.comments")}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="episodes" className="mt-0">
            {episodes.length > 0 ? (
              <EpisodeList
                servers={episodes}
                serverIdx={serverIdx}
                episodeIdx={episodeIdx}
                variant="tile"
                accent="soft"
                progressByEpisode={progressByEpisode}
                onSelect={(s, e) => {
                  setServerIdx(s);
                  setEpisodeIdx(e);
                  navigate({
                    to: "/watch/$slug",
                    params: { slug },
                    search: { tap: e + 1, server: s, fromStart: false },
                  });
                }}
              />
            ) : (
              <p className="text-sm text-netflix-muted">{t("movie.noEpisodes")}</p>
            )}
          </TabsContent>

          {trailerEmbed && (
            <TabsContent value="trailer" className="mt-0">
              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={trailerEmbed}
                    title={t("movie.trailerTitle", { name: movie.name })}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </TabsContent>
          )}

          <TabsContent value="cast" className="mt-0">
            <div className="space-y-6 text-sm">
              {movie.director?.filter(Boolean).length ? (
                <div>
                  <h3 className="mb-2 font-semibold text-white">{t("movie.director")}</h3>
                  <p className="text-netflix-text/90">
                    {movie.director.filter(Boolean).join(", ")}
                  </p>
                </div>
              ) : null}
              {movie.actor?.filter(Boolean).length ? (
                <div>
                  <h3 className="mb-3 font-semibold text-white">{t("movie.actors")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.actor.filter(Boolean).map((a) => (
                      <span
                        key={a}
                        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {movie.country?.length ? (
                <div>
                  <h3 className="mb-2 font-semibold text-white">{t("movie.country")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.country.map((c) => (
                      <Link
                        key={c.slug}
                        to="/country/$slug"
                        params={{ slug: c.slug }}
                        className="rounded-full border border-white/15 px-3 py-1 text-white hover:border-netflix-red"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              {!movie.director?.length && !movie.actor?.length && (
                <div className="flex flex-col items-center gap-2 py-12 text-netflix-muted">
                  <Film className="h-10 w-10 opacity-40" />
                  <p>{t("movie.noCastInfo")}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="similar" className="mt-0">
            <MovieRow
              title={t("movie.youMayLike")}
              movies={related?.filter((m) => m.slug !== slug)}
              isLoading={relatedLoading}
            />
          </TabsContent>

          {isAuthenticated && (
            <TabsContent value="comments" className="mt-0">
              <MovieComments
                slug={slug}
                movieName={movie.name}
                episodeOptions={episodeNames.length > 1 ? episodeNames : undefined}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </motion.section>
  );
}
