import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*", // Svi botovi na svetu...
      allow: [
        "/", 
        "/pricing", 
        "/how-it-works"
      ], // ...imaju dozvolu za ove javne stranice
      disallow: [
        "/dashboard",   
        "/dashboard/*",   
        "/api/",          
      ],
    },
    sitemap: "https://www.aeoaudit-pro.com/sitemap.xml",
  };
}