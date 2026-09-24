'use client';
import { useWorkspaceViewModel } from '../view-models/use-workspace-view-model';
import {
  useProjectsViewModel,
  type ProjectsViewModel,
} from '../view-models/use-projects-view-model';
import { ProjectManager } from './project-manager';
import { NoteLibrary } from './note-library';
import { Teleprompter } from './teleprompter';
import { NoteForm } from './note-form';
import { DeleteConfirmation } from './delete-confirmation';
export function Workspace() {
  const projects = useProjectsViewModel();
  if (projects.loading) return <p className="empty">Carregando projetos…</p>;
  return (
    <>
      {projects.error && !projects.open && (
        <p className="project-error" role="alert">
          {projects.error} <button onClick={() => window.location.reload()}>Recarregar</button>
        </p>
      )}
      <ProjectWorkspace key={projects.selectedProjectId ?? 'empty'} projects={projects} />
      {projects.open && <ProjectManager vm={projects} />}
    </>
  );
}
function ProjectWorkspace({ projects }: { projects: ProjectsViewModel }) {
  const { notes, reader, select, openProjects, editNote, deleteNote } =
    useWorkspaceViewModel(projects);
  return (
    <>
      <main className="workspace">
        <NoteLibrary
          vm={notes}
          projectTitle={projects.active?.title ?? 'Seus projetos'}
          hasProject={Boolean(projects.active)}
          onProjects={openProjects}
          onSelect={select}
          onEdit={editNote}
          onDelete={deleteNote}
        />
        <Teleprompter note={notes.selected} vm={reader} />
      </main>
      {notes.form && (
        <NoteForm
          key={notes.form.note?.id ?? 'new'}
          note={notes.form.note}
          busy={notes.busy}
          onSave={notes.save}
          onClose={() => notes.setForm(null)}
        />
      )}
      {notes.deleting && (
        <DeleteConfirmation
          note={notes.deleting}
          busy={notes.busy}
          onDelete={notes.remove}
          onClose={() => notes.setDeleting(null)}
        />
      )}
    </>
  );
}
