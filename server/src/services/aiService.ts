import OpenAI from 'openai';
import { AnalysisResult, FileExtractionResult, Ingredient, PetProfile } from '../types';
import type { ExamAlias } from './examAlias';
import { EXAM_ALIAS_TO_TYPE } from './examAlias';
import { EXAM_ALIAS_PROMPTS } from './examAliasPrompts';
import { logger } from '../utils/logger';

interface AttachmentInput {
  fileName: string;
  mimeType: string;
  base64Data: string;
}

const SYSTEM_PROMPT = `Si odborný veterinárny výživový poradca a analytik zloženia krmív pre zvieratá. Tvoja úloha je analyzovať zloženie krmiva a poskytnúť detailné hodnotenie.

## BEZPEČNOSTNÉ PRAVIDLÁ (NAJVYŠŠIA PRIORITA)

1. ALERGÉNY A INTOLERANCIE - KRITICKÁ KONTROLA:
   - Ak je poskytnutý profil zvieraťa s alergiami alebo intoleranciami, MUSÍŠ skontrolovať KAŽDÚ ingredienciu proti KAŽDEJ alergii/intolerancii.
   - Alergén môže byť uvedený pod rôznymi názvami (napr. "kura" = "kuracia", "kuřecí", "drůbeží", "hydrolyzovaný kurací proteín", "kurací tuk", "kuracia pečeň").
   - "Lepok" sa nachádza v: pšenica, jačmeň, raž, obilniny (ak nie je špecifikované "bezlepkové").
   - "Laktóza" sa nachádza v: mlieko, mliečne produkty, srvátka, kaszeín, syridlo.
   - Ak nájdeš AKÝKOĽVEK potenciálny alergén, MUSÍŠ ho uviesť v allergenWarnings s severity "critical".
   - NIKDY nepodceňuj riziko alergie — je lepšie varovať zbytočne ako prehliadnuť nebezpečenstvo.
   - Pri pochybnosti VŽDY varuj (false positive je akceptovateľný, false negative NIE).

2. ZDRAVOTNÉ STAVY:
   - Ak má zviera diabetes: varuj pred vysokým obsahom cukrov, jednoduchých sacharidov.
   - Ak má zviera problémy s obličkami: varuj pred vysokým obsahom proteínov a fosforu.
   - Ak má zviera obezitu: varuj pred vysokým obsahom tukov a kalórií.
   - Ak má zviera problémy s kĺbmi: hodnoť pozitívne glukozamín/chondroitín.
   - Ak má zviera citlivé trávenie: varuj pred obilninami, sójou, kukuricou.

3. VEKOVÉ ODPORÚČANIA:
   - Šteňatá/mačiatka: potrebujú vyšší proteín, DHA, vápnik.
   - Seniori: nižší proteín (ak nie sú problémy s obličkami), viac vlákniny, kĺbová podpora.

## FORMÁT ODPOVEDE

Vráť VÝHRADNE validný JSON v tomto formáte (žiadny markdown, žiadny text mimo JSON):

{
  "score": <číslo 0-100>,
  "pros": ["výhoda 1", "výhoda 2", ...],
  "cons": ["nevýhoda 1", "nevýhoda 2", ...],
  "recommendation": {
    "suitableFor": ["typ zvieraťa 1", ...],
    "notRecommendedFor": ["typ zvieraťa 1", ...]
  },
  "ingredients": [
    {
      "name": "názov",
      "category": "protein|carb|fat|fiber|additive|mineral|vitamin",
      "percentage": <číslo alebo null>,
      "quality": "excellent|good|average|poor|harmful"
    }
  ],
  "summary": "Celkové zhrnutie v 2-3 vetách po slovensky.",
  "allergenWarnings": [
    {
      "severity": "critical|high|moderate",
      "allergen": "názov alergénu",
      "ingredientName": "ingrediencia ktorá ho obsahuje",
      "message": "Varovanie v slovenčine — jasné, zrozumiteľné, s vysvetlením rizika"
    }
  ],
  "healthWarnings": [
    {
      "severity": "critical|high|moderate",
      "condition": "zdravotný stav",
      "message": "Varovanie v slovenčine"
    }
  ],
  "personalizedNote": {
    "petName": "meno zvieraťa",
    "overallVerdict": "NEBEZPEČNÉ|S VÝHRADAMI|VHODNÉ|VÝBORNÉ",
    "explanation": "Personalizované vysvetlenie pre toto konkrétne zviera (2-4 vety)."
  }
}

## PRAVIDLÁ HODNOTENIA SKÓRE:
- 0-20: Nebezpečné/toxické pre zvieratá
- 21-40: Veľmi nízka kvalita, neodporúča sa
- 41-60: Priemerná kvalita, existujú lepšie alternatívy
- 61-80: Dobrá kvalita
- 81-100: Výborná kvalita, prémiové krmivo

## PRAVIDLÁ PRE INGREDIENCIE:
- Mäso na prvom mieste = pozitívne (čím vyššie percento, tým lepšie)
- "Mäsová múčka", "vedľajšie živočíšne produkty" = nízka kvalita
- Kukurica, pšenica, sója ako hlavné ingrediencie = plnidlá, nízka kvalita
- Umelé farbivá, konzervanty (BHA, BHT, ethoxyquín) = škodlivé
- Probiotiká, omega-3, glukozamín = pozitívne prídavky

## DÔLEŽITÉ:
- Všetky texty MUSIA byť v slovenčine.
- Buď objektívny ale opatrný — ak si nie si istý bezpečnosťou, VŽDY varuj.
- Ak nie je poskytnutý profil zvieraťa, allergenWarnings a healthWarnings budú prázdne polia a personalizedNote bude null.
- Ak je poskytnutý profil, personalizedNote je POVINNÉ.`;

