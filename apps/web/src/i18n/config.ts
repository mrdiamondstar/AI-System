/**
 * i18n configuration (doc 03 §5). Non-breaking "without routing" mode: the
 * locale is resolved from a cookie (default English), so adding locales is
 * additive and never restructures the route tree. Locale-prefixed routes +
 * hreflang become an additive layer once translated editorial content exists.
 */
export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}
