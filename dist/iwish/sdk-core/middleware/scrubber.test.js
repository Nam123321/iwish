"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const scrubber_1 = require("./scrubber");
(0, vitest_1.describe)('Scrubber Utility', () => {
    (0, vitest_1.it)('should scrub passwords and tokens', () => {
        const input = {
            username: 'john_doe',
            password: 'super-secret-password',
            profile: {
                api_key: 'sk-12345',
                refreshToken: 'rt-999',
                bio: 'Hello world'
            }
        };
        const output = (0, scrubber_1.scrubSensitiveData)(input);
        (0, vitest_1.expect)(output.username).toBe('john_doe');
        (0, vitest_1.expect)(output.password).toBe('[REDACTED]');
        (0, vitest_1.expect)(output.profile.api_key).toBe('[REDACTED]');
        (0, vitest_1.expect)(output.profile.refreshToken).toBe('[REDACTED]');
        (0, vitest_1.expect)(output.profile.bio).toBe('Hello world');
    });
    (0, vitest_1.it)('should handle arrays', () => {
        const input = [
            { id: 1, secret: 'hidden' },
            { id: 2, name: 'public' }
        ];
        const output = (0, scrubber_1.scrubSensitiveData)(input);
        (0, vitest_1.expect)(output[0].secret).toBe('[REDACTED]');
        (0, vitest_1.expect)(output[1].name).toBe('public');
    });
    (0, vitest_1.it)('should handle null or undefined', () => {
        (0, vitest_1.expect)((0, scrubber_1.scrubSensitiveData)(null)).toBeNull();
        (0, vitest_1.expect)((0, scrubber_1.scrubSensitiveData)(undefined)).toBeUndefined();
    });
});
