import type { Note } from '../notes/note';

export interface DeletedNote {
  noteId: string;
  title: string;
  version: number;
  revisionId: string;
  deletedAt: string;
}
export interface AutomationActor {
  id: string;
  writable: boolean;
  projectIds: string[] | '*';
}
export interface DeletionPlan {
  confirmationToken: string;
  projectId: string;
  expiresAt: string;
  count: number;
  items: { id: string; title: string; version: number }[];
}
export interface NoteRevision {
  revisionId: string;
  operation: string;
  actor: string;
  recordedAt: string;
  note: Note;
}
