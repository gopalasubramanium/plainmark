use serde::Serialize;
use std::{
    collections::HashMap,
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
};

pub const MAX_DOCUMENT_BYTES: usize = 5 * 1024 * 1024;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Document {
    pub id: u64,
    pub name: String,
    pub text: String,
    pub path: String,
}

struct Entry {
    path: PathBuf,
    baseline: Vec<u8>,
    crlf: bool,
    bom: bool,
    image_root: PathBuf,
}

#[derive(Default)]
pub struct FileStore {
    next_id: u64,
    entries: HashMap<u64, Entry>,
    workspaces: HashMap<u64, PathBuf>,
}

pub fn read_limited(path: &Path, limit: usize) -> Result<Vec<u8>, String> {
    if !fs::metadata(path).map_err(|e| e.to_string())?.is_file() {
        return Err("Please choose a regular file.".into());
    }
    let mut bytes = Vec::new();
    fs::File::open(path)
        .map_err(|e| e.to_string())?
        .take((limit + 1) as u64)
        .read_to_end(&mut bytes)
        .map_err(|e| e.to_string())?;
    if bytes.len() > limit {
        return Err("This file is too large to open in Plainmark.".into());
    }
    Ok(bytes)
}

// Write to a sibling temporary file, flush it, then replace the destination atomically.
// tempfile uses the appropriate replacement operation on Unix and Windows.
pub fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let parent = path.parent().ok_or("The file has no parent folder.")?;
    let mut temporary = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    if let Ok(metadata) = fs::metadata(path) {
        if metadata.permissions().readonly() {
            return Err("This file is read-only. Use Save as to save a copy.".into());
        }
        temporary
            .as_file()
            .set_permissions(metadata.permissions())
            .map_err(|e| e.to_string())?;
    }
    temporary.write_all(bytes).map_err(|e| e.to_string())?;
    temporary.as_file().sync_all().map_err(|e| e.to_string())?;
    temporary.persist(path).map_err(|e| e.to_string())?;
    Ok(())
}

