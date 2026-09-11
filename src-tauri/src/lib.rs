mod files;

use files::{Document, FileStore};
use std::sync::Mutex;
use tauri::{Emitter, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
async fn open_document(
    app: tauri::AppHandle,
    store: State<'_, Mutex<FileStore>>,
) -> Result<Option<Document>, String> {
    let Some(file) = app
        .dialog()
        .file()
        .add_filter("Markdown & text", &["md", "markdown", "mdown", "txt"])
        .blocking_pick_file()
    else {
        return Ok(None);
    };
    let path = file.into_path().map_err(|e| e.to_string())?;
    store
        .lock()
        .map_err(|e| e.to_string())?
        .open(path)
        .map(Some)
}

#[tauri::command]
async fn save_document(
    id: u64,
    text: String,
    store: State<'_, Mutex<FileStore>>,
) -> Result<(), String> {
    store.lock().map_err(|e| e.to_string())?.save(id, &text)
}

#[tauri::command]
async fn save_document_as(
    app: tauri::AppHandle,
    name: String,
    text: String,
    store: State<'_, Mutex<FileStore>>,
) -> Result<Option<Document>, String> {
    let name = std::path::Path::new(&name)
        .file_name()
        .unwrap_or_default()
        .to_string_lossy();
    let Some(file) = app
        .dialog()
        .file()
        .set_file_name(name.as_ref())
        .add_filter("Markdown", &["md"])
        .blocking_save_file()
    else {
        return Ok(None);
    };
    store
        .lock()
        .map_err(|e| e.to_string())?
        .save_as(file.into_path().map_err(|e| e.to_string())?, &text)
        .map(Some)
}

#[tauri::command]
async fn read_image(
    id: u64,
    path: String,
    store: State<'_, Mutex<FileStore>>,
) -> Result<String, String> {
    store.lock().map_err(|e| e.to_string())?.image(id, &path)
}

#[tauri::command]
async fn export_html(app: tauri::AppHandle, name: String, html: String) -> Result<bool, String> {
    if html.len() > 20 * 1024 * 1024 {
        return Err("The export is too large.".into());
    }
    let name = std::path::Path::new(&name)
        .file_name()
        .unwrap_or_default()
        .to_string_lossy();
    let Some(file) = app
        .dialog()
        .file()
        .set_file_name(name.as_ref())
        .add_filter("HTML", &["html"])
        .blocking_save_file()
    else {
        return Ok(false);
    };
    let path = file.into_path().map_err(|e| e.to_string())?;
    // HTML export must never overwrite the open Markdown document.
    if path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.eq_ignore_ascii_case("html") || e.eq_ignore_ascii_case("htm"))
        != Some(true)
    {
        return Err("Please use a .html filename for your export.".into());
    }
    files::atomic_write(&path, html.as_bytes())?;
    Ok(true)
}

#[tauri::command]
fn open_external(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let parsed = url::Url::parse(&url).map_err(|e| e.to_string())?;
    if !matches!(parsed.scheme(), "https" | "http" | "mailto") {
        return Err("Only web and email links can be opened.".into());
    }
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn quit(app: tauri::AppHandle) {
    app.exit(0);
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(FileStore::default()))
        .invoke_handler(tauri::generate_handler![
            open_document,
            save_document,
            save_document_as,
            read_image,
            export_html,
            open_external,
            quit
        ])
        .build(tauri::generate_context!())
        .expect("Could not start Plainmark")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested {
                code: None, api, ..
            } = event
            {
                api.prevent_exit();
                let _ = app.emit("request-quit", ());
            }
        });
}
