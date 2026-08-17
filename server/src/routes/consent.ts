import { Router, Request, Response, NextFunction } from 'express';

import { getSupabase } from '../config/supabase';
import { invalidateUserCache } from '../middleware/ensureUser';
import { httpError } from '../utils/httpError';
import { withRetry } from '../utils/retry';
import { logger } from '../utils/logger';

const router = Router();

interface ConsentBody {
  granted?: unknown;
}

async function readConsentAt(appUserId: string): Promise<string | null> {
  const supabase = getSupabase();
  const data = await withRetry(
    async () => {
      const { data, error } = await supabase
        .from('users')
        .select('ai_processing_consent_at')
        .eq('id', appUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    { label: 'consent.select' }
  );
  // Fail-closed: chýbajúci riadok znamená „bez súhlasu", nie „súhlas udelený".
  return typeof data?.ai_processing_consent_at === 'string' ? data.ai_processing_consent_at : null;
}

router.get('/ai-processing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appUserId = req.appUserId;
    if (!appUserId) throw httpError(401, 'Prihlásenie je povinné.', 'UNAUTHORIZED');

    const grantedAt = await readConsentAt(appUserId);
    res.json({ granted: grantedAt !== null, grantedAt });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/ai-processing',
  async (req: Request<object, object, ConsentBody>, res: Response, next: NextFunction) => {
    try {
      const appUserId = req.appUserId;
      if (!appUserId) throw httpError(401, 'Prihlásenie je povinné.', 'UNAUTHORIZED');

      if (typeof req.body?.granted !== 'boolean') {
        throw httpError(400, 'Chýba hodnota súhlasu.', 'INVALID_CONSENT_VALUE');
      }

      const grantedAt = req.body.granted ? new Date().toISOString() : null;
      const supabase = getSupabase();
      await withRetry(
        async () => {
          const { error } = await supabase
            .from('users')
            .update({ ai_processing_consent_at: grantedAt })
            .eq('id', appUserId);
          if (error) throw error;
        },
        { label: 'consent.update' }
      );

      // Bez invalidácie by odvolaný súhlas platil ešte do minúty (cache v ensureUser).
      invalidateUserCache(appUserId);
      logger.info('Zmena AI súhlasu', { granted: grantedAt !== null });

      res.json({ granted: grantedAt !== null, grantedAt });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
