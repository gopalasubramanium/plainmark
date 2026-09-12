# Plainmark: Markdown usability, privacy and trusted distribution

Plainmark should earn adoption by making ordinary documents dependable: open a file without setup, edit without losing its meaning, find related notes, include pictures, and share a readable result. Everyday writing and technical documentation deserve equal priority. A pleasant visual editor helps both groups, but reliable saves, predictable Markdown, private defaults and straightforward installation matter more than a long feature list.

This assessment covers public evidence available on 12 September 2026 and the Plainmark 0.3 development changes (0.3.1 release candidate). It identifies recurring failure classes and explains the resulting product decisions. It does not claim to measure the percentage of Markdown users affected or establish a statistically representative ranking. Public issue trackers overrepresent problems, forum threads can include promotion, and developers are more visible in these sources than occasional document users. Historical and closed issues are used as regression examples, not evidence that a competing product remains broken today.

## Evidence and priorities

Three kinds of evidence are useful together. Specifications explain the ambiguities that implementations must resolve. Maintainer documentation and release discussions explain supported behavior and known limits. First-person reports reveal the interrupted task: a screenshot that will not paste, a lost checkbox, a preview that jumps, or a file that becomes slow to edit. Agreement across these categories justifies a design priority; a single complaint does not establish prevalence.

CommonMark documents how seemingly simple constructs such as nested lists, references and indentation can admit inconsistent interpretations. Joplin explicitly documents limitations when rich text is stored as Markdown, including normalization of reference links and constraints around tables, lists, plugins and HTML. These are structural interoperability problems, not just cosmetic disagreements between editors.[^1][^2]

Current maintainer activity also provides useful counterevidence to the idea that every alternative is paid, advertising-supported or abandoned. MarkText's 2026 release-candidate discussion describes continued work on input methods, anchors, paste, formatting and export. Zettlr's release notes record fixes to clipboard and newline behavior. Plainmark can make a principled free offering while acknowledging the existing free-software community.[^3][^4]

The following order is a product judgment based on severity, recurrence across sources and fit with a small local desktop app. It is not a popularity chart.

| Priority | Interrupted task | Everyday use | Technical use | Plainmark response |
| --- | --- | --- | --- | --- |
| First | Edits or document meaning are lost | Notes, lists, tables, recovery | References, frontmatter, code, line endings | Preserve files, protect saves, keep unsupported syntax in Source |
| First | Pictures and related notes are awkward | Paste screenshots, find a document | Relative assets and linked documentation | Image insertion, scoped links, Quick Open |
| First | Installation does not inspire trust | Security warnings, wrong download | Verified packages and provenance | Explicit signature status, prepared signing and release checks |
| First | A document unexpectedly reaches the network | Confidential notes and images | Untrusted HTML, diagrams and repositories | Local rendering, blocked remote images, constrained execution |
| Next | Editing and preview lose context | Visual editing, simple navigation | Block sync, long code, math and diagrams | Retain visual/source choice and test bidirectional synchronization |
| Next | Sharing changes the result | Print or PDF for recipients | Offline HTML with rendered assets | Static export and native printing |
| Continuous | Input, accessibility or performance fails | Keyboard, spelling, language input | Large notes and folders | Native conventions, bounded work and explicit limitations |

## Document integrity and Markdown compatibility

For an everyday writer, a checked task becoming an ordinary bullet is data loss even if every visible word survives. For a technical writer, a reference definition being rewritten into an inline link can produce a large, distracting version-control diff. A visual editor therefore needs two distinct promises: preserve meaning when it supports a construct, and preserve the original file when it cannot represent that construct faithfully.

MarkText issue 4702 reports pasted HTML checkboxes losing their task semantics; the June 2026 issue is closed with a fix. Issue 4684 reports selected text being replaced during delimiter pairing in a beta build and is also closed. These reports motivate regression coverage for selection and clipboard operations, not a claim that current MarkText necessarily exhibits them. Joplin's documented rich-text limitations independently show why conversion boundaries deserve explicit treatment.[^5][^6][^2]

