# Contributing to Deskforge

Thanks for helping out! A few ground rules keep things smooth.

## Setup

```bash
npm install
npm run tauri dev
```

Rust code lives in `src-tauri/`, the UI in `src/`. Run `npm run check` before opening a pull request.

## Guidelines

- **Small, focused pull requests.** One feature or fix at a time.
- **Match the style.** TypeScript strict mode, Svelte components kept small, Rust formatted with `cargo fmt`.
- **Animate with care.** Only animate `transform` and `opacity`, and use the helpers in `src/lib/motion.ts` so `prefers-reduced-motion` is respected.
- **Plugins stay sandboxed.** Never give plugin iframes access to Tauri commands, and gate new SDK events behind a permission in `src/engine/pluginHost.ts`.
- **English only** for code, comments, docs and UI text.

## Ideas that need help

See the roadmap in the README. Multi-monitor support and the plugin gallery are the biggest open items.

## Reporting bugs

Include your Windows version, GPU, whether you have multiple monitors, and what the wallpaper window did (nothing, black, in front of icons...).
