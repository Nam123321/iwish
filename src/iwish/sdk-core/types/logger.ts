export interface ILogger {
  /**
   * Logs an informational message.
   * @param message The message string.
   * @param payload Optional contextual data.
   */
  info(message: string, payload?: any): void;

  /**
   * Logs a warning message.
   * @param message The message string.
   * @param payload Optional contextual data.
   */
  warn(message: string, payload?: any): void;

  /**
   * Logs an error message.
   * @param message The message string.
   * @param error Optional Error object or payload.
   */
  error(message: string, error?: any): void;

  /**
   * Logs a debug message.
   * @param message The message string.
   * @param payload Optional contextual data.
   */
  debug(message: string, payload?: any): void;

  /**
   * Edge Case P6: Ensures sensitive data is masked before logging.
   * Any implementation of ILogger MUST use this to scrub payloads 
   * containing PII, API Keys, or secure tokens.
   * 
   * @param payload The raw payload to sanitize.
   * @returns The sanitized payload safe for logging.
   */
  maskSensitiveData(payload: any): any;
}
