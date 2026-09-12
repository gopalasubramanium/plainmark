# Security

Plainmark processes untrusted Markdown, so parser safety and file access matter.

If you find a vulnerability, use **GitHub’s private vulnerability reporting** on this repository when it is available. If private reporting is unavailable, open a minimal issue asking for a private contact channel; do not publish an exploit or private file contents in a public issue.

Include the affected version and OS, a minimal reproduction, and the expected impact. The current preview release is the only maintained release line. There is no guaranteed response-time SLA.

## Boundaries

- Raw HTML has a sanitized static preview. Scripts require an explicit Run HTML action and execute in an opaque sandbox frame.
- The main app’s Content Security Policy forbids remote scripts and permits only the dedicated HTML preview frame.
- The HTML frame allows inline scripts and styling but blocks fetch/XHR, remote subresources, workers, forms, popups, and top-level navigation. It has no same-origin privilege. Desktop navigation is restricted to application protocols; the browser development preview is not a security boundary for arbitrary navigation by code you run.
- Executable HTML can consume CPU or attempt navigation within its frame. Run code you trust. It is not a general-purpose malware analysis sandbox. Closing the frame stops it.
- The UI has no generic filesystem, shell, or HTTP plugin capability.
- Rust-owned dialogs, explicitly selected workspaces, and OS file-opening events grant document access. Tabs receive separate opaque file IDs.
- Local images must be recognized raster formats or SVG within the selected workspace/document folder. SVG is sanitized and displayed as an image, never injected as active SVG. Path traversal and symlink escapes are rejected.
- UTF-8 documents are limited to 5 MB; local images to 10 MB each.
- Recovery drafts are stored locally and are not encrypted.

File-change detection checks the bytes immediately before replacement. This is a safeguard against ordinary concurrent editing, not a cross-process locking system. Another process writing in the interval between the check and atomic replacement may still race the save. Keep shared/network-drive editing workflows coordinated.

The build pipeline installs third-party development dependencies. Exact versions are recorded in both lockfiles, and desktop packages include dependency license notices. The preview release does not yet have trusted publisher signatures or notarization.
