import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorEnvelope } from '@viberhub/shared';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Structured logging for errors without leaking sensitive data
  console.error('[API Error]', {
    method: req.method,
    url: req.originalUrl,
    errorName: err.name,
    message: err.message,
    statusCode: err.statusCode || 500
  });

  if (err instanceof ZodError) {
    return res.status(400).json(
      errorEnvelope('VALIDATION_ERROR', 'Input validation failed', err.errors)
    );
  }

  const statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message || 'Internal server error';

  return res.status(statusCode).json(errorEnvelope(code, message, err.details));
}
