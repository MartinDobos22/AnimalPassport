import type {
  AdminArticle,
  AiGenerationLog,
  ArticleAiResult,
  ArticleAiType,
  ArticleMetrics,
  ArticleValidation,
  ArticleVersion,
  ArticleVersionMeta,
} from '../content/poradna/types';
import type { MediaImage } from '../types/media';
import type { AdminReview, ReviewStatus } from '../types/review';
import { getAuthHeader, handleUnauthorized } from './authToken';
import { logger } from '../utils/logger';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? 'GET';
  const url = `${BASE_URL}/api/admin${path}`;
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
    logger.error('Admin API zlyhal', { method, url, status: res.status, code: body?.error?.code });
    throw new Error(body?.error?.message ?? `Chyba servera (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function getAdminStatus(): Promise<boolean> {
  const data = await request<{ isAdmin: boolean }>('/status');
  return data.isAdmin === true;
}

export async function listAdminArticles(): Promise<AdminArticle[]> {
  const data = await request<{ articles: AdminArticle[] }>('/articles');
  return data.articles;
}

export async function getAdminArticle(slug: string): Promise<AdminArticle> {
  const data = await request<{ article: AdminArticle }>(`/articles/${encodeURIComponent(slug)}`);
  return data.article;
}

export async function createAdminArticle(article: AdminArticle): Promise<AdminArticle> {
  const data = await request<{ article: AdminArticle }>('/articles', {
    method: 'POST',
    body: JSON.stringify(article),
  });
  return data.article;
}

export async function updateAdminArticle(
  slug: string,
  article: AdminArticle
): Promise<AdminArticle> {
  const data = await request<{ article: AdminArticle }>(`/articles/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    body: JSON.stringify(article),
  });
  return data.article;
}

export async function deleteAdminArticle(slug: string): Promise<void> {
  await request<void>(`/articles/${encodeURIComponent(slug)}`, { method: 'DELETE' });
}

export async function uploadArticleImage(payload: {
  mimeType: string;
  base64Data: string;
  alt?: string;
  caption?: string;
  author?: string;
  width?: number;
  height?: number;
}): Promise<{ url: string; objectPath: string; media: MediaImage }> {
  return request<{ url: string; objectPath: string; media: MediaImage }>('/articles/upload-image', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listMedia(): Promise<MediaImage[]> {
  const data = await request<{ media: MediaImage[] }>('/media');
  return data.media;
}

export async function updateMedia(
  id: string,
  patch: { alt?: string; caption?: string; author?: string }
): Promise<MediaImage> {
  const data = await request<{ media: MediaImage }>(`/media/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return data.media;
}

export async function deleteMedia(id: string): Promise<void> {
  await request<void>(`/media/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export interface AdminUser {
  id: string;
  email: string | null;
  isAdmin: boolean;
  createdAt: string | null;
  blockedAt: string | null;
  blockedReason: string | null;
}

export async function listUsers(): Promise<AdminUser[]> {
  const data = await request<{ users: AdminUser[] }>('/users');
  return data.users;
}

export async function setUserAdmin(id: string, isAdmin: boolean): Promise<AdminUser> {
  const data = await request<{ user: AdminUser }>(`/users/${encodeURIComponent(id)}/admin`, {
    method: 'POST',
    body: JSON.stringify({ isAdmin }),
  });
  return data.user;
}

export async function setUserBlocked(
  id: string,
  blocked: boolean,
  reason?: string
): Promise<AdminUser> {
  const data = await request<{ user: AdminUser }>(`/users/${encodeURIComponent(id)}/blocked`, {
    method: 'POST',
    body: JSON.stringify({ blocked, reason }),
  });
  return data.user;
}

export async function listAdminReviews(status?: ReviewStatus): Promise<AdminReview[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const data = await request<{ reviews: AdminReview[] }>(`/reviews${query}`);
  return data.reviews;
}

export async function setReviewStatus(id: string, status: ReviewStatus): Promise<AdminReview> {
  const data = await request<{ review: AdminReview }>(`/reviews/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
  return data.review;
}

export async function deleteAdminReview(id: string): Promise<void> {
  await request<void>(`/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function publishArticles(): Promise<void> {
  await request<{ triggered: boolean }>('/articles/publish', { method: 'POST' });
}

export async function generateArticleAi(payload: {
  type: ArticleAiType;
  articleSlug?: string;
  title?: string;
  bodyText?: string;
  instruction?: string;
  category?: string;
  sources?: { label: string; url: string }[];
}): Promise<ArticleAiResult> {
  return request<ArticleAiResult>('/ai/article', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getArticleAiLog(slug: string): Promise<AiGenerationLog[]> {
  const data = await request<{ generations: AiGenerationLog[] }>(
    `/articles/${encodeURIComponent(slug)}/ai-log`
  );
  return data.generations;
}

export async function getArticlesMetrics(): Promise<ArticleMetrics[]> {
  const data = await request<{ metrics: ArticleMetrics[] }>('/articles/metrics');
  return data.metrics;
}

export async function getArticleMetric(slug: string): Promise<ArticleMetrics> {
  const data = await request<{ metrics: ArticleMetrics }>(
    `/articles/${encodeURIComponent(slug)}/metrics`
  );
  return data.metrics;
}

export async function getArticleValidation(slug: string): Promise<ArticleValidation> {
  return request<ArticleValidation>(`/articles/${encodeURIComponent(slug)}/validation`);
}

export async function changeArticleStatus(
  slug: string,
  status: AdminArticle['status'],
  opts?: { note?: string; scheduledFor?: string }
): Promise<{ article: AdminArticle; buildTriggered: boolean }> {
  const data = await request<{ article: AdminArticle; buildTriggered?: boolean }>(
    `/articles/${encodeURIComponent(slug)}/status`,
    {
      method: 'POST',
      body: JSON.stringify({ status, note: opts?.note, scheduledFor: opts?.scheduledFor }),
    }
  );
  return { article: data.article, buildTriggered: Boolean(data.buildTriggered) };
}

export async function autosaveArticle(
  slug: string,
  article: AdminArticle
): Promise<{ savedAt: string }> {
  return request<{ savedAt: string }>(`/articles/${encodeURIComponent(slug)}/autosave`, {
    method: 'POST',
    body: JSON.stringify(article),
  });
}

export async function listArticleVersions(slug: string): Promise<ArticleVersionMeta[]> {
  const data = await request<{ versions: ArticleVersionMeta[] }>(
    `/articles/${encodeURIComponent(slug)}/versions`
  );
  return data.versions;
}

export async function getArticleVersion(slug: string, versionId: string): Promise<ArticleVersion> {
  const data = await request<{ version: ArticleVersion }>(
    `/articles/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}`
  );
  return data.version;
}

export async function restoreArticleVersion(
  slug: string,
  versionId: string
): Promise<AdminArticle> {
  const data = await request<{ article: AdminArticle }>(
    `/articles/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}/restore`,
    { method: 'POST' }
  );
  return data.article;
}
