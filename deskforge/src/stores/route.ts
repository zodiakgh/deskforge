import { writable } from 'svelte/store';

export type Route = 'wallpaper' | 'widgets' | 'audio' | 'profiles' | 'plugins' | 'settings';
export const route = writable<Route>('wallpaper');
