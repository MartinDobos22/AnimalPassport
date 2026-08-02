import { Router, type Request, type Response, type NextFunction } from 'express';
import { getReviewStats, listApprovedReviews } from '../services/reviewService';

// Verejné recenzie aplikácie — read-only, BEZ Firebase auth (mountuje sa PRED
// firebaseAuth v index.ts). Vracia len schválené recenzie pre landing page.
// Zápis/moderácia ide cez /api/my-review (authed) a /api/admin/reviews (admin).
const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined;
    const reviews = await listApprovedReviews(locale);
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ stats: await getReviewStats() });
  } catch (err) {
    next(err);
  }
});

export default router;