Plainmark already retains original source when merely switching views and preserves a file's UTF-8 BOM and CRLF convention on normal saves. Per-tab undo, unsaved-change prompts, local recovery and byte-level external-change detection address ordinary editing accidents. Saves use a temporary sibling file and atomic replacement rather than overwriting the destination in place. These safeguards reduce common failure modes but do not provide cross-process locking, a history service or a substitute for backups.

The 0.3.0 changes preserve checked states in pasted HTML task lists. They also route documents containing reference definitions, footnotes or wiki links to Source view, with a reason visible to the writer. Code examples and frontmatter containing similar strings are excluded from this detection. Reference links can still render in preview; specialist footnote and wiki-link rendering is not implemented. This is an explicit compatibility boundary, not a claim that all Markdown dialects are supported.

Ordinary visual edits still normalize syntax such as list markers and table spacing. ProseMirror supplies a structured document model, so visual editing is substantially more than a text area beside a preview, but it is not a byte-preserving syntax editor. Supporting every extension with exact source retention would require further parser/model work and careful round-trip tests. The recommended rule is to add a dialect only when its parse, edit, save, undo and export behavior can all be explained and verified.

For everyday work, this means a table should remain a table and a task should remain a task. For technical work, source access must remain immediate and saving an untouched file should not produce an unexplained diff. Neither audience benefits from an editor claiming compatibility it cannot deliver.

## Images, attachments and related documents

Pictures expose a gap between Markdown's portability and graphical editing expectations. People expect to paste a screenshot and continue typing. Markdown normally records a path, so the application must decide where the image lives and what happens when the note is moved. Zettlr issue 5026 describes a clipboard-image failure on macOS in a 2024 beta; it is closed, and the subsequent release notes record the fix. A separate Zettlr discussion illustrates confusion when image locations and link conventions differ during migration from another note system.[^7][^4][^8]

VS Code's Markdown documentation offers a useful implementation benchmark: image insertion can create local files, links and headings can be navigated, and validation can help with broken destinations. Those capabilities do not require a proprietary document container. The lesson for Plainmark is to make ordinary relative files convenient rather than invent an attachment database.[^9]

Plainmark 0.3.0 adds both clipboard image insertion and an Image from file command. The desktop app asks to save an untitled note first, then stores each raster attachment under an `assets` folder beside the document. Unique names avoid overwriting existing pictures. Image import rejects non-image signatures, oversized input, invalid decoding in the editor and an assets directory that redirects through a symlink. The operation does not rewrite the saved Markdown file automatically; the insertion remains an ordinary unsaved edit until Save.

This arrangement has a simple sharing rule: keep the Markdown file and its assets together. Undo removes the document reference but leaves the attachment file intact, preventing accidental deletion of an image used elsewhere. Automatic cleanup is intentionally absent. In the browser development preview, inserted images are embedded as data URLs within the document-size limit because a browser may not have permission to create sibling files. That fallback is documented rather than presented as identical native behavior.

Relative document links now open within the selected folder, reuse an existing tab and preserve unsaved edits. Local heading fragments support Unicode and duplicate names, and ordinary heading links are rewritten consistently for static HTML export. In Visual view, Cmd/Ctrl-click or Cmd/Ctrl-Enter follows a link without making routine cursor placement navigate away. Preview links behave as ordinary reading links.

Scope restrictions remain deliberate: a document cannot use a link to read arbitrary files outside the granted folder. If a legitimate link lies outside that boundary, the writer can explicitly open the containing workspace. A clear error is preferable to silently granting a document access to the rest of the computer.

## Finding work without building a second filesystem

Everyday writers often want the note they used yesterday; technical writers may need a specific file deep in a repository. A folder tree alone makes both tasks slower as the collection grows. A June 2026 Markdown forum discussion asks for a simple editor combining visual work, bidirectional preview, search and sharing. This is qualitative demand, not a representative survey. Product-promotion threads were treated cautiously and were not used to estimate adoption or market size.[^10]

