import { describe, it, expect, beforeEach } from 'vitest';
import { isSafeUrl, registerWebhookEndpoint, queueWebhookEvent } from './webhookDispatcher';
import { prisma } from '../db';

describe('Webhook Dispatcher', () => {
  let tenantId: string;

  beforeEach(async () => {
    const tenant = await prisma.tenant.create({ data: {} });
    tenantId = tenant.id;
  });

  it('should reject internal URLs (SSRF Protection)', async () => {
    expect(await isSafeUrl('http://127.0.0.1/webhook')).toBe(false);
    expect(await isSafeUrl('http://localhost:3000')).toBe(false);
    expect(await isSafeUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(await isSafeUrl('http://10.0.0.1')).toBe(false);
    // Might resolve, so assuming google is safe
    expect(await isSafeUrl('https://google.com')).toBe(true);
  });

  it('should queue a webhook event successfully', async () => {
    const endpoint = await registerWebhookEndpoint(tenantId, 'https://example.com/hook', 'secret123');
    
    const event = await queueWebhookEvent(tenantId, endpoint.id, 'user.created', { userId: 1 });
    
    expect(event.status).toBe('PENDING');
    const parsedPayload = JSON.parse(event.payload);
    expect(parsedPayload._meta.timestamp).toBeDefined(); // EC-P3-001
  });

  it('should reject payload exceeding 1MB limit', async () => {
    const endpoint = await registerWebhookEndpoint(tenantId, 'https://example.com/hook', 'secret123');
    const hugePayload = { data: 'a'.repeat(1024 * 1024 + 10) }; // > 1MB
    
    await expect(queueWebhookEvent(tenantId, endpoint.id, 'large.event', hugePayload)).rejects.toThrow('Payload size exceeds 1MB limit');
  });
});
