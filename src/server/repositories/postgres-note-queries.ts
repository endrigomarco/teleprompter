import type { Pool, PoolClient } from 'pg';
import type { Note } from '@/domain/notes/note';
import { AppError } from '@/domain/shared/app-error';
const columns = 'id, title, description, content, tags, position, version';
export class PostgresNoteQueries {
  constructor(
    protected readonly pool: Pool | PoolClient,
    protected readonly projectId: string,
  ) {}
  protected async assertProject(client: Pool | PoolClient) {
    if (!(await client.query('SELECT id FROM projects WHERE id=$1', [this.projectId])).rowCount)
      throw new AppError('not_found', 'Projeto não encontrado. Recarregue a página.');
  }
  async list(): Promise<Note[]> {
    await this.assertProject(this.pool);
    return (
      await this.pool.query<Note>(
        `SELECT ${columns} FROM notes WHERE project_id=$1 ORDER BY position`,
        [this.projectId],
      )
    ).rows;
  }
}
