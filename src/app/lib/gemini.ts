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
  recommendations: {
    id: string;
    title: string;
    severity: "CRITICAL" | "MEDIUM" | "LOW";
    category: "Technical" | "Semantic Layout" | "Entity & Trust" | "Content Optimization";
    description: string;
    impact: string;
    fixSteps: string[];
    codeSnippet?: string;
  }[];
  bluffScore: number;
  atomicStructureScore: number;
  entityDensityScore: number;
  sentenceSimplicityScore: number;
  commodityContentScore: number;
  // 🚀 NOVO POLJE DODATO U RETURN TYPE
  keywordsData: {
    primaryTopic: string;
    aeoKeywordScore: number;
    extractedKeywords: {
      keyword: string;
      foundInH1OrTitle: boolean;
      aeoRelevance: "High" | "Medium" | "Low";
    }[];
    missingSemanticEntities: string[];
    recommendedAeoQuestions: string[];
    optimizationTips: string[];
  };
}> {
  const genAI = new GoogleGenerativeAI(geminiApiKey);

  type GeminiSchema = NonNullable<
    NonNullable<Parameters<typeof genAI.getGenerativeModel>[0]["generationConfig"]>["responseSchema"]
  >;

  const aeoResponseSchema = {
    type: "OBJECT",
    properties: {
      score: {
        type: "INTEGER",
        description: "The finalized AEO visibility score from 0 to 100, refining the initial seed score based on industry standards."
      },
     pageCategory: {
        type: "STRING",
        description: "The exact specific niche/business classification of the website (e.g., 'Sports Performance & Training', 'SaaS Platform', 'E-commerce', 'Local Business', 'Niche Content Blog', 'Personal Portfolio'). Never return generic terms like 'Homepage'."
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
      commodityContentScore: { 
        type: "INTEGER", 
        description: "Score 1-10. Strictly 1-3 for pure AI fluff/definitions; 4-7 for basic custom text; 8-10 for deep original research or proprietary data." 
      },
      // 🚀 NOVI DEO ŠEME: KEYWORDS & SEMANTIC ENTITY ANALYSIS
      keywordsData: {
        type: "OBJECT",
        description: "In-depth semantic keyword analysis, extracted concepts, missing entities, and conversational AI intent questions.",
        properties: {
          primaryTopic: { 
            type: "STRING", 
            description: "The core entity or topic detected on the page (e.g., 'AEO Audit SaaS', 'Basketball Vertical Jump Training')." 
          },
          aeoKeywordScore: { 
            type: "INTEGER", 
            description: "Score 0-100 indicating how well keywords are contextualized for direct conversational AI answers." 
          },
          extractedKeywords: {
            type: "ARRAY",
            description: "List of 4 to 6 main keywords extracted from the DOM with their presence in H1/Title and relevance.",
            items: {
              type: "OBJECT",
              properties: {
                keyword: { type: "STRING" },
                foundInH1OrTitle: { type: "BOOLEAN" },
                aeoRelevance: { type: "STRING", enum: ["High", "Medium", "Low"] }
              },
              required: ["keyword", "foundInH1OrTitle", "aeoRelevance"]
            }
          },
          missingSemanticEntities: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "List of 3 to 5 crucial topical concepts or entities expected by LLMs for this niche that are missing from the content."
          },
          recommendedAeoQuestions: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Exactly 3 conversational questions that users ask ChatGPT/Perplexity about this topic that this page SHOULD directly answer."
          },
          optimizationTips: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "2 to 3 practical, concise recommendations to improve keyword/entity contextualization for answer engines."
          }
        },
        required: [
          "primaryTopic",
          "aeoKeywordScore",
          "extractedKeywords",
          "missingSemanticEntities",
          "recommendedAeoQuestions",
          "optimizationTips"
        ]
      },
      recommendations: {
        type: "ARRAY",
        description: "List of exactly 5 highly specific, tactical adjustments needed to rank across modern answer engines, prioritized by severity.",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING", description: "Unique snake_case identifier (e.g., 'cf_block', 'missing_faq_schema')." },
            title: { type: "STRING", description: "Short, direct title of the issue." },
            severity: { type: "STRING", enum: ["CRITICAL", "MEDIUM", "LOW"], description: "CRITICAL for bot blocks, MEDIUM for schema/layout breaks, LOW for text fine-tuning." },
            category: { type: "STRING", enum: ["Technical", "Semantic Layout", "Entity & Trust", "Content Optimization"] },
            description: { type: "STRING", description: "Detailed explanation of what is wrong on the site." },
            impact: { type: "STRING", description: "How this directly impacts tokenization, context windows, or AEO discovery." },
            fixSteps: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Step-by-step ordered list of instructions on how a developer or SEO can fix this issue."
            },
            codeSnippet: { type: "STRING", description: "Optional: JSON-LD script string, HTML snippet, or robots.txt directive exemplifying the fix. Pass empty or omit if not applicable." }
          },
          required: ["id", "title", "severity", "category", "description", "impact", "fixSteps"]
        }
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
      "commodityContentScore",
      "keywordsData", // 🚀 DODATO U REQUIRED
      "recommendations"
    ],
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      temperature: 0.0, // 🚀 POSTAVLJENO NA 0 ZADRŽAVANJE DETERMINIZMA I IDENTIČNIH BODOVA
      topP: 0.1,
      responseMimeType: "application/json",
      responseSchema: aeoResponseSchema as unknown as GeminiSchema,
    },
  });

  const isDomainAudit = data.pageCategory === "Domain-Wide Audit";

  const botDetected = data.aiAccessibility?.cloudflareDetected ?? false;
  const botSeverity = data.aiAccessibility?.cloudflareSeverity ?? "None";
  const botAccessStatus = data.aiAccessibility?.accessibilityStatus ?? "Unknown";
  const robotsBlockingAI = data.robotsStatus === "Blocking AI";

  const completelyBlocked = robotsBlockingAI || (botDetected && botSeverity === "Hard");
  const partiallyBlocked = !completelyBlocked && botDetected && botSeverity === "Soft";

  const botProtectionLine = botDetected
    ? `DETECTED — ${botSeverity} block (${botAccessStatus})`
    : "None detected";

  // 📝 UNAPREĐENI PROMPT SA KEYWORD I AEO INTENT INSTRUKCIJAMA
  const prompt = `
You are an expert Senior Answer Engine Optimisation (AEO) strategist operating as a deterministic evaluator.
Analyze the target website data context provided and perform a highly specific structural alignment audit.

WEBSITE: ${url}
AUDIT SCOPE MODE: ${isDomainAudit ? "MULTI-PAGE FULL DOMAIN AUDIT" : "SINGLE PAGE / SPECIFIC ROUTE AUDIT"}
DETECTOR CONTEXT: The scraper has algorithmically identified this page layout as a **${data.pageType}**.
ROBOTS.TXT STATUS: ${data.robotsStatus}
BOT PROTECTION STATUS: ${botProtectionLine}
BOT ACCESSIBILITY STATUS: ${botAccessStatus}
TITLE: ${data.title}
META DESCRIPTION: ${data.metaDescription}
H1: ${data.h1}
DETECTED EXPLICIT Q&A CONTENT BLOCKS: ${data.qaBlocksCount}
HAS TABLE OR BULLET GRAPH STRUCTURES: ${data.hasTablesOrLists}
DETECTED SCHEMA ENTITIES: ${data.detectedSchemas?.join(", ") || "None"}

SEMANTIC LAYOUT MAP:
Has Strict Main Tag: ${data.semanticLayoutMap?.hasMainTag}
Has Article Container Tag: ${data.semanticLayoutMap?.hasArticleTag}
Has Bad Heading Leap (Cascade Failure): ${data.semanticLayoutMap?.hasHeadingLeap}
Total Images Scanned: ${data.semanticLayoutMap?.totalImages}
Images Missing Description (Alt Tag): ${data.semanticLayoutMap?.missingAltCount}

KNOWLEDGE GRAPH FOOTPRINT MAP:
Authority Reference Outlinks (Wikipedia/Wikidata): ${data.entityTrustMap?.hasWikidataOrWikipedia}
LinkedIn Identity Profile: ${data.entityTrustMap?.hasLinkedIn}
X/Twitter Profile Anchor: ${data.entityTrustMap?.hasXAccount}
Facebook Profile Anchor: ${data.entityTrustMap?.hasFacebookAccount}
Brand Disambiguation Status: ${data.entityTrustMap?.brandDisambiguationStatus}
Identified Raw Brand Variants Across Code Contexts: ${data.entityTrustMap?.detectedBrandVariants?.join(", ") || "None"}

CONTENT MAP SAMPLE:
${data.bodyText}

COMPUTED SEED OPTIMIZATION SCORE: ${score}/100

${
  isDomainAudit
    ? `SPECIAL DOMAIN AUDIT DIRECTIVE:
       This is a MULTI-PAGE DOMAIN AUDIT representing a sample across key routes of ${url}. 
       Evaluate the overall domain-wide Answer Engine architecture, brand entity authority across LLM knowledge bases, global schema graph strategy, and site-wide AI crawlability.`
    : `SPECIAL SINGLE PAGE DIRECTIVE:
       Focus strictly on this specific route's semantic layout, content chunking, and localized schema.`
}

