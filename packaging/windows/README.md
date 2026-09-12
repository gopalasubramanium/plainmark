# Microsoft Store edition

Registered 12 September 2026 as **Plainmark Markdown Editor**, a Microsoft-hosted MSIX app.

- Store ID: `9PB6H8Z02K0G` (reserved; not a public listing yet).
- Product identity: `GopalaSubramanium.PlainmarkMarkdownEditor`.
- Publisher: `CN=CB824A42-D5E4-447F-BB19-DEE3229EF8E6`.
- Publisher display name: `Gopala Subramanium`.
- Package family: `GopalaSubramanium.PlainmarkMarkdownEditor_4574vfc7ec9nr`.
- Submission draft: `1152921505701877168`.

The identity comes directly from Partner Center. Never substitute a made-up identity or a Developer ID/SignPath certificate name. The `Microsoft Store package` workflow builds the app from its checkout, runs the frontend/native tests and uses Windows SDK MakeAppx to validate and package it. The four-part package version follows the app version. The C runtime is statically linked for this build. No Electron runtime is bundled.

Build [34698805863](https://github.com/gopalasubramanium/plainmark/actions/runs/34698805863) produced a 0.4.0 x64 package. It was uploaded to Partner Center; the Packages section reports **Validated / Complete**, with `runFullTrust` approval required. Windows Desktop alone is enabled; automatic expansion to future device families is off. Free worldwide pricing and the Productivity category, privacy URL, website and public support URL are saved. Public phone/address fields are blank. Automatic OneDrive app-data backup and game broadcast declarations are off.

The resulting CI artifact is an **unsigned submission candidate**, not a trusted installer. Microsoft signs Store packages after certification. The existing direct NSIS installer is a separate distribution path and remains unsigned pending the SignPath application.

Before certification, test installation, upgrade, uninstall, launch, native file/folder panels, saving, local images, printing, file associations with spaces and Unicode names, and opening a file while the app is already running. Check WebView2 availability on supported Windows versions and validate missing-runtime behavior. The manifest declares a Windows Desktop full-trust application; it is not an AppContainer privacy sandbox. Plainmark's local-file permission checks and content isolation still apply.

Sources: [Store identities](https://learn.microsoft.com/en-us/windows/apps/publish/view-app-identity-details), [desktop file activation](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/desktop-to-uwp-extensions), [WebView2 distribution](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution).
