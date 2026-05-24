import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*", // 👈 Zvezdica znači: "Svi botovi na svetu"
      allow: "/",     // 👈 Dozvoli pristup celom sajtu od početne rute
    },
    // Ako imaš sitemap, možeš odkomentarisati liniju ispod i uneti URL
    // sitemap: 'https://aeoaudit-pro.com/sitemap.xml',
  };
}