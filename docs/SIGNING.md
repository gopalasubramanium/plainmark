# Trusted distribution

The **v0.3.3 draft Mac apps and DMGs are Developer ID-signed, Apple-notarized, and verified by Gatekeeper** for Apple Silicon and Intel. Windows remains unsigned and the release remains a draft. The older published v0.2.2 preview still has ad-hoc Mac signatures and an unsigned Windows installer. Build provenance and checksums serve a different purpose from OS publisher signatures; describe the status of the exact downloaded asset.

## macOS

The [verified macOS signing run](https://github.com/gopalasubramanium/plainmark/actions/runs/34689043975) signs both Apple Silicon and Intel packages, requires real credentials, checks Developer ID and the expected team, verifies the hardened runtime, and validates stapled notarization tickets and Gatekeeper assessments for **both the app and its outer DMG**. App notarization alone is not enough to establish the DMG's download trust. Fresh downloads passed those checks locally, and apps inside read-only mounted DMGs matched the corresponding archives. The Apple Silicon app launched successfully. A physical Intel Mac installation has not been tested. The workflow leaves the release as a draft and fails rather than silently producing an ad-hoc build.

The publisher needs an active [Apple Developer account](https://developer.apple.com/account/) and a valid Developer ID Application identity. The original signing key is retained in the local login Keychain; an encrypted certificate/key export and notarization credentials are stored in GitHub environment secrets. No private key export or plaintext credential file is committed to the project.

Use a **Developer ID Application** certificate for distribution outside the Mac App Store. Add the following through GitHub's encrypted `release-signing` environment secrets, never source files or chat: `APPLE_CERTIFICATE` (exported P12 encoded as base64), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (an Apple **app-specific** password, not the account password), and `APPLE_TEAM_ID`. The environment permits workflow runs from `main` only, requires the maintainer's approval before credentials are available, and disables administrator bypass. The workflow separately validates the requested unpublished version tag and serializes signing with ordinary builds of the same tag. Certificates and account authorization must belong to the responsible publisher.

First complete the ordinary all-platform release checks for a new, unpublished version tag. Then dispatch the signed workflow with that exact tag. Verify both architectures and fresh-download installation before publishing the draft. Never silently replace binaries in an already public release: use a new version. [Apple Developer ID](https://developer.apple.com/developer-id/) and [Tauri's signing and notarization guidance](https://v2.tauri.app/distribute/sign/macos/) describe the platform requirements.

## Windows

No signing account or certificate has been established. The recommended first application is [SignPath Foundation](https://signpath.org/), which supports eligible open-source projects without charging the project for signing. Approval, policy compliance, artifact configuration and access setup are required; free service is not automatic. A draft application is included in `SIGNPATH-APPLICATION-DRAFT.md`; it has not been sent.

After approval, configure the official SignPath integration so it signs the application executable inside the installer and the outer NSIS installer, preserving the artifact structure and provenance. Authorize production signing only for reviewed version tags and require the maintainer to approve signing requests. Download the returned signed artifact, verify its contents, then run `scripts/verify-windows-signature.ps1` with the actual approved publisher subject. This script fails unless the outer installer has a valid Authenticode signature, matching publisher and timestamp; verify the installed executable too. The provider configuration cannot be completed until SignPath supplies the project/artifact/policy identifiers. Do not claim Foundation sponsorship or add its required sponsorship credit before acceptance.

An alternative is an eligible certificate authority or [Microsoft Artifact Signing](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart). Microsoft's current public-trust eligibility includes Singapore organizations but individual developers only in the United States and Canada. Choose the correct legal identity; do not create an organization or misstate a country to bypass eligibility. Any paid service requires a separate cost decision.

A valid signature identifies the publisher and detects tampering. It does not guarantee that every new binary passes SmartScreen without a warning; Microsoft explicitly distinguishes signing from reputation and enterprise policy. EV certificates no longer provide an immediate universal bypass. Microsoft Store distribution is a separate possible route requiring account, packaging and review. [Microsoft's current explanation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation).

## Linux and reproducible provenance

There is no one Linux-wide equivalent of Apple's notarization approval. Publish Debian and AppImage checksums and GitHub artifact attestations linking the exact installers to their source/workflow. Release jobs prepare these after building. Consumers can verify an artifact with `gh attestation verify <downloaded-file> --repo gopalasubramanium/plainmark`, and compare its SHA-256 against the corresponding release checksum file. A checksum downloaded from the same compromised origin would not independently establish authenticity.

The Debian desktop entry, MIME registration and actual packaged launch command are checked in Linux CI. Future distribution through a maintained package repository or Flathub would add platform-specific review and signing, with separate packaging work. Source availability alone does not establish bit-for-bit reproducibility across machines; that property has not been proven.

## Release decision

A release is ready to be described as trusted only when its platform-specific checks succeed and actual installation has been verified on that platform. Document signature status per asset. OS defaults remain the user's choice through Open with / default-app settings. A signature cannot force adoption, bypass organizational restrictions or guarantee a warning-free installation on every machine.
