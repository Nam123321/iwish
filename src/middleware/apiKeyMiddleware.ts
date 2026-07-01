import { validateApiKey } from '../api-keys/apiKeyManager';
import { createClient } from 'redis';

export const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(() => {}); // Non-blocking connect

export async function apiKeyMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid API key' });
  }

  const plainKey = authHeader.split(' ')[1];
  const tenantId = await validateApiKey(plainKey);

  if (!tenantId) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Rate Limiting
  const rateLimitKey = `ratelimit:tenant:${tenantId}:api`;
  const limit = 100; 
  
  try {
    const current = await redisClient.incr(rateLimitKey);
    if (current === 1) {
      await redisClient.expire(rateLimitKey, 60);
    }
    
    if (current > limit) {
      return res.status(429).json({ error: 'Too Many Requests' });
    }
  } catch (err) {
    // Fail open if Redis is down
  }

  // Inject context
  req.tenantId = tenantId;
  next();
}
