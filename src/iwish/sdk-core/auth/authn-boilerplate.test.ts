import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthNBoilerplate, SSOTokenPayload, IDatabaseClient, Tenant, SSOConfig } from './authn-boilerplate';
import { IConfigLoader, ILogger, IEventDispatcher } from '../types';

describe('AuthNBoilerplate', () => {
  let db: IDatabaseClient;
  let config: IConfigLoader;
  let logger: ILogger;
  let dispatcher: IEventDispatcher;
  let authn: AuthNBoilerplate;

  const validNow = Math.floor(Date.now() / 1000);

  const mockTenant: Tenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    domain: 'test.com',
    mfa_required: false,
  };

  const mockSSOConfig: SSOConfig = {
    id: 'sso-123',
    tenant_id: 'tenant-123',
    provider_type: 'OIDC',
    issuer: 'https://idp.test.com',
    client_id: 'client-123',
    certificate: 'cert',
  };

  beforeEach(() => {
    db = {
      getTenantByDomain: vi.fn().mockResolvedValue(mockTenant),
      getSSOConfig: vi.fn().mockResolvedValue(mockSSOConfig),
      upsertUser: vi.fn().mockResolvedValue(undefined),
      createSession: vi.fn().mockResolvedValue(undefined),
    };

    config = {
      getConfig: vi.fn().mockReturnValue(300), // 300 sec skew tolerance
      hasConfig: vi.fn().mockReturnValue(true),
    };

    logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      maskSensitiveData: vi.fn().mockImplementation((payload) => payload),
    };

    dispatcher = {
      setErrorHandler: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      dispatch: vi.fn(),
    };

    authn = new AuthNBoilerplate(db, config, logger, dispatcher);
  });

  const getValidToken = (): SSOTokenPayload => ({
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

  it('AC1 & EC-P3-001: should process valid token successfully and upsert user', async () => {
    const token = getValidToken();
    const result = await authn.processSSOToken(token, 'test.com');
    
    expect(result.status).toBe('SUCCESS');
    expect(result.session).toBeDefined();
    expect(result.session?.user_id).toBe('user-123');
    
    expect(db.upsertUser).toHaveBeenCalledWith({
      id: 'user-123',
      email: 'user@test.com',
      tenant_id: 'tenant-123',
      full_name: 'Test User',
    });
    
    expect(db.createSession).toHaveBeenCalled();
    expect(dispatcher.dispatch).toHaveBeenCalledWith('USER_LOGGED_IN', { userId: 'user-123', tenantId: 'tenant-123' });
  });

  it('EC-P6-001: should reject token if there is a cross-tenant mismatch', async () => {
    const token = getValidToken();
    token.tenant = 'attacker.com';
    
    await expect(authn.processSSOToken(token, 'test.com')).rejects.toThrow('Cross-tenant mismatch');
    expect(logger.error).toHaveBeenCalledWith('Cross-tenant mismatch detected', expect.anything());
  });

  it('EC-P8-001: should prompt for local MFA if IdP did not perform it when required', async () => {
    db.getTenantByDomain = vi.fn().mockResolvedValue({ ...mockTenant, mfa_required: true });
    
    const token = getValidToken();
    token.amr = ['pwd']; // missing mfa
    
    const result = await authn.processSSOToken(token, 'test.com');
    
    expect(result.status).toBe('MFA_REQUIRED');
    expect(logger.info).toHaveBeenCalledWith('Local MFA challenge required for user', expect.anything());
    expect(db.createSession).not.toHaveBeenCalled(); // No session created yet
  });

  it('EC-P8-001: should NOT prompt for local MFA if IdP performed it and it is required', async () => {
    db.getTenantByDomain = vi.fn().mockResolvedValue({ ...mockTenant, mfa_required: true });
    
    const token = getValidToken();
    token.amr = ['pwd', 'mfa']; 
    
    const result = await authn.processSSOToken(token, 'test.com');
    
    expect(result.status).toBe('SUCCESS');
  });

  it('EC-P1-002: should successfully authenticate within clock skew (nbf in future within 300s)', async () => {
    const token = getValidToken();
    // 200 seconds in future (within 300s skew)
    token.nbf = validNow + 200; 
    
    const result = await authn.processSSOToken(token, 'test.com');
    expect(result.status).toBe('SUCCESS');
  });

  it('EC-P1-002: should reject if nbf is beyond clock skew', async () => {
    const token = getValidToken();
    // 400 seconds in future (beyond 300s skew)
    token.nbf = validNow + 400; 
    
    await expect(authn.processSSOToken(token, 'test.com')).rejects.toThrow('Token not yet valid (nbf)');
  });

  it('EC-P1-002: should successfully authenticate within clock skew (exp in past within 300s)', async () => {
    const token = getValidToken();
    // expired 200 seconds ago (within 300s skew)
    token.exp = validNow - 200; 
    
    const result = await authn.processSSOToken(token, 'test.com');
    expect(result.status).toBe('SUCCESS');
  });

  it('EC-P1-002: should reject if exp is beyond clock skew', async () => {
    const token = getValidToken();
    // expired 400 seconds ago (beyond 300s skew)
    token.exp = validNow - 400; 
    
    await expect(authn.processSSOToken(token, 'test.com')).rejects.toThrow('Token expired');
  });
});
