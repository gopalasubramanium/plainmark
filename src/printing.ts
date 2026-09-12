import { exportPage } from './markdown';
import { native } from './files';
import { invoke } from '@tauri-apps/api/core';

export async function printDocument(name: string, html: string) {
  document.getElementById('print-document')?.remove();
  const page = new DOMParser().parseFromString(exportPage(name, html), 'text/html');
  const content = document.createElement('article'); content.id = 'print-document';
  content.className = 'prose'; content.append(...page.body.childNodes);
  document.body.append(content);
  await Promise.all([...content.querySelectorAll('img')].map(img => img.decode().catch(() => undefined)));
  window.addEventListener('afterprint', () => content.remove(), { once: true });
  // The OS supplies the print dialog and its Save as PDF destination.
  if (native) { await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); await invoke('print_document'); }
  else window.print();
}
