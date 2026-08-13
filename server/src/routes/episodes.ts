import { Router, Request, Response, NextFunction } from 'express';
import {
  summarizeSimilarEpisodes,
  validateCurrentEpisode,
  validatePastEpisodes,
} from '../services/episodeAiService';
import { requireAiQuota } from '../middleware/aiQuota';
import { logger } from '../utils/logger';

const router = Router();

router.post(
  '/similar-summary',
  requireAiQuota(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as Record<string, unknown> | undefined;
      const current = validateCurrentEpisode(body?.currentEpisode);
      if (!current) {
        logger.warn('Neplatný payload pre similar-summary: chýba alebo zlá currentEpisode');
        res.status(400).json({
          error: {
            message: 'Chýba alebo neplatná aktuálna epizóda (currentEpisode).',
            code: 'INVALID_CURRENT',
          },
        });
        return;
      }

      const past = validatePastEpisodes(body?.pastEpisodes);

      logger.info('Backend prijal similar-summary požiadavku', {
        category: current.category,
        pastCount: past.length,
      });

      try {
        const result = await summarizeSimilarEpisodes(current, past, {
          userId: req.appUserId ?? req.user?.uid,
          aiProcessingConsent: req.aiConsentGranted === true,
          processesHealthData: false,
        });
        logger.info('similar-summary dokončené', {
          matchedCount: result.similarEpisodeIds.length,
          hasSummary: result.summary.length > 0,
        });
        res.json(result);
      } catch (err) {
        logger.error('similar-summary externe zlyhalo', {
          error: err instanceof Error ? err.message : 'unknown',
        });
        res.status(502).json({
          error: {
            message: 'AI sumarizáciu sa nepodarilo dokončiť. Skús to neskôr.',
            code: 'AI_FAILED',
          },
        });
      }
    } catch (err) {
      next(err);
    }
  }
);

export default router;
