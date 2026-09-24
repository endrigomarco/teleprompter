import type { Pool } from 'pg';
import type { NoteDraft, NoteRepository } from '@/domain/notes/note';
import { transaction } from '../database/transaction';
import { PostgresNoteQueries } from './postgres-note-queries';
import { PostgresNoteSession } from './postgres-note-session';

export class PostgresNoteRepository implements NoteRepository {
  constructor(
    private readonly pool: Pool,
    private readonly projectId: string,
  ) {}
  list() {
    return new PostgresNoteQueries(this.pool, this.projectId).list();
  }
  create(draft: NoteDraft) {
    return transaction(this.pool, (client) =>
      new PostgresNoteSession(client, this.projectId).create(draft),
    );
  }
  update(id: string, draft: NoteDraft, version: number) {
    return transaction(this.pool, (client) =>
      new PostgresNoteSession(client, this.projectId).update(id, draft, version),
    );
  }
  delete(id: string, version: number) {
    return transaction(this.pool, (client) =>
      new PostgresNoteSession(client, this.projectId).delete(id, version),
    );
  }
  reorder(ids: string[]) {
    return transaction(this.pool, (client) =>
      new PostgresNoteSession(client, this.projectId).reorder(ids),
    );
  }
}
