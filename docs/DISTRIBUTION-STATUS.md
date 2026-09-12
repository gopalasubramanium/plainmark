# Distribution status

Last updated: 12 September 2026. Plainmark v0.3.3 remains a public preview. No Apple, Microsoft, Flathub or Snap listing has been approved or published.

| Channel | Actual progress | Next required step |
| --- | --- | --- |
| Website / GitHub | Live at https://markdown.eksaar.com/ with v0.3.3 downloads | Keep signing status and download links accurate |
| Homebrew for Mac | Published official tap at https://github.com/gopalasubramanium/homebrew-plainmark; both downloads verified; CI installed, checked signature/notarization/Gatekeeper and uninstalled successfully | Automatic verified-release synchronization runs every four hours and can be run manually; no separate application source is maintained in the tap |
| Microsoft Store | Verified publisher; product `9PB6H8Z02K0G`, Plainmark Markdown Editor, submission `1152921505701877168`. Free worldwide pricing, properties/privacy links, IARC age rating and restricted-capability explanation saved. Tested x64 MSIX, actual Windows screenshot, GPL terms and reviewer notes submitted. Partner Center confirms **In certification**, with pre-processing in progress | Await Microsoft certification and runFullTrust approval; automatic publishing is selected. Store signing and public availability are not yet confirmed |
| Mac App Store | App `6811364319`, Plainmark Markdown Editor, draft 0.4.0. DSA declaration, age rating, privacy, listing/review contact and free worldwide pricing saved. Both Store certificates/profile issued. Universal app and installer signed and locally verified | Publisher approved Apple Store permission and dependency choices are recorded; finish sandbox workflow tests and screenshots, validate/upload the package and submit for review |
| Flathub | Development Flatpak built completely offline; metadata and restricted permissions passed. Actual installed app displayed a portal-granted Markdown file | Fix or diagnose the unresolved accessibility-tree test, finish sandbox file workflows, establish a stable release, then human maintainer handles submission and review under Flathub's rules |
| Snap Store | Started Add snap/name-registration route; it requires an Ubuntu One login | Publisher signs in or creates the account; register an available name, build/test strict confinement, upload to a testing channel and pass review |
| AlternativeTo | Searched for duplicates; no matching Plainmark listing found; opened submission sign-in | A verified account is required before adding the app; complete login then submit the actual product listing for free review |
| SignPath for direct Windows downloads | Application submitted and acknowledged by email on 12 September; review pending | Wait for provider approval and exact signing integration instructions; keep current Windows installer explicitly unsigned |

## Evidence

- [Windows installed-file test 34702820573](https://github.com/gopalasubramanium/plainmark/actions/runs/34702820573): installed the exact MSIX candidate, rendered its editor, opened a native file picker, edited and saved the expected file, captured native screenshots, and uninstalled. A test-only certificate was created and removed exclusively on the ephemeral runner; the uploaded candidate remained unsigned and unchanged.
- [Windows package build 34701120809](https://github.com/gopalasubramanium/plainmark/actions/runs/34701120809): frontend/native tests, package validation, installation/launch/uninstall passed.
- [Flatpak build 34700537258](https://github.com/gopalasubramanium/plainmark/actions/runs/34700537258): offline build, metadata validation and permission checks passed. [Runtime test 34702936754](https://github.com/gopalasubramanium/plainmark/actions/runs/34702936754) **failed** its accessibility assertion: native menu controls appeared, but WebKit document controls were absent. A captured desktop showed the actual portal-granted document. The cause is not yet established; do not call accessibility or all Linux file workflows verified.
- [Homebrew release sync 34698298591](https://github.com/gopalasubramanium/homebrew-plainmark/actions/runs/34698298591): completed successfully, preserving the immutable v0.3.3 preview downloads.

- [Homebrew verification run 34692177694](https://github.com/gopalasubramanium/homebrew-plainmark/actions/runs/34692177694): all checks passed, including installing the app and macOS signature, stapling and Gatekeeper checks.
- [Plainmark checks at the store-readiness commit](https://github.com/gopalasubramanium/plainmark/actions/runs/34691507365): passed on Linux, Windows and macOS.
- [Published release v0.3.3](https://github.com/gopalasubramanium/plainmark/releases/tag/v0.3.3): immutable preview; Mac direct downloads signed and notarized, Windows direct installer unsigned.
- Details and primary sources: [store readiness](STORES.md), [listing fields and product description](DISTRIBUTION-LISTING.md), [signing policy](SIGNING.md), [SignPath application record](SIGNPATH-APPLICATION-DRAFT.md).

The Homebrew tap is maintained by Plainmark's publisher. It is not acceptance into Homebrew's central cask repository. Store sign-in and opening a registration page are not app submission or certification. Store badges will be added only when real public listings exist.

## Visibility approach

Prioritize relevant distribution and discovery: working download/install channels, accurate editor categories, a useful screenshot, a clear free/open-source commitment and specific support links. AlternativeTo fits people looking for a simpler Markdown tool. Its normal review queue is free and may take months; no priority review or advertising has been purchased.

Hacker News currently prohibits generated or AI-edited text. The creator must personally write any Show HN post and discussion there. Flathub likewise has specific rules against agent-generated submission interactions. No automated posts or submission PRs have been made to those communities. Follow each destination's rules; do not post fake reviews, request artificial votes or imply independent endorsement.

Public downloads and directories can help people discover Plainmark; adoption depends on usefulness, reliability and real user feedback. The app should only become a user's default Markdown handler when that user chooses it.
