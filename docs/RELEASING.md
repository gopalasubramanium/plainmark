# Releasing Plainmark

The `Release` workflow builds Windows x64, Linux x64, and Apple Silicon/Intel macOS installers and attaches them to a **draft GitHub prerelease**. A failed matrix job leaves the release as a draft; nothing is automatically promoted to stable.

## Prepare

1. Update the version consistently in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, and the UI version text. Refresh lockfiles as needed.
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

There is no in-app updater or background version check. Users obtain updates explicitly from GitHub Releases.
