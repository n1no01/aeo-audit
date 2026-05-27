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
import { AuditData } from "./types";

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
  } = data;

  const { agencyName, brandColor, authorName, logoBase64 } = brandKit;
  const cleanHexColor = brandColor.replace("#", "").trim();
  const documentChildren: Paragraph[] = [];

  // Ako korisnik ima sačuvan logo, ubaci ga
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
      console.error("Failed to embedded custom logo inside document structure:", err);
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

  // Sastavljanje strukture dokumenta
  documentChildren.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "ANSWER ENGINE OPTIMIZATION AUDIT", bold: true, size: 32, color: "0f172a" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `Detected Category / Niche: ${pageCategory || "General Website"}`.toUpperCase(), bold: true, size: 14, color: "64748b" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: `Overall Visibility Score: ${score}/100`, bold: true, size: 26, color: cleanHexColor })] }),
    
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 }, children: [new TextRun({ text: "Executive Summary", color: "0f172a", bold: true, size: 24 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Target Title: ", bold: true }), new TextRun({ text: title })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Meta Description: ", bold: true }), new TextRun({ text: metaDescription })] }),
    new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: "Primary H1 Anchor: ", bold: true }), new TextRun({ text: h1 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "AEO Content Core Pillars Score", color: "0f172a", bold: true, size: 24 })] }),
    new Paragraph({ text: `• BLUFF Alignment (Bottom Line Up Front): ${bluffScore || 5}/10` }),
    new Paragraph({ text: `• LLM Chunking Readiness (Atomic Structure): ${atomicStructureScore || 5}/10` }),
    new Paragraph({ text: `• Entity Density (vs Generic Fluff): ${entityDensityScore || 5}/10` }),
    new Paragraph({ text: `• Syntactic Simplicity (Declarative Writing): ${sentenceSimplicityScore || 5}/10` }),

    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "AI Crawler Access & Entity Token Map", color: "0f172a", bold: true, size: 24 })] }),
    new Paragraph({ text: `• OpenAI GPTBot Clearance: ${aiBotsStatus?.gptBot || "Allowed"}` }),
    new Paragraph({ text: `• OpenAI SearchBot Clearance: ${aiBotsStatus?.oaiSearchBot || "Allowed"}` }),
    new Paragraph({ text: `• Perplexity AI Engine Status: ${aiBotsStatus?.perplexityBot || "Allowed"}` }),
    new Paragraph({ text: `• Claude Bot Architecture: ${aiBotsStatus?.claudeBot || "Allowed"}` }),
    new Paragraph({ text: `• Gemini Extended Radar: ${aiBotsStatus?.googleExtended || "Allowed"}` }),
    new Paragraph({ text: `• DeepSeek Engine Visibility: ${aiBotsStatus?.deepSeekBot || "Allowed"}` }),
    new Paragraph({ text: `• Applebot Agent Deployment: ${aiBotsStatus?.appleBotExtended || "Allowed"}` }),
    new Paragraph({ text: `• Microsoft Bingbot Indexation: ${aiBotsStatus?.bingbot || "Allowed"}` }),
    new Paragraph({ text: `• Brand Disambiguation Alignment: ${entityTrustMap?.brandDisambiguationStatus || "Optimal"}` }),
    new Paragraph({ text: `• Semantic HTML5 Main Tag: ${semanticLayoutMap?.hasMainTag ? "Valid" : "Missing"}` }),
    new Paragraph({ text: `• Heading Hierarchy Defect (Leap): ${semanticLayoutMap?.hasHeadingLeap ? "Anomaly Detected" : "Healthy Cascade"}` }),
    new Paragraph({ text: `• Visual RAG Video Assets: ${hasVideoElements ? "Optimized (Embedded Video Tracked)" : "Deficit (No Rich Media Found)"}` }), 
    new Paragraph({ text: `• Multimodal Image Alt Coverage: ${semanticLayoutMap ? semanticLayoutMap.totalImages - semanticLayoutMap.missingAltCount : 0}/${semanticLayoutMap ? semanticLayoutMap.totalImages : 0} Images Configured` }),
    new Paragraph({ text: `• JavaScript Framework Dependency: ${javascriptDependency === "Critical" ? "Critical Risk (Heavy Client-Side Rendering)" : "Optimal (Server-Side Rendered / Fast)"}` }),
    
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "Prioritized Tactical Optimization Playbook", color: "0f172a", bold: true, size: 24 })] }),
    ...recommendations.map((item) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 100 }, children: [new TextRun({ text: item })] })),

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
  saveAs(blob, `AEO-Report-${agencyName.replace(/\s+/g, "-")}.docx`);
}