function buildUserMessage(composition: string, petProfile?: PetProfile): string {
  let msg = `## ZLOŽENIE KRMIVA:\n${composition}`;

  if (petProfile) {
    msg += `\n\n## PROFIL ZVIERAŤA:\n`;
    msg += `- Meno: ${petProfile.name}\n`;
    msg += `- Typ: ${petProfile.animalType === 'dog' ? 'Pes' : petProfile.animalType === 'cat' ? 'Mačka' : 'Iné zviera'}\n`;
    if (petProfile.breed) msg += `- Plemeno: ${petProfile.breed}\n`;
    if (petProfile.ageYears !== undefined || petProfile.ageMonths !== undefined) {
      const years = petProfile.ageYears ?? 0;
      const months = petProfile.ageMonths ?? 0;
      msg += `- Vek: ${years > 0 ? `${years} ${years === 1 ? 'rok' : years < 5 ? 'roky' : 'rokov'}` : ''}${years > 0 && months > 0 ? ' a ' : ''}${months > 0 ? `${months} ${months === 1 ? 'mesiac' : months < 5 ? 'mesiace' : 'mesiacov'}` : ''}\n`;
    }
    if (petProfile.weightKg) msg += `- Váha: ${petProfile.weightKg} kg\n`;
    if (petProfile.size) msg += `- Veľkosť: ${petProfile.size}\n`;
    if (petProfile.lifeStage) msg += `- Životné štádium: ${petProfile.lifeStage}\n`;
    if (petProfile.activityLevel) msg += `- Úroveň aktivity: ${petProfile.activityLevel}\n`;

    if (petProfile.allergies.length > 0) {
      msg += `\n### ⚠️ ALERGIE (KRITICKÁ KONTROLA!):\n`;
      petProfile.allergies.forEach(a => { msg += `- ${a}\n`; });
    }
    if (petProfile.intolerances.length > 0) {
      msg += `\n### ⚠️ INTOLERANCIE (KRITICKÁ KONTROLA!):\n`;
      petProfile.intolerances.forEach(i => { msg += `- ${i}\n`; });
    }
    if (petProfile.healthConditions.length > 0) {
      msg += `\n### ZDRAVOTNÉ STAVY:\n`;
      petProfile.healthConditions.forEach(h => { msg += `- ${h}\n`; });
    }
    if (petProfile.notes) {
      msg += `\n### POZNÁMKY OD MAJITEĽA:\n${petProfile.notes}\n`;
    }
  }

  return msg;
}

function decodeBase64(base64Data: string): Buffer {
  return Buffer.from(base64Data.replace(/^data:.*;base64,/, ''), 'base64');
}

function extractTextFromPdfBuffer(buffer: Buffer): string {
  const rawText = buffer.toString('latin1');
  const chunks = [...rawText.matchAll(/\(([^)]{3,})\)\s*Tj/g)].map((m) => m[1]);
  const text = chunks
    .join(' ')
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}


async function extractTextFromImageWithGoogleVision(attachment: AttachmentInput): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return '';

  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: attachment.base64Data },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('[AI Service] Google Vision HTTP error:', response.status);
      return '';
    }

    const payload = (await response.json()) as {
      responses?: Array<{ fullTextAnnotation?: { text?: string } }>;
    };

    const text = payload.responses?.[0]?.fullTextAnnotation?.text ?? '';
    return text.trim();
  } catch (error) {
    console.error('[AI Service] Google Vision OCR failed:', error);
    return '';
  }
}

async function normalizeExtractedTextWithOpenAI(text: string): Promise<string> {
  const client = getOpenAIClient();
  if (!client || !text.trim()) {
    return text.trim();
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: 'Uprav OCR text bez zmeny významu: oprav iba zjavné OCR chyby, zachovaj jazyk a štruktúru. Vráť iba čistý text.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    return response.choices[0]?.message?.content?.trim() ?? text.trim();
  } catch (error) {
    console.error('[AI Service] OpenAI text normalization failed:', error);
    return text.trim();
  }
}

async function extractTextFromImageWithOpenAI(attachment: AttachmentInput): Promise<string> {
  const client = getOpenAIClient();
  if (!client) return '';

  try {
    const dataUrl = `data:${attachment.mimeType};base64,${attachment.base64Data}`;
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Prepíš všetok čitateľný text zo zdravotného dokumentu zvieraťa. Vráť iba čistý text bez komentárov.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    return response.choices[0]?.message?.content?.trim() ?? '';
  } catch (error) {
    console.error('[AI Service] OpenAI OCR failed:', error);
    return '';
  }
}

interface DocumentContextAnalysis {
  documentType: string;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  keyFindings: string[];
  recommendedActions: string[];
}

interface HealthPassportInterpretation {
  summary: string;
  aiUnderstanding: string;
  vaccinations: Array<{
    disease: string;
    vaccineName: string;
    dateAdministered: string;
    validUntil?: string;
    batchNumber?: string;
    veterinarian?: string;
    manufacturer?: string;
    confidence: 'high' | 'medium' | 'low';
    notes?: string;
  }>;
}

const FEED_RELATED_KEYWORDS = [
  'zloženie', 'granule', 'krmivo', 'protein', 'tuk', 'vláknina', 'popol', 'ingrediencie',
  'kuracie', 'hovädzie', 'losos', 'kukurica', 'pšenica', 'mäsová múčka',
];

function looksLikeFeedComposition(text: string): boolean {
  const lowered = text.toLowerCase();
  const hits = FEED_RELATED_KEYWORDS.filter((keyword) => lowered.includes(keyword)).length;
  const hasPercentages = /\b\d{1,2}(?:[,.]\d+)?\s?%/u.test(lowered);
  return hits >= 2 || (hits >= 1 && hasPercentages);
}

