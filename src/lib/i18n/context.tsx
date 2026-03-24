"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { type Locale, defaultLocale, getDictionary, t as translate } from ".";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = localStorage.getItem("gsl-locale");
  if (stored === "en" || stored === "fr" || stored === "de") return stored;
  // Try browser language
  const browserLang = navigator.language.slice(0, 2);
  if (browserLang === "fr" || browserLang === "de") return browserLang;
  return defaultLocale;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [dict, setDict] = useState(getDictionary(defaultLocale));

  useEffect(() => {
    const stored = getStoredLocale();
    setLocaleState(stored);
    setDict(getDictionary(stored));
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setDict(getDictionary(newLocale));
    localStorage.setItem("gsl-locale", newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => translate(dict, key, params),
    [dict]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, dict, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
