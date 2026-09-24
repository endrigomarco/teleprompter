'use client';
import { FIELD_LIMITS } from '@/domain/shared/limits';
import type { Note, NoteDraft } from '@/domain/notes/note';
import { useNoteFormViewModel } from '../view-models/use-note-form-view-model';
import { Modal } from './modal';
interface Props {
  note: Note | null;
  busy: boolean;
  onSave: (draft: NoteDraft) => Promise<void>;
  onClose: () => void;
}
export function NoteForm({ note, busy, onSave, onClose }: Props) {
  const vm = useNoteFormViewModel(note, onSave);
  return (
    <Modal labelledBy="form-title" busy={busy} onClose={onClose}>
      <form
        id="note-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) void vm.submit();
        }}
      >
        <div className="form-header">
          <div>
            <span className="eyebrow">CADASTRO</span>
            <h2 id="form-title">{note ? 'Editar anotação' : 'Nova anotação'}</h2>
          </div>
          <button type="button" aria-label="Fechar cadastro" disabled={busy} onClick={onClose}>
            ×
          </button>
        </div>
        <label htmlFor="note-title">Título</label>
        <input
          id="note-title"
          required
          maxLength={FIELD_LIMITS.title}
          autoFocus
          value={vm.title}
          onChange={(e) => vm.setTitle(e.target.value)}
          disabled={busy}
          placeholder="Ex.: Um projeto desafiador"
        />
        <label htmlFor="note-description">Descrição</label>
        <textarea
          id="note-description"
          rows={2}
          maxLength={FIELD_LIMITS.description}
          value={vm.description}
          onChange={(e) => vm.setDescription(e.target.value)}
          disabled={busy}
          placeholder="Um resumo para encontrar esta anotação"
        />
        <label htmlFor="note-tags">Tags</label>
        <input
          id="note-tags"
          maxLength={FIELD_LIMITS.tags}
          value={vm.tags}
          onChange={(e) => vm.setTags(e.target.value)}
          disabled={busy}
          placeholder="Ex.: projeto, equipe, resultado"
          aria-describedby="tags-help"
        />
        <small id="tags-help">Separe as tags por vírgulas.</small>
        <div className="content-label">
          <label htmlFor="note-content">Conteúdo do teleprompter</label>
          <button type="button" id="format-content" disabled={busy} onClick={vm.format}>
            Transformar em texto teleprompter
          </button>
        </div>
        <textarea
          ref={vm.contentRef}
          id="note-content"
          rows={7}
          maxLength={FIELD_LIMITS.content}
          value={vm.content}
          onChange={(e) => vm.setContent(e.target.value)}
          disabled={busy}
          placeholder="Escreva aqui o texto que você quer ler…"
        />
        <small id="format-status" role="status">
          {vm.formatStatus}
        </small>
        {vm.error && (
          <p id="form-error" role="alert">
            {vm.error} Seus campos foram mantidos para tentar novamente.
          </p>
        )}
        <div className="form-actions">
          <button type="button" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="add-button" disabled={busy}>
            {busy ? 'Salvando…' : note ? 'Salvar alterações' : 'Salvar anotação'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
