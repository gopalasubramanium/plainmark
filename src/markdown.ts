import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

export interface Heading { id: string; text: string; level: number; line: number }
export interface LocalImage { index: number; path: string; alt: string }
export interface Rendered { html: string; headings: Heading[]; images: LocalImage[] }

const md = new MarkdownIt({ html: false, linkify: true, typographer: false });

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function renderMarkdown(source: string): Rendered {
  const headings: Heading[] = [];
  const images: LocalImage[] = [];
  const tokens = md.parse(source, {});
  let listDepth = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'list_item_open') listDepth++;
    if (token.type === 'list_item_close') listDepth--;
    if (token.type === 'heading_open') {
      const inline = tokens[i + 1];
      const text = inline.children?.filter((t) => t.type === 'text' || t.type === 'code_inline').map((t) => t.content).join('') || inline.content;
      const id = `section-${headings.length}`;
      token.attrSet('id', id);
      headings.push({ id, text, level: Number(token.tag.slice(1)), line: (token.map?.[0] ?? 0) + 1 });
    }
    const first = token.children?.[0];
    if (listDepth && token.type === 'inline' && first?.type === 'text') {
      const task = first.content.match(/^\[([ xX])\] /);
      if (task) {
        first.content = first.content.slice(task[0].length);
        const TokenClass = token.constructor as new (type: string, tag: string, nesting: number) => typeof token;
        const checkbox = new TokenClass('html_inline', '', 0);
        checkbox.content = `<span class="task-box${task[1] !== ' ' ? ' checked' : ''}" role="checkbox" aria-checked="${task[1] !== ' '}" aria-label="${task[1] !== ' ' ? 'Completed' : 'Incomplete'} task">${task[1] !== ' ' ? '✓' : ''}</span>`;
        token.children!.unshift(checkbox);
        tokens[i - 2]?.attrSet('class', 'task-item');
      }
    }
  }
  const imageRule = md.renderer.rules.image;
  md.renderer.rules.image = (imageTokens, index) => {
    const token = imageTokens[index];
    const src = String(token.attrGet('src') ?? '');
    const alt = token.content;
    if (/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i.test(src)) {
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy">`;
    }
    const local = !/^(?:[a-z][a-z\d+.-]*:|\/\/|\/|\\)/i.test(src);
    const imageIndex = images.length;
    if (local) {
      try { images.push({ index: imageIndex, path: decodeURIComponent(src), alt }); } catch { /* Show placeholder for malformed URI. */ }
    }
    return `<span class="image-placeholder"${local ? ` data-image="${imageIndex}"` : ''}>${local ? 'Image' : 'Remote image blocked'} · ${escapeHtml(alt || src)}</span>`;
  };
  let html: string;
  try { html = md.renderer.render(tokens, md.options, {}); }
  finally { md.renderer.rules.image = imageRule; }
  return {
    html: DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, ADD_ATTR: ['data-image'], FORBID_TAGS: ['form', 'input', 'button', 'iframe', 'style'], FORBID_ATTR: ['style'] }),
    headings, images,
  };
}

export function statistics(text: string) {
  const words = text.trim().match(/\S+/gu)?.length ?? 0;
  return { words, characters: [...text].length, minutes: Math.max(1, Math.ceil(words / 220)) };
}

export function exportPage(title: string, html: string): string {
  const safe = DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'script', 'iframe', 'form'], FORBID_ATTR: ['style'] });
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escapeHtml(title)}</title><style>body{max-width:760px;margin:64px auto;padding:0 24px;color:#292e29;background:#fff;font:18px/1.8 Georgia,serif}h1,h2,h3{line-height:1.25;letter-spacing:-.025em}h1{font-size:2.6em}h2{margin-top:1.8em}a{color:#a54b30}pre,code{font:0.85em/1.7 ui-monospace,monospace;background:#f4f3ef;border-radius:5px}code{padding:3px 5px}pre{padding:20px;overflow:auto}pre code{padding:0}blockquote{border-left:3px solid #c56342;padding:4px 20px;margin-left:0;color:#677064}table{border-collapse:collapse;width:100%;font-size:.9em}td,th{border-bottom:1px solid #ddd;text-align:left;padding:10px}img{max-width:100%}hr{border:0;border-top:1px solid #ddd;margin:32px 0}.task-item{list-style:none}.task-box{display:inline-block;border:1px solid #999;border-radius:3px;width:1em;height:1em;line-height:1em;text-align:center;margin-right:8px}.checked{background:#48674e;color:white}.image-placeholder{font:14px system-ui;color:#777}@media print{body{margin:0;max-width:none}pre,blockquote,tr{break-inside:avoid}}</style></head><body>${safe}</body></html>`;
}
