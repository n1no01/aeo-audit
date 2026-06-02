import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 1. Izvlačenje brenda iz query parametara
  const { searchParams } = new URL(request.url);
  const brandName = searchParams.get('brand');

  if (!brandName) {
    return NextResponse.json({ error: 'Parametar "brand" je obavezan.' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_KNOWLEDGE_GRAPH_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google KG API ključ nedostaje u .env.' }, { status: 500 });
  }

  try {
    const encodedBrand = encodeURIComponent(brandName.trim());
    
    let url = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodedBrand}&key=${apiKey}&limit=3&languages=en`;
    
    let response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google API returned status ${response.status}`);
    }

    let data = await response.json();
    let elements = data.itemListElement;

    // FALLBACK MEHANIZAM: Ako nema rezultata na engleskom, skidamo jezičku barijeru 
    // kako bismo omogućili Google-u da pronađe lokalne/regionalne entitete (npr. ex-Yu firme).
    if (!elements || elements.length === 0) {
      url = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodedBrand}&key=${apiKey}&limit=3`;
      response = await fetch(url);
      if (response.ok) {
        data = await response.json();
        elements = data.itemListElement;
      }
    }

    // Ako Google i dalje nema pojma o čemu se radi
    if (!elements || elements.length === 0) {
      return NextResponse.json({
        hasEntity: false
      });
    }

    // Uzimamo prvi, najrelevantniji pogodak
    const bestMatch = elements[0];
    const entity = bestMatch.result;
    const score = bestMatch.resultScore;

    // Čišćenje ID-ja (Google često vraća "kg:/m/045c7b" pa ga čistimo u čisti ID ili ostavljamo cijeli)
    const rawId = entity['@id'] || entity['id'] || '';
    const cleanId = rawId.replace('kg:', '');

    // Vraćamo JSON koji se 100% poklapa sa tvojim frontend 'KnowledgeGraphData' interfejsom
    return NextResponse.json({
      hasEntity: true,
      entityId: cleanId || null,
      name: entity.name || brandName,
      types: Array.isArray(entity['@type']) ? entity['@type'] : [],
      description: entity.detailedDescription?.articleBody || entity.description || 'Nema dostupnog opisa za ovaj entitet.',
      knowledgeGraphUrl: entity.detailedDescription?.url || null,
      resultScore: score ? Math.round(score) : 0,
    });

  } catch (error) {
    console.error("Greška na Knowledge Graph API-ju:", error);
    return NextResponse.json({ error: 'Interna greška servera tokom provjere entiteta.' }, { status: 500 });
  }
}