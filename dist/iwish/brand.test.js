"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
// Mock constants to return a temporary runtime root
const TEMP_DIR = path.join(__dirname, '..', '..', '_test-temp-brand');
vitest_1.vi.mock('./constants', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        getRuntimeRoot: vitest_1.vi.fn(() => path.join(TEMP_DIR, '.iwish')),
    };
});
const brand_1 = require("./brand");
(0, vitest_1.describe)('Brand Identity & Guideline Workflow Tests', () => {
    (0, vitest_1.beforeEach)(() => {
        fs.ensureDirSync(TEMP_DIR);
        fs.ensureDirSync(path.join(TEMP_DIR, '.iwish', 'runtime'));
        fs.ensureDirSync(path.join(TEMP_DIR, '_iwish-output', 'brand-identity'));
    });
    (0, vitest_1.afterEach)(() => {
        fs.removeSync(TEMP_DIR);
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('should scaffold a questionnaire template successfully', async () => {
        const targetPath = await (0, brand_1.scaffoldBrandQuestionnaire)(TEMP_DIR);
        (0, vitest_1.expect)(fs.existsSync(targetPath)).toBe(true);
        const content = fs.readFileSync(targetPath, 'utf8');
        (0, vitest_1.expect)(content).toContain('# Brand Identity & Brand Guideline Questionnaire');
        (0, vitest_1.expect)(content).toContain('Kapferer’s Brand Identity Prism');
    });
    (0, vitest_1.it)('should detect incomplete strategic answers and inject [NEEDS CLARIFICATION] tags', async () => {
        const targetPath = await (0, brand_1.scaffoldBrandQuestionnaire)(TEMP_DIR);
        // Answer some fields but leave Culture/Personality empty or as underscores
        let content = fs.readFileSync(targetPath, 'utf8');
        // Select Project Nature
        content = content.replace('[ ] **New Brand Creation**', '[x] **New Brand Creation**');
        // Select Local Exporter
        content = content.replace('[ ] **Local File Exporter**', '[x] **Local File Exporter**');
        fs.writeFileSync(targetPath, content, 'utf8');
        // Validate
        const status = await (0, brand_1.validateBrandQuestionnaire)(TEMP_DIR);
        (0, vitest_1.expect)(status.valid).toBe(false);
        (0, vitest_1.expect)(status.missingFields).toContain('Culture');
        (0, vitest_1.expect)(status.missingFields).toContain('Personality');
        (0, vitest_1.expect)(status.missingFields).toContain('Physique');
        // Verify [NEEDS CLARIFICATION] is injected in the file
        const updatedContent = fs.readFileSync(targetPath, 'utf8');
        (0, vitest_1.expect)(updatedContent).toContain('[NEEDS CLARIFICATION: Please clarify the brand strategy for Culture]');
    });
    (0, vitest_1.it)('should pass validation when questionnaire is fully and properly answered', async () => {
        const targetPath = await (0, brand_1.scaffoldBrandQuestionnaire)(TEMP_DIR);
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
        const status = await (0, brand_1.validateBrandQuestionnaire)(TEMP_DIR);
        (0, vitest_1.expect)(status.valid).toBe(true);
        (0, vitest_1.expect)(status.missingFields.length).toBe(0);
        (0, vitest_1.expect)(status.designTool).toBe('stitch');
    });
    (0, vitest_1.it)('should scan tool profiles, prompt and install design connections, or fallback to local', async () => {
        // 1. Initial connection is null
        const initialConnection = await (0, brand_1.checkDesignConnection)(TEMP_DIR);
        (0, vitest_1.expect)(initialConnection).toBeNull();
        // 2. Install a design tool (e.g. stitch)
        const installResult = await (0, brand_1.installDesignTool)(TEMP_DIR, 'stitch');
        (0, vitest_1.expect)(installResult.success).toBe(true);
        (0, vitest_1.expect)(installResult.command).toBe('npx iwish-db add stitch-first-dev');
        const activeConnection = await (0, brand_1.checkDesignConnection)(TEMP_DIR);
        (0, vitest_1.expect)(activeConnection).toBe('stitch');
        // 3. Fallback to Local Exporter
        const localResult = await (0, brand_1.installDesignTool)(TEMP_DIR, 'local');
        (0, vitest_1.expect)(localResult.success).toBe(true);
        (0, vitest_1.expect)(localResult.path).toBeDefined();
        const finalConnection = await (0, brand_1.checkDesignConnection)(TEMP_DIR);
        (0, vitest_1.expect)(finalConnection).toBe('local');
        // Test logo, tokens, and brand guidelines asset generation under local fallback
        await (0, brand_1.generateLogoAssets)(TEMP_DIR, 'option-1');
        (0, vitest_1.expect)(fs.existsSync(path.join(TEMP_DIR, 'assets', 'logo.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(TEMP_DIR, 'assets', 'design-tokens.json'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(TEMP_DIR, 'assets', 'brand-guidelines.md'))).toBe(true);
        // Check structured output directory tree under _iwish-output/brand-identity/
        const packageRoot = path.join(TEMP_DIR, '_iwish-output', 'brand-identity');
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'brand-guidelines.md'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'brand-guideline.html'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'strategy', 'brand-strategy.md'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'strategy', 'messaging.md'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'svg', 'brand-primary-light.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'svg', 'brand-primary-dark.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'svg', 'brand-horizontal-light.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'svg', 'brand-horizontal-dark.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'svg', 'brand-wordmark-light.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'svg', 'brand-wordmark-dark.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'mono', 'brand-primary-mono-black.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'mono', 'brand-horizontal-mono-black.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'mono', 'brand-wordmark-mono-black.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'assets', 'logo', 'app-icon', 'brand-app-icon-light.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'source', 'design-tokens.json'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'source', 'export-log.md'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'applications', 'line-art-logo', 'logo-lineart.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(packageRoot, 'applications', 'billboard', 'prompt.md'))).toBe(true);
    });
    (0, vitest_1.it)('should generate logo concepts matching target counts (Story 12.2)', async () => {
        // 1. Default (5 concepts)
        const defaultConcepts = await (0, brand_1.generateLogoConcepts)(TEMP_DIR);
        (0, vitest_1.expect)(defaultConcepts.length).toBe(5);
        (0, vitest_1.expect)(defaultConcepts[0].id).toBe('option-1');
        (0, vitest_1.expect)(defaultConcepts[0].components.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(fs.existsSync(path.join(TEMP_DIR, '_iwish-output', 'brand-identity', 'logo-options.md'))).toBe(true);
        // 2. Custom option count (3 concepts)
        const customConcepts = await (0, brand_1.generateLogoConcepts)(TEMP_DIR, 3);
        (0, vitest_1.expect)(customConcepts.length).toBe(3);
    });
    (0, vitest_1.it)('should generate optimized platform prompts (Story 12.3)', async () => {
        const concepts = await (0, brand_1.generateLogoConcepts)(TEMP_DIR, 1);
        const prompts = (0, brand_1.generatePlatformPrompts)(concepts[0]);
        (0, vitest_1.expect)(prompts.recraft).toContain('recraft-vector');
        (0, vitest_1.expect)(prompts.chatgpt).toContain('Flat minimalistic vector logo');
        (0, vitest_1.expect)(prompts.midjourney).toContain('--style raw');
        const customPrompts = (0, brand_1.generatePlatformPrompts)(concepts[0], 'use neon colors');
        (0, vitest_1.expect)(customPrompts.custom).toContain('use neon colors');
    });
    (0, vitest_1.it)('should block downstream tasks until logo is locked and support overrides (Story 12.5)', async () => {
        // 1. Initially logo is not locked
        await (0, vitest_1.expect)((0, brand_1.validateLogoLock)(TEMP_DIR)).rejects.toThrow('BLOCK');
        // 2. Override lock
        const overrideResult = await (0, brand_1.validateLogoLock)(TEMP_DIR, true);
        (0, vitest_1.expect)(overrideResult.locked).toBe(true);
        (0, vitest_1.expect)(overrideResult.reason).toContain('bypassed');
        (0, vitest_1.expect)(fs.existsSync(path.join(TEMP_DIR, '_iwish-output', 'brand-identity', 'decisions.log'))).toBe(true);
        // 3. Lock logo in status file
        const statusPath = path.join(TEMP_DIR, '_iwish-output', 'brand-identity', 'brand-status.json');
        await fs.writeJson(statusPath, { logo_locked: true });
        const lockResult = await (0, brand_1.validateLogoLock)(TEMP_DIR);
        (0, vitest_1.expect)(lockResult.locked).toBe(true);
    });
    (0, vitest_1.it)('should audit existing assets and run refactoring paths A, B, C (Story 12.6)', async () => {
        // 1. Run refactoring Path A with a vector asset
        const pathAResult = await (0, brand_1.auditAndRefactorLogo)(TEMP_DIR, 'A', 'logo.svg');
        (0, vitest_1.expect)(pathAResult.success).toBe(true);
        (0, vitest_1.expect)(pathAResult.auditMetrics.rasterLimitCheck).toBe('PASSED');
        (0, vitest_1.expect)(pathAResult.auditMetrics.vectorizationRequired).toBe(false);
        (0, vitest_1.expect)(pathAResult.auditMetrics.actionApplied).toContain('Path A');
        // 2. Run refactoring Path B with a raster asset (triggers edge-case vectorization)
        const pathBResult = await (0, brand_1.auditAndRefactorLogo)(TEMP_DIR, 'B', 'logo.png');
        (0, vitest_1.expect)(pathBResult.success).toBe(true);
        (0, vitest_1.expect)(pathBResult.auditMetrics.rasterLimitCheck).toBe('FAILED (Raster-only file detected)');
        (0, vitest_1.expect)(pathBResult.auditMetrics.vectorizationRequired).toBe(true);
        (0, vitest_1.expect)(pathBResult.auditMetrics.actionApplied).toContain('Path B');
        // 3. Verify output files are written
        (0, vitest_1.expect)(fs.existsSync(path.join(pathAResult.outputFolder, 'logo-refactored.svg'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(pathAResult.outputFolder, 'refactor-audit.json'))).toBe(true);
    });
});
