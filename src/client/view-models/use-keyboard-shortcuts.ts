'use client';
import { useEffect } from 'react';
import type { NotesViewModel } from './use-notes-view-model';
import type { ReaderViewModel } from './use-reader-view-model';
export function useKeyboardShortcuts(
  notes: NotesViewModel,
  reader: ReaderViewModel,
  blocked = false,
) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (blocked || notes.form || notes.deleting) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        reader.pause();
        reader.searchRef.current?.focus();
        reader.searchRef.current?.select();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        notes.searchRef.current?.focus();
        notes.searchRef.current?.select();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        notes.setQuery('');
        notes.searchRef.current?.focus({ preventScroll: true });
        return;
      }
      if (
        event.code === 'Space' &&
        !event.repeat &&
        event.target instanceof Element &&
        !event.target.closest('input,button,textarea,select,[contenteditable="true"]')
      ) {
        event.preventDefault();
        reader.toggle();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [notes, reader, blocked]);
}
