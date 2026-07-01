import { describe, it, expect, beforeEach } from 'vitest';
import { createApiKey, validateApiKey } from './apiKeyManager';
import { prisma } from '../db';

describe('API Key Manager', () => {
  let tenantId: string;

  beforeEach(async () => {
    const tenant = await prisma.tenant.create({ data: {} });
    tenantId = tenant.id;
  });

  it('should create an API key and hash it', async () => {
    const { apiKey, plainKey } = await createApiKey(tenantId, 'Test Key');
    expect(apiKey.keyPrefix).toBe(plainKey.substring(0, 12));
    expect(apiKey.keyHash).not.toBe(plainKey);
  });

  it('should validate a valid API key', async () => {
    const { plainKey } = await createApiKey(tenantId, 'Valid Key');
    const validatedTenantId = await validateApiKey(plainKey);
    expect(validatedTenantId).toBe(tenantId);
  });

  it('should reject an invalid API key', async () => {
    const validatedTenantId = await validateApiKey('sk_live_invalid1234567890');
    expect(validatedTenantId).toBeNull();
  });
});