Quick Open now searches the names and paths of open tabs and explicitly selected folders. It operates only when requested, yields while traversing folders, stops when closed and keeps no persistent index. Matching is simple and understandable: all search terms must occur in the file name or path. The first hundred results are shown with a prompt to narrow the query when appropriate.

The traversal is bounded to 250 folders, 5,000 files and twelve levels. Partial results and unreadable folders are disclosed. Hidden entries, dependency folders and build-output folders remain excluded from the ordinary tree. These limits protect responsiveness and privacy, but they mean Quick Open is not full-text vault search and cannot promise exhaustive results in an enormous repository. Opening a smaller subfolder is the supported immediate remedy.

Full-text search, backlinks, automatic asset moves and rename propagation remain possible future work. They should be driven by observed use and designed together with file conflict handling. An always-running indexer would add memory use, cached content, invalidation complexity and privacy questions. It is not necessary to solve the first, simpler problem of finding a known filename.

## Preview context, tables, math and diagrams

Scroll synchronization is useful only when it preserves the reader's position. Equal percentages of two scrollbars fail when a short source line produces a tall image or diagram. VS Code issue 307762 documents a 2026 regression involving feedback between forward and reverse synchronization and a preview that would not initially move the editor. The issue is closed and marked as released in Insiders; it remains a useful example of the event-ordering problems a regression test must exercise.[^11]

Plainmark maps source line boundaries to their rendered Markdown blocks and interpolates within neighboring boundaries. Tests move from preview to source before independently scrolling the source, inspect the matched heading position, and reach both document ends. The mapping is tied to block boundaries, not a promise of pixel-exact alignment for each character. Layout changes from images, math, wrapping and window resizing require measurement updates.

Visual table editing, task toggles and locally rendered Mermaid and math were already present in 0.2.2. Keeping these local avoids a CDN dependency and supports disconnected use. Technical users receive familiar syntax; everyday users can edit visible cells and check tasks without manipulating punctuation. Complex expressions and diagrams retain an explicit Edit control rather than pretending that a general diagram canvas is a small, free addition.

HTML remains an exceptional capability. A code block is inert until Run HTML is chosen. The feature is useful for small interactive examples, but runnable code introduces a different threat model from displaying Markdown. Privacy settings can disable the Run button altogether. No feature claim should conceal that tradeoff.

## Export and everyday sharing

A document has not been shared successfully if the recipient sees missing images, raw app controls or different table content. A historical MarkText report describes images missing from HTML/PDF export; it is closed and dates to a 2020 version. The issue is evidence of a failure class, not an assessment of the current application. Current MarkText release testing still includes export, paste and formatting, reinforcing their role as basic reliability concerns.[^12][^3]

Plainmark produces a static HTML reading copy with successfully resolved local images embedded. The new Print / Save as PDF option uses the operating system's print dialog. Before printing, it prepares a sanitized document and waits for rich rendering and image decoding. App controls, executable frames and creator credits are excluded from the printed document. The author receives visible credit in the application and website, not a watermark on someone else's writing.

PDF availability and exact pagination depend on the operating system's print service, fonts and renderer. A browser test can verify the generated print content and isolation, but it does not certify every physical printer, Linux print configuration or Windows PDF destination. The release checklist must therefore include actual printed output on supported systems.

DOCX import/export, tracked changes, citations and publishing workflows are unresolved needs for some writers. Bundling a complete conversion suite would materially expand maintenance and dependencies. A documented, optional Pandoc-oriented workflow is more consistent with Plainmark's scope than claiming a lossless Word round trip. PanWriter demonstrates that dedicated conversion-oriented tools already occupy that space.[^13] Plainmark should remain honest about that boundary while making its own HTML and print outputs reliable.

## Accessibility, international input and performance

Keyboard support is part of basic usability, not an optional technical-user feature. W3C's keyboard guidance requires functionality to be operable through a keyboard and warns about traps and unconventional interactions. This is a design standard to work toward, not a claim that Plainmark has passed a complete WCAG audit.[^14]

