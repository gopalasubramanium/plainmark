import { describe, expect, it } from 'vitest';
import { parseVisual, serializeVisual } from '../src/visual-model';
import { renderMarkdown } from '../src/markdown';
import { svgDataUrl } from '../src/safe-images';
import { interpolate } from '../src/scroll-sync';

describe('Visual Markdown round trips', () => {
  const examples = [
    '# Heading **bold** $x^2$\n\nParagraph with *emphasis*, ~~strike~~, `code`, [link](https://example.org) and ![pic](../img.svg).\n',
    '- [x] Complete\n- [ ] Pending\n  - Nested item\n\n1. First\n2. Second\n',
    '| Left | Right |\n| :--- | ---: |\n| **bold** | one<br>two |\n| a\\|b | $x$ |\n',
    '> Quoted **paragraph**\n>\n> Another line\n\n---\n\n```js\nconst fence = "```";\n```\n',
    '---\ntitle: A document\ntags: [one, two]\n---\n\nText\n\n$$\n\\frac{a}{b}\n$$\n\n```mermaid\nflowchart LR\n A-->B\n```\n',
    '<div><button onclick="this.textContent=1">Run</button></div>\n\nText with <kbd>literal HTML</kbd>.\n',
    '```html\n<p>Interactive <button>hello</button></p>\n```\n',
  ];
  for (const [i, source] of examples.entries()) it(`retains document semantics for fixture ${i + 1}`, () => {
    const before = parseVisual(source), serialized = serializeVisual(before), after = parseVisual(serialized);
    expect(after.toJSON()).toEqual(before.toJSON());
  });
  it('does not eat text following a math delimiter or treat currency as math', () => {
    const source = '$$x$$ keep this\n\nCosts $5 and $10.\n\nUnclosed $x\n';
    expect(parseVisual(serializeVisual(parseVisual(source))).textContent).toContain('keep this');
    expect(renderMarkdown('Costs $5 and $10.').rich).toHaveLength(0);
  });
  it('keeps scripts inert and sanitizes SVG before producing an image', () => {
    const url = svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" onload="bad()"><script>bad()</script><foreignObject>bad</foreignObject><image href="https://example.com/pixel"/><rect width="20" height="20"/></svg>');
    const svg = decodeURIComponent(url.split(',')[1]);
    expect(svg).toContain('<rect');
    expect(svg).not.toMatch(/script|foreignObject|onload|https:\/\/example/);
  });
  it('maps matching block positions in both directions with unequal heights', () => {
    const anchors = [{source:0,preview:0},{source:100,preview:500},{source:200,preview:600}];
    expect(interpolate(anchors,50,'source')).toBe(250);
    expect(interpolate(anchors,550,'preview')).toBe(150);
    expect(interpolate(anchors,1000,'source')).toBe(600);
    expect(interpolate(anchors,-1,'preview')).toBe(0);
  });
});
