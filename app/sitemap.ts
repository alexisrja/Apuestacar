import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { getSorteos } from "@/lib/sorteos";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${siteUrl}/premios`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/boletos`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/resultados`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const sorteos = await getSorteos();
  const sorteoRoutes: MetadataRoute.Sitemap = sorteos.map((s) => ({
    url: `${siteUrl}/boletos/${s.id}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...sorteoRoutes];
}
