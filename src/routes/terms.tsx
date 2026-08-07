import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [{ title: `${t("legal.terms.title")} — Cine-Flow` }],
  }),
  component: () => <LegalPage titleKey="legal.terms.title" sectionsKey="legal.terms.sections" />,
});
