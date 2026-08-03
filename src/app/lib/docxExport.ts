import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  Header,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import { AuditData, Recommendation } from "./types";

interface BrandKit {
  agencyName: string;
  brandColor: string;
  authorName: string;
  logoBase64: string | null;
}

export async function exportAuditToDocx(data: AuditData, brandKit: BrandKit) {
  const {
    score,
    pageCategory,
    aiAnalysis,
    recommendations,
    title,
    metaDescription,
    h1,
    aiBotsStatus,
    entityTrustMap,
    semanticLayoutMap,
    hasVideoElements, 
    javascriptDependency,
    bluffScore,
    atomicStructureScore,
    entityDensityScore,
    sentenceSimplicityScore,
    commodityContentScore,
    pageType,
    detectedSchemas,
    robotsRawContent,
    llmsRawContent,
    // 🚀 MULTI-PAGE DOMAIN EXTENSIONS
    isDomainAudit,
    pagesAuditedCount,
    sampledPages,
    domainStats,
    website_url,
    // 🚀 NOVI KEYWORDS DATA
    keywordsData,
  } = data;

  const { agencyName, brandColor, authorName, logoBase64 } = brandKit;
  const cleanHexColor = brandColor.replace("#", "").trim();
  const documentChildren: Paragraph[] = [];

  // 1. BRAND LOGO ILI BRAND HEADER
  if (logoBase64) {
    try {
      const base64Data = logoBase64.split(",")[1];
      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      documentChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          children: [
            new ImageRun({
              data: imageBuffer,
              type: "png",
              transformation: {
                width: 70,
                height: 70,
              },
            }),
          ],
        })
      );
    } catch (err) {
      console.error("Failed to embed custom logo inside document structure:", err);
    }
  } else {
    documentChildren.push(
      new Paragraph({ 
        alignment: AlignmentType.CENTER, 
        spacing: { before: 200, after: 100 }, 
        children: [new TextRun({ text: agencyName.toUpperCase(), bold: true, size: 18, color: cleanHexColor })] 
      })
    );
  }

  // 2. NASLOVI I OSNOVNI STATUSERI
  const auditTypeTitle = isDomainAudit
    ? "MULTI-PAGE FULL DOMAIN AEO AUDIT"
    : "ANSWER ENGINE OPTIMIZATION AUDIT";

  documentChildren.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: auditTypeTitle, bold: true, size: 28, color: "0f172a" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: `Target Domain: ${website_url || "N/A"}`, bold: true, size: 16, color: "334155" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: `Audit Scope: ${isDomainAudit ? "Multi-Page Domain Audit" : "Single Route Audit"}`, bold: true, size: 13, color: "2563eb" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 500 }, children: [new TextRun({ text: `${isDomainAudit ? "Overall Domain Avg Score" : "Overall Visibility Score"}: ${score}/100`, bold: true, size: 26, color: cleanHexColor })] })
  );

  // 3. SEKCIJA ZA MULTI-PAGE DOMAIN STATISTIKU
  if (isDomainAudit && domainStats) {
    documentChildren.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "Multi-Page Domain Coverage & Health", color: "0f172a", bold: true, size: 24 })] }),
      new Paragraph({ text: `• Discovered & Sampled Routes: ${domainStats.totalPagesAudited || pagesAuditedCount || 1} Pages` }),
      new Paragraph({ text: `• Average Depth: ${domainStats.avgWordCount || 0} words per page` }),
      new Paragraph({ text: `• Schema.org Graph Coverage: ${domainStats.schemaCoveragePercent || 0}% of sampled pages` }),
      new Paragraph({ text: `• Single H1 Cascade Health: ${domainStats.hasH1CoveragePercent || 0}% of sampled pages` }),
      new Paragraph({ text: `• Meta Snippets Presence: ${domainStats.hasMetaDescriptionPercent || 0}% of sampled pages` }),
      new Paragraph({ text: `• OpenGraph Social Coverage: ${domainStats.openGraphCoveragePercent || 0}% of sampled pages` }),
      new Paragraph({ text: `• Conversational Q&A Blocks Density: ${domainStats.qaBlocksCoveragePercent || 0}% of sampled pages` }),
      new Paragraph({ text: `• Table & List Structures (RAG): ${domainStats.tablesOrListsCoveragePercent || 0}% of sampled pages` })
    );

    if (domainStats.detectedSchemaTypes && domainStats.detectedSchemaTypes.length > 0) {
      const schemasStr = domainStats.detectedSchemaTypes
        .map(s => `${s.type} (${s.count})`)
        .join(", ");
      documentChildren.push(
        new Paragraph({ text: `• Discovered Schema Entities: ${schemasStr}` })
      );
    }

    if (sampledPages && sampledPages.length > 0) {
      documentChildren.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: "Sampled Domain Routes Audit Breakdown", color: "1e293b", bold: true, size: 18 })] })
      );

      sampledPages.forEach((p, idx) => {
        documentChildren.push(
          new Paragraph({ text: `  ${idx + 1}. [Score: ${p.score}/100] ${p.url}` })
        );
      });
    }

    if ((domainStats.missingSchemaPages && domainStats.missingSchemaPages.length > 0) || (domainStats.missingH1Pages && domainStats.missingH1Pages.length > 0)) {
      documentChildren.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: "Route Deficits & Missing Elements", color: "b91c1c", bold: true, size: 18 })] })
      );

      if (domainStats.missingSchemaPages && domainStats.missingSchemaPages.length > 0) {
        documentChildren.push(new Paragraph({ text: `• Pages Missing Schema.org Markup (${domainStats.missingSchemaPages.length}):`}));
        domainStats.missingSchemaPages.forEach(u => {
          documentChildren.push(new Paragraph({ text: `    - ${u}` }));
        });
      }

      if (domainStats.missingH1Pages && domainStats.missingH1Pages.length > 0) {
        documentChildren.push(new Paragraph({ text: `• Pages Missing Primary H1 Tag (${domainStats.missingH1Pages.length}):` }));
        domainStats.missingH1Pages.forEach(u => {
          documentChildren.push(new Paragraph({ text: `    - ${u}` }));
        });
      }
    }
  }

  // 4. EXECUTIVE SUMMARY
  documentChildren.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: isDomainAudit ? "Primary Route Executive Summary (Homepage / Root)" : "Executive Summary", color: "0f172a", bold: true, size: 24 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Target Title: ", bold: true }), new TextRun({ text: title || "N/A" })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Meta Description: ", bold: true }), new TextRun({ text: metaDescription || "N/A" })] }),
    new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: "Primary H1 Anchor: ", bold: true }), new TextRun({ text: h1 || "N/A" })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "AEO Content Core Pillars Score", color: "0f172a", bold: true, size: 24 })] }),
    new Paragraph({ text: `• BLUFF Alignment (Bottom Line Up Front): ${bluffScore || 5}/10` }),
    new Paragraph({ text: `• LLM Chunking Readiness (Atomic Structure): ${atomicStructureScore || 5}/10` }),
    new Paragraph({ text: `• Entity Density (vs Generic Fluff): ${entityDensityScore || 5}/10` }),
    new Paragraph({ text: `• Syntactic Simplicity (Declarative Writing): ${sentenceSimplicityScore || 5}/10` }),
    new Paragraph({ text: `• Google Non-Commodity Score (Content Authenticity): ${commodityContentScore || 5}/10` })
  );

  // 🚀 5. NOVA SEKCIJA: KEYWORD & SEMANTIC ENTITY ANALYSIS (DODATO)
  if (keywordsData) {
    documentChildren.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "AEO Keyword & Semantic Entity Analysis", color: "0f172a", bold: true, size: 24 })] }),
      new Paragraph({ text: `• Primary Detected Topic: ${keywordsData.primaryTopic || "N/A"}` }),
      new Paragraph({ text: `• AEO Keyword Score: ${keywordsData.aeoKeywordScore || 0}/100` }),
      
      // Extracted Keywords
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: "Extracted Target Keywords", color: "1e293b", bold: true, size: 18 })] })
    );

    if (keywordsData.extractedKeywords && keywordsData.extractedKeywords.length > 0) {
      keywordsData.extractedKeywords.forEach(kw => {
        documentChildren.push(
          new Paragraph({ text: `• ${kw.keyword} [Relevance: ${kw.aeoRelevance}] ${kw.foundInH1OrTitle ? "(In H1/Title)" : "(In Body)"}` })
        );
      });
    }

    // Missing Entities
    if (keywordsData.missingSemanticEntities && keywordsData.missingSemanticEntities.length > 0) {
      documentChildren.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: "Missing Semantic Entities (Expected by LLMs)", color: "b91c1c", bold: true, size: 18 })] })
      );
      keywordsData.missingSemanticEntities.forEach(entity => {
        documentChildren.push(new Paragraph({ text: `• ❌ ${entity}` }));
      });
    }

    // Recommended AI Questions
    if (keywordsData.recommendedAeoQuestions && keywordsData.recommendedAeoQuestions.length > 0) {
      documentChildren.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: "Target Conversational AI Intent Questions", color: "2563eb", bold: true, size: 18 })] })
      );
      keywordsData.recommendedAeoQuestions.forEach((q, idx) => {
        documentChildren.push(new Paragraph({ text: `• Q${idx + 1}: "${q}"` }));
      });
    }
  }

  // 6. TECHNICAL ACCESS & ENTITY MAP
  documentChildren.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "AI Crawler Access & Entity Token Map", color: "0f172a", bold: true, size: 24 })] }),
    new Paragraph({ text: `• Googlebot Engine Clearance: ${aiBotsStatus?.googlebot || "Allowed"}` }),
    new Paragraph({ text: `• OpenAI SearchBot Clearance: ${aiBotsStatus?.oaiSearchBot || "Allowed"}` }),
    new Paragraph({ text: `• Claude SearchBot Clearance: ${aiBotsStatus?.claudeSearchBot || "Allowed"}` }),
    new Paragraph({ text: `• Claude User Fetch Clearance: ${aiBotsStatus?.claudeUser || "Allowed"}` }),
    new Paragraph({ text: `• Perplexity AI Engine Status: ${aiBotsStatus?.perplexityBot || "Allowed"}` }),
    new Paragraph({ text: `• Microsoft Bingbot Indexation: ${aiBotsStatus?.bingbot || "Allowed"}` }),
    new Paragraph({ text: `• Meta AI Engine Clearance: ${aiBotsStatus?.metaExternalAgent || "Allowed"}` }),
    new Paragraph({ text: `• Grok AI Engine Status: ${aiBotsStatus?.grokBot || "Allowed"}` }),
    
    new Paragraph({ text: `• Master Robots.txt Directives: ${robotsRawContent ? "Valid Instructions Parsed" : "Missing / Public Access Active"}` }),
    new Paragraph({ text: `• LLMs.txt Context File Discovery: ${llmsRawContent && llmsRawContent.trim() ? "Discovered (Raw Text Content Parsed)" : "Missing / Not Found"}` }),

    new Paragraph({ text: `• Brand Disambiguation Alignment: ${entityTrustMap?.brandDisambiguationStatus || "Optimal"}` }),
    new Paragraph({ text: `• Semantic HTML5 Main Tag: ${semanticLayoutMap?.hasMainTag ? "Valid" : "Missing"}` }),
    new Paragraph({ text: `• H1 Title Tag Isolation: ${semanticLayoutMap?.hasSingleH1 ? "Optimal (Exactly 1 Tag Detected)" : "Anomaly Detected (Missing or Multiple H1s)"}` }),
    new Paragraph({ text: `• Heading Hierarchy Defect (Leap): ${semanticLayoutMap?.hasHeadingLeap ? "Anomaly Detected" : "Healthy Cascade"}` }),
    new Paragraph({ text: `• Visual RAG Video Assets: ${hasVideoElements ? "Optimized (Embedded Video Tracked)" : "Deficit (No Rich Media Found)"}` }), 
    new Paragraph({ text: `• Multimodal Image Alt Coverage: ${semanticLayoutMap ? semanticLayoutMap.totalImages - semanticLayoutMap.missingAltCount : 0}/${semanticLayoutMap ? semanticLayoutMap.totalImages : 0} Images Configured` }),
    new Paragraph({ text: `• JavaScript Framework Dependency: ${javascriptDependency === "Critical" ? "Critical Risk (Heavy Client-Side Rendering)" : "Optimal (Server-Side Rendered / Fast)"}` }),
    new Paragraph({ text: `• Autonomous AI Agent Readiness (ARIA Tree): ${semanticLayoutMap?.hasAriaLabels ? "Agent Ready (Structure Optimized)" : "Optimization Required (Interactive Fields Blind)"}` })
  );

  if (pageType === "Commercial") {
    documentChildren.push(
      new Paragraph({ text: `• Google Merchant & AI Product Graph Connectivity: ${entityTrustMap?.hasDeepProductSchema ? "Merchant Graph Active (Offers & Brand Verified)" : "Trust Properties Missing (Schema Deficit)"}` })
    );
  }

  if (pageType === "Homepage" && detectedSchemas?.includes("LocalBusiness")) {
    documentChildren.push(
      new Paragraph({ text: `• Local Business AI Coordinates Mapping: ${entityTrustMap?.hasDeepLocalBusinessSchema ? "Local Graph Optimal (NAP Array Verified)" : "Critical Missing Data (Phone/Address/Hours Deficit)"}` })
    );
  }

  // 7. PLAYBOOK SECTION
  documentChildren.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "Prioritized Tactical Optimization Playbook", color: "0f172a", bold: true, size: 24 })] }),
    
    ...(recommendations as Recommendation[]).flatMap((item: Recommendation, idx: number) => [
      new Paragraph({
        spacing: { before: 150, after: 60 },
        children: [
          new TextRun({ 
            text: `${idx + 1}. [${item.severity}] ${item.title}`, 
            bold: true, 
            color: item.severity === "CRITICAL" ? "b91c1c" : "1e40af", 
            size: 18 
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Description: ", bold: true, size: 16 }),
          new TextRun({ text: item.description, size: 16 })
        ]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({ text: "AEO Impact: ", bold: true, size: 16, color: "047857" }),
          new TextRun({ text: item.impact, size: 16, italics: true })
        ]
      })
    ]),

    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "Executive LLM Diagnostics", color: "0f172a", bold: true, size: 24 })] }),
    new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: aiAnalysis || "No custom insights generated." })] }),

    new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${authorName}. Powered by AEO Audit Pro.`, size: 14, color: "64748b", italics: true })] })
  );

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ 
                    text: `Prepared by: ${agencyName}`, 
                    size: 16, 
                    color: "94a3b8", 
                    italics: true 
                  })
                ],
              }),
            ],
          }),
        },
        children: documentChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanFileName = (website_url || agencyName).replace(/https?:\/\//, "").replace(/[^\w\b-]/g, "-");
  saveAs(blob, `AEO-Report-${cleanFileName}.docx`);
}