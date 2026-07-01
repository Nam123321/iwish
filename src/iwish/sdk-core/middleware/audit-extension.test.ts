import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuditExtension } from './audit-extension';
import { IEventDispatcher } from '../types/event-dispatcher';
import { transactionContext } from './transaction-manager';

vi.mock('@prisma/client', () => {
  return {
    Prisma: {
      defineExtension: (cb: any) => cb
    }
  };
});

describe('Audit Extension', () => {
  let mockEventDispatcher: IEventDispatcher;
  let mockGetContext: any;

  beforeEach(() => {
    mockEventDispatcher = {
      setErrorHandler: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      dispatch: vi.fn(),
    };
    mockGetContext = vi.fn().mockReturnValue({ actorId: 'user-123', ip: '127.0.0.1' });
  });

  it('should ignore AuditLog mutations', async () => {
    const extension = createAuditExtension(mockEventDispatcher, mockGetContext);
    
    // Using a mock Prisma client
    const client = {
      $extends: vi.fn().mockImplementation((ext) => ext),
    };

    const configuredExt: any = extension(client as any);
    const mockQuery = vi.fn().mockResolvedValue({ id: 'audit-1' });

    await configuredExt.query.$allModels.$allOperations({
      model: 'AuditLog',
      operation: 'create',
      args: {},
      query: mockQuery
    });

    expect(mockQuery).toHaveBeenCalled();
    expect(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should scrub sensitive data and emit telemetry for normal models', async () => {
    const extension = createAuditExtension(mockEventDispatcher, mockGetContext);
    
    let createdAuditLogData: any;
    const mockAuditLogCreate = vi.fn().mockImplementation((args) => {
      createdAuditLogData = args.data;
      return Promise.resolve({
        id: 'new-audit-id',
        createdAt: new Date('2026-07-01T10:00:00Z'),
        entityId: args.data.entityId
      });
    });

    const mockClient = {
      $extends: vi.fn().mockImplementation((ext) => ext),
      auditLog: {
        create: mockAuditLogCreate
      }
    };

    const configuredExt: any = extension(mockClient as any);
    const mockQuery = vi.fn().mockResolvedValue({ id: 'tenant-1', name: 'My Tenant' });

    await configuredExt.query.$allModels.$allOperations({
      model: 'Tenant',
      operation: 'create',
      args: {
        data: { name: 'My Tenant', password: 'super-secret' }
      },
      query: mockQuery
    });

    expect(mockQuery).toHaveBeenCalled();
    expect(mockAuditLogCreate).toHaveBeenCalled();
    
    // Verify scrubbing
    const newData = JSON.parse(createdAuditLogData.newData);
    expect(newData.args.data.password).toBe('[REDACTED]');
    
    // Verify event dispatch
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith('telemetry.audit.log', expect.objectContaining({
      eventId: 'new-audit-id',
      entityType: 'Tenant',
      entityId: 'tenant-1',
      action: 'CREATE',
      actor: { actorId: 'user-123', isSystem: false }
    }));
  });

  it('should default to SYSTEM actor if no context provided', async () => {
    mockGetContext.mockReturnValue(null);
    const extension = createAuditExtension(mockEventDispatcher, mockGetContext);
    
    const mockAuditLogCreate = vi.fn().mockResolvedValue({
      id: 'new-audit-id',
      createdAt: new Date(),
      entityId: 'tenant-1'
    });

    const mockClient = {
      $extends: vi.fn().mockImplementation((ext) => ext),
      auditLog: { create: mockAuditLogCreate }
    };

    const configuredExt: any = extension(mockClient as any);
    const mockQuery = vi.fn().mockResolvedValue({ id: 'tenant-1' });

    await configuredExt.query.$allModels.$allOperations({
      model: 'Tenant',
      operation: 'update',
      args: {},
      query: mockQuery
    });

    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith('telemetry.audit.log', expect.objectContaining({
      actor: { actorId: 'SYSTEM', isSystem: true }
    }));
  });

  it('AC5: should not emit telemetry if running inside a managed transaction that rolls back', async () => {
    const extension = createAuditExtension(mockEventDispatcher, mockGetContext);
    
    const mockTxClient = {
      $extends: vi.fn().mockImplementation((ext) => ext),
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-tx', createdAt: new Date(), entityId: 'e-1' }) }
    };
    
    const configuredExt: any = extension(mockTxClient as any);
    const mockQuery = vi.fn().mockResolvedValue({ id: 'tenant-1' });

    const events: any[] = [];
    
    await transactionContext.run({ txClient: mockTxClient, events }, async () => {
      // The mutation is executed inside the context
      await configuredExt.query.$allModels.$allOperations({
        model: 'Tenant',
        operation: 'update',
        args: {},
        query: mockQuery
      });
      
      // The event should NOT have been dispatched yet, but rather queued
      expect(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
      
      // Assume a rollback occurs - the transactionContext is exited
      // The outer code (TransactionManager) will just discard `events` array
    });
    
    // Events were queued
    expect(events.length).toBe(1);
    expect(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('AC5: should emit telemetry via TransactionManager when transaction commits successfully', async () => {
    const { TransactionManager } = await import('./transaction-manager');
    
    const mockPrisma = {
      $transaction: vi.fn().mockImplementation(async (cb) => {
        const txClient = { isTxClient: true };
        const result = await cb(txClient);
        return result;
      })
    };
    
    await TransactionManager.execute(mockPrisma as any, mockEventDispatcher, async (tx) => {
      // Simulate what the extension does inside the transaction by pushing to context
      const txCtx = transactionContext.getStore();
      txCtx?.events.push({ eventId: 'mock-event' });
      return { success: true };
    });
    
    // Dispatch happens after DB commit
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith('telemetry.audit.log', { eventId: 'mock-event' });
  });
});
