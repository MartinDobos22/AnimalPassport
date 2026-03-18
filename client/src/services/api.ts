import { AnalysisRequest, AnalysisResult, FileExtractionResult, PetProfile } from '../types';
import { logger } from '../utils/logger';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

function sanitizePetProfileForAnalyze(petProfile?: PetProfile): PetProfile | undefined {
  if (!petProfile) return undefined;

  return {
    id: petProfile.id,
    name: petProfile.name,
    animalType: petProfile.animalType,
    breed: petProfile.breed,
    dateOfBirth: petProfile.dateOfBirth,
    sex: petProfile.sex,
    ageYears: petProfile.ageYears,
    ageMonths: petProfile.ageMonths,
    weightKg: petProfile.weightKg,
    microchipNumber: petProfile.microchipNumber,
    passportNumber: petProfile.passportNumber,
    size: petProfile.size,
    lifeStage: petProfile.lifeStage,
    activityLevel: petProfile.activityLevel,
    allergies: petProfile.allergies,
    intolerances: petProfile.intolerances,
    healthConditions: petProfile.healthConditions,
    notes: petProfile.notes,
  };
}

export async function analyzeComposition(
  composition: string,
  petProfile?: PetProfile
): Promise<AnalysisResult> {
  const requestPayload: AnalysisRequest = {
    composition,
    sourceType: 'text',
    petProfile: sanitizePetProfileForAnalyze(petProfile),
  };

  logger.info('Odosielam textovú analýzu na backend', {
    compositionLength: composition.length,
    hasPetProfile: Boolean(petProfile),
  });

  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload),
  });

  if (!res.ok) {
    logger.error('Textová analýza zlyhala', { status: res.status });
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Chyba servera (${res.status})`);
  }

  const responsePayload = (await res.json()) as AnalysisResult;
  logger.info('Textová analýza úspešne dokončená', {
    score: responsePayload.score,
    ingredientsCount: responsePayload.ingredients.length,
  });

  return responsePayload;
}

export async function analyzeAttachment(
  attachment: AnalysisRequest['attachment'],
  examAlias?: string
): Promise<FileExtractionResult> {
  const requestPayload = {
    sourceType: 'file',
    attachment,
    examAlias,
  } satisfies AnalysisRequest;

  logger.info('Odosielam súbor na analýzu', {
    fileName: attachment?.fileName,
    mimeType: attachment?.mimeType,
    examAlias: examAlias ?? null,
    base64Length: attachment?.base64Data?.length ?? 0,
  });

  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload),
  });

  if (!res.ok) {
    logger.error('Súborová analýza zlyhala', { status: res.status });
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Chyba servera (${res.status})`);
  }

  const responsePayload = (await res.json()) as FileExtractionResult;
  logger.info('Súborová analýza úspešne dokončená', {
    source: responsePayload.source,
    extractedTextLength: responsePayload.extractedText.length,
    contextDocumentType: responsePayload.contextAnalysis?.documentType ?? null,
    selectedExamAlias: responsePayload.examAnalysis?.examAlias ?? examAlias ?? null,
    selectedExamType: responsePayload.examAnalysis?.examType ?? null,
  });

  return responsePayload;
}
