import { describe, it, expect, vi } from 'vitest';
import { createCorsAndOwaspMiddleware } from './cors';
import { IHttpRequest, IHttpResponse } from '../types/middleware';

describe('CORS and OWASP Middleware', () => {
  it('injects OWASP headers', () => {
    const middleware = createCorsAndOwaspMiddleware({ allowedOrigins: ['https://example.com'] });
    const req = { header: () => undefined, method: 'GET' } as unknown as IHttpRequest;
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() } as unknown as IHttpResponse;
    const next = vi.fn();

    middleware(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', "default-src 'self'");
    expect(next).toHaveBeenCalled();
  });

  it('rejects unallowed origin', () => {
    const middleware = createCorsAndOwaspMiddleware({ allowedOrigins: ['https://example.com'] });
    const req = { header: (n: string) => n === 'origin' ? 'https://evil.com' : undefined, method: 'GET' } as unknown as IHttpRequest;
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as IHttpResponse;
    const next = vi.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'CORS policy violation: Origin not allowed' });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows matching regex origin', () => {
    const middleware = createCorsAndOwaspMiddleware({ allowedOrigins: /^https:\/\/[a-z0-9-]+\.mycompany\.com$/ });
    const req = { header: (n: string) => n === 'origin' ? 'https://app.mycompany.com' : undefined, method: 'GET' } as unknown as IHttpRequest;
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() } as unknown as IHttpResponse;
    const next = vi.fn();

    middleware(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://app.mycompany.com');
    expect(next).toHaveBeenCalled();
  });
});
