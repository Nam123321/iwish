export interface IEventDispatcher {
  /**
   * Edge Case P2: Registers a global error handler to prevent unhandled exceptions 
   * in listeners from crashing the application thread.
   * 
   * @param errorHandler A function that will catch exceptions thrown by listeners.
   */
  setErrorHandler(errorHandler: (error: any, eventName: string) => void): void;

  /**
   * Subscribes to an event.
   * Edge Case P7: Mandates a cleanup mechanism (unsubscribe) to prevent zombie listeners and memory leaks.
   * 
   * @param eventName The event to listen for.
   * @param listener The callback function.
   * @returns An unsubscribe function to cleanly detach the listener.
   */
  on(eventName: string, listener: (...args: any[]) => void | Promise<void>): () => void;

  /**
   * Explicitly removes a listener from an event.
   * 
   * @param eventName The event.
   * @param listener The original callback function to remove.
   */
  off(eventName: string, listener: (...args: any[]) => void | Promise<void>): void;

  /**
   * Dispatches an event to all registered listeners.
   * If a listener throws an error, it must be delegated to the global error handler (if set).
   * 
   * @param eventName The event to trigger.
   * @param args The payload arguments for the listeners.
   */
  dispatch(eventName: string, ...args: any[]): void | Promise<void>;
}
