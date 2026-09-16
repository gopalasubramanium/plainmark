# SignPath Foundation application record

**Status: Foundation application declined on 16 September 2026. The application was submitted on 12 September with maintainer authorization. No signing subscription, certificate access or sponsorship was approved.**

The provider explained that Plainmark does not yet have enough public adoption, independent references and sustained activity for a Foundation certificate. It explicitly distinguished that decision from an assessment of the app’s quality and invited reapplication after broader recognition. This status is based on the provider response shared by the maintainer; the private email is not reproduced here.

Plainmark will use the Microsoft Store web installer as its primary Windows download. Microsoft handles signing of Store MSIX packages at no signing cost. The separate GitHub EXE remains unsigned. No paid subscription was started. See [Windows signing and distribution](SIGNING.md#windows).

Project: Plainmark
Repository: https://github.com/gopalasubramanium/plainmark
Website: https://markdown.eksaar.com/
Maintainer: Gopala Subramanium
Public profile: https://me.sgopala.com
License: GPL-3.0-or-later
Maintainer type: Individual maintainer(s)
Build system: GitHub Actions

## Submitted description

Plainmark makes everyday Markdown reading and writing accessible without fees, ads, tracking or bundled offers. It works with ordinary local files and provides visual editing and a source view for both everyday documents and technical writing. Official releases are always free, and the source is available under GPL-3.0-or-later. We seek trusted Windows signing for our own application and installer, built from public version tags through GitHub Actions.

The application disclosed that Plainmark launched on 11 September 2026 and does not yet have established community adoption or independent reviews. At application preparation the public repository had zero stars, zero forks and 28 aggregate release-asset downloads. Those downloads may include maintainer verification and are not unique-user counts. Public build history, releases and the maintainer profile were provided; acceptance is not assumed.

The maintainer authorized the required code-signing terms and data-processing consent. Optional marketing consent was not selected. The contact address is intentionally omitted from this public record.

## If a future application is approved

- Reapply only after the project has established the external adoption and visibility the Foundation requested; record an actual approval before integration.
- Verify MFA on the repository and new signing account before production use.
- Configure trusted GitHub build origin and maintainer approval for each production request.
- Restrict signing to Plainmark's executable and installer, with consistent product and version metadata. NSIS needs signing before packaging for the inner executable and uninstaller, then signing of the outer installer; an outer PE signature alone does not sign its contents. Agree this configuration with the provider rather than assuming recursive NSIS support.
- Store the provider's actual project, artifact and policy identifiers and encrypted credentials. No Windows signing secret currently exists.
- Build and sign a new unpublished version, verify the installer and its actual contents with Windows Authenticode, update checksums and attestations, and perform installation checks. Do not replace published binaries or move existing release tags.
- Add the Foundation's required service/certificate credit only after acceptance; until then the project must not imply sponsorship.

## Sources

[Application](https://signpath.org/apply.html) · [Foundation terms](https://signpath.org/terms.html) · [GitHub integration](https://docs.signpath.io/trusted-build-systems/github) · [Supported artifact formats](https://docs.signpath.io/artifact-configuration/reference) · [Tauri custom signing](https://v2.tauri.app/distribute/sign/windows/#custom-sign-command)
