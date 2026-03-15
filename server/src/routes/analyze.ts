import { Router, Request, Response, NextFunction } from 'express';
import { callAiModel, extractTextFromAttachment } from '../services/aiService';
import { AnalysisRequest, PetProfile } from '../types';

const router = Router();

function validatePetProfile(profile: unknown): PetProfile | undefined {
  if (!profile || typeof profile !== 'object') return undefined;
  const p = profile as Record<string, unknown>;

  if (typeof p.name !== 'string' || !p.name.trim()) return undefined;
  if (!['dog', 'cat', 'other'].includes(p.animalType as string)) return undefined;

  return {
    id: typeof p.id === 'string' ? p.id : '',
    name: (p.name as string).trim(),
    animalType: p.animalType as PetProfile['animalType'],
    breed: typeof p.breed === 'string' ? p.breed : undefined,
    ageYears: typeof p.ageYears === 'number' ? p.ageYears : undefined,
    ageMonths: typeof p.ageMonths === 'number' ? p.ageMonths : undefined,
    weightKg: typeof p.weightKg === 'number' ? p.weightKg : undefined,
    size: ['mini', 'small', 'medium', 'large', 'giant'].includes(p.size as string)
      ? (p.size as PetProfile['size'])
      : undefined,
    lifeStage: ['puppy', 'junior', 'adult', 'senior'].includes(p.lifeStage as string)
      ? (p.lifeStage as PetProfile['lifeStage'])
      : undefined,
    activityLevel: ['low', 'moderate', 'high', 'working'].includes(p.activityLevel as string)
      ? (p.activityLevel as PetProfile['activityLevel'])
      : undefined,
    allergies: Array.isArray(p.allergies) ? p.allergies.filter((a): a is string => typeof a === 'string') : [],
    intolerances: Array.isArray(p.intolerances) ? p.intolerances.filter((i): i is string => typeof i === 'string') : [],
    healthConditions: Array.isArray(p.healthConditions) ? p.healthConditions.filter((h): h is string => typeof h === 'string') : [],
    notes: typeof p.notes === 'string' ? p.notes : undefined,
  };
}

router.post(
  '/',
  async (req: Request<object, object, AnalysisRequest>, res: Response, next: NextFunction) => {
    try {
      const { composition, sourceType, attachment, petProfile } = req.body;

      let normalizedComposition = typeof composition === 'string' ? composition.trim() : '';

      if (sourceType === 'file') {
        if (!attachment || typeof attachment !== 'object') {
          res.status(400).json({ error: 'Chýba príloha na analýzu.', status: 400 });
          return;
        }

        normalizedComposition = await extractTextFromAttachment(attachment);
      }

      if (!normalizedComposition) {
        res.status(400).json({
          error: 'Nepodarilo sa získať text na analýzu. Skontrolujte vstupný text alebo súbor.',
          status: 400,
        });
        return;
      }

      const validatedProfile = validatePetProfile(petProfile);
      const result = await callAiModel(normalizedComposition, validatedProfile);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
