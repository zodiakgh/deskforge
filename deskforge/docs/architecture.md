# Architecture

Deskforge is a [Tauri 2](https://tauri.app) app with two webview windows that share one codebase.

```
┌────────────────────────┐   events    ┌──────────────────────────────┐
│ main window (index)    │ ──────────▶ │ wallpaper window (wallpaper) │
│ control panel (Svelte) │ ◀────────── │ behind the desktop icons     │
└──────────┬─────────────┘             └──────────────┬───────────────┘
           │ invoke                                   │ invoke
           ▼                                          ▼
      ┌─────────────────────── Rust (src-tauri) ───────────────────────┐
      │ wallpaper.rs   attach to WorkerW, fullscreen detection          │
      │ commands.rs    plugins, system stats, audio/text file access    │
      │ lib.rs         tray, autostart, close-to-tray                   │
      └─────────────────────────────────────────────────────────────────┘
```

## Wallpaper embedding

`wallpaper.rs` asks the Windows shell (`Progman`) to create a `WorkerW` window behind the icons, then re-parents the wallpaper window into it. Raw `user32` bindings are used so the code does not depend on a `windows` crate version. Recent Windows 11 builds changed the window hierarchy, so a fallback looks for a `WorkerW` child of `Progman`.

## State and sync

- The control panel owns the config (`src/stores/config.ts`). Every change is saved to `localStorage` and broadcast with the `deskforge:config` event.
- The wallpaper window reads the same config on start and listens for updates.
- The audio engine runs in the wallpaper window, because it is always alive. The panel sends commands (`deskforge:audio-cmd`) and receives state (`deskforge:audio-state`).

## Rendering

- `ShaderRenderer` draws a full-screen WebGL fragment shader with `uTime`, `uAudio` and `uAccent` uniforms.
- `Visualizer` draws spectrum visuals on a 2D canvas above the wallpaper.
- Widgets are Svelte components sized with container query units, so they scale with their box. The editor preview and the desktop use the same components.

## Plugins

`engine/pluginHost.ts` loads a plugin's HTML through the `read_plugin_file` command (restricted to plugin folders), injects the SDK script and sets it as the `srcdoc` of a sandboxed iframe. Communication is `postMessage`. Events are only delivered if the manifest declares the matching permission.

## Known limitations

- One wallpaper window on the primary monitor.
- Audio is read into memory as a Blob so the analyser can read it, which is fine for songs but not for hour-long files.
- The asset protocol scope is open (`**`) so wallpapers can come from any folder.