The update adds keyboard navigation to Quick Open, keyboard activation for image editing and a keyboard route for following links. Native menu shortcuts remain available. Spellchecking is a privacy choice: it defaults to off, and enabling it uses the device service under that service's settings. This avoids implying that an operating system spelling service is necessarily local or governed by Plainmark.

Chinese, Japanese and Korean composition, bidirectional text, screen readers and non-US layouts require actual platform testing. MarkText's current testing call names IME, arrow-key boundaries, undo across tabs, paste and large documents among the important cases. Plainmark's browser coverage verifies specific interactions but does not substitute for native IME and assistive-technology evaluation.[^3] These remain explicit validation work, not completed accessibility certification.

Performance should be assessed by real tasks and pathological input shapes, not only installer size. Typora issue 6389 describes a long run of spaces making editing and switching views slow on a particular 2025 macOS setup; the issue remains open. The evidence supports testing unusual shapes, not claiming Typora or Plainmark has a particular general speed ranking.[^15]

Plainmark uses the system webview, loads the visual/source editors and rich renderers on demand, bounds caches and avoids startup indexing. Files above 1 MB use Source view; documents are capped at 5 MB. Rich preview blocks, diagram length and HTML execution input are also limited. These choices reduce uncontrolled work but do not prove that every accepted file remains fast. No comparative CPU, memory, battery or cold-start benchmark is claimed here. A public performance claim should include the machine, OS, document corpus, cold/warm state and measurement method.

## Privacy and security assessment

The relevant adversaries include a malicious Markdown file, an unsafe local image, explicitly executed HTML and a compromised build dependency. Plainmark's local-file model reduces exposure, but local does not mean automatically safe. There must still be clear boundaries between document content, the application interface and native file operations.

The update makes native command grants explicit and retains Rust-owned file selection, canonical path checks, limited image reads, restricted external protocols and sanitized rendering. SVG is displayed as an image rather than injected as active document markup. The HTML frame lacks same-origin privilege and its authenticated app bridge, has a restrictive content policy, and denies device permissions. Tauri's capabilities documentation explains command authorization; those permissions alone are not the complete iframe-isolation argument.[^16]

JavaScript dependency auditing found two published advisories affecting transitive `lodash-es` 4.17.23. The dependency was updated to 4.18.1, after which the audit reported no known advisories. No exploitable path through Plainmark was established; remediation did not wait for one. Advisory databases describe known issues, so a clean scan is not proof that a program has no vulnerabilities.[^17][^18]

The Linux stack required a more specific response. GLib 0.18.5 contains the iterator soundness problem documented in RUSTSEC-2024-0429. Its upstream fix changes an out-pointer to be mutable. Plainmark backports those two lines while retaining the compatible GTK3 dependency stack, preserves the license, verifies every vendored file against the checksum-verified upstream archive plus that exact fix, and adds an optimized Linux iterator regression test. Cargo's registry scan does not audit a path dependency; this separate verification is therefore essential.[^19][^20]

Six Rust maintenance warnings remain for `proc-macro-error` and `unic-*` dependencies. They are disclosed and must be revisited with framework updates. The system webview and native platform libraries also require OS security updates. The project has no claim of an independent penetration test, formal verification or immunity from malformed-input resource exhaustion.

Recovery copies are local plaintext by default; they can now be disabled and cleared. Clearing them is not forensic secure erasure from disk snapshots or backups. Files saved into a cloud-synced folder may be uploaded by that provider even though the app has no cloud sync. Explicit web links open a separate browser or mail client. The website and GitHub download service have their own connection-data processing, separately from the offline application.

Untrusted HTML can consume CPU and memory. A malicious process already running as the same local account can race filesystem operations or read unencrypted files. These are important limits to an absolute security promise. The defensible commitment is conservative defaults, visible boundaries, prompt remediation, reproducible evidence and accurate release status.

