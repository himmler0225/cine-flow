import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Search, Home, PartyPopper, Film, Clock } from "lucide-react";

interface WatchPartyAuthGateProps {
  code: string;
  onLogin: () => void;
}

export function WatchPartyAuthGate({ code, onLogin }: WatchPartyAuthGateProps) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-netflix-black px-4 pt-16">
      <div className="max-w-sm rounded-lg border border-white/10 bg-white/5 p-6 text-center">
        <h2 className="text-lg font-bold text-white">{t("watchparty.loginToJoin")}</h2>
        <p className="mt-1 text-sm text-netflix-muted">
          {t("watchparty.loginToJoinDesc", { code })}
        </p>
        <button
          type="button"
          onClick={onLogin}
          className="mt-4 w-full rounded bg-netflix-red py-2 font-semibold text-white hover:bg-netflix-red-hover"
        >
          {t("watchparty.loginBtn")}
        </button>
      </div>
    </div>
  );
}

export function WatchPartyLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-netflix-black pt-20">
      <div className="mx-auto mt-8 aspect-video max-w-5xl rounded bg-white/5" />
    </div>
  );
}

interface WatchPartyNotFoundProps {
  code: string;
}

export function WatchPartyNotFound({ code }: WatchPartyNotFoundProps) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-netflix-black px-4 pt-20">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/[0.04] p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
          <Search className="h-7 w-7 text-netflix-muted" />
        </div>
        <h1 className="text-xl font-bold text-white">{t("watchparty.roomNotFound")}</h1>
        <p className="mt-1 text-sm text-netflix-muted">
          {t("watchparty.roomNotFoundDesc", { code })}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 rounded bg-netflix-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-netflix-red-hover"
          >
            <Search className="h-4 w-4" /> {t("watchparty.backToSearch")}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded border border-white/15 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            <Home className="h-4 w-4" /> {t("common.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

interface WatchPartyExpiredProps {
  code: string;
  movieSlug: string;
  movieName?: string | null;
}

export function WatchPartyExpired({ code, movieSlug, movieName }: WatchPartyExpiredProps) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-netflix-black px-4 pt-20">
      <div className="w-full max-w-md rounded-xl border border-amber-400/30 bg-amber-400/[0.04] p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/30">
          <Clock className="h-7 w-7 text-amber-300" />
        </div>
        <h1 className="text-xl font-bold text-white">{t("watchparty.roomExpiredTitle")}</h1>
        <p className="mt-1 text-sm text-netflix-muted">
          {t("watchparty.roomExpiredDesc", { code })}
        </p>
        {movieName && (
          <p className="mt-2 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-white">
            <Film className="h-4 w-4 text-netflix-muted" />
            {movieName}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <Link
            to="/watch/$slug"
            params={{ slug: movieSlug }}
            search={{ tap: 1, server: 0 }}
            className="inline-flex items-center justify-center gap-2 rounded bg-netflix-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-netflix-red-hover"
          >
            <PartyPopper className="h-4 w-4" /> {t("watchparty.createNewRoom")}
          </Link>
          <Link
            to="/movie/$slug"
            params={{ slug: movieSlug }}
            className="inline-flex items-center justify-center gap-2 rounded border border-white/15 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            <Film className="h-4 w-4" /> {t("watchparty.moviePage")}
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 rounded border border-white/15 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            <Search className="h-4 w-4" /> {t("watchparty.findOtherMovies")}
          </Link>
        </div>
      </div>
    </div>
  );
}
