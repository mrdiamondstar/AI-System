import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

/**
 * Static locale resolution (doc 03 §5, Phase 1). Deliberately does NOT read a
 * cookie/header: doing so would opt the entire route tree into dynamic
 * rendering and destroy the ISR/CDN economics that carry the SEO strategy
 * (tenets 2 & 5). Strings are fully externalized and translation-ready
 * (see messages/*.json); active locale switching arrives as an additive layer
 * with locale-prefixed routes (statically rendered per locale) in Phase 3.
 */
export default getRequestConfig(async () => {
  const messages = (await import(`../../messages/${defaultLocale}.json`)).default;
  return { locale: defaultLocale, messages };
});
