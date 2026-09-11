import { File as NodeFile } from 'node:buffer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_BYTES, readBrowserFile, saveFile } from '../src/files';

function fileOf(bytes: string | Uint8Array, name = 'note.md') { return new NodeFile([bytes], name) as unknown as File; }
afterEach(() => { Reflect.deleteProperty(window, 'showSaveFilePicker'); });

describe('Browser files', () => {
  it('reads UTF-8 while remembering BOM and CRLF', async () => {
    const file = await readBrowserFile(fileOf('\ufeff# Hello\r\nworld\r\n'));
    expect(file.text).toBe('# Hello\nworld\n');
    expect(file.crlf).toBe(true); expect(file.bom).toBe(true);
  });
  it('rejects invalid UTF-8, binary files and oversized files', async () => {
    await expect(readBrowserFile(fileOf(new Uint8Array([0xff])))).rejects.toThrow('UTF-8');
    await expect(readBrowserFile(fileOf('one\0two'))).rejects.toThrow('binary');
    await expect(readBrowserFile(fileOf('a'.repeat(MAX_BYTES + 1)))).rejects.toThrow('5 MB');
  });
  it('detects a changed file before creating a writable stream', async () => {
    let current = fileOf('original');
    const createWritable = vi.fn();
    const handle = { name: 'note.md', getFile: async () => current, createWritable };
    const doc = await readBrowserFile(current, handle); current = fileOf('external edit');
    await expect(saveFile(doc, 'my edits', false)).rejects.toThrow('changed outside');
    expect(createWritable).not.toHaveBeenCalled();
  });
  it('retains the document when the save dialog is cancelled', async () => {
    Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: () => Promise.reject(new DOMException('cancelled', 'AbortError')) });
    expect(await saveFile({ name: 'new.md', text: '' }, 'words', true)).toBeNull();
  });
  it('writes and closes a successful save before reporting success', async () => {
    const write = vi.fn().mockResolvedValue(undefined); const close = vi.fn().mockResolvedValue(undefined);
    const handle = { name: 'note.md', getFile: async () => fileOf('original'), createWritable: async () => ({ write, close }) };
    const doc = await readBrowserFile(await handle.getFile(), handle);
    const saved = await saveFile(doc, 'changed', false);
    expect(write).toHaveBeenCalledOnce(); expect(close).toHaveBeenCalledOnce();
    expect(saved?.file.text).toBe('changed'); expect(saved?.downloaded).toBe(false);
  });
});
