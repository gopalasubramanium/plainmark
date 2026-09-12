# Apple Store licenses and source availability

Gopala Subramanium approved the narrow Apple Store distribution permission on
13 September 2026. The grant is recorded in
[LICENSE-APPLE-STORE-EXCEPTION.txt](../LICENSE-APPLE-STORE-EXCEPTION.txt).
Plainmark's source remains GPL-3.0-or-later; the GPL text is unchanged. The grant
covers the maintainer's own code, not `src-tauri/vendor/` or upstream libraries.
At the time of this grant, the Git author inventory contains only the maintainer.

The Apple Store executable may use Apple's standard EULA under this permission.
The source code, build instructions and lockfiles remain publicly available at
https://github.com/gopalasubramanium/plainmark. Apple's executable usage terms do
not remove the rights granted for source code under the relevant open-source
licenses. Do not put the private App Review telephone number in a public EULA.

## Dependency choices for the Store edition

The distributed notice inventory preserves the upstream license texts. Its
entries include build-time and platform-specific libraries; inclusion in that
inventory does not mean every component is linked into the Mac executable.

| Component | Selected license | Preferred source |
| --- | --- | --- |
| elkjs 0.12.0 and its ELK implementation | EPL-2.0, rather than its GPL secondary alternative | [elkjs source and build scripts](https://github.com/kieler/elkjs/tree/ff5771d7165445c42c408bb8a090c8035272218c), [ELK 0.12.0 Java/Xtend sources](https://github.com/eclipse-elk/elk/tree/323312916048544e4e594eab3303cdb0d01e2929) |
| DOMPurify 3.4.15 | Apache-2.0 alternative | [Published source package](https://www.npmjs.com/package/dompurify/v/3.4.15) |
| cssparser 0.36.0 | MPL-2.0 | [Source archive](https://crates.io/api/v1/crates/cssparser/0.36.0/download) |
| cssparser-macros 0.6.1 | MPL-2.0 | [Source archive](https://crates.io/api/v1/crates/cssparser-macros/0.6.1/download) |
| dtoa-short 0.3.5 | MPL-2.0 | [Source archive](https://crates.io/api/v1/crates/dtoa-short/0.3.5/download) |
| option-ext 0.2.0 | MPL-2.0 | [Source archive](https://crates.io/api/v1/crates/option-ext/0.2.0/download) |
| selectors 0.36.1 | MPL-2.0 | [Source archive](https://crates.io/api/v1/crates/selectors/0.36.1/download) |
| r-efi 5.3.0 and 6.0.0 (platform-specific inventory) | MIT alternative | Exact source archives linked in the bundled notices and recorded in Cargo.lock |

The ELK worker is generated JavaScript: its npm bundle alone is not the preferred
form for editing the layout engine. The links above include the Java/Xtend source,
the elkjs JavaScript API and emulation files, and the Gradle/GWT build instructions.
ELK and the listed MPL components are used without local source changes. Plainmark's
GLib security backport, relevant to Linux, remains separately identified and
available in `src-tauri/vendor/glib` under its upstream MIT license.

EPL 2.0 sections 3.1–3.3 permit a different distribution license while preserving
source rights, notices, warranty/liability disclaimers and subsequent-distribution
requirements. MPL 2.0 sections 3.1–3.3 preserve the covered source and allow an
executable or larger work under different terms. This edition chooses those
licenses explicitly; it does not apply Plainmark's additional permission to them.

For the EPL components, all upstream contributors disclaim warranties and
conditions, express or implied, including title, non-infringement, merchantability
and fitness for a particular purpose, and liability for direct, indirect, special,
incidental and consequential damages, including lost profits, to the extent
permitted by applicable law. Any subsequent distribution of those components must
comply with EPL 2.0 section 3, including source availability and these protections.
The EPL and MPL source remains available under its respective license. Nothing in
the Store executable terms limits the recipients' rights in that source.

Other components retain their licenses, which are reproduced in the bundled
`THIRD_PARTY_NOTICES.txt`. For permissive alternatives, use MIT, Apache-2.0, BSD,
ISC or the other applicable permissive license; do not silently switch a component
to a copyleft alternative. Preserve attribution, license and notice files.

## References

- [GPL v3, sections 7 and 10](https://www.gnu.org/licenses/gpl-3.0.html)
- [Apple standard EULA](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/)
- [EPL 2.0](https://www.eclipse.org/legal/epl-2.0/)
- [MPL 2.0](https://www.mozilla.org/en-US/MPL/2.0/)

Recheck this inventory whenever dependencies change. An Apple approval, if granted,
is a store review result, not a determination of third-party copyright ownership.
