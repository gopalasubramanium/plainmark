# Contributing to Plainmark

Thanks for helping make a small, useful tool. Read [the project principles](PRINCIPLES.md) before proposing a change.

For a bug, include your OS and version, Plainmark version, steps to reproduce, expected behavior, and a small non-sensitive Markdown example if relevant. Please do not upload private documents, credentials, or personal data.

For a larger feature, open an issue first so its scope can be discussed. Small bug fixes and documentation corrections can go directly to a pull request.

## Development

1. Follow the setup in the README and create a branch.
2. Keep the change focused and avoid unrelated reformatting.
3. Run `pnpm build`, `pnpm test`, and relevant browser tests with `pnpm test:e2e`.
4. For native changes, run `cargo fmt --manifest-path src-tauri/Cargo.toml` and `cargo test --locked --manifest-path src-tauri/Cargo.toml`.
5. Describe the user-visible behavior, your validation, and any limitations in the pull request.

Tests should protect real behavior or a known failure, not repeat implementation details. Use semantic HTML and labeled controls, retain keyboard access, and respect reduced-motion preferences. No CDN fonts, analytics SDKs, network-loaded editor code, or hidden filesystem access.

Contributions are provided under GPL-3.0-or-later, consistent with the project license. Please submit work you have the right to contribute. There is no copyright assignment requirement.

Be kind, specific, and constructive. Critique the work, not the person.
