"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DummyEventDispatcher = exports.DummyLogger = exports.DummyConfigLoader = void 0;
const config_loader_1 = require("../types/config-loader");
class DummyConfigLoader {
    // Use Object.create(null) to prevent prototype lookups
    configs = Object.assign(Object.create(null), { 'API_KEY': '12345', 'TIMEOUT': 5000 });
    getConfig(key, defaultValue) {
        if (this.hasConfig(key))
            return this.configs[key];
        if (defaultValue !== undefined)
            return defaultValue;
        throw new config_loader_1.MissingConfigError(key);
    }
    hasConfig(key) {
        return Object.prototype.hasOwnProperty.call(this.configs, key);
    }
}
exports.DummyConfigLoader = DummyConfigLoader;
class DummyLogger {
    info(message, payload) { console.log(`[INFO] ${message}`, this.maskSensitiveData(payload)); }
    warn(message, payload) { console.warn(`[WARN] ${message}`, this.maskSensitiveData(payload)); }
    error(message, error) { console.error(`[ERROR] ${message}`, this.maskSensitiveData(error)); }
    debug(message, payload) { console.debug(`[DEBUG] ${message}`, this.maskSensitiveData(payload)); }
    maskSensitiveData(payload, depth = 0) {
        // Prevent deep recursion / cyclic references
        if (depth > 5 || !payload || typeof payload !== 'object')
            return payload;
        // Preserve Arrays
        if (Array.isArray(payload)) {
            return payload.map(item => this.maskSensitiveData(item, depth + 1));
        }
        const sanitized = {};
        const sensitiveKeys = new Set(['password', 'secret', 'token', 'authorization']);
        for (const key in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, key)) {
                if (sensitiveKeys.has(key.toLowerCase())) {
                    sanitized[key] = '***';
                }
                else {
                    sanitized[key] = this.maskSensitiveData(payload[key], depth + 1);
                }
            }
        }
        return sanitized;
    }
}
exports.DummyLogger = DummyLogger;
class DummyEventDispatcher {
    listeners = new Map();
    errorHandler;
    setErrorHandler(errorHandler) {
        this.errorHandler = errorHandler;
    }
    on(eventName, listener) {
        if (!this.listeners.has(eventName))
            this.listeners.set(eventName, new Set());
        this.listeners.get(eventName).add(listener);
        return () => { this.off(eventName, listener); };
    }
    off(eventName, listener) {
        const set = this.listeners.get(eventName);
        if (set)
            set.delete(listener);
    }
    async dispatch(eventName, ...args) {
        const set = this.listeners.get(eventName);
        if (!set)
            return;
        const listenersArray = Array.from(set);
        // Execute listeners concurrently
        await Promise.allSettled(listenersArray.map(async (listener) => {
            try {
                await listener(...args);
            }
            catch (err) {
                if (this.errorHandler) {
                    try {
                        this.errorHandler(err, eventName);
                    }
                    catch (handlerErr) {
                        console.error(`Error in errorHandler for event ${eventName}`, handlerErr);
                    }
                }
                else {
                    console.error(`Unhandled exception in listener for event ${eventName}`, err);
                }
            }
        }));
    }
}
exports.DummyEventDispatcher = DummyEventDispatcher;
