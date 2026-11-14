import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Free AI robots.txt Generator | Allow or Block GPTBot, ClaudeBot & More',
  description: 'Create a robots.txt that controls AI crawlers such as GPTBot, ClaudeBot, PerplexityBot and Google-Extended, with one click.',
  alternates: { canonical: '/tools/ai-robots-generator' },
  openGraph: { title: 'Free AI robots.txt Generator | Allow or Block GPTBot, ClaudeBot & More', description: 'Create a robots.txt that controls AI crawlers such as GPTBot, ClaudeBot, PerplexityBot and Google-Extended, with one click.', url: '/tools/ai-robots-generator', type: 'website' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
