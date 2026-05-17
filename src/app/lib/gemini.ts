import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScrapedData } from "./types";

export async function generateAiAnalysis(
  data: ScrapedData,
  score: number,
  url: string,
  geminiApiKey: string
): Promise<{ score: number; pageCategory: string; aiAnalysis: string; recommendations: string[] }> {
  const genAI = new GoogleGenerativeAI(geminiApiKey);

  type GeminiSchema = NonNullable<
    NonNullable<Parameters<typeof genAI.getGenerativeModel>[0]["generationConfig"]>["responseSchema"]
  >;

  // PROŠIRENA ŠEMA SA POLJEM 'pageCategory'
  const aeoResponseSchema = {
    type: "OBJECT",
    properties: {
      score: {
        type: "INTEGER",
        description: "The finalized AEO visibility score from 0 to 100, refining the initial seed score based on industry standards."
      },
      pageCategory: {
        type: "STRING",
        description: "The exact classification of the website (e.g., 'Personal Portfolio', 'Local Business', 'E-commerce', 'SaaS Platform', 'Health & Medical Blog', 'Niche Content Blog')."
      },
      aiAnalysis: {
        type: "STRING",
        description: "Executive synthesis audit looking deeply at LLM crawlability, semantic HTML structures, heading cascade rules, multimodal image alt tags, and graph optimizations.",
      },
      recommendations: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "List of 5 highly specific, tactical adjustments needed to rank across modern answer engines, strictly tailored to the detected pageCategory.",
      },
    },
    required: ["score", "pageCategory", "aiAnalysis", "recommendations"],
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      temperature: 0.15,
      responseMimeType: "application/json",
      responseSchema: aeoResponseSchema as unknown as GeminiSchema,
    },
  });

  // UNAPRIJEĐENI PROMPT SVJESTAN KONTEKSTA I NIŠE SAJTA
  const prompt = `
You are an expert Senior Answer Engine Optimisation (AEO) strategist.
Analyze the target website data context provided and perform a highly specific structural alignment audit tailored strictly to the website's industry and business model.

WEBSITE: ${url}
ROBOTS.TXT STATUS: ${data.robotsStatus}
TITLE: ${data.title}
META DESCRIPTION: ${data.metaDescription}
H1: ${data.h1}
DETECTED EXPLICIT Q&A CONTENT BLOCKS: ${data.qaBlocksCount}
HAS TABLE OR BULLET GRAPH STRUCTURES: ${data.hasTablesOrLists}
DETECTED SCHEMA ENTITIES: ${data.detectedSchemas.join(", ") || "None"}

SEMANTIC LAYOUT MAP:
Has Strict Main Tag: ${data.semanticLayoutMap.hasMainTag}
Has Article Container Tag: ${data.semanticLayoutMap.hasArticleTag}
Has Bad Heading Leap (Cascade Failure): ${data.semanticLayoutMap.hasHeadingLeap}
Total Images Scanned: ${data.semanticLayoutMap.totalImages}
Images Missing Description (Alt Tag): ${data.semanticLayoutMap.missingAltCount}

KNOWLEDGE GRAPH FOOTPRINT MAP:
Authority Reference Outlinks (Wikipedia/Wikidata): ${data.entityTrustMap.hasWikidataOrWikipedia}
LinkedIn Identity Profile: ${data.entityTrustMap.hasLinkedIn}
X/Twitter Profile Anchor: ${data.entityTrustMap.hasXAccount}
Facebook Profile Anchor: ${data.entityTrustMap.hasFacebookAccount}
Brand Disambiguation Status: ${data.entityTrustMap.brandDisambiguationStatus}
Identified Raw Brand Variants Across Code Contexts: ${data.entityTrustMap.detectedBrandVariants.join(", ")}

CONTENT MAP SAMPLE:
${data.bodyText}

COMPUTED SEED OPTIMIZATION SCORE: ${score}/100

INSTRUCTIONS:
1. First, evaluate the context and determine the exact "pageCategory" (e.g., "Personal Portfolio", "Local Business", "E-commerce", "SaaS Platform", "Health & Medical Blog", "Niche Content Blog").
2. Refine and confirm the final "score" based on how well this page adheres to its specific category standards.
3. Write an authoritative 3-paragraph "aiAnalysis" focusing on how conversational AI models (ChatGPT, Perplexity, Gemini) tokenize and perceive this specific brand entity.
4. Generate exactly 5 prioritized, tactical "recommendations". These MUST be hyper-targeted to the detected pageCategory:
   - If Local Business: Focus heavily on NAP consistency, structured local schemas, and geo-signals.
   - If Personal Portfolio: Focus on personal branding tokens, authorship signals, and connecting social entities (GitHub, LinkedIn).
   - If E-commerce: Focus on product data matrices, pricing tables, transactional semantic hooks, and Product schemas.
   - If Health/Blog: Focus strictly on E-E-A-T principles, peer-reviewed outlinks, and trusted factual citations.
`;

  const aiResult = await model.generateContent(prompt);
  const responseText = aiResult.response.text();
  return JSON.parse(responseText);
}