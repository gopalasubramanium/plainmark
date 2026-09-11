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

Preview `website/` with any local static HTTP server. Check the desktop and mobile layout, keyboard focus, in-page links, and installer links before publishing.
