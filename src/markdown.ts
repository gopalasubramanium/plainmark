import DOMPurify from 'dompurify';
import { createMarkdown } from './syntax';
import { localImagePath, safeImageData } from './safe-images';
export interface Heading { id: string; text: string; level: number; line: number }
export interface LocalImage { index: number; path: string; alt: string }
export interface RichBlock { index: number; kind: 'mermaid' | 'math' | 'html'; source: string; display?: boolean }
export interface Rendered { html: string; headings: Heading[]; images: LocalImage[]; rich: RichBlock[] }
export function escapeHtml(text: string): string { return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!); }
const md = createMarkdown();
export function renderMarkdown(source: string, htmlDocument = false): Rendered {
  const headings: Heading[] = [], images: LocalImage[] = [], rich: RichBlock[] = [];
  const embed = (kind: RichBlock['kind'], source: string, display = true) => { const index = rich.length; rich.push({ index, kind, source, display }); return `<${display ? 'div' : 'span'} class="rich-block rich-${kind}" data-rich="${index}">${kind === 'html' ? '<button type="button" data-run-html="' + index + '">Run HTML</button>' : ''}<${display ? 'pre' : 'code'}>${escapeHtml(source)}</${display ? 'pre' : 'code'}></${display ? 'div' : 'span'}>`; };
  const tokens = htmlDocument ? [] : md.parse(source, {});
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.map && token.nesting !== -1) { token.attrSet('data-source-line', String(token.map[0] + 1)); token.attrSet('data-source-end', String(token.map[1] + 1)); }
    if (token.type === 'heading_open') {
      const inline = tokens[i + 1]; const text = inline.children?.filter(t => t.type === 'text' || t.type === 'code_inline').map(t => t.content).join('') || inline.content;
      const id = `section-${headings.length}`; token.attrSet('id', id); headings.push({ id, text, level: Number(token.tag.slice(1)), line: (token.map?.[0] ?? 0) + 1 });
    }
    if (token.type === 'inline' && tokens[i-1]?.type === 'paragraph_open' && tokens[i-2]?.type === 'list_item_open') {
      const first = token.children?.[0], task = first?.type === 'text' ? first.content.match(/^\[([ xX])\] /) : null;
      if (task) { first!.content = first!.content.slice(task[0].length); token.content = token.content.slice(task[0].length); tokens[i-2].attrSet('class', 'task-item'); tokens[i-2].attrSet('data-task', task[1] !== ' ' ? 'true' : 'false'); }
    }
  }
  const mapped = (token: typeof tokens[number], html: string) => `<div data-source-line="${(token.map?.[0] ?? 0) + 1}" data-source-end="${(token.map?.[1] ?? 0) + 1}">${html}</div>`;
  md.renderer.rules.image = (ts, i) => {
    const t = ts[i], src = String(t.attrGet('src') ?? ''), path = localImagePath(src);
    if (src.startsWith('data:')) { try { return `<img src="${escapeHtml(safeImageData(src))}" alt="${escapeHtml(t.content)}">`; } catch { return '<span class="image-placeholder">Image unavailable</span>'; } }
    const index = images.length; if (path) images.push({ index, path, alt: t.content });
    return `<span class="image-placeholder"${path ? ` data-image="${index}"` : ''}>${path ? 'Image' : 'Remote image blocked'} · ${escapeHtml(t.content || src)}</span>`;
  };
  md.renderer.rules.fence = (ts, i) => {
    const t = ts[i], language = t.info.trim().split(/\s/)[0].toLowerCase();
    const kind = language === 'mermaid' ? 'mermaid' : /^(math|latex|tex)$/.test(language) ? 'math' : /^(html|html-run)$/.test(language) ? 'html' : null;
    return mapped(t, kind ? embed(kind, t.content) : `<pre><code class="language-${escapeHtml(language)}">${escapeHtml(t.content)}</code></pre>`);
  };
  md.renderer.rules.code_block = (ts, i) => mapped(ts[i], `<pre><code>${escapeHtml(ts[i].content)}</code></pre>`);
  md.renderer.rules.math_inline = (ts,i) => embed('math', ts[i].content, false);
  md.renderer.rules.math_block = (ts,i) => mapped(ts[i], embed('math', ts[i].content));
  md.renderer.rules.frontmatter = (ts,i) => mapped(ts[i], `<details class="frontmatter"><summary>Document metadata</summary><pre>${escapeHtml(ts[i].content)}</pre></details>`);
  md.renderer.rules.html_block = (ts,i) => mapped(ts[i], embed('html', ts[i].content));
  md.renderer.rules.html_inline = (ts,i) => /^<br\s*\/?\s*>$/i.test(ts[i].content) ? '<br>' : escapeHtml(ts[i].content);
  let html = htmlDocument ? `<div data-source-line="1" data-source-end="${source.split('\n').length + 1}">${embed('html', source)}</div>` : md.renderer.render(tokens, md.options, {});
  html = DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['form', 'input', 'iframe', 'style'], FORBID_ATTR: ['style'] });
  return { html, headings, images, rich };
}
export function statistics(text: string) { const words = text.trim().match(/\S+/gu)?.length ?? 0; return { words, characters: [...text].length, minutes: Math.max(1, Math.ceil(words / 220)) }; }
export function exportPage(title: string, html: string): string {
  const safe = DOMPurify.sanitize(html, { USE_PROFILES: { html: true, mathMl: true }, FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'button'], FORBID_ATTR: ['style', 'data-run-html'] });
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escapeHtml(title)}</title><style>body{max-width:760px;margin:64px auto;padding:0 24px;color:#292e29;background:#fff;font:18px/1.8 Georgia,serif}h1,h2,h3{line-height:1.25}h1{font-size:2.6em}h2{margin-top:1.8em}a{color:#a54b30}pre,code{font:.85em/1.7 ui-monospace,monospace;background:#f4f3ef;border-radius:5px}code{padding:3px 5px}pre{padding:20px;overflow:auto}pre code{padding:0}blockquote{border-left:3px solid #c56342;padding:4px 20px;margin-left:0;color:#677064}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;text-align:left;padding:10px}img{max-width:100%;height:auto}hr{border:0;border-top:1px solid #ddd;margin:32px 0}.task-item{list-style:none}[data-task]::before{content:'☐ ';}[data-task="true"]::before{content:'☑ ';}.image-placeholder{font:14px system-ui;color:#777}math[display="block"]{overflow:auto;margin:1em 0}@media print{body{margin:0;max-width:none}pre,blockquote,tr{break-inside:avoid}}</style></head><body>${safe}</body></html>`;
}
