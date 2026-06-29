import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://aeoaudit-pro.com'),
  alternates: {
    canonical: '/',
  },
  title: 'AEO Audit Pro | Answer Engine Optimization Auditing',
  description: 'Enterprise-grade Answer Engine Optimization auditing platform powered by AI semantic analysis.',
  openGraph: {
    title: 'AEO Audit Pro | Answer Engine Optimization Auditing',
    description: 'Enterprise-grade Answer Engine Optimization auditing platform powered by AI semantic analysis.',
    url: 'https://aeoaudit-pro.com',
    siteName: 'AEO Audit Pro',
    images: [
      {
        url: 'https://aeoaudit-pro.com/assets/twitter-preview-image.png',
        width: 1200,
        height: 628,
        alt: 'AEO Audit Pro Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AEO Audit Pro | Answer Engine Optimization Auditing',
    description: 'Enterprise-grade Answer Engine Optimization auditing platform powered by AI semantic analysis.',
    images: ['https://aeoaudit-pro.com/screenshot.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://www.aeoaudit-pro.com/#organization",
      "name": "AEO Audit Pro",
      "url": "https://www.aeoaudit-pro.com",
      "logo": "https://www.aeoaudit-pro.com/logo.png",
      "founder": "Nino Herenda",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://www.aeoaudit-pro.com/#website",
      "url": "https://www.aeoaudit-pro.com",
      "name": "AEO Audit Pro",
      "publisher": {
        "@id": "https://www.aeoaudit-pro.com/#organization"
      },
      "knowsAbout": [
        "https://en.wikipedia.org/wiki/Artificial_intelligence",
        "https://en.wikipedia.org/wiki/Search_engine_optimization",
        "https://en.wikipedia.org/wiki/Web_scraping",
        "https://en.wikipedia.org/wiki/Cloudflare"
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": "https://www.aeoaudit-pro.com/#application",
      "name": "AEO Audit Pro Engine",
      "logo": "https://www.aeoaudit-pro.com/logo.png",
      "operatingSystem": "All",
      "applicationCategory": "BusinessApplication",
      "browserRequirements": "Requires HTML5. Requires JavaScript.",
      "url": "https://www.aeoaudit-pro.com",
      "sameAs": [
        "https://www.wikidata.org/wiki/Q140136146"
      ],
      "featureList": [
        "AI Visibility Radar",
        "Knowledge Graph Entity Checker",
        "Semantic Diagnostics",
        "White Label Reports"
      ],
      "offers": [
        {
          "@type": "Offer",
          "name": "Free Plan",
          "price": "0.00",
          "priceCurrency": "USD",
          "category": "FreeTrial",
          "description": "Includes 1 full AI Search readiness audit."
        },
        {
          "@type": "Offer",
          "name": "Starter Plan",
          "price" : "59.00",
          "priceCurrency": "USD",
          "description": "Designed for solo entrepreneurs and bloggers."
        },
        {
          "@type": "Offer",
          "name": "Agency Plan",
          "price" : "159.00",
          "priceCurrency": "USD",
          "description": "Designed for agencies and businesses looking for comprehensive AI Search auditing."
        }
      ]
    }
  ];

  return (
    <html lang="en">
      <head>
        {/* 🚀 Injektovanje čiste skripte direktno u HTML glavu dokumenta na serveru */}
        <script
          id="aeo-global-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}