'use client';
import { useState } from 'react';
import type { Note } from '@/domain/notes/note';
import { Modal } from './modal';
interface Props {
  note: Note;
  busy: boolean;
  onDelete: () => Promise<void>;
  onClose: () => void;
}
export function DeleteConfirmation({ note, busy, onDelete, onClose }: Props) {
  const [error, setError] = useState('');
  async function confirm() {
    setError('');
    try {
      await onDelete();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível excluir.');
    }
  }
  return (
    <Modal
      id="delete-dialog"
      labelledBy="delete-title"
      describedBy="delete-description"
      busy={busy}
      onClose={onClose}
    >
      <h2 id="delete-title">Excluir anotação?</h2>
      <p id="delete-description">
        A anotação <strong>“{note.title}”</strong> será excluída. Esta ação não pode ser desfeita.
      </p>
      {error && (
        <p id="delete-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button disabled={busy} autoFocus onClick={onClose}>
          Cancelar
        </button>
        <button disabled={busy} className="danger-button" onClick={() => void confirm()}>
          {busy ? 'Excluindo…' : 'Excluir anotação'}
        </button>
      </div>
    </Modal>
  );
}
