"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiKey = createApiKey;
exports.validateApiKey = validateApiKey;
const db_1 = require("../db");
const crypto_1 = __importDefault(require("crypto"));
function hashKey(key) {
    return crypto_1.default.createHash('sha256').update(key).digest('hex');
}
async function createApiKey(tenantId, name) {
    const randomBytes = crypto_1.default.randomBytes(32).toString('hex');
    const plainKey = `sk_live_${randomBytes}`;
    const keyPrefix = plainKey.substring(0, 12);
    const keyHash = hashKey(plainKey);
    const apiKey = await db_1.prisma.apiKey.create({
        data: {
            tenantId,
            name,
            keyHash,
            keyPrefix
        }
    });
    return { apiKey, plainKey };
}
async function validateApiKey(plainKey) {
    const keyHash = hashKey(plainKey);
    const apiKey = await db_1.prisma.apiKey.findFirst({
        where: { keyHash, isActive: true }
    });
    if (!apiKey) {
        return null;
    }
    // EC-P6-001: Constant time comparison
    const dbHashBuffer = Buffer.from(apiKey.keyHash, 'hex');
    const computedHashBuffer = Buffer.from(keyHash, 'hex');
    if (dbHashBuffer.length !== computedHashBuffer.length) {
        return null;
    }
    const isValid = crypto_1.default.timingSafeEqual(dbHashBuffer, computedHashBuffer);
    if (!isValid)
        return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return null;
    }
    await db_1.prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() }
    });
    return apiKey.tenantId;
}
