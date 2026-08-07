import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [{ title: `${t("legal.privacy.title")} — Cine-Flow` }],
  }),
  component: () => (
    <LegalPage titleKey="legal.privacy.title" sectionsKey="legal.privacy.sections" />
  ),
});
