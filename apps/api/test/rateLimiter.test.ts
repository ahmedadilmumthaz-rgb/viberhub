import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createRateLimiter } from '../src/middleware/rateLimiter.js';

describe('Rate Limiter Middleware', () => {
  it('allows requests within threshold and blocks with 429 when exceeded', () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxRequests: 3,
      message: 'Limit reached'
    });

    let statusCode: number | null = null;
    let responseBody: any = null;

    const mockReq = {
      ip: '192.168.1.100',
      socket: { remoteAddress: '192.168.1.100' }
    } as any;

    const mockRes = {
      setHeader: (_key: string, _val: any) => {},
      status: (code: number) => {
        statusCode = code;
        return {
          json: (body: any) => {
            responseBody = body;
          }
        };
      }
    } as any;

    let nextCalls = 0;
    const next = () => { nextCalls++; };

    // Calls 1, 2, 3 should succeed
    limiter(mockReq, mockRes, next);
    limiter(mockReq, mockRes, next);
    limiter(mockReq, mockRes, next);
    assert.strictEqual(nextCalls, 3);
    assert.strictEqual(statusCode, null);

    // Call 4 should trigger 429
    limiter(mockReq, mockRes, next);
    assert.strictEqual(nextCalls, 3);
    assert.strictEqual(statusCode, 429);
    assert.strictEqual(responseBody?.error?.code, 'RATE_LIMIT_EXCEEDED');
  });
});
