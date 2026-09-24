import type { Pool } from 'pg';
import type { Backup } from '@/domain/backup/backup';
import { transaction } from '../database/transaction';
type ProjectRow = Omit<Backup['projects'][number], 'created_at'> & { created_at: Date };
type NoteRow = Omit<Backup['notes'][number], 'created_at' | 'updated_at'> & {
  created_at: Date;
  updated_at: Date;
};
export class PostgresBackupRepository {
  constructor(private readonly pool: Pool) {}
  async snapshot(): Promise<Backup> {
    return transaction(this.pool, async (client) => {
      const projects = (
        await client.query<ProjectRow>(
          'SELECT id,title,description,version,created_at FROM projects ORDER BY created_at,id',
        )
      ).rows;
      const notes = (
        await client.query<NoteRow>(
          'SELECT id,project_id,title,description,content,tags,position,version,created_at,updated_at FROM notes ORDER BY project_id,position',
        )
      ).rows;
      const settings = (
        await client.query<{ selected_project_id: string | null }>(
          'SELECT selected_project_id FROM app_settings WHERE singleton=true',
        )
      ).rows[0];
      if (!settings) throw new Error('Configuração de projetos ausente.');
      return {
        format: 'teleprompter-projects-v1',
        selectedProjectId: settings.selected_project_id,
        projects: projects.map((project) => ({
          ...project,
          created_at: project.created_at.toISOString(),
        })),
        notes: notes.map((note) => ({
          ...note,
          created_at: note.created_at.toISOString(),
          updated_at: note.updated_at.toISOString(),
        })),
      };
    });
  }
}
