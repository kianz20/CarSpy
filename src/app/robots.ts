import type { MetadataRoute } from "next";

const siteUrl = process.env.APP_URL ?? "http://localhost:3000";

// Deliberately does NOT disallow crawling of "/" with search query strings —
// that's handled instead by a per-request `noindex` meta tag (see
// generateMetadata in src/app/page.tsx), which lets Google still crawl and
// see the tag rather than being blocked from ever seeing the page at all
// (a robots.txt disallow on a page still linked elsewhere can leave a
// bare, description-less URL floating in search results, which is worse).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
