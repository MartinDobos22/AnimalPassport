import { Router, Request, Response, NextFunction } from 'express';

import { InvalidAiInputError } from '../services/aiService';
import { scanMedicationPackage } from '../services/medicationScanService';
import { logger } from '../utils/logger';

const router = Router();

const MAX_BASE64_LENGTH = Math.ceil((5 * 1024 * 1024 * 4) / 3);
const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface ScanBody {
  attachment?: {
    fileName?: unknown;
    mimeType?: unknown;
    base64Data?: unknown;
  };
  aiProcessingConsent?: unknown;
}

router.post(
  '/',
  async (req: Request<object, object, ScanBody>, res: Response, next: NextFunction) => {
    try {
      const raw = req.body?.attachment;
      if (!raw || typeof raw !== 'object') {
        res.status(400).json({ error: { message: 'Chýba fotka obalu prípravku.' } });
        return;
      }

      const mimeType = typeof raw.mimeType === 'string' ? raw.mimeType : '';
      const base64Data = typeof raw.base64Data === 'string' ? raw.base64Data : '';
      const fileName = typeof raw.fileName === 'string' ? raw.fileName : '';

      if (!base64Data || !mimeType) {
        res.status(400).json({ error: { message: 'Neplatná príloha.' } });
        return;
      }
      if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
        res.status(400).json({
          error: { message: 'Podporované sú len fotky vo formáte JPEG, PNG alebo WebP.' },
        });
        return;
      }
      if (base64Data.length > MAX_BASE64_LENGTH) {
        res.status(400).json({ error: { message: 'Fotka je príliš veľká (max 5 MB).' } });
        return;
      }

      logger.info('Backend prijal scan-medication požiadavku', {
        mimeType,
        base64Length: base64Data.length,
      });

      const result = await scanMedicationPackage(
        { fileName, mimeType, base64Data },
        {
          userId: req.appUserId ?? req.user?.uid,
          aiProcessingConsent: req.body?.aiProcessingConsent === true,
          processesHealthData: true,
        }
      );

      if (!result) {
        res.status(502).json({
          error: { message: 'Rozpoznanie prípravku zlyhalo. Skús to znova.' },
        });
        return;
      }

      logger.info('Scan obalu lieku dokončený', {
        recordType: result.recordType,
        confidence: result.confidence,
      });

      res.json(result);
    } catch (error) {
      if (error instanceof InvalidAiInputError) {
        logger.warn('Scan obalu lieku odmietnutý', { reason: error.message });
        res.status(400).json({ error: { message: error.message, code: error.code } });
        return;
      }
      next(error);
    }
  }
);

export default router;
