# Distribution status

Last updated: 12 September 2026. Plainmark v0.3.3 remains a public preview. No Apple, Microsoft, Flathub or Snap listing has been approved or published.

| Channel | Actual progress | Next required step |
| --- | --- | --- |
| Website / GitHub | Live at https://markdown.eksaar.com/ with v0.3.3 downloads | Keep signing status and download links accurate |
| Homebrew for Mac | Published official tap at https://github.com/gopalasubramanium/homebrew-plainmark; both downloads verified; CI installed, checked signature/notarization/Gatekeeper and uninstalled successfully | Maintain the version and verified hashes after each release |
| Microsoft Store | Entered the free individual-developer onboarding flow; Microsoft account sign-in is required | Publisher completes sign-in and identity verification; reserve the packaged-app product, obtain real MSIX identity, then build and validate an MSIX edition |
| Mac App Store | Opened App Store Connect; fresh Apple sign-in is required despite the active Developer membership | Publisher completes sign-in; create an app record, review current license/Store terms, implement and test sandbox file access, configure Store certificates/profile and upload a reviewed build |
| Flathub | Researched current requirements; prepared initial AppStream metadata and desktop entry in `packaging/linux/` | Finish and test a Flatpak build; establish stable release readiness; human maintainer writes/submits the PR and review interactions with AI-assistance disclosure |
| Snap Store | Started Add snap/name-registration route; it requires an Ubuntu One login | Publisher signs in or creates the account; register an available name, build/test strict confinement, upload to a testing channel and pass review |
| AlternativeTo | Searched for duplicates; no matching Plainmark listing found; opened submission sign-in | A verified account is required before adding the app; complete login then submit the actual product listing for free review |
| SignPath for direct Windows downloads | Application submitted and acknowledged by email on 12 September; review pending | Wait for provider approval and exact signing integration instructions; keep current Windows installer explicitly unsigned |

## Evidence

- [Homebrew verification run 34692177694](https://github.com/gopalasubramanium/homebrew-plainmark/actions/runs/34692177694): all checks passed, including installing the app and macOS signature, stapling and Gatekeeper checks.
- [Plainmark checks at the store-readiness commit](https://github.com/gopalasubramanium/plainmark/actions/runs/34691507365): passed on Linux, Windows and macOS.
- [Published release v0.3.3](https://github.com/gopalasubramanium/plainmark/releases/tag/v0.3.3): immutable preview; Mac direct downloads signed and notarized, Windows direct installer unsigned.
- Details and primary sources: [store readiness](STORES.md), [listing fields and product description](DISTRIBUTION-LISTING.md), [signing policy](SIGNING.md), [SignPath application record](SIGNPATH-APPLICATION-DRAFT.md).

The Homebrew tap is maintained by Plainmark's publisher. It is not acceptance into Homebrew's central cask repository. Store sign-in and opening a registration page are not app submission or certification. Store badges will be added only when real public listings exist.

## Visibility approach

Prioritize relevant distribution and discovery: working download/install channels, accurate editor categories, a useful screenshot, a clear free/open-source commitment and specific support links. AlternativeTo fits people looking for a simpler Markdown tool. Its normal review queue is free and may take months; no priority review or advertising has been purchased.

Hacker News currently prohibits generated or AI-edited text. The creator must personally write any Show HN post and discussion there. Flathub likewise has specific rules against agent-generated submission interactions. No automated posts or submission PRs have been made to those communities. Follow each destination's rules; do not post fake reviews, request artificial votes or imply independent endorsement.

Public downloads and directories can help people discover Plainmark; adoption depends on usefulness, reliability and real user feedback. The app should only become a user's default Markdown handler when that user chooses it.
