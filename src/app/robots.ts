import { MetadataRoute } from "next";

const BASE = "https://aeoaudit-pro.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private app screens, APIs and per-user shared reports must not be indexed.
      disallow: ["/dashboard", "/api/", "/share/", "/share-radar/", "/sign-in", "/sign-up"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
