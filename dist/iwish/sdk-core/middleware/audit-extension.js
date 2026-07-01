"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditExtension = void 0;
const client_1 = require("@prisma/client");
const scrubber_1 = require("./scrubber");
const transaction_manager_1 = require("./transaction-manager");
const createAuditExtension = (eventDispatcher, getContext) => {
    return client_1.Prisma.defineExtension((baseClient) => {
        return baseClient.$extends({
            name: 'audit-log',
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        if (model === 'AuditLog')
                            return query(args);
                        const isMutation = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany', 'upsert'].includes(operation);
                        if (!isMutation)
                            return query(args);
                        const ctx = getContext() || {};
                        const actorId = ctx.actorId || 'SYSTEM';
                        const result = await query(args);
                        const changes = {
                            args: (0, scrubber_1.scrubSensitiveData)(args),
                            result: (0, scrubber_1.scrubSensitiveData)(result),
                        };
                        // 1. Retrieve active transaction context via ALS
                        const txCtx = transaction_manager_1.transactionContext.getStore();
                        const clientToUse = txCtx?.txClient || baseClient;
                        // 2. Execute using the correct client (ensures AuditLog is written inside the transaction)
                        const auditLog = await clientToUse.auditLog.create({
                            data: {
                                entityType: model,
                                entityId: result?.id ? String(result.id) : 'UNKNOWN',
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
                        }
                        else {
                            eventDispatcher.dispatch('telemetry.audit.log', eventPayload);
                        }
                        return result;
                    }
                }
            }
        });
    });
};
exports.createAuditExtension = createAuditExtension;
