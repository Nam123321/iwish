---
name: token-extractor
description: 'Extract Design System tokens (colors, fonts, spacing, shadows, radius) from a target website via browser automation.'
---

# Token Extractor Sub-Skill

## Purpose
Extract the complete Design System of any live website — its color palette, typography scale, spacing rhythm, border radii, shadows, and animation keyframes. Output a structured Design Token document that can be used to initialize a project's design system or enrich a UI Spec.

## Prerequisites
- `browser_subagent` must be active and navigated to the target page

## Execution Steps

### Step 1: Extract Color Palette
Run this script via `browser_subagent`:

```javascript
// Extract all unique colors used across the page
(function() {
  const colorProps = ['color', 'backgroundColor', 'borderColor', 'borderTopColor',
    'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'outlineColor',
    'textDecorationColor', 'boxShadow'];
  const colors = new Set();
  const elements = document.querySelectorAll('*');
  const sample = [...elements].slice(0, 500); // sample first 500 elements
  
  sample.forEach(el => {
    const cs = getComputedStyle(el);
    colorProps.forEach(prop => {
      const val = cs[prop];
      if (val && val !== 'rgba(0, 0, 0, 0)' && val !== 'transparent' && val !== 'none'
          && val !== 'auto' && val !== 'currentcolor') {
        // Extract rgb/rgba values from complex properties like boxShadow
        const rgbMatches = val.match(/rgba?\([^)]+\)/g);
        if (rgbMatches) rgbMatches.forEach(c => colors.add(c));
        else if (val.startsWith('rgb') || val.startsWith('#')) colors.add(val);
      }
    });
    // Also check background-image for gradients
    const bg = cs.backgroundImage;
    if (bg && bg !== 'none') {
      const gradientColors = bg.match(/rgba?\([^)]+\)/g);
      if (gradientColors) gradientColors.forEach(c => colors.add(c));
    }
  });
  
  return JSON.stringify({
    totalColors: colors.size,
    colors: [...colors].sort()
  }, null, 2);
})();
```

### Step 2: Extract Typography Scale
```javascript
// Extract all unique font configurations
(function() {
  const fontConfigs = new Map();
  const elements = document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,button,label,li,td,th,input,textarea,blockquote,figcaption,code,pre');
  
  [...elements].slice(0, 300).forEach(el => {
    const cs = getComputedStyle(el);
    const key = `${cs.fontFamily}|${cs.fontSize}|${cs.fontWeight}|${cs.lineHeight}|${cs.letterSpacing}`;
    if (!fontConfigs.has(key)) {
      fontConfigs.set(key, {
        tag: el.tagName.toLowerCase(),
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform !== 'none' ? cs.textTransform : undefined,
        sampleText: el.textContent?.trim().slice(0, 50)
      });
    }
  });
  
  // Also check for Google Fonts or self-hosted fonts
  const fontLinks = [...document.querySelectorAll('link[href*="fonts.googleapis"], link[href*="fonts.gstatic"]')]
    .map(l => l.href);
  const fontFaces = [...document.styleSheets].flatMap(sheet => {
    try { return [...sheet.cssRules].filter(r => r instanceof CSSFontFaceRule).map(r => r.cssText); }
    catch(e) { return []; }
  });
  
  return JSON.stringify({
    totalConfigs: fontConfigs.size,
    typography: [...fontConfigs.values()],
    googleFontLinks: fontLinks,
    customFontFaces: fontFaces.slice(0, 10)
  }, null, 2);
})();
```

### Step 3: Extract Spacing, Radius & Shadows
```javascript
// Extract spacing patterns, border radii, and shadows
(function() {
  const spacings = new Set();
  const radii = new Set();
  const shadows = new Set();
  const elements = [...document.querySelectorAll('*')].slice(0, 300);
  
  elements.forEach(el => {
    const cs = getComputedStyle(el);
    // Spacings
    ['paddingTop','paddingRight','paddingBottom','paddingLeft',
     'marginTop','marginRight','marginBottom','marginLeft','gap'].forEach(p => {
      const v = cs[p];
      if (v && v !== '0px' && v !== 'auto' && v !== 'normal') spacings.add(v);
    });
    // Border radius
    const br = cs.borderRadius;
    if (br && br !== '0px') radii.add(br);
    // Box shadow
    const bs = cs.boxShadow;
    if (bs && bs !== 'none') shadows.add(bs);
  });
  
  return JSON.stringify({
    spacingValues: [...spacings].sort((a,b) => parseFloat(a) - parseFloat(b)),
    borderRadii: [...radii].sort((a,b) => parseFloat(a) - parseFloat(b)),
    boxShadows: [...shadows]
  }, null, 2);
})();
```

### Step 4: Extract Favicons & Meta
```javascript
// Extract meta information
(function() {
  return JSON.stringify({
    title: document.title,
    metaDescription: document.querySelector('meta[name="description"]')?.content,
    ogImage: document.querySelector('meta[property="og:image"]')?.content,
    favicons: [...document.querySelectorAll('link[rel*="icon"]')].map(l => ({
      href: l.href, sizes: l.sizes?.toString(), type: l.type
    })),
    themeColor: document.querySelector('meta[name="theme-color"]')?.content,
    manifest: document.querySelector('link[rel="manifest"]')?.href
  }, null, 2);
})();
```

### Step 5: Compile Design Token Document
Assemble all extracted data into a structured document:

```markdown
# Design Tokens — {hostname}
Extracted: {date}
Source: {url}

## Color Palette
| Token Name | Value | Usage |
|---|---|---|
| --primary | rgb(x,y,z) | Main CTA buttons, links |
| --background | rgb(x,y,z) | Page background |
| ... | ... | ... |

## Typography
| Level | Font Family | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| H1 | {family} | {size} | {weight} | {lh} | {ls} |
| Body | {family} | {size} | {weight} | {lh} | {ls} |
| ... | ... | ... | ... | ... | ... |

### Font Sources
- Google Fonts: {links}
- Self-hosted: {@font-face rules}

## Spacing Scale
{list all values in ascending order, identify the scale pattern}

## Border Radius
{list all values}

## Box Shadows
{list all shadow definitions with human-readable names}

## Site Meta
- Title: {title}
- Description: {description}
- Theme Color: {color}
```

Save to: `docs/research/cloned-specs/design-tokens.md`
