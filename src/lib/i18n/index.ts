import en from "./locales/en.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";

export type Locale = "en" | "fr" | "de";

export const locales: { value: Locale; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
];

export const defaultLocale: Locale = "fr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dictionaries: Record<Locale, any> = { en, fr, de };

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

/**
 * Get a nested value from an object using a dot-separated path.
 * Supports simple {variable} interpolation.
 */
export function t(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any,
  key: string,
  params?: Record<string, string>
): string {
  const parts = key.split(".");
  let value = dict;
  for (const part of parts) {
    value = value?.[part];
  }

  if (typeof value !== "string") return key;

  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
  }

  return value;
}
