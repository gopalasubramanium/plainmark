# Mac App Store submission

Created in App Store Connect on 12 September 2026:

- Display name: **Plainmark Markdown Editor** (Plainmark alone was unavailable).
- Apple app ID: `6811364319`.
- Bundle ID: `io.github.gopalasubramanium.plainmark`.
- Team: `TF2VBZ3XH7`.
- SKU: `plainmark-macos`.
- Submitted version/build: `0.4.0` / `0.4.0`.
- Submission: `2e5cbcc0-112c-4948-bf50-5d528fd2e9a7`, **Waiting for Review**, submitted 13 September 2026 at 00:57 Singapore time. Automatic release after approval is selected.
- Primary category: Productivity; English (U.S.).
- Account holder explicitly declared non-trader for all apps; Apple accepted the DSA declaration. Plainmark's app page shows non-trader.
- Version listing text, support/marketing links and private review contact saved. Do not commit private review contact details to the repository.
- Privacy answers published: Data Not Collected; public privacy-policy URL saved.
- Age-rating questionnaire completed: 4+ globally with Apple's regional equivalents; not specifically Made for Kids.

`Entitlements.plist` enables App Sandbox, user-selected file read/write access and system printing and outgoing-network access required by WKWebView. A local ad-hoc sandbox build without the network entitlement repeatedly lost its WebKit processes and showed a blank window; the same build rendered after adding it. This entitlement allows outgoing connections at the OS level; it does not itself enforce offline operation. The app CSP blocks remote images, scripts, fonts and requests, and Run HTML has its own restrictive CSP. No arbitrary home-folder access is granted. Folder paths and permissions are not restored across launches; persistent bookmarks are therefore not currently required for a promised reopen feature.

Local ARM sandbox tests passed editor launch, native Open, editing and saving an individually selected document, Save As to a new file, and recovery after restart. Mac saves now use Foundation’s same-volume replacement directory and replacement operation; the old sibling-temp-file approach failed under an individual-file grant. Native tests also cover creation, preserved permissions, read-only rejection, directory rejection, conflict protection and line endings. Additional tests on the isolated sandbox build passed opening a chosen workspace, rendering its local SVG and math, following a local linked note into another tab, and saving exact expected text in the workspace. A native print attempt initially failed because the printing entitlement was absent. Adding `com.apple.security.print` produced the system print dialog and a rendered one-page preview. Final PDF output, image insertion, Finder activation and full Store-signed runtime testing still need verification. The native print test used the isolated ad-hoc sandbox identity; it is not a claim of Apple review or of testing the final Store package. Opening a file does not necessarily grant access to neighboring images; a user-selected folder is the intended way to grant a workspace. Diagnose actual sandbox failures before changing access. Never silently broaden permissions just to pass.

The Store certificates were issued and installed in the publisher's login Keychain on 12 September 2026, separately from the Developer ID identity used for public DMGs:

- `3rd Party Mac Developer Application: Gopala Subramanium (TF2VBZ3XH7)`, certificate `4359F7WQG5`.
- `3rd Party Mac Developer Installer: Gopala Subramanium (TF2VBZ3XH7)`, certificate `Z45SCR4535`.
- Mac App Store profile `Plainmark Mac App Store 2026`, profile `62TWP9XUWK`, UUID `4531a86b-f88e-433f-95e4-26196d4a0e10`, staged at the ignored `src-tauri/app-store.provisionprofile` path.

A universal 0.4.0 package was built from `6db84b65e92127bdba182c83576612a89ec0dc24` with the App Store configuration and packaged with `productbuild`. Both Intel and Apple Silicon slices, strict app signature, sandbox/printing entitlements, embedded profile, approved license permission, encryption declaration and installer certificate chain verified locally. Submitted installer SHA-256: `10fea1569784df82a3b98eddc18d19bd72b443969d04cfce28ffcfa6490753d9` (6,962,605 bytes). Transporter confirmed delivery at 00:42 Singapore time on 13 September; App Store Connect marked upload processing Complete and the build Ready to Submit. The completed listing was then submitted and is Waiting for Review. Earlier local candidates without the final license permission were not uploaded. Store credentials were not exported to GitHub and do not overwrite the existing direct-release signing secrets. No private keys or credentials belong in this repository.

The submitted screenshot shows the actual native Mac visual editor with a selected folder and two local document tabs, captured from an isolated sandbox build of the submitted source. Its original 2,784 × 1,770 pixels were preserved inside a white 2,880 × 1,800 canvas after the publisher approved standard local image formatting. The screenshot was not generated or altered by AI. Apple accepted it for the listing. Mermaid and math rendering were also visibly verified in that build. The Store-signed package could not be launched directly before Store distribution (launch error 163); do not confuse the ad-hoc sandbox test with installing the Store-delivered edition.

Free pricing and availability in all 175 supported territories are saved.

Build a universal app using the App Store configuration, then package with Apple's `productbuild` and the installer identity. Validate the package before uploading and selecting it for review. The existing notarized DMGs are not Store packages. App Store screenshots must show the actual native edition at an accepted size.

The publisher approved and granted the narrow Apple Store permission on 13 September 2026. The GPL text remains unchanged, and both the permission and dependency license/source record are included with the bundled notices. The Store edition selects EPL-2.0 for ELK, Apache-2.0 for DOMPurify, MPL-2.0 for the relevant Rust crates, and MIT for r-efi. See [the license and source record](../../docs/APPLE-STORE-LICENSES.md). Apple’s standard EULA is used for the Store executable under that permission; source rights and third-party notices remain intact. The Run HTML feature is described in the review notes.

`Info.plist` declares no non-exempt encryption: Plainmark has no encryption feature or custom encryption protocol; any platform TLS is provided by Apple. [Apple's encryption documentation table](https://developer.apple.com/help/app-store-connect/reference/app-information/export-compliance-documentation-for-encryption/) says no App Store Connect documentation is required for encryption limited to the operating system.

Official instructions: [Tauri Store packaging](https://v2.tauri.app/distribute/app-store/), [Apple custom EULA](https://developer.apple.com/help/app-store-connect/manage-app-information/provide-a-custom-license-agreement), [Apple standard EULA](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/).
