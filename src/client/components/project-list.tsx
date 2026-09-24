'use client';
import type { Project } from '@/domain/projects/project';
import type { ProjectsViewModel } from '../view-models/use-projects-view-model';
interface Props {
  vm: ProjectsViewModel;
  onEdit: (project: Project | null) => void;
  onDelete: (project: Project) => void;
}
export function ProjectList({ vm, onEdit, onDelete }: Props) {
  return (
    <>
      <p className="project-help">
        Selecione um projeto para abrir suas anotações. O último selecionado será aberto na próxima
        visita.
      </p>
      <ul className="project-list">
        {vm.projects.map((project) => (
          <li key={project.id} className={project.id === vm.selectedProjectId ? 'active' : ''}>
            <button
              className="project-select"
              disabled={vm.busy}
              onClick={() => void vm.select(project.id)}
            >
              <strong>{project.title}</strong>
              {project.description && <span>{project.description}</span>}
              <small>
                {project.noteCount} {project.noteCount === 1 ? 'anotação' : 'anotações'}
                {project.id === vm.selectedProjectId ? ' · Atual' : ''}
              </small>
            </button>
            <div className="project-actions">
              <button
                disabled={vm.busy}
                aria-label={`Editar projeto ${project.title}`}
                onClick={() => onEdit(project)}
              >
                Editar
              </button>
              <button
                disabled={vm.busy}
                aria-label={`Excluir projeto ${project.title}`}
                onClick={() => onDelete(project)}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!vm.projects.length && <p>Nenhum projeto cadastrado. Crie um para começar.</p>}
      <div className="form-actions">
        <button disabled={vm.busy} onClick={() => vm.setOpen(false)}>
          Fechar
        </button>
        <button className="add-button" disabled={vm.busy} onClick={() => onEdit(null)}>
          + Novo projeto
        </button>
      </div>
    </>
  );
}
