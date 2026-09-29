import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs-extra';
import { execSync } from 'child_process';
import { validateOKFDocument } from '../src/iwish/schema-validator';

describe('update-knowledge-formatter CLI integration', () => {
  const tempProjectRoot = path.resolve(__dirname, '..', '_test-temp-formatter');

  beforeEach(async () => {
    await fs.ensureDir(tempProjectRoot);
  });

  afterEach(async () => {
    await fs.remove(tempProjectRoot);
  });

  it('should recursively scan, format, and validate legacy markdown files', async () => {
    // 1. Setup mock legacy directory structure
    const outputDir = path.join(tempProjectRoot, '_iwish-output');
    const storiesDir = path.join(outputDir, 'stories');
    const prdDir = path.join(outputDir, 'Product Planning', '2.1. Product Specs');
    
    await fs.ensureDir(storiesDir);
    await fs.ensureDir(prdDir);

    // Create legacy story (no frontmatter)
    const storyPath = path.join(storiesDir, 'story-1.5.md');
    await fs.writeFile(
      storyPath,
      `# Story 1.5: Test Legacy Story\n\nThis is a legacy story description without frontmatter.`,
      'utf8'
    );

    // Create legacy PRD (no frontmatter)
    const prdPath = path.join(prdDir, 'prd-core.md');
    await fs.writeFile(
      prdPath,
      `# PRD Core Engine\n\nThis is the core PRD document outline.`,
      'utf8'
    );

    // Create a file with existing but incomplete frontmatter
    const partialPath = path.join(storiesDir, 'story-1.6.md');
    await fs.writeFile(
      partialPath,
      `---\ntitle: "Existing Partial Title"\n---\n# Story 1.6: Partial Story`,
      'utf8'
    );

    // 2. Execute the CLI command via index.js
    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');
    expect(fs.existsSync(cliPath)).toBe(true);

    execSync(`node "${cliPath}" update-knowledge-formatter --directory "${tempProjectRoot}"`, {
      encoding: 'utf8',
      env: { ...process.env, GRAPH_DB_TYPE: 'none' } // Force offline/none graph db fallback
    });

    // 3. Assertions
    // Verify story-1.5.md got frontmatter chiseled in
    const storyContent = await fs.readFile(storyPath, 'utf8');
    expect(storyContent).toContain('type: I-Wish Story');
    expect(storyContent).toContain('title: "Story 1.5: Test Legacy Story"');
    expect(storyContent).toContain('timestamp:');
    expect(storyContent).toContain('links_to:');

    // Verify prd-core.md got frontmatter chiseled in
    const prdContent = await fs.readFile(prdPath, 'utf8');
    expect(prdContent).toContain('type: I-Wish PRD');
    expect(prdContent).toContain('title: PRD Core Engine');

    // Verify story-1.6.md got upgraded and title preserved
    const partialContent = await fs.readFile(partialPath, 'utf8');
    expect(partialContent).toContain('type: I-Wish Story');
    expect(partialContent).toContain('title: "Existing Partial Title"');

    // Verify they all pass validation now
    expect(() => validateOKFDocument(storyContent, storyPath, tempProjectRoot)).not.toThrow();
    expect(() => validateOKFDocument(prdContent, prdPath, tempProjectRoot)).not.toThrow();
    expect(() => validateOKFDocument(partialContent, partialPath, tempProjectRoot)).not.toThrow();
  });
});
