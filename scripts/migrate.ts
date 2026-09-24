import './environment';
import { readdir, readFile } from 'node:fs/promises';
import { getPool } from '../src/server/database/pool';
import { PostgresMigrationRepository } from '../src/server/repositories/postgres-migration-repository';
import { reportFailure } from '../src/server/logging/diagnostics';
async function main(): Promise<void> {
  const pool = getPool();
  try {
    const names = (await readdir('migrations')).filter((name) => name.endsWith('.sql')).sort();
    const applied = await new PostgresMigrationRepository(pool).apply(
      names.map((name) => ({ name, read: () => readFile(`migrations/${name}`, 'utf8') })),
    );
    for (const name of applied) console.log(`Migração aplicada: ${name}`);
  } finally {
    await pool.end();
  }
}
main().catch(() => {
  reportFailure('migration_failure');
  process.exitCode = 1;
});