async function analyzeDocumentContextWithOpenAI(text: string): Promise<DocumentContextAnalysis | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Si veterinárny asistent. Urči kontext extrahovaného textu z dokumentu (fotka/PDF) a vráť iba JSON.
Formát:
{
  "documentType": "krmivo|laboratorny-vysledok|veterinarna-sprava|ucet|ine",
  "confidence": "high|medium|low",
  "summary": "stručné zhrnutie po slovensky",
  "keyFindings": ["bod 1", "bod 2"],
  "recommendedActions": ["krok 1", "krok 2"]
}`,
        },
        {
          role: 'user',
          content: text.slice(0, 12000),
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as Record<string, unknown>;

    const analysis: DocumentContextAnalysis = {
      documentType: typeof parsed.documentType === 'string' ? parsed.documentType : 'ine',
      confidence:
        parsed.confidence === 'high' || parsed.confidence === 'medium' || parsed.confidence === 'low'
          ? parsed.confidence
          : 'low',
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Kontext dokumentu sa nepodarilo spoľahlivo určiť.',
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings.filter((x): x is string => typeof x === 'string') : [],
      recommendedActions: Array.isArray(parsed.recommendedActions)
        ? parsed.recommendedActions.filter((x): x is string => typeof x === 'string')
        : [],
    };

    logger.info('OpenAI určilo kontext dokumentu', {
      documentType: analysis.documentType,
      confidence: analysis.confidence,
      summaryPreview: analysis.summary.slice(0, 160),
    });

    return analysis;
  } catch (error) {
    console.error('[AI Service] Document context analysis failed:', error);
    return null;
  }
}

async function analyzeExamDocumentWithOpenAI(text: string, examAlias: ExamAlias): Promise<string> {
  const client = getOpenAIClient();
  if (!client) {
    return [
      `Analyzovaný typ vyšetrenia: ${examAlias}.`,
      'OpenAI API kľúč nie je dostupný, preto nebolo možné spustiť detailnú AI interpretáciu dokumentu.',
      'Skontrolujte prosím serverové nastavenia a skúste analýzu znova.',
    ].join(' ');
  }

  const examPrompt = EXAM_ALIAS_PROMPTS[examAlias];
  logger.info('Vyberám prompt pre analýzu vyšetrenia', {
    examAlias,
    examType: EXAM_ALIAS_TO_TYPE[examAlias],
    promptLength: examPrompt.length,
    promptPreview: examPrompt.slice(0, 160),
  });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    messages: [
      { role: 'system', content: examPrompt },
      { role: 'user', content: `Analyzuj tento dokument:\n\n${text.slice(0, 15000)}` },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? 'Nepodarilo sa vytvoriť analýzu dokumentu.';
}


function looksLikeHealthPassport(text: string): boolean {
  const lowered = text.toLowerCase();
  const keywords = ['zdravotný pas', 'vaccination', 'vakc', 'rabies', 'veterin', 'passport', 'očkov'];
  return keywords.filter((k) => lowered.includes(k)).length >= 2;
}

async function interpretHealthPassportWithOpenAI(text: string): Promise<HealthPassportInterpretation | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Si veterinárny asistent. Z textu zdravotného pasu zvieraťa priprav detailný rozbor očkovaní.
Vráť iba JSON v tvare:
{
  "summary": "stručné zhrnutie",
  "aiUnderstanding": "ako AI chápe čo je dokument a prečo (2-4 vety)",
  "vaccinations": [
    {
      "disease": "proti čomu bolo očkovanie",
      "vaccineName": "názov vakcíny",
      "dateAdministered": "YYYY-MM-DD alebo pôvodný dátum",
      "validUntil": "YYYY-MM-DD alebo text",
      "batchNumber": "šarža",
      "veterinarian": "veterinár/klinika",
      "manufacturer": "výrobca",
      "confidence": "high|medium|low",
      "notes": "doplňujúca poznámka"
    }
  ]
}
Ak údaj v texte chýba, použi prázdny string alebo pole.`,
        },
        {
          role: 'user',
          content: text.slice(0, 12000),
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const rawVaccinations = Array.isArray(parsed.vaccinations) ? parsed.vaccinations : [];

    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Z textu sa nepodarilo spoľahlivo vytvoriť zhrnutie očkovaní.',
      aiUnderstanding:
        typeof parsed.aiUnderstanding === 'string'
          ? parsed.aiUnderstanding
          : 'AI rozpoznala zdravotný dokument podľa veterinárnych výrazov a štruktúry dátumov/štítkov.',
      vaccinations: rawVaccinations
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const i = item as Record<string, unknown>;
          const confidence: 'high' | 'medium' | 'low' =
            i.confidence === 'high' || i.confidence === 'medium' || i.confidence === 'low' ? i.confidence : 'low';
          return {
            disease: typeof i.disease === 'string' ? i.disease : '',
            vaccineName: typeof i.vaccineName === 'string' ? i.vaccineName : '',
            dateAdministered: typeof i.dateAdministered === 'string' ? i.dateAdministered : '',
            validUntil: typeof i.validUntil === 'string' ? i.validUntil : undefined,
            batchNumber: typeof i.batchNumber === 'string' ? i.batchNumber : undefined,
            veterinarian: typeof i.veterinarian === 'string' ? i.veterinarian : undefined,
            manufacturer: typeof i.manufacturer === 'string' ? i.manufacturer : undefined,
            confidence,
            notes: typeof i.notes === 'string' ? i.notes : undefined,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    };
  } catch (error) {
    console.error('[AI Service] Health passport interpretation failed:', error);
    return null;
  }
}

