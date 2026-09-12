import { describe, it, expect } from 'vitest';
import { DOMParser as PMParser } from 'prosemirror-model';
import { documentLink, headingSlugs, relativeDocumentPath } from '../src/document-links';
import { sourceOnlyReason } from '../src/compatibility';
import { renderMarkdown, exportPage } from '../src/markdown';
import { visualSchema, serializeVisual } from '../src/visual-model';
import { clearRecovery } from '../src/preferences';
import { svgDataUrl } from '../src/safe-images';

describe('portable documents and privacy boundaries', () => {
  it('resolves escaped relative notes and Unicode headings without allowing URL or folder escapes', () => {
    expect(documentLink('../Next%20note.md#%E4%B8%AD%E6%96%87')).toEqual({path:'../Next note.md',fragment:'中文'});
    expect(relativeDocumentPath('notes/start.md','../Next note.md')).toBe('Next note.md');
    for (const href of ['file:///secret.md','//server/file.md','C:%5Csecret.md','%2Fetc/secret.md','note.md?token=secret','a%00.md','%zz.md','../photo.png']) expect(() => documentLink(href)).toThrow();
    expect(() => relativeDocumentPath('start.md','../outside.md')).toThrow();
    expect(headingSlugs([{text:'Hello!'}, {text:'Hello!'}, {text:'Hello-1'}, {text:'中文 标题'}])).toEqual(['hello','hello-1','hello-1-1','中文-标题']);
  });
  it('makes ordinary heading links work in self-contained exports', () => {
    const result = renderMarkdown('[Go](#hello-world)\n\n## Hello world\n');
    expect(exportPage('note.md',result.html)).toContain('href="#section-0"');
    expect(result.html).toContain('id="section-0"');
  });
  it('preserves reference, footnote and wiki syntax through Source without misclassifying code examples', () => {
    for (const text of ['A[^n]\n\n[^n]: Footnote','[Read][r]\n\n[r]: next.md','[[Wiki page]]']) expect(sourceOnlyReason(text)).not.toBeNull();
    expect(sourceOnlyReason('```md\n[x]: example\n[[example]]\n```\n\n# Normal')).toBeNull();
  });
  it('preserves task states pasted as HTML and copied from its own visual editor', () => {
    const host = document.createElement('div'); host.innerHTML = '<ul><li><input type="checkbox" checked>Done</li><li><p><input type="checkbox">Pending</p></li><li data-task-checked="true">Copied</li><li>Ordinary</li></ul>';
    const text = serializeVisual(PMParser.fromSchema(visualSchema).parse(host));
    expect(text).toContain('[x] Done'); expect(text).toContain('[ ] Pending'); expect(text).toContain('[x] Copied'); expect(text).toMatch(/[-*] Ordinary/);
  });
  it('clears only recovery data and removes remote resources from SVG', () => {
    localStorage.setItem('plainmark.recovery.v2','private draft'); localStorage.setItem('plainmark.recovery.v1','old draft'); localStorage.setItem('plainmark.theme','dark');
    clearRecovery(); expect(localStorage.getItem('plainmark.recovery.v2')).toBeNull(); expect(localStorage.getItem('plainmark.recovery.v1')).toBeNull(); expect(localStorage.getItem('plainmark.theme')).toBe('dark');
    const svg = decodeURIComponent(svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg"><style>@import "https://example.com/font";</style><rect style="fill:url(https://example.com/pixel)"/><use href="https://example.com/asset"/></svg>').split(',')[1]);
    expect(svg).not.toContain('https://example.com');
  });
});
