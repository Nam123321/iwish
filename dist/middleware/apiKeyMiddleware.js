"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.apiKeyMiddleware = apiKeyMiddleware;
const apiKeyManager_1 = require("../api-keys/apiKeyManager");
const redis_1 = require("redis");
exports.redisClient = (0, redis_1.createClient)({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
exports.redisClient.connect().catch(() => { }); // Non-blocking connect
async function apiKeyMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid API key' });
    }
    const plainKey = authHeader.split(' ')[1];
    const tenantId = await (0, apiKeyManager_1.validateApiKey)(plainKey);
    if (!tenantId) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    // Rate Limiting
    const rateLimitKey = `ratelimit:tenant:${tenantId}:api`;
    const limit = 100;
    try {
        const current = await exports.redisClient.incr(rateLimitKey);
        if (current === 1) {
            await exports.redisClient.expire(rateLimitKey, 60);
        }
        if (current > limit) {
            return res.status(429).json({ error: 'Too Many Requests' });
        }
    }
    catch (err) {
        // Fail open if Redis is down
    }
    // Inject context
    req.tenantId = tenantId;
    next();
}
