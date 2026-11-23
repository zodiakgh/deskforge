import { writable } from 'svelte/store';
import type { AudioState } from '../lib/types';

export const audioState = writable<AudioState>({ playing: false, trackId: null, position: 0, duration: 0 });
