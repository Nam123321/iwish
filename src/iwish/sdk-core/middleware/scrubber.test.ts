import { describe, it, expect } from 'vitest';
import { scrubSensitiveData } from './scrubber';

describe('Scrubber Utility', () => {
  it('should scrub passwords and tokens', () => {
    const input = {
      username: 'john_doe',
      password: 'super-secret-password',
      profile: {
        api_key: 'sk-12345',
        refreshToken: 'rt-999',
        bio: 'Hello world'
      }
    };

    const output = scrubSensitiveData(input);
    
    expect(output.username).toBe('john_doe');
    expect(output.password).toBe('[REDACTED]');
    expect(output.profile.api_key).toBe('[REDACTED]');
    expect(output.profile.refreshToken).toBe('[REDACTED]');
    expect(output.profile.bio).toBe('Hello world');
  });

  it('should handle arrays', () => {
    const input = [
      { id: 1, secret: 'hidden' },
      { id: 2, name: 'public' }
    ];

    const output = scrubSensitiveData(input);
    expect(output[0].secret).toBe('[REDACTED]');
    expect(output[1].name).toBe('public');
  });

  it('should handle null or undefined', () => {
    expect(scrubSensitiveData(null)).toBeNull();
    expect(scrubSensitiveData(undefined)).toBeUndefined();
  });
});