impl FileStore {
    pub fn import_image(&self, id: u64, encoded: &str) -> Result<String, String> {
        use base64::Engine;
        if encoded.len() > 14 * 1024 * 1024 {
            return Err("Image exceeds 10 MB.".into());
        }
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(encoded)
            .map_err(|_| "Invalid image data")?;
        if bytes.len() > 10 * 1024 * 1024 {
            return Err("Image exceeds 10 MB.".into());
        }
        let extension = if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
            "png"
        } else if bytes.starts_with(b"\xff\xd8\xff") {
            "jpg"
        } else if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
            "gif"
        } else if bytes.starts_with(b"RIFF") && bytes.get(8..12) == Some(b"WEBP") {
            "webp"
        } else {
            return Err("Choose a PNG, JPEG, GIF, or WebP image.".into());
        };
        let entry = self
            .entries
            .get(&id)
            .ok_or("Save this document before adding an image.")?;
        let parent = entry.path.parent().ok_or("Missing folder")?;
        let assets = parent.join("assets");
        match fs::create_dir(&assets) {
            Ok(()) => (),
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => (),
            Err(error) => return Err(error.to_string()),
        }
        let metadata = fs::symlink_metadata(&assets).map_err(|e| e.to_string())?;
        if metadata.file_type().is_symlink()
            || !metadata.is_dir()
            || assets.canonicalize().map_err(|e| e.to_string())? != assets
        {
            return Err("The assets folder must be a real folder beside this document.".into());
        }
        let mut file = tempfile::Builder::new()
            .prefix("image-")
            .suffix(&format!(".{extension}"))
            .tempfile_in(&assets)
            .map_err(|e| e.to_string())?;
        file.write_all(&bytes).map_err(|e| e.to_string())?;
        file.as_file().sync_all().map_err(|e| e.to_string())?;
        let (_, path) = file.keep().map_err(|e| e.to_string())?;
        Ok(format!(
            "assets/{}",
            path.file_name().unwrap().to_string_lossy()
        ))
    }

    pub fn open_link(&mut self, id: u64, relative: &str) -> Result<Document, String> {
        let entry = self.entries.get(&id).ok_or("Document closed")?;
        let relative = Path::new(relative);
        if relative.is_absolute()
            || relative.components().any(|c| {
                matches!(
                    c,
                    std::path::Component::Prefix(_) | std::path::Component::RootDir
                )
            })
        {
            return Err("Use a relative document link inside the selected folder.".into());
        }
        let root = entry.image_root.clone();
        let path = entry
            .path
            .parent()
            .ok_or("Missing folder")?
            .join(relative)
            .canonicalize()
            .map_err(|_| {
                "Linked document not found. Check its filename or open the containing folder."
            })?;
        if !path.starts_with(&root) || !is_document(&path) {
            return Err(
                "This link leaves the selected folder or is not a supported document.".into(),
            );
        }
        let document = self.open(path)?;
        let linked = self.entries.get_mut(&document.id).unwrap();
        if linked.image_root.starts_with(&root) {
            linked.image_root = root;
        }
        Ok(document)
    }

    pub fn open(&mut self, path: PathBuf) -> Result<Document, String> {
        let path = path.canonicalize().map_err(|e| e.to_string())?;
        if let Some((&id, entry)) = self.entries.iter().find(|(_, entry)| entry.path == path) {
            let bytes = if entry.bom {
                &entry.baseline[3..]
            } else {
                &entry.baseline[..]
            };
            return Ok(Document {
                id,
                name: path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into_owned(),
                path: path.to_string_lossy().into_owned(),
                text: String::from_utf8_lossy(bytes)
                    .replace("\r\n", "\n")
                    .replace('\r', "\n"),
            });
        }
        if self.entries.len() >= 100 {
            return Err("Close a tab before opening more documents (100 tab limit).".into());
        }
        let bytes = read_limited(&path, MAX_DOCUMENT_BYTES)?;
        let bom = bytes.starts_with(&[0xef, 0xbb, 0xbf]);
        let text = std::str::from_utf8(if bom { &bytes[3..] } else { &bytes })
            .map_err(|_| "This file is not UTF-8 text. Please convert it to UTF-8 first.")?;
        if text.contains('\0') {
            return Err("This looks like a binary file, not Markdown.".into());
        }
        let crlf = text.contains("\r\n");
        let normalized = text.replace("\r\n", "\n").replace('\r', "\n");
        self.next_id += 1;
        let document = Document {
            id: self.next_id,
            name: path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .into_owned(),
            text: normalized,
            path: path.to_string_lossy().into_owned(),
        };
        let image_root = self
            .workspaces
            .values()
            .filter(|root| path.starts_with(root))
            .max_by_key(|root| root.components().count())
            .cloned()
            .unwrap_or_else(|| path.parent().unwrap().to_path_buf());
        self.entries.insert(
            document.id,
            Entry {
                path,
                baseline: bytes,
                crlf,
                bom,
                image_root,
            },
        );
        Ok(document)
    }

    pub fn save(&mut self, id: u64, text: &str) -> Result<(), String> {
        let entry = self
            .entries
            .get_mut(&id)
            .ok_or("This document is no longer open. Use Save as.")?;
        let current = read_limited(&entry.path, MAX_DOCUMENT_BYTES)
            .map_err(|_| "The original file is unavailable. Use Save as to save your work.")?;
        if current != entry.baseline {
            return Err("The file changed outside Plainmark. Use Save as to keep your edits in a separate copy, or reopen the file to read the newer version.".into());
        }
        let normalized = text.replace("\r\n", "\n").replace('\r', "\n");
        let encoded = if entry.crlf {
            normalized.replace('\n', "\r\n")
        } else {
            normalized
        };
        let mut bytes = if entry.bom {
            vec![0xef, 0xbb, 0xbf]
        } else {
            Vec::new()
        };
        bytes.extend_from_slice(encoded.as_bytes());
        if bytes.len() > MAX_DOCUMENT_BYTES {
            return Err("Documents must be 5 MB or smaller.".into());
        }
        atomic_write(&entry.path, &bytes)?;
        entry.baseline = bytes;
        Ok(())
    }

    pub fn save_as(
        &mut self,
        path: PathBuf,
        text: &str,
        origin: Option<u64>,
    ) -> Result<Document, String> {
        if text.len() > MAX_DOCUMENT_BYTES {
            return Err("Documents must be 5 MB or smaller.".into());
        }
        // Follow an existing symlink, rather than replacing the symlink itself.
        let path = if path.exists() {
            path.canonicalize().map_err(|e| e.to_string())?
        } else {
            path
        };
        // Preserve conflict detection even when Save as selects the current document.
        if let Some((&id, _)) = self.entries.iter().find(|(_, entry)| entry.path == path) {
            if origin != Some(id) {
                return Err("That file is already open in another tab. Switch to it or choose a different name.".into());
            }
            self.save(id, text)?;
            return Ok(Document {
                id,
                path: path.to_string_lossy().into_owned(),
                name: path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into(),
                text: text.into(),
            });
        }
        if self.entries.len() >= 100 {
            return Err("Close a tab before saving another file (100 tab limit).".into());
        }
        atomic_write(&path, text.as_bytes())?;
        self.open(path)
    }

    pub fn image(&self, id: u64, relative: &str) -> Result<String, String> {
        use base64::Engine;
        let entry = self.entries.get(&id).ok_or("Document closed")?;
        let parent = entry.path.parent().ok_or("Missing folder")?;
        let relative = Path::new(relative);
        if relative.is_absolute()
            || relative.components().any(|c| {
                matches!(
                    c,
                    std::path::Component::Prefix(_) | std::path::Component::RootDir
                )
            })
        {
            return Err("Images must be inside the document's folder.".into());
        }
        let path = parent
            .join(relative)
            .canonicalize()
            .map_err(|e| e.to_string())?;
        if !path.starts_with(&entry.image_root) {
            return Err("Image is outside the document's folder.".into());
        }
        let bytes = read_limited(&path, 10 * 1024 * 1024)?;
        let mime = if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
            "image/png"
        } else if bytes.starts_with(b"\xff\xd8\xff") {
            "image/jpeg"
        } else if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
            "image/gif"
        } else if bytes.starts_with(b"RIFF") && bytes.get(8..12) == Some(b"WEBP") {
            "image/webp"
        } else if path
            .extension()
            .and_then(|e| e.to_str())
            .is_some_and(|e| e.eq_ignore_ascii_case("svg"))
            && std::str::from_utf8(&bytes).is_ok()
        {
            "image/svg+xml"
        } else {
            return Err("Supported local images: PNG, JPEG, GIF, WebP, SVG.".into());
        };
        Ok(format!(
            "data:{};base64,{}",
            mime,
            base64::engine::general_purpose::STANDARD.encode(bytes)
        ))
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub id: u64,
    pub name: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderEntry {
    pub name: String,
    pub path: String,
    pub directory: bool,
}

