# Plainmark website

The public download page is a static website in `website/`. It uses local assets and system fonts. One small, dependency-free local script suggests an installation command and handles copying. There are no cookies, analytics, external embeds, or external requests for OS detection.

The `Website` GitHub Actions workflow publishes that directory to GitHub Pages when it changes on `main`. Publishing the website does not rebuild or release the desktop app. GitHub Pages must use **GitHub Actions** as its source.

## Custom domain

Set the repository's Pages custom domain to `markdown.eksaar.com`, then create this record in the Cloudflare DNS zone for `eksaar.com`:

| Type | Name | Target | Proxy | TTL |
| --- | --- | --- | --- | --- |
| CNAME | markdown | gopalasubramanium.github.io | DNS only | Auto |

Once GitHub issues the certificate, enable **Enforce HTTPS** in the repository's Pages settings. The domain setting lives in GitHub Pages settings; a `CNAME` file does not configure an Actions-based Pages deployment.

## Updating downloads

After publishing a release, update the version, release-notes URL, download filenames, and supported-platform details in `website/index.html`, including the terminal commands and their version notes. Link only to uploaded public release assets. Keep the preview/signing notice accurate. Refresh `website/assets/screenshot.png` from `docs/screenshot.png` when the app appearance changes.

The primary Windows button links directly to [Microsoft’s web installer](https://get.microsoft.com/installer/download/9PB6H8Z02K0G), with the [public Store listing](https://apps.microsoft.com/detail/9pb6h8z02k0g) as a secondary route. The official installer endpoint was downloaded successfully on 16 September 2026. The download requires internet access and Store services; it is not an offline package. It is served by Microsoft and follows the current Store edition, so it is not a version-pinned GitHub artifact. When the Store version changes, update the displayed app version as part of the release process. Follow the [baseline policy](RELEASE-POLICY.md): recommend one current app version, starting with v0.4.0, and show each channel's availability separately. A shared baseline label is appropriate only when the recommended downloads actually contain that version. Keep previous-version fallbacks in clearly labeled release history. Publishing a Store edition does not create a GitHub release or update the Mac Homebrew cask. The secondary Windows EXE must retain its unsigned label until that exact direct asset is signed. Store links use plain anchors with no tracking embeds, external badge scripts, campaign IDs or requests to Microsoft before a visitor clicks. Keep the standalone EXE’s unsigned label and the online-installation requirement visible. See [Microsoft’s Web Installer documentation](https://learn.microsoft.com/en-us/windows/apps/distribute-through-store/how-to-use-store-web-installer-for-distribution).

Preview `website/` with any local static HTTP server. Check the desktop and mobile layout, keyboard focus, in-page links, and installer links before publishing.

## Unified installation area

The hero contains the only installation area on the page. Download is the default; a compact “Use a command” switch replaces the download actions with a one-line command and Copy button in the same space. Both methods share the same platform selector and preserve its selection. Only the chosen platform and method are visible. Installer alternatives and release notes are collapsed until needed. Mac download mode shows Apple Silicon and Intel choices because browser OS detection cannot reliably identify the chip. `install.js` checks only the browser’s existing user-agent/platform strings and touch capability, locally. No data is sent or stored. It suggests Windows (WinGet), macOS (Homebrew), or an x64 Linux AppImage. Browsers reporting mobile, ChromeOS, ARM Linux, or an unknown OS get a manual choice. This is a convenience hint, not a compatibility check; browsers can obscure or override their OS. A Linux browser cannot reliably identify its distribution, so Debian/Ubuntu installation is always an explicit choice.

- Windows uses `winget install --id 9PB6H8Z02K0G --source msstore`, following [Microsoft’s Store-source instructions](https://learn.microsoft.com/en-us/windows/package-manager/winget/install). It preserves the normal agreement prompts and requires WinGet and Store access.
- Mac uses the official Homebrew tap already documented in the README. Homebrew must be installed first; the site does not download or execute a Homebrew bootstrap script.
- Linux commands download the same version-pinned HTTPS GitHub assets as the buttons. The AppImage command makes the file executable; users open it themselves. The .deb command installs with apt after a successful download, with normal administrator approval. Both are labeled x64 and explain their prerequisites. No Flathub/Snap command is advertised before publication.

Without JavaScript, the same installation area shows the platform downloads, with commands available inside native “Use a command” disclosures. There is no duplicate download grid. The commands live in the HTML and all links remain usable when the helper cannot load. Copying requires a user click. If clipboard access is unavailable or denied, the command is selected for manual copying, with an accessible status message. Copying never runs a command. Long lines scroll inside the command box on small screens.

Run `pnpm test:website` after installing the existing Playwright Chromium and WebKit browsers. The dedicated static server uses port 18241 to avoid the app development server. Tests cover desktop/mobile OS hints, manual selection, exclusive method switching, exact copied text, clipboard denial and stale asynchronous feedback, no-JavaScript access, keyboard use, narrow layout, versioned assets, and absence of external requests/storage. The normal Checks workflow runs these tests as well. Installer execution on each target OS is a separate release validation step.
