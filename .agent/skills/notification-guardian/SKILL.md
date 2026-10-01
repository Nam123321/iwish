---
name: Notification Guardian
description: Enforces the use of the centralized useToast system and forbids native browser notifications (window.alert, window.confirm) on both Spec Generation and Implementation phases.
---

# Notification Guardian

This skill enforces a consistent Notification UI pattern across the Cowok.ai system to prevent developers or AI agents from falling back to native browser notifications like `window.alert` or `window.confirm`.

## 1. Problem
During rapid prototyping, agents and developers often use `window.alert('Success')` or `console.error` for error handling. This violates the `DESIGN.md` guidelines, leading to a jarring user experience and missing toast/snackbars.

## 2. Core Constraints
- **FORBIDDEN:** `window.alert`, `window.confirm`, `window.prompt`.
- **FORBIDDEN:** Unhandled `console.error` without user-facing feedback for critical actions.
- **MANDATORY:** All UI components that perform async actions (fetch, mutations) MUST import and use `useToast` from `src/components/ui/use-toast.js`.

## 3. Spec Generation Phase (Shift-Left Enforcement)
Whenever an agent generates a UI Specification (`ui-spec.md`) or Data Specification:
- **Explicit Declaration**: The spec MUST explicitly dictate the use of `useToast` for handling successes and errors of any API interactions or form submissions.
- **Design.md Sync**: Ensure the spec acknowledges the `DESIGN.md` rule banning `window.alert`.
- **Goal**: By putting this on the spec, the downstream `/spec-compliance` workflow will automatically catch missing `useToast` implementations without needing a separate, late-stage code-review rule.

## 4. Implementation Strategy (Dev Agent)
Whenever an agent generates or modifies a React Component:
1. **Import Check:** Proactively check if `import { useToast } from 'path/to/ui/use-toast';` is present.
2. **Hook Initialization:** Ensure `const { toast } = useToast();` is initialized.
3. **Action Wrapping:** Wrap API calls in `try/catch` and trigger `toast` appropriately.

## 5. Remediation Pattern
If you encounter `window.alert` in existing code:
- Immediately replace it with `toast` using the `multi_replace_file_content` tool.
- Refactor the component to support the `useToast` hook.

## 6. Review & QA Gate
During `/review`, `/qa-agent`, or `/spec-compliance` runs, the agent MUST evaluate the code against the `ui-spec`. If the spec demands `useToast` and the code uses `window.alert`, the compliance score (SCS) must be penalized and an automatic fix must be requested.
