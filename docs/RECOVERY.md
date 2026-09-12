# Project continuity and recovery

The source repository is the authoritative record of Plainmark's code, lockfiles, tests, build workflows, licenses, website and project decisions. Keep a separate recovery snapshot in addition to an ordinary working clone. A clone alone does not preserve GitHub release assets, issues, repository settings or signing credentials.

## What a recovery snapshot should contain

- An independent working clone, a bare Git mirror and a self-contained `git bundle` containing every branch and tag.
- All release metadata and original installer/checksum assets, including drafts clearly marked as drafts. Verify every asset's size and SHA-256 against the GitHub release metadata.
- GitHub repository, branch/tag, label, milestone, issue/comment, pull-request/review, Pages, workflow, environment and permission metadata. Record unavailable endpoints honestly.
- Build provenance attestations and the final signed-release verification evidence, alongside a human-readable explanation of the app source commit and signing-workflow commit.
- Website DNS/Pages restoration instructions, release/signing processes, store application status, research, privacy/security boundaries and unresolved work.
- A checksum manifest and an independently tested restore from the bundle into a new empty directory.
- Any separate distribution repositories, such as the official Homebrew tap, with their own complete history and metadata.

Keep recovery exports outside tracked source or locally exclude `.recovery/` through `.git/info/exclude`. Do not commit private repository metadata or credentials to the public project.

## Restore source safely

1. Verify the snapshot checksum manifest before relying on it.
2. Run `git bundle verify` against the saved bundle. Clone it into a **new empty directory**, select `main`, and compare HEAD and tags with the snapshot's recorded values. Run `git fsck --full`.
3. Reinstall dependencies from `pnpm-lock.yaml` and `Cargo.lock`, following the current [build instructions](../README.md#build-from-source). Build dependencies and platform SDKs are not backed up binaries; registry availability is still required unless separately vendored. Build the historical release with that release's own lockfiles and source.
4. To republish elsewhere, create a new empty repository and push the restored branches and tags. Do not push a mirror over an existing repository without explicitly reviewing which remote refs would be deleted.
5. Recreate releases from their recorded metadata and original assets, preserving tag, title, body, draft and preview states. Do not promote an old draft or change an existing public tag. Check every restored asset hash.
6. Recreate the repository settings, protected signing environment, review gates and Pages configuration. Update the website/download URLs if the repository owner or location changes.
7. Re-enter or rotate required credentials through the platform's protected secret entry mechanisms, then run the documented checks before signing or publishing a new version.

## Recovery boundaries

GitHub never returns stored secret values. Export their **names and configuration**, not alleged copies of their values. Apple private keys, app-specific passwords, Windows signing credentials, account recovery codes, Cloudflare credentials and store identity documents need separate protected custody. Do not put them in Git, plain text notes, shell history or a public recovery archive.

GitHub metadata exports are archival evidence, not a perfect replay of the service. New issue/PR/release IDs and timestamps will differ; original authorship, review state, stars, watchers, fork networks, account verification and expired Actions logs/artifacts cannot all be recreated. Historic pull requests cannot simply be restored by pushing Git refs. DNS and developer-store accounts exist outside GitHub.

A verified copy on the same computer protects against a lost or damaged GitHub repository but not loss of that computer. Keep another encrypted copy on an independent drive or backup destination, and periodically verify that its bundle and release hashes still restore.

## Process map

- [Release procedure](RELEASING.md) and [code signing](SIGNING.md)
- [Website and Cloudflare DNS](WEBSITE.md)
- [Store readiness](STORES.md), [current distribution status](DISTRIBUTION-STATUS.md), [listing material](DISTRIBUTION-LISTING.md)
- [SignPath application](SIGNPATH-APPLICATION-DRAFT.md)
- [User research and priorities](RESEARCH.md), [feature scope](FEATURES.md)
- [Project principles](../PRINCIPLES.md), [privacy](../PRIVACY.md), [security](../SECURITY.md), [contribution process](../CONTRIBUTING.md)
