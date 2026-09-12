fn main() {
    // Application commands require explicit grants, like plugin commands.
    const COMMANDS: &[&str] = &[
        "import_image",
        "pick_image",
        "print_document",
        "open_linked_document",
        "open_document",
        "open_workspace",
        "list_folder",
        "open_workspace_file",
        "close_workspace",
        "close_document",
        "take_open_documents",
        "save_document",
        "save_document_as",
        "read_image",
        "export_html",
        "open_external",
        "create_html_preview",
        "stop_html_preview",
        "quit",
    ];
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(COMMANDS)),
    )
    .expect("Could not generate Plainmark's permission manifest");
}
