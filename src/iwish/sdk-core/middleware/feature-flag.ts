import { IMiddleware } from '../types/middleware';
import { IFeatureFlagStore } from '../types/security';
import { ILogger } from '../types/logger';

export interface FeatureFlagOptions {
  store: IFeatureFlagStore;
  logger?: ILogger;
  flagMapping: Record<string, string>; // e.g. { '/api/v2/new-feature': 'flag_v2_features' }
}

export const createFeatureFlagMiddleware = (options: FeatureFlagOptions): IMiddleware => {
  return async (req, res, next) => {
    try {
      let requiredFlagId: string | null = null;
      for (const [routePrefix, flagId] of Object.entries(options.flagMapping)) {
        if (req.path.startsWith(routePrefix)) {
          requiredFlagId = flagId;
          break;
        }
      }

      if (requiredFlagId) {
        const flag = await options.store.getFlag(requiredFlagId);
        if (!flag || !flag.isEnabled) {
          if (options.logger) options.logger.warn(`Feature disabled or missing: ${requiredFlagId} for path ${req.path}`);
          return res.status(404).json({ error: 'Feature is currently disabled' });
        }
      }

      next();
    } catch (err) {
      if (options.logger) options.logger.error('Feature flag middleware error', err as Error);
      next(err);
    }
  };
};
