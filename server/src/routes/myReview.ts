import { Router, type Request, type Response, type NextFunction } from 'express';
import { deleteMyReview, getMyReview, upsertMyReview } from '../services/reviewService';
import { httpError } from '../utils/httpError';

// /api/my-review — recenzia prihláseného používateľa. Vyžaduje firebaseAuth +
// ensureUser (mount v index.ts). Jedna recenzia na používateľa; PUT je upsert.
const router = Router();

function requireUserId(req: Request): string {
  const id = req.appUserId;
  if (!id) throw httpError(401, 'Prihlásenie je povinné.', 'UNAUTHORIZED');
  return id;
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ review: await getMyReview(requireUserId(req)) });
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ review: await upsertMyReview(requireUserId(req), req.body) });
  } catch (err) {
    next(err);
  }
});

router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteMyReview(requireUserId(req));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
