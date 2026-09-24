'use client';
import type { Project } from '@/domain/projects/project';
interface Props {
  project: Project;
  busy: boolean;
  onCancel: () => void;
  onDelete: () => Promise<void>;
}
export function ProjectDeleteConfirmation({ project, busy, onCancel, onDelete }: Props) {
  return (
    <>
      <p>
        Excluir <strong>{project.title}</strong> e todas as suas anotações ({project.noteCount})?
        Essa ação não pode ser desfeita.
      </p>
      <div className="form-actions">
        <button disabled={busy} onClick={onCancel}>
          Cancelar
        </button>
        <button className="project-danger" disabled={busy} onClick={() => void onDelete()}>
          Excluir projeto
        </button>
      </div>
    </>
  );
}
