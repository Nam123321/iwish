import { PrismaClient } from '@prisma/client';
import { IEventDispatcher } from '../types/event-dispatcher';
import { AsyncLocalStorage } from 'async_hooks';

export interface TransactionContext {
  txClient: any;
  events: any[];
}

export const transactionContext = new AsyncLocalStorage<TransactionContext>();

export class TransactionManager {
  static async execute<T>(
    prisma: PrismaClient | any,
    dispatcher: IEventDispatcher,
    fn: (tx: any) => Promise<T>
  ): Promise<T> {
    let committedEvents: any[] = [];
    
    // 1. Execute transaction and collect events safely inside ALS
    const result = await prisma.$transaction(async (tx: any) => {
      const events: any[] = []; // Fresh array per retry/attempt to avoid duplicate events
      return await transactionContext.run({ txClient: tx, events }, async () => {
        const res = await fn(tx);
        committedEvents = events; // Only save to outer scope if fn(tx) completes successfully
        return res;
      });
    });

    // 2. Dispatch events ONLY after the DB COMMIT succeeds
    for (const ev of committedEvents) {
      try {
        dispatcher.dispatch('telemetry.audit.log', ev);
      } catch (err) {
        console.error('Failed to dispatch telemetry event', err);
      }
    }
    
    return result;
  }
}
