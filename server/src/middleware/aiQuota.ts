import { Request, Response, NextFunction, RequestHandler } from 'express';
import { getSupabase } from '../config/supabase';
import { logger } from '../utils/logger';

const ENV_LIMIT = Number(process.env.AI_DAILY_LIMIT);
// Default 200/deň: prvý user si pri onboardingu nahráva celú históriu z pasu
// naraz (mnoho strán × OCR + per-dokument interpret) — 50 by ho zablokovalo
// uprostred prvého importu. Botnet/abuse chráni globálny cap (AI_GLOBAL_DAILY_CAP).
const DEFAULT_DAILY_LIMIT = Number.isFinite(ENV_LIMIT) && ENV_LIMIT > 0 ? ENV_LIMIT : 200;

const ENV_GLOBAL_LIMIT = Number(process.env.AI_GLOBAL_DAILY_CAP);
const DEFAULT_GLOBAL_DAILY_CAP =
  Number.isFinite(ENV_GLOBAL_LIMIT) && ENV_GLOBAL_LIMIT > 0 ? ENV_GLOBAL_LIMIT : 5000;

const ALERT_THRESHOLD = 0.8;

type QuotaRow = {
  exceeded: boolean;
  current_count: number;
  limit_value: number;
};

function pickRow(data: unknown): QuotaRow | undefined {
  return Array.isArray(data) ? (data[0] as QuotaRow) : (data as QuotaRow | undefined);
}

export function requireAiQuota(
  userLimit: number = DEFAULT_DAILY_LIMIT,
  globalLimit: number = DEFAULT_GLOBAL_DAILY_CAP
): RequestHandler {
  return async function aiQuotaMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.appUserId) {
        const err = new Error('Prihlásenie je povinné.') as Error & {
          status: number;
          code: string;
        };
        err.status = 401;
        err.code = 'UNAUTHORIZED';
        throw err;
      }

      const supabase = getSupabase();

      // Globálny check najprv: chráni pred kolektívnym burstom (botnet,
      // viral moment). Pri prekročení vracia 503 — nie je to chyba usera,
      // je to dočasná služba unavailable.
      const { data: globalData, error: globalError } = await supabase.rpc(
        'app_increment_global_ai_quota',
        { p_limit: globalLimit }
      );
      if (globalError) throw globalError;

      // Fail-closed: prázdna odpoveď z RPC (bez error) by pri `?.exceeded`
      // ticho vypla cap. Chýbajúci riadok = kvótový systém nefunguje.
      const globalResult = pickRow(globalData);
      if (!globalResult) {
        logger.error('Globálny AI cap: RPC nevrátilo riadok — AI blokované (fail-closed)', {
          path: req.originalUrl,
        });
        res.status(503).json({
          error: {
            message: 'AI služba je dočasne nedostupná. Skús to neskôr.',
            code: 'AI_QUOTA_UNAVAILABLE',
          },
        });
        return;
      }
      if (globalResult.exceeded) {
        logger.error('GLOBÁLNY denný AI cap prekročený — všetky AI endpointy vypnuté do polnoci', {
          count: globalResult.current_count,
          limit: globalResult.limit_value,
          path: req.originalUrl,
        });
        res.status(503).json({
          error: {
            message:
              'AI služba je dočasne nedostupná kvôli vysokému dennému zaťaženiu. Skús to neskôr.',
            code: 'AI_GLOBAL_CAP_EXCEEDED',
          },
        });
        return;
      }

      if (
        globalResult &&
        globalResult.current_count >= Math.floor(globalResult.limit_value * ALERT_THRESHOLD) &&
        globalResult.current_count < Math.floor(globalResult.limit_value * ALERT_THRESHOLD) + 5
      ) {
        // Logujeme len v okolí 80% prahu (5 hits okolo neho) aby nešumelo
        // pri každom volaní nad 80%.
        logger.warn('Globálny AI cap blízko prahu', {
          count: globalResult.current_count,
          limit: globalResult.limit_value,
          percent: Math.round((globalResult.current_count / globalResult.limit_value) * 100),
        });
      }

      // Per-user check druhý. Pri prekročení vracia 429 (rate limit usera,
      // nie kolektívny outage). Global už bol inkrementovaný — akceptujeme
      // marginálny over-count, je to konzervatívne (bližšie ku skutočnej
      // záťaži).
      const { data: userData, error: userError } = await supabase.rpc('app_increment_ai_quota', {
        p_app_user_id: req.appUserId,
        p_limit: userLimit,
      });
      if (userError) throw userError;

      const userResult = pickRow(userData);
      if (!userResult) {
        logger.error('Per-user AI kvóta: RPC nevrátilo riadok — AI blokované (fail-closed)', {
          appUserId: req.appUserId,
          path: req.originalUrl,
        });
        res.status(503).json({
          error: {
            message: 'AI služba je dočasne nedostupná. Skús to neskôr.',
            code: 'AI_QUOTA_UNAVAILABLE',
          },
        });
        return;
      }
      if (userResult.exceeded) {
        logger.warn('Denný AI limit prekročený', {
          appUserId: req.appUserId,
          count: userResult.current_count,
          limit: userResult.limit_value,
          path: req.originalUrl,
        });
        res.status(429).json({
          error: {
            message: `Denný limit AI volaní (${userResult.limit_value}) bol vyčerpaný. Skús to znova zajtra.`,
            code: 'DAILY_AI_LIMIT',
          },
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
