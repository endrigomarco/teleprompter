'use client';
import { useEffect, useRef } from 'react';
import type { Note } from '@/domain/notes/note';
import { useDragReorder } from '../view-models/use-drag-reorder';
interface Props {
  note: Note;
  selected: boolean;
  keyboard: boolean;
  busy: boolean;
  canReorder: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (id: string, targetId: string, after: boolean) => Promise<void>;
  onMoveKey: (direction: -1 | 1) => void;
}
export function NoteRow({
  note,
  selected,
  keyboard,
  busy,
  canReorder,
  onSelect,
  onEdit,
  onDelete,
  onMove,
  onMoveKey,
}: Props) {
  const { dragging, ...drag } = useDragReorder(note.id, !canReorder, onMove);
  const row = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    if (keyboard) row.current?.scrollIntoView({ block: 'nearest' });
  }, [keyboard]);
  return (
    <tr
      ref={row}
      data-id={note.id}
      className={[
        selected ? 'selected' : '',
        keyboard ? 'keyboard' : '',
        dragging ? 'dragging' : '',
      ].join(' ')}
      onClick={onSelect}
    >
      <td>
        <button
          className="drag-handle"
          aria-label={`Mover ${note.title}`}
          title="Arraste para mover ou use as setas para cima e para baixo"
          disabled={!canReorder}
          {...drag}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.preventDefault();
              e.stopPropagation();
              onMoveKey(e.key === 'ArrowUp' ? -1 : 1);
            }
          }}
        >
          ⠿
        </button>
      </td>
      <td>
        <button aria-pressed={selected}>{note.title}</button>
      </td>
      <td>{note.description}</td>
      <td>
        {note.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </td>
      <td>
        <button
          className="edit-button"
          disabled={busy}
          aria-label={`Editar ${note.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          Editar
        </button>
        <button
          className="delete-button"
          disabled={busy}
          aria-label={`Excluir ${note.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          Excluir
        </button>
      </td>
    </tr>
  );
}
