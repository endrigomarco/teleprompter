import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTeleprompter } from '../src/domain/text/format-teleprompter';
import { findReaderMatches } from '../src/domain/text/find-matches';
import { indexNotes, searchNotes } from '../src/domain/notes/search';
import { reorderNotes } from '../src/domain/notes/reorder';
import type { Note } from '../src/domain/notes/note';
const notes: Note[] = [
  {
    id: 'a',
    title: 'Gestão de equipes',
    description: 'Comunicação e pessoas',
    tags: ['liderança'],
    content: 'Conversas individuais.',
    position: 0,
    version: 1,
  },
  {
    id: 'b',
    title: 'Carreira',
    description: 'Apresentação',
    tags: ['história'],
    content: 'Gestão de equipes internacionais.',
    position: 1,
    version: 1,
  },
  {
    id: 'c',
    title: 'Custos',
    description: 'Eficiência',
    tags: ['ROI'],
    content: 'Orçamento de tecnologia.',
    position: 2,
    version: 1,
  },
];
test('busca ignora acentos, tolera transposição, combina campos e prioriza título', () => {
  const index = indexNotes(notes);
  assert.deepEqual(
    searchNotes(index, 'GESTAO').map((n) => n.id),
    ['a', 'b'],
  );
  assert.deepEqual(
    searchNotes(index, 'comunicaaco lideranca').map((n) => n.id),
    ['a'],
  );
  assert.deepEqual(
    searchNotes(index, 'orcamento').map((n) => n.id),
    ['c'],
  );
  assert.deepEqual(searchNotes(index, 'inexistente'), []);
  assert.deepEqual(searchNotes(index, ''), notes);
});
test('busca no leitor preserva offsets com Unicode, acentos e quebras', () => {
  for (const [text, query, expected] of [
    ['Career\n\nIntroduction', 'career introduction', ['Career\n\nIntroduction']],
    ['ação AÇÃO', 'ACAO', ['ação', 'AÇÃO']],
    ['a.b aXb', 'a.b', ['a.b']],
    ['hello', 'xyz', []],
    ['hello', ' ', []],
    ['AI and AI', 'ai', ['AI', 'AI']],
    ['😀 café', 'cafe', ['café']],
  ] as [string, string, string[]][]) {
    assert.deepEqual(
      findReaderMatches(text, query).map(([a, b]) => text.slice(a, b)),
      expected,
    );
  }
});
test('formatação preserva cada palavra e é idempotente em textos sintéticos', () => {
  for (const text of [
    '',
    'We improved 3.5 percent. Dr. Smith led the team.',
    'A equipe organizou uma biblioteca. Depois, revisou os títulos e as descrições.',
    'First, we reviewed the plan.\n\nThen we tested every step, with clear examples and useful feedback.',
    'ação café 😀 2026\nLinhas previamente separadas.',
    'A'.repeat(80),
  ]) {
    const result = formatTeleprompter(text);
    assert.equal(result.replace(/\s+/gu, ' ').trim(), text.replace(/\s+/gu, ' ').trim());
    assert.equal(formatTeleprompter(result), result);
  }
});
test('reordenação funciona nos dois sentidos sem alterar conteúdo', () => {
  const moved = reorderNotes(notes, 'a', 'c', true);
  assert.deepEqual(
    moved.map((n) => n.id),
    ['b', 'c', 'a'],
  );
  assert.deepEqual(
    reorderNotes(moved, 'a', 'b', false).map((n) => n.id),
    ['a', 'b', 'c'],
  );
  assert.equal(moved[2].content, notes[0].content);
  assert.equal(reorderNotes(notes, 'a', 'missing', false), notes);
});
