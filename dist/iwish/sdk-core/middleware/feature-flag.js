"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFeatureFlagMiddleware = void 0;
const createFeatureFlagMiddleware = (options) => {
    return async (req, res, next) => {
        try {
            let requiredFlagId = null;
            for (const [routePrefix, flagId] of Object.entries(options.flagMapping)) {
                if (req.path.startsWith(routePrefix)) {
                    requiredFlagId = flagId;
                    break;
                }
            }
            if (requiredFlagId) {
                const flag = await options.store.getFlag(requiredFlagId);
                if (!flag || !flag.isEnabled) {
                    if (options.logger)
                        options.logger.warn(`Feature disabled or missing: ${requiredFlagId} for path ${req.path}`);
                    return res.status(404).json({ error: 'Feature is currently disabled' });
                }
            }
            next();
        }
        catch (err) {
            if (options.logger)
                options.logger.error('Feature flag middleware error', err);
            next(err);
        }
    };
};
exports.createFeatureFlagMiddleware = createFeatureFlagMiddleware;