## Platform signing and installation trust

macOS distribution outside the App Store requires the appropriate Developer ID identity and notarization process. A previous paid developer membership does not establish that it is active now. No valid code-signing identity was found on the local Mac during this update. A dedicated workflow has been prepared for both Mac architectures; it fails without real credentials and checks the publisher team, hardened runtime, notarization ticket and Gatekeeper assessment before a release can be described as verified.[^21][^22]

Windows needs a separate signing path. SignPath Foundation is a promising free option for an eligible open-source project, but acceptance, MFA, maintainer roles, artifact configuration and signing approval are requirements, not assumptions. An application draft is prepared; it has not been submitted, and Plainmark does not claim Foundation sponsorship. The signed application executable and enclosing installer must both be verified.[^23]

Microsoft Artifact Signing is an alternative with account, identity and regional requirements. Its current public-trust availability includes Singapore organizations, while individual developers are limited to the United States and Canada. The appropriate legal identity must be established before choosing that route.[^24] No paid account, certificate or membership renewal should be created without a separate cost decision.

Code signing does not guarantee that every Windows machine shows no warning. Microsoft's current documentation distinguishes publisher signatures, file reputation, SmartScreen and enterprise policy; it also states that EV signing no longer automatically bypasses reputation checks. Store distribution offers a different trust path with additional review and packaging work.[^25]

| Platform | Prepared in this update | Still required before a trusted-release claim |
| --- | --- | --- |
| macOS Apple Silicon and Intel | Signing workflow, identity checks, notarization and Gatekeeper verification | Active account, Developer ID certificate, secure credentials, successful runs and fresh-download installation checks |
| Windows x64 | Signing application draft and timestamped-publisher verification script | Provider approval/account, signing the inner executable and installer, real Windows installation checks |
| Linux x64 | Debian/AppImage launch integration checks, checksum and provenance generation | Verification of generated attestations and installation on supported distributions; any future store/repository review |

GitHub artifact attestations can connect a particular installer digest to its source and workflow. They complement rather than replace OS publisher signatures. A checksum fetched from the same location as a malicious replacement is not independent authentication. Nor does public source availability prove that another machine can reproduce an identical binary; that stronger claim requires a reproducibility exercise.[^26]

## Creator credit, fairness and sustainable adoption

Minimal creator credit is ethically reasonable. It acknowledges the work, explains the project's purpose and lets people assess who maintains a tool they may trust with documents. The appropriate expression is a small visible name, an About explanation, source authorship and a website footer. It should not interrupt writing, demand praise, insert branding into exports or obscure upstream contributors.

Plainmark now credits Gopala Subramanium and explains a positive motivation: everyday Markdown should have a simple, free tool without ads, subscriptions, unnecessary extras or interruptions. The wording describes the creator's choice rather than alleging that every alternative is exploitative. Third-party notices remain intact. Existing libraries are a material part of the project, even when they load only on demand.

The official project's free-of-charge commitment is distinct from the freedoms granted by its GPL license. Free software licenses can permit commercial redistribution; the GNU project's explanation explicitly distinguishes freedom from price.[^27] A promise about official Plainmark releases should not be written as a new restriction on others' GPL rights. User documents remain their own and receive no additional creator-credit requirement.

Adoption should follow a trustworthy release, a clear download page, honest screenshots, a short getting-started guide and easy bug reporting. Practical examples should serve both audiences: a meeting note with tasks and a picture, and a technical README with a table, equation, diagram and relative links. The website should explain platform prerequisites and signature status before installation, with no invented download counts, testimonials or security badges.

OS defaults must remain a user choice through the platform's normal Open with or default-app controls. Forcing an association would conflict with the promise of no bother. Sharing the project with relevant communities can help after installation is dependable, but no external posts or application submissions are part of this update. Guaranteed virality, universal adoption and universal platform trust are not outcomes a maintainer can promise.

## Implementation and verification record

