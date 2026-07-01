"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const audit_extension_1 = require("./audit-extension");
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
});
