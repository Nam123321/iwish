"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const webhookDispatcher_1 = require("./webhookDispatcher");
const db_1 = require("../db");
(0, vitest_1.describe)('Webhook Dispatcher', () => {
    let tenantId;
    (0, vitest_1.beforeEach)(async () => {
        const tenant = await db_1.prisma.tenant.create({ data: {} });
        tenantId = tenant.id;
    });
    (0, vitest_1.it)('should reject internal URLs (SSRF Protection)', async () => {
        (0, vitest_1.expect)(await (0, webhookDispatcher_1.isSafeUrl)('http://127.0.0.1/webhook')).toBe(false);
        (0, vitest_1.expect)(await (0, webhookDispatcher_1.isSafeUrl)('http://localhost:3000')).toBe(false);
        (0, vitest_1.expect)(await (0, webhookDispatcher_1.isSafeUrl)('http://169.254.169.254/latest/meta-data')).toBe(false);
        (0, vitest_1.expect)(await (0, webhookDispatcher_1.isSafeUrl)('http://10.0.0.1')).toBe(false);
        // Might resolve, so assuming google is safe
        (0, vitest_1.expect)(await (0, webhookDispatcher_1.isSafeUrl)('https://google.com')).toBe(true);
    });
    (0, vitest_1.it)('should queue a webhook event successfully', async () => {
        const endpoint = await (0, webhookDispatcher_1.registerWebhookEndpoint)(tenantId, 'https://example.com/hook', 'secret123');
        const event = await (0, webhookDispatcher_1.queueWebhookEvent)(tenantId, endpoint.id, 'user.created', { userId: 1 });
        (0, vitest_1.expect)(event.status).toBe('PENDING');
        const parsedPayload = JSON.parse(event.payload);
        (0, vitest_1.expect)(parsedPayload._meta.timestamp).toBeDefined(); // EC-P3-001
    });
    (0, vitest_1.it)('should reject payload exceeding 1MB limit', async () => {
        const endpoint = await (0, webhookDispatcher_1.registerWebhookEndpoint)(tenantId, 'https://example.com/hook', 'secret123');
        const hugePayload = { data: 'a'.repeat(1024 * 1024 + 10) }; // > 1MB
        await (0, vitest_1.expect)((0, webhookDispatcher_1.queueWebhookEvent)(tenantId, endpoint.id, 'large.event', hugePayload)).rejects.toThrow('Payload size exceeds 1MB limit');
    });
});
