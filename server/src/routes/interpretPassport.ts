import { Router, Request, Response, NextFunction } from 'express';
import {
  interpretHealthPassportWithOpenAI,
  interpretHealthPassportFromImage,
  InvalidAiInputError,
} from '../services/aiService';
import { logger } from '../utils/logger';

const router = Router();

const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 50000;
const MAX_BASE64_LENGTH = Math.ceil((5 * 1024 * 1024 * 4) / 3);

interface InterpretBody {
  text?: unknown;
  attachment?: {
    fileName?: unknown;
    mimeType?: unknown;
    base64Data?: unknown;
  };
}

router.post(
  '/',
  async (req: Request<object, object, InterpretBody>, res: Response, next: NextFunction) => {
    try {
      const rawAttachment = req.body?.attachment;

      // Vision cesta: obrázok dokumentu → štruktúrované záznamy v jednom volaní.
      if (rawAttachment && typeof rawAttachment === 'object') {
        const mimeType =
          typeof rawAttachment.mimeType === 'string' ? rawAttachment.mimeType : '';
        const base64Data =
          typeof rawAttachment.base64Data === 'string' ? rawAttachment.base64Data : '';
        const fileName =
          typeof rawAttachment.fileName === 'string' ? rawAttachment.fileName : '';

        if (!base64Data || !mimeType) {
          res.status(400).json({ error: { message: 'Neplatná príloha.' } });
          return;
        }
        if (base64Data.length > MAX_BASE64_LENGTH) {
          res.status(400).json({ error: { message: 'Súbor je príliš veľký (max 5 MB).' } });
          return;
        }

        logger.info('Backend prijal interpret-passport (vision) požiadavku', {
          mimeType,
          base64Length: base64Data.length,
        });

        const visionResult = await interpretHealthPassportFromImage(
          { fileName, mimeType, base64Data },
          {
            userId: req.appUserId ?? req.user?.uid,
            aiProcessingConsent: req.aiConsentGranted === true,
            processesHealthData: true,
          }
        );

        if (!visionResult) {
          res.status(502).json({
            error: { message: 'Interpretácia dokumentu zlyhala. Skús to znova.' },
          });
          return;
        }

        logger.info('Interpretácia pasu (vision) dokončená', {
          recordsCount: visionResult.records?.length ?? 0,
        });
        res.json(visionResult);
        return;
      }

      const text = typeof req.body?.text === 'string' ? req.body.text : '';

      if (!text || text.length < MIN_TEXT_LENGTH) {
        res
          .status(400)
          .json({ error: { message: 'Text je príliš krátky na interpretáciu pasu.' } });
        return;
      }

      if (text.length > MAX_TEXT_LENGTH) {
        res.status(400).json({
          error: { message: `Text presahuje povolený limit ${MAX_TEXT_LENGTH} znakov.` },
        });
        return;
      }

      logger.info('Backend prijal interpret-passport požiadavku', { textLength: text.length });

      const result = await interpretHealthPassportWithOpenAI(text, {
        userId: req.appUserId ?? req.user?.uid,
        aiProcessingConsent: req.aiConsentGranted === true,
        processesHealthData: true,
      });

      if (!result) {
        res.status(502).json({
          error: { message: 'Interpretácia pasu zlyhala. Skús to znova alebo skontroluj text.' },
        });
        return;
      }

      logger.info('Interpretácia pasu dokončená', {
        recordsCount: result.records?.length ?? 0,
      });

      res.json(result);
    } catch (error) {
      if (error instanceof InvalidAiInputError) {
        logger.warn('Interpretácia pasu odmietnutá: nevhodný dokument', { reason: error.message });
        res.status(400).json({ error: { message: error.message, code: error.code } });
        return;
      }
      logger.error('Interpretácia pasu zlyhala', {
        message: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }
);

export default router;
