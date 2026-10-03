#!/usr/bin/env python3
import os, sys, subprocess

script_dir = os.path.dirname(os.path.abspath(__file__))
agent_dir = os.path.abspath(os.path.join(script_dir, ".."))
if agent_dir not in sys.path:
    sys.path.insert(0, agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass

def main():
    repo_root = os.path.abspath(os.path.join(script_dir, "../.."))
    
    # We will write a temporary JS script that uses TypeScript's compiler API
    # to parse the AST of all .ts/.js files in src/ and server/ and enforce rules.
    ts_script = """
    const fs = require('fs');
    const path = require('path');
    const ts = require('typescript');
    
    const repoRoot = process.argv[2];
    let violations = [];
    
    const bannedPackages = [
      "express",
      "@fastify/express",
      "express-rate-limit",
      "body-parser",
      "@types/express",
      "supertest",
      "@connectrpc/connect-express"
    ];
    
    // 1. Scan package.json, package-lock.json, pnpm-lock.yaml for npm:express aliases and express-* wildcards
    const lockFiles = ['package.json', 'package-lock.json', 'pnpm-lock.yaml'];
    for (const lf of lockFiles) {
      const lfPath = path.join(repoRoot, lf);
      if (fs.existsSync(lfPath)) {
        const content = fs.readFileSync(lfPath, 'utf8');
        for (const bp of bannedPackages) {
          if (content.includes(`"${bp}"`)) {
            // We ignore supertest if it's not in dependencies
          }
        }
        
        // Full JSON parse for package.json
        if (lf === 'package.json') {
          const pkg = JSON.parse(content);
          const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.optionalDependencies || {}), ...(pkg.peerDependencies || {}) };
          for (const bp of bannedPackages) {
            if (allDeps[bp]) {
              violations.push(`package.json: Banned dependency found: ${bp}`);
            }
          }
          // Enforce npm: alias bans
          for (const [name, version] of Object.entries(allDeps)) {
            if (typeof version === 'string') {
              const isGitOrNpm = version.includes('npm:') || version.includes('github:') || version.includes('git+') || version.includes('file:') || version.includes('http:') || version.includes('https:') || version.includes('/') || version.includes('.') || version.includes('~');
              if (isGitOrNpm && bannedPackages.some(bp => version.includes(bp))) {
                violations.push(`package.json: Banned npm/git alias found: ${name} -> ${version}`);
              }
            }
            if (name.startsWith('express-') && name !== 'express-rate-limit') {
              violations.push(`package.json: Banned express wildcard dependency found: ${name}`);
            }
          }
        } else {
           if (content.includes('"express": {') || content.includes('npm:express') || content.includes('/express@')) {
             violations.push(`${lf}: Express dependency tree detected in lockfile.`);
           }
        }
      }
    }
    
    function scanDir(dir) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          scanDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.js') || fullPath.endsWith('.json')) {
          scanFile(fullPath);
        }
      }
    }
    
    function scanFile(filePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const sourceFile = ts.createSourceFile(
          filePath,
          content,
          ts.ScriptTarget.Latest,
          true
        );
        
        function isBanned(moduleName) {
          if (!moduleName) return false;
          if (moduleName.startsWith('express/') || moduleName === 'express') return true;
          return bannedPackages.some(bp => moduleName === bp || moduleName.endsWith('/' + bp) || moduleName.startsWith(bp + '/') || moduleName.includes('/' + bp + '/'));
        }
        
        function extractArg(arg) {
          while (arg && (ts.isParenthesizedExpression(arg) || ts.isAsExpression(arg) || ts.isTypeAssertionExpression(arg) || ts.isNonNullExpression(arg) || ts.isSatisfiesExpression(arg))) {
            arg = arg.expression;
          }
          return arg;
        }
        function isBypassSyntax(arg) {
          return ts.isBinaryExpression(arg) || ts.isTemplateExpression(arg) || ts.isIdentifier(arg) || ts.isCallExpression(arg) || ts.isPropertyAccessExpression(arg) || ts.isElementAccessExpression(arg);
        }
        
        function visit(node) {
          if (ts.isImportDeclaration(node)) {
            const moduleName = node.moduleSpecifier.text;
            if (isBanned(moduleName)) {
              violations.push(`${filePath}: Banned Express import AST node: ${moduleName}`);
            }
          } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
            const moduleName = node.moduleSpecifier.text;
            if (isBanned(moduleName)) {
              violations.push(`${filePath}: Banned Express export AST node: ${moduleName}`);
            }
          } else if (ts.isImportEqualsDeclaration(node)) {
            if (node.moduleReference && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression) {
              const arg = node.moduleReference.expression;
              if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
                const moduleName = arg.text;
                if (isBanned(moduleName)) {
                  violations.push(`${filePath}: Banned Express importEquals AST node: ${moduleName}`);
                }
              }
            }
          } else if (ts.isCallExpression(node)) {
            const exprText = node.expression.getText(sourceFile);
            const arg = extractArg(node.arguments[0]);
            
            if (exprText === 'require' || exprText.includes('require')) {
              if (arg) {
                 if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
                   const moduleName = arg.text;
                   if (isBanned(moduleName)) {
                     violations.push(`${filePath}: Banned Express require AST node: ${moduleName}`);
                   }
                 } else if (isBypassSyntax(arg)) {
                   violations.push(`${filePath}: Dynamic require bypass detected`);
                 }
              }
            } else if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
               const moduleName = arg.text;
               if (isBanned(moduleName)) {
                  if (exprText !== 'console.log' && exprText !== 'console.error' && exprText !== 'console.warn') {
                      violations.push(`${filePath}: Potential Express require alias bypass: ${exprText}(${moduleName})`);
                  }
               }
            }
          }
          // Check dynamic import()
          if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
            const arg = extractArg(node.arguments[0]);
            if (arg) {
              if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
                 const moduleName = arg.text;
                 if (isBanned(moduleName)) {
                   violations.push(`${filePath}: Banned Express dynamic import AST node: ${moduleName}`);
                 }
              } else if (isBypassSyntax(arg)) {
                violations.push(`${filePath}: Dynamic import bypass detected`);
              }
            }
          }
          
          if (filePath.endsWith('routing-ledger.ts') && ts.isIdentifier(node) && node.getText(sourceFile) === 'routingLedger') {
             // Allow VariableDeclaration
             if (node.parent && ts.isVariableDeclaration(node.parent) && node.parent.name === node) {
                 // Ok
             }
             // Allow PropertyAccess for .length and .filter
             else if (node.parent && ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node) {
                 const prop = node.parent.name.getText(sourceFile);
                 if (prop !== 'length' && prop !== 'filter') {
                     violations.push(`${filePath}: routingLedger illegal property access (${prop}). Potential mutation or aliasing.`);
                 }
             }
             // Allow ExportSpecifier (e.g. export { routingLedger })
             else if (node.parent && ts.isExportSpecifier(node.parent)) {
                 // Ok
             }
             else {
                 violations.push(`${filePath}: routingLedger illegal reference. Aliasing or mutation detected.`);
             }
          }
          if (filePath.endsWith('routing-ledger.ts') && ts.isVariableDeclaration(node) && node.name.getText(sourceFile) === 'routingLedger') {
             if (node.initializer) {
                 if (ts.isArrayLiteralExpression(node.initializer) && node.initializer.elements.length > 0) {
                     violations.push(`${filePath}: Active routing exceptions present in AST/source.`);
                 } else if (!ts.isArrayLiteralExpression(node.initializer)) {
                     violations.push(`${filePath}: routingLedger must be initialized with an empty array literal, bypass detected.`);
                 }
             } else {
                 violations.push(`${filePath}: routingLedger must be initialized inline with an empty array literal, uninitialized declaration detected.`);
             }
          }
          
          ts.forEachChild(node, visit);
        }
        visit(sourceFile);
      } catch (err) {
        violations.push(`${filePath}: File read/parse error - ${err.message}`);
      }
    }
    
    scanDir(path.join(repoRoot, 'src'));
    scanDir(path.join(repoRoot, 'server')); // Ensure server/ is scanned
    
    if (violations.length > 0) {
      console.log("❌ FAILED: Found " + violations.length + " Express violation(s):");
      violations.forEach(v => console.log("  - " + v));
      process.exit(1);
    } else {
      console.log("✅ PASSED: Zero Express imports, zero Express dependencies, and zero routing ledger exceptions verified.");
      process.exit(0);
    }
    """
    
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.cjs', encoding='utf-8', delete=False) as f:
        f.write(ts_script)
        js_script_path = f.name
        
    try:
        result = subprocess.run(["node", js_script_path, repo_root], check=True, text=True, capture_output=True)
        print("=" * 60)
        print("🛡️ AST Anti-Express CI Enforcement & Routing Ledger Scanner")
        print("=" * 60)
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print("=" * 60)
        print("🛡️ AST Anti-Express CI Enforcement & Routing Ledger Scanner")
        print("=" * 60)
        print(e.stdout)
        print(e.stderr)
        sys.exit(1)
    finally:
        if os.path.exists(js_script_path):
            os.remove(js_script_path)

if __name__ == "__main__":
    main()
