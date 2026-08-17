import { Router, Request, Response, NextFunction } from 'express';
import { extractRawTextFromAttachment } from '../services/aiService';
import { logger } from '../utils/logger';

const router = Router();

const MAX_BASE64_LENGTH = Math.ceil((5 * 1024 * 1024 * 4) / 3);

interface ExtractTextBody {
  attachment?: {
    fileName?: unknown;
    mimeType?: unknown;
    base64Data?: unknown;
  };
}

router.post(
  '/',
  async (req: Request<object, object, ExtractTextBody>, res: Response, next: NextFunction) => {
    try {
      const raw = req.body?.attachment;
      if (!raw || typeof raw !== 'object') {
        res.status(400).json({ error: { message: 'Chýba príloha na extrakciu.' } });
        return;
      }

      const fileName = typeof raw.fileName === 'string' ? raw.fileName : '';
      const mimeType = typeof raw.mimeType === 'string' ? raw.mimeType : '';
      const base64Data = typeof raw.base64Data === 'string' ? raw.base64Data : '';

      if (!base64Data || !mimeType) {
        res.status(400).json({ error: { message: 'Neplatná príloha.' } });
        return;
      }

      if (base64Data.length > MAX_BASE64_LENGTH) {
        res.status(400).json({ error: { message: 'Súbor je príliš veľký (max 5 MB).' } });
        return;
      }

      logger.info('Backend prijal extract-text požiadavku', {
        fileName,
        mimeType,
        base64Length: base64Data.length,
      });

      const result = await extractRawTextFromAttachment(
        { fileName, mimeType, base64Data },
        {
          userId: req.appUserId ?? req.user?.uid,
          aiProcessingConsent: req.aiConsentGranted === true,
          processesHealthData: true,
        }
      );

      logger.info('Extrakcia textu dokončená', {
        source: result.source,
        extractedTextLength: result.extractedText.length,
      });

      if (!result.extractedText) {
        res
          .status(502)
          .json({ error: { message: 'Z dokumentu sa nepodarilo extrahovať žiadny text.' } });
        return;
      }

      res.json({ extractedText: result.extractedText, source: result.source });
    } catch (error) {
      logger.error('Extrakcia textu zlyhala', {
        message: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }
);

export default router;
