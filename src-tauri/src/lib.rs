mod files;

use files::{Document, FileStore, FolderEntry, Workspace};
use serde::Serialize;
use std::{path::PathBuf, sync::Mutex};
use tauri::{Emitter, Manager, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

#[derive(Default)]
struct PendingFiles(Mutex<Vec<PathBuf>>);
#[derive(Default)]
struct HtmlPreview(Mutex<(u64, String)>);
#[derive(Serialize)]
struct OpenedDocuments {
    documents: Vec<Document>,
    errors: Vec<String>,
}
#[derive(Serialize)]
struct PickedImage {
    name: String,
    encoded: String,
}

#[tauri::command]
async fn print_document(window: tauri::WebviewWindow) -> Result<(), String> {
    window.print().map_err(|e| e.to_string())
}
#[tauri::command]
async fn pick_image(app: tauri::AppHandle) -> Result<Option<PickedImage>, String> {
    use base64::Engine;
    let Some(file) = app
        .dialog()
        .file()
        .add_filter("Images", &["png", "jpg", "jpeg", "gif", "webp"])
        .blocking_pick_file()
    else {
        return Ok(None);
    };
    let path = file.into_path().map_err(|e| e.to_string())?;
    let bytes = files::read_limited(&path, 10 * 1024 * 1024)?;
    Ok(Some(PickedImage {
        name: path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned(),
        encoded: base64::engine::general_purpose::STANDARD.encode(bytes),
    }))
}

fn queue_paths(app: &tauri::AppHandle, paths: impl Iterator<Item = PathBuf>) {
    let pending = app.state::<PendingFiles>();
    if let Ok(mut queue) = pending.0.lock() {
        for path in paths.take(100) {
            if files::is_document(&path) && !queue.contains(&path) && queue.len() < 100 {
                queue.push(path);
            }
        }
    }
    let _ = app.emit("open-files-pending", ());
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[tauri::command]
async fn take_open_documents(
    pending: State<'_, PendingFiles>,
    store: State<'_, Mutex<FileStore>>,
) -> Result<OpenedDocuments, String> {
    let paths = std::mem::take(&mut *pending.0.lock().map_err(|e| e.to_string())?);
    let mut store = store.lock().map_err(|e| e.to_string())?;
    let mut result = OpenedDocuments {
        documents: vec![],
        errors: vec![],
    };
    for path in paths {
        match store.open(path) {
            Ok(doc) => result.documents.push(doc),
            Err(error) => result.errors.push(error),
        }
    }
    Ok(result)
}

#[tauri::command]
async fn import_image(
    id: u64,
    encoded: String,
    store: State<'_, Mutex<FileStore>>,
) -> Result<String, String> {
    store
        .lock()
        .map_err(|e| e.to_string())?
        .import_image(id, &encoded)
}
#[tauri::command]
async fn open_linked_document(
    id: u64,
    path: String,
    store: State<'_, Mutex<FileStore>>,
) -> Result<Document, String> {
    store
        .lock()
        .map_err(|e| e.to_string())?
        .open_link(id, &path)
}
#[tauri::command]
async fn open_document(
    app: tauri::AppHandle,
    store: State<'_, Mutex<FileStore>>,
) -> Result<Option<Document>, String> {
    let Some(file) = app
        .dialog()
        .file()
        .add_filter(
            "Markdown, text & HTML",
            &["md", "markdown", "mdown", "txt", "html", "htm"],
        )
        .blocking_pick_file()
    else {
        return Ok(None);
    };
    store
        .lock()
        .map_err(|e| e.to_string())?
        .open(file.into_path().map_err(|e| e.to_string())?)
        .map(Some)
}
#[tauri::command]
async fn open_workspace(
    app: tauri::AppHandle,
    store: State<'_, Mutex<FileStore>>,
) -> Result<Option<Workspace>, String> {
    let Some(folder) = app.dialog().file().blocking_pick_folder() else {
        return Ok(None);
    };
    store
        .lock()
        .map_err(|e| e.to_string())?
        .add_workspace(folder.into_path().map_err(|e| e.to_string())?)
        .map(Some)
}
#[tauri::command]
async fn list_folder(
    id: u64,
    path: String,
    store: State<'_, Mutex<FileStore>>,
) -> Result<Vec<FolderEntry>, String> {
    store
        .lock()
        .map_err(|e| e.to_string())?
        .list_folder(id, &path)
}
#[tauri::command]
async fn open_workspace_file(
    id: u64,
    path: String,
    store: State<'_, Mutex<FileStore>>,
) -> Result<Document, String> {
    store
        .lock()
        .map_err(|e| e.to_string())?
        .open_workspace_file(id, &path)
}
#[tauri::command]
fn close_workspace(id: u64, store: State<'_, Mutex<FileStore>>) -> Result<(), String> {
    store.lock().map_err(|e| e.to_string())?.close_workspace(id);
    Ok(())
}
#[tauri::command]
fn close_document(id: u64, store: State<'_, Mutex<FileStore>>) -> Result<(), String> {
    store.lock().map_err(|e| e.to_string())?.close(id);
    Ok(())
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
    id: Option<u64>,
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
        .add_filter("Markdown, text & HTML", &["md", "txt", "html", "htm"])
        .blocking_save_file()
    else {
        return Ok(None);
    };
    store
        .lock()
        .map_err(|e| e.to_string())?
        .save_as(file.into_path().map_err(|e| e.to_string())?, &text, id)
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
fn create_html_preview(html: String, preview: State<'_, HtmlPreview>) -> Result<String, String> {
    if html.len() > 512 * 1024 {
        return Err("Executable HTML is limited to 512 KB.".into());
    }
    let mut state = preview.0.lock().map_err(|e| e.to_string())?;
    state.0 += 1;
    state.1 = html;
    #[cfg(windows)]
    let base = "http://plainmark-html.localhost";
    #[cfg(not(windows))]
    let base = "plainmark-html://localhost";
    Ok(format!("{base}/{}", state.0))
}
#[tauri::command]
fn stop_html_preview(preview: State<'_, HtmlPreview>) {
    if let Ok(mut state) = preview.0.lock() {
        state.0 += 1;
        state.1.clear();
    }
}
#[tauri::command]
fn quit(app: tauri::AppHandle) {
    app.exit(0);
}

fn app_menu(app: &tauri::App) -> tauri::Result<()> {
    use tauri::menu::{Menu, MenuItem, SubmenuBuilder};
    let item = |id: &str, label: &str, shortcut: &str| {
        MenuItem::with_id(app, id, label, true, Some(shortcut))
    };
    let menu = Menu::new(app)?;
    #[cfg(target_os = "macos")]
    menu.append(
        &SubmenuBuilder::new(app, "Plainmark")
            .text("help", "About Plainmark")
            .separator()
            .services()
            .separator()
            .hide()
            .hide_others()
            .separator()
            .quit()
            .build()?,
    )?;
    let mut file = SubmenuBuilder::new(app, "File")
        .item(&item("new", "New", "CmdOrCtrl+N")?)
        .item(&item("open", "Open…", "CmdOrCtrl+O")?)
        .item(&item("folder", "Open Folder…", "CmdOrCtrl+Shift+O")?)
        .separator()
        .item(&item("save", "Save", "CmdOrCtrl+S")?)
        .item(&item("save-as", "Save As…", "CmdOrCtrl+Shift+S")?)
        .item(&item("save-all", "Save All", "CmdOrCtrl+Alt+S")?)
        .text("export", "Export HTML…")
        .item(&item("print", "Print / Save as PDF…", "CmdOrCtrl+Shift+P")?)
        .item(&item("quick-open", "Quick Open…", "CmdOrCtrl+P")?)
        .separator()
        .item(&item("close-tab", "Close Tab", "CmdOrCtrl+W")?);
    if !cfg!(target_os = "macos") {
        file = file.separator().quit();
    }
    menu.append(&file.build()?)?;
    menu.append(
        &SubmenuBuilder::new(app, "Edit")
            .item(&item("undo", "Undo", "CmdOrCtrl+Z")?)
            .item(&item("redo", "Redo", "CmdOrCtrl+Shift+Z")?)
            .separator()
            .cut()
            .copy()
            .paste()
            .select_all()
            .separator()
            .item(&item("find", "Find and Replace…", "CmdOrCtrl+F")?)
            .build()?,
    )?;
    menu.append(
        &SubmenuBuilder::new(app, "View")
            .item(&item("view:visual", "Visual", "CmdOrCtrl+1")?)
            .item(&item("view:write", "Source", "CmdOrCtrl+2")?)
            .item(&item("view:split", "Split", "CmdOrCtrl+3")?)
            .item(&item("view:read", "Read", "CmdOrCtrl+4")?)
            .separator()
            .text("theme", "Toggle Dark Mode")
            .text("focus", "Focus Mode")
            .build()?,
    )?;
    menu.append(
        &SubmenuBuilder::new(app, "Help")
            .text("help", "Plainmark Help")
            .text("source", "Source Code")
            .build()?,
    )?;
    app.set_menu(menu)?;
    app.on_menu_event(|app, event| {
        let _ = app.emit("menu-action", event.id().as_ref());
    });
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            queue_paths(app, args.into_iter().skip(1).filter(|arg| !arg.starts_with('-')).map(|arg| PathBuf::from(&cwd).join(arg)));
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(FileStore::default()))
        .manage(PendingFiles::default())
        .manage(HtmlPreview::default())
        .register_uri_scheme_protocol("plainmark-html", |context, request| {
            let state = context.app_handle().state::<HtmlPreview>();
            let state = state.0.lock().unwrap();
            let valid = request.uri().path() == format!("/{}", state.0) && !state.1.is_empty();
            tauri::http::Response::builder().status(if valid { 200 } else { 404 })
                .header("Content-Type", "text/html; charset=utf-8")
                .header("Cache-Control", "no-store")
                .header("X-Content-Type-Options", "nosniff")
                .header("Referrer-Policy", "no-referrer")
                .header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), clipboard-read=(), clipboard-write=(), display-capture=(), payment=(), usb=()")
                .header("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; sandbox allow-scripts")
                .body(if valid { state.1.clone().into_bytes() } else { b"Preview stopped".to_vec() }).unwrap()
        })
        .setup(|app| {
            app_menu(app)?;
            let window = tauri::WebviewWindowBuilder::from_config(app, &app.config().app.windows[0])?
                .on_navigation(|url| matches!(url.scheme(), "tauri" | "plainmark-html") || (matches!(url.scheme(), "http" | "https") && matches!(url.host_str(), Some("tauri.localhost" | "plainmark-html.localhost"))) || (cfg!(debug_assertions) && url.scheme() == "http" && url.host_str() == Some("127.0.0.1") && url.port() == Some(1420)))
                .build()?;
            let _ = window.set_title("Plainmark");
            let cwd = std::env::current_dir().unwrap_or_default();
            queue_paths(app.handle(), std::env::args_os().skip(1).filter(|arg| !arg.to_string_lossy().starts_with('-')).map(|arg| cwd.join(arg)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![print_document, pick_image, import_image, open_linked_document, open_document, open_workspace, list_folder, open_workspace_file, close_workspace, close_document, take_open_documents, save_document, save_document_as, read_image, export_html, open_external, create_html_preview, stop_html_preview, quit])
        .build(tauri::generate_context!()).expect("Could not start Plainmark")
        .run(|app, event| {
            match event {
                tauri::RunEvent::ExitRequested { code: None, api, .. } => { api.prevent_exit(); let _ = app.emit("request-quit", ()); },
                #[cfg(target_os = "macos")]
                tauri::RunEvent::Opened { urls } => { queue_paths(app, urls.into_iter().filter_map(|url| url.to_file_path().ok())); },
                _ => {}
            }
        });
}
