# Historical Bug Patterns

### From 2026-06-sbrp-round65.md
- **[BUG-RCA]:** Do not use `display: none !important` on components managed by `react-resizable-panels` because it destroys the flex algorithm. Instead, rely on `onCollapse` and `minSize` attributes to manage visibility properly.

```yaml
featuregraph_updated: false
spec_update: false
reason: "Only structural CSS and layout bug"
page_agent_verification: PASS
```

## [PROMOTED] Category: RBAC
- **Frequency before promotion:** 3
### Occurrence 1: Mock RBAC Bug
**RCA:** User bypasses admin check due to missing middleware
**Lesson:** Always apply adminMiddleware before role check

### Occurrence 2: Another RBAC bug
**RCA:** Missing check
**Lesson:** Add check

### Occurrence 3: Third RBAC bug
**RCA:** Missing check
**Lesson:** Add check

