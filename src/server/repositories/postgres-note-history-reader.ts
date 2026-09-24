import type { Pool } from 'pg';
import type { DeletedQuery, HistoryQuery } from '@/domain/automation/validation';
import type { DeletedNote, NoteRevision } from '@/domain/automation/models';
import type { NoteHistoryReader } from '@/domain/automation/ports';
export class PostgresNoteHistoryReader implements NoteHistoryReader {
  constructor(private readonly pool: Pool) {}
  async deleted(input: DeletedQuery): Promise<DeletedNote[]> {
    return (
      await this.pool.query<DeletedNote>(
        `WITH latest AS (
        SELECT DISTINCT ON (note_id) note_id,revision_id,snapshot,recorded_at,operation
        FROM note_history WHERE project_id=$1 ORDER BY note_id,revision_id DESC
      ) SELECT note_id AS "noteId",snapshot->>'title' AS title,(snapshot->>'version')::integer AS version,
        revision_id::text AS "revisionId",recorded_at::text AS "deletedAt"
        FROM latest WHERE operation='delete'
        AND NOT EXISTS (SELECT 1 FROM notes WHERE id=latest.note_id AND project_id=$1)
        AND ($2::bigint IS NULL OR revision_id<$2::bigint)
        ORDER BY revision_id DESC LIMIT $3`,
        [input.projectId, input.beforeRevisionId ?? null, input.limit],
      )
    ).rows;
  }
  async history(input: HistoryQuery): Promise<NoteRevision[]> {
    return (
      await this.pool.query<NoteRevision>(
        `SELECT revision_id::text AS "revisionId",operation,actor,recorded_at::text AS "recordedAt",
       jsonb_build_object('id',snapshot->'id','title',snapshot->'title','description',snapshot->'description',
       'content',snapshot->'content','tags',snapshot->'tags','position',snapshot->'position','version',snapshot->'version') AS note
       FROM note_history WHERE project_id=$1 AND note_id=$2 AND ($3::bigint IS NULL OR revision_id<$3::bigint)
       ORDER BY revision_id DESC LIMIT $4`,
        [input.projectId, input.noteId, input.beforeRevisionId ?? null, input.limit],
      )
    ).rows;
  }
}
