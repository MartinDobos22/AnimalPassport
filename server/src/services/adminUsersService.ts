import { getSupabase } from '../config/supabase';
import { httpError } from '../utils/httpError';

// Správa používateľov pre admina — zoznam účtov a prepínanie admin práv
// (users.is_admin, migrácia 0036). Len server-side cez service_role.

export interface AdminUser {
  id: string;
  email: string | null;
  isAdmin: boolean;
  createdAt: string | null;
}

type Row = Record<string, unknown>;

function rowToUser(row: Row): AdminUser {
  return {
    id: typeof row.id === 'string' ? row.id : '',
    email: typeof row.email === 'string' ? row.email : null,
    isAdmin: row.is_admin === true,
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
  };
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await getSupabase()
    .from('users')
    .select('id, email, is_admin, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as Row[] | null) ?? []).map(rowToUser);
}

export async function setUserAdmin(id: string, isAdmin: boolean): Promise<AdminUser> {
  const { data, error } = await getSupabase()
    .from('users')
    .update({ is_admin: isAdmin })
    .eq('id', id)
    .select('id, email, is_admin, created_at')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, 'Používateľ sa nenašiel.', 'NOT_FOUND');
  return rowToUser(data as Row);
}
