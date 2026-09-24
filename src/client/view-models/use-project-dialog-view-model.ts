'use client';
import { useState } from 'react';
import type { Project, ProjectDraft } from '@/domain/projects/project';
import type { ProjectsViewModel } from './use-projects-view-model';
type Screen =
  | { kind: 'list' }
  | { kind: 'form'; project: Project | null }
  | { kind: 'delete'; project: Project };
export function useProjectDialogViewModel(projects: ProjectsViewModel) {
  const [screen, setScreen] = useState<Screen>({ kind: 'list' });
  function showList(): void {
    setScreen({ kind: 'list' });
  }
  async function save(draft: ProjectDraft): Promise<boolean> {
    if (screen.kind !== 'form') return false;
    const saved = await (screen.project
      ? projects.update(screen.project, draft)
      : projects.create(draft));
    if (saved) showList();
    return saved;
  }
  async function remove(): Promise<void> {
    if (screen.kind === 'delete' && (await projects.remove(screen.project))) showList();
  }
  const title =
    screen.kind === 'list'
      ? 'Alterar projeto'
      : screen.kind === 'delete'
        ? 'Excluir projeto'
        : screen.project
          ? 'Editar projeto'
          : 'Novo projeto';
  return {
    screen,
    title,
    showList,
    save,
    remove,
    edit: (project: Project | null) => setScreen({ kind: 'form', project }),
    confirmDelete: (project: Project) => setScreen({ kind: 'delete', project }),
  };
}
