# Linux store preparation

The AppStream metadata and matching desktop entry are initial store metadata for Plainmark. They are **not a Flatpak or Snap package** and are not installed by the current release workflow. No Linux store submission has been made.

For Flatpak, install these files under `/app/share/metainfo/` and `/app/share/applications/`, and install icons under the application ID in the appropriate `hicolor` directories. Add a reproducible manifest with a maintained runtime, offline dependency sources and tested portal permissions. Do not grant all home-directory access simply to make a build run. Validate the finished bundle with `appstreamcli validate`, `desktop-file-validate` and the current Flathub tooling.

The metadata deliberately marks v0.3.3 as a development release. Flathub requires stable software for new submissions. Its policy also requires the human maintainer to write and submit the PR and review responses, with disclosure of AI assistance. See [store readiness](../../docs/STORES.md). This directory contains no Flathub PR text.

For Snap, register the publisher/name through the Snap Store account, prepare a strictly confined recipe, and test file portals, workspace images, saving and single-instance D-Bus access. Use a testing channel before considering stable publication. The existing `.deb` and AppImage have not yet passed those store confinement checks.
