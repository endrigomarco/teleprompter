'use client';
import type { ProjectDraft } from '@/domain/projects/project';
import { FIELD_LIMITS } from '@/domain/shared/limits';
import { useProjectFormViewModel } from '../view-models/use-project-form-view-model';
interface Props {
  initial: ProjectDraft;
  busy: boolean;
  onSave: (draft: ProjectDraft) => Promise<boolean>;
  onCancel: () => void;
}
export function ProjectForm({ initial, busy, onSave, onCancel }: Props) {
  const form = useProjectFormViewModel(initial, onSave);
  return (
    <form
      className="project-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) void form.submit();
      }}
    >
      <label htmlFor="project-title">Título</label>
      <input
        id="project-title"
        autoFocus
        required
        maxLength={FIELD_LIMITS.title}
        value={form.title}
        disabled={busy}
        onChange={(event) => form.setTitle(event.target.value)}
      />
      <label htmlFor="project-description">Descrição</label>
      <textarea
        id="project-description"
        rows={3}
        maxLength={FIELD_LIMITS.description}
        value={form.description}
        disabled={busy}
        onChange={(event) => form.setDescription(event.target.value)}
      />
      {form.error && (
        <p className="project-error" role="alert">
          {form.error}
        </p>
      )}
      <div className="form-actions">
        <button type="button" disabled={busy} onClick={onCancel}>
          Cancelar
        </button>
        <button className="add-button" disabled={busy || !form.canSave}>
          {busy ? 'Salvando…' : 'Salvar projeto'}
        </button>
      </div>
    </form>
  );
}
