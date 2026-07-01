"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthNBoilerplate = void 0;
class AuthNBoilerplate {
    db;
    config;
    logger;
    dispatcher;
    get clockSkewToleranceSeconds() {
        try {
            return this.config.getConfig('CLOCK_SKEW_TOLERANCE_SEC', 300);
        }
        catch {
            return 300;
        }
    }
    constructor(db, config, logger, dispatcher) {
        this.db = db;
        this.config = config;
        this.logger = logger;
        this.dispatcher = dispatcher;
    }
    async processSSOToken(token, requestedTenantDomain) {
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
        // Generate internal session
        const session = {
            id: "sess_" + Math.random().toString(36).substring(7),
            user_id: token.sub,
            access_token_hash: "hash_placeholder",
            refresh_token_hash: "hash_placeholder",
            expires_at: new Date(token.exp * 1000),
            amr: token.amr || ['pwd']
        };
        await this.db.createSession(session);
        this.dispatcher.dispatch('USER_LOGGED_IN', { userId: token.sub, tenantId: tenant.id });
        return { status: 'SUCCESS', session };
    }
}
exports.AuthNBoilerplate = AuthNBoilerplate;
