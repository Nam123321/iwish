"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const feature_flag_1 = require("./feature-flag");
(0, vitest_1.describe)('Feature Flag Middleware', () => {
    (0, vitest_1.it)('allows request if flag is enabled', async () => {
        const store = { getFlag: vitest_1.vi.fn().mockResolvedValue({ isEnabled: true }), getAllFlags: vitest_1.vi.fn() };
        const middleware = (0, feature_flag_1.createFeatureFlagMiddleware)({ store, flagMapping: { '/api/v2': 'v2_features' } });
        const req = { path: '/api/v2/users' };
        const res = { status: vitest_1.vi.fn().mockReturnThis(), json: vitest_1.vi.fn() };
        const next = vitest_1.vi.fn();
        await middleware(req, res, next);
        (0, vitest_1.expect)(store.getFlag).toHaveBeenCalledWith('v2_features');
        (0, vitest_1.expect)(next).toHaveBeenCalled();
    });
    (0, vitest_1.it)('blocks request if flag is disabled', async () => {
        const store = { getFlag: vitest_1.vi.fn().mockResolvedValue({ isEnabled: false }), getAllFlags: vitest_1.vi.fn() };
        const middleware = (0, feature_flag_1.createFeatureFlagMiddleware)({ store, flagMapping: { '/api/v2': 'v2_features' } });
        const req = { path: '/api/v2/users' };
        const res = { status: vitest_1.vi.fn().mockReturnThis(), json: vitest_1.vi.fn() };
        const next = vitest_1.vi.fn();
        await middleware(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(404);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({ error: 'Feature is currently disabled' });
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
    });
});
