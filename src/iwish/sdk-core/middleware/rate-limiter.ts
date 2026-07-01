import { IMiddleware, IHttpRequest } from '../types/middleware';
import { IRateLimitStore, ISecurityBlocklistStore } from '../types/security';
import { ILogger } from '../types/logger';

export interface RateLimiterOptions {
  store: IRateLimitStore;
  blocklistStore?: ISecurityBlocklistStore;
  logger?: ILogger;
  trustProxy?: boolean;
  trustedProxies?: string[]; // IPs or CIDRs of trusted proxies
  defaultLimit?: number;
  webhookLimit?: number;
  windowMs?: number;
}

function getClientIp(req: IHttpRequest, options: RateLimiterOptions): string {
  const xForwardedFor = req.header('x-forwarded-for');
  if (options.trustProxy && xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    if (options.trustedProxies && options.trustedProxies.length > 0) {
      for (let i = ips.length - 1; i >= 0; i--) {
        if (!options.trustedProxies.includes(ips[i])) {
          return ips[i];
        }
      }
    }
    // Fallback if no trusted proxies defined, trust the rightmost proxy
    return ips[ips.length - 1];
  }
  return req.ip || '0.0.0.0';
}

export const createRateLimiterMiddleware = (options: RateLimiterOptions): IMiddleware => {
  const windowMs = options.windowMs || 60000;
  const defaultLimit = options.defaultLimit || 100;
  const webhookLimit = options.webhookLimit || 1000;

  return async (req, res, next) => {
    try {
      const clientIp = getClientIp(req, options);

      if (options.blocklistStore) {
        const isBlocked = await options.blocklistStore.isBlocked(clientIp);
        if (isBlocked) {
          if (options.logger) options.logger.warn(`Blocked IP attempted access: ${clientIp}`);
          return res.status(403).json({ error: 'Forbidden: IP is blocked' });
        }
      }

      // Determine limit and key prefix based on path (EC-P8-01: webhooks bypass/higher limit)
      const isWebhook = req.path.startsWith('/api/webhooks/');
      const limit = isWebhook ? webhookLimit : defaultLimit;
      const prefix = isWebhook ? 'rate_limit:webhook:' : 'rate_limit:api:';
      const key = `${prefix}${clientIp}`;

      const limitStatus = await options.store.incrementAndGet(key, windowMs);

      if (limitStatus.requestCount > limit) {
        if (options.logger) options.logger.warn(`Rate limit exceeded for IP: ${clientIp} on path ${req.path}`);
        return res.status(429).json({ error: 'Too Many Requests' });
      }

      next();
    } catch (err) {
      if (options.logger) options.logger.error('Rate limiter error', err as Error);
      next(err);
    }
  };
};
