import { Github, Twitter, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { EXTERNAL_URLS } from "@/constants/urls";
import { Separator } from "@/components/ui/separator";
import { BrandLogo } from "@/components/layout/BrandLogo";

const NAV_LINKS = [
  { labelKey: "nav.home", to: "/" },
  { labelKey: "nav.searchPage", to: "/search" },
  { labelKey: "nav.genresPage", to: "/genre" },
  { labelKey: "nav.countriesPage", to: "/country" },
] as const;

const LEGAL_LINKS = [
  { labelKey: "footer.terms", to: "/terms" },
  { labelKey: "footer.privacy", to: "/privacy" },
] as const;

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-8 border-t border-white/[0.06] bg-[#0a0a0a] md:mt-12">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
        <div className="grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr]">
          <div className="space-y-4">
            <BrandLogo imgClassName="h-9" textClassName="text-xl" />
            <p className="max-w-xs text-sm leading-relaxed text-white/50">
              {t("footer.description")}
            </p>
            <div className="flex items-center gap-3">
              <a
                href={EXTERNAL_URLS.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:border-white/30 hover:text-white"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href={EXTERNAL_URLS.twitter}
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:border-white/30 hover:text-white"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
              {t("footer.explore")}
            </h4>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
              {t("footer.info")}
            </h4>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.labelKey}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="bg-white/[0.06]" />

        <div className="flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/30 md:flex-row">
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          <p className="flex items-center gap-1.5">
            {t("footer.madeIn")}{" "}
            <Heart className="inline h-3 w-3 fill-netflix-red text-netflix-red" />{" "}
            {t("footer.inVietnam")}
          </p>
        </div>
      </div>
    </footer>
  );
}
