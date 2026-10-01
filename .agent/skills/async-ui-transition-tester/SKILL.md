---
name: async_ui_transition_tester
description: A structured workflow to mock, wait for, and assert asynchronous UI state transitions and WebSocket events.
---
# Async UI Transition Tester (async_ui_transition_tester)

## Description
A structured workflow to mock, wait for, and assert asynchronous UI state transitions and WebSocket events.

## Role & Purpose
- **Shape:** `skill`
- **Role:** `supportive`
- **Use Case:** Validating dynamic UI lifecycles (e.g., SkeletonIndicator -> Loading State -> ResultCard) driven by background tasks, WebSockets, or polling mechanisms.

## Prerequisites
- Playwright or a similar UI testing framework must be configured.
- The environment should support overriding backend endpoints or mocking WebSocket messages.

## Workflow

### 1. Mock the Backend State
- Intercept the initial API request to return a "pending" or "processing" state.
- If using WebSockets, establish a mock connection that allows programmatic event dispatching.

### 2. Assert Initial UI State
- Verify that the loading indicator (e.g., `SkeletonIndicator`, spinner, or "processing" text) is visible.
- Ensure that the primary action buttons (like "Submit") are disabled or hidden to prevent duplicate submissions.

### 3. Simulate the Asynchronous Transition
- Dispatch the completion event via the mocked WebSocket, OR
- Advance the mocked API state and trigger a UI poll/refresh.

### 4. Wait for UI Resolution
- Use framework-specific wait functions (e.g., `page.waitForSelector('.ResultCard')`) instead of fixed timeouts to avoid flakiness.
- Ensure the wait accounts for any UI animations (e.g., CSS transitions).

### 5. Assert Final UI State
- Verify that the `SkeletonIndicator` or loading spinner is completely removed from the DOM.
- Assert that the success component (e.g., `ResultCard`) is visible and contains the expected mocked data.
- Verify that any relevant success notifications (toast messages) appear.

## Constraints & Anti-Patterns
- **Avoid Fixed Timeouts:** Do not use `sleep(5000)` or similar arbitrary waits. Always wait for specific DOM mutations.
- **Strict Mocking:** Ensure all async boundaries are mocked. Real backend calls can lead to flaky tests due to network variability.
- **Animation Awareness:** Be cautious of elements that are in the DOM but have `opacity: 0` or are animating out. Assert on strict visibility rules.

## Example Integration (Playwright)
```typescript
test('should transition from skeleton to result card', async ({ page }) => {
  // 1. Mock initial pending state
  await page.route('/api/task-status', route => route.fulfill({ json: { status: 'pending' } }));
  
  // Trigger action
  await page.click('button#start-task');
  
  // 2. Assert skeleton
  await expect(page.locator('.SkeletonIndicator')).toBeVisible();
  
  // 3. Simulate completion
  await page.route('/api/task-status', route => route.fulfill({ json: { status: 'complete', data: { id: 1 } } }), { times: 1 });
  
  // 4 & 5. Wait and assert final state
  await expect(page.locator('.SkeletonIndicator')).toBeHidden();
  await expect(page.locator('.ResultCard')).toBeVisible();
});
```
