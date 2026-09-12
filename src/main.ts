// Created by Gopala Subramanium — https://me.sgopala.com
// Everyday Markdown, free of ads, subscriptions, and interruptions. See AUTHORS.md.
import './style.css';
import welcome from './welcome.md?raw';
import { invoke } from '@tauri-apps/api/core';
import { icon } from './icons';
import { escapeHtml, exportPage, renderMarkdown, statistics } from './markdown';
import { native, openFile, saveFile, exportHtml, openExternal, readBrowserFile, MAX_BYTES, type DocumentFile } from './files';
import { openFolder, listFolder, openWorkspaceDocument, openLinkedDocument, closeFolder, readLocalImage, clearImageCache, type FolderWorkspace } from './workspaces';
import { enhance, stopHtml } from './rich';
import { documentLink, headingSlugs } from './document-links';
import { preferences, savePreferences, clearRecovery } from './preferences';
import { sourceOnlyReason } from './compatibility';
import type { createEditor, Format } from './editor';
import type { EditorState as SourceState } from '@codemirror/state';
import type { EditorState as VisualState } from 'prosemirror-state';
import type { VisualEditor } from './visual-editor';
import type { blockScrollSync } from './scroll-sync';

type Mode = 'visual' | 'write' | 'split' | 'read';
interface Tab { key: number; file: DocumentFile; text: string; baseline: string; recovered: boolean; mode: Mode; sourceState?: SourceState; visualState?: VisualState; sourceTop: number; previewTop: number; visualTop: number }
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const mod = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+';
const app = $('#app');
const button = (action: string, glyph: string, label: string, shortcut = '') => `<button class="icon-button" data-action="${action}" title="${label}${shortcut ? ` (${shortcut})` : ''}" aria-label="${label}">${icon(glyph)}</button>`;
app.innerHTML = `
  <aside class="sidebar" aria-label="Document navigation">
    <div class="brand"><img src="/mark.svg" alt="" width="32" height="32"><span>plainmark<span class="brand-dot">.</span></span><span class="version">0.3</span></div>
    <div class="file-actions">
      <button class="new-button" data-action="new">${icon('plus')}<span>New document</span><kbd>${mod}N</kbd></button>
      <button class="open-button" data-action="open">${icon('file')}<span>Open a file</span><kbd>${mod}O</kbd></button>
      <button class="open-button" data-action="folder">${icon('folder')}<span>Open a folder</span><kbd>${mod}⇧O</kbd></button>
      <button class="open-button" data-action="quick-open">${icon('search')}<span>Quick open</span><kbd>${mod}P</kbd></button>
    </div>
    <div class="sidebar-scroll"><div class="folder-heading"><div class="sidebar-label">FOLDERS</div>${button('refresh-folders', 'refresh', 'Refresh folders')}</div><div id="folders"><p class="empty-outline">Open a folder to browse your documents.</p></div>
    <div class="outline-label sidebar-label">ON THIS PAGE <span id="heading-count"></span></div><nav id="outline" aria-label="Document outline"></nav></div>
    <div class="sidebar-bottom"><div class="quiet-promise">${icon('shield')}<div>Your words. Your device.<small>Free. Open source. Always.</small><button class="creator-credit" data-action="creator">Made by Gopala Subramanium</button></div></div><div class="sidebar-tools"><button data-action="help">${icon('help')}<span>A little help</span><kbd>?</kbd></button>${button('theme', 'moon', 'Toggle dark mode')}</div></div>
  </aside>
  <main class="main">
    <header class="topbar"><div class="document-breadcrumb">${button('sidebar', 'panel', 'Toggle sidebar')}<span class="breadcrumb-label">Documents</span><span class="breadcrumb-divider">/</span><span id="filename"></span><span id="header-dirty" hidden>Edited</span></div><div class="topbar-actions">${button('save-all', 'save', 'Save all tabs')}<details class="insert-menu export-menu"><summary aria-label="Export or print">${icon('export')}</summary><div class="insert-options"><button data-action="export">Export HTML</button><button data-action="print">Print / Save as PDF</button></div></details><button class="save-button" data-action="save">${icon('save')}<span>Save</span><kbd>${mod}S</kbd></button></div></header>
    <div class="tab-strip"><div id="tabs" role="tablist" aria-label="Open documents"></div>${button('new', 'plus', 'New tab')}</div>
    <div class="workspace-toolbar"><div class="view-switch" role="group" aria-label="Editor view"><button data-mode="visual" aria-pressed="true" class="active">${icon('edit')}<span>Visual</span></button><button data-mode="write" aria-pressed="false">${icon('code')}<span>Source</span></button><button data-mode="split" aria-pressed="false">${icon('split')}<span>Split</span></button><button data-mode="read" aria-pressed="false">${icon('read')}<span>Read</span></button></div>
      <div class="format-tools" aria-label="Formatting">${button('format:heading', 'heading', 'Heading')}${button('format:bold', 'bold', 'Bold', `${mod}B`)}${button('format:italic', 'italic', 'Italic', `${mod}I`)}${button('format:link', 'link', 'Insert link', `${mod}K`)}${button('format:list', 'list', 'Bullet list')}
      <details class="insert-menu"><summary>Insert <span aria-hidden="true">⌄</span></summary><div class="insert-options"><button data-action="insert-image">Image from file…</button>${[['paragraph','Paragraph'],['ordered','Numbered list'],['task','Task list'],['quote','Blockquote'],['strike','Strikethrough'],['code','Inline code'],['code-block','Code block'],['image','Image by path'],['table','Table'],['inline-math','Inline math'],['math','Math block'],['mermaid','Mermaid diagram'],['html','HTML block'],['row-add','Add table row'],['column-add','Add table column'],['row-delete','Remove table row'],['column-delete','Remove table column'],['table-delete','Remove table']].map(([value,label])=>`<button data-action="format:${value}">${label}</button>`).join('')}</div></details></div>
      <div class="utility-tools">${button('find','search','Find and replace',`${mod}F`)}${button('focus','focus','Focus mode',`${mod}Shift+F`)}</div></div>
    <div class="workspace" data-view="visual">
      <section class="visual-pane" aria-label="Visual editing pane"><div class="pane-label"><span>YOUR DOCUMENT</span><span class="pane-note">Markdown underneath. Your words up front.</span></div><div id="visual-scroll"><div id="visual-editor"></div></div></section>
      <section class="editor-pane" aria-label="Source pane"><div class="pane-label"><span>MARKDOWN</span><span class="pane-note">Plain text. Endless possibility.</span></div><div id="editor"></div></section>
      <section class="preview-pane" aria-label="Preview pane"><div class="pane-label"><span>PREVIEW</span><span class="live-label"><i></i> Live</span></div><div id="preview-scroll" tabindex="0" aria-label="Rendered document"><article id="preview" class="prose"></article></div></section>
    </div>
    <footer class="statusbar"><div><span class="status-indicator"></span><span id="save-status">Example document</span><span class="status-separator">·</span><span id="storage-mode">${native ? 'On your device' : 'Browser preview'}</span></div><div><span id="word-count"></span><span class="status-separator">·</span><span id="reading-time"></span><span class="status-separator">·</span><span id="cursor-position">Ln 1, Col 1</span><button id="sync-button" data-action="sync" aria-pressed="true" title="Synchronize matching Markdown blocks in both directions">Block sync on</button><span class="encoding">UTF-8</span></div></footer>
  </main>
  <div id="toast" role="status" aria-live="polite" hidden></div>
  <dialog id="prompt-dialog" aria-labelledby="prompt-title"><h2 id="prompt-title"></h2><p id="prompt-message"></p><div id="prompt-buttons" class="dialog-buttons"></div></dialog>
  <dialog id="edit-dialog" aria-labelledby="edit-title"><form method="dialog"><h2 id="edit-title"></h2><textarea id="edit-value" aria-label="Block source" spellcheck="false" rows="8"></textarea><div class="dialog-buttons"><button value="cancel">Cancel</button><button value="save" class="primary">Apply</button></div></form></dialog>
  <dialog id="help-dialog" aria-labelledby="help-title"><button class="dialog-close icon-button" aria-label="Close help">${icon('close')}</button><img src="/mark.svg" width="44" height="44" alt=""><p class="eyebrow">A LITTLE HELP</p><h2 id="help-title">Make yourself at home.</h2><p>Open a folder, keep documents in tabs, and write directly in Visual view. Source and Split keep the Markdown available whenever you need it.</p><div class="shortcuts"><span>New / Open / Open folder</span><kbd>${mod}N / O / ⇧O</kbd><span>Save / Save as / Save all</span><kbd>${mod}S / ⇧S / Alt+S</kbd><span>Close tab / Next tab</span><kbd>${mod}W / Ctrl+Tab</kbd><span>Quick open / Print or PDF</span><kbd>${mod}P / ⇧P</kbd><span>Follow a link (Visual)</span><kbd>${mod}click / ${mod}Enter</kbd><span>Find and replace (source)</span><kbd>${mod}F</kbd><span>Bold / Italic / Link</span><kbd>${mod}B / I / K</kbd><span>Visual / Source / Split / Read</span><kbd>${mod}1 / 2 / 3 / 4</kbd><span>Leave source editor with Tab</span><kbd>Esc, then Tab</kbd></div><div class="help-note"><strong>Local by design</strong><p>Mermaid and TeX math render locally. SVG previews are sanitized images. HTML scripts run only when you choose Run HTML, in an isolated frame without file or app access. Editing or switching tabs stops them.</p><p>Unsaved tabs have local recovery copies. Save to keep permanent files. Visual edits write standard Markdown; switching views alone does not change your document. Large files above 1 MB open in Source view.</p></div><div class="creator-note"><p>Made by <button class="text-button" data-action="creator">Gopala Subramanium</button>.</p><p>I made Plainmark because reading and writing Markdown is an everyday task. I wanted a simple tool that stays free, without ads, subscriptions, unnecessary extras, or interruptions.</p></div><button class="text-button" data-action="privacy">Privacy settings</button><div class="help-footer"><span>Plainmark ${import.meta.env.VITE_APP_VERSION} · GPL-3.0-or-later</span><button data-action="source">View source ↗</button></div></dialog>
  <dialog id="privacy-dialog" aria-labelledby="privacy-title"><button class="dialog-close icon-button" aria-label="Close privacy settings">${icon('close')}</button><h2 id="privacy-title">Privacy, on your terms.</h2><p>No accounts, analytics, document uploads, or background update checks.</p><label class="setting"><input id="pref-recovery" type="checkbox"><span>Keep local recovery copies<small>Helps recover unsaved tabs after a crash. Copies are stored on this device, without encryption. Turning this off clears those copies; your open tabs stay intact.</small></span></label><label class="setting"><input id="pref-spellcheck" type="checkbox"><span>Use system spelling suggestions<small>Off by default. Uses your device’s spelling service; that service’s privacy settings apply.</small></span></label><label class="setting"><input id="pref-html" type="checkbox"><span>Allow the Run HTML button<small>Scripts still require a click for each run. Only run code you trust. Turning this off stops the running frame.</small></span></label><div class="dialog-buttons"><button data-action="privacy-apply" class="primary">Apply</button></div></dialog>`;

