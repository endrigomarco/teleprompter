'use client';
import { useEffect, useRef, useState } from 'react';
import type { Project, ProjectDraft, ProjectState } from '@/domain/projects/project';
import { projectsApi } from '../api/projects-api';
export function useProjectsViewModel() {
  const [state, setState] = useState<ProjectState>({ projects: [], selectedProjectId: null });
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [open, setOpen] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    const abort = new AbortController();
    projectsApi
      .list(abort.signal)
      .then((data) => {
        if (!abort.signal.aborted) setState(data);
      })
      .catch((e) => {
        if (!abort.signal.aborted)
          setError(e instanceof Error ? e.message : 'Não foi possível carregar os projetos.');
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, []);
  async function run(action: () => Promise<ProjectState>, close = false) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      setState(await action());
      if (close) setOpen(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível alterar o projeto.');
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return {
    ...state,
    loading,
    busy,
    error,
    open,
    setOpen,
    active: state.projects.find((p) => p.id === state.selectedProjectId) ?? null,
    show: () => {
      setOpen(true);
      void run(() => projectsApi.list());
    },
    create: (draft: ProjectDraft) => run(() => projectsApi.create(draft), true),
    update: (project: Project, draft: ProjectDraft) =>
      run(() => projectsApi.update(project, draft)),
    remove: (project: Project) => run(() => projectsApi.delete(project)),
    select: (id: string) => run(() => projectsApi.select(id), true),
  };
}
export type ProjectsViewModel = ReturnType<typeof useProjectsViewModel>;
