import MarkdownIt from 'markdown-it';

/** One Markdown dialect shared by source, visual editing, and preview. */
export function createMarkdown() {
  const md = new MarkdownIt({ html: true, linkify: true, typographer: false });
  const validate = md.validateLink;
  md.validateLink = url => /^data:image\/svg\+xml[;,]/i.test(url) || validate(url);
  md.block.ruler.before('fence', 'frontmatter', (state, start, end, silent) => {
    if (start !== 0 || state.src.slice(state.bMarks[0], state.eMarks[0]).trim() !== '---') return false;
    let last = 1;
    while (last < end && !/^(---|\.\.\.)\s*$/.test(state.src.slice(state.bMarks[last], state.eMarks[last]))) last++;
    if (last === end) return false;
    if (!silent) { const token = state.push('frontmatter', '', 0); token.content = state.getLines(start, last + 1, 0, false); token.map = [start, last + 1]; state.line = last + 1; }
    return true;
  });
  md.block.ruler.before('fence', 'math_block', (state, start, end, silent) => {
    const line = state.src.slice(state.bMarks[start] + state.tShift[start], state.eMarks[start]);
    const open = line.startsWith('$$') ? '$$' : line.startsWith('\\[') ? '\\[' : '';
    if (!open) return false;
    const close = open === '$$' ? '$$' : '\\]';
    let content = line.slice(2), last = start;
    const sameLine = content.indexOf(close);
    if (sameLine >= 0) { if (content.slice(sameLine + close.length).trim()) return false; content = content.slice(0, sameLine); }
    else {
      let found = false;
      while (++last < end) {
        const next = state.src.slice(state.bMarks[last], state.eMarks[last]);
        const closing = next.indexOf(close);
        if (closing >= 0) { if (next.slice(closing + close.length).trim()) return false; content += '\n' + next.slice(0, closing); found = true; break; }
        content += '\n' + next;
      }
      if (!found) return false;
    }
    if (!silent) { const token = state.push('math_block', 'div', 0); token.content = content.trim(); token.map = [start, last + 1]; state.line = last + 1; }
    return true;
  });
  md.inline.ruler.before('escape', 'math_inline', (state, silent) => {
    const start = state.pos;
    const slash = state.src.slice(start, start + 2) === '\\(';
    if (!slash && (state.src[start] !== '$' || state.src[start + 1] === '$' || /\s/.test(state.src[start + 1] ?? ' '))) return false;
    const length = slash ? 2 : 1, close = slash ? '\\)' : '$';
    let end = start + length;
    for (; end < state.posMax; end++) {
      if (state.src[end] === '\n') return false;
      if (state.src.slice(end, end + close.length) === close && state.src[end - 1] !== '\\') break;
    }
    if (end >= state.posMax || end === start + length || (!slash && (/\s/.test(state.src[end - 1]) || /\d/.test(state.src[end + 1] ?? '')))) return false;
    if (!silent) { const token = state.push('math_inline', 'span', 0); token.content = state.src.slice(start + length, end); }
    state.pos = end + close.length; return true;
  });
  return md;
}
