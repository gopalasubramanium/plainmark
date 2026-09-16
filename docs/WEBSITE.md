# Plainmark website

The public download page is a static website in `website/`. It uses local assets, system fonts, and no JavaScript, cookies, analytics, or external embeds.

The `Website` GitHub Actions workflow publishes that directory to GitHub Pages when it changes on `main`. Publishing the website does not rebuild or release the desktop app. GitHub Pages must use **GitHub Actions** as its source.

## Custom domain

Set the repository's Pages custom domain to `markdown.eksaar.com`, then create this record in the Cloudflare DNS zone for `eksaar.com`:

| Type | Name | Target | Proxy | TTL |
| --- | --- | --- | --- | --- |
| CNAME | markdown | gopalasubramanium.github.io | DNS only | Auto |

Once GitHub issues the certificate, enable **Enforce HTTPS** in the repository's Pages settings. The domain setting lives in GitHub Pages settings; a `CNAME` file does not configure an Actions-based Pages deployment.

## Updating downloads

After publishing a release, update the version, release-notes URL, download filenames, and supported-platform details in `website/index.html`. Link only to uploaded public release assets. Keep the preview/signing notice accurate. Refresh `website/assets/screenshot.png` from `docs/screenshot.png` when the app appearance changes.

The primary Windows button links directly to [Microsoft’s web installer](https://get.microsoft.com/installer/download/9PB6H8Z02K0G), with the [public Store listing](https://apps.microsoft.com/detail/9pb6h8z02k0g) as a secondary route. The official installer endpoint was downloaded successfully on 16 September 2026. The download requires internet access and Store services; it is not an offline package. It is served by Microsoft and follows the current Store edition, so it is not a version-pinned GitHub artifact. When the Store version changes, update the displayed app version as part of the release process. Follow the [baseline policy](RELEASE-POLICY.md): recommend one current app version, starting with v0.4.0, and show each channel's availability separately. A shared baseline label is appropriate only when the recommended downloads actually contain that version. Keep previous-version fallbacks in clearly labeled release history. Publishing a Store edition does not create a GitHub release or update the Mac Homebrew cask. The secondary Windows EXE must retain its unsigned label until that exact direct asset is signed. Store links use plain anchors with no tracking embeds, external badge scripts, campaign IDs or requests to Microsoft before a visitor clicks. Keep the standalone EXE’s unsigned label and the online-installation requirement visible. See [Microsoft’s Web Installer documentation](https://learn.microsoft.com/en-us/windows/apps/distribute-through-store/how-to-use-store-web-installer-for-distribution).

Preview `website/` with any local static HTTP server. Check the desktop and mobile layout, keyboard focus, in-page links, and installer links before publishing.
