use std::fs;
use std::path::Path;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn ensure_directory(path: String) -> Result<(), String> {
    match fs::create_dir_all(&path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to create directory {}: {}", path, e)),
    }
}

#[tauri::command]
async fn save_file(file_name: String, data: String, path: String) -> Result<(), String> {
    if let Err(e) = fs::create_dir_all(&path) {
        return Err(format!("Failed to create directory {}: {}", path, e));
    }

    let full_path = Path::new(&path).join(&file_name);

    // Decode base64 data
    let decoded_data = match base64::decode(&data) {
        Ok(data) => data,
        Err(e) => return Err(format!("Failed to decode base64 data: {}", e)),
    };

    match fs::write(&full_path, decoded_data) {
        Ok(_) => {
            println!("File saved successfully: {:?}", full_path);
            Ok(())
        },
        Err(e) => Err(format!("Failed to save file {}: {}", full_path.display(), e)),
    }
}

#[tauri::command]
async fn get_app_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    match app.path().app_data_dir() {
        Ok(path) => Ok(path.to_string_lossy().to_string()),
        Err(e) => Err(format!("Failed to get app data directory: {}", e)),
    }
}

#[tauri::command]
async fn get_document_dir(app: tauri::AppHandle) -> Result<String, String> {
    match app.path().document_dir() {
        Ok(path) => Ok(path.to_string_lossy().to_string()),
        Err(e) => Err(format!("Failed to get document directory: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            ensure_directory,
            save_file,
            get_app_data_dir,
            get_document_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}