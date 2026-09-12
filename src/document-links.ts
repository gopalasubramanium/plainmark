export function documentLink(href: string): { path: string; fragment: string } {
  const hash = href.indexOf('#');
  const rawPath = hash < 0 ? href : href.slice(0, hash);
  let path: string, fragment: string;
  try { path = decodeURIComponent(rawPath); fragment = hash < 0 ? '' : decodeURIComponent(href.slice(hash + 1)); }
  catch { throw new Error('This link contains an invalid escaped character.'); }
  if (/^(?:[a-z][a-z\d+.-]*:|[/\\])/i.test(path) || /[\0-\x1f]/.test(path) || rawPath.includes('?')) throw new Error('Use a relative link to a document inside this folder.');
  if (path && !/\.(md|markdown|mdown|txt|html?)$/i.test(path)) throw new Error('This link does not point to a Markdown, text, or HTML document.');
  return { path, fragment };
}

export function relativeDocumentPath(from: string, path: string): string {
  const parts = from.replaceAll('\\', '/').split('/').slice(0, -1);
  for (const part of path.replaceAll('\\', '/').split('/')) {
    if (part === '..') { if (!parts.length) throw new Error('This link leaves the selected folder.'); parts.pop(); }
    else if (part && part !== '.') parts.push(part);
  }
  return parts.join('/');
}

export function headingSlugs(headings: { text: string }[]): string[] {
  const used = new Set<string>();
  return headings.map(({ text }) => {
    const base = text.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-') || 'section';
    let slug = base, suffix = 0;
    while (used.has(slug)) slug = `${base}-${++suffix}`;
    used.add(slug); return slug;
  });
}
