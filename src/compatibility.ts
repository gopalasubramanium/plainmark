import { createMarkdown } from './syntax';
const parser = createMarkdown();
// Exclude literal examples in code, HTML and frontmatter.
export function sourceOnlyReason(source: string): string | null {
  const lines = source.split('\n');
  for (const token of parser.parse(source, {})) if (token.map && ['fence','code_block','html_block','frontmatter'].includes(token.type)) {
    for (let line = token.map[0]; line < token.map[1]; line++) lines[line] = '';
  }
  const text = lines.join('\n');
  if (/^\s{0,3}\[[^\]\n]+\]:/m.test(text)) return 'This document uses reference definitions or footnotes. Source view preserves their original syntax; Visual edits would rewrite it.';
  if (/!?\[\[[^\]\n]+\]\]/.test(text)) return 'This document uses wiki links. Source view preserves them; wiki-link rendering is not supported.';
  return null;
}
