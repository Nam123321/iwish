# Core SaaS SDK Boilerplates - Usage Guide

This document explains how to use the Core SaaS SDK Boilerplates, introduced in Epic 22 (Story 22.2). These boilerplates provide standard interfaces for logging, event dispatching, and configuration management across the SaaS application.

## 1. IConfigLoader

The `IConfigLoader` ensures that all configuration values are retrieved safely with strict typing and fallback mechanisms.

### Key Features
- **Generics Support:** Casts the output type automatically (`getConfig<T>`).
- **Strict Error Handling:** Throws a `MissingConfigError` if a key is missing and no default value is provided.

### Example
```typescript
import { IConfigLoader, MissingConfigError } from '../src/iwish/sdk-core';

class MyService {
  constructor(private config: IConfigLoader) {}

  public connect(): void {
    // Will throw MissingConfigError if DB_HOST is missing
    const dbHost = this.config.getConfig<string>('DB_HOST');
    
    // Will safely fallback to 5000 if not found
    const timeout = this.config.getConfig<number>('TIMEOUT', 5000);
  }
}
```

## 2. ILogger

The `ILogger` standardizes logging levels and enforces a critical security requirement: payload sanitization.

### Key Features
- **Mandatory Sanitization:** The `maskSensitiveData` method must be implemented to scrub PII (Personal Identifiable Information) and secrets (API keys, passwords).

### Example
```typescript
import { ILogger } from '../src/iwish/sdk-core';

class AppLogger implements ILogger {
  public info(message: string, payload?: any): void {
    console.log(`[INFO] ${message}`, this.maskSensitiveData(payload));
  }
  
  // Implements Edge Case P6 mitigation
  public maskSensitiveData(payload: any): any {
    const safePayload = { ...payload };
    if (safePayload.password) safePayload.password = '***';
    return safePayload;
  }
  
  // ... other methods
}
```

## 3. IEventDispatcher

The `IEventDispatcher` prevents common event-driven architecture pitfalls such as zombie listeners (memory leaks) and unhandled exceptions.

### Key Features
- **Global Error Handler:** Isolates listener errors from crashing the main application thread.
- **Auto-Cleanup:** The `on` method returns an `unsubscribe` function to easily detach listeners.

### Example
```typescript
import { IEventDispatcher } from '../src/iwish/sdk-core';

class FeatureController {
  private unsubscribe: () => void;

  constructor(private dispatcher: IEventDispatcher) {
    // Set global error handler
    this.dispatcher.setErrorHandler((err, eventName) => {
      console.error(`Listener failed on ${eventName}:`, err);
    });
  }

  public init(): void {
    this.unsubscribe = this.dispatcher.on('USER_CREATED', async (user) => {
      // Async logic
    });
  }

  public destroy(): void {
    // Clean up memory to prevent leaks
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```
