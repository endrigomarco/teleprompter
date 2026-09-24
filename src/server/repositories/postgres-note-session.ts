import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { Note, NoteDraft, NoteRepository } from '@/domain/notes/note';
import { AppError } from '@/domain/shared/app-error';
import { PostgresNoteQueries } from './postgres-note-queries';
const columns = 'id, title, description, content, tags, position, version';
export class PostgresNoteSession extends PostgresNoteQueries implements NoteRepository {
  constructor(
    protected readonly pool: PoolClient,
    projectId: string,
  ) {
    super(pool, projectId);
  }
  async create(draft: NoteDraft): Promise<Note> {
    const client = this.pool;
    await this.assertProject(client);
    const result = await client.query<Note>(
      `INSERT INTO notes (id,title,description,content,tags,position,project_id)
        VALUES ($1,$2,$3,$4,$5,(SELECT COALESCE(MAX(position),-1)+1 FROM notes WHERE project_id=$6),$6) RETURNING ${columns}`,
      [randomUUID(), draft.title, draft.description, draft.content, draft.tags, this.projectId],
    );
    return result.rows[0];
  }
  async update(id: string, draft: NoteDraft, version: number): Promise<Note> {
    const client = this.pool;
    await this.assertProject(client);
    await this.assertVersion(client, id, version);
    return (
      await client.query<Note>(
        `UPDATE notes SET title=$2,description=$3,content=$4,tags=$5,version=version+1,updated_at=now() WHERE id=$1 RETURNING ${columns}`,
        [id, draft.title, draft.description, draft.content, draft.tags],
      )
    ).rows[0];
  }
  async delete(id: string, version: number): Promise<void> {
    const client = this.pool;
    await this.assertVersion(client, id, version);
    await client.query('DELETE FROM notes WHERE id=$1', [id]);
    await client.query(
      `WITH positions AS (SELECT id,(row_number() OVER (ORDER BY position)-1)::integer AS position FROM notes WHERE project_id=$1)
        UPDATE notes SET position=positions.position FROM positions WHERE notes.id=positions.id`,
      [this.projectId],
    );
  }
  async reorder(ids: string[]): Promise<Note[]> {
    const client = this.pool;
    await this.assertProject(client);
    const existing = (
      await client.query<{ id: string }>('SELECT id FROM notes WHERE project_id=$1', [
        this.projectId,
      ])
    ).rows;
    if (
      ids.length !== existing.length ||
      new Set(ids).size !== ids.length ||
      existing.some((note) => !ids.includes(note.id))
    ) {
      throw new AppError('conflict', 'A lista mudou. Recarregue antes de reordenar.');
    }
    await client.query(
      `UPDATE notes SET position=ordered.position::integer - 1 FROM unnest($1::text[]) WITH ORDINALITY AS ordered(id,position) WHERE notes.id=ordered.id`,
      [ids],
    );
    return (
      await client.query<Note>(
        `SELECT ${columns} FROM notes WHERE project_id=$1 ORDER BY position`,
        [this.projectId],
      )
    ).rows;
  }
  private async assertVersion(client: PoolClient, id: string, version: number): Promise<void> {
    const result = await client.query<{ version: number }>(
      'SELECT version FROM notes WHERE id=$1 AND project_id=$2 FOR UPDATE',
      [id, this.projectId],
    );
    if (!result.rows[0])
      throw new AppError('not_found', 'Anotação não encontrada. Recarregue a página.');
    if (result.rows[0].version !== version)
      throw new AppError(
        'conflict',
        'Esta anotação mudou em outra janela. Copie suas alterações e recarregue a página.',
      );
  }
}
