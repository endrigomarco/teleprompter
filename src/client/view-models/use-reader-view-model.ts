'use client';
import { useState } from 'react';
import type { Note } from '@/domain/notes/note';
import { useAutoScroll } from './use-auto-scroll';
import { useReaderSearch } from './use-reader-search';
export function useReaderViewModel(note: Note | null) {
  const [fontSize, setFontSize] = useState(34);
  const resetKey = note ? `${note.id}:${note.version}` : '';
  const scroll = useAutoScroll(resetKey, fontSize);
  const search = useReaderSearch({
    content: note?.content ?? '',
    resetKey,
    viewportRef: scroll.viewportRef,
    pause: scroll.pause,
    updateProgress: scroll.updateProgress,
  });
  return { ...scroll, ...search, fontSize, setFontSize };
}
export type ReaderViewModel = ReturnType<typeof useReaderViewModel>;
