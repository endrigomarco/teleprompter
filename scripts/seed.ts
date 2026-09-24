import './environment';
import { readFile } from 'node:fs/promises';
import { getPool } from '../src/server/database/pool';
import { parseImportData } from '../src/domain/backup/backup';
import { PostgresImportRepository } from '../src/server/repositories/postgres-import-repository';
import { reportFailure } from '../src/server/logging/diagnostics';
async function main(): Promise<void> {
  const pool = getPool();
  try {
    const imported = await new PostgresImportRepository(pool).initialize(async () => {
      const input: unknown = JSON.parse(await readFile('data/initial-notes.json', 'utf8'));
      return parseImportData(input);
    });
    console.log(
      imported
        ? 'Importação concluída com os IDs e a ordem originais.'
        : 'Importação já realizada. Nenhum dado alterado.',
    );
  } finally {
    await pool.end();
  }
}
main().catch(() => {
  reportFailure('import_failure');
  process.exitCode = 1;
});
