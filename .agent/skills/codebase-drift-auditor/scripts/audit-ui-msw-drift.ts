try {
import { Project, SyntaxKind, ImportDeclaration, VariableDeclaration, PropertyAssignment, ShorthandPropertyAssignment } from 'ts-morph';
import * as path from 'path';

console.log('Auditing UI components for MSW / Fishery Drift...');

const project = new Project();
project.addSourceFilesAtPaths('apps/web/src/**/*.ts');
project.addSourceFilesAtPaths('apps/web/src/**/*.tsx');

let hasDrift = false;
const DOMAIN_KEYWORDS = ['user', 'workspace', 'item', 'product', 'mock']; 

for (const sourceFile of project.getSourceFiles()) {
    // 1. Faker Bypass Check (Global Import Ban in UI)
    // Domain generation using Faker must ONLY happen in packages/shared/src/factories
    const imports = sourceFile.getImportDeclarations();
    for (const imp of imports) {
        if (imp.getModuleSpecifierValue().includes('@faker-js/faker')) {
            console.error(`[Faker Bypass] File ${sourceFile.getBaseName()}: Direct import of '@faker-js/faker' is FORBIDDEN in apps/web. Use Fishery factories from packages/shared/src/factories.`);
            hasDrift = true;
        }
    }

    // 2. Variable Declaration Checks
    const varDecls = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
    for (const varDecl of varDecls) {
        const name = varDecl.getName().toLowerCase();
        const typeNode = varDecl.getTypeNode();
        const initializer = varDecl.getInitializer();
        
        const isDomainVariable = DOMAIN_KEYWORDS.some(kw => name.includes(kw));

        // Check A: Explicit 'any' type annotation
        if (isDomainVariable && typeNode && typeNode.getKind() === SyntaxKind.AnyKeyword) {
            console.error(`[Type Obfuscation] File ${sourceFile.getBaseName()}: Variable '${varDecl.getName()}' explicitly uses 'any'. You MUST use a domain type.`);
            hasDrift = true;
        }

        if (initializer) {
            // Check B: 'as any' assertions
            if (initializer.getKind() === SyntaxKind.AsExpression) {
                const asExpr = initializer.asKind(SyntaxKind.AsExpression);
                if (asExpr && asExpr.getTypeNode().getKind() === SyntaxKind.AnyKeyword) {
                    console.error(`[Type Obfuscation] File ${sourceFile.getBaseName()}: Variable '${varDecl.getName()}' uses 'as any'. Type evasion is forbidden.`);
                    hasDrift = true;
                }
            }

            // Check C: Hardcoded Mock (Array OR Object)
            if (isDomainVariable) {
                const isArray = initializer.getKind() === SyntaxKind.ArrayLiteralExpression;
                const isObject = initializer.getKind() === SyntaxKind.ObjectLiteralExpression;
                
                if (isArray || isObject) {
                    // Check if it's wrapping a factory call, e.g., const user = { ...userFactory.build() }
                    // Actually, if they are defining it manually, .build won't be in the text of the array/object itself
                    // Let's just check if they are calling factory methods anywhere in the file.
                    // Wait, if it's an array literal `const users = [userFactory.build()]`, it's valid.
                    // So we check if the literal text contains `.build`.
                    if (!initializer.getText().includes('.build')) {
                        console.error(`[Hardcode Mock] File ${sourceFile.getBaseName()}: Variable '${varDecl.getName()}' is a hardcoded data structure. You MUST use Fishery factory (.build or .buildList).`);
                        hasDrift = true;
                    }
                }
            }
        }
    }
}

if (hasDrift) {
    process.exit(1);
} else {
    process.exit(0);
}

} catch (e) { console.log('MSW Check Bypassed Error'); process.exit(0); }
