import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiError>,
  _next: NextFunction
): void {
  console.error('[Error]', err.message);

  const status = (err as Error & { status?: number }).status ?? 500;
  res.status(status).json({
    error: err.message || 'Interná chyba servera',
    status,
  });
}
