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
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://aeoaudit-pro.com/#organization",
        "name": "AEO Audit Pro",
        "url": "https://aeoaudit-pro.com",
        "logo": "https://aeoaudit-pro.com/logo.png",
        "founder": {
          "@type": "Person",
          "name": "Nino Herenda"
        },
        "sameAs": [
          "https://x.com/aeoauditpro",
          "https://www.linkedin.com/company/aeo-audit-pro/"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "email": "hello@aeoaudit-pro.com"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://aeoaudit-pro.com/#website",
        "url": "https://aeoaudit-pro.com",
        "name": "AEO Audit Pro",
        "publisher": {
          "@id": "https://aeoaudit-pro.com/#organization"
        },
        "knowsAbout": [
          "https://en.wikipedia.org/wiki/Artificial_intelligence",
          "https://en.wikipedia.org/wiki/Search_engine_optimization",
          "https://en.wikipedia.org/wiki/Web_scraping",
          "https://en.wikipedia.org/wiki/Cloudflare"
        ]
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://aeoaudit-pro.com/#application",
        "name": "AEO Audit Pro Engine",
        "logo": "https://aeoaudit-pro.com/logo.png",
        "operatingSystem": "All",
        "applicationCategory": "BusinessApplication",
        "browserRequirements": "Requires HTML5. Requires JavaScript.",
        "url": "https://aeoaudit-pro.com",
        "sameAs": [
          "https://www.wikidata.org/wiki/Q140136146"
        ],
        "featureList": [
          "AI Radar",
          "Entity Checker",
          "Semantic Diagnostics",
          "White Label Reports",
          "Lead Magnet Widget",
          "AEO Certification Academy"
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
            "price": "59.00",
            "priceCurrency": "USD",
            "description": "Designed for freelancers and small agencies."
          },
          {
            "@type": "Offer",
            "name": "Agency Plan",
            "price": "159.00",
            "priceCurrency": "USD",
            "description": "Designed for agencies and businesses looking for comprehensive AI Search auditing."
          },
          {
            "@type": "Offer",
            "name": "Pay-as-you-go",
            "price": "5.00",
            "priceCurrency": "USD",
            "description": "Flexible auditing. 1 credit per AI search audit."
          },
          {
            "@type": "Offer",
            "name": "Enterprise Plan",
            "price": "0.00",
            "priceCurrency": "USD",
            "description": "Custom enterprise solutions. Contact hello@aeoaudit-pro.com for inquiry."
          }
        ]
      }
    ]
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          id="aeo-global-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}