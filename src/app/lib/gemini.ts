import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScrapedData } from "./types";

export async function generateAiAnalysis(
  data: ScrapedData,
  score: number,
  url: string,
  geminiApiKey: string
): Promise<{ 
  score: number; 
  pageCategory: string; 
  aiAnalysis: string; 
  recommendations: string[];
  // NOVE METRIKE UKLJUČENE U RETURN TIP:
  bluffScore: number;
  atomicStructureScore: number;
  entityDensityScore: number;
  sentenceSimplicityScore: number;
}> {
  const genAI = new GoogleGenerativeAI(geminiApiKey);

  type GeminiSchema = NonNullable<
    NonNullable<Parameters<typeof genAI.getGenerativeModel>[0]["generationConfig"]>["responseSchema"]
  >;

  // PROŠIRENA ŠEMA SA 4 NOVA AEO STUBA PISANJA
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
      bluffScore: { 
        type: "INTEGER", 
        description: "Score 1-10. Assesses if sections start with a direct answer (Bottom Line Up Front) instead of burying points in backstory." 
      },
      atomicStructureScore: { 
        type: "INTEGER", 
        description: "Score 1-10. Assesses if H2/H3 sections make complete sense when read entirely out of context (ready for LLM chunking)." 
      },
      entityDensityScore: { 
        type: "INTEGER", 
        description: "Score 1-10. Assesses how rich the content is with specific entities (brands, concrete concepts) vs generic filler language." 
      },
      sentenceSimplicityScore: { 
        type: "INTEGER", 
        description: "Score 1-10. Assesses if sentences are short, declarative, and easy for an LLM to parse (one idea per sentence)." 
      },
      recommendations: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "List of 5 highly specific, tactical adjustments needed to rank across modern answer engines, strictly tailored to the detected pageCategory.",
      },
    },
    required: [
      "score", 
      "pageCategory", 
      "aiAnalysis", 
      "bluffScore", 
      "atomicStructureScore", 
      "entityDensityScore", 
      "sentenceSimplicityScore", 
      "recommendations"
    ],
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      temperature: 0.15,
      responseMimeType: "application/json",
      responseSchema: aeoResponseSchema as unknown as GeminiSchema,
    },
  });

  // DOPUNJENI PROMPT SA 4 AEO STUBA IZ AHREFS STUDIJE
  const prompt = `
You are an expert Senior Answer Engine Optimisation (AEO) strategist.
Analyze the target website data context provided and perform a highly specific structural alignment audit tailored strictly to the website's industry and business model.

WEBSITE: ${url}
DETECTOR CONTEXT: The scraper has algorithmically identified this page layout as a **${data.pageType}**.
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

CRITICAL CONTEXTUAL SCORING RULES:
1. You MUST evaluate the website quality based on the detected layout context (**${data.pageType}**).
2. If the pageType is 'Homepage' or 'Commercial' and it explicitly represents an online software tool or a purely digital SaaS platform (like an AI auditing platform), do NOT penalize the final visibility score or authority metrics for missing physical signals (address/phone) or brand-owned social profile links (LinkedIn/X profile maps) IF the JSON-LD schema graph layout is clean, valid, and present.
3. If it is a Homepage, focus your evaluation heavily on brand identity token consistency across metadata, headings, and code. Do NOT expect or penalize for the lack of long-form editorial content.

INSTRUCTIONS:
1. Evaluate the context and determine the exact "pageCategory".
2. Refine and confirm the final "score" based on how well this page adheres to its specific category standards.
3. Rigidly score the content sample from 1 to 10 against the 4 core pillars of AEO writing:
   - bluffScore (Bottom Line Up Front): Do sections give direct answers immediately, or is the core point buried in introductory paragraphs?
   - atomicStructureScore: Can sections survive independently if chunked into vector databases by an LLM?
   - entityDensityScore: Does it use precise entities (brands, concrete concepts) instead of vague/generic filler wording?
   - sentenceSimplicityScore: Are sentences short, declarative, following a simple Subject-Verb-Object structure (one idea per sentence)?
4. Write an authoritative 3-paragraph "aiAnalysis" focusing on how conversational AI models (ChatGPT, Perplexity, Gemini) tokenize and perceive this specific brand entity.
5. Generate exactly 5 prioritized, tactical "recommendations" hyper-targeted to the detected pageCategory.
`;

  const aiResult = await model.generateContent(prompt);
  const responseText = aiResult.response.text();
  const parsedResponse = JSON.parse(responseText) as {
    score: number;
    pageCategory: string;
    aiAnalysis: string;
    recommendations: string[];
    bluffScore: number;
    atomicStructureScore: number;
    entityDensityScore: number;
    sentenceSimplicityScore: number;
  };

  return parsedResponse;
}