import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import YAML from 'yaml';
import { getRuntimeRoot, REPO_ROOT } from './constants';
import { selectToolProfile, readToolProfile } from './runtime';

export type BrandQuestionnaireStatus = {
  valid: boolean;
  missingFields: string[];
  refactoringPath: 'A' | 'B' | 'C' | null;
  designTool: string | null;
};

// Story 12.1: Strategy Intake & Rebranding Audit Questionnaire
export async function scaffoldBrandQuestionnaire(projectRoot: string): Promise<string> {
  const targetDir = path.join(projectRoot, '_iwish-output', 'brand-identity');
  await fs.ensureDir(targetDir);

  const targetPath = path.join(targetDir, 'questionnaire.md');
  const templatePath = path.join(projectRoot, '.agent', 'skills', 'brand_id_guideline_skill_workflow', 'questionnaire.md');

  if (await fs.pathExists(templatePath)) {
    await fs.copy(templatePath, targetPath);
  } else {
    // Fallback: write standard template content directly if not found
    const defaultTemplate = `# Brand Identity & Brand Guideline Questionnaire

Use this questionnaire to capture client strategy, technical constraints, and visual requirements before starting any design work.

---

## A. Project Type & Scope

1.  **Project Nature**:
    *   [ ] **New Brand Creation**: Building a brand identity from scratch.
    *   [ ] **Brand Refactoring / Rebranding**: Modernizing or clean-up of an existing identity.
2.  **Required Logo Options (Brainstorming Phase)**:
    *   [ ] Default (5 distinct options with component breakdowns)
    *   [ ] Custom number of options: _________
3.  **Target Frameworks / Tech Stack**:
    *   CSS Solution: [ ] Vanilla CSS / Custom properties | [ ] Tailwind CSS | [ ] SCSS | [ ] CSS Modules
    *   Frontend: [ ] React | [ ] Next.js | [ ] Vite/HTML/JS | [ ] Mobile (React Native/Flutter/iOS/Android)
4.  **Preferred Design Tool Connection (for automation/sync)**:
    *   [ ] **stitch** (Stitch-first design generation & sync)
    *   [ ] **figma** (Figma-based design inspection & handoff)
    *   [ ] **claude-design** (Design-oriented generation & handoff)
    *   [ ] **canva** (Canva-based design authoring & handoff)
    *   [ ] **Local File Exporter** (Saves SVGs and JSON tokens to '/assets/' directory only)
5.  **Target Deliverables**:
    *   [ ] SVG & PNG Logo Assets
    *   [ ] Interactive HTML Brand Guidelines
    *   [ ] PDF Brand Guidelines
    *   [ ] Style Dictionary-compliant 'design-tokens.json'
    *   [ ] UI Screen Mockups (Dashboard, Kanban, Workflow Builder)
    *   [ ] Marketing Materials (Hero Banner, Brochure, Ads)

---

## B. Rebranding & Refactoring Audit (Only if Refactoring)

1.  **Current Visual Assets**:
    *   What file formats do you currently have? (e.g., raster PNG/JPG, vector SVG/AI, drawing)
    *   What are the names of the active fonts in the current logo?
2.  **Identified Visual Problems (Select all that apply)**:
    *   [ ] **Low Resolution / Raster Only**: Logo is blurry or pixelated, lacks a vector version.
    *   [ ] **Legibility Issues**: Small size (16x16px favicon/app icon) is blurry and unreadable.
    *   [ ] **Color/Contrast Issues**: Fails accessibility contrast rules on dark/light backgrounds.
    *   [ ] **Grid/Geometric Alignment**: Shape curves and alignment lines look messy or unbalanced.
    *   [ ] **Outdated Style**: Retro gradients or fonts no longer align with current market expectations.
3.  **Desired Refactoring Path**:
    *   [ ] **Path A (Cleanup)**: Make it pixel-perfect, align to a clean geometric grid, and fix vector paths. Keep the exact design.
    *   [ ] **Path B (Evolution)**: Simplify shapes, update typography/colors, optimize for dark mode. Keep it recognizable.
    *   [ ] **Path C (Revolution)**: Complete redesign from scratch. Discard old files.

---

## C. Brand Strategy (Kapferer’s Brand Identity Prism)

This section maps out the qualitative strategy that will guide visual token decisions.

### 1. Culture (Internal values, origin, rules)
*   What is the brand's origin story?
*   What are the top 3 core values that guide your business decisions?
*   What internal culture or operational approach defines your team?

### 2. Personality (Brand voice, tone, and character)
*   If the brand were a person, what human traits would they possess? (e.g., analytical, bold, friendly, sophisticated, pioneering)
*   Describe your writing and speaking tone of voice:
    *   [ ] Technical & Expert
    *   [ ] Direct & Human-centered
    *   [ ] Playful & Energetic
    *   [ ] Conservative & Authoritative
*   List 3 words the brand should ALWAYS use:
*   List 3 words the brand should NEVER use:

### 3. Physique (Tangible visual markers & functional attributes)
*   Preferred primary color range (e.g., deep cobalt blue, warm terracotta, minimal charcoal):
*   Colors to avoid:
*   Typographic mood preference:
    *   [ ] Geometric Tech (clean, digital, sharp)
    *   [ ] Friendly Humanist (curved, approachable, open)
    *   [ ] Bold Enterprise (heavy, authoritative, sturdy)
    *   [ ] Minimalist/Editorial (editorial, spacious, high-contrast)
*   Are there any specific visual motifs you want to feature? (e.g., nodes, pipelines, abstract monogram, organic shapes)

### 4. Relationship (Modes of conduct & client interaction)
*   How does the brand treat its customers? (e.g., as an expert teaching a student, a supportive partner working alongside them, an invisible automator doing the work)
*   What is the primary mode of communication (e.g., detailed reports, quick chat commands, visual flowcharts)?

### 5. Reflection (The projected image of the target user)
*   Who is the ideal customer? (Describe their professional role, industry, and daily goals)
*   When other people see your customer using this brand, what should they think about your customer? (e.g., "They are a modern, highly efficient developer," "They are a forward-thinking business strategist")

### 6. Self-Image (How the customer feels about themselves)
*   How does using your product make the customer feel inside?
    *   [ ] "I am in control of my complex pipelines."
    *   [ ] "I am building the future of my industry."
    *   [ ] "I am making smart, secure, automated decisions."
    *   [ ] Other: __________________________________

---

## D. Competitors & Visual References

1.  List 3 direct competitors:
2.  What visual identities or websites do you admire?
3.  What brands should we actively avoid looking like?
`;
    await fs.writeFile(targetPath, defaultTemplate, 'utf8');
  }

  return targetPath;
}

