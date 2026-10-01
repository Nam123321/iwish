require('./watchmen_core.js').verify_execution(__filename);
import fs from 'fs';
import path from 'path';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';
import generatorModule from '@babel/generator';
import * as t from '@babel/types';

const traverse = traverseModule.default || traverseModule;
const generate = generatorModule.default || generatorModule;

const SRC_DIR = path.resolve('./src');

function generateKey(str) {
  let clean = str.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
  return clean ? clean.substring(0, 30) : 'notification';
}

function processFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  if (!code.includes('alert') && !code.includes('confirm')) return;

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (e) {
    console.error(`Parse error in ${filePath}: ${e.message}`);
    return;
  }

  let modified = false;
  let needsToast = false;
  let needsConfirm = false;
  let needsTranslation = false;

  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      const isAlert = t.isIdentifier(callee, { name: 'alert' }) || (t.isMemberExpression(callee) && t.isIdentifier(callee.object, { name: 'window' }) && t.isIdentifier(callee.property, { name: 'alert' }));
      const isConfirm = t.isIdentifier(callee, { name: 'confirm' }) || (t.isMemberExpression(callee) && t.isIdentifier(callee.object, { name: 'window' }) && t.isIdentifier(callee.property, { name: 'confirm' }));

      if (!isAlert && !isConfirm) return;

      // Skip if we are inside our own use-confirm hook
      if (filePath.includes('use-confirm')) return;

      const arg = path.node.arguments[0];
      if (!arg) return;

      modified = true;
      needsTranslation = true;

      // Try to extract string for key
      let key = 'notification';
      if (t.isStringLiteral(arg)) {
        key = generateKey(arg.value);
      } else if (t.isTemplateLiteral(arg) && arg.quasis.length > 0) {
        key = generateKey(arg.quasis[0].value.raw);
      }

      // Generate t(key, arg)
      const tCall = t.callExpression(t.identifier('t'), [t.stringLiteral(key), arg]);

      if (isAlert) {
        needsToast = true;
        // toast({ description: t(key, arg) })
        const toastCall = t.callExpression(t.identifier('toast'), [
          t.objectExpression([
            t.objectProperty(t.identifier('description'), tCall)
          ])
        ]);
        path.replaceWith(toastCall);
        path.skip();
      } else if (isConfirm) {
        // Prevent infinite loop if already handled
        if (path.parentPath && path.parentPath.isAwaitExpression()) return;
        needsConfirm = true;
        // await confirm(t(key, arg))
        const confirmCall = t.awaitExpression(t.callExpression(t.identifier('confirm'), [tCall]));
        path.replaceWith(confirmCall);
        path.skip();

        // We must also ensure the enclosing function is async
        let parentFunc = path.findParent(p => p.isFunction());
        if (parentFunc && !parentFunc.node.async) {
          parentFunc.node.async = true;
        }
      }
    }
  });

  if (modified) {
    // Add imports
    let lastImportIndex = -1;
    ast.program.body.forEach((node, index) => {
      if (t.isImportDeclaration(node)) {
        lastImportIndex = index;
      }
    });

    const addImport = (specifiers, source) => {
      ast.program.body.splice(lastImportIndex + 1, 0, t.importDeclaration(specifiers, t.stringLiteral(source)));
      lastImportIndex++;
    };

    let hasToast = false, hasConfirm = false, hasTranslation = false;
    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value.includes('use-toast')) hasToast = true;
        if (path.node.source.value.includes('use-confirm')) hasConfirm = true;
        if (path.node.source.value === 'react-i18next') hasTranslation = true;
      }
    });

    if (needsToast && !hasToast) addImport([t.importSpecifier(t.identifier('useToast'), t.identifier('useToast'))], '@/components/ui/use-toast');
    if (needsConfirm && !hasConfirm) addImport([t.importSpecifier(t.identifier('useConfirm'), t.identifier('useConfirm'))], '@/components/ui/use-confirm');
    if (needsTranslation && !hasTranslation) addImport([t.importSpecifier(t.identifier('useTranslation'), t.identifier('useTranslation'))], 'react-i18next');

    // Add hooks to functional components
    traverse(ast, {
      Function(path) {
        let isComponent = false;
        path.traverse({
          JSXElement() { isComponent = true; },
          JSXFragment() { isComponent = true; }
        });
        
        // Also if it's a hook or function that needs 't', we should inject but React hooks can only be called in components/hooks.
        // If it's not a component, we will still inject but maybe cause rule of hooks error.
        
        if ((isComponent || path.node.id?.name?.startsWith('use')) && t.isBlockStatement(path.node.body)) {
          let usesToast = false, usesConfirm = false, usesT = false;
          let hasToastHook = false, hasConfirmHook = false, hasTHook = false;
          
          path.traverse({
            CallExpression(cp) {
              if (t.isIdentifier(cp.node.callee, { name: 'toast' })) usesToast = true;
              if (t.isIdentifier(cp.node.callee, { name: 'confirm' })) usesConfirm = true;
              if (t.isIdentifier(cp.node.callee, { name: 't' })) usesT = true;
              if (t.isIdentifier(cp.node.callee, { name: 'useToast' })) hasToastHook = true;
              if (t.isIdentifier(cp.node.callee, { name: 'useConfirm' })) hasConfirmHook = true;
              if (t.isIdentifier(cp.node.callee, { name: 'useTranslation' })) hasTHook = true;
            }
          });

          // Prevent injecting hooks inside callbacks. We should only inject at the root of the component.
          // Wait, path is the component function. We only inject if it's the TOP LEVEL of this function.
          // The usesToast flag means toast is used ANYWHERE inside this function.
          // So we inject at the top of THIS function. But wait, if this function is a callback INSIDE a component,
          // we shouldn't inject hooks here. We should inject in the PARENT component.
          
          // To fix this: Only inject if this function is the top-level declaration in the module OR exported.
          // A better way: If the function name starts with uppercase (Component) or "use" (hook).
          const isReactRoot = path.node.id && /^[A-Z]|use/.test(path.node.id.name) || 
                              (path.parentPath.isVariableDeclarator() && /^[A-Z]|use/.test(path.parentPath.node.id.name)) ||
                              path.parentPath.isExportDefaultDeclaration();
                              
          if (isReactRoot) {
            const injects = [];
            if (usesToast && !hasToastHook) injects.push(
              t.variableDeclaration('const', [t.variableDeclarator(t.objectPattern([t.objectProperty(t.identifier('toast'), t.identifier('toast'), false, true)]), t.callExpression(t.identifier('useToast'), []))])
            );
            if (usesConfirm && !hasConfirmHook) injects.push(
              t.variableDeclaration('const', [t.variableDeclarator(t.identifier('confirm'), t.callExpression(t.identifier('useConfirm'), []))])
            );
            if (usesT && !hasTHook) injects.push(
              t.variableDeclaration('const', [t.variableDeclarator(t.objectPattern([t.objectProperty(t.identifier('t'), t.identifier('t'), false, true)]), t.callExpression(t.identifier('useTranslation'), []))])
            );

            if (injects.length > 0) {
              path.node.body.body.unshift(...injects);
            }
          }
        }
      }
    });

    const newCode = generate(ast, {}, code).code;
    fs.writeFileSync(filePath, newCode, 'utf-8');
    console.log(`Refactored: ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
      processFile(filePath);
    }
  });
}

walk(SRC_DIR);
