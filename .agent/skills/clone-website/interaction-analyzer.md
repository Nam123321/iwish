---
name: interaction-analyzer
description: 'Analyze interactive behaviors on a website — scroll-driven, click-driven, hover states, animations, and responsive breakpoints.'
---

# Interaction Analyzer Sub-Skill

## Purpose
Perform a comprehensive behavioral sweep of a live website to discover ALL interactive behaviors beyond what's visible in a static screenshot. Determines the **interaction model** of each section (click-driven, scroll-driven, hover-driven, time-driven) — which is the single most costly mistake if guessed wrong during cloning.

## Prerequisites
- `browser_subagent` must be active and navigated to the target page
- Page should be fully loaded (wait for animations to settle)

## Execution Steps

### Step 1: Scroll Sweep
Use `browser_subagent` to slowly scroll the page from top to bottom. At each section, observe and document:

```javascript
// Detect scroll-driven behaviors
(function() {
  const results = {
    scrollSnap: [],
    stickyElements: [],
    scrollListeners: false,
    smoothScrollLib: null,
    animatedElements: []
  };
  
  // Check for scroll-snap
  document.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.scrollSnapType && cs.scrollSnapType !== 'none') {
      results.scrollSnap.push({
        selector: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.toString().split(' ')[0] : ''),
        scrollSnapType: cs.scrollSnapType
      });
    }
    if (cs.position === 'sticky' || cs.position === 'fixed') {
      results.stickyElements.push({
        selector: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.toString().split(' ')[0] : ''),
        position: cs.position,
        top: cs.top,
        zIndex: cs.zIndex
      });
    }
  });
  
  // Check for smooth scroll libraries
  if (document.querySelector('.lenis') || document.querySelector('[data-lenis]')) {
    results.smoothScrollLib = 'Lenis';
  } else if (document.querySelector('.locomotive-scroll') || document.querySelector('[data-scroll-container]')) {
    results.smoothScrollLib = 'Locomotive Scroll';
  } else if (document.querySelector('[data-scroll]')) {
    results.smoothScrollLib = 'Unknown scroll library (data-scroll attribute detected)';
  }
  
  // Check for CSS animation-timeline usage
  const sheets = [...document.styleSheets];
  sheets.forEach(sheet => {
    try {
      [...sheet.cssRules].forEach(rule => {
        if (rule.cssText && (rule.cssText.includes('animation-timeline') || rule.cssText.includes('scroll-timeline'))) {
          results.scrollListeners = true;
        }
      });
    } catch(e) {}
  });
  
  // Check for elements with transitions/animations
  [...document.querySelectorAll('*')].slice(0, 300).forEach(el => {
    const cs = getComputedStyle(el);
    if ((cs.transition && cs.transition !== 'all 0s ease 0s' && cs.transition !== 'none 0s ease 0s') ||
        (cs.animationName && cs.animationName !== 'none')) {
      results.animatedElements.push({
        selector: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.toString().split(' ')[0] : ''),
        transition: cs.transition !== 'all 0s ease 0s' ? cs.transition : undefined,
        animation: cs.animationName !== 'none' ? `${cs.animationName} ${cs.animationDuration} ${cs.animationTimingFunction}` : undefined
      });
    }
  });
  
  return JSON.stringify(results, null, 2);
})();
```

### Step 2: Click Sweep
Use `browser_subagent` to click every interactive element and document what happens:

**Elements to click:**
- Every button, tab, pill selector
- Every nav menu item
- Every accordion header
- Every card that might be clickable

**For each click, record:**
- What changes visually (content swap, modal opens, dropdown appears, accordion expands)
- The animation/transition used (fade, slide, scale, opacity)
- Whether content is added/removed from DOM or shown/hidden via CSS

### Step 3: Hover Sweep
Use `browser_subagent` to hover over interactive elements:

```javascript
// Detect hover-capable elements
(function() {
  const hoverTargets = [];
  const interactiveSelectors = 'a, button, [role="button"], .card, [class*="card"], [class*="btn"], input, [tabindex]';
  const elements = [...document.querySelectorAll(interactiveSelectors)].slice(0, 50);
  
  elements.forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.cursor === 'pointer' || cs.transition !== 'all 0s ease 0s') {
      hoverTargets.push({
        selector: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.toString().split(' ')[0] : ''),
        cursor: cs.cursor,
        transition: cs.transition,
        textPreview: el.textContent?.trim().slice(0, 40)
      });
    }
  });
  
  return JSON.stringify({ hoverTargets }, null, 2);
})();
```

For each hover target, use `browser_subagent` to:
1. Capture styles BEFORE hover
2. Hover over the element
3. Capture styles AFTER hover
4. Document the diff (color change, scale transform, shadow addition, underline, opacity)

### Step 4: Responsive Sweep
Use `browser_subagent` to test at 3 viewport widths:

1. **Desktop (1440px):** Capture layout structure
2. **Tablet (768px):** Note which sections change layout (multi-column → single column, sidebar disappears, font sizes change)
3. **Mobile (390px):** Note further layout changes, hidden elements, hamburger menus

For each breakpoint change, record the approximate pixel width where the change occurs.

### Step 5: Compile Behavioral Document

Write all findings to `docs/research/cloned-specs/BEHAVIORS.md`:

```markdown
# Behavioral Analysis — {hostname}
Analyzed: {date}
Source: {url}

## Scroll Behaviors
| Section | Behavior | Trigger | Details |
|---|---|---|---|
| Header | Shrinks + shadow | scroll > 50px | height: 80px → 60px, boxShadow added |
| Hero | Parallax | continuous scroll | backgroundPositionY at 0.5x rate |

## Click Interactions
| Element | Action | Result | Animation |
|---|---|---|---|
| Tab "Pricing" | click | Content swap | opacity 0→1, 300ms ease |
| Hamburger | click | Nav drawer opens | translateX slide, 250ms |

## Hover States
| Element | Property | Before | After | Transition |
|---|---|---|---|---|
| CTA Button | backgroundColor | #3b82f6 | #2563eb | 200ms ease |
| Card | transform | none | scale(1.02) | 300ms ease |

## Responsive Breakpoints
| Breakpoint | Changes |
|---|---|
| 1024px | Grid 3-col → 2-col |
| 768px | Sidebar hidden, nav → hamburger |
| 480px | Font sizes reduced, stacked layout |

## Detected Libraries
- Smooth scroll: {Lenis / Locomotive / None}
- Animation: {Framer Motion / GSAP / CSS only}
- Scroll snap: {Yes sections / No}

## Section Interaction Models
| Section | Model | Details |
|---|---|---|
| Hero | static | No interactions except CTA hover |
| Features | scroll-driven | Cards animate in via IntersectionObserver |
| Pricing | click-driven | Tab switcher for monthly/annual |
| Testimonials | time-driven | Auto-carousel, 5s interval |
```