CRITICAL CONTEXTUAL SCORING RULES:
1. You MUST evaluate the website quality based on the detected layout context (**${data.pageType}**).
2. If the pageType is 'Homepage' or 'Commercial' and it explicitly represents an online software tool or a purely digital SaaS platform (like an AI auditing platform), do NOT penalize the final visibility score or authority metrics for missing physical signals (address/phone) or brand-owned social profile links (LinkedIn/X profile maps) IF the JSON-LD schema graph layout is clean, valid, and present.
3. If it is a Homepage, focus your evaluation heavily on brand identity token consistency across metadata, headings, and code. Do NOT expect or penalize for the lack of long-form editorial content.
4. ${completelyBlocked
    ? `CRITICAL ACCESS OVERRIDE: This site is COMPLETELY BLOCKED to AI crawlers — either by robots.txt directive or a confirmed Hard bot protection wall. The final score MUST be 20 or below, regardless of any other positive signals. Your top recommendation MUST address fixing bot access as the single most urgent priority.`
    : partiallyBlocked
    ? `PARTIAL ACCESS WARNING: A Soft bot protection block has been detected. Cap the final score at 50 regardless of other positive signals.`
    : `Bot access is clean. Evaluate and score normally based on content, schema, and semantic structure.`
  }

STRICT DETERMINISTIC AEO WRITING RUBRIC:
You MUST calculate commodityContentScore using these mathematical threshold triggers:
- Rate 1 to 3: Content consists of pure generic definitions, basic Wikipedia-like text, or generic marketing copy without any numbers or proprietary claims.
- Rate 4 to 7: Content contains basic custom branding, clear value propositions, or structured sections, but lacks explicit first-party case studies or unique statistical data points.
- Rate 8 to 10: Content contains explicit unique statistical metrics, proprietary research data, or first-person case studies ("In our study of X...").

