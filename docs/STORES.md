# Store distribution readiness

Updated 13 September 2026 against the public v0.3.3 GitHub preview and 0.4.0 Store submissions. **[Microsoft Store is now public](https://apps.microsoft.com/detail/9pb6h8z02k0g)**; Apple was last confirmed Waiting for Review. See the separate [distribution status](DISTRIBUTION-STATUS.md) for exact submission evidence and the published Homebrew channel. Official editions should remain free, with no ads, paid features, accounts in the app, or telemetry. GitHub downloads remain a useful independent distribution channel.

## Microsoft Store: first priority

Use an **MSIX package** for a Microsoft-hosted edition. Microsoft handles its signing after certification. The EXE/MSI submission route instead requires the publisher to sign the installer and its executable files. SignPath therefore remains useful for direct downloads, while MSIX preparation can proceed without its approval. [Microsoft signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options).

Microsoft's new individual-developer enrollment has no registration fee and requires identity verification. Start at its supported enrollment entry point; do not assume that an Apple account also creates a Microsoft publisher account. [Individual registration](https://learn.microsoft.com/en-us/windows/apps/publish/whats-new-individual-developer).

Plainmark now has a registered MSIX identity, manifest and dedicated Windows packaging workflow in `packaging/windows/` and `.github/workflows/msix.yml`. Product `9PB6H8Z02K0G` is publicly listed as Plainmark Markdown Editor, published by Gopala Subramanium. The x64 0.4.0.0 candidate passed installation, visible editor launch, native file opening, source editing, exact saved-content verification and uninstall on an isolated Windows runner. See [the packaging record](../packaging/windows/README.md) and [the actual test](https://github.com/gopalasubramanium/plainmark/actions/runs/34702820573).

Pricing is zero in all selected markets, age ratings are complete after the publisher's explicit IARC agreement, and runFullTrust is explained as the ordinary Win32 desktop host. FullTrust does not mean administrator privileges. The tested package and completed listing were submitted for certification on 12 September; the public Microsoft Store listing was verified on 13 September. The original CI candidate remains unsigned; Microsoft handles signing for Store distribution. Partner Center’s live Store presence confirms package `0.4.0.0` (app version `0.4.0`). The Store-delivered binary signature and installation have not been independently inspected. Default-app association choice, multi-file activation, folders, printing, upgrades, screen-reader usability and a machine missing WebView2 remain separate test coverage gaps. State those limits accurately.

## Mac App Store: separate build and review

Version/build 0.4.0 was delivered through Transporter and submitted for review on 13 September 2026 at 00:57 Singapore time. App Store Connect reports Waiting for Review for submission `2e5cbcc0-112c-4948-bf50-5d528fd2e9a7`. Free pricing and automatic release after approval are selected. See [the package and validation record](../packaging/macos/README.md).

The active Apple membership covers the account prerequisite. Existing Developer ID-signed and notarized DMGs are for direct distribution; they are not Mac App Store submissions. The Store edition needs its own signing/provisioning configuration, sandbox entitlements, signed submission package, App Store Connect record and review. [Tauri App Store packaging](https://v2.tauri.app/distribute/app-store/).

The repository now has App Sandbox entitlements and a separate App Store build configuration. An isolated native sandbox test verified launch, individual-file Open/edit/save, Save As and recovery after restart. Atomic replacement now uses Foundation's sandbox-compatible replacement directory. Folder paths are not restored across launches; no persistent-bookmark reopening is promised. Chosen-folder access, local SVG and math, linked notes and exact workspace saves also passed in the isolated sandbox build. Adding the missing print entitlement fixed the native print dialog and preview. Remaining checks include final PDF output, image insertion, Finder activation and the final Store-signed runtime. The WKWebView network-client entitlement is required for local rendering on the tested Mac; document restrictions continue to rely on the app CSP and native scopes, not an OS-level network ban. [Apple file access](https://developer.apple.com/documentation/security/accessing-files-from-the-macos-app-sandbox).

Document and assess the existing Run HTML feature against Apple's executable-code rules. Do not silently remove it or promise review acceptance. Apple requires sandboxing and applies its own review rules to the submitted product. [App Review Guidelines, 2.4.5 and 2.5.2](https://developer.apple.com/app-store/review/guidelines/).

The publisher approved a narrow Apple Store permission for his own code on 13 September 2026. The source remains GPL-3.0-or-later. The exception, explicit dependency license choices and preferred-source references are included in the bundled notices. See [the license record](APPLE-STORE-LICENSES.md). Third-party components retain their own rights; Apple's standard executable EULA does not replace their source licenses.

## Flathub: primary Linux store target

Flathub distributes Flatpak applications through its site and compatible graphical software centers. Developer verification can establish the official publisher; Plainmark's existing `io.github.gopalasubramanium.plainmark` identifier provides a potential GitHub ownership verification route. Verification follows acceptance and account authorization; it is not an independent security audit. [Distribution](https://docs.flathub.org/docs/for-app-authors/why-flathub) · [Verification](https://docs.flathub.org/docs/for-app-authors/verification).

A GNOME 50 Flatpak manifest, checksummed vendored Node/Rust sources, AppStream metadata, icon and desktop entry now build successfully offline. The installed app visibly opened a file through the document portal, but its automated WebKit accessibility-tree check remains unresolved. Existing AppImage and Debian packages do not establish Flatpak compatibility. Prefer access to user-selected files and folders over blanket home-directory permissions. Exercise local images, folder navigation, saves, printing and Open with inside the sandbox.

Flathub currently requires stable software for new submissions and does not accept new beta-repository submissions. v0.3.3 is explicitly a preview. Its current policy also requires disclosure of the parts and approximate extent of AI-generated material. AI agents may not open or automate submission PRs or write their commit messages, descriptions or review interactions. A human maintainer must handle those submissions and responses. This document is an internal readiness assessment, not Flathub submission text. [Current requirements](https://docs.flathub.org/docs/for-app-authors/requirements).

## Snap Store: additional Linux channel

A Snap package offers another Linux distribution channel. It needs its own manifest and confinement tests, a publisher account and registered name. Use the least permissions that support actual file workflows; avoid choosing unrestricted classic confinement just to bypass packaging work. Publication runs through the Store's review process. [Publishing](https://snapcraft.io/docs/releasing-your-app/) · [Security policies](https://snapcraft.io/docs/explanation/security/security-policies/).

## Release order and acceptance evidence

Maintain the published Microsoft Store edition and complete its remaining installation checks. Follow the submitted Mac edition through review and continue Linux sandbox work; add Snap after the core store builds are reliable. Promote to a stable version only after platform installation, file access, upgrade and accessibility checks establish readiness. Screenshots, descriptions, privacy answers and support links must describe the actual edition submitted. Add store badges and download links only after public listings exist.

Store review, verified publisher identity and managed updates improve distribution trust. They do not replace source review, dependency maintenance or privacy testing, and do not make Plainmark the default Markdown app without the user's choice.
