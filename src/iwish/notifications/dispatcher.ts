import { v4 as uuidv4 } from 'uuid';
import { NotificationPayload, NotificationPayloadSchema, NotificationTemplate, NotificationLog } from './types';
import { renderTemplate } from './template-resolver';

export interface DispatcherDependencies {
  getTemplateByName: (name: string) => Promise<NotificationTemplate | null>;
  checkUserOptOut: (recipientId: string) => Promise<boolean>;
  providerDispatch: (channel: string, provider: string, rendered: { subject?: string; body: string }, recipientId: string) => Promise<any>;
  logNotification: (log: Partial<NotificationLog>) => Promise<void>;
  retryDelayBaseMs?: number;
  maxRetries?: number;
}

export async function dispatchNotification(
  rawPayload: any,
  deps: DispatcherDependencies
): Promise<{ status: string; error?: string; logId?: string }> {
  const logId = uuidv4();
  const maxRetries = deps.maxRetries ?? 3;
  const retryDelayBaseMs = deps.retryDelayBaseMs ?? 1000;
  
  // 1. Validate payload
  const parseResult = NotificationPayloadSchema.safeParse(rawPayload);
  if (!parseResult.success) {
    const errorMsg = `Validation failed: ${parseResult.error.message}`;
    await deps.logNotification({
      id: logId,
      status: 'failed',
      error_message: errorMsg,
      retry_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
    return { status: 'failed', error: errorMsg, logId };
  }
  const payload = parseResult.data;

  // 2. Fetch Template
  const template = await deps.getTemplateByName(payload.templateName);
  if (!template) {
    const errorMsg = `Template not found: ${payload.templateName}`;
    await deps.logNotification({
      id: logId,
      recipient_id: payload.recipientId,
      status: 'failed',
      error_message: errorMsg,
      retry_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
    return { status: 'failed', error: errorMsg, logId };
  }

  // 3. Opt-out logic (bypass for transactional)
  if (template.category === 'marketing') {
    const optedOut = await deps.checkUserOptOut(payload.recipientId);
    if (optedOut) {
      const errorMsg = `User opted out of marketing notifications`;
      await deps.logNotification({
        id: logId,
        template_id: template.id,
        recipient_id: payload.recipientId,
        status: 'failed',
        error_message: errorMsg,
        retry_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
      return { status: 'failed', error: errorMsg, logId };
    }
  }

  // 4. Render template
  let rendered;
  try {
    rendered = renderTemplate(template, payload.variables);
  } catch (err: any) {
    const errorMsg = `Template rendering failed: ${err.message}`;
    await deps.logNotification({
      id: logId,
      template_id: template.id,
      recipient_id: payload.recipientId,
      status: 'failed',
      error_message: errorMsg,
      retry_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
    return { status: 'failed', error: errorMsg, logId };
  }

  // 5. Dispatch with retry
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await deps.providerDispatch(template.channel, template.provider, rendered, payload.recipientId);
      
      await deps.logNotification({
        id: logId,
        template_id: template.id,
        recipient_id: payload.recipientId,
        status: 'dispatched',
        provider_response: response,
        retry_count: attempt,
        dispatched_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return { status: 'dispatched', logId };
    } catch (err: any) {
      if (attempt >= maxRetries) {
        await deps.logNotification({
          id: logId,
          template_id: template.id,
          recipient_id: payload.recipientId,
          status: 'failed',
          error_message: err.message,
          retry_count: attempt,
          created_at: new Date(),
          updated_at: new Date()
        });
        return { status: 'failed', error: err.message, logId };
      }
      
      // Exponential backoff
      const delayMs = retryDelayBaseMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      attempt++;
    }
  }

  return { status: 'failed', error: 'Unexpected exit', logId };
}
