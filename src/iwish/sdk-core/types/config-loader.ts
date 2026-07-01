export class MissingConfigError extends Error {
  constructor(key: string) {
    super(`Configuration key missing: ${key}`);
    this.name = 'MissingConfigError';
  }
}

export interface IConfigLoader {
  /**
   * Retrieves a configuration value by key.
   * Edge Case P1, P4: Enforces Generics to maintain type integrity.
   * Throws `MissingConfigError` if the key is not found and no defaultValue is provided.
   * 
   * @param key The configuration key.
   * @param defaultValue Optional fallback value.
   * @returns The configuration value.
   */
  getConfig<T>(key: string, defaultValue?: T): T;

  /**
   * Evaluates if a key exists in the configuration.
   * @param key The configuration key.
   * @returns True if it exists.
   */
  hasConfig(key: string): boolean;
}
