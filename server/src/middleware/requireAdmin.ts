import { Request, Response, NextFunction } from 'express';
import { httpError } from '../utils/httpError';
import { getSupabase } from '../config/supabase';

// Admin autorizácia. Účet je admin ak jeho e-mail je v env allowliste
// `ADMIN_EMAILS` (bootstrap prvého admina) ALEBO má v DB `users.is_admin = true`
// (pridelené z UI správy používateľov). Vyžaduje, aby pred týmto middleware
// bežal firebaseAuth (req.user.email) a ensureUser (req.appUserId).

let cachedSet: Set<string> | null = null;

function adminSet(): Set<string> {
  if (cachedSet) return cachedSet;
  const raw = process.env.ADMIN_EMAILS ?? '';
  cachedSet = new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0)
  );
  return cachedSet;
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminSet().has(email.toLowerCase());
}

export async function resolveIsAdmin(req: Request): Promise<boolean> {
  if (isAdminEmail(req.user?.email)) return true;
  const appUserId = req.appUserId;
  if (!appUserId) return false;
  const { data, error } = await getSupabase()
    .from('users')
    .select('is_admin')
    .eq('id', appUserId)
    .maybeSingle();
  if (error) throw error;
  return (data as { is_admin?: boolean } | null)?.is_admin === true;
}

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!(await resolveIsAdmin(req))) {
      next(httpError(403, 'Nemáš oprávnenie na túto akciu.', 'FORBIDDEN'));
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}
