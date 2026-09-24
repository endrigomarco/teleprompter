import './environment';
import { mkdir, writeFile } from 'node:fs/promises';
import { getPool } from '../src/server/database/pool';
import { PostgresBackupRepository } from '../src/server/repositories/postgres-backup-repository';
import { reportFailure } from '../src/server/logging/diagnostics';
async function main(): Promise<void> {
  const pool = getPool();
  try {
    const backup = await new PostgresBackupRepository(pool).snapshot();
    const path = `backups/projects-${new Date().toISOString().replaceAll(':', '-')}.json`;
    await mkdir('backups', { recursive: true });
    await writeFile(path, JSON.stringify(backup, null, 2) + '\n', { mode: 0o600 });
    console.log(`Backup salvo em ${path}`);
  } finally {
    await pool.end();
  }
}
main().catch(() => {
  reportFailure('export_failure');
  process.exitCode = 1;
});
