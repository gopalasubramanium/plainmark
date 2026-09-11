# Security

Plainmark processes untrusted Markdown, so parser safety and file access matter.

If you find a vulnerability, use **GitHub’s private vulnerability reporting** on this repository when it is available. If private reporting is unavailable, open a minimal issue asking for a private contact channel; do not publish an exploit or private file contents in a public issue.

Include the affected version and OS, a minimal reproduction, and the expected impact. The current preview release is the only maintained release line. There is no guaranteed response-time SLA.

## Boundaries

- Markdown HTML is disabled and preview output is sanitized.
- Content Security Policy disallows remote scripts, frames, and remote images.
- The UI has no generic filesystem, shell, or HTTP plugin capability.
- Rust-owned file dialogs select the documents the backend may access.
- Local images must be recognized raster formats within the document’s folder; path traversal and symlink escapes are rejected.
- UTF-8 documents are limited to 5 MB; local images to 10 MB each.
- Recovery drafts are stored locally and are not encrypted.

File-change detection checks the bytes immediately before replacement. This is a safeguard against ordinary concurrent editing, not a cross-process locking system. Another process writing in the interval between the check and atomic replacement may still race the save. Keep shared/network-drive editing workflows coordinated.

The build pipeline installs third-party development dependencies. Exact versions are recorded in both lockfiles, and desktop packages include dependency license notices. The preview release does not yet have trusted publisher signatures or notarization.
