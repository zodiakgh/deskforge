import { invoke } from '@tauri-apps/api/core';

/** Puts the wallpaper window behind the desktop icons. Returns an error message, or null. */
export async function attachWallpaper(): Promise<string | null> {
  try {
    await invoke('wallpaper_attach');
    return null;
  } catch (e) {
    return String(e);
  }
}

export async function detachWallpaper() {
  try {
    await invoke('wallpaper_detach');
  } catch (e) {
    console.warn(e);
  }
}

export const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

export const fileName = (p: string) => p.split(/[\\/]/).pop() ?? p;
export const titleFromPath = (p: string) => fileName(p).replace(/\.[^.]+$/, '');
