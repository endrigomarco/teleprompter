import type { Note, NoteDraft } from '@/domain/notes/note';
import { requestJson } from './json-request';
import { noteResponseSchema, notesResponseSchema, deleteResponseSchema } from './response-schemas';
export interface NotesApi {
  list(signal?: AbortSignal): Promise<Note[]>;
  create(draft: NoteDraft): Promise<Note>;
  update(note: Note, draft: NoteDraft): Promise<Note>;
  delete(note: Note): Promise<{ ok: true }>;
  reorder(ids: string[]): Promise<Note[]>;
}
export function createNotesApi(projectId: string): NotesApi {
  const url = (path = '') => `/api/notes${path}?projectId=${encodeURIComponent(projectId)}`;
  return {
    list: (signal) => requestJson(url(), notesResponseSchema, { signal }),
    create: (draft) =>
      requestJson(url(), noteResponseSchema, { method: 'POST', body: JSON.stringify(draft) }),
    update: (note, draft) =>
      requestJson(url(`/${encodeURIComponent(note.id)}`), noteResponseSchema, {
        method: 'PUT',
        body: JSON.stringify({ ...draft, version: note.version }),
      }),
    delete: (note) =>
      requestJson(url(`/${encodeURIComponent(note.id)}`), deleteResponseSchema, {
        method: 'DELETE',
        body: JSON.stringify({ version: note.version }),
      }),
    reorder: (ids) =>
      requestJson(url('/order'), notesResponseSchema, {
        method: 'PUT',
        body: JSON.stringify({ ids }),
      }),
  };
}
