'use client';
import { FIELD_LIMITS } from '@/domain/shared/limits';
import { useRef, useState } from 'react';
import type { Note, NoteDraft } from '@/domain/notes/note';
import { noteDraftSchema } from '@/domain/notes/validation';
import { formatTeleprompter } from '@/domain/text/format-teleprompter';
export function useNoteFormViewModel(note: Note | null, save: (draft: NoteDraft) => Promise<void>) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [description, setDescription] = useState(note?.description ?? '');
  const [tags, setTags] = useState(note?.tags.join(', ') ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [error, setError] = useState('');
  const [formatStatus, setFormatStatus] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);
  async function submit() {
    const parsed = noteDraftSchema.safeParse({
      title,
      description,
      tags: tags.split(','),
      content,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError('');
    try {
      await save(parsed.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível salvar.');
    }
  }
  function format() {
    if (!content.trim()) {
      setFormatStatus('Cole ou escreva o texto primeiro.');
      contentRef.current?.focus();
      return;
    }
    const formatted = formatTeleprompter(content);
    if (formatted.length > FIELD_LIMITS.content) {
      setFormatStatus('O texto ficou muito longo. Reduza o conteúdo antes de transformar.');
      return;
    }
    setContent(formatted);
    setFormatStatus('Texto organizado. Clique em salvar para guardar as alterações.');
    contentRef.current?.focus();
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }
  return {
    title,
    setTitle,
    description,
    setDescription,
    tags,
    setTags,
    content,
    setContent,
    error,
    formatStatus,
    contentRef,
    submit,
    format,
  };
}
