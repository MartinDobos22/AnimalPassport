import { getSupabase } from '../config/supabase';
import { httpError } from '../utils/httpError';
import type {
  AdminReview,
  MyReview,
  PublicReview,
  ReviewInput,
  ReviewStats,
  ReviewStatus,
} from '../types/review';

type Row = Record<string, unknown>;

const REVIEW_STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected'];
const BODY_MAX = 800;
const AUTHOR_MAX = 60;
const PET_MAX = 40;
const PUBLIC_LIMIT = 24;

const SELECT_PUBLIC = 'id, rating, body, author_name, pet_name, locale, created_at';
const SELECT_MINE = `${SELECT_PUBLIC}, status, updated_at`;
const SELECT_ADMIN = `${SELECT_MINE}, moderated_at, moderated_by, users ( email )`;

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function asStatus(value: unknown): ReviewStatus {
  return REVIEW_STATUSES.includes(value as ReviewStatus) ? (value as ReviewStatus) : 'pending';
}

// Zmaže control characters a zbytočné biele znaky, oreže na max dĺžku.
function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const stripped = value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  const trimmed = stripped
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, max);
}

function normalizeLocale(value: unknown): string {
  return value === 'en' ? 'en' : 'sk';
}

function rowToPublic(row: Row): PublicReview {
  return {
    id: asString(row.id),
    rating: typeof row.rating === 'number' ? row.rating : Number(row.rating) || 0,
    body: asOptionalString(row.body),
    authorName: asOptionalString(row.author_name),
    petName: asOptionalString(row.pet_name),
    locale: normalizeLocale(row.locale),
    createdAt: asString(row.created_at),
  };
}

function rowToMine(row: Row): MyReview {
  return {
    ...rowToPublic(row),
    status: asStatus(row.status),
    updatedAt: asString(row.updated_at),
  };
}

function rowToAdmin(row: Row): AdminReview {
  const user = (row.users ?? null) as { email?: unknown } | null;
  return {
    ...rowToMine(row),
    authorEmail: asOptionalString(user?.email),
    moderatedAt: asOptionalString(row.moderated_at),
    moderatedBy: asOptionalString(row.moderated_by),
  };
}

function validateInput(input: unknown): {
  rating: number;
  body: string | null;
  author_name: string | null;
  pet_name: string | null;
  locale: string;
} {
  if (!input || typeof input !== 'object') {
    throw httpError(400, 'Telo požiadavky musí byť objekt.', 'INVALID_INPUT');
  }
  const raw = input as ReviewInput;
  const rating = Number(raw.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw httpError(400, 'Hodnotenie musí byť 1 až 5 hviezdičiek.', 'INVALID_INPUT');
  }
  return {
    rating,
    body: cleanText(raw.body, BODY_MAX),
    author_name: cleanText(raw.authorName, AUTHOR_MAX),
    pet_name: cleanText(raw.petName, PET_MAX),
    locale: normalizeLocale(raw.locale),
  };
}

export async function listApprovedReviews(locale?: string): Promise<PublicReview[]> {
  let query = getSupabase()
    .from('reviews')
    .select(SELECT_PUBLIC)
    .eq('status', 'approved')
    .order('moderated_at', { ascending: false })
    .limit(PUBLIC_LIMIT);
  if (locale === 'sk' || locale === 'en') {
    query = query.eq('locale', locale);
  }
  const { data, error } = await query;
  if (error) throw error;
  return ((data as Row[] | null) ?? []).map(rowToPublic);
}

export async function getReviewStats(): Promise<ReviewStats> {
  const { data, error } = await getSupabase()
    .from('reviews')
    .select('rating')
    .eq('status', 'approved');
  if (error) throw error;
  const ratings = ((data as Row[] | null) ?? [])
    .map((r) => (typeof r.rating === 'number' ? r.rating : Number(r.rating)))
    .filter((n) => Number.isFinite(n));
  const count = ratings.length;
  const average = count > 0 ? ratings.reduce((sum, n) => sum + n, 0) / count : 0;
  return { count, average: Math.round(average * 10) / 10 };
}

export async function getMyReview(userId: string): Promise<MyReview | null> {
  const { data, error } = await getSupabase()
    .from('reviews')
    .select(SELECT_MINE)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToMine(data as Row) : null;
}

// Založí alebo aktualizuje recenziu používateľa. Každá zmena vracia recenziu do
// stavu `pending` (opätovná moderácia); jedna recenzia na používateľa.
export async function upsertMyReview(userId: string, input: unknown): Promise<MyReview> {
  const fields = validateInput(input);
  const row = {
    user_id: userId,
    ...fields,
    status: 'pending' as ReviewStatus,
    moderated_at: null,
    moderated_by: null,
  };
  const { data, error } = await getSupabase()
    .from('reviews')
    .upsert(row, { onConflict: 'user_id' })
    .select(SELECT_MINE)
    .single();
  if (error) throw error;
  return rowToMine(data as Row);
}

export async function deleteMyReview(userId: string): Promise<void> {
  const { error } = await getSupabase().from('reviews').delete().eq('user_id', userId);
  if (error) throw error;
}

// ── Admin (moderácia) ────────────────────────────────────────────────────────

export async function listAllReviews(status?: string): Promise<AdminReview[]> {
  let query = getSupabase()
    .from('reviews')
    .select(SELECT_ADMIN)
    .order('created_at', { ascending: false });
  if (status === 'pending' || status === 'approved' || status === 'rejected') {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return ((data as Row[] | null) ?? []).map(rowToAdmin);
}

export async function setReviewStatus(
  id: string,
  status: ReviewStatus,
  by?: string | null
): Promise<AdminReview> {
  if (!REVIEW_STATUSES.includes(status)) {
    throw httpError(400, 'Neplatný stav recenzie.', 'INVALID_INPUT');
  }
  const { data, error } = await getSupabase()
    .from('reviews')
    .update({
      status,
      moderated_at: new Date().toISOString(),
      moderated_by: typeof by === 'string' && by.length > 0 ? by : null,
    })
    .eq('id', id)
    .select(SELECT_ADMIN)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, 'Recenzia sa nenašla.', 'NOT_FOUND');
  return rowToAdmin(data as Row);
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await getSupabase().from('reviews').delete().eq('id', id);
  if (error) throw error;
}
