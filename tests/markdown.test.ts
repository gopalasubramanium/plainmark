import { describe, expect, it } from 'vitest';
import { exportPage, renderMarkdown, statistics } from '../src/markdown';

describe('Markdown preview', () => {
  it('renders headings, tables, strikethrough, tasks, code, and an outline', () => {
    const result = renderMarkdown('# Title\n\n## Next **step**\n\n- [x] Done\n- [ ] Next\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n~~old~~\n\n```js\nconst a = 1;\n```');
    expect(result.html).toContain('<table>');
    expect(result.html).toContain('<s>old</s>');
    expect(result.html).toContain('aria-checked="true"');
    expect(result.html).toContain('aria-checked="false"');
    expect(result.html).toContain('language-js');
    expect(result.headings).toEqual([{ id: 'section-0', text: 'Title', level: 1, line: 1 }, { id: 'section-1', text: 'Next step', level: 2, line: 3 }]);
  });
  it('escapes raw HTML and refuses executable links', () => {
    const { html } = renderMarkdown('<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert%281%29)\n\n[also bad](data:text/html,bad)');
    const document = new DOMParser().parseFromString(html, 'text/html');
    expect(document.querySelector('script, img, [onerror], a[href^="javascript:"], a[href^="data:"]')).toBeNull();
    expect(html).toContain('&lt;script&gt;');
  });
  it('never turns remote images into network requests', () => {
    const { html, images } = renderMarkdown('![tracking](https://example.com/pixel.gif)\n![protocol relative](//example.com/pixel)\n![local](images/one%20two.png)');
    expect(html).not.toContain('<img');
    expect(html).toContain('Remote image blocked');
    expect(images).toEqual([{ index: 0, path: 'images/one two.png', alt: 'local' }]);
  });
  it('keeps duplicate and hostile headings safe and distinct', () => {
    const result = renderMarkdown('# a\n# a\n# <img onerror=alert(1)>');
    expect(new Set(result.headings.map((h) => h.id)).size).toBe(3);
    expect(result.html).not.toContain('<img');
  });
  it('escapes an export title and strips active HTML again', () => {
    const html = exportPage('</title><script>bad()</script>', '<h1>Hello</h1><img src="x" onerror="bad()"><script>bad()</script>');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('script, [onerror]')).toBeNull();
    expect(doc.title).toBe('</title><script>bad()</script>');
    expect(doc.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content')).toContain("default-src 'none'");
  });
  it('counts empty and Unicode documents without breaking', () => {
    expect(statistics('')).toEqual({ words: 0, characters: 0, minutes: 1 });
    expect(statistics('Hello 世界 👋').words).toBe(3);
    expect(statistics('👋').characters).toBe(1);
  });
});
