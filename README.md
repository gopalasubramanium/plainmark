<p align="center"><img src="public/mark.svg" width="72" alt="Plainmark"></p>
<h1 align="center">Plainmark</h1>
<p align="center">A little space for your words.</p>
<p align="center">A free, open-source Markdown viewer and editor for Windows, macOS, and Linux.<br>No accounts. No ads. No tracking. No paid features.</p>

![Plainmark in split view](docs/screenshot.png)

## Get Plainmark

**[Download the latest preview release](https://github.com/gopalasubramanium/plainmark/releases)** · [Report a bug](https://github.com/gopalasubramanium/plainmark/issues) · [Contribute](CONTRIBUTING.md)

Plainmark is at **0.1.0**, an early preview. Choose the installer for your computer:

| Platform | Download | Target |
| --- | --- | --- |
| Windows | `.exe` installer | Windows 10/11, x64 |
| macOS, Apple Silicon | `aarch64.dmg` | macOS 11+ |
| macOS, Intel | `x64.dmg` | macOS 11+ |
| Linux | `.AppImage` or `.deb` | x64; built on Ubuntu 22.04 |

Windows uses WebView2, and Linux requires WebKitGTK 4.1. AppImage compatibility depends on the host distribution and its system libraries. See [Tauri’s platform prerequisites](https://v2.tauri.app/start/prerequisites/).

The preview installers are **not publisher-signed/notarized**. macOS uses ad-hoc signing. Windows and macOS may show security prompts for downloaded builds; trusted publisher signing is a future release task. You can also build directly from the source below.

## Your words, without the noise

- **Write, Split, Read.** A focused editor, an instant preview, or a comfortable reading view.
- **Real local files.** Open, edit, save, and save a copy using native file dialogs.
- **Markdown essentials.** Headings, tables, task lists, strikethrough, quotes, links, and fenced code.
- **A proper editor.** Markdown syntax colors, undo/redo, line numbers, find/replace, formatting shortcuts, and keyboard navigation.
- **A document outline.** Jump straight to the section you need.
- **Thoughtful safeguards.** Unsaved-change prompts, local crash recovery, atomic saves, and detection of external file edits.
- **Light and dark themes.** System fonts, balanced spacing, and no external font downloads.
- **Offline HTML export.** Export a self-contained reading copy with any successfully loaded local images embedded.
- **Local images.** PNG, JPEG, GIF, and WebP inside the opened document’s folder.

Files remain plain UTF-8 Markdown. Existing BOMs and Windows CRLF line endings are preserved on normal saves. New files use UTF-8 and LF. A file containing mixed newline styles is normalized to one style.

## Free means free

The official Plainmark project is committed to being free of charge, without ads, telemetry, subscriptions, bundled offers, or premium tiers. There is no server, account system, update service, or runtime dependency on a CDN.

The code is licensed under **GPL-3.0-or-later**. You can use, study, change, and share it. Distributed derivatives must comply with the GPL’s source-sharing requirements. The license permits commercial redistribution; our free-of-charge commitment applies to official Plainmark releases. Your own documents are yours and are not covered by the app’s license. See [LICENSE](LICENSE), [the project principles](PRINCIPLES.md), and [the GNU GPL FAQ](https://www.gnu.org/licenses/gpl-faq.html#DoesTheGPLAllowMoney).

## Privacy and safety

Opening a document does not send its contents anywhere. Remote Markdown images are represented by placeholders rather than fetched, and raw HTML is shown as text. Rendered Markdown is additionally sanitized. External links open in your browser only when clicked.

While you edit, one recovery draft is stored in the app’s local webview storage. It is removed when you save or deliberately discard and replace/close the document. A recovered draft opens as a copy and must be saved again. Recovery storage is not encrypted; clearing app/browser data removes it. Normal file saves are explicit, not automatic.

The native backend only reads and writes files selected through its dialogs. Local image access is confined to the document’s folder, including symlink checks. If a file changes externally, save a copy under a different name or reopen the newer version. Plainmark does not merge concurrent edits.

## Build from source

Install [Node.js 22.12+](https://nodejs.org/), [pnpm 11](https://pnpm.io/installation), a current stable [Rust toolchain](https://rustup.rs/), and the [Tauri system prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

```sh
git clone https://github.com/gopalasubramanium/plainmark.git
cd plainmark
pnpm install --frozen-lockfile
pnpm desktop
```

Create an installer for your current OS:

```sh
pnpm desktop:build
```

Bundles are written under `src-tauri/target/release/bundle/`. GitHub Actions also builds Windows, Linux, and both Mac architectures. See [release instructions](docs/RELEASING.md).

For a browser-only development preview, use `pnpm dev`. Browsers with the File System Access API can save files in place; other browsers download a copy. Browser mode can open files and export HTML, but cannot resolve adjacent local images. It is a development preview, not an installed offline web app.

## Keyboard shortcuts

Use **Cmd** on macOS and **Ctrl** on Windows/Linux.

| Action | Shortcut |
| --- | --- |
| New / Open / Save | Mod+N / Mod+O / Mod+S |
| Save as | Mod+Shift+S |
| Bold / Italic / Link | Mod+B / Mod+I / Mod+K |
| Find and replace | Mod+F |
| Write / Split / Read | Mod+1 / Mod+2 / Mod+3 |
| Focus mode | Mod+Shift+F; Esc to leave |
| Undo / Redo | Mod+Z / Mod+Shift+Z |
| Leave the editor using Tab | Esc, then Tab |

## Small by design

Plainmark uses **Tauri 2**, vanilla TypeScript, CodeMirror 6, markdown-it, and DOMPurify. It uses the operating system’s web renderer instead of shipping a separate browser engine. All application assets are bundled. Build tools and test browsers are development dependencies and are not shipped with the app.

The first version intentionally handles one document at a time, up to 5 MB. It does not yet include folder workspaces, tabs, Mermaid/math rendering, executable HTML, SVG image previews, or operating-system “Open with” file associations. Scroll synchronization is proportional rather than tied to exact Markdown blocks. It is a plain-text editor with a preview, not a WYSIWYG editor.

## Tests

```sh
pnpm build
pnpm test
pnpm exec playwright install chromium webkit
pnpm test:e2e
cargo test --locked --manifest-path src-tauri/Cargo.toml
```

The suites cover editor behavior in Chromium and WebKit, recovery, local-file round trips, HTML sanitization, remote-image blocking, native save conflicts, UTF-8 validation, line endings, and file-access boundaries. Automated tests do not replace manual installer checks on each supported OS.

## Contribute

Useful bug reports, accessibility improvements, translations, and small, well-considered changes are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first. Keep the app understandable, private, and small.

Copyright © 2026 Plainmark contributors. Distributed under the GNU General Public License, version 3 or later. Third-party libraries retain their own licenses; notices are included with desktop builds.
