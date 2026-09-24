import type { Note } from './note';
export function reorderNotes(notes: Note[], id: string, targetId: string, after: boolean): Note[] {
  const moved = notes.find((note) => note.id === id);
  if (!moved || id === targetId) return notes;
  const ordered = notes.filter((note) => note.id !== id);
  const index = ordered.findIndex((note) => note.id === targetId);
  if (index < 0) return notes;
  ordered.splice(index + Number(after), 0, moved);
  return ordered.map((note, position) => ({ ...note, position }));
}
