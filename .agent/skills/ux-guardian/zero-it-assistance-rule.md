# UX Guardian: Zero-IT Assistance Rule

This rule defines the Zero-IT Information Assistance (ZIIA) pattern for Cowok.ai. It provides a structured evaluation framework to help novice users understand technical metrics and inputs through tooltips and proactive conversational AI agents, while maintaining UI cleanliness and complying with `/Formatting Guardian`.

---

## 1. 🔍 Zero-IT Assistance Scoring Framework (ZASF)

To avoid cluttering the UI with redundant information ("vô tội vạ"), the developer/UX agent must calculate a **Complexity & Technicality Score (CTS)** for every metric, complex action, or form input.

$$CTS = T + I + C$$

### Scoring Matrix (1 to 3 points per dimension):

| Score | Technicality (T) | Impact / Consequence (I) | Cognitive Complexity (C) |
| :--- | :--- | :--- | :--- |
| **1** | Universal, clear term (e.g., *Name, Email, Status*) | Read-only data, low impact | Static, simple value (e.g., string/boolean) |
| **2** | Domain-specific but common (e.g., *Billing Cycle, SMTP, Webhooks*) | Standard form input, moderate impact if misconfigured | Dynamic/locale-dependent values (e.g., *Dates, Localized Currency*) |
| **3** | Abstract technical jargon (e.g., *Cron Expression, OKF Metadata, JWT Secret*) | Destructive actions, credentials, or security-sensitive parameters | Calculated/derived metrics, status trees, or multi-option dependencies |

### Decision Matrix:
- **CTS < 5**: **No help indicator.** Keep UI clean.
- **CTS = 5 or 6**: **Inline Help Icon with Tooltip (`TooltipInfo`).**
- **CTS >= 7**: **Proactive AI Agent Support Trigger.** Render an interactive "Ask AI" button/icon that opens a contextual chat with the corresponding domain agent.

---

## 2. 🤖 Proactive AI Agent Support Pattern (CTS >= 7)

Instead of linking to a static, passive HTML documentation page, features with high complexity (**CTS >= 7**) will integrate the **Active AI Agent Support** pattern:

1. **Trigger Component**: Display an interactive "Ask AI" pill button next to the element using the `<AIAssistanceTrigger />` component imported from `@/components/ui/ZeroIT`.
2. **Metadata & React Contract**: The trigger component exposes these main props to initialize the context:
   ```jsx
   import { AIAssistanceTrigger } from '../../components/ui/ZeroIT';

   <AIAssistanceTrigger 
     agentType="data-strategist-agent"
     contextId="agent-breakdown-log"
     contextPayload={{ totalAgents: agentsBreakdown.length }}
   />
   ```
   * **agentType**: The target AI agent persona to summon (e.g., `data-strategist-agent`, `devops-agent`, `ux-agent-persona`, `qa-agent-persona`).
   * **contextId**: Unique string identifier mapping the user's current page/module context.
   * **contextPayload**: Arbitrary data object payload containing state metrics or variables.
3. **Interaction Flow**:
   * **Click Action**: Clicking the trigger dispatches a custom event (`cowok:ai-assist`) containing the context and payload parameters.
   * **Workspace Shell Response**: The primary workspace or side chat panel catches this event, sliding open the focused AI chat window.
   * **Contextual Primer**: The corresponding domain agent is activated, immediately presenting a personalized diagnostic statement and concrete action recommendations (e.g. "Optimize this route", "Troubleshoot DB queries").

---

## 3. 🎨 Visual Design Specifications (DESIGN.md Alignment)

All helper components must adhere to the Cowok.ai brand guidelines (stroke-width `1.85`, stroke-linecap `round`):

### A. Help Icons
- SVG icons representing help/info must match the `cowok-ai-icon-sprite.svg` style.
- Default color: Muted slate (`text-slate-400` in light mode, `rgba(255,255,255,0.4)` in dark mode).
- Hover/Focus color: Cobalt (`#0057FF`) with a micro-scale shift (`transform: scale(1.1)`).

### B. Unified Popovers & Tooltips (Popover Standard)
To ensure absolute layout consistency and prevent text overflow or off-screen rendering ("tràn viền"), all tooltips and help popovers **MUST** reuse the central `Popover`, `PopoverTrigger`, and `PopoverContent` components from [popover.jsx]({project-root}/src/components/ui/popover.jsx).
- **Custom Tooltips & Native Title Tooltips Banned**: Using the native HTML `title` attribute or implementing custom un-aligned CSS hovers is strictly prohibited.
- **Visual tokens from popover.jsx**:
  - **Padding**: `12px` (`padding: '12px'`).
  - **Font Size**: `12px` (`font-size: 12px`), normal weight, line-height `1.4` (`line-height: 1.4`).
  - **Word Wrapping**: `wordBreak: 'break-word'`, `whiteSpace: 'normal'` to handle text wrapping safely.
  - **Width Limits**: `width: 'max-content'` with `maxWidth: 'min(300px, 90vw)'` to fit smaller screens.
  - **Colors & Transparency**:
    - **Dark Mode**: Background `rgba(26, 34, 51, 0.45)` (or `#1A223373`), Border `1px solid rgba(0, 87, 255, 0.4)`, Text `#E5EAF2`.
    - **Light Mode**: Background `#F8F9FA`, Border `1px solid #E5E7EB`, Text `#1A2233`.
    - **Effects**: Backdrop filter blur of `10px` (`backdrop-filter: blur(10px)`) and shadow (`box-shadow: 0 10px 25px rgba(0,0,0,0.5)`).
- **Interaction (Click vs Hover)**:
  - Tooltips for information (`TooltipInfo`) MUST only toggle on click (closing when clicking outside or clicking again), rather than displaying on hover. This prevents accidental popups when moving the mouse across the screen and gives the user control.
- **Viewport Boundary Safety Check**:
  - The PopoverContent component includes programmatic collision detection via `getBoundingClientRect()`. If the popover content overflows the right viewport edge (less than 10px spacing), it dynamically repositions itself (`right: 0, left: 'auto'`). If it overflows the left viewport edge, it shifts to `left: 0, right: 'auto'`.
  - Developers must set the default `align` property (`'left'`, `'right'`, or `'center'`) appropriately on `PopoverContent`.
- **Transitions**: 150ms fade-in and scale shift:
  ```css
  transition: opacity 150ms ease-out, transform 150ms ease-out;
  ```

### C. Quiet / Tactile Buttons (AI Agent Triggers)
- Must follow the elastic click animation: shrink slightly (`transform: scale(0.96)`) on click with `transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)`.

---

## 4. 🔒 Compliance with Formatting Guardian

To satisfy formatting security and translation ast checks:
1. **Dynamic Tooltip Contents**: Tooltips containing numbers, currencies, dates, or custom units **MUST** resolve their format dynamically using the `useFormatter` hook before rendering:
   ```javascript
   // ❌ BAD: content={`Your cap is $${amount.toLocaleString()}`}
   // ✅ GOOD:
   const formattedAmount = formatCurrency(amount, 'USD');
   const content = t('tooltip.billing_limit', 'Your cap is {{amount}}', { amount: formattedAmount });
   ```
2. **Translation Key Guardrail**: All tooltips, help text, button labels, and screen reader announcements must be wrapped in `t()`. Literal text is banned.
3. **Accessibility**: All tooltips must activate on both hover (`:hover`) and keyboard focus (`:focus-visible`).
