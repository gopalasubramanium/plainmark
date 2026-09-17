Plainmark **v0.4.0** is the first public baseline across Windows, macOS and Linux. Recommended downloads now share one app version. Earlier releases remain unchanged in the release history. This is an early release; the baseline is a versioning decision, not a claim of stable 1.0 readiness.

## Download

- **Windows:** [Microsoft Store installer](https://get.microsoft.com/installer/download/9PB6H8Z02K0G) is recommended and requires internet and Store access. The separate x64 EXE remains **unsigned**. SignPath declined the Foundation application on 16 September; Store MSIX signing is handled by Microsoft independently.
- **macOS:** Choose the Apple Silicon (`aarch64`) or Intel (`x64`) DMG. Both the app and disk image are Developer ID-signed, Apple-notarized and verified by Gatekeeper. The separate [Mac App Store edition](https://apps.apple.com/app/plainmark-markdown-editor/id6811364319), also version 0.4.0, was approved on 16 September 2026 and its public listing was verified on 17 September.
- **Linux:** x64 AppImage and Debian package, built on Ubuntu 22.04. Compatibility depends on system libraries and the distribution.
- **Homebrew:** Plainmark’s official tap uses these same signed Mac DMGs after its signature, source and installation checks succeed. The `plainmark@preview` cask identifies the early-release channel.

## What is included

Visual editing, source/split/read views, folder workspaces, tabs, Mermaid diagrams, math, sanitized local SVG, explicitly runnable isolated HTML, Markdown-block scroll synchronization, Quick Open, local note links, image insertion, system printing/PDF, local recovery controls and Open with registration. This baseline also includes the native Mac sandbox file-save fixes and the license/source notices prepared for the Store editions.

No ads, accounts in the app, telemetry, subscriptions or paid features. Your Markdown remains in ordinary local files. See [privacy](https://github.com/gopalasubramanium/plainmark/blob/v0.4.0/PRIVACY.md) and [known limitations](https://github.com/gopalasubramanium/plainmark/tree/v0.4.0#small-by-design).

## Verification and remaining coverage

The release pipeline runs editor tests, native tests on Windows/macOS/Linux, dependency/security checks and Linux package/Open with integration checks. Final assets have per-platform SHA-256 manifests and GitHub build attestations; the Mac DMGs additionally have signed source-binding records. App source is tag `v0.4.0`, commit `67a98521c49d1c77605a43b21eacfe17e285ed54`.

Fresh downloads for both Mac architectures passed app and DMG signature, notarization and Gatekeeper checks, with matching app contents in the archive and disk image. The signed Apple Silicon app also passed native Open, visible rendering, source editing and exact saved-content verification. A new direct Windows EXE installation was not exercised during this validation.

The Store submissions retain their original source commits and exact package records; they were not rebuilt from this later tag. Store-distributed binary installation, a physical Intel Mac, Linux accessibility usability and all upgrade/default-app scenarios have not been comprehensively verified. See [distribution evidence](https://github.com/gopalasubramanium/plainmark/blob/main/docs/DISTRIBUTION-STATUS.md) for the actual checks and limits.

## Release rule

[The agreed policy](https://github.com/gopalasubramanium/plainmark/blob/main/docs/RELEASE-POLICY.md) establishes one current public baseline, preserves old releases, keeps store availability separate from version numbering, and requires a new version for later app changes. Windows package version `0.4.0.0` corresponds to app version `0.4.0`.
