import { Schema, type Node as PMNode } from 'prosemirror-model';
import { schema as basic, defaultMarkdownParser, defaultMarkdownSerializer, MarkdownParser, MarkdownSerializer } from 'prosemirror-markdown';
import { tableNodes } from 'prosemirror-tables';
import { createMarkdown } from './syntax';

const nodes = basic.spec.nodes.update('heading', { ...basic.spec.nodes.get('heading')!, content: 'inline*' })
  .update('list_item', { ...basic.spec.nodes.get('list_item')!, attrs: { checked: { default: null } }, parseDOM: [{ tag: 'li', getAttrs: dom => { const item = dom as HTMLElement, checkbox = item.querySelector<HTMLInputElement>(':scope > input[type="checkbox"], :scope > p > input[type="checkbox"]'); return { checked: item.hasAttribute('data-task-checked') ? item.dataset.taskChecked === 'true' : checkbox ? checkbox.checked : null }; } }], toDOM: node => ['li', node.attrs.checked === null ? {} : { 'data-task-checked': String(node.attrs.checked) }, 0] })
  .append(tableNodes({ tableGroup: 'block', cellContent: 'paragraph+', cellAttributes: { align: { default: null, getFromDOM: dom => dom.style.textAlign || null, setDOMAttr: (value, attrs) => { if (value) attrs.style = `text-align:${value}`; } } } }))
  .append({
    rich_block: { group: 'block', atom: true, draggable: true, attrs: { kind: { default: 'mermaid' }, source: { default: '' } }, toDOM: node => ['figure', { 'data-rich-kind': node.attrs.kind }, node.attrs.source] },
    math_inline: { inline: true, group: 'inline', atom: true, attrs: { source: { default: '' } }, toDOM: node => ['span', { 'data-math': '' }, node.attrs.source] },
    raw_inline: { inline: true, group: 'inline', atom: true, attrs: { source: { default: '' } }, toDOM: node => ['code', { class: 'raw-inline' }, node.attrs.source] },
    frontmatter: { group: 'block', atom: true, attrs: { source: { default: '' } }, toDOM: node => ['pre', { class: 'frontmatter-source' }, node.attrs.source] },
  });
export const visualSchema = new Schema({ nodes, marks: basic.spec.marks.append({ strike: { parseDOM: [{ tag: 's' }, { tag: 'del' }], toDOM: () => ['s', 0] } }) });
const tokenizer = createMarkdown();
tokenizer.core.ruler.after('block', 'visual_blocks', state => {
  const transformed: typeof state.tokens = [];
  for (let i = 0; i < state.tokens.length; i++) {
    const token = state.tokens[i];
    if (token.type === 'fence' && /^(mermaid|math|latex|tex|html|html-run)(\s|$)/i.test(token.info)) {
      token.type = 'rich_fence'; token.meta = { kind: /^mermaid/i.test(token.info) ? 'mermaid' : /^html/i.test(token.info) ? 'html' : 'math' };
    }
    if (token.type === 'th_close' || token.type === 'td_close') { const close = new state.Token('paragraph_close', 'p', -1); transformed.push(close); }
    transformed.push(token);
    if (token.type === 'th_open' || token.type === 'td_open') { const open = new state.Token('paragraph_open', 'p', 1); transformed.push(open); }
    if (token.type === 'list_item_open') {
      const inline = state.tokens[i + 2], first = inline?.content.match(/^\[([ xX])\] /);
      if (first) { token.meta = { checked: first[1] !== ' ' }; inline.content = inline.content.slice(first[0].length); }
    }
  }
  state.tokens = transformed;
});
tokenizer.core.ruler.after('inline', 'visual_inline', state => {
  for (const token of state.tokens) for (const child of token.children ?? []) if (child.type === 'html_inline' && /^<br\s*\/?\s*>$/i.test(child.content)) child.type = 'hardbreak';
});
export const visualParser = // ProseMirror currently declares markdown-it 14 types; the tokenizer API is compatible with 15.
new MarkdownParser(visualSchema, tokenizer as unknown as ConstructorParameters<typeof MarkdownParser>[1], {
  ...defaultMarkdownParser.tokens,
  list_item: { block: 'list_item', getAttrs: token => ({ checked: token.meta?.checked ?? null }) },
  table: { block: 'table' }, thead: { ignore: true }, tbody: { ignore: true }, tr: { block: 'table_row' },
  th: { block: 'table_header', getAttrs: token => ({ align: token.attrGet('style')?.split(':')[1] ?? null }) },
  td: { block: 'table_cell', getAttrs: token => ({ align: token.attrGet('style')?.split(':')[1] ?? null }) },
  s: { mark: 'strike' },
  rich_fence: { node: 'rich_block', getAttrs: token => ({ source: token.content.replace(/\n$/, ''), kind: token.meta.kind }) },
  math_block: { node: 'rich_block', getAttrs: token => ({ source: token.content, kind: 'math' }) },
  math_inline: { node: 'math_inline', getAttrs: token => ({ source: token.content }) },
  html_block: { node: 'rich_block', getAttrs: token => ({ source: token.content.replace(/\n$/, ''), kind: 'html' }) },
  html_inline: { node: 'raw_inline', getAttrs: token => ({ source: token.content }) },
  frontmatter: { node: 'frontmatter', getAttrs: token => ({ source: token.content }) },
});
export const visualSerializer = new MarkdownSerializer({
  ...defaultMarkdownSerializer.nodes,
  list_item(state, node) { if (node.attrs.checked !== null) state.write(node.attrs.checked ? '[x] ' : '[ ] '); state.renderContent(node); },
  rich_block(state, node) {
    if (node.attrs.kind === 'math') { state.write('$$\n' + node.attrs.source + '\n$$'); }
    else { const fence = '`'.repeat(Math.max(3, ...[...String(node.attrs.source).matchAll(/`+/g)].map(m => m[0].length + 1))); state.write(fence + node.attrs.kind + '\n' + node.attrs.source + '\n' + fence); }
    state.closeBlock(node);
  },
  math_inline(state, node) { state.write('$' + node.attrs.source + '$'); },
  raw_inline(state, node) { state.write(node.attrs.source); },
  frontmatter(state, node) { state.write(node.attrs.source.trimEnd()); state.closeBlock(node); },
  table(state, node) {
    const rows: string[][] = [];
    node.forEach(row => { const cells: string[] = []; row.forEach(cell => {
      cells.push(visualSerializer.serialize(visualSchema.nodes.doc.create(null, cell.content)).replace(/\\\n/g, '<br>').replace(/\n+/g, '<br>').replace(/(?<!\\)\|/g, '\\|'));
    }); rows.push(cells); });
    rows.forEach((row, i) => { state.write('| ' + row.join(' | ') + ' |\n'); if (i === 0) { const rules: string[] = []; node.firstChild!.forEach(cell => { rules.push(cell.attrs.align === 'center' ? ':---:' : cell.attrs.align === 'right' ? '---:' : cell.attrs.align === 'left' ? ':---' : '---'); }); state.write('| ' + rules.join(' | ') + ' |\n'); } });
    state.closeBlock(node);
  },
}, { ...defaultMarkdownSerializer.marks, strike: { open: '~~', close: '~~', mixable: true, expelEnclosingWhitespace: true } });
export function parseVisual(source: string): PMNode { return visualParser.parse(source); }
export function serializeVisual(doc: PMNode): string { return visualSerializer.serialize(doc) + (doc.textContent || doc.childCount > 1 || doc.firstChild?.type.name !== 'paragraph' ? '\n' : ''); }