pub fn is_document(path: &Path) -> bool {
    path.extension().and_then(|e| e.to_str()).is_some_and(|e| {
        matches!(
            e.to_ascii_lowercase().as_str(),
            "md" | "markdown" | "mdown" | "txt" | "html" | "htm"
        )
    })
}

impl FileStore {
    pub fn close(&mut self, id: u64) {
        self.entries.remove(&id);
    }
    pub fn add_workspace(&mut self, path: PathBuf) -> Result<Workspace, String> {
        let root = path.canonicalize().map_err(|e| e.to_string())?;
        if !root.is_dir() {
            return Err("Please choose a folder.".into());
        }
        let id = if let Some((&id, _)) = self.workspaces.iter().find(|(_, p)| **p == root) {
            id
        } else {
            self.next_id += 1;
            self.workspaces.insert(self.next_id, root.clone());
            self.next_id
        };
        for entry in self.entries.values_mut() {
            if entry.path.starts_with(&root) {
                entry.image_root = root.clone();
            }
        }
        Ok(Workspace {
            id,
            name: root
                .file_name()
                .unwrap_or(root.as_os_str())
                .to_string_lossy()
                .into_owned(),
        })
    }
    pub fn close_workspace(&mut self, id: u64) {
        self.workspaces.remove(&id);
    }
    fn workspace_path(&self, id: u64, relative: &str) -> Result<PathBuf, String> {
        let root = self.workspaces.get(&id).ok_or("Workspace closed")?;
        let relative = Path::new(relative);
        if relative.is_absolute() {
            return Err("Choose a path inside the workspace.".into());
        }
        let path = root
            .join(relative)
            .canonicalize()
            .map_err(|e| e.to_string())?;
        if !path.starts_with(root) {
            return Err("That path leaves the workspace.".into());
        }
        Ok(path)
    }
    pub fn list_folder(&self, id: u64, relative: &str) -> Result<Vec<FolderEntry>, String> {
        let folder = self.workspace_path(id, relative)?;
        let root = self.workspaces.get(&id).ok_or("Workspace closed")?;
        let mut items = Vec::new();
        for (scanned, entry) in fs::read_dir(folder).map_err(|e| e.to_string())?.enumerate() {
            if scanned >= 20_000 {
                return Err(
                    "This folder contains more than 20,000 entries. Open a smaller subfolder."
                        .into(),
                );
            }
            let entry = entry.map_err(|e| e.to_string())?;
            let name = entry.file_name().to_string_lossy().into_owned();
            if name.starts_with('.') || matches!(name.as_str(), "node_modules" | "target") {
                continue;
            }
            let Ok(path) = entry.path().canonicalize() else {
                continue;
            };
            if !path.starts_with(root) {
                continue;
            }
            let directory = path.is_dir();
            if !directory && !is_document(&path) {
                continue;
            }
            items.push(FolderEntry {
                name,
                path: entry
                    .path()
                    .strip_prefix(root)
                    .map_err(|e| e.to_string())?
                    .to_string_lossy()
                    .replace('\\', "/"),
                directory,
            });
            if items.len() > 2000 {
                return Err(
                    "This folder contains more than 2,000 documents. Open a smaller subfolder."
                        .into(),
                );
            }
        }
        items.sort_by(|a, b| {
            b.directory
                .cmp(&a.directory)
                .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
        });
        Ok(items)
    }
    pub fn open_workspace_file(&mut self, id: u64, relative: &str) -> Result<Document, String> {
        let path = self.workspace_path(id, relative)?;
        if !is_document(&path) {
            return Err("Choose a Markdown, text, or HTML document.".into());
        }
        self.open(path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn linked_notes_stay_in_scope_and_keep_existing_tab_identity() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("notes")).unwrap();
        fs::write(dir.path().join("start.md"), "start").unwrap();
        fs::write(dir.path().join("notes/第二 note.md"), "next").unwrap();
        fs::write(dir.path().join("secret.bin"), "secret").unwrap();
        let mut store = FileStore::default();
        let first = store.open(dir.path().join("start.md")).unwrap();
        let next = store.open_link(first.id, "notes/第二 note.md").unwrap();
        assert_eq!(
            store.open_link(next.id, "../start.md").unwrap().id,
            first.id
        );
        assert_eq!(
            store.open_link(first.id, "notes/第二 note.md").unwrap().id,
            next.id
        );
        assert!(store.open_link(first.id, "secret.bin").is_err());
        assert!(store.open_link(first.id, "../outside.md").is_err());
        assert!(store
            .open_link(first.id, &dir.path().join("start.md").to_string_lossy())
            .is_err());
        store.close(first.id);
        assert!(store.open_link(first.id, "notes/第二 note.md").is_err());
    }
    #[test]
    fn image_import_is_scoped_unique_and_does_not_overwrite_the_document() {
        use base64::Engine;
        let dir = tempfile::tempdir().unwrap();
        let mut store = FileStore::default();
        let doc = store
            .save_as(dir.path().join("note.md"), "original", None)
            .unwrap();
        let bytes = b"\x89PNG\r\n\x1a\nexample";
        let data = base64::engine::general_purpose::STANDARD.encode(bytes);
        let a = store.import_image(doc.id, &data).unwrap();
        let b = store.import_image(doc.id, &data).unwrap();
        assert_ne!(a, b);
        assert!(a.starts_with("assets/image-"));
        assert_eq!(fs::read(dir.path().join(a)).unwrap(), bytes);
        assert_eq!(
            fs::read_to_string(dir.path().join("note.md")).unwrap(),
            "original"
        );
        assert!(store.import_image(doc.id, "PHNjcmlwdD4=").is_err());
        assert!(store
            .import_image(doc.id, &"a".repeat(14 * 1024 * 1024 + 1))
            .is_err());
        store.close(doc.id);
        assert!(store.import_image(doc.id, &data).is_err());
    }
    #[cfg(unix)]
    #[test]
    fn image_import_and_note_links_reject_symlink_escapes() {
        let dir = tempfile::tempdir().unwrap();
        let outside = tempfile::tempdir().unwrap();
        let mut store = FileStore::default();
        let doc = store
            .save_as(dir.path().join("note.md"), "original", None)
            .unwrap();
        fs::write(outside.path().join("secret.md"), "private").unwrap();
        std::os::unix::fs::symlink(outside.path(), dir.path().join("assets")).unwrap();
        std::os::unix::fs::symlink(
            outside.path().join("secret.md"),
            dir.path().join("linked.md"),
        )
        .unwrap();
        assert!(store.import_image(doc.id, "iVBORw0KGgo=").is_err());
        assert!(store.open_link(doc.id, "linked.md").is_err());
        assert_eq!(fs::read_dir(outside.path()).unwrap().count(), 1);
    }
    #[test]
    fn reopening_preserves_conflict_baseline_and_protects_other_tabs() {
        let dir = tempfile::tempdir().unwrap();
        let mut store = FileStore::default();
        let a = store.save_as(dir.path().join("a.md"), "a", None).unwrap();
        let b = store.save_as(dir.path().join("b.md"), "b", None).unwrap();
        assert!(store
            .save_as(dir.path().join("b.md"), "overwrite", Some(a.id))
            .is_err());
        fs::write(dir.path().join("a.md"), "external").unwrap();
        let reopened = store.open(dir.path().join("a.md")).unwrap();
        assert_eq!(reopened.id, a.id);
        assert_eq!(reopened.text, "a");
        assert!(store.save(a.id, "edits").is_err());
        store.save(b.id, "still independent").unwrap();
    }
    #[test]
    fn workspace_lists_lazily_and_limits_file_and_image_access() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("notes")).unwrap();
        fs::create_dir(dir.path().join("node_modules")).unwrap();
        fs::write(dir.path().join("notes/a.md"), "a").unwrap();
        fs::write(dir.path().join("b.HTML"), "<p>b</p>").unwrap();
        fs::write(dir.path().join(".hidden.md"), "hidden").unwrap();
        fs::write(dir.path().join("shape.svg"), "<svg/>").unwrap();
        let mut store = FileStore::default();
        let workspace = store.add_workspace(dir.path().to_path_buf()).unwrap();
        assert_eq!(
            store.add_workspace(dir.path().to_path_buf()).unwrap().id,
            workspace.id
        );
        let items = store.list_folder(workspace.id, "").unwrap();
        assert_eq!(
            items.iter().map(|e| e.name.as_str()).collect::<Vec<_>>(),
            vec!["notes", "b.HTML"]
        );
        assert!(store.list_folder(workspace.id, "..").is_err());
        assert!(store
            .open_workspace_file(workspace.id, "shape.svg")
            .is_err());
        let doc = store
            .open_workspace_file(workspace.id, "notes/a.md")
            .unwrap();
        assert!(store
            .image(doc.id, "../shape.svg")
            .unwrap()
            .starts_with("data:image/svg+xml;"));
        store.close_workspace(workspace.id);
        assert!(store.list_folder(workspace.id, "").is_err());
        store.save(doc.id, "Still open").unwrap();
    }
    #[cfg(unix)]
    #[test]
    fn workspace_does_not_follow_symlinks_outside_root() {
        let dir = tempfile::tempdir().unwrap();
        let other = tempfile::tempdir().unwrap();
        fs::write(other.path().join("outside.md"), "private").unwrap();
        std::os::unix::fs::symlink(other.path(), dir.path().join("escape")).unwrap();
        let mut store = FileStore::default();
        let workspace = store.add_workspace(dir.path().to_path_buf()).unwrap();
        assert!(store.list_folder(workspace.id, "").unwrap().is_empty());
        assert!(store
            .open_workspace_file(workspace.id, "escape/outside.md")
            .is_err());
    }
    #[test]
    fn saves_atomically_and_preserves_bom_and_windows_newlines() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("note.md");
        fs::write(&path, b"\xef\xbb\xbf# Hello\r\nworld\r\n").unwrap();
        let mut store = FileStore::default();
        let doc = store.open(path.clone()).unwrap();
        assert_eq!(doc.text, "# Hello\nworld\n");
        store.save(doc.id, "# Edited\nworld\n").unwrap();
        assert_eq!(
            fs::read(path).unwrap(),
            b"\xef\xbb\xbf# Edited\r\nworld\r\n"
        );
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 1);
    }
    #[test]
    fn refuses_external_changes_including_save_as_to_same_path() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("note.md");
        fs::write(&path, "old").unwrap();
        let mut store = FileStore::default();
        let doc = store.open(path.clone()).unwrap();
        fs::write(&path, "external").unwrap();
        assert!(store.save(doc.id, "mine").is_err());
        assert!(store.save_as(path.clone(), "mine", Some(doc.id)).is_err());
        assert_eq!(fs::read_to_string(path).unwrap(), "external");
    }
    #[test]
    fn keeps_tabs_independent_and_does_not_recreate_deleted_files() {
        let dir = tempfile::tempdir().unwrap();
        let mut store = FileStore::default();
        let a = store.save_as(dir.path().join("a.md"), "a", None).unwrap();
        let b = store.save_as(dir.path().join("b.md"), "b", None).unwrap();
        store.save(a.id, "x").unwrap();
        store.close(a.id);
        assert!(store.save(a.id, "x").is_err());
        fs::remove_file(dir.path().join("b.md")).unwrap();
        assert!(store.save(b.id, "b2").is_err());
    }
    #[test]
    fn rejects_binary_invalid_utf8_and_oversized_files() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("bad.md");
        let mut store = FileStore::default();
        for bytes in [
            vec![0xff],
            b"abc\0xyz".to_vec(),
            vec![b'a'; MAX_DOCUMENT_BYTES + 1],
        ] {
            fs::write(&path, bytes).unwrap();
            assert!(store.open(path.clone()).is_err());
        }
    }
    #[test]
    fn images_are_confined_and_validated() {
        let dir = tempfile::tempdir().unwrap();
        let mut store = FileStore::default();
        let doc = store.save_as(dir.path().join("doc.md"), "", None).unwrap();
        fs::write(dir.path().join("safe.png"), b"\x89PNG\r\n\x1a\nrest").unwrap();
        fs::write(dir.path().join("fake.png"), b"<script>bad()</script>").unwrap();
        assert!(store
            .image(doc.id, "safe.png")
            .unwrap()
            .starts_with("data:image/png;base64,"));
        assert!(store.image(doc.id, "../outside.png").is_err());
        assert!(store.image(doc.id, "fake.png").is_err());
    }
    #[cfg(unix)]
    #[test]
    fn follows_document_symlink_but_rejects_image_symlink_escape() {
        let dir = tempfile::tempdir().unwrap();
        let other = tempfile::tempdir().unwrap();
        let path = dir.path().join("real.md");
        fs::write(&path, "hello").unwrap();
        std::os::unix::fs::symlink(&path, dir.path().join("link.md")).unwrap();
        let mut store = FileStore::default();
        let doc = store.open(dir.path().join("link.md")).unwrap();
        store.save(doc.id, "changed").unwrap();
        assert!(fs::symlink_metadata(dir.path().join("link.md"))
            .unwrap()
            .file_type()
            .is_symlink());
        assert_eq!(fs::read_to_string(path).unwrap(), "changed");
        fs::write(other.path().join("pic.png"), b"\x89PNG\r\n\x1a\nrest").unwrap();
        std::os::unix::fs::symlink(other.path().join("pic.png"), dir.path().join("pic.png"))
            .unwrap();
        assert!(store.image(doc.id, "pic.png").is_err());
    }
}
