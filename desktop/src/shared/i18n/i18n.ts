import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ko from "./locales/ko.json";
import {
  FALLBACK_LANGUAGE,
  getLanguagePreference,
  initializeLanguagePreference,
  resolveLanguage,
  subscribeLanguagePreference,
} from "./languagePreference";

export const i18n = i18next;

let initialized = false;

/**
 * Initialize translations synchronously (bundled catalogs, no backend) so the
 * first render is already localized. English strings stay the source of truth;
 * missing Korean keys fall back to English.
 */
export function initializeI18n(): void {
  if (initialized) return;
  initialized = true;
  initializeLanguagePreference();

  void i18next.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    lng: resolveLanguage(getLanguagePreference()),
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: { escapeValue: false },
    initAsync: false,
  });

  subscribeLanguagePreference(() => {
    void i18next.changeLanguage(resolveLanguage(getLanguagePreference()));
  });
}
