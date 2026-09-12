import { invoke } from '@tauri-apps/api/core';
import { native, readBrowserFile, type BrowserFileHandle, type DocumentFile } from './files';
import { relativeDocumentPath } from './document-links';
export interface DirectoryHandle { name: string; kind: 'directory'; values(): AsyncIterable<DirectoryHandle | (BrowserFileHandle & { kind: 'file' })>; getDirectoryHandle(name: string): Promise<DirectoryHandle>; getFileHandle(name: string): Promise<BrowserFileHandle> }
export interface FolderWorkspace { id: number; name: string; handle?: DirectoryHandle; files?: Map<string, File> }
export interface FolderEntry { name: string; path: string; directory: boolean }
const folders = new Map<number, FolderWorkspace>();
let nextId = -1;
const imageCache = new Map<string, Promise<string>>();
let imageBytes = 0;
const isDocument = (name: string) => /\.(md|markdown|mdown|txt|html?|htm)$/i.test(name);
const excluded = (name: string) => name.startsWith('.') || ['node_modules','target'].includes(name);
export async function openFolder(): Promise<FolderWorkspace | null> {
  if (native) { const folder = await invoke<FolderWorkspace | null>('open_workspace'); if (folder) folders.set(folder.id, folder); return folder; }
  const picker = (window as Window & { showDirectoryPicker?: (options: unknown) => Promise<DirectoryHandle> }).showDirectoryPicker;
  try {
    if (picker) { const handle = await picker({ mode: 'readwrite' }); const folder = { id: nextId--, name: handle.name, handle }; folders.set(folder.id, folder); return folder; }
    return await new Promise(resolve => {
      const input = document.createElement('input'); input.type = 'file'; input.setAttribute('webkitdirectory', ''); input.multiple = true; input.hidden = true; document.body.append(input);
      input.onchange = () => { const files = new Map<string, File>(); const list = [...(input.files ?? [])]; const name = list[0]?.webkitRelativePath.split('/')[0] ?? 'Folder'; for (const file of list) files.set(file.webkitRelativePath.split('/').slice(1).join('/'), file); input.remove(); if (!files.size) return resolve(null); const folder = { id: nextId--, name, files }; folders.set(folder.id, folder); resolve(folder); };
      input.oncancel = () => { input.remove(); resolve(null); }; input.click();
    });
  } catch (error) { if ((error as DOMException).name === 'AbortError') return null; throw error; }
}
async function directory(root: DirectoryHandle, path: string) { let folder = root; for (const part of path.split('/').filter(Boolean)) folder = await folder.getDirectoryHandle(part); return folder; }
export async function listFolder(folder: FolderWorkspace, path = ''): Promise<FolderEntry[]> {
  if (native) return invoke('list_folder', { id: folder.id, path });
  const items = new Map<string, FolderEntry>();
  if (folder.handle) {
    let scanned = 0;
    for await (const item of (await directory(folder.handle, path)).values()) {
      if (++scanned > 20_000) throw new Error('Open a smaller subfolder (20,000 entry scan limit).');
      if (excluded(item.name) || (item.kind !== 'directory' && !isDocument(item.name))) continue;
      items.set(item.name, { name: item.name, path: [path, item.name].filter(Boolean).join('/'), directory: item.kind === 'directory' });
      if (items.size > 2000) throw new Error('Open a smaller subfolder (2,000 document limit).');
    }
  } else {
    const prefix = path ? path + '/' : '';
    for (const filePath of folder.files?.keys() ?? []) {
      if (!filePath.startsWith(prefix)) continue;
      const parts = filePath.slice(prefix.length).split('/'), name = parts[0];
      if (excluded(name) || (parts.length === 1 && !isDocument(name))) continue;
      items.set(name, { name, path: prefix + name, directory: parts.length > 1 });
    }
    if (items.size > 2000) throw new Error('Open a smaller subfolder (2,000 document limit).');
  }
  return [...items.values()].sort((a,b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name));
}
async function browserWorkspaceFile(folder: FolderWorkspace, path: string) {
  if (folder.handle) { const parts = path.split('/'); const name = parts.pop()!; const handle = await (await directory(folder.handle, parts.join('/'))).getFileHandle(name); return { file: await handle.getFile(), handle }; }
  const file = folder.files?.get(path); if (!file) throw new Error('That file is no longer available.'); return { file, handle: undefined };
}
export async function openWorkspaceDocument(folder: FolderWorkspace, path: string): Promise<DocumentFile> {
  if (native) return { ...await invoke<DocumentFile>('open_workspace_file', { id: folder.id, path }), workspaceId: folder.id, relativePath: path };
  const { file, handle } = await browserWorkspaceFile(folder, path);
  return { ...await readBrowserFile(file, handle), workspaceId: folder.id, relativePath: path };
}
export async function openLinkedDocument(file: DocumentFile, path: string): Promise<DocumentFile> {
  if (native && file.id !== undefined) return invoke('open_linked_document', { id: file.id, path });
  const folder = folders.get(file.workspaceId!);
  if (!folder || !file.relativePath) throw new Error('Open the containing folder to follow local document links.');
  return openWorkspaceDocument(folder, relativeDocumentPath(file.relativePath, path));
}
export async function closeFolder(id: number) { if (native) await invoke('close_workspace', { id }); folders.delete(id); clearImageCache(); }
export function clearImageCache() { imageCache.clear(); imageBytes = 0; }
export async function readLocalImage(path: string, file: DocumentFile): Promise<string> {
  const key = `${file.id ?? file.workspaceId}:${file.relativePath ?? file.name}:${path}`;
  if (imageCache.has(key)) return imageCache.get(key)!;
  if (imageCache.size >= 24 || imageBytes > 32 * 1024 * 1024) clearImageCache();
  const promise = (async () => {
    if (native && file.id !== undefined) return invoke<string>('read_image', { id: file.id, path });
    const folder = folders.get(file.workspaceId!); if (!folder) throw new Error('Open the containing folder to load local images.');
    const parts = (file.relativePath ?? '').split('/').slice(0,-1);
    for (const part of path.replaceAll('\\', '/').split('/')) {
      if (part === '..') { if (!parts.length) throw new Error('Image leaves the workspace.'); parts.pop(); }
      else if (part && part !== '.') parts.push(part);
    }
    const { file: image } = await browserWorkspaceFile(folder, parts.join('/'));
    if (image.size > 10 * 1024 * 1024) throw new Error('Image exceeds 10 MB.');
    return await new Promise<string>((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(image); });
  })().then(value => { imageBytes += value.length; return value; });
  imageCache.set(key, promise); return promise;
}
