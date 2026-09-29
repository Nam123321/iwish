"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTemplate = renderTemplate;
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string')
        return String(unsafe);
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function renderTemplate(template, variables = {}) {
    // Check for required variables
    const missingVars = template.required_variables.filter(v => !(v in variables));
    if (missingVars.length > 0) {
        throw new Error(`[TemplateResolver] Missing required variables: ${missingVars.join(', ')}`);
    }
    // Define a logic-less replacement logic
    const replaceVars = (text) => {
        return text.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, p1) => {
            const val = variables[p1];
            if (val === undefined) {
                return match; // Keep as is if somehow bypassed required_variables (e.g. optional vars)
            }
            return escapeHtml(val);
        });
    };
    const subject = template.subject_template ? replaceVars(template.subject_template) : undefined;
    const body = replaceVars(template.body_template);
    return { subject, body };
}
