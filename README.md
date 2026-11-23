<h1 align="center">Deskforge</h1>

<p align="center">
  Turn your Windows desktop into something that is yours.<br />
  Animated wallpapers, your own music, live widgets and a plugin system. Free and open source.
</p>

<p align="center">
  <a href="LICENSE">MIT license</a> ·
  <a href="docs/getting-started.md">Getting started</a> ·
  <a href="docs/plugins.md">Write a plugin</a> ·
  <a href="docs/architecture.md">Architecture</a>
</p>

> **Status: early alpha (v0.1).** The core works end to end, but it has not been tested on many machines yet. Bug reports are very welcome.

<!-- Add a demo GIF here: docs/media/demo.gif -->

## Features

- **Animated wallpapers** behind your desktop icons: video, GIF, image, local web page, GLSL shaders, or plugins.
- **Your own music**: import mp3, wav, ogg or flac files and play them in the background, with tray controls.
- **Audio visualizer** on the desktop (bars, wave, circle, particles) and in shaders.
- **Widgets**: clock, date, system stats, now playing, weather, countdown, notes. Drag and resize them in a live preview.
- **Profiles**: one per mood (chill, gaming, focus). Export and share them as `.deskforge` files.
- **Plugins**: build widgets, wallpapers and themes with plain HTML, CSS and JavaScript, in a sandbox with explicit permissions.
- **Light on resources**: pauses when an app is full screen, battery saver mode, a ~10 MB installer (Tauri, not Electron).
- **Starts with Windows**, lives in the system tray.

## Install

Download the latest `.exe` installer from the [Releases](../../releases) page and run it.

Requires Windows 10 or 11 (WebView2, already included in Windows 11).

## Build from source

You need [Node.js](https://nodejs.org) 20+, [Rust](https://rustup.rs) (stable) and the [Tauri prerequisites for Windows](https://tauri.app/start/prerequisites/).

```bash
git clone https://github.com/your-name/deskforge.git
cd deskforge
npm install
npm run tauri icon app-icon.png   # only if src-tauri/icons is empty
npm run tauri dev                 # run in development
npm run tauri build               # produce the installer in src-tauri/target/release/bundle
```

## Make a plugin in 2 minutes

Create a folder in `%APPDATA%\dev.deskforge.app\plugins\my-widget` with two files:

```json
{ "id": "my-widget", "name": "My Widget", "version": "1.0.0", "type": "widget", "entry": "index.html", "permissions": ["audio"] }
```

```html
<div id="level" style="height:100%;background:orange"></div>
<script>
  deskforge.audio.onBeat(() => (level.style.opacity = 1));
</script>
```

Press **Refresh** on the Plugins page. See the [plugin guide](docs/plugins.md).

## Project layout

```
src-tauri/   Rust: desktop embedding, tray, system stats, plugin loader
src/         Svelte UI (control panel) and the wallpaper window
plugins/     Official example plugins
packages/    @deskforge/sdk (TypeScript typings for plugins)
themes/      Example profile
docs/        Guides
```

## Roadmap

- [x] Wallpaper window behind the icons, shaders, video, image, web page
- [x] Music library, background playback, visualizer
- [x] Widgets with live preview, profiles, theme export/import
- [x] Plugin system with sandbox and permissions
- [ ] Multi-monitor support (one wallpaper per screen)
- [ ] Global hotkeys, automatic profile switching by time or app
- [ ] GPU usage widget, app launcher widget
- [ ] In-app plugin gallery
- [ ] Auto-update

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## License

[MIT](LICENSE)
