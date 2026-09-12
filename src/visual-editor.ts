import { EditorState, NodeSelection, TextSelection, type Command } from 'prosemirror-state';
import { EditorView, type NodeView, type NodeViewConstructor } from 'prosemirror-view';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, setBlockType, toggleMark, wrapIn, chainCommands, exitCode } from 'prosemirror-commands';
import { wrapInList, splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list';
import { inputRules, textblockTypeInputRule, wrappingInputRule } from 'prosemirror-inputrules';
import { tableEditing, goToNextCell, addRowAfter, addColumnAfter, deleteRow, deleteColumn, deleteTable } from 'prosemirror-tables';
import DOMPurify from 'dompurify';
import { parseVisual, serializeVisual, visualSchema as schema } from './visual-model';
import { enhance, stopHtml, type ReadImage } from './rich';
import { escapeHtml, type RichBlock } from './markdown';
import { localImagePath, safeImageData } from './safe-images';
import type { DocumentFile } from './files';
import type { Node as PMNode } from 'prosemirror-model';

export type EditField = (title: string, value: string, multiline?: boolean) => Promise<string | null>;
interface Options { changed: (text: string) => void; edit: EditField; file: () => DocumentFile; readImage: ReadImage }
export function createVisualEditor(parent: HTMLElement, text: string, options: Options) {
  let editable = true;
  const refreshers = new Set<() => void>();
  const execute = (command: Command) => { command(view.state, view.dispatch, view); view.focus(); };
  const richView: NodeViewConstructor = (initial, editor, getPos) => {
    let node = initial, alive = true, cleanup: (() => void) | undefined;
    const inline = node.type.name === 'math_inline';
    const dom = document.createElement(inline ? 'span' : 'figure'); dom.className = inline ? 'visual-math' : 'visual-rich'; dom.contentEditable = 'false';
    const body = document.createElement(inline ? 'span' : 'div');
    const controls = document.createElement('span'); controls.className = 'block-controls';
    const label = document.createElement('span'); label.textContent = node.type.name === 'frontmatter' ? 'Metadata' : inline ? 'Math' : node.attrs.kind;
    const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit'; edit.setAttribute('aria-label', `Edit ${label.textContent}`);
    controls.append(label, edit); dom.append(body, controls);
    const render = () => {
      cleanup?.();
      if (node.type.name === 'frontmatter') { const pre = document.createElement('pre'); pre.textContent = node.attrs.source; body.replaceChildren(pre); return; }
      const block: RichBlock = { index: 0, kind: inline ? 'math' : node.attrs.kind, source: node.attrs.source, display: !inline };
      body.innerHTML = `<${inline ? 'span' : 'div'} data-rich="0"><code>${escapeHtml(block.source)}</code></${inline ? 'span' : 'div'}>`;
      queueMicrotask(() => { if (!alive) return; const enhanced = enhance(body, { html: '', headings: [], images: [], rich: [block] }, options.file(), options.readImage); cleanup = enhanced.dispose; });
    };
    edit.onclick = async event => {
      event.preventDefault(); if (!editable) return;
      const next = await options.edit(`Edit ${label.textContent}`, node.attrs.source, !inline);
      const pos = getPos(); if (next === null || !alive || pos === undefined) return;
      editor.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, source: next })); editor.focus();
    };
    render(); refreshers.add(render);
    return { dom, stopEvent: event => !!(event.target as HTMLElement).closest('button, details, iframe'), ignoreMutation: () => true, update(next) { if (next.type !== node.type) return false; const changed = next.attrs.source !== node.attrs.source || next.attrs.kind !== node.attrs.kind; node = next; if (changed) render(); return true; }, destroy() { alive = false; cleanup?.(); refreshers.delete(render); } };
  };
  const imageView: NodeViewConstructor = (initial, editor, getPos) => {
    let node = initial, generation = 0, alive = true;
    const dom = document.createElement('span'); dom.className = 'visual-image'; dom.contentEditable = 'false';
    const render = async () => {
      const version = ++generation; dom.textContent = `Image · ${node.attrs.alt || node.attrs.src}`;
      try { const path = localImagePath(node.attrs.src); const data = path ? await options.readImage(path, options.file()) : safeImageData(node.attrs.src);
        if (!alive || generation !== version) return; const img = document.createElement('img'); img.src = safeImageData(data); img.alt = node.attrs.alt || ''; img.title = 'Double-click to edit image path'; dom.replaceChildren(img);
      } catch { if (alive && version === generation) dom.textContent = `Image unavailable · ${node.attrs.alt || node.attrs.src}`; }
    };
    dom.ondblclick = async () => { if (!editable) return; const src = await options.edit('Image path or data URL', node.attrs.src); const pos = getPos(); if (src !== null && pos !== undefined && alive) editor.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, src })); };
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { observer.disconnect(); void render(); } }, {rootMargin:'300px'});
    const refresh = () => { generation++; dom.textContent = `Image · ${node.attrs.alt || node.attrs.src}`; observer.observe(dom); };
    dom.textContent = `Image · ${node.attrs.alt || node.attrs.src}`; observer.observe(dom); refreshers.add(refresh);
    return { dom, ignoreMutation: () => true, update(next) { if (next.type !== node.type) return false; const changed = !next.sameMarkup(node); node = next; if (changed) refresh(); return true; }, destroy() { alive = false; observer.disconnect(); refreshers.delete(refresh); } };
  };
  const taskView: NodeViewConstructor = (initial, editor, getPos) => {
    let node = initial;
    const dom = document.createElement('li'), contentDOM = document.createElement('div'), check = document.createElement('button');
    check.type = 'button'; check.contentEditable = 'false'; check.className = 'visual-task';
    const refresh = () => { check.hidden = node.attrs.checked === null; check.textContent = node.attrs.checked ? '✓' : ''; check.setAttribute('role', 'checkbox'); check.setAttribute('aria-checked', String(!!node.attrs.checked)); check.setAttribute('aria-label', 'Task complete'); dom.classList.toggle('task-item', node.attrs.checked !== null); };
    check.onclick = event => { event.preventDefault(); if (!editable) return; const pos = getPos(); if (pos !== undefined) editor.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, checked: !node.attrs.checked })); };
    dom.append(check, contentDOM); refresh();
    return { dom, contentDOM, stopEvent: event => check.contains(event.target as Node), update(next) { if (next.type !== node.type) return false; node = next; refresh(); return true; } };
  };
  const plugins = [
    history(), tableEditing(),
    inputRules({ rules: [textblockTypeInputRule(/^(#{1,6})\s$/, schema.nodes.heading, match => ({ level: match[1].length })), wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote), wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list), wrappingInputRule(/^(\d+)\.\s$/, schema.nodes.ordered_list, match => ({ order: +match[1] }))] }),
    keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo, 'Mod-y': redo, 'Mod-b': toggleMark(schema.marks.strong), 'Mod-i': toggleMark(schema.marks.em), 'Mod-`': toggleMark(schema.marks.code), Enter: splitListItem(schema.nodes.list_item), Tab: chainCommands(goToNextCell(1), sinkListItem(schema.nodes.list_item)), 'Shift-Tab': chainCommands(goToNextCell(-1), liftListItem(schema.nodes.list_item)), 'Mod-Enter': chainCommands(exitCode, (state, dispatch) => { if (!(state.selection instanceof NodeSelection)) return false; const pos = state.selection.to; if (dispatch) { const tr = state.tr.insert(pos, schema.nodes.paragraph.create()); dispatch(tr.setSelection(TextSelection.create(tr.doc, pos + 1))); } return true; }) }),
    keymap(baseKeymap),
  ];
  const view = new EditorView(parent, {
    state: EditorState.create({ doc: parseVisual(text), plugins }), attributes: { class: 'prose visual-document', 'aria-label': 'Visual editor', role: 'textbox', 'aria-multiline': 'true', spellcheck: 'true' },
    editable: () => editable,
    nodeViews: { rich_block: richView, math_inline: richView, frontmatter: richView, image: imageView, list_item: taskView },
    transformPastedHTML: html => DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['script', 'style', 'iframe', 'form'] }),
    handleClick: (_view, _pos, event) => { const link = (event.target as HTMLElement).closest('a'); if (link) { event.preventDefault(); return true; } return false; },
    dispatchTransaction(transaction) { const state = view.state.apply(transaction); view.updateState(state); if (transaction.docChanged) { stopHtml(); options.changed(serializeVisual(state.doc)); } },
  });
  return {
    view,
    load(source: string, saved?: EditorState) { const existing = [...refreshers]; view.updateState(saved ?? EditorState.create({ doc: parseVisual(source), plugins })); existing.forEach(render => { if (refreshers.has(render)) render(); }); },
    snapshot() { return view.state; },
    setEditable(value: boolean) { editable = value; view.setProps({ editable: () => value }); },
    refresh() { refreshers.forEach(render => render()); },
    async format(kind: string) {
      if (!editable) return;
      const commands: Record<string, Command> = { bold: toggleMark(schema.marks.strong), italic: toggleMark(schema.marks.em), strike: toggleMark(schema.marks.strike), heading: setBlockType(schema.nodes.heading, { level: 2 }), paragraph: setBlockType(schema.nodes.paragraph), list: wrapInList(schema.nodes.bullet_list), ordered: wrapInList(schema.nodes.ordered_list), quote: wrapIn(schema.nodes.blockquote), code: toggleMark(schema.marks.code), 'code-block': setBlockType(schema.nodes.code_block), 'row-add': addRowAfter, 'column-add': addColumnAfter, 'row-delete': deleteRow, 'column-delete': deleteColumn, 'table-delete': deleteTable, undo, redo };
      if (commands[kind]) { execute(commands[kind]); return; }
      let node: PMNode | undefined;
      if (kind === 'link') {
        const value = await options.edit('Link address (leave empty to remove)', 'https://'); if (value === null) return;
        if (value && /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value) && !/^(https?:|mailto:)/i.test(value)) throw new Error('Use a web, email, or document link.');
        const { from, to, empty } = view.state.selection;
        if (empty && value) { view.dispatch(view.state.tr.insertText(value).addMark(from, from + value.length, schema.marks.link.create({ href: value }))); }
        else view.dispatch(value ? view.state.tr.addMark(from, to, schema.marks.link.create({ href: value })) : view.state.tr.removeMark(from, to, schema.marks.link));
      } else if (kind === 'image') { const src = await options.edit('Image path or data URL', 'images/example.svg'); if (src !== null) node = schema.nodes.image.create({ src, alt: '' }); }
      else if (kind === 'table') { const cell = (header: boolean) => (header ? schema.nodes.table_header : schema.nodes.table_cell).createAndFill()!; node = schema.nodes.table.create(null, [schema.nodes.table_row.create(null, [cell(true), cell(true)]), schema.nodes.table_row.create(null, [cell(false), cell(false)])]); }
      else if (kind === 'task') node = schema.nodes.bullet_list.create({ tight: true }, schema.nodes.list_item.create({ checked: false }, schema.nodes.paragraph.create(null, schema.text('New task'))));
      else if (['math', 'mermaid', 'html', 'inline-math'].includes(kind)) {
        const source = await options.edit(kind === 'inline-math' ? 'Math' : `Insert ${kind}`, kind === 'mermaid' ? 'flowchart LR\n  Idea --> Draft --> Share' : kind === 'html' ? '<button onclick="this.textContent=\'Hello!\'">Click me</button>' : 'E = mc^2', kind !== 'inline-math');
        if (source !== null) node = kind === 'inline-math' ? schema.nodes.math_inline.create({ source }) : schema.nodes.rich_block.create({ kind, source });
      }
      if (node) { const tr = view.state.tr.replaceSelectionWith(node); if (node.isBlock && tr.selection.to === tr.doc.content.size) tr.insert(tr.doc.content.size, schema.nodes.paragraph.create()); view.dispatch(tr.scrollIntoView()); }
      view.focus();
    },
    destroy() { view.destroy(); },
  };
}
export type VisualEditor = ReturnType<typeof createVisualEditor>;
