import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScrapedData } from "./types";

export async function generateAiAnalysis(
  data: ScrapedData,
  score: number,
  url: string,
  geminiApiKey: string
): Promise<{ aiAnalysis: string; recommendations: string[] }> {
  const genAI = new GoogleGenerativeAI(geminiApiKey);

  type GeminiSchema = NonNullable<
    NonNullable<Parameters<typeof genAI.getGenerativeModel>[0]["generationConfig"]>["responseSchema"]
  >;

  const aeoResponseSchema = {
    type: "OBJECT",
    properties: {
      aiAnalysis: {
        type: "STRING",
        description: "Executive synthesis audit looking deeply at LLM crawlability, semantic HTML structures, heading cascade rules, multimodal image alt tags, and graph optimizations.",
      },
      recommendations: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "List of highly specific tactical adjustments needed to rank across modern answer engines.",
      },
    },
    required: ["aiAnalysis", "recommendations"],
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      temperature: 0.15,
      responseMimeType: "application/json",
      responseSchema: aeoResponseSchema as unknown as GeminiSchema,
    },
  });

  const prompt = `
You are an expert Senior Answer Engine Optimisation (AEO) strategist.
Analyze the target website data context provided and perform a highly specific structural alignment audit.

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
`;

  const aiResult = await model.generateContent(prompt);
  const responseText = aiResult.response.text();
  return JSON.parse(responseText);
}