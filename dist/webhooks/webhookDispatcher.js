"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSafeUrl = isSafeUrl;
exports.registerWebhookEndpoint = registerWebhookEndpoint;
exports.queueWebhookEvent = queueWebhookEvent;
exports.dispatchWebhookEvent = dispatchWebhookEvent;
const db_1 = require("../db");
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = __importDefault(require("dns/promises"));
const net_1 = require("net");
const url_1 = require("url");
const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
const MAX_RETRIES = 5;
// EC-P1-001: SSRF Protection
async function isSafeUrl(targetUrl) {
    try {
        const parsed = new url_1.URL(targetUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false;
        }
        const host = parsed.hostname;
        let ip = host;
        if (!(0, net_1.isIP)(host)) {
            try {
                const lookup = await promises_1.default.lookup(host);
                ip = lookup.address;
            }
            catch (err) {
                return false; // Cannot resolve
            }
        }
        // Check internal ranges
        const parts = ip.split('.').map(Number);
        if (parts.length === 4) {
            if (parts[0] === 127 ||
                parts[0] === 10 ||
                (parts[0] === 169 && parts[1] === 254) ||
                (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
                (parts[0] === 192 && parts[1] === 168)) {
                return false;
            }
        }
        if (ip === '::1')
            return false;
        return true;
    }
    catch (err) {
        return false;
    }
}
async function registerWebhookEndpoint(tenantId, url, secret, description) {
    const isSafe = await isSafeUrl(url);
    if (!isSafe) {
        throw new Error('Invalid URL: Potential SSRF or unresolvable domain detected');
    }
    return db_1.prisma.webhookEndpoint.create({
        data: {
            tenantId,
            url,
            secret,
            description
        }
    });
}
// EC-P3-001: Timestamp for out of order
async function queueWebhookEvent(tenantId, endpointId, eventType, payloadObj) {
    const enrichedPayload = {
        ...payloadObj,
        _meta: {
            eventType,
            timestamp: new Date().toISOString()
        }
    };
    const payloadString = JSON.stringify(enrichedPayload);
    // EC-P8-001: Check size before queueing
    const payloadSize = Buffer.byteLength(payloadString, 'utf8');
    if (payloadSize > MAX_PAYLOAD_SIZE) {
        throw new Error('Payload size exceeds 1MB limit');
    }
    return db_1.prisma.webhookEvent.create({
        data: {
            tenantId,
            endpointId,
            eventType,
            payload: payloadString,
            status: 'PENDING'
        }
    });
}
async function dispatchWebhookEvent(eventId) {
    const event = await db_1.prisma.webhookEvent.findUnique({
        where: { id: eventId },
        include: { endpoint: true }
    });
    if (!event || event.status !== 'PENDING')
        return;
    const payloadSize = Buffer.byteLength(event.payload, 'utf8');
    if (payloadSize > MAX_PAYLOAD_SIZE) {
        await db_1.prisma.webhookEvent.update({
            where: { id: event.id },
            data: { status: 'FAILED', responseBody: 'Payload size exceeded 1MB limit' }
        });
        return;
    }
    const signature = crypto_1.default.createHmac('sha256', event.endpoint.secret)
        .update(event.payload)
        .digest('hex');
    const controller = new AbortController();
    // EC-P5-001: 5 second timeout
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(event.endpoint.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-I-Wish-Signature': signature
            },
            body: event.payload,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            await db_1.prisma.webhookEvent.update({
                where: { id: event.id },
                data: {
                    status: 'SUCCESS',
                    responseStatusCode: response.status,
                    responseBody: 'OK'
                }
            });
        }
        else {
            // EC-P5-002: 429 Retry-After
            await handleFailure(event, response.status, response.headers.get('retry-after'));
        }
    }
    catch (err) {
        clearTimeout(timeoutId);
        await handleFailure(event, 0, null, err.name === 'AbortError' ? 'Timeout' : err.message);
    }
}
async function handleFailure(event, statusCode, retryAfterStr, errorMessage) {
    if (event.retryCount >= MAX_RETRIES) {
        await db_1.prisma.webhookEvent.update({
            where: { id: event.id },
            data: {
                status: 'FAILED',
                responseStatusCode: statusCode,
                responseBody: errorMessage || `Failed with status ${statusCode}`
            }
        });
        return;
    }
    let delayMs = Math.pow(2, event.retryCount) * 1000; // Exponential backoff
    if (statusCode === 429 && retryAfterStr) {
        const retryAfter = parseInt(retryAfterStr, 10);
        if (!isNaN(retryAfter)) {
            delayMs = retryAfter * 1000;
        }
        else {
            const date = new Date(retryAfterStr);
            if (!isNaN(date.getTime())) {
                delayMs = Math.max(0, date.getTime() - Date.now());
            }
        }
    }
    const nextRetryAt = new Date(Date.now() + delayMs);
    await db_1.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
            retryCount: event.retryCount + 1,
            nextRetryAt,
            responseStatusCode: statusCode,
            responseBody: errorMessage || `Failed with status ${statusCode}`
        }
    });
}
