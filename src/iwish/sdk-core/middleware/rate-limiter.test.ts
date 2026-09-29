import { describe, it, expect, vi } from 'vitest';
import { createRateLimiterMiddleware } from './rate-limiter';
import { IHttpRequest, IHttpResponse } from '../types/middleware';

describe('RateLimiter Middleware', () => {
  it('blocks request if IP is in blocklist', async () => {
    const blocklistStore = { isBlocked: vi.fn().mockResolvedValue(true) };
    const middleware = createRateLimiterMiddleware({ store: { incrementAndGet: vi.fn() }, blocklistStore });
    
    const req = { header: () => undefined, ip: '1.2.3.4', path: '/api/test' } as unknown as IHttpRequest;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as IHttpResponse;
    const next = vi.fn();

    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: IP is blocked' });
  });

  it('respects trustProxy and X-Forwarded-For', async () => {
    const store = { incrementAndGet: vi.fn().mockResolvedValue({ requestCount: 1 }) };
    const middleware = createRateLimiterMiddleware({ store, trustProxy: true, trustedProxies: ['8.8.8.8'] });
    
    const req = { header: (n: string) => n === 'x-forwarded-for' ? '9.9.9.9, 8.8.8.8' : undefined, path: '/api/test' } as unknown as IHttpRequest;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as IHttpResponse;
    const next = vi.fn();

    await middleware(req, res, next);
    expect(store.incrementAndGet).toHaveBeenCalledWith(expect.stringContaining('9.9.9.9'), expect.any(Number));
    expect(next).toHaveBeenCalled();
  });

  it('applies higher limit to webhook paths', async () => {
    const store = { incrementAndGet: vi.fn().mockResolvedValue({ requestCount: 500 }) };
    const middleware = createRateLimiterMiddleware({ store, defaultLimit: 100, webhookLimit: 1000 });
    
    const req = { header: () => undefined, ip: '1.2.3.4', path: '/api/webhooks/github' } as unknown as IHttpRequest;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as IHttpResponse;
    const next = vi.fn();

    await middleware(req, res, next);
    // Request count 500 is > defaultLimit(100), but < webhookLimit(1000), so it should pass
    expect(store.incrementAndGet).toHaveBeenCalledWith('rate_limit:webhook:1.2.3.4', expect.any(Number));
    expect(next).toHaveBeenCalled();
  });
});
