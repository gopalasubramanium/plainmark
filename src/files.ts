import { invoke, isTauri } from '@tauri-apps/api/core';

export const native = isTauri();
export const MAX_BYTES = 5 * 1024 * 1024;
interface BrowserFileHandle {
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: Blob | string): Promise<void>; close(): Promise<void> }>;
}
interface PickerWindow extends Window {
  showOpenFilePicker?: (options: unknown) => Promise<BrowserFileHandle[]>;
  showSaveFilePicker?: (options: unknown) => Promise<BrowserFileHandle>;
}
export interface DocumentFile {
  id?: number;
  name: string;
  text: string;
  handle?: BrowserFileHandle;
  original?: Uint8Array;
  crlf?: boolean;
  bom?: boolean;
}
const options = { types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown', '.mdown', '.txt'] } }] };

export function normalize(text: string) { return text.replace(/\r\n?/g, '\n'); }
export async function readBrowserFile(file: File, handle?: BrowserFileHandle): Promise<DocumentFile> {
  if (file.size > MAX_BYTES) throw new Error('Please open a file smaller than 5 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('This file is not UTF-8 text. Please convert it to UTF-8 first.'); }
  if (text.includes('\0')) throw new Error('This looks like a binary file, not Markdown.');
  return { name: file.name, text: normalize(text), handle, original: bytes, crlf: text.includes('\r\n'), bom: bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf };
}

function fallbackOpen(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.md,.markdown,.mdown,.txt,text/plain,text/markdown';
    input.hidden = true; document.body.append(input);
    const done = (file: File | null) => { input.remove(); resolve(file); };
    input.addEventListener('change', () => done(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => done(null), { once: true });
    input.click();
  });
}

export async function openFile(): Promise<DocumentFile | null> {
  if (native) return invoke('open_document');
  const picker = window as PickerWindow;
  try {
    if (picker.showOpenFilePicker) {
      const [handle] = await picker.showOpenFilePicker({ ...options, multiple: false });
      return readBrowserFile(await handle.getFile(), handle);
    }
    const file = await fallbackOpen();
    return file ? readBrowserFile(file) : null;
  } catch (error) { if ((error as DOMException).name === 'AbortError') return null; throw error; }
}

export function download(name: string, content: Blob) {
  const url = URL.createObjectURL(content); const link = document.createElement('a');
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function saveFile(file: DocumentFile, text: string, saveAs: boolean): Promise<{ file: DocumentFile; downloaded: boolean } | null> {
  if (new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('Documents must be 5 MB or smaller.');
  if (native) {
    if (file.id !== undefined && !saveAs) {
      await invoke('save_document', { id: file.id, text });
      return { file: { ...file, text }, downloaded: false };
    }
    const saved = await invoke<DocumentFile | null>('save_document_as', { name: file.name, text });
    return saved ? { file: saved, downloaded: false } : null;
  }
  const picker = window as PickerWindow;
  try {
    let handle = !saveAs ? file.handle : undefined;
    if (!handle && picker.showSaveFilePicker) handle = await picker.showSaveFilePicker({ ...options, suggestedName: file.name });
    const value = (file.bom ? '\ufeff' : '') + (file.crlf ? normalize(text).replace(/\n/g, '\r\n') : normalize(text));
    const encoded = new TextEncoder().encode(value);
    if (encoded.length > MAX_BYTES) throw new Error('Documents must be 5 MB or smaller.');
    if (handle) {
      // Check even when Save as selects the same file.
      const same = handle === file.handle || (file.handle && 'isSameEntry' in handle && await (handle as BrowserFileHandle & { isSameEntry(other: BrowserFileHandle): Promise<boolean> }).isSameEntry(file.handle));
      if (same && file.original) {
        const current = new Uint8Array(await (await handle.getFile()).arrayBuffer());
        if (current.length !== file.original.length || current.some((b, i) => b !== file.original![i])) {
          throw new Error('The file changed outside Plainmark. Use Save as with a different filename to keep your edits.');
        }
      }
      const writer = await handle.createWritable(); await writer.write(new Blob([encoded])); await writer.close();
      return { file: { ...file, text, name: handle.name, handle, original: encoded }, downloaded: false };
    }
    download(file.name, new Blob([encoded], { type: 'text/markdown;charset=utf-8' }));
    return { file: { ...file, text }, downloaded: true };
  } catch (error) { if ((error as DOMException).name === 'AbortError') return null; throw error; }
}

export async function exportHtml(name: string, html: string): Promise<boolean> {
  const filename = name.replace(/\.[^.]+$/, '') + '.html';
  if (native) return invoke('export_html', { name: filename, html });
  download(filename, new Blob([html], { type: 'text/html;charset=utf-8' })); return true;
}

export async function openExternal(url: string) {
  if (!/^(https?:|mailto:)/i.test(url)) throw new Error('Only web and email links can be opened.');
  if (native) await invoke('open_external', { url });
  else window.open(url, '_blank', 'noopener,noreferrer');
}
