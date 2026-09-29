---
name: dom-extractor
description: 'Extract computed CSS styles from any DOM container using recursive getComputedStyle() injection via browser_subagent.'
---

# DOM Extractor Sub-Skill

## Purpose
Programmatically extract **exact** CSS values from any section of a live website by injecting JavaScript into the browser's DOM. This eliminates AI hallucination of CSS values — every pixel value, color, and spacing comes directly from `getComputedStyle()`.

## Prerequisites
- `browser_subagent` must be active and navigated to the target page
- You must know the CSS selector of the target container (e.g., `section.hero`, `#pricing`, `nav.main-nav`)

## Execution Steps

### Step 1: Identify Target Container
Determine the CSS selector for the section to extract. If unsure, run this discovery script first via `browser_subagent`:

```javascript
// List all major sections on the page
JSON.stringify(
  [...document.querySelectorAll('section, header, footer, main, nav, [role="banner"], [role="main"], [role="contentinfo"]')]
    .map((el, i) => ({
      index: i,
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: el.className?.toString().split(' ').slice(0, 3).join(' ') || null,
      childCount: el.children.length,
      textPreview: el.textContent?.trim().slice(0, 80)
    })),
  null, 2
);
```

### Step 2: Extract Computed Styles
Run the following extraction script via `browser_subagent`. Replace `SELECTOR` with the actual CSS selector:

```javascript
(function(selector) {
  const el = document.querySelector(selector);
  if (!el) return JSON.stringify({ error: 'Element not found: ' + selector });
  const props = [
    'fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color',
    'textTransform','textDecoration','backgroundColor','background',
    'padding','paddingTop','paddingRight','paddingBottom','paddingLeft',
    'margin','marginTop','marginRight','marginBottom','marginLeft',
    'width','height','maxWidth','minWidth','maxHeight','minHeight',
    'display','flexDirection','justifyContent','alignItems','gap',
    'gridTemplateColumns','gridTemplateRows',
    'borderRadius','border','borderTop','borderBottom','borderLeft','borderRight',
    'boxShadow','overflow','overflowX','overflowY',
    'position','top','right','bottom','left','zIndex',
    'opacity','transform','transition','cursor',
    'objectFit','objectPosition','mixBlendMode','filter','backdropFilter',
    'whiteSpace','textOverflow','WebkitLineClamp'
  ];
  function extractStyles(element) {
    const cs = getComputedStyle(element);
    const styles = {};
    props.forEach(p => {
      const v = cs[p];
      if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)') {
        styles[p] = v;
      }
    });
    return styles;
  }
  function walk(element, depth) {
    if (depth > 4) return null;
    const children = [...element.children];
    return {
      tag: element.tagName.toLowerCase(),
      classes: element.className?.toString().split(' ').slice(0, 5).join(' '),
      text: element.childNodes.length === 1 && element.childNodes[0].nodeType === 3
        ? element.textContent.trim().slice(0, 200) : null,
      styles: extractStyles(element),
      images: element.tagName === 'IMG' ? {
        src: element.src, alt: element.alt,
        naturalWidth: element.naturalWidth, naturalHeight: element.naturalHeight
      } : null,
      childCount: children.length,
      children: children.slice(0, 20).map(c => walk(c, depth + 1)).filter(Boolean)
    };
  }
  return JSON.stringify(walk(el, 0), null, 2);
})('SELECTOR');
```

### Step 3: Extract Multi-State Styles (If Applicable)
For elements with hover, scroll, or tab-switch states:

1. **Capture State A** — Run the extraction script at the default state
2. **Trigger the state change** via `browser_subagent`:
   - For hover: move mouse over the element
   - For scroll: scroll to the trigger position
   - For tabs: click the tab button
3. **Capture State B** — Re-run the extraction script
4. **Document the diff** explicitly:
   ```
   Property: backgroundColor
   State A: rgb(255, 255, 255)
   State B: rgb(0, 0, 0)
   Trigger: scroll past 100px
   Transition: all 0.3s ease
   ```

### Step 4: Write Component Spec File
Compile all extracted data into a Component Spec document following this template:

```markdown
# {ComponentName} Specification

## Overview
- **Target file:** `src/components/cloned/{ComponentName}.tsx`
- **Screenshot:** `docs/design-references/cloned/{screenshot}.png`
- **Interaction model:** {static | click-driven | scroll-driven | time-driven}

## DOM Structure
{Describe the element hierarchy — what contains what}

## Computed Styles (exact values from getComputedStyle)

### Container
- display: {value}
- padding: {value}
- maxWidth: {value}
{... every relevant property with exact values}

### {Child element 1}
- fontSize: {value}
- color: {value}
{... every relevant property}

## States & Behaviors
### {Behavior name}
- **Trigger:** {exact mechanism}
- **State A:** {before values}
- **State B:** {after values}
- **Transition:** {transition CSS}

## Assets
- Background image: `public/cloned-assets/{file}`
- Icons used: {list}

## Text Content (verbatim)
{Exact text copied from the live site}

## Responsive Behavior
- **Desktop (1440px):** {layout description}
- **Tablet (768px):** {what changes}
- **Mobile (390px):** {what changes}
```

Save the spec file to: `docs/research/cloned-specs/components/{ComponentName}.spec.md`

## Complexity Budget Rule
If the extraction output exceeds ~150 lines of meaningful spec content, the section is too complex for one component. Break it into sub-components and extract each separately.
