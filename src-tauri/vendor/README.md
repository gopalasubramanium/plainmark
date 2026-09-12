# GLib security backport

`glib/` is the unmodified published `glib` 0.18.5 source, except for the two-line upstream fix in `src/variant_iter.rs`. Its original MIT license is retained and included in Plainmark's bundled notices. This adds no new runtime feature or binary dependency.

Tauri's GTK3 stack uses GLib 0.18. Upgrading this one crate to 0.20 would produce incompatible Rust types across the GTK bindings. The backport fixes the mutable out-pointer in `VariantStrIter::impl_get`, exactly as in [gtk-rs-core PR 1343](https://github.com/gtk-rs/gtk-rs-core/pull/1343), addressing [RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html). Remove the backport when Tauri's complete Linux stack uses a fixed compatible release.

Upstream archive SHA-256: `233daaf6e83ae6a12a52055f568f9d7cf4671dabb78ff9560ab6da230ce00ee5` (`glib` 0.18.5 on crates.io). `scripts/check-glib-backport.py` compares every vendored file against that checksum-verified archive and allows only the upstream fix. Linux CI also exercises the affected iterator under release optimization.

Cargo advisory scanning does not audit path dependencies. The explicit archive comparison is therefore mandatory; a clean Cargo scan alone does not validate this backport. The rest of GTK3 and GLib's maintenance status remains an upstream constraint.
