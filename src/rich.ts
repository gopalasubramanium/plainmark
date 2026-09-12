import DOMPurify from 'dompurify';
import { invoke } from '@tauri-apps/api/core';
import { native, type DocumentFile } from './files';
import { escapeHtml, type Rendered, type RichBlock } from './markdown';
import { safeImageData, svgDataUrl } from './safe-images';
import { preferences } from './preferences';

const cache = new Map<string, Promise<string>>();
let cacheBytes = 0, diagramId = 0;
let mermaidQueue: Promise<unknown> = Promise.resolve();
let frame: HTMLIFrameElement | null = null;
let frameGeneration = 0;
const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'";

export async function renderedRich(block: RichBlock): Promise<string> {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default';
  const key = `${block.kind}:${theme}:${block.display}:${block.source}`;
  if (cache.has(key)) return cache.get(key)!;
  if (block.source.length > (block.kind === 'math' ? 20_000 : block.kind === 'html' ? 512 * 1024 : 50_000)) throw new Error('This block is too large to render.');
  if (cache.size >= 64 || cacheBytes > 2 * 1024 * 1024) { cache.clear(); cacheBytes = 0; }
  let result: Promise<string>;
  if (block.kind === 'math') result = import('katex').then(({ default: katex }) => DOMPurify.sanitize(katex.renderToString(block.source, { output: 'mathml', displayMode: block.display, throwOnError: false, trust: false, maxExpand: 1000, maxSize: 20, macros: {} }), { USE_PROFILES: { html: true, mathMl: true } }));
  else if (block.kind === 'mermaid') {
    result = mermaidQueue.then(async () => {
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme, suppressErrorRendering: true, maxTextSize: 50_000, maxEdges: 1000, htmlLabels: false, flowchart: { htmlLabels: false }, secure: ['securityLevel', 'maxTextSize', 'maxEdges', 'startOnLoad', 'htmlLabels', 'flowchart', 'themeCSS'] });
      const container = document.createElement('div'); container.className = 'diagram-measure'; document.body.append(container);
      try { const { svg } = await mermaid.render(`diagram-${++diagramId}`, block.source, container); return `<img class="diagram-image" alt="Mermaid diagram" src="${escapeHtml(svgDataUrl(svg))}">`; }
      finally { container.remove(); }
    });
    mermaidQueue = result.catch(() => undefined);
  } else result = Promise.resolve(DOMPurify.sanitize(block.source, { USE_PROFILES: { html: true }, FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'img', 'video', 'audio', 'source', 'link', 'meta', 'object', 'embed'], FORBID_ATTR: ['style'] }));
  result = result.then(html => { cacheBytes += html.length; return html; });
  cache.set(key, result); return result;
}

export function stopHtml() {
  frameGeneration++; frame?.remove(); frame = null;
  document.querySelectorAll('[data-stop-html]').forEach(el => el.remove());
  if (native) void invoke('stop_html_preview').catch(() => undefined);
}
export async function runHtml(host: HTMLElement, source: string) {
  if (!preferences.html) throw new Error('HTML execution is disabled in Privacy settings.');
  stopHtml(); const generation = frameGeneration;
  if (source.length > 512 * 1024) throw new Error('Executable HTML is limited to 512 KB.');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><style>body{font:16px/1.6 system-ui;margin:16px}*{box-sizing:border-box}</style></head><body>${source}</body></html>`;
  const url = native ? await invoke<string>('create_html_preview', { html }) : await (async () => {
    const response = await fetch('/__plainmark_preview', { method: 'POST', headers: {'Content-Type':'text/html', 'X-Plainmark-Preview':'1'}, body:html });
    if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) throw new Error('Run HTML needs the desktop app or the local Plainmark development server.');
    return (await response.json() as {url:string}).url;
  })();
  if (generation !== frameGeneration || !host.isConnected) return;
  const iframe = document.createElement('iframe'); iframe.sandbox.add('allow-scripts'); iframe.referrerPolicy = 'no-referrer'; iframe.allow = "camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'; display-capture 'none'; payment 'none'; usb 'none'"; iframe.title = 'Isolated HTML preview'; iframe.className = 'html-runner';
  iframe.src = url;
  const stop = document.createElement('button'); stop.dataset.stopHtml = ''; stop.textContent = 'Stop HTML'; stop.onclick = stopHtml;
  host.append(stop, iframe); frame = iframe;
}

export type ReadImage = (path: string, file: DocumentFile) => Promise<string>;
export function enhance(root: HTMLElement, result: Rendered, file: DocumentFile, readImage: ReadImage, eager = false) {
  let alive = true;
  const pending: Promise<unknown>[] = [];
  const update = () => root.dispatchEvent(new CustomEvent('preview-layout', { bubbles: true }));
  const renderBlock = async (element: HTMLElement, block: RichBlock) => {
    try {
      const html = await renderedRich(block);
      if (!alive || !element.isConnected) return;
      if (block.kind === 'html') {
        const staticPreview = document.createElement('div'); staticPreview.className = 'static-html'; staticPreview.innerHTML = html;
        element.replaceChildren(staticPreview);
        const run = document.createElement('button'); run.textContent = 'Run HTML'; run.type = 'button'; run.title = 'Run scripts in an isolated preview. Only run code you trust.'; run.dataset.runHtml = String(block.index);
        run.disabled = !preferences.html;
        if (run.disabled) run.title = 'HTML execution is disabled in Privacy settings.';
        run.onclick = () => void runHtml(element, block.source).catch(error => { run.textContent = String(error); });
        const code = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = 'HTML source'; const pre = document.createElement('pre'); pre.textContent = block.source; code.append(summary, pre);
        element.append(run, code);
      } else element.innerHTML = html;
      update();
    } catch (error) { if (alive && element.isConnected) { element.classList.add('render-error'); element.title = String(error); } }
  };
  const observer = !eager && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting).forEach(entry => { observer!.unobserve(entry.target); const element = entry.target as HTMLElement; const block = result.rich[Number(element.dataset.rich)]; if (block) pending.push(renderBlock(element, block)); });
  }, { rootMargin: '300px' }) : null;
  result.rich.slice(0, 500).forEach(block => { const el = root.querySelector<HTMLElement>(`[data-rich="${block.index}"]`); if (!el) return; if (observer && block.kind === 'mermaid') observer.observe(el); else pending.push(renderBlock(el, block)); });
  const imageObserver = !eager && 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.filter(e => e.isIntersecting).forEach(entry => { imageObserver!.unobserve(entry.target); loaders.get(entry.target)?.(); }), {rootMargin:'300px'}) : null;
  const loaders = new Map<Element, () => void>();
  result.images.forEach(image => {
    const el = root.querySelector<HTMLElement>(`[data-image="${image.index}"]`); if (!el) return;
    const load = () => pending.push(readImage(image.path, file).then(src => { if (!alive || !el.isConnected) return; const img = document.createElement('img'); img.src = safeImageData(src); img.alt = image.alt; img.loading = eager ? 'eager' : 'lazy'; img.onload = update; el.replaceWith(img); }).catch(() => { if (alive) el.textContent = `Image unavailable · ${image.alt || image.path}`; }));
    if (imageObserver) { loaders.set(el, load); imageObserver.observe(el); } else load();
  });
  return { done: Promise.allSettled(pending), dispose() { alive = false; observer?.disconnect(); imageObserver?.disconnect(); loaders.clear(); } };
}
