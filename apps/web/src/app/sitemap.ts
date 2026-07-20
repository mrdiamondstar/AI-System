import type { MetadataRoute } from "next";
import { listCategories, listPublishedSlugs } from "@dstarix/catalog";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Sitemap (doc 03 §4). Sharded sitemap-index generation replaces this single
 * file once the catalog passes ~10K URLs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entities, categories] = await Promise.all([listPublishedSlugs(), listCategories()]);

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/categories`, changeFrequency: "weekly", priority: 0.8 },
    ...categories.map((category) => ({
      url: `${siteUrl}/categories/${category.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...entities.map((entity) => ({
      url: `${siteUrl}/tools/${entity.slug}`,
      lastModified: entity.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
