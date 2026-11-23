import { invoke } from '@tauri-apps/api/core';
import { writable } from 'svelte/store';
import type { PluginInfo } from '../lib/types';

export const plugins = writable<PluginInfo[]>([]);

export async function refreshPlugins() {
  try {
    plugins.set(await invoke<PluginInfo[]>('list_plugins'));
  } catch (e) {
    console.warn('Could not list plugins', e);
  }
}