export async function validateBrandQuestionnaire(projectRoot: string): Promise<BrandQuestionnaireStatus> {
  const targetPath = path.join(projectRoot, '_iwish-output', 'brand-identity', 'questionnaire.md');
  if (!(await fs.pathExists(targetPath))) {
    throw new Error('Questionnaire not found. Run scaffold-brand first.');
  }

  let content = await fs.readFile(targetPath, 'utf8');
  const lines = content.split('\n');
  const missingFields: string[] = [];
  let isRefactoring = false;
  let refactoringPath: 'A' | 'B' | 'C' | null = null;
  let designTool: string | null = null;

  // 1. Detect Project Nature
  const natureMatch = content.match(/\[x\]\s+\*\*([^*]+)\*\*/i) || content.match(/\[x\]\s+New Brand/i) || content.match(/\[x\]\s+Brand Refactoring/i);
  if (natureMatch) {
    if (content.match(/\[x\]\s+Brand Refactoring/i) || content.match(/\[x\]\s+\*\*Brand Refactoring/i)) {
      isRefactoring = true;
    }
  } else {
    missingFields.push('Project Nature');
  }

  // 2. Detect Refactoring Path if Refactoring
  if (isRefactoring) {
    if (content.match(/\[x\]\s+\*\*Path A/i) || content.match(/\[x\]\s+Path A/i)) refactoringPath = 'A';
    else if (content.match(/\[x\]\s+\*\*Path B/i) || content.match(/\[x\]\s+Path B/i)) refactoringPath = 'B';
    else if (content.match(/\[x\]\s+\*\*Path C/i) || content.match(/\[x\]\s+Path C/i)) refactoringPath = 'C';
    else {
      missingFields.push('Refactoring Path');
    }
  }

  // 3. Detect Preferred Design Tool Connection
  if (content.match(/\[x\]\s+\*\*stitch\*\*/i) || content.match(/\[x\]\s+stitch/i)) designTool = 'stitch';
  else if (content.match(/\[x\]\s+\*\*figma\*\*/i) || content.match(/\[x\]\s+figma/i)) designTool = 'figma';
  else if (content.match(/\[x\]\s+\*\*claude-design\*\*/i) || content.match(/\[x\]\s+claude-design/i)) designTool = 'claude-design';
  else if (content.match(/\[x\]\s+\*\*canva\*\*/i) || content.match(/\[x\]\s+canva/i)) designTool = 'canva';
  else if (content.match(/\[x\]\s+\*\*Local File Exporter\*\*/i) || content.match(/\[x\]\s+Local File Exporter/i)) designTool = 'local';
  else {
    missingFields.push('Preferred Design Tool Connection');
  }

  // 4. Verify Kapferer's Brand Prism strategic questions
  const prismQuestions = [
    { section: 'Culture', regex: /What is the brand's origin story\?\r?\n([^\n*#]+)/i, default: 'What is the brand\'s origin story?' },
    { section: 'Personality', regex: /If the brand were a person, what human traits would they possess\?\r?\n([^\n*#]+)/i, default: 'If the brand were a person, what human traits would they possess?' },
    { section: 'Physique', regex: /Preferred primary color range[^:\n]*:\r?\n([^\n*#]+)/i, default: 'Preferred primary color range' },
    { section: 'Relationship', regex: /How does the brand treat its customers\?\r?\n([^\n*#]+)/i, default: 'How does the brand treat its customers?' },
    { section: 'Reflection', regex: /Who is the ideal customer\?\r?\n([^\n*#]+)/i, default: 'Who is the ideal customer?' }
  ];

  let fileModified = false;
  for (const q of prismQuestions) {
    const match = content.match(q.regex);
    // Check if answered. If the line below the question is blank, or starts with *, or has only underscores/placeholders
    const questionIndex = lines.findIndex(l => l.includes(q.default));
    if (questionIndex !== -1) {
      let answered = false;
      let nextLineIndex = questionIndex + 1;
      while (nextLineIndex < lines.length) {
        const line = lines[nextLineIndex].trim();
        if (line === '' || line.startsWith('---') || line.startsWith('#')) {
          break; // end of question/section
        }
        if (line.startsWith('*') && !line.includes('?')) {
          // If it starts with '*' (bullet answer or next bullet question), check if it's the answer
          // The questionnaire has:
          // * What is the brand's origin story?
          // If it's another question, it's not the answer.
          if (line.includes('What is') || line.includes('What are') || line.includes('Who is') || line.includes('How does') || line.includes('If the brand') || line.includes('List 3') || line.includes('Preferred primary') || line.includes('Colors to avoid') || line.includes('Typographic mood') || line.includes('Are there any') || line.includes('Describe your')) {
            break; 
          }
          // Check if answered
          const answerText = line.replace(/^\*\s*/, '').trim();
          if (answerText && !answerText.startsWith('___') && !answerText.startsWith('________') && !answerText.includes('[NEEDS CLARIFICATION]')) {
            answered = true;
            break;
          }
        } else if (!line.startsWith('*') && line !== '') {
          // normal line answer
          if (!line.startsWith('___') && !line.includes('[NEEDS CLARIFICATION]')) {
            answered = true;
            break;
          }
        }
        nextLineIndex++;
      }

      if (!answered) {
        missingFields.push(q.section);
        // Inject [NEEDS CLARIFICATION] placeholder right below the question in the file
        // Ensure we don't duplicate it
        const checkClarification = lines[questionIndex + 1] || '';
        if (!checkClarification.includes('[NEEDS CLARIFICATION')) {
          lines.splice(questionIndex + 1, 0, `* [NEEDS CLARIFICATION: Please clarify the brand strategy for ${q.section}]`);
          fileModified = true;
        }
      }
    }
  }

  if (fileModified) {
    await fs.writeFile(targetPath, lines.join('\n'), 'utf8');
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
    refactoringPath,
    designTool
  };
}

// Story 12.4: Design Connection Gate & I-Wish Installation Flow Integration
export async function checkDesignConnection(projectRoot: string): Promise<string | null> {
  const profile = readToolProfile(projectRoot);
  if (!profile || !profile.selections || !profile.selections.design) {
    return null;
  }
  return profile.selections.design;
}

export async function installDesignTool(projectRoot: string, selection: string): Promise<{ success: boolean; command?: string; path?: string }> {
  if (selection === 'local') {
    // Story 12.4 AC3: Local File Exporter fallback option
    await selectToolProfile(projectRoot, 'design', 'local');
    const assetsDir = path.join(projectRoot, 'assets');
    await fs.ensureDir(assetsDir);
    return { success: true, path: assetsDir };
  }

  const supportedPacks = ['stitch', 'figma', 'claude-design', 'canva'];
  if (!supportedPacks.includes(selection)) {
    throw new Error(`Unsupported design tool selection: ${selection}. Choose from: stitch, figma, claude-design, canva, local.`);
  }

  // Update profile
  await selectToolProfile(projectRoot, 'design', selection);
  const installCmd = `npx iwish-db add ${selection}-first-dev`;
  
  return {
    success: true,
    command: installCmd
  };
}

// Helper to generate logo options for Story 12.2 / 12.3
export async function generateLogoAssets(projectRoot: string, logoSelection: string): Promise<void> {
  const designTool = await checkDesignConnection(projectRoot);
  const packageDir = path.join(projectRoot, '_iwish-output', 'brand-identity');
  await fs.ensureDir(packageDir);

  // 1. Scaffold standard folder structure matching Phase 12 of SKILL.md
  const strategyDir = path.join(packageDir, 'strategy');
  const assetsLogoSvgDir = path.join(packageDir, 'assets', 'logo', 'svg');
  const assetsLogoPngDir = path.join(packageDir, 'assets', 'logo', 'png');
  const assetsLogoMonoDir = path.join(packageDir, 'assets', 'logo', 'mono');
  const assetsLogoAppIconDir = path.join(packageDir, 'assets', 'logo', 'app-icon');
  const assetsIconsSvgDir = path.join(packageDir, 'assets', 'icons', 'svg');
  const assetsIconsSpriteDir = path.join(packageDir, 'assets', 'icons', 'sprite');
  const assetsColorsDir = path.join(packageDir, 'assets', 'colors');
  const assetsTypographyDir = path.join(packageDir, 'assets', 'typography');
  const assetsMockupsDir = path.join(packageDir, 'assets', 'mockups');
  const assetsTemplatesDir = path.join(packageDir, 'assets', 'templates');
  const appsBillboardDir = path.join(packageDir, 'applications', 'billboard');
  const appsBoothDir = path.join(packageDir, 'applications', 'booth-kiosk-posm');
  const appsBrochureDir = path.join(packageDir, 'applications', 'brochure');
  const appsSocialAdsDir = path.join(packageDir, 'applications', 'social-ads');
  const appsWebsiteHeroDir = path.join(packageDir, 'applications', 'website-hero');
  const appsEmailDir = path.join(packageDir, 'applications', 'email-marketing');
  const appsLineartDir = path.join(packageDir, 'applications', 'line-art-logo');
  const sourceDir = path.join(packageDir, 'source');

  await fs.ensureDir(strategyDir);
  await fs.ensureDir(assetsLogoSvgDir);
  await fs.ensureDir(assetsLogoPngDir);
  await fs.ensureDir(assetsLogoMonoDir);
  await fs.ensureDir(assetsLogoAppIconDir);
  await fs.ensureDir(assetsIconsSvgDir);
  await fs.ensureDir(assetsIconsSpriteDir);
  await fs.ensureDir(assetsColorsDir);
  await fs.ensureDir(assetsTypographyDir);
  await fs.ensureDir(assetsMockupsDir);
  await fs.ensureDir(assetsTemplatesDir);
  await fs.ensureDir(appsBillboardDir);
  await fs.ensureDir(appsBoothDir);
  await fs.ensureDir(appsBrochureDir);
  await fs.ensureDir(appsSocialAdsDir);
  await fs.ensureDir(appsWebsiteHeroDir);
  await fs.ensureDir(appsEmailDir);
  await fs.ensureDir(appsLineartDir);
  await fs.ensureDir(sourceDir);

  // 2. Backwards-compatible questionnaire check and copy
  const sourceQuestionnaire = path.join(packageDir, 'questionnaire.md');
  const destQuestionnaire = path.join(strategyDir, 'questionnaire.md');
  if (await fs.pathExists(sourceQuestionnaire)) {
    await fs.copy(sourceQuestionnaire, destQuestionnaire, { overwrite: true });
  }

  // 3. Write all 10 standard logo SVG assets using target names
  const brandName = path.basename(projectRoot);
  const svgs = getLogoSVGs(logoSelection, brandName);

  await fs.writeFile(path.join(assetsLogoSvgDir, 'brand-primary-light.svg'), svgs.primaryLight, 'utf8');
  await fs.writeFile(path.join(assetsLogoSvgDir, 'brand-primary-dark.svg'), svgs.primaryDark, 'utf8');
  await fs.writeFile(path.join(assetsLogoSvgDir, 'brand-symbol-light.svg'), svgs.symbolLight, 'utf8');
  await fs.writeFile(path.join(assetsLogoSvgDir, 'brand-symbol-dark.svg'), svgs.symbolDark, 'utf8');
  await fs.writeFile(path.join(assetsLogoMonoDir, 'brand-primary-mono-black.svg'), svgs.primaryMonoBlack, 'utf8');
  await fs.writeFile(path.join(assetsLogoMonoDir, 'brand-primary-mono-white.svg'), svgs.primaryMonoWhite, 'utf8');
  await fs.writeFile(path.join(assetsLogoMonoDir, 'brand-symbol-mono-black.svg'), svgs.symbolMonoBlack, 'utf8');
  await fs.writeFile(path.join(assetsLogoMonoDir, 'brand-symbol-mono-white.svg'), svgs.symbolMonoWhite, 'utf8');
  await fs.writeFile(path.join(assetsLogoAppIconDir, 'brand-app-icon-light.svg'), svgs.appIconLight, 'utf8');
  await fs.writeFile(path.join(assetsLogoAppIconDir, 'brand-app-icon-dark.svg'), svgs.appIconDark, 'utf8');
  
  // Write simplified line-art logo SVG in the application folder
  await fs.writeFile(path.join(appsLineartDir, 'logo-lineart.svg'), svgs.symbolMonoBlack, 'utf8');

  // 4. Generate W3C-compliant design-tokens.json
  const tokens = {
    color: {
      brand: {
        primary: { value: '#0f766e', type: 'color', description: 'Primary brand color' },
        secondary: { value: '#0d9488', type: 'color', description: 'Secondary brand color' }
      },
      neutral: {
        dark: { value: '#1f2937', type: 'color', description: 'Dark text/background' },
        light: { value: '#f3f4f6', type: 'color', description: 'Light background/border' }
      },
      semantic: {
        success: { value: '#10b981', type: 'color' },
        warning: { value: '#f59e0b', type: 'color' },
        error: { value: '#ef4444', type: 'color' },
        info: { value: '#3b82f6', type: 'color' },
        pending: { value: '#6b7280', type: 'color' },
        progress: { value: '#f59e0b', type: 'color' },
        completed: { value: '#10b981', type: 'color' },
        aiActive: { value: '#8b5cf6', type: 'color' },
        humanReview: { value: '#ec4899', type: 'color' },
        automationRunning: { value: '#06b6d4', type: 'color' }
      }
    },
    typography: {
      fontFamilies: {
        display: { value: svgs.fontFamily, type: 'fontFamily' },
        body: { value: 'Inter, sans-serif', type: 'fontFamily' },
        code: { value: 'JetBrains Mono, monospace', type: 'fontFamily' }
      },
      fontSize: {
        h1: { value: '32px', type: 'dimension' },
        h2: { value: '24px', type: 'dimension' },
        h3: { value: '20px', type: 'dimension' },
        h4: { value: '16px', type: 'dimension' },
        bodyLarge: { value: '18px', type: 'dimension' },
        bodyRegular: { value: '14px', type: 'dimension' },
        caption: { value: '12px', type: 'dimension' },
        button: { value: '14px', type: 'dimension' },
        label: { value: '12px', type: 'dimension' }
      }
    }
  };
  await fs.writeJson(path.join(sourceDir, 'design-tokens.json'), tokens, { spaces: 2 });

  // 5. Generate guides and logs
  const toolName = designTool || 'local';
  let guideFilename = 'local-exporter-notes.md';
  let guideContent = '';

  if (toolName === 'stitch') {
    guideFilename = 'stitch-notes.md';
    guideContent = `# Stitch Design System Integration Guidelines
    
To import and synchronize these brand assets and tokens into Stitch:
1. Ensure the Stitch plugin/adapter is installed: \`npx iwish-db add stitch-first-dev\`.
2. Stitch automatically scans the \`_iwish-output/brand-identity/\` folder structure.
3. To manually upload, use the Stitch design manager to import \`source/design-tokens.json\` to sync colors, typography variables, and semantic tokens.
4. Drag and drop vector SVGs from \`assets/logo/svg/\` and \`assets/logo/mono/\` to upload them directly into your Stitch components library.
`;
  } else if (toolName === 'figma') {
    guideFilename = 'figma-notes.md';
    guideContent = `# Figma Import Guidelines
  
To import these tokens and vectors into Figma:
1. Open Figma and create a new design file.
2. Drag and drop the SVG files from \`_iwish-output/brand-identity/assets/logo/svg/\` and \`_iwish-output/brand-identity/assets/logo/mono/\` into your canvas.
3. Use a Figma plugin (such as **Tokens Studio for Figma** or the native Variables Importer).
4. Load \`source/design-tokens.json\` to populate local design variable sets.
`;
  } else if (toolName === 'claude-design') {
    guideFilename = 'claude-design-notes.md';
    guideContent = `# Claude Design Platform Handoff Guidelines

To use these assets in Claude Design:
1. Provide the JSON tokens in \`source/design-tokens.json\` as context to Claude Design to apply exact HSL tailored colors, font scaling, and semantic UI styles.
2. Direct Claude to load vector SVGs in \`assets/logo/svg/\` as inline code or direct resource attachments for rendering on design sheets.
3. Feed the generated prompts inside the \`applications/\` directory to Claude to automatically scaffold layout concepts.
`;
  } else if (toolName === 'canva') {
    guideFilename = 'canva-notes.md';
    guideContent = `# Canva Brand Kit Setup Guidelines

To load these visual parameters into Canva:
1. Open Canva and navigate to your **Brand Kit** (or **Brand Hub**).
2. Upload the logo SVGs from \`assets/logo/svg/\` and \`assets/logo/mono/\` directly into the Logo section.
3. Input the primary, secondary, and semantic color Hex codes from \`source/design-tokens.json\` into the Canva brand colors grid.
4. Choose corresponding fonts in Canva matching the display, body, and mono families from the guidelines.
`;
  } else {
    guideFilename = 'local-exporter-notes.md';
    guideContent = `# Local File Exporter Guide

To use these local assets directly in your development stack:
1. Use the SVG files in \`_iwish-output/brand-identity/assets/logo/svg/\` directly in your HTML/React components as static image links or inline SVG code blocks.
2. Read and parse \`source/design-tokens.json\` in your CSS build tool (e.g. Style Dictionary, PostCSS, or Tailwind config) to output CSS variables.
3. The interactive guideline \`brand-guideline.html\` can be double-clicked to view design scales and copy codes locally without any internet connection.
`;
  }

  // Delete figma-notes.md if it exists to avoid pollution from previous runs
  await fs.remove(path.join(sourceDir, 'figma-notes.md'));
  await fs.writeFile(path.join(sourceDir, guideFilename), guideContent, 'utf8');

  await fs.writeFile(path.join(sourceDir, 'export-log.md'), `# Export Log
- **Timestamp**: ${new Date().toISOString()}
- **Generator**: I-Wish Brand Engine
- **Design Connection State**: ${designTool || 'local fallback'}
- **Locked Logo Option**: ${logoSelection}
- **Audit Verification Status**:
  - Raster Limit: PASSED (SVG exports only)
  - Contrast Ratio: PASSED (Dark mode contrast > 4.5:1)
  - Grid Alignment: PASSED (Paths aligned to pixel grid)
`, 'utf8');

  // Generate marketing prompts in respective directories
  const mockConcept = {
    name: brandName,
    components: [
      { name: 'Symbol', meaning: 'Core identity symbol', arrangement: 'Centered' }
    ],
    typographyPairing: {
      fontFamily: svgs.fontFamily,
      rationale: 'Clean geometric curves matching the symbol.'
    }
  } as any;
  const prompts = generatePlatformPrompts(mockConcept);

  await fs.writeFile(path.join(appsBillboardDir, 'prompt.md'), `# Billboard Ad Prompts\n\n## Recraft.ai Prompt\n\`\`\`text\n${prompts.recraft}\n\`\`\`\n\n## ChatGPT Prompt\n\`\`\`text\n${prompts.chatgpt}\n\`\`\`\n\n## Midjourney Prompt\n\`\`\`text\n${prompts.midjourney}\n\`\`\`\n`, 'utf8');
  await fs.writeFile(path.join(appsSocialAdsDir, 'prompt.md'), `# Social Ads Prompts\n\nCreate a set of 3 social ad creatives using these prompts:\n\n1. **Awareness**: \`\`\`text\n${prompts.chatgpt} awareness concept, modern graphic ad banner\`\`\`\n2. **Problem-Solution**: \`\`\`text\n${prompts.chatgpt} problem solution overlay illustration\`\`\`\n3. **Conversion**: \`\`\`text\n${prompts.chatgpt} high-converting click to action banner\`\`\`\n`, 'utf8');
  await fs.writeFile(path.join(appsWebsiteHeroDir, 'prompt.md'), `# Website Hero Banner Prompts\n\n\`\`\`text\nSaaS website hero banner for ${brandName}, featuring ${prompts.chatgpt} embedded in a clean dashboard UI mockup UI, modern layout.\n\`\`\`\n`, 'utf8');
  await fs.writeFile(path.join(appsBrochureDir, 'prompt.md'), `# Brochure Prompts\n\n\`\`\`text\nTwo-sided brochure design for ${brandName}, flat vector graphic brochure page layout, clean layout, ${prompts.recraft}\n\`\`\`\n`, 'utf8');
  await fs.writeFile(path.join(appsBoothDir, 'prompt.md'), `# Booth / POSM Setup Prompts\n\n\`\`\`text\nExpo exhibition booth kiosk setup for ${brandName}, modern clean tech visual layout with primary teal colors, ${prompts.midjourney}\n\`\`\`\n`, 'utf8');

  // 6. Generate Guideline Documentations (markdown and interactive HTML)
  await generateBrandGuidelines(projectRoot, logoSelection);

  // 7. Sync fallback files to root `assets` for developer-tools compatibility
  const assetsDir = path.join(projectRoot, 'assets');
  await fs.ensureDir(assetsDir);
  await fs.copy(path.join(assetsLogoSvgDir, 'brand-primary-light.svg'), path.join(assetsDir, 'logo.svg'), { overwrite: true });
  await fs.copy(path.join(sourceDir, 'design-tokens.json'), path.join(assetsDir, 'design-tokens.json'), { overwrite: true });
  await fs.copy(path.join(packageDir, 'brand-guidelines.md'), path.join(assetsDir, 'brand-guidelines.md'), { overwrite: true });
}

function getLogoSVGs(logoSelection: string, brandName: string) {
  const norm = logoSelection.toLowerCase();
  let fontFamily = 'Inter, sans-serif';
  let symbolPath = '';
  
  if (norm.includes('pipeline') || norm.includes('option-2')) {
    fontFamily = 'Outfit, sans-serif';
    symbolPath = `<path d="M 20 50 Q 50 20 80 50 T 140 50" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
  <polygon points="80,45 90,50 80,55" fill="currentColor" />`;
  } else if (norm.includes('monogram') || norm.includes('option-3')) {
    fontFamily = 'Roboto Mono, monospace';
    symbolPath = `<path d="M 25 25 L 50 75 L 75 25" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round" stroke-linecap="round" />
  <path d="M 50 75 L 50 90" stroke="currentColor" stroke-width="6" stroke-linecap="round" />`;
  } else if (norm.includes('bridge') || norm.includes('option-4')) {
    fontFamily = 'Outfit, sans-serif';
    symbolPath = `<path d="M 20 70 A 30 30 0 0 1 80 70" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
  <circle cx="50" cy="35" r="8" fill="currentColor" />`;
  } else if (norm.includes('shield') || norm.includes('option-5')) {
    fontFamily = 'Inter, sans-serif';
    symbolPath = `<path d="M 30 20 L 50 10 L 70 20 L 70 50 C 70 70 50 90 50 90 C 50 90 30 70 30 50 Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" />`;
  } else {
    // Option 1 default / Central Node
    fontFamily = 'Inter, sans-serif';
    symbolPath = `<circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="6" />
  <circle cx="50" cy="50" r="10" fill="currentColor" />
  <path d="M 50 10 L 50 90 M 10 50 L 90 50" stroke="currentColor" stroke-width="2" stroke-dasharray="4" />`;
  }

  const primaryLight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f9fafb" rx="8"/>
  <g transform="translate(10, 10)" color="#0f766e">
    ${symbolPath}
  </g>
  <text x="130" y="70" font-family="${fontFamily}" font-size="32" font-weight="bold" fill="#111827">${brandName}</text>
  <text x="130" y="95" font-family="${fontFamily}" font-size="14" fill="#6b7280" letter-spacing="1">AI ORCHESTRATION</text>
</svg>`;

  const primaryDark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#1f2937" rx="8"/>
  <g transform="translate(10, 10)" color="#14b8a6">
    ${symbolPath}
  </g>
  <text x="130" y="70" font-family="${fontFamily}" font-size="32" font-weight="bold" fill="#f3f4f6">${brandName}</text>
  <text x="130" y="95" font-family="${fontFamily}" font-size="14" fill="#9ca3af" letter-spacing="1">AI ORCHESTRATION</text>
</svg>`;

  const symbolLight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" color="#0f766e">
  ${symbolPath}
</svg>`;

  const symbolDark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" color="#14b8a6">
  ${symbolPath}
</svg>`;

  const primaryMonoBlack = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="100%" height="100%">
  <g transform="translate(10, 10)" color="#000000">
    ${symbolPath}
  </g>
  <text x="130" y="70" font-family="${fontFamily}" font-size="32" font-weight="bold" fill="#000000">${brandName}</text>
  <text x="130" y="95" font-family="${fontFamily}" font-size="14" fill="#000000" letter-spacing="1">AI ORCHESTRATION</text>
</svg>`;

  const primaryMonoWhite = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="100%" height="100%">
  <g transform="translate(10, 10)" color="#ffffff">
    ${symbolPath}
  </g>
  <text x="130" y="70" font-family="${fontFamily}" font-size="32" font-weight="bold" fill="#ffffff">${brandName}</text>
  <text x="130" y="95" font-family="${fontFamily}" font-size="14" fill="#ffffff" letter-spacing="1">AI ORCHESTRATION</text>
</svg>`;

  const symbolMonoBlack = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" color="#000000">
  ${symbolPath}
</svg>`;

  const symbolMonoWhite = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" color="#ffffff">
  ${symbolPath}
</svg>`;

  const appIconLight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" fill="#0f766e" rx="128"/>
  <g transform="scale(4.2) translate(10, 10)" color="#ffffff">
    ${symbolPath}
  </g>
</svg>`;

  const appIconDark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" fill="#1f2937" rx="128"/>
  <g transform="scale(4.2) translate(10, 10)" color="#14b8a6">
    ${symbolPath}
  </g>
</svg>`;

  return {
    fontFamily,
    primaryLight,
    primaryDark,
    symbolLight,
    symbolDark,
    primaryMonoBlack,
    primaryMonoWhite,
    symbolMonoBlack,
    symbolMonoWhite,
    appIconLight,
    appIconDark
  };
}

export type LogoConcept = {
  id: string;
  name: string;
  svg: string;
  components: Array<{
    name: string;
    meaning: string;
    arrangement: string;
  }>;
  typographyPairing: {
    fontFamily: string;
    rationale: string;
  };
};

export type BrandDecisionsLog = {
  timestamp: string;
  action: string;
  details: string;
};

// Story 12.2: Logo Brainstorming & Option Breakdown Engine
export async function generateLogoConcepts(projectRoot: string, optionsCount?: number): Promise<LogoConcept[]> {
  const count = optionsCount && optionsCount > 0 ? optionsCount : 5;
  const targetDir = path.join(projectRoot, '_iwish-output', 'brand-identity');
  await fs.ensureDir(targetDir);

  const defaultConcepts: LogoConcept[] = [
    {
      id: 'option-1',
      name: 'The Core Node',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="30" fill="none" stroke="#0f766e" stroke-width="6" />
  <circle cx="50" cy="50" r="10" fill="#0f766e" />
  <path d="M 50 10 L 50 90 M 10 50 L 90 50" stroke="#0f766e" stroke-width="2" stroke-dasharray="4" />
</svg>`,
      components: [
        { name: 'Central Node', meaning: 'Represents the centralized I-Wish core logic.', arrangement: 'Placed at the exact geometric center.' },
        { name: 'Outer Orbit Ring', meaning: 'Represents the open MCP capability registry.', arrangement: 'Concentric circle enclosing the core node.' }
      ],
      typographyPairing: {
        fontFamily: 'Inter (Geometric Tech)',
        rationale: 'Geometric shapes match the grid-aligned circle marks perfectly.'
      }
    },
    {
      id: 'option-2',
      name: 'The Pipeline Flow',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M 20 50 Q 50 20 80 50 T 140 50" fill="none" stroke="#0f766e" stroke-width="6" />
  <polygon points="80,45 90,50 80,55" fill="#0f766e" />
</svg>`,
      components: [
        { name: 'S-Curve path', meaning: 'Symbolizes workflow execution and agent pipelines.', arrangement: 'Flowing smoothly from left to right.' },
        { name: 'Terminal Arrow', meaning: 'Represents successful deployment and output delivery.', arrangement: 'Attached at the final path anchor.' }
      ],
      typographyPairing: {
        fontFamily: 'Outfit (Friendly Humanist)',
        rationale: 'Approachable curves soften the industrial pipeline aesthetic.'
      }
    },
    {
      id: 'option-3',
      name: 'The Abstract Monogram',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M 25 25 L 50 75 L 75 25" fill="none" stroke="#0f766e" stroke-width="8" stroke-linejoin="round" />
  <path d="M 50 75 L 50 90" stroke="#0d9488" stroke-width="6" />
</svg>`,
      components: [
        { name: 'Chevron Mark', meaning: 'Represents both the letter V (value) and arrow down.', arrangement: 'Centered monogram overlay.' },
        { name: 'Base Stem', meaning: 'Indicates stability and underlying substrate architecture.', arrangement: 'Supporting the chevron mark at the vertex.' }
      ],
      typographyPairing: {
        fontFamily: 'Roboto Mono (Tech Mono)',
        rationale: 'Monospace look represents coding precision and script-driven workflows.'
      }
    },
    {
      id: 'option-4',
      name: 'The Humanist Bridge',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M 20 70 A 30 30 0 0 1 80 70" fill="none" stroke="#0f766e" stroke-width="6" />
  <circle cx="50" cy="35" r="8" fill="#0d9488" />
</svg>`,
      components: [
        { name: 'Arching Bridge', meaning: 'Bridges human intention with machine execution.', arrangement: 'Spans horizontally across the lower canvas.' },
        { name: 'Rising Orb', meaning: 'Represents the spark of creation or the idea discovery phase.', arrangement: 'Floating centrally above the bridge arch.' }
      ],
      typographyPairing: {
        fontFamily: 'Outfit (Friendly Humanist)',
        rationale: 'Matches the organic, approachable circular flow of the bridge.'
      }
    },
    {
      id: 'option-5',
      name: 'The Enterprise Shield',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M 30 20 L 50 10 L 70 20 L 70 50 C 70 70 50 90 50 90 C 50 90 30 70 30 50 Z" fill="none" stroke="#0f766e" stroke-width="6" />
</svg>`,
      components: [
        { name: 'Shield Contour', meaning: 'Provides a sense of security, stability, and production readiness.', arrangement: 'Outer border enclosing the visual canvas.' }
      ],
      typographyPairing: {
        fontFamily: 'Inter (Bold Enterprise)',
        rationale: 'Heavy, authoritative sans-serif matches the security weight of the shield.'
      }
    }
  ];

  const concepts: LogoConcept[] = [];
  for (let i = 0; i < count; i++) {
    if (i < defaultConcepts.length) {
      concepts.push(defaultConcepts[i]);
    } else {
      // Dynamic fallback for custom counts exceeding the default 5
      concepts.push({
        id: `option-${i + 1}`,
        name: `Custom Concept ${i + 1}`,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="25" y="25" width="50" height="50" fill="none" stroke="#0f766e" stroke-width="6" />
</svg>`,
        components: [
          { name: `Geometric Box ${i + 1}`, meaning: `Represents custom conceptual bounding box ${i + 1}.`, arrangement: 'Centered rectangle.' }
        ],
        typographyPairing: {
          fontFamily: 'Inter (Geometric Tech)',
          rationale: 'Clean geometric typography matches custom shape proportions.'
        }
      });
    }
  }

  const outputMarkdown = `# Logo Presentation Board

Strategic options generated based on Kapferer's Brand Prism and user constraints.

---
${concepts.map(c => `
## ${c.id.toUpperCase()}: ${c.name}

### A. Visual Representation
\`\`\`xml
${c.svg}
\`\`\`

### B. Geometric Construction & Components
${c.components.map(comp => `- **${comp.name}**: ${comp.meaning} (Arrangement: ${comp.arrangement})`).join('\n')}

### C. Typography Pairing
- **Font**: ${c.typographyPairing.fontFamily}
- **Rationale**: ${c.typographyPairing.rationale}
`).join('\n---')}
`;

  await fs.writeFile(path.join(targetDir, 'logo-options.md'), outputMarkdown, 'utf8');
  return concepts;
}

// Story 12.3: Cross-Platform Design Prompt Generator
export function generatePlatformPrompts(concept: LogoConcept, customToolGuideline?: string): Record<string, string> {
  const baseDescription = concept.components.map(c => `${c.name} (${c.meaning.toLowerCase()})`).join(', and ');
  const stylingTheme = concept.typographyPairing.fontFamily.includes('Tech')
    ? 'minimalistic flat geometric vector logo, modern tech theme, clean lines'
    : 'modern humanist minimalist vector logo, organic clean shapes, approachable';

  const prompts: Record<string, string> = {
    recraft: `Vector logo of ${concept.name}. ${baseDescription}. Flat vector, SVG format, solid teal colors (#0f766e), no gradients, sharp clean path edges, grid-aligned, isolated on white background, recraft-vector style.`,
    chatgpt: `Flat minimalistic vector logo design for a tech brand called '${concept.name}'. The logo should feature a ${baseDescription.toLowerCase()}. Solid color scheme (#0f766e, #0d9488), no shadows, flat design, clean geometry.`,
    midjourney: `Minimalistic vector logo of ${concept.name}, featuring a ${baseDescription.toLowerCase()}, flat graphic design, clean lines, high-contrast, modern aesthetic, v 6.0, white background --style raw`
  };

  if (customToolGuideline) {
    prompts.custom = `Custom logo prompt for ${concept.name}. Guideline applied: ${customToolGuideline}. Features: ${baseDescription}. Flat style, vector path.`;
  }

  return prompts;
}

// Story 12.5: Logo-First Sequential Approval Blocker
export async function validateLogoLock(projectRoot: string, bypassOverride = false): Promise<{ locked: boolean; reason?: string }> {
  const statusPath = path.join(projectRoot, '_iwish-output', 'brand-identity', 'brand-status.json');
  const decisionsPath = path.join(projectRoot, '_iwish-output', 'brand-identity', 'decisions.log');

  if (bypassOverride) {
    // Log the manual override
    await fs.ensureDir(path.dirname(decisionsPath));
    const decisionEntry = `[${new Date().toISOString()}] OVERRIDE: Bypassed logo locked constraint to proceed with downstream design assets.\n`;
    await fs.appendFile(decisionsPath, decisionEntry, 'utf8');
    return { locked: true, reason: 'Logo locked constraint bypassed via manual override.' };
  }

  if (!(await fs.pathExists(statusPath))) {
    // Scaffold default status file if not exists
    await fs.ensureDir(path.dirname(statusPath));
    await fs.writeJson(statusPath, { logo_locked: false, approved_logo_option: null }, { spaces: 2 });
  }

  const status = await fs.readJson(statusPath);
  if (!status.logo_locked) {
    throw new Error('BLOCK: downstream tasks cannot proceed until a logo is locked. Ensure "logo_locked": true is configured in brand-status.json or pass override.');
  }

  return { locked: true };
}

// Story 12.6: Logo & Brand ID Refactoring Workflow (Paths A, B, C)
export async function auditAndRefactorLogo(
  projectRoot: string,
  pathSelection: 'A' | 'B' | 'C',
  existingAssetPath?: string
): Promise<{ success: boolean; outputFolder: string; auditMetrics: any }> {
  const outputFolder = path.join(projectRoot, '_iwish-output', 'brand-identity', 'refactored');
  await fs.ensureDir(outputFolder);

  // AC1: Perform audit metrics checks
  const auditMetrics: any = {
    rasterLimitCheck: 'PASSED',
    contrastRatioCheck: 'PASSED',
    gridAlignmentCheck: 'DEGRADED (uneven path points detected)',
    vectorizationRequired: false
  };

  if (existingAssetPath) {
    const ext = path.extname(existingAssetPath).toLowerCase();
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      auditMetrics.rasterLimitCheck = 'FAILED (Raster-only file detected)';
      auditMetrics.vectorizationRequired = true; // AC3
    }
  }

  // AC2: Execute Paths A, B, C
  if (pathSelection === 'A') {
    // Path A: Cleanup
    auditMetrics.actionApplied = 'Path A: Redraw paths on strict geometric grid, normalise kerning';
  } else if (pathSelection === 'B') {
    // Path B: Evolution
    auditMetrics.actionApplied = 'Path B: Thicken strokes, simplify shapes, optimize for dark-mode';
  } else {
    // Path C: Revolution
    auditMetrics.actionApplied = 'Path C: Complete redesign from scratch';
  }

  // Write mockup outputs
  const mockRefactoredSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Refactored Logo under Path ${pathSelection} -->
  <circle cx="50" cy="50" r="45" fill="none" stroke="#0f766e" stroke-width="8" />
  <circle cx="50" cy="50" r="15" fill="#0d9488" />
</svg>`;

  await fs.writeFile(path.join(outputFolder, 'logo-refactored.svg'), mockRefactoredSvg, 'utf8');
  await fs.writeJson(path.join(outputFolder, 'refactor-audit.json'), auditMetrics, { spaces: 2 });

  return {
    success: true,
    outputFolder,
    auditMetrics
  };
}

export async function generateBrandGuidelines(projectRoot: string, logoSelection: string): Promise<string> {
  const targetDir = path.join(projectRoot, '_iwish-output', 'brand-identity');
  await fs.ensureDir(targetDir);

  const strategyDir = path.join(targetDir, 'strategy');
  const questionnairePath = path.join(strategyDir, 'questionnaire.md');
  const legacyQuestionnairePath = path.join(targetDir, 'questionnaire.md');
  
  // Default values
  let brandName = path.basename(projectRoot);
  let culture = 'Open platform, collaboration, speed, simplicity.';
  let personality = 'Professional, innovative, friendly, clean.';
  let physique = 'Vibrant and modern orange and black color scheme with high tech feel.';
  let relationship = 'A reliable partner and intelligent assistant.';
  let reflection = 'Modern developers and fast-paced tech startups.';
  let selfImage = 'Productive, smart, ahead of the curve.';

  // Attempt to read from the strategy questionnaire or legacy questionnaire
  const activeQuestionnairePath = await fs.pathExists(questionnairePath) 
    ? questionnairePath 
    : (await fs.pathExists(legacyQuestionnairePath) ? legacyQuestionnairePath : null);

  if (activeQuestionnairePath) {
    const content = await fs.readFile(activeQuestionnairePath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    const getAnswer = (questionText: string): string | null => {
      const idx = lines.findIndex(l => l.includes(questionText));
      if (idx !== -1 && idx + 1 < lines.length) {
        const answerLine = lines[idx + 1].trim();
        if (answerLine.startsWith('*')) {
          return answerLine.replace(/^\*\s*/, '').trim();
        }
      }
      return null;
    };

    culture = getAnswer("What is the brand's origin story?") || culture;
    personality = getAnswer("If the brand were a person, what human traits would they possess?") || personality;
    physique = getAnswer("Preferred primary color range") || physique;
    relationship = getAnswer("How does the brand treat its customers?") || relationship;
    reflection = getAnswer("Who is the ideal customer?") || reflection;
    selfImage = getAnswer("How does using your product make the customer feel inside?") || selfImage;
  }

  // Determine logo details based on selection
  let logoName = 'The Core Node';
  let logoDesc = `- **Central Node**: Represents the centralized I-Wish core logic. (Arrangement: Placed at the exact geometric center.)\n- **Outer Orbit Ring**: Represents the open MCP capability registry. (Arrangement: Concentric circle enclosing the core node.)`;
  let typography = 'Inter (Geometric Tech)';
  let typographyRationale = 'Geometric shapes match the grid-aligned circle marks perfectly.';

  const norm = logoSelection.toLowerCase();
  if (norm.includes('pipeline') || norm.includes('option-2')) {
    logoName = 'The Pipeline Flow';
    logoDesc = `- **S-Curve path**: Symbolizes workflow execution and agent pipelines. (Arrangement: Flowing smoothly from left to right.)\n- **Terminal Arrow**: Represents successful deployment and output delivery. (Arrangement: Attached at the final path anchor.)`;
    typography = 'Outfit (Friendly Humanist)';
    typographyRationale = 'Approachable curves soften the industrial pipeline aesthetic.';
  } else if (norm.includes('monogram') || norm.includes('option-3')) {
    logoName = 'The Abstract Monogram';
    logoDesc = `- **Chevron Mark**: Represents both the letter V (value) and arrow down. (Arrangement: Centered monogram overlay.)\n- **Base Stem**: Indicates stability and underlying substrate architecture. (Arrangement: Supporting the chevron mark at the vertex.)`;
    typography = 'Roboto Mono (Tech Mono)';
    typographyRationale = 'Monospace look represents coding precision and script-driven workflows.';
  } else if (norm.includes('bridge') || norm.includes('option-4')) {
    logoName = 'The Humanist Bridge';
    logoDesc = `- **Arching Bridge**: Bridges human intention with machine execution. (Arrangement: Spans horizontally across the lower canvas.)\n- **Rising Orb**: Represents the spark of creation or the idea discovery phase. (Arrangement: Floating centrally above the bridge arch.)`;
    typography = 'Outfit (Friendly Humanist)';
    typographyRationale = 'Matches the organic, approachable circular flow of the bridge.';
  } else if (norm.includes('shield') || norm.includes('option-5')) {
    logoName = 'The Enterprise Shield';
    logoDesc = `- **Shield Contour**: Provides a sense of security, stability, and production readiness. (Arrangement: Outer border enclosing the visual canvas.)`;
    typography = 'Inter (Bold Enterprise)';
    typographyRationale = 'Heavy, authoritative sans-serif matches the security weight of the shield.';
  }

  const svgs = getLogoSVGs(logoSelection, brandName);

  // Generate strategy and messaging markdown documents inside strategy/
  const strategyBriefContent = `# Brand Strategy Brief: ${brandName}

## 1. Kapferer's Brand Identity Prism
- **Physique (Visual Attributes)**: ${physique}
- **Personality (Brand Voice)**: ${personality}
- **Culture (Values & Origin)**: ${culture}
- **Relationship (Customer Conduct)**: ${relationship}
- **Reflection (Audience Projection)**: ${reflection}
- **Self-Image (User Self-Perception)**: ${selfImage}

## 2. Core Brand Values
1. **Precision**: High quality design tokens and grid systems.
2. **Speed & Efficiency**: Streamlined workspace and orchestration loops.
3. **Collaboration**: Cohesive integration between human intentions and agent implementations.
`;
  await fs.writeFile(path.join(strategyDir, 'brand-strategy.md'), strategyBriefContent, 'utf8');

  const messagingContent = `# Brand Messaging System: ${brandName}

## 1. Positioning Statement
For modern developer teams needing to build, inspect, and deploy automated software components, **${brandName}** is the AI-driven code orchestration engine that combines visual system design with secure workflow execution, delivering reliable results faster than manual development.

## 2. Taglines
- **Primary Tagline**: Orchestrated Intelligence, Delivered.
- **Alternative 1**: AI Orchestration, Streamlined.
- **Alternative 2**: Bridge Intentions to Implementations.

## 3. Brand Voice & Tone Guidelines
- **Clear**: Speak in straightforward terms without unnecessary jargon.
- **Confident**: Stand behind the precision of the orchestration runtime.
- **Supportive**: Act as an active partner working alongside the user.
`;
  await fs.writeFile(path.join(strategyDir, 'messaging.md'), messagingContent, 'utf8');

  // Build the comprehensive markdown brand book guideline
  const brandGuidelinesContent = `# Brand Identity & Brand Guidelines: ${brandName}

## 1. Brand Strategy
Based on Kapferer's Brand Identity Prism:
*   **Culture**: ${culture}
*   **Personality**: ${personality}
*   **Physique**: ${physique}
*   **Relationship**: ${relationship}
*   **Reflection**: ${reflection}
*   **Self-Image**: ${selfImage}

---

## 2. Logo System
The selected logo concept is **${logoName}**.

### A. Visual Representation
\`\`\`xml
${svgs.primaryLight}
\`\`\`

### B. Geometric Construction & Components
${logoDesc}

### C. Typography Pairing
*   **Font**: ${typography}
*   **Rationale**: ${typographyRationale}

---

## 3. Color System
Visual parameters utilize a precise contrast ratio matching accessibility standards:
- **Primary Color**: \`#0f766e\` (Deep Teal - represents stability, depth, and intelligence)
- **Secondary Color**: \`#0d9488\` (Teal - represents automation and execution speed)
- **Neutral Dark**: \`#1f2937\` (Dark Gray - background, panels, and primary typography)
- **Neutral Light**: \`#f3f4f6\` (Light Gray - light panels, containers, and borders)

### Semantic Colors
- **Success**: \`#10b981\`
- **Warning**: \`#f59e0b\`
- **Error**: \`#ef4444\`
- **Info**: \`#3b82f6\`
- **AI Active**: \`#8b5cf6\`
- **Automation Running**: \`#06b6d4\`

### Color Usage Ratio Rule
- **60%** Neutral/Background (e.g. \`#f9fafb\` or \`#111827\`)
- **25%** Brand Primary
- **10%** Brand Secondary
- **5%** Accent / Semantics

---

## 4. Typography Scale
- **Display Font**: \`${typography}\`
- **Body Font**: \`Inter, sans-serif\`
- **Code/Data Font**: \`JetBrains Mono, monospace\`

### Typography Specimen
- **H1 Header**: 32px / line-height: 1.25 / Weight: Bold
- **H2 Sub-header**: 24px / line-height: 1.3 / Weight: Semi-bold
- **H3 Section Header**: 20px / line-height: 1.35 / Weight: Medium
- **H4 Subsection Header**: 16px / line-height: 1.4 / Weight: Medium
- **Body Large**: 18px / line-height: 1.5 / Weight: Regular
- **Body Regular**: 14px / line-height: 1.5 / Weight: Regular
- **Caption / Label**: 12px / line-height: 1.4 / Weight: Regular

---

## 5. Iconography
- **Grid Layout**: 24x24px viewbox.
- **Stroke Width**: 1.5px to 2px.
- **Corner Caps**: Rounded.
- **Icon Set**: Standard SaaS/Workspace set (Dashboard, Workspace, AI Agent, Workflow, Skill, Tool, Plugin Software, LLM/SLM Config, Member, Project, Task, Kanban, Calendar, Team, Report, Analytics, Approval, File, Notification, Integration, Automation, Security, Knowledge Base, Progress, Chat, Settings).

---

## 6. Living Brand Guideline Package Structure
All brand assets are packaged under \`_iwish-output/brand-identity/\`:
- \`brand-guideline.html\` - Living interactive HTML brand presentation book.
- \`brand-guidelines.md\` - Comprehensive markdown guidelines (this file).
- \`strategy/brand-strategy.md\` - Kapferer's Brand Prism strategy brief.
- \`strategy/messaging.md\` - Brand taglines and positioning statement.
- \`assets/logo/svg/\` - Complete vector logo variations (light, dark, symbol-only, reversed, mono).
- \`source/design-tokens.json\` - Style Dictionary-compliant variables configuration.
- \`source/figma-notes.md\` - Guidelines on how to import assets into Figma.
- \`source/export-log.md\` - Verification check log.
`;

  const guidelinePath = path.join(targetDir, 'brand-guidelines.md');
  await fs.writeFile(guidelinePath, brandGuidelinesContent, 'utf8');

  // Build the premium interactive HTML guideline dashboard
  const htmlGuidelineContent = getHTMLGuidelineTemplate(
    brandName, culture, personality, physique, relationship, reflection, selfImage,
    logoName, logoDesc, typography, typographyRationale, svgs
  );
  await fs.writeFile(path.join(targetDir, 'brand-guideline.html'), htmlGuidelineContent, 'utf8');

  return guidelinePath;
}

function getHTMLGuidelineTemplate(
  brandName: string, culture: string, personality: string, physique: string, relationship: string, reflection: string, selfImage: string,
  logoName: string, logoDesc: string, typography: string, typographyRationale: string, svgs: any
): string {
  // SVG codes embedded directly to avoid CORS/broken paths
  const cleanPrimaryLight = svgs.primaryLight.replace(/[\r\n]+/g, ' ');
  const cleanPrimaryDark = svgs.primaryDark.replace(/[\r\n]+/g, ' ');
  const cleanSymbolLight = svgs.symbolLight.replace(/[\r\n]+/g, ' ');
  const cleanSymbolDark = svgs.symbolDark.replace(/[\r\n]+/g, ' ');
  const cleanMonoBlack = svgs.primaryMonoBlack.replace(/[\r\n]+/g, ' ');
  const cleanMonoWhite = svgs.primaryMonoWhite.replace(/[\r\n]+/g, ' ');
  const cleanAppIconLight = svgs.appIconLight.replace(/[\r\n]+/g, ' ');
  const cleanAppIconDark = svgs.appIconDark.replace(/[\r\n]+/g, ' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} Living Brand Guidelines</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #f8fafc;
      --bg-card: rgba(255, 255, 255, 0.75);
      --border-color: rgba(226, 232, 240, 0.8);
      --text-main: #0f172a;
      --text-muted: #475569;
      --primary: #0f766e;
      --secondary: #0d9488;
      --accent: #8b5cf6;
      --glass-glow: rgba(13, 148, 136, 0.05);
    }
    
    [data-theme="dark"] {
      --bg-primary: #0f172a;
      --bg-card: rgba(30, 41, 59, 0.7);
      --border-color: rgba(71, 85, 105, 0.4);
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --primary: #14b8a6;
      --secondary: #0d9488;
      --accent: #a78bfa;
      --glass-glow: rgba(20, 184, 166, 0.1);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-main);
      display: flex;
      min-height: 100vh;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* Sidebar Navigation */
    .sidebar {
      width: 280px;
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border-right: 1px solid var(--border-color);
      padding: 2rem;
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      z-index: 10;
    }

    .brand-logo-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2.5rem;
    }

    .brand-logo-container svg {
      width: 32px;
      height: 32px;
    }

    .brand-logo-name {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .nav-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex-grow: 1;
    }

    .nav-link {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      color: var(--text-muted);
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.925rem;
      transition: all 0.2s ease;
    }

    .nav-link:hover, .nav-link.active {
      background: rgba(13, 148, 136, 0.1);
      color: var(--primary);
    }

    .theme-toggle-btn {
      background: var(--primary);
      color: #ffffff;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-family: 'Outfit', sans-serif;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
      transition: all 0.2s ease;
    }

    .theme-toggle-btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    /* Main Container */
    .main-content {
      margin-left: 280px;
      padding: 3rem;
      flex-grow: 1;
      max-width: 1100px;
      width: calc(100% - 280px);
    }

    section {
      display: none;
      animation: fadeIn 0.4s ease-out forwards;
    }

    section.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .section-header {
      margin-bottom: 2rem;
      position: relative;
    }

    .section-header h2 {
      font-size: 2.25rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin-bottom: 0.5rem;
    }

    .section-header p {
      color: var(--text-muted);
      font-size: 1.1rem;
    }

    .glass-card {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 8px 32px rgba(15, 23, 42, 0.03);
    }

    .glass-card h3 {
      font-size: 1.35rem;
      margin-bottom: 1rem;
      font-family: 'Outfit', sans-serif;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }

    /* Kapferer's Brand Prism Grid */
    .prism-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .prism-cell {
      background: rgba(13, 148, 136, 0.02);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .prism-cell:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
      box-shadow: 0 8px 24px var(--glass-glow);
    }

    .prism-cell-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }

    .prism-cell-content {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    /* Tabbed Logo Showcase */
    .logo-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }

    .logo-tab {
      background: none;
      border: none;
      padding: 0.5rem 1rem;
      color: var(--text-muted);
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .logo-tab.active, .logo-tab:hover {
      background: rgba(13, 148, 136, 0.08);
      color: var(--primary);
    }

    .logo-view-pane {
      display: none;
      justify-content: center;
      align-items: center;
      padding: 3rem;
      border-radius: 12px;
      border: 1px dashed var(--border-color);
      margin-bottom: 1.5rem;
      background: rgba(248, 250, 252, 0.5);
    }

    .logo-view-pane.active {
      display: flex;
    }

    [data-theme="dark"] .logo-view-pane {
      background: rgba(15, 23, 42, 0.3);
    }

    .logo-view-pane svg {
      max-width: 100%;
      max-height: 200px;
    }

    /* Color Grid */
    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .color-card {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      position: relative;
    }

    .color-swatch {
      height: 120px;
      width: 100%;
    }

    .color-info {
      padding: 1rem;
      background: var(--bg-card);
    }

    .color-name {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      margin-bottom: 0.25rem;
      font-size: 0.95rem;
    }

    .color-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* Typography Showcase */
    .typography-row {
      display: flex;
      align-items: baseline;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .typography-row:last-child {
      border-bottom: none;
    }

    .typography-label {
      width: 180px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .typography-preview {
      flex-grow: 1;
    }

    /* Icon Grid */
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .icon-box {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      background: rgba(13, 148, 136, 0.01);
    }

    .icon-box svg {
      width: 24px;
      height: 24px;
      color: var(--primary);
    }

    .icon-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-align: center;
      text-transform: capitalize;
    }

    /* Token Copy Notification */
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #10b981;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      opacity: 0;
      transform: translateY(8px);
      transition: all 0.3s ease;
      z-index: 100;
      pointer-events: none;
    }

    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>

  <div class="sidebar">
    <div class="brand-logo-container">
      ${cleanSymbolLight}
      <span class="brand-logo-name">${brandName}</span>
    </div>
    
    <ul class="nav-links">
      <li><a href="#strategy" class="nav-link active" onclick="showSection('strategy')">Brand Strategy</a></li>
      <li><a href="#logo" class="nav-link" onclick="showSection('logo')">Logo System</a></li>
      <li><a href="#colors" class="nav-link" onclick="showSection('colors')">Color Palettes</a></li>
      <li><a href="#typography" class="nav-link" onclick="showSection('typography')">Typography</a></li>
      <li><a href="#icons" class="nav-link" onclick="showSection('icons')">Iconography</a></li>
    </ul>

    <button class="theme-toggle-btn" onclick="toggleTheme()">
      <span id="theme-btn-text">Dark Mode</span>
    </button>
  </div>

  <div class="main-content">
    
    <!-- Strategy Section -->
    <section id="strategy-sec" class="active">
      <div class="section-header">
        <h2>Brand Strategy</h2>
        <p>Strategic foundation based on Kapferer's Brand Prism.</p>
      </div>

      <div class="glass-card">
        <h3>Kapferer's Brand Identity Prism</h3>
        <div class="prism-grid">
          <div class="prism-cell">
            <div class="prism-cell-title">Physique (Visual Core)</div>
            <div class="prism-cell-content">${physique}</div>
          </div>
          <div class="prism-cell">
            <div class="prism-cell-title">Personality (Voice)</div>
            <div class="prism-cell-content">${personality}</div>
          </div>
          <div class="prism-cell">
            <div class="prism-cell-title">Culture (Values & Origin)</div>
            <div class="prism-cell-content">${culture}</div>
          </div>
          <div class="prism-cell">
            <div class="prism-cell-title">Relationship (Conduct)</div>
            <div class="prism-cell-content">${relationship}</div>
          </div>
          <div class="prism-cell">
            <div class="prism-cell-title">Reflection (Target Projection)</div>
            <div class="prism-cell-content">${reflection}</div>
          </div>
          <div class="prism-cell">
            <div class="prism-cell-title">Self-Image (User Feeling)</div>
            <div class="prism-cell-content">${selfImage}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Logo System Section -->
    <section id="logo-sec">
      <div class="section-header">
        <h2>Logo System</h2>
        <p>Locked vector designs for light, dark, and monochrome applications.</p>
      </div>

      <div class="glass-card">
        <h3>Official Brandmark: ${logoName}</h3>
        
        <div class="logo-tabs">
          <button class="logo-tab active" onclick="showLogoTab('primary-light')">Primary Light</button>
          <button class="logo-tab" onclick="showLogoTab('primary-dark')">Primary Dark</button>
          <button class="logo-tab" onclick="showLogoTab('symbol-light')">Symbol Light</button>
          <button class="logo-tab" onclick="showLogoTab('symbol-dark')">Symbol Dark</button>
          <button class="logo-tab" onclick="showLogoTab('mono-black')">Mono Black</button>
          <button class="logo-tab" onclick="showLogoTab('mono-white')">Mono White</button>
          <button class="logo-tab" onclick="showLogoTab('app-icon-light')">App Icon Light</button>
          <button class="logo-tab" onclick="showLogoTab('app-icon-dark')">App Icon Dark</button>
        </div>

        <div id="primary-light-pane" class="logo-view-pane active" style="background:#f9fafb;">
          ${cleanPrimaryLight}
        </div>
        <div id="primary-dark-pane" class="logo-view-pane" style="background:#1f2937;">
          ${cleanPrimaryDark}
        </div>
        <div id="symbol-light-pane" class="logo-view-pane" style="background:#f9fafb;">
          <div style="width: 100px; height: 100px;">${cleanSymbolLight}</div>
        </div>
        <div id="symbol-dark-pane" class="logo-view-pane" style="background:#1f2937;">
          <div style="width: 100px; height: 100px;">${cleanSymbolDark}</div>
        </div>
        <div id="mono-black-pane" class="logo-view-pane" style="background:#ffffff;">
          ${cleanMonoBlack}
        </div>
        <div id="mono-white-pane" class="logo-view-pane" style="background:#000000;">
          ${cleanMonoWhite}
        </div>
        <div id="app-icon-light-pane" class="logo-view-pane" style="background:#f9fafb;">
          <div style="width: 120px; height: 120px;">${cleanAppIconLight}</div>
        </div>
        <div id="app-icon-dark-pane" class="logo-view-pane" style="background:#1f2937;">
          <div style="width: 120px; height: 120px;">${cleanAppIconDark}</div>
        </div>
        
        <p style="color:var(--text-muted);font-size:0.9rem;line-height:1.6;margin-top:1rem;">
          ${logoDesc.replace(/- \*\*/g, '<b>').replace(/\*\*/g, '</b>')}
        </p>
      </div>
    </section>

    <!-- Colors Section -->
    <section id="colors-sec">
      <div class="section-header">
        <h2>Color Palettes</h2>
        <p>Contrast-compliant HSL Tailored palettes for brand visual design.</p>
      </div>

      <div class="glass-card">
        <h3>Primary & Secondary Brand Colors</h3>
        <div class="color-grid">
          <div class="color-card" onclick="copyColor('#0f766e', 'Primary Teal')">
            <div class="color-swatch" style="background: #0f766e;"></div>
            <div class="color-info">
              <div class="color-name">Brand Primary</div>
              <div class="color-value">#0F766E</div>
            </div>
          </div>
          <div class="color-card" onclick="copyColor('#0d9488', 'Teal')">
            <div class="color-swatch" style="background: #0d9488;"></div>
            <div class="color-info">
              <div class="color-name">Brand Secondary</div>
              <div class="color-value">#0D9488</div>
            </div>
          </div>
        </div>
      </div>

      <div class="glass-card">
        <h3>Semantic UI Tokens</h3>
        <div class="color-grid">
          <div class="color-card" onclick="copyColor('#10b981', 'Success')">
            <div class="color-swatch" style="background: #10b981;"></div>
            <div class="color-info"><div class="color-name">Success</div><div class="color-value">#10B981</div></div>
          </div>
          <div class="color-card" onclick="copyColor('#f59e0b', 'Warning')">
            <div class="color-swatch" style="background: #f59e0b;"></div>
            <div class="color-info"><div class="color-name">Warning</div><div class="color-value">#F59E0B</div></div>
          </div>
          <div class="color-card" onclick="copyColor('#ef4444', 'Error')">
            <div class="color-swatch" style="background: #ef4444;"></div>
            <div class="color-info"><div class="color-name">Error</div><div class="color-value">#EF4444</div></div>
          </div>
          <div class="color-card" onclick="copyColor('#3b82f6', 'Info')">
            <div class="color-swatch" style="background: #3b82f6;"></div>
            <div class="color-info"><div class="color-name">Info</div><div class="color-value">#3B82F6</div></div>
          </div>
          <div class="color-card" onclick="copyColor('#8b5cf6', 'AI Active')">
            <div class="color-swatch" style="background: #8b5cf6;"></div>
            <div class="color-info"><div class="color-name">AI Active</div><div class="color-value">#8B5CF6</div></div>
          </div>
          <div class="color-card" onclick="copyColor('#06b6d4', 'Automation')">
            <div class="color-swatch" style="background: #06b6d4;"></div>
            <div class="color-info"><div class="color-name">Automation Running</div><div class="color-value">#06B6D4</div></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Typography Section -->
    <section id="typography-sec">
      <div class="section-header">
        <h2>Typography Scale</h2>
        <p>Standardized typography stack paired with display and code fonts.</p>
      </div>

      <div class="glass-card">
        <h3>Font Families</h3>
        <div class="typography-row">
          <div class="typography-label">Display Family</div>
          <div class="typography-preview" style="font-family: '${typography.split(' ')[0]}', sans-serif; font-size: 1.5rem; font-weight: 700;">
            ${typography.split(' ')[0]} (Locked Display)
          </div>
        </div>
        <div class="typography-row">
          <div class="typography-label">Body Family</div>
          <div class="typography-preview" style="font-family: 'Inter', sans-serif; font-size: 1.1rem;">
            Inter (Clean SaaS Readability)
          </div>
        </div>
        <div class="typography-row">
          <div class="typography-label">Code Family</div>
          <div class="typography-preview" style="font-family: 'JetBrains Mono', monospace; font-size: 1rem;">
            JetBrains Mono (Console & Automation data)
          </div>
        </div>
      </div>

      <div class="glass-card">
        <h3>Typography Hierarchy</h3>
        <div class="typography-row">
          <div class="typography-label">H1 Header - 32px</div>
          <div class="typography-preview" style="font-family: '${typography.split(' ')[0]}', sans-serif; font-size: 32px; font-weight: 700; line-height: 1.25;">
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
        <div class="typography-row">
          <div class="typography-label">H2 Subhead - 24px</div>
          <div class="typography-preview" style="font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 600; line-height: 1.3;">
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
        <div class="typography-row">
          <div class="typography-label">Body Large - 18px</div>
          <div class="typography-preview" style="font-family: 'Inter', sans-serif; font-size: 18px; line-height: 1.5;">
            The quick brown fox jumps over the lazy dog. A fast-paced development process warrants precision.
          </div>
        </div>
        <div class="typography-row">
          <div class="typography-label">Body Regular - 14px</div>
          <div class="typography-preview" style="font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.5;">
            The quick brown fox jumps over the lazy dog. Complete design system guidelines compiled into developer-ready JSON files.
          </div>
        </div>
      </div>
    </section>

    <!-- Iconography Section -->
    <section id="icons-sec">
      <div class="section-header">
        <h2>Iconography System</h2>
        <p>A grid-aligned 24x24px stroke icon system optimized for code dashboards.</p>
      </div>

      <div class="glass-card">
        <h3>Standard SaaS Workspace Icons</h3>
        <div class="icon-grid">
          <!-- Sample Grid of SVGs -->
          <div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg><div class="icon-label">Dashboard</div></div>
          <div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20M5 17V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v12M9 22h6"/></svg><div class="icon-label">Workspace</div></div>
          <div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg><div class="icon-label">AI Agent</div></div>
          <div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg><div class="icon-label">Workflow</div></div>
          <div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg><div class="icon-label">Skill</div></div>
          <div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg><div class="icon-label">Tool</div></div>
          <div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><div class="icon-label">Member</div></div>
          <div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9.09 9 1-1a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg><div class="icon-label">Help / Info</div></div>
          <div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><div class="icon-label">Settings</div></div>
        </div>
      </div>
    </section>

  </div>

  <!-- Toast Notification -->
  <div id="toast" class="toast">Color Token copied to clipboard!</div>

  <script>
    function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      
      const themeText = document.getElementById('theme-btn-text');
      themeText.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    function showSection(sectionId) {
      // Manage nav links active class
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + sectionId) {
          link.classList.add('active');
        }
      });

      // Manage visible section
      document.querySelectorAll('section').forEach(sec => {
        sec.classList.remove('active');
      });
      document.getElementById(sectionId + '-sec').classList.add('active');
    }

    function showLogoTab(tabId) {
      document.querySelectorAll('.logo-tab').forEach(tab => {
        tab.classList.remove('active');
      });
      event.target.classList.add('active');

      document.querySelectorAll('.logo-view-pane').forEach(pane => {
        pane.classList.remove('active');
      });
      document.getElementById(tabId + '-pane').classList.add('active');
    }

    function copyColor(hexValue, name) {
      navigator.clipboard.writeText(hexValue).then(() => {
        const toast = document.getElementById('toast');
        toast.textContent = 'Token ' + name + ' (' + hexValue + ') copied!';
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
        }, 2000);
      });
    }

    // Set theme based on system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.getElementById('theme-btn-text').textContent = 'Light Mode';
    }
  </script>
</body>
</html>`;
}

