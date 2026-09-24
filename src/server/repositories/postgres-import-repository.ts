import type { Pool, PoolClient } from 'pg';
import {
  INITIAL_PROJECT_ID,
  IMPORT_MARKER,
  type Backup,
  type ImportData,
  type LegacyNote,
} from '@/domain/backup/backup';
import { transaction } from '../database/transaction';
export class PostgresImportRepository {
  constructor(private readonly pool: Pool) {}
  async initialize(load: () => Promise<ImportData>): Promise<boolean> {
    return transaction(this.pool, async (client) => {
      if (
        (await client.query('SELECT name FROM data_imports WHERE name=$1', [IMPORT_MARKER]))
          .rowCount
      )
        return false;
      await this.assertEmpty(client);
      const input = await load();
      if (input.kind === 'backup') await this.restore(client, input.backup);
      else await this.importLegacy(client, input.notes);
      await client.query('INSERT INTO data_imports(name) VALUES ($1)', [IMPORT_MARKER]);
      return true;
    });
  }
  private async assertEmpty(client: PoolClient): Promise<void> {
    if ((await client.query('SELECT id FROM notes LIMIT 1')).rowCount)
      throw new Error('O banco já tem notas. Importe em um banco vazio.');
    const projects = (await client.query<{ id: string }>('SELECT id FROM projects')).rows;
    if (projects.some((project) => project.id !== INITIAL_PROJECT_ID))
      throw new Error('Restaure somente em um banco vazio.');
  }
  private async importLegacy(client: PoolClient, notes: LegacyNote[]): Promise<void> {
    for (const [position, note] of notes.entries()) {
      await client.query(
        'INSERT INTO notes(id,title,description,content,tags,position,project_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [
          note.id,
          note.titulo,
          note.descricao,
          note.conteudo,
          note.tags,
          position,
          INITIAL_PROJECT_ID,
        ],
      );
    }
  }
  private async restore(client: PoolClient, backup: Backup): Promise<void> {
    await client.query('DELETE FROM projects');
    for (const project of backup.projects)
      await client.query(
        'INSERT INTO projects(id,title,description,version,created_at) VALUES ($1,$2,$3,$4,$5)',
        [project.id, project.title, project.description, project.version, project.created_at],
      );
    for (const note of backup.notes)
      await client.query(
        'INSERT INTO notes(id,project_id,title,description,content,tags,position,version,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [
          note.id,
          note.project_id,
          note.title,
          note.description,
          note.content,
          note.tags,
          note.position,
          note.version,
          note.created_at,
          note.updated_at,
        ],
      );
    await client.query('UPDATE app_settings SET selected_project_id=$1', [
      backup.selectedProjectId,
    ]);
  }
}
