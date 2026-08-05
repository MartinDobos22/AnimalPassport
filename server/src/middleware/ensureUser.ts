import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../config/supabase';
import { withRetry } from '../utils/retry';
import { httpError } from '../utils/httpError';

interface CachedUser {
  appUserId: string;
  blockedAt: string | null;
  locale: 'sk' | 'en';
  expiresAt: number;
}

// Krátke TTL, nie trvalá cache: blocked_at sa musí prejaviť aj keď blok nastavila
// iná inštancia procesu. invalidateUserCache() pokrýva blok z tejto inštancie
// (okamžite), TTL je poistka pre všetky ostatné.
const CACHE_TTL_MS = 60_000;

const uidCache = new Map<string, CachedUser>();

export function invalidateUserCache(appUserId: string): void {
  for (const [uid, entry] of uidCache) {
    if (entry.appUserId === appUserId) uidCache.delete(uid);
  }
}

function detectLocale(header: string | undefined): 'sk' | 'en' {
  if (!header) return 'sk';
  const first = header.split(',')[0]?.trim().toLowerCase() ?? '';
  return first.startsWith('en') ? 'en' : 'sk';
}

interface EnsureUserOptions {
  /**
   * Ak true, zablokovaný účet prejde. Vyhradené pre GDPR endpointy
   * (`/api/account` — export, audit log, výmaz účtu), o ktoré používateľ
   * nesmie prísť ani po zablokovaní. Default je fail-closed.
   */
  allowBlocked?: boolean;
}

function assertNotBlocked(blockedAt: string | null, allowBlocked: boolean): void {
  if (blockedAt && !allowBlocked) {
    throw httpError(
      403,
      'Účet bol zablokovaný pre porušenie Podmienok používania. Ak ide o omyl, ozvi sa nám.',
      'ACCOUNT_BLOCKED'
    );
  }
}

async function resolveUser(
  req: Request,
  next: NextFunction,
  opts: EnsureUserOptions
): Promise<void> {
  const allowBlocked = opts.allowBlocked === true;
  const locale = detectLocale(req.headers['accept-language'] as string | undefined);
  try {
    if (!req.user) {
      throw httpError(401, 'Prihlásenie je povinné.', 'UNAUTHORIZED');
    }

    const cached = uidCache.get(req.user.uid);
    if (cached && cached.expiresAt > Date.now()) {
      assertNotBlocked(cached.blockedAt, allowBlocked);
      req.appUserId = cached.appUserId;
      next();
      return;
    }

    const supabase = getSupabase();

    const existing = await withRetry(
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select('id, locale, blocked_at')
          .eq('firebase_uid', req.user!.uid)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      { label: 'ensureUser.select' }
    );

    if (existing) {
      const blockedAt = typeof existing.blocked_at === 'string' ? existing.blocked_at : null;
      uidCache.set(req.user.uid, {
        appUserId: existing.id,
        blockedAt,
        locale,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      assertNotBlocked(blockedAt, allowBlocked);
      req.appUserId = existing.id;
      if (existing.locale !== locale) {
        void supabase
          .from('users')
          .update({ locale })
          .eq('id', existing.id)
          .then(({ error }) => {
            if (error) {
              // Best-effort: locale update nemá blokovať request.
            }
          });
      }
      next();
      return;
    }

    // Upsert s ON CONFLICT zaručuje, že súbežný registrácia request neskončí
    // unique-constraint chybou — druhý request len načíta existujúci id.
    const inserted = await withRetry(
      async () => {
        const { data, error } = await supabase
          .from('users')
          .upsert(
            { firebase_uid: req.user!.uid, email: req.user!.email ?? null, locale },
            { onConflict: 'firebase_uid' }
          )
          .select('id, blocked_at')
          .single();
        if (error) throw error;
        return data;
      },
      { label: 'ensureUser.upsert' }
    );

    // Upsert na existujúcom riadku vráti jeho aktuálny stav — zablokovaný účet
    // sa takto nedá "resetovať" opakovaným prihlásením.
    const insertedBlockedAt = typeof inserted.blocked_at === 'string' ? inserted.blocked_at : null;
    uidCache.set(req.user.uid, {
      appUserId: inserted.id,
      blockedAt: insertedBlockedAt,
      locale,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    assertNotBlocked(insertedBlockedAt, allowBlocked);
    req.appUserId = inserted.id;
    next();
  } catch (err) {
    next(err);
  }
}

export async function ensureUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  await resolveUser(req, next, {});
}

// Zablokovaný účet musí mať naďalej prístup k svojim GDPR právam (export dát,
// audit log, výmaz účtu) — inak by zablokovanie odoprelo práva podľa čl. 15,
// 17 a 20 GDPR a odporovalo by Podmienkam používania.
export async function ensureUserAllowBlocked(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  await resolveUser(req, next, { allowBlocked: true });
}
