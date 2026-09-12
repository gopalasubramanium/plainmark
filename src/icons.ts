const paths: Record<string, string> = {
  refresh: '<path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-2l2 2M4 17l2 2a7 7 0 0 0 12-2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  folder: '<path d="M3 7V5a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v2M3 7h15a2 2 0 0 1 2 2l-2 10H3L1 9a2 2 0 0 1 2-2Z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  save: '<path d="m19 21 2-2V7l-5-5H5L3 4v15l2 2ZM7 2v6h9V2M7 21v-9h10v9"/>',
  export: '<path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7"/>',
  search: '<circle cx="10.8" cy="10.8" r="7.3"/><path d="m16 16 5 5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  edit: '<path d="m16 3 5 5-12 12-6 1 1-6ZM13 6l5 5"/>',
  split: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>',
  read: '<path d="M12 6c-3-3-6-3-10-2v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-4-1-7-1-10 2Zm0 0v15"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20.5 14a8.5 8.5 0 0 1-10.5-10.5A9 9 0 1 0 20.5 14Z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6ZM8 12l3 3 5-6"/>',
  bold: '<path d="M6 4h7a4 4 0 0 1 0 8H6Zm0 8h8a4 4 0 0 1 0 8H6Z"/>',
  italic: '<path d="M10 4h9M5 20h9M15 4 9 20"/>',
  heading: '<path d="M5 4v16M17 4v16M5 12h12"/>',
  link: '<path d="m10 13 4-4m-5 7-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 10a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-2 2"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  quote: '<path d="M3 12h6v7H2v-7c0-5 2-7 6-7m8 7h6v7h-7v-7c0-5 2-7 6-7"/>',
  focus: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
};

export function icon(name: string): string {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.file}</svg>`;
}
