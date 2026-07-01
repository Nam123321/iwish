import { IConfigLoader, ILogger, IEventDispatcher } from '../types';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  mfa_required: boolean;
}

export interface SSOConfig {
  id: string;
  tenant_id: string;
  provider_type: string;
  issuer: string;
  client_id: string;
  certificate: string;
}

export interface SSOTokenPayload {
  iss: string;
  aud: string;
  tenant: string;
  nbf: number;
  exp: number;
  amr?: string[];
  sub: string;
  email: string;
  full_name: string;
}

export interface User {
  id: string;
  email: string;
  tenant_id: string;
  full_name: string;
}

export interface AuthSession {
  id: string;
  user_id: string;
  access_token_hash: string;
  refresh_token_hash: string;
  expires_at: Date;
  amr: string[];
}

export interface IDatabaseClient {
  getTenantByDomain(domain: string): Promise<Tenant | null>;
  getSSOConfig(tenantId: string): Promise<SSOConfig | null>;
  /**
   * EC-P3-001: atomic UPSERT for JIT provisioning
   * The underlying implementation MUST use ON CONFLICT DO UPDATE
   */
  upsertUser(user: User): Promise<void>;
  createSession(session: AuthSession): Promise<void>;
}

export class AuthNBoilerplate {
  private get clockSkewToleranceSeconds(): number {
    try {
      return this.config.getConfig<number>('CLOCK_SKEW_TOLERANCE_SEC', 300);
    } catch {
      return 300;
    }
  }

  constructor(
    private db: IDatabaseClient,
    private config: IConfigLoader,
    private logger: ILogger,
    private dispatcher: IEventDispatcher
  ) {}

  public async processSSOToken(
    token: SSOTokenPayload, 
    requestedTenantDomain: string
  ): Promise<{ status: 'SUCCESS' | 'MFA_REQUIRED', session?: AuthSession }> {
    
    // EC-P6-001: Cross-tenant mismatch validation
    if (token.tenant !== requestedTenantDomain) {
      this.logger.error("Cross-tenant mismatch detected", this.logger.maskSensitiveData({
        tokenTenant: token.tenant,
        requested: requestedTenantDomain
      }));
      throw new Error("Cross-tenant mismatch");
    }

    const tenant = await this.db.getTenantByDomain(requestedTenantDomain);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const ssoConfig = await this.db.getSSOConfig(tenant.id);
    if (!ssoConfig) {
      throw new Error("SSO not configured for tenant");
    }

    // Validate Issuer and Audience
    if (token.iss !== ssoConfig.issuer) {
      throw new Error("Invalid issuer");
    }
    if (token.aud !== ssoConfig.client_id) {
      throw new Error("Invalid audience");
    }

    // EC-P1-002: Clock skew tolerance (3-5 minutes)
    const nowSecs = Math.floor(Date.now() / 1000);
    const skew = this.clockSkewToleranceSeconds;
    
    if (token.nbf > nowSecs + skew) {
      throw new Error("Token not yet valid (nbf)");
    }
    if (token.exp < nowSecs - skew) {
      throw new Error("Token expired");
    }

    // EC-P3-001: JIT Provisioning with atomic upsert
    await this.db.upsertUser({
      id: token.sub,
      email: token.email,
      tenant_id: tenant.id,
      full_name: token.full_name
    });

    // EC-P8-001: MFA Trust checking
    let mfaNeededLocal = false;
    if (tenant.mfa_required) {
      if (!token.amr || !token.amr.includes("mfa")) {
        mfaNeededLocal = true;
      }
    }

    if (mfaNeededLocal) {
      this.logger.info("Local MFA challenge required for user", this.logger.maskSensitiveData({ sub: token.sub }));
      return { status: 'MFA_REQUIRED' };
    }

    const crypto = await import('crypto');
    
    // Generate internal session
    const session: AuthSession = {
      id: "sess_" + crypto.randomUUID().replace(/-/g, ''),
      user_id: token.sub,
      access_token_hash: crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex'),
      refresh_token_hash: crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex'),
      expires_at: new Date(token.exp * 1000),
      amr: token.amr || ['pwd']
    };

    await this.db.createSession(session);

    this.dispatcher.dispatch('USER_LOGGED_IN', { userId: token.sub, tenantId: tenant.id });

    return { status: 'SUCCESS', session };
  }
}
