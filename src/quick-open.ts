import { listFolder, type FolderWorkspace } from './workspaces';

export interface QuickItem { name: string; path: string; open: () => Promise<void> }
// Search is requested explicitly. No background index, file contents, or persistent cache.
export function quickOpen(tabs: QuickItem[], folders: FolderWorkspace[], open: (folder: FolderWorkspace, path: string) => Promise<void>, failed: (error: unknown) => void) {
  const dialog = document.createElement('dialog'); dialog.className = 'quick-open'; dialog.setAttribute('aria-labelledby', 'quick-title');
  dialog.innerHTML = '<h2 id="quick-title">Open a document</h2><label for="quick-query">Find by name or path</label><input id="quick-query" type="search" autocomplete="off" spellcheck="false"><p class="quick-status" role="status"></p><div class="quick-results"></div><button class="quick-close">Close</button>';
  const input = dialog.querySelector('input')!, status = dialog.querySelector<HTMLElement>('.quick-status')!, results = dialog.querySelector<HTMLElement>('.quick-results')!;
  const items = [...tabs]; let scanning = folders.length > 0, limited = false, errors = 0, alive = true;
  const draw = () => {
    if (!alive) return;
    const words = input.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches = items.filter(item => words.every(word => `${item.name} ${item.path}`.toLocaleLowerCase().includes(word)));
    results.replaceChildren();
    for (const item of matches.slice(0, 100)) {
      const button = document.createElement('button'), name = document.createElement('strong'), path = document.createElement('span');
      name.textContent = item.name; path.textContent = item.path; button.append(name, path);
      button.onclick = () => { dialog.close(); void item.open().catch(failed); }; results.append(button);
    }
    status.textContent = `${matches.length} matches${matches.length > 100 ? ' · showing first 100; narrow your search' : ''}${scanning ? ' · reading folder names…' : ''}${limited ? ' · search limit reached; open a smaller folder' : ''}${errors ? ' · some folders could not be read' : ''}${!folders.length ? ' · open a folder to find more documents' : ''}`;
  };
  input.oninput = draw;
  dialog.onkeydown = event => {
    const buttons = [...results.querySelectorAll('button')];
    if ((event.key === 'Enter' && event.target === input) || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'Enter') buttons[0]?.click();
      else buttons[Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))]?.focus();
    }
  };
  dialog.querySelector<HTMLButtonElement>('.quick-close')!.onclick = () => dialog.close();
  dialog.onclose = () => { alive = false; dialog.remove(); };
  document.body.append(dialog); draw(); dialog.showModal(); input.focus();
  void (async () => {
    const queue = folders.map(folder => ({ folder, path: '', depth: 0 })); let scanned = 0;
    while (alive && queue.length && scanned < 250 && items.length < 5000) {
      const { folder, path, depth } = queue.shift()!; scanned++;
      try {
        for (const entry of await listFolder(folder, path)) {
          if (!alive) return;
          if (entry.directory) { if (depth < 12 && queue.length < 250) queue.push({ folder, path: entry.path, depth: depth + 1 }); else limited = true; }
          else { items.push({ name: entry.name, path: `${folder.name}/${entry.path}`, open: () => open(folder, entry.path) }); if (items.length >= 5000) { limited = true; break; } }
        }
      } catch { errors++; }
      draw(); await new Promise(resolve => setTimeout(resolve, 0));
    }
    limited ||= queue.length > 0; scanning = false; draw();
  })().catch(failed);
}
