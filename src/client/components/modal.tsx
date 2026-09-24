'use client';
import { useEffect, useRef, type ReactNode } from 'react';
interface Props {
  children: ReactNode;
  labelledBy: string;
  describedBy?: string;
  busy: boolean;
  onClose: () => void;
  id?: string;
}
export function Modal({ children, labelledBy, describedBy, busy, onClose, id }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      id={id}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
