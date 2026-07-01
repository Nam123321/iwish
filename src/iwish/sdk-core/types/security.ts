export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimitCache {
  key: string;
  requestCount: number;
  resetTime: Date;
}

export interface SecurityBlocklist {
  id: string;
  ipAddress: string;
  reason: string;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface IFeatureFlagStore {
  getFlag(id: string): Promise<FeatureFlag | null>;
  getAllFlags(): Promise<FeatureFlag[]>;
}

export interface IRateLimitStore {
  incrementAndGet(key: string, windowMs: number): Promise<RateLimitCache>;
}

export interface ISecurityBlocklistStore {
  isBlocked(ip: string): Promise<boolean>;
}
