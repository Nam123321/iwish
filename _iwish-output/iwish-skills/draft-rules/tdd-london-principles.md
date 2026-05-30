---
name: tdd-london-principles
description: London School TDD (mockist) principles and practical mock/stub/spy patterns for Vitest and Jest.
inputs: [test_file_path, source_file_path]
outputs: [validated_test_patterns]
mcp_tools_required: []
subagent_triggers: []
priority: high
trigger_condition: "Agent is writing or reviewing tests that involve mocking, stubbing, or spying on collaborator dependencies."
---

# 🔒 DOUBLE-LOCK DIRECTIVE

> **MANDATORY**: Before writing any mock-heavy test code, the agent MUST read this
> fragment in full via `view_file`. Skipping this step will produce brittle,
> implementation-coupled tests. If you are an LLM agent and you have not loaded
> this document before generating mocks, STOP and load it now.

---

# TDD London School Principles

This fragment teaches the **London School** (mockist / interaction-based) approach
to Test-Driven Development. Use it whenever a unit under test collaborates with
external services, repositories, or event systems.

---

## 1. Core Principles

### 1.1 Outside-In Development
Start from the outermost layer (controller / handler) and work inward. Each layer
is tested in isolation; its collaborators are replaced with test doubles.

```
[Handler] → mock(Service) → mock(Repository) → mock(DB)
```

### 1.2 Mock Dependencies, Not the Unit Under Test
- The **System Under Test (SUT)** is always real code.
- Only its **collaborators** (injected dependencies) are replaced.
- Never mock the thing you are testing.

### 1.3 Test Behavior, Not Implementation
Assert **what** the SUT does (outputs, side effects, calls to collaborators),
not **how** it does it internally. If refactoring internals breaks tests, the
tests are too tightly coupled.

---

## 2. Test Double Taxonomy

| Double   | Purpose                                         | When to Use                              |
|----------|------------------------------------------------|------------------------------------------|
| **Stub** | Returns canned data; no assertions on calls.    | SUT needs data from a collaborator.      |
| **Mock** | Stub + verifies it was called correctly.         | SUT must trigger a side effect.          |
| **Spy**  | Wraps real impl; records calls for assertion.    | Verify call happened without replacing behavior. |
| **Fake** | Lightweight working implementation (e.g. in-memory DB). | Integration-lite tests.         |
| **Dummy**| Placeholder that is never actually used.         | Satisfying a required parameter.         |

### Decision Heuristic
```
Does the collaborator PRODUCE data the SUT needs?  → Stub
Does the SUT COMMAND the collaborator to do something? → Mock
Do you need the REAL behavior but want to observe calls? → Spy
```

---

## 3. Practical Examples (Vitest/Jest)

### Example 1: Mocking an API Service Call

Scenario: A `NotificationService` calls an external `EmailClient.send()`. We want
to verify the service composes the correct payload without sending real emails.

```javascript
// notification-service.test.js
import { describe, it, expect, vi } from 'vitest';
import { NotificationService } from './notification-service.js';

describe('NotificationService', () => {
  it('sends a welcome email with the correct payload', async () => {
    // Arrange — create a mock EmailClient
    const emailClient = {
      send: vi.fn().mockResolvedValue({ id: 'msg-001', status: 'sent' }),
    };
    const service = new NotificationService(emailClient);

    // Act
    const result = await service.sendWelcome('alice@example.com', 'Alice');

    // Assert — verify behavior, not internals
    expect(emailClient.send).toHaveBeenCalledOnce();
    expect(emailClient.send).toHaveBeenCalledWith({
      to: 'alice@example.com',
      subject: 'Welcome, Alice!',
      template: 'welcome',
      vars: { name: 'Alice' },
    });
    expect(result.status).toBe('sent');
  });

  it('throws on email client failure', async () => {
    const emailClient = {
      send: vi.fn().mockRejectedValue(new Error('SMTP timeout')),
    };
    const service = new NotificationService(emailClient);

    await expect(service.sendWelcome('bob@example.com', 'Bob'))
      .rejects.toThrow('SMTP timeout');
  });
});
```

**Key takeaways:**
- `emailClient` is injected — the SUT never constructs it.
- We assert on the call arguments (behavior), not on internal string concatenation.

---

### Example 2: Stubbing a Database Repository

Scenario: A `UserService.getProfile()` reads from a `UserRepository`. We stub the
repository to return controlled data without touching a database.

