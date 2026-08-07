import { useTranslation } from "react-i18next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { getIntlLocale } from "@/lib/i18n";

type LegalSection = { heading: string; body: string };

const LAST_UPDATED = new Date("2026-08-07");

export function LegalPage({ titleKey, sectionsKey }: { titleKey: string; sectionsKey: string }) {
  const { t, i18n } = useTranslation();
  const title = t(titleKey);
  const sections = t(sectionsKey, { returnObjects: true }) as LegalSection[];
  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 md:px-12">
        <Breadcrumb items={[{ label: t("nav.home"), to: "/" }, { label: title }]} />
        <h1 className="mb-2 text-2xl font-bold text-white md:text-3xl">{title}</h1>
        <p className="mb-8 text-xs text-netflix-muted">
          {t("legal.lastUpdated")}: {LAST_UPDATED.toLocaleDateString(getIntlLocale(i18n.language))}
        </p>
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-2 text-base font-semibold text-white">{section.heading}</h2>
              <p className="text-sm leading-relaxed text-netflix-muted">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
