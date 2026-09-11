import './style.css';
import welcome from './welcome.md?raw';
import { invoke } from '@tauri-apps/api/core';
import { icon } from './icons';
import { createEditor, type Format } from './editor';
import { escapeHtml, exportPage, renderMarkdown, statistics } from './markdown';
import { native, openFile, saveFile, exportHtml, openExternal, readBrowserFile, type DocumentFile } from './files';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const mod = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+';
const app = $('#app');
const button = (action: string, glyph: string, label: string, shortcut = '') => `<button class="icon-button" data-action="${action}" title="${label}${shortcut ? ` (${shortcut})` : ''}" aria-label="${label}">${icon(glyph)}</button>`;

app.innerHTML = `
  <aside class="sidebar" aria-label="Document navigation">
    <div class="brand"><img src="/mark.svg" alt="" width="32" height="32"><span>plainmark<span class="brand-dot">.</span></span><span class="version">0.1</span></div>
    <div class="file-actions">
      <button class="new-button" data-action="new">${icon('plus')}<span>New document</span><kbd>${mod}N</kbd></button>
      <button class="open-button" data-action="open">${icon('folder')}<span>Open a file</span><kbd>${mod}O</kbd></button>
    </div>
    <div class="sidebar-label">YOUR DOCUMENT</div>
    <div class="current-document">${icon('file')}<span id="sidebar-filename">welcome.md</span><span id="dirty-dot" hidden aria-label="Unsaved changes"></span></div>
    <div class="outline-label sidebar-label">ON THIS PAGE <span id="heading-count"></span></div>
    <nav id="outline" aria-label="Document outline"></nav>
    <div class="sidebar-bottom">
      <div class="quiet-promise">${icon('shield')}<div>Your words. Your device.<small>Free. Open source. Always.</small></div></div>
      <div class="sidebar-tools"><button data-action="help">${icon('help')}<span>A little help</span><kbd>?</kbd></button>${button('theme', 'moon', 'Toggle dark mode')}</div>
    </div>
  </aside>
  <main class="main">
    <header class="topbar">
      <div class="document-breadcrumb">${button('sidebar', 'panel', 'Toggle sidebar')}<span class="breadcrumb-label">Documents</span><span class="breadcrumb-divider">/</span><span id="filename">welcome.md</span><span id="header-dirty" hidden>Edited</span></div>
      <div class="topbar-actions">${button('export', 'export', 'Export HTML')}<button class="save-button" data-action="save">${icon('save')}<span>Save</span><kbd>${mod}S</kbd></button></div>
    </header>
    <div class="workspace-toolbar">
      <div class="view-switch" role="group" aria-label="Editor view"><button data-mode="write" aria-pressed="false">${icon('edit')}<span>Write</span></button><button data-mode="split" class="active" aria-pressed="true">${icon('split')}<span>Split</span></button><button data-mode="read" aria-pressed="false">${icon('read')}<span>Read</span></button></div>
      <div class="format-tools" aria-label="Formatting">${button('format:heading', 'heading', 'Heading')}${button('format:bold', 'bold', 'Bold', `${mod}B`)}${button('format:italic', 'italic', 'Italic', `${mod}I`)}<span class="tool-divider"></span>${button('format:link', 'link', 'Insert link', `${mod}K`)}${button('format:code', 'code', 'Code')}${button('format:list', 'list', 'Bullet list')}${button('format:quote', 'quote', 'Blockquote')}</div>
      <div class="utility-tools">${button('find', 'search', 'Find and replace', `${mod}F`)}${button('focus', 'focus', 'Focus mode', `${mod}Shift+F`)}</div>
    </div>
    <div class="workspace" data-view="split">
      <section class="editor-pane" aria-label="Source pane"><div class="pane-label"><span>MARKDOWN</span><span class="pane-note">Plain text. Endless possibility.</span></div><div id="editor"></div></section>
      <section class="preview-pane" aria-label="Preview pane"><div class="pane-label"><span>PREVIEW</span><span class="live-label"><i></i> Live</span></div><div id="preview-scroll" tabindex="0" aria-label="Rendered document"><article id="preview" class="prose"></article></div></section>
    </div>
    <footer class="statusbar"><div><span class="status-indicator"></span><span id="save-status">Example document</span><span class="status-separator">·</span><span id="storage-mode">${native ? 'On your device' : 'Browser preview'}</span></div><div><span id="word-count"></span><span class="status-separator">·</span><span id="reading-time"></span><span class="status-separator">·</span><span id="cursor-position">Ln 1, Col 1</span><button id="sync-button" data-action="sync" aria-pressed="true" title="Toggle proportional scroll sync">Scroll sync on</button><span class="encoding">UTF-8</span></div></footer>
  </main>
  <div id="toast" role="status" aria-live="polite" hidden></div>
  <dialog id="prompt-dialog" aria-labelledby="prompt-title"><div class="dialog-top"><span class="dialog-mark">${icon('file')}</span><h2 id="prompt-title"></h2></div><p id="prompt-message"></p><div id="prompt-buttons" class="dialog-buttons"></div></dialog>
  <dialog id="help-dialog" aria-labelledby="help-title"><button class="dialog-close icon-button" aria-label="Close help">${icon('close')}</button><img src="/mark.svg" width="44" height="44" alt=""><p class="eyebrow">A LITTLE HELP</p><h2 id="help-title">Make yourself at home.</h2><p>Open a Markdown file or start a new one. Your preview follows along as you write.</p><div class="shortcuts"><span>New document</span><kbd>${mod}N</kbd><span>Open file</span><kbd>${mod}O</kbd><span>Save / Save as</span><kbd>${mod}S / ${mod}Shift+S</kbd><span>Find and replace</span><kbd>${mod}F</kbd><span>Bold / Italic / Link</span><kbd>${mod}B / I / K</kbd><span>Write / Split / Read</span><kbd>${mod}1 / 2 / 3</kbd><span>Focus mode</span><kbd>${mod}Shift+F</kbd><span>Leave editor with Tab</span><kbd>Esc, then Tab</kbd></div><div class="help-note"><strong>A few thoughtful defaults</strong><p>Files stay on your device. A recovery draft is stored locally while you edit; save to keep a permanent copy. Raw HTML is displayed as text, and remote images are blocked to prevent tracking.</p><p>${native ? 'Local PNG, JPEG, GIF, and WebP images inside your document’s folder appear in the preview.' : 'This is the browser preview. Supported browsers can save directly; others download a copy. The desktop app also supports local images.'}</p></div><div class="help-footer"><span>Plainmark 0.1.0 · GPL-3.0-or-later</span><button data-action="source">View source ↗</button></div></dialog>
`;

