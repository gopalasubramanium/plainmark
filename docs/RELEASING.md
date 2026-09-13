# Releasing Plainmark

The `Release` workflow builds Windows x64, Linux x64, and Apple Silicon/Intel macOS installers and attaches them to a **draft GitHub prerelease**. A failed matrix job leaves the release as a draft; nothing is automatically promoted to stable.

Follow the accepted [public release baseline policy](RELEASE-POLICY.md): v0.4.0 is the first baseline, with one current app version across recommended downloads. Earlier versions remain release history. Version alignment never replaces artifact verification or store approval.

## Prepare

1. Update the version consistently in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, and the example version in the Windows package manifest. The Windows packager derives the actual MSIX version from `package.json`. The UI also reads the version from `package.json`; do not add a separately maintained UI version. Refresh lockfiles as needed.
2. Run the checks in the README. The release pipeline runs its own build/tests before packaging.
3. Check the release notes, known limitations, and third-party notices.
4. Commit and push to `main`, then push the matching tag:

```sh
git tag v0.1.0
git push origin v0.1.0
```

You can also run the workflow manually against a version tag, using the Actions page. Run it against a tag, not `main`.

## Review and publish

Wait for all build jobs to finish. Inspect the draft assets, try the installers on the supported platforms, and keep unsupported/unverified behavior documented. Publish the draft as a prerelease for an early version. Promote to stable only after platform installation and file-dialog smoke tests pass.

The Linux build also extracts the actual `.deb` and AppImage, validates their desktop entries and MIME declarations, and launches each entry through GIO with several Markdown files. A capture executable verifies that spaces, Unicode, and all selected paths survive the Open with handoff. To repeat this check on Linux, install `desktop-file-utils`, `shared-mime-info`, and `libglib2.0-bin`, then run `python3 scripts/check-linux-packages.py src-tauri/target/release/bundle` (add the target triple to the path for cross-target builds).

GitHub’s source archives for the version tag provide the matching source alongside binaries. The app bundles the project license and generated third-party notices. To generate notices independently:

```sh
pnpm notices
```

## Signing

The initial pipeline uses ad-hoc macOS signing and unsigned Windows packages. It does not claim a verified publisher. Trusted signing/notarization needs maintainer-owned credentials and potentially external costs; those costs must never create a paid user tier.

Before changing this, follow the official [macOS signing](https://v2.tauri.app/distribute/sign/macos/) and [Windows signing](https://v2.tauri.app/distribute/sign/windows/) guides. Store signing credentials as GitHub Actions secrets, never in the repository. Do not remove platform security protections to make an unsigned build appear trusted.

There is no in-app updater or background version check. Direct-download users obtain updates from GitHub Releases; Homebrew updates its cask from verified Mac releases, and Store editions use their store’s update mechanism.

## Security and publisher signing

All dependency audits and the explicit GLib backport verification must pass. Rust maintenance warnings remain visible for review. External Actions are pinned to commit hashes. Review any pin update before merging it.

Release builds add per-platform SHA-256 files and GitHub artifact attestations after packaging. Verify them against the exact downloadable files, not an earlier local build. Leave the release as a draft until platform installation and signature status have been checked.

The dedicated signed-macOS workflow can replace Mac artifacts only in an unpublished draft after the ordinary release workflow succeeds. It refuses missing signing credentials, checks Developer ID, hardened runtime, notarization and Gatekeeper, and leaves the release as a draft. Windows requires provider onboarding and signing of both the inner executable and installer. Follow [SIGNING.md](SIGNING.md); source preparation is not proof of successful signing.

`DEPENDABOT-PENDING.yml` is a prepared configuration, not active automation. Additional dependency-alert settings, automated fix PRs and weekly scans await explicit maintainer approval.

## Homebrew synchronization

The official `gopalasubramanium/homebrew-plainmark` tap stores installation metadata, not application source. Its scheduled workflow checks public releases every four hours and can also be started manually. Before changing cask version/hash values it verifies both Mac artifacts, GitHub attestations, the separately attested source-binding manifests, Developer ID/team, notarization, stapling and Gatekeeper, then installs/audits the cask. Keep the signing workflow’s per-architecture provenance JSON assets with each future Mac release. A missing proof, changed hash for an existing version, or failed validation stops synchronization. The immutable v0.3.3 preview remains the current cask until a newer complete verified release is published.

## Versions across download channels

Use one app version (`major.minor.patch`) for a release across Windows, macOS and Linux. Windows MSIX adds a fourth numeric package revision: app version `0.4.0` is packaged as `0.4.0.0`. Keep a store's build/revision identifier separate from the app version shown to users.

Prepare future releases from one reviewed source tag, with platform-specific packaging and signing. Run `scripts/check-version.mjs` to verify the package/Tauri/Cargo versions and release tag. The Windows packaging workflow derives the packaged manifest version from the app version and validates the MSIX using MakeAppx. Record each artifact's source commit, version, signature status and publication status. A later app-code fix must receive a new app version; never move a published tag or relabel older binaries to look current.

Store reviews and direct-download publishing can finish at different times. Keep “submitted,” “available,” and “preview” distinct. The main download choices must all offer the current baseline; place any previous-version fallback in clearly labeled release history. Store approval does not by itself make every platform's release stable. Before publishing a new release, update the website cards, README channel table and distribution record together. Homebrew advances only after the matching signed and notarized GitHub Mac assets pass its existing verification workflow.

The current transition is explicit: Microsoft Store's live submission is `0.4.0.0`, corresponding to app `0.4.0`; the Apple submission is `0.4.0`; public GitHub installers and Homebrew remain `0.3.3` preview. These existing Store submissions came from the platform-readiness commits documented in their packaging records, so they are not represented as a single tagged cross-platform release. Publication of matching direct installers requires a separate built, tested and signed release.
