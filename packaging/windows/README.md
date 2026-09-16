# Microsoft Store edition

Registered 12 September 2026 as **Plainmark Markdown Editor**, a Microsoft-hosted MSIX app.

- Store ID: `9PB6H8Z02K0G`; [public Microsoft Store listing](https://apps.microsoft.com/detail/9pb6h8z02k0g), verified 13 September 2026.
- Product identity: `GopalaSubramanium.PlainmarkMarkdownEditor`.
- Publisher: `CN=CB824A42-D5E4-447F-BB19-DEE3229EF8E6`.
- Publisher display name: `Gopala Subramanium`.
- Package family: `GopalaSubramanium.PlainmarkMarkdownEditor_4574vfc7ec9nr`.
- Submission: `1152921505701877168`.

The identity comes directly from Partner Center. Never substitute a made-up identity or a Developer ID/SignPath certificate name. The `Microsoft Store package` workflow builds the app from its checkout, runs the frontend/native tests and uses Windows SDK MakeAppx to validate and package it. The four-part package version follows the app version. The C runtime is statically linked for this build. No Electron runtime is bundled.

The submitted 0.4.0.0 x64 package comes from [build 34701120809](https://github.com/gopalasubramanium/plainmark/actions/runs/34701120809), source commit `2cd23096544524d597dcf3a7262dabc51e8c7ab5`. Its SHA-256 is `c844617260c5559b937a02fc57fb9b8c323051744dbd7e7ea4e03b3f5562b919` (3,762,516 bytes). [Runtime test 34702820573](https://github.com/gopalasubramanium/plainmark/actions/runs/34702820573) installed a separately test-signed copy on an ephemeral runner, rendered the actual editor, opened a native file picker, edited and saved exact expected content, captured screenshots and uninstalled. The original unsigned Store candidate remained unchanged, and the temporary test certificate was removed.

Partner Center accepted the package; Windows Desktop alone is enabled, with automatic expansion to future device families off. Free worldwide pricing, Productivity category, privacy/support links, publisher-approved IARC age ratings, actual Windows screenshot and GPL additional terms are saved. The private review notes and runFullTrust explanation accurately describe local files, WebView2 and isolated HTML execution. Public phone/address fields are blank; automatic OneDrive app-data backup and game broadcast declarations are off.

**Public Microsoft Store listing verified on 13 September 2026.** [Plainmark Markdown Editor](https://apps.microsoft.com/detail/9pb6h8z02k0g) is listed under **Gopala Subramanium**, in Productivity, with its free/open-source description and actual Windows screenshot. It was submitted for certification on 12 September 2026 (UTC), with automatic publication selected. The public page confirms publication; Partner Center’s read-only live Store presence confirms package `0.4.0.0` (app version `0.4.0`). The Store-delivered binary signature and installation have not yet been independently inspected on Windows.

The resulting CI artifact is an **unsigned submission candidate**, not a trusted installer. Microsoft signs Store packages after certification. The direct NSIS installer is a separate distribution path and remains unsigned; SignPath declined the Foundation application on 16 September. The recommended download uses [Microsoft’s web installer](https://get.microsoft.com/installer/download/9PB6H8Z02K0G) to install the Store edition. This small installer requires internet and Store access; it does not convert the NSIS package into a signed installer. See [the delivery and verification record](../../docs/SIGNING.md#windows).

Installation, launch, native file opening, save and uninstall passed. Remaining coverage gaps are upgrade, folder panels, local images, printing, default-app choice, file associations with spaces and Unicode names, multiple-file activation while already running, screen-reader usability and missing-WebView2 behavior. These have not been marked as passed. The manifest declares a Windows Desktop full-trust application; it is not an AppContainer privacy sandbox. Plainmark's local-file permission checks and content isolation still apply.

Sources: [Store identities](https://learn.microsoft.com/en-us/windows/apps/publish/view-app-identity-details), [desktop file activation](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/desktop-to-uwp-extensions), [WebView2 distribution](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution).
