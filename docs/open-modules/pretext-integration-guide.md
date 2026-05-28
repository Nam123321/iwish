# pretext Integration Guide (Adoption Review Pack)

---

## 1. What is it
- **Name**: pretext
- **Source**: [https://github.com/chenglou/pretext](https://github.com/chenglou/pretext)
- **Current Registration State**: Approved for `USER_SPACE` integration.
- **Shape Classification**: Library / Utility
- **Role Classification**: Client-side multiline text measurement & layout engine.

---

## 2. Why it exists
- **What job it solves**: Measures and lays out multiline text entirely in pure JavaScript/TypeScript without accessing the DOM, eliminating synchronous layout reflows (which traditionally cost 30ms+ per frame for large datasets).
- **Why I-Wish wants it**: Enables building extremely fast, jank-free client-side UIs that require dynamic height calculations.
- **What gap it fills**: Provides I-Wish developers with a high-performance text-layout engine to replace crude text length estimates or expensive DOM queries.

---

## 3. Delivery framework placement
- **Which phase(s) it helps**: `implement` (client-side UI code), `validate` (visual testing).
- **Which stage/task(s) it serves**: Custom UI layouts, list virtualization, visual regression checks.
- **Classification**: `supportive` client utility.

---

## 4. Input -> Process -> Output

### Inputs
- **Text**: The string content to measure.
- **Font**: Shorthand CSS font string matching the target rendering context (e.g., `'16px Inter'`).
- **Options**: Custom styling parameters:
  - `whiteSpace`: `'normal' | 'pre-wrap'`
  - `wordBreak`: `'normal' | 'keep-all'`
  - `letterSpacing`: CSS pixel number.

### Process
1. **`prepare(text, font, options)`**: normalizes collapsible whitespace, segments the text using browser-native `Intl.Segmenter` (handling CJK, Arabic, Thai, etc.), applies kinsoku rules, measures segments using Canvas 2D context `measureText`, and caches metrics.
2. **`layout(prepared, maxWidth, lineHeight)`**: executes pure arithmetic line-wrapping math over the cached metrics.

### Outputs
- **Opaque Handle**: `PreparedText` (for fast layout recalculations on resize).
- **Layout Result**: `{ height: number, lineCount: number }` (or `LayoutLinesResult` with individual lines).

---

## 5. Use cases
- **Core Use Cases**:
  - **Virtualized Lists**: Pre-calculating height of list items containing dynamic text before rendering.
  - **Masonry/Editorial Grids**: Sizing text boxes dynamically to arrange grid elements.
  - **Reflowing around Obstacles**: Walking line ranges dynamically to wrap text around shapes or floated images.
- **Adjacent Use Cases**:
  - **Offline/Test-time UI Validation**: Verifying that button labels or badges do not wrap to a new line, without launching a headless browser.
- **Do-Not-Use Cases**:
  - Full WYSIWYG rich text document editors (requires nested markup node handling).
  - Headless Node.js servers lacking Canvas/`Intl.Segmenter` polyfills.

---

## 6. Edge cases / Stress cases / Constraints
- **macOS Emoji Width Correction**: Chrome/Firefox canvas measures emojis wider than DOM at font sizes < 24px. Pretext self-corrects by triggering a one-time DOM width read, creating an occasional DOM dependency when emojis are present.
- **System Fonts**: The `system-ui` font stacks resolve differently in Canvas vs. DOM on macOS. Use named fonts (e.g. Helvetica, Inter) for accurate layouts.
- **Node.js Compatibility**: Runtimes without `Intl.Segmenter` or Canvas context will fail to initialize.

---

## 7. Agent / Workflow / Skill coordination
- **Agents**: `dev-agent` (integrating pretext into user-facing layout code), `ux-agent` (validating text layout rules).
- **Workflows**: `/make-ui-spec` (specifying rendering constraints).
- **Usage**: Used directly in the user-space project client code.

---

## 8. Orch routing hints
- **Trigger Phrases**: `optimize virtualized list scroll`, `measure text height without DOM`, `canvas text layout wrapping`, `performant text measurement`.
- **Anti-Triggers**: `parse rich text HTML`, `server-side text measurement`.
- **Preferred Routing Stage**: UI Layout Implementation.
- **Proposal Model**: Suggested automatically when virtual lists or custom Canvas/SVG text rendering are requested.

---

## 9. Review questions for the user
1. Will this library run on serverless functions or headless environments? (If so, ensure you configure appropriate Canvas and `Intl.Segmenter` polyfills).
2. Does your UI stack rely heavily on the `system-ui` font stack? (If yes, you should replace it with a named font for accurate layout matching).

---

## 10. Example scenarios

### Scenario 1: Sizing virtualized chat bubbles on resize
```ts
import { prepare, layout } from '@chenglou/pretext'

// Prepared once when the message content loads
const preparedMessage = prepare(msg.text, '14px Roboto')

// Re-calculated in real-time on window resize
window.addEventListener('resize', () => {
  const width = chatContainer.clientWidth - 40
  const { height } = layout(preparedMessage, width, 18)
  bubbleElement.style.height = `${height}px`
})
```

### Scenario 2: Wrapping text around a floating profile banner
```ts
import { prepareWithSegments, layoutNextLineRange, materializeLineRange } from '@chenglou/pretext'

const prepared = prepareWithSegments(bioText, '16px Inter')
let cursor = { segmentIndex: 0, graphemeIndex: 0 }
let y = 0

while (true) {
  // Narrower line width beside the banner
  const width = y < banner.bottom ? normalWidth - banner.width : normalWidth
  const range = layoutNextLineRange(prepared, cursor, width)
  if (range === null) break

  const line = materializeLineRange(prepared, range)
  renderLine(line.text, y)
  cursor = range.end
  y += 20
}
```
