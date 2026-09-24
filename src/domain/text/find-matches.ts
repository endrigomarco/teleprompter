export function findReaderMatches(text: string, query: string): [number, number][] {
  function fold(value: string) {
    let folded = '',
      offset = 0;
    const starts: number[] = [],
      ends: number[] = [];
    for (const character of value) {
      const start = offset;
      offset += character.length;
      const clean = character
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      if (!clean) {
        if (ends.length) ends[ends.length - 1] = offset;
        continue;
      }
      for (const part of clean) {
        const token = /\s/u.test(part) ? ' ' : part;
        if (token === ' ' && folded.endsWith(' ')) {
          ends[ends.length - 1] = offset;
          continue;
        }
        folded += token;
        for (let i = 0; i < token.length; i++) {
          starts.push(start);
          ends.push(offset);
        }
      }
    }
    return { folded, starts, ends };
  }
  const needle = fold(query).folded.trim();
  if (!needle) return [];
  const haystack = fold(text),
    matches: [number, number][] = [];
  let from = 0;
  while (from < haystack.folded.length) {
    const at = haystack.folded.indexOf(needle, from);
    if (at < 0) break;
    matches.push([haystack.starts[at], haystack.ends[at + needle.length - 1]]);
    from = at + needle.length;
  }
  return matches;
}
