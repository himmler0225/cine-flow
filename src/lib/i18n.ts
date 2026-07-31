import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi as viLocale } from "date-fns/locale";
import vi from "@/locales/vi.json";
import en from "@/locales/en.json";

export const SUPPORTED_LANGUAGES = ["vi", "en"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "vi";

const resources = {
  vi: { translation: vi },
  en: { translation: en },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: { escapeValue: false },
  });
}

export default i18n;

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

export function getIntlLocale(language: string): "vi-VN" | "en-US" {
  return language === "vi" ? "vi-VN" : "en-US";
}

export function getDateFnsLocale(language: string) {
  return language === "vi" ? viLocale : enUS;
}

export function formatRelativeTime(value: string | number | Date, language: string): string {
  return formatDistanceToNow(new Date(value), {
    addSuffix: true,
    locale: getDateFnsLocale(language),
  });
}