The research has produced working changes, not only a feature wishlist. Existing 0.2.2 functionality includes folder workspaces, tabs, visual editing, local Mermaid/math/SVG, explicit HTML execution, block synchronization and Open with integration. The 0.3.0 changes add creator credit, privacy choices, local document-link navigation, Quick Open, image insertion, task-paste preservation, print/PDF preparation, compatibility safeguards, dependency fixes and release-verification preparation.

The initial Linux browser run caught an invalid CRC in a PNG test fixture that macOS tolerated; the fixture was replaced with a checksum-valid PNG, without weakening image validation.

The packaged Mac app was also checked manually: native file selection, local note links, image insertion and saving, MathML, explicit HTML execution and stopping on tab changes, and the system print preview with its Save as PDF option. Browser and native printing needed different platform paths; the final app uses the native print operation. A physical printer and every other OS print destination were not tested.

Local verification completed during this update: **26 unit tests, 36 browser tests across Chromium and WebKit, and 12 native macOS file-safety tests passed.** The JavaScript audit reported zero known advisories after the update. The Rust registry audit reported zero vulnerabilities and six unmaintained-dependency warnings after the separately verified GLib backport. Cross-platform builds, optimized Linux backport execution, packaged installer checks and actual signing must be read from the corresponding release run; local Mac tests do not establish those results.

| Area | Concrete verification | Remaining practical limit |
| --- | --- | --- |
| Document integrity | Round trips, untouched-source save, BOM/CRLF, tab undo, external-change safeguards | No full dialect/Word round trip; same-account file races remain possible |
| Privacy controls | Recovery clearing preserves open edits; options persist; disabled Run button | Recovery is plaintext, OS and sync-provider policies are separate |
| Images and links | Image insert/edit/undo; local link deduplication; path and symlink escape rejection | Attachments must travel with notes; no automatic orphan cleanup |
| Search | Nested filename/path matching, keyboard selection and explicit bounds | No full-text index or exhaustive large-vault guarantee |
| Rendering and sharing | Local Mermaid/math/SVG; inert hostile content; static print content without credits | Native printing, IME and assistive technologies need platform checks |
| Supply chain | Dependency audits, exact GLib backport comparison, pinned build actions | Maintenance warnings remain; attestations require a successful release run |
| Signing | Fail-closed Mac workflow and Windows signature-verification preparation | Account/provider-dependent; current public previews are not publisher-trusted |

Repository private vulnerability reporting and secret push protection were already enabled when inspected. Additional dependency-alert, automatic-fix and weekly-scan settings require explicit maintainer approval; prepared configuration must not be represented as active before that approval and verification. A successful security pipeline should block a release on new known vulnerabilities while keeping maintenance warnings visible for review.

The next release decision should therefore be based on verified assets and accurately labeled limitations. The strongest product promise is modest and testable: Plainmark is free, local, understandable and careful with files. Eliminating every Markdown pain point would conflict with its small scope; eliminating the common friction in its chosen workflows, and clearly explaining the rest, is an achievable standard.

## Sources

