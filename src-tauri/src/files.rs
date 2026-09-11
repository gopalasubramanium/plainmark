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
}

struct Entry {
    path: PathBuf,
    baseline: Vec<u8>,
    crlf: bool,
    bom: bool,
}

#[derive(Default)]
pub struct FileStore {
    next_id: u64,
    entries: HashMap<u64, Entry>,
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
    pub fn open(&mut self, path: PathBuf) -> Result<Document, String> {
        let path = path.canonicalize().map_err(|e| e.to_string())?;
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
        };
        // One document is open at a time. Older file capabilities are revoked.
        self.entries.clear();
        self.entries.insert(
            document.id,
            Entry {
                path,
                baseline: bytes,
                crlf,
                bom,
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

    pub fn save_as(&mut self, path: PathBuf, text: &str) -> Result<Document, String> {
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
            self.save(id, text)?;
            return Ok(Document {
                id,
                name: path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into(),
                text: text.into(),
            });
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
                !matches!(
                    c,
                    std::path::Component::Normal(_) | std::path::Component::CurDir
                )
            })
        {
            return Err("Images must be inside the document's folder.".into());
        }
        let path = parent
            .join(relative)
            .canonicalize()
            .map_err(|e| e.to_string())?;
        if !path.starts_with(parent) {
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
        } else {
            return Err("Supported local images: PNG, JPEG, GIF, WebP.".into());
        };
        Ok(format!(
            "data:{};base64,{}",
            mime,
            base64::engine::general_purpose::STANDARD.encode(bytes)
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
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
        assert!(store.save_as(path.clone(), "mine").is_err());
        assert_eq!(fs::read_to_string(path).unwrap(), "external");
    }
    #[test]
    fn revokes_previous_file_and_does_not_recreate_deleted_files() {
        let dir = tempfile::tempdir().unwrap();
        let mut store = FileStore::default();
        let a = store.save_as(dir.path().join("a.md"), "a").unwrap();
        let b = store.save_as(dir.path().join("b.md"), "b").unwrap();
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
        let doc = store.save_as(dir.path().join("doc.md"), "").unwrap();
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
