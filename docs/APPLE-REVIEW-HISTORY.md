# Apple review history

## 16–17 September 2026: approved and publicly available

Apple’s emails dated 16 September confirm completed review and **Ready for Distribution** for Plainmark Markdown Editor, app `6811364319`, macOS version **0.4.0**, submission `2e5cbcc0-112c-4948-bf50-5d528fd2e9a7`. The publisher supplied the approval and distribution emails on 17 September.

On 17 September, the [public listing](https://apps.apple.com/app/plainmark-markdown-editor/id6811364319) returned successfully. Apple’s public lookup endpoint confirmed the app ID, publisher Gopala Subramanium, version **0.4.0**, price zero, and minimum macOS **11.0** in both Singapore and the US. Its current-version release timestamp is `2026-09-16T15:40:41Z` (16 September at 23:40:41 Singapore time). This verifies those storefronts; it is not a check of every territory.

The approved submission retains build **0.4.0**, its original package and source, and the corrected subtitle. No binary was rebuilt, published artifact replaced, or release tag moved. The website now promotes the Store listing as the primary Mac route, with signed DMGs and Homebrew retained. App Store approval and a live listing do not replace an independent installation/runtime check of the Store-delivered edition; those coverage limits remain in [Mac packaging](../packaging/macos/README.md). The private recovery snapshot retains the provided emails and public listing evidence.

## 15 September 2026: metadata correction and resubmission

App: Plainmark Markdown Editor (`6811364319`). Submission: `2e5cbcc0-112c-4948-bf50-5d528fd2e9a7`. Version/build: **0.4.0 / 0.4.0**.

Apple's review dated 14 September identified one unresolved issue, **Guideline 2.3.7 — Accurate Metadata**: the subtitle contained a price reference. The subtitle was **Local notes. Free and private.** This record addresses the issue Apple stated; it is not evidence that every other guideline has been approved.

Corrections saved in App Store Connect:

- Subtitle: **Local Markdown, visual editing** (30 characters).
- Promotional text: **An open-source home for everyday Markdown. Work with local files, edit visually, and render diagrams and math.**
- English (U.S.) was the only configured localization. The name and keywords were checked and contain no price reference.

The existing description, free pricing, screenshot, review notes, permissions, selected build and automatic-release choice were retained. The creator's free/open-source commitment remains in the app description. No binary was rebuilt or replaced, and the public v0.4.0 release tag was not moved. The same build can be used for this metadata-only correction under the [release policy](RELEASE-POLICY.md).

After saving, Update Review changed the item to Ready for Review. Resubmit to App Review then succeeded. App Store Connect showed **Waiting for Review**, with Date Submitted **15 September 2026 at 07:19 Singapore time** and the same submission ID. No separate message was sent to App Review. At that point, approval and public Mac App Store availability were still pending; the later approval is recorded above.

The exact submitted package, source, signatures and original test coverage are recorded in [Mac packaging](../packaging/macos/README.md). The private local recovery record preserves the metadata change and resubmission result.

## Rule for future listings

Use feature descriptions in Apple names, subtitles, keywords and promotional text; review all configured localizations and screenshot/preview assets against the current metadata guidance. State pricing in Pricing and Availability and, where permitted, the app description. Keep creator credits and the project's free/open-source commitment accurate without inserting price claims into restricted metadata fields.

Source: [Apple App Review Guideline 2.3.7](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata), checked 15 September 2026, and the authenticated App Store Connect review message and resubmission confirmation.
