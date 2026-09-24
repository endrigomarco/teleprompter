'use client';
import type { Note } from '@/domain/notes/note';
import type { ReaderViewModel } from '../view-models/use-reader-view-model';
import { ReaderSearch } from './reader-search';
import { ReaderContent } from './reader-content';
export function Teleprompter({ note, vm }: { note: Note | null; vm: ReaderViewModel }) {
  return (
    <section className="reader" aria-label="Teleprompter">
      <header className="reader-header">
        <div>
          <span className="eyebrow">TELEPROMPTER</span>
          <h2>{note?.title ?? 'Selecione uma anotação'}</h2>
        </div>
        <span id="reading-state" role="status">
          {vm.playing ? 'Em leitura' : vm.finished ? 'Fim da leitura' : 'Pausado'}
        </span>
      </header>
      <div className="controls">
        <button className="primary" disabled={!note} onClick={vm.toggle}>
          {vm.playing ? 'Ⅱ Pausar' : '▶ Iniciar'}
        </button>
        <button disabled={!note} title="Voltar ao início do texto" onClick={vm.restart}>
          ↺ Início
        </button>
        <label>
          Tamanho{' '}
          <input
            type="range"
            min="22"
            max="60"
            value={vm.fontSize}
            onChange={(e) => vm.setFontSize(Number(e.target.value))}
          />
          <output>{vm.fontSize}</output>
        </label>
        <label>
          Velocidade{' '}
          <input
            type="range"
            min="10"
            max="100"
            value={vm.speed}
            onChange={(e) => vm.setSpeed(Number(e.target.value))}
          />
          <output>{vm.speed}</output>
        </label>
        <ReaderSearch vm={vm} />
      </div>
      <div
        ref={vm.viewportRef}
        className="viewport"
        tabIndex={0}
        aria-label="Texto para leitura. Espaço inicia ou pausa a rolagem."
        onScroll={vm.updateProgress}
        onWheel={vm.pause}
        onTouchStart={vm.pause}
        onPointerDown={vm.pause}
        onKeyDown={(e) => {
          if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key))
            vm.pause();
        }}
      >
        <article id="content" style={{ fontSize: vm.fontSize }}>
          {note ? (
            <ReaderContent text={note.content} vm={vm} />
          ) : (
            <p className="reader-placeholder">
              Escolha um assunto à esquerda.
              <br />
              Sua resposta aparece aqui.
            </p>
          )}
        </article>
      </div>
      <footer className="reader-footer">
        <span>Espaço para iniciar ou pausar a leitura</span>
        <span id="progress">{vm.progress}%</span>
      </footer>
    </section>
  );
}
