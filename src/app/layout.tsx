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
  title: 'AEO Audit Pro | Answer Engine Optimization Auditing',
  description: 'Enterprise-grade Answer Engine Optimization auditing platform powered by AI semantic analysis.',
  openGraph: {
    title: 'AEO Audit Pro | Answer Engine Optimization Auditing',
    description: 'Enterprise-grade Answer Engine Optimization auditing platform powered by AI semantic analysis.',
    url: 'https://aeoaudit-pro.com',
    siteName: 'AEO Audit Pro',
    images: [
      {
        url: 'https://aeoaudit-pro.com/assets/twitter-preview-image.png', // Apsolutna putanja do slike
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
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          {/* Layout je sada potpuno čist i ne miješa se u dizajn tvojih stranica */}
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}