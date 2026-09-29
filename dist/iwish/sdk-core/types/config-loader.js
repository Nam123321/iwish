"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingConfigError = void 0;
class MissingConfigError extends Error {
    constructor(key) {
        super(`Configuration key missing: ${key}`);
        this.name = 'MissingConfigError';
    }
}
exports.MissingConfigError = MissingConfigError;
