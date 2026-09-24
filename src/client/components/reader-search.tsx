'use client';
import type { ReaderViewModel } from '../view-models/use-reader-view-model';
export function ReaderSearch({ vm }: { vm: ReaderViewModel }) {
  return (
    <div className="reader-search" role="search" aria-label="Busca no teleprompter">
      <label className="sr-only" htmlFor="reader-query">
        Buscar no texto
      </label>
      <input
        ref={vm.searchRef}
        id="reader-query"
        type="search"
        placeholder="Buscar no texto…"
        autoComplete="off"
        aria-keyshortcuts="Control+f Meta+f"
        aria-describedby="reader-search-help"
        value={vm.query}
        onChange={(e) => vm.setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            vm.next(e.shiftKey ? -1 : 1);
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            vm.clearSearch();
          }
        }}
      />
      <span id="reader-search-count" role="status">
        {vm.matches.length
          ? `${vm.matchIndex + 1}/${vm.matches.length}`
          : vm.query.trim()
            ? 'Nenhum resultado'
            : '0/0'}
      </span>
      <button
        aria-label="Ocorrência anterior"
        title="Anterior (Shift+Enter)"
        disabled={!vm.matches.length}
        onClick={() => vm.next(-1)}
      >
        ↑
      </button>
      <button
        aria-label="Próxima ocorrência"
        title="Próxima (Enter)"
        disabled={!vm.matches.length}
        onClick={() => vm.next(1)}
      >
        ↓
      </button>
      <small id="reader-search-help">⌘ / Ctrl F</small>
    </div>
  );
}