let file: DocumentFile = { name: 'welcome.md', text: welcome };
let text = welcome;
let baseline = welcome;
let recovered = false;
let busy = false;
let closing = false;
let mode: 'write' | 'split' | 'read' = 'split';
let focused = false;
let sync = true;
let renderTimer: ReturnType<typeof setTimeout>;
let toastTimer: ReturnType<typeof setTimeout>;
let renderVersion = 0;
let lastHtml: string | null = null;
let recoveryWarningShown = false;
let dialogPending = false;
let imageCache = new Map<string, Promise<string>>();
const draftKey = 'plainmark.recovery.v1';

const editor = createEditor($('#editor'), text, (value) => {
  text = value;
  saveRecovery();
  updateStatus();
  clearTimeout(renderTimer); renderTimer = setTimeout(render, 120);
}, (line, column) => { $('#cursor-position').textContent = `Ln ${line}, Col ${column}`; });

function dirty() { return recovered || text !== baseline; }
function toast(message: string, error = false) {
  clearTimeout(toastTimer);
  const el = $('#toast'); el.textContent = message; el.hidden = false; el.classList.toggle('error', error);
  toastTimer = setTimeout(() => { el.hidden = true; }, error ? 12_000 : 4500);
}
function saveRecovery() {
  try {
    if (dirty()) localStorage.setItem(draftKey, JSON.stringify({ name: file.name, text }));
    else localStorage.removeItem(draftKey);
  } catch {
    if (!recoveryWarningShown) { toast('Recovery storage is full or unavailable. Save your file to keep your changes.', true); recoveryWarningShown = true; }
  }
}
function updateStatus() {
  $('#filename').textContent = file.name;
  $('#sidebar-filename').textContent = file.name;
  $('#dirty-dot').hidden = !dirty(); $('#header-dirty').hidden = !dirty();
  const stats = statistics(text);
  $('#word-count').textContent = `${stats.words.toLocaleString()} words`;
  $('#reading-time').textContent = `${stats.minutes} min read`;
  $('#save-status').textContent = dirty() ? 'Unsaved changes' : file.id !== undefined || file.handle ? 'Saved to file' : file.name === 'welcome.md' ? 'Example document' : 'Local document';
  $('.status-indicator').classList.toggle('unsaved', dirty());
  document.title = `${dirty() ? '• ' : ''}${file.name} — Plainmark`;
}

