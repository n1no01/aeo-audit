import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Free AEO Semantic Analyzer | Check Content for AI Answer Engines',
  description: 'Analyze how clear, structured and citable your content is for ChatGPT, Gemini and Perplexity.',
  alternates: { canonical: '/tools/aeo-semantic-analyzer' },
  openGraph: { title: 'Free AEO Semantic Analyzer | Check Content for AI Answer Engines', description: 'Analyze how clear, structured and citable your content is for ChatGPT, Gemini and Perplexity.', url: '/tools/aeo-semantic-analyzer', type: 'website' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
