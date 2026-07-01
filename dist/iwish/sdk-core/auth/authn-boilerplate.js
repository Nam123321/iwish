"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        // Generate internal session
        const session = {
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
exports.AuthNBoilerplate = AuthNBoilerplate;
