import { Request, Response, NextFunction } from 'express';
import { errorEnvelope } from '@viberhub/shared';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const ipBuckets = new Map<string, RateLimitRecord>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.ip || req.socket.remoteAddress || '127.0.0.1').toString();
    const now = Date.now();

    const record = ipBuckets.get(ip);

    if (!record || now > record.resetAt) {
      ipBuckets.set(ip, {
        count: 1,
        resetAt: now + options.windowMs
      });
      return next();
    }

    record.count++;

    if (record.count > options.maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);

      return res.status(429).json(
        errorEnvelope(
          'RATE_LIMIT_EXCEEDED',
          options.message || `Too many requests. Please retry in ${retryAfterSeconds} seconds.`
        )
      );
    }

    next();
  };
}

// 5 attempts per 15 minutes for auth endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many authentication attempts. Please try again later.'
});

// 30 uploads or imports per minute
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Upload or import frequency limit exceeded. Please wait a moment.'
});
