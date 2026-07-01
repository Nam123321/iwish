"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const cors_1 = require("./cors");
(0, vitest_1.describe)('CORS and OWASP Middleware', () => {
    (0, vitest_1.it)('injects OWASP headers', () => {
        const middleware = (0, cors_1.createCorsAndOwaspMiddleware)({ allowedOrigins: ['https://example.com'] });
        const req = { header: () => undefined, method: 'GET' };
        const res = { setHeader: vitest_1.vi.fn(), status: vitest_1.vi.fn().mockReturnThis(), send: vitest_1.vi.fn() };
        const next = vitest_1.vi.fn();
        middleware(req, res, next);
        (0, vitest_1.expect)(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
        (0, vitest_1.expect)(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', "default-src 'self'");
        (0, vitest_1.expect)(next).toHaveBeenCalled();
    });
    (0, vitest_1.it)('rejects unallowed origin', () => {
        const middleware = (0, cors_1.createCorsAndOwaspMiddleware)({ allowedOrigins: ['https://example.com'] });
        const req = { header: (n) => n === 'origin' ? 'https://evil.com' : undefined, method: 'GET' };
        const res = { setHeader: vitest_1.vi.fn(), status: vitest_1.vi.fn().mockReturnThis(), json: vitest_1.vi.fn() };
        const next = vitest_1.vi.fn();
        middleware(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(403);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({ error: 'CORS policy violation: Origin not allowed' });
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('allows matching regex origin', () => {
        const middleware = (0, cors_1.createCorsAndOwaspMiddleware)({ allowedOrigins: /^https:\/\/[a-z0-9-]+\.mycompany\.com$/ });
        const req = { header: (n) => n === 'origin' ? 'https://app.mycompany.com' : undefined, method: 'GET' };
        const res = { setHeader: vitest_1.vi.fn(), status: vitest_1.vi.fn().mockReturnThis(), send: vitest_1.vi.fn() };
        const next = vitest_1.vi.fn();
        middleware(req, res, next);
        (0, vitest_1.expect)(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://app.mycompany.com');
        (0, vitest_1.expect)(next).toHaveBeenCalled();
    });
});
