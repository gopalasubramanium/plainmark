# Working in Plainmark

Open a folder to browse Markdown, text, and HTML documents. Folders expand on demand; opening a file adds a tab. Reopening a file already in a tab activates its existing edits. Closing a folder leaves its documents open. Save All saves dirty tabs in order; cancellation leaves the remaining tabs untouched.

## Visual editing

Visual is the default for Markdown documents. Type into headings, paragraphs, lists, and table cells. Use the toolbar or normal bold/italic shortcuts. Checkboxes change the underlying task. Insert offers tables, rows and columns, code, images, and rich blocks. Double-click an image to change its path. Select a rich block and press Mod+Enter to add a paragraph after it; use its Edit button to change the diagram, math, HTML, or metadata.

Source exposes the exact Markdown. Split adds the rendered preview; scrolling either pane follows Markdown block starts and ends, interpolating inside each block. Image and diagram layout changes update the mapping. Read provides a quiet reading view. Find/replace opens Source view.

Visual edits normalize Markdown formatting. Switching views without editing does not. Plainmark does not implement every third-party Markdown dialect. Use Source for unsupported extensions and exact whitespace work. A plain `.html` document opens in Split view.

## Diagrams and math

Use a fenced `mermaid` block for a diagram. The engine is bundled and loads when a diagram approaches the viewport. Mathematical expressions use `$x^2$` inline, `$$` blocks, or `\(x^2\)` / `\[x^2\]`. Fences labeled `math`, `tex`, or `latex` also work. KaTeX emits MathML and the OS web renderer displays it. Unavailable or invalid rich rendering keeps the source visible.

## HTML

Raw HTML and `html`/`html-run` fences receive a static sanitized preview. Choose Run HTML to execute inline JavaScript in a separate frame. Use Stop HTML to end it. Only one frame runs at a time; edits and tab/view changes stop it. Web requests, external scripts, forms, popups, and app/file access are unavailable. Inline CSS, JavaScript, and embedded data images are supported. This is for local interactive snippets, not full web applications. Run code you trust: expensive or infinite scripts can still make a webview unresponsive.

HTML exports are static reading copies. Successfully rendered diagrams, math, and local images are embedded; executable frames and scripts are removed.

## Images and files

Relative image paths resolve inside the selected workspace. A document opened without a workspace can load images within its own folder. SVG is sanitized and displayed as an image, never active inline content. Remote Markdown images are blocked.

An installed build offers Plainmark in the OS Open with menu for `.md`, `.markdown`, and `.mdown`. Selecting it opens a tab in the running app, including files selected together. It does not change your default editor. The portable Linux AppImage may require your desktop environment’s normal application integration before an Open with entry appears; the `.deb` installs a desktop entry.

Unsaved tabs have local recovery copies, subject to the webview storage quota. Recovery opens copies without file write permission; save them to reconnect to a permanent file. Closing a tab prompts before discarding changes. External edits cause a conflict message instead of an overwrite. Use Save As with another filename, or close and reopen to load the external version.

The browser development preview supports folder images through a chosen folder. In browsers without writable file handles, Save downloads a copy. The desktop app uses native pickers, menus, and atomic file writes.

## Bundled layout engine

Mermaid’s ELK dependency is pinned to 0.12.0, which explicitly adds GPL-3.0-or-later as a secondary license. The normal install and bundle notice checks enforce this choice. See the [upstream licensing change](https://github.com/kieler/elkjs/issues/373).
