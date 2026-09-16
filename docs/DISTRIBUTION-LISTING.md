# Plainmark listing material

Updated 15 September 2026 for the v0.4.0 public baseline and Store editions. Use only features verified in the edition being submitted. This is reusable product metadata, not a claim of store acceptance. It is not a Flathub submission, PR description or review response.

## Common fields

| Field | Value |
| --- | --- |
| Name | Plainmark |
| Short description | Local Markdown viewer and visual editor |
| Apple subtitle | Local Markdown, visual editing |
| Apple promotional text | An open-source home for everyday Markdown. Work with local files, edit visually, and render diagrams and math. |
| Publisher / creator | Gopala Subramanium |
| Website | https://markdown.eksaar.com/ |
| Source | https://github.com/gopalasubramanium/plainmark |
| Support | https://github.com/gopalasubramanium/plainmark/issues |
| Privacy policy | https://github.com/gopalasubramanium/plainmark/blob/main/PRIVACY.md |
| License | GPL-3.0-or-later; preserve dependency notices |
| Price | Free, with no in-app purchases, subscriptions or ads |
| Category | Productivity / Markdown editor / Text editor |
| Language | English |
| Current version | 0.4.0; availability and maturity recorded per channel |
| Desktop platforms | Windows 10/11 x64, macOS 11+ Apple Silicon/Intel, Linux x64 |
| Application identifier | io.github.gopalasubramanium.plainmark |
| Discoverability keywords | markdown, editor, viewer, visual editing, local files, offline, mermaid, math |

## Apple metadata rule

Keep pricing language such as “free,” “discount,” or subscription-price claims out of Apple app names, subtitles and keywords. Review screenshots and previews for the same restriction, and use feature-focused promotional text. Describe the free/open-source commitment in the app description and configure the actual price in Pricing and Availability. Check every configured localization before submitting. See [Apple Guideline 2.3.7](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata) and [the review history](APPLE-REVIEW-HISTORY.md). A metadata-only correction can reuse the same build when Apple permits it; it does not change the public app baseline.

## Description

Plainmark is a free, open-source Markdown viewer and editor for everyday notes, documents and technical writing. Open an existing file or folder, edit the formatted document directly, switch to Markdown source, or use a split preview.

Keep related documents in folder workspaces and tabs. Preview Mermaid diagrams, TeX math and local images, including sanitized SVG. Source and preview follow matching Markdown blocks as you scroll. Find documents quickly, follow local note links, paste images beside your note, and print or save a PDF using the system dialog.

Your documents stay as ordinary Markdown files on your computer. The app has no accounts, advertising, subscriptions, paid features or telemetry. Remote images are blocked by default. HTML is sanitized for normal preview; scripts run only when you choose Run HTML, inside an isolated frame with no app or file access.

Plainmark includes unsaved-change prompts, local recovery copies and detection of externally edited files. Recovery storage is local and unencrypted, and can be disabled or cleared in Privacy settings. This release is a preview, and feedback is welcome.

Made by Gopala Subramanium and contributors because everyday Markdown should be available to everyone, free of ads, subscriptions and unnecessary interruptions.

## Screenshots and icon

- Actual app screenshot: `docs/screenshot.png`; public copy: https://markdown.eksaar.com/assets/screenshot.png.
- App icon: `src-tauri/icons/icon.png`; vector brand mark: `public/mark.svg`.
- Capture new screenshots from the actual sandboxed Store edition before its submission. Match each store's dimensions without stretching or inventing UI.
- Do not show store badges, user counts, ratings, awards or verified-publisher claims until the relevant provider has actually granted them.

## Review notes and privacy answers to verify per edition

- No app login or reviewer account is required. Start with a sample Markdown file or open a local file/folder.
- Exercise Visual/Source/Split/Read, local attachments, tabs, Open with, atomic save, and system printing inside the package's actual sandbox.
- The application does not collect or transmit document contents or analytics. External links open the user's browser only when selected. OS webview, store and operating-system services have their own policies.
- Declare no advertising or in-app purchases. Confirm each platform's privacy questionnaire against the final linked dependencies and edition; do not blindly copy a previous answer.
- Run HTML executes user-supplied HTML scripts in an isolated frame. Disclose its actual restrictions to Apple review; do not hide the feature.
- Mac direct downloads are Developer ID signed and notarized. The standalone Windows EXE remains unsigned after SignPath declined the Foundation application; Microsoft handles Store MSIX package signing separately. These statements are separate from Store certification.

## Platform-specific pending values

Microsoft product `9PB6H8Z02K0G` and Apple app `6811364319` are registered as **Plainmark Markdown Editor**. Exact MSIX identity values are committed in `packaging/windows/AppxManifest.xml`. Apple Store certificates and a matching profile have been issued and installed in the publisher's local Keychain; the profile is intentionally ignored by Git. Snap requires a registered name and publisher account. Do not make up these identifiers or submit placeholder packages.
