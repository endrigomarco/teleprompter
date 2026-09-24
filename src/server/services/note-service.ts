import type { NoteRepository } from '@/domain/notes/note';
import {
  noteDraftSchema,
  updateNoteSchema,
  versionSchema,
  reorderSchema,
} from '@/domain/notes/validation';
export class NoteService {
  constructor(private readonly repository: NoteRepository) {}
  list() {
    return this.repository.list();
  }
  create(input: unknown) {
    return this.repository.create(noteDraftSchema.parse(input));
  }
  update(id: string, input: unknown) {
    const { version, ...draft } = updateNoteSchema.parse(input);
    return this.repository.update(id, draft, version);
  }
  delete(id: string, input: unknown) {
    return this.repository.delete(id, versionSchema.parse(input).version);
  }
  reorder(input: unknown) {
    return this.repository.reorder(reorderSchema.parse(input).ids);
  }
}
