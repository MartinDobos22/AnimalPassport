import type { MyReview, PublicReview, ReviewInput, ReviewStats } from '../types/review';
import { getAuthHeader, handleUnauthorized } from './authToken';
import { logger } from '../utils/logger';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

async function authedRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? 'GET';
  const url = `${BASE_URL}/api/my-review${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeader()),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    await handleUnauthorized(res.status, res);
    const body = (await res.json().catch(() => null)) as {
      error?: { message?: string; code?: string };
    } | null;
    logger.error('Reviews API zlyhal', {
      method,
      url,
      status: res.status,
      code: body?.error?.code,
    });
    throw new Error(body?.error?.message ?? `Chyba servera (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// Verejné schválené recenzie — bez auth (landing page). Chyby ticho spracuje volajúci.
export async function fetchApprovedReviews(locale?: string): Promise<PublicReview[]> {
  const query = locale ? `?locale=${encodeURIComponent(locale)}` : '';
  const res = await fetch(`${BASE_URL}/api/reviews${query}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Chyba servera (${res.status})`);
  const data = (await res.json()) as { reviews: PublicReview[] };
  return data.reviews;
}

export async function fetchReviewStats(): Promise<ReviewStats> {
  const res = await fetch(`${BASE_URL}/api/reviews/stats`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Chyba servera (${res.status})`);
  const data = (await res.json()) as { stats: ReviewStats };
  return data.stats;
}

export async function fetchMyReview(): Promise<MyReview | null> {
  const data = await authedRequest<{ review: MyReview | null }>('');
  return data.review;
}

export async function saveMyReview(input: ReviewInput): Promise<MyReview> {
  const data = await authedRequest<{ review: MyReview }>('', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return data.review;
}

export async function deleteMyReview(): Promise<void> {
  await authedRequest<void>('', { method: 'DELETE' });
}