let nextKey = 0, tabs: Tab[] = [], current: Tab;
let editor: ReturnType<typeof createEditor> | undefined, visual: VisualEditor | undefined, scrollSync: ReturnType<typeof blockScrollSync> | undefined;
let editorLoading: Promise<void> | undefined, visualLoading: Promise<void> | undefined;
let busy = false, closing = false, focused = false, sync = true, renderVersion = 0, modeVersion = 0;
let pendingNative = false, restoring = true, recoveryWarning = false, renderTimer: ReturnType<typeof setTimeout>, draftTimer: ReturnType<typeof setTimeout>, toastTimer: ReturnType<typeof setTimeout>;
let enhancement: ReturnType<typeof enhance> | undefined;
const draftKey = 'plainmark.recovery.v2';
const folderRoots = new Map<number, { folder: FolderWorkspace; element: HTMLDetailsElement }>();
function dirty(tab = current) { return tab.recovered || tab.text !== tab.baseline; }
function htmlFile(tab = current) { return /\.html?$/i.test(tab.file.name); }
function toast(message: string, error = false) { clearTimeout(toastTimer); const el = $('#toast'); el.textContent = message; el.hidden = false; el.classList.toggle('error', error); toastTimer = setTimeout(() => { el.hidden = true; }, error ? 12_000 : 4500); }
function saveRecovery() {
  if (restoring) return;
  if (!preferences.recovery) { try { clearRecovery(); } catch {} return; }
  clearTimeout(draftTimer);
  try {
    const drafts = tabs.filter(dirty).map(tab => ({ name: tab.file.name, text: tab.text, mode: tab.mode }));
    if (drafts.length) localStorage.setItem(draftKey, JSON.stringify(drafts)); else localStorage.removeItem(draftKey);
    localStorage.removeItem('plainmark.recovery.v1');
  } catch { if (!recoveryWarning) { toast('Recovery storage is full or unavailable. Save your tabs to keep your changes.', true); recoveryWarning = true; } }
}
function updateStatus() {
  $('#filename').textContent = current.file.name; $('#filename').title = current.file.path ?? current.file.relativePath ?? current.file.name;
  $('#header-dirty').hidden = !dirty();
  $('#save-status').textContent = dirty() ? 'Unsaved changes' : current.file.id !== undefined || current.file.handle ? 'Saved to file' : current.file.name === 'welcome.md' ? 'Example document' : 'Local document';
  $('.status-indicator').classList.toggle('unsaved', dirty()); document.title = `${dirty() ? '• ' : ''}${current.file.name} — Plainmark`;
  const stats = statistics(current.text); $('#word-count').textContent = `${stats.words.toLocaleString()} words`; $('#reading-time').textContent = `${stats.minutes} min read`;
  const active = document.querySelector<HTMLElement>(`[data-tab="${current.key}"]`); if (active) { active.querySelector('.tab-name')!.textContent = current.file.name; active.querySelector('.tab-dirty')!.toggleAttribute('hidden', !dirty()); }
}
function updateTabs() {
  const host = $('#tabs'); host.replaceChildren();
  tabs.forEach(tab => {
    const wrap = document.createElement('div'); wrap.className = 'document-tab'; wrap.classList.toggle('active', tab === current);
    const select = document.createElement('button'); select.dataset.tab = String(tab.key); select.setAttribute('role','tab'); select.setAttribute('aria-selected',String(tab === current)); select.tabIndex = tab === current ? 0 : -1; select.title = tab.file.path ?? tab.file.relativePath ?? tab.file.name;
    select.innerHTML = `${icon('file')}<span class="tab-name">${escapeHtml(tab.file.name)}</span><span class="tab-dirty" ${dirty(tab) ? '' : 'hidden'} aria-label="Unsaved changes">•</span>`;
    select.onclick = () => { if (!busy) void activate(tab); };
    const close = document.createElement('button'); close.className = 'tab-close'; close.setAttribute('aria-label', `Close ${tab.file.name}`); close.innerHTML = icon('close'); close.onclick = () => void run(() => closeTab(tab));
    wrap.append(select, close); host.append(wrap);
  });
}
function capture() {
  if (!current) return;
  if (editor && (current.mode === 'write' || current.mode === 'split')) { current.sourceState = editor.snapshot(); current.sourceTop = editor.view.scrollDOM.scrollTop; }
  if (visual && current.mode === 'visual') { current.visualState = visual.snapshot(); current.visualTop = $('#visual-scroll').scrollTop; }
  current.previewTop = $('#preview-scroll').scrollTop;
}
async function ensureSource() {
  if (editor) return;
  if (!editorLoading) editorLoading = (async () => {
    const { createEditor } = await import('./editor');
    editor = createEditor($('#editor'), current.text, text => changed(text, 'source'), (line,column) => { $('#cursor-position').textContent = `Ln ${line}, Col ${column}`; });
    const { blockScrollSync } = await import('./scroll-sync'); scrollSync = blockScrollSync(editor.view, $('#preview-scroll'), $('#preview'), () => sync && current.mode === 'split');
  })();
  await editorLoading;
}
async function ensureVisual() {
  if (visual) return;
  if (!visualLoading) visualLoading = import('./visual-editor').then(({ createVisualEditor }) => { visual = createVisualEditor($('#visual-editor'), current.text, { changed: text => changed(text, 'visual'), edit: editField, file: () => current.file, readImage: readLocalImage, openLink: href => void run(() => followLink(href)) }); });
  await visualLoading;
}
function changed(value: string, origin: 'source' | 'visual') {
  current.text = value;
  if (origin === 'source') current.visualState = undefined; else current.sourceState = undefined;
  stopHtml();
  clearTimeout(draftTimer); draftTimer = setTimeout(saveRecovery, 400);
  clearTimeout(renderTimer); renderTimer = setTimeout(() => { updateStatus(); render(); }, current.text.length > 200_000 ? 250 : 100);
  $('#header-dirty').hidden = !dirty(); $('#save-status').textContent = dirty() ? 'Unsaved changes' : 'Saved to file';
  document.querySelector(`[data-tab="${current.key}"] .tab-dirty`)?.toggleAttribute('hidden', !dirty());
}
function render(eager = false) {
  clearTimeout(renderTimer); enhancement?.dispose();
  const version = ++renderVersion, result = renderMarkdown(current.text, htmlFile());
  const preview = $('#preview'); const top = $('#preview-scroll').scrollTop;
  preview.innerHTML = result.html; $('#preview-scroll').scrollTop = top;
  $('#heading-count').textContent = String(result.headings.length || '');
  const outline = $('#outline'); outline.replaceChildren();
  result.headings.forEach((heading,index) => {
    const link = document.createElement('button'); link.className = `outline-item level-${Math.min(heading.level,3)}`; link.innerHTML = `<span class="outline-number">${String(index+1).padStart(2,'0')}</span><span>${escapeHtml(heading.text)}</span>`;
    link.onclick = () => { if (current.mode === 'visual') { const headings = [...$('#visual-editor').querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')]; headings[index]?.scrollIntoView({ block: 'start', behavior: 'smooth' }); } else { editor?.jump(heading.line); preview.querySelector(`#${heading.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }); } };
    outline.append(link);
  });
  if (!result.headings.length) { const empty = document.createElement('p'); empty.className = 'empty-outline'; empty.textContent = 'Your headings will appear here.'; outline.append(empty); }
  if (current.mode === 'read' || current.mode === 'split' || eager) enhancement = enhance(preview, result, current.file, readLocalImage, eager);
  scrollSync?.invalidate();
  return { done: enhancement?.done ?? Promise.resolve(), version };
}
async function setMode(mode: Mode, restore = false) {
  const version = ++modeVersion;
  if (!restore) capture();
  if (mode === 'visual' && current.text.length <= 1024 * 1024 && !htmlFile()) { const reason = sourceOnlyReason(current.text); if (reason) { mode = 'write'; toast(reason, true); } }
  stopHtml();
  if (mode === 'visual' && (current.text.length > 1024 * 1024 || htmlFile())) { mode = htmlFile() ? 'split' : 'write'; toast(htmlFile() ? 'HTML documents use Source and a runnable preview.' : 'This large document uses Source view to keep editing responsive.'); }
  current.mode = mode; $('.workspace').dataset.view = mode;
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(el => { const active = el.dataset.mode === mode; el.classList.toggle('active',active); el.setAttribute('aria-pressed',String(active)); });
  $('.format-tools').classList.toggle('invisible',mode === 'read'); $('#cursor-position').hidden = mode === 'visual' || mode === 'read'; $('#sync-button').hidden = mode !== 'split';
  try {
    if (mode === 'visual') { await ensureVisual(); if (version !== modeVersion) return; visual!.load(current.text, current.visualState); visual!.setEditable(!busy); $('#visual-scroll').scrollTop = current.visualTop; }
    else if (mode !== 'read') { await ensureSource(); if (version !== modeVersion) return; editor!.load(current.text,current.sourceState); editor!.setEditable(!busy); editor!.view.requestMeasure(); editor!.view.scrollDOM.scrollTop = current.sourceTop; }
    if (version !== modeVersion) return;
    render(); $('#preview-scroll').scrollTop = current.previewTop;
  } catch (error) { toast(`Could not open this view: ${String(error)}. Your source is preserved.`, true); if (mode === 'visual') await setMode('write'); }
}
async function activate(tab: Tab) { if (tab === current) return; capture(); saveRecovery(); current = tab; updateTabs(); updateStatus(); await setMode(tab.mode,true); document.querySelector(`[data-tab="${tab.key}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
async function addDocument(file: DocumentFile, recovered = false) {
  if (file.handle) for (const tab of tabs) if (tab.file.handle && await file.handle.isSameEntry?.(tab.file.handle)) { await activate(tab); return; }
  const duplicate = tabs.find(tab => (file.id !== undefined && tab.file.id === file.id) || (file.path && tab.file.path === file.path) || (file.workspaceId !== undefined && tab.file.workspaceId === file.workspaceId && tab.file.relativePath === file.relativePath) || (file.handle && file.handle === tab.file.handle));
  if (duplicate) { await activate(duplicate); return; }
  if (tabs.length >= 100) throw new Error('Close a tab before opening more documents (100 tab limit).');
  capture(); const tab: Tab = { key: ++nextKey, file, text: file.text, baseline: file.text, recovered, mode: /\.html?$/i.test(file.name) ? 'split' : file.text.length > 1024 * 1024 ? 'write' : 'visual', sourceTop: 0, previewTop: 0, visualTop: 0 };
  tabs.push(tab); current = tab; updateTabs(); updateStatus(); saveRecovery(); await setMode(tab.mode,true);
}
type Choice = { label: string; value: string; primary?: boolean; danger?: boolean };
function ask(title: string, message: string, choices: Choice[]): Promise<string> {
  const dialog = $<HTMLDialogElement>('#prompt-dialog'); if (dialog.open) return Promise.resolve('cancel');
  $('#prompt-title').textContent = title; $('#prompt-message').textContent = message; const buttons = $('#prompt-buttons'); buttons.replaceChildren();
  return new Promise(resolve => { const done = (value: string) => { dialog.removeEventListener('cancel', cancel); dialog.close(); resolve(value); }; const cancel = (event: Event) => { event.preventDefault(); done('cancel'); }; dialog.addEventListener('cancel',cancel); choices.forEach(choice => { const b = document.createElement('button'); b.textContent = choice.label; b.className = choice.primary ? 'primary' : choice.danger ? 'danger' : ''; b.onclick = () => done(choice.value); buttons.append(b); }); dialog.showModal(); (buttons.firstElementChild as HTMLElement)?.focus(); });
}
async function editField(title: string, value: string, multiline = false): Promise<string | null> {
  const dialog = $<HTMLDialogElement>('#edit-dialog'); if (dialog.open) return null;
  $('#edit-title').textContent = title; const field = $<HTMLTextAreaElement>('#edit-value'); field.value = value; field.rows = multiline ? 9 : 2;
  return new Promise(resolve => { dialog.returnValue = 'cancel'; dialog.addEventListener('close', () => resolve(dialog.returnValue === 'save' ? field.value : null), { once:true }); dialog.showModal(); field.focus(); field.select(); });
}
async function save(as = false, tab = current) {
  const content = tab.text, result = await saveFile(tab.file, content, as, tabs.filter(other => other !== tab).map(other => other.file)); if (!result) return false;
  const duplicate = tabs.find(other => other !== tab && ((result.file.id !== undefined && result.file.id === other.file.id) || (result.file.path && result.file.path === other.file.path)));
  if (duplicate) throw new Error('That file is already open in another tab.');
  const previousId = tab.file.id; tab.file = result.file; tab.baseline = content; tab.recovered = false;
  if (native && previousId !== undefined && previousId !== tab.file.id) await invoke('close_document', { id: previousId });
  clearImageCache(); saveRecovery(); updateTabs(); updateStatus();
  toast(result.downloaded ? 'Download started. Keep the downloaded file to save your changes.' : `Saved ${tab.file.name}.`); return true;
}
async function canClose(tab: Tab) {
  if (!dirty(tab)) return true;
  const choice = await ask('Keep your changes?', `“${tab.file.name}” has unsaved edits.`, [{ label:'Cancel',value:'cancel' },{ label:'Discard changes',value:'discard',danger:true },{ label:'Save changes',value:'save',primary:true }]);
  return choice === 'save' ? save(false,tab) : choice === 'discard';
}
async function closeTab(tab: Tab) {
  if (!(await canClose(tab))) return;
  const index = tabs.indexOf(tab); if (native && tab.file.id !== undefined) await invoke('close_document',{id:tab.file.id});
  if (tab === current) { stopHtml(); tabs.splice(index,1); if (tabs.length) { current = tabs[Math.min(index,tabs.length-1)]; updateTabs(); updateStatus(); await setMode(current.mode,true); } else await addDocument({name:'untitled.md',text:''}); }
  else { tabs.splice(index,1); updateTabs(); }
  saveRecovery();
}
async function closeApp() { for (const tab of tabs) if (!(await canClose(tab))) return; closing = true; tabs.forEach(tab => { tab.baseline = tab.text; tab.recovered = false; }); saveRecovery(); stopHtml(); await invoke('quit'); }
async function run(action: () => Promise<unknown>) {
  if (busy) return; busy = true; editor?.setEditable(false); visual?.setEditable(false); app.classList.add('busy');
  try { await action(); } catch (error) { toast(error instanceof Error ? error.message : String(error),true); }
  finally { busy = false; editor?.setEditable(true); visual?.setEditable(true); app.classList.remove('busy'); if (pendingNative) { pendingNative = false; void drainNative(); } }
}
async function populateFolder(folder: FolderWorkspace, host: HTMLElement, path = '') {
  host.textContent = 'Loading…';
  try { const entries = await listFolder(folder,path); host.replaceChildren();
    for (const item of entries) {
      if (item.directory) { const details = document.createElement('details'), summary = document.createElement('summary'), children = document.createElement('div'); summary.textContent = item.name; details.append(summary,children); let loaded = false; details.ontoggle = () => { if (details.open && !loaded) { loaded = true; void populateFolder(folder,children,item.path); } }; host.append(details); }
      else { const b = document.createElement('button'); b.className = 'folder-file'; b.textContent = item.name; b.title = item.path; b.onclick = () => void run(async () => { await addDocument(await openWorkspaceDocument(folder,item.path)); }); host.append(b); }
    }
    if (!entries.length) { const empty = document.createElement('span'); empty.className = 'empty-outline'; empty.textContent = 'No documents in this folder.'; host.append(empty); }
  } catch (error) { host.textContent = String(error); }
}
async function addFolder() {
  const folder = await openFolder(); if (!folder || folderRoots.has(folder.id)) return;
  if (!folderRoots.size) $('#folders').replaceChildren();
  const details = document.createElement('details'); details.className = 'folder-root'; details.open = true; const summary = document.createElement('summary'); summary.textContent = folder.name;
  const close = document.createElement('button'); close.className = 'folder-close'; close.setAttribute('aria-label',`Close folder ${folder.name}`); close.innerHTML = icon('close'); close.onclick = event => { event.preventDefault(); void run(async () => { await closeFolder(folder.id); folderRoots.delete(folder.id); details.remove(); }); };
  summary.append(close); const children = document.createElement('div'); details.append(summary,children); $('#folders').append(details); folderRoots.set(folder.id,{folder,element:details}); await populateFolder(folder,children);
}
async function sourceFormat(kind: string) {
  await ensureSource();
  if (['heading','bold','italic','link','list','code','quote'].includes(kind)) { editor!.format(kind as Format); return; }
  let snippet = ({ task:'- [ ] New task', table:'| Column | Column |\n| --- | --- |\n| Value | Value |', ordered:'1. Item', strike:'~~text~~', 'code-block':'```\ncode\n```', paragraph:'\n', image:'![Image](images/example.svg)' } as Record<string,string>)[kind];
  if (['math','inline-math','mermaid','html'].includes(kind)) { const value = await editField(`Insert ${kind}`,kind === 'mermaid' ? 'flowchart LR\n  Idea --> Draft' : kind === 'html' ? '<p>Hello</p>' : 'E=mc^2',true); if (value === null) return; snippet = kind === 'inline-math' ? `$${value}$` : kind === 'math' ? `\n$$\n${value}\n$$\n` : `\n\`\`\`${kind}\n${value}\n\`\`\`\n`; }
  if (snippet === undefined) { toast('Use Visual view for table row and column controls.'); return; }
  const range = editor!.view.state.selection.main; editor!.view.dispatch({changes:{from:range.from,to:range.to,insert:snippet}}); editor!.view.focus();
}
async function insertImage(file: File) {
  if (htmlFile()) throw new Error('Insert images in a Markdown document.');
  const { imageData } = await import('./image-import'); const data = await imageData(file);
  if (native && current.file.id === undefined && !(await save())) return;
  let src = data;
  if (native) src = await invoke<string>('import_image', { id: current.file.id, encoded: data.split(',')[1] });
  else if (new TextEncoder().encode(current.text + data).length > MAX_BYTES) throw new Error('This image would exceed the document size limit. Use a smaller image or the desktop app.');
  const alt = file.name.replace(/\.[^.]+$/, '').replace(/[\[\]\\\r\n]/g, ' ').slice(0, 120) || 'Image';
  if (current.mode === 'read') await setMode('visual');
  if (current.mode === 'visual') visual!.insertImage(src, alt);
  else { await ensureSource(); const { from, to } = editor!.view.state.selection.main; editor!.view.dispatch({ changes: { from, to, insert: `![${alt}](${src})` } }); editor!.view.focus(); }
  toast(native ? 'Image added to the assets folder beside your document. Keep them together when sharing.' : 'Image embedded in this browser document. Save to keep it.');
}
app.addEventListener('paste', event => {
  if (busy || !(event.target as HTMLElement).closest('#visual-editor, #editor')) return;
  const file = [...(event.clipboardData?.files ?? [])].find(file => file.type.startsWith('image/'));
  if (file) { event.preventDefault(); event.stopPropagation(); void run(() => insertImage(file)); }
}, true);
function dispatch(action: string) {
  if (action === 'undo' || action === 'redo') {
    if (document.activeElement instanceof HTMLTextAreaElement || document.activeElement instanceof HTMLInputElement) { document.execCommand(action); return; }
    if (!busy) { if (current.mode === 'visual') void visual?.format(action); else editor?.[action](); } return;
  }
  if (busy) return;
  if (action.startsWith('view:')) { void setMode(action.slice(5) as Mode); return; }
  if (action.startsWith('format:')) { const kind = action.slice(7); void run(async () => { if (current.mode === 'read') await setMode('visual'); if (current.mode === 'visual') { visual!.setEditable(true); await visual!.format(kind); } else await sourceFormat(kind); }); return; }
  switch (action) {
    case 'insert-image': void run(async () => { const { chooseImage } = await import('./image-import'); const file = await chooseImage(); if (file) await insertImage(file); }); break;
    case 'quick-open': void import('./quick-open').then(({quickOpen}) => quickOpen(tabs.map(tab => ({ name: tab.file.name, path: 'Open tab', open: () => run(() => activate(tab)) })), [...folderRoots.values()].map(({folder}) => folder), (folder, path) => run(async () => { await addDocument(await openWorkspaceDocument(folder, path)); }), error => toast(String(error), true))); break;
    case 'new': void run(() => addDocument({name:'untitled.md',text:''})); break;
    case 'open': void run(async () => { const file = await openFile(); if (file) await addDocument(file); }); break;
    case 'folder': void run(addFolder); break;
    case 'refresh-folders': void run(async () => { clearImageCache(); for (const {folder,element} of folderRoots.values()) await populateFolder(folder,element.lastElementChild as HTMLElement); render(); visual?.refresh(); }); break;
    case 'close-tab': void run(() => closeTab(current)); break;
    case 'save': void run(() => save()); break;
    case 'save-as': void run(() => save(true)); break;
    case 'save-all': void run(async () => { for (const tab of tabs.filter(dirty)) if (!(await save(false,tab))) break; }); break;
    case 'print': void run(async () => { stopHtml(); const rendered = render(true); await rendered.done; const { printDocument } = await import('./printing'); await printDocument(current.file.name, $('#preview').innerHTML); }); break;
    case 'export': void run(async () => { const rendered = render(true); await rendered.done; if (await exportHtml(current.file.name,exportPage(current.file.name,$('#preview').innerHTML))) toast('HTML export saved.'); }); break;
    case 'find': void run(async () => { if (current.mode !== 'split' && current.mode !== 'write') await setMode('write'); editor!.find(); }); break;
    case 'sidebar': app.classList.toggle('sidebar-hidden'); editor?.view.requestMeasure(); break;
    case 'theme': setTheme(document.documentElement.dataset.theme === 'dark' ? 'light':'dark'); render(); if (current.mode === 'visual') { capture(); visual?.refresh(); } break;
    case 'focus': focused = !focused; app.classList.toggle('focus-mode',focused); $('[data-action="focus"]').setAttribute('aria-pressed',String(focused)); editor?.view.requestMeasure(); break;
    case 'sync': sync = !sync; $('#sync-button').textContent = `Block sync ${sync ? 'on':'off'}`; $('#sync-button').setAttribute('aria-pressed',String(sync)); break;
    case 'creator': void openExternal('https://me.sgopala.com').catch(error => toast(String(error), true)); break;
    case 'privacy': $<HTMLDialogElement>('#help-dialog').close(); for (const key of ['recovery','spellcheck','html'] as const) $<HTMLInputElement>(`#pref-${key}`).checked = preferences[key]; $<HTMLDialogElement>('#privacy-dialog').showModal(); break;
    case 'privacy-apply': void run(async () => {
      const values = { recovery: $<HTMLInputElement>('#pref-recovery').checked, spellcheck: $<HTMLInputElement>('#pref-spellcheck').checked, html: $<HTMLInputElement>('#pref-html').checked };
      if (preferences.recovery && !values.recovery) {
        const choice = await ask('Turn off recovery copies?', 'Existing recovery copies will be cleared. Your open tabs and saved files stay intact. Save unsaved tabs before quitting.', [{label:'Cancel',value:'cancel'}, {label:'Turn off and clear copies',value:'clear',primary:true}]);
        if (choice !== 'clear') return;
        clearRecovery();
      }
      const stored = savePreferences(values); if (!values.html) stopHtml(); saveRecovery(); visual?.refresh(); render(); $<HTMLDialogElement>('#privacy-dialog').close(); toast(stored ? 'Privacy settings saved.' : 'Settings apply to this session; storage is unavailable.');
    }); break;
    case 'help': $<HTMLDialogElement>('#help-dialog').showModal(); break;
    case 'source': void openExternal('https://github.com/gopalasubramanium/plainmark'); break;
  }
}
function setTheme(theme: string) { document.documentElement.dataset.theme = theme; const b = $('[data-action="theme"]'); b.innerHTML = icon(theme === 'dark' ? 'sun':'moon'); b.setAttribute('aria-label',theme === 'dark' ? 'Switch to light mode':'Switch to dark mode'); try { localStorage.setItem('plainmark.theme',theme); } catch {} }
app.addEventListener('click',event => { const target = event.target as HTMLElement; const action = target.closest<HTMLButtonElement>('[data-action]')?.dataset.action; if (action) { dispatch(action); document.querySelectorAll<HTMLDetailsElement>('.insert-menu').forEach(menu => { menu.open = false; }); } const mode = target.closest<HTMLButtonElement>('[data-mode]')?.dataset.mode as Mode|undefined; if (mode && !busy) void setMode(mode); });
$('#privacy-dialog .dialog-close').addEventListener('click',()=>$<HTMLDialogElement>('#privacy-dialog').close());
$('#help-dialog .dialog-close').addEventListener('click',()=>$<HTMLDialogElement>('#help-dialog').close());
async function followLink(href: string) {
  if (/^(https?:|mailto:)/i.test(href)) { await openExternal(href); return; }
  const { path, fragment } = documentLink(href);
  if (path) await addDocument(await openLinkedDocument(current.file, path));
  if (!fragment) return;
  const headings = renderMarkdown(current.text).headings, slugs = headingSlugs(headings);
  const index = headings.findIndex((heading, i) => heading.id === fragment || slugs[i] === fragment);
  if (index < 0) { toast('That heading was not found in this document.', true); return; }
  if (current.mode === 'visual') $('#visual-editor').querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')[index]?.scrollIntoView({block:'start'});
  else { editor?.jump(headings[index].line); document.getElementById(headings[index].id)?.scrollIntoView({block:'start'}); }
}
$('#preview').addEventListener('click', event => { const a = (event.target as HTMLElement).closest('a'); if (!a) return; event.preventDefault(); void run(() => followLink(a.getAttribute('href') ?? '')); });
document.addEventListener('keydown',event => {
  if ([...document.querySelectorAll('dialog')].some(dialog=>dialog.open)) return;
  if (event.key === 'Escape' && focused) { dispatch('focus'); return; }
  if (event.ctrlKey && event.key === 'Tab') { event.preventDefault(); if (!busy) void activate(tabs[(tabs.indexOf(current)+(event.shiftKey ? tabs.length-1:1))%tabs.length]); return; }
  if (!(event.metaKey || event.ctrlKey)) return;
  const key = event.key.toLowerCase();
  if ((event.target as HTMLElement).closest('[role="tablist"]') && ['arrowleft','arrowright'].includes(key)) { event.preventDefault(); return; }
  const action = ({n:'new',o:event.shiftKey?'folder':'open',s:event.altKey?'save-all':event.shiftKey?'save-as':'save',w:'close-tab',p:event.shiftKey?'print':'quick-open',b:'format:bold',i:'format:italic',k:'format:link',f:event.shiftKey?'focus':'find'} as Record<string,string>)[key];
  if (action) { event.preventDefault(); event.stopPropagation(); dispatch(action); }
  else if (['1','2','3','4'].includes(key)) { event.preventDefault(); if (!busy) void setMode((['visual','write','split','read'] as Mode[])[Number(key)-1]); }
},{capture:true});
$('#tabs').addEventListener('keydown',event => { const key = (event as KeyboardEvent).key; if (['ArrowLeft','ArrowRight','Home','End'].includes(key)) { event.preventDefault(); const index = key === 'Home' ? 0 : key === 'End' ? tabs.length-1 : (tabs.indexOf(current)+(key==='ArrowLeft'?tabs.length-1:1))%tabs.length; void activate(tabs[index]).then(()=>document.querySelector<HTMLButtonElement>(`[data-tab="${current.key}"]`)?.focus()); } });
window.addEventListener('beforeunload',event => { saveRecovery(); if (tabs.some(dirty) && !closing) { event.preventDefault(); event.returnValue=''; } });
if (!native) {
  document.addEventListener('dragover',event => { if (event.dataTransfer?.types.includes('Files')) { event.preventDefault(); app.classList.add('dragging'); } });
  document.addEventListener('dragleave',event => { if (!event.relatedTarget) app.classList.remove('dragging'); });
  document.addEventListener('drop',event => { event.preventDefault(); app.classList.remove('dragging'); const files = [...(event.dataTransfer?.files ?? [])]; void run(async () => { for (const file of files.slice(0,100)) await addDocument(await readBrowserFile(file)); }); });
}
async function drainNative() { if (busy) { pendingNative = true; return; } await run(async () => { const result = await invoke<{documents:DocumentFile[];errors:string[]}>('take_open_documents'); for (const doc of result.documents) await addDocument(doc); if (result.errors.length) toast(result.errors.join('\n'),true); }); }
async function start() {
  let drafts: {name:string;text:string;mode?:Mode}[] = [];
  try { setTheme(localStorage.getItem('plainmark.theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light')); const saved = localStorage.getItem(draftKey), legacy = localStorage.getItem('plainmark.recovery.v1'); const parsed = preferences.recovery ? (saved ? JSON.parse(saved) : legacy ? [JSON.parse(legacy)]:[]) : []; if (Array.isArray(parsed)) drafts = parsed.filter(item => typeof item?.text === 'string' && typeof item?.name === 'string' && item.text.length <= MAX_BYTES).slice(0,100); } catch {}
  // Read all drafts before the first activation writes recovery storage.
  if (drafts.length) { for (const draft of drafts) await addDocument({name:draft.name,text:draft.text},true); toast(`Recovered ${drafts.length} unsaved ${drafts.length===1?'tab':'tabs'}. Save to keep permanent copies.`); }
  else await addDocument({name:'welcome.md',text:welcome});
  restoring = false; saveRecovery();
  if (native) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window'), { listen } = await import('@tauri-apps/api/event');
    await getCurrentWindow().onCloseRequested(event => { if (closing) return; event.preventDefault(); void run(closeApp); });
    await listen<string>('menu-action',event=>dispatch(event.payload));
    await listen('request-quit',()=>void run(closeApp)); await listen('open-files-pending',()=>void drainNative()); await drainNative();
  }
}
void start().catch(error=>toast(String(error),true));
