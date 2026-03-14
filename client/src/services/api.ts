import { AnalysisResult, PetProfile } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export async function analyzeComposition(
  composition: string,
  petProfile?: PetProfile
): Promise<AnalysisResult> {
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ composition, petProfile }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Chyba servera (${res.status})`);
  }

  return res.json();
}
