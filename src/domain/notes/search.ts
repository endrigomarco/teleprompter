import type { Note } from './note';
const SEARCH_WEIGHTS = {
  title: 10,
  tags: 8,
  description: 5,
  content: 2,
  phraseBonus: 20,
  typoMultiplier: 0.3,
} as const;
const MIN_TYPO_LENGTH = 5;
export const normalizeSearch = (text: string): string =>
  String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
interface SearchField {
  text: string;
  weight: number;
  words: string[];
}
interface IndexedNote {
  note: Note;
  fields: SearchField[];
}
function isNearMatch(a: string, b: string): boolean {
  if (a.length < MIN_TYPO_LENGTH || Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const differences = [];
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) differences.push(i);
    return (
      differences.length <= 1 ||
      (differences.length === 2 &&
        differences[1] === differences[0] + 1 &&
        a[differences[0]] === b[differences[1]] &&
        a[differences[1]] === b[differences[0]])
    );
  }
  const short = a.length < b.length ? a : b,
    long = a.length < b.length ? b : a;
  let i = 0,
    j = 0,
    edits = 0;
  while (i < short.length && j < long.length) {
    if (short[i] === long[j]) {
      i++;
      j++;
    } else {
      edits++;
      j++;
    }
    if (edits > 1) return false;
  }
  return true;
}
function score(item: IndexedNote, query: string, tokens: string[]): number {
  if (!tokens.length) return 1;
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of item.fields) {
      if (field.text.includes(token)) best = Math.max(best, field.weight);
      else if (field.words.some((word) => isNearMatch(token, word)))
        best = Math.max(best, field.weight * SEARCH_WEIGHTS.typoMultiplier);
    }
    if (!best) return 0;
    total += best;
  }
  if (item.fields[0].text.includes(query)) total += SEARCH_WEIGHTS.phraseBonus;
  return total;
}
export function indexNotes(notes: Note[]): IndexedNote[] {
  return notes.map((note) => ({
    note,
    fields: (
      [
        [note.title, SEARCH_WEIGHTS.title],
        [note.tags.join(' '), SEARCH_WEIGHTS.tags],
        [note.description, SEARCH_WEIGHTS.description],
        [note.content, SEARCH_WEIGHTS.content],
      ] as [string, number][]
    ).map(([value, weight]) => {
      const text = normalizeSearch(value);
      return { text, weight, words: [...new Set(text.split(' '))] };
    }),
  }));
}
export function searchNotes(index: IndexedNote[], input: string): Note[] {
  const query = normalizeSearch(input),
    tokens = query.split(' ').filter(Boolean);
  return index
    .map((item) => ({ item, score: score(item, query, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item.note);
}
