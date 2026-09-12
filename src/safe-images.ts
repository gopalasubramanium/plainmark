import DOMPurify from 'dompurify';

export function svgDataUrl(source: string): string {
  if (source.length > 10 * 1024 * 1024) throw new Error('SVG is too large.');
  const clean = DOMPurify.sanitize(source, { USE_PROFILES: { svg: true, svgFilters: true }, FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'image', 'a', 'animate', 'set', 'animateTransform'], FORBID_ATTR: ['onload', 'onerror'] });
  const doc = new DOMParser().parseFromString(clean, 'image/svg+xml');
  const svg = doc.documentElement;
  if (svg.localName !== 'svg' || doc.querySelector('parsererror')) throw new Error('Invalid SVG image.');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  for (const el of [svg, ...svg.querySelectorAll('*')]) {
    if (el.localName === 'style' && /@import|@font-face|url\(\s*['"]?(?!#)/i.test(el.textContent || '')) { el.remove(); continue; }
    for (const attr of [...el.attributes]) {
      if ((/^(href|xlink:href)$/i.test(attr.name) && !attr.value.startsWith('#')) || /^on/i.test(attr.name) || /url\(\s*['"]?(?!#)/i.test(attr.value)) el.removeAttribute(attr.name);
    }
  }
  // SVG is displayed only through an image element, never inserted as active document HTML.
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
}
export function safeImageData(src: string): string {
  if (/^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i.test(src)) return src;
  if (/^data:image\/svg\+xml;base64,/i.test(src)) return svgDataUrl(new TextDecoder().decode(Uint8Array.from(atob(src.slice(src.indexOf(',') + 1)), c => c.charCodeAt(0))));
  if (/^data:image\/svg\+xml(?:;charset=utf-8)?,/i.test(src)) return svgDataUrl(decodeURIComponent(src.slice(src.indexOf(',') + 1)));
  throw new Error('Unsupported image format.');
}
export function localImagePath(src: string): string | null {
  if (!src || /^(?:[a-z][a-z\d+.-]*:|\/\/|\/|\\)/i.test(src)) return null;
  try { return decodeURIComponent(src); } catch { return null; }
}
