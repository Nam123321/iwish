import { Prisma } from '@prisma/client';
import { scrubSensitiveData } from './scrubber';
import { IEventDispatcher } from '../types/event-dispatcher';
import { transactionContext } from './transaction-manager';

export interface AuditContext {
  actorId?: string;
  ip?: string;
  userAgent?: string;
  // Any other context
  [key: string]: any;
}

export const createAuditExtension = (
  eventDispatcher: IEventDispatcher,
  getContext: () => AuditContext
) => {
  return Prisma.defineExtension((baseClient) => {
    return baseClient.$extends({
      name: 'audit-log',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (model === 'AuditLog') return query(args);

            const isMutation = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany', 'upsert'].includes(operation);
            if (!isMutation) return query(args);

            const ctx = getContext() || {};
            const actorId = ctx.actorId || 'SYSTEM';
            const result = await query(args);

            const changes = {
              args: scrubSensitiveData(args),
              result: scrubSensitiveData(result),
            };

            // 1. Retrieve active transaction context via ALS
            const txCtx = transactionContext.getStore();
            const clientToUse = txCtx?.txClient || baseClient;

            // 2. Execute using the correct client (ensures AuditLog is written inside the transaction)
            const auditLog = await (clientToUse as any).auditLog.create({
              data: {
                entityType: model,
                entityId: (result as any)?.id ? String((result as any).id) : 'UNKNOWN',
                action: operation.toUpperCase(),
                actorId: actorId,
                actorContext: JSON.stringify(ctx),
                newData: JSON.stringify(changes),
                previousData: null,
              }
            });

            const eventPayload = {
              eventId: auditLog.id,
              timestamp: auditLog.createdAt.toISOString(),
              entityType: model,
              entityId: auditLog.entityId,
              action: operation.toUpperCase(),
              actor: { actorId, isSystem: actorId === 'SYSTEM' },
              context: ctx,
              changes: changes,
            };

            // 3. Defer or Dispatch
            if (txCtx) {
              txCtx.events.push(eventPayload); // Queue for Outbox
            } else {
              eventDispatcher.dispatch('telemetry.audit.log', eventPayload);
            }

            return result;
          }
        }
      }
    });
  });
};