KEYWORD & SEMANTIC ENTITY AUDIT DIRECTIVE:
1. Extract the main relational entity/topic of the page into 'primaryTopic'.
2. Identify 4-6 key terms extracted from Title, H1, or content and assess if they are present in H1/Title and their AEO relevance.
3. Identify 3-5 missing semantic entities that LLMs (ChatGPT, Perplexity, Claude) expect for this specific niche.
4. Formulate exactly 3 conversational AI questions that users would ask ChatGPT/Perplexity related to this page's content.
5. Provide 2-3 concise optimization tips on keyword contextualization for AEO.

DETERMINISTIC EVALUATION GUARANTEE:
Apply objective, rigid mathematical boundaries. Do NOT randomly fluctuate scores between runs for the exact same input text.

INSTRUCTIONS:
1. Evaluate the context and determine the exact industry/niche "pageCategory" (e.g., 'Sports Performance', 'SaaS', 'E-commerce' — NEVER output just 'Homepage').
2. Confirm the final "score" respecting the scoring rules above.
3. Rigidly score the content sample against the 5 core pillars.
4. Populate keywordsData object thoroughly.
5. Write a 3-paragraph "aiAnalysis".
6. Generate exactly 5 prioritized, tactical objects inside the "recommendations" array.

   ANTI-HALLUCINATION RULES:
   - Do NOT recommend schemas that are ALREADY in DETECTED SCHEMA ENTITIES (${data.detectedSchemas?.join(", ") || "None"}).
   - Do NOT tell the user to add social profile links if they are ALREADY detected as true.
   - Any codeSnippet MUST use real domain tokens (${url}). Never use "example.com".
   - Every item inside "fixSteps" MUST be plain text without markdown stars or numbering.
`;

  const aiResult = await model.generateContent(prompt);
  const responseText = aiResult.response.text();
  
  return JSON.parse(responseText);
}