```javascript
// user-service.test.js
import { describe, it, expect, vi } from 'vitest';
import { UserService } from './user-service.js';

describe('UserService.getProfile', () => {
  it('returns enriched profile with computed fields', async () => {
    // Arrange — stub the repository (we only care about returned data)
    const userRepo = {
      findById: vi.fn().mockResolvedValue({
        id: 'u-42',
        name: 'Charlie',
        createdAt: new Date('2025-01-15'),
      }),
    };
    const service = new UserService(userRepo);

    // Act
    const profile = await service.getProfile('u-42');

    // Assert — verify the SUT's transformation logic
    expect(profile.displayName).toBe('Charlie');
    expect(profile.memberSince).toBe('January 2025');
    expect(profile.id).toBe('u-42');
  });

  it('returns null for non-existent user', async () => {
    const userRepo = {
      findById: vi.fn().mockResolvedValue(null),
    };
    const service = new UserService(userRepo);

    const profile = await service.getProfile('u-999');

    expect(profile).toBeNull();
    // Note: we do NOT assert findById was called — that's an implementation detail.
    // The stub simply returns null; the SUT decides what to do with it.
  });
});
```

**Key takeaways:**
- `findById` is a **stub** here: we care about returned data, not call verification.
- The second test shows restraint — we don't assert the call happened because the
  observable behavior (returning `null`) already proves correctness.

---

### Example 3: Spying on Event Emission

Scenario: An `OrderProcessor` emits an `order:completed` event via an `EventBus`
after successful processing. We spy on the bus to verify the event was emitted.

```javascript
// order-processor.test.js
import { describe, it, expect, vi } from 'vitest';
import { OrderProcessor } from './order-processor.js';

describe('OrderProcessor.complete', () => {
  it('emits order:completed event with order summary', async () => {
    // Arrange — spy on a real-ish EventBus
    const eventBus = {
      emit: vi.fn(),
    };
    const paymentGateway = {
      charge: vi.fn().mockResolvedValue({ txnId: 'txn-77' }),
    };
    const processor = new OrderProcessor(eventBus, paymentGateway);

    // Act
    await processor.complete({
      orderId: 'ord-100',
      amount: 59.99,
      currency: 'USD',
    });

    // Assert — spy verification on event emission
    expect(eventBus.emit).toHaveBeenCalledWith('order:completed', {
      orderId: 'ord-100',
      txnId: 'txn-77',
      amount: 59.99,
      currency: 'USD',
    });
  });

  it('does not emit event when payment fails', async () => {
    const eventBus = { emit: vi.fn() };
    const paymentGateway = {
      charge: vi.fn().mockRejectedValue(new Error('Card declined')),
    };
    const processor = new OrderProcessor(eventBus, paymentGateway);

    await expect(
      processor.complete({ orderId: 'ord-101', amount: 10, currency: 'USD' })
    ).rejects.toThrow('Card declined');

    // Spy assertion: event must NOT have been emitted
    expect(eventBus.emit).not.toHaveBeenCalled();
  });
});
```

**Key takeaways:**
- The `eventBus.emit` mock acts as a **spy** — we verify the call happened.
- The `paymentGateway.charge` mock acts as a **stub** — we control its return value.
- One test double can play different roles depending on what you assert.

---

## 4. Anti-Patterns (What NOT to Do)

### ❌ 4.1 Mocking the SUT Itself
```javascript
// BAD — you're testing a mock, not real code
const service = vi.fn().mockReturnValue('hello');
expect(service()).toBe('hello'); // This tests nothing
```

### ❌ 4.2 Over-Specifying Call Order
```javascript
// BAD — breaks if you reorder two independent calls
expect(repo.save).toHaveBeenCalledBefore(logger.info);
```
Only assert call order when it is **semantically required** (e.g., validate-then-save).

### ❌ 4.3 Mocking Everything (Including Value Objects)
```javascript
// BAD — Date, Math, simple formatters should NOT be mocked
const mockDate = vi.fn().mockReturnValue(new Date('2025-01-01'));
```
Mock **collaborators with side effects**, not pure functions or value objects.

### ❌ 4.4 Asserting Internal Private Methods Were Called
```javascript
// BAD — testing private implementation coupling
expect(service._validateInput).toHaveBeenCalled();
```
Test the **public contract** only. If `_validateInput` fails, the public method
should fail too — test that instead.

### ❌ 4.5 Copy-Pasting Mock Setup Across Every Test
Repeated verbose mock setup is a code smell. Use `beforeEach` or factory helpers:
```javascript
// GOOD — shared factory
function createMockDeps(overrides = {}) {
  return {
    repo: { findById: vi.fn().mockResolvedValue(null), ...overrides.repo },
    bus: { emit: vi.fn(), ...overrides.bus },
  };
}
```

---

## 5. Quick Reference Checklist

Before submitting mock-heavy tests, verify:

- [ ] SUT is **real code**, not a mock
- [ ] Only **injected collaborators** are mocked
- [ ] Assertions target **observable behavior** (return values, emitted events, collaborator calls)
- [ ] No assertions on **call order** unless semantically required
- [ ] No mocking of **pure functions** or value objects
- [ ] Mock setup is **DRY** — shared via factories or `beforeEach`
- [ ] Edge cases covered: error paths, null returns, empty collections
- [ ] Tests pass when SUT internals are refactored without changing behavior
