import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    const onChange = (lng: string) => {
      document.documentElement.lang = lng;
    };
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
