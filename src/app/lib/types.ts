export interface BotStatus {
  gptBot: "Allowed" | "Blocked";
  claudeBot: "Allowed" | "Blocked";
  perplexityBot: "Allowed" | "Blocked";
  oaiSearchBot: "Allowed" | "Blocked";
  googleExtended: "Allowed" | "Blocked";
  anthropicAi: "Allowed" | "Blocked";
  deepSeekBot: "Allowed" | "Blocked";
  appleBotExtended: "Allowed" | "Blocked";
  bingbot: "Allowed" | "Blocked";
  cohereAi: "Allowed" | "Blocked";
}

export interface EntityTrustMap {
  hasWikidataOrWikipedia: boolean;
  hasLinkedIn: boolean;
  hasXAccount: boolean;
  hasFacebookAccount: boolean;
  hasPhysicalSignals: boolean;
  brandDisambiguationStatus: "Optimal" | "Inconsistent" | "Critical Missing";
  detectedBrandVariants: string[];
}

export interface SemanticLayoutMap {
  hasMainTag: boolean;
  hasArticleTag: boolean;
  hasHeadingLeap: boolean;
  totalImages: number;
  missingAltCount: number;
}

export interface ScrapedData {
  title: string;
  metaDescription: string;
  h1: string;
  h2Count: number;
  wordCount: number;
  bodyText: string;
  hasTablesOrLists: boolean;
  hasVideoElements: boolean;
  qaBlocksCount: number;
  detectedSchemas: string[];
  javascriptDependency: "Low" | "Critical";
  robotsStatus: "Valid" | "Missing" | "Blocking AI" | "Error";
  robotsRawContent: string;
  aiBotsStatus: BotStatus;
  entityTrustMap: EntityTrustMap;
  semanticLayoutMap: SemanticLayoutMap;
  pageType: "Homepage" | "Article" | "FAQ" | "About" | "Commercial" | "General";
}

export interface AuditData extends ScrapedData {
  score: number;
  pageCategory: string; // npr. "Personal Portfolio" ili preslikan gornji pageType
  aiAnalysis: string;
  recommendations: string[];
  bluffScore: number;
  atomicStructureScore: number;
  entityDensityScore: number;
  sentenceSimplicityScore: number;
  hasListsOrTables: boolean;
  website_url?: string;
}

export type TabId = "metrics" | "analysis" | "recommendations" | "robots" | "simulator";

export const AEO_EXPLANATIONS = {
  crawlerStatus: "Indicates whether your robots.txt allows AI bot scrapers to access your code context. If blocked, conversational engines like ChatGPT cannot index your latest content updates.",
  brandDisambiguation: "Audits whether your brand identity token is 100% consistent across code context, page titles, and footer zones. Text tokenizers inside LLMs penalize variation naming noise.",
  authorityOutlinks: "Verifies if your text references global knowledge bases like Wikipedia or Wikidata. Conversational search engines rely heavily on high-authority outbound citations to validate facts.",
  mainTag: "The core structural HTML5 container. AI crawlers utilize this to instantly isolate your primary text from sidebars, ads, and navigation, saving valuable token space in their context window.",
  articleTag: "Explicitly signals to an AI bot that the enclosed content is an independent, authoritative body of text or editorial post, making it highly eligible for direct answer extractions.",
  headingCascade: "Headings must follow a strict sequential hierarchy (H1 → H2 → H3). Skipping levels (e.g., H1 to H4) breaks the semantic node tree and severely degrades the AI’s understanding of your sub-topics.",
  imageAlt: "Multimodal models (like GPT-4o and Gemini) crawl and index visual media alongside text assets. Images lacking descriptive alt tokens cannot be surfaced in rich AI chat engine responses.",
  wordCount: "Content length directly correlates with thematic depth. Answer engines prefer comprehensive contextual weight over thin text snippets when formulating answers to complex user prompts.",
  qaLoops: "Detects structural Question & Answer block formatting directly in the DOM. This is the single most valuable asset for AEO, as it aligns perfectly with conversational long-tail queries.",
  layoutDensity: "Checks for data parsed into tables, bullet points, or numbered lists. AI engines love structured layouts because they can copy-paste and render them directly as clear text fragments."
};