export async function extractTextFromAttachment(
  attachment: AttachmentInput,
  examAlias?: ExamAlias,
): Promise<FileExtractionResult> {
  const supportedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedMimeTypes.includes(attachment.mimeType)) {
    throw new Error('Podporované sú len PDF, JPG, PNG a WEBP súbory.');
  }

  if (attachment.base64Data.length > 7_000_000) {
    throw new Error('Súbor je príliš veľký (max 5 MB).');
  }

  if (attachment.mimeType === 'application/pdf') {
    const pdfText = extractTextFromPdfBuffer(decodeBase64(attachment.base64Data));
    if (!pdfText) {
      throw new Error('Z PDF sa nepodarilo získať text. Skúste kvalitnejší export alebo fotku dokumentu.');
    }

    const normalizedPdfText = await normalizeExtractedTextWithOpenAI(pdfText);

    const contextAnalysis = await analyzeDocumentContextWithOpenAI(normalizedPdfText);
    const shouldRunFeedAnalysis = contextAnalysis?.documentType === 'krmivo' || looksLikeFeedComposition(normalizedPdfText);
    const shouldInterpretPassport =
      contextAnalysis?.documentType === 'veterinarna-sprava' || looksLikeHealthPassport(normalizedPdfText);
    const healthPassportInterpretation = shouldInterpretPassport
      ? await interpretHealthPassportWithOpenAI(normalizedPdfText)
      : null;

    const examAnalysis = examAlias
      ? {
          examAlias,
          examType: EXAM_ALIAS_TO_TYPE[examAlias],
          analysis: await analyzeExamDocumentWithOpenAI(normalizedPdfText, examAlias),
        }
      : undefined;

    logger.info('Backend spracoval PDF prílohu', {
      source: normalizedPdfText !== pdfText.trim() ? 'openai' : 'pdf-parser',
      contextDocumentType: contextAnalysis?.documentType ?? null,
      examAlias: examAnalysis?.examAlias ?? null,
      examType: examAnalysis?.examType ?? null,
      hasFeedAnalysis: shouldRunFeedAnalysis,
      hasHealthPassportInterpretation: Boolean(healthPassportInterpretation),
    });

    return {
      extractedText: normalizedPdfText,
      source: normalizedPdfText !== pdfText.trim() ? 'openai' : 'pdf-parser',
      contextAnalysis: contextAnalysis ?? undefined,
      healthPassportInterpretation: healthPassportInterpretation ?? undefined,
      feedAnalysis: shouldRunFeedAnalysis ? await callAiModel(normalizedPdfText) : undefined,
      examAnalysis,
    };
  }

  const textFromVision = await extractTextFromImageWithGoogleVision(attachment);
  const textFromOpenAIImage = await extractTextFromImageWithOpenAI(attachment);
  const bestText = textFromVision.length >= textFromOpenAIImage.length ? textFromVision : textFromOpenAIImage;

  if (!bestText) {
    throw new Error('Z obrázka sa nepodarilo prečítať text. Nahrajte ostrejšiu fotku.');
  }

  const normalizedText = await normalizeExtractedTextWithOpenAI(bestText);

  const contextAnalysis = await analyzeDocumentContextWithOpenAI(normalizedText);
  const shouldRunFeedAnalysis = contextAnalysis?.documentType === 'krmivo' || looksLikeFeedComposition(normalizedText);
  const shouldInterpretPassport =
    contextAnalysis?.documentType === 'veterinarna-sprava' || looksLikeHealthPassport(normalizedText);
  const healthPassportInterpretation = shouldInterpretPassport
    ? await interpretHealthPassportWithOpenAI(normalizedText)
    : null;

  const examAnalysis = examAlias
    ? {
        examAlias,
        examType: EXAM_ALIAS_TO_TYPE[examAlias],
        analysis: await analyzeExamDocumentWithOpenAI(normalizedText, examAlias),
      }
      : undefined;

  logger.info('Backend spracoval obrázkovú prílohu', {
    source: textFromVision && textFromOpenAIImage ? 'google-vision+openai' : textFromVision ? 'google-vision' : 'openai',
    contextDocumentType: contextAnalysis?.documentType ?? null,
    examAlias: examAnalysis?.examAlias ?? null,
    examType: examAnalysis?.examType ?? null,
    hasFeedAnalysis: shouldRunFeedAnalysis,
    hasHealthPassportInterpretation: Boolean(healthPassportInterpretation),
  });

  return {
    extractedText: normalizedText,
    source: textFromVision && textFromOpenAIImage ? 'google-vision+openai' : textFromVision ? 'google-vision' : 'openai',
    contextAnalysis: contextAnalysis ?? undefined,
    healthPassportInterpretation: healthPassportInterpretation ?? undefined,
    feedAnalysis: shouldRunFeedAnalysis ? await callAiModel(normalizedText) : undefined,
    examAnalysis,
  };
}

// ── Mock fallback (old logic preserved) ──────────────────────────────────────

