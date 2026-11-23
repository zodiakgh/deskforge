use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
};
use sysinfo::System;
use tauri::{ipc::Response, AppHandle, Manager, State};

pub struct SysState(pub Mutex<System>);

// ---------------------------------------------------------------- wallpaper

#[tauri::command]
pub async fn wallpaper_attach(app: AppHandle) -> Result<(), String> {
    #[cfg(windows)]
    {
        use tauri::{WebviewUrl, WebviewWindowBuilder};
        let win = match app.get_webview_window("wallpaper") {
            Some(w) => w,
            None => WebviewWindowBuilder::new(
                &app,
                "wallpaper",
                WebviewUrl::App("wallpaper.html".into()),
            )
            .title("Deskforge Wallpaper")
            .decorations(false)
            .resizable(false)
            .skip_taskbar(true)
            .shadow(false)
            .focused(false)
            .visible(false)
            .build()
            .map_err(|e| e.to_string())?,
        };
        let hwnd = win.hwnd().map_err(|e| e.to_string())?.0 as isize;
        crate::wallpaper::attach(hwnd)?;
        win.show().map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = app;
        Err("Wallpaper mode is only available on Windows".into())
    }
}

#[tauri::command]
pub fn wallpaper_detach(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("wallpaper") {
        w.destroy().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn is_fullscreen_app_active() -> bool {
    crate::wallpaper::is_fullscreen_app_active()
}

// ------------------------------------------------------------- system stats

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Stats {
    cpu: f32,
    mem_used: u64,
    mem_total: u64,
}

#[tauri::command]
pub fn get_system_stats(state: State<SysState>) -> Stats {
    let mut sys = state.0.lock().unwrap();
    sys.refresh_cpu_usage();
    sys.refresh_memory();
    Stats {
        cpu: sys.global_cpu_usage(),
        mem_used: sys.used_memory(),
        mem_total: sys.total_memory(),
    }
}

// ------------------------------------------------------------------ plugins

#[derive(Serialize)]
pub struct PluginInfo {
    dir: String,
    builtin: bool,
    manifest: serde_json::Value,
}

fn plugin_roots(app: &AppHandle) -> Vec<(PathBuf, bool)> {
    let mut roots = Vec::new();
    #[cfg(debug_assertions)]
    {
        let _ = app;
        roots.push((PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../plugins"), true));
    }
    #[cfg(not(debug_assertions))]
    if let Ok(res) = app.path().resource_dir() {
        roots.push((res.join("plugins"), true));
    }
    if let Ok(data) = app.path().app_data_dir() {
        roots.push((data.join("plugins"), false));
    }
    roots
}

#[tauri::command]
pub fn list_plugins(app: AppHandle) -> Vec<PluginInfo> {
    let mut out = Vec::new();
    for (root, builtin) in plugin_roots(&app) {
        let Ok(entries) = fs::read_dir(&root) else { continue };
        for entry in entries.flatten() {
            let dir = entry.path();
            let Ok(text) = fs::read_to_string(dir.join("manifest.json")) else { continue };
            let Ok(manifest) = serde_json::from_str::<serde_json::Value>(&text) else { continue };
            if let Ok(canon) = fs::canonicalize(&dir) {
                out.push(PluginInfo {
                    dir: canon.to_string_lossy().trim_start_matches(r"\\?\").to_string(),
                    builtin,
                    manifest,
                });
            }
        }
    }
    out
}

/// Reads a text file that lives inside one of the plugin folders.
#[tauri::command]
pub fn read_plugin_file(app: AppHandle, dir: String, file: String) -> Result<String, String> {
    let base = fs::canonicalize(&dir).map_err(|e| e.to_string())?;
    let allowed = plugin_roots(&app).iter().any(|(root, _)| {
        fs::canonicalize(root).map(|r| base.starts_with(r)).unwrap_or(false)
    });
    if !allowed {
        return Err("Not a plugin folder".into());
    }
    let target = fs::canonicalize(base.join(&file)).map_err(|e| e.to_string())?;
    if !target.starts_with(&base) {
        return Err("Path escapes the plugin folder".into());
    }
    fs::read_to_string(target).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_plugins_dir(app: AppHandle) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("plugins");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    #[cfg(windows)]
    {
        std::process::Command::new("explorer")
            .arg(&dir)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(windows))]
    {
        Err(format!("Plugins folder: {}", dir.display()))
    }
}

// -------------------------------------------------------------------- files

const AUDIO_EXT: [&str; 7] = ["mp3", "wav", "ogg", "flac", "m4a", "aac", "opus"];

fn has_ext(path: &Path, allowed: &[&str]) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| allowed.contains(&e.to_lowercase().as_str()))
        .unwrap_or(false)
}

/// Returns raw audio bytes. Played through a Blob URL so the Web Audio
/// analyser can read it (the asset protocol is cross-origin).
#[tauri::command]
pub fn read_audio_file(path: String) -> Result<Response, String> {
    let p = PathBuf::from(&path);
    if !has_ext(&p, &AUDIO_EXT) {
        return Err("Unsupported audio format".into());
    }
    fs::read(&p).map(Response::new).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    let p = PathBuf::from(&path);
    if !has_ext(&p, &["deskforge", "json"]) {
        return Err("Only .deskforge and .json files can be read".into());
    }
    fs::read_to_string(p).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if !has_ext(&p, &["deskforge", "json"]) {
        return Err("Only .deskforge and .json files can be written".into());
    }
    fs::write(p, contents).map_err(|e| e.to_string())
}
