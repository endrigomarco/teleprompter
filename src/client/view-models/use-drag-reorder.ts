'use client';
import { useRef, useState, type PointerEvent } from 'react';
type Drop = { id: string; after: boolean };
export function useDragReorder(
  id: string,
  disabled: boolean,
  move: (id: string, targetId: string, after: boolean) => Promise<void>,
) {
  const drag = useRef<{ y: number; active: boolean; target: Drop | null } | null>(null);
  const [dragging, setDragging] = useState(false);
  const clearMarks = () =>
    document
      .querySelectorAll('.drop-before,.drop-after')
      .forEach((row) => row.classList.remove('drop-before', 'drop-after'));
  function down(event: PointerEvent<HTMLButtonElement>) {
    if (disabled || event.button !== 0) return;
    event.stopPropagation();
    drag.current = { y: event.clientY, active: false, target: null };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function motion(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current) return;
    if (!current.active && Math.abs(event.clientY - current.y) < 5) return;
    current.active = true;
    setDragging(true);
    clearMarks();
    const wrap = event.currentTarget.closest('.table-wrap');
    if (!wrap) return;
    const bounds = wrap.getBoundingClientRect();
    if (event.clientY < bounds.top + 35) wrap.scrollTop -= 16;
    else if (event.clientY > bounds.bottom - 35) wrap.scrollTop += 16;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLTableRowElement>('tr[data-id]');
    current.target = null;
    const targetId = target?.dataset.id;
    if (!target || !targetId || targetId === id || !wrap.contains(target)) return;
    const rect = target.getBoundingClientRect(),
      after = event.clientY > rect.top + rect.height / 2;
    current.target = { id: targetId, after };
    target.classList.add(after ? 'drop-after' : 'drop-before');
  }
  function finish(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    setDragging(false);
    clearMarks();
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (event.type === 'pointerup' && current.active && current.target)
      void move(id, current.target.id, current.target.after);
  }
  return {
    dragging,
    onPointerDown: down,
    onPointerMove: motion,
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: finish,
  };
}
