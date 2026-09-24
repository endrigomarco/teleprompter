'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Note, NoteDraft } from '@/domain/notes/note';
import { indexNotes, normalizeSearch, searchNotes } from '@/domain/notes/search';
import { reorderNotes } from '@/domain/notes/reorder';
import { createNotesApi } from '../api/notes-api';
export function useNotesViewModel(projectId: string | null) {
  const notesApi = useMemo(() => createNotesApi(projectId ?? ''), [projectId]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQueryState] = useState('');
  const [cursor, setCursor] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState<{ note: Note | null } | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    const abort = new AbortController();
    notesApi
      .list(abort.signal)
      .then((data) => {
        if (abort.signal.aborted) return;
        setNotes(data);
        setSelectedId(data[0]?.id ?? null);
        setError('');
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setError(
            error instanceof Error ? error.message : 'Não foi possível carregar as anotações.',
          );
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [notesApi, projectId]);
  const index = useMemo(() => indexNotes(notes), [notes]);
  const results = useMemo(() => searchNotes(index, query), [index, query]);
  const selected = notes.find((note) => note.id === selectedId) ?? null;
  function setQuery(value: string) {
    setQueryState(value);
    setCursor(-1);
    setStatus('');
  }
  async function mutate<T>(action: () => Promise<T>): Promise<T> {
    if (lock.current) throw new Error('Aguarde a alteração atual.');
    lock.current = true;
    setBusy(true);
    try {
      return await action();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function save(draft: NoteDraft) {
    const saved = await mutate(() =>
      form?.note ? notesApi.update(form.note, draft) : notesApi.create(draft),
    );
    setNotes((current) =>
      current.some((note) => note.id === saved.id)
        ? current.map((note) => (note.id === saved.id ? saved : note))
        : [...current, saved],
    );
    setSelectedId(saved.id);
    setQuery('');
    setForm(null);
  }
  async function remove() {
    if (!deleting) return;
    await mutate(() => notesApi.delete(deleting));
    setNotes((current) => current.filter((note) => note.id !== deleting.id));
    if (selectedId === deleting.id) setSelectedId(null);
    setDeleting(null);
    setCursor(-1);
  }
  async function move(id: string, targetId: string, after: boolean) {
    if (lock.current || normalizeSearch(query)) return;
    const ordered = reorderNotes(notes, id, targetId, after);
    if (ordered.every((note, index) => note.id === notes[index].id)) return;
    setStatus('Salvando ordem…');
    try {
      setNotes(await mutate(() => notesApi.reorder(ordered.map((note) => note.id))));
      setStatus('Ordem salva. Arraste pelo ⠿ para reorganizar.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível salvar a ordem.');
    }
  }
  function navigateResults(direction: -1 | 1): void {
    setCursor((current) =>
      direction > 0 ? Math.min(current + 1, results.length - 1) : Math.max(current - 1, 0),
    );
  }
  function moveByKeyboard(id: string, direction: -1 | 1): void {
    const target = notes[notes.findIndex((note) => note.id === id) + direction];
    if (target) void move(id, target.id, direction > 0);
  }
  return {
    navigateResults,
    focusedResult: results[Math.max(cursor, 0)] ?? null,
    moveByKeyboard,
    notes,
    results,
    selected,
    selectedId,
    setSelectedId,
    query,
    setQuery,
    cursor,
    setCursor,
    loading,
    busy,
    error,
    status,
    form,
    setForm,
    deleting,
    setDeleting,
    searchRef,
    save,
    remove,
    move,
  };
}
export type NotesViewModel = ReturnType<typeof useNotesViewModel>;
