import { Compartment, EditorSelection, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownKeymap } from '@codemirror/lang-markdown';
import { syntaxHighlighting, HighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { search, searchKeymap, highlightSelectionMatches, openSearchPanel } from '@codemirror/search';
import { tags } from '@lezer/highlight';

export type Format = 'bold' | 'italic' | 'heading' | 'link' | 'code' | 'list' | 'quote';

export function createEditor(parent: HTMLElement, text: string, onChange: (text: string) => void, onCursor: (line: number, column: number) => void) {
  const editable = new Compartment();
  const extensions = [
    lineNumbers(), history(), drawSelection(), rectangularSelection(), highlightActiveLine(), highlightActiveLineGutter(),
    markdown(), bracketMatching(), indentOnInput(), search({ top: true }), highlightSelectionMatches(),
    keymap.of([...markdownKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ 'aria-label': 'Markdown editor', spellcheck: 'false', autocapitalize: 'off' }),
    EditorState.tabSize.of(2),
    syntaxHighlighting(HighlightStyle.define([
      { tag: tags.heading, color: 'var(--accent)', fontWeight: '650' },
      { tag: tags.strong, fontWeight: '700', color: 'var(--text)' },
      { tag: tags.emphasis, fontStyle: 'italic', color: 'var(--green)' },
      { tag: [tags.url, tags.link], color: 'var(--accent)', textDecoration: 'underline' },
      { tag: [tags.monospace, tags.string], color: 'var(--green)' },
      { tag: [tags.processingInstruction, tags.meta, tags.punctuation], color: 'var(--muted)' },
      { tag: tags.quote, color: 'var(--green)', fontStyle: 'italic' },
    ])),
    editable.of(EditorView.editable.of(true)),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) onChange(update.state.doc.toString());
      if (update.selectionSet || update.docChanged) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        onCursor(line.number, pos - line.from + 1);
      }
    }),
  ];
  const view = new EditorView({ state: EditorState.create({ doc: text, extensions }), parent });
  return {
    view,
    load(value: string) { view.setState(EditorState.create({ doc: value, extensions })); },
    setEditable(value: boolean) { view.dispatch({ effects: editable.reconfigure(EditorView.editable.of(value)) }); },
    find() { openSearchPanel(view); },
    jump(line: number) {
      const position = view.state.doc.line(Math.min(line, view.state.doc.lines)).from;
      view.dispatch({ selection: { anchor: position }, effects: EditorView.scrollIntoView(position, { y: 'start' }) });
    },
    format(kind: Format) {
      const range = view.state.selection.main;
      const selected = view.state.sliceDoc(range.from, range.to);
      if (['heading', 'list', 'quote'].includes(kind)) {
        const prefix = { heading: '## ', list: '- ', quote: '> ' }[kind as 'heading' | 'list' | 'quote'];
        const startLine = view.state.doc.lineAt(range.from);
        const endLine = view.state.doc.lineAt(range.to);
        const value = view.state.sliceDoc(startLine.from, endLine.to);
        const lines = value.split('\n');
        const remove = lines.every((l) => l.startsWith(prefix));
        const insert = lines.map((l) => remove ? l.slice(prefix.length) : prefix + l).join('\n');
        view.dispatch({ changes: { from: startLine.from, to: endLine.to, insert }, selection: { anchor: startLine.from, head: startLine.from + insert.length } });
      } else {
        const [before, after, fallback] = { bold: ['**', '**', 'bold text'], italic: ['*', '*', 'italic text'], link: ['[', '](https://example.com)', 'link text'], code: selected.includes('\n') ? ['```\n', '\n```', 'code'] : ['`', '`', 'code'] }[kind as 'bold' | 'italic' | 'link' | 'code'];
        const content = selected || fallback;
        view.dispatch({ changes: { from: range.from, to: range.to, insert: before + content + after }, selection: EditorSelection.range(range.from + before.length, range.from + before.length + content.length) });
      }
      view.focus();
    },
  };
}
