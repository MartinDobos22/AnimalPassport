import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ApiError>,
  _next: NextFunction
): void {
  logger.error('Nezachytená chyba na serveri', {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
  });

  const status = (err as Error & { status?: number }).status ?? 500;
  res.status(status).json({
    error: err.message || 'Interná chyba servera',
    status,
  });
}
