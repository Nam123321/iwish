---
name: Formatting Guardian
description: Enforces the use of dynamic formatting hooks based on the Personal > Workspace > Default hierarchy. Forbids static formatters (e.g. .toLocaleString, $) in UI code.
---

# Formatting Guardian Guidelines

## 1. Core Directives
1. **Never use static JS formatters**: Do NOT use `Number.prototype.toLocaleString()`, `Date.prototype.toLocaleString()`, `Intl.NumberFormat`, or `Intl.DateTimeFormat` directly inside components.
2. **Never hardcode currency or unit symbols**: Do NOT hardcode `$`, `€`, `£`, `kg`, `lbs`, etc. into JSX text nodes or string literals for UI rendering.
3. **Always use the central formatter**: You MUST import and use `useFormatter` from `src/hooks/useFormatter.js` (or equivalent context) for formatting numbers, currency, dates, and units.
4. **Never hardcode UI text (i18n Guardrail)**: You MUST wrap all static text in UI components using the translation function (e.g. `t()`). Do NOT write raw text strings in JSX children or attributes (like placeholders or titles).
5. **CRITICAL: Always Update Translation Dictionaries**: Whenever you introduce a new translation key using `t('my.key', 'My Text')`, you MUST also update the corresponding JSON dictionary files (e.g., `src/i18n/locales/en.json`, `src/i18n/locales/vi.json`, etc.) with the new key and its translated values. Simply wrapping the text in `t()` is NOT sufficient, as missing keys will break localization for end users. You must actively edit the JSON files.

## 2. Usage Contract
When displaying any metric or text, you must adhere to this pattern:

```javascript
import { useTranslation } from 'react-i18next';
import { useFormatter } from '@/hooks/useFormatter'; // or relative path

function DashboardCard({ amount, cost }) {
  const { t } = useTranslation();
  const { formatNumber, formatCurrency, formatDate, formatUnit } = useFormatter();

  return (
    <div>
      {/* ❌ BAD: <p>Tokens: {amount.toLocaleString()}</p> */}
      {/* ✅ GOOD: */}
      <p>{t('tokens', 'Tokens')}: {formatNumber(amount)}</p>
      
      {/* ❌ BAD: <p>Cost: ${cost.toFixed(2)}</p> */}
      {/* ✅ GOOD: */}
      <p>{t('cost', 'Cost')}: {formatCurrency(cost, 'USD')}</p>
    </div>
  );
}
```

## 3. The Personal > Workspace > Default Hierarchy
The `useFormatter` hook automatically handles the hierarchy defined in Story 1.3 and 1.3b:
- **Level 1 (Personal)**: Overrides defined by the individual user.
- **Level 2 (Workspace/Tenant)**: Overrides configured for the organization.
- **Level 3 (Default)**: Inferred from the base UI locale.
Agent must trust the hook to handle this logic internally and must not attempt to re-implement priority logic in the component.

## 4. Mechanical Enforcement
Note that the workspace contains ESLint AST rules (`no-restricted-syntax`, `i18next/no-literal-string`) that will cause build/lint failures if you attempt to use `.toLocaleString`, hardcoded currency strings, or literal un-translated strings in JSX. If you encounter these lint errors, you must refactor to use `useFormatter` and `t()` respectively.