[^1]: John MacFarlane and contributors. [CommonMark Spec 0.31.2](https://spec.commonmark.org/spec/), 28 January 2024. Syntax ambiguity and standardized parsing behavior.
[^2]: Joplin. [About the Rich Text editor](https://joplinapp.org/help/apps/rich_text_editor/), current documentation accessed 12 September 2026. Markdown storage and rich-text limitations.
[^3]: Jocs / MarkText. [Call for testing: MarkText 0.20.0 RC — rebuilt editor engine, issue 4668](https://github.com/marktext/marktext/issues/4668), opened 23 June 2026; current RC2 description. Maintainer priorities and counterevidence on active free alternatives.
[^4]: Zettlr. [Release 3.1.0 discussion, 5134](https://github.com/Zettlr/Zettlr/discussions/5134), 2024. Recorded fixes for clipboard/newline behavior.
[^5]: MarkText issue tracker. [Issue 4702](https://github.com/marktext/marktext/issues/4702), 24 June 2026, closed. HTML clipboard task semantics.
[^6]: MarkText issue tracker. [Issue 4684](https://github.com/marktext/marktext/issues/4684), 24 June 2026, closed. Selected-text delimiter-pairing report.
[^7]: Zettlr issue tracker. [Issue 5026](https://github.com/Zettlr/Zettlr/issues/5026), 12 March 2024, closed. Clipboard image failure in a macOS beta.
[^8]: Zettlr community. [Discussion 4477](https://github.com/Zettlr/Zettlr/discussions/4477), 5 July 2023. Relative images and link-convention migration.
[^9]: Microsoft. [Markdown and Visual Studio Code](https://code.visualstudio.com/docs/languages/markdown), accessed 12 September 2026. Navigation, image insertion, validation and preview behavior.
[^10]: r/Markdown community. [Why there is no simple Markdown editor…](https://www.reddit.com/r/Markdown/comments/1tzfvg4/why_there_is_no_simple_markdown_editor_in_the/), 7 June 2026. Anecdotal feature demand; not a representative survey.
[^11]: Ashton Yoon / Microsoft VS Code. [Markdown preview scroll sync broken after #287050 merged to main, issue 307762](https://github.com/microsoft/vscode/issues/307762), 4 April 2026, closed; Insiders release label. Bidirectional synchronization regression.
[^12]: MarkText issue tracker. [Issue 1874](https://github.com/marktext/marktext/issues/1874), 18 January 2020, closed. Historical missing-image export report.
[^13]: PanWriter contributors. [PanWriter repository](https://github.com/mb21/panwriter), accessed 12 September 2026. Dedicated Pandoc-oriented writing and conversion scope.
[^14]: W3C Web Accessibility Initiative. [Understanding Success Criterion 2.1.1: Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), accessed 12 September 2026. Keyboard operation and avoiding traps.
[^15]: misea / Typora issue tracker. [File with big string of spaces makes Typora unusably slow, issue 6389](https://github.com/typora/typora-issues/issues/6389), 5 August 2025, open. Version-specific pathological-input report.
[^16]: Tauri. [Capabilities](https://v2.tauri.app/security/capabilities/), accessed 12 September 2026. Application command authorization.
[^17]: GitHub Advisory Database. [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc), accessed 12 September 2026. Lodash code-injection advisory.
[^18]: GitHub Advisory Database. [GHSA-f23m-r3pf-42rh](https://github.com/advisories/GHSA-f23m-r3pf-42rh), accessed 12 September 2026. Lodash prototype-pollution advisory.
[^19]: RustSec. [RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html), reported 30 March 2024; advisory updated 28 October 2025. GLib iterator unsoundness.
[^20]: gtk-rs maintainers. [glib: fix UB in VariantStrIter::impl_get, PR 1343](https://github.com/gtk-rs/gtk-rs-core/pull/1343), upstream fix. Exact two-line correction used for the backport.
[^21]: Apple. [Signing Mac Software with Developer ID](https://developer.apple.com/developer-id/), accessed 12 September 2026. Developer ID and notarization requirements.
[^22]: Tauri. [macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/), updated 17 May 2026. Certificate configuration, notarization credentials and ad-hoc limitations.
[^23]: SignPath Foundation. [Terms / Code of Conduct](https://signpath.org/terms.html), accessed 12 September 2026; page labels the code of conduct as a draft. Eligibility and operational requirements must be confirmed during application.
[^24]: Microsoft Learn. [Quickstart: Set up Artifact Signing](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart), accessed 12 September 2026. Public-trust identity and regional eligibility.
[^25]: Microsoft Learn. [SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation), 6 May 2026. Signing, reputation, EV changes and Store distinction.
[^26]: GitHub Docs. [Using artifact attestations to establish provenance for builds](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations), accessed 12 September 2026. Artifact provenance and verification.
[^27]: Free Software Foundation. [Selling Free Software](https://www.gnu.org/philosophy/selling.html), accessed 12 September 2026. Free-software freedoms and commercial redistribution.
