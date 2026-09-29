"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const apiKeyManager_1 = require("./apiKeyManager");
const db_1 = require("../db");
(0, vitest_1.describe)('API Key Manager', () => {
    let tenantId;
    (0, vitest_1.beforeEach)(async () => {
        const tenant = await db_1.prisma.tenant.create({ data: {} });
        tenantId = tenant.id;
    });
    (0, vitest_1.it)('should create an API key and hash it', async () => {
        const { apiKey, plainKey } = await (0, apiKeyManager_1.createApiKey)(tenantId, 'Test Key');
        (0, vitest_1.expect)(apiKey.keyPrefix).toBe(plainKey.substring(0, 12));
        (0, vitest_1.expect)(apiKey.keyHash).not.toBe(plainKey);
    });
    (0, vitest_1.it)('should validate a valid API key', async () => {
        const { plainKey } = await (0, apiKeyManager_1.createApiKey)(tenantId, 'Valid Key');
        const validatedTenantId = await (0, apiKeyManager_1.validateApiKey)(plainKey);
        (0, vitest_1.expect)(validatedTenantId).toBe(tenantId);
    });
    (0, vitest_1.it)('should reject an invalid API key', async () => {
        const validatedTenantId = await (0, apiKeyManager_1.validateApiKey)('sk_live_invalid1234567890');
        (0, vitest_1.expect)(validatedTenantId).toBeNull();
    });
});
