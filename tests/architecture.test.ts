import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory()
        ? sourceFiles(file)
        : Promise.resolve(/\.tsx?$/.test(file) ? [file] : []);
    }),
  );
  return groups.flat();
}
function allowedImport(file: string, specifier: string): boolean {
  const target = specifier.startsWith('@/')
    ? 'src/' + specifier.slice(2)
    : specifier.startsWith('.')
      ? path.normalize(path.join(path.dirname(file), specifier))
      : specifier;
  if (file.startsWith('src/domain/'))
    return !target.startsWith('src/') ? specifier === 'zod' : target.startsWith('src/domain/');
  if (file.startsWith('src/client/'))
    return (
      !target.startsWith('src/server/') &&
      !target.startsWith('src/app/') &&
      specifier !== 'pg' &&
      !specifier.startsWith('node:')
    );
  if (file.startsWith('src/server/services/'))
    return !target.startsWith('src/') ? specifier === 'zod' : target.startsWith('src/domain/');
  if (file.startsWith('src/server/'))
    return !target.startsWith('src/client/') && !target.startsWith('src/app/');
  if (file.startsWith('src/app/api/')) return target === 'src/server/composition';
  return true;
}
test('camadas impedem domínio e serviços de depender de detalhes externos', async () => {
  const files = await sourceFiles('src');
  const violations: string[] = [];
  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      await readFile(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node: ts.Node): void {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        if (!allowedImport(file, node.moduleSpecifier.text))
          violations.push(`${file}: ${node.moduleSpecifier.text}`);
      }
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const specifier = node.arguments[0];
        if (!specifier || !ts.isStringLiteral(specifier) || !allowedImport(file, specifier.text))
          violations.push(`${file}: import dinâmico não permitido`);
      }
      if (node.kind === ts.SyntaxKind.AnyKeyword || ts.isNonNullExpression(node))
        violations.push(`${file}: tipo ou asserção insegura`);
      if (
        ts.isIdentifier(node) &&
        node.text === 'fetch' &&
        file.startsWith('src/client/') &&
        !file.startsWith('src/client/api/')
      )
        violations.push(`${file}: transporte fora do cliente HTTP`);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.deepEqual(violations, []);
});
test('regras de fronteira rejeitam exemplos inválidos', () => {
  assert.equal(allowedImport('src/domain/example.ts', 'react'), false);
  assert.equal(allowedImport('src/domain/example.ts', '@/server/database/pool'), false);
  assert.equal(allowedImport('src/client/components/example.tsx', 'pg'), false);
  assert.equal(allowedImport('src/server/services/example.ts', '../repositories/example'), false);
  assert.equal(allowedImport('src/app/api/example/route.ts', '@/server/database/pool'), false);
  assert.equal(allowedImport('src/server/services/example.ts', '@/domain/projects/project'), true);
});
