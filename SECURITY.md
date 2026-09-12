# Security

Plainmark processes untrusted Markdown, so parser safety and file access matter.

If you find a vulnerability, use **GitHub’s private vulnerability reporting** on this repository when it is available. If private reporting is unavailable, open a minimal issue asking for a private contact channel; do not publish an exploit or private file contents in a public issue.

Include the affected version and OS, a minimal reproduction, and the expected impact. The current preview release is the only maintained release line. There is no guaranteed response-time SLA.

## Boundaries

- Raw HTML has a sanitized static preview. Scripts require an explicit Run HTML action and execute in an opaque sandbox frame.
- The main app’s Content Security Policy forbids remote scripts and permits only the dedicated HTML preview frame.
- The HTML frame allows inline scripts and styling but blocks fetch/XHR, remote subresources, workers, forms, popups, and top-level navigation. It has no same-origin privilege. Desktop navigation is restricted to application protocols; the browser development preview is not a security boundary for arbitrary navigation by code you run.
- Executable HTML can consume CPU or attempt navigation within its frame. Run code you trust. It is not a general-purpose malware analysis sandbox. Closing the frame stops it.
- The UI has no generic filesystem, shell, or HTTP plugin capability. Native application commands are explicitly listed and granted in the build manifest and main-window capability. The runtime injects its authenticated command bridge into the main frame only. Capability grants alone do not establish iframe isolation; the opaque frame, content policy and absent authenticated bridge are all part of the boundary.
- Rust-owned dialogs, explicitly selected workspaces, and OS file-opening events grant document access. Tabs receive separate opaque file IDs.
- Local images must be recognized raster formats or SVG within the selected workspace/document folder. SVG is sanitized and displayed as an image, never injected as active SVG. Path traversal and symlink escapes are rejected.
- UTF-8 documents are limited to 5 MB; local images to 10 MB each.
- Recovery drafts are stored locally and are not encrypted. Privacy settings can disable and clear copies. System spellchecking is off by default, and executable HTML can be disabled. See [PRIVACY.md](PRIVACY.md).
- Local document links remain within the selected workspace or document folder, resolve canonical paths and reject symlink escapes. Image import writes unique files only in a real `assets` subfolder beside an already-authorized document. No arbitrary destination is accepted by the import command.

File-change detection checks the bytes immediately before replacement. This is a safeguard against ordinary concurrent editing, not a cross-process locking system. Another process writing in the interval between the check and atomic replacement may still race the save. Keep shared/network-drive editing workflows coordinated.

The filesystem checks assume the local account itself is trusted. Another process running as that account can change files between path checks and access; canonical path validation is not an OS sandbox or protection from an already compromised device. Atomic saves reduce partial-write risk but do not replace backups or guarantee durability on every network filesystem.

## Dependencies and release verification

The build pipeline installs third-party development dependencies. Exact versions are recorded in both lockfiles, desktop packages include dependency license notices, and external GitHub Actions are pinned to immutable commits. Advisory checks cover the JavaScript and registry Rust dependencies. Release jobs generate per-platform SHA-256 files and build attestations. These checks do not replace independent security review.

The September 2026 hardening update overrides transitive `lodash-es` to 4.18.1, addressing GHSA-r5fr-rjxr-66jc and GHSA-f23m-r3pf-42rh. No exploitable chain through Plainmark was established; the vulnerable dependency was updated regardless. The JavaScript audit then reported no advisories.

Tauri's Linux GTK3 stack uses GLib 0.18.5, affected by RUSTSEC-2024-0429. A two-line, upstream-reviewed fix is backported in `src-tauri/vendor/glib`; the exact source archive plus permitted patch is verified and the iterator is tested on Linux with release optimization. Registry advisory scans omit path dependencies, so the explicit backport check is required. See [backport provenance](src-tauri/vendor/README.md).

The Rust scan also reports maintenance warnings for `proc-macro-error` and the `unic-*` family. These are documented upstream maintenance constraints, not proof of an exploitable vulnerability and not silently ignored. Revisit them when updating the native framework. The app also depends on platform WebKit/WebView2 security updates.

The preview release does not yet have trusted publisher signatures or notarization. [Trusted distribution](docs/SIGNING.md) describes the prepared checks and account-dependent work. No claim of absolute security, universal platform trust, or completed external penetration testing is made.
