'use client';
import type { ProjectsViewModel } from '../view-models/use-projects-view-model';
import { useProjectDialogViewModel } from '../view-models/use-project-dialog-view-model';
import { Modal } from './modal';
import { ProjectForm } from './project-form';
import { ProjectList } from './project-list';
import { ProjectDeleteConfirmation } from './project-delete-confirmation';
export function ProjectManager({ vm }: { vm: ProjectsViewModel }) {
  const dialog = useProjectDialogViewModel(vm);
  return (
    <Modal labelledBy="projects-title" busy={vm.busy} onClose={() => vm.setOpen(false)}>
      <div className="form-header">
        <h2 id="projects-title">{dialog.title}</h2>
        <button aria-label="Fechar projetos" disabled={vm.busy} onClick={() => vm.setOpen(false)}>
          ×
        </button>
      </div>
      {vm.error && (
        <p className="project-error" role="alert">
          {vm.error}
        </p>
      )}
      {dialog.screen.kind === 'delete' && (
        <ProjectDeleteConfirmation
          project={dialog.screen.project}
          busy={vm.busy}
          onCancel={dialog.showList}
          onDelete={dialog.remove}
        />
      )}
      {dialog.screen.kind === 'form' && (
        <ProjectForm
          key={dialog.screen.project?.id ?? 'new'}
          initial={dialog.screen.project ?? { title: '', description: '' }}
          busy={vm.busy}
          onSave={dialog.save}
          onCancel={dialog.showList}
        />
      )}
      {dialog.screen.kind === 'list' && (
        <ProjectList vm={vm} onEdit={dialog.edit} onDelete={dialog.confirmDelete} />
      )}
    </Modal>
  );
}
