import { getSupabase } from '../config/supabase';
import { httpError } from '../utils/httpError';
import { invalidateUserCache } from '../middleware/ensureUser';

// Správa používateľov pre admina — zoznam účtov, prepínanie admin práv
// (users.is_admin, migrácia 0036) a blokovanie účtu (users.blocked_at,
// migrácia 0039). Len server-side cez service_role.

const SELECT_COLUMNS = 'id, email, is_admin, created_at, blocked_at, blocked_reason';

const MAX_REASON_LEN = 500;

export interface AdminUser {
  id: string;
  email: string | null;
  isAdmin: boolean;
  createdAt: string | null;
  blockedAt: string | null;
  blockedReason: string | null;
}

type Row = Record<string, unknown>;

function rowToUser(row: Row): AdminUser {
  return {
    id: typeof row.id === 'string' ? row.id : '',
    email: typeof row.email === 'string' ? row.email : null,
    isAdmin: row.is_admin === true,
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
    blockedAt: typeof row.blocked_at === 'string' ? row.blocked_at : null,
    blockedReason: typeof row.blocked_reason === 'string' ? row.blocked_reason : null,
  };
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await getSupabase()
    .from('users')
    .select(SELECT_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as Row[] | null) ?? []).map(rowToUser);
}

export async function setUserAdmin(id: string, isAdmin: boolean): Promise<AdminUser> {
  const { data, error } = await getSupabase()
    .from('users')
    .update({ is_admin: isAdmin })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, 'Používateľ sa nenašiel.', 'NOT_FOUND');
  return rowToUser(data as Row);
}

export async function setUserBlocked(
  id: string,
  blocked: boolean,
  reason?: string
): Promise<AdminUser> {
  // Dôvod je povinný pri blokovaní — Podmienky používania sľubujú, že
  // používateľovi vieme uviesť dôvod zásahu.
  const trimmed = typeof reason === 'string' ? reason.trim() : '';
  if (blocked && !trimmed) {
    throw httpError(400, 'Dôvod zablokovania je povinný.', 'REASON_REQUIRED');
  }
  if (trimmed.length > MAX_REASON_LEN) {
    throw httpError(400, `Dôvod je príliš dlhý (max ${MAX_REASON_LEN} znakov).`, 'REASON_TOO_LONG');
  }

  const { data, error } = await getSupabase()
    .from('users')
    .update({
      blocked_at: blocked ? new Date().toISOString() : null,
      blocked_reason: blocked ? trimmed : null,
    })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, 'Používateľ sa nenašiel.', 'NOT_FOUND');

  // Bez invalidácie by blok začal platiť až po expirácii cache v ensureUser.
  invalidateUserCache(id);
  return rowToUser(data as Row);
}
