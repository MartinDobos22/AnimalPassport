import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../config/supabase';
import { withRetry } from '../utils/retry';
import { httpError } from '../utils/httpError';

interface CachedUser {
  appUserId: string;
  blockedAt: string | null;
  aiConsentAt: string | null;
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

// Vracia len tie polia, ktoré sa reálne líšia od uloženého stavu — aby sme
// nerobili UPDATE pri každom cache misse. Hodnoty pochádzajú z overeného ID
// tokenu (Google podpis), nikdy z tela requestu, takže ich klient neovplyvní.
function verificationDrift(
  user: { emailVerified?: boolean; provider?: string },
  row: { email_verified?: unknown; auth_provider?: unknown }
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const verified = user.emailVerified === true;

  if (row.email_verified !== verified) {
    patch.email_verified = verified;
    // Pečiatku nastavíme pri prvom prechode na overený stav a už ju neprepisujeme.
    if (verified) patch.email_verified_at = new Date().toISOString();
  }
  if (user.provider && row.auth_provider !== user.provider) {
    patch.auth_provider = user.provider;
  }
  return patch;
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
      req.aiConsentGranted = cached.aiConsentAt !== null;
      next();
      return;
    }

    const supabase = getSupabase();

    const existing = await withRetry(
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select('id, locale, blocked_at, email_verified, auth_provider, ai_processing_consent_at')
          .eq('firebase_uid', req.user!.uid)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      { label: 'ensureUser.select' }
    );

    if (existing) {
      const blockedAt = typeof existing.blocked_at === 'string' ? existing.blocked_at : null;
      const aiConsentAt =
        typeof existing.ai_processing_consent_at === 'string'
          ? existing.ai_processing_consent_at
          : null;
      uidCache.set(req.user.uid, {
        appUserId: existing.id,
        blockedAt,
        aiConsentAt,
        locale,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      assertNotBlocked(blockedAt, allowBlocked);
      req.appUserId = existing.id;
      req.aiConsentGranted = aiConsentAt !== null;

      const drift: Record<string, unknown> = {};
      if (existing.locale !== locale) drift.locale = locale;
      Object.assign(drift, verificationDrift(req.user, existing));

      if (Object.keys(drift).length > 0) {
        void supabase
          .from('users')
          .update(drift)
          .eq('id', existing.id)
          .then(({ error }) => {
            if (error) {
              // Best-effort: sync metadát nemá blokovať request.
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
            {
              firebase_uid: req.user!.uid,
              email: req.user!.email ?? null,
              locale,
              email_verified: req.user!.emailVerified === true,
              email_verified_at: req.user!.emailVerified === true ? new Date().toISOString() : null,
              auth_provider: req.user!.provider ?? null,
            },
            { onConflict: 'firebase_uid' }
          )
          .select('id, blocked_at, ai_processing_consent_at')
          .single();
        if (error) throw error;
        return data;
      },
      { label: 'ensureUser.upsert' }
    );

    // Upsert na existujúcom riadku vráti jeho aktuálny stav — zablokovaný účet
    // sa takto nedá "resetovať" opakovaným prihlásením.
    const insertedBlockedAt = typeof inserted.blocked_at === 'string' ? inserted.blocked_at : null;
    const insertedConsentAt =
      typeof inserted.ai_processing_consent_at === 'string'
        ? inserted.ai_processing_consent_at
        : null;
    uidCache.set(req.user.uid, {
      appUserId: inserted.id,
      blockedAt: insertedBlockedAt,
      aiConsentAt: insertedConsentAt,
      locale,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    assertNotBlocked(insertedBlockedAt, allowBlocked);
    req.appUserId = inserted.id;
    req.aiConsentGranted = insertedConsentAt !== null;
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