const INGREDIENT_DB: Record<string, { category: Ingredient['category']; qualityNum: number }> = {
  'kurací': { category: 'protein', qualityNum: 9 },
  'kuracie': { category: 'protein', qualityNum: 9 },
  'kuřecí': { category: 'protein', qualityNum: 9 },
  'kura': { category: 'protein', qualityNum: 9 },
  'morka': { category: 'protein', qualityNum: 8 },
  'morčacie': { category: 'protein', qualityNum: 8 },
  'hovädzie': { category: 'protein', qualityNum: 8 },
  'hovězí': { category: 'protein', qualityNum: 8 },
  'jahňacie': { category: 'protein', qualityNum: 9 },
  'jehněčí': { category: 'protein', qualityNum: 9 },
  'losos': { category: 'protein', qualityNum: 10 },
  'ryba': { category: 'protein', qualityNum: 9 },
  'tuniak': { category: 'protein', qualityNum: 9 },
  'kačacie': { category: 'protein', qualityNum: 8 },
  'kačica': { category: 'protein', qualityNum: 8 },
  'divina': { category: 'protein', qualityNum: 9 },
  'jelenie': { category: 'protein', qualityNum: 9 },
  'králik': { category: 'protein', qualityNum: 8 },
  'mäso': { category: 'protein', qualityNum: 7 },
  'maso': { category: 'protein', qualityNum: 7 },
  'dehydrované mäso': { category: 'protein', qualityNum: 8 },
  'čerstvé mäso': { category: 'protein', qualityNum: 10 },
  'mäsová múčka': { category: 'protein', qualityNum: 4 },
  'mäsové múčky': { category: 'protein', qualityNum: 3 },
  'vedľajšie živočíšne produkty': { category: 'protein', qualityNum: 2 },
  'hydrolyzovaný proteín': { category: 'protein', qualityNum: 5 },
  'vajce': { category: 'protein', qualityNum: 7 },
  'vajcia': { category: 'protein', qualityNum: 7 },
  'ryža': { category: 'carb', qualityNum: 6 },
  'hnedá ryža': { category: 'carb', qualityNum: 7 },
  'sladké zemiaky': { category: 'carb', qualityNum: 8 },
  'batáty': { category: 'carb', qualityNum: 8 },
  'zemiaky': { category: 'carb', qualityNum: 6 },
  'hrášok': { category: 'carb', qualityNum: 7 },
  'šošovica': { category: 'carb', qualityNum: 7 },
  'cícer': { category: 'carb', qualityNum: 7 },
  'ovos': { category: 'carb', qualityNum: 6 },
  'jačmeň': { category: 'carb', qualityNum: 5 },
  'pšenica': { category: 'carb', qualityNum: 3 },
  'kukurica': { category: 'carb', qualityNum: 3 },
  'obilniny': { category: 'carb', qualityNum: 3 },
  'obilnín': { category: 'carb', qualityNum: 3 },
  'pšeničná múčka': { category: 'carb', qualityNum: 2 },
  'kukuričná múčka': { category: 'carb', qualityNum: 2 },
  'kukuričný lepok': { category: 'carb', qualityNum: 1 },
  'pšeničný lepok': { category: 'carb', qualityNum: 1 },
  'sója': { category: 'carb', qualityNum: 2 },
  'sójová múčka': { category: 'carb', qualityNum: 1 },
  'lososový olej': { category: 'fat', qualityNum: 10 },
  'rybí olej': { category: 'fat', qualityNum: 9 },
  'kurací tuk': { category: 'fat', qualityNum: 7 },
  'živočíšny tuk': { category: 'fat', qualityNum: 4 },
  'rastlinný olej': { category: 'fat', qualityNum: 5 },
  'slnečnicový olej': { category: 'fat', qualityNum: 5 },
  'ľanový olej': { category: 'fat', qualityNum: 8 },
  'kokosový olej': { category: 'fat', qualityNum: 6 },
  'repa': { category: 'fiber', qualityNum: 7 },
  'repný rezok': { category: 'fiber', qualityNum: 7 },
  'celulóza': { category: 'fiber', qualityNum: 4 },
  'jablko': { category: 'fiber', qualityNum: 8 },
  'mrkva': { category: 'fiber', qualityNum: 8 },
  'tekvica': { category: 'fiber', qualityNum: 8 },
  'špenát': { category: 'fiber', qualityNum: 7 },
  'brusnice': { category: 'fiber', qualityNum: 8 },
  'čučoriedky': { category: 'fiber', qualityNum: 8 },
  'vitamín': { category: 'additive', qualityNum: 7 },
  'minerály': { category: 'additive', qualityNum: 7 },
  'probiotik': { category: 'additive', qualityNum: 9 },
  'prebiotik': { category: 'additive', qualityNum: 8 },
  'glukozamín': { category: 'additive', qualityNum: 8 },
  'chondroitín': { category: 'additive', qualityNum: 8 },
  'taurín': { category: 'additive', qualityNum: 7 },
  'konzervant': { category: 'additive', qualityNum: 3 },
  'farbivo': { category: 'additive', qualityNum: 1 },
  'umelé farbivo': { category: 'additive', qualityNum: 0 },
  'aróma': { category: 'additive', qualityNum: 2 },
  'cukor': { category: 'additive', qualityNum: 0 },
  'soľ': { category: 'additive', qualityNum: 2 },
  'antioxidant': { category: 'additive', qualityNum: 6 },
  'tokoferol': { category: 'additive', qualityNum: 8 },
  'rozmarín': { category: 'additive', qualityNum: 8 },
};

