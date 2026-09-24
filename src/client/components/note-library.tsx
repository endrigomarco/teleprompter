'use client';
import type { Note } from '@/domain/notes/note';
import { normalizeSearch } from '@/domain/notes/search';
import type { NotesViewModel } from '../view-models/use-notes-view-model';
import { NoteRow } from './note-row';
interface Props {
  vm: NotesViewModel;
  projectTitle: string;
  hasProject: boolean;
  onProjects: () => void;
  onSelect: (note: Note, focus?: boolean) => void;
  onEdit: (note: Note | null) => void;
  onDelete: (note: Note) => void;
}
export function NoteLibrary({
  vm,
  onSelect,
  onEdit,
  onDelete,
  projectTitle,
  hasProject,
  onProjects,
}: Props) {
  const filtered = Boolean(normalizeSearch(vm.query));
  const hint =
    vm.status ||
    (filtered
      ? 'Limpe a busca para arrastar e ordenar a lista.'
      : 'Arraste pelo ⠿ para ordenar. A ordem é salva automaticamente.');
  return (
    <section className="library" aria-label="Anotações da entrevista">
      <header>
        <div className="library-toolbar">
          <div className="library-identity">
            <span className="eyebrow">APOIO DE ENTREVISTA</span>
            <h1>{projectTitle}</h1>
          </div>
          <div className="library-header-actions">
            <button className="change-project-button" disabled={vm.busy} onClick={onProjects}>
              Alterar projeto
            </button>
            <button
              className="add-button"
              disabled={!hasProject || vm.busy || vm.loading}
              onClick={() => onEdit(null)}
            >
              + Nova anotação
            </button>
          </div>
          <div className="search-area">
            <label className="sr-only" htmlFor="search">
              Encontre um assunto
            </label>
            <div className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                ref={vm.searchRef}
                id="search"
                type="search"
                autoComplete="off"
                autoFocus
                placeholder="Título, descrição, tags ou conteúdo…"
                value={vm.query}
                onChange={(e) => vm.setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (['ArrowDown', 'ArrowUp'].includes(e.key) && vm.results.length) {
                    e.preventDefault();
                    vm.navigateResults(e.key === 'ArrowDown' ? 1 : -1);
                  }
                  if (e.key === 'Enter' && vm.focusedResult) {
                    e.preventDefault();
                    onSelect(vm.focusedResult, true);
                  }
                }}
              />
              <kbd>⌘ / Ctrl K</kbd>
            </div>
          </div>
        </div>
        <div className="search-meta">
          <span role="status">
            {vm.loading
              ? 'Carregando…'
              : `${vm.results.length} ${vm.results.length === 1 ? 'anotação' : 'anotações'}`}
          </span>
          <span>Esc limpar · ↑ ↓ navegar · Enter abrir</span>
        </div>
      </header>
      <div className="table-wrap">
        <table>
          <colgroup>
            <col className="move-col" />
            <col className="title-col" />
            <col className="description-col" />
            <col className="tags-col" />
            <col className="actions-col" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Ordem</span>
              </th>
              <th scope="col">Título</th>
              <th scope="col">Descrição</th>
              <th scope="col">Tags</th>
              <th scope="col">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {vm.results.map((note, index) => (
              <NoteRow
                key={note.id}
                note={note}
                selected={note.id === vm.selectedId}
                keyboard={index === vm.cursor}
                busy={vm.busy}
                canReorder={!vm.busy && !filtered}
                onSelect={() => onSelect(note)}
                onEdit={() => onEdit(note)}
                onDelete={() => onDelete(note)}
                onMove={vm.move}
                onMoveKey={(direction) => vm.moveByKeyboard(note.id, direction)}
              />
            ))}
          </tbody>
        </table>
        {vm.error ? (
          <p className="empty" role="alert">
            {vm.error} <button onClick={() => window.location.reload()}>Recarregar</button>
          </p>
        ) : (
          !vm.loading &&
          !vm.results.length && (
            <p className="empty">
              {vm.notes.length
                ? 'Nenhum resultado. Tente menos palavras ou outro termo.'
                : hasProject
                  ? 'Nenhuma anotação cadastrada.'
                  : 'Clique em Alterar projeto para criar um projeto.'}
            </p>
          )
        )}
      </div>
      <footer className="library-footer">
        <span role="status">{hint}</span>
      </footer>
    </section>
  );
}
