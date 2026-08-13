import { logger } from '../utils/logger';
import { getAuthHeader, handleUnauthorized } from './authToken';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export interface AiConsentState {
  granted: boolean;
  grantedAt: string | null;
}

async function parse(res: Response): Promise<AiConsentState> {
  if (!res.ok) {
    await handleUnauthorized(res.status, res);
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Chyba servera (${res.status})`);
  }
  return (await res.json()) as AiConsentState;
}

export async function fetchAiConsent(): Promise<AiConsentState> {
  const res = await fetch(`${BASE_URL}/api/consent/ai-processing`, {
    headers: { ...(await getAuthHeader()) },
  });
  return parse(res);
}

export async function setAiConsent(granted: boolean): Promise<AiConsentState> {
  logger.info('Nastavujem AI súhlas', { granted });
  const res = await fetch(`${BASE_URL}/api/consent/ai-processing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
    body: JSON.stringify({ granted }),
  });
  return parse(res);
}