async function render() {
  const version = ++renderVersion;
  const result = renderMarkdown(text);
  const scroll = $('#preview-scroll'); const scrollTop = scroll.scrollTop;
  if (result.html !== lastHtml) { $('#preview').innerHTML = result.html; lastHtml = result.html; }
  scroll.scrollTop = scrollTop;
  $('#heading-count').textContent = result.headings.length ? `${result.headings.length}` : '';
  const outline = $('#outline');
  outline.replaceChildren();
  if (!result.headings.length) {
    const empty = document.createElement('p'); empty.className = 'empty-outline'; empty.textContent = 'Your headings will appear here.'; outline.append(empty);
  }
  result.headings.forEach((heading, index) => {
    const link = document.createElement('button'); link.className = `outline-item level-${Math.min(heading.level, 3)}`;
    link.innerHTML = `<span class="outline-number">${String(index + 1).padStart(2, '0')}</span><span>${escapeHtml(heading.text)}</span>`;
    link.addEventListener('click', () => {
      editor.jump(heading.line);
      document.getElementById(heading.id)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      outline.querySelectorAll('.active').forEach((el) => el.classList.remove('active')); link.classList.add('active');
    });
    outline.append(link);
  });
  const imageLoads: Promise<void>[] = [];
  if (native && file.id !== undefined) {
    for (const image of result.images) {
      const key = `${file.id}:${image.path}`;
      if (!imageCache.has(key)) imageCache.set(key, invoke<string>('read_image', { id: file.id, path: image.path }));
      imageLoads.push(imageCache.get(key)!.then((src) => {
        if (version !== renderVersion) return;
        const placeholder = $(`[data-image="${image.index}"]`);
        if (!placeholder) return;
        const img = document.createElement('img'); img.src = src; img.alt = image.alt; img.loading = 'lazy'; placeholder.replaceWith(img);
      }).catch(() => { /* Keep a readable placeholder when a local image is unavailable. */ }));
    }
  }
  await Promise.all(imageLoads);
}

function loadDocument(next: DocumentFile, isRecovered = false) {
  clearTimeout(renderTimer); file = next; text = next.text; baseline = next.text; recovered = isRecovered;
  imageCache = new Map(); lastHtml = null; editor.load(text); $('#preview-scroll').scrollTop = 0;
  $('#cursor-position').textContent = 'Ln 1, Col 1'; saveRecovery(); updateStatus(); render();
}

type Choice = { label: string; value: string; primary?: boolean; danger?: boolean };
async function ask(title: string, message: string, choices: Choice[]): Promise<string> {
  if (dialogPending) return 'cancel'; dialogPending = true;
  const dialog = $<HTMLDialogElement>('#prompt-dialog');
  $('#prompt-title').textContent = title; $('#prompt-message').textContent = message;
  const buttons = $('#prompt-buttons'); buttons.replaceChildren();
  return new Promise((resolve) => {
    const finish = (value: string) => { dialog.removeEventListener('cancel', onCancel); dialog.close(); dialogPending = false; resolve(value); };
    const onCancel = (event: Event) => { event.preventDefault(); finish('cancel'); };
    dialog.addEventListener('cancel', onCancel);
    choices.forEach((choice) => {
      const b = document.createElement('button'); b.textContent = choice.label; b.className = choice.primary ? 'primary' : choice.danger ? 'danger' : '';
      b.addEventListener('click', () => finish(choice.value)); buttons.append(b);
    });
    dialog.showModal();
    (buttons.querySelector('.primary') ?? buttons.firstElementChild as HTMLElement)?.scrollIntoView({ block: 'nearest' });
    (buttons.firstElementChild as HTMLElement)?.focus();
  });
}

