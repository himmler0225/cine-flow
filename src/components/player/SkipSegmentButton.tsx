import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ChevronsRight } from "lucide-react";
import type { ActiveSegment } from "@/hooks/player/useSkipMarkers";

interface Props {
  intro: ActiveSegment | null;
  outro: ActiveSegment | null;
  time: number;
  /** Changes per episode: auto-skip fires at most once per episode. */
  episodeKey: string;
  autoSkipIntro: boolean;
  hasNextEpisode: boolean;
  onSeek: (sec: number) => void;
  onNextEpisode?: () => void;
}

/** Shown in the last second of a segment it hides, so it never flickers over the cut. */
const EDGE_SEC = 1;

/** Netflix-style "Skip intro" / "Skip credits" button over the player. */
export function SkipSegmentButton({
  intro,
  outro,
  time,
  episodeKey,
  autoSkipIntro,
  hasNextEpisode,
  onSeek,
  onNextEpisode,
}: Props) {
  const { t } = useTranslation();

  const autoSkippedRef = useRef<string | null>(null);

  const inIntro = !!intro && time >= intro.start && time < intro.end - EDGE_SEC;

  const inOutro = !!outro && time >= outro.start && time < outro.end - EDGE_SEC;

  useEffect(() => {
    if (!autoSkipIntro || !inIntro || !intro) return;

    if (autoSkippedRef.current === episodeKey) return;

    // Only on the way in: someone rewinding into the intro on purpose stays there.
    if (time - intro.start > 5) return;

    autoSkippedRef.current = episodeKey;

    onSeek(intro.end);

    toast.message(t("player.introSkipped"));
  }, [autoSkipIntro, inIntro, intro, episodeKey, time, onSeek, t]);

  if (!inIntro && !inOutro) return null;

  const skip = () => {
    if (inIntro && intro) {
      onSeek(intro.end);

      return;
    }

    if (inOutro && outro) {
      if (hasNextEpisode && onNextEpisode) onNextEpisode();
      else onSeek(outro.end);
    }
  };

  return (
    <button
      type="button"
      onClick={skip}
      className="absolute bottom-24 right-3 z-30 inline-flex items-center gap-1.5 rounded-md bg-white/90 px-3.5 py-2 text-sm font-semibold text-black shadow-lg ring-1 ring-black/10 hover:bg-white sm:bottom-28 sm:right-4"
    >
      {inIntro
        ? t("player.skipIntro")
        : hasNextEpisode
          ? t("player.skipToNextEpisode")
          : t("player.skipOutro")}
      <ChevronsRight className="h-4 w-4" />
    </button>
  );
}
