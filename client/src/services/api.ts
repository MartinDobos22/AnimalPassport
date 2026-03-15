import { AnalysisRequest, AnalysisResult, PetProfile } from '../types';

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
  const payload: AnalysisRequest = {
    composition,
    sourceType: 'text',
    petProfile: sanitizePetProfileForAnalyze(petProfile),
  };

  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Chyba servera (${res.status})`);
  }

  return res.json();
}

export async function analyzeAttachment(
  attachment: AnalysisRequest['attachment'],
  petProfile?: PetProfile
): Promise<AnalysisResult> {
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceType: 'file',
      attachment,
      petProfile: sanitizePetProfileForAnalyze(petProfile),
    } satisfies AnalysisRequest),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Chyba servera (${res.status})`);
  }

  return res.json();
}
