"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const rate_limiter_1 = require("./rate-limiter");
(0, vitest_1.describe)('RateLimiter Middleware', () => {
    (0, vitest_1.it)('blocks request if IP is in blocklist', async () => {
        const blocklistStore = { isBlocked: vitest_1.vi.fn().mockResolvedValue(true) };
        const middleware = (0, rate_limiter_1.createRateLimiterMiddleware)({ store: { incrementAndGet: vitest_1.vi.fn() }, blocklistStore });
        const req = { header: () => undefined, ip: '1.2.3.4', path: '/api/test' };
        const res = { status: vitest_1.vi.fn().mockReturnThis(), json: vitest_1.vi.fn() };
        const next = vitest_1.vi.fn();
        await middleware(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(403);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({ error: 'Forbidden: IP is blocked' });
    });
    (0, vitest_1.it)('respects trustProxy and X-Forwarded-For', async () => {
        const store = { incrementAndGet: vitest_1.vi.fn().mockResolvedValue({ requestCount: 1 }) };
        const middleware = (0, rate_limiter_1.createRateLimiterMiddleware)({ store, trustProxy: true, trustedProxies: ['8.8.8.8'] });
        const req = { header: (n) => n === 'x-forwarded-for' ? '9.9.9.9, 8.8.8.8' : undefined, path: '/api/test' };
        const res = { status: vitest_1.vi.fn().mockReturnThis(), json: vitest_1.vi.fn() };
        const next = vitest_1.vi.fn();
        await middleware(req, res, next);
        (0, vitest_1.expect)(store.incrementAndGet).toHaveBeenCalledWith(vitest_1.expect.stringContaining('9.9.9.9'), vitest_1.expect.any(Number));
        (0, vitest_1.expect)(next).toHaveBeenCalled();
    });
    (0, vitest_1.it)('applies higher limit to webhook paths', async () => {
        const store = { incrementAndGet: vitest_1.vi.fn().mockResolvedValue({ requestCount: 500 }) };
        const middleware = (0, rate_limiter_1.createRateLimiterMiddleware)({ store, defaultLimit: 100, webhookLimit: 1000 });
        const req = { header: () => undefined, ip: '1.2.3.4', path: '/api/webhooks/github' };
        const res = { status: vitest_1.vi.fn().mockReturnThis(), json: vitest_1.vi.fn() };
        const next = vitest_1.vi.fn();
        await middleware(req, res, next);
        // Request count 500 is > defaultLimit(100), but < webhookLimit(1000), so it should pass
        (0, vitest_1.expect)(store.incrementAndGet).toHaveBeenCalledWith('rate_limit:webhook:1.2.3.4', vitest_1.expect.any(Number));
        (0, vitest_1.expect)(next).toHaveBeenCalled();
    });
});
