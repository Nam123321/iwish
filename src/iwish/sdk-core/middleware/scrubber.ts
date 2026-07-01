export const SENSITIVE_FIELDS = ['password', 'apiKey', 'token', 'secret'];

/**
 * Scrubber utility to recursively remove or mask sensitive fields from objects.
 */
export function scrubSensitiveData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => scrubSensitiveData(item));
  }
  
  if (typeof data === 'object') {
    const scrubbed: any = {};
    for (const key of Object.keys(data)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (SENSITIVE_FIELDS.some(f => normalizedKey.includes(f.toLowerCase()))) {
        scrubbed[key] = '[REDACTED]';
      } else {
        scrubbed[key] = scrubSensitiveData(data[key]);
      }
    }
    return scrubbed;
  }
  
  return data;
}
