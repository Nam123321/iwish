import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatchNotification } from './dispatcher';
import { NotificationTemplate, NotificationPayload } from './types';
import * as templateResolver from './template-resolver';

describe('Notification Dispatcher', () => {
  const mockTemplate: NotificationTemplate = {
    id: '1',
    name: 'test_template',
    category: 'transactional',
    channel: 'email',
    provider: 'test_provider',
    subject_template: 'Sub',
    body_template: 'Body',
    required_variables: [],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };

  const getTemplateMock = vi.fn().mockResolvedValue(mockTemplate);
  const getUserOptOutMock = vi.fn().mockResolvedValue(false);
  const providerDispatchMock = vi.fn().mockResolvedValue({ success: true, providerId: 'msg_123' });

  const deps = {
    getTemplateByName: getTemplateMock,
    checkUserOptOut: getUserOptOutMock,
    providerDispatch: providerDispatchMock,
    logNotification: vi.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getTemplateMock.mockResolvedValue(mockTemplate);
    getUserOptOutMock.mockResolvedValue(false);
    providerDispatchMock.mockResolvedValue({ success: true, providerId: 'msg_123' });
  });

  it('should successfully dispatch a valid notification', async () => {
    const payload: NotificationPayload = {
      templateName: 'test_template',
      recipientId: '123e4567-e89b-12d3-a456-426614174000'
    };

    const result = await dispatchNotification(payload, deps);
    expect(result.status).toBe('dispatched');
    expect(deps.providerDispatch).toHaveBeenCalled();
    expect(deps.logNotification).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'dispatched' })
    );
  });

  it('should bypass marketing opt-out if category is transactional', async () => {
    getUserOptOutMock.mockResolvedValue(true); // User opted out of marketing
    const payload: NotificationPayload = {
      templateName: 'test_template',
      recipientId: '123e4567-e89b-12d3-a456-426614174000'
    };

    const result = await dispatchNotification(payload, deps);
    // Since template is transactional, it should still dispatch
    expect(result.status).toBe('dispatched');
    expect(deps.providerDispatch).toHaveBeenCalled();
  });

  it('should block dispatch if user opted out and category is marketing', async () => {
    getTemplateMock.mockResolvedValue({ ...mockTemplate, category: 'marketing' });
    getUserOptOutMock.mockResolvedValue(true); // User opted out
    const payload: NotificationPayload = {
      templateName: 'test_template',
      recipientId: '123e4567-e89b-12d3-a456-426614174000'
    };

    const result = await dispatchNotification(payload, deps);
    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/User opted out/);
    expect(deps.providerDispatch).not.toHaveBeenCalled();
  });

  it('should retry on provider failure with exponential backoff', async () => {
    providerDispatchMock
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockRejectedValueOnce(new Error('Timeout Error'))
      .mockResolvedValueOnce({ success: true, providerId: 'msg_123' });

    const payload: NotificationPayload = {
      templateName: 'test_template',
      recipientId: '123e4567-e89b-12d3-a456-426614174000'
    };

    const result = await dispatchNotification(payload, { ...deps, retryDelayBaseMs: 1 });
    expect(deps.providerDispatch).toHaveBeenCalledTimes(3);
    expect(result.status).toBe('dispatched');
    expect(deps.logNotification).toHaveBeenCalledWith(
      expect.objectContaining({ retry_count: 2 })
    );
  });

  it('should fail permanently after max retries', async () => {
    providerDispatchMock.mockRejectedValue(new Error('Persistent Error'));

    const payload: NotificationPayload = {
      templateName: 'test_template',
      recipientId: '123e4567-e89b-12d3-a456-426614174000'
    };

    const result = await dispatchNotification(payload, { ...deps, retryDelayBaseMs: 1, maxRetries: 2 });
    expect(deps.providerDispatch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    expect(result.status).toBe('failed');
    expect(deps.logNotification).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', retry_count: 2 })
    );
  });

  it('should fail if payload is invalid (Zod validation)', async () => {
    const invalidPayload = {
      templateName: '',
      recipientId: 'not-a-uuid'
    } as any;

    const result = await dispatchNotification(invalidPayload, deps);
    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/Validation/);
    expect(deps.providerDispatch).not.toHaveBeenCalled();
  });
});
