'use client';
import { Fragment } from 'react';
import type { ReaderViewModel } from '../view-models/use-reader-view-model';
export function ReaderContent({ text, vm }: { text: string; vm: ReaderViewModel }) {
  let offset = 0;
  const parts = vm.matches.map(([start, end], index) => {
    const prefix = text.slice(offset, start);
    offset = end;
    return (
      <Fragment key={`${start}:${end}`}>
        {prefix}
        <mark
          ref={(element) => {
            vm.marksRef.current[index] = element;
          }}
          className={index === vm.matchIndex ? 'current-match' : undefined}
        >
          {text.slice(start, end)}
        </mark>
      </Fragment>
    );
  });
  return (
    <>
      {parts}
      {text.slice(offset)}
    </>
  );
}
