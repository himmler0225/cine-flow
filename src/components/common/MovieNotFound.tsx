import { Link } from "@tanstack/react-router";
import { Film, Home, Search, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type Props = {
  slug?: string;
  title?: string;
  message?: string;
};

export function MovieNotFound({ slug, title, message }: Props) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-24 pb-12">
      {/* Backdrop glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-netflix-red/20 blur-[140px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-netflix-black/40 to-netflix-black" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-netflix-red to-red-700 shadow-2xl shadow-netflix-red/40 ring-1 ring-white/10">
          <Film className="h-10 w-10 text-white" />
        </div>

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-netflix-red">
          {t("movie.notFound404")}
        </p>
        <h1 className="text-shadow-hero text-3xl font-extrabold tracking-tight text-white md:text-5xl">
          {title ?? t("movie.notFoundTitleAlt")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-netflix-muted md:text-base">
          {message ?? t("movie.notFoundLongDesc")}
        </p>

        {slug && (
          <p className="mt-3 inline-block rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-netflix-muted">
            /movie/{slug}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-netflix-red text-white shadow-lg shadow-netflix-red/30 hover:bg-red-700"
          >
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> {t("movie.backHome")}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10"
          >
            <Link to="/search">
              <Search className="mr-2 h-4 w-4" /> {t("movie.searchOther")}
            </Link>
          </Button>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-sm text-netflix-muted transition-colors hover:text-white"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> {t("common.back")}
          </button>
        </div>
      </div>
    </div>
  );
}
