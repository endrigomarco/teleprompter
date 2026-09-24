const MAX_LINE_LENGTH = 36;
const MIN_PHRASE_LENGTH = 16;
export function formatTeleprompter(text: string): string {
  const segmenter = new Intl.Segmenter(['en', 'pt'], { granularity: 'sentence' });
  const starters = new Set([
    'and',
    'but',
    'because',
    'where',
    'when',
    'with',
    'without',
    'from',
    'into',
    'through',
    'that',
    'which',
    'while',
    'to',
    'for',
    'e',
    'mas',
    'porque',
    'onde',
    'quando',
    'com',
    'sem',
    'para',
    'que',
  ]);
  function wrap(sentence: string) {
    const words = sentence.trim().split(/\s+/u);
    const lines = [];
    let start = 0;
    while (start < words.length) {
      let end = start,
        length = 0;
      while (end < words.length) {
        const nextLength = length + (end > start ? 1 : 0) + words[end].length;
        if (end > start && nextLength > MAX_LINE_LENGTH) break;
        length = nextLength;
        end++;
      }
      if (end < words.length) {
        let boundary = -1,
          partialLength = 0;
        for (let i = start; i < end; i++) {
          partialLength += words[i].length + (i > start ? 1 : 0);
          if (
            partialLength >= MIN_PHRASE_LENGTH &&
            (/[,:;]$/u.test(words[i]) || starters.has(words[i + 1]?.toLowerCase()))
          )
            boundary = i + 1;
        }
        if (boundary > start) end = boundary;
      }
      lines.push(words.slice(start, end).join(' '));
      start = end;
    }
    return lines.join('\n');
  }
  return text
    .trim()
    .split(/\n\s*\n/u)
    .filter((paragraph) => paragraph.trim())
    .flatMap((paragraph) => {
      const plain = paragraph.replace(/\s+/gu, ' ').trim();
      return Array.from(segmenter.segment(plain), (part) => wrap(part.segment));
    })
    .join('\n\n');
}
