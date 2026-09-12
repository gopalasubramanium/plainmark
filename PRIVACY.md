# Privacy

Plainmark does not have accounts, analytics, advertising, document uploads, crash-report uploads, background update checks, or a cloud service. It works offline. Your documents remain ordinary files that you choose where to save.

## Data on your device

- Saved documents and imported images are ordinary, unencrypted files. Images pasted or inserted in the desktop app are placed in an `assets` folder beside the saved document. Share that folder with the Markdown file. Undoing an insertion does not delete the image file.
- Unsaved edits have local recovery copies by default. **A little help → Privacy settings** can turn recovery off and clear existing copies without closing tabs or changing saved files. Save unsaved work before quitting when recovery is off. Recovery is not a backup, secure deletion facility, or encrypted vault.
- Theme and privacy preferences are saved locally. There is no persistent search index. Quick Open reads file names only when requested, within explicitly opened folders, and stops when closed. Folder permissions and paths are not restored across app restarts.
- System spelling suggestions are off by default. If enabled, the device's spelling service and its privacy settings apply. Plainmark does not send the text to its own service.

## Documents and the network

Remote images are blocked. Local Mermaid, math and SVG rendering do not contact a CDN. Opening a web/email link is an explicit action that passes the link to your system's browser or mail app; those applications and destination services have their own privacy practices.

HTML is inert until **Run HTML** is selected. It runs in an isolated frame with no same-origin privilege and a restrictive content policy. The frame denies network fetches, remote subresources, app/file access, and device permissions. The Run HTML feature can be disabled in Privacy settings. Executed JavaScript can still consume CPU or memory, and the development browser preview is less restrictive about frame navigation than the packaged desktop app. This is a document utility, not a hostile-code analysis environment.

The app uses your operating system's webview, file dialogs, printing and other system components. The OS, security software, input methods, printer destination, cloud-synced folders and filesystem backups are outside Plainmark's control. Saving to a cloud-synced folder can upload a file through that sync provider even though Plainmark itself has no sync feature.

## Website and downloads

The website uses GitHub Pages with Cloudflare DNS. It has no added analytics, advertising or tracking scripts. GitHub, Cloudflare when involved in serving a request, and the browser may process ordinary connection information under their own policies. This website is separate from the offline desktop editor. GitHub downloads and build attestations likewise involve GitHub; the app does not poll those services in the background.

Report privacy concerns through the repository's [private vulnerability reporting](https://github.com/gopalasubramanium/plainmark/security/advisories/new). Do not attach private documents to a public issue.
