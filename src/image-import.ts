import { invoke } from '@tauri-apps/api/core';
import { native } from './files';
export async function chooseImage(): Promise<File | null> {
  if (native) { const result = await invoke<{name: string; encoded: string} | null>('pick_image'); return result ? new File([Uint8Array.from(atob(result.encoded), char => char.charCodeAt(0))], result.name) : null; }
  return new Promise(resolve => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/png,image/jpeg,image/gif,image/webp'; input.hidden = true;
    input.onchange = () => { const file = input.files?.[0] ?? null; input.remove(); resolve(file); };
    input.oncancel = () => { input.remove(); resolve(null); }; document.body.append(input); input.click();
  });
}
export async function imageData(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error('Image exceeds 10 MB. Resize it before inserting.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const prefix = [...bytes.slice(0, 12)].map(b => String.fromCharCode(b)).join('');
  const mime = prefix.startsWith('\x89PNG\r\n\x1a\n') ? 'png' : prefix.startsWith('\xff\xd8\xff') ? 'jpeg' : /^GIF8[79]a/.test(prefix) ? 'gif' : prefix.startsWith('RIFF') && prefix.slice(8) === 'WEBP' ? 'webp' : null;
  if (!mime) throw new Error('Choose a PNG, JPEG, GIF, or WebP image. SVG can be added by its local path.');
  const url = URL.createObjectURL(new Blob([bytes], { type: `image/${mime}` })), image = new Image();
  try { image.src = url; await image.decode(); if (image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('Image exceeds 40 megapixels. Resize it before inserting.'); }
  catch (error) { throw error instanceof Error && error.message.includes('megapixels') ? error : new Error('This image could not be decoded.'); }
  finally { URL.revokeObjectURL(url); }
  return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(`data:image/${mime};base64,${String(reader.result).split(',')[1]}`); reader.onerror = () => reject(new Error('Could not read the image.')); reader.readAsDataURL(file); });
}
