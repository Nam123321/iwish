import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock constants to return a temporary runtime root
const TEMP_DIR = path.join(__dirname, '..', '..', '_test-temp-brand');
vi.mock('./constants', async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    getRuntimeRoot: vi.fn(() => path.join(TEMP_DIR, '.iwish')),
  };
});

import {
  scaffoldBrandQuestionnaire,
  validateBrandQuestionnaire,
  checkDesignConnection,
  installDesignTool,
  generateLogoAssets,
  generateLogoConcepts,
  generatePlatformPrompts,
  validateLogoLock,
  auditAndRefactorLogo
} from './brand';

describe('Brand Identity & Guideline Workflow Tests', () => {
  beforeEach(() => {
    fs.ensureDirSync(TEMP_DIR);
    fs.ensureDirSync(path.join(TEMP_DIR, '.iwish', 'runtime'));
    fs.ensureDirSync(path.join(TEMP_DIR, '_iwish-output', 'brand-identity'));
  });

  afterEach(() => {
    fs.removeSync(TEMP_DIR);
    vi.restoreAllMocks();
  });

  it('should scaffold a questionnaire template successfully', async () => {
    const targetPath = await scaffoldBrandQuestionnaire(TEMP_DIR);
    expect(fs.existsSync(targetPath)).toBe(true);

    const content = fs.readFileSync(targetPath, 'utf8');
    expect(content).toContain('# Brand Identity & Brand Guideline Questionnaire');
    expect(content).toContain('Kapferer’s Brand Identity Prism');
  });

  it('should detect incomplete strategic answers and inject [NEEDS CLARIFICATION] tags', async () => {
    const targetPath = await scaffoldBrandQuestionnaire(TEMP_DIR);

    // Answer some fields but leave Culture/Personality empty or as underscores
    let content = fs.readFileSync(targetPath, 'utf8');
    // Select Project Nature
    content = content.replace('[ ] **New Brand Creation**', '[x] **New Brand Creation**');
    // Select Local Exporter
    content = content.replace('[ ] **Local File Exporter**', '[x] **Local File Exporter**');
    fs.writeFileSync(targetPath, content, 'utf8');

    // Validate
    const status = await validateBrandQuestionnaire(TEMP_DIR);
    expect(status.valid).toBe(false);
    expect(status.missingFields).toContain('Culture');
    expect(status.missingFields).toContain('Personality');
    expect(status.missingFields).toContain('Physique');

    // Verify [NEEDS CLARIFICATION] is injected in the file
    const updatedContent = fs.readFileSync(targetPath, 'utf8');
    expect(updatedContent).toContain('[NEEDS CLARIFICATION: Please clarify the brand strategy for Culture]');
  });

  it('should pass validation when questionnaire is fully and properly answered', async () => {
    const targetPath = await scaffoldBrandQuestionnaire(TEMP_DIR);

    let content = fs.readFileSync(targetPath, 'utf8');
    // Select New Brand
    content = content.replace('[ ] **New Brand Creation**', '[x] **New Brand Creation**');
    // Select stitch
    content = content.replace('[ ] **stitch**', '[x] **stitch**');
    
    // Fill in strategic answers
    content = content.replace('*   What is the brand\'s origin story?', '*   What is the brand\'s origin story?\n*   Our brand was created during pair programming in a high-tech lab.');
    content = content.replace('*   If the brand were a person, what human traits would they possess?', '*   If the brand were a person, what human traits would they possess?\n*   Friendly, intelligent, fast, proactive.');
    content = content.replace('*   Preferred primary color range', '*   Preferred primary color range\n*   Deep teal (#0f766e)');
    content = content.replace('*   How does the brand treat its customers?', '*   How does the brand treat its customers?\n*   As a supportive partner.');
    content = content.replace('*   Who is the ideal customer?', '*   Who is the ideal customer?\n*   Advanced AI systems developers.');
    
    fs.writeFileSync(targetPath, content, 'utf8');

    const status = await validateBrandQuestionnaire(TEMP_DIR);
    expect(status.valid).toBe(true);
    expect(status.missingFields.length).toBe(0);
    expect(status.designTool).toBe('stitch');
  });

  it('should scan tool profiles, prompt and install design connections, or fallback to local', async () => {
    // 1. Initial connection is null
    const initialConnection = await checkDesignConnection(TEMP_DIR);
    expect(initialConnection).toBeNull();

    // 2. Install a design tool (e.g. stitch)
    const installResult = await installDesignTool(TEMP_DIR, 'stitch');
    expect(installResult.success).toBe(true);
    expect(installResult.command).toBe('npx iwish-db add stitch-first-dev');

    const activeConnection = await checkDesignConnection(TEMP_DIR);
    expect(activeConnection).toBe('stitch');

    // 3. Fallback to Local Exporter
    const localResult = await installDesignTool(TEMP_DIR, 'local');
    expect(localResult.success).toBe(true);
    expect(localResult.path).toBeDefined();

    const finalConnection = await checkDesignConnection(TEMP_DIR);
    expect(finalConnection).toBe('local');

    // Test logo, tokens, and brand guidelines asset generation under local fallback
    await generateLogoAssets(TEMP_DIR, 'option-1');
    expect(fs.existsSync(path.join(TEMP_DIR, 'assets', 'logo.svg'))).toBe(true);
    expect(fs.existsSync(path.join(TEMP_DIR, 'assets', 'design-tokens.json'))).toBe(true);
    expect(fs.existsSync(path.join(TEMP_DIR, 'assets', 'brand-guidelines.md'))).toBe(true);
    
    // Check structured output directory tree under _iwish-output/brand-identity/
    const packageRoot = path.join(TEMP_DIR, '_iwish-output', 'brand-identity');
    expect(fs.existsSync(path.join(packageRoot, 'brand-guidelines.md'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'brand-guideline.html'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'strategy', 'brand-strategy.md'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'strategy', 'messaging.md'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'svg', 'brand-primary-light.svg'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'svg', 'brand-primary-dark.svg'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'svg', 'brand-horizontal-light.svg'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'svg', 'brand-horizontal-dark.svg'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'svg', 'brand-wordmark-light.svg'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'svg', 'brand-wordmark-dark.svg'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'mono', 'brand-primary-mono-black.svg'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'mono', 'brand-horizontal-mono-black.svg'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'mono', 'brand-wordmark-mono-black.svg'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'app-icon', 'brand-app-icon-light.svg'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'source', 'design-tokens.json'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'source', 'export-log.md'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'applications', 'line-art-logo', 'logo-lineart.svg'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'applications', 'billboard', 'prompt.md'))).toBe(true);
  });

  it('should generate logo concepts matching target counts (Story 12.2)', async () => {
    // 1. Default (5 concepts)
    const defaultConcepts = await generateLogoConcepts(TEMP_DIR);
    expect(defaultConcepts.length).toBe(5);
    expect(defaultConcepts[0].id).toBe('option-1');
    expect(defaultConcepts[0].components.length).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(TEMP_DIR, '_iwish-output', 'brand-identity', 'logo-options.md'))).toBe(true);

    // 2. Custom option count (3 concepts)
    const customConcepts = await generateLogoConcepts(TEMP_DIR, 3);
    expect(customConcepts.length).toBe(3);
  });

  it('should generate optimized platform prompts (Story 12.3)', async () => {
    const concepts = await generateLogoConcepts(TEMP_DIR, 1);
    const prompts = generatePlatformPrompts(concepts[0]);
    
    expect(prompts.recraft).toContain('recraft-vector');
    expect(prompts.chatgpt).toContain('Flat minimalistic vector logo');
    expect(prompts.midjourney).toContain('--style raw');

    const customPrompts = generatePlatformPrompts(concepts[0], 'use neon colors');
    expect(customPrompts.custom).toContain('use neon colors');
  });

  it('should block downstream tasks until logo is locked and support overrides (Story 12.5)', async () => {
    // 1. Initially logo is not locked
    await expect(validateLogoLock(TEMP_DIR)).rejects.toThrow('BLOCK');

    // 2. Override lock
    const overrideResult = await validateLogoLock(TEMP_DIR, true);
    expect(overrideResult.locked).toBe(true);
    expect(overrideResult.reason).toContain('bypassed');
    expect(fs.existsSync(path.join(TEMP_DIR, '_iwish-output', 'brand-identity', 'decisions.log'))).toBe(true);

    // 3. Lock logo in status file
    const statusPath = path.join(TEMP_DIR, '_iwish-output', 'brand-identity', 'brand-status.json');
    await fs.writeJson(statusPath, { logo_locked: true });
    
    const lockResult = await validateLogoLock(TEMP_DIR);
    expect(lockResult.locked).toBe(true);
  });

  it('should audit existing assets and run refactoring paths A, B, C (Story 12.6)', async () => {
    // 1. Run refactoring Path A with a vector asset
    const pathAResult = await auditAndRefactorLogo(TEMP_DIR, 'A', 'logo.svg');
    expect(pathAResult.success).toBe(true);
    expect(pathAResult.auditMetrics.rasterLimitCheck).toBe('PASSED');
    expect(pathAResult.auditMetrics.vectorizationRequired).toBe(false);
    expect(pathAResult.auditMetrics.actionApplied).toContain('Path A');

    // 2. Run refactoring Path B with a raster asset (triggers edge-case vectorization)
    const pathBResult = await auditAndRefactorLogo(TEMP_DIR, 'B', 'logo.png');
    expect(pathBResult.success).toBe(true);
    expect(pathBResult.auditMetrics.rasterLimitCheck).toBe('FAILED (Raster-only file detected)');
    expect(pathBResult.auditMetrics.vectorizationRequired).toBe(true);
    expect(pathBResult.auditMetrics.actionApplied).toContain('Path B');

    // 3. Verify output files are written
    expect(fs.existsSync(path.join(pathAResult.outputFolder, 'logo-refactored.svg'))).toBe(true);
    expect(fs.existsSync(path.join(pathAResult.outputFolder, 'refactor-audit.json'))).toBe(true);
  });
});
