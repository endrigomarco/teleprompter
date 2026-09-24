'use client';
import { useEffect, useEffectEvent, useMemo, useRef, useState, type RefObject } from 'react';
import { findReaderMatches } from '@/domain/text/find-matches';
interface Options {
  content: string;
  resetKey: string;
  viewportRef: RefObject<HTMLDivElement | null>;
  pause: () => void;
  updateProgress: () => void;
}
export function useReaderSearch({
  content,
  resetKey,
  viewportRef,
  pause,
  updateProgress,
}: Options) {
  const searchRef = useRef<HTMLInputElement>(null);
  const marksRef = useRef<(HTMLElement | null)[]>([]);
  const [query, setQueryState] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const [jump, setJump] = useState(0);
  const matches = useMemo(() => findReaderMatches(content, query), [content, query]);
  useEffect(() => {
    setMatchIndex(0);
  }, [resetKey]);
  const scrollToMatch = useEffectEvent(() => {
    const view = viewportRef.current,
      mark = marksRef.current[matchIndex];
    if (!view || !mark || !matches.length) return;
    view.scrollTop +=
      mark.getBoundingClientRect().top - view.getBoundingClientRect().top - view.clientHeight * 0.3;
    updateProgress();
  });
  useEffect(() => {
    if (jump) scrollToMatch();
  }, [jump]);
  function setQuery(value: string) {
    pause();
    setQueryState(value);
    setMatchIndex(0);
    setJump((value) => value + 1);
  }
  function next(direction: number) {
    if (!matches.length) return;
    pause();
    setMatchIndex((value) => (value + direction + matches.length) % matches.length);
    setJump((value) => value + 1);
  }
  function clearSearch() {
    setQueryState('');
    setMatchIndex(0);
  }
  return { searchRef, marksRef, query, setQuery, matchIndex, matches, next, clearSearch };
}
