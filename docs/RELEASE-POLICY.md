# Public release baseline

Accepted by the maintainer on 13 September 2026: **Plainmark's first public baseline is v0.4.0.** This decision supersedes the earlier practice of presenting the Store edition and older direct downloads as parallel current versions.

## Why this is the baseline

The Microsoft Store edition is already app version 0.4.0 (MSIX package 0.4.0.0), and the Apple submission is also 0.4.0. Using the same starting version for direct downloads, the website, source releases and Homebrew makes installation, support and release notes easier to follow. It also avoids renumbering an already published Store app.

This establishes a release baseline, not a promise that every operating-system configuration or workflow has been tested. Release maturity, known limitations, signing and store review remain separate facts. The first 0.4.0 GitHub release stays an early release/prerelease until the documented platform-readiness criteria are met. Do not call it a stable 1.0 product or imply approval by stores that have not approved it.

Coordinating channels adds release work, and stores can approve updates at different times. Do not delay a necessary security fix solely for a store review: publish verified channels at the new baseline, and clearly label the remaining channels as pending or previous-version fallbacks.

## Mandatory rules

1. **One current public app version.** The website, README, release notes and recommended download channels must identify the same baseline, starting with 0.4.0. Package-specific build/revision fields may differ; Windows 0.4.0.0 is displayed to users as app 0.4.0.
2. **Build the version being advertised.** Establish a baseline using freshly built, tested artifacts from its immutable source tag. Complete required signature, notarization, checksum and provenance checks before promoting the corresponding download. Do not rename or relabel a 0.3.3 binary as 0.4.0.
3. **Preserve release history.** Keep earlier tags and published artifacts unchanged. After matching baseline installers are available, remove older versions from the main download choices and retain them through clearly labeled release history. Never delete working recovery copies merely to simplify the public page.
4. **Separate availability from numbering.** Store approval can arrive later. Mark an unavailable baseline edition as “submitted,” “awaiting review,” or “not yet available.” Do not invent a different app version because a store is slow. If a channel must temporarily stay on an older release, label it as a previous-version fallback outside the baseline's main download choices.
5. **Advance deliberately.** Future fixes use the next patch version (for example 0.4.1); a feature release uses the next minor version (for example 0.5.0). Agree and document the supported compatibility expectations before declaring 1.0.0. A published version is never reused for changed app behavior. Store listing corrections that do not change the app or its package may reuse the existing version/build when the store allows it; record the metadata change and resubmission date separately. These numbering and immutability conventions follow [Semantic Versioning](https://semver.org/); 0.x does not imply a stable public API.
6. **Publish from reviewed source.** Future releases use one reviewed source tag across platforms, with platform-specific packaging, signing and build revisions recorded separately. Preserve each artifact's exact source commit and hash. The initial 0.4.0 Store submissions predate this policy; their platform-readiness commits remain explicitly recorded in the [Windows](../packaging/windows/README.md) and [Mac](../packaging/macos/README.md) records. Do not claim they were rebuilt from the later baseline tag.
7. **Update channels together.** Once verified baseline assets are public, update website links, README, release/signing records and the local recovery copy. Trigger the existing Homebrew synchronization and verify the result. Homebrew must use the same Mac downloads and pass its existing signature and provenance checks. Store-delivered artifacts retain their own verification record.

## Initial adoption

The Microsoft Store package is verified as 0.4.0.0 in the live Store presence. Apple has received 0.4.0 for review. Matching v0.4.0 GitHub installers are published, and Homebrew synchronized to the same verified Mac downloads. The website and README recommend the 0.4.0 baseline. Earlier releases, including 0.3.3, remain unchanged in release history. See [distribution evidence](DISTRIBUTION-STATUS.md) for build, signing, installation and synchronization results.

The Windows Store route remains the recommended Windows installation. A separate direct EXE must continue to disclose its unsigned status until that exact asset has a verified publisher signature. Keep the app free, without ads, tracking, paid features or required app accounts.
