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

The primary Windows button links to the [public Microsoft Store listing](https://apps.microsoft.com/detail/9pb6h8z02k0g), verified 13 September 2026. Show the app version beside each download button, including Mac/Linux cards and the alternative Windows EXE. Use a neutral release-notes link above the cards instead of a global version badge. Explain any temporary version difference in one short sentence. Keep availability separate from direct GitHub release versions: publishing a Store edition does not create a GitHub release or update the Mac Homebrew cask. The secondary Windows EXE must retain its unsigned-preview label until that exact direct asset is signed. Store links use plain anchors with no tracking embeds.

Preview `website/` with any local static HTTP server. Check the desktop and mobile layout, keyboard focus, in-page links, and installer links before publishing.
