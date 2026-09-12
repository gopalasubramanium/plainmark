# Linux store preparation

`io.github.gopalasubramanium.plainmark.yml` is a development Flatpak manifest for the GNOME 50 runtime, with Node 24 and Rust SDK extensions. The `Flatpak sandbox build` workflow builds entirely offline after source downloads, runs the native file-store tests, validates metadata, installs the package and prints/checks its permissions. This is not a Flathub submission or an accepted store package.

The manifest requests graphics/display access only. It does not grant network, all devices, home-directory or host-filesystem access. Linux file and folder dialogs use XDG portals. The system handles chosen-file grants; Plainmark additionally enforces its own document/workspace scopes. The app identity also scopes its single-instance D-Bus name. Test actual opening, saving, Save As, local images, linked notes, folder grants, printing and existing-instance file activation before release. A successful compilation does not establish those behaviors.

## Dependency sources

The generated manifests come from `flatpak/flatpak-builder-tools` revision `de2225a6dee4818c1339b3cdbf29f90c471fcb7e` and the application's checked-in lockfiles:

```sh
flatpak-node-generator --no-requests-cache --pnpm-store-version v11 -o packaging/linux/node-sources.json pnpm pnpm-lock.yaml
python3 /path/to/flatpak-builder-tools/cargo/flatpak-cargo-generator.py src-tauri/Cargo.lock -o packaging/linux/cargo-sources.json
```

Remove generated source entries whose `dest` starts with `flatpak-node/cache/ms-playwright/`: these are unused test-browser downloads, not application or build dependencies. Their JavaScript package tarballs remain locked and available. Browser end-to-end tests run in the main CI, outside the Flatpak compiler sandbox. Node, pnpm, Rust and dependency caches are build tools only; they are not installed into the resulting application.

For local development on Linux, install the runtimes/extensions from Flathub and run:

```sh
flatpak-builder --user --force-clean --sandbox --repo=flatpak-repo flatpak-build packaging/linux/io.github.gopalasubramanium.plainmark.yml
```

Before a human maintainer submits to Flathub, replace the local directory source with the exact stable upstream tag and commit, regenerate dependency manifests from that release, validate using current Flathub lint tooling, and provide genuine Linux screenshots. GNOME 50 is the current stable runtime assessed on 12 September 2026; recheck it at submission time.

The current public release remains the v0.3.3 preview. Flathub accepts stable new submissions only, generally expects meaningful project history and real-world use, and requires a human to write and submit the PR and review interactions with disclosure of affected AI-assisted code/documentation/packaging and approximate extent. This directory contains packaging work, not Flathub submission text. See [current requirements](https://docs.flathub.org/docs/for-app-authors/requirements).

Snap packaging and confinement testing remain separate work. The existing Debian and AppImage downloads do not establish either store's sandbox compatibility.
