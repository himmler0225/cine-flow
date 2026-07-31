import { useState } from "react";
import { Film } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getYoutubeEmbed } from "@/utils/youtube";

interface Props {
  trailerUrl: string;
  movieName: string;
  className: string;
}

export function TrailerButton({ trailerUrl, movieName, className }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const embed = getYoutubeEmbed(trailerUrl);

  if (!embed) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Film className="h-5 w-5" />
        {t("movie.watchTrailer")}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl border-white/10 bg-[#1a1a1a] p-0 text-white">
          <DialogTitle className="sr-only">
            {t("movie.trailerTitle", { name: movieName })}
          </DialogTitle>
          {open && (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                src={`${embed}?autoplay=1`}
                title={t("movie.trailerTitle", { name: movieName })}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
