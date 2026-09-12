import type { EditorView } from '@codemirror/view';
export interface Anchor { source: number; preview: number }
export function interpolate(anchors: Anchor[], value: number, from: keyof Anchor): number {
  const to = from === 'source' ? 'preview' : 'source';
  if (!anchors.length) return 0;
  if (value <= anchors[0][from]) return anchors[0][to];
  let low = 0, high = anchors.length - 1;
  while (low + 1 < high) { const mid = (low + high) >> 1; if (anchors[mid][from] <= value) low = mid; else high = mid; }
  const a = anchors[low], b = anchors[high], distance = b[from] - a[from];
  return distance <= 0 ? b[to] : a[to] + Math.max(0, Math.min(1, (value - a[from]) / distance)) * (b[to] - a[to]);
}
export function blockScrollSync(view: EditorView, preview: HTMLElement, article: HTMLElement, enabled: () => boolean) {
  let anchors: Anchor[] = [], stale = true, raf = 0, owner: 'source' | 'preview' = 'source';
  const expected = new WeakMap<HTMLElement, number>();
  function measure() {
    const points = new Map<number, number>();
    const top = preview.getBoundingClientRect().top - preview.scrollTop;
    const elements = [...article.querySelectorAll<HTMLElement>('[data-source-line]')];
    // Block ends anchor blank lines too. Starts win where adjacent blocks share a line.
    elements.forEach(el => { const line = Number(el.dataset.sourceEnd); if (line > 0) points.set(line, el.getBoundingClientRect().bottom - top); });
    elements.forEach(el => { const line = Number(el.dataset.sourceLine); if (line > 0) points.set(line, el.getBoundingClientRect().top - top); });
    const sourceBase = view.documentTop - view.scrollDOM.getBoundingClientRect().top + view.scrollDOM.scrollTop;
    anchors = [{ source: 0, preview: 0 }];
    [...points].sort((a,b) => a[0] - b[0]).forEach(([line,y]) => {
      const position = view.state.doc.line(Math.min(line, view.state.doc.lines)).from;
      const block = view.lineBlockAt(position);
      const previous = anchors[anchors.length - 1];
      const point = { source: block.top + sourceBase, preview: y };
      if (position >= view.viewport.from && position <= view.viewport.to) {
        const dom = view.domAtPos(position).node;
        const element = (dom instanceof Element ? dom : dom.parentElement)?.closest('.cm-line');
        if (element) point.source = element.getBoundingClientRect().top - view.scrollDOM.getBoundingClientRect().top + view.scrollDOM.scrollTop;
      }
      if (point.source > previous.source && point.preview >= previous.preview) anchors.push(point);
    });
    anchors.push({ source: Math.max(anchors.at(-1)!.source, view.scrollDOM.scrollHeight), preview: Math.max(anchors.at(-1)!.preview, preview.scrollHeight) });
    stale = false;
  }
  function scroll(from: HTMLElement, direction: 'source' | 'preview', layout = false) {
    if (!enabled()) return;
    const ignored = expected.get(from); expected.delete(from);
    if (!layout && ignored !== undefined) { if (direction === 'source' && owner === 'preview') { stale = true; scroll(preview, 'preview', true); } return; }
    owner = direction;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (stale) measure();
      const target = direction === 'source' ? preview : view.scrollDOM;
      const max = target.scrollHeight - target.clientHeight;
      const atBottom = from.scrollTop > 0 && from.scrollHeight - from.clientHeight - from.scrollTop < 2;
      const value = atBottom ? max : Math.max(0, Math.min(max, interpolate(anchors, from.scrollTop, direction)));
      if (Math.abs(target.scrollTop - value) > 1) { expected.set(target, value); target.scrollTop = value; }
    });
  }
  const sourceScroll = () => scroll(view.scrollDOM, 'source'), previewScroll = () => scroll(preview, 'preview'), invalidate = () => { stale = true; };
  const sourceLayout = () => { stale = true; if (owner === 'preview') scroll(preview, 'preview', true); };
  const sourceIntent = () => { owner = 'source'; expected.delete(view.scrollDOM); cancelAnimationFrame(raf); };
  const previewIntent = () => { owner = 'preview'; expected.delete(preview); cancelAnimationFrame(raf); };
  for (const event of ['wheel','pointerdown','keydown']) { view.scrollDOM.addEventListener(event, sourceIntent, {capture:true,passive:true}); preview.addEventListener(event, previewIntent, {capture:true,passive:true}); }
  view.dom.addEventListener('source-layout', sourceLayout);
  view.scrollDOM.addEventListener('scroll', sourceScroll, { passive: true }); preview.addEventListener('scroll', previewScroll, { passive: true });
  const observer = new ResizeObserver(invalidate); observer.observe(article); observer.observe(preview); observer.observe(view.scrollDOM);
  article.addEventListener('preview-layout', invalidate);
  return { invalidate, destroy() { cancelAnimationFrame(raf); observer.disconnect(); for (const event of ['wheel','pointerdown','keydown']) { view.scrollDOM.removeEventListener(event, sourceIntent, true); preview.removeEventListener(event, previewIntent, true); } view.dom.removeEventListener('source-layout', sourceLayout); view.scrollDOM.removeEventListener('scroll', sourceScroll); preview.removeEventListener('scroll', previewScroll); article.removeEventListener('preview-layout', invalidate); } };
}
