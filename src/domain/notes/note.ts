export interface NoteDraft {
  title: string;
  description: string;
  tags: string[];
  content: string;
}
export interface Note extends NoteDraft {
  id: string;
  position: number;
  version: number;
}
export interface NoteRepository {
  list(): Promise<Note[]>;
  create(draft: NoteDraft): Promise<Note>;
  update(id: string, draft: NoteDraft, version: number): Promise<Note>;
  delete(id: string, version: number): Promise<void>;
  reorder(ids: string[]): Promise<Note[]>;
}