async function save(as = false): Promise<boolean> {
  const result = await saveFile(file, text, as);
  if (!result) return false;
  file = result.file; baseline = text; recovered = false; saveRecovery(); updateStatus();
  toast(result.downloaded ? 'Download started. Keep the downloaded file to save your changes.' : 'Saved. Back to your words.');
  if (result.downloaded) $('#save-status').textContent = 'Download started';
  return true;
}

async function canLeave(): Promise<boolean> {
  if (!dirty()) return true;
  const choice = await ask('Keep your changes?', `“${file.name}” has unsaved edits. Save them before you leave this document.`, [
    { label: 'Cancel', value: 'cancel' }, { label: 'Discard changes', value: 'discard', danger: true }, { label: 'Save changes', value: 'save', primary: true },
  ]);
  if (choice === 'save') return save();
  return choice === 'discard';
}

async function run(action: () => Promise<unknown>) {
  if (busy) return; busy = true; editor.setEditable(false);
  document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => { button.disabled = true; });
  try { await action(); } catch (error) { toast(error instanceof Error ? error.message : String(error), true); }
  finally {
    busy = false; editor.setEditable(true);
    document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => { button.disabled = false; });
  }
}

function setMode(next: typeof mode) {
  mode = next; $('.workspace').dataset.view = mode;
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((el) => { const active = el.dataset.mode === mode; el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active)); });
  $('.format-tools').classList.toggle('invisible', mode === 'read');
  $('#cursor-position').hidden = mode === 'read';
  editor.view.requestMeasure();
}

function setTheme(theme: string) {
  document.documentElement.dataset.theme = theme;
  const b = $('[data-action="theme"]'); b.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
  b.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  try { localStorage.setItem('plainmark.theme', theme); } catch { /* Theme remains available without storage. */ }
}

function dispatch(action: string) {
  if (busy) return;
  if (action.startsWith('format:')) { if (mode === 'read') setMode('split'); editor.format(action.slice(7) as Format); return; }
  switch (action) {
    case 'new': void run(async () => { if (await canLeave()) { loadDocument({ name: 'untitled.md', text: '' }); if (mode === 'read') setMode('split'); editor.view.focus(); } }); break;
    case 'open': void run(async () => { if (await canLeave()) { const opened = await openFile(); if (opened) loadDocument(opened); } }); break;
    case 'save': void run(() => save()); break;
    case 'save-as': void run(() => save(true)); break;
    case 'export': void run(async () => { await render(); if (await exportHtml(file.name, exportPage(file.name, $('#preview').innerHTML))) toast(native ? 'HTML exported.' : 'HTML download started.'); }); break;
    case 'find': if (mode === 'read') setMode('split'); editor.find(); break;
    case 'sidebar': app.classList.toggle('sidebar-hidden'); editor.view.requestMeasure(); break;
    case 'theme': setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); break;
    case 'focus': focused = !focused; app.classList.toggle('focus-mode', focused); $('[data-action="focus"]').setAttribute('aria-pressed', String(focused)); if (focused) setMode('write'); editor.view.requestMeasure(); break;
    case 'sync': sync = !sync; $('#sync-button').textContent = `Scroll sync ${sync ? 'on' : 'off'}`; $('#sync-button').setAttribute('aria-pressed', String(sync)); break;
    case 'help': $<HTMLDialogElement>('#help-dialog').showModal(); break;
    case 'source': void openExternal('https://github.com/gopalasubramanium/plainmark').catch((error) => toast(String(error), true)); break;
  }
}

app.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const action = target.closest<HTMLButtonElement>('[data-action]')?.dataset.action;
  if (action) dispatch(action);
  const view = target.closest<HTMLButtonElement>('[data-mode]')?.dataset.mode as typeof mode | undefined;
  if (view && !busy) setMode(view);
});
$('#help-dialog .dialog-close').addEventListener('click', () => $<HTMLDialogElement>('#help-dialog').close());

