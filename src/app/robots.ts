import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*", // Svi botovi na svetu...
      allow: [
        "/"
      ], // ...imaju dozvolu za ove javne stranice
      disallow: [
        "/dashboard",     
        "/api/",          
      ],
    },
    sitemap: "https://www.aeoaudit-pro.com/sitemap.xml",
  };
}