import type { MetadataRoute } from "next";
import {
  listCategories,
  listComparisonPairs,
  listPublishedCollectionSlugs,
  listPublishedSlugs,
} from "@dstarix/catalog";
import { listPublishedCourseSlugs } from "@dstarix/learning";
import { listActiveJobSlugs } from "@dstarix/jobs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Sitemap (doc 03 §4). Sharded sitemap-index generation replaces this single
 * file once the catalog passes ~10K URLs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entities, categories, comparisons, collections, courses, jobs] = await Promise.all([
    listPublishedSlugs(),
    listCategories(),
    listComparisonPairs(),
    listPublishedCollectionSlugs(),
    listPublishedCourseSlugs(),
    listActiveJobSlugs(),
  ]);

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/categories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/collections`, changeFrequency: "weekly", priority: 0.8 },
    ...collections.map((collection) => ({
      url: `${siteUrl}/collections/${collection.slug}`,
      lastModified: collection.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
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
    ...entities.map((entity) => ({
      url: `${siteUrl}/tools/${entity.slug}/alternatives`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...comparisons.map((pair) => ({
      url: `${siteUrl}/compare/${pair.a}-vs-${pair.b}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${siteUrl}/learn`, changeFrequency: "weekly" as const, priority: 0.7 },
    ...courses.map((course) => ({
      url: `${siteUrl}/learn/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${siteUrl}/careers`, changeFrequency: "daily" as const, priority: 0.7 },
    ...jobs.map((job) => ({
      url: `${siteUrl}/careers/${job.slug}`,
      lastModified: job.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
