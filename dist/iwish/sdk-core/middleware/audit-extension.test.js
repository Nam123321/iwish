"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const audit_extension_1 = require("./audit-extension");
const transaction_manager_1 = require("./transaction-manager");
vitest_1.vi.mock('@prisma/client', () => {
    return {
        Prisma: {
            defineExtension: (cb) => cb
        }
    };
});
(0, vitest_1.describe)('Audit Extension', () => {
    let mockEventDispatcher;
    let mockGetContext;
    (0, vitest_1.beforeEach)(() => {
        mockEventDispatcher = {
            setErrorHandler: vitest_1.vi.fn(),
            on: vitest_1.vi.fn(),
            off: vitest_1.vi.fn(),
            dispatch: vitest_1.vi.fn(),
        };
        mockGetContext = vitest_1.vi.fn().mockReturnValue({ actorId: 'user-123', ip: '127.0.0.1' });
    });
    (0, vitest_1.it)('should ignore AuditLog mutations', async () => {
        const extension = (0, audit_extension_1.createAuditExtension)(mockEventDispatcher, mockGetContext);
        // Using a mock Prisma client
        const client = {
            $extends: vitest_1.vi.fn().mockImplementation((ext) => ext),
        };
        const configuredExt = extension(client);
        const mockQuery = vitest_1.vi.fn().mockResolvedValue({ id: 'audit-1' });
        await configuredExt.query.$allModels.$allOperations({
            model: 'AuditLog',
            operation: 'create',
            args: {},
            query: mockQuery
        });
        (0, vitest_1.expect)(mockQuery).toHaveBeenCalled();
        (0, vitest_1.expect)(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should scrub sensitive data and emit telemetry for normal models', async () => {
        const extension = (0, audit_extension_1.createAuditExtension)(mockEventDispatcher, mockGetContext);
        let createdAuditLogData;
        const mockAuditLogCreate = vitest_1.vi.fn().mockImplementation((args) => {
            createdAuditLogData = args.data;
            return Promise.resolve({
                id: 'new-audit-id',
                createdAt: new Date('2026-07-01T10:00:00Z'),
                entityId: args.data.entityId
            });
        });
        const mockClient = {
            $extends: vitest_1.vi.fn().mockImplementation((ext) => ext),
            auditLog: {
                create: mockAuditLogCreate
            }
        };
        const configuredExt = extension(mockClient);
        const mockQuery = vitest_1.vi.fn().mockResolvedValue({ id: 'tenant-1', name: 'My Tenant' });
        await configuredExt.query.$allModels.$allOperations({
            model: 'Tenant',
            operation: 'create',
            args: {
                data: { name: 'My Tenant', password: 'super-secret' }
            },
            query: mockQuery
        });
        (0, vitest_1.expect)(mockQuery).toHaveBeenCalled();
        (0, vitest_1.expect)(mockAuditLogCreate).toHaveBeenCalled();
        // Verify scrubbing
        const newData = JSON.parse(createdAuditLogData.newData);
        (0, vitest_1.expect)(newData.args.data.password).toBe('[REDACTED]');
        // Verify event dispatch
        (0, vitest_1.expect)(mockEventDispatcher.dispatch).toHaveBeenCalledWith('telemetry.audit.log', vitest_1.expect.objectContaining({
            eventId: 'new-audit-id',
            entityType: 'Tenant',
            entityId: 'tenant-1',
            action: 'CREATE',
            actor: { actorId: 'user-123', isSystem: false }
        }));
    });
    (0, vitest_1.it)('should default to SYSTEM actor if no context provided', async () => {
        mockGetContext.mockReturnValue(null);
        const extension = (0, audit_extension_1.createAuditExtension)(mockEventDispatcher, mockGetContext);
        const mockAuditLogCreate = vitest_1.vi.fn().mockResolvedValue({
            id: 'new-audit-id',
            createdAt: new Date(),
            entityId: 'tenant-1'
        });
        const mockClient = {
            $extends: vitest_1.vi.fn().mockImplementation((ext) => ext),
            auditLog: { create: mockAuditLogCreate }
        };
        const configuredExt = extension(mockClient);
        const mockQuery = vitest_1.vi.fn().mockResolvedValue({ id: 'tenant-1' });
        await configuredExt.query.$allModels.$allOperations({
            model: 'Tenant',
            operation: 'update',
            args: {},
            query: mockQuery
        });
        (0, vitest_1.expect)(mockEventDispatcher.dispatch).toHaveBeenCalledWith('telemetry.audit.log', vitest_1.expect.objectContaining({
            actor: { actorId: 'SYSTEM', isSystem: true }
        }));
    });
    (0, vitest_1.it)('AC5: should not emit telemetry if running inside a managed transaction that rolls back', async () => {
        const extension = (0, audit_extension_1.createAuditExtension)(mockEventDispatcher, mockGetContext);
        const mockTxClient = {
            $extends: vitest_1.vi.fn().mockImplementation((ext) => ext),
            auditLog: { create: vitest_1.vi.fn().mockResolvedValue({ id: 'audit-tx', createdAt: new Date(), entityId: 'e-1' }) }
        };
        const configuredExt = extension(mockTxClient);
        const mockQuery = vitest_1.vi.fn().mockResolvedValue({ id: 'tenant-1' });
        const events = [];
        await transaction_manager_1.transactionContext.run({ txClient: mockTxClient, events }, async () => {
            // The mutation is executed inside the context
            await configuredExt.query.$allModels.$allOperations({
                model: 'Tenant',
                operation: 'update',
                args: {},
                query: mockQuery
            });
            // The event should NOT have been dispatched yet, but rather queued
            (0, vitest_1.expect)(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
            // Assume a rollback occurs - the transactionContext is exited
            // The outer code (TransactionManager) will just discard `events` array
        });
        // Events were queued
        (0, vitest_1.expect)(events.length).toBe(1);
        (0, vitest_1.expect)(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('AC5: should emit telemetry via TransactionManager when transaction commits successfully', async () => {
        const { TransactionManager } = await Promise.resolve().then(() => __importStar(require('./transaction-manager')));
        const mockPrisma = {
            $transaction: vitest_1.vi.fn().mockImplementation(async (cb) => {
                const txClient = { isTxClient: true };
                const result = await cb(txClient);
                return result;
            })
        };
        await TransactionManager.execute(mockPrisma, mockEventDispatcher, async (tx) => {
            // Simulate what the extension does inside the transaction by pushing to context
            const txCtx = transaction_manager_1.transactionContext.getStore();
            txCtx?.events.push({ eventId: 'mock-event' });
            return { success: true };
        });
        // Dispatch happens after DB commit
        (0, vitest_1.expect)(mockEventDispatcher.dispatch).toHaveBeenCalledWith('telemetry.audit.log', { eventId: 'mock-event' });
    });
});
