# Store distribution readiness

Assessed 12 September 2026 against Plainmark v0.3.3 and the current repository. No store listing has been created or submitted. Enrollment has been started; see the separate [distribution status](DISTRIBUTION-STATUS.md) for exact account gates and the published Homebrew channel. Official editions should remain free, with no ads, paid features, accounts in the app, or telemetry. GitHub downloads remain a useful independent distribution channel.

## Microsoft Store: first priority

Use an **MSIX package** for a Microsoft-hosted edition. Microsoft handles its signing after certification. The EXE/MSI submission route instead requires the publisher to sign the installer and its executable files. SignPath therefore remains useful for direct downloads, while MSIX preparation can proceed without its approval. [Microsoft signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options).

Microsoft's new individual-developer enrollment has no registration fee and requires identity verification. Start at its supported enrollment entry point; do not assume that an Apple account also creates a Microsoft publisher account. [Individual registration](https://learn.microsoft.com/en-us/windows/apps/publish/whats-new-individual-developer).

Plainmark currently builds an NSIS EXE, and has no MSIX manifest, package identity or Store activation integration. Tauri's built-in packaging does not produce MSIX, so this needs a separate Windows packaging step. Reserve the product through the correct packaged-app route, obtain Microsoft's exact identity/publisher values, and package the compiled app and required resources. Do not invent those identity values. Verify WebView2 availability, resource paths, file activation, multiple-file Open with, existing-instance forwarding, saving, folder access, printing, installation, update and uninstall under package identity. These behaviors have not yet been tested as a Store package. [Tauri's current packaging limits](https://v2.tauri.app/distribute/microsoft-store/).

## Mac App Store: separate build and review

The active Apple membership covers the account prerequisite. Existing Developer ID-signed and notarized DMGs are for direct distribution; they are not Mac App Store submissions. The Store edition needs its own signing/provisioning configuration, sandbox entitlements, signed submission package, App Store Connect record and review. [Tauri App Store packaging](https://v2.tauri.app/distribute/app-store/).

The current repository has no App Sandbox entitlements or security-scoped bookmark implementation. Audit chosen-file and folder access, supporting images, atomic saves, Finder activation and reopening permissions inside the real sandbox. Native file dialogs alone are not evidence that all those behaviors work. [Apple file access](https://developer.apple.com/documentation/security/accessing-files-from-the-macos-app-sandbox).

Document and assess the existing Run HTML feature against Apple's executable-code rules. Do not silently remove it or promise review acceptance. Apple requires sandboxing and applies its own review rules to the submitted product. [App Review Guidelines, 2.4.5 and 2.5.2](https://developer.apple.com/app-store/review/guidelines/).

Review license compatibility before submission. Plainmark is GPL-3.0-or-later; its notices also identify EPL/GPL alternatives for ELK and other third-party licenses. The FSF has documented conflicts between historical App Store restrictions and GPL distribution. That history is a reason to check the current agreement and exact dependency licenses, not a determination that every current Mac submission is prohibited. Any relicensing or additional permission must respect all relevant rightsholders; changing the top-level license alone is insufficient. [FSF's historical explanation](https://www.fsf.org/blogs/licensing/more-about-the-app-store-gpl-enforcement).

## Flathub: primary Linux store target

Flathub distributes Flatpak applications through its site and compatible graphical software centers. Developer verification can establish the official publisher; Plainmark's existing `io.github.gopalasubramanium.plainmark` identifier provides a potential GitHub ownership verification route. Verification follows acceptance and account authorization; it is not an independent security audit. [Distribution](https://docs.flathub.org/docs/for-app-authors/why-flathub) · [Verification](https://docs.flathub.org/docs/for-app-authors/verification).

The project needs a maintained-runtime Flatpak manifest, dependency sources suitable for its build environment, AppStream metadata, correctly named icons/desktop entry and tested file-portal behavior. Existing AppImage and Debian packages do not establish Flatpak compatibility. Prefer access to user-selected files and folders over blanket home-directory permissions. Exercise local images, folder navigation, saves, printing and Open with inside the sandbox.

Flathub currently requires stable software for new submissions and does not accept new beta-repository submissions. v0.3.3 is explicitly a preview. Its current policy also requires disclosure of the parts and approximate extent of AI-generated material. AI agents may not open or automate submission PRs or write their commit messages, descriptions or review interactions. A human maintainer must handle those submissions and responses. This document is an internal readiness assessment, not Flathub submission text. [Current requirements](https://docs.flathub.org/docs/for-app-authors/requirements).

## Snap Store: additional Linux channel

A Snap package offers another Linux distribution channel. It needs its own manifest and confinement tests, a publisher account and registered name. Use the least permissions that support actual file workflows; avoid choosing unrestricted classic confinement just to bypass packaging work. Publication runs through the Store's review process. [Publishing](https://snapcraft.io/docs/releasing-your-app/) · [Security policies](https://snapcraft.io/docs/explanation/security/security-policies/).

## Release order and acceptance evidence

Prioritize Microsoft MSIX packaging and Linux sandbox work. Prepare the Mac build alongside the license review; add Snap after the core store builds are reliable. Promote to a stable version only after platform installation, file access, upgrade and accessibility checks establish readiness. Screenshots, descriptions, privacy answers and support links must describe the actual edition submitted. Add store badges and download links only after public listings exist.

Store review, verified publisher identity and managed updates improve distribution trust. They do not replace source review, dependency maintenance or privacy testing, and do not make Plainmark the default Markdown app without the user's choice.
