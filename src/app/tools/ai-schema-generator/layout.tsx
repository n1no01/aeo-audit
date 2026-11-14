import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Free AI Schema Generator | JSON-LD for AI Search',
  description: 'Generate valid JSON-LD structured data (Organization, FAQ, Article, Product) that helps AI answer engines understand your page.',
  alternates: { canonical: '/tools/ai-schema-generator' },
  openGraph: { title: 'Free AI Schema Generator | JSON-LD for AI Search', description: 'Generate valid JSON-LD structured data (Organization, FAQ, Article, Product) that helps AI answer engines understand your page.', url: '/tools/ai-schema-generator', type: 'website' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
