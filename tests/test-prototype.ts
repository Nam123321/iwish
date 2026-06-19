import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs-extra';
import { execSync } from 'child_process';
import { parseFeatureHierarchy, parseDesignTokens, generatePortalHtml, verifyPrototypeSemanticParity, Portal } from '../src/iwish/commands/prototype';

describe('make-prototype and verify-prototype tests', () => {
  const tempProjectRoot = path.resolve(__dirname, '..', '_test-temp-prototype');

  beforeEach(async () => {
    await fs.ensureDir(tempProjectRoot);
  });

  afterEach(async () => {
    await fs.remove(tempProjectRoot);
  });

  describe('Parser and HTML Generation Unit Tests', () => {
    it('should correctly parse feature-hierarchy.md', () => {
      const mockHierarchy = `# Product Feature Hierarchy

## 🌐 Portal Overview
| Portal / Module | Code | Summary | FR Coverage |
| :--- | :--- | :--- | :--- |
| **Super Admin Portal** | \`SAD\` | Admin portal for controlling tenants | FR-SAD-01 |
| **Tenant Dashboard** | \`TDB\` | User workspace | FR-TDB-01 |

## 📁 Per-Portal Navigation & Menu Tree

### 1. Super Admin Portal (SAD)
*   **User Management**
    *   \`👥 List Users\`: List all users (FR-SAD-01)
    *   \`➕ Create User\`: Add a new user to system
*   **System Settings**
    *   \`⚙️ Configuration\`: Update configuration properties

### 2. Tenant Dashboard (TDB)
*   **Dashboard Overview**
    *   \`📊 Metrics\`: View usage metrics
`;

      const portals = parseFeatureHierarchy(mockHierarchy);
      expect(portals).toHaveLength(2);
      
      expect(portals[0].name).toBe('Super Admin Portal');
      expect(portals[0].code).toBe('SAD');
      expect(portals[0].slug).toBe('super-admin-portal');
      expect(portals[0].screens).toHaveLength(3);

      expect(portals[0].screens[0].title).toBe('👥 List Users');
      expect(portals[0].screens[0].description).toBe('List all users (FR-SAD-01)');
      expect(portals[0].screens[0].category).toBe('User Management');
      expect(portals[0].screens[0].id).toBe('screen-sad-list-users');

      expect(portals[0].screens[2].title).toBe('⚙️ Configuration');
      expect(portals[0].screens[2].category).toBe('System Settings');
      expect(portals[0].screens[2].id).toBe('screen-sad-configuration');

      expect(portals[1].name).toBe('Tenant Dashboard');
      expect(portals[1].code).toBe('TDB');
      expect(portals[1].slug).toBe('tenant-dashboard');
      expect(portals[1].screens).toHaveLength(1);
      expect(portals[1].screens[0].title).toBe('📊 Metrics');
      expect(portals[1].screens[0].id).toBe('screen-tdb-metrics');
    });

    it('should correctly parse DESIGN.md', () => {
      const mockDesign = `# Design System Tokens

## Colors
*   **Primary Green:** \`#11AA22\`
*   **Secondary Green:** \`#334455\`
*   **Background Dark:** \`#121212\`
*   **Text Light:** \`#EEEEEE\`
*   **Gray Border:** \`#444444\`

## Typography
*   **Family:** \`CustomFont, sans-serif\`
*   **Heading Weight:** \`800\`
*   **Body Weight:** \`300\`
`;

      const tokens = parseDesignTokens(mockDesign);
      expect(tokens.colors.primaryGreen).toBe('#11AA22');
      expect(tokens.colors.secondaryGreen).toBe('#334455');
      expect(tokens.colors.backgroundDark).toBe('#121212');
      expect(tokens.colors.textLight).toBe('#EEEEEE');
      expect(tokens.colors.grayBorder).toBe('#444444');
      expect(tokens.typography.family).toBe('CustomFont, sans-serif');
      expect(tokens.typography.headingWeight).toBe('800');
      expect(tokens.typography.bodyWeight).toBe('300');
    });

    it('should generate valid interactive HTML with metadata and offline style fallback', () => {
      const portal: Portal = {
        name: 'Super Admin Portal',
        code: 'SAD',
        summary: 'Admin portal',
        slug: 'super-admin-portal',
        screens: [
          {
            title: '👥 Users & Roles',
            description: 'Control users and permissions.',
            category: 'User Management',
            id: 'screen-sad-users-roles'
          }
        ]
      };

      const tokens = parseDesignTokens('');
      const checksums = { 'feature-hierarchy.md': 'hash123', 'design.md': 'hash456' };

      const html = generatePortalHtml(portal, [portal], tokens, checksums);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('I-Wish Prototype Reference - Super Admin Portal');
      expect(html).toContain('Users &amp; Roles'); // XSS Escaped Title check
      expect(html).toContain('screen-sad-users-roles');
      expect(html).toContain('prototype-metadata');
      expect(html).toContain('"feature-hierarchy.md": "hash123"');
      expect(html).toContain('Outfit, sans-serif');
      expect(html).toContain('🌓 Theme Toggle');
    });
  });

  describe('verifyPrototypeSemanticParity Unit Tests', () => {
    const outputDir = path.join(tempProjectRoot, '_iwish-output');
    const planningDir = path.join(outputDir, '2. Product Planning');
    const prototypesDir = path.join(planningDir, 'prototypes');

    beforeEach(async () => {
      await fs.ensureDir(planningDir);
      await fs.ensureDir(prototypesDir);

      // Write valid hierarchy
      await fs.writeFile(
        path.join(planningDir, '2.5. feature-hierarchy.md'),
        `# Feature Hierarchy
## 🌐 Portal Overview
| Portal / Module | Code | Summary | FR Coverage |
| :--- | :--- | :--- | :--- |
| **Admin Portal** | \`ADM\` | Admin dashboard | FR-01 |

## 📁 Per-Portal Navigation & Menu Tree
### 1. Admin Portal (ADM)
*   **Overview**
    *   \`🏠 Home\`: Dashboard landing
`,
        'utf8'
      );

      // Write valid design
      await fs.writeFile(
        path.join(tempProjectRoot, 'DESIGN.md'),
        `# Design
*   **Primary Green:** \`#00DF9A\`
`,
        'utf8'
      );
    });

    it('should pass validation for a perfectly matching prototype', async () => {
      const portal: Portal = {
        name: 'Admin Portal',
        code: 'ADM',
        summary: 'Admin dashboard',
        slug: 'admin-portal',
        screens: [
          {
            title: '🏠 Home',
            description: 'Dashboard landing',
            category: 'Overview',
            id: 'screen-adm-home'
          }
        ]
      };

      const tokens = parseDesignTokens('Primary Green: `#00DF9A`');
      const html = generatePortalHtml(portal, [portal], tokens, {});

      await fs.writeFile(path.join(prototypesDir, 'prototype-admin-portal.html'), html, 'utf8');
      await fs.writeFile(path.join(prototypesDir, 'prototype-referrence-only.html'), html, 'utf8');

      const result = await verifyPrototypeSemanticParity(tempProjectRoot);
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when a screen DOM element is missing', async () => {
      // Prototype HTML has no div with id="screen-adm-home"
      const corruptHtml = `<!DOCTYPE html>
<html>
<body>
  <header><a href="./prototype-admin-portal.html">Admin</a></header>
  <aside></aside>
  <main></main>
</body>
</html>`;

      await fs.writeFile(path.join(prototypesDir, 'prototype-admin-portal.html'), corruptHtml, 'utf8');
      await fs.writeFile(path.join(prototypesDir, 'prototype-referrence-only.html'), corruptHtml, 'utf8');

      const result = await verifyPrototypeSemanticParity(tempProjectRoot);
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('has no corresponding DOM element'))).toBe(true);
    });

    it('should fail validation when unauthorized colors are used', async () => {
      const portal: Portal = {
        name: 'Admin Portal',
        code: 'ADM',
        summary: 'Admin dashboard',
        slug: 'admin-portal',
        screens: [
          {
            title: '🏠 Home',
            description: 'Dashboard landing',
            category: 'Overview',
            id: 'screen-adm-home'
          }
        ]
      };

      const tokens = parseDesignTokens('Primary Green: `#00DF9A`');
      let html = generatePortalHtml(portal, [portal], tokens, {});
      
      // Inject unauthorized color hex
      html = html.replace('Outfit, sans-serif', 'Outfit, sans-serif; color: #ff00ff;');

      await fs.writeFile(path.join(prototypesDir, 'prototype-admin-portal.html'), html, 'utf8');
      await fs.writeFile(path.join(prototypesDir, 'prototype-referrence-only.html'), html, 'utf8');

      const result = await verifyPrototypeSemanticParity(tempProjectRoot);
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('Unauthorized design token usage'))).toBe(true);
    });

    it('should approve unauthorized colors if they are safelisted', async () => {
      const portal: Portal = {
        name: 'Admin Portal',
        code: 'ADM',
        summary: 'Admin dashboard',
        slug: 'admin-portal',
        screens: [
          {
            title: '🏠 Home',
            description: 'Dashboard landing',
            category: 'Overview',
            id: 'screen-adm-home'
          }
        ]
      };

      const tokens = parseDesignTokens('Primary Green: `#00DF9A`');
      let html = generatePortalHtml(portal, [portal], tokens, {});
      
      // Inject unauthorized color and add safelist comment
      html = `<!-- iwish-safelist: #ff00ff -->\n` + html.replace('Outfit, sans-serif', 'Outfit, sans-serif; color: #ff00ff;');

      await fs.writeFile(path.join(prototypesDir, 'prototype-admin-portal.html'), html, 'utf8');
      await fs.writeFile(path.join(prototypesDir, 'prototype-referrence-only.html'), html, 'utf8');

      const result = await verifyPrototypeSemanticParity(tempProjectRoot);
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('CLI Command Integration Tests', () => {
    it('should run command via iwish and build prototype-referrence-only.html plus portal files', async () => {
      const outputDir = path.join(tempProjectRoot, '_iwish-output');
      const planningDir = path.join(outputDir, '2. Product Planning');
      const prototypesDir = path.join(planningDir, 'prototypes');
      
      await fs.ensureDir(planningDir);

      // 1. Write mock feature-hierarchy.md
      const hierarchyPath = path.join(planningDir, '2.5. feature-hierarchy.md');
      await fs.writeFile(
        hierarchyPath,
        `# Feature Hierarchy
 
## 🌐 Portal Overview
| Portal / Module | Code | Summary | FR Coverage |
| :--- | :--- | :--- | :--- |
| **Admin Panel** | \`ADM\` | Admin dashboard | FR-01 |
| **User Panel** | \`USR\` | User dashboard | FR-02 |

## 📁 Per-Portal Navigation & Menu Tree

### 1. Admin Panel (ADM)
*   **System Settings**
    *   \`⚙️ Configuration\`: Update configuration properties

### 2. User Panel (USR)
*   **Overview**
    *   \`🏠 Home\`: Landing dashboard
`,
        'utf8'
      );

      // 2. Write mock DESIGN.md
      const designPath = path.join(tempProjectRoot, 'DESIGN.md');
      await fs.writeFile(
        designPath,
        `# Design System
## Colors
*   **Primary Green:** \`#00DF9A\`
*   **Background Dark:** \`#0F172A\`
`,
        'utf8'
      );

      const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');
      expect(fs.existsSync(cliPath)).toBe(true);

      // Run generator
      execSync(`node "${cliPath}" make-prototype --directory "${tempProjectRoot}"`, {
        encoding: 'utf8',
        env: { ...process.env, GRAPH_DB_TYPE: 'none' }
      });

      const adminPath = path.join(prototypesDir, 'prototype-admin-panel.html');
      const userPath = path.join(prototypesDir, 'prototype-user-panel.html');
      const refPath = path.join(prototypesDir, 'prototype-referrence-only.html');

      expect(fs.existsSync(adminPath)).toBe(true);
      expect(fs.existsSync(userPath)).toBe(true);
      expect(fs.existsSync(refPath)).toBe(false);

      // Verify command verify-prototype passes
      let verifyOutput = '';
      try {
        verifyOutput = execSync(`node "${cliPath}" verify-prototype --directory "${tempProjectRoot}"`, {
          encoding: 'utf8',
          env: { ...process.env, GRAPH_DB_TYPE: 'none' }
        });
      } catch (err: any) {
        throw new Error(`verify-prototype failed: ${err.message}\nOutput: ${err.stdout}\nError: ${err.stderr}`);
      }
      expect(verifyOutput).toContain('Prototype parity verification PASSED!');

      // Inject unauthorized color to admin panel to trigger verification fail
      let adminHtml = await fs.readFile(adminPath, 'utf8');
      adminHtml = adminHtml.replace('Outfit, sans-serif', 'Outfit, sans-serif; color: #ff33ff;');
      await fs.writeFile(adminPath, adminHtml, 'utf8');

      // Verify verify-prototype command fails
      let failedVerify = false;
      try {
        execSync(`node "${cliPath}" verify-prototype --directory "${tempProjectRoot}"`, {
          encoding: 'utf8',
          env: { ...process.env, GRAPH_DB_TYPE: 'none' },
          stdio: 'pipe'
        });
      } catch (err: any) {
        failedVerify = true;
        expect(err.stderr || err.message).toContain('verification FAILED');
      }
      expect(failedVerify).toBe(true);
    });
  });
});
