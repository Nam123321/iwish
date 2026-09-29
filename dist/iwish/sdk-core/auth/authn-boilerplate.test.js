"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const authn_boilerplate_1 = require("./authn-boilerplate");
(0, vitest_1.describe)('AuthNBoilerplate', () => {
    let db;
    let config;
    let logger;
    let dispatcher;
    let authn;
    const validNow = Math.floor(Date.now() / 1000);
    const mockTenant = {
        id: 'tenant-123',
        name: 'Test Tenant',
        domain: 'test.com',
        mfa_required: false,
    };
    const mockSSOConfig = {
        id: 'sso-123',
        tenant_id: 'tenant-123',
        provider_type: 'OIDC',
        issuer: 'https://idp.test.com',
        client_id: 'client-123',
        certificate: 'cert',
    };
    (0, vitest_1.beforeEach)(() => {
        db = {
            getTenantByDomain: vitest_1.vi.fn().mockResolvedValue(mockTenant),
            getSSOConfig: vitest_1.vi.fn().mockResolvedValue(mockSSOConfig),
            upsertUser: vitest_1.vi.fn().mockResolvedValue(undefined),
            createSession: vitest_1.vi.fn().mockResolvedValue(undefined),
        };
        config = {
            getConfig: vitest_1.vi.fn().mockReturnValue(300), // 300 sec skew tolerance
            hasConfig: vitest_1.vi.fn().mockReturnValue(true),
        };
        logger = {
            info: vitest_1.vi.fn(),
            warn: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
            debug: vitest_1.vi.fn(),
            maskSensitiveData: vitest_1.vi.fn().mockImplementation((payload) => payload),
        };
        dispatcher = {
            setErrorHandler: vitest_1.vi.fn(),
            on: vitest_1.vi.fn(),
            off: vitest_1.vi.fn(),
            dispatch: vitest_1.vi.fn(),
        };
        authn = new authn_boilerplate_1.AuthNBoilerplate(db, config, logger, dispatcher);
    });
    const getValidToken = () => ({
        iss: 'https://idp.test.com',
        aud: 'client-123',
        tenant: 'test.com',
        nbf: validNow - 100,
        exp: validNow + 3600,
        sub: 'user-123',
        email: 'user@test.com',
        full_name: 'Test User',
        amr: ['pwd'],
    });
    (0, vitest_1.it)('AC1 & EC-P3-001: should process valid token successfully and upsert user', async () => {
        const token = getValidToken();
        const result = await authn.processSSOToken(token, 'test.com');
        (0, vitest_1.expect)(result.status).toBe('SUCCESS');
        (0, vitest_1.expect)(result.session).toBeDefined();
        (0, vitest_1.expect)(result.session?.user_id).toBe('user-123');
        (0, vitest_1.expect)(db.upsertUser).toHaveBeenCalledWith({
            id: 'user-123',
            email: 'user@test.com',
            tenant_id: 'tenant-123',
            full_name: 'Test User',
        });
        (0, vitest_1.expect)(db.createSession).toHaveBeenCalled();
        (0, vitest_1.expect)(dispatcher.dispatch).toHaveBeenCalledWith('USER_LOGGED_IN', { userId: 'user-123', tenantId: 'tenant-123' });
    });
    (0, vitest_1.it)('EC-P6-001: should reject token if there is a cross-tenant mismatch', async () => {
        const token = getValidToken();
        token.tenant = 'attacker.com';
        await (0, vitest_1.expect)(authn.processSSOToken(token, 'test.com')).rejects.toThrow('Cross-tenant mismatch');
        (0, vitest_1.expect)(logger.error).toHaveBeenCalledWith('Cross-tenant mismatch detected', vitest_1.expect.anything());
    });
    (0, vitest_1.it)('EC-P8-001: should prompt for local MFA if IdP did not perform it when required', async () => {
        db.getTenantByDomain = vitest_1.vi.fn().mockResolvedValue({ ...mockTenant, mfa_required: true });
        const token = getValidToken();
        token.amr = ['pwd']; // missing mfa
        const result = await authn.processSSOToken(token, 'test.com');
        (0, vitest_1.expect)(result.status).toBe('MFA_REQUIRED');
        (0, vitest_1.expect)(logger.info).toHaveBeenCalledWith('Local MFA challenge required for user', vitest_1.expect.anything());
        (0, vitest_1.expect)(db.createSession).not.toHaveBeenCalled(); // No session created yet
    });
    (0, vitest_1.it)('EC-P8-001: should NOT prompt for local MFA if IdP performed it and it is required', async () => {
        db.getTenantByDomain = vitest_1.vi.fn().mockResolvedValue({ ...mockTenant, mfa_required: true });
        const token = getValidToken();
        token.amr = ['pwd', 'mfa'];
        const result = await authn.processSSOToken(token, 'test.com');
        (0, vitest_1.expect)(result.status).toBe('SUCCESS');
    });
    (0, vitest_1.it)('EC-P1-002: should successfully authenticate within clock skew (nbf in future within 300s)', async () => {
        const token = getValidToken();
        // 200 seconds in future (within 300s skew)
        token.nbf = validNow + 200;
        const result = await authn.processSSOToken(token, 'test.com');
        (0, vitest_1.expect)(result.status).toBe('SUCCESS');
    });
    (0, vitest_1.it)('EC-P1-002: should reject if nbf is beyond clock skew', async () => {
        const token = getValidToken();
        // 400 seconds in future (beyond 300s skew)
        token.nbf = validNow + 400;
        await (0, vitest_1.expect)(authn.processSSOToken(token, 'test.com')).rejects.toThrow('Token not yet valid (nbf)');
    });
    (0, vitest_1.it)('EC-P1-002: should successfully authenticate within clock skew (exp in past within 300s)', async () => {
        const token = getValidToken();
        // expired 200 seconds ago (within 300s skew)
        token.exp = validNow - 200;
        const result = await authn.processSSOToken(token, 'test.com');
        (0, vitest_1.expect)(result.status).toBe('SUCCESS');
    });
    (0, vitest_1.it)('EC-P1-002: should reject if exp is beyond clock skew', async () => {
        const token = getValidToken();
        // expired 400 seconds ago (beyond 300s skew)
        token.exp = validNow - 400;
        await (0, vitest_1.expect)(authn.processSSOToken(token, 'test.com')).rejects.toThrow('Token expired');
    });
});
