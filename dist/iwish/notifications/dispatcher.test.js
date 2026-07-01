"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const dispatcher_1 = require("./dispatcher");
(0, vitest_1.describe)('Notification Dispatcher', () => {
    const mockTemplate = {
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
    const getTemplateMock = vitest_1.vi.fn().mockResolvedValue(mockTemplate);
    const getUserOptOutMock = vitest_1.vi.fn().mockResolvedValue(false);
    const providerDispatchMock = vitest_1.vi.fn().mockResolvedValue({ success: true, providerId: 'msg_123' });
    const deps = {
        getTemplateByName: getTemplateMock,
        checkUserOptOut: getUserOptOutMock,
        providerDispatch: providerDispatchMock,
        logNotification: vitest_1.vi.fn().mockResolvedValue(undefined)
    };
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        getTemplateMock.mockResolvedValue(mockTemplate);
        getUserOptOutMock.mockResolvedValue(false);
        providerDispatchMock.mockResolvedValue({ success: true, providerId: 'msg_123' });
    });
    (0, vitest_1.it)('should successfully dispatch a valid notification', async () => {
        const payload = {
            templateName: 'test_template',
            recipientId: '123e4567-e89b-12d3-a456-426614174000'
        };
        const result = await (0, dispatcher_1.dispatchNotification)(payload, deps);
        (0, vitest_1.expect)(result.status).toBe('dispatched');
        (0, vitest_1.expect)(deps.providerDispatch).toHaveBeenCalled();
        (0, vitest_1.expect)(deps.logNotification).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ status: 'dispatched' }));
    });
    (0, vitest_1.it)('should bypass marketing opt-out if category is transactional', async () => {
        getUserOptOutMock.mockResolvedValue(true); // User opted out of marketing
        const payload = {
            templateName: 'test_template',
            recipientId: '123e4567-e89b-12d3-a456-426614174000'
        };
        const result = await (0, dispatcher_1.dispatchNotification)(payload, deps);
        // Since template is transactional, it should still dispatch
        (0, vitest_1.expect)(result.status).toBe('dispatched');
        (0, vitest_1.expect)(deps.providerDispatch).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should block dispatch if user opted out and category is marketing', async () => {
        getTemplateMock.mockResolvedValue({ ...mockTemplate, category: 'marketing' });
        getUserOptOutMock.mockResolvedValue(true); // User opted out
        const payload = {
            templateName: 'test_template',
            recipientId: '123e4567-e89b-12d3-a456-426614174000'
        };
        const result = await (0, dispatcher_1.dispatchNotification)(payload, deps);
        (0, vitest_1.expect)(result.status).toBe('failed');
        (0, vitest_1.expect)(result.error).toMatch(/User opted out/);
        (0, vitest_1.expect)(deps.providerDispatch).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should retry on provider failure with exponential backoff', async () => {
        providerDispatchMock
            .mockRejectedValueOnce(new Error('Network Error'))
            .mockRejectedValueOnce(new Error('Timeout Error'))
            .mockResolvedValueOnce({ success: true, providerId: 'msg_123' });
        const payload = {
            templateName: 'test_template',
            recipientId: '123e4567-e89b-12d3-a456-426614174000'
        };
        const result = await (0, dispatcher_1.dispatchNotification)(payload, { ...deps, retryDelayBaseMs: 1 });
        (0, vitest_1.expect)(deps.providerDispatch).toHaveBeenCalledTimes(3);
        (0, vitest_1.expect)(result.status).toBe('dispatched');
        (0, vitest_1.expect)(deps.logNotification).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ retry_count: 2 }));
    });
    (0, vitest_1.it)('should fail permanently after max retries', async () => {
        providerDispatchMock.mockRejectedValue(new Error('Persistent Error'));
        const payload = {
            templateName: 'test_template',
            recipientId: '123e4567-e89b-12d3-a456-426614174000'
        };
        const result = await (0, dispatcher_1.dispatchNotification)(payload, { ...deps, retryDelayBaseMs: 1, maxRetries: 2 });
        (0, vitest_1.expect)(deps.providerDispatch).toHaveBeenCalledTimes(3); // Initial + 2 retries
        (0, vitest_1.expect)(result.status).toBe('failed');
        (0, vitest_1.expect)(deps.logNotification).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ status: 'failed', retry_count: 2 }));
    });
    (0, vitest_1.it)('should fail if payload is invalid (Zod validation)', async () => {
        const invalidPayload = {
            templateName: '',
            recipientId: 'not-a-uuid'
        };
        const result = await (0, dispatcher_1.dispatchNotification)(invalidPayload, deps);
        (0, vitest_1.expect)(result.status).toBe('failed');
        (0, vitest_1.expect)(result.error).toMatch(/Validation/);
        (0, vitest_1.expect)(deps.providerDispatch).not.toHaveBeenCalled();
    });
});
