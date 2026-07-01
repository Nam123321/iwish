import { describe, it, expect } from 'vitest';
import { renderTemplate } from './template-resolver';
import { NotificationTemplate } from './types';

describe('Template Resolver', () => {
  const mockTemplate: NotificationTemplate = {
    id: '1',
    name: 'welcome_email',
    category: 'transactional',
    channel: 'email',
    provider: 'resend',
    subject_template: 'Welcome {{name}}!',
    body_template: 'Hello {{name}}, welcome to {{appName}}.',
    required_variables: ['name', 'appName'],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };

  it('should render template successfully when all variables are provided', () => {
    const result = renderTemplate(mockTemplate, { name: 'John', appName: 'I-Wish' });
    expect(result.subject).toBe('Welcome John!');
    expect(result.body).toBe('Hello John, welcome to I-Wish.');
  });

  it('should fail when required variables are missing', () => {
    expect(() => renderTemplate(mockTemplate, { name: 'John' })).toThrowError(
      /Missing required variables: appName/
    );
  });

  it('should sanitize input to prevent SSTI (no html execution or complex logic)', () => {
    // A logic-less engine will just output the string without evaluating it.
    const result = renderTemplate(mockTemplate, { name: '<script>alert(1)</script>', appName: 'App' });
    // It should escape HTML depending on implementation, but at least it should not execute anything.
    // For now we check if it handles basic strings and doesn't crash or evaluate expressions like {{ 1+1 }}
    const mathTemplate = { ...mockTemplate, body_template: 'Result: {{ 1+1 }}' };
    const mathResult = renderTemplate(mathTemplate, { name: 'A', appName: 'B' });
    expect(mathResult.body).toBe('Result: {{ 1+1 }}');
    // Check that HTML is escaped
    expect(result.body).toBe('Hello &lt;script&gt;alert(1)&lt;/script&gt;, welcome to App.');
  });
});