$('#preview').addEventListener('click', (event) => {
  const a = (event.target as HTMLElement).closest('a'); if (!a) return;
  event.preventDefault(); const href = a.getAttribute('href') ?? '';
  if (href.startsWith('#')) {
    let target = href.slice(1); try { target = decodeURIComponent(target); } catch { return; }
    const headings = renderMarkdown(text).headings;
    const match = headings.find((h) => h.id === target || h.text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-') === target);
    if (match) document.getElementById(match.id)?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  void openExternal(href).catch((error) => toast(error instanceof Error ? error.message : String(error), true));
});

editor.view.scrollDOM.addEventListener('scroll', () => {
  if (!sync || mode !== 'split') return;
  const source = editor.view.scrollDOM; const preview = $('#preview-scroll');
  const total = source.scrollHeight - source.clientHeight;
  if (total > 0) preview.scrollTop = (source.scrollTop / total) * (preview.scrollHeight - preview.clientHeight);
}, { passive: true });

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && focused && !$<HTMLDialogElement>('#prompt-dialog').open && !$<HTMLDialogElement>('#help-dialog').open) { dispatch('focus'); return; }
  if ($<HTMLDialogElement>('#prompt-dialog').open || $<HTMLDialogElement>('#help-dialog').open) return;
  if (event.key === '?' && !(event.target as HTMLElement).closest('input,textarea,[contenteditable="true"]')) { dispatch('help'); return; }
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
  const key = event.key.toLowerCase();
  const action = ({ n: 'new', o: 'open', s: event.shiftKey ? 'save-as' : 'save', b: 'format:bold', i: 'format:italic', k: 'format:link', f: event.shiftKey ? 'focus' : 'find' } as Record<string, string>)[key];
  if (action) { event.preventDefault(); event.stopPropagation(); dispatch(action); }
  else if (['1', '2', '3'].includes(key)) { event.preventDefault(); if (!busy) setMode(({ '1': 'write', '2': 'split', '3': 'read' } as const)[key as '1' | '2' | '3']); }
}, { capture: true });

window.addEventListener('beforeunload', (event) => {
  saveRecovery();
  if (dirty() && !closing) { event.preventDefault(); event.returnValue = ''; }
});

// A browser drop is a user-selected File. Native files use the Rust-owned picker.
if (!native) {
  document.addEventListener('dragover', (event) => { if (event.dataTransfer?.types.includes('Files')) { event.preventDefault(); app.classList.add('dragging'); } });
  document.addEventListener('dragleave', (event) => { if (!event.relatedTarget) app.classList.remove('dragging'); });
  document.addEventListener('drop', (event) => {
    event.preventDefault(); app.classList.remove('dragging'); const dropped = event.dataTransfer?.files[0];
    if (dropped) void run(async () => { if (await canLeave()) loadDocument(await readBrowserFile(dropped)); });
  });
}

try {
  setTheme(localStorage.getItem('plainmark.theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const draft = localStorage.getItem(draftKey);
  if (draft) {
    const data = JSON.parse(draft) as { text?: unknown; name?: unknown };
    if (typeof data.text === 'string' && typeof data.name === 'string') {
      loadDocument({ name: data.name, text: data.text }, true);
      toast('Recovered your unsaved draft. Save it to keep a permanent copy.');
    }
  }
} catch { /* A malformed draft must never prevent the app from opening. */ }
updateStatus(); render();

if (native) {
  void (async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const { listen } = await import('@tauri-apps/api/event');
    await getCurrentWindow().onCloseRequested((event) => {
      if (closing) return;
      event.preventDefault();
      void run(async () => { if (await canLeave()) { recovered = false; baseline = text; saveRecovery(); closing = true; await invoke('quit'); } });
    });
    await listen('request-quit', () => { void run(async () => { if (await canLeave()) { recovered = false; baseline = text; saveRecovery(); closing = true; await invoke('quit'); } }); });
  })().catch((error) => toast(`Could not set up close protection: ${String(error)}`, true));
}
