import { prisma } from '../db';
import crypto from 'crypto';

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function createApiKey(tenantId: string, name: string) {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const plainKey = `sk_live_${randomBytes}`;
  const keyPrefix = plainKey.substring(0, 12);
  const keyHash = hashKey(plainKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId,
      name,
      keyHash,
      keyPrefix
    }
  });

  return { apiKey, plainKey };
}

export async function validateApiKey(plainKey: string) {
  const keyHash = hashKey(plainKey);
  
  const apiKey = await prisma.apiKey.findFirst({
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

  const isValid = crypto.timingSafeEqual(dbHashBuffer, computedHashBuffer);
  
  if (!isValid) return null;

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null;
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() }
  });

  return apiKey.tenantId;
}
