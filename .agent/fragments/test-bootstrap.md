---
name: 'Test Bootstrap'
description: 'Standardized testing principles and boilerplates.'
---

# Test Bootstrap Principles

1. **AAA Pattern**: Follow the Arrange, Act, Assert standard for all tests. Do not mix setup and assertion logic.
2. **Mocking Guidelines**: Standardize mocking to avoid brittle tests. Only mock external boundaries or slow I/O, not internal deterministic logic.
3. **Coverage Consistency**: Ensure that every new behavior or bug fix is accompanied by a corresponding unit or integration test that exercises both the happy path and the identified edge cases.
4. **Component & Visual Testing**: For frontend changes, explicitly mandate React/DOM component tests. Ensure visual regression safeguards and DOM-driven layout tests align with the established UX Principles.
