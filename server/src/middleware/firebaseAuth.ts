import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/firebase';
import { logger } from '../utils/logger';
import { httpError } from '../utils/httpError';

export interface FirebaseAuthOptions {
  /**
   * Ak true, neoverení password používatelia prejdú (token sa stále verifikuje).
   * Použité pre endpointy ktoré samé riešia email verification (napr. /api/auth/send-verification).
   */
  allowUnverified?: boolean;
}

export function firebaseAuth(opts: FirebaseAuthOptions = {}) {
  return async function firebaseAuthMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        throw httpError(401, 'Prihlásenie je povinné.', 'UNAUTHORIZED');
      }

      const idToken = header.slice('Bearer '.length).trim();
      if (!idToken) {
        throw httpError(401, 'Prihlásenie je povinné.', 'UNAUTHORIZED');
      }

      const decoded = await getAuth().verifyIdToken(idToken);
      const provider = (decoded.firebase as { sign_in_provider?: string } | undefined)
        ?.sign_in_provider;
      // Fail-closed: chýbajúci claim (undefined) sa počíta ako NEoverený.
      // `=== false` by pri chýbajúcom claime request pustil ďalej.
      if (!opts.allowUnverified && provider === 'password' && decoded.email_verified !== true) {
        throw httpError(403, 'E-mail nie je overený.', 'EMAIL_NOT_VERIFIED');
      }
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        emailVerified: decoded.email_verified === true,
        provider,
      };
      next();
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (typeof status === 'number') {
        next(err);
        return;
      }
      logger.error('Overenie Firebase tokenu zlyhalo', {
        path: req.originalUrl,
        reason: err instanceof Error ? err.message : String(err),
        code: (err as { code?: string }).code,
      });
      next(httpError(401, 'Neplatný alebo expirovaný prihlasovací token.', 'INVALID_TOKEN'));
    }
  };
}
