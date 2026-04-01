import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://hookraft.site",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://hookraft.site/docs/introduction",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://hookraft.site/docs/doorway",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://hookraft.site/docs/use-queue",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://hookraft.site/docs/use-auth",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://hookraft.site/docs/use-history",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://hookraft.site/docs/use-pipeline",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
     {
      url: "https://hookraft.site/docs/use-request",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
     {
      url: "https://hookraft.site/docs/use-broadcast",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    
    
  ]
}