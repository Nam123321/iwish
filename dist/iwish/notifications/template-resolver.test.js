"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const template_resolver_1 = require("./template-resolver");
(0, vitest_1.describe)('Template Resolver', () => {
    const mockTemplate = {
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
    (0, vitest_1.it)('should render template successfully when all variables are provided', () => {
        const result = (0, template_resolver_1.renderTemplate)(mockTemplate, { name: 'John', appName: 'I-Wish' });
        (0, vitest_1.expect)(result.subject).toBe('Welcome John!');
        (0, vitest_1.expect)(result.body).toBe('Hello John, welcome to I-Wish.');
    });
    (0, vitest_1.it)('should fail when required variables are missing', () => {
        (0, vitest_1.expect)(() => (0, template_resolver_1.renderTemplate)(mockTemplate, { name: 'John' })).toThrowError(/Missing required variables: appName/);
    });
    (0, vitest_1.it)('should sanitize input to prevent SSTI (no html execution or complex logic)', () => {
        // A logic-less engine will just output the string without evaluating it.
        const result = (0, template_resolver_1.renderTemplate)(mockTemplate, { name: '<script>alert(1)</script>', appName: 'App' });
        // It should escape HTML depending on implementation, but at least it should not execute anything.
        // For now we check if it handles basic strings and doesn't crash or evaluate expressions like {{ 1+1 }}
        const mathTemplate = { ...mockTemplate, body_template: 'Result: {{ 1+1 }}' };
        const mathResult = (0, template_resolver_1.renderTemplate)(mathTemplate, { name: 'A', appName: 'B' });
        (0, vitest_1.expect)(mathResult.body).toBe('Result: {{ 1+1 }}');
        // Check that HTML is escaped
        (0, vitest_1.expect)(result.body).toBe('Hello &lt;script&gt;alert(1)&lt;/script&gt;, welcome to App.');
    });
});
