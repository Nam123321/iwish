import { IConfigLoader, MissingConfigError } from '../types/config-loader';
import { ILogger } from '../types/logger';
import { IEventDispatcher } from '../types/event-dispatcher';

export class DummyConfigLoader implements IConfigLoader {
  // Use Object.create(null) to prevent prototype lookups
  private configs: Record<string, any> = Object.assign(Object.create(null), { 'API_KEY': '12345', 'TIMEOUT': 5000 });
  
  public getConfig<T>(key: string, defaultValue?: T): T {
    if (this.hasConfig(key)) return this.configs[key] as T;
    if (defaultValue !== undefined) return defaultValue;
    throw new MissingConfigError(key);
  }
  
  public hasConfig(key: string): boolean { 
    return Object.prototype.hasOwnProperty.call(this.configs, key); 
  }
}

export class DummyLogger implements ILogger {
  public info(message: string, payload?: any): void { console.log(`[INFO] ${message}`, this.maskSensitiveData(payload)); }
  public warn(message: string, payload?: any): void { console.warn(`[WARN] ${message}`, this.maskSensitiveData(payload)); }
  public error(message: string, error?: any): void { console.error(`[ERROR] ${message}`, this.maskSensitiveData(error)); }
  public debug(message: string, payload?: any): void { console.debug(`[DEBUG] ${message}`, this.maskSensitiveData(payload)); }
  
  public maskSensitiveData(payload: any, depth = 0): any {
    // Prevent deep recursion / cyclic references
    if (depth > 5 || !payload || typeof payload !== 'object') return payload;
    
    // Preserve Arrays
    if (Array.isArray(payload)) {
      return payload.map(item => this.maskSensitiveData(item, depth + 1));
    }
    
    const sanitized: Record<string, any> = {};
    const sensitiveKeys = new Set(['password', 'secret', 'token', 'authorization']);
    
    for (const key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        if (sensitiveKeys.has(key.toLowerCase())) {
          sanitized[key] = '***';
        } else {
          sanitized[key] = this.maskSensitiveData(payload[key], depth + 1);
        }
      }
    }
    return sanitized;
  }
}

export class DummyEventDispatcher implements IEventDispatcher {
  private listeners: Map<string, Set<Function>> = new Map();
  private errorHandler?: (error: any, eventName: string) => void;
  
  public setErrorHandler(errorHandler: (error: any, eventName: string) => void): void { 
    this.errorHandler = errorHandler; 
  }
  
  public on(eventName: string, listener: (...args: any[]) => void | Promise<void>): () => void {
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
    this.listeners.get(eventName)!.add(listener);
    return () => { this.off(eventName, listener); };
  }
  
  public off(eventName: string, listener: (...args: any[]) => void | Promise<void>): void {
    const set = this.listeners.get(eventName);
    if (set) set.delete(listener);
  }
  
  public async dispatch(eventName: string, ...args: any[]): Promise<void> {
    const set = this.listeners.get(eventName);
    if (!set) return;
    
    const listenersArray = Array.from(set);
    
    // Execute listeners concurrently
    await Promise.allSettled(listenersArray.map(async (listener) => {
      try {
        await listener(...args);
      } catch (err) {
        if (this.errorHandler) {
          try {
            this.errorHandler(err, eventName);
          } catch (handlerErr) {
            console.error(`Error in errorHandler for event ${eventName}`, handlerErr);
          }
        } else {
          console.error(`Unhandled exception in listener for event ${eventName}`, err);
        }
      }
    }));
  }
}
