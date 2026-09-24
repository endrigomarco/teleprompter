'use client';
import type { Note } from '@/domain/notes/note';
import type { ProjectsViewModel } from './use-projects-view-model';
import { useNotesViewModel } from './use-notes-view-model';
import { useReaderViewModel } from './use-reader-view-model';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';
export function useWorkspaceViewModel(projects: ProjectsViewModel) {
  const notes = useNotesViewModel(projects.selectedProjectId),
    reader = useReaderViewModel(notes.selected);
  useKeyboardShortcuts(notes, reader, projects.open);
  function select(note: Note, focus = false) {
    reader.restart();
    notes.setSelectedId(note.id);
    if (focus) reader.viewportRef.current?.focus({ preventScroll: true });
  }

  function openProjects() {
    reader.pause();
    projects.show();
  }
  function editNote(note: Note | null) {
    reader.pause();
    notes.setForm({ note });
  }
  function deleteNote(note: Note) {
    reader.pause();
    notes.setDeleting(note);
  }
  return { notes, reader, select, openProjects, editNote, deleteNote };
}
