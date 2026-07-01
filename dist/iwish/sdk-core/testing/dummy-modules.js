"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DummyEventDispatcher = exports.DummyLogger = exports.DummyConfigLoader = void 0;
const config_loader_1 = require("../types/config-loader");
/**
 * Dummy ConfigLoader implementation for validation.
 */
class DummyConfigLoader {
    configs = {
        'API_KEY': '12345',
        'TIMEOUT': 5000,
    };
    getConfig(key, defaultValue) {
        if (this.hasConfig(key)) {
            return this.configs[key];
        }
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new config_loader_1.MissingConfigError(key);
    }
    hasConfig(key) {
        return key in this.configs;
    }
}
exports.DummyConfigLoader = DummyConfigLoader;
/**
 * Dummy Logger implementation for validation.
 */
class DummyLogger {
    info(message, payload) {
        console.log(`[INFO] ${message}`, this.maskSensitiveData(payload));
    }
    warn(message, payload) {
        console.warn(`[WARN] ${message}`, this.maskSensitiveData(payload));
    }
    error(message, error) {
        console.error(`[ERROR] ${message}`, this.maskSensitiveData(error));
    }
    debug(message, payload) {
        console.debug(`[DEBUG] ${message}`, this.maskSensitiveData(payload));
    }
    maskSensitiveData(payload) {
        if (!payload)
            return payload;
        if (typeof payload === 'object') {
            const sanitized = { ...payload };
            if (sanitized.password)
                sanitized.password = '***';
            if (sanitized.secret)
                sanitized.secret = '***';
            if (sanitized.token)
                sanitized.token = '***';
            return sanitized;
        }
        return payload;
    }
}
exports.DummyLogger = DummyLogger;
/**
 * Dummy EventDispatcher implementation for validation.
 */
class DummyEventDispatcher {
    listeners = new Map();
    errorHandler;
    setErrorHandler(errorHandler) {
        this.errorHandler = errorHandler;
    }
    on(eventName, listener) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(listener);
        // Return unsubscribe function
        return () => {
            this.off(eventName, listener);
        };
    }
    off(eventName, listener) {
        const set = this.listeners.get(eventName);
        if (set) {
            set.delete(listener);
        }
    }
    async dispatch(eventName, ...args) {
        const set = this.listeners.get(eventName);
        if (!set)
            return;
        const listenersArray = Array.from(set);
        for (const listener of listenersArray) {
            try {
                await listener(...args);
            }
            catch (err) {
                if (this.errorHandler) {
                    this.errorHandler(err, eventName);
                }
                else {
                    console.error(`Unhandled exception in listener for event ${eventName}`, err);
                }
            }
        }
    }
}
exports.DummyEventDispatcher = DummyEventDispatcher;