function numToQuality(q: number): Ingredient['quality'] {
  if (q >= 8) return 'excellent';
  if (q >= 6) return 'good';
  if (q >= 4) return 'average';
  if (q >= 2) return 'poor';
  return 'harmful';
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function detectIngredients(composition: string): Ingredient[] {
  const normalized = normalizeText(composition);
  const found: Ingredient[] = [];
  const matched = new Set<string>();
  const sortedKeys = Object.keys(INGREDIENT_DB).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (normalized.includes(key) && !matched.has(key)) {
      matched.add(key);
      const info = INGREDIENT_DB[key];
      const percentRegex = new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^,]*?(\\d{1,2})\\s*%`, 'i');
      const percentMatch = normalized.match(percentRegex);

      found.push({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        category: info.category,
        percentage: percentMatch ? parseInt(percentMatch[1], 10) : undefined,
        quality: numToQuality(info.qualityNum),
      });
    }
  }
  return found;
}

function calculateScore(ingredients: Ingredient[]): number {
  if (ingredients.length === 0) return 40;
  const proteins = ingredients.filter((i) => i.category === 'protein');
  const carbs = ingredients.filter((i) => i.category === 'carb');
  const fats = ingredients.filter((i) => i.category === 'fat');
  const fibers = ingredients.filter((i) => i.category === 'fiber');
  const additives = ingredients.filter((i) => i.category === 'additive');
  let score = 50;

  if (proteins.length > 0) {
    const avg = proteins.reduce((s, p) => s + (INGREDIENT_DB[p.name.toLowerCase()]?.qualityNum ?? 5), 0) / proteins.length;
    score += avg * 2;
    if (proteins.length >= 2) score += 5;
  } else {
    score -= 15;
  }
  if (carbs.length > 0) {
    const avg = carbs.reduce((s, c) => s + (INGREDIENT_DB[c.name.toLowerCase()]?.qualityNum ?? 5), 0) / carbs.length;
    if (avg < 4) score -= 10;
    else if (avg > 6) score += 5;
  }
  if (fats.length > 0) {
    const avg = fats.reduce((s, f) => s + (INGREDIENT_DB[f.name.toLowerCase()]?.qualityNum ?? 5), 0) / fats.length;
    score += avg;
  }
  if (fibers.length > 0) score += Math.min(fibers.length * 2, 8);
  for (const additive of additives) {
    const q = INGREDIENT_DB[additive.name.toLowerCase()]?.qualityNum ?? 5;
    if (q < 3) score -= 3;
    else if (q > 7) score += 2;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function generateMockPros(ingredients: Ingredient[], score: number): string[] {
  const pros: string[] = [];
  const proteins = ingredients.filter((i) => i.category === 'protein');
  const fibers = ingredients.filter((i) => i.category === 'fiber');
  const fats = ingredients.filter((i) => i.category === 'fat');
  if (proteins.length >= 2) pros.push('Viacero zdrojov živočíšnych proteínov');
  else if (proteins.length === 1) pros.push(`Obsahuje ${proteins[0].name.toLowerCase()} ako zdroj proteínu`);
  if (proteins.some((p) => (INGREDIENT_DB[p.name.toLowerCase()]?.qualityNum ?? 0) >= 8))
    pros.push('Kvalitné zdroje proteínov (mäso/ryba vysokej kvality)');
  if (fibers.length >= 2) pros.push('Bohaté na vlákninu z prírodných zdrojov (ovocie, zelenina)');
  if (fats.some((f) => (INGREDIENT_DB[f.name.toLowerCase()]?.qualityNum ?? 0) >= 7))
    pros.push('Kvalitné zdroje omega mastných kyselín');
  if (ingredients.some((i) => i.name.toLowerCase().includes('probiotik')))
    pros.push('Obsahuje probiotiká pre zdravé trávenie');
  if (ingredients.some((i) => i.name.toLowerCase().includes('glukozamín') || i.name.toLowerCase().includes('chondroitín')))
    pros.push('Podpora kĺbov (glukozamín/chondroitín)');
  if (score >= 70) pros.push('Celkovo vyvážené zloženie');
  if (pros.length === 0) pros.push('Základné nutričné hodnoty sú prítomné');
  return pros;
}

function generateMockCons(ingredients: Ingredient[], score: number): string[] {
  const cons: string[] = [];
  const proteins = ingredients.filter((i) => i.category === 'protein');
  const carbs = ingredients.filter((i) => i.category === 'carb');
  const additives = ingredients.filter((i) => i.category === 'additive');
  if (proteins.length === 0) cons.push('Neidentifikovaný jasný zdroj živočíšneho proteínu');
  if (proteins.some((p) => (INGREDIENT_DB[p.name.toLowerCase()]?.qualityNum ?? 5) <= 4))
    cons.push('Obsahuje nízkokvalitnú formu proteínu (múčky, vedľajšie produkty)');
  const grains = carbs.filter((c) => (INGREDIENT_DB[c.name.toLowerCase()]?.qualityNum ?? 5) <= 3);
  if (grains.length > 0) cons.push('Obsahuje lacné obilniny (pšenica, kukurica, sója) ako plnidlá');
  if (grains.length >= 2) cons.push('Príliš veľa obilnín – nízky podiel mäsa');
  if (additives.some((a) => (INGREDIENT_DB[a.name.toLowerCase()]?.qualityNum ?? 5) <= 2))
    cons.push('Obsahuje umelé prídavné látky (farbivá, arómy, konzervanty)');
  if (ingredients.some((i) => i.name.toLowerCase() === 'cukor'))
    cons.push('Obsahuje pridaný cukor – zbytočné a nezdravé');
  if (score < 50) cons.push('Celkovo nízka kvalita zloženia');
  if (cons.length === 0 && score < 90) cons.push('Zloženie je v poriadku, ale existujú lepšie alternatívy na trhu');
  return cons;
}

function generateMockRecommendation(ingredients: Ingredient[], score: number) {
  const suitableFor: string[] = [];
  const notRecommendedFor: string[] = [];
  const proteins = ingredients.filter((i) => i.category === 'protein');
  const hasGrains = ingredients.some((i) => i.category === 'carb' && (INGREDIENT_DB[i.name.toLowerCase()]?.qualityNum ?? 5) <= 3);
  const hasFish = ingredients.some((i) => ['losos', 'ryba', 'tuniak'].includes(i.name.toLowerCase()));
  const hasJoint = ingredients.some((i) => i.name.toLowerCase().includes('glukozamín') || i.name.toLowerCase().includes('chondroitín'));
  if (score >= 70) { suitableFor.push('Dospelé psy'); if (proteins.length >= 2) suitableFor.push('Aktívne psy'); }
  if (score >= 80) suitableFor.push('Šteňatá (od 6 mesiacov)');
  if (hasFish) { suitableFor.push('Psy s citlivou kožou'); suitableFor.push('Psy s alergiami'); }
  if (hasJoint) { suitableFor.push('Staršie psy'); suitableFor.push('Veľké plemená'); }
  if (!hasGrains) suitableFor.push('Psy s citlivým trávením');
  if (score < 50) { notRecommendedFor.push('Šteňatá'); notRecommendedFor.push('Psy s alergiami'); }
  if (hasGrains) notRecommendedFor.push('Psy s gluténovou intoleranciou');
  if (score < 60) notRecommendedFor.push('Aktívne a pracovné psy');
  if (proteins.length === 0) notRecommendedFor.push('Rastúce šteňatá');
  if (suitableFor.length === 0) suitableFor.push('Dospelé psy s nízkou aktivitou');
  if (notRecommendedFor.length === 0) notRecommendedFor.push('Žiadne výrazné obmedzenia');
  return { suitableFor, notRecommendedFor };
}

function generateMockSummary(ingredients: Ingredient[], score: number): string {
  const proteins = ingredients.filter((i) => i.category === 'protein');
  if (score >= 80)
    return `Výborné krmivo s vysokým obsahom kvalitných proteínov${proteins.length > 0 ? ` (${proteins.map((p) => p.name.toLowerCase()).join(', ')})` : ''}. Vyvážené zloženie vhodné pre väčšinu psov. Odporúčame.`;
  if (score >= 60)
    return `Priemerné až dobré krmivo. ${proteins.length > 0 ? `Proteínový základ tvorí ${proteins.map((p) => p.name.toLowerCase()).join(', ')}.` : 'Zdroj proteínov nie je jednoznačný.'} Zloženie je akceptovateľné, ale existujú kvalitnejšie alternatívy.`;
  if (score >= 40)
    return `Podpriemerné krmivo. Zloženie obsahuje príliš veľa plnidiel a málo kvalitných surovín. Odporúčame zvážiť prechod na kvalitnejšiu značku.`;
  return `Nízkokvaliné krmivo s nevhodným zložením. Vysoký podiel obilnín, umelých prídavných látok a nedostatok kvalitných proteínov. Výrazne odporúčame zmenu krmiva.`;
}

// Simple allergen keyword mapping for mock detection
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  'kura/kuriatko': ['kurací', 'kuracie', 'kuřecí', 'kura', 'kuracia', 'hydrolyzovaný kurací'],
  'hovädzie': ['hovädzie', 'hovězí', 'hovädzia'],
  'jahňacie': ['jahňacie', 'jehněčí', 'jahňacia'],
  'ryby': ['losos', 'ryba', 'tuniak', 'rybí', 'lososový'],
  'vajcia': ['vajce', 'vajcia'],
  'pšenica': ['pšenica', 'pšeničná', 'pšeničný'],
  'kukurica': ['kukurica', 'kukuričná', 'kukuričný'],
  'sója': ['sója', 'sójová', 'sójový'],
  'mliečne produkty': ['mlieko', 'mliečne', 'srvátka', 'kaszeín', 'laktóza'],
  'lepok': ['lepok', 'pšenica', 'pšeničná', 'jačmeň', 'raž', 'obilniny'],
  'laktóza': ['mlieko', 'mliečne', 'srvátka', 'laktóza'],
  'obilniny': ['obilniny', 'obilnín', 'pšenica', 'kukurica', 'jačmeň', 'raž'],
};

function detectMockAllergens(composition: string, petProfile: PetProfile): { allergenWarnings: AnalysisResult['allergenWarnings']; healthWarnings: AnalysisResult['healthWarnings'] } {
  const normalized = normalizeText(composition);
  const allergenWarnings: AnalysisResult['allergenWarnings'] = [];
  const healthWarnings: AnalysisResult['healthWarnings'] = [];

  const allAllergens = [...petProfile.allergies, ...petProfile.intolerances];
  for (const allergen of allAllergens) {
    const normalizedAllergen = normalizeText(allergen);
    const keywords = ALLERGEN_KEYWORDS[normalizedAllergen] ?? [normalizedAllergen];
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        allergenWarnings.push({
          severity: petProfile.allergies.includes(allergen) ? 'critical' : 'moderate',
          allergen,
          ingredientName: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          message: `Zloženie obsahuje "${keyword}" — ${petProfile.name} má ${petProfile.allergies.includes(allergen) ? 'alergiu' : 'intoleranciu'} na ${allergen}. Toto krmivo NIE JE bezpečné!`,
        });
        break; // one warning per allergen
      }
    }
  }

  for (const condition of petProfile.healthConditions) {
    const nc = normalizeText(condition);
    if (nc.includes('obezit') && (normalized.includes('tuk') || normalized.includes('olej'))) {
      healthWarnings.push({ severity: 'high', condition, message: 'Krmivo obsahuje tukové zložky — zvážte nízkokalorické krmivo pre zviera s obezitou.' });
    } else if (nc.includes('oblič') && normalized.match(/proteín|mäso|maso|kurací|hovädzie|jahňacie|losos/)) {
      healthWarnings.push({ severity: 'high', condition, message: 'Vysoký obsah proteínov môže zaťažovať obličky. Konzultujte s veterinárom.' });
    } else if (nc.includes('diabetes') && (normalized.includes('cukor') || normalized.includes('kukurica') || normalized.includes('pšenica'))) {
      healthWarnings.push({ severity: 'high', condition, message: 'Krmivo obsahuje jednoduché sacharidy nevhodné pre zviera s diabetom.' });
    } else if (nc.includes('tráveni') && (normalized.includes('kukurica') || normalized.includes('sója') || normalized.includes('obilniny'))) {
      healthWarnings.push({ severity: 'moderate', condition, message: 'Obilniny a sója môžu zhoršiť citlivé trávenie.' });
    }
  }

  return { allergenWarnings, healthWarnings };
}

function generateMockPersonalizedNote(petProfile: PetProfile, score: number, allergenCount: number, healthWarningCount: number): AnalysisResult['personalizedNote'] {
  let verdict: string;
  let explanation: string;

  if (allergenCount > 0) {
    verdict = 'NEBEZPEČNÉ';
    explanation = `Toto krmivo obsahuje alergény nebezpečné pre ${petProfile.name}. Neodporúčame ho podávať.`;
  } else if (healthWarningCount > 0 || score < 50) {
    verdict = 'S VÝHRADAMI';
    explanation = `Krmivo má určité riziká pre ${petProfile.name} vzhľadom na jeho zdravotný stav. Konzultujte s veterinárom pred podávaním.`;
  } else if (score >= 80) {
    verdict = 'VÝBORNÉ';
    explanation = `Toto krmivo je výbornou voľbou pre ${petProfile.name}. Zloženie je kvalitné a vhodné pre ${petProfile.animalType === 'dog' ? 'psa' : petProfile.animalType === 'cat' ? 'mačku' : 'zviera'} tohto profilu.`;
  } else {
    verdict = 'VHODNÉ';
    explanation = `Krmivo je prijateľné pre ${petProfile.name}, ale existujú kvalitnejšie alternatívy na trhu.`;
  }

  return { petName: petProfile.name, overallVerdict: verdict, explanation };
}

async function callMockModel(composition: string, petProfile?: PetProfile): Promise<AnalysisResult> {
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
  const ingredients = detectIngredients(composition);
  const score = calculateScore(ingredients);

  let allergenWarnings: AnalysisResult['allergenWarnings'] = [];
  let healthWarnings: AnalysisResult['healthWarnings'] = [];
  let personalizedNote: AnalysisResult['personalizedNote'] = undefined;

  if (petProfile) {
    const warnings = detectMockAllergens(composition, petProfile);
    allergenWarnings = warnings.allergenWarnings;
    healthWarnings = warnings.healthWarnings;
    personalizedNote = generateMockPersonalizedNote(petProfile, score, allergenWarnings.length, healthWarnings.length);
  }

  return {
    score,
    pros: generateMockPros(ingredients, score),
    cons: generateMockCons(ingredients, score),
    recommendation: generateMockRecommendation(ingredients, score),
    ingredients,
    summary: generateMockSummary(ingredients, score),
    allergenWarnings,
    healthWarnings,
    personalizedNote,
  };
}

// ── OpenAI integration ───────────────────────────────────────────────────────

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-key-here') return null;
  return new OpenAI({ apiKey });
}

const VALID_CATEGORIES = new Set(['protein', 'carb', 'fat', 'fiber', 'additive', 'mineral', 'vitamin']);
const VALID_QUALITIES = new Set(['excellent', 'good', 'average', 'poor', 'harmful']);
const VALID_SEVERITIES = new Set(['critical', 'high', 'moderate']);

function validateAndSanitize(raw: unknown): AnalysisResult {
  const data = raw as Record<string, unknown>;

  const score = Math.max(0, Math.min(100, typeof data.score === 'number' ? Math.round(data.score) : 50));
  const pros = Array.isArray(data.pros) ? data.pros.filter((p): p is string => typeof p === 'string') : ['Analýza dokončená'];
  const cons = Array.isArray(data.cons) ? data.cons.filter((c): c is string => typeof c === 'string') : [];

  const recommendation = (() => {
    const rec = data.recommendation as Record<string, unknown> | undefined;
    return {
      suitableFor: Array.isArray(rec?.suitableFor) ? (rec.suitableFor as string[]) : [],
      notRecommendedFor: Array.isArray(rec?.notRecommendedFor) ? (rec.notRecommendedFor as string[]) : [],
    };
  })();

  const ingredients: Ingredient[] = Array.isArray(data.ingredients)
    ? data.ingredients.map((ing: Record<string, unknown>) => ({
        name: typeof ing.name === 'string' ? ing.name : 'Neznáma ingrediencia',
        category: VALID_CATEGORIES.has(ing.category as string)
          ? (ing.category as Ingredient['category'])
          : 'additive',
        percentage: typeof ing.percentage === 'number' ? ing.percentage : undefined,
        quality: VALID_QUALITIES.has(ing.quality as string)
          ? (ing.quality as Ingredient['quality'])
          : 'average',
      }))
    : [];

  const summary = typeof data.summary === 'string' ? data.summary : 'Analýza bola dokončená.';

  const allergenWarnings = Array.isArray(data.allergenWarnings)
    ? data.allergenWarnings
        .filter((w: Record<string, unknown>) => w && typeof w.allergen === 'string' && typeof w.message === 'string')
        .map((w: Record<string, unknown>) => ({
          severity: VALID_SEVERITIES.has(w.severity as string)
            ? (w.severity as 'critical' | 'high' | 'moderate')
            : 'critical',
          allergen: w.allergen as string,
          ingredientName: typeof w.ingredientName === 'string' ? w.ingredientName : 'Neznáma ingrediencia',
          message: w.message as string,
        }))
    : [];

  const healthWarnings = Array.isArray(data.healthWarnings)
    ? data.healthWarnings
        .filter((w: Record<string, unknown>) => w && typeof w.condition === 'string' && typeof w.message === 'string')
        .map((w: Record<string, unknown>) => ({
          severity: VALID_SEVERITIES.has(w.severity as string)
            ? (w.severity as 'critical' | 'high' | 'moderate')
            : 'high',
          condition: w.condition as string,
          message: w.message as string,
        }))
    : [];

  const personalizedNote = (() => {
    const pn = data.personalizedNote as Record<string, unknown> | undefined | null;
    if (!pn || typeof pn.petName !== 'string') return undefined;
    return {
      petName: pn.petName,
      overallVerdict: typeof pn.overallVerdict === 'string' ? pn.overallVerdict : 'S VÝHRADAMI',
      explanation: typeof pn.explanation === 'string' ? pn.explanation : '',
    };
  })();

  return {
    score,
    pros,
    cons,
    recommendation,
    ingredients,
    summary,
    allergenWarnings,
    healthWarnings,
    personalizedNote,
  };
}

async function callOpenAI(composition: string, petProfile?: PetProfile): Promise<AnalysisResult> {
  const client = getOpenAIClient()!;
  const userMessage = buildUserMessage(composition, petProfile);

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  const parsed = JSON.parse(content);
  return validateAndSanitize(parsed);
}

// ── Public API ───────────────────────────────────────────────────────────────

let modeLogged = false;

export async function callAiModel(composition: string, petProfile?: PetProfile): Promise<AnalysisResult> {
  if (composition.length > 5000) {
    throw new Error('Zloženie je príliš dlhé (max 5000 znakov).');
  }

  const openai = getOpenAIClient();

  if (!modeLogged) {
    console.log(`[AI Service] Mode: ${openai ? 'OpenAI GPT-4o' : 'Mock (no API key)'}`);
    modeLogged = true;
  }

  if (!openai) {
    return callMockModel(composition, petProfile);
  }

  // Try with 1 retry
  try {
    return await callOpenAI(composition, petProfile);
  } catch (err) {
    console.error('[AI Service] First attempt failed:', err);
    try {
      return await callOpenAI(composition, petProfile);
    } catch (retryErr) {
      console.error('[AI Service] Retry failed:', retryErr);
      throw new Error('Nepodarilo sa analyzovať zloženie. Skúste to znova neskôr.');
    }
  }
}
