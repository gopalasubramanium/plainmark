# Mac App Store preparation

Created in App Store Connect on 12 September 2026:

- Display name: **Plainmark Markdown Editor** (Plainmark alone was unavailable).
- Apple app ID: `6811364319`.
- Bundle ID: `io.github.gopalasubramanium.plainmark`.
- Team: `TF2VBZ3XH7`.
- SKU: `plainmark-macos`.
- Draft version: `0.4.0`.
- Primary category: Productivity; English (U.S.).
- Account holder explicitly declared non-trader for all apps; Apple accepted the DSA declaration. Plainmark's app page shows non-trader.
- Version listing text, support/marketing links and private review contact saved. Do not commit private review contact details to the repository.
- Privacy answers published: Data Not Collected; public privacy-policy URL saved.
- Age-rating questionnaire completed: 4+ globally with Apple's regional equivalents; not specifically Made for Kids.

`Entitlements.plist` enables App Sandbox, user-selected file read/write access and outgoing-network access required by WKWebView. A local ad-hoc sandbox build without the network entitlement repeatedly lost its WebKit processes and showed a blank window; the same build rendered after adding it. This entitlement allows outgoing connections at the OS level; it does not itself enforce offline operation. The app CSP blocks remote images, scripts, fonts and requests, and Run HTML has its own restrictive CSP. No arbitrary home-folder access is granted. Folder paths and permissions are not restored across launches; persistent bookmarks are therefore not currently required for a promised reopen feature.

Local ARM sandbox tests passed editor launch, native Open, editing and saving an individually selected document, Save As to a new file, and recovery after restart. Mac saves now use Foundation’s same-volume replacement directory and replacement operation; the old sibling-temp-file approach failed under an individual-file grant. Native tests also cover creation, preserved permissions, read-only rejection, directory rejection, conflict protection and line endings. Full Store-distribution tests still need folder workspaces, local images and image insertion, linked notes, printing, Finder file activation, quit/recovery and restarts. Opening a file does not necessarily grant access to neighboring images; a user-selected folder is the intended way to grant a workspace. Diagnose actual sandbox failures before changing access. Never silently broaden permissions just to pass.

The final build requires a Mac App Store distribution certificate, an installer distribution certificate and a matching Mac App Store Connect provisioning profile, separate from the Developer ID certificate used for public DMGs. Put the profile at the ignored `src-tauri/app-store.provisionprofile` path and set the real Store signing identity when building. Do not put credentials or private keys into this repository.

Build a universal app using the App Store configuration, then package with Apple's `productbuild` and the installer identity. Validate the package before uploading and selecting it for review. The existing notarized DMGs are not Store packages. App Store screenshots must show the actual native edition at an accepted size.

License review is still required before submission: Plainmark is GPL-3.0-or-later, while Apple's default EULA contains redistribution restrictions. Do not silently substitute that EULA for the project's license, change licenses or claim the conflict is resolved. Check the complete linked dependency set and the exact proposed custom terms or additional permission with the rightsholder. The Run HTML feature must also be explained accurately to the reviewer.

Official instructions: [Tauri Store packaging](https://v2.tauri.app/distribute/app-store/), [Apple custom EULA](https://developer.apple.com/help/app-store-connect/manage-app-information/provide-a-custom-license-agreement), [Apple standard EULA](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/).
