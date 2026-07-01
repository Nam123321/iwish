import { describe, it, expect, vi } from 'vitest';
import { createFeatureFlagMiddleware } from './feature-flag';
import { IHttpRequest, IHttpResponse } from '../types/middleware';

describe('Feature Flag Middleware', () => {
  it('allows request if flag is enabled', async () => {
    const store = { getFlag: vi.fn().mockResolvedValue({ isEnabled: true }), getAllFlags: vi.fn() };
    const middleware = createFeatureFlagMiddleware({ store, flagMapping: { '/api/v2': 'v2_features' } });
    
    const req = { path: '/api/v2/users' } as unknown as IHttpRequest;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as IHttpResponse;
    const next = vi.fn();

    await middleware(req, res, next);
    expect(store.getFlag).toHaveBeenCalledWith('v2_features');
    expect(next).toHaveBeenCalled();
  });

  it('blocks request if flag is disabled', async () => {
    const store = { getFlag: vi.fn().mockResolvedValue({ isEnabled: false }), getAllFlags: vi.fn() };
    const middleware = createFeatureFlagMiddleware({ store, flagMapping: { '/api/v2': 'v2_features' } });
    
    const req = { path: '/api/v2/users' } as unknown as IHttpRequest;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as IHttpResponse;
    const next = vi.fn();

    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Feature is currently disabled' });
    expect(next).not.toHaveBeenCalled();
  });
});
