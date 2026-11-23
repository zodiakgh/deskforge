import { derived, writable } from 'svelte/store';
import { activeProfileOf, loadConfig, saveConfig } from '../lib/config';
import { broadcastConfig } from '../lib/bus';
import type { AppConfig, Profile } from '../lib/types';

/** Source of truth for the control panel. Persists and pushes every change to the wallpaper window. */
export const config = writable<AppConfig>(loadConfig());

config.subscribe((c) => {
  saveConfig(c);
  broadcastConfig(c);
});

export const profile = derived(config, activeProfileOf);

export function mutate(fn: (c: AppConfig) => void) {
  config.update((c) => {
    fn(c);
    return { ...c };
  });
}

export function mutateProfile(fn: (p: Profile) => void) {
  mutate((c) => fn(activeProfileOf(c)));
}
