import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Faceted search permutations stay out of the index (doc 03 §4)
        disallow: ["/search", "/api/", "/out/", "/admin/", "/account"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
