import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import type { PluginInfo, PluginManifest } from '../lib/types';
import { SDK_SOURCE } from './sdkSource';

/** Which permission a plugin needs to receive an event. */
const EVENT_PERMISSION: Record<string, string | null> = {
  spectrum: 'audio',
  beat: 'audio',
  track: 'audio',
  stats: 'system-stats',
  settings: null
};

interface Bridge {
  iframe: HTMLIFrameElement;
  info: PluginInfo;
  subs: Set<string>;
  getSettings: () => Record<string, unknown>;
}

const bridges = new Set<Bridge>();
let listening = false;

export function settingsWithDefaults(manifest: PluginManifest, stored: Record<string, unknown> = {}) {
  const out: Record<string, unknown> = {};
  for (const s of manifest.settings ?? []) out[s.key] = s.default;
  return { ...out, ...stored };
}

function reply(b: Bridge, id: number, result: unknown) {
  b.iframe.contentWindow?.postMessage({ __df: 1, id, result }, '*');
}

function handle(b: Bridge, m: { id?: number; method: string; params?: any }) {
  switch (m.method) {
    case 'subscribe': {
      const ev = String(m.params?.event ?? '');
      if (!(ev in EVENT_PERMISSION)) return;
      const need = EVENT_PERMISSION[ev];
      if (need === null || b.info.manifest.permissions?.includes(need as never)) b.subs.add(ev);
      else console.warn(`[deskforge] plugin "${b.info.manifest.id}" needs the "${need}" permission for "${ev}"`);
      return;
    }
    case 'settings.get': {
      const all = settingsWithDefaults(b.info.manifest, b.getSettings());
      if (m.id) reply(b, m.id, all[String(m.params?.key)]);
      return;
    }
    case 'settings.all':
    case 'ready': {
      if (m.id) reply(b, m.id, settingsWithDefaults(b.info.manifest, b.getSettings()));
      return;
    }
  }
}

function ensureListener() {
  if (listening) return;
  listening = true;
  window.addEventListener('message', (e) => {
    const m = e.data;
    if (!m || m.__df !== 1) return;
    for (const b of bridges) {
      if (b.iframe.contentWindow === e.source) {
        handle(b, m);
        return;
      }
    }
  });
}

/** Sends an event to every plugin that subscribed to it (and has the permission). */
export function broadcast(event: string, data: unknown) {
  for (const b of bridges) {
    if (b.subs.has(event)) b.iframe.contentWindow?.postMessage({ __df: 1, event, data }, '*');
  }
}

/** Tells one plugin that its settings changed. */
export function notifySettings(pluginId: string) {
  for (const b of bridges) {
    if (b.info.manifest.id === pluginId && b.subs.has('settings')) {
      b.iframe.contentWindow?.postMessage(
        { __df: 1, event: 'settings', data: settingsWithDefaults(b.info.manifest, b.getSettings()) },
        '*'
      );
    }
  }
}

/**
 * Loads a plugin into a sandboxed iframe (allow-scripts only, so it has no
 * access to the host page, Tauri commands or the file system).
 */
export async function mountPlugin(
  iframe: HTMLIFrameElement,
  info: PluginInfo,
  getSettings: () => Record<string, unknown>
): Promise<() => void> {
  ensureListener();
  const entry = info.manifest.entry ?? 'index.html';
  const html = await invoke<string>('read_plugin_file', { dir: info.dir, file: entry });
  const base = convertFileSrc(info.dir) + '/';
  const doc =
    '<!doctype html><html><head><meta charset="utf-8">' +
    `<base href="${base}">` +
    '<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}</style>' +
    `<script>${SDK_SOURCE}<\/script></head><body>${html}</body></html>`;

  const bridge: Bridge = { iframe, info, subs: new Set(), getSettings };
  bridges.add(bridge);
  iframe.srcdoc = doc;
  return () => bridges.delete(bridge);
}
