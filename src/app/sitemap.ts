import type { MetadataRoute } from "next";

const siteUrl = process.env.APP_URL ?? "http://localhost:3000";

// Minimal starting point — just the static, always-indexable routes.
// Listing detail pages and the /cars, /locations landing pages are added
// here once they exist (see the SEO plan's phase 2/3), at which point this
// will need to switch to generateSitemaps() to chunk the ~19k+ listing URLs
// across multiple sitemap files rather than one flat array.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "hourly",
      priority: 1,
    },
  ];
}
