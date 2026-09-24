import type { PoolClient } from 'pg';
import type { Note } from '@/domain/notes/note';
import type { TransactionHistory } from '@/domain/automation/ports';
export class PostgresNoteHistorySession implements TransactionHistory {
  constructor(
    private readonly client: PoolClient,
    private readonly projectId: string,
  ) {}
  async findRevision(noteId: string, revisionId: string): Promise<Note | null> {
    return (
      (
        await this.client.query<{ snapshot: Note }>(
          'SELECT snapshot FROM note_history WHERE revision_id=$1 AND note_id=$2 AND project_id=$3',
          [revisionId, noteId, this.projectId],
        )
      ).rows[0]?.snapshot ?? null
    );
  }
  async restoreDeleted(noteId: string, note: Note): Promise<Note> {
    return (
      await this.client.query<Note>(
        `INSERT INTO notes(id,title,description,content,tags,project_id,position,version)
         VALUES($1,$2,$3,$4,$5,$6,
         (SELECT COALESCE(MAX(position),-1)+1 FROM notes WHERE project_id=$6),
         (SELECT COALESCE(MAX((snapshot->>'version')::integer),0)+1 FROM note_history WHERE note_id=$1 AND project_id=$6))
         RETURNING id,title,description,content,tags,position,version`,
        [noteId, note.title, note.description, note.content, note.tags, this.projectId],
      )
    ).rows[0];
  }
}
