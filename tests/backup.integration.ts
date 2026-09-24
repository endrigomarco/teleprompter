import '../scripts/environment';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { PostgresImportRepository } from '../src/server/repositories/postgres-import-repository';
import { PostgresBackupRepository } from '../src/server/repositories/postgres-backup-repository';
import { PostgresMigrationRepository } from '../src/server/repositories/postgres-migration-repository';
import { parseImportData } from '../src/domain/backup/backup';

test('migração e backup: importação literal, roundtrip, execução única e rollback', async () => {
  const schema = 'test_' + randomUUID().replaceAll('-', '');
  const admin = new Pool({ connectionString: process.env.DATABASE_URL });
  await admin.query(`CREATE SCHEMA "${schema}"`);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    options: `-c search_path=${schema}`,
  });
  try {
    const migrations = new PostgresMigrationRepository(pool);
    const sources = ['001_notes.sql', '002_projects.sql', '003_note_history_mcp.sql'].map(
      (name) => ({
        name,
        read: () => readFile(`migrations/${name}`, 'utf8'),
      }),
    );
    assert.deepEqual(
      await migrations.apply(sources),
      sources.map((source) => source.name),
    );
    assert.deepEqual(await migrations.apply(sources), []);
    const importer = new PostgresImportRepository(pool);
    const exporter = new PostgresBackupRepository(pool);
    const note = {
      id: 'synthetic',
      titulo: ' Título ',
      descricao: ' descrição ',
      conteudo: ' Texto\n\n original ',
      tags: [' tag ', ' tag '],
    };
    assert.equal(await importer.initialize(async () => parseImportData([note])), true);
    assert.equal(
      await importer.initialize(async () => {
        throw new Error('Não deve ler novamente');
      }),
      false,
    );
    const backup = await exporter.snapshot();
    assert.equal(backup.notes[0].content, note.conteudo);
    assert.deepEqual(backup.notes[0].tags, note.tags);
    await pool.query('TRUNCATE notes,data_imports');
    assert.equal(await importer.initialize(async () => parseImportData(backup)), true);
    assert.deepEqual(await exporter.snapshot(), backup);
    await pool.query('TRUNCATE notes,data_imports');
    const before = await exporter.snapshot();
    const invalid = { ...backup, notes: [{ ...backup.notes[0], title: '   ' }] };
    await assert.rejects(() => importer.initialize(async () => parseImportData(invalid)));
    assert.deepEqual(await exporter.snapshot(), before);
    assert.equal((await pool.query('SELECT name FROM data_imports')).rowCount, 0);
    assert.throws(
      () => parseImportData({ ...backup, selectedProjectId: 'missing' }),
      /Projeto selecionado/,
    );
    assert.throws(
      () => parseImportData({ ...backup, notes: [{ ...backup.notes[0], project_id: 'missing' }] }),
      /sem projeto/,
    );
    assert.throws(
      () =>
        parseImportData({
          ...backup,
          notes: [backup.notes[0], { ...backup.notes[0], id: 'second' }],
        }),
      /Posição duplicada/,
    );
  } finally {
    await pool.end();
    await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end();
  }
});
