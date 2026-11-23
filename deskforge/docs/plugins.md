# Writing plugins

A plugin is a folder with a `manifest.json` and an HTML entry file. Put it in:

```
%APPDATA%\dev.deskforge.app\plugins\<your-plugin>
```

(The Plugins page has an **Open plugins folder** button.) Press **Refresh** to load it. Official examples live in the repo's [`plugins/`](../plugins) folder.

## Manifest

```json
{
  "id": "neon-clock",
  "name": "Neon Clock",
  "version": "1.0.0",
  "author": "You",
  "description": "What it does.",
  "type": "widget",
  "entry": "index.html",
  "permissions": ["audio", "system-stats"],
  "size": { "w": 20, "h": 36 },
  "settings": [
    { "key": "color", "label": "Color", "type": "color", "default": "#ffb36b" }
  ]
}
```

| Field | Notes |
| --- | --- |
| `id` | Unique, lowercase, dashes. |
| `type` | `widget`, `wallpaper` or `theme`. |
| `entry` | HTML file (default `index.html`). Not needed for themes. |
| `permissions` | `audio` (spectrum, beats, track info) and/or `system-stats` (CPU, memory). |
| `size` | Default widget size, in percent of the screen. |
| `settings` | Auto-generated form. Types: `color`, `text`, `toggle`, `number` (`min`, `max`, `step`), `select` (`options`). |
| `theme` | Themes only: CSS variables applied to the Deskforge window, for example `--ink`, `--accent`. |

## The `deskforge` API

Inside a plugin, `window.deskforge` is already defined.

```js
deskforge.settings.all().then(s => { /* defaults merged with the user's values */ });
deskforge.settings.get('color').then(c => {});
deskforge.settings.onChange(s => {});

deskforge.audio.onSpectrum(bins => {});   // 64 values, 0..1, about 30 times per second
deskforge.audio.onBeat(level => {});      // on each detected beat
deskforge.audio.onTrack(track => {});     // { title, playing, position, duration }

deskforge.system.onStats(stats => {});    // { cpu, memUsed, memTotal } about once per second
```

Each `on...` function returns an unsubscribe function. Subscribing without the matching permission is ignored and logs a warning.

TypeScript typings: [`packages/sdk`](../packages/sdk).

## Sandbox rules

Plugins run in a sandboxed `<iframe>` with `allow-scripts` only. That means:

- No access to the Deskforge window, Tauri commands or the file system.
- Use classic `<script>` tags. Module scripts and `fetch` to local files are blocked by CORS.
- Relative files (CSS, images, scripts) in your plugin folder load normally.
- Network requests follow the usual browser rules for a sandboxed page.
- Your HTML can be a fragment or a full document. The page background is transparent.

## Tips

- Size things with `%` or `vw`/`vh` so your plugin works at any widget size.
- Use `requestAnimationFrame`, and keep per-frame work small: wallpapers run all day.
- Widgets on the desktop cannot receive clicks, so design them as displays.
