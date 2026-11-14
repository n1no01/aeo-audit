import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Entity Checker | Is Your Brand in Google's Knowledge Graph?",
  description: 'Check whether your brand is recognised as an entity in the Google Knowledge Graph, a key signal for AI search citations.',
  alternates: { canonical: '/entity-checker' },
  openGraph: { title: "Free AI Entity Checker | Is Your Brand in Google's Knowledge Graph?", description: 'Check whether your brand is recognised as an entity in the Google Knowledge Graph, a key signal for AI search citations.', url: '/entity-checker', type: 'website' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
