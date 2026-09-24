'use client';
import { useState } from 'react';
import type { ProjectDraft } from '@/domain/projects/project';
import { projectDraftSchema } from '@/domain/projects/validation';
export function useProjectFormViewModel(
  initial: ProjectDraft,
  onSave: (draft: ProjectDraft) => Promise<boolean>,
) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [error, setError] = useState('');
  async function submit(): Promise<void> {
    const result = projectDraftSchema.safeParse({ title, description });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Confira os campos.');
      return;
    }
    setError('');
    await onSave(result.data);
  }
  return {
    title,
    setTitle,
    description,
    setDescription,
    error,
    submit,
    canSave: Boolean(title.trim()),
  };